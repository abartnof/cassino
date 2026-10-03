//! Rung 3, the counter: card memory and one move of look-ahead.
//!
//! It remembers every card (the view's unseen cards) and the card each of the
//! opponent's builds announces, samples the opponent's possible hands, and
//! weighs each move by three terms (`docs/DESIGN.md` §12.4):
//!
//! - **banked**: what the move captures now, sweep included;
//! - **exposed**: what the opponent's best reply would capture, on average
//!   over the sampled hands;
//! - **kept**: what a build of ours that survives the reply will capture on
//!   our next turn, on average.
//!
//! The three are worth vectors by item of the count, so an explanation can
//! name the largest of them. The literature review's version of this agent
//! "beats greedy in 91% of games" [07-S40]; whether this one earns its rung
//! is measured, not assumed.

#[cfg(test)]
use crate::agents::GreedyAgent;
use crate::agents::{immediate_worth, Agent};
use crate::cards::CardSet;
use crate::moves::{self, Move};
use crate::observation::{sample_hidden, View};
use crate::rng::Rng;
use crate::worth::Worth;

/// A move's assessment, by term and by item of the count.
#[derive(Copy, Clone, Debug, PartialEq, Default)]
pub struct Assessment {
    pub banked: Worth,
    pub exposed: Worth,
    pub kept: Worth,
}

impl Assessment {
    /// The net worth the agent maximises.
    pub fn total(&self) -> f64 {
        self.banked.total() - self.exposed.total() + KEPT_DISCOUNT * self.kept.total()
    }
}

/// A build that survives is not yet captured: the opponent may still raise
/// it, and the card that takes it is spent. A modelling choice, measured.
pub const KEPT_DISCOUNT: f64 = 0.8;

pub struct CounterAgent {
    rng: Rng,
    /// How many of the opponent's possible hands to sample.
    pub samples: usize,
}

impl CounterAgent {
    pub fn new(rng: Rng) -> CounterAgent {
        CounterAgent { rng, samples: 24 }
    }

    /// Assesses each candidate move against the same sampled hands.
    pub fn assess(&mut self, view: &View) -> Vec<(Move, Assessment)> {
        let rules = view.rules;
        let me = view.me;
        let opp = me.other();
        let hands: Vec<CardSet> = if view.opponent_holds == 0 {
            Vec::new()
        } else {
            (0..self.samples)
                .map(|_| sample_hidden(view, &mut self.rng).0)
                .collect()
        };
        let mine = |table: &crate::table::Table| {
            table
                .builds
                .iter()
                .filter(|b| b.controller == me)
                .fold(Worth::default(), |acc, b| acc + Worth::of_cards(b.cards))
        };
        view.candidates()
            .into_iter()
            .map(|m| {
                let mut table = view.table;
                let mut hand = view.hand;
                moves::apply(&rules, &mut table, &mut hand, me, &m);
                let banked = immediate_worth(&rules, &view.table, &m);
                if hands.is_empty() {
                    return (
                        m,
                        Assessment {
                            banked,
                            exposed: Worth::default(),
                            kept: mine(&table),
                        },
                    );
                }
                let mut exposed = Worth::default();
                let mut kept = Worth::default();
                for &theirs in &hands {
                    // Their best immediate reply, as greedy would see it.
                    let reply = moves::candidate_moves(&rules, &table, theirs, opp)
                        .into_iter()
                        .map(|r| (immediate_worth(&rules, &table, &r), r))
                        .fold(None, |best: Option<(Worth, Move)>, (w, r)| match best {
                            Some((bw, _)) if bw.total() >= w.total() => best,
                            _ => Some((w, r)),
                        });
                    let mut after = table;
                    if let Some((w, r)) = reply {
                        exposed += w;
                        let mut theirs = theirs;
                        moves::apply(&rules, &mut after, &mut theirs, opp, &r);
                    }
                    kept += mine(&after);
                }
                let n = hands.len() as f64;
                (
                    m,
                    Assessment {
                        banked,
                        exposed: scale(exposed, 1.0 / n),
                        kept: scale(kept, 1.0 / n),
                    },
                )
            })
            .collect()
    }
}

impl Agent for CounterAgent {
    fn name(&self) -> String {
        "counter".into()
    }

    fn choose(&mut self, view: &View) -> Move {
        self.assess(view)
            .into_iter()
            .fold(None, |best: Option<(f64, Move)>, (m, a)| {
                let v = a.total();
                match best {
                    Some((bv, _)) if bv >= v => best,
                    _ => Some((v, m)),
                }
            })
            .map(|(_, m)| m)
            .expect("a candidate move")
    }
}

