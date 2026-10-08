//! The tutor (`docs/DESIGN.md` §12.8): the skills a game can show, and
//! which each needs first.

use crate::advice;
use crate::cards::{Card, ACE};
use crate::moves::Move;
use crate::observation::View;
use crate::review::{is_build, is_trail, leaves_sweep, Turn};
use crate::rng::Rng;
use crate::search::SearchAgent;

/// A skill a decision can show.
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Skill {
    /// Taking a card of the same rank.
    Pairs,
    /// Taking cards that add up to a card played.
    Sums,
    /// Building for a card held.
    Building,
    /// Choosing builds that survive to be taken.
    SafeBuilds,
    /// Taking or raising the opponent's builds.
    AnsweringBuilds,
    /// Leaving no table one card can clear.
    NoSweep,
    /// Keeping aces and Cassinos off the table.
    Valuables,
    /// Choosing which card to trail.
    Trailing,
}

impl Skill {
    pub const ALL: [Skill; 8] = [
        Skill::Pairs,
        Skill::Sums,
        Skill::Building,
        Skill::SafeBuilds,
        Skill::AnsweringBuilds,
        Skill::NoSweep,
        Skill::Valuables,
        Skill::Trailing,
    ];

    /// The name used on the command line (`searcher-no-<slug>`).
    pub fn slug(self) -> &'static str {
        match self {
            Skill::Pairs => "pairs",
            Skill::Sums => "sums",
            Skill::Building => "building",
            Skill::SafeBuilds => "safe-builds",
            Skill::AnsweringBuilds => "answering-builds",
            Skill::NoSweep => "sweeps",
            Skill::Valuables => "valuables",
            Skill::Trailing => "trailing",
        }
    }

    /// The skill whose [`slug`](Skill::slug) this is.
    pub fn from_slug(slug: &str) -> Option<Skill> {
        Skill::ALL.into_iter().find(|s| s.slug() == slug)
    }

    /// The skills this one needs first: the logical ones only.
    pub fn needs(self) -> &'static [Skill] {
        match self {
            Skill::Sums => &[Skill::Pairs],
            Skill::Building => &[Skill::Sums],
            Skill::SafeBuilds => &[Skill::Building],
            Skill::AnsweringBuilds => &[Skill::Sums],
            Skill::Pairs | Skill::NoSweep | Skill::Valuables | Skill::Trailing => &[],
        }
    }
}

/// An ace or a Cassino (the ten of diamonds, the two of spades): the cards
/// that score on their own, and so are not to be left on the table.
pub fn valuable(card: Card) -> bool {
    card.rank() == ACE || card == Card::BIG_CASINO || card == Card::LITTLE_CASINO
}

/// The skills of action `mv` shows, in [`Skill::ALL`] order. The one
/// classifier of what a move does, used by the chances, the knockouts
/// ([`crate::knockout`]) and the lessons ([`crate::lessons`]).
///
/// - **Pairs**: a capture that takes a loose card *of the value it
///   captures as*: the loose card's value under the rules
///   ([`Rules::build_value`]) is the capture's value, or the card played is
///   a Classic court card, which captures only its own rank. An ace
///   captures as 1 or, if the rules allow, 14, so an ace at 14 pairs with
///   no ace; taking an ace and a king as 14 is a sum.
/// - **Sums**: a capture that takes two or more loose cards that are not
///   pairs (they add to the value). A double pair (4C takes 4D 4H) is
///   Pairs only; a pair and a sum together are both.
/// - **Building**: a new build of one's own, or an addition to one's own
///   build.
/// - **AnsweringBuilds**: taking a build the opponent controls, or adding
///   to or raising one.
pub fn shows(view: &View, mv: &Move) -> Vec<Skill> {
    let rules = &view.rules;
    let table = &view.table;
    let mut out = Vec::new();
    match *mv {
        Move::Trail { .. } => {}
        Move::Capture { value, taken, .. } => {
            let is_pair = |c: Card| rules.pairs_only(c) || rules.build_value(c) == Some(value);
            let loose = taken & table.loose;
            if loose.iter().any(is_pair) {
                out.push(Skill::Pairs);
            }
            if loose.iter().filter(|&c| !is_pair(c)).count() >= 2 {
                out.push(Skill::Sums);
            }
            if table
                .builds
                .iter()
                .any(|b| b.controller != view.me && !(taken & b.cards).is_empty())
            {
                out.push(Skill::AnsweringBuilds);
            }
        }
        Move::Build { onto, .. } => {
            let theirs = onto
                .and_then(|o| table.build_of(o))
                .is_some_and(|b| b.controller != view.me);
            out.push(if theirs {
                Skill::AnsweringBuilds
            } else {
                Skill::Building
            });
        }
    }
    out
}

