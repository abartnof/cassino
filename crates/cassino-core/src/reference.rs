//! The brute-force reference: every move, read literally from `RULES.md`.
//!
//! This is the oracle the fast generator in `moves.rs` is checked against
//! (`docs/DESIGN.md` §4). It is deliberately slow and shares nothing with the
//! code under test but the card and table types: it enumerates every subset
//! of the table for every card and value, and checks each against rules 4–7
//! as written, with its own partition search over plain numbers.

use crate::cards::{pack, Card, CardSet};
use crate::moves::Move;
use crate::rng::Rng;
use crate::rules::Rules;
use crate::table::{Build, Seat, Table};

/// Values of the cards in sums and builds, or `None` if any has none.
fn values(rules: &Rules, set: CardSet) -> Option<Vec<u8>> {
    set.iter().map(|c| rules.build_value(c)).collect()
}

/// Whether `vals` splits into groups each totalling `v`.
fn splits(vals: &[u8], v: u8) -> bool {
    let Some((&first, rest)) = vals.split_first() else {
        return true;
    };
    // `first` is in exactly one group: try every set of companions for it.
    for mask in 0u32..(1 << rest.len()) {
        let total: u32 = u32::from(first)
            + (0..rest.len())
                .filter(|i| mask >> i & 1 == 1)
                .map(|i| u32::from(rest[i]))
                .sum::<u32>();
        if total == u32::from(v) {
            let remaining: Vec<u8> = (0..rest.len())
                .filter(|i| mask >> i & 1 == 0)
                .map(|i| rest[i])
                .collect();
            if splits(&remaining, v) {
                return true;
            }
        }
    }
    false
}

fn subsets(set: CardSet) -> impl Iterator<Item = CardSet> {
    let cards: Vec<Card> = set.iter().collect();
    (0u32..(1 << cards.len())).map(move |mask| {
        (0..cards.len())
            .filter(|i| mask >> i & 1 == 1)
            .map(|i| cards[i])
            .collect()
    })
}

/// Every build `me` controls has a card of its value in `hand` (rule 7).
pub fn obligation_kept(rules: &Rules, table: &Table, hand: CardSet, me: Seat) -> bool {
    table
        .builds
        .iter()
        .filter(|b| b.controller == me)
        .all(|b| rules.holds_value(hand, b.value))
}

/// The table after a legal-looking build move, by the letter of rule 5.
fn after_build(
    table: &Table,
    me: Seat,
    card: Card,
    value: u8,
    onto: Option<usize>,
    loose: CardSet,
    multiple: bool,
) -> Table {
    let mut t = *table;
    t.loose = t.loose - loose;
    match onto {
        None => t.builds.push(Build {
            cards: loose.with(card),
            value,
            multiple,
            controller: me,
        }),
        Some(i) => {
            let b = t.builds.get_mut(i);
            b.cards |= loose.with(card);
            b.value = value;
            b.multiple = multiple;
            b.controller = me;
        }
    }
    t
}

