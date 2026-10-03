//! The opponent a player chooses: a rung of the ladder and how erratic it is
//! (`docs/DESIGN.md` §11.1).
//!
//! **Erraticism** gives finer steps between the rungs. On each decision the
//! opponent slips down one rung with probability `erraticism`, so level L at
//! erraticism e plays between rungs L and L − 1: erraticism 0 is the rung
//! itself, erraticism 1 the rung below. The slips are drawn from the
//! opponent's own stream, so they never change the cards.
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

/// The stream the slips are drawn from (the rungs use 1 to `TOP`).
const SLIPS: u64 = 100;

pub struct Opponent {
    /// Rungs 1 to `level`, lowest first.
    rungs: Vec<Box<dyn Agent>>,
    erraticism: f64,
    slips: Rng,
}

impl Opponent {
    /// The opponent at `level` (1 to [`agents::TOP`]) with `erraticism`
    /// (0 to 1). Rung `l` draws its own choices from stream `l` of `seed`,
    /// and the slips from a stream of their own.
    pub fn new(level: u8, erraticism: f64, seed: u64) -> Opponent {
        assert!(
            (1..=agents::TOP).contains(&level),
            "level 1 to {}",
            agents::TOP
        );
        assert!((0.0..=1.0).contains(&erraticism), "erraticism 0 to 1");
        Opponent {
            rungs: (1..=level)
                .map(|l| agents::by_level(l, Rng::stream(seed, u64::from(l))))
                .collect(),
            erraticism,
            slips: Rng::stream(seed, SLIPS),
        }
    }

    /// The rung the next decision is made at, as an index: `level` less the
    /// slips.
    fn rung(&mut self) -> usize {
        let top = self.rungs.len() - 1;
        if top > 0 && self.erraticism > 0.0 && self.uniform() < self.erraticism {
            top - 1
        } else {
            top
        }
    }

    /// A uniform draw in [0, 1).
    fn uniform(&mut self) -> f64 {
        (self.slips.next_u64() >> 11) as f64 / (1u64 << 53) as f64
    }

    pub fn level(&self) -> u8 {
        self.rungs.len() as u8
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
        if self.erraticism == 0.0 {
            self.rungs.last().expect("a rung").name()
        } else {
            format!(
                "{} (erratic {:.2})",
                self.rungs.last().expect("a rung").name(),
                self.erraticism
            )
        }
    }

    fn choose(&mut self, view: &View) -> Move {
        let rung = self.rung();
        self.rungs[rung].choose(view)
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

    #[test]
    fn no_erraticism_is_the_rung_itself() {
        for level in 1..=agents::TOP {
            let mut deck_rng = Rng::seeded(u64::from(level));
            let (mut h, _) = Hand::deal(Rules::CLASSIC, Seat::North, shuffled(deck_rng.next_u64()));
            let mut steady = Opponent::new(level, 0.0, 7);
            let mut plain = agents::by_level(level, Rng::stream(7, u64::from(level)));
            while let Some(seat) = h.to_move() {
                let v = h.view(seat, [0, 0]);
                let m = steady.choose(&v);
                assert_eq!(m, plain.choose(&v), "level {level}");
                h.play(&m).unwrap();
            }
        }
    }

    #[test]
    fn a_slip_is_one_rung() {
        let mut o = Opponent::new(4, 0.3, 1);
        let mut counts = [0u32; 4];
        let n = 40_000;
        for _ in 0..n {
            counts[o.rung()] += 1;
        }
        assert_eq!(
            counts[0] + counts[1],
            0,
            "never below the rung beneath: {counts:?}"
        );
        let p = f64::from(counts[2]) / f64::from(n);
        assert!((p - 0.3).abs() < 0.01, "{counts:?}");
        let mut always = Opponent::new(4, 1.0, 2);
        assert!((0..100).all(|_| always.rung() == 2));
        let mut never = Opponent::new(4, 0.0, 3);
        assert!((0..100).all(|_| never.rung() == 3));
        let mut bottom = Opponent::new(1, 1.0, 4);
        assert!(
            (0..100).all(|_| bottom.rung() == 0),
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
