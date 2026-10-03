//! The two games and their settings, and every card value the engine uses.
//!
//! `docs/RULES.md` rule 1. Everything else in the engine reads values only
//! through [`Rules::build_value`], [`Rules::capture_values`] and
//! [`Rules::pairs_only`], so a future preset changes this file and scoring,
//! not the move generator (`docs/DESIGN.md` §6).

use crate::cards::{Card, CardSet, ACE};

/// Which Cassino.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub enum Game {
    /// Court cards have no value and pair only.
    Classic,
    /// Jack 11, queen 12, king 13.
    Royal,
}

/// The game and its settings, chosen at the start.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub struct Rules {
    pub game: Game,
    /// "Aces count 1 or 14": a hand ace may capture as 14. Royal only; ignored
    /// in Classic.
    pub aces_fourteen: bool,
    /// "Score sweeps": one point each.
    pub sweeps: bool,
}

impl Rules {
    pub const CLASSIC: Rules = Rules {
        game: Game::Classic,
        aces_fourteen: false,
        sweeps: true,
    };
    pub const ROYAL: Rules = Rules {
        game: Game::Royal,
        aces_fourteen: false,
        sweeps: true,
    };

    /// The card's value in sums and builds: `None` for a Classic court card.
    /// An ace is always 1 here, even with "Aces count 1 or 14".
    pub fn build_value(&self, card: Card) -> Option<u8> {
        match self.game {
            Game::Classic if card.is_court() => None,
            _ => Some(card.rank()),
        }
    }

