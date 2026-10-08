//! The review in three bullets (`docs/DESIGN.md` §12.8): what the person
//! reads at the game's end, "pretty concise and painless, a few bullet
//! points at most".
//!
//! 1. What went well, if anything: a skill just mastered, else the review's
//!    best strength, in one short line.
//! 2. The one thing to work on: the learner's focus, the rule shipped for it
//!    in this game ([`lessons::taught`]) or, for a skill with no rule that
//!    passed, one plain fact; then this game's figure for it.
//! 3. Instead of 2, when there is no focus: that nothing stood out (with the
//!    next opponent up, if there is one), or that it is too early to say.
//!
//! Never praise and criticise the same skill; never more than three bullets;
//! a short game says so in one. How it is worked out is a separate text
//! ([`Brief::method`]), for a link.

use crate::agents;
use crate::learner::{Learner, Summary, Tally, MIN_CHANCES};
use crate::lessons;
use crate::review::{times, Review, Strength, FEW};
use crate::rules::Rules;
use crate::tutor::Skill;

/// One bullet: a lead the page may set in bold, then the rest.
#[derive(Clone, Debug, PartialEq)]
pub struct Bullet {
    pub lead: String,
    pub text: String,
}

impl Bullet {
    fn new(lead: &str, text: &str) -> Bullet {
        Bullet {
            lead: lead.into(),
            text: text.into(),
        }
    }

    /// The bullet as one line, without markup.
    pub fn plain(&self) -> String {
        format!("{} {}", self.lead, self.text).trim().to_string()
    }
}

/// What the person reads, and how it was worked out.
#[derive(Clone, Debug, PartialEq)]
pub struct Brief {
    /// One to three bullets.
    pub bullets: Vec<Bullet>,
    /// How it was worked out: at most three sentences.
    pub method: String,
}

const METHOD: &str = "Your moves were compared afterwards with what the strongest computer player would have done in your place, knowing only what you knew; only clear differences count, and moves made after a hint do not. Each skill is judged over your recent games, the newest counting most, and the one to work on is the one costing you the most. Each rule shown was measured against that player's own play before it was added.";

/// The skill as the focus names it ("Next: building.").
pub fn name(skill: Skill) -> &'static str {
    match skill {
        Skill::Pairs => "taking pairs",
        Skill::Sums => "taking sums",
        Skill::Building => "building",
        Skill::SafeBuilds => "safe builds",
        Skill::AnsweringBuilds => "answering their builds",
        Skill::NoSweep => "leaving no sweep",
        Skill::Valuables => "aces and Cassinos",
        Skill::Trailing => "choosing what to trail",
    }
}

/// "4 of the 9": `met` of `chances`.
fn of_the(met: u32, chances: u32) -> String {
    format!("{met} of the {chances}")
}

/// This game's figure for `skill`, in plain words, from its tally.
pub fn figure(skill: Skill, t: Tally) -> String {
    let misses = t.chances - t.met;
    if t.chances == 0 {
        return "It did not come up this game.".into();
    }
    if misses == 0 {
        return "This game you managed it every time; earlier games count too.".into();
    }
    let best = of_the(t.met, t.chances);
    match skill {
        Skill::Pairs => format!("You took the pair {best} times it was best."),
        Skill::Sums => format!("You took a sum {best} times it was best."),
        Skill::Building => format!("You built {best} times it was best."),
        Skill::SafeBuilds => format!("You chose a safe build {best} times."),
        Skill::AnsweringBuilds => format!("You took or raised their build {best} times."),
        Skill::NoSweep => format!("{} you left a table one card could clear.", times(misses)),
        Skill::Valuables => format!("{} you trailed an ace or Cassino.", times(misses)),
        Skill::Trailing => format!("You trailed the best card {best} times."),
    }
}

