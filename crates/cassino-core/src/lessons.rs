//! Rules as measured claims (`docs/DESIGN.md` §12.8).
//!
//! The tutor teaches each skill ([`Skill`]) with one rule of fifteen words
//! or fewer. A wrong rule does harm, so a rule is a claim that is measured
//! before it is shown: a **trigger**, a test of the position (a [`View`],
//! so never a hidden card), and a **prescription**, a test of the move
//! given that position. Its **precision** is how often the strongest rung's
//! move satisfies the prescription when the trigger fires; its
//! **coverage**, how often the trigger fires where the skill matters
//! ([`matters`]). A rule ships only if the 95% lower bound of its precision
//! ([`wilson`]) is at least [`SHIP_BOUND`], and the best of several is
//! confirmed on fresh positions, since the best of several noisy estimates
//! is too high (`docs/DESIGN.md` §11.4).
//!
//! The candidates ([`CANDIDATES`]) were written before any was measured,
//! two to four for each skill, each as a strong player would put it. The
//! `rules` binary does the measuring.

use crate::advice::{self, Note};
use crate::cards::{Card, CardSet, ACE};
use crate::moves::Move;
use crate::observation::View;
use crate::table::Seat;
use crate::tutor::{shows, valuable, Chance, Skill};

/// The most words a rule may use.
pub const MAX_WORDS: usize = 15;

/// A rule ships only if its precision's 95% lower bound reaches this.
pub const SHIP_BOUND: f64 = 0.80;

/// A rule for one skill: what to say, when it applies, and what it asks.
pub struct Rule {
    /// A short name for tables: the skill's letter and a number.
    pub id: &'static str,
    pub skill: Skill,
    /// What the player reads: fifteen words or fewer.
    pub text: &'static str,
    /// The position is one the rule speaks to.
    pub trigger: fn(&View) -> bool,
    /// The move does what the rule says, in that position.
    pub prescription: fn(&View, &Move) -> bool,
    /// The rule is measured only on decisions where the rung's move is of
    /// this kind (`always` for most). The safe-build rules say which build
    /// to make, not whether to build, so they are measured on the decisions
    /// where the rung built: precision is P(prescription | trigger, rung
    /// built).
    pub given: fn(&View, &Move) -> bool,
}

fn always(_: &View, _: &Move) -> bool {
    true
}

/// The candidate rules, written before any was measured.
pub const CANDIDATES: [Rule; 22] = [
    Rule {
        id: "P1",
        skill: Skill::Pairs,
        text: "If a card in your hand matches a table card, take it.",
        trigger: pair_open,
        prescription: takes_pair,
        given: always,
    },
    Rule {
        id: "P2",
        skill: Skill::Pairs,
        text: "If a card of yours matches an ace, a Cassino or a spade, take it.",
        trigger: pair_with_prize,
        prescription: takes_prize_pair,
        given: always,
    },
    Rule {
        id: "S1",
        skill: Skill::Sums,
        text: "If table cards add up to a card in your hand, take them.",
        trigger: sum_open,
        prescription: takes_sum,
        given: always,
    },
    Rule {
        id: "S2",
        skill: Skill::Sums,
        text: "Of the captures open to you, take the one that gathers the most cards.",
        trigger: captures_differ,
        prescription: takes_most,
        given: always,
    },
    Rule {
        id: "S3",
        skill: Skill::Sums,
        text: "A sum that takes three cards or more is worth taking.",
        trigger: big_capture_open,
        prescription: takes_three,
        given: always,
    },
    Rule {
        id: "B1",
        skill: Skill::Building,
        text: "Build when you hold two cards of the build's value.",
        trigger: build_with_spare,
        prescription: is_build,
        given: always,
    },
    Rule {
        id: "B2",
        skill: Skill::Building,
        text: "Build a value that at most one card you cannot see can take.",
        trigger: build_nearly_safe,
        prescription: is_build,
        given: always,
    },
    Rule {
        id: "B3",
        skill: Skill::Building,
        text: "With nothing to take, build rather than trail, if you can.",
        trigger: build_not_trail,
        prescription: is_build,
        given: always,
    },
    Rule {
        id: "SB1",
        skill: Skill::SafeBuilds,
        text: "Build a value that at most one card you cannot see can take.",
        trigger: build_nearly_safe_any,
        prescription: builds_nearly_safe,
        given: is_build,
    },
    Rule {
        id: "SB2",
        skill: Skill::SafeBuilds,
        text: "Of the builds you could make, make the one fewest hidden cards can take.",
        trigger: builds_differ,
        prescription: builds_safest,
        given: is_build,
    },
    Rule {
        id: "SB3",
        skill: Skill::SafeBuilds,
        text: "Build the value you hold twice, so that one card is spare.",
        trigger: any_build_with_spare,
        prescription: builds_with_spare,
        given: is_build,
    },
    Rule {
        id: "A1",
        skill: Skill::AnsweringBuilds,
        text: "If you can take your opponent's build, take it.",
        trigger: their_build_takeable,
        prescription: takes_their_build,
        given: always,
    },
    Rule {
        id: "A2",
        skill: Skill::AnsweringBuilds,
        text: "Take your opponent's build when it holds three cards or more.",
        trigger: their_big_build_takeable,
        prescription: takes_their_big_build,
        given: always,
    },
    Rule {
        id: "A3",
        skill: Skill::AnsweringBuilds,
        text: "If you cannot take their build, raise it, if you can.",
        trigger: their_build_raisable,
        prescription: raises_their_build,
        given: always,
    },
    Rule {
        id: "N1",
        skill: Skill::NoSweep,
        text: "Do not leave a table that adds up to one value: one card sweeps it.",
        trigger: sweep_avoidable,
        prescription: leaves_no_sweep,
        given: always,
    },
    Rule {
        id: "N2",
        skill: Skill::NoSweep,
        text: "Do not leave a table that three or more hidden cards could sweep.",
        trigger: heavy_sweep_avoidable,
        prescription: leaves_no_heavy_sweep,
        given: always,
    },
    Rule {
        id: "V1",
        skill: Skill::Valuables,
        text: "Never trail an ace or Cassino while you have another card to trail.",
        trigger: prize_and_spare,
        prescription: keeps_prizes,
        given: always,
    },
    Rule {
        id: "V2",
        skill: Skill::Valuables,
        text: "When you can take an ace or Cassino, take it.",
        trigger: prize_takeable,
        prescription: takes_prize,
        given: always,
    },
    Rule {
        id: "V3",
        skill: Skill::Valuables,
        text: "Play an ace only to take something.",
        trigger: ace_and_spare,
        prescription: keeps_aces,
        given: always,
    },
    Rule {
        id: "T1",
        skill: Skill::Trailing,
        text: "Trail a card that adds up with nothing on the table, if you have one.",
        trigger: isolated_to_trail,
        prescription: trails_isolated,
        given: always,
    },
    Rule {
        id: "T2",
        skill: Skill::Trailing,
        text: "When you must trail, trail your lowest card that is not an ace or Cassino.",
        trigger: lowest_to_trail,
        prescription: trails_lowest,
        given: always,
    },
    Rule {
        id: "T3",
        skill: Skill::Trailing,
        text: "Trail a card of which at most one copy is unseen.",
        trigger: played_out_to_trail,
        prescription: trails_played_out,
        given: always,
    },
];

