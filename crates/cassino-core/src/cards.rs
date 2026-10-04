//! The pack: 52 cards, and sets of them in a `u64`.
//!
//! A card's index is `suit * 13 + (rank - 1)`, suits in the order spades,
//! hearts, diamonds, clubs (`docs/DESIGN.md` §5). Spades are therefore one
//! contiguous run of 13 bits, and a spade tally is one `popcount`.
//!
//! The notation is a rank (`A 2 3 4 5 6 7 8 9 T J Q K`) and a suit
//! (`S H D C`): `TD` is the ten of diamonds. Parsing also accepts `10D` and
//! lower case; display for people uses the suit symbols, `10♦`.

use std::fmt;
use std::ops::{BitAnd, BitOr, BitOrAssign, Not, Sub};
use std::str::FromStr;

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum Suit {
    Spades = 0,
    Hearts = 1,
    Diamonds = 2,
    Clubs = 3,
}

impl Suit {
    pub const ALL: [Suit; 4] = [Suit::Spades, Suit::Hearts, Suit::Diamonds, Suit::Clubs];

    pub fn letter(self) -> char {
        ['S', 'H', 'D', 'C'][self as usize]
    }

    pub fn symbol(self) -> char {
        ['♠', '♥', '♦', '♣'][self as usize]
    }

    fn from_letter(c: char) -> Option<Suit> {
        match c.to_ascii_uppercase() {
            'S' => Some(Suit::Spades),
            'H' => Some(Suit::Hearts),
            'D' => Some(Suit::Diamonds),
            'C' => Some(Suit::Clubs),
            _ => None,
        }
    }
}

/// One card of the 52.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct Card(u8);

pub const ACE: u8 = 1;
pub const JACK: u8 = 11;
pub const QUEEN: u8 = 12;
pub const KING: u8 = 13;

const RANK_LETTERS: [char; 13] = [
    'A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K',
];

impl Card {
    /// Big Cassino, the ten of diamonds.
    pub const BIG_CASINO: Card = Card::new(10, Suit::Diamonds);
    /// Little Cassino, the two of spades.
    pub const LITTLE_CASINO: Card = Card::new(2, Suit::Spades);

    /// The card of `rank` (1 for the ace to 13 for the king) and `suit`.
    pub const fn new(rank: u8, suit: Suit) -> Card {
        assert!(rank >= 1 && rank <= 13, "rank out of range");
        Card(suit as u8 * 13 + rank - 1)
    }

    /// The card at `index`, 0 to 51.
    pub const fn from_index(index: u8) -> Card {
        assert!(index < 52, "card index out of range");
        Card(index)
    }

    pub const fn index(self) -> u8 {
        self.0
    }

    /// 1 for the ace, 2 to 10 for the pips, 11 to 13 for J, Q, K.
    pub const fn rank(self) -> u8 {
        self.0 % 13 + 1
    }

    pub fn suit(self) -> Suit {
        Suit::ALL[(self.0 / 13) as usize]
    }

    pub const fn is_court(self) -> bool {
        self.rank() >= JACK
    }

    pub const fn bit(self) -> u64 {
        1 << self.0
    }

    /// The card as people read it: `10♦`, `A♠`, `K♣`.
    pub fn label(self) -> String {
        let rank = match self.rank() {
            10 => "10".to_string(),
            r => RANK_LETTERS[(r - 1) as usize].to_string(),
        };
        format!("{rank}{}", self.suit().symbol())
    }
}

/// The protocol's code: `TD`, `AS`, `KC`.
impl fmt::Display for Card {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}{}",
            RANK_LETTERS[(self.rank() - 1) as usize],
            self.suit().letter()
        )
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParseCardError(pub String);

impl fmt::Display for ParseCardError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "not a card: {:?}", self.0)
    }
}

impl std::error::Error for ParseCardError {}

impl FromStr for Card {
    type Err = ParseCardError;

    /// `TD`, `10D`, `td`, `10d`; also the suit symbols (`10♦`).
    fn from_str(s: &str) -> Result<Card, ParseCardError> {
        let err = || ParseCardError(s.to_string());
        let t = s.trim();
        let mut chars: Vec<char> = t.chars().collect();
        let suit_char = chars.pop().ok_or_else(err)?;
        let suit = Suit::from_letter(suit_char)
            .or_else(|| Suit::ALL.into_iter().find(|s| s.symbol() == suit_char))
            .ok_or_else(err)?;
        let rank_text: String = chars.into_iter().collect::<String>().to_ascii_uppercase();
        let rank = match rank_text.as_str() {
            "10" | "T" => 10,
            r if r.chars().count() == 1 => {
                let c = r.chars().next().unwrap();
                RANK_LETTERS.iter().position(|&x| x == c).ok_or_else(err)? as u8 + 1
            }
            _ => return Err(err()),
        };
        Ok(Card::new(rank, suit))
    }
}

/// A set of cards: bit `i` is the card of index `i`.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Default)]
pub struct CardSet(pub u64);

