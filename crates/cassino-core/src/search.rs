//! Rung 4, the searcher: sampled worlds, played to the end of the deal
//! (`docs/DESIGN.md` §11.2–11.3).
//!
//! **In the last deal** every unseen card is in the opponent's hand, so the
//! searcher plays the exact solver's move.
//!
//! **Before it**, it samples worlds consistent with its view (the opponent's
//! hand and the stock's order, honouring the cards the opponent's builds
//! announce) and narrows the candidates to the counter's best few. In every
//! world it plays each candidate out **to the end of the current deal**, with
//! the counter for both seats, and scores the worth each side banked on the
//! way. It takes the move with the best average. The same worlds, and the
//! same playout luck within each, serve every candidate, so the comparison
//! between them is not drowned by the luck of the sampling.
//!
//! Measured (`measurements/README.md`): playing out to the end of the *hand*
//! with greedy players gave no clear gain over the counter (the final margin
//! is too noisy for 32 worlds to separate moves), and was deleted. Playing
//! out to the end of the deal beat the counter clearly, and the counter beat
//! greedy as the playout policy, confirmed on fresh seeds.

use crate::agents::{immediate_worth, Agent, GreedyAgent};
use crate::counter::CounterAgent;
use crate::hand::Hand;
use crate::moves::Move;
use crate::observation::View;
use crate::rng::Rng;
use crate::solver::{Margin, Solver};
use crate::table::Seat;
use crate::worth::Worth;

/// Who plays the playouts, for both seats.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Policy {
    /// Cheap; it never builds.
    Greedy,
    /// The counter with a few samples: it builds and sees the reply.
    Counter,
}

pub struct SearchAgent {
    rng: Rng,
    counter: CounterAgent,
    /// Worlds sampled for each decision.
    pub worlds: usize,
    /// The most candidates searched; the counter ranks them.
    pub width: usize,
    pub policy: Policy,
}

impl SearchAgent {
    pub fn new(rng: Rng) -> SearchAgent {
        let mut rng = rng;
        let counter = CounterAgent::new(Rng::seeded(rng.next_u64()));
        SearchAgent {
            rng,
            counter,
            worlds: 32,
            width: 8,
            policy: Policy::Counter,
        }
    }
}

/// Plays `world` to the end of the current deal (or of the hand, if this is
/// the last deal) with `policy` for both seats; the worth banked by `seat`
/// less the worth banked by the other on the way, in points.
pub fn rollout_deal(mut world: Hand, seat: Seat, policy: Policy, rng: &mut Rng) -> f64 {
    let deal = world.deal_number();
    let piles = [world.pile(Seat::South), world.pile(Seat::North)];
    let sweeps = [world.sweeps(Seat::South), world.sweeps(Seat::North)];
    let mut counter = (policy == Policy::Counter).then(|| {
        let mut c = CounterAgent::new(Rng::seeded(rng.next_u64()));
        c.samples = 4;
        c
    });
    while let Some(mover) = world.to_move() {
        if world.deal_number() != deal {
            break;
        }
        let view = world.view(mover, [0, 0]);
        let mv = match counter.as_mut() {
            Some(c) => c.choose(&view),
            None => GreedyAgent.choose(&view),
        };
        world.play(&mv).expect("a candidate is legal");
    }
    let banked = |s: Seat| {
        let won = world.pile(s) - piles[s.index()];
        let swept = world.sweeps(s) - sweeps[s.index()];
        let sweep_points = if world.rules().sweeps {
            f64::from(swept)
        } else {
            0.0
        };
        Worth::of_cards(won).total() + sweep_points
    };
    banked(seat) - banked(seat.other())
}

/// The most positions the exact solver may search for one decision before
/// the searcher falls back to its playouts (about a second natively; the
/// engine review's F3 found a crowded last deal that took 18 s unbounded).
pub const SOLVER_BUDGET: u64 = 300_000;

impl SearchAgent {
    /// The candidates the searcher considers: the counter's best few.
    pub fn shortlist(&mut self, view: &View) -> Vec<Move> {
        let mut ranked = self.counter.assess(view);
        ranked.sort_by(|a, b| b.1.total().total_cmp(&a.1.total()));
        ranked.truncate(self.width);
        ranked.into_iter().map(|(m, _)| m).collect()
    }