/// Whether `m` is the kind of move `skill` asks for, for the six skills a
/// single move can show or fail to show (not Trailing, which compares
/// trails, or SafeBuilds, which compares builds): the four skills of
/// action, as [`shows`] has them, and the two of restraint:
///
/// - **NoSweep**: a move that leaves no table one card could clear for the
///   opponent ([`leaves_sweep`]). Sweeps are off by default
///   (`docs/RULES.md`), and then clearing the table scores nothing, but it
///   still hands over every card on it; so the skill stands either way,
///   and its chance is the advisor's value gap, which already includes
///   the cost (the point for the sweep only when sweeps score).
/// - **Valuables**: not trailing an ace or a Cassino.
fn good(skill: Skill, view: &View, m: &Move) -> bool {
    match skill {
        Skill::NoSweep => !leaves_sweep(view, m),
        Skill::Valuables => !(is_trail(m) && valuable(m.card())),
        Skill::Pairs | Skill::Sums | Skill::Building | Skill::AnsweringBuilds => {
            shows(view, m).contains(&skill)
        }
        Skill::SafeBuilds | Skill::Trailing => false,
    }
}

fn best_where(values: &[(Move, f64)], f: impl Fn(&Move) -> bool) -> Option<f64> {
    values
        .iter()
        .filter(|(m, _)| f(m))
        .map(|&(_, v)| v)
        .max_by(f64::total_cmp)
}

fn worst_where(values: &[(Move, f64)], f: impl Fn(&Move) -> bool) -> Option<f64> {
    values
        .iter()
        .filter(|(m, _)| f(m))
        .map(|&(_, v)| v)
        .min_by(f64::total_cmp)
}

/// What `skill` gains in this position, from the advisor's `values` for
/// the moves in play: the best move that shows it less the best that does
/// not (for the skills of restraint, the best that avoids the error less
/// the best that commits it). `None` when either side has no move. The
/// two that compare moves of one kind: Trailing, the best trail less the
/// worst (two trails needed), and SafeBuilds, the best build less the
/// worst (two builds needed). What the advisor's noise is measured on
/// (`bin/noise.rs`).
pub fn gap(skill: Skill, view: &View, values: &[(Move, f64)]) -> Option<f64> {
    match skill {
        Skill::Trailing => spread(values, is_trail),
        Skill::SafeBuilds => spread(values, is_build),
        _ => {
            let with = best_where(values, |m| good(skill, view, m))?;
            let without = best_where(values, |m| !good(skill, view, m))?;
            Some(with - without)
        }
    }
}

fn spread(values: &[(Move, f64)], kind: fn(&Move) -> bool) -> Option<f64> {
    if values.iter().filter(|(m, _)| kind(m)).count() < 2 {
        return None;
    }
    Some(best_where(values, kind)? - worst_where(values, kind)?)
}

/// A clear chance a decision held, and whether the person met it.
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct Chance {
    pub skill: Skill,
    pub met: bool,
    /// The chance's size in points: the advisor's [`gap`] for the skill.
    pub gap: f64,
}

/// The clear chances a decision held, given the advisor's `values` (which
/// include the move `chosen`), and whether the person met each. A chance
/// is clear when the advisor's values differ by more than `margin`, its
/// noise, so that near-ties are no evidence either way. In the last deal
/// the values are exact, and the margin is applied all the same.
///
/// - **Pairs, Sums, Building, AnsweringBuilds** (action): a chance when
///   the best move that shows the skill beats the best that does not;
///   met if the move chosen shows it. The skills are described at
///   [`shows`].
/// - **NoSweep, Valuables** (restraint): a chance when the best move that
///   avoids the error beats the best that commits it; met if the move
///   chosen avoids it.
/// - **SafeBuilds**: asked only when the person built, and builds are
///   compared with builds only. A chance when the best build beats the
///   worst by more than the margin (two builds needed); met if the build
///   chosen is within the margin of the best build.
/// - **Trailing**: asked only when the person trailed and the best move
///   was a trail. A chance when the best trail beats the worst by more
///   than the margin; met if the person's trail is within the margin of
///   the best.
///
/// The skills come in [`Skill::ALL`] order.
pub fn chances_with(
    view: &View,
    chosen: &Move,
    margin: f64,
    values: &[(Move, f64)],
) -> Vec<Chance> {
    let Some(&(_, mine)) = values.iter().find(|(m, _)| m == chosen) else {
        return Vec::new();
    };
    let Some(best) = best_where(values, |_| true) else {
        return Vec::new();
    };
    let mut out = Vec::new();
    for skill in Skill::ALL {
        match skill {
            Skill::Trailing => {
                let Some(best_trail) = best_where(values, is_trail) else {
                    continue;
                };
                if let Some(g) = gap(skill, view, values).filter(|&g| g > margin) {
                    if is_trail(chosen) && best_trail >= best {
                        out.push(Chance {
                            skill,
                            met: mine >= best_trail - margin,
                            gap: g,
                        });
                    }
                }
            }
            Skill::SafeBuilds => {
                // Builds against builds only: a trail that was better says
                // nothing of whether the build was a safe one.
                let Some(best_build) = best_where(values, is_build) else {
                    continue;
                };
                if !is_build(chosen) {
                    continue;
                }
                if let Some(g) = gap(skill, view, values).filter(|&g| g > margin) {
                    out.push(Chance {
                        skill,
                        met: mine >= best_build - margin,
                        gap: g,
                    });
                }
            }
            _ => {
                if let Some(g) = gap(skill, view, values).filter(|&g| g > margin) {
                    out.push(Chance {
                        skill,
                        met: good(skill, view, chosen),
                        gap: g,
                    });
                }
            }
        }
    }
    out
}

