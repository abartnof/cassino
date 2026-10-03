//! Measuring agents: mirrored pairs, run sequentially (`docs/DESIGN.md`
//! §11.4).
//!
//! **Mirrored pairs.** Each seed's cards are played twice, with the agents
//! swapping seats, so the luck of the deal cancels and what remains is play.
//!
//! **Sequential, with the stopping rule fixed before the data.** A standing
//! rule of this repository, from the user: "if you have a clear signal coming
//! through, your sample size can be rather small". A run fixes its batch size
//! and its number of looks before the first batch. After each batch it
//! compares the running z-score with the O'Brien–Fleming boundary for that
//! look, which keeps the chance of a false alarm at 5% over all the looks
//! together. Crossing it stops the run: the difference is real. Reaching the
//! last look without crossing ends the run with an estimate and its 95%
//! interval, which bounds how large any difference can be.

use crate::agents::Agent;
use crate::game::Game;
use crate::hand::Hand;
use crate::rng::{purpose, Rng};
use crate::rules::Rules;
use crate::scoring::Breakdown;
use crate::table::Seat;

/// Makes an agent for one game: its seed and seat, so its own choices are
/// reproducible and independent of the cards.
pub type Factory<'a> = &'a dyn Fn(u64, Seat) -> Box<dyn Agent>;

/// Plays out `hand` with the two agents.
pub fn play_out(
    mut hand: Hand,
    scores: [u32; 2],
    south: &mut dyn Agent,
    north: &mut dyn Agent,
) -> Breakdown {
    while let Some(seat) = hand.to_move() {
        let view = hand.view(seat, scores);
        let agent: &mut dyn Agent = match seat {
            Seat::South => &mut *south,
            Seat::North => &mut *north,
        };
        let mv = agent.choose(&view);
        if let Err(why) = hand.play(&mv) {
            panic!("{} chose an illegal move, {mv}: {why}", agent.name());
        }
    }
    hand.breakdown().expect("played out")
}

/// One mirrored pair of hands from `seed`'s first deal: A's points less B's,
/// summed over the two seatings.
pub fn mirrored_hand(rules: Rules, seed: u64, a: Factory, b: Factory) -> i32 {
    let mut deck = crate::cards::pack();
    Rng::stream(seed, purpose::DEALS).shuffle(&mut deck);
    let (hand, _) = Hand::deal(rules, Seat::South, deck);
    let margin =
        |bd: Breakdown, seat: Seat| i32::from(bd.points(seat)) - i32::from(bd.points(seat.other()));
    let first = play_out(
        hand,
        [0, 0],
        &mut *a(seed, Seat::South),
        &mut *b(seed, Seat::North),
    );
    let second = play_out(
        hand,
        [0, 0],
        &mut *b(seed, Seat::South),
        &mut *a(seed, Seat::North),
    );
    margin(first, Seat::South) + margin(second, Seat::North)
}

/// Plays a whole game; returns the winner and the totals.
pub fn play_game(
    rules: Rules,
    seed: u64,
    south: &mut dyn Agent,
    north: &mut dyn Agent,
) -> (Seat, [u32; 2]) {
    let (mut game, _) = Game::new(rules, seed);
    loop {
        while let Some(seat) = game.hand().to_move() {
            let view = game.hand().view(seat, game.scores());
            let agent: &mut dyn Agent = match seat {
                Seat::South => &mut *south,
                Seat::North => &mut *north,
            };
            let mv = agent.choose(&view);
            if let Err(why) = game.play(&mv) {
                panic!("{} chose an illegal move, {mv}: {why}", agent.name());
            }
        }
        if game.next_hand().is_none() {
            break;
        }
    }
    (
        game.winner().expect("a finished game has a winner"),
        game.scores(),
    )
}

/// One mirrored pair of games from `seed`: +1 for each game A wins, −1 for
/// each B wins, so −2 to 2.
pub fn mirrored_game(rules: Rules, seed: u64, a: Factory, b: Factory) -> i32 {
    let sign = |won: bool| if won { 1 } else { -1 };
    let (first, _) = play_game(
        rules,
        seed,
        &mut *a(seed, Seat::South),
        &mut *b(seed, Seat::North),
    );
    let (second, _) = play_game(
        rules,
        seed,
        &mut *b(seed, Seat::South),
        &mut *a(seed, Seat::North),
    );
    sign(first == Seat::South) + sign(second == Seat::North)
}

/// The O'Brien–Fleming constant for `looks` equally spaced looks at a
/// two-sided 5%: the boundary at look k is this times √(looks / k).
/// From the standard group-sequential tables; the self-test below checks it
/// by simulation.
pub fn obf_constant(looks: usize) -> f64 {
    const C: [f64; 10] = [
        1.960, 1.977, 2.004, 2.024, 2.040, 2.053, 2.063, 2.072, 2.080, 2.087,
    ];
    assert!((1..=10).contains(&looks), "1 to 10 looks");
    C[looks - 1]
}