// ---- The position and the move, in the terms the rules use ----

fn prizes_in(set: CardSet) -> CardSet {
    set.iter().filter(|&c| valuable(c)).collect()
}

fn opponent_builds(v: &View) -> impl Iterator<Item = &crate::table::Build> {
    let them: Seat = v.opponent();
    v.table.builds.iter().filter(move |b| b.controller == them)
}

fn captures(v: &View) -> Vec<Move> {
    let mut all = v.candidates();
    all.retain(|m| matches!(m, Move::Capture { .. }));
    all
}

fn builds(v: &View) -> Vec<Move> {
    let mut all = v.candidates();
    all.retain(|m| matches!(m, Move::Build { .. }));
    all
}

fn taken(m: &Move) -> CardSet {
    match *m {
        Move::Capture { taken, .. } => taken,
        _ => CardSet::EMPTY,
    }
}

/// Cards that could take a build of `value` that the player cannot see.
fn hidden_takers(v: &View, value: u8) -> u32 {
    (v.unseen() & advice::capturers(&v.rules, value)).len()
}

/// Cards in hand, besides the one a build move plays, that take `value`.
fn spare_takers(v: &View, m: &Move) -> u32 {
    match *m {
        Move::Build { card, value, .. } => {
            (v.hand.without(card) & advice::capturers(&v.rules, value)).len()
        }
        _ => 0,
    }
}

fn build_value(m: &Move) -> Option<u8> {
    match *m {
        Move::Build { value, .. } => Some(value),
        _ => None,
    }
}

/// The move adds to or raises a build the opponent controls.
fn onto_theirs(v: &View, m: &Move) -> bool {
    match *m {
        Move::Build { onto: Some(o), .. } => v
            .table
            .build_of(o)
            .is_some_and(|b| b.controller == v.opponent()),
        _ => false,
    }
}

/// The move takes a build the opponent controls, of at least `size` cards.
fn takes_theirs(v: &View, m: &Move, size: u32) -> bool {
    let t = taken(m);
    opponent_builds(v).any(|b| t.contains_all(b.cards) && b.cards.len() >= size)
}

/// How many cards that cannot be seen could sweep the table after `m`: 0 if
/// none could. Whether or not sweeps are scored: clearing the table hands
/// over every card on it either way.
fn sweep_risk(v: &View, m: &Move) -> u32 {
    advice::notes(v, v.me, m)
        .iter()
        .map(|n| match n {
            Note::SweepOpen {
                held: false,
                unseen,
                ..
            } => u32::from(*unseen),
            _ => 0,
        })
        .max()
        .unwrap_or(0)
}

/// Some move leaves a risk of `at_least` or more, and another less.
fn sweep_choice(v: &View, at_least: u32) -> bool {
    let risks: Vec<u32> = v.candidates().iter().map(|m| sweep_risk(v, m)).collect();
    risks.iter().any(|&r| r >= at_least) && risks.iter().any(|&r| r < at_least)
}

/// A card that pairs with nothing and adds up with nothing on the table: it
/// cannot be taken but by a card of its own rank.
fn isolated(v: &View, card: Card) -> bool {
    let rules = &v.rules;
    if !(v.table.loose & CardSet::of_rank(card.rank())).is_empty() {
        return false;
    }
    let Some(x) = rules.build_value(card) else {
        return true;
    };
    let room = rules.max_build().saturating_sub(x);
    let sums =
        (1..=room).any(|t| !crate::sums::subsets_summing(rules, v.table.loose, t).is_empty());
    let raises = v
        .table
        .builds
        .iter()
        .any(|b| b.value + x <= rules.max_build());
    !sums && !raises
}

fn has_capture(v: &View) -> bool {
    !captures(v).is_empty()
}

fn trailed(m: &Move) -> Option<Card> {
    match *m {
        Move::Trail { card } => Some(card),
        _ => None,
    }
}

