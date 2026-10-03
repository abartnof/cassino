//! The table: loose cards and builds (`docs/RULES.md` rules 4–7).
//!
//! The core keeps no positions: where a card lies is presentation, which the
//! session derives from the order things arrived (`docs/DESIGN.md` §7.1). A
//! build is named by any card in it, since cards are unique.
//!
//! The notation, for fixtures and debugging: loose cards by code, builds in
//! brackets with their value, `*` for a multiple build, and the controller
//! (`@S` South or `@N` North, North if omitted):
//!
//! ```text
//! AC 2D [9: 6S 3H] [5* @S: 5C 3D 2H]
//! ```

use std::fmt;

use crate::cards::{Card, CardSet};
use crate::rules::Rules;
use crate::sums::{partitions_into, value_sum};

/// A player's place at the table. South is where the person sits in the
/// browser; in watch mode both seats are computer players.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum Seat {
    South = 0,
    North = 1,
}

impl Seat {
    pub const BOTH: [Seat; 2] = [Seat::South, Seat::North];

    pub fn other(self) -> Seat {
        match self {
            Seat::South => Seat::North,
            Seat::North => Seat::South,
        }
    }

    pub fn index(self) -> usize {
        self as usize
    }

    pub fn letter(self) -> char {
        match self {
            Seat::South => 'S',
            Seat::North => 'N',
        }
    }
}

/// A build on the table.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub struct Build {
    pub cards: CardSet,
    pub value: u8,
    pub multiple: bool,
    /// The last player to create it or add to it.
    pub controller: Seat,
}

impl Build {
    /// The card that names this build: its lowest.
    pub fn name(&self) -> Card {
        self.cards.first().expect("a build has cards")
    }
}

/// At most 26 builds can stand at once, two cards each.
pub const MAX_BUILDS: usize = 26;

const NO_BUILD: Build = Build {
    cards: CardSet::EMPTY,
    value: 0,
    multiple: false,
    controller: Seat::South,
};

/// The builds on the table, in the order they were made. Inline, so a
/// position copies without allocating.
#[derive(Copy, Clone)]
pub struct Builds {
    items: [Build; MAX_BUILDS],
    len: u8,
}

impl Builds {
    pub const fn new() -> Builds {
        Builds {
            items: [NO_BUILD; MAX_BUILDS],
            len: 0,
        }
    }

    pub fn len(&self) -> usize {
        self.len as usize
    }

    pub fn is_empty(&self) -> bool {
        self.len == 0
    }

    pub fn as_slice(&self) -> &[Build] {
        &self.items[..self.len()]
    }

    pub fn iter(&self) -> std::slice::Iter<'_, Build> {
        self.as_slice().iter()
    }

    pub fn push(&mut self, build: Build) {
        assert!(self.len() < MAX_BUILDS, "more builds than the pack allows");
        self.items[self.len()] = build;
        self.len += 1;
    }

    /// Removes the build at `index`, keeping the others in order.
    pub fn remove(&mut self, index: usize) -> Build {
        let n = self.len();
        assert!(index < n, "no build at {index}");
        let gone = self.items[index];
        self.items.copy_within(index + 1..n, index);
        self.items[n - 1] = NO_BUILD;
        self.len -= 1;
        gone
    }

    pub fn get_mut(&mut self, index: usize) -> &mut Build {
        let n = self.len();
        &mut self.items[..n][index]
    }

    /// The index of the build containing `card`.
    pub fn position(&self, card: Card) -> Option<usize> {
        self.iter().position(|b| b.cards.contains(card))
    }
}

impl Default for Builds {
    fn default() -> Builds {
        Builds::new()
    }
}

impl PartialEq for Builds {
    fn eq(&self, other: &Builds) -> bool {
        self.as_slice() == other.as_slice()
    }
}

impl Eq for Builds {}

impl std::hash::Hash for Builds {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.as_slice().hash(state);
    }
}

impl fmt::Debug for Builds {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.debug_list().entries(self.iter()).finish()
    }
}

impl<'a> IntoIterator for &'a Builds {
    type Item = &'a Build;
    type IntoIter = std::slice::Iter<'a, Build>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

/// Everything on the table.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, Default)]
pub struct Table {
    pub loose: CardSet,
    pub builds: Builds,
}

impl Table {
    pub const fn new() -> Table {
        Table {
            loose: CardSet::EMPTY,
            builds: Builds::new(),
        }
    }

