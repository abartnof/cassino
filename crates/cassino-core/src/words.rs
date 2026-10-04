//! What the table says, in English: the calls players make and plain
//! descriptions of moves (`docs/RULES.md` "Announcements"; `docs/DESIGN.md`
//! §12.1).
//!
//! A single build is announced in the singular ("Building eight."), a
//! multiple build in the plural ("Building eights."): the 1867 grammar that
//! made the call part of the move [03-S15]. Descriptions name cards as
//! people read them (`8♠`), and come from the engine so every client says
//! the same thing.

use crate::advice::Note;
use crate::cards::{Card, CardSet, ACE};
use crate::hand::Clinch;
use crate::moves::{build_kind, groups, BuildKind, Move};
use crate::rules::Rules;
use crate::table::{Seat, Table};

const WORDS: [&str; 15] = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen",
];

/// A build value in words: "eight"; a number beyond fourteen in figures
/// (only a mistyped move has one).
pub fn value_word(v: u8) -> String {
    WORDS
        .get(v as usize)
        .map_or_else(|| v.to_string(), |w| w.to_string())
}

/// A build value in the plural: "eights", "sixes", and "aces" for ones.
pub fn value_plural(v: u8) -> String {
    match v {
        1 => "aces".into(),
        6 => "sixes".into(),
        _ => format!("{}s", value_word(v)),
    }
}

/// The value as called for a build of that kind: "eight" or "eights".
fn called(value: u8, multiple: bool) -> String {
    if multiple {
        value_plural(value)
    } else {
        value_word(value)
    }
}

/// The call a build move makes: "Building eight." or "Building eights."
pub fn call(rules: &Rules, table: &Table, mv: &Move) -> Option<String> {
    let (_, multiple) = build_kind(rules, table, mv)?;
    let Move::Build { value, .. } = *mv else {
        return None;
    };
    Some(format!("Building {}.", called(value, multiple)))
}

/// The move described, without its player: "trails 7♦", "takes 8♦, then
/// 6♣ 2♦, with 8♠", "raises the six to eight with 2♥".
pub fn describe(rules: &Rules, table: &Table, mv: &Move) -> String {
    match *mv {
        Move::Trail { card } => format!("trails {}", card.label()),
        Move::Capture { card, value, .. } => {
            let what = listed(&groups(rules, table, mv));
            if value == card.rank() {
                format!("takes {what} with {}", card.label())
            } else {
                format!(
                    "takes {what} with {} as {}",
                    card.label(),
                    value_word(value)
                )
            }
        }
        Move::Build {
            card,
            value,
            onto,
            loose,
        } => {
            let Some((kind, multiple)) = build_kind(rules, table, mv) else {
                return format!("builds {} with {}", value_word(value), card.label());
            };
            let target = onto.and_then(|o| table.build_of(o));
            match kind {
                BuildKind::New => format!(
                    "builds {}: {} on {}",
                    called(value, multiple),
                    card.label(),
                    loose.labels()
                ),
                BuildKind::Raise { from } => {
                    let mut text = format!(
                        "raises the {} to {} with {}",
                        value_word(from),
                        called(value, multiple),
                        card.label()
                    );
                    if !loose.is_empty() {
                        text += &format!(", taking in {}", loose.labels());
                    }
                    text
                }
                BuildKind::Add => {
                    let was_multiple = target.is_some_and(|b| b.multiple);
                    let mut text = format!(
                        "adds {} to the {}",
                        card.label(),
                        called(value, was_multiple)
                    );
                    if !loose.is_empty() {
                        text += &format!(", with {}", loose.labels());
                    }
                    text
                }
            }
        }
    }
}

/// The move as advice, in the imperative: "take 8♦ with 8♠", "trail 7♦",
/// "raise the six to eight with 2♥".
pub fn advise(rules: &Rules, table: &Table, mv: &Move) -> String {
    let text = describe(rules, table, mv);
    let (verb, rest) = text.split_once(' ').unwrap_or((&text, ""));
    let base = match verb {
        "takes" => "take",
        "trails" => "trail",
        "builds" => "build",
        "raises" => "raise",
        "adds" => "add",
        other => other,
    };
    format!("{base} {rest}")
}

