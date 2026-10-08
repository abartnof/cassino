//! A review of the person's game, offered when it is over (`docs/DESIGN.md`
//! §12.4): gentle, and about habits, never a single move.
//!
//! The game is looked at three ways:
//!
//! - **Each decision against the strongest play.** Every move the person
//!   chose (forced ones aside) is rated by the advisor, the top rung in their
//!   place seeing only what they saw ([`advice::rate`]). A move that gave up
//!   more than [`advice::SOUND`] is a slip, and each slip is put down to one
//!   [`Theme`] by comparing it with the stronger move: a capture let go, a
//!   build not made, a build that cost, a smaller capture, a table left for
//!   one card to clear, an ace or a Cassino trailed, the choice of a trail.
//! - **The mix of moves against the strongest play's**, on the same
//!   positions, so that luck cancels: how often building was right and the
//!   person built. This is what a single move cannot show, and what a
//!   long-range habit (never building, say) looks like.
//! - **The hands' counts**: who took the cards, the spades, the Cassinos and
//!   the aces. These carry luck, so they are only ever praise.
//!
//! The advisor samples before the last deal, so a single slip may be its
//! noise: a habit is mentioned only when it showed at least twice and cost at
//! least two points in all ([`HABIT_SLIPS`], [`HABIT_POINTS`]). Measured with
//! the rungs in the person's seat against the counter (20 games of each
//! game), the top rung's slips never came to two points in any theme in
//! any of its 40 games, while random play's captures let go cost a median
//! of 12 to 16 points a game, greedy's builds not made 9 to 12, and the
//! counter's choice of trails about 2.

use crate::advice::{self, Note};
use crate::moves::Move;
use crate::observation::View;
use crate::scoring::Breakdown;
use crate::table::Seat;
use crate::tutor::{self, valuable};

/// One of the person's decisions: what they could see, and what they played.
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct Turn {
    pub view: View,
    pub mv: Move,
    /// The person was helped with this decision: a hint was asked for, the
    /// tutor's nudge was shown, or a warning. It is no evidence of what they know
    /// ([`crate::learner`]).
    pub assisted: bool,
}

/// What a slip is put down to.
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Theme {
    /// A capture was strongest, and the person trailed or built.
    Taking,
    /// A build was strongest, and the person took or trailed.
    Building,
    /// The person's build cost more than another move: a build at risk, or
    /// the wrong one.
    Builds,
    /// The person took, and another capture, or holding back, was stronger.
    Captures,
    /// The move left a table one card could clear, and the stronger did not.
    Sweeps,
    /// An ace or a Cassino trailed when another card could have gone.
    Valuables,
    /// Both trailed, a different card.
    Trailing,
    /// The last deal of each hand cost more than the deals before it.
    LastDeal,
}

/// How one theme went: how often it came up, how often the person's move
/// was of the stronger move's kind (Taking, Building) or as good as it (the
/// rest), how often it slipped, and the points the slips gave up by the
/// advisor's reckoning.
#[derive(Copy, Clone, Debug, PartialEq, Default)]
pub struct Tally {
    pub chances: u32,
    pub matched: u32,
    pub slips: u32,
    pub loss: f64,
}

/// Something that went well.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Strength {
    /// When a capture was strongest, the person nearly always took.
    Taking {
        found: u32,
        chances: u32,
    },
    /// When a build was strongest, the person mostly built.
    Building {
        found: u32,
        chances: u32,
    },
    /// The last deals played as the strongest play would.
    LastDeal,
    /// No table left for one card to clear when a safer move was there,
    /// and this many turns on which some move would have left one.
    Careful {
        avoided: u32,
    },
    /// The most cards in this many hands of these.
    Cards {
        won: u32,
        hands: u32,
    },
    Spades {
        won: u32,
        hands: u32,
    },
    /// Both Cassinos, this many of the hands' 2 each.
    Cassinos {
        taken: u32,
        of: u32,
    },
    Aces {
        taken: u32,
        of: u32,
    },
}

/// A slip lost at least this much to count.
pub use crate::advice::SOUND;

