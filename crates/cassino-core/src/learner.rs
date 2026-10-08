//! The learner model (`docs/DESIGN.md` §12.8): what the games a person has
//! played say about the skills of [`tutor`], and the one skill to work on
//! next.
//!
//! Three steps, each a pure function:
//!
//! 1. [`evidence`]: one game's turns become a [`Summary`], per skill the
//!    clear chances the person had without help, how many they met, and the
//!    points the missed ones cost. This runs the advisor at every
//!    unassisted decision with a choice, so it is the expensive step: once
//!    per finished game. The summary is small, has a text form, and carries
//!    [`EVIDENCE_VERSION`]; a client keeps the record and the summary, and
//!    recomputes a summary (from the record) only when its version is stale.
//! 2. [`learn`]: the summaries, oldest first, become a [`Learner`]: for each
//!    skill, whether it is mastered, and the focus. A fold over the games,
//!    so that what is known after game *n* depends on what was known after
//!    game *n − 1* (the hysteresis).
//! 3. [`nudge`]: whether a decision is one to show the focus on.
//!
//! **Mastery.** Each game's counts are weighed [`DISCOUNT`] times as much as
//! the game after it, so a skill that has been learnt is not held back by
//! the games before. The met rate has a Beta(1, 1) prior, so after
//! discounted `c` chances and `m` met its posterior is Beta(1 + m, 1 + c − m).
//! A skill becomes mastered when the [`LOWER`] quantile of the posterior
//! reaches [`master`] (the lower bound: the rate is surely that high), and
//! once mastered is lost only when the [`UPPER`] quantile falls below
//! [`lose`] (the rate is surely lower now). Between the two the state stays
//! as it was, so progress does not flicker. With fewer than [`MIN_CHANCES`]
//! discounted chances nothing changes: no evidence either way.
//!
//! **Focus.** Of the skills not mastered, whose prerequisites ([`Skill::needs`])
//! are *cleared* (mastered, or gaining less than [`MIN_GAIN`] a game, which
//! covers a skill whose chances do not come up), and whose met rate is
//! surely short of mastery (the [`UPPER`] quantile below [`master`]: a few
//! misses among few chances prove nothing), the one with the largest gain:
//! the points a game its misses cost (discounted) less what the strongest
//! rung itself loses to it ([`top_cost`]), which is what mastering it would
//! win. `None` when no skill gains [`MIN_GAIN`].
//!
//! **The constants** are set from the strongest rung's own games, 30 each of
//! Classic and Royal, sweeps off, against the counter
//! (`measurements/README.md`), and by the lesioned students of the tests
//! below. Each is documented where it is defined.

use crate::agents::Agent;
use crate::observation::View;
use crate::review::Turn;
use crate::rules::Rules;
use crate::session::{Prompt, Session, Settings};
use crate::tutor::{self, Chance, Skill};

/// The version of what [`evidence`] computes. Bump it whenever the clear
/// chances change (the advisor, the margin, the classifier of what a move
/// shows), so that a stored summary made before is recomputed from its
/// record.
pub const EVIDENCE_VERSION: u32 = 1;

/// The weight of each game relative to the one after it.
///
/// 0.8 makes the last five games count for two thirds of the weight and
/// halves a game's weight in three; a skill the person has just learnt is
/// seen as learnt within a few games, one dropped as dropped as quickly.
pub const DISCOUNT: f64 = 0.8;

/// The discounted chances a skill needs before its rate counts. Below it
/// the state does not change.
pub const MIN_CHANCES: f64 = 4.0;

/// The least a skill must cost, in points a game, to be worth working on.
pub const MIN_GAIN: f64 = 0.5;

/// The gain, in points a game, at which an unmastered skill is the focus
/// although its rate is not shown to be short ([`UPPER`]). One point was
/// tried (twice [`MIN_GAIN`]) and named SafeBuilds for the strongest rung in
/// one window of nine (a gain of 1.08 over 14 chances, its own cost above
/// [`top_cost`] by chance); two points clears it, and a random player's
/// 6 points a game on Valuables is far above.
pub const COSTLY_GAIN: f64 = 2.0;

/// The discounted chances a costly skill needs: twice [`MIN_CHANCES`], so
/// that one miss in five (three points, say) does not name a focus.
pub const COSTLY_CHANCES: f64 = 2.0 * MIN_CHANCES;

/// The quantile of the met rate that must reach [`master`], for mastery:
/// the rate is at least that high with 80% confidence. At 90% the strongest
/// rung itself mastered only two or three skills of eight in four games,
/// the rarer skills (two or three chances a game) too thinly seen to be
/// certain; at 80% four to seven, while a skill it misses at every chance
/// stays far from it.
pub const LOWER: f64 = 0.2;