    /// Every card on the table, loose or in a build.
    pub fn cards(&self) -> CardSet {
        self.builds.iter().fold(self.loose, |acc, b| acc | b.cards)
    }

    pub fn is_empty(&self) -> bool {
        self.loose.is_empty() && self.builds.is_empty()
    }

    /// The build containing `card`.
    pub fn build_of(&self, card: Card) -> Option<&Build> {
        self.builds.iter().find(|b| b.cards.contains(card))
    }

    /// Whether `seat` controls any build.
    pub fn controls_any(&self, seat: Seat) -> bool {
        self.builds.iter().any(|b| b.controller == seat)
    }

    /// Reads the notation in the module's documentation, checking each build
    /// against `rules`: a single build's cards total its value; a multiple
    /// build splits into two or more groups of its value.
    pub fn parse(rules: &Rules, text: &str) -> Result<Table, String> {
        let mut table = Table::new();
        let mut seen = CardSet::EMPTY;
        let take = |cards: CardSet, seen: &mut CardSet| -> Result<(), String> {
            if !seen.is_disjoint(cards) {
                return Err(format!("{} named twice", (*seen & cards).codes()));
            }
            *seen |= cards;
            Ok(())
        };
        let mut rest = text.trim_start();
        while !rest.is_empty() {
            if let Some(after) = rest.strip_prefix('[') {
                let end = after.find(']').ok_or("a build is not closed")?;
                let build = parse_build(rules, &after[..end])?;
                take(build.cards, &mut seen)?;
                table.builds.push(build);
                rest = after[end + 1..].trim_start();
            } else {
                let end = rest
                    .find(|c: char| c.is_whitespace() || c == '[')
                    .unwrap_or(rest.len());
                let card: Card = rest[..end].parse().map_err(|e| format!("{e}"))?;
                take(CardSet::single(card), &mut seen)?;
                table.loose.insert(card);
                rest = rest[end..].trim_start();
            }
        }
        Ok(table)
    }
}

/// One build's notation, without its brackets: `5* @S: 5C 3D 2H`.
fn parse_build(rules: &Rules, text: &str) -> Result<Build, String> {
    let (head, body) = text.split_once(':').ok_or("a build needs a colon")?;
    let mut words = head.split_whitespace();
    let value_word = words.next().ok_or("a build needs a value")?;
    let (value_text, multiple) = match value_word.strip_suffix('*') {
        Some(v) => (v, true),
        None => (value_word, false),
    };
    let value: u8 = value_text
        .parse()
        .map_err(|_| format!("not a build value: {value_word}"))?;
    let controller = match words.next() {
        None => Seat::North,
        Some("@S") => Seat::South,
        Some("@N") => Seat::North,
        Some(other) => return Err(format!("not a seat: {other}")),
    };
    if let Some(extra) = words.next() {
        return Err(format!("unexpected {extra}"));
    }
    let cards = CardSet::parse(body).map_err(|e| format!("{e}"))?;
    if cards.len() < 2 {
        return Err("a build has at least two cards".into());
    }
    let total = value_sum(rules, cards).ok_or("a card in the build has no value")?;
    let consistent = if multiple {
        total >= 2 * u32::from(value) && partitions_into(rules, cards, value)
    } else {
        total == u32::from(value)
    };
    if !consistent {
        return Err(format!(
            "{} is not a {} build of {value}",
            cards.codes(),
            if multiple { "multiple" } else { "single" }
        ));
    }
    Ok(Build {
        cards,
        value,
        multiple,
        controller,
    })
}

impl fmt::Display for Build {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let star = if self.multiple { "*" } else { "" };
        write!(
            f,
            "[{}{star} @{}: {}]",
            self.value,
            self.controller.letter(),
            self.cards.codes()
        )
    }
}

impl fmt::Display for Table {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let mut parts: Vec<String> = self.loose.iter().map(|c| c.to_string()).collect();
        parts.extend(self.builds.iter().map(|b| b.to_string()));
        f.write_str(&parts.join(" "))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn c(s: &str) -> Card {
        s.parse().unwrap()
    }

    fn set(s: &str) -> CardSet {
        CardSet::parse(s).unwrap()
    }