/// A habit is mentioned only when it slipped at least this often...
pub const HABIT_SLIPS: u32 = 2;
/// ...and gave up at least this many points in all.
pub const HABIT_POINTS: f64 = 2.0;
/// At most this many habits to work on, and this many strengths.
pub const MOST_TRIES: usize = 2;
pub const MOST_STRENGTHS: usize = 2;
/// Fewer decisions than this tell little.
pub const FEW: u32 = 10;

#[derive(Clone, Debug, PartialEq)]
pub struct Review {
    /// Decisions with a choice in them.
    pub decisions: u32,
    /// Of them, those as good as the strongest play (within `SOUND`).
    pub sound: u32,
    /// The points given up in all.
    pub loss: f64,
    /// Every theme's tally, `LastDeal`'s chances being the decisions in last
    /// deals.
    pub tallies: Vec<(Theme, Tally)>,
    /// The habits to work on, the costliest first.
    pub tries: Vec<Theme>,
    pub strengths: Vec<Strength>,
}

pub(crate) fn is_capture(m: &Move) -> bool {
    matches!(m, Move::Capture { .. })
}
pub(crate) fn is_build(m: &Move) -> bool {
    matches!(m, Move::Build { .. })
}
pub(crate) fn is_trail(m: &Move) -> bool {
    matches!(m, Move::Trail { .. })
}

/// Whether `mv` leaves a table one card could clear for the opponent, by a
/// card they might hold. Whether or not sweeps are scored: clearing the
/// table hands over every card on it either way.
pub(crate) fn leaves_sweep(view: &View, mv: &Move) -> bool {
    advice::notes(view, view.me, mv)
        .iter()
        .any(|n| matches!(n, Note::SweepOpen { next, .. } if *next != view.me))
}

/// What a slip is put down to: the most basic difference first.
fn theme_of(view: &View, mine: &Move, best: &Move) -> Theme {
    if is_capture(best) && !is_capture(mine) {
        Theme::Taking
    } else if leaves_sweep(view, mine) && !leaves_sweep(view, best) {
        Theme::Sweeps
    } else if is_trail(mine) && valuable(mine.card()) && !(is_trail(best) && valuable(best.card()))
    {
        Theme::Valuables
    } else if is_build(best) && !is_build(mine) {
        Theme::Building
    } else if is_build(mine) {
        Theme::Builds
    } else if is_capture(mine) {
        Theme::Captures
    } else {
        Theme::Trailing
    }
}

/// The review of a game from the person's decisions and the hands' counts.
pub fn review(turns: &[Turn], history: &[Breakdown]) -> Review {
    review_with(turns, history, &tutor::pass_of(turns, |_| true))
}