    /// The values the card can capture as, played from the hand.
    pub fn capture_values(&self, card: Card) -> &'static [u8] {
        const ACE_HIGH: [u8; 2] = [ACE, 14];
        const SINGLE: [[u8; 1]; 14] = {
            let mut t = [[0u8; 1]; 14];
            let mut v = 0;
            while v < 14 {
                t[v] = [v as u8];
                v += 1;
            }
            t
        };
        if card.rank() == ACE && self.aces_fourteen_apply() {
            &ACE_HIGH
        } else {
            // A Classic court card captures by its rank (11 to 13), as a
            // pairing only; every other card at its build value, its rank.
            &SINGLE[card.rank() as usize]
        }
    }

    /// A Classic court card: it captures exactly one loose card of its rank.
    pub fn pairs_only(&self, card: Card) -> bool {
        self.game == Game::Classic && card.is_court()
    }

    /// Whether `hand` holds a card that can capture a build of value `v`.
    pub fn holds_value(&self, hand: CardSet, v: u8) -> bool {
        match v {
            1..=10 => !(hand & CardSet::of_rank(v)).is_empty(),
            11..=13 => self.game == Game::Royal && !(hand & CardSet::of_rank(v)).is_empty(),
            14 => self.aces_fourteen_apply() && !(hand & CardSet::of_rank(ACE)).is_empty(),
            _ => false,
        }
    }

    /// Whether `hand` can answer for every one of `values` at once: each
    /// distinct value needs a card of its own that captures it (rule 7).
    /// Only an ace, under "Aces count 1 or 14", has two values, and it
    /// answers for one of them, not both.
    pub fn guards(&self, hand: CardSet, values: &[u8]) -> bool {
        let mut distinct: Vec<u8> = values.to_vec();
        distinct.sort_unstable();
        distinct.dedup();
        // Every value but 1 and 14 is answered by its own rank alone.
        if !distinct
            .iter()
            .filter(|&&v| v != 1 && v != 14)
            .all(|&v| self.holds_value(hand, v))
        {
            return false;
        }
        // The aces answer for 1 and for 14, one value each.
        let need = distinct.iter().filter(|&&v| v == 1 || v == 14).count() as u32;
        let aces = (hand & CardSet::of_rank(ACE)).len();
        if distinct.contains(&14) && !self.holds_value(hand, 14) {
            return false;
        }
        aces >= need
    }

    /// The highest value a build can have under these rules.
    pub fn max_build(&self) -> u8 {
        match self.game {
            Game::Classic => 10,
            Game::Royal if self.aces_fourteen => 14,
            Game::Royal => 13,
        }
    }

    /// The same rules with "Aces count 1 or 14" switched off in Classic,
    /// where it means nothing: identical games then hash alike.
    pub fn normalized(self) -> Rules {
        Rules {
            aces_fourteen: self.aces_fourteen_apply(),
            ..self
        }
    }

    fn aces_fourteen_apply(&self) -> bool {
        self.game == Game::Royal && self.aces_fourteen
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cards::pack;

    fn c(s: &str) -> Card {
        s.parse().unwrap()
    }

    const ROYAL_14: Rules = Rules {
        game: Game::Royal,
        aces_fourteen: true,
        sweeps: true,
    };
    const CLASSIC_14: Rules = Rules {
        game: Game::Classic,
        aces_fourteen: true,
        sweeps: true,
    };

    #[test]
    fn classic_values_numerals_and_leaves_courts_without_value() {
        let r = Rules::CLASSIC;
        assert_eq!(r.build_value(c("AS")), Some(1));
        assert_eq!(r.build_value(c("7H")), Some(7));
        assert_eq!(r.build_value(c("TD")), Some(10));
        for court in ["JS", "QH", "KD"] {
            assert_eq!(r.build_value(c(court)), None, "{court}");
            assert!(r.pairs_only(c(court)), "{court}");
        }
        assert!(!r.pairs_only(c("TD")));
        assert!(!r.pairs_only(c("AS")));
    }

    #[test]
    fn royal_counts_jack_queen_king_as_11_12_13() {
        let r = Rules::ROYAL;
        assert_eq!(r.build_value(c("JS")), Some(11));
        assert_eq!(r.build_value(c("QH")), Some(12));
        assert_eq!(r.build_value(c("KD")), Some(13));
        assert!(pack().into_iter().all(|card| !r.pairs_only(card)));
        assert_eq!(r.capture_values(c("KD")), &[13]);
    }

    #[test]
    fn an_ace_captures_as_14_only_in_royal_with_the_setting() {
        assert_eq!(Rules::CLASSIC.capture_values(c("AS")), &[1]);
        assert_eq!(Rules::ROYAL.capture_values(c("AS")), &[1]);
        assert_eq!(ROYAL_14.capture_values(c("AS")), &[1, 14]);
        assert_eq!(
            CLASSIC_14.capture_values(c("AS")),
            &[1],
            "ignored in Classic"
        );
    }

    #[test]
    fn an_ace_counts_1_in_builds_even_with_the_setting() {
        assert_eq!(ROYAL_14.build_value(c("AH")), Some(1));
    }

    #[test]
    fn capture_values_are_the_build_value_for_every_other_card() {
        for rules in [Rules::CLASSIC, Rules::ROYAL, ROYAL_14] {
            for card in pack() {
                if card.rank() == ACE || rules.pairs_only(card) {
                    continue;
                }
                let v = rules.build_value(card).unwrap();
                assert_eq!(rules.capture_values(card), &[v], "{card}");
            }
        }
    }

    #[test]
    fn a_classic_court_captures_by_its_rank() {
        assert_eq!(Rules::CLASSIC.capture_values(c("QS")), &[12]);
    }

    #[test]
    fn holding_a_value() {
        let hand = CardSet::parse("AS 8D KC").unwrap();
        assert!(Rules::CLASSIC.holds_value(hand, 8));
        assert!(Rules::CLASSIC.holds_value(hand, 1));
        assert!(
            !Rules::CLASSIC.holds_value(hand, 13),
            "a Classic king builds nothing"
        );
        assert!(!Rules::CLASSIC.holds_value(hand, 9));
        assert!(Rules::ROYAL.holds_value(hand, 13));
        assert!(!Rules::ROYAL.holds_value(hand, 14));
        assert!(ROYAL_14.holds_value(hand, 14));
        assert!(ROYAL_14.holds_value(hand, 1));
        assert!(!Rules::ROYAL.holds_value(CardSet::EMPTY, 5));
    }

    #[test]
    fn one_card_answers_for_one_value() {
        let s = |t: &str| CardSet::parse(t).unwrap();
        let ace = s("AC");
        assert!(ROYAL_14.guards(ace, &[1]));
        assert!(ROYAL_14.guards(ace, &[14]));
        assert!(!ROYAL_14.guards(ace, &[1, 14]), "one ace, not both");
        assert!(ROYAL_14.guards(s("AC AD"), &[1, 14]));
        assert!(ROYAL_14.guards(s("AC AD 9H"), &[14, 1, 9]));
        assert!(!ROYAL_14.guards(s("AC 9H"), &[14, 1, 9]));
        // The same value twice is one value: one card takes both builds.
        assert!(Rules::CLASSIC.guards(s("8C"), &[8, 8]));
        assert!(Rules::CLASSIC.guards(s("8C 9D"), &[8, 9]));
        assert!(!Rules::CLASSIC.guards(s("8C"), &[8, 9]));
        assert!(Rules::CLASSIC.guards(CardSet::EMPTY, &[]));
        assert!(
            !Rules::CLASSIC.guards(s("KC"), &[13]),
            "a Classic king answers for nothing"
        );
        assert!(Rules::ROYAL.guards(s("KC QD"), &[13, 12]));
    }

    #[test]
    fn rules_normalize_aces_fourteen_to_royal_only() {
        assert_eq!(CLASSIC_14.normalized(), Rules::CLASSIC);
        assert_eq!(ROYAL_14.normalized(), ROYAL_14);
        assert_eq!(Rules::ROYAL.normalized(), Rules::ROYAL);
    }

    #[test]
    fn the_highest_build() {
        assert_eq!(Rules::CLASSIC.max_build(), 10);
        assert_eq!(CLASSIC_14.max_build(), 10);
        assert_eq!(Rules::ROYAL.max_build(), 13);
        assert_eq!(ROYAL_14.max_build(), 14);
    }
}
