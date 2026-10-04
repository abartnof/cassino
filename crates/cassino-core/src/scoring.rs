//! The count at the end of a hand (`docs/RULES.md` rule 10).
//!
//! The breakdown follows Foster's count order: cards, spades, Big Cassino,
//! Little Cassino, the aces in the order ♠ ♣ ♥ ♦, then sweeps [03-S31][02-S1].
//! That is the order the table calls them out, and the order the end-of-hand
//! ritual stages them (`docs/DESIGN.md` §12.1).

use crate::cards::{Card, CardSet, Suit, ACE};
use crate::rules::Rules;
use crate::table::Seat;

/// The ace suits in the order they are counted.
pub const ACE_ORDER: [Suit; 4] = [Suit::Spades, Suit::Clubs, Suit::Hearts, Suit::Diamonds];

/// Points for each item.
pub const CARDS_POINTS: u8 = 3;
pub const SPADES_POINTS: u8 = 1;
pub const BIG_CASINO_POINTS: u8 = 2;
pub const LITTLE_CASINO_POINTS: u8 = 1;
pub const ACE_POINTS: u8 = 1;
pub const SWEEP_POINTS: u8 = 1;

/// What one seat took in a hand.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Default)]
pub struct Tally {
    pub cards: u8,
    pub spades: u8,
    pub aces: u8,
    pub big_casino: bool,
    pub little_casino: bool,
    pub sweeps: u8,
}

impl Tally {
    /// The tally of a capture pile and its sweeps.
    pub fn of(pile: CardSet, sweeps: u8) -> Tally {
        Tally {
            cards: pile.len() as u8,
            spades: pile.spades() as u8,
            aces: (pile & CardSet::of_rank(ACE)).len() as u8,
            big_casino: pile.contains(Card::BIG_CASINO),
            little_casino: pile.contains(Card::LITTLE_CASINO),
            sweeps,
        }
    }
}

/// One line of the count.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Item {
    Cards,
    Spades,
    BigCasino,
    LittleCasino,
    Ace(Suit),
    Sweeps,
}

/// The count of a hand: who won each item.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Breakdown {
    /// Most cards; `None` on a tie.
    pub cards: Option<Seat>,
    /// Most spades; `None` on a tie.
    pub spades: Option<Seat>,
    /// Who took Big Cassino; `None` if nobody did.
    pub big_casino: Option<Seat>,
    pub little_casino: Option<Seat>,
    /// Who took each ace, in [`ACE_ORDER`].
    pub aces: [Option<Seat>; 4],
    /// Sweeps made by each seat, scored or not.
    pub sweeps: [u8; 2],
    /// Whether sweeps scored in this game.
    pub sweeps_score: bool,
    /// Each seat's tally, for the trackers and the count's display.
    pub tallies: [Tally; 2],
}

impl Breakdown {
    /// The count of two capture piles and their sweeps.
    pub fn new(rules: &Rules, piles: [CardSet; 2], sweeps: [u8; 2]) -> Breakdown {
        let more = |a: u32, b: u32| match a.cmp(&b) {
            std::cmp::Ordering::Greater => Some(Seat::South),
            std::cmp::Ordering::Less => Some(Seat::North),
            std::cmp::Ordering::Equal => None,
        };
        let holder = |card: Card| {
            Seat::BOTH
                .into_iter()
                .find(|s| piles[s.index()].contains(card))
        };
        Breakdown {
            cards: more(piles[0].len(), piles[1].len()),
            spades: more(piles[0].spades(), piles[1].spades()),
            big_casino: holder(Card::BIG_CASINO),
            little_casino: holder(Card::LITTLE_CASINO),
            aces: ACE_ORDER.map(|suit| holder(Card::new(ACE, suit))),
            sweeps,
            sweeps_score: rules.sweeps,
            tallies: [
                Tally::of(piles[0], sweeps[0]),
                Tally::of(piles[1], sweeps[1]),
            ],
        }
    }

    /// The lines of the count in order, each with who won it and its points.
    /// An item nobody won is left out.
    pub fn lines(&self) -> Vec<(Item, Seat, u8)> {
        let mut out = Vec::new();
        let mut line = |item: Item, seat: Option<Seat>, points: u8| {
            if let Some(seat) = seat {
                out.push((item, seat, points));
            }
        };
        line(Item::Cards, self.cards, CARDS_POINTS);
        line(Item::Spades, self.spades, SPADES_POINTS);
        line(Item::BigCasino, self.big_casino, BIG_CASINO_POINTS);
        line(Item::LittleCasino, self.little_casino, LITTLE_CASINO_POINTS);
        for (suit, seat) in ACE_ORDER.into_iter().zip(self.aces) {
            line(Item::Ace(suit), seat, ACE_POINTS);
        }
        if self.sweeps_score {
            for seat in Seat::BOTH {
                let n = self.sweeps[seat.index()];
                if n > 0 {
                    line(Item::Sweeps, Some(seat), n * SWEEP_POINTS);
                }
            }
        }
        out
    }

    /// The points `seat` scored this hand.
    pub fn points(&self, seat: Seat) -> u8 {
        self.lines()
            .iter()
            .filter(|l| l.1 == seat)
            .map(|l| l.2)
            .sum()
    }

    /// The points scored by both: eleven (eight with a tie for cards), plus
    /// sweeps when they score, less any item nobody won.
    pub fn total(&self) -> u8 {
        self.lines().iter().map(|l| l.2).sum()
    }
}

