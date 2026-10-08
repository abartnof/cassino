//! The tutor (`docs/DESIGN.md` §12.8): the skills a game can show, and
//! which each needs first.

use crate::advice;
use crate::cards::{Card, ACE};
use crate::moves::Move;
use crate::observation::View;
use crate::review::{is_build, is_trail, leaves_sweep};

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
///   opponent ([`leaves_sweep`]; whether or not sweeps are scored, since
///   clearing the table takes every card on it).
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
/// - **SafeBuilds**: asked only when the person built. If another move
///   was better by more than the margin, a chance, not met. Otherwise,
///   if some other build was worse than the best move by more than the
///   margin, a chance, met: the build chosen was among the safe ones.
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
) -> Vec<(Skill, bool)> {
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
                if is_trail(chosen)
                    && best_trail >= best
                    && gap(skill, view, values).is_some_and(|g| g > margin)
                {
                    out.push((skill, mine >= best_trail - margin));
                }
            }
            Skill::SafeBuilds => {
                if !is_build(chosen) {
                    continue;
                }
                if best - mine > margin {
                    out.push((skill, false));
                } else if worst_where(values, is_build).is_some_and(|w| best - w > margin) {
                    out.push((skill, true));
                }
            }
            _ => {
                if gap(skill, view, values).is_some_and(|g| g > margin) {
                    out.push((skill, good(skill, view, chosen)));
                }
            }
        }
    }
    out
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

/// The clear chances in the person's decision to play `mv` in `view`,
/// with the advisor's values (deterministic, seeded from the view; see
/// [`chances_with`]). Empty unless it is the viewer's turn.
pub fn chances(view: &View, mv: &Move, margin: f64) -> Vec<(Skill, bool)> {
    if view.to_move != Some(view.me) {
        return Vec::new();
    }
    chances_with(view, mv, margin, &advice::assessed(view, Some(*mv)))
}

#[cfg(test)]
mod tests {
    use super::*;

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
        let values: Vec<(Move, f64)> = values.iter().map(|&(m, x)| (mv(m), x)).collect();
        chances_with(v, &mv(chosen), 0.1, &values)
    }

    const C: Rules = Rules::CLASSIC;

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
    fn safe_builds_a_build_that_cost_is_missed_and_a_sound_one_met() {
        let v = view(C, "5C KD 2D 6H", "3D 8S 2C 9H");
        // The build is much worse than the best: a miss.
        let vals = [
            ("build 8 3D 5C", 0.0),
            ("trail 2C", 1.0),
            ("build 8 2C 6H", 0.0),
        ];
        let got = with(&v, "build 8 3D 5C", &vals);
        assert!(got.contains(&(Skill::SafeBuilds, false)), "{got:?}");
        // The build is the best, another build is worse: a hit.
        let vals = [("build 8 3D 5C", 1.0), ("build 8 2C 6H", 0.0)];
        let got = with(&v, "build 8 3D 5C", &vals);
        assert!(got.contains(&(Skill::SafeBuilds, true)), "{got:?}");
        // The only build, and best: no chance.
        let vals = [("build 8 3D 5C", 1.0), ("trail 2C", 0.95)];
        let got = with(&v, "build 8 3D 5C", &vals);
        assert!(!got.iter().any(|(s, _)| *s == Skill::SafeBuilds));
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
    fn tally(rules: Rules, skill: f64, seeds: std::ops::Range<u64>) -> Vec<(Skill, bool)> {
        let mut all = Vec::new();
        for seed in seeds {
            for (v, m) in decisions(rules, skill, seed) {
                all.extend(chances(&v, &m, 0.15));
            }
        }
        all
    }

    #[test]
    fn the_top_rung_meets_nearly_all_its_chances_and_greedy_never_builds() {
        let top = tally(C, 4.0, 0..2);
        assert!(top.len() >= 10, "{} chances", top.len());
        let met = top.iter().filter(|c| c.1).count();
        assert!(
            met as f64 >= 0.8 * top.len() as f64,
            "{met} of {} met",
            top.len()
        );
        let greedy = tally(C, 2.0, 0..2);
        assert!(
            greedy.iter().any(|c| c.0 == Skill::Building),
            "greedy had no building chance"
        );
        assert!(!greedy.contains(&(Skill::Building, true)));
    }
}
