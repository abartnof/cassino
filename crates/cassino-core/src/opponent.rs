//! The opponent a player chooses: a rung of the ladder and how erratic it is
//! (`docs/DESIGN.md` §11.1).
//!
//! **Erraticism** gives finer steps between the rungs. On each decision the
//! opponent slips down one rung with probability `erraticism`, so level L at
//! erraticism e plays between rungs L and L − 1: erraticism 0 is the rung
//! itself, erraticism 1 the rung below. The slips are drawn from the
//! opponent's own draws, so they never change the cards.
//!
//! A first version let the opponent slip again and again, down to the first
//! rung, which plays at random; level 4 at erraticism 0.5 then lost to level 3
//! by 1.8 points a mirrored pair (`measurements/README.md`). A few random
//! moves cost more than half a rung, so a slip is one rung only.
//!
//! [`Skill`] is the dial a player turns: one number from 1 to `TOP`.

use crate::agents::{self, Agent};
use crate::moves::Move;
use crate::observation::View;
use crate::rng::Rng;

/// The opponent: a level, an erraticism, and a seed. Each decision is a
/// pure function of the seed and the position it sees: its random draws (the
/// slip, the rung's sampling) are seeded from a hash of the view. So an
/// opponent asked twice answers the same, a record replays into the same
/// game, and undo needs only to restore the position.
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct Opponent {
    level: u8,
    erraticism: f64,
    seed: u64,
}

impl Opponent {
    /// The opponent at `level` (1 to [`agents::TOP`]) with `erraticism`
    /// (0 to 1), drawing from `seed`.
    pub fn new(level: u8, erraticism: f64, seed: u64) -> Opponent {
        assert!(
            (1..=agents::TOP).contains(&level),
            "level 1 to {}",
            agents::TOP
        );
        assert!((0.0..=1.0).contains(&erraticism), "erraticism 0 to 1");
        Opponent {
            level,
            erraticism,
            seed,
        }
    }

    /// The draws for a decision in `view`.
    fn draws(&self, view: &View) -> Rng {
        Rng::stream(self.seed, crate::advice::advisor_seed(view))
    }

    /// The rung a decision in `view` is made at: `level`, or one below it
    /// with probability `erraticism`.
    fn rung(&self, view: &View) -> u8 {
        let mut draws = self.draws(view);
        let uniform = (draws.next_u64() >> 11) as f64 / (1u64 << 53) as f64;
        if self.level > 1 && self.erraticism > 0.0 && uniform < self.erraticism {
            self.level - 1
        } else {
            self.level
        }
    }

    pub fn level(&self) -> u8 {
        self.level
    }

    pub fn erraticism(&self) -> f64 {
        self.erraticism
    }
}

/// The skill dial: one number from 1 (the first rung) to `TOP` (the top
/// rung). A whole number is a rung; between two, the higher rung slipping to
/// the lower as often as the dial is short of it.
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct Skill(pub f64);

impl Skill {
    /// The level and erraticism this skill plays at.
    pub fn setting(self) -> (u8, f64) {
        let s = self.0.clamp(1.0, f64::from(agents::TOP));
        let level = s.ceil();
        (level as u8, level - s)
    }

    pub fn opponent(self, seed: u64) -> Opponent {
        let (level, erraticism) = self.setting();
        Opponent::new(level, erraticism, seed)
    }
}

impl Agent for Opponent {
    fn name(&self) -> String {
        let name = agents::by_level(self.level, Rng::seeded(0)).name();
        if self.erraticism == 0.0 {
            name
        } else {
            format!("{name} (erratic {:.2})", self.erraticism)
        }
    }

    fn choose(&mut self, view: &View) -> Move {
        let mut draws = self.draws(view);
        draws.next_u64(); // the slip's draw, made in `rung`
        let rung = self.rung(view);
        agents::by_level(rung, Rng::seeded(draws.next_u64())).choose(view)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cards::pack;
    use crate::hand::Hand;
    use crate::rules::Rules;
    use crate::table::Seat;

    fn shuffled(seed: u64) -> [crate::cards::Card; 52] {
        let mut deck = pack();
        Rng::seeded(seed).shuffle(&mut deck);
        deck
    }

    /// Views from random play: many distinct positions.
    fn views(n: usize) -> Vec<View> {
        let mut out = Vec::new();
        let mut seed = 0;
        while out.len() < n {
            let mut rng = Rng::seeded(seed);
            let (mut h, _) = Hand::deal(Rules::CLASSIC, Seat::North, shuffled(seed));
            while let Some(seat) = h.to_move() {
                out.push(h.view(seat, [0, 0]));
                let moves = h.candidates();
                h.play(&moves[rng.below(moves.len() as u64) as usize])
                    .unwrap();
            }
            seed += 1;
        }
        out.truncate(n);
        out
    }

    #[test]
    fn a_decision_is_a_function_of_the_seed_and_the_view() {
        for v in views(60) {
            let mut a = Opponent::new(3, 0.3, 7);
            let mut b = Opponent::new(3, 0.3, 7);
            let first = a.choose(&v);
            assert_eq!(first, a.choose(&v), "asked twice, the same answer");
            assert_eq!(first, b.choose(&v));
            assert!(v.candidates().contains(&first));
        }
    }

    #[test]
    fn a_slip_is_one_rung_as_often_as_the_erraticism() {
        let vs = views(4_000);
        let o = Opponent::new(4, 0.3, 1);
        let slipped = vs.iter().filter(|v| o.rung(v) == 3).count();
        assert!(
            vs.iter().all(|v| o.rung(v) >= 3),
            "never below the rung beneath"
        );
        let p = slipped as f64 / vs.len() as f64;
        assert!((p - 0.3).abs() < 0.03, "{p}");
        assert!(vs.iter().all(|v| Opponent::new(4, 1.0, 2).rung(v) == 3));
        assert!(vs.iter().all(|v| Opponent::new(4, 0.0, 3).rung(v) == 4));
        assert!(
            vs.iter().all(|v| Opponent::new(1, 1.0, 4).rung(v) == 1),
            "rung 1 has nowhere to slip"
        );
    }

    #[test]
    fn the_skill_dial_maps_to_a_level_and_an_erraticism() {
        assert_eq!(Skill(4.0).setting(), (4, 0.0));
        assert_eq!(Skill(1.0).setting(), (1, 0.0));
        let (level, e) = Skill(3.25).setting();
        assert_eq!(level, 4);
        assert!((e - 0.75).abs() < 1e-12);
        let (level, e) = Skill(1.5).setting();
        assert_eq!(level, 2);
        assert!((e - 0.5).abs() < 1e-12);
        assert_eq!(Skill(9.0).setting(), (agents::TOP, 0.0), "clamped");
        assert_eq!(Skill(0.0).setting(), (1, 0.0), "clamped");
    }

    #[test]
    fn names_say_the_level_and_the_erraticism() {
        assert_eq!(Opponent::new(3, 0.0, 1).name(), "counter");
        assert_eq!(Opponent::new(4, 0.25, 1).name(), "searcher (erratic 0.25)");
        assert_eq!(Opponent::new(2, 0.0, 1).level(), 2);
    }
}