    /// The searcher's value of each of `moves` (candidates of `view`), in
    /// points to the player: in the last deal the exact margin of the hand;
    /// before it, the average worth banked by the end of the deal over the
    /// sampled worlds, the same worlds for every move. For hints and for
    /// rating a move against the best.
    pub fn evaluate(&mut self, view: &View, moves: &[Move]) -> Vec<(Move, f64)> {
        if view.perfect_information() {
            let world = view.world(view.unseen(), &[]);
            let mut solver = Solver::with_budget(&Margin, SOLVER_BUDGET);
            let exact: Option<Vec<(Move, f64)>> = moves
                .iter()
                .map(|&m| {
                    let mut next = world;
                    next.play(&m).expect("a candidate is legal");
                    solver.try_value(&next, view.me).map(|v| (m, f64::from(v)))
                })
                .collect();
            if let Some(exact) = exact {
                return exact;
            }
            // Too big to solve in budget: the playouts below, in the one
            // world there is.
        }
        // The same worlds, and the same playout luck in each, for every move.
        let worlds: Vec<(Hand, u64)> = (0..self.worlds)
            .map(|_| (view.sample_world(&mut self.rng), self.rng.next_u64()))
            .collect();
        moves
            .iter()
            .map(|&m| {
                let now = immediate_worth(&view.rules, &view.table, &m).total();
                let total: f64 = worlds
                    .iter()
                    .map(|&(w, luck)| {
                        let mut next = w;
                        next.play(&m).expect("a candidate is legal in every world");
                        now + rollout_deal(next, view.me, self.policy, &mut Rng::seeded(luck))
                    })
                    .sum();
                (m, total / worlds.len() as f64)
            })
            .collect()
    }
}

impl Agent for SearchAgent {
    fn name(&self) -> String {
        "searcher".into()
    }