/// The quantile of the met rate that must fall below [`lose`], for a
/// mastered skill to be lost, and below [`master`] for a skill to be the
/// focus: the rate is that low with 90% confidence. Stricter than
/// [`LOWER`] on purpose, so that taking a skill away or naming one to work
/// on needs the better evidence: with it, the strongest rung's four-game
/// windows (54 of them) named no focus at all, and without it one in six
/// did, on a single missed chance in a rare skill.
pub const UPPER: f64 = 0.9;

/// What mastery asks, as a fraction of what the strongest rung itself
/// meets of its clear chances ([`top_rate`]): it is itself short of every
/// chance (the advisor samples worlds, so the same position's best move can
/// change), and a player need not be better than it. 0.85 puts the bar
/// at 0.80 to 0.85 for the skills a game offers often.
pub const MASTER_OF_TOP: f64 = 0.85;

/// How far below [`master`] the rate must be shown to be to lose a skill:
/// 0.2, so a mastered skill needs a rate in the sixties to be lost, and a
/// bad game or two does not lose it.
pub const LOSE_BELOW: f64 = 0.2;

/// The met rate the strongest rung reaches at `skill` (measured,
/// `measurements/README.md`).
pub fn top_rate(skill: Skill) -> f64 {
    match skill {
        Skill::Pairs => 0.974,
        Skill::Sums => 0.965,
        Skill::Building => 0.938,
        Skill::SafeBuilds => 0.966,
        Skill::AnsweringBuilds => 1.0,
        Skill::NoSweep => 0.956,
        Skill::Valuables => 0.994,
        Skill::Trailing => 0.949,
    }
}

/// The points a game the strongest rung itself loses to `skill`: the gaps
/// of the chances it misses (the advisor sampling other worlds than the
/// player's, and the margin letting a little through). A student's cost
/// beyond it is what mastering the skill would gain
/// (`measurements/README.md`).
pub fn top_cost(skill: Skill) -> f64 {
    match skill {
        Skill::Pairs => 0.10,
        Skill::Sums => 0.07,
        Skill::Building => 0.22,
        Skill::SafeBuilds => 0.10,
        Skill::AnsweringBuilds => 0.0,
        Skill::NoSweep => 0.09,
        Skill::Valuables => 0.04,
        Skill::Trailing => 0.46,
    }
}

/// The met rate that makes `skill` mastered: [`MASTER_OF_TOP`] of what the
/// strongest rung itself meets.
pub fn master(skill: Skill) -> f64 {
    MASTER_OF_TOP * top_rate(skill)
}

/// The met rate a mastered `skill` is lost below.
pub fn lose(skill: Skill) -> f64 {
    (master(skill) - LOSE_BELOW).max(0.0)
}

/// One skill's tally over a game (or, in the learner, discounted over
/// several).
#[derive(Copy, Clone, Debug, Default, PartialEq)]
pub struct Tally {
    pub chances: u32,
    pub met: u32,
    /// The sum of the gaps of the chances missed, in points.
    pub missed: f64,
}

/// What one game showed of each skill, in [`Skill::ALL`] order.
#[derive(Clone, Debug, PartialEq)]
pub struct Summary {
    pub version: u32,
    pub tallies: [Tally; 8],
}

impl Summary {
    /// The tally of `skill`.
    pub fn of(&self, skill: Skill) -> Tally {
        self.tallies[index(skill)]
    }

    /// Whether this was computed by the present [`evidence`].
    pub fn is_current(&self) -> bool {
        self.version == EVIDENCE_VERSION
    }

    /// The summary of these chances.
    pub fn from_chances(chances: &[Chance]) -> Summary {
        let mut tallies = [Tally::default(); 8];
        for c in chances {
            let t = &mut tallies[index(c.skill)];
            t.chances += 1;
            if c.met {
                t.met += 1;
            } else {
                t.missed += c.gap;
            }
        }
        Summary {
            version: EVIDENCE_VERSION,
            tallies,
        }
    }

    /// The text form: a header, then a line a skill, `<slug> <chances>
    /// <met> <missed points>`.
    pub fn to_text(&self) -> String {
        let mut lines = vec![format!("cassino evidence v{}", self.version)];
        for skill in Skill::ALL {
            let t = self.of(skill);
            lines.push(format!(
                "{} {} {} {}",
                skill.slug(),
                t.chances,
                t.met,
                t.missed
            ));
        }
        lines.join("\n")
    }