/// A worth vector times a number.
fn scale(w: Worth, k: f64) -> Worth {
    Worth {
        cards: w.cards * k,
        spades: w.spades * k,
        aces: w.aces * k,
        big_casino: w.big_casino * k,
        little_casino: w.little_casino * k,
        sweeps: w.sweeps * k,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cards::{pack, Card};
    use crate::hand::Hand;
    use crate::rules::Rules;
    use crate::table::{Seat, Table};

    /// South to move holding `hand` before `table`, early in the hand, with
    /// every other card unseen except `seen` (in South's pile).
    fn view(rules: Rules, table: &str, hand: &str, seen: &str) -> View {
        let (h, _) = Hand::deal(rules, Seat::North, pack());
        let mut v = h.view(Seat::South, [0, 0]);
        v.table = Table::parse(&rules, table).unwrap();
        v.hand = CardSet::parse(hand).unwrap();
        v.piles = [CardSet::parse(seen).unwrap(), CardSet::EMPTY];
        let unseen = v.unseen().len() as u8;
        v.opponent_holds = 4;
        v.undealt = unseen - 4;
        v
    }

    fn mv(s: &str) -> Move {
        Move::parse(s).unwrap()
    }

    #[test]
    fn it_trails_a_court_card_rather_than_leave_a_sweep() {
        // Trailing the five leaves 4+5 for any nine to sweep; trailing the
        // king leaves nothing a single card can clear.
        let v = view(Rules::CLASSIC, "4D", "5H KC", "");
        let mut a = CounterAgent::new(Rng::seeded(1));
        assert_eq!(a.choose(&v), mv("trail KC"));
        assert_eq!(
            GreedyAgent.choose(&v),
            mv("trail 5H"),
            "greedy cannot see it"
        );
    }

    #[test]
    fn it_builds_when_the_build_is_likely_to_survive() {
        // Building 8 on the 5 with the 3 risks only the three unseen eights,
        // and with the king beside it a steal is not a sweep.
        let v = view(Rules::CLASSIC, "5C KD", "3D 8S 2C 9H", "");
        let mut a = CounterAgent::new(Rng::seeded(2));
        assert_eq!(a.choose(&v), mv("build 8 3D 5C"));
    }

    #[test]
    fn a_lone_build_counts_the_sweep_a_steal_would_be() {
        // On an otherwise empty table, a stolen build is a sweep as well.
        let lone = view(Rules::CLASSIC, "5C", "3D 8S 2C 9H", "");
        let beside = view(Rules::CLASSIC, "5C KD", "3D 8S 2C 9H", "");
        let exposed = |v: &View| {
            CounterAgent::new(Rng::seeded(6))
                .assess(v)
                .into_iter()
                .find(|(m, _)| *m == mv("build 8 3D 5C"))
                .unwrap()
                .1
                .exposed
        };
        assert!(exposed(&lone).sweeps > 0.1);
        assert_eq!(exposed(&beside).sweeps, 0.0);
    }

    #[test]
    fn it_does_not_build_into_a_known_steal() {
        // Every other eight is gone but one, which North must hold: North
        // controls an 8-build already. A new build of eight would be taken.
        let rules = Rules::CLASSIC;
        let mut v = view(rules, "5C [8 @N: 6H 2D]", "3D 8S 7C 9H", "8D 8H");
        v.opponent_holds = 4;
        let mut a = CounterAgent::new(Rng::seeded(3));
        let assessed = a.assess(&v);
        let build = assessed
            .iter()
            .find(|(m, _)| *m == mv("build 8 3D 5C"))
            .unwrap()
            .1;
        assert!(build.exposed.total() > 0.5, "{build:?}");
        // Taking North's 8-build now is better than adding to the danger.
        assert_eq!(a.choose(&v), mv("take 8S 6H 2D"));
    }

    #[test]
    fn assessments_are_reproducible_and_legal() {
        let v = view(Rules::ROYAL, "AC 2D 3H 5S 6C", "8S 3C 4D KH", "");
        let first = CounterAgent::new(Rng::seeded(4)).assess(&v);
        let again = CounterAgent::new(Rng::seeded(4)).assess(&v);
        assert_eq!(first, again);
        let legal = v.candidates();
        assert_eq!(first.len(), legal.len());
        assert!(first.iter().all(|(m, _)| legal.contains(m)));
    }

    #[test]
    fn the_banked_term_is_what_the_move_takes() {
        let v = view(Rules::CLASSIC, "TD 5S", "TC 5C", "");
        let assessed = CounterAgent::new(Rng::seeded(5)).assess(&v);
        let take_big = assessed
            .iter()
            .find(|(m, _)| *m == mv("take TC TD"))
            .unwrap()
            .1;
        let want = Worth::of_cards(CardSet::parse("TC TD").unwrap());
        assert_eq!(take_big.banked, want);
        let _ = Card::BIG_CASINO;
    }
}