/// Whether the decision holds a clear chance at `skill`, whatever the
/// person plays: the same test as [`chances_with`] with no move chosen
/// (Trailing needs the best move to be a trail, as there; SafeBuilds two
/// builds that differ by more than the margin, the best of them within the
/// margin of the best move). What the tutor's nudge is
/// shown on.
pub fn open(skill: Skill, view: &View, margin: f64, values: &[(Move, f64)]) -> bool {
    let Some(best) = best_where(values, |_| true) else {
        return false;
    };
    let clear = gap(skill, view, values).is_some_and(|g| g > margin);
    match skill {
        Skill::Trailing => clear && best_where(values, is_trail).is_some_and(|t| t >= best),
        // The question is which build, so a build must be among the best
        // moves: else the nudge would point away from the best play.
        Skill::SafeBuilds => {
            clear && best_where(values, is_build).is_some_and(|b| b >= best - margin)
        }
        _ => clear,
    }
}

/// What the page says when it nudges on `skill` (a short, kind line, true
/// of a decision where [`open`] fires): the engine holds the words, the
/// page only shows them.
pub fn nudge_words(skill: Skill) -> &'static str {
    match skill {
        Skill::Pairs => "There is a pair to take.",
        Skill::Sums => "Some cards here add up to your card.",
        Skill::Building => "A build is on here.",
        Skill::SafeBuilds => "Some builds here are safer than others.",
        Skill::AnsweringBuilds => "Their build is worth answering.",
        Skill::NoSweep => "Mind what the table is left with.",
        Skill::Valuables => "Mind your aces and Cassinos here.",
        Skill::Trailing => "Which card you trail matters here.",
    }
}

/// The margin a clear chance must pass before the last deal, in points:
/// about twice the advisor's typical noise in a skill's gap (its standard
/// deviation across advisor seeds had a median of 0.18 in Classic and 0.22
/// in Royal, a 90th percentile of 0.38 and 0.43; `bin/noise.rs`,
/// `measurements/README.md`).
pub const MARGIN: f64 = 0.4;

/// The margin for `view`: [`MARGIN`] while the advisor samples, and in the
/// last deal, where its values are exact, the least loss the review counts
/// ([`advice::SOUND`]).
pub fn margin(view: &View) -> f64 {
    if view.perfect_information() {
        advice::SOUND
    } else {
        MARGIN
    }
}

/// The most candidates the last deal rates in full: a crowded table can
/// offer hundreds, and the exact solver's budget
/// ([`crate::search::SOLVER_BUDGET`]) is for a few. Past it the last deal is
/// rated as the earlier ones are.
pub const ALL_CAP: usize = 24;

/// The moves to value for the tutor: what the hint and the rating value
/// (the counter's shortlist and the move chosen) and, for each skill, the
/// counter's best-ranked move on each side if not there already: showing
/// the skill and not, leaving a sweep and not, trailing a valuable and not;
/// and for Trailing and SafeBuilds the best- and worst-ranked trail and
/// build. In the last deal, where the values are exact, every candidate
/// (up to [`ALL_CAP`]).
fn rated_moves(view: &View, chosen: Option<Move>, advisor: &mut SearchAgent) -> Vec<Move> {
    let ranked = advisor.ranked(view);
    let mut moves: Vec<Move> = if view.perfect_information() && ranked.len() <= ALL_CAP {
        ranked.clone()
    } else {
        ranked.iter().copied().take(advisor.width).collect()
    };
    let add = |m: Option<&Move>, moves: &mut Vec<Move>| {
        if let Some(&m) = m {
            if !moves.contains(&m) {
                moves.push(m);
            }
        }
    };
    if let Some(m) = chosen {
        add(Some(&m), &mut moves);
    }
    for skill in Skill::ALL {
        match skill {
            Skill::Trailing => {
                add(ranked.iter().find(|m| is_trail(m)), &mut moves);
                add(ranked.iter().rev().find(|m| is_trail(m)), &mut moves);
            }
            Skill::SafeBuilds => {
                add(ranked.iter().find(|m| is_build(m)), &mut moves);
                add(ranked.iter().rev().find(|m| is_build(m)), &mut moves);
            }
            _ => {
                add(ranked.iter().find(|m| good(skill, view, m)), &mut moves);
                add(ranked.iter().find(|m| !good(skill, view, m)), &mut moves);
            }
        }
    }
    moves
}

