//! Moves: generating them, checking them, and making them
//! (`docs/RULES.md` rules 3–7; `docs/DESIGN.md` §7.2–7.3).
//!
//! A capture is the set of cards it takes; builds are taken whole, so the set
//! says which builds went too, and two groupings of the same set are one
//! move. A build is (card, announced value, target, loose cards): a new build
//! has no target, an *add* announces the target's value, a *raise* announces
//! the target's value plus the card's. The three cannot collide, since a
//! card's value is at least one.
//!
//! The text form, which the protocol and the fixtures share:
//!
//! ```text
//! trail 7H
//! take 8S 8D 6C 2D          the played card, then what it takes
//! take AC=14 KS AH          an ace capturing as 14
//! build 8 3D 5C             value, played card, loose cards
//! build 9 2S on 3C 9D       ... onto the build containing 3C
//! ```

use std::fmt;

use crate::cards::{Card, CardSet};
use crate::rules::Rules;
use crate::sums::{disjoint_unions, partitions_into, subsets_summing, value_sum};
use crate::table::{Build, Seat, Table};

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum Move {
    Trail {
        card: Card,
    },
    Capture {
        card: Card,
        value: u8,
        taken: CardSet,
    },
    Build {
        card: Card,
        value: u8,
        /// The target build, named by its lowest card; `None` for a new build.
        onto: Option<Card>,
        loose: CardSet,
    },
}

impl Move {
    /// The card played from the hand.
    pub fn card(&self) -> Card {
        match *self {
            Move::Trail { card } | Move::Capture { card, .. } | Move::Build { card, .. } => card,
        }
    }

    /// Reads the text form in the module's documentation.
    pub fn parse(text: &str) -> Result<Move, String> {
        let words: Vec<&str> = text.split_whitespace().collect();
        let Some((verb, rest)) = words.split_first() else {
            return Err("an empty move".into());
        };
        let card_at = |i: usize| -> Result<Card, String> {
            let word = rest.get(i).ok_or("a card is missing")?;
            word.parse().map_err(|e| format!("{e}"))
        };
        let cards_from = |i: usize, played: Card| -> Result<CardSet, String> {
            let set =
                CardSet::parse(&rest[i.min(rest.len())..].join(" ")).map_err(|e| format!("{e}"))?;
            if set.contains(played) {
                return Err(format!("{played} is the card played"));
            }
            Ok(set)
        };
        match verb.to_ascii_lowercase().as_str() {
            "trail" => {
                if rest.len() != 1 {
                    return Err("trail names one card".into());
                }
                Ok(Move::Trail { card: card_at(0)? })
            }
            "take" => {
                let first = rest.first().ok_or("a card is missing")?;
                let (card_text, value) = match first.split_once('=') {
                    Some((c, v)) => (
                        c,
                        Some(v.parse::<u8>().map_err(|_| format!("not a value: {v}"))?),
                    ),
                    None => (*first, None),
                };
                let card: Card = card_text.parse().map_err(|e| format!("{e}"))?;
                Ok(Move::Capture {
                    card,
                    value: value.unwrap_or(card.rank()),
                    taken: cards_from(1, card)?,
                })
            }
            "build" => {
                let value_text = rest.first().ok_or("a build needs a value")?;
                let value: u8 = value_text
                    .parse()
                    .map_err(|_| format!("not a value: {value_text}"))?;
                let card = card_at(1)?;
                let (onto, from) = match rest.get(2) {
                    Some(w) if w.eq_ignore_ascii_case("on") => (Some(card_at(3)?), 4),
                    _ => (None, 2),
                };
                if rest[from.min(rest.len())..]
                    .iter()
                    .any(|w| w.eq_ignore_ascii_case("on"))
                {
                    return Err("'on' comes straight after the card played".into());
                }
                let loose = cards_from(from, card)?;
                if onto.is_some_and(|o| loose.contains(o)) {
                    return Err("the target is not a loose card".into());
                }
                Ok(Move::Build {
                    card,
                    value,
                    onto,
                    loose,
                })
            }
            other => Err(format!("not a move: {other}")),
        }
    }
}

impl fmt::Display for Move {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let tail = |set: CardSet| {
            if set.is_empty() {
                String::new()
            } else {
                format!(" {}", set.codes())
            }
        };
        match *self {
            Move::Trail { card } => write!(f, "trail {card}"),
            Move::Capture { card, value, taken } => {
                if value == card.rank() {
                    write!(f, "take {card}{}", tail(taken))
                } else {
                    write!(f, "take {card}={value}{}", tail(taken))
                }
            }
            Move::Build {
                card,
                value,
                onto,
                loose,
            } => {
                write!(f, "build {value} {card}")?;
                if let Some(o) = onto {
                    write!(f, " on {o}")?;
                }
                f.write_str(&tail(loose))
            }
        }
    }
}