const FULL_BITS: u64 = (1 << 52) - 1;

impl CardSet {
    pub const EMPTY: CardSet = CardSet(0);
    pub const FULL: CardSet = CardSet(FULL_BITS);
    /// The thirteen spades.
    pub const SPADES: CardSet = CardSet((1 << 13) - 1);

    pub const fn single(card: Card) -> CardSet {
        CardSet(card.bit())
    }

    /// The four cards of `rank`.
    pub const fn of_rank(rank: u8) -> CardSet {
        let r = (rank - 1) as u64;
        CardSet((1 << r) | (1 << (r + 13)) | (1 << (r + 26)) | (1 << (r + 39)))
    }

    pub const fn len(self) -> u32 {
        self.0.count_ones()
    }

    pub const fn is_empty(self) -> bool {
        self.0 == 0
    }

    pub const fn contains(self, card: Card) -> bool {
        self.0 & card.bit() != 0
    }

    /// Every card of `other` is in `self`.
    pub const fn contains_all(self, other: CardSet) -> bool {
        other.0 & !self.0 == 0
    }

    pub const fn is_disjoint(self, other: CardSet) -> bool {
        self.0 & other.0 == 0
    }

    pub fn insert(&mut self, card: Card) {
        self.0 |= card.bit();
    }

    pub fn remove(&mut self, card: Card) {
        self.0 &= !card.bit();
    }

    pub const fn with(self, card: Card) -> CardSet {
        CardSet(self.0 | card.bit())
    }

    pub const fn without(self, card: Card) -> CardSet {
        CardSet(self.0 & !card.bit())
    }

    /// The lowest-indexed card, if any.
    pub fn first(self) -> Option<Card> {
        (self.0 != 0).then(|| Card(self.0.trailing_zeros() as u8))
    }

    /// The cards in index order (spades A–K, then hearts, diamonds, clubs).
    pub fn iter(self) -> CardIter {
        CardIter(self.0)
    }

    /// How many spades.
    pub const fn spades(self) -> u32 {
        (self.0 & CardSet::SPADES.0).count_ones()
    }

    /// The protocol's codes, separated by spaces, in index order.
    pub fn codes(self) -> String {
        self.iter()
            .map(|c| c.to_string())
            .collect::<Vec<_>>()
            .join(" ")
    }

    /// The cards as people read them, separated by spaces.
    pub fn labels(self) -> String {
        self.iter().map(|c| c.label()).collect::<Vec<_>>().join(" ")
    }

    /// Parses cards separated by spaces or commas: `"TD 2S 5h"`.
    pub fn parse(s: &str) -> Result<CardSet, ParseCardError> {
        let mut set = CardSet::EMPTY;
        for word in s.split(|c: char| c.is_whitespace() || c == ',') {
            if word.is_empty() {
                continue;
            }
            let card: Card = word.parse()?;
            if set.contains(card) {
                return Err(ParseCardError(format!("{word} named twice")));
            }
            set.insert(card);
        }
        Ok(set)
    }
}

pub struct CardIter(u64);

impl Iterator for CardIter {
    type Item = Card;

    fn next(&mut self) -> Option<Card> {
        if self.0 == 0 {
            return None;
        }
        let i = self.0.trailing_zeros();
        self.0 &= self.0 - 1;
        Some(Card(i as u8))
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        let n = self.0.count_ones() as usize;
        (n, Some(n))
    }
}

impl ExactSizeIterator for CardIter {}

impl IntoIterator for CardSet {
    type Item = Card;
    type IntoIter = CardIter;

    fn into_iter(self) -> CardIter {
        self.iter()
    }
}

impl FromIterator<Card> for CardSet {
    fn from_iter<I: IntoIterator<Item = Card>>(iter: I) -> CardSet {
        let mut set = CardSet::EMPTY;
        for c in iter {
            set.insert(c);
        }
        set
    }
}

impl BitOr for CardSet {
    type Output = CardSet;
    fn bitor(self, rhs: CardSet) -> CardSet {
        CardSet(self.0 | rhs.0)
    }
}

impl BitOrAssign for CardSet {
    fn bitor_assign(&mut self, rhs: CardSet) {
        self.0 |= rhs.0;
    }
}

impl BitAnd for CardSet {
    type Output = CardSet;
    fn bitand(self, rhs: CardSet) -> CardSet {
        CardSet(self.0 & rhs.0)
    }
}

impl Sub for CardSet {
    type Output = CardSet;
    fn sub(self, rhs: CardSet) -> CardSet {
        CardSet(self.0 & !rhs.0)
    }
}

impl Not for CardSet {
    type Output = CardSet;
    /// The complement within the pack.
    fn not(self) -> CardSet {
        CardSet(!self.0 & FULL_BITS)
    }
}

impl fmt::Display for CardSet {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str(&self.codes())
    }
}