/// A sequential run's design, fixed before its first batch.
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct Plan {
    /// Observations per batch.
    pub batch: usize,
    /// The most looks the run may take.
    pub looks: usize,
}

impl Plan {
    /// The |z| that stops the run at each look.
    pub fn boundaries(&self) -> Vec<f64> {
        let c = obf_constant(self.looks);
        (1..=self.looks)
            .map(|k| c * (self.looks as f64 / k as f64).sqrt())
            .collect()
    }
}

/// The state of a run at one look.
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct Look {
    pub look: usize,
    pub n: usize,
    pub mean: f64,
    /// The standard error of the mean.
    pub se: f64,
    pub z: f64,
    pub boundary: f64,
}

#[derive(Copy, Clone, Debug, PartialEq)]
pub enum Verdict {
    /// The boundary was crossed: the difference is real.
    Clear {
        look: usize,
        n: usize,
        mean: f64,
        se: f64,
    },
    /// No boundary crossed by the last look: the 95% interval.
    NoClearDifference {
        n: usize,
        mean: f64,
        low: f64,
        high: f64,
    },
}

#[derive(Clone, Debug, PartialEq)]
pub struct Report {
    pub plan: Plan,
    pub looks: Vec<Look>,
    pub verdict: Verdict,
}

/// Runs a sequential measurement. `sample(i)` gives observation `i`
/// (0, 1, 2, …); `on_look` hears each look as it is taken.
pub fn run_sequential(
    plan: Plan,
    mut sample: impl FnMut(usize) -> f64,
    mut on_look: impl FnMut(&Look),
) -> Report {
    let boundaries = plan.boundaries();
    let mut values: Vec<f64> = Vec::with_capacity(plan.batch * plan.looks);
    let mut looks = Vec::new();
    for (k, &boundary) in boundaries.iter().enumerate() {
        for _ in 0..plan.batch {
            values.push(sample(values.len()));
        }
        let n = values.len();
        let mean = values.iter().sum::<f64>() / n as f64;
        let var = if n > 1 {
            values.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / (n - 1) as f64
        } else {
            0.0
        };
        let se = (var / n as f64).sqrt();
        let z = if se > 0.0 {
            mean / se
        } else if mean == 0.0 {
            0.0
        } else {
            mean.signum() * f64::INFINITY
        };
        let look = Look {
            look: k + 1,
            n,
            mean,
            se,
            z,
            boundary,
        };
        on_look(&look);
        looks.push(look);
        if z.abs() >= boundary {
            return Report {
                plan,
                looks,
                verdict: Verdict::Clear {
                    look: k + 1,
                    n,
                    mean,
                    se,
                },
            };
        }
    }
    let last = *looks.last().expect("at least one look");
    Report {
        plan,
        looks,
        verdict: Verdict::NoClearDifference {
            n: last.n,
            mean: last.mean,
            low: last.mean - 1.96 * last.se,
            high: last.mean + 1.96 * last.se,
        },
    }
}

/// A standard normal draw (Box–Muller), for the self-tests.
#[cfg(test)]
fn normal(rng: &mut Rng) -> f64 {
    let u = (rng.next_u64() >> 11) as f64 / (1u64 << 53) as f64;
    let v = (rng.next_u64() >> 11) as f64 / (1u64 << 53) as f64;
    (-2.0 * (1.0 - u).ln()).sqrt() * (2.0 * std::f64::consts::PI * v).cos()
}