/// Why a move is not legal: what the "why not?" aid says, and what a refused
/// command reports.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Illegal {
    /// The card is not in the hand.
    NotInHand,
    /// A player who controls a build may not trail (rule 6).
    ControllerCannotTrail,
    /// A capture must take something.
    NothingTaken,
    /// The card cannot capture as this value.
    CannotCaptureAs(u8),
    /// Some of these cards are not on the table.
    NotOnTable,
    /// A build is only ever taken whole (rule 4).
    PartOfABuild,
    /// This build's value is not the capturing value.
    BuildOfAnotherValue { build: u8, value: u8 },
    /// The loose cards do not split into groups of the value.
    DoesNotSplit(u8),
    /// A Classic court card takes exactly one card of its own rank.
    CourtTakesOne,
    /// A Classic court card has no value, so it never builds or sums.
    CourtHasNoValue,
    /// To build `v` you must hold another card that captures `v`.
    NotHolding(u8),
    /// No build contains the card named as the target.
    NoSuchBuild,
    /// A multiple build's value can never change (rule 5b).
    MultipleIsFixed,
    /// Loose cards can never change a single build's value (rule 5b).
    LooseCannotRaise,
    /// A new build needs at least one card from the table (rule 5a).
    BuildNeedsTableCards,
    /// The cards do not make this value in any way rule 5 allows.
    DoesNotMake(u8),
    /// The move would leave a build you control without its card (rule 7).
    LeavesBuildUnguarded(u8),
    /// The hand is over: there is nothing left to play.
    HandIsOver,
}

impl fmt::Display for Illegal {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Illegal::NotInHand => write!(f, "That card is not in your hand."),
            Illegal::ControllerCannotTrail => write!(
                f,
                "You control a build, so you can't trail: capture, build, or add to a build."
            ),
            Illegal::NothingTaken => write!(f, "A capture must take something."),
            Illegal::CannotCaptureAs(v) => write!(f, "That card can't capture as {v}."),
            Illegal::NotOnTable => write!(f, "Some of those cards aren't on the table."),
            Illegal::PartOfABuild => write!(f, "A build is only ever taken whole, never split."),
            Illegal::BuildOfAnotherValue { build, value } => write!(
                f,
                "That is a build of {build}, so only a {build} can take it, not a {value}."
            ),
            Illegal::DoesNotSplit(v) => write!(f, "Those cards don't make groups of {v}."),
            Illegal::CourtTakesOne => {
                write!(f, "A court card takes exactly one card of its own rank.")
            }
            Illegal::CourtHasNoValue => write!(
                f,
                "In Classic Cassino court cards have no number, so they are never built or added up."
            ),
            Illegal::NotHolding(14) => {
                write!(f, "To build 14 you must hold an ace to take it with.")
            }
            Illegal::NotHolding(v) => {
                write!(f, "To build {v} you must hold another card that can take {v}.")
            }
            Illegal::NoSuchBuild => write!(f, "There is no build there."),
            Illegal::MultipleIsFixed => write!(f, "A multiple build's value can never change."),
            Illegal::LooseCannotRaise => write!(
                f,
                "Loose cards can't change a single build's value; only the card you play can."
            ),
            Illegal::BuildNeedsTableCards => write!(f, "A build needs a card from the table."),
            Illegal::DoesNotMake(v) => write!(f, "Those cards don't make a build of {v}."),
            Illegal::LeavesBuildUnguarded(v) => write!(
                f,
                "That would leave you without a card to take your build of {v}."
            ),
            Illegal::HandIsOver => write!(f, "The hand is over."),
        }
    }
}

/// What a move did.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Played {
    /// The cards won, the played card among them; empty unless a capture.
    pub won: CardSet,
    /// The capture left the table empty.
    pub swept: bool,
}

/// Every legal move for `me` holding `hand`, in a fixed order.
pub fn legal_moves(rules: &Rules, table: &Table, hand: CardSet, me: Seat) -> Vec<Move> {
    let controls = table.controls_any(me);
    // The loose groups of each value, and their disjoint unions, built once.
    let mut unions: [Option<Vec<CardSet>>; 15] = Default::default();
    let mut unions_of = |v: u8| -> Vec<CardSet> {
        unions[v as usize]
            .get_or_insert_with(|| disjoint_unions(&subsets_summing(rules, table.loose, v)))
            .clone()
    };
    let mut out = Vec::new();
    for card in hand {
        let rest = hand.without(card);
        let mut mine = Vec::new();
        if !controls {
            mine.push(Move::Trail { card });
        }
        for &value in rules.capture_values(card) {
            if rules.pairs_only(card) {
                for f in table.loose & CardSet::of_rank(card.rank()) {
                    mine.push(Move::Capture {
                        card,
                        value,
                        taken: CardSet::single(f),
                    });
                }
                continue;
            }
            let builds: Vec<CardSet> = table
                .builds
                .iter()
                .filter(|b| b.value == value)
                .map(|b| b.cards)
                .collect();
            for loose in unions_of(value) {
                for whole in disjoint_unions(&builds) {
                    let taken = loose | whole;
                    if !taken.is_empty() {
                        mine.push(Move::Capture { card, value, taken });
                    }
                }
            }
        }
        if let Some(x) = rules.build_value(card) {
            for value in x.max(1)..=rules.max_build() {
                if !rules.holds_value(rest, value) {
                    continue;
                }
                let groups = unions_of(value);
                let parts: Vec<CardSet> = if value == x {
                    vec![CardSet::EMPTY]
                } else {
                    subsets_summing(rules, table.loose, value - x)
                };
                // New builds, and additions to builds of this value.
                for &s0 in &parts {
                    for &u in groups.iter().filter(|u| u.is_disjoint(s0)) {
                        let loose = s0 | u;
                        if !loose.is_empty() {
                            mine.push(Move::Build {
                                card,
                                value,
                                onto: None,
                                loose,
                            });
                        }
                        for b in table.builds.iter().filter(|b| b.value == value) {
                            mine.push(Move::Build {
                                card,
                                value,
                                onto: Some(b.name()),
                                loose,
                            });
                        }
                    }
                }
                // Raises of single builds to this value.
                for b in table.builds.iter() {
                    if !b.multiple && b.value + x == value {
                        for &u in &groups {
                            mine.push(Move::Build {
                                card,
                                value,
                                onto: Some(b.name()),
                                loose: u,
                            });
                        }
                    }
                }
            }
        }
        mine.sort_unstable();
        mine.dedup();
        out.extend(
            mine.into_iter()
                .filter(|m| guarded(rules, table, rest, me, m).is_ok()),
        );
    }
    out
}