// ---- Pairs ----

/// The move is a capture that takes a pair ([`shows`] Pairs).
fn takes_pair(v: &View, m: &Move) -> bool {
    shows(v, m).contains(&Skill::Pairs)
}

/// The move takes a pair of an ace, a Cassino or a spade.
fn takes_prize_pair(v: &View, m: &Move) -> bool {
    takes_pair(v, m)
        && (taken(m) & v.table.loose)
            .iter()
            .any(|t| valuable(t) || t.suit() == crate::cards::Suit::Spades)
}

fn pair_open(v: &View) -> bool {
    v.candidates().iter().any(|m| takes_pair(v, m))
}

fn pair_with_prize(v: &View) -> bool {
    v.candidates().iter().any(|m| takes_prize_pair(v, m))
}

fn is_capture(_: &View, m: &Move) -> bool {
    matches!(m, Move::Capture { .. })
}

// ---- Sums ----

/// The move takes a sum group ([`shows`] Sums).
fn takes_sum(v: &View, m: &Move) -> bool {
    shows(v, m).contains(&Skill::Sums)
}

fn sum_open(v: &View) -> bool {
    v.candidates().iter().any(|m| takes_sum(v, m))
}

fn captures_differ(v: &View) -> bool {
    let sizes: Vec<u32> = captures(v).iter().map(|m| taken(m).len()).collect();
    sizes.iter().any(|&s| s != sizes[0])
}

fn takes_most(v: &View, m: &Move) -> bool {
    is_capture(v, m) && captures(v).iter().all(|c| taken(c).len() <= taken(m).len())
}

fn big_capture_open(v: &View) -> bool {
    captures(v).iter().any(|m| taken(m).len() >= 3)
}

fn takes_three(_: &View, m: &Move) -> bool {
    taken(m).len() >= 3
}

// ---- Building ----

fn is_build(_: &View, m: &Move) -> bool {
    matches!(m, Move::Build { .. })
}

fn new_builds(v: &View) -> Vec<Move> {
    let mut all = builds(v);
    all.retain(|m| matches!(m, Move::Build { onto: None, .. }));
    all
}

fn build_with_spare(v: &View) -> bool {
    new_builds(v).iter().any(|m| spare_takers(v, m) >= 2)
}

fn build_nearly_safe(v: &View) -> bool {
    new_builds(v)
        .iter()
        .any(|m| build_value(m).is_some_and(|x| hidden_takers(v, x) <= 1))
}

fn build_not_trail(v: &View) -> bool {
    !has_capture(v) && !builds(v).is_empty()
}

// ---- Safe builds ----

fn build_nearly_safe_any(v: &View) -> bool {
    builds(v)
        .iter()
        .any(|m| build_value(m).is_some_and(|x| hidden_takers(v, x) <= 1))
}

fn builds_nearly_safe(v: &View, m: &Move) -> bool {
    build_value(m).is_some_and(|x| hidden_takers(v, x) <= 1)
}

fn builds_differ(v: &View) -> bool {
    let risks: Vec<u32> = builds(v)
        .iter()
        .filter_map(|m| build_value(m).map(|x| hidden_takers(v, x)))
        .collect();
    risks.iter().any(|&r| r != risks[0])
}

fn builds_safest(v: &View, m: &Move) -> bool {
    let Some(x) = build_value(m) else {
        return false;
    };
    let mine = hidden_takers(v, x);
    builds(v)
        .iter()
        .filter_map(build_value)
        .all(|y| hidden_takers(v, y) >= mine)
}

fn any_build_with_spare(v: &View) -> bool {
    builds(v).iter().any(|m| spare_takers(v, m) >= 2)
}

fn builds_with_spare(v: &View, m: &Move) -> bool {
    spare_takers(v, m) >= 2
}

// ---- Answering builds ----

fn their_build_takeable(v: &View) -> bool {
    captures(v).iter().any(|m| takes_theirs(v, m, 1))
}

fn takes_their_build(v: &View, m: &Move) -> bool {
    takes_theirs(v, m, 1)
}

fn their_big_build_takeable(v: &View) -> bool {
    captures(v).iter().any(|m| takes_theirs(v, m, 3))
}

fn takes_their_big_build(v: &View, m: &Move) -> bool {
    takes_theirs(v, m, 3)
}

fn their_build_raisable(v: &View) -> bool {
    !captures(v).iter().any(|m| takes_theirs(v, m, 1))
        && builds(v).iter().any(|m| onto_theirs(v, m))
}

fn raises_their_build(v: &View, m: &Move) -> bool {
    onto_theirs(v, m)
}

// ---- Leaving no sweep ----

fn sweep_avoidable(v: &View) -> bool {
    sweep_choice(v, 1)
}

fn leaves_no_sweep(v: &View, m: &Move) -> bool {
    sweep_risk(v, m) == 0
}

/// The risk the second sweep rule calls heavy: this many hidden cards.
const HEAVY: u32 = 3;

fn heavy_sweep_avoidable(v: &View) -> bool {
    sweep_choice(v, HEAVY)
}

fn leaves_no_heavy_sweep(v: &View, m: &Move) -> bool {
    sweep_risk(v, m) < HEAVY
}

// ---- Keeping aces and Cassinos ----

fn prize_and_spare(v: &View) -> bool {
    !prizes_in(v.hand).is_empty() && v.hand.len() > prizes_in(v.hand).len()
}

fn keeps_prizes(_: &View, m: &Move) -> bool {
    !trailed(m).is_some_and(valuable)
}