    pub fn parse(text: &str) -> Result<Summary, String> {
        let mut lines = text.lines().map(str::trim).filter(|l| !l.is_empty());
        let head = lines.next().ok_or("an empty summary")?;
        let version: u32 = head
            .strip_prefix("cassino evidence v")
            .and_then(|v| v.parse().ok())
            .ok_or(format!(
                "expected \"cassino evidence v<n>\", found {head:?}"
            ))?;
        let mut tallies = [Tally::default(); 8];
        for skill in Skill::ALL {
            let line = lines
                .next()
                .ok_or(format!("the summary ends before {}", skill.slug()))?;
            let w: Vec<&str> = line.split_whitespace().collect();
            let bad = || format!("not a tally of {}: {line:?}", skill.slug());
            if w.len() != 4 || w[0] != skill.slug() {
                return Err(bad());
            }
            let t = Tally {
                chances: w[1].parse().map_err(|_| bad())?,
                met: w[2].parse().map_err(|_| bad())?,
                missed: w[3].parse().map_err(|_| bad())?,
            };
            if t.met > t.chances || !t.missed.is_finite() || t.missed < 0.0 {
                return Err(bad());
            }
            tallies[index(skill)] = t;
        }
        Ok(Summary { version, tallies })
    }
}

fn index(skill: Skill) -> usize {
    Skill::ALL
        .iter()
        .position(|&s| s == skill)
        .expect("a skill is in ALL")
}

/// The clear chances of the decisions the person made without help and with
/// a choice (two moves or more), and whether they met each.
pub fn chances_of(turns: &[Turn]) -> Vec<Chance> {
    chances_with_pass(turns, &tutor::pass_of(turns, |t| !t.assisted))
}

/// [`chances_of`] from the advisor's values already worked out
/// ([`tutor::pass_of`], over at least the unassisted decisions).
pub fn chances_with_pass(turns: &[Turn], pass: &tutor::Pass) -> Vec<Chance> {
    let mut out = Vec::new();
    for (t, values) in turns.iter().zip(pass) {
        if t.assisted || t.view.candidates().len() < 2 {
            continue;
        }
        let Some(values) = values else { continue };
        out.extend(tutor::chances_with(
            &t.view,
            &t.mv,
            tutor::margin(&t.view),
            values,
        ));
    }
    out
}

/// A game's evidence ([`chances_of`], summed up).
pub fn evidence(turns: &[Turn]) -> Summary {
    Summary::from_chances(&chances_of(turns))
}

/// [`evidence`] from the advisor's values already worked out.
pub fn evidence_with(turns: &[Turn], pass: &tutor::Pass) -> Summary {
    Summary::from_chances(&chances_with_pass(turns, pass))
}

/// What the games say of one skill.
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct SkillState {
    pub mastered: bool,
    /// Discounted chances and chances met.
    pub chances: f64,
    pub met: f64,
    /// Discounted points a game this skill costs.
    pub cost: f64,
    /// What mastering it would gain: the cost less [`top_cost`], at least
    /// nothing. What the focus is chosen on.
    pub gain: f64,
}

/// What the games say, after the latest.
#[derive(Clone, Debug, PartialEq)]
pub struct Learner {
    /// How many games (summaries of the present version) it was learnt from.
    pub games: usize,
    /// In [`Skill::ALL`] order.
    pub skills: [SkillState; 8],
    /// The skills that became mastered with the latest game.
    pub just_mastered: Vec<Skill>,
    /// The skill to work on next.
    pub focus: Option<Skill>,
}

impl Learner {
    pub fn state(&self, skill: Skill) -> SkillState {
        self.skills[index(skill)]
    }

    pub fn mastered(&self, skill: Skill) -> bool {
        self.state(skill).mastered
    }
}

/// The indexes of the summaries that [`learn`] would skip as stale (made by
/// another [`EVIDENCE_VERSION`]): a client recomputes those from their
/// records before asking, so that no game is silently dropped.
pub fn stale(games: &[Summary]) -> Vec<usize> {
    games
        .iter()
        .enumerate()
        .filter(|(_, g)| !g.is_current())
        .map(|(i, _)| i)
        .collect()
}