/// Rule 7 after `mv`: every build `me` still controls, other than one the
/// move takes or changes, has its card in `rest` (the hand without the card
/// played). A build move's own value is the held-value requirement of rule 5,
/// checked where the move is made.
fn guarded(
    rules: &Rules,
    table: &Table,
    rest: CardSet,
    me: Seat,
    mv: &Move,
) -> Result<(), Illegal> {
    let gone = match *mv {
        Move::Trail { .. } => CardSet::EMPTY,
        Move::Capture { taken, .. } => taken,
        Move::Build { onto, .. } => onto
            .and_then(|o| table.build_of(o))
            .map_or(CardSet::EMPTY, |b| b.cards),
    };
    let unguarded = table.builds.iter().find(|b| {
        b.controller == me && b.cards.is_disjoint(gone) && !rules.holds_value(rest, b.value)
    });
    match unguarded {
        Some(b) => Err(Illegal::LeavesBuildUnguarded(b.value)),
        None => Ok(()),
    }
}

/// The kind of build a build move makes, if rule 5 allows it: whether the
/// result is multiple. `x` is the played card's value.
fn resulting_multiple(
    rules: &Rules,
    target: Option<&Build>,
    x: u8,
    value: u8,
    loose: CardSet,
) -> Result<bool, Illegal> {
    let loose_total = value_sum(rules, loose).ok_or(Illegal::CourtHasNoValue)?;
    let v = u32::from(value);
    // Some part of the loose cards goes with the card to make the value, and
    // the rest splits into groups of it.
    let part_and_groups = || {
        let parts = if value == x {
            vec![CardSet::EMPTY]
        } else if value > x {
            subsets_summing(rules, loose, value - x)
        } else {
            vec![]
        };
        parts
            .into_iter()
            .any(|s0| partitions_into(rules, loose - s0, value))
    };
    match target {
        None => {
            if loose.is_empty() {
                Err(Illegal::BuildNeedsTableCards)
            } else if u32::from(x) + loose_total == v {
                Ok(false)
            } else if part_and_groups() {
                Ok(true)
            } else {
                Err(Illegal::DoesNotMake(value))
            }
        }
        Some(b) => {
            if u32::from(b.value) + u32::from(x) == v {
                if b.multiple {
                    Err(Illegal::MultipleIsFixed)
                } else if partitions_into(rules, loose, value) {
                    Ok(!loose.is_empty())
                } else {
                    Err(Illegal::DoesNotMake(value))
                }
            } else if b.value == value {
                if part_and_groups() {
                    Ok(true)
                } else {
                    Err(Illegal::DoesNotMake(value))
                }
            } else if b.multiple {
                Err(Illegal::MultipleIsFixed)
            } else if value > b.value + x
                && !subsets_summing(rules, loose, value - b.value - x).is_empty()
            {
                // The card and some loose cards would make the value: the
                // loose cards would be changing a single build.
                Err(Illegal::LooseCannotRaise)
            } else {
                Err(Illegal::DoesNotMake(value))
            }
        }
    }
}

/// Whether `mv` is legal, and if not, why. A build may be named by any of
/// its cards.
pub fn check(
    rules: &Rules,
    table: &Table,
    hand: CardSet,
    me: Seat,
    mv: &Move,
) -> Result<(), Illegal> {
    let card = mv.card();
    if !hand.contains(card) {
        return Err(Illegal::NotInHand);
    }
    let rest = hand.without(card);
    match *mv {
        Move::Trail { .. } => {
            if table.controls_any(me) {
                return Err(Illegal::ControllerCannotTrail);
            }
        }
        Move::Capture { value, taken, .. } => {
            if !rules.capture_values(card).contains(&value) {
                return Err(Illegal::CannotCaptureAs(value));
            }
            if taken.is_empty() {
                return Err(Illegal::NothingTaken);
            }
            if !table.cards().contains_all(taken) {
                return Err(Illegal::NotOnTable);
            }
            let mut loose = taken;
            for b in table.builds.iter().filter(|b| !b.cards.is_disjoint(taken)) {
                if !taken.contains_all(b.cards) {
                    return Err(Illegal::PartOfABuild);
                }
                loose = loose - b.cards;
            }
            if rules.pairs_only(card) {
                let one_of_rank = loose == taken
                    && loose.len() == 1
                    && loose.first().is_some_and(|f| f.rank() == card.rank());
                if !one_of_rank {
                    return Err(Illegal::CourtTakesOne);
                }
            } else {
                if let Some(b) = table
                    .builds
                    .iter()
                    .find(|b| taken.contains_all(b.cards) && b.value != value)
                {
                    return Err(Illegal::BuildOfAnotherValue {
                        build: b.value,
                        value,
                    });
                }
                if value_sum(rules, loose).is_none() {
                    return Err(Illegal::CourtHasNoValue);
                }
                if !partitions_into(rules, loose, value) {
                    return Err(Illegal::DoesNotSplit(value));
                }
            }
        }
        Move::Build {
            value, onto, loose, ..
        } => {
            let x = rules.build_value(card).ok_or(Illegal::CourtHasNoValue)?;
            if !table.cards().contains_all(loose) {
                return Err(Illegal::NotOnTable);
            }
            if !table.loose.contains_all(loose) {
                return Err(Illegal::PartOfABuild);
            }
            let target = match onto {
                None => None,
                Some(o) => Some(table.build_of(o).ok_or(Illegal::NoSuchBuild)?),
            };
            resulting_multiple(rules, target, x, value, loose)?;
            if !rules.holds_value(rest, value) {
                return Err(Illegal::NotHolding(value));
            }
        }
    }
    guarded(rules, table, rest, me, mv)
}