fn prize_takeable(v: &View) -> bool {
    captures(v).iter().any(|m| !prizes_in(taken(m)).is_empty())
}

fn takes_prize(_: &View, m: &Move) -> bool {
    !prizes_in(taken(m)).is_empty()
}

fn ace_and_spare(v: &View) -> bool {
    let aces = v.hand & CardSet::of_rank(ACE);
    !aces.is_empty() && v.hand.len() > aces.len()
}

/// An ace is played only in a capture: not trailed, not put in a build.
fn keeps_aces(_: &View, m: &Move) -> bool {
    m.card().rank() != ACE || matches!(m, Move::Capture { .. })
}

// ---- Choosing what to trail ----

fn isolated_to_trail(v: &View) -> bool {
    !has_capture(v) && v.hand.iter().any(|c| isolated(v, c))
}

fn trails_isolated(v: &View, m: &Move) -> bool {
    trailed(m).is_some_and(|c| isolated(v, c))
}

fn plain_cards(v: &View) -> CardSet {
    v.hand.iter().filter(|&c| !valuable(c)).collect()
}

fn lowest_rank(v: &View) -> Option<u8> {
    plain_cards(v).iter().map(Card::rank).min()
}

fn lowest_to_trail(v: &View) -> bool {
    let ranks: std::collections::BTreeSet<u8> = plain_cards(v).iter().map(Card::rank).collect();
    !has_capture(v) && ranks.len() >= 2
}

fn trails_lowest(v: &View, m: &Move) -> bool {
    trailed(m).is_some_and(|c| !valuable(c) && Some(c.rank()) == lowest_rank(v))
}

fn rank_unseen(v: &View, card: Card) -> u32 {
    (v.unseen() & CardSet::of_rank(card.rank())).len()
}

fn played_out_to_trail(v: &View) -> bool {
    !has_capture(v) && v.hand.iter().any(|c| rank_unseen(v, c) <= 1)
}

fn trails_played_out(v: &View, m: &Move) -> bool {
    trailed(m).is_some_and(|c| rank_unseen(v, c) <= 1)
}

// ---- Where a skill matters ----

/// Whether the move exercises the skill: for the skills of action, it is
/// the skill's kind of move; for trailing, a trail. For the two skills of
/// restraint (leaving no sweep, keeping aces) the move itself does not
/// show it, so this is whether the error was on offer.
pub fn exercises(skill: Skill, v: &View, m: &Move) -> bool {
    match skill {
        Skill::Pairs | Skill::Sums | Skill::Building | Skill::AnsweringBuilds => {
            shows(v, m).contains(&skill)
        }
        Skill::SafeBuilds => is_build(v, m),
        Skill::Trailing => trailed(m).is_some(),
        Skill::NoSweep => sweep_choice(v, 1),
        Skill::Valuables => prize_and_spare(v),
    }
}

/// Where the skill matters in a decision: the advisor finds a clear chance
/// at it ([`crate::tutor::chances`], with [`crate::tutor::margin`]), the
/// same evidence the learner model counts. A rule's coverage is the share of
/// these decisions in which its trigger fires.
pub fn matters(skill: Skill, chances: &[Chance]) -> bool {
    chances.iter().any(|c| c.skill == skill)
}

// ---- Measuring ----

/// The 95% Wilson score interval for `k` successes in `n` trials. With no
/// trials, everything: 0 to 1.
pub fn wilson(k: u32, n: u32) -> (f64, f64) {
    wilson_f(f64::from(k), f64::from(n))
}

/// [`wilson`] with real counts, for the effective sample of a clustered
/// estimate.
pub fn wilson_f(k: f64, n: f64) -> (f64, f64) {
    if n <= 0.0 {
        return (0.0, 1.0);
    }
    const Z: f64 = 1.96;
    let p = k / n;
    let denom = 1.0 + Z * Z / n;
    let centre = (p + Z * Z / (2.0 * n)) / denom;
    let half = Z * (p * (1.0 - p) / n + Z * Z / (4.0 * n * n)).sqrt() / denom;
    let lo = if k <= 0.0 {
        0.0
    } else {
        (centre - half).max(0.0)
    };
    let hi = if k >= n {
        1.0
    } else {
        (centre + half).min(1.0)
    };
    (lo, hi)
}

/// A share, with its 95% interval.
fn rate(k: u32, n: u32) -> (f64, f64, f64) {
    let (lo, hi) = wilson(k, n);
    let p = if n == 0 {
        0.0
    } else {
        f64::from(k) / f64::from(n)
    };
    (p, lo, hi)
}

/// A precision estimated over games, with decisions within a game treated
/// as correlated.
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct Clustered {
    pub p: f64,
    pub lo: f64,
    pub hi: f64,
    /// The effective sample size, at most the number of firings.
    pub n_eff: f64,
}

/// The clustered estimate of a share from per-game tallies `(t_g, h_g)`:
/// firings and hits in each game. The ratio estimator p = sum h / sum t has
/// variance G/(G-1) * sum (h_g - p t_g)^2 / (sum t)^2; the effective sample
/// is n_eff = p(1-p)/variance (capped at sum t), k_eff = p n_eff, and the
/// interval is Wilson's for (k_eff, n_eff). With independent decisions it is
/// near the plain Wilson interval; the more alike a game's decisions, the
/// wider.
pub fn clustered(games: &[(u32, u32)]) -> Clustered {
    let t: f64 = games.iter().map(|g| f64::from(g.0)).sum();
    let h: f64 = games.iter().map(|g| f64::from(g.1)).sum();
    if t == 0.0 {
        return Clustered {
            p: 0.0,
            lo: 0.0,
            hi: 1.0,
            n_eff: 0.0,
        };
    }
    let p = h / t;
    let g = games.len() as f64;
    let n_eff = if games.len() < 2 {
        t
    } else {
        let ss: f64 = games
            .iter()
            .map(|&(tg, hg)| (f64::from(hg) - p * f64::from(tg)).powi(2))
            .sum();
        let var = g / (g - 1.0) * ss / (t * t);
        if var <= 0.0 {
            t
        } else {
            (p * (1.0 - p) / var).min(t)
        }
    };
    let (lo, hi) = wilson_f(p * n_eff, n_eff);
    Clustered { p, lo, hi, n_eff }
}

