//! What the table says, in English: the calls players make and plain
//! descriptions of moves (`docs/RULES.md` "Announcements"; `docs/DESIGN.md`
//! §12.1).
//!
//! A single build is announced in the singular ("Building eight."), a
//! multiple build in the plural ("Building eights."): the 1867 grammar that
//! made the call part of the move [03-S15]. Descriptions name cards as
//! people read them (`8♠`), and come from the engine so every client says
//! the same thing.

use crate::cards::CardSet;
use crate::moves::{build_kind, groups, BuildKind, Move};
use crate::rules::Rules;
use crate::table::Table;

const WORDS: [&str; 15] = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen",
];

/// A build value in words: "eight".
pub fn value_word(v: u8) -> &'static str {
    WORDS[v as usize]
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
        value_word(value).into()
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