/// The learner after `games`, oldest first. Summaries of another
/// [`EVIDENCE_VERSION`] are skipped: a client recomputes them first.
pub fn learn(games: &[Summary]) -> Learner {
    let mut mastered = [false; 8];
    let mut before = [false; 8];
    let (mut chances, mut met, mut missed) = ([0.0; 8], [0.0; 8], [0.0; 8]);
    let mut weight = 0.0;
    for g in games.iter().filter(|g| g.is_current()) {
        before = mastered;
        weight = weight * DISCOUNT + 1.0;
        for skill in Skill::ALL {
            let i = index(skill);
            let t = g.of(skill);
            chances[i] = chances[i] * DISCOUNT + f64::from(t.chances);
            met[i] = met[i] * DISCOUNT + f64::from(t.met);
            missed[i] = missed[i] * DISCOUNT + t.missed;
            if chances[i] < MIN_CHANCES {
                continue;
            }
            let (a, b) = (1.0 + met[i], 1.0 + chances[i] - met[i]);
            if mastered[i] {
                if beta_quantile(UPPER, a, b) < lose(skill) {
                    mastered[i] = false;
                }
            } else if beta_quantile(LOWER, a, b) >= master(skill) {
                mastered[i] = true;
            }
        }
    }
    let skills: [SkillState; 8] = std::array::from_fn(|i| {
        let cost = if weight > 0.0 {
            missed[i] / weight
        } else {
            0.0
        };
        SkillState {
            mastered: mastered[i],
            chances: chances[i],
            met: met[i],
            cost,
            gain: (cost - top_cost(Skill::ALL[i])).max(0.0),
        }
    });
    let seen = |s: Skill| skills[index(s)].chances >= MIN_CHANCES;
    // Surely short: enough chances, and the rate shown below mastery.
    let short = |s: Skill| {
        let i = index(s);
        seen(s) && beta_quantile(UPPER, 1.0 + met[i], 1.0 + chances[i] - met[i]) < master(s)
    };
    // Cleared: mastered, or costing too little to matter, or not shown to be
    // short (a prerequisite half-proven either way must not hold back its
    // dependents).
    let cleared = |s: Skill| mastered[index(s)] || skills[index(s)].gain < MIN_GAIN || !short(s);
    let open = |s: Skill| {
        !mastered[index(s)]
            && skills[index(s)].gain >= MIN_GAIN
            && s.needs().iter().all(|&n| cleared(n))
    };
    // Eligible: surely short by rate, or costing a great deal over enough
    // chances although the rate is not shown short (a rate of 0.8 at a
    // skill that costs six points a miss).
    let eligible = |s: Skill| {
        open(s)
            && (short(s)
                || (skills[index(s)].chances >= COSTLY_CHANCES
                    && skills[index(s)].gain >= COSTLY_GAIN))
    };
    let focus = Skill::ALL
        .into_iter()
        .filter(|&s| eligible(s))
        .max_by(|&a, &b| skills[index(a)].gain.total_cmp(&skills[index(b)].gain));
    let just_mastered = Skill::ALL
        .into_iter()
        .filter(|&s| mastered[index(s)] && !before[index(s)])
        .collect();
    Learner {
        games: games.iter().filter(|g| g.is_current()).count(),
        skills,
        just_mastered,
        focus,
    }
}

/// Whether `view` is a decision to nudge the person on at `focus`: they
/// have a clear chance at it (`tutor::open`), valued by the advisor, one
/// advisor run.
pub fn nudge(focus: Skill, view: &View) -> bool {
    if view.to_move != Some(view.me) || view.candidates().len() < 2 {
        return false;
    }
    let values = tutor::assessed(view, None);
    tutor::open(focus, view, tutor::margin(view), &values)
}

/// The natural logarithm of the gamma function (Lanczos, g = 7).
fn ln_gamma(x: f64) -> f64 {
    const C: [f64; 9] = [
        0.999_999_999_999_809_9,
        676.520_368_121_885_1,
        -1_259.139_216_722_402_8,
        771.323_428_777_653_1,
        -176.615_029_162_140_6,
        12.507_343_278_686_905,
        -0.138_571_095_265_720_12,
        9.984_369_578_019_572e-6,
        1.505_632_735_149_311_6e-7,
    ];
    if x < 0.5 {
        return (std::f64::consts::PI / (std::f64::consts::PI * x).sin()).ln() - ln_gamma(1.0 - x);
    }
    let x = x - 1.0;
    let t = x + 7.5;
    let sum = C[0]
        + C.iter()
            .enumerate()
            .skip(1)
            .map(|(i, c)| c / (x + i as f64))
            .sum::<f64>();
    0.5 * (2.0 * std::f64::consts::PI).ln() + (x + 0.5) * t.ln() - t + sum.ln()
}

/// The regularized incomplete beta function I_x(a, b): the probability that
/// a Beta(a, b) variable is at most `x`. The continued fraction of
/// Numerical Recipes (Lentz's method), on whichever side of (a + 1)/(a + b +
/// 2) converges.
pub fn beta_cdf(x: f64, a: f64, b: f64) -> f64 {
    if x <= 0.0 {
        return 0.0;
    }
    if x >= 1.0 {
        return 1.0;
    }
    let front =
        (ln_gamma(a + b) - ln_gamma(a) - ln_gamma(b) + a * x.ln() + b * (1.0 - x).ln()).exp();
    if x < (a + 1.0) / (a + b + 2.0) {
        front * beta_fraction(x, a, b) / a
    } else {
        1.0 - front * beta_fraction(1.0 - x, b, a) / b
    }
}

