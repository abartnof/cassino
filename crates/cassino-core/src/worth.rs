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

/// What one more card and one more spade are worth, in points.
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct Weights {
    pub per_card: f64,
    pub per_spade: f64,
}

impl Weights {
    /// The flat weights: 0.2 a card, 0.15 a spade.
    pub const FLAT: Weights = Weights {
        per_card: PER_CARD,
        per_spade: PER_SPADE,
    };

    /// The weights given both capture piles. Each card still to be captured
    /// is taken as an even chance for either player, and a card is worth its
    /// chance of being the one that decides the item: for most cards, of
    /// carrying a total across 26–27 (3 points); for most spades, across 6–7
    /// (1 point). Capturing a card moves the expected total by half a card
    /// against leaving it to the rest of the hand. Nothing once an item is
    /// won.
    pub fn for_piles(piles: [CardSet; 2]) -> Weights {
        let (a, b) = (piles[0].len(), piles[1].len());
        let per_card = if a >= 27 || b >= 27 {
            0.0
        } else {
            // South's final total, a + Bin(rest, 1/2); the item turns at
            // 25-26 and 26-27, seen from either side.
            let rest = 52 - a - b;
            let p = |total: u32| total.checked_sub(a).map_or(0.0, |k| binomial(rest, k));
            3.0 * 0.5 * (p(25) + 2.0 * p(26) + p(27)) / 2.0
        };
        let (s, t) = (piles[0].spades(), piles[1].spades());
        let per_spade = if s >= 7 || t >= 7 {
            0.0
        } else {
            let rest = 13 - s - t;
            let p = |total: u32| total.checked_sub(s).map_or(0.0, |k| binomial(rest, k));
            // A swing of 2 (one point won or lost) across 6-7, half a spade.
            2.0 * 0.5 * (p(6) + p(7)) / 2.0
        };
        Weights {
            per_card,
            per_spade,
        }
    }
}

impl Weights {
    /// [`Weights::for_piles`] scaled so that at the start of a hand it gives
    /// the flat weights: the same level, with the state's ups and downs.
    pub fn scaled_for_piles(piles: [CardSet; 2]) -> Weights {
        let start = Weights::for_piles([CardSet::EMPTY; 2]);
        let now = Weights::for_piles(piles);
        Weights {
            per_card: now.per_card * PER_CARD / start.per_card,
            per_spade: now.per_spade * PER_SPADE / start.per_spade,
        }
    }
}

/// P(Bin(n, 1/2) = k).
fn binomial(n: u32, k: u32) -> f64 {
    if k > n {
        return 0.0;
    }
    let k = k.min(n - k);
    let mut c = 1.0f64;
    for i in 0..k {
        c = c * f64::from(n - i) / f64::from(i + 1);
    }
    c / 2f64.powi(n as i32)
}

impl Worth {
    /// What capturing `card` is worth under `weights`.
    pub fn of_card_with(card: Card, weights: &Weights) -> Worth {
        let spade = card.suit() == crate::cards::Suit::Spades;
        Worth {
            cards: weights.per_card,
            spades: if spade { weights.per_spade } else { 0.0 },
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

    /// What capturing `cards` is worth under `weights`.
    pub fn of_cards_with(cards: CardSet, weights: &Weights) -> Worth {
        cards.iter().fold(Worth::default(), |acc, c| {
            acc + Worth::of_card_with(c, weights)
        })
    }

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
    fn weights_follow_the_state_of_the_piles() {
        let w = Weights::for_piles([CardSet::EMPTY; 2]);
        assert!((w.per_card - 0.325).abs() < 0.01, "{w:?}");
        assert!((w.per_spade - 0.2095).abs() < 0.005, "{w:?}");
        // Most cards won: more cards are worth nothing towards it.
        let mut many = CardSet::EMPTY;
        for c in crate::cards::pack()
            .into_iter()
            .filter(|c| c.suit() != crate::cards::Suit::Spades)
            .take(27)
        {
            many.insert(c);
        }
        let w = Weights::for_piles([many, CardSet::EMPTY]);
        assert_eq!(w.per_card, 0.0);
        assert_eq!(
            w.per_spade,
            Weights::for_piles([CardSet::EMPTY; 2]).per_spade,
            "no spades taken yet"
        );
        // Seven spades won: spades are worth nothing more.
        let w = Weights::for_piles([
            CardSet::SPADES - CardSet::parse("8S 9S TS JS QS KS").unwrap(),
            CardSet::EMPTY,
        ]);
        assert_eq!(w.per_spade, 0.0);
        // 25 each with two left: each card is nearly a decider.
        let all: Vec<Card> = crate::cards::pack().to_vec();
        let a: CardSet = all[..25].iter().copied().collect();
        let b: CardSet = all[25..50].iter().copied().collect();
        let w = Weights::for_piles([a, b]);
        assert!((w.per_card - 1.125).abs() < 1e-9, "{w:?}");
        // Scaled, the start of a hand gives the flat weights.
        let start = Weights::scaled_for_piles([CardSet::EMPTY; 2]);
        assert!(
            (start.per_card - PER_CARD).abs() < 1e-12
                && (start.per_spade - PER_SPADE).abs() < 1e-12
        );
        // The flat weights are the old constants.
        assert_eq!(Weights::FLAT.per_card, PER_CARD);
        let big = Worth::of_card_with(
            Card::BIG_CASINO,
            &Weights {
                per_card: 0.0,
                per_spade: 0.0,
            },
        );
        assert_eq!(big.total(), 2.0);
        assert_eq!(
            Worth::of_card_with(Card::BIG_CASINO, &Weights::FLAT),
            Worth::of_card(Card::BIG_CASINO)
        );
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