/// What one rule has done over a run of decisions, each the strongest
/// rung's move in a position.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Measure {
    pub decisions: u32,
    /// The trigger fired (and the rule's `given` held of the rung's move).
    pub triggered: u32,
    /// ... and the rung's move did as the rule says.
    pub hits: u32,
    /// The skill mattered ([`matters`]): the decision held a clear chance.
    pub matters: u32,
    /// ... and the trigger fired.
    pub matters_triggered: u32,
    /// The trigger fired and the rung's move exercised the skill.
    pub acting: u32,
    /// ... and did as the rule says.
    pub acting_hits: u32,
    /// Firings and hits in each finished game.
    pub games: Vec<(u32, u32)>,
    current: (u32, u32),
}

impl Measure {
    /// Counts one decision: the view, the rung's move in it, and the clear
    /// chances the decision held (for coverage).
    pub fn record(&mut self, rule: &Rule, v: &View, m: &Move, chances: &[Chance]) {
        self.decisions += 1;
        let trigger = (rule.trigger)(v);
        let fired = trigger && (rule.given)(v, m);
        let did = fired && (rule.prescription)(v, m);
        let matter = matters(rule.skill, chances);
        self.triggered += u32::from(fired);
        self.hits += u32::from(did);
        self.current.0 += u32::from(fired);
        self.current.1 += u32::from(did);
        self.matters += u32::from(matter);
        self.matters_triggered += u32::from(matter && trigger);
        if fired && exercises(rule.skill, v, m) {
            self.acting += 1;
            self.acting_hits += u32::from(did);
        }
    }

    /// Closes the game being counted.
    pub fn end_game(&mut self) {
        self.games.push(self.current);
        self.current = (0, 0);
    }

    /// The clustered estimate ([`clustered`]) over the finished games.
    pub fn clustered(&self) -> Clustered {
        clustered(&self.games)
    }

    /// Precision and its 95% interval, clustered by game: of the firings,
    /// the share the rung obeyed. Decisions of one game are correlated, so
    /// this is wider than [`wilson`] on the raw counts.
    pub fn precision(&self) -> (f64, f64, f64) {
        let c = self.clustered();
        (c.p, c.lo, c.hi)
    }

    /// The same among the firings where the rung's move exercised the skill
    /// (plain Wilson; descriptive).
    pub fn acting_precision(&self) -> (f64, f64, f64) {
        rate(self.acting_hits, self.acting)
    }

    /// Of the decisions holding a clear chance at the skill, the share the
    /// trigger fired in.
    pub fn coverage(&self) -> f64 {
        if self.matters == 0 {
            0.0
        } else {
            f64::from(self.matters_triggered) / f64::from(self.matters)
        }
    }

    /// Whether the rule's clustered precision clears the bound for shipping.
    pub fn ships(&self) -> bool {
        self.precision().1 >= SHIP_BOUND
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cards::pack;
    use crate::hand::Hand;
    use crate::rules::Rules;
    use crate::table::Table;

    fn set(s: &str) -> CardSet {
        CardSet::parse(s).unwrap()
    }

    fn mv(s: &str) -> Move {
        Move::parse(s).unwrap()
    }

    /// South's view before moving: `table`, `hand`, `seen` in South's pile.
    fn view(rules: Rules, table: &str, hand: &str, seen: &str) -> View {
        let (h, _) = Hand::deal(rules, Seat::North, pack());
        let mut v = h.view(Seat::South, [0, 0]);
        v.table = Table::parse(&rules, table).unwrap();
        v.hand = set(hand);
        v.piles = [set(seen), CardSet::EMPTY];
        v.opponent_holds = 4;
        v.undealt = v.unseen().len() as u8 - 4;
        v
    }

    fn classic(table: &str, hand: &str) -> View {
        view(Rules::CLASSIC, table, hand, "")
    }

    fn rule(id: &str) -> &'static Rule {
        CANDIDATES
            .iter()
            .find(|r| r.id == id)
            .unwrap_or_else(|| panic!("no rule {id}"))
    }

    /// The rule's trigger on a position, and its prescription of a move.
    fn fires(id: &str, v: &View) -> bool {
        (rule(id).trigger)(v)
    }
    fn says(id: &str, v: &View, m: &str) -> bool {
        (rule(id).prescription)(v, &mv(m))
    }

    #[test]
    fn every_text_is_fifteen_words_or_fewer_and_says_cassino() {
        assert!(CANDIDATES.len() >= 2 * Skill::ALL.len());
        for r in &CANDIDATES {
            let words = r.text.split_whitespace().count();
            assert!(words <= MAX_WORDS, "{}: {words} words: {}", r.id, r.text);
            assert!(!r.text.contains("Casino"), "{}: spell it Cassino", r.id);
        }
    }

