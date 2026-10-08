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
use crate::cards::{Card, ACE};
use crate::moves::Move;
use crate::observation::View;
use crate::rules::Rules;
use crate::scoring::Breakdown;
use crate::table::Seat;

/// One of the person's decisions: what they could see, and what they played.
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct Turn {
    pub view: View,
    pub mv: Move,
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
    /// Whether sweeps scored.
    pub sweeps_score: bool,
}

fn is_capture(m: &Move) -> bool {
    matches!(m, Move::Capture { .. })
}
fn is_build(m: &Move) -> bool {
    matches!(m, Move::Build { .. })
}
fn is_trail(m: &Move) -> bool {
    matches!(m, Move::Trail { .. })
}
fn valuable(card: Card) -> bool {
    card.rank() == ACE || card == Card::BIG_CASINO || card == Card::LITTLE_CASINO
}

/// Whether `mv` leaves a table one card could clear for the opponent, by a
/// card they might hold.
fn leaves_sweep(view: &View, mv: &Move) -> bool {
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
pub fn review(rules: &Rules, turns: &[Turn], history: &[Breakdown]) -> Review {
    use std::collections::BTreeMap;
    let mut tallies: BTreeMap<Theme, Tally> = BTreeMap::new();
    let (mut decisions, mut sound, mut loss) = (0u32, 0u32, 0.0f64);
    let (mut last, mut last_loss, mut last_slips) = (0u32, 0.0f64, 0u32);
    // Tables left for one card to clear when the stronger move left none,
    // whatever theme their slip was put down to.
    let mut left_to_clear = 0u32;
    // Turns on which some move would have left such a table, and the
    // person's did not: the danger was there, and seen to.
    let mut avoided = 0u32;
    for turn in turns {
        let view = &turn.view;
        if view.candidates().len() < 2 {
            continue;
        }
        let Some(rating) = advice::rate(view, &turn.mv) else {
            continue;
        };
        let lost = (rating.best_value - rating.value).max(0.0);
        let (mine, best) = (&turn.mv, &rating.best);
        decisions += 1;
        loss += lost;
        let slipped = lost > SOUND;
        if !slipped {
            sound += 1;
        }
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
    let early = decisions - last;
    let early_rate = if early > 0 {
        (loss - last_loss) / f64::from(early)
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
    if last >= 6 && last_rate <= 0.1 {
        strengths.push(Strength::LastDeal);
    }
    if decisions >= FEW && left_to_clear == 0 && avoided >= 3 {
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
        sweeps_score: rules.sweeps,
    }
}

/// The review in words.
#[derive(Clone, Debug, PartialEq)]
pub struct Told {
    pub summary: String,
    pub strengths: Vec<String>,
    /// Each habit to work on: a heading and a few sentences.
    pub tries: Vec<(String, String)>,
    pub closing: String,
    /// How it was worked out.
    pub method: String,
}

fn times(n: u32) -> String {
    match n {
        1 => "Once".into(),
        2 => "Twice".into(),
        n => format!("{} times", number(n)),
    }
}

/// Small numbers in words, as a sentence's first word wants them.
fn number(n: u32) -> String {
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

    /// In words. `aided`: hints or explanations were on at the game's end
    /// (if not, the closing mentions them).
    pub fn told(&self, aided: bool) -> Told {
        let summary = if self.decisions == 0 {
            "This game gave you no real choices to make, so there is nothing to review yet.".into()
        } else {
            let mean = self.loss / f64::from(self.decisions);
            let verdict = if self.decisions < FEW {
                "It was a short game, so there is not much to go on yet."
            } else if mean <= 0.07 {
                "That is very strong play."
            } else if mean <= 0.15 {
                "That is strong, careful play."
            } else if mean <= 0.3 {
                "That is solid play, with a habit or two worth a look."
            } else {
                "Cassino rewards a handful of habits, and the ones below are the quickest to pick up."
            };
            format!(
                "You made {} choices this game, and in {} of them you played as well as the strongest computer player would have in your place. {verdict}",
                self.decisions, self.sound
            )
        };
        let strengths = self
            .strengths
            .iter()
            .map(|s| self.strength_text(*s))
            .collect();
        let tries = self.tries.iter().map(|t| self.try_text(*t)).collect();
        let closing = match (self.tries.is_empty(), aided) {
            (false, false) => "If you would like help while you play, Explanations comment on each move as it happens, and Hints show the strongest move whenever you ask.",
            (false, true) => "Habits like these come quickly with a few more games.",
            (true, _) if self.decisions >= FEW => "Nothing stood out to work on. Keep playing the way you did.",
            (true, _) => "A game or two more, and there will be more to say.",
        }
        .to_string();
        Told {
            summary,
            strengths,
            tries,
            closing,
            method: "Each of your moves was compared afterwards with what the strongest computer player would have done in your place, knowing only what you knew. Before the last deal of a hand that is an estimate; in the last deal, when every card can be counted, it is exact. Only habits that showed more than once are mentioned.".into(),
        }
    }

    fn strength_text(&self, s: Strength) -> String {
        match s {
            Strength::Taking { found, chances } if found == chances => format!(
                "You never let a capture go by: you took something every one of the {chances} times taking was the strongest play."
            ),
            Strength::Taking { found, chances } => format!(
                "You rarely let a capture go by: when taking was the strongest play, you took something {found} times out of {chances}."
            ),
            Strength::Building { found, chances } => format!(
                "You found your builds: of the {chances} times building was the strongest play, you built {found}."
            ),
            Strength::LastDeal => "You played the last deals cleanly, which is where counting the cards pays off.".into(),
            Strength::Careful { avoided } => format!(
                "You were careful about what you left on the table: {} a move was there that would have left a table one card could clear, and you steered clear of it every time a safer one was there.",
                times(avoided).to_lowercase()
            ),
            Strength::Cards { won, hands } => format!(
                "You took the most cards in {won} of {hands} hands, the biggest prize in the count."
            ),
            Strength::Spades { won, hands } => {
                format!("You won the spades in {won} of {hands} hands.")
            }
            Strength::Cassinos { taken, of } => {
                format!("You took {taken} of the {of} Cassinos dealt.")
            }
            Strength::Aces { taken, of } => format!("You took {taken} of the {of} aces dealt."),
        }
    }

    fn try_text(&self, theme: Theme) -> (String, String) {
        let x = self.tally(theme);
        let found = x.matched;
        match theme {
            Theme::Taking => (
                "Taking what the table offers".into(),
                format!(
                    "{} Cards left lying are there for your opponent too, and a capture banks them now. Before you trail, it is worth a slow look at each card in your hand: does it match a card on the table, or add up with two or three of them?",
                    if found == 0 {
                        format!("A capture was the strongest play {} times this game, and each time you trailed or built instead.", x.chances)
                    } else {
                        format!("When a capture was the strongest play, you took something {found} times out of {}.", x.chances)
                    }
                ),
            ),
            Theme::Building => (
                "Building for a bigger capture".into(),
                format!(
                    "Building was the strongest play {} times this game, and you built in {}. A build gathers cards for a card you hold, so that next turn you take them all at once. Look for a card in your hand that, with cards on the table, adds up to another card you hold.",
                    x.chances,
                    if found == 0 { "none of them".to_string() } else { format!("{found} of them") }
                ),
            ),
            Theme::Builds => (
                "Choosing your builds".into(),
                format!(
                    "{} a build of yours cost more than another move would have. A build waits on the table for a turn or more, and your opponent may take it with a card of its value, or raise it into their own. Builds are safest when you hold two cards that take them, or when most of those cards have already been played.",
                    times(x.slips)
                ),
            ),
            Theme::Captures => (
                "Choosing what to take".into(),
                format!(
                    "{} another capture, or holding the card back, would have done better than the capture you made. One card can take a match and a sum together, or several sums at once, and an ace or a Cassino in reach is worth the extra look. Now and then a card is worth more kept for a bigger capture next turn.",
                    times(x.slips)
                ),
            ),
            Theme::Sweeps => (
                "What you leave on the table".into(),
                format!(
                    "{} your move left a table that one card could clear, when a safer move was there. {}Before you let a card go, add up what will be left: if it all comes to one value, a single card takes it.",
                    times(x.slips),
                    if self.sweeps_score {
                        "A sweep scores a point, and it gives your opponent every card on the table. "
                    } else {
                        "Clearing the table gives your opponent every card on it. "
                    }
                ),
            ),
            Theme::Valuables => (
                "Keeping the aces and Cassinos".into(),
                format!(
                    "{} you trailed an ace or a Cassino when another card could have gone. Each is worth a point (Big Cassino two), and whoever takes the table next takes it too. When you must trail, a plain card is usually the cheaper gift.",
                    times(x.slips)
                ),
            ),
            Theme::Trailing => (
                "Which card to trail".into(),
                format!(
                    "When trailing was right, you let go of the best card, or one as good, {found} times out of {}. The card you trail is an offer to your opponent: a low card that adds up with nothing on the table, or one whose matches have mostly been played, is the safest. A card that pairs or sums with what is there invites a capture.",
                    x.chances
                ),
            ),
            Theme::LastDeal => (
                "The last deal".into(),
                "Your moves in the last deal of each hand gave up more than the ones before. By then the pack is empty, so every card you have not seen is in your opponent's hand: counting what has gone tells you what they hold. And whoever makes the last capture takes what is left on the table, so a capturing card saved for the end can pay.".into(),
            ),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents::Agent;
    use crate::opponent::Skill;
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
                if r.tries.contains(&Theme::Building) {
                    let told = r.told(true);
                    let (_, text) = told
                        .tries
                        .iter()
                        .find(|t| t.0.starts_with("Building"))
                        .unwrap();
                    assert!(text.contains("you built in none of them"), "{text}");
                }
            }
        }
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

    #[test]
    fn the_review_tells_habits_gently_never_a_single_move() {
        for skill in [1.0, 2.0, 3.0] {
            for r in reviews(Rules::ROYAL, skill) {
                assert!(r.tries.len() <= MOST_TRIES && r.strengths.len() <= MOST_STRENGTHS);
                for aided in [false, true] {
                    let t = r.told(aided);
                    let mut all = vec![t.summary, t.closing, t.method];
                    all.extend(t.strengths);
                    all.extend(t.tries.into_iter().flat_map(|(h, b)| [h, b]));
                    for text in &all {
                        assert!(
                            !text.contains(['♠', '♥', '♦', '♣']),
                            "no card named: {text}"
                        );
                        let lower = text.to_lowercase();
                        for harsh in [
                            "mistake", "blunder", "wrong", "bad", "poor", "error", "should",
                        ] {
                            assert!(!lower.contains(harsh), "{harsh:?} in {text}");
                        }
                    }
                }
            }
        }
    }

    /// A game with the person always playing the first move offered: a
    /// player who trails whatever the table holds.
    fn first_offered(rules: Rules, seed: u64) -> Session {
        let mut s = Session::new(seed, Settings { rules, skill: 3.0 });
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
        for seed in 0..6 {
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
    fn no_capture_at_all_is_said_plainly() {
        let r = Review {
            decisions: 20,
            sound: 5,
            loss: 12.0,
            tallies: vec![(
                Theme::Taking,
                Tally {
                    chances: 9,
                    matched: 0,
                    slips: 9,
                    loss: 12.0,
                },
            )],
            tries: vec![Theme::Taking],
            strengths: vec![],
            sweeps_score: false,
        };
        let (_, text) = &r.told(true).tries[0];
        assert!(text.starts_with("A capture was the strongest play 9 times this game, and each time you trailed or built instead."), "{text}");
    }

    #[test]
    fn nothing_to_go_on_says_so() {
        let r = review(&Rules::CLASSIC, &[], &[]);
        assert_eq!((r.decisions, r.tries.len(), r.strengths.len()), (0, 0, 0));
        let told = r.told(false);
        assert!(told.summary.contains("nothing to review"));
        assert!(
            !told.closing.contains("habit"),
            "no habits were told: {}",
            told.closing
        );
    }

    #[test]
    fn a_habit_is_never_also_praised() {
        for skill in [1.0, 2.0, 2.5, 3.0] {
            for r in reviews(Rules::CLASSIC, skill) {
                for s in &r.strengths {
                    let clash = match s {
                        Strength::Taking { .. } => r.tries.contains(&Theme::Taking),
                        Strength::Building { .. } => r.tries.contains(&Theme::Building),
                        _ => false,
                    };
                    assert!(!clash, "{s:?} with {:?}", r.tries);
                }
            }
        }
    }
}
