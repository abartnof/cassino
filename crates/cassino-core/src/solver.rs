//! The exact endgame: once the stock is gone, every unseen card is in the
//! opponent's hand, so a player who counts plays with perfect information
//! (`docs/DESIGN.md` §11.2). Alpha-beta search with a transposition table
//! solves the rest of the hand.
//!
//! The objective is a [`Utility`] of the final count, from one seat's side.
//! The default is the hand's points margin; a game-aware utility can value
//! the points that carry a player to 21 above the rest.

use std::collections::HashMap;

use crate::hand::Hand;
use crate::moves::Move;
use crate::scoring::Breakdown;
use crate::table::Seat;

/// What a finished hand is worth to `seat`. Must be zero-sum: worth to one
/// seat is the negative of worth to the other.
pub trait Utility {
    fn value(&self, breakdown: &Breakdown, seat: Seat) -> i32;
}

/// The hand's points margin: `seat`'s points less the opponent's.
pub struct Margin;

impl Utility for Margin {
    fn value(&self, b: &Breakdown, seat: Seat) -> i32 {
        i32::from(b.points(seat)) - i32::from(b.points(seat.other()))
    }
}

#[derive(Copy, Clone)]
enum Bound {
    Exact,
    Lower,
    Upper,
}

/// Solves hands with perfect information.
pub struct Solver<'u> {
    utility: &'u dyn Utility,
    table: HashMap<Hand, (i32, Bound)>,
    /// Positions searched, for measuring.
    pub nodes: u64,
}