fn beta_fraction(x: f64, a: f64, b: f64) -> f64 {
    const TINY: f64 = 1e-300;
    let (qab, qap, qam) = (a + b, a + 1.0, a - 1.0);
    let mut c = 1.0;
    let mut d = 1.0 - qab * x / qap;
    if d.abs() < TINY {
        d = TINY;
    }
    d = 1.0 / d;
    let mut h = d;
    for m in 1..300 {
        let m = f64::from(m);
        let m2 = 2.0 * m;
        let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        d = 1.0 + aa * d;
        if d.abs() < TINY {
            d = TINY;
        }
        c = 1.0 + aa / c;
        if c.abs() < TINY {
            c = TINY;
        }
        d = 1.0 / d;
        h *= d * c;
        let aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1.0 + aa * d;
        if d.abs() < TINY {
            d = TINY;
        }
        c = 1.0 + aa / c;
        if c.abs() < TINY {
            c = TINY;
        }
        d = 1.0 / d;
        let delta = d * c;
        h *= delta;
        if (delta - 1.0).abs() < 1e-14 {
            break;
        }
    }
    h
}

/// The `p` quantile of Beta(a, b), by bisection on [`beta_cdf`] (the cdf is
/// monotone; 60 halvings give 1e-18).
pub fn beta_quantile(p: f64, a: f64, b: f64) -> f64 {
    let (mut lo, mut hi) = (0.0, 1.0);
    for _ in 0..60 {
        let mid = 0.5 * (lo + hi);
        if beta_cdf(mid, a, b) < p {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    0.5 * (lo + hi)
}

/// A finished game of `agent` in the person's seat, against the opponent at
/// `opponent` on the dial, for the experiments and the acceptance tests of
/// the learner.
pub fn play_game(agent: &mut dyn Agent, rules: Rules, opponent: f64, seed: u64) -> Session {
    let mut s = Session::new(
        seed,
        Settings {
            rules,
            skill: opponent,
        },
    );
    loop {
        match s.prompt() {
            Prompt::Play => {
                let mv = agent.choose(&s.view());
                assert!(s.send(&mv.to_string()), "{mv} is a legal move");
            }
            Prompt::NextHand => assert!(s.send("next")),
            Prompt::Over => return s,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents::Agent;
    use crate::rules::Rules;

    fn close(a: f64, b: f64) {
        assert!((a - b).abs() < 1e-9, "{a} != {b}");
    }

    #[test]
    fn the_beta_distribution_matches_known_values() {
        // Beta(1, 1) is uniform; Beta(2, 1) has cdf x^2, Beta(1, 3) has
        // 1 - (1 - x)^3.
        close(beta_cdf(0.3, 1.0, 1.0), 0.3);
        close(beta_cdf(0.3, 2.0, 1.0), 0.09);
        close(beta_cdf(0.3, 1.0, 3.0), 1.0 - 0.7f64.powi(3));
        close(beta_quantile(0.1, 9.0, 1.0), 0.1f64.powf(1.0 / 9.0));
        close(beta_quantile(0.9, 1.0, 4.0), 1.0 - 0.1f64.powf(0.25));
        // Symmetric: the median is a half, and the quantiles mirror.
        close(beta_quantile(0.5, 7.5, 7.5), 0.5);
        close(
            beta_quantile(0.1, 3.0, 8.0),
            1.0 - beta_quantile(0.9, 8.0, 3.0),
        );
        // Beta(3, 2) has cdf 4x^3 - 3x^4 (integrating 12x^2(1 - x)).
        let x: f64 = 0.6;
        close(beta_cdf(x, 3.0, 2.0), 4.0 * x.powi(3) - 3.0 * x.powi(4));
        // A large sample is near its mean, with the normal's spread.
        let (a, b): (f64, f64) = (101.0, 21.0);
        let (mean, sd) = (
            a / (a + b),
            (a * b / ((a + b).powi(2) * (a + b + 1.0))).sqrt(),
        );
        assert!((beta_quantile(0.5, a, b) - mean).abs() < 0.005);
        let q = beta_quantile(0.1, a, b);
        assert!((q - (mean - 1.2816 * sd)).abs() < 0.01, "{q}");
        // Round trip.
        for (a, b) in [(0.5, 0.5), (2.0, 30.0), (40.0, 1.0)] {
            for p in [0.05, 0.5, 0.95] {
                close(beta_cdf(beta_quantile(p, a, b), a, b), p);
            }
        }
    }

    fn summary(lines: &[(Skill, u32, u32, f64)]) -> Summary {
        let mut s = Summary::from_chances(&[]);
        for &(skill, chances, met, missed) in lines {
            s.tallies[index(skill)] = Tally {
                chances,
                met,
                missed,
            };
        }
        s
    }

    #[test]
    fn a_summary_counts_chances_met_and_the_gaps_of_those_missed() {
        let chance = |skill, met, gap| Chance { skill, met, gap };
        let s = Summary::from_chances(&[
            chance(Skill::Pairs, true, 1.0),
            chance(Skill::Pairs, false, 0.75),
            chance(Skill::Pairs, false, 0.5),
            chance(Skill::Building, true, 2.0),
        ]);
        assert_eq!(
            s.of(Skill::Pairs),
            Tally {
                chances: 3,
                met: 1,
                missed: 1.25
            }
        );
        assert_eq!(s.of(Skill::Building).missed, 0.0);
        assert_eq!(s.of(Skill::Sums), Tally::default());
        assert!(s.is_current());
    }

    #[test]
    fn a_summary_round_trips_through_its_text() {
        let s = summary(&[
            (Skill::Pairs, 12, 11, 0.35),
            (Skill::Building, 3, 0, 4.0 / 3.0),
            (Skill::Trailing, 7, 7, 0.0),
        ]);
        let text = s.to_text();
        assert!(
            text.starts_with("cassino evidence v1\npairs 12 11 0.35\n"),
            "{text}"
        );
        assert_eq!(Summary::parse(&text), Ok(s.clone()));
        assert_eq!(Summary::parse(&format!("{text}\n")), Ok(s));
        for bad in [
            "",
            "cassino evidence v1",
            "cassino evidence v1\npairs 1 2 0\n",
            &text.replace("pairs", "pears"),
            &text.replace("12 11", "x 11"),
            &text.replace("0.35", "-1"),
        ] {
            assert!(Summary::parse(bad).is_err(), "{bad}");
        }
    }

    #[test]
    fn a_stale_summary_is_not_counted() {
        let mut old = summary(&[(Skill::Pairs, 20, 0, 40.0)]);
        old.version = EVIDENCE_VERSION + 1;
        let l = learn(&[old.clone()]);
        assert_eq!(l.focus, None);
        assert!(!l.mastered(Skill::Pairs));
        let fresh = summary(&[]);
        assert_eq!(stale(&[fresh.clone(), old, fresh]), [1]);
        assert!(stale(&[]).is_empty());
    }

    /// A game of `chances` at `skill`, `met` of them met, each miss costing
    /// `gap`.
    fn game(skill: Skill, chances: u32, met: u32, gap: f64) -> Summary {
        summary(&[(skill, chances, met, f64::from(chances - met) * gap)])
    }

    #[test]
    fn a_skill_is_mastered_when_its_rate_is_surely_high_and_lost_when_surely_low() {
        let mut games = Vec::new();
        let mut states = Vec::new();
        for _ in 0..3 {
            games.push(game(Skill::Pairs, 6, 6, 1.0));
            states.push(learn(&games).mastered(Skill::Pairs));
        }
        assert_eq!(states, [false, true, true], "first too few, then sure");
        assert_eq!(learn(&games[..2]).just_mastered, [Skill::Pairs]);
        assert!(
            learn(&games).just_mastered.is_empty(),
            "only the game it came with"
        );
        // One bad game does not lose it; a run of them does.
        games.push(game(Skill::Pairs, 6, 3, 1.0));
        assert!(learn(&games).mastered(Skill::Pairs), "hysteresis");
        assert!(learn(&games).just_mastered.is_empty());
        for _ in 0..4 {
            games.push(game(Skill::Pairs, 6, 1, 1.0));
        }
        assert!(!learn(&games).mastered(Skill::Pairs));
    }

    #[test]
    fn the_state_after_a_game_depends_on_the_state_before() {
        // The same recent games, a different past: a rate between losing
        // and gaining mastery keeps whichever state it came to.
        let middling = game(Skill::Pairs, 30, 25, 0.5);
        let mut up: Vec<Summary> = (0..3).map(|_| game(Skill::Pairs, 30, 30, 0.5)).collect();
        let mut down: Vec<Summary> = (0..3).map(|_| game(Skill::Pairs, 30, 15, 0.5)).collect();
        for _ in 0..30 {
            up.push(middling.clone());
            down.push(middling.clone());
        }
        let (up, down) = (learn(&up), learn(&down));
        assert!(up.mastered(Skill::Pairs));
        assert!(!down.mastered(Skill::Pairs));
    }

    #[test]
    fn the_focus_is_the_costliest_skill_whose_prerequisites_are_cleared() {
        // Sums costs most, but needs Pairs; Pairs is not mastered (it is
        // missed, cheaply), so Pairs is the focus.
        let games = vec![summary(&[
            (Skill::Pairs, 10, 4, 3.0),
            (Skill::Sums, 10, 2, 16.0),
            (Skill::Valuables, 5, 3, 1.0),
        ])];
        let l = learn(&games);
        assert_eq!(l.focus, Some(Skill::Pairs));
        close(l.state(Skill::Sums).cost, 16.0);
        // With Pairs cleared (mastered), Sums is the next.
        let games: Vec<Summary> = (0..3)
            .map(|_| {
                summary(&[
                    (Skill::Pairs, 20, 20, 0.0),
                    (Skill::Sums, 10, 2, 16.0),
                    (Skill::Valuables, 5, 3, 1.0),
                ])
            })
            .collect();
        assert_eq!(learn(&games).focus, Some(Skill::Sums));
        // A prerequisite that costs nothing is cleared without being
        // mastered (too few chances to say).
        let games = vec![summary(&[(Skill::Sums, 10, 2, 16.0)])];
        assert_eq!(learn(&games).focus, Some(Skill::Sums));
    }

    #[test]
    fn a_few_misses_among_few_chances_name_no_focus() {
        // One miss of five, costing 3 points: 3 points a game, but the
        // rate may still be high.
        let one = vec![summary(&[(Skill::Valuables, 5, 4, 3.0)])];
        assert_eq!(learn(&one).focus, None);
        // Two met of five in each of six games: surely short.
        let six = vec![summary(&[(Skill::Valuables, 5, 2, 3.0)]); 6];
        assert_eq!(learn(&six).focus, Some(Skill::Valuables));
    }

    #[test]
    fn one_missed_chance_names_no_focus() {
        // A single chance, missed, with a large gap: no evidence of a rate.
        let one = vec![summary(&[(Skill::Valuables, 1, 0, 3.0)])];
        assert_eq!(learn(&one).focus, None);
    }

    #[test]
    fn a_prerequisite_not_shown_short_does_not_block_what_is_surely_short() {
        // Pairs is met 7 of 8 (a miss costs 2 points): not mastered, but not
        // surely short either. Sums is met 1 of 6: surely short, and it
        // should be named, not left behind its half-proven prerequisite.
        let games = vec![summary(&[(Skill::Pairs, 8, 7, 2.0), (Skill::Sums, 6, 1, 25.0)]); 20];
        let l = learn(&games);
        assert!(!l.mastered(Skill::Pairs));
        assert_eq!(l.focus, Some(Skill::Sums));
    }

    #[test]
    fn a_costly_skill_with_a_middling_rate_is_the_focus() {
        // A random player's Valuables: met 39 of 48 (0.81, not surely short
        // of 0.845) but 6 points a game lost.
        let games = vec![summary(&[(Skill::Valuables, 12, 10, 14.0)]); 8];
        let l = learn(&games);
        assert!(l.state(Skill::Valuables).gain > COSTLY_GAIN);
        assert_eq!(l.focus, Some(Skill::Valuables));
    }

    #[test]
    fn a_skill_costing_a_lot_is_the_focus_even_when_not_surely_short() {
        // Met 5 of 6 each game, a miss costing 12 points: not surely short
        // (the rate may be 0.85) but a great deal is being lost.
        let games = vec![summary(&[(Skill::Valuables, 6, 5, 12.0)]); 10];
        let l = learn(&games);
        assert!(!l.mastered(Skill::Valuables));
        assert_eq!(l.focus, Some(Skill::Valuables));
    }

    #[test]
    fn a_decision_after_help_is_no_evidence() {
        use crate::session::{Prompt, Session, Settings};
        let play = |helped: bool| -> Vec<Turn> {
            let mut s = Session::new(21, Settings::default());
            let mut greedy = agents::GreedyAgent;
            loop {
                match s.prompt() {
                    Prompt::Play => {
                        if helped {
                            assert!(s.send("hint"));
                        }
                        let mv = greedy.choose(&s.view());
                        assert!(s.send(&mv.to_string()));
                    }
                    Prompt::NextHand => assert!(s.send("next")),
                    Prompt::Over => return s.turns().to_vec(),
                }
            }
        };
        let alone = evidence(&play(false));
        assert!(
            alone.tallies.iter().map(|t| t.chances).sum::<u32>() > 10,
            "{alone:?}"
        );
        let helped = evidence(&play(true));
        assert_eq!(helped, Summary::from_chances(&[]));
        // A nudge counts as help the same way.
        let mut s = Session::new(21, Settings::default());
        assert!(s.send("nudged pairs"));
        let mv = s.candidates()[0];
        assert!(s.send(&mv.to_string()));
        assert!(chances_of(&s.turns()[..1]).is_empty());
    }

    #[test]
    fn no_focus_when_nothing_costs_enough() {
        let games = vec![summary(&[
            (Skill::Pairs, 10, 9, 0.2),
            (Skill::Valuables, 5, 4, 0.1),
        ])];
        assert_eq!(learn(&games).focus, None);
        assert_eq!(learn(&[]).focus, None);
    }

    #[test]
    fn older_games_count_for_less() {
        let bad = game(Skill::Valuables, 10, 0, 1.0);
        let fine = game(Skill::Valuables, 10, 10, 1.0);
        let recent_bad = learn(&[fine.clone(), bad.clone()]);
        let recent_fine = learn(&[bad, fine]);
        assert!(recent_bad.state(Skill::Valuables).cost > recent_fine.state(Skill::Valuables).cost);
        close(
            recent_fine.state(Skill::Valuables).cost,
            10.0 / (1.0 + DISCOUNT) * DISCOUNT,
        );
    }

    // The design's acceptance test: lesioned students, diagnosed. Each plays
    // the person's seat against the counter, sweeps off (the game's
    // default), and the learner is asked after every game.

    use crate::agents;
    use crate::rng::Rng;

    /// The learner after each of `games` games of `student` (a name of
    /// `agents::by_name`, or a dial setting) from `first`.
    fn students(student: &str, rules: Rules, first: u64, games: u64) -> Vec<Learner> {
        let mut summaries = Vec::new();
        let mut out = Vec::new();
        for seed in first..first + games {
            let mut agent: Box<dyn Agent> = match student.parse::<f64>() {
                Ok(dial) => Box::new(crate::opponent::Skill(dial).opponent(seed ^ 0x5eed)),
                Err(_) => agents::by_name(student, Rng::seeded(seed ^ 0x5eed)).expect(student),
            };
            let session = play_game(agent.as_mut(), rules, 3.0, seed);
            summaries.push(evidence(session.turns()));
            let l = learn(&summaries);
            eprintln!(
                "{student} game {}: focus {:?}, mastered {:?}, gains {:?}",
                summaries.len(),
                l.focus,
                Skill::ALL
                    .into_iter()
                    .filter(|&s| l.mastered(s))
                    .collect::<Vec<_>>(),
                Skill::ALL.map(|s| (s.slug(), (l.state(s).gain * 100.0).round() / 100.0)),
            );
            out.push(l);
        }
        out
    }

    fn classic() -> Rules {
        Rules {
            sweeps: false,
            ..Rules::CLASSIC
        }
    }

    fn royal() -> Rules {
        Rules {
            sweeps: false,
            ..Rules::ROYAL
        }
    }

    /// The learner at the end of each of `n` windows of four games of
    /// `student`, the windows on consecutive seeds from `first`: the
    /// diagnosis after a student's first four games, several times over.
    fn windows(student: &str, rules: Rules, first: u64, n: u64) -> Vec<Learner> {
        (0..n)
            .map(|w| students(student, rules, first + 4 * w, 4).pop().unwrap())
            .collect()
    }

    /// One window in the default run, three when the sweep is asked for
    /// (`cargo test -p cassino-core --lib learner:: -- --ignored`).
    const SWEEP: u64 = 3;

    fn strongest_rung(n: u64) {
        for (rules, first) in [(classic(), 7_000), (royal(), 7_100)] {
            for last in windows("searcher", rules, first, n) {
                assert_eq!(last.focus, None, "{:?}", last.skills);
                let mastered = Skill::ALL.into_iter().filter(|&s| last.mastered(s)).count();
                assert!(mastered >= 3, "{mastered} mastered: {:?}", last.skills);
            }
        }
    }

    fn no_building(n: u64) {
        for (rules, first) in [(classic(), 7_200), (royal(), 7_300)] {
            for last in windows("searcher-no-building", rules, first, n) {
                assert_eq!(last.focus, Some(Skill::Building), "{:?}", last.skills);
            }
        }
    }

    fn no_pairs(n: u64) {
        for last in windows("searcher-no-pairs", classic(), 7_400, n) {
            assert_eq!(last.focus, Some(Skill::Pairs), "{:?}", last.skills);
        }
    }

    /// The greedy player lacks both building and trailing well: either is
    /// the right thing to be told (Building in five windows of six, Trailing
    /// in the other).
    fn greedy(n: u64) {
        for (rules, first) in [(classic(), 7_500), (royal(), 7_600)] {
            for last in windows("2", rules, first, n) {
                assert!(
                    matches!(last.focus, Some(Skill::Building | Skill::Trailing)),
                    "{:?}: {:?}",
                    last.focus,
                    last.skills
                );
            }
        }
    }

    #[test]
    fn the_strongest_rung_is_diagnosed_as_having_nothing_to_learn() {
        strongest_rung(1);
    }

    #[test]
    fn a_student_without_building_is_told_to_build() {
        no_building(1);
    }

    #[test]
    fn a_student_without_pairs_is_told_to_take_pairs() {
        no_pairs(1);
    }

    #[test]
    fn the_greedy_player_is_told_to_build_or_trail() {
        greedy(1);
    }

    #[test]
    #[ignore = "a sweep of three windows each: a few minutes"]
    fn the_diagnoses_hold_over_three_windows() {
        strongest_rung(SWEEP);
        no_building(SWEEP);
        no_pairs(SWEEP);
        greedy(SWEEP);
    }
}
