//! What cards are worth, broken down by the items of the count
//! (`docs/DESIGN.md` §12.4).
//!
//! A card's worth is a vector, not one number: what it brings towards most
//! cards, most spades, the aces, the Casinos and a sweep. The opponent ranks
//! moves by the weighted total; the explanations name the largest terms. The
//! weights are point-equivalents. Exact for the aces and Casinos; for cards
//! and spades the marginal value of one more card towards the 3-point and
//! 1-point majorities, a modelling choice to be measured, as in the
//! literature review's simulator.

use std::ops::{Add, AddAssign};

use crate::cards::{Card, CardSet, ACE};

/// Worth by item of the count, in points.
#[derive(Copy, Clone, Debug, PartialEq, Default)]
pub struct Worth {
    pub cards: f64,
    pub spades: f64,
    pub aces: f64,
    pub big_casino: f64,
    pub little_casino: f64,
    pub sweeps: f64,
}

/// One more card's share of the 3 points for most cards.
pub const PER_CARD: f64 = 0.2;
/// One more spade's share of the point for most spades.
pub const PER_SPADE: f64 = 0.15;

impl Worth {
    /// What capturing `card` is worth.
    pub fn of_card(card: Card) -> Worth {
        let spade = card.suit() == crate::cards::Suit::Spades;
        Worth {
            cards: PER_CARD,
            spades: if spade { PER_SPADE } else { 0.0 },
            aces: if card.rank() == ACE { 1.0 } else { 0.0 },
            big_casino: if card == Card::BIG_CASINO { 2.0 } else { 0.0 },
            little_casino: if card == Card::LITTLE_CASINO {
                1.0
            } else {
                0.0
            },
            sweeps: 0.0,
        }
    }

    /// What capturing `cards` is worth.
    pub fn of_cards(cards: CardSet) -> Worth {
        cards
            .iter()
            .fold(Worth::default(), |acc, c| acc + Worth::of_card(c))
    }

    /// A sweep's worth when sweeps score.
    pub fn sweep() -> Worth {
        Worth {
            sweeps: 1.0,
            ..Worth::default()
        }
    }

    pub fn total(&self) -> f64 {
        self.cards + self.spades + self.aces + self.big_casino + self.little_casino + self.sweeps
    }
}

impl Add for Worth {
    type Output = Worth;
    fn add(self, o: Worth) -> Worth {
        Worth {
            cards: self.cards + o.cards,
            spades: self.spades + o.spades,
            aces: self.aces + o.aces,
            big_casino: self.big_casino + o.big_casino,
            little_casino: self.little_casino + o.little_casino,
            sweeps: self.sweeps + o.sweeps,
        }
    }
}

impl AddAssign for Worth {
    fn add_assign(&mut self, o: Worth) {
        *self = *self + o;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn c(s: &str) -> Card {
        s.parse().unwrap()
    }

    #[test]
    fn a_plain_card_is_its_share_of_the_cards() {
        let w = Worth::of_card(c("7H"));
        assert_eq!(
            w,
            Worth {
                cards: PER_CARD,
                ..Worth::default()
            }
        );
    }

    #[test]
    fn point_cards_carry_their_points() {
        assert_eq!(Worth::of_card(c("TD")).big_casino, 2.0);
        assert_eq!(Worth::of_card(c("2S")).little_casino, 1.0);
        assert_eq!(Worth::of_card(c("2S")).spades, PER_SPADE);
        assert_eq!(Worth::of_card(c("AH")).aces, 1.0);
        assert_eq!(Worth::of_card(c("AS")).total(), PER_CARD + PER_SPADE + 1.0);
    }

    #[test]
    fn worth_adds_up() {
        let set = CardSet::parse("TD 2S 7H").unwrap();
        let w = Worth::of_cards(set);
        let sum = Worth::of_card(c("TD")) + Worth::of_card(c("2S")) + Worth::of_card(c("7H"));
        assert_eq!(w, sum);
        assert!((w.total() - (3.0 * PER_CARD + PER_SPADE + 3.0)).abs() < 1e-12);
        assert_eq!(Worth::of_cards(CardSet::EMPTY), Worth::default());
        // The pack holds the 7 points of the aces and the Casinos.
        let all = Worth::of_cards(CardSet::FULL);
        assert!((all.aces + all.big_casino + all.little_casino - 7.0).abs() < 1e-12);
    }
}