/// The literal reading of rules 4–7.
pub fn is_legal(rules: &Rules, table: &Table, hand: CardSet, me: Seat, mv: &Move) -> bool {
    let card = mv.card();
    if !hand.contains(card) {
        return false;
    }
    let rest = hand.without(card);
    match *mv {
        Move::Trail { .. } => !table.controls_any(me),
        Move::Capture { value, taken, .. } => {
            if taken.is_empty() || !rules.capture_values(card).contains(&value) {
                return false;
            }
            if !table.cards().contains_all(taken) {
                return false;
            }
            // Builds whole or not at all, and each of the value.
            let mut loose_part = taken;
            for b in table.builds.iter() {
                if b.cards.is_disjoint(taken) {
                    continue;
                }
                if !taken.contains_all(b.cards) || b.value != value || rules.pairs_only(card) {
                    return false;
                }
                loose_part = loose_part - b.cards;
            }
            if rules.pairs_only(card) {
                if loose_part.len() != 1 || loose_part.first().unwrap().rank() != card.rank() {
                    return false;
                }
            } else {
                match values(rules, loose_part) {
                    Some(vals) if splits(&vals, value) => {}
                    _ => return false,
                }
            }
            // What is left that `me` controls must still be guarded.
            let mut after = *table;
            after.loose = after.loose - taken;
            let mut i = 0;
            while i < after.builds.len() {
                if taken.contains_all(after.builds.as_slice()[i].cards) {
                    after.builds.remove(i);
                } else {
                    i += 1;
                }
            }
            obligation_kept(rules, &after, rest, me)
        }
        Move::Build {
            value, onto, loose, ..
        } => {
            let Some(x) = rules.build_value(card) else {
                return false;
            };
            if !table.loose.contains_all(loose) || !rules.holds_value(rest, value) {
                return false;
            }
            let Some(lv) = values(rules, loose) else {
                return false;
            };
            let loose_total: u32 = lv.iter().map(|&v| u32::from(v)).sum();
            let v32 = u32::from(value);
            // Some part S0 of the loose cards goes with the card to make the
            // value; the rest splits into groups of the value.
            let card_plus_part_makes_value = |loose: CardSet| {
                subsets(loose).any(|s0| {
                    let s0v = values(rules, s0).unwrap();
                    let s0t: u32 = s0v.iter().map(|&v| u32::from(v)).sum();
                    let r = values(rules, loose - s0).unwrap();
                    u32::from(x) + s0t == v32 && splits(&r, value)
                })
            };
            let (target, multiple) = match onto {
                None => {
                    if loose.is_empty() {
                        return false;
                    }
                    if u32::from(x) + loose_total == v32 {
                        (None, false)
                    } else if card_plus_part_makes_value(loose) {
                        (None, true)
                    } else {
                        return false;
                    }
                }
                Some(name) => {
                    let Some(i) = table.builds.position(name) else {
                        return false;
                    };
                    let b = table.builds.as_slice()[i];
                    if !b.multiple && u32::from(b.value) + u32::from(x) == v32 && splits(&lv, value)
                    {
                        (Some(i), !loose.is_empty())
                    } else if b.value == value && card_plus_part_makes_value(loose) {
                        (Some(i), true)
                    } else {
                        return false;
                    }
                }
            };
            let after = after_build(table, me, card, value, target, loose, multiple);
            obligation_kept(rules, &after, rest, me)
        }
    }
}

/// Every move of the right shape for `hand`, legal or not: trails, captures
/// of every subset of the table at every value, and builds of every value
/// from every subset of the loose cards onto nothing or any build.
pub fn candidates(_rules: &Rules, table: &Table, hand: CardSet) -> Vec<Move> {
    let mut out = Vec::new();
    // Each table item: a loose card, or a whole build.
    let items: Vec<CardSet> = table
        .loose
        .iter()
        .map(CardSet::single)
        .chain(table.builds.iter().map(|b| b.cards))
        .collect();
    let item_sets: Vec<CardSet> = (1u32..(1 << items.len()))
        .map(|mask| {
            (0..items.len())
                .filter(|i| mask >> i & 1 == 1)
                .fold(CardSet::EMPTY, |acc, i| acc | items[i])
        })
        .collect();
    let loose_sets: Vec<CardSet> = subsets(table.loose).collect();
    let targets: Vec<Option<Card>> = std::iter::once(None)
        .chain(table.builds.iter().map(|b| Some(b.name())))
        .collect();
    for card in hand {
        out.push(Move::Trail { card });
        for value in 1..=14u8 {
            for &taken in &item_sets {
                out.push(Move::Capture { card, value, taken });
            }
            for &onto in &targets {
                for &loose in &loose_sets {
                    out.push(Move::Build {
                        card,
                        value,
                        onto,
                        loose,
                    });
                }
            }
        }
    }
    out
}

/// Every legal move, by brute force.
pub fn legal_moves(rules: &Rules, table: &Table, hand: CardSet, me: Seat) -> Vec<Move> {
    candidates(rules, table, hand)
        .into_iter()
        .filter(|m| is_legal(rules, table, hand, me, m))
        .collect()
}