/// A card that captures as `v`, with its article: "an 8", "a king", "an ace".
pub fn card_for(v: u8) -> String {
    match v {
        1 | 14 => "an ace".into(),
        8 => "an 8".into(),
        11 => "a jack".into(),
        12 => "a queen".into(),
        13 => "a king".into(),
        v => format!("a {v}"),
    }
}

/// A note in English, as `observer` hears it ("you" and "your opponent").
pub fn note_text(rules: &Rules, note: &Note, observer: Seat) -> String {
    let who = |seat: Seat| {
        if seat == observer {
            "You"
        } else {
            "Your opponent"
        }
    };
    let whose = |seat: Seat| {
        if seat == observer {
            "yours"
        } else {
            "your opponent's"
        }
    };
    let points = |n: u32| {
        if n == 1 {
            "1 point".to_string()
        } else {
            format!("{n} points")
        }
    };
    match note {
        Note::TookPoints { seat, cards } => {
            let mut items = Vec::new();
            let mut total = 0;
            if cards.contains(Card::BIG_CASINO) {
                items.push("Big Cassino".to_string());
                total += 2;
            }
            if cards.contains(Card::LITTLE_CASINO) {
                items.push("Little Cassino".to_string());
                total += 1;
            }
            let aces = (*cards & CardSet::of_rank(ACE)).len();
            if aces > 0 {
                items.push(match aces {
                    1 => "an ace".to_string(),
                    n => format!("{} aces", value_word(n as u8)),
                });
                total += aces;
            }
            format!(
                "{} took {}: {}.",
                who(*seat),
                items.join(" and "),
                points(total)
            )
        }
        Note::Swept { seat } => {
            if rules.sweeps {
                format!("{} swept the table: 1 point.", who(*seat))
            } else {
                format!("{} swept the table (sweeps are not scored).", who(*seat))
            }
        }
        Note::Cash { .. } => "Cash: an ace for an ace.".into(),
        Note::Clinched {
            seat,
            what: Clinch::Cards,
        } => {
            format!(
                "That's 27 cards: most cards, and its 3 points, are {}.",
                whose(*seat)
            )
        }
        Note::Clinched {
            seat,
            what: Clinch::Spades,
        } => {
            format!("Seven spades: the spades point is {}.", whose(*seat))
        }
        Note::Announces { seat, value } => {
            if *seat == observer {
                format!(
                    "Building {} tells your opponent you hold {}.",
                    value_word(*value),
                    card_for(*value)
                )
            } else {
                format!(
                    "Your opponent is building {}, so they hold {}.",
                    value_word(*value),
                    card_for(*value)
                )
            }
        }
        Note::SweepOpen {
            next,
            values,
            held,
            unseen,
        } => {
            let any: Vec<String> = values
                .iter()
                .map(|&v| {
                    card_for(v)
                        .split_once(' ')
                        .map_or(String::new(), |(_, c)| c.to_string())
                })
                .collect();
            if *next == observer && *held {
                format!("You can sweep the table with your {}.", any.join(" or "))
            } else {
                format!(
                    "That leaves a sweep for any {} ({unseen} unseen).",
                    any.join(" or ")
                )
            }
        }
        Note::LeftBehind { seat, cards } => {
            let card = if *seat == observer {
                "Your card".to_string()
            } else {
                "Your opponent's card".to_string()
            };
            format!("{card} could also have taken {}.", cards.labels())
        }
        Note::BuildAtRisk { unseen, .. } => match unseen {
            0 => "No card that could take it is unseen: it is safe.".into(),
            1 => "1 card that could take it is unseen.".into(),
            n => format!("{n} cards that could take it are unseen."),
        },
        Note::CanTakeBuild { value } => format!("You hold {}: you can take it.", card_for(*value)),
    }
}