    #[test]
    fn each_skill_has_two_to_four_candidates_and_ids_are_unique() {
        for s in Skill::ALL {
            let n = CANDIDATES.iter().filter(|r| r.skill == s).count();
            assert!((2..=4).contains(&n), "{s:?} has {n}");
        }
        let mut ids: Vec<_> = CANDIDATES.iter().map(|r| r.id).collect();
        ids.sort_unstable();
        ids.dedup();
        assert_eq!(ids.len(), CANDIDATES.len());
    }

    #[test]
    fn wilson_interval() {
        let (lo, hi) = wilson(0, 0);
        assert_eq!((lo, hi), (0.0, 1.0));
        let (lo, hi) = wilson(90, 100);
        assert!((lo - 0.8256).abs() < 1e-3, "{lo}");
        assert!((hi - 0.9448).abs() < 1e-3, "{hi}");
        let (lo, hi) = wilson(10, 10);
        assert!((lo - 0.7225).abs() < 1e-3 && hi == 1.0, "{lo} {hi}");
    }

    #[test]
    fn a_measure_counts_firings_hits_and_coverage() {
        let p1 = rule("P1");
        let mut m = Measure::default();
        let clear = |skill| Chance {
            skill,
            met: true,
            gap: 1.0,
        };
        // Fires and obeyed; fires and not obeyed; does not fire (a build
        // of 8 where nothing pairs).
        m.record(
            p1,
            &classic("4H 9C", "4S KD"),
            &mv("take 4S 4H"),
            &[clear(Skill::Pairs)],
        );
        m.record(p1, &classic("4H 9C", "4S KD"), &mv("trail KD"), &[]);
        m.record(p1, &classic("5C", "3D 8S"), &mv("build 8 3D 5C"), &[]);
        m.end_game();
        assert_eq!((m.decisions, m.triggered, m.hits), (3, 2, 1));
        assert_eq!(m.games, vec![(2, 1)]);
        // Pairs mattered once (a clear chance), and the trigger fired then.
        assert_eq!((m.matters, m.matters_triggered), (1, 1));
        assert_eq!(m.coverage(), 1.0);
        // A clear chance the trigger missed lowers coverage.
        m.record(
            p1,
            &classic("5C", "3D 8S"),
            &mv("build 8 3D 5C"),
            &[clear(Skill::Pairs)],
        );
        assert_eq!(m.coverage(), 0.5);
        // Of the two firings, the move exercised pairs once, and obeyed.
        assert_eq!((m.acting, m.acting_hits), (1, 1));
        let (p, lo, hi) = m.precision();
        assert_eq!(p, 0.5);
        assert!(lo < 0.5 && 0.5 < hi);
        assert!(!m.ships());
    }

    #[test]
    fn a_clustered_interval_is_wider_when_games_differ_and_plain_when_alike() {
        // Ten games alike, 9 of 10 each: no more spread than chance allows
        // (every game exactly p), so the effective sample is the whole.
        let alike = vec![(10, 9); 10];
        let c = clustered(&alike);
        assert!((c.p - 0.9).abs() < 1e-12 && c.n_eff == 100.0);
        let (lo, hi) = wilson(90, 100);
        assert!((c.lo - lo).abs() < 1e-9 && (c.hi - hi).abs() < 1e-9);
        // Same 90 of 100, but the games are all or nothing: nine perfect,
        // one empty. The hits cluster, so the effective sample is small.
        let mut split = vec![(10, 10); 9];
        split.push((10, 0));
        let w = clustered(&split);
        assert!((w.p - 0.9).abs() < 1e-12);
        // p = .9; deviations: nine of 10 - 9 = 1, one of 0 - 9 = -9:
        // sum sq = 9 + 81 = 90; var = 10/9 * 90 / 100^2 = 0.01;
        // n_eff = .09 / .01 = 9.
        assert!((w.n_eff - 9.0).abs() < 1e-9, "{}", w.n_eff);
        let (lo, hi) = wilson_f(8.1, 9.0);
        assert!((w.lo - lo).abs() < 1e-9 && (w.hi - hi).abs() < 1e-9);
        assert!(w.lo < 0.6 && c.lo > 0.8);
        // A single game, or none, falls back to its own count.
        assert_eq!(clustered(&[(10, 5)]).n_eff, 10.0);
        assert_eq!(clustered(&[]).lo, 0.0);
        assert_eq!(clustered(&[(0, 0), (0, 0)]).hi, 1.0);
    }

    #[test]
    fn the_sum_and_pair_rules_say_what_their_texts_say() {
        // 3 and 4 make a 7; the 7 also pairs nothing. S1 fires and a pair
        // (taking the 7 alone) does not obey it.
        let v = classic("3H 4D 7C", "7S");
        assert!(fires("S1", &v));
        assert!(says("S1", &v, "take 7S 3H 4D"));
        assert!(!says("S1", &v, "take 7S 7C"));
        // A pair alone is no sum: S1 is silent, P1 speaks.
        let v = classic("4H 9C", "4S KD");
        assert!(!fires("S1", &v));
        assert!(fires("P1", &v));
        // Taking a sum is not taking the pair.
        let v = classic("3H 4D 7C", "7S");
        assert!(fires("P1", &v));
        assert!(says("P1", &v, "take 7S 7C"));
        assert!(!says("P1", &v, "take 7S 3H 4D"));
        // P2: a spade pair only counts when a prize is paired.
        let v = classic("2S 3H 4D 5C", "2D");
        assert!(says("P2", &v, "take 2D 2S"));
    }