/// A plain, true fact for a skill with no rule that passed: not an order.
pub fn fact(skill: Skill) -> &'static str {
    match skill {
        Skill::Sums => "One card can take several table cards that add up to it.",
        Skill::NoSweep => "One card can clear a table whose cards match or add up to it.",
        Skill::Trailing => "The card you trail is a gift your opponent may take.",
        Skill::AnsweringBuilds => "A build waits on the table for a card of its value.",
        // The skills with a rule are told it; the fact is for the others.
        Skill::Pairs => "A card takes any table card of its own rank.",
        Skill::Building => "A build gathers cards for a card you hold.",
        Skill::SafeBuilds => "A build is safer the fewer cards can take it.",
        Skill::Valuables => "Aces and Cassinos are worth a point each.",
    }
}

/// The skill a strength is praise of, where it is one: praise is dropped
/// when the same skill is the one to work on.
fn praised(s: Strength) -> Vec<Skill> {
    match s {
        Strength::Taking { .. } => vec![Skill::Pairs, Skill::Sums],
        Strength::Building { .. } => vec![Skill::Building],
        Strength::Careful { .. } => vec![Skill::NoSweep],
        Strength::Cassinos { .. } | Strength::Aces { .. } => vec![Skill::Valuables],
        Strength::LastDeal => vec![Skill::Trailing],
        Strength::Cards { .. } | Strength::Spades { .. } => vec![],
    }
}

/// A strength in one line of fifteen words or fewer. The counts of luck
/// (cards, spades, Cassinos, aces) are only ever praise.
pub fn strength_line(s: Strength) -> String {
    match s {
        Strength::Taking { found, chances } if found == chances => {
            "You took something every time taking was best.".into()
        }
        Strength::Taking { found, chances } => format!(
            "You took something {} times taking was best.",
            of_the(found, chances)
        ),
        Strength::Building { found, chances } => format!(
            "You built {} times building was best.",
            of_the(found, chances)
        ),
        Strength::LastDeal => "You played the last deals cleanly.".into(),
        Strength::Careful { .. } => {
            "You steered clear of leaving a table one card could clear.".into()
        }
        Strength::Cards { won, hands } => {
            format!("You took the most cards in {won} of {hands} hands.")
        }
        Strength::Spades { won, hands } => format!("You won the spades in {won} of {hands} hands."),
        Strength::Cassinos { taken, of } => format!("You took {taken} of the {of} Cassinos dealt."),
        Strength::Aces { taken, of } => format!("You took {taken} of the {of} aces dealt."),
    }
}

/// The skills with enough evidence behind them to say that nothing stands
/// out: at least this many with [`MIN_CHANCES`] discounted chances.
const ENOUGH_SKILLS: usize = 3;

/// The earlier games a mastery needs before it is announced: after one game
/// (the terminal's case, with no history) a mastery is luck of the draw, not
/// a skill shown over time.
const MIN_HISTORY: usize = 2;