/// The stream an agent draws its choices from, for a seed and a seat.
pub fn agent_rng(seed: u64, seat: Seat) -> Rng {
    Rng::stream(seed, purpose::agent(seat.index()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents::{GreedyAgent, RandomAgent};

    fn legal(seed: u64, seat: Seat) -> Box<dyn Agent> {
        Box::new(RandomAgent::new(agent_rng(seed, seat)))
    }

    fn greedy(_: u64, _: Seat) -> Box<dyn Agent> {
        Box::new(GreedyAgent)
    }

    #[test]
    fn the_boundaries_are_obrien_flemings() {
        let b = Plan {
            batch: 100,
            looks: 4,
        }
        .boundaries();
        let want = [4.05, 2.86, 2.34, 2.02];
        for (got, want) in b.iter().zip(want) {
            assert!((got - want).abs() < 0.01, "{b:?}");
        }
        assert_eq!(Plan { batch: 1, looks: 1 }.boundaries(), vec![1.96]);
    }

    #[test]
    fn the_boundaries_keep_false_alarms_at_five_percent() {
        // Under no difference at all, with four looks, a run should stop
        // with a "clear" verdict about 5% of the time, not the 13% that
        // stopping at the first unadjusted p < 0.05 would give.
        let mut rng = Rng::seeded(2026);
        let runs = 20_000;
        let mut alarms = 0;
        for _ in 0..runs {
            let report = run_sequential(
                Plan {
                    batch: 50,
                    looks: 4,
                },
                |_| normal(&mut rng),
                |_| {},
            );
            alarms += usize::from(matches!(report.verdict, Verdict::Clear { .. }));
        }
        let rate = alarms as f64 / runs as f64;
        assert!((0.042..0.058).contains(&rate), "false alarm rate {rate}");
    }

    #[test]
    fn a_clear_effect_stops_early() {
        let mut rng = Rng::seeded(7);
        let mut stopped = Vec::new();
        for _ in 0..200 {
            let r = run_sequential(
                Plan {
                    batch: 50,
                    looks: 4,
                },
                |_| 0.5 + normal(&mut rng),
                |_| {},
            );
            match r.verdict {
                Verdict::Clear { look, mean, .. } => {
                    assert!(mean > 0.0);
                    stopped.push(look);
                }
                v => panic!("missed a clear effect: {v:?}"),
            }
        }
        let early = stopped.iter().filter(|&&l| l <= 2).count();
        assert!(early > 180, "{early} of 200 stopped by the second look");
    }

    #[test]
    fn no_effect_reports_an_interval_around_it() {
        let mut rng = Rng::seeded(8);
        let r = run_sequential(
            Plan {
                batch: 200,
                looks: 2,
            },
            |_| normal(&mut rng),
            |_| {},
        );
        if let Verdict::NoClearDifference { n, low, high, mean } = r.verdict {
            assert_eq!(n, 400);
            assert!(low < 0.0 && 0.0 < high && low < mean && mean < high);
            assert!((high - low) < 0.3);
        } else {
            panic!("{:?}", r.verdict);
        }
        assert_eq!(r.looks.len(), 2);
    }

    #[test]
    fn identical_observations_are_no_difference_and_a_constant_gap_is_clear() {
        let r = run_sequential(
            Plan {
                batch: 10,
                looks: 3,
            },
            |_| 0.0,
            |_| {},
        );
        assert!(matches!(r.verdict, Verdict::NoClearDifference { mean, .. } if mean == 0.0));
        let r = run_sequential(
            Plan {
                batch: 10,
                looks: 3,
            },
            |_| 2.0,
            |_| {},
        );
        assert!(matches!(r.verdict, Verdict::Clear { look: 1, .. }));
    }

    #[test]
    fn looks_are_heard_as_they_are_taken() {
        let mut heard = Vec::new();
        let mut rng = Rng::seeded(9);
        run_sequential(
            Plan {
                batch: 20,
                looks: 3,
            },
            |_| normal(&mut rng),
            |l| heard.push(l.n),
        );
        assert!(!heard.is_empty() && heard.iter().zip([20, 40, 60]).all(|(a, b)| *a == b));
    }

    #[test]
    fn a_mirrored_pair_of_identical_deterministic_agents_is_exactly_level() {
        // Piquet's lesson: this must be exactly zero, so it cannot hide a
        // tolerance that does no work.
        for seed in 0..20 {
            assert_eq!(mirrored_hand(Rules::CLASSIC, seed, &greedy, &greedy), 0);
            assert_eq!(mirrored_game(Rules::CLASSIC, seed, &greedy, &greedy), 0);
        }
    }

    #[test]
    fn a_mirrored_pair_is_antisymmetric() {
        for seed in 0..20 {
            let ab = mirrored_hand(Rules::ROYAL, seed, &greedy, &legal);
            let ba = mirrored_hand(Rules::ROYAL, seed, &legal, &greedy);
            assert_eq!(ab, -ba, "seed {seed}");
        }
    }

    #[test]
    fn greedy_beats_legal_and_the_run_says_so_early() {
        let report = run_sequential(
            Plan {
                batch: 40,
                looks: 4,
            },
            |i| f64::from(mirrored_hand(Rules::CLASSIC, i as u64, &greedy, &legal)),
            |_| {},
        );
        match report.verdict {
            Verdict::Clear { mean, look, .. } => {
                assert!(mean > 1.0, "greedy gains {mean} points a pair");
                assert!(look <= 2);
            }
            v => panic!("{v:?}"),
        }
    }

    #[test]
    fn a_game_has_a_winner_with_21() {
        let mut a = GreedyAgent;
        let mut b = RandomAgent::new(Rng::seeded(3));
        let (winner, scores) = play_game(Rules::CLASSIC, 11, &mut a, &mut b);
        assert!(scores[winner.index()] >= 21);
    }
}