/// [`review`] from the advisor's values already worked out
/// ([`tutor::pass_of`] over every decision), which the evidence shares.
pub fn review_with(turns: &[Turn], history: &[Breakdown], pass: &tutor::Pass) -> Review {
    use std::collections::BTreeMap;
    let mut tallies: BTreeMap<Theme, Tally> = BTreeMap::new();
    let (mut decisions, mut sound, mut loss) = (0u32, 0u32, 0.0f64);
    // The same, for the decisions made without help: only they are
    // evidence of what the person knows, so only they make habits and
    // strengths.
    let (mut unaided, mut unaided_loss) = (0u32, 0.0f64);
    let (mut last, mut last_loss, mut last_slips) = (0u32, 0.0f64, 0u32);
    // Tables left for one card to clear when the stronger move left none,
    // whatever theme their slip was put down to.
    let mut left_to_clear = 0u32;
    // Turns on which some move would have left such a table, and the
    // person's did not: the danger was there, and seen to.
    let mut avoided = 0u32;
    for (turn, values) in turns.iter().zip(pass) {
        let view = &turn.view;
        if view.candidates().len() < 2 {
            continue;
        }
        let Some(values) = values else { continue };
        let rating = advice::rating_from(values, &turn.mv);
        let lost = (rating.best_value - rating.value).max(0.0);
        let (mine, best) = (&turn.mv, &rating.best);
        decisions += 1;
        loss += lost;
        let slipped = lost > SOUND;
        if !slipped {
            sound += 1;
        }
        if turn.assisted {
            continue;
        }
        unaided += 1;
        unaided_loss += lost;
        if leaves_sweep(view, mine) {
            if !leaves_sweep(view, best) {
                left_to_clear += 1;
            }
        } else if view.candidates().iter().any(|m| leaves_sweep(view, m)) {
            avoided += 1;
        }
        if view.deal == 6 {
            last += 1;
            last_loss += lost;
            last_slips += u32::from(slipped);
        }
        // The chances each theme had, from the stronger move and the
        // person's own, and whether the person met them.
        let mut chance = |t: Theme, met: bool| {
            let x = tallies.entry(t).or_default();
            x.chances += 1;
            x.matched += u32::from(met);
        };
        if is_capture(best) {
            chance(Theme::Taking, is_capture(mine));
        }
        if is_build(best) {
            chance(Theme::Building, is_build(mine));
        }
        if is_build(mine) {
            chance(Theme::Builds, !slipped);
        }
        if is_capture(mine) {
            chance(Theme::Captures, !slipped);
        }
        chance(Theme::Sweeps, !slipped);
        if is_trail(mine) && valuable(mine.card()) {
            chance(Theme::Valuables, !slipped);
        }
        if is_trail(mine) && is_trail(best) {
            chance(Theme::Trailing, !slipped);
        }
        if slipped {
            let t = tallies.entry(theme_of(view, mine, best)).or_default();
            t.slips += 1;
            t.loss += lost;
        }
    }
    // The last deal, against the deals before it: what it cost beyond their
    // rate.
    let early = unaided - last;
    let early_rate = if early > 0 {
        (unaided_loss - last_loss) / f64::from(early)
    } else {
        0.0
    };
    tallies.insert(
        Theme::LastDeal,
        Tally {
            chances: last,
            matched: last - last_slips,
            slips: last_slips,
            loss: (last_loss - early_rate * f64::from(last)).max(0.0),
        },
    );
    let tally = |t: Theme| tallies.get(&t).copied().unwrap_or_default();

    let last_rate = if last > 0 {
        last_loss / f64::from(last)
    } else {
        0.0
    };
    let mut tries: Vec<(Theme, f64)> = tallies
        .iter()
        .filter(|(&t, x)| {
            x.slips >= HABIT_SLIPS
                && x.loss >= HABIT_POINTS
                && (t != Theme::LastDeal || (last >= 4 && last_rate > 2.0 * early_rate))
        })
        .map(|(&t, x)| (t, x.loss))
        .collect();
    tries.sort_by(|a, b| b.1.total_cmp(&a.1));
    let tries: Vec<Theme> = tries.into_iter().take(MOST_TRIES).map(|x| x.0).collect();

    let mut strengths = Vec::new();
    let found = |t: Theme| {
        let x = tally(t);
        (x.matched, x.chances)
    };
    let (taken, takes) = found(Theme::Taking);
    if takes >= 5 && f64::from(taken) >= 0.9 * f64::from(takes) {
        strengths.push(Strength::Taking {
            found: taken,
            chances: takes,
        });
    }
    let (built, builds) = found(Theme::Building);
    if builds >= 3 && 3 * built >= 2 * builds {
        strengths.push(Strength::Building {
            found: built,
            chances: builds,
        });
    }
    // Only from a player solid before it too: a last deal holds few real
    // choices, and a careless one can come through it clean by luck.
    if last >= 6 && last_rate <= 0.1 && early_rate <= 0.3 {
        strengths.push(Strength::LastDeal);
    }
    if unaided >= FEW && left_to_clear == 0 && avoided >= 3 {
        strengths.push(Strength::Careful { avoided });
    }
    let hands = history.len() as u32;
    let me = Seat::South;
    let won = |f: &dyn Fn(&Breakdown) -> bool| history.iter().filter(|b| f(b)).count() as u32;
    if hands >= 2 {
        let cards = won(&|b| b.cards == Some(me));
        if 2 * cards > hands {
            strengths.push(Strength::Cards { won: cards, hands });
        }
        let spades = won(&|b| b.spades == Some(me));
        if 2 * spades > hands {
            strengths.push(Strength::Spades { won: spades, hands });
        }
        let cassinos = won(&|b| b.big_casino == Some(me)) + won(&|b| b.little_casino == Some(me));
        if 2 * cassinos > 2 * hands {
            strengths.push(Strength::Cassinos {
                taken: cassinos,
                of: 2 * hands,
            });
        }
        let aces: u32 = history
            .iter()
            .map(|b| b.aces.iter().filter(|a| **a == Some(me)).count() as u32)
            .sum();
        if 2 * aces > 4 * hands {
            strengths.push(Strength::Aces {
                taken: aces,
                of: 4 * hands,
            });
        }
    }
    // Never praised for what is also to work on.
    strengths.retain(|s| {
        let theme = match s {
            Strength::Taking { .. } => Some(Theme::Taking),
            Strength::Building { .. } => Some(Theme::Building),
            Strength::LastDeal => Some(Theme::LastDeal),
            Strength::Careful { .. } => Some(Theme::Sweeps),
            _ => None,
        };
        theme.is_none_or(|t| !tries.contains(&t))
    });
    strengths.truncate(MOST_STRENGTHS);

    Review {
        decisions,
        sound,
        loss,
        tallies: tallies.into_iter().collect(),
        tries,
        strengths,
    }
}