/// What a build move does to the table.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum BuildKind {
    /// A new build from the card and loose cards.
    New,
    /// A single build raised from the value `from`.
    Raise { from: u8 },
    /// Cards added to a build at its value, making it multiple.
    Add,
}

/// The kind of a build move, and whether the build it leaves is multiple;
/// `None` if it is not a build rule 5 allows (whatever else is wrong with it).
pub fn build_kind(rules: &Rules, table: &Table, mv: &Move) -> Option<(BuildKind, bool)> {
    let Move::Build {
        card,
        value,
        onto,
        loose,
    } = *mv
    else {
        return None;
    };
    let x = rules.build_value(card)?;
    let target = match onto {
        None => None,
        Some(o) => Some(table.build_of(o)?),
    };
    let multiple = resulting_multiple(rules, target, x, value, loose).ok()?;
    let kind = match target {
        None => BuildKind::New,
        Some(b) if !b.multiple && b.value + x == value => BuildKind::Raise { from: b.value },
        Some(_) => BuildKind::Add,
    };
    Some((kind, multiple))
}

/// The groups a legal capture takes, for narration and animation
/// (`docs/DESIGN.md` §7.4): single cards that pair first, then whole builds,
/// then sums from the fewest cards up. Deterministic, so the table talk and
/// the cards' flight always agree.
pub fn groups(rules: &Rules, table: &Table, mv: &Move) -> Vec<CardSet> {
    let Move::Capture { card, value, taken } = *mv else {
        return Vec::new();
    };
    let builds: Vec<CardSet> = table
        .builds
        .iter()
        .filter(|b| taken.contains_all(b.cards))
        .map(|b| b.cards)
        .collect();
    let mut loose = builds.iter().fold(taken, |acc, &b| acc - b);
    if rules.pairs_only(card) {
        return vec![loose];
    }
    let singles: Vec<CardSet> = loose
        .iter()
        .filter(|&c| rules.build_value(c) == Some(value))
        .map(CardSet::single)
        .collect();
    for s in &singles {
        loose = loose - *s;
    }
    let mut sums = smallest_partition(rules, loose, value).unwrap_or_default();
    // Fewest cards first; among equals, the one with the highest card first.
    let top = |g: &CardSet| {
        g.iter()
            .filter_map(|c| rules.build_value(c))
            .max()
            .unwrap_or(0)
    };
    sums.sort_by(|a, b| {
        a.len()
            .cmp(&b.len())
            .then(top(b).cmp(&top(a)))
            .then(a.cmp(b))
    });
    singles.into_iter().chain(builds).chain(sums).collect()
}

/// A split of `set` into groups of `v`, trying the smallest groups first.
fn smallest_partition(rules: &Rules, set: CardSet, v: u8) -> Option<Vec<CardSet>> {
    let Some(lowest) = set.first() else {
        return Some(Vec::new());
    };
    let mut options: Vec<CardSet> = subsets_summing(rules, set, v)
        .into_iter()
        .filter(|g| g.contains(lowest))
        .collect();
    options.sort_by_key(|g| (g.len(), *g));
    options.into_iter().find_map(|g| {
        let mut rest = smallest_partition(rules, set - g, v)?;
        rest.push(g);
        Some(rest)
    })
}