/// The advisor's values of the moves the tutor needs ([`rated_moves`]),
/// seeded from the view as the hint is. The hint and the rating use
/// [`advice::assessed`] and are unchanged.
pub fn assessed(view: &View, chosen: Option<Move>) -> Vec<(Move, f64)> {
    let mut advisor = SearchAgent::new(Rng::seeded(advice::advisor_seed(view)));
    let moves = rated_moves(view, chosen, &mut advisor);
    advisor.evaluate(view, &moves)
}

/// The advisor's values at each of a game's decisions ([`assessed`], with
/// the person's move among them), `None` where there was no choice. One pass
/// over the game serves the review ([`crate::review::review_with`]) and the
/// evidence ([`crate::learner::evidence_with`]), the expensive step of both.
pub type Pass = Vec<Option<Vec<(Move, f64)>>>;

/// [`Pass`] over `turns`, those that `wanted` only (the rest `None`).
pub fn pass_of(turns: &[Turn], wanted: impl Fn(&Turn) -> bool) -> Pass {
    turns
        .iter()
        .map(|t| {
            (t.view.candidates().len() >= 2 && wanted(t)).then(|| assessed(&t.view, Some(t.mv)))
        })
        .collect()
}

/// The clear chances in the person's decision to play `mv` in `view`,
/// with the advisor's values (deterministic, seeded from the view; see
/// [`chances_with`]). Empty unless it is the viewer's turn.
pub fn chances(view: &View, mv: &Move, margin: f64) -> Vec<Chance> {
    if view.to_move != Some(view.me) {
        return Vec::new();
    }
    chances_with(view, mv, margin, &assessed(view, Some(*mv)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_skill_has_a_short_nudge() {
        for skill in Skill::ALL {
            let words = nudge_words(skill);
            assert!(words.split_whitespace().count() <= 10, "{words}");
            assert!(words.ends_with('.'), "{words}");
        }
    }

    #[test]
    fn the_margin_is_the_noise_before_the_last_deal_and_sound_in_it() {
        use crate::session::{Prompt, Session, Settings};
        let mut s = Session::new(3, Settings::default());
        let (mut early, mut last) = (false, false);
        while s.prompt() != Prompt::Over {
            if s.prompt() == Prompt::NextHand {
                assert!(s.send("next"));
                continue;
            }
            let view = s.view();
            if view.perfect_information() {
                assert_eq!(margin(&view), advice::SOUND);
                last = true;
            } else {
                assert_eq!(margin(&view), MARGIN);
                early = true;
            }
            let mv = s.candidates()[0];
            assert!(s.send(&mv.to_string()));
        }
        assert!(early && last);
    }
    use crate::cards::{pack, CardSet};
    use crate::hand::Hand;
    use crate::rules::Rules;
    use crate::table::{Seat, Table};

    fn set(s: &str) -> CardSet {
        CardSet::parse(s).unwrap()
    }

    fn mv(s: &str) -> Move {
        Move::parse(s).unwrap()
    }

    /// South's view before moving: `table`, `hand`, a consistent first deal.
    fn view(rules: Rules, table: &str, hand: &str) -> View {
        let (h, _) = Hand::deal(rules, Seat::North, pack());
        let mut v = h.view(Seat::South, [0, 0]);
        v.table = Table::parse(&rules, table).unwrap();
        v.hand = set(hand);
        v.piles = [CardSet::EMPTY, CardSet::EMPTY];
        v.opponent_holds = 4;
        v.undealt = v.unseen().len() as u8 - 4;
        v
    }

    /// The chances in `v` for the move `chosen`, with these values.
    fn with(v: &View, chosen: &str, values: &[(&str, f64)]) -> Vec<(Skill, bool)> {
        full(v, chosen, values)
            .into_iter()
            .map(|c| (c.skill, c.met))
            .collect()
    }

    fn full(v: &View, chosen: &str, values: &[(&str, f64)]) -> Vec<Chance> {
        let values: Vec<(Move, f64)> = values.iter().map(|&(m, x)| (mv(m), x)).collect();
        chances_with(v, &mv(chosen), 0.1, &values)
    }

    #[test]
    fn a_chance_carries_its_size_in_points() {
        let v = view(C, "4D 6H", "4C 9S 2H 3H");
        let vals = [("take 4C 4D", 1.0), ("trail 9S", 0.25)];
        let got = full(&v, "trail 9S", &vals);
        assert_eq!(got.len(), 1);
        assert_eq!((got[0].skill, got[0].met), (Skill::Pairs, false));
        assert!((got[0].gap - 0.75).abs() < 1e-12, "{}", got[0].gap);
    }

    const C: Rules = Rules::CLASSIC;

    #[test]
    fn a_chance_is_open_whatever_is_chosen() {
        let v = view(C, "4D 6H", "4C 9S 2H 3H");
        let pairs = |list: &[(&str, f64)]| -> Vec<(Move, f64)> {
            list.iter().map(|&(m, x)| (mv(m), x)).collect()
        };
        let vals = pairs(&[("take 4C 4D", 1.0), ("trail 9S", 0.25), ("trail 3H", 0.2)]);
        assert!(open(Skill::Pairs, &v, 0.1, &vals));
        assert!(!open(Skill::Pairs, &v, 0.8, &vals), "within the margin");
        assert!(
            !open(Skill::Building, &v, 0.1, &vals),
            "no build to compare"
        );
        // Trailing is a chance only where the best move is a trail.
        assert!(!open(Skill::Trailing, &v, 0.01, &vals));
        let trails = pairs(&[("take 4C 4D", 0.1), ("trail 9S", 0.25), ("trail 3H", 0.2)]);
        assert!(open(Skill::Trailing, &v, 0.01, &trails));
        assert!(!open(Skill::Trailing, &v, 0.1, &trails));
    }

    #[test]
    fn a_safe_builds_nudge_needs_a_build_among_the_best() {
        let v = view(C, "5C KD 2D 6H", "3D 8S 2C 9H");
        let pairs = |list: &[(&str, f64)]| -> Vec<(Move, f64)> {
            list.iter().map(|&(m, x)| (mv(m), x)).collect()
        };
        // Two builds far apart, but a trail far better than either: a nudge
        // to choose the safer build would send the person off the best move.
        let vals = pairs(&[
            ("build 8 3D 5C", 0.0),
            ("trail 2C", 1.0),
            ("build 8 2C 6H", 0.8),
        ]);
        assert!(!open(Skill::SafeBuilds, &v, 0.1, &vals));
        // The best build within the margin of the best move: a chance.
        let vals = pairs(&[
            ("build 8 3D 5C", 0.0),
            ("trail 2C", 0.85),
            ("build 8 2C 6H", 0.8),
        ]);
        assert!(open(Skill::SafeBuilds, &v, 0.1, &vals));
    }

    fn shown(rules: Rules, table: &str, hand: &str, m: &str) -> Vec<Skill> {
        let v = view(rules, table, hand);
        let m = mv(m);
        assert!(v.candidates().contains(&m), "{m} is not a candidate");
        shows(&v, &m)
    }

    #[test]
    fn what_a_move_shows() {
        let r14 = Rules {
            aces_fourteen: true,
            ..Rules::ROYAL
        };
        // A double pair is Pairs only; a pair and a sum are both.
        assert_eq!(shown(C, "4D 4H", "4C 9S", "take 4C 4D 4H"), [Skill::Pairs]);
        assert_eq!(
            shown(C, "5D 3H 2S", "5C 9S", "take 5C 5D 3H 2S"),
            [Skill::Pairs, Skill::Sums]
        );
        assert_eq!(shown(C, "3D 2S", "5C 9S", "take 5C 3D 2S"), [Skill::Sums]);
        // A Classic court pair; a Royal king pairs too.
        assert_eq!(shown(C, "KD 2S", "KC 9S", "take KC KD"), [Skill::Pairs]);
        assert_eq!(
            shown(Rules::ROYAL, "KD 2S", "KC 9S", "take KC KD"),
            [Skill::Pairs]
        );
        // An ace at 1 pairs with an ace; at 14 it takes A+K as a sum.
        assert_eq!(shown(r14, "AD 2S", "AC 9S", "take AC AD"), [Skill::Pairs]);
        assert_eq!(
            shown(r14, "AD KD", "AC 9S", "take AC=14 AD KD"),
            [Skill::Sums]
        );
        // Building: one's own, new or added to; the opponent's is answering.
        assert_eq!(
            shown(C, "4D 9C", "3H 7S", "build 7 3H 4D"),
            [Skill::Building]
        );
        assert_eq!(
            shown(C, "[5 @S: 3H 2S] 2D", "3C 8D 5H", "build 8 3C on 2S"),
            [Skill::Building]
        );
        assert_eq!(
            shown(C, "[5 @N: 3H 2S]", "3C 8D", "build 8 3C on 2S"),
            [Skill::AnsweringBuilds]
        );
        assert_eq!(
            shown(C, "[5 @N: 3H 2S]", "5C 9D", "take 5C 3H 2S"),
            [Skill::AnsweringBuilds]
        );
        assert_eq!(shown(C, "[5 @S: 3H 2S]", "5C 9D", "take 5C 3H 2S"), []);
        assert_eq!(shown(C, "5C 2D", "9H 3S", "trail 9H"), []);
    }

    #[test]
    fn valuables_are_aces_and_the_two_cassinos() {
        for (c, yes) in [("AS", true), ("TD", true), ("2S", true), ("TS", false)] {
            assert_eq!(valuable(c.parse().unwrap()), yes, "{c}");
        }
    }

    #[test]
    fn pairs_met_missed_and_a_near_tie() {
        let v = view(C, "4D 6H", "4C 9S 2H 3H");
        let vals = [("take 4C 4D", 1.0), ("trail 9S", 0.0)];
        assert_eq!(with(&v, "take 4C 4D", &vals), vec![(Skill::Pairs, true)]);
        assert_eq!(with(&v, "trail 9S", &vals), vec![(Skill::Pairs, false)]);
        let tie = [("take 4C 4D", 1.0), ("trail 9S", 0.95)];
        assert_eq!(with(&v, "trail 9S", &tie), vec![]);
    }

    #[test]
    fn sums_met_missed_and_a_near_tie() {
        let v = view(C, "2D 3H KD", "5C 9S 8H 7H");
        let vals = [("take 5C 2D 3H", 1.0), ("trail 9S", 0.0)];
        assert_eq!(with(&v, "take 5C 2D 3H", &vals), vec![(Skill::Sums, true)]);
        assert_eq!(with(&v, "trail 9S", &vals), vec![(Skill::Sums, false)]);
        let tie = [("take 5C 2D 3H", 1.0), ("trail 9S", 0.95)];
        assert_eq!(with(&v, "trail 9S", &tie), vec![]);
    }

    #[test]
    fn a_capture_of_a_pair_and_a_sum_counts_for_both() {
        let v = view(C, "4D 3H AS", "4C 9S 8H 7H");
        let vals = [("take 4C 4D 3H AS", 1.0), ("trail 9S", 0.0)];
        let got = with(&v, "take 4C 4D 3H AS", &vals);
        assert_eq!(got, vec![(Skill::Pairs, true), (Skill::Sums, true)]);
    }

    #[test]
    fn building_met_missed_and_a_near_tie() {
        let v = view(C, "5C KD", "3D 8S 2C 9H");
        let vals = [("build 8 3D 5C", 1.0), ("trail 2C", 0.0)];
        assert_eq!(
            with(&v, "build 8 3D 5C", &vals),
            vec![(Skill::Building, true)]
        );
        assert_eq!(with(&v, "trail 2C", &vals), vec![(Skill::Building, false)]);
        let tie = [("build 8 3D 5C", 1.0), ("trail 2C", 0.95)];
        assert_eq!(with(&v, "trail 2C", &tie), vec![]);
    }

    #[test]
    fn answering_a_build_is_taking_or_raising_the_opponents() {
        let v = view(C, "[8: 5S 3H] 2D", "8C 2C 9S 4C");
        let vals = [("take 8C 5S 3H", 1.0), ("trail 9S", 0.0)];
        assert_eq!(
            with(&v, "take 8C 5S 3H", &vals),
            vec![(Skill::AnsweringBuilds, true)]
        );
        assert_eq!(
            with(&v, "trail 9S", &vals),
            vec![(Skill::AnsweringBuilds, false)]
        );
        // Taking only a loose card is not answering the build.
        let vals = [("take 2C 2D", 1.0), ("trail 9S", 0.0)];
        assert!(with(&v, "trail 9S", &vals)
            .iter()
            .all(|(s, _)| *s != Skill::AnsweringBuilds));
        // One's own build is not the opponent's.
        let mine = view(C, "[8 @S: 5S 3H] 2D", "8C 2C 9S 4C");
        let vals = [("take 8C 5S 3H", 1.0), ("trail 9S", 0.0)];
        assert_eq!(with(&mine, "trail 9S", &vals), vec![]);
    }

    #[test]
    fn no_sweep_is_a_chance_of_restraint() {
        let v = view(C, "4D", "5H KC 2C 3C");
        let vals = [("trail 5H", 0.0), ("trail KC", 1.0)];
        let met = with(&v, "trail KC", &vals);
        assert!(met.contains(&(Skill::NoSweep, true)), "{met:?}");
        let missed = with(&v, "trail 5H", &vals);
        assert!(missed.contains(&(Skill::NoSweep, false)), "{missed:?}");
        let tie = [("trail 5H", 0.95), ("trail KC", 1.0)];
        let none = with(&v, "trail 5H", &tie);
        assert!(!none.iter().any(|(s, _)| *s == Skill::NoSweep));
    }

    #[test]
    fn a_table_one_card_could_clear_is_a_danger_whether_or_not_sweeps_score() {
        // Clearing the table hands over every card on it, scored or not.
        let off = Rules { sweeps: false, ..C };
        let (on, off) = (view(C, "4D", "5H KC 2C 3C"), view(off, "4D", "5H KC 2C 3C"));
        for v in [&on, &off] {
            assert!(leaves_sweep(v, &mv("trail 5H")));
            assert!(!leaves_sweep(v, &mv("trail KC")));
        }
        let vals = [("trail 5H", 0.0), ("trail KC", 1.0)];
        for v in [&on, &off] {
            let missed = with(v, "trail 5H", &vals);
            assert!(missed.contains(&(Skill::NoSweep, false)), "{missed:?}");
            let met = with(v, "trail KC", &vals);
            assert!(met.contains(&(Skill::NoSweep, true)), "{met:?}");
        }
    }

    #[test]
    fn valuables_are_a_chance_of_restraint() {
        let v = view(C, "4D 9S", "AS 7H KC 2C");
        let vals = [("trail AS", 0.0), ("trail 7H", 1.0)];
        let met = with(&v, "trail 7H", &vals);
        assert!(met.contains(&(Skill::Valuables, true)), "{met:?}");
        let missed = with(&v, "trail AS", &vals);
        assert!(missed.contains(&(Skill::Valuables, false)), "{missed:?}");
        let tie = [("trail AS", 0.95), ("trail 7H", 1.0)];
        let none = with(&v, "trail AS", &tie);
        assert!(!none.iter().any(|(s, _)| *s == Skill::Valuables));
    }

    #[test]
    fn trailing_is_a_chance_when_trails_differ_and_one_is_best() {
        let v = view(C, "4D 9S", "4C 7H KC 2C");
        let vals = [("trail 7H", 1.0), ("trail KC", 0.5), ("trail 2C", 0.95)];
        let is = |got: Vec<(Skill, bool)>| -> Vec<(Skill, bool)> {
            got.into_iter()
                .filter(|(s, _)| *s == Skill::Trailing)
                .collect()
        };
        assert_eq!(
            is(with(&v, "trail 7H", &vals)),
            vec![(Skill::Trailing, true)]
        );
        assert_eq!(
            is(with(&v, "trail 2C", &vals)),
            vec![(Skill::Trailing, true)]
        );
        assert_eq!(
            is(with(&v, "trail KC", &vals)),
            vec![(Skill::Trailing, false)]
        );
        let close = [("trail 7H", 1.0), ("trail KC", 0.95)];
        assert_eq!(is(with(&v, "trail KC", &close)), vec![]);
        // A capture was best: the trail chosen was not the question.
        let vals = [("take 4C 4D", 2.0), ("trail 7H", 1.0), ("trail KC", 0.0)];
        assert_eq!(is(with(&v, "trail KC", &vals)), vec![]);
    }

    #[test]
    fn safe_builds_compare_builds_with_builds_only() {
        let v = view(C, "5C KD 2D 6H", "3D 8S 2C 9H");
        let safe = |got: Vec<(Skill, bool)>| -> Vec<(Skill, bool)> {
            got.into_iter()
                .filter(|(s, _)| *s == Skill::SafeBuilds)
                .collect()
        };
        // A build much worse than another build: a miss.
        let vals = [
            ("build 8 3D 5C", 0.0),
            ("trail 2C", 1.0),
            ("build 8 2C 6H", 0.8),
        ];
        assert_eq!(
            safe(with(&v, "build 8 3D 5C", &vals)),
            vec![(Skill::SafeBuilds, false)]
        );
        // The better of two builds, far from the worse: a hit, even though
        // a trail was better still.
        assert_eq!(
            safe(with(&v, "build 8 2C 6H", &vals)),
            vec![(Skill::SafeBuilds, true)]
        );
        // Builds alike, a trail far better: not the question of safety.
        let vals = [
            ("build 8 3D 5C", 0.0),
            ("trail 2C", 1.0),
            ("build 8 2C 6H", 0.05),
        ];
        assert_eq!(safe(with(&v, "build 8 3D 5C", &vals)), vec![]);
        // The only build: no chance.
        let vals = [("build 8 3D 5C", 1.0), ("trail 2C", 0.0)];
        assert_eq!(safe(with(&v, "build 8 3D 5C", &vals)), vec![]);
        // The gap is the best build less the worst.
        let vals: Vec<(Move, f64)> = [
            ("build 8 3D 5C", 0.0),
            ("trail 2C", 1.0),
            ("build 8 2C 6H", 0.8),
        ]
        .iter()
        .map(|&(m, x)| (mv(m), x))
        .collect();
        assert_eq!(gap(Skill::SafeBuilds, &v, &vals), Some(0.8));
    }

    #[test]
    fn every_skill_is_listed_once() {
        let mut all = Skill::ALL.to_vec();
        all.sort();
        all.dedup();
        assert_eq!(all.len(), Skill::ALL.len());
    }

    #[test]
    fn prerequisites_come_before_and_never_loop() {
        // ALL is in an order that puts every prerequisite first.
        for (i, s) in Skill::ALL.iter().enumerate() {
            for n in s.needs() {
                let j = Skill::ALL.iter().position(|x| x == n).unwrap();
                assert!(j < i, "{s:?} needs {n:?}, listed after it");
            }
        }
    }

    #[test]
    fn slugs_name_each_skill_once_and_read_back() {
        for s in Skill::ALL {
            assert_eq!(Skill::from_slug(s.slug()), Some(s));
        }
        assert_eq!(Skill::from_slug("nothing"), None);
    }

    #[test]
    fn building_needs_sums_and_pairs_need_nothing() {
        assert_eq!(Skill::Building.needs(), &[Skill::Sums]);
        assert!(Skill::Pairs.needs().is_empty());
    }

    /// The person's decisions in a game with their seat played at `skill`
    /// against the counter, as (view, move).
    fn decisions(rules: Rules, skill: f64, seed: u64) -> Vec<(View, Move)> {
        use crate::agents::Agent;
        use crate::session::{Prompt, Session, Settings};
        let mut s = Session::new(seed, Settings { rules, skill: 3.0 });
        let mut me = crate::opponent::Skill(skill).opponent(seed ^ 0x5eed);
        loop {
            match s.prompt() {
                Prompt::Play => {
                    let mv = me.choose(&s.view());
                    assert!(s.send(&mv.to_string()));
                }
                Prompt::NextHand => assert!(s.send("next")),
                Prompt::Over => break,
            }
        }
        s.turns().iter().map(|t| (t.view, t.mv)).collect()
    }

    /// The chances over the games' decisions.
    fn tally(rules: Rules, skill: f64, seeds: std::ops::Range<u64>) -> Vec<Chance> {
        let mut all = Vec::new();
        for seed in seeds {
            for (v, m) in decisions(rules, skill, seed) {
                all.extend(chances(&v, &m, 0.15));
            }
        }
        all
    }

    /// Both sides of every skill the position offers are among the moves
    /// rated, though the counter's shortlist may hold only one.
    #[test]
    fn the_rated_moves_hold_both_sides_of_each_skill() {
        let (mut positions, mut shortlist_lacked) = (0, 0);
        for seed in 0..2 {
            for (v, m) in decisions(C, 4.0, seed) {
                if v.to_move != Some(v.me) || v.candidates().len() < 2 {
                    continue;
                }
                positions += 1;
                let rated: Vec<Move> = assessed(&v, Some(m)).into_iter().map(|x| x.0).collect();
                let short: Vec<Move> = advice::assessed(&v, Some(m))
                    .into_iter()
                    .map(|x| x.0)
                    .collect();
                let all = v.candidates();
                if v.perfect_information() && all.len() <= ALL_CAP {
                    assert!(all.iter().all(|c| rated.contains(c)), "last deal");
                    continue;
                }
                assert!(rated.contains(&m));
                for skill in Skill::ALL {
                    // How many moves of each side: (shows, does not), or
                    // for the two that compare kinds, (of the kind, 0).
                    let sides = |moves: &[Move]| -> (usize, usize) {
                        let n = |f: &dyn Fn(&Move) -> bool| moves.iter().filter(|x| f(x)).count();
                        match skill {
                            Skill::Trailing => (n(&is_trail).min(2), 0),
                            Skill::SafeBuilds => (n(&is_build).min(2), 0),
                            _ => (
                                n(&|x| good(skill, &v, x)).min(1),
                                n(&|x| !good(skill, &v, x)).min(1),
                            ),
                        }
                    };
                    assert_eq!(sides(&rated), sides(&all), "{skill:?}");
                    shortlist_lacked += usize::from(sides(&short) != sides(&all));
                }
            }
        }
        assert!(positions > 20);
        assert!(shortlist_lacked > 0, "the shortlist always held both sides");
    }

    #[test]
    fn the_top_rung_meets_its_safe_build_chances_as_it_does_the_others() {
        let top = tally(C, 4.0, 0..3);
        let rate = |keep: &dyn Fn(Skill) -> bool| {
            let xs: Vec<&Chance> = top.iter().filter(|c| keep(c.skill)).collect();
            (xs.iter().filter(|c| c.met).count(), xs.len())
        };
        let (met, n) = rate(&|s| s == Skill::SafeBuilds);
        assert!(n >= 3, "{n} safe-build chances");
        assert!(met as f64 >= 0.7 * n as f64, "{met} of {n} met");
    }

    #[test]
    fn the_top_rung_meets_nearly_all_its_chances_and_greedy_never_builds() {
        let top = tally(C, 4.0, 0..2);
        assert!(top.len() >= 10, "{} chances", top.len());
        let met = top.iter().filter(|c| c.met).count();
        assert!(
            met as f64 >= 0.8 * top.len() as f64,
            "{met} of {} met",
            top.len()
        );
        let greedy = tally(C, 2.0, 0..2);
        assert!(
            greedy.iter().any(|c| c.skill == Skill::Building),
            "greedy had no building chance"
        );
        assert!(!greedy.iter().any(|c| c.skill == Skill::Building && c.met));
    }
}