impl<'u> Solver<'u> {
    pub fn new(utility: &'u dyn Utility) -> Solver<'u> {
        Solver {
            utility,
            table: HashMap::new(),
            nodes: 0,
        }
    }

    /// The value of `hand` to `seat` under best play by both, searching the
    /// candidate moves. `hand` must have nothing left to deal.
    pub fn value(&mut self, hand: &Hand, seat: Seat) -> i32 {
        let south = self.search(hand, i32::MIN, i32::MAX);
        if seat == Seat::South {
            south
        } else {
            -south
        }
    }

    /// The best move for the player to move, and its value to them.
    pub fn best(&mut self, hand: &Hand) -> (Move, i32) {
        let mover = hand.to_move().expect("a move to make");
        let mut best: Option<(Move, i32)> = None;
        for m in ordered(hand.candidates()) {
            let mut next = *hand;
            next.play(&m).expect("a candidate is legal");
            let v = self.value(&next, mover);
            if best.is_none_or(|(_, bv)| v > bv) {
                best = Some((m, v));
            }
        }
        best.expect("a candidate move")
    }

    /// Fail-soft alpha-beta; values are South's.
    fn search(&mut self, hand: &Hand, mut alpha: i32, mut beta: i32) -> i32 {
        self.nodes += 1;
        let Some(mover) = hand.to_move() else {
            return self
                .utility
                .value(&hand.breakdown().expect("over"), Seat::South);
        };
        if let Some(&(v, bound)) = self.table.get(hand) {
            match bound {
                Bound::Exact => return v,
                Bound::Lower => alpha = alpha.max(v),
                Bound::Upper => beta = beta.min(v),
            }
            if alpha >= beta {
                return v;
            }
        }
        let (alpha0, beta0) = (alpha, beta);
        let maximizing = mover == Seat::South;
        let mut best = if maximizing { i32::MIN } else { i32::MAX };
        for m in ordered(hand.candidates()) {
            let mut next = *hand;
            next.play(&m).expect("a candidate is legal");
            let v = self.search(&next, alpha, beta);
            if maximizing {
                best = best.max(v);
                alpha = alpha.max(v);
            } else {
                best = best.min(v);
                beta = beta.min(v);
            }
            if alpha >= beta {
                break;
            }
        }
        let bound = if best <= alpha0 {
            Bound::Upper
        } else if best >= beta0 {
            Bound::Lower
        } else {
            Bound::Exact
        };
        self.table.insert(*hand, (best, bound));
        best
    }
}

/// Captures first, the biggest first; then builds; then trails.
fn ordered(mut moves: Vec<Move>) -> Vec<Move> {
    moves.sort_by_key(|m| match *m {
        Move::Capture { taken, .. } => (0, u32::MAX - taken.len()),
        Move::Build { .. } => (1, 0),
        Move::Trail { .. } => (2, 0),
    });
    moves
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cards::{pack, Card, CardSet};
    use crate::rng::Rng;
    use crate::rules::{Game, Rules};
    use crate::table::Table;

    /// Plain minimax over every candidate move: the reference.
    fn minimax(hand: &Hand, seat: Seat) -> i32 {
        match hand.to_move() {
            None => Margin.value(&hand.breakdown().unwrap(), seat),
            Some(mover) => {
                let values = hand.candidates().into_iter().map(|m| {
                    let mut next = *hand;
                    next.play(&m).unwrap();
                    minimax(&next, seat)
                });
                if mover == seat {
                    values.max().unwrap()
                } else {
                    values.min().unwrap()
                }
            }
        }
    }

    /// A random hand played on until `left` plies remain in the last deal.
    fn endgame(rules: Rules, seed: u64, left: usize) -> Hand {
        let mut deck = pack();
        Rng::seeded(seed).shuffle(&mut deck);
        let mut rng = Rng::seeded(seed + 1);
        let (mut h, _) = Hand::deal(rules, Seat::South, deck);
        while !(h.undealt().is_empty()
            && (h.hand_of(Seat::South) | h.hand_of(Seat::North)).len() as usize <= left)
        {
            let moves = h.candidates();
            h.play(&moves[rng.below(moves.len() as u64) as usize])
                .unwrap();
        }
        h
    }

    #[test]
    fn alpha_beta_agrees_with_plain_minimax() {
        let royal14 = Rules {
            game: Game::Royal,
            aces_fourteen: true,
            sweeps: true,
        };
        for rules in [Rules::CLASSIC, Rules::ROYAL, royal14] {
            for seed in 0..60 {
                let h = endgame(rules, seed, 5);
                for seat in Seat::BOTH {
                    let mut solver = Solver::new(&Margin);
                    assert_eq!(
                        solver.value(&h, seat),
                        minimax(&h, seat),
                        "{rules:?} seed {seed}"
                    );
                }
            }
        }
    }

    #[test]
    fn the_value_is_zero_sum_and_the_best_move_achieves_it() {
        for seed in 0..40 {
            let h = endgame(Rules::CLASSIC, seed, 8);
            let mut solver = Solver::new(&Margin);
            let mover = h.to_move().unwrap();
            let v = solver.value(&h, mover);
            assert_eq!(solver.value(&h, mover.other()), -v);
            let (best, bv) = solver.best(&h);
            assert_eq!(bv, v);
            let mut next = h;
            next.play(&best).unwrap();
            assert_eq!(solver.value(&next, mover), v, "seed {seed}");
        }
    }

    #[test]
    fn a_whole_last_deal_solves_quickly() {
        for seed in 0..20 {
            let h = endgame(Rules::ROYAL, seed + 100, 8);
            let started = std::time::Instant::now();
            let mut solver = Solver::new(&Margin);
            solver.best(&h);
            assert!(
                started.elapsed().as_millis() < 2_000,
                "seed {seed}: {:?}, {} nodes",
                started.elapsed(),
                solver.nodes
            );
        }
    }

    #[test]
    fn keeping_a_court_card_back_wins_the_last_capture() {
        // South (to move) holds K♣ 7♣; North holds 7♦; the table has 7♥ K♦.
        // Piles: South 24 cards, North 23. Taking 7♥ first and the king last
        // wins all five remaining cards (29: most cards, 3 points). Taking
        // the king first lets North's 7♦ take 7♥ (a sweep, 1 point) and the
        // residue (26 each, so nobody scores the cards): a swing of 4.
        let rules = Rules::CLASSIC;
        let s = |t: &str| CardSet::parse(t).unwrap();
        let hands = [s("KC 7C"), s("7D")];
        let table = Table::parse(&rules, "7H KD").unwrap();
        let rest: Vec<Card> = (!(hands[0] | hands[1] | table.cards())).iter().collect();
        let south_pile: CardSet = rest[..24].iter().copied().collect();
        let north_pile: CardSet = rest[24..].iter().copied().collect();
        let h = Hand::from_parts(
            rules,
            Seat::South,
            6,
            Some(Seat::South),
            hands,
            table,
            [south_pile, north_pile],
            [0, 0],
            Some(Seat::North),
            &[],
        );
        let mut solver = Solver::new(&Margin);
        let (best, v) = solver.best(&h);
        assert_eq!(best, Move::parse("take 7C 7H").unwrap());
        let mut king_first = h;
        king_first
            .play(&Move::parse("take KC KD").unwrap())
            .unwrap();
        assert_eq!(v - solver.value(&king_first, Seat::South), 4);
    }
}