fn listed(groups: &[CardSet]) -> String {
    groups
        .iter()
        .map(|g| g.labels())
        .collect::<Vec<_>>()
        .join(", then ")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn t(rules: &Rules, s: &str) -> Table {
        Table::parse(rules, s).unwrap()
    }

    fn mv(s: &str) -> Move {
        Move::parse(s).unwrap()
    }

    #[test]
    fn descriptions_never_panic_on_odd_values() {
        // The review's F6: a value beyond 14 in a typed move.
        let r = Rules::CLASSIC;
        let table = t(&r, "5C 3D");
        for text in [
            "take 8S=200 5C 3D",
            "build 99 3D 5C",
            "build 0 3D 5C",
            "take 8S=0 5C",
        ] {
            let m = mv(text);
            let _ = describe(&r, &table, &m);
            let _ = advise(&r, &table, &m);
            let _ = call(&r, &table, &m);
        }
        assert_eq!(value_word(200), "200");
    }

    #[test]
    fn values_in_words() {
        assert_eq!(value_word(8), "eight");
        assert_eq!(value_word(14), "fourteen");
        assert_eq!(value_plural(8), "eights");
        assert_eq!(value_plural(6), "sixes");
        assert_eq!(value_plural(1), "aces");
        assert_eq!(value_plural(13), "thirteens");
    }

    #[test]
    fn calls_are_singular_for_single_builds_and_plural_for_multiple() {
        let r = Rules::CLASSIC;
        assert_eq!(
            call(&r, &t(&r, "5C"), &mv("build 8 3D 5C")).as_deref(),
            Some("Building eight.")
        );
        assert_eq!(
            call(&r, &t(&r, "AC 2D"), &mv("build 3 3H AC 2D")).as_deref(),
            Some("Building threes.")
        );
        assert_eq!(
            call(&r, &t(&r, "[6: 3S 3D]"), &mv("build 8 2H on 3S")).as_deref(),
            Some("Building eight.")
        );
        assert_eq!(
            call(&r, &t(&r, "[8: 5S 3H] 6D"), &mv("build 8 2C on 3H 6D")).as_deref(),
            Some("Building eights.")
        );
        assert_eq!(call(&r, &t(&r, "5C"), &mv("trail 3D")), None);
    }

    #[test]
    fn moves_described() {
        let r = Rules::CLASSIC;
        assert_eq!(describe(&r, &t(&r, "5C"), &mv("trail 7D")), "trails 7♦");
        assert_eq!(
            describe(
                &r,
                &t(&r, "AC 2D 3H 5S 6C 8D"),
                &mv("take 8S 8D 6C 2D 5S 3H")
            ),
            "takes 8♦, then 2♦ 6♣, then 5♠ 3♥ with 8♠"
        );
        assert_eq!(
            describe(&r, &t(&r, "5C"), &mv("build 8 3D 5C")),
            "builds eight: 3♦ on 5♣"
        );
        assert_eq!(
            describe(&r, &t(&r, "[6: 3S 3D]"), &mv("build 8 2H on 3S")),
            "raises the six to eight with 2♥"
        );
        assert_eq!(
            describe(&r, &t(&r, "[8: 5S 3H] 6D"), &mv("build 8 2C on 3H 6D")),
            "adds 2♣ to the eight, with 6♦"
        );
        assert_eq!(
            describe(&r, &t(&r, "[7: 3C 4H] 9D"), &mv("build 9 2S on 3C 9D")),
            "raises the seven to nines with 2♠, taking in 9♦"
        );
        let royal = Rules::ROYAL;
        assert_eq!(
            describe(&royal, &t(&royal, "KS AH"), &mv("take AC=14 KS AH")),
            "takes K♠ A♥ with A♣ as fourteen"
        );
    }

    #[test]
    fn notes_in_english() {
        let r = Rules::CLASSIC;
        let s = |t: &str| CardSet::parse(t).unwrap();
        let me = Seat::South;
        let them = Seat::North;
        let text = |n: Note| note_text(&r, &n, me);
        assert_eq!(
            text(Note::TookPoints {
                seat: me,
                cards: s("TD AS")
            }),
            "You took Big Cassino and an ace: 3 points."
        );
        assert_eq!(
            text(Note::TookPoints {
                seat: them,
                cards: s("AH AC")
            }),
            "Your opponent took two aces: 2 points."
        );
        assert_eq!(
            text(Note::TookPoints {
                seat: me,
                cards: s("2S")
            }),
            "You took Little Cassino: 1 point."
        );
        assert_eq!(
            text(Note::Swept { seat: me }),
            "You swept the table: 1 point."
        );
        let no_sweeps = Rules { sweeps: false, ..r };
        assert_eq!(
            note_text(&no_sweeps, &Note::Swept { seat: them }, me),
            "Your opponent swept the table (sweeps are not scored)."
        );
        assert_eq!(text(Note::Cash { seat: them }), "Cash: an ace for an ace.");
        assert_eq!(
            text(Note::Clinched {
                seat: me,
                what: Clinch::Cards
            }),
            "That's 27 cards: most cards, and its 3 points, are yours."
        );
        assert_eq!(
            text(Note::Clinched {
                seat: them,
                what: Clinch::Spades
            }),
            "Seven spades: the spades point is your opponent's."
        );
        assert_eq!(
            text(Note::Announces { seat: me, value: 8 }),
            "Building eight tells your opponent you hold an 8."
        );
        assert_eq!(
            text(Note::Announces {
                seat: them,
                value: 9
            }),
            "Your opponent is building nine, so they hold a 9."
        );
        assert_eq!(
            text(Note::SweepOpen {
                next: me,
                values: vec![9],
                held: true,
                unseen: 0
            }),
            "You can sweep the table with your 9."
        );
        assert_eq!(
            text(Note::SweepOpen {
                next: them,
                values: vec![9],
                held: false,
                unseen: 4
            }),
            "That leaves a sweep for any 9 (4 unseen)."
        );
        assert_eq!(
            text(Note::SweepOpen {
                next: them,
                values: vec![1, 2],
                held: false,
                unseen: 3
            }),
            "That leaves a sweep for any ace or 2 (3 unseen)."
        );
        assert_eq!(
            text(Note::LeftBehind {
                seat: me,
                cards: s("5S 3H")
            }),
            "Your card could also have taken 5♠ 3♥."
        );
        assert_eq!(
            text(Note::LeftBehind {
                seat: them,
                cards: s("2D")
            }),
            "Your opponent's card could also have taken 2♦."
        );
        assert_eq!(
            text(Note::BuildAtRisk {
                value: 8,
                unseen: 2
            }),
            "2 cards that could take it are unseen."
        );
        assert_eq!(
            text(Note::BuildAtRisk {
                value: 8,
                unseen: 1
            }),
            "1 card that could take it is unseen."
        );
        assert_eq!(
            text(Note::BuildAtRisk {
                value: 8,
                unseen: 0
            }),
            "No card that could take it is unseen: it is safe."
        );
        assert_eq!(
            text(Note::CanTakeBuild { value: 8 }),
            "You hold an 8: you can take it."
        );
    }

    #[test]
    fn advice_is_imperative() {
        let r = Rules::CLASSIC;
        assert_eq!(advise(&r, &t(&r, "5C"), &mv("trail 7D")), "trail 7♦");
        assert_eq!(
            advise(&r, &t(&r, "8D"), &mv("take 8S 8D")),
            "take 8♦ with 8♠"
        );
        assert_eq!(
            advise(&r, &t(&r, "5C"), &mv("build 8 3D 5C")),
            "build eight: 3♦ on 5♣"
        );
        assert_eq!(
            advise(&r, &t(&r, "[6: 3S 3D]"), &mv("build 8 2H on 3S")),
            "raise the six to eight with 2♥"
        );
        assert_eq!(
            advise(&r, &t(&r, "[8: 5S 3H] 6D"), &mv("build 8 2C on 3H 6D")),
            "add 2♣ to the eight, with 6♦"
        );
    }

    #[test]
    fn cards_for_values() {
        assert_eq!(card_for(1), "an ace");
        assert_eq!(card_for(8), "an 8");
        assert_eq!(card_for(9), "a 9");
        assert_eq!(card_for(13), "a king");
        assert_eq!(card_for(14), "an ace");
    }

    #[test]
    fn build_kinds() {
        let r = Rules::CLASSIC;
        assert_eq!(
            build_kind(&r, &t(&r, "5C"), &mv("build 8 3D 5C")),
            Some((BuildKind::New, false))
        );
        assert_eq!(
            build_kind(&r, &t(&r, "AC 2D"), &mv("build 3 3H AC 2D")),
            Some((BuildKind::New, true))
        );
        assert_eq!(
            build_kind(&r, &t(&r, "[6: 3S 3D]"), &mv("build 8 2H on 3S")),
            Some((BuildKind::Raise { from: 6 }, false))
        );
        assert_eq!(
            build_kind(&r, &t(&r, "[8: 5S 3H] 6D"), &mv("build 8 2C on 3H 6D")),
            Some((BuildKind::Add, true))
        );
        assert_eq!(build_kind(&r, &t(&r, "5C"), &mv("trail 3D")), None);
        assert_eq!(
            build_kind(&r, &t(&r, "5C"), &mv("build 9 3D 5C")),
            None,
            "3 + 5 is not 9"
        );
    }
}
