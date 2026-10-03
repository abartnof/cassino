//! Computer players. An agent sees only its [`View`] and returns one of the
//! view's legal moves.
//!
//! The ladder (`docs/DESIGN.md` §11.1) starts here: **legal** (any legal
//! move) and **greedy** (the most valuable capture in sight, otherwise the
//! least valuable trail, never a build). Each rung above must beat the one
//! below in a mirrored measurement or be deleted.

use crate::cards::Card;
use crate::moves::Move;
use crate::observation::View;
use crate::rng::Rng;
use crate::worth::Worth;

pub trait Agent {
    /// A short name for tables of results.
    fn name(&self) -> String;

    /// One of `view.legal_moves()`, which is never empty when this is asked.
    fn choose(&mut self, view: &View) -> Move;
}

/// Rung 1: any legal move, uniformly.
pub struct RandomAgent {
    rng: Rng,
}

impl RandomAgent {
    pub fn new(rng: Rng) -> RandomAgent {
        RandomAgent { rng }
    }
}

impl Agent for RandomAgent {
    fn name(&self) -> String {
        "legal".into()
    }

    fn choose(&mut self, view: &View) -> Move {
        let moves = view.legal_moves();
        moves[self.rng.below(moves.len() as u64) as usize]
    }
}

/// Rung 2: the capture worth most (with a sweep counted when sweeps score);
/// with nothing to capture, the trail of the card worth least. It never
/// builds, unless building is all it may do.
pub struct GreedyAgent;

impl GreedyAgent {
    /// What a move banks at once: the cards it wins, and a sweep.
    pub fn immediate(view: &View, mv: &Move) -> Worth {
        match *mv {
            Move::Capture { card, taken, .. } => {
                let mut w = Worth::of_cards(taken.with(card));
                if view.rules.sweeps && taken == view.table.cards() {
                    w += Worth::sweep();
                }
                w
            }
            _ => Worth::default(),
        }
    }
}

/// What trailing a card gives away, roughly: its own worth.
fn trail_cost(card: Card) -> f64 {
    Worth::of_card(card).total()
}

impl Agent for GreedyAgent {
    fn name(&self) -> String {
        "greedy".into()
    }

    fn choose(&mut self, view: &View) -> Move {
        let moves = view.legal_moves();
        let best_by = |key: &dyn Fn(&Move) -> f64, pool: &mut dyn Iterator<Item = Move>| {
            pool.fold(None, |best: Option<(f64, Move)>, m| {
                let k = key(&m);
                match best {
                    Some((bk, _)) if bk >= k => best,
                    _ => Some((k, m)),
                }
            })
            .map(|(_, m)| m)
        };
        let capture = best_by(
            &|m| GreedyAgent::immediate(view, m).total(),
            &mut moves
                .iter()
                .copied()
                .filter(|m| matches!(m, Move::Capture { .. })),
        );
        let trail = || {
            best_by(
                &|m| -trail_cost(m.card()),
                &mut moves
                    .iter()
                    .copied()
                    .filter(|m| matches!(m, Move::Trail { .. })),
            )
        };
        capture.or_else(trail).unwrap_or(moves[0])
    }
}

/// The highest level of opponent.
pub const TOP: u8 = 2;

/// The opponent at `level` (1 to [`TOP`]), drawing any choices it makes at
/// random from `rng`.
pub fn by_level(level: u8, rng: Rng) -> Box<dyn Agent> {
    match level {
        1 => Box::new(RandomAgent::new(rng)),
        2 => Box::new(GreedyAgent),
        _ => panic!("no level {level}: 1 to {TOP}"),
    }
}

/// What the opponent at `level` does, in a phrase for a menu.
pub fn describe(level: u8) -> &'static str {
    match level {
        1 => "plays any legal card",
        2 => "takes the best capture in sight, and never builds",
        _ => "",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cards::CardSet;
    use crate::hand::Hand;
    use crate::rules::Rules;
    use crate::table::{Seat, Table};

    /// A view for South to move, holding `hand`, with `table` before them.
    fn view(rules: Rules, table: &str, hand: &str) -> View {
        let (h, _) = Hand::deal(rules, Seat::North, crate::cards::pack());
        let mut v = h.view(Seat::South, [0, 0]);
        v.table = Table::parse(&rules, table).unwrap();
        v.hand = CardSet::parse(hand).unwrap();
        v
    }

    fn mv(s: &str) -> Move {
        Move::parse(s).unwrap()
    }

    #[test]
    fn the_random_agent_plays_legal_moves_and_repeats_with_its_seed() {
        let v = view(Rules::CLASSIC, "AC 2D 3H 5S 6C 8D", "8S 3C 4D");
        let legal = v.legal_moves();
        let picks: Vec<Move> = {
            let mut a = RandomAgent::new(Rng::seeded(1));
            (0..20).map(|_| a.choose(&v)).collect()
        };
        assert!(picks.iter().all(|m| legal.contains(m)));
        let again: Vec<Move> = {
            let mut a = RandomAgent::new(Rng::seeded(1));
            (0..20).map(|_| a.choose(&v)).collect()
        };
        assert_eq!(picks, again);
        let distinct: std::collections::HashSet<_> = picks.iter().collect();
        assert!(distinct.len() > 3);
    }

    #[test]
    fn greedy_takes_big_casino_over_a_spade() {
        let v = view(Rules::CLASSIC, "TD 5S", "TC 5C");
        assert_eq!(GreedyAgent.choose(&v), mv("take TC TD"));
    }

    #[test]
    fn greedy_counts_a_sweep() {
        // 9 takes 9 (two cards); 5 takes 5+... no: 4+5 with a 9 sweeps.
        let v = view(Rules::CLASSIC, "4H 5D", "9C 4C");
        assert_eq!(GreedyAgent.choose(&v), mv("take 9C 4H 5D"));
    }

    #[test]
    fn greedy_trails_its_least_valuable_card() {
        let v = view(Rules::CLASSIC, "KD", "AS 7C TD");
        assert_eq!(GreedyAgent.choose(&v), mv("trail 7C"));
    }

    #[test]
    fn greedy_captures_rather_than_builds() {
        let v = view(Rules::CLASSIC, "AC 2D", "3H 3S 6D");
        assert!(matches!(GreedyAgent.choose(&v), Move::Capture { .. }));
    }

    #[test]
    fn greedy_plays_the_only_move_it_has() {
        // South controls a 9-build and holds the 9 and a 4 that can neither
        // capture, build nor trail: the 9 must take the build.
        let v = view(Rules::CLASSIC, "[9 @S: 6S 3H]", "9C 4D");
        assert_eq!(GreedyAgent.choose(&v), mv("take 9C 6S 3H"));
    }

    #[test]
    fn every_level_has_an_agent_and_a_description() {
        for level in 1..=TOP {
            let agent = by_level(level, Rng::seeded(1));
            assert!(!agent.name().is_empty());
            assert!(!describe(level).is_empty());
        }
        assert_eq!(by_level(1, Rng::seeded(1)).name(), "legal");
        assert_eq!(by_level(2, Rng::seeded(1)).name(), "greedy");
    }

    #[test]
    fn immediate_worth_includes_the_played_card_and_the_sweep() {
        let v = view(Rules::CLASSIC, "4H 5D", "9C");
        let w = GreedyAgent::immediate(&v, &mv("take 9C 4H 5D"));
        assert!((w.cards - 3.0 * crate::worth::PER_CARD).abs() < 1e-12);
        assert_eq!(w.sweeps, 1.0);
        assert_eq!(
            GreedyAgent::immediate(&v, &mv("trail 9C")),
            Worth::default()
        );
    }
}