    #[test]
    fn a_safe_build_rule_is_measured_only_where_the_rung_built() {
        let v = view(Rules::CLASSIC, "5C 3H", "2D 7S 8C 5D", "7H 7D 7C");
        let sb1 = rule("SB1");
        let mut m = Measure::default();
        m.record(sb1, &v, &mv("trail 2D"), &[]);
        assert_eq!((m.triggered, m.hits), (0, 0));
        m.record(sb1, &v, &mv("build 8 5D 3H"), &[]);
        m.record(sb1, &v, &mv("build 7 2D 5C"), &[]);
        assert_eq!((m.triggered, m.hits), (2, 1));
    }

    #[test]
    fn pairs() {
        let v = classic("4H 9C", "4S KD");
        assert!(fires("P1", &v));
        assert!(!fires("P1", &classic("4H 9C", "5S KD")));
        // A sum is not a pair.
        assert!(!fires("P1", &classic("3H 4D", "7S")));
        assert!(says("P1", &v, "take 4S 4H"));
        assert!(!says("P1", &v, "trail KD"));
        // Only a pair with an ace, a Cassino or a spade fires the second.
        assert!(fires("P2", &classic("AH 9C", "AD 5C")));
        assert!(fires("P2", &classic("4S 9C", "4H")));
        assert!(!fires("P2", &classic("4H 9C", "4D")));
        assert!(says("P2", &classic("AH 9C", "AD 5C"), "take AD AH"));
    }

    #[test]
    fn sums() {
        let v = classic("3H 4D KC", "7S 2C");
        assert!(fires("S1", &v));
        assert!(!fires("S1", &classic("3H 9D", "7S")));
        assert!(says("S1", &v, "take 7S 3H 4D"));
        assert!(!says("S1", &v, "trail 2C"));
        // The most cards: 7S can take the 7 alone, the pair of cards, or all.
        let v = classic("3H 4D 7C", "7S");
        assert!(fires("S2", &v));
        assert!(!fires("S2", &classic("7C", "7S")));
        assert!(says("S2", &v, "take 7S 3H 4D 7C"));
        assert!(!says("S2", &v, "take 7S 7C"));
        // Three cards or more.
        let v = classic("2H 3D 4C", "9S");
        assert!(fires("S3", &v));
        assert!(!fires("S3", &classic("4H 5D", "9S")));
        assert!(says("S3", &v, "take 9S 2H 3D 4C"));
    }

    #[test]
    fn building() {
        let v = classic("5C", "3D 8S 8H");
        assert!(fires("B1", &v));
        assert!(!fires("B1", &classic("5C", "3D 8S KC")));
        assert!(says("B1", &v, "build 8 3D 5C"));
        assert!(!says("B1", &v, "trail 3D"));
        // Few of the value unseen: the other three 8s, two of them played.
        let few = view(Rules::CLASSIC, "5C", "3D 8S", "8D 8C");
        assert!(fires("B2", &few));
        assert!(!fires("B2", &classic("5C", "3D 8S")));
        assert!(says("B2", &few, "build 8 3D 5C"));
        // Nothing to take, a build open.
        assert!(fires("B3", &classic("5C", "3D 8S")));
        assert!(!fires("B3", &classic("5C", "5D 3H")));
        assert!(says("B3", &classic("5C", "3D 8S"), "build 8 3D 5C"));
        assert!(!says("B3", &classic("5C", "3D 8S"), "trail 3D"));
    }

    #[test]
    fn safe_builds() {
        // Builds of 7 (no 7 unseen), 8 (three unseen) and 5 (two unseen).
        let v = view(Rules::CLASSIC, "5C 3H", "2D 7S 8C 5D", "7H 7D 7C");
        assert!(fires("SB1", &v));
        assert!(says("SB1", &v, "build 7 2D 5C"));
        assert!(!says("SB1", &v, "build 8 5D 3H"));
        assert!(fires("SB2", &v));
        assert!(says("SB2", &v, "build 7 2D 5C"));
        assert!(!says("SB2", &v, "build 8 5D 3H"));
        assert!(!says("SB2", &v, "trail 2D"));
        // One build only: no choice to make.
        assert!(!fires("SB2", &classic("5C", "3D 8S")));
        // A value held twice.
        let v = classic("5C", "3D 8S 8H");
        assert!(fires("SB3", &v));
        assert!(says("SB3", &v, "build 8 3D 5C"));
        assert!(!fires("SB3", &classic("5C", "3D 8S")));
    }

    #[test]
    fn answering_builds() {
        let v = classic("[7: 4S 3H] 9C", "7D 2C");
        assert!(fires("A1", &v));
        assert!(says("A1", &v, "take 7D 4S 3H"));
        assert!(!says("A1", &v, "trail 2C"));
        // Their build taken is theirs to answer; one of mine is not.
        assert!(!fires("A1", &classic("[7 @S: 4S 3H] 9C", "7D 2C")));
        // Three cards or more.
        assert!(fires("A2", &classic("[7: 4S 2H AC] 9C", "7D")));
        assert!(!fires("A2", &v));
        // Cannot take it, can raise it: 4 and a 2 make 6, and a 6 is held.
        let v = classic("[4: 3S AH] 9C", "2D 6S");
        assert!(fires("A3", &v));
        assert!(says("A3", &v, "build 6 2D on 3S"));
        assert!(!says("A3", &v, "trail 2D"));
        assert!(!fires("A3", &classic("[4: 3S AH] 9C", "4D 6S")));
    }

