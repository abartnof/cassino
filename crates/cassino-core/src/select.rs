//! The selection interface, engine side (`docs/DESIGN.md` §12.3).
//!
//! A person never scrolls through a list of moves. They pick a card from the
//! hand and tap table cards (a build is tapped whole), and the table answers:
//! the moves the selection makes exactly (for the *Take*, *Build 8*,
//! *Build 8s* and *Trail* chips), the cards that could still be added on the
//! way to some move, the running sum, and for every other card why it
//! cannot join. The interface never guesses between capturing and
//! building: the person chooses among the moves offered.

use crate::cards::{Card, CardSet};
use crate::moves::{self, Illegal, Move};
use crate::rules::Rules;
use crate::sums::value_sum;
use crate::table::{Seat, Table};

/// What a selection can still become.
#[derive(Clone, Debug, PartialEq)]
pub struct Offer {
    /// The moves whose table cards are exactly the selection.
    pub moves: Vec<Move>,
    /// Table cards that could be added on the way to some move (a build's
    /// cards come together).
    pub can_add: CardSet,
    /// The selected cards' values with the hand card's, when all have one.
    pub sum: Option<u32>,
    /// Why each other table item cannot join, named by one of its cards.
    pub why_not: Vec<(Card, Illegal)>,
}

/// The table cards a move uses: what a capture takes; the loose cards and
/// the target build of a build move; nothing for a trail.
pub fn selected(table: &Table, mv: &Move) -> CardSet {
    match *mv {
        Move::Trail { .. } => CardSet::EMPTY,
        Move::Capture { taken, .. } => taken,
        Move::Build { onto, loose, .. } => {
            loose
                | onto
                    .and_then(|o| table.build_of(o))
                    .map_or(CardSet::EMPTY, |b| b.cards)
        }
    }
}

/// Widens a tap to a whole build: the cards of any build the tapped cards
/// touch.
pub fn whole(table: &Table, picked: CardSet) -> CardSet {
    table
        .builds
        .iter()
        .filter(|b| !b.cards.is_disjoint(picked))
        .fold(picked, |acc, b| acc | b.cards)
}