/// Makes a move already known to be legal.
pub fn apply(rules: &Rules, table: &mut Table, hand: &mut CardSet, me: Seat, mv: &Move) -> Played {
    let card = mv.card();
    hand.remove(card);
    match *mv {
        Move::Trail { .. } => {
            table.loose.insert(card);
            Played {
                won: CardSet::EMPTY,
                swept: false,
            }
        }
        Move::Capture { taken, .. } => {
            table.loose = table.loose - taken;
            let mut i = 0;
            while i < table.builds.len() {
                if taken.contains_all(table.builds.as_slice()[i].cards) {
                    table.builds.remove(i);
                } else {
                    i += 1;
                }
            }
            Played {
                won: taken.with(card),
                swept: table.is_empty(),
            }
        }
        Move::Build {
            value, onto, loose, ..
        } => {
            let x = rules.build_value(card).expect("a legal build");
            let index = onto.and_then(|o| table.builds.position(o));
            let target = index.map(|i| table.builds.as_slice()[i]);
            let multiple =
                resulting_multiple(rules, target.as_ref(), x, value, loose).expect("a legal build");
            table.loose = table.loose - loose;
            let cards = loose.with(card);
            match index {
                None => table.builds.push(Build {
                    cards,
                    value,
                    multiple,
                    controller: me,
                }),
                Some(i) => {
                    let b = table.builds.get_mut(i);
                    b.cards |= cards;
                    b.value = value;
                    b.multiple = multiple;
                    b.controller = me;
                }
            }
            Played {
                won: CardSet::EMPTY,
                swept: false,
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::reference;
    use crate::rules::Game;

    const ROYAL_14: Rules = Rules {
        game: Game::Royal,
        aces_fourteen: true,
        sweeps: true,
    };

    fn c(s: &str) -> Card {
        s.parse().unwrap()
    }

    fn set(s: &str) -> CardSet {
        CardSet::parse(s).unwrap()
    }

    fn mv(s: &str) -> Move {
        Move::parse(s).unwrap_or_else(|e| panic!("{s}: {e}"))
    }

    /// A position: South to move, holding `hand`.
    struct Pos {
        rules: Rules,
        table: Table,
        hand: CardSet,
    }

    fn pos(rules: Rules, table: &str, hand: &str) -> Pos {
        Pos {
            rules,
            table: Table::parse(&rules, table).unwrap(),
            hand: set(hand),
        }
    }

    impl Pos {
        fn legal(&self) -> Vec<Move> {
            legal_moves(&self.rules, &self.table, self.hand, Seat::South)
        }

        fn legal_with(&self, card: &str) -> Vec<Move> {
            let card = c(card);
            self.legal()
                .into_iter()
                .filter(|m| m.card() == card)
                .collect()
        }

        fn check(&self, text: &str) -> Result<(), Illegal> {
            check(&self.rules, &self.table, self.hand, Seat::South, &mv(text))
        }

        fn assert_legal(&self, text: &str) {
            assert_eq!(self.check(text), Ok(()), "{text}");
            assert!(
                self.legal().contains(&normal(&self.table, mv(text))),
                "{text} not generated"
            );
        }

        fn assert_illegal(&self, text: &str, why: Illegal) {
            assert_eq!(self.check(text), Err(why), "{text}");
            assert!(
                !self.legal().contains(&normal(&self.table, mv(text))),
                "{text} generated"
            );
        }

        /// Plays `text`, checking it first.
        fn play(&mut self, text: &str) -> Played {
            let m = mv(text);
            assert_eq!(self.check(text), Ok(()), "{text}");
            apply(
                &self.rules,
                &mut self.table,
                &mut self.hand,
                Seat::South,
                &m,
            )
        }
    }

    /// The move with its target named by the build's lowest card.
    fn normal(table: &Table, m: Move) -> Move {
        match m {
            Move::Build {
                card,
                value,
                onto: Some(o),
                loose,
            } => Move::Build {
                card,
                value,
                onto: table.build_of(o).map(Build::name).or(Some(o)),
                loose,
            },
            m => m,
        }
    }

    fn texts(moves: &[Move]) -> Vec<String> {
        let mut t: Vec<String> = moves.iter().map(|m| m.to_string()).collect();
        t.sort();
        t
    }

    // ---------------------------------------------------- the text form

    #[test]
    fn the_text_form_round_trips() {
        for text in [
            "trail 7H",
            "take 8S 2D 6C 8D",
            "take AC=14 KS AH",
            "build 8 3D 5C",
            "build 9 2S on 3C 9D",
            "build 8 2H on 3S",
        ] {
            let m = mv(text);
            assert_eq!(Move::parse(&m.to_string()), Ok(m), "{text}");
        }
        assert_eq!(mv("take 8S 8D 6C 2D").to_string(), "take 8S 2D 8D 6C");
        assert_eq!(mv("take AC=1 AH"), mv("take AC AH"));
        assert_eq!(mv("TAKE ac=14 ks ah"), mv("take AC=14 KS AH"));
        for bad in [
            "",
            "trail",
            "trail 7H 8H",
            "take",
            "take 8S 8S",
            "take 8S=x 8D",
            "build 8",
            "build x 3D 5C",
            "build 8 3D on",
            "build 8 3D 5C on 4C",
            "pass",
        ] {
            assert!(Move::parse(bad).is_err(), "{bad:?} parsed");
        }
    }

    // ---------------------------------------------- RULES.md, W1 to W20

    #[test]
    fn w1_several_groups_at_once() {
        let p = pos(Rules::CLASSIC, "AC 2D 3H 5S 6C 8D", "8S");
        p.assert_legal("take 8S 8D 6C 2D 5S 3H");
        p.assert_legal("take 8S 8D 5S 2D AC");
        p.assert_legal("take 8S 8D");
        p.assert_legal("take 8S 6C 2D");
        p.assert_illegal("take 8S AC 2D 3H 5S 6C 8D", Illegal::DoesNotSplit(8));
        // The non-empty unions of disjoint groups among 8, 6+2, 5+3, 5+2+A.
        let captures = p
            .legal_with("8S")
            .into_iter()
            .filter(|m| matches!(m, Move::Capture { .. }));
        assert_eq!(captures.count(), 9);
    }

    #[test]
    fn w2_matching_court_cards() {
        let classic = pos(Rules::CLASSIC, "QS QH", "QD 5C");
        classic.assert_legal("take QD QS");
        classic.assert_legal("take QD QH");
        classic.assert_illegal("take QD QS QH", Illegal::CourtTakesOne);
        let royal = pos(Rules::ROYAL, "QS QH", "QD 5C");
        royal.assert_legal("take QD QS QH");
        royal.assert_legal("take QD QS");
    }

    #[test]
    fn w3_a_single_build() {
        let mut p = pos(Rules::CLASSIC, "5C", "3D 8S");
        p.play("build 8 3D 5C");
        assert_eq!(p.table.to_string(), "[8 @S: 3D 5C]");
        assert_eq!(p.hand, set("8S"));
    }

    #[test]
    fn w4_one_card_several_uses() {
        let p = pos(Rules::CLASSIC, "AC 2D", "3H 3S 6D");
        assert_eq!(
            texts(&p.legal_with("3H")),
            [
                "build 3 3H 2D AC",
                "build 6 3H 2D AC",
                "take 3H 2D AC",
                "trail 3H"
            ]
        );
        p.assert_illegal("build 4 3H AC", Illegal::NotHolding(4));
        p.assert_illegal("build 5 3H 2D", Illegal::NotHolding(5));
        assert_eq!(texts(&p.legal_with("6D")), ["trail 6D"]);
        assert_eq!(p.legal().len(), 9);
    }

    #[test]
    fn w5_a_five_card_multiple_build() {
        let mut p = pos(Rules::CLASSIC, "3D 4S 5H 7C", "2C 7D");
        p.assert_legal("build 7 2C 5H 3D 4S 7C");
        p.assert_legal("build 7 2C 5H");
        p.assert_legal("build 7 2C 5H 7C");
        p.play("build 7 2C 5H 3D 4S 7C");
        assert_eq!(p.table.to_string(), "[7* @S: 4S 5H 3D 2C 7C]");
    }

    #[test]
    fn w6_taking_a_build_with_loose_cards() {
        let mut p = pos(Rules::CLASSIC, "[9: 6S 3H] 5D 4C", "9C");
        let played = p.play("take 9C 6S 3H 5D 4C");
        assert_eq!(played.won, set("9C 6S 3H 5D 4C"));
        assert!(played.swept);
        assert!(p.table.is_empty());
    }

    #[test]
    fn w7_a_build_is_not_a_card() {
        let p = pos(Rules::CLASSIC, "[7: 4H 3S] 2D", "9S");
        p.assert_illegal(
            "take 9S 4H 3S 2D",
            Illegal::BuildOfAnotherValue { build: 7, value: 9 },
        );
        assert_eq!(texts(&p.legal()), ["trail 9S"]);
    }

    #[test]
    fn w8_two_fives() {
        let both = pos(Rules::CLASSIC, "5H", "5S TC 5D");
        both.assert_legal("build 10 5S 5H");
        both.assert_legal("build 5 5S 5H");
        pos(Rules::CLASSIC, "5H", "5S TC").assert_illegal("build 5 5S 5H", Illegal::NotHolding(5));
        pos(Rules::CLASSIC, "5H", "5S 5D")
            .assert_illegal("build 10 5S 5H", Illegal::NotHolding(10));
        // Announced as ten, a five cannot take it.
        let after = pos(Rules::CLASSIC, "[10: 5S 5H]", "5D");
        after.assert_illegal(
            "take 5D 5S 5H",
            Illegal::BuildOfAnotherValue {
                build: 10,
                value: 5,
            },
        );
    }

    #[test]
    fn w9_raised_twice() {
        let mut south = pos(Rules::CLASSIC, "[6: 3S 3D]", "2H 8C");
        south.play("build 8 2H on 3S");
        assert_eq!(south.table.to_string(), "[8 @S: 3S 2H 3D]");
        let north_hand = set("AD 9S");
        let raise = mv("build 9 AD on 2H");
        assert_eq!(
            check(
                &Rules::CLASSIC,
                &south.table,
                north_hand,
                Seat::North,
                &raise
            ),
            Ok(())
        );
        let mut table = south.table;
        let mut hand = north_hand;
        apply(&Rules::CLASSIC, &mut table, &mut hand, Seat::North, &raise);
        assert_eq!(table.to_string(), "[9 @N: 3S 2H AD 3D]");
    }

    #[test]
    fn w10_no_loose_cards_in_a_raise() {
        let p = pos(Rules::CLASSIC, "[5: AS 4D] 2C", "3H 8D TS");
        p.assert_legal("build 8 3H on AS");
        p.assert_illegal("build 10 3H on AS 2C", Illegal::LooseCannotRaise);
    }

    #[test]
    fn w11_raising_and_absorbing() {
        let mut p = pos(Rules::CLASSIC, "[7: 3C 4H] 9D", "2S 9C");
        p.play("build 9 2S on 3C 9D");
        assert_eq!(p.table.to_string(), "[9* @S: 2S 4H 9D 3C]");
    }

    #[test]
    fn w12_adding_with_a_loose_card() {
        let mut p = pos(Rules::CLASSIC, "[8: 5S 3H] 6D", "2C 8H");
        p.play("build 8 2C on 3H 6D");
        assert_eq!(p.table.to_string(), "[8* @S: 5S 3H 6D 2C]");
    }

    #[test]
    fn w13_the_controller() {
        let p = pos(Rules::CLASSIC, "[8 @S: 5S 3H] 8D", "8C 4D");
        p.assert_illegal("trail 4D", Illegal::ControllerCannotTrail);
        p.assert_illegal("take 8C 8D", Illegal::LeavesBuildUnguarded(8));
        p.assert_legal("take 8C 5S 3H");
        p.assert_legal("take 8C 5S 3H 8D");
        assert_eq!(texts(&p.legal()), ["take 8C 5S 3H", "take 8C 5S 3H 8D"]);
    }

    #[test]
    fn w14_a_multiple_build_is_fixed() {
        let p = pos(Rules::CLASSIC, "[5*: 5C 3D 2H]", "AS 6D");
        p.assert_illegal("build 6 AS on 2H", Illegal::MultipleIsFixed);
    }

    #[test]
    fn w15_royal_court_values() {
        let royal = pos(Rules::ROYAL, "AS JD 7C 5H", "QD");
        royal.assert_legal("take QD AS JD");
        royal.assert_legal("take QD 7C 5H");
        royal.assert_legal("take QD AS JD 7C 5H");
        assert_eq!(
            texts(&pos(Rules::CLASSIC, "AS JD 7C 5H", "QD").legal()),
            ["trail QD"]
        );
    }

    #[test]
    fn w16_an_ace_as_fourteen() {
        let p = pos(ROYAL_14, "KS AH", "AC");
        p.assert_legal("take AC=14 KS AH");
        p.assert_legal("take AC AH");
        p.assert_illegal("take AC=14 AH", Illegal::DoesNotSplit(14));
        pos(Rules::ROYAL, "KS AH", "AC")
            .assert_illegal("take AC=14 KS AH", Illegal::CannotCaptureAs(14));
    }

    #[test]
    fn w17_an_ace_takes_eight_five_ace() {
        pos(ROYAL_14, "8S 5D AH", "AC").assert_legal("take AC=14 8S 5D AH");
    }

    #[test]
    fn w18_court_cards_in_builds() {
        let classic = pos(Rules::CLASSIC, "2D", "JC KH");
        classic.assert_illegal("build 13 JC 2D", Illegal::CourtHasNoValue);
        assert_eq!(texts(&classic.legal()), ["trail JC", "trail KH"]);
        pos(Rules::ROYAL, "2D", "JC KH").assert_legal("build 13 JC 2D");
    }

    #[test]
    fn w19_a_capture_that_empties_the_table_is_a_sweep() {
        let mut p = pos(Rules::CLASSIC, "3H 4D", "7S 9C");
        let played = p.play("take 7S 3H 4D");
        assert!(played.swept);
        assert_eq!(played.won, set("7S 3H 4D"));
        let mut q = pos(Rules::CLASSIC, "3H 4D 9D", "7S 9C");
        assert!(!q.play("take 7S 3H 4D").swept);
    }

    #[test]
    fn w20_trailing_a_card_that_could_capture() {
        pos(Rules::CLASSIC, "5D", "5C").assert_legal("trail 5C");
    }

    // ------------------------------------------------- narration groups

    #[test]
    fn groups_pair_first_then_builds_then_the_smallest_sums() {
        let p = pos(Rules::CLASSIC, "AC 2D 3H 5S 6C 8D", "8S");
        let g = groups(&p.rules, &p.table, &mv("take 8S 8D 6C 2D 5S 3H"));
        assert_eq!(g, vec![set("8D"), set("2D 6C"), set("3H 5S")]);
        let g = groups(&p.rules, &p.table, &mv("take 8S 8D 5S 2D AC"));
        assert_eq!(g, vec![set("8D"), set("AC 2D 5S")]);
        let q = pos(Rules::CLASSIC, "[9: 6S 3H] 5D 4C 9D", "9C");
        let g = groups(&q.rules, &q.table, &mv("take 9C 6S 3H 5D 4C 9D"));
        assert_eq!(g, vec![set("9D"), set("6S 3H"), set("5D 4C")]);
        let c = pos(Rules::CLASSIC, "QS QH", "QD");
        assert_eq!(
            groups(&c.rules, &c.table, &mv("take QD QH")),
            vec![set("QH")]
        );
        assert!(groups(&c.rules, &c.table, &mv("trail QD")).is_empty());
    }

    #[test]
    fn groups_always_partition_the_capture() {
        for rules in [Rules::CLASSIC, Rules::ROYAL, ROYAL_14] {
            for seed in 0..300 {
                let (table, hand) = reference::random_position(&rules, seed);
                for m in legal_moves(&rules, &table, hand, Seat::South) {
                    if let Move::Capture { value, taken, card } = m {
                        let g = groups(&rules, &table, &m);
                        let union = g.iter().fold(CardSet::EMPTY, |a, &b| a | b);
                        assert_eq!(union, taken, "{m}");
                        assert_eq!(
                            g.iter().map(|x| x.len()).sum::<u32>(),
                            taken.len(),
                            "{m}: disjoint"
                        );
                        for grp in &g {
                            let is_build = table.builds.iter().any(|b| b.cards == *grp);
                            let sums =
                                crate::sums::value_sum(&rules, *grp) == Some(u32::from(value));
                            let pairs = rules.pairs_only(card) && grp.len() == 1;
                            assert!(is_build || sums || pairs, "{m}: {grp}");
                        }
                    }
                }
            }
        }
    }

    // ------------------------------------------------- beyond the examples

    #[test]
    fn a_trail_puts_the_card_on_the_table() {
        let mut p = pos(Rules::CLASSIC, "5D", "7C 2H");
        let played = p.play("trail 7C");
        assert_eq!(
            played,
            Played {
                won: CardSet::EMPTY,
                swept: false
            }
        );
        assert_eq!(p.table.to_string(), "5D 7C");
        assert_eq!(p.hand, set("2H"));
    }

    #[test]
    fn a_capture_cannot_take_what_is_not_there_or_split_a_build() {
        let p = pos(Rules::CLASSIC, "[8: 5S 3H] 8D", "8C 9C");
        p.assert_illegal("take 8C 8H", Illegal::NotOnTable);
        p.assert_illegal("take 8C 5S", Illegal::PartOfABuild);
        p.assert_illegal("take 8C", Illegal::NothingTaken);
        p.assert_illegal("take 7C 8D", Illegal::NotInHand);
        p.assert_illegal("take 8C=9 8D", Illegal::CannotCaptureAs(9));
    }

    #[test]
    fn builds_need_a_table_card_a_target_and_a_held_value() {
        let p = pos(Rules::CLASSIC, "[6: 4S 2H] 3D", "3C 9C 6C");
        p.assert_illegal("build 3 3C", Illegal::BuildNeedsTableCards);
        p.assert_illegal("build 9 3C on 5H", Illegal::NoSuchBuild);
        p.assert_legal("build 9 3C on 4S");
        p.assert_legal("build 6 3C on 2H 3D");
        p.assert_illegal("build 7 3C on 4S", Illegal::DoesNotMake(7));
    }

    #[test]
    fn a_raise_keeps_a_build_single_and_takes_control() {
        let mut p = pos(Rules::CLASSIC, "[6 @N: 4S 2H]", "3C 9C");
        p.play("build 9 3C on 2H");
        let b = p.table.builds.as_slice()[0];
        assert_eq!((b.value, b.multiple, b.controller), (9, false, Seat::South));
    }

    #[test]
    fn adding_a_card_of_the_value_makes_a_build_multiple() {
        let mut p = pos(Rules::CLASSIC, "[8 @N: 5S 3H]", "8C 8D");
        p.play("build 8 8C on 3H");
        assert_eq!(p.table.to_string(), "[8* @S: 5S 3H 8C]");
    }

    #[test]
    fn two_builds_of_one_value_may_stand_and_fall_together() {
        let mut p = pos(Rules::CLASSIC, "[8 @N: 5S 3H] 6D", "2C 8D 4H");
        p.assert_legal("build 8 2C 6D");
        p.play("build 8 2C 6D");
        assert_eq!(p.table.builds.len(), 2);
        let played = p.play("take 8D 5S 3H 2C 6D");
        assert!(played.swept);
    }

    #[test]
    fn the_ace_as_fourteen_builds_fourteen_only_as_one() {
        // K + A from the table is 14, captured by an ace as 14.
        let p = pos(ROYAL_14, "KS", "AC AD");
        p.assert_legal("build 14 AC KS");
        // An ace played as 14 cannot stand alone in a build.
        let q = pos(ROYAL_14, "KS AH", "AC AD");
        q.assert_illegal("build 14 AC KS AH", Illegal::DoesNotMake(14));
    }

    // ------------------------------------------- against the reference

    #[test]
    fn matches_the_reference_on_random_positions() {
        for rules in [Rules::CLASSIC, Rules::ROYAL, ROYAL_14] {
            for seed in 0..400 {
                let (table, hand) = reference::random_position(&rules, seed);
                let mut fast = legal_moves(&rules, &table, hand, Seat::South);
                fast.sort();
                let mut slow = reference::legal_moves(&rules, &table, hand, Seat::South);
                slow.sort();
                assert_eq!(
                    texts(&fast),
                    texts(&slow),
                    "{rules:?} seed {seed}: {table} / {hand}"
                );
                for m in &slow {
                    assert_eq!(check(&rules, &table, hand, Seat::South, m), Ok(()), "{m}");
                }
            }
        }
    }

    #[test]
    fn check_agrees_with_the_reference_on_candidate_moves() {
        // Including the illegal ones the generator never offers.
        for rules in [Rules::CLASSIC, Rules::ROYAL, ROYAL_14] {
            for seed in 1000..1100 {
                let (table, hand) = reference::random_position(&rules, seed);
                for m in reference::candidates(&rules, &table, hand) {
                    let fast = check(&rules, &table, hand, Seat::South, &m).is_ok();
                    let slow = reference::is_legal(&rules, &table, hand, Seat::South, &m);
                    assert_eq!(fast, slow, "{rules:?} seed {seed}: {table} / {hand}: {m}");
                }
            }
        }
    }

    #[test]
    fn a_position_that_keeps_the_obligation_always_has_a_move() {
        for rules in [Rules::CLASSIC, Rules::ROYAL, ROYAL_14] {
            for seed in 0..400 {
                let (table, hand) = reference::random_position(&rules, seed);
                if reference::obligation_kept(&rules, &table, hand, Seat::South) && !hand.is_empty()
                {
                    assert!(
                        !legal_moves(&rules, &table, hand, Seat::South).is_empty(),
                        "{table} / {hand}"
                    );
                }
            }
        }
    }

    #[test]
    fn applying_a_legal_move_keeps_every_card_and_every_build_consistent() {
        for rules in [Rules::CLASSIC, Rules::ROYAL, ROYAL_14] {
            for seed in 0..200 {
                let (table, hand) = reference::random_position(&rules, seed);
                for m in legal_moves(&rules, &table, hand, Seat::South) {
                    let (mut t, mut h) = (table, hand);
                    let played = apply(&rules, &mut t, &mut h, Seat::South, &m);
                    assert_eq!(t.cards() | h | played.won, table.cards() | hand, "{m}");
                    assert!(t.cards().is_disjoint(h) && played.won.is_disjoint(t.cards() | h));
                    assert_eq!(played.swept, !played.won.is_empty() && t.is_empty(), "{m}");
                    assert_eq!(Table::parse(&rules, &t.to_string()), Ok(t), "{m} -> {t}");
                    assert!(
                        reference::obligation_kept(&rules, &t, h, Seat::South),
                        "{m} -> {t}"
                    );
                }
            }
        }
    }
}