pub(crate) fn times(n: u32) -> String {
    match n {
        1 => "Once".into(),
        2 => "Twice".into(),
        n => format!("{} times", number(n)),
    }
}

/// Small numbers in words, as a sentence's first word wants them.
pub(crate) fn number(n: u32) -> String {
    const WORDS: [&str; 11] = [
        "No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    ];
    WORDS
        .get(n as usize)
        .map_or_else(|| n.to_string(), |w| w.to_string())
}

impl Review {
    pub fn tally(&self, theme: Theme) -> Tally {
        self.tallies
            .iter()
            .find(|(t, _)| *t == theme)
            .map(|x| x.1)
            .unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents::Agent;
    use crate::opponent::Skill;
    use crate::rules::Rules;
    use crate::session::{Prompt, Session, Settings};

    /// A game with the person's seat played at `skill`, against the counter.
    fn played(rules: Rules, skill: f64, seed: u64) -> Session {
        let mut s = Session::new(seed, Settings { rules, skill: 3.0 });
        let mut me = Skill(skill).opponent(seed ^ 0x5eed);
        for _ in 0..2_000 {
            match s.prompt() {
                Prompt::Play => {
                    let mv = me.choose(&s.view());
                    assert!(s.send(&mv.to_string()));
                }
                Prompt::NextHand => assert!(s.send("next")),
                Prompt::Over => return s,
            }
        }
        panic!("the game did not end")
    }

    fn reviews(rules: Rules, skill: f64) -> Vec<Review> {
        (0..4)
            .map(|seed| played(rules, skill, seed).review().expect("a review"))
            .collect()
    }

    #[test]
    fn a_player_who_never_builds_hears_about_building() {
        for rules in [Rules::CLASSIC, Rules::ROYAL] {
            let rs = reviews(rules, 2.0);
            let told = rs
                .iter()
                .filter(|r| r.tries.contains(&Theme::Building))
                .count();
            assert!(told >= 3, "{rules:?}: building in {told} of 4");
            for r in &rs {
                assert_eq!(r.tally(Theme::Builds).chances, 0, "greedy never builds");
                assert_eq!(r.tally(Theme::Building).matched, 0);
            }
        }
    }

    /// `played`, with a hint asked for at every decision.
    fn played_with_hints(rules: Rules, skill: f64, seed: u64) -> Session {
        let mut s = Session::new(seed, Settings { rules, skill: 3.0 });
        let mut me = Skill(skill).opponent(seed ^ 0x5eed);
        for _ in 0..2_000 {
            match s.prompt() {
                Prompt::Play => {
                    assert!(s.send("hint"));
                    let mv = me.choose(&s.view());
                    assert!(s.send(&mv.to_string()));
                }
                Prompt::NextHand => assert!(s.send("next")),
                Prompt::Over => return s,
            }
        }
        panic!("the game did not end")
    }

    #[test]
    fn nothing_is_praised_that_a_hint_gave() {
        let skill_praise = |r: &Review| {
            r.strengths.iter().any(|s| {
                matches!(
                    s,
                    Strength::Taking { .. }
                        | Strength::Building { .. }
                        | Strength::LastDeal
                        | Strength::Careful { .. }
                )
            })
        };
        let mut unaided = 0;
        for seed in 0..4 {
            let r = played(Rules::CLASSIC, 4.0, seed).review().unwrap();
            unaided += usize::from(skill_praise(&r));
            let s = played_with_hints(Rules::CLASSIC, 4.0, seed);
            assert!(s.turns().iter().all(|t| t.assisted));
            let r = s.review().unwrap();
            assert!(!skill_praise(&r), "seed {seed}: {:?}", r.strengths);
            assert!(r.tries.is_empty(), "nor blamed for it: {:?}", r.tries);
        }
        assert!(unaided >= 2, "the strongest play earns praise: {unaided}");
    }

    #[test]
    fn a_random_player_hears_first_about_taking() {
        let rs = reviews(Rules::CLASSIC, 1.0);
        let first = rs
            .iter()
            .filter(|r| r.tries.first() == Some(&Theme::Taking))
            .count();
        assert!(first >= 3, "taking first in {first} of 4");
    }

    #[test]
    fn the_strongest_play_hears_little_to_work_on() {
        let rs = reviews(Rules::CLASSIC, 4.0);
        let quiet = rs.iter().filter(|r| r.tries.is_empty()).count();
        assert!(quiet >= 3, "nothing to work on in {quiet} of 4");
        for r in &rs {
            assert!(
                r.sound * 10 >= r.decisions * 8,
                "{} of {}",
                r.sound,
                r.decisions
            );
        }
    }

    /// A game with the person always playing the first move offered: a
    /// player who trails whatever the table holds.
    fn first_offered(rules: Rules, seed: u64) -> Session {
        first_offered_against(rules, seed, 3.0)
    }

    fn first_offered_against(rules: Rules, seed: u64, skill: f64) -> Session {
        let mut s = Session::new(seed, Settings { rules, skill });
        for _ in 0..2_000 {
            match s.prompt() {
                Prompt::Play => {
                    let mv = s.candidates()[0];
                    assert!(s.send(&mv.to_string()));
                }
                Prompt::NextHand => assert!(s.send("next")),
                Prompt::Over => return s,
            }
        }
        panic!("the game did not end")
    }

    #[test]
    fn careful_only_when_no_table_was_left_to_clear() {
        // Seen at the table: a player who trailed every time, their slips
        // put down to the captures let go, was praised as careful.
        for seed in 0..4 {
            let s = first_offered(Rules::ROYAL, seed);
            let r = s.review().unwrap();
            let Some(&Strength::Careful { avoided }) = r
                .strengths
                .iter()
                .find(|x| matches!(x, Strength::Careful { .. }))
            else {
                continue;
            };
            assert!(
                avoided >= 3,
                "seed {seed}: careful, with no table to clear in view"
            );
            for turn in s.turns() {
                if turn.view.candidates().len() < 2 {
                    continue;
                }
                let best = advice::rate(&turn.view, &turn.mv).unwrap().best;
                assert!(
                    !(leaves_sweep(&turn.view, &turn.mv) && !leaves_sweep(&turn.view, &best)),
                    "seed {seed}: praised as careful, yet {} left a table to clear",
                    turn.mv
                );
            }
        }
    }

    #[test]
    fn no_praise_for_a_careless_players_clean_last_deals() {
        // Seen in the terminal: always the first move offered, and "You
        // played the last deals cleanly".
        for seed in 0..4 {
            let r = first_offered_against(Rules::CLASSIC, seed, 4.0)
                .review()
                .unwrap();
            assert!(
                !r.strengths.contains(&Strength::LastDeal),
                "seed {seed}: {:?}",
                r.strengths
            );
        }
    }

    /// Every review holds together, whatever the rules and whoever plays:
    /// its counts agree, each habit clears the bar, nothing praised is also
    /// to work on, and the same game, restored, is reviewed alike.
    #[test]
    fn every_review_holds_together() {
        let variants = [
            Rules::CLASSIC,
            Rules {
                sweeps: false,
                ..Rules::CLASSIC
            },
            Rules {
                aces_fourteen: true,
                ..Rules::ROYAL
            },
            Rules {
                raising: false,
                sweeps: false,
                ..Rules::ROYAL
            },
        ];
        let mut games = 0;
        for (k, rules) in variants.into_iter().enumerate() {
            for (j, who) in [Some(1.0), Some(2.0), Some(2.5), Some(3.0), None]
                .into_iter()
                .enumerate()
            {
                let seed = 40 + (k * 5 + j) as u64;
                let s = match who {
                    Some(skill) => played(rules, skill, seed),
                    None => first_offered(rules, seed),
                };
                let r = s.review().unwrap();
                games += 1;
                let label = format!("{rules:?} {who:?} seed {seed}");
                assert!(
                    r.decisions > 0 && r.decisions <= s.turns().len() as u32,
                    "{label}"
                );
                assert!(
                    r.sound <= r.decisions && r.loss >= 0.0 && r.loss.is_finite(),
                    "{label}"
                );
                for (t, x) in &r.tallies {
                    assert!(x.matched <= x.chances, "{label}: {t:?} {x:?}");
                    assert!(x.loss >= 0.0 && x.loss.is_finite(), "{label}: {t:?} {x:?}");
                    if !matches!(t, Theme::Sweeps | Theme::LastDeal) {
                        assert!(x.slips <= x.chances, "{label}: {t:?} {x:?}");
                    }
                }
                assert!(r.tries.len() <= MOST_TRIES && r.strengths.len() <= MOST_STRENGTHS);
                for w in r.tries.windows(2) {
                    assert!(
                        r.tally(w[0]).loss >= r.tally(w[1]).loss,
                        "{label}: the costliest first"
                    );
                }
                for t in &r.tries {
                    let x = r.tally(*t);
                    assert!(
                        x.slips >= HABIT_SLIPS && x.loss >= HABIT_POINTS,
                        "{label}: {t:?} {x:?}"
                    );
                }
                let clash = |s: &Strength| match s {
                    Strength::Taking { .. } => Some(Theme::Taking),
                    Strength::Building { .. } => Some(Theme::Building),
                    Strength::LastDeal => Some(Theme::LastDeal),
                    Strength::Careful { .. } => Some(Theme::Sweeps),
                    _ => None,
                };
                for st in &r.strengths {
                    assert!(
                        clash(st).is_none_or(|t| !r.tries.contains(&t)),
                        "{label}: {st:?} and {:?}",
                        r.tries
                    );
                }
                // The same game, restored, reviewed alike: the review is a
                // pure function of the record.
                if games % 2 == 0 {
                    let back = Session::restore(&s.saved()).unwrap();
                    assert_eq!(back.review(), Some(r.clone()), "{label}: restored");
                }
            }
        }
        assert_eq!(games, 20);
    }

    #[test]
    fn an_undone_move_is_not_reviewed() {
        // Undo, then play on: the review sees only the moves that stood.
        let mut s = Session::new(
            23,
            Settings {
                rules: Rules::CLASSIC,
                skill: 3.0,
            },
        );
        let first = s.candidates()[0];
        assert!(s.send(&first.to_string()));
        assert!(s.send("undo"));
        let mut kept = Vec::new();
        for _ in 0..2_000 {
            match s.prompt() {
                Prompt::Play => {
                    let c = s.candidates();
                    let mv = c[c.len() - 1];
                    kept.push(mv);
                    assert!(s.send(&mv.to_string()));
                }
                Prompt::NextHand => assert!(s.send("next")),
                Prompt::Over => break,
            }
        }
        let turns: Vec<Move> = s.turns().iter().map(|t| t.mv).collect();
        assert_eq!(turns, kept);
        assert!(s.review().is_some());
    }

    #[test]
    fn nothing_to_go_on_says_so() {
        let r = review(&[], &[]);
        assert_eq!((r.decisions, r.tries.len(), r.strengths.len()), (0, 0, 0));
    }
}