/// What playing `card` with `picked` from the table can still become.
pub fn offer(
    rules: &Rules,
    table: &Table,
    hand: CardSet,
    me: Seat,
    card: Card,
    picked: CardSet,
) -> Offer {
    let picked = whole(table, picked);
    let mine: Vec<Move> = moves::candidate_moves(rules, table, hand, me)
        .into_iter()
        .filter(|m| m.card() == card)
        .collect();
    let mut can_add = CardSet::EMPTY;
    let mut exact = Vec::new();
    for m in mine {
        let sel = selected(table, &m);
        if sel == picked {
            exact.push(m);
        } else if sel.contains_all(picked) {
            can_add |= sel - picked;
        }
    }
    // Every other table item, named by its lowest card, with the reason a
    // capture including it is refused.
    let items: Vec<CardSet> = table
        .loose
        .iter()
        .map(CardSet::single)
        .chain(table.builds.iter().map(|b| b.cards))
        .filter(|item| item.is_disjoint(picked) && item.is_disjoint(can_add))
        .collect();
    let why_not = items
        .into_iter()
        .filter_map(|item| {
            let name = item.first()?;
            let reason = rules
                .capture_values(card)
                .iter()
                .find_map(|&value| {
                    let attempt = Move::Capture {
                        card,
                        value,
                        taken: picked | item,
                    };
                    moves::check(rules, table, hand, me, &attempt).err()
                })
                .unwrap_or(Illegal::DoesNotMake(rules.capture_values(card)[0]));
            Some((name, reason))
        })
        .collect();
    Offer {
        moves: exact,
        can_add,
        sum: value_sum(rules, picked.with(card)),
        why_not,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn set(s: &str) -> CardSet {
        CardSet::parse(s).unwrap()
    }

    fn c(s: &str) -> Card {
        s.parse().unwrap()
    }

    fn texts(moves: &[Move]) -> Vec<String> {
        let mut t: Vec<String> = moves.iter().map(|m| m.to_string()).collect();
        t.sort();
        t
    }

    #[test]
    fn nothing_selected_offers_the_trail_and_what_can_be_tapped() {
        // W4: table A♣ 2♦; holding 3♥ 3♠ 6♦; the 3♥ picked.
        let r = Rules::CLASSIC;
        let table = Table::parse(&r, "AC 2D").unwrap();
        let o = offer(
            &r,
            &table,
            set("3H 3S 6D"),
            Seat::South,
            c("3H"),
            CardSet::EMPTY,
        );
        assert_eq!(texts(&o.moves), ["trail 3H"]);
        assert_eq!(o.can_add, set("AC 2D"));
        assert_eq!(o.sum, Some(3));
    }

    #[test]
    fn a_selection_offers_every_move_it_makes_exactly() {
        // A♣ + 2♦ with the 3♥: take them, build six, or build threes.
        let r = Rules::CLASSIC;
        let table = Table::parse(&r, "AC 2D").unwrap();
        let o = offer(
            &r,
            &table,
            set("3H 3S 6D"),
            Seat::South,
            c("3H"),
            set("AC 2D"),
        );
        assert_eq!(
            texts(&o.moves),
            ["build 3 3H 2D AC", "build 6 3H 2D AC", "take 3H 2D AC"]
        );
        assert_eq!(o.sum, Some(6));
        assert!(o.can_add.is_empty());
        // The ace alone with the 3 would make 4, which is not held.
        let o = offer(&r, &table, set("3H 3S 6D"), Seat::South, c("3H"), set("AC"));
        assert!(o.moves.is_empty());
        assert_eq!(o.can_add, set("2D"));
    }

    #[test]
    fn a_tapped_build_comes_whole_and_a_wrong_one_says_why() {
        let r = Rules::CLASSIC;
        let table = Table::parse(&r, "[7: 4H 3S] 2D 9D").unwrap();
        assert_eq!(whole(&table, set("3S")), set("4H 3S"));
        let o = offer(
            &r,
            &table,
            set("9S 5C"),
            Seat::South,
            c("9S"),
            CardSet::EMPTY,
        );
        assert_eq!(o.can_add, set("9D"));
        let why: Vec<(Card, Illegal)> = o.why_not.clone();
        assert!(
            why.contains(&(c("3S"), Illegal::BuildOfAnotherValue { build: 7, value: 9 })),
            "{why:?}"
        );
        assert!(why.iter().any(|(card, _)| *card == c("2D")), "{why:?}");
    }

    #[test]
    fn building_onto_a_build_is_a_selection_too() {
        // W9: raise the six to eight by tapping the build with the 2♥.
        let r = Rules::CLASSIC;
        let table = Table::parse(&r, "[6: 3S 3D]").unwrap();
        let o = offer(&r, &table, set("2H 8C"), Seat::South, c("2H"), set("3S 3D"));
        assert_eq!(texts(&o.moves), ["build 8 2H on 3S"]);
    }

    #[test]
    fn offers_match_the_moves_on_random_positions() {
        // Every candidate move is offered for exactly its own selection.
        for seed in 0..200 {
            let (table, hand) = crate::reference::random_position(&Rules::ROYAL, seed);
            for m in moves::candidate_moves(&Rules::ROYAL, &table, hand, Seat::South) {
                let o = offer(
                    &Rules::ROYAL,
                    &table,
                    hand,
                    Seat::South,
                    m.card(),
                    selected(&table, &m),
                );
                assert!(o.moves.contains(&m), "{table} / {hand}: {m}");
                // And along the way, each of its cards could be added alone.
                for x in selected(&table, &m) {
                    let start = offer(
                        &Rules::ROYAL,
                        &table,
                        hand,
                        Seat::South,
                        m.card(),
                        CardSet::EMPTY,
                    );
                    assert!(start.can_add.contains(x), "{table} / {hand}: {m}: {x}");
                }
            }
        }
    }
}