    fn choose(&mut self, view: &View) -> Move {
        if view.perfect_information() {
            let world = view.world(view.unseen(), &[]);
            if let Some((m, _)) = Solver::with_budget(&Margin, SOLVER_BUDGET).try_best(&world) {
                return m;
            }
        }
        let shortlist = self.shortlist(view);
        if shortlist.len() == 1 {
            return shortlist[0];
        }
        self.evaluate(view, &shortlist)
            .into_iter()
            .fold(None, |best: Option<(f64, Move)>, (m, v)| match best {
                Some((bv, _)) if bv >= v => best,
                _ => Some((v, m)),
            })
            .expect("a candidate")
            .1
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cards::{pack, Card, CardSet};
    use crate::rules::Rules;
    use crate::table::Table;

    fn mv(s: &str) -> Move {
        Move::parse(s).unwrap()
    }

    #[test]
    fn in_the_last_deal_it_plays_the_exact_move() {
        // The solver's endgame: keep the king back for the last capture.
        let rules = Rules::CLASSIC;
        let s = |t: &str| CardSet::parse(t).unwrap();
        let hands = [s("KC 7C"), s("7D")];
        let table = Table::parse(&rules, "7H KD").unwrap();
        let rest: Vec<Card> = (!(hands[0] | hands[1] | table.cards())).iter().collect();
        let piles = [
            rest[..24].iter().copied().collect(),
            rest[24..].iter().copied().collect(),
        ];
        let h = Hand::from_parts(
            rules,
            Seat::South,
            6,
            Some(Seat::South),
            hands,
            table,
            piles,
            [0, 0],
            Some(Seat::North),
            &[],
        );
        let mut a = SearchAgent::new(Rng::seeded(1));
        assert_eq!(a.choose(&h.view(Seat::South, [0, 0])), mv("take 7C 7H"));
    }

    #[test]
    fn a_deal_rollout_stops_at_the_end_of_the_deal_and_is_zero_sum() {
        for seed in 0..30 {
            let mut deck = pack();
            Rng::seeded(seed).shuffle(&mut deck);
            let (h, _) = Hand::deal(Rules::CLASSIC, Seat::North, deck);
            for policy in [Policy::Greedy, Policy::Counter] {
                let a = rollout_deal(h, Seat::South, policy, &mut Rng::seeded(1));
                let b = rollout_deal(h, Seat::North, policy, &mut Rng::seeded(1));
                assert!((a + b).abs() < 1e-9, "{a} {b}");
            }
        }
    }

    #[test]
    fn a_deal_rollout_counts_what_was_banked() {
        // South to move takes the lone 7 with a 7: a sweep and two cards;
        // North then trails, and the deal ends.
        let rules = Rules::CLASSIC;
        let s = |t: &str| CardSet::parse(t).unwrap();
        let hands = [s("7C"), s("KH")];
        let table = Table::parse(&rules, "7D").unwrap();
        let rest: Vec<Card> = (!(hands[0] | hands[1] | table.cards())).iter().collect();
        let undealt: Vec<Card> = rest[..8].to_vec();
        let piles = [
            rest[8..30].iter().copied().collect(),
            rest[30..].iter().copied().collect(),
        ];
        let h = Hand::from_parts(
            rules,
            Seat::North,
            5,
            Some(Seat::South),
            hands,
            table,
            piles,
            [0, 0],
            None,
            &undealt,
        );
        let v = rollout_deal(h, Seat::South, Policy::Greedy, &mut Rng::seeded(1));
        let want = crate::worth::Worth::of_cards(s("7C 7D")).total() + 1.0;
        assert!((v - want).abs() < 1e-9, "{v} vs {want}");
    }

    #[test]
    fn evaluation_ranks_what_the_searcher_chooses_first() {
        let mut deck = pack();
        Rng::seeded(21).shuffle(&mut deck);
        let (mut h, _) = Hand::deal(Rules::CLASSIC, Seat::North, deck);
        let mut rng = Rng::seeded(22);
        let mut checked = 0;
        while let Some(seat) = h.to_move() {
            let v = h.view(seat, [0, 0]);
            let candidates = v.candidates();
            let mut a = SearchAgent::new(Rng::seeded(5));
            let mut b = SearchAgent::new(Rng::seeded(5));
            let values = a.evaluate(&v, &candidates);
            assert_eq!(values.len(), candidates.len());
            assert!(values.iter().all(|(_, x)| x.is_finite()));
            let chosen = b.choose(&v);
            let best = values.iter().map(|(_, x)| *x).fold(f64::MIN, f64::max);
            let of_chosen = values.iter().find(|(m, _)| *m == chosen).unwrap().1;
            if v.perfect_information() {
                assert_eq!(of_chosen, best, "the solver's move is the best");
            }
            checked += 1;
            h.play(&candidates[rng.below(candidates.len() as u64) as usize])
                .unwrap();
        }
        assert_eq!(checked, 48);
    }

    #[test]
    fn a_crowded_last_deal_is_decided_in_good_time() {
        // The review's F3: the exact solver once took 18 s here.
        let h = crate::solver::tests::busy_last_deal();
        let v = h.view(Seat::South, [0, 0]);
        let started = std::time::Instant::now();
        let m = SearchAgent::new(Rng::seeded(1)).choose(&v);
        assert!(
            started.elapsed().as_secs_f64() < 3.0,
            "{:?}",
            started.elapsed()
        );
        assert!(v.candidates().contains(&m));
    }

    #[test]
    fn its_moves_are_legal_and_reproducible() {
        let mut deck = pack();
        Rng::seeded(5).shuffle(&mut deck);
        let (mut h, _) = Hand::deal(Rules::CLASSIC, Seat::North, deck);
        let mut a = SearchAgent::new(Rng::seeded(9));
        let mut b = SearchAgent::new(Rng::seeded(9));
        a.worlds = 8;
        b.worlds = 8;
        while let Some(seat) = h.to_move() {
            let v = h.view(seat, [0, 0]);
            let (ma, mb) = (a.choose(&v), b.choose(&v));
            assert_eq!(ma, mb);
            h.play(&ma).unwrap();
        }
    }

    #[test]
    fn it_takes_big_casino_when_nothing_else_compares() {
        let rules = Rules::CLASSIC;
        let (h, _) = Hand::deal(rules, Seat::North, pack());
        let mut v = h.view(Seat::South, [0, 0]);
        // A consistent first deal: 3 on the table, 4 each, one card already
        // taken, 40 to deal.
        v.table = Table::parse(&rules, "TD 4C KH").unwrap();
        v.hand = CardSet::parse("TC 3S 7H 8C").unwrap();
        v.piles = [CardSet::parse("2H").unwrap(), CardSet::EMPTY];
        v.opponent_holds = 4;
        v.undealt = 40;
        assert_eq!(v.unseen().len(), 44);
        let mut a = SearchAgent::new(Rng::seeded(2));
        assert_eq!(a.choose(&v), mv("take TC TD"));
    }
}