    #[test]
    fn no_sweep() {
        // Trailing the 2 leaves 4, 3, 2: a 9 sweeps. The 5 leaves 12.
        let v = classic("4H 3D", "2C 5S");
        assert!(fires("N1", &v));
        assert!(says("N1", &v, "trail 5S"));
        assert!(!says("N1", &v, "trail 2C"));
        assert!(!fires("N1", &classic("4H 3D", "KC QC")));
        // Four 9s unseen is a real risk; with them played, none.
        assert!(fires("N2", &v));
        let gone = view(Rules::CLASSIC, "4H 3D", "2C 5S", "9S 9H 9D 9C");
        assert!(!fires("N1", &gone));
        assert!(!fires("N2", &gone));
        assert!(says("N2", &v, "trail 5S"));
        // Sweeps scored or not, the table handed over is the danger.
        let mut no = Rules::CLASSIC;
        no.sweeps = false;
        let v = view(no, "4H 3D", "2C 5S", "");
        assert!(fires("N1", &v));
        assert!(says("N1", &v, "trail 5S"));
        assert!(!says("N1", &v, "trail 2C"));
    }

    #[test]
    fn valuables() {
        assert!(fires("V1", &classic("6H", "AS 7D")));
        assert!(!fires("V1", &classic("6H", "AS")));
        assert!(!fires("V1", &classic("6H", "7C 7D")));
        assert!(says("V1", &classic("6H", "AS 7D"), "trail 7D"));
        assert!(!says("V1", &classic("6H", "AS 7D"), "trail AS"));
        assert!(says("V1", &classic("AH", "AS 7D"), "take AS AH"));
        // Taking one.
        let v = classic("2S 9C", "2D");
        assert!(fires("V2", &v));
        assert!(!fires("V2", &classic("4H 9C", "4D")));
        assert!(says("V2", &v, "take 2D 2S"));
        assert!(!says("V2", &classic("2S 4H", "2D 4D"), "take 4D 4H"));
        // Aces alone.
        assert!(fires("V3", &classic("6H", "AS 7D")));
        assert!(!fires("V3", &classic("6H", "2S 7D")));
        assert!(!says("V3", &classic("6H", "AS 7D"), "trail AS"));
        // An ace in a build is not an ace taking something.
        let v = classic("5C", "AS 6D");
        assert!(!says("V3", &v, "build 6 AS 5C"));
        let v = classic("5C 6H", "AS 7D");
        assert!(says("V3", &v, "take 7D 6H AS"));
    }

    #[test]
    fn trailing() {
        // 9 on the table: neither the 2 (11) nor the 8 (17) adds up with it.
        let v = classic("9H", "2C 8D");
        assert!(fires("T1", &v));
        assert!(says("T1", &v, "trail 2C"));
        let v = classic("2H 3D", "4C 3S");
        assert!(!fires("T1", &v));
        // Lowest card that is no ace or Cassino.
        let v = classic("6H", "3C 9D AS");
        assert!(fires("T2", &v));
        assert!(says("T2", &v, "trail 3C"));
        assert!(!says("T2", &v, "trail 9D"));
        assert!(!fires("T2", &classic("6H", "3C")));
        // A card whose rank is nearly all played.
        let v = view(Rules::CLASSIC, "2H", "6S 9D", "6H 6D 6C");
        assert!(fires("T3", &v));
        assert!(says("T3", &v, "trail 6S"));
        assert!(!says("T3", &v, "trail 9D"));
        assert!(!fires("T3", &classic("2H", "6S 9D")));
    }

    #[test]
    fn what_matters_for_each_skill() {
        let v = classic("[7: 4S 3H] 9C 4D", "7D 4C 2S");
        // Pairs: a capture of one loose card of the card's rank.
        assert!(exercises(Skill::Pairs, &v, &mv("take 4C 4D")));
        assert!(!exercises(Skill::Pairs, &v, &mv("take 7D 4S 3H")));
        // Sums: a capture of two or more loose cards.
        let w = classic("3H 4D 7C", "7S");
        assert!(exercises(Skill::Sums, &w, &mv("take 7S 3H 4D")));
        assert!(!exercises(Skill::Sums, &w, &mv("take 7S 7C")));
        // Building and safe builds: a build; answering: their build.
        let b = classic("5C", "3D 8S");
        assert!(exercises(Skill::Building, &b, &mv("build 8 3D 5C")));
        assert!(exercises(Skill::SafeBuilds, &b, &mv("build 8 3D 5C")));
        assert!(!exercises(Skill::Building, &b, &mv("trail 3D")));
        assert!(exercises(Skill::AnsweringBuilds, &v, &mv("take 7D 4S 3H")));
        assert!(!exercises(Skill::AnsweringBuilds, &v, &mv("take 4C 4D")));
        // Trailing is a trail.
        assert!(exercises(Skill::Trailing, &b, &mv("trail 3D")));
        assert!(!exercises(Skill::Trailing, &b, &mv("build 8 3D 5C")));
        // Restraint: exercised when the error was on offer.
        let n = classic("4H 3D", "2C 5S");
        assert!(exercises(Skill::NoSweep, &n, &mv("trail 5S")));
        assert!(!exercises(
            Skill::NoSweep,
            &classic("4H 3D", "KC QC"),
            &mv("trail KC")
        ));
        assert!(exercises(
            Skill::Valuables,
            &classic("6H", "AS 7D"),
            &mv("trail 7D")
        ));
        assert!(!exercises(
            Skill::Valuables,
            &classic("6H", "5S 7D"),
            &mv("trail 7D")
        ));
        // A skill matters where the advisor found a clear chance at it.
        let c = Chance {
            skill: Skill::Pairs,
            met: false,
            gap: 1.0,
        };
        assert!(matters(Skill::Pairs, &[c]));
        assert!(!matters(Skill::Sums, &[c]));
        assert!(!matters(Skill::Pairs, &[]));
    }
}