/// A synthetic position for South to move: a hand of one to four cards, up to
/// eight loose cards and up to three builds of either kind, each controlled
/// by either seat. Usually (not always) South holds the value of each build
/// it controls, so most positions keep rule 7 and some do not.
pub fn random_position(rules: &Rules, seed: u64) -> (Table, CardSet) {
    let mut rng = Rng::seeded(seed ^ 0xC0FF_EE00);
    let mut deck: Vec<Card> = pack().to_vec();
    rng.shuffle(&mut deck);
    let mut hand: CardSet = (0..=rng.below(4)).map(|_| deck.pop().unwrap()).collect();
    let mut table = Table::new();
    for _ in 0..rng.below(4) {
        let multiple = rng.below(3) == 0;
        let low = if multiple { 1 } else { 2 };
        let value = low + rng.below(u64::from(rules.max_build() - low + 1)) as u8;
        let groups = if multiple { 2 + rng.below(2) } else { 1 };
        let mut cards = CardSet::EMPTY;
        for _ in 0..groups {
            match take_group(rules, &mut deck, value, &mut rng) {
                Some(g) => cards |= g,
                None => break,
            }
        }
        let enough = if multiple {
            values(rules, cards).map(|v| v.iter().map(|&x| u32::from(x)).sum::<u32>())
                >= Some(2 * u32::from(value))
        } else {
            !cards.is_empty()
        };
        if cards.len() < 2 || !enough {
            deck.extend(cards.iter());
            continue;
        }
        let controller = if rng.below(2) == 0 {
            Seat::South
        } else {
            Seat::North
        };
        table.builds.push(Build {
            cards,
            value,
            multiple,
            controller,
        });
    }
    for _ in 0..rng.below(9) {
        if let Some(card) = deck.pop() {
            table.loose.insert(card);
        }
    }
    // Usually give South a card for each build it controls.
    for b in table.builds.iter() {
        if b.controller == Seat::South && !rules.holds_value(hand, b.value) && rng.below(5) != 0 {
            let rank = if b.value == 14 { 1 } else { b.value };
            if let Some(pos) = deck.iter().position(|c| c.rank() == rank) {
                let card = deck.swap_remove(pos);
                if hand.len() == 4 {
                    let out = hand.first().unwrap();
                    hand.remove(out);
                }
                hand.insert(card);
            }
        }
    }
    (table, hand)
}

/// Draws from `deck` a set of valued cards totalling `value`, or puts back
/// what it drew and returns `None`.
fn take_group(rules: &Rules, deck: &mut Vec<Card>, value: u8, rng: &mut Rng) -> Option<CardSet> {
    let mut left = u32::from(value);
    let mut group = CardSet::EMPTY;
    let mut tries = 0;
    while left > 0 && tries < 60 {
        tries += 1;
        let pos = rng.below(deck.len() as u64) as usize;
        let card = deck[pos];
        match rules.build_value(card) {
            Some(v) if u32::from(v) <= left => {
                deck.swap_remove(pos);
                group.insert(card);
                left -= u32::from(v);
            }
            _ => {}
        }
    }
    if left == 0 {
        Some(group)
    } else {
        deck.extend(group.iter());
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_partition_search_is_right_on_small_cases() {
        assert!(splits(&[], 8));
        assert!(splits(&[8], 8));
        assert!(splits(&[6, 2, 5, 3, 8], 8));
        assert!(!splits(&[7, 7, 2], 8));
        assert!(splits(&[7, 1, 7, 1], 8));
        assert!(!splits(&[1, 2, 3, 5, 6, 8], 8));
    }

    #[test]
    fn random_positions_are_consistent() {
        for rules in [Rules::CLASSIC, Rules::ROYAL] {
            for seed in 0..300 {
                let (table, hand) = random_position(&rules, seed);
                assert!(!hand.is_empty() && hand.len() <= 4);
                assert!(table.cards().is_disjoint(hand));
                assert_eq!(
                    Table::parse(&rules, &table.to_string()),
                    Ok(table),
                    "{table}"
                );
            }
        }
    }

    #[test]
    fn random_positions_vary() {
        // The generator must reach the cases that matter: builds of both
        // kinds and both controllers, crowded tables, broken obligations.
        let mut single = 0;
        let mut multiple = 0;
        let mut south = 0;
        let mut crowded = 0;
        let mut broken = 0;
        for seed in 0..300 {
            let (table, hand) = random_position(&Rules::CLASSIC, seed);
            single += table.builds.iter().filter(|b| !b.multiple).count();
            multiple += table.builds.iter().filter(|b| b.multiple).count();
            south += table
                .builds
                .iter()
                .filter(|b| b.controller == Seat::South)
                .count();
            crowded += usize::from(table.loose.len() >= 7);
            broken += usize::from(!obligation_kept(&Rules::CLASSIC, &table, hand, Seat::South));
        }
        assert!(
            single > 100 && multiple > 30 && south > 60,
            "{single} {multiple} {south}"
        );
        assert!(crowded > 30 && broken > 5, "{crowded} {broken}");
    }
}