/// Whether the card is one that scores on its own: an ace or a Cassino.
pub fn is_point_card(card: Card) -> bool {
    card.rank() == ACE || card == Card::BIG_CASINO || card == Card::LITTLE_CASINO
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::rules::Game;

    fn set(s: &str) -> CardSet {
        CardSet::parse(s).unwrap()
    }

    /// South takes `south`; North takes the rest of the pack.
    fn split(south: &str) -> [CardSet; 2] {
        let s = set(south);
        [s, !s]
    }

    #[test]
    fn a_tally_counts_a_pile() {
        let t = Tally::of(set("AS AH 2S TD 3S 9C"), 2);
        assert_eq!(
            t,
            Tally {
                cards: 6,
                spades: 3,
                aces: 2,
                big_casino: true,
                little_casino: true,
                sweeps: 2
            }
        );
    }

    #[test]
    fn eleven_points_a_hand() {
        // South: 30 cards with 7 spades and Big Cassino; North the rest.
        let mut south = CardSet::EMPTY;
        for c in "AS 3S 4S 5S 6S 7S 8S TD 2H 3H 4H 5H 6H 7H 8H 9H TH JH QH KH 2C 3C 4C 5C 6C 7C 8C 9C TC JC"
            .split(' ')
        {
            south.insert(c.parse().unwrap());
        }
        assert_eq!(south.len(), 30);
        let b = Breakdown::new(&Rules::CLASSIC, [south, !south], [0, 0]);
        assert_eq!(b.cards, Some(Seat::South));
        assert_eq!(b.spades, Some(Seat::South));
        assert_eq!(b.big_casino, Some(Seat::South));
        assert_eq!(b.little_casino, Some(Seat::North));
        assert_eq!(
            b.aces,
            [
                Some(Seat::South),
                Some(Seat::North),
                Some(Seat::North),
                Some(Seat::North)
            ]
        );
        assert_eq!(b.points(Seat::South), 3 + 1 + 2 + 1);
        assert_eq!(b.points(Seat::North), 1 + 3);
        assert_eq!(b.total(), 11);
    }

    #[test]
    fn a_tie_for_cards_scores_nothing() {
        // 26 each: South has the spades A-K and the hearts A-K.
        let b = Breakdown::new(
            &Rules::CLASSIC,
            split("AS 2S 3S 4S 5S 6S 7S 8S 9S TS JS QS KS AH 2H 3H 4H 5H 6H 7H 8H 9H TH JH QH KH"),
            [0, 0],
        );
        assert_eq!(b.cards, None);
        assert_eq!(b.total(), 8);
        assert!(!b.lines().iter().any(|(item, _, _)| *item == Item::Cards));
    }

    #[test]
    fn sweeps_score_one_each_when_they_score() {
        let piles = split("AS 2S 3S 4S 5S 6S 7S");
        let on = Breakdown::new(&Rules::CLASSIC, piles, [2, 1]);
        assert_eq!(on.total(), 11 + 3);
        let off_rules = Rules {
            game: Game::Classic,
            aces_fourteen: false,
            sweeps: false,
            raising: true,
        };
        let off = Breakdown::new(&off_rules, piles, [2, 1]);
        assert_eq!(off.total(), 11);
        assert_eq!(off.sweeps, [2, 1], "still recorded");
        assert!(!off.lines().iter().any(|(item, _, _)| *item == Item::Sweeps));
    }

    #[test]
    fn the_count_runs_in_fosters_order() {
        let b = Breakdown::new(&Rules::CLASSIC, split("AS AH TD 2S 3S 4S 5S 6S 7S"), [1, 1]);
        let items: Vec<Item> = b.lines().iter().map(|l| l.0).collect();
        assert_eq!(
            items,
            [
                Item::Cards,
                Item::Spades,
                Item::BigCasino,
                Item::LittleCasino,
                Item::Ace(Suit::Spades),
                Item::Ace(Suit::Clubs),
                Item::Ace(Suit::Hearts),
                Item::Ace(Suit::Diamonds),
                Item::Sweeps,
                Item::Sweeps,
            ]
        );
        let sum: u32 = b.lines().iter().map(|l| u32::from(l.2)).sum();
        assert_eq!(sum, u32::from(b.total()));
        for seat in Seat::BOTH {
            let mine: u32 = b
                .lines()
                .iter()
                .filter(|l| l.1 == seat)
                .map(|l| u32::from(l.2))
                .sum();
            assert_eq!(mine, u32::from(b.points(seat)));
        }
    }

    #[test]
    fn items_nobody_took_score_nothing() {
        // Only the residue's cards went to nobody: 4 cards including AD.
        let south = set(
            "AS 2S 3S 4S 5S 6S 7S 8S 9S TS JS QS KS 2H 3H 4H 5H 6H 7H 8H 9H TH JH QH KH 2D 3D 4D",
        );
        let north = !south - set("AD 5D 6D 7D");
        let b = Breakdown::new(&Rules::CLASSIC, [south, north], [0, 0]);
        assert_eq!(b.aces[3], None);
        assert_eq!(b.total(), 10);
    }

    #[test]
    fn point_cards() {
        assert!(is_point_card("TD".parse().unwrap()));
        assert!(is_point_card("2S".parse().unwrap()));
        assert!(is_point_card("AH".parse().unwrap()));
        assert!(!is_point_card("TS".parse().unwrap()));
    }
}