    #[test]
    fn seats() {
        assert_eq!(Seat::South.other(), Seat::North);
        assert_eq!(Seat::North.other(), Seat::South);
        assert_eq!(Seat::BOTH.map(Seat::index), [0, 1]);
    }

    #[test]
    fn parses_loose_cards_and_builds() {
        let t = Table::parse(&Rules::CLASSIC, "AC 2D [9: 6S 3H] [5* @S: 5C 3D 2H]").unwrap();
        assert_eq!(t.loose, set("AC 2D"));
        assert_eq!(t.builds.len(), 2);
        let nine = t.builds.as_slice()[0];
        assert_eq!(nine.cards, set("6S 3H"));
        assert_eq!(
            (nine.value, nine.multiple, nine.controller),
            (9, false, Seat::North)
        );
        let fives = t.builds.as_slice()[1];
        assert_eq!(fives.cards, set("5C 3D 2H"));
        assert_eq!(
            (fives.value, fives.multiple, fives.controller),
            (5, true, Seat::South)
        );
        assert_eq!(t.cards(), set("AC 2D 6S 3H 5C 3D 2H"));
        assert!(!t.is_empty());
        assert!(Table::new().is_empty());
    }

    #[test]
    fn displays_what_it_parses() {
        for text in [
            "",
            "AC 2D",
            "[9: 6S 3H]",
            "AC 2D [9: 3H 6S] [5* @S: 2H 3D 5C]",
            "7C [8 @S: 5S 3H] [8* @N: 8H AC 7D]",
        ] {
            let t = Table::parse(&Rules::CLASSIC, text).unwrap();
            let shown = t.to_string();
            assert_eq!(
                Table::parse(&Rules::CLASSIC, &shown).unwrap(),
                t,
                "{text} -> {shown}"
            );
        }
        let t = Table::parse(&Rules::CLASSIC, "2D AC [5* @S: 5C 3D 2H]").unwrap();
        assert_eq!(
            t.to_string(),
            "2D AC [5* @S: 2H 3D 5C]",
            "diamonds before clubs"
        );
    }

    #[test]
    fn rejects_inconsistent_tables() {
        let bad = [
            "AC AC",         // a card twice
            "AC [5: AC 4D]", // a card loose and in a build
            "[9: 6S 2H]",    // 8 is not 9
            "[5*: 5C 4D]",   // 9 is not two fives
            "[5*: 3C 2D]",   // one five is not a multiple build
            "[5: 5C]",       // a build of one card
            "[13: KS]",      // a Classic king has no value
            "[10: KS 3D]",   // nor in a sum
            "[9 @X: 6S 3H]", // no such seat
            "[9 6S 3H]",     // no colon
            "[9: 6S 3H",     // unclosed
            "ZZ",            // not a card
        ];
        for text in bad {
            assert!(
                Table::parse(&Rules::CLASSIC, text).is_err(),
                "{text:?} parsed"
            );
        }
        assert!(Table::parse(&Rules::ROYAL, "[13: KS]").is_err(), "one card");
        assert!(Table::parse(&Rules::ROYAL, "[13: QS AD]").is_ok());
    }

    #[test]
    fn finds_builds_by_any_card() {
        let t = Table::parse(&Rules::CLASSIC, "AC [9: 6S 3H] [5* @S: 5C 3D 2H]").unwrap();
        assert_eq!(t.build_of(c("3H")).unwrap().value, 9);
        assert_eq!(t.build_of(c("2H")).unwrap().value, 5);
        assert!(t.build_of(c("AC")).is_none());
        assert_eq!(t.builds.as_slice()[1].name(), c("2H"));
        assert!(t.controls_any(Seat::South));
        assert!(t.controls_any(Seat::North));
        let only_north = Table::parse(&Rules::CLASSIC, "[9: 6S 3H]").unwrap();
        assert!(!only_north.controls_any(Seat::South));
    }

    #[test]
    fn removing_a_build_keeps_the_others_in_order() {
        let mut t = Table::parse(&Rules::CLASSIC, "[9: 6S 3H] [8: 5S 3D] [7: 4S 3C]").unwrap();
        let gone = t.builds.remove(1);
        assert_eq!(gone.value, 8);
        let values: Vec<u8> = t.builds.iter().map(|b| b.value).collect();
        assert_eq!(values, [9, 7]);
        assert_eq!(t.builds.position(c("4S")), Some(1));
    }
}