/// The whole pack in index order.
pub fn pack() -> [Card; 52] {
    std::array::from_fn(|i| Card(i as u8))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn c(s: &str) -> Card {
        s.parse().unwrap()
    }

    #[test]
    fn indices_are_suit_major() {
        assert_eq!(Card::new(1, Suit::Spades).index(), 0);
        assert_eq!(Card::new(13, Suit::Spades).index(), 12);
        assert_eq!(Card::new(1, Suit::Hearts).index(), 13);
        assert_eq!(Card::new(13, Suit::Clubs).index(), 51);
        for i in 0..52u8 {
            let card = Card::from_index(i);
            assert_eq!(Card::new(card.rank(), card.suit()), card);
        }
    }

    #[test]
    fn the_casinos_are_the_named_cards() {
        assert_eq!(Card::BIG_CASINO, c("TD"));
        assert_eq!(Card::LITTLE_CASINO, c("2S"));
    }

    #[test]
    fn codes_round_trip_for_every_card() {
        for card in pack() {
            let code = card.to_string();
            assert_eq!(code.len(), 2, "{code}");
            assert_eq!(code.parse::<Card>().unwrap(), card);
            assert_eq!(card.label().parse::<Card>().unwrap(), card);
        }
    }

    #[test]
    fn parsing_accepts_ten_lower_case_and_symbols() {
        assert_eq!(c("10D"), c("TD"));
        assert_eq!(c("td"), c("TD"));
        assert_eq!(c("10♦"), c("TD"));
        assert_eq!(c(" as "), Card::new(1, Suit::Spades));
        assert_eq!(c("kc"), Card::new(13, Suit::Clubs));
        for bad in ["", "1D", "11H", "XS", "AX", "T", "D", "10", "AAS"] {
            assert!(bad.parse::<Card>().is_err(), "{bad:?} parsed");
        }
    }

    #[test]
    fn labels_are_for_people() {
        assert_eq!(c("TD").label(), "10♦");
        assert_eq!(c("AS").label(), "A♠");
        assert_eq!(c("QH").label(), "Q♥");
        assert_eq!(c("7C").label(), "7♣");
    }

    #[test]
    fn court_cards_are_jack_queen_king() {
        let courts: Vec<String> = pack()
            .into_iter()
            .filter(|c| c.is_court())
            .map(|c| c.to_string())
            .collect();
        assert_eq!(courts.len(), 12);
        assert!(courts.iter().all(|s| matches!(&s[..1], "J" | "Q" | "K")));
    }

    #[test]
    fn sets_count_spades_and_ranks() {
        assert_eq!(CardSet::FULL.len(), 52);
        assert_eq!(CardSet::FULL.spades(), 13);
        assert_eq!(CardSet::SPADES.len(), 13);
        assert!(CardSet::SPADES.iter().all(|c| c.suit() == Suit::Spades));
        for rank in 1..=13 {
            let set = CardSet::of_rank(rank);
            assert_eq!(set.len(), 4);
            assert!(set.iter().all(|c| c.rank() == rank));
        }
        let hand = CardSet::parse("AS 2S TD KC").unwrap();
        assert_eq!(hand.spades(), 2);
        assert_eq!(hand.len(), 4);
    }

    #[test]
    fn set_operations() {
        let a = CardSet::parse("AS 2S 3S").unwrap();
        let b = CardSet::parse("3S 4S").unwrap();
        assert_eq!(a | b, CardSet::parse("AS 2S 3S 4S").unwrap());
        assert_eq!(a & b, CardSet::parse("3S").unwrap());
        assert_eq!(a - b, CardSet::parse("AS 2S").unwrap());
        assert_eq!((!a).len(), 49);
        assert!((!a).is_disjoint(a));
        assert!(a.contains_all(CardSet::parse("AS 3S").unwrap()));
        assert!(!a.contains_all(b));
        assert_eq!(
            a.with(c("4S")).without(c("AS")),
            CardSet::parse("2S 3S 4S").unwrap()
        );
        assert_eq!(a.first(), Some(c("AS")));
        assert_eq!(CardSet::EMPTY.first(), None);
    }

    #[test]
    fn iteration_is_in_index_order_and_exact() {
        let set = CardSet::parse("KC AS TD 2H").unwrap();
        let order: Vec<String> = set.iter().map(|c| c.to_string()).collect();
        assert_eq!(order, ["AS", "2H", "TD", "KC"]);
        assert_eq!(set.iter().len(), 4);
        assert_eq!(set.codes(), "AS 2H TD KC");
        assert_eq!(set.labels(), "A♠ 2♥ 10♦ K♣");
        assert_eq!(set.iter().collect::<CardSet>(), set);
    }

    #[test]
    fn parsing_a_set_rejects_duplicates_and_junk() {
        assert_eq!(CardSet::parse("").unwrap(), CardSet::EMPTY);
        assert_eq!(CardSet::parse("ts, 10s").unwrap_err().0, "10s named twice");
        assert!(CardSet::parse("AS ZZ").is_err());
        assert_eq!(CardSet::parse("as,2s  3s").unwrap().len(), 3);
    }
}