/// The brief of one finished game.
///
/// - `review`: the game's review (`Session::review`).
/// - `game`: this game's summary (`learner::evidence`), for the figures.
/// - `before`, `after`: the learner over the earlier games, and over them
///   and this one (`learner::learn`; with no stored games, over this one
///   alone, and `before` over none).
/// - `rules` and `opponent`: the game's rules (which rule is taught depends
///   on them) and the opponent's skill setting (`Settings::skill`; the top
///   of the dial has no next opponent up).
///
/// `Session::brief` assembles these.
pub fn brief(
    review: &Review,
    game: &Summary,
    before: &Learner,
    after: &Learner,
    rules: &Rules,
    opponent: f64,
) -> Brief {
    let method = METHOD.to_string();
    if review.decisions < FEW {
        let text = if review.decisions == 0 {
            "This game gave you no real choices to make, so there is nothing to review yet."
        } else {
            "It was a short game, so there is not much to go on yet."
        };
        return Brief {
            bullets: vec![Bullet::new("", text)],
            method,
        };
    }
    let mut bullets = Vec::new();
    // What went well: a skill just mastered, else the best strength.
    let mastered: Vec<Skill> = Skill::ALL
        .into_iter()
        .filter(|&s| after.mastered(s) && !before.mastered(s))
        .filter(|_| before.games >= MIN_HISTORY)
        .collect();
    if !mastered.is_empty() {
        let names: Vec<&str> = mastered.iter().take(2).map(|&s| name(s)).collect();
        let mut joined = names.join(", ");
        joined[..1].make_ascii_uppercase();
        bullets.push(Bullet::new(&format!("\u{2713} {joined}:"), "mastered."));
    } else if let Some(s) = review
        .strengths
        .iter()
        .find(|s| after.focus.is_none_or(|f| !praised(**s).contains(&f)))
    {
        bullets.push(Bullet::new("", &strength_line(*s)));
    }
    match after.focus {
        Some(skill) => {
            let said = match lessons::taught(skill, rules.game) {
                // A raise is not on offer where raising is off.
                Some(_) if skill == Skill::AnsweringBuilds && !rules.raising => fact(skill),
                Some(rule) => rule.text,
                None => fact(skill),
            };
            bullets.push(Bullet::new(
                &format!("Next: {}.", name(skill)),
                &format!("{said} {}", figure(skill, game.of(skill))),
            ));
        }
        None => {
            let seen = after
                .skills
                .iter()
                .filter(|s| s.chances >= MIN_CHANCES)
                .count();
            let text = if seen < ENOUGH_SKILLS {
                "A game or two more, and there will be more to say."
            } else if opponent < f64::from(agents::TOP) {
                "Nothing stood out to work on. Try the next opponent up."
            } else {
                "Nothing stood out to work on."
            };
            bullets.push(Bullet::new("", text));
        }
    }
    Brief { bullets, method }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents::Agent;
    use crate::learner::{evidence, learn, play_game};
    use crate::session::Session;

    fn summary(lines: &[(Skill, u32, u32, f64)]) -> Summary {
        let mut s = Summary::from_chances(&[]);
        for &(skill, chances, met, missed) in lines {
            let i = Skill::ALL.iter().position(|&k| k == skill).unwrap();
            s.tallies[i] = Tally {
                chances,
                met,
                missed,
            };
        }
        s
    }

    fn review(decisions: u32, strengths: Vec<Strength>) -> Review {
        Review {
            decisions,
            sound: decisions,
            loss: 0.0,
            tallies: vec![],
            tries: vec![],
            strengths,
            sweeps_score: false,
        }
    }

    fn classic() -> Rules {
        Rules::CLASSIC
    }

    fn royal() -> Rules {
        Rules::ROYAL
    }

    /// The brief of a game whose summary is `game`, after `history`.
    fn made(
        r: &Review,
        game: &Summary,
        history: &[Summary],
        rules: &Rules,
        opponent: f64,
    ) -> Brief {
        let mut all = history.to_vec();
        all.push(game.clone());
        brief(r, game, &learn(history), &learn(&all), rules, opponent)
    }

    fn plain(b: &Brief) -> Vec<String> {
        b.bullets.iter().map(Bullet::plain).collect()
    }

    fn words(s: &str) -> usize {
        s.split_whitespace().count()
    }

    fn within_budget(b: &Brief) {
        let lines = plain(b);
        assert!((1..=3).contains(&lines.len()), "{lines:?}");
        for l in &lines {
            assert!(words(l) <= 28, "{l}");
            assert!(
                !l.contains("  ") && !l.contains('{') && !l.contains(" 0 times"),
                "{l}"
            );
        }
        assert!(
            lines.iter().map(|l| words(l)).sum::<usize>() <= 50,
            "{lines:?}"
        );
        assert!(b.method.matches(". ").count() < 3, "{}", b.method);
    }

    #[test]
    fn the_skill_to_work_on_comes_with_its_rule_and_this_games_figure() {
        let game = summary(&[(Skill::Building, 10, 0, 10.0)]);
        let b = made(&review(40, vec![]), &game, &[], &classic(), 3.0);
        assert_eq!(
            plain(&b),
            [
                "Next: building. With nothing to take, build rather than trail, if you can. \
                 You built 0 of the 10 times it was best."
            ]
        );
        assert_eq!(b.bullets[0].lead, "Next: building.");
        within_budget(&b);
    }

    #[test]
    fn each_skills_figure_reads_in_plain_words() {
        let t = |chances, met, missed| Tally {
            chances,
            met,
            missed,
        };
        for (skill, tally, want) in [
            (
                Skill::Pairs,
                t(9, 4, 5.0),
                "You took the pair 4 of the 9 times it was best.",
            ),
            (
                Skill::Sums,
                t(5, 1, 3.0),
                "You took a sum 1 of the 5 times it was best.",
            ),
            (
                Skill::Building,
                t(12, 6, 3.0),
                "You built 6 of the 12 times it was best.",
            ),
            (
                Skill::SafeBuilds,
                t(4, 2, 1.0),
                "You chose a safe build 2 of the 4 times.",
            ),
            (
                Skill::AnsweringBuilds,
                t(3, 0, 2.0),
                "You took or raised their build 0 of the 3 times.",
            ),
            (
                Skill::NoSweep,
                t(6, 3, 2.0),
                "Three times you left a table one card could clear.",
            ),
            (
                Skill::NoSweep,
                t(6, 5, 2.0),
                "Once you left a table one card could clear.",
            ),
            (
                Skill::Valuables,
                t(6, 4, 2.0),
                "Twice you trailed an ace or Cassino.",
            ),
            (
                Skill::Trailing,
                t(8, 5, 2.0),
                "You trailed the best card 5 of the 8 times.",
            ),
            (Skill::Pairs, t(0, 0, 0.0), "It did not come up this game."),
            (
                Skill::Pairs,
                t(5, 5, 0.0),
                "This game you managed it every time; earlier games count too.",
            ),
        ] {
            assert_eq!(figure(skill, tally), want, "{skill:?}");
        }
    }

    #[test]
    fn a_skill_with_no_rule_gets_a_fact_and_royal_has_none_for_answering() {
        for (skill, rules, want) in [
            (
                Skill::Sums,
                classic(),
                "One card can take several table cards that add up to it.",
            ),
            (
                Skill::Sums,
                royal(),
                "One card can take several table cards that add up to it.",
            ),
            (
                Skill::NoSweep,
                classic(),
                "One card can clear a table whose cards match or add up to it.",
            ),
            (
                Skill::Trailing,
                royal(),
                "The card you trail is a gift your opponent may take.",
            ),
            (
                Skill::AnsweringBuilds,
                royal(),
                "A build waits on the table for a card of its value.",
            ),
        ] {
            let game = summary(&[(skill, 8, 1, 8.0)]);
            let b = made(&review(40, vec![]), &game, &[], &rules, 3.0);
            let line = &b.bullets.last().unwrap().text;
            assert!(line.starts_with(want), "{skill:?}: {line}");
            assert!(words(want) <= 15, "{want}");
        }
        // Classic answers builds by a rule; Royal, or Classic with raising
        // off, has only the fact.
        let game = summary(&[(Skill::AnsweringBuilds, 8, 1, 8.0)]);
        let b = made(&review(40, vec![]), &game, &[], &classic(), 3.0);
        assert!(b.bullets[0]
            .text
            .starts_with("If you cannot take their build, raise it, if you can."));
        let no_raise = Rules {
            raising: false,
            ..classic()
        };
        let b = made(&review(40, vec![]), &game, &[], &no_raise, 3.0);
        assert!(
            b.bullets[0].text.starts_with("A build waits"),
            "{:?}",
            b.bullets
        );
    }

    #[test]
    fn every_skill_with_a_rule_is_told_it_in_both_games() {
        for rules in [classic(), royal()] {
            for skill in Skill::ALL {
                let game = summary(&[(skill, 8, 1, 8.0)]);
                let b = made(&review(40, vec![]), &game, &[], &rules, 3.0);
                let lead = format!("Next: {}.", name(skill));
                // The focus may be an earlier skill if this one's
                // prerequisites are not cleared; here they have no chances.
                assert_eq!(b.bullets[0].lead, lead, "{skill:?}");
                within_budget(&b);
                if let Some(rule) = lessons::taught(skill, rules.game) {
                    assert!(b.bullets[0].text.starts_with(rule.text));
                }
            }
        }
    }

    #[test]
    fn a_skill_just_mastered_is_praised_first() {
        let game = summary(&[(Skill::Pairs, 4, 4, 0.0), (Skill::Building, 4, 0, 6.0)]);
        let history = [game.clone(), game.clone(), game.clone()];
        let b = made(
            &review(40, vec![Strength::LastDeal]),
            &game,
            &history[..2],
            &classic(),
            3.0,
        );
        assert_eq!(plain(&b)[0], "\u{2713} Taking pairs: mastered.");
        assert!(
            plain(&b)[1].starts_with("Next: building."),
            "{:?}",
            plain(&b)
        );
        assert_eq!(b.bullets.len(), 2);
        // Only the game it came with: the next game says nothing of it.
        let b = made(&review(40, vec![]), &game, &history, &classic(), 3.0);
        assert!(plain(&b)[0].starts_with("Next: building."));
        // Several at once: they are named (sums, mastered a game earlier, not).
        let many = summary(&[
            (Skill::Pairs, 4, 4, 0.0),
            (Skill::Sums, 4, 0, 0.1),
            (Skill::Valuables, 4, 4, 0.0),
        ]);
        let b = made(
            &review(40, vec![]),
            &many,
            &[many.clone(), many.clone()],
            &classic(),
            3.0,
        );
        assert_eq!(
            plain(&b)[0],
            "\u{2713} Taking pairs, aces and Cassinos: mastered."
        );
    }

    #[test]
    fn no_mastery_is_announced_on_too_little_history() {
        // A single game (the terminal's case), or one before it: whatever
        // the learner makes of the figures, no tick.
        let game = summary(&[(Skill::Pairs, 12, 12, 0.0), (Skill::Building, 4, 0, 6.0)]);
        for history in [&[][..], &[game.clone()][..]] {
            let b = made(
                &review(40, vec![Strength::LastDeal]),
                &game,
                history,
                &classic(),
                3.0,
            );
            assert!(
                !plain(&b).iter().any(|l| l.contains("mastered")),
                "{:?}",
                plain(&b)
            );
        }
    }

    #[test]
    fn otherwise_the_best_strength_in_one_short_line() {
        let game = summary(&[(Skill::Valuables, 6, 1, 6.0)]);
        let b = made(
            &review(40, vec![Strength::Cards { won: 3, hands: 5 }]),
            &game,
            &[],
            &classic(),
            3.0,
        );
        assert_eq!(plain(&b)[0], "You took the most cards in 3 of 5 hands.");
        for s in [
            Strength::Taking {
                found: 9,
                chances: 9,
            },
            Strength::Taking {
                found: 7,
                chances: 9,
            },
            Strength::Building {
                found: 3,
                chances: 4,
            },
            Strength::LastDeal,
            Strength::Careful { avoided: 4 },
            Strength::Cards { won: 2, hands: 4 },
            Strength::Spades { won: 2, hands: 4 },
            Strength::Cassinos { taken: 3, of: 8 },
            Strength::Aces { taken: 3, of: 8 },
        ] {
            let line = strength_line(s);
            assert!(words(&line) <= 15 && line.ends_with('.'), "{line}");
        }
    }

    #[test]
    fn a_skill_is_never_praised_and_worked_on_together() {
        let game = summary(&[(Skill::Building, 10, 0, 10.0)]);
        let r = review(
            40,
            vec![
                Strength::Building {
                    found: 0,
                    chances: 10,
                },
                Strength::Cards { won: 3, hands: 5 },
            ],
        );
        let b = made(&r, &game, &[], &classic(), 3.0);
        assert_eq!(plain(&b)[0], "You took the most cards in 3 of 5 hands.");
        // And with only the clashing strength, no praise at all.
        let r = review(
            40,
            vec![Strength::Building {
                found: 0,
                chances: 10,
            }],
        );
        let b = made(&r, &game, &[], &classic(), 3.0);
        assert_eq!(b.bullets.len(), 1);
        assert!(plain(&b)[0].starts_with("Next: building."));
        // Aces and taking likewise.
        let game = summary(&[(Skill::Valuables, 8, 2, 6.0)]);
        let r = review(40, vec![Strength::Aces { taken: 4, of: 4 }]);
        assert_eq!(made(&r, &game, &[], &classic(), 3.0).bullets.len(), 1);
    }

    #[test]
    fn with_no_focus_it_says_so_kindly() {
        let fine = summary(&[
            (Skill::Pairs, 10, 10, 0.0),
            (Skill::Sums, 6, 6, 0.0),
            (Skill::Valuables, 6, 6, 0.0),
        ]);
        let r = review(40, vec![]);
        let b = made(
            &r,
            &fine,
            &[fine.clone(), fine.clone(), fine.clone()],
            &classic(),
            3.0,
        );
        assert_eq!(
            plain(&b),
            ["Nothing stood out to work on. Try the next opponent up."]
        );
        let top = made(
            &r,
            &fine,
            &[fine.clone(), fine.clone(), fine.clone()],
            &classic(),
            4.0,
        );
        assert_eq!(plain(&top), ["Nothing stood out to work on."]);
        // Too little seen: say it is early.
        let thin = summary(&[(Skill::Pairs, 2, 2, 0.0)]);
        let b = made(&r, &thin, &[], &classic(), 3.0);
        assert_eq!(
            plain(&b),
            ["A game or two more, and there will be more to say."]
        );
    }

    #[test]
    fn a_short_game_says_so_in_one_bullet() {
        let game = summary(&[(Skill::Building, 10, 0, 10.0)]);
        let r = review(FEW - 1, vec![Strength::LastDeal]);
        let b = made(&r, &game, &[], &classic(), 3.0);
        assert_eq!(
            plain(&b),
            ["It was a short game, so there is not much to go on yet."]
        );
        let b = made(&review(0, vec![]), &game, &[], &classic(), 3.0);
        assert_eq!(b.bullets.len(), 1);
    }

    /// A finished game of the greedy player (the dial at 2, as the
    /// learner's lesioned students), sweeps off.
    fn greedy_game(rules: Rules, seed: u64) -> Session {
        let rules = Rules {
            sweeps: false,
            ..rules
        };
        let mut agent: Box<dyn Agent> =
            Box::new(crate::opponent::Skill(2.0).opponent(seed ^ 0x5eed));
        play_game(agent.as_mut(), rules, 3.0, seed)
    }

    #[test]
    fn the_greedy_player_is_told_to_build_in_both_games() {
        for (rules, first) in [(Rules::CLASSIC, 8_000), (Rules::ROYAL, 8_100)] {
            let games: Vec<Session> = (first..first + 4).map(|s| greedy_game(rules, s)).collect();
            let history: Vec<Summary> = games[..3].iter().map(|g| evidence(g.turns())).collect();
            let b = games[3].brief(&history).expect("a finished game");
            eprintln!("{:?}: {:#?}", rules.game, plain(&b));
            assert_eq!(b.bullets.last().unwrap().lead, "Next: building.", "{b:?}");
            assert!(b
                .bullets
                .last()
                .unwrap()
                .text
                .starts_with("With nothing to take"));
            within_budget(&b);
            // No history: the game alone.
            let alone = games[3].brief(&[]).unwrap();
            within_budget(&alone);
        }
    }

    #[test]
    fn no_brief_before_the_end_or_when_watching() {
        let s = Session::new(1, crate::session::Settings::default());
        assert!(s.brief(&[]).is_none());
        let mut w = Session::watch(2, Rules::CLASSIC, [2.0, 2.0]);
        while w.step() {}
        assert!(w.brief(&[]).is_none());
    }
}
