//! The searcher with skills knocked out (`docs/DESIGN.md` §12.8): the
//! strongest rung that cannot, or does not see why it should, use some of
//! the skills a player learns. Measured against the whole searcher, the
//! points it loses are what the skills are worth (`measurements/README.md`).
//!
//! A [`Knockout`] is the searcher in every decision except where a knocked
//! skill bears. There are two kinds.
//!
//! **Skills of action** (Pairs, Sums, Building, AnsweringBuilds) are
//! withheld. When the searcher's choice uses one, the knockout plays the
//! best-valued alternative that uses none, by the searcher's own
//! [`evaluate`](SearchAgent::evaluate): over the searcher's shortlist or,
//! when the shortlist holds none, over the allowed moves banking the most at
//! once (as many as the shortlist is wide). In the last deal the values are
//! exact. When every move uses a withheld skill, the searcher's move is
//! played. What a move uses is [`shows`] (the one classifier of the tutor):
//!
//! - Pairs: a capture that takes a loose card of its own value (a pairing
//!   group; in Classic a court card's only capture).
//! - Sums: a capture that takes a loose card of less than its value (a
//!   summing group). A capture can use both.
//! - Building: a build that is new or added to one's own.
//! - AnsweringBuilds: a capture that takes, or a build that raises, a build
//!   the opponent controls.
//!
//! **Skills of restraint** (NoSweep, Valuables, Trailing, SafeBuilds) cannot
//! be withheld, only not seen: the knockout chooses as a player blind to the
//! danger would. These apply to the move left after the action skills, over
//! the same pool of valued moves:
//!
//! - NoSweep: blind to leaving a table one card clears. If the move chosen
//!   leaves no such table, yet some other move in the pool does, the player
//!   cannot tell them apart by danger, and of the move chosen and those
//!   that leave one, plays the move that banks most at once
//!   ([`immediate_worth`]; ties to the better value). If the move
//!   chosen leaves one the player stays with it: it does not seek the
//!   danger, it is merely not afraid of it.
//! - Valuables: blind to what a trail gives away. When the move chosen is a
//!   trail, trail uniformly at random among that card and the trails of aces
//!   and Cassinos: the choice differs from the searcher's only by possibly
//!   giving away a valuable.
//! - Trailing: blind to which card to trail. When the move chosen is a
//!   trail, trail any legal card, uniformly at random. (With Valuables also
//!   out, this is the whole of it.)
//! - SafeBuilds: blind to whether a build survives. When the move chosen is
//!   a build, play the largest build among the legal ones (most cards,
//!   then the highest value; ties to the first) rather than the one that
//!   best survives to be taken.
//!
//! Every choice is a function of the seed and the views seen, as for the
//! other agents. With no skill knocked out the agent *is* the searcher, move
//! for move.

use crate::agents::{immediate_worth, Agent};
use crate::moves::Move;
use crate::observation::View;
use crate::review::leaves_sweep;
use crate::rng::Rng;
use crate::search::SearchAgent;
use crate::tutor::{shows, valuable, Skill};

/// How big a build is: the cards it holds once made.
fn build_size(view: &View, mv: &Move) -> (u32, u8) {
    match *mv {
        Move::Build {
            value, onto, loose, ..
        } => {
            let target = onto
                .and_then(|o| view.table.build_of(o))
                .map_or(0, |b| b.cards.len());
            (1 + loose.len() + target, value)
        }
        _ => (0, 0),
    }
}

/// The searcher with `knocked` skills out.
pub struct Knockout {
    pub search: SearchAgent,
    knocked: Vec<Skill>,
    /// What the searcher itself chose at the last decision, before any skill
    /// was knocked out of it.
    pub base: Option<Move>,
    rng: Rng,
}

impl Knockout {
    /// `knocked` in any order, without repeats.
    pub fn new(rng: Rng, knocked: &[Skill]) -> Knockout {
        let mut own = rng.clone();
        let own = Rng::seeded(own.next_u64() ^ 0x4b4e_4f43_4b4f_5554);
        let mut knocked: Vec<Skill> = knocked.to_vec();
        knocked.sort();
        knocked.dedup();
        Knockout {
            search: SearchAgent::new(rng),
            knocked,
            base: None,
            rng: own,
        }
    }

    /// Whether `skill` is knocked out.
    pub fn is_out(&self, skill: Skill) -> bool {
        self.knocked.contains(&skill)
    }

    /// Whether `mv` uses a skill of action that is out.
    fn withheld(&self, view: &View, mv: &Move) -> bool {
        shows(view, mv).iter().any(|s| self.is_out(*s))
    }

    /// The best of `moves` by value, the first of equals.
    fn best(valued: &[(Move, f64)]) -> (Move, f64) {
        valued
            .iter()
            .copied()
            .fold(None, |best: Option<(Move, f64)>, (m, v)| match best {
                Some((_, bv)) if bv >= v => best,
                _ => Some((m, v)),
            })
            .expect("a candidate")
    }

    /// The searcher's valued shortlist, and its choice among it. In the
    /// last deal the pool is every candidate, valued exactly, and the choice
    /// is the solver's.
    fn searcher(&mut self, view: &View) -> (Move, Vec<(Move, f64)>) {
        if view.perfect_information() {
            let choice = self.search.choose(view);
            let all = self.search.evaluate(view, &view.candidates());
            return (choice, all);
        }
        let shortlist = self.search.shortlist(view);
        if shortlist.len() == 1 {
            return (shortlist[0], vec![(shortlist[0], 0.0)]);
        }
        let valued = self.search.evaluate(view, &shortlist);
        (Knockout::best(&valued).0, valued)
    }

    /// Whether anything knocked out could bear on a decision at all.
    fn quiet(&self, view: &View, choice: &Move) -> bool {
        if self.withheld(view, choice) {
            return false;
        }
        let restraint = |s: Skill| self.is_out(s);
        let sweep = restraint(Skill::NoSweep);
        let trail = matches!(choice, Move::Trail { .. })
            && (restraint(Skill::Trailing) || restraint(Skill::Valuables));
        let build = matches!(choice, Move::Build { .. }) && restraint(Skill::SafeBuilds);
        !(sweep || trail || build)
    }
}

impl Agent for Knockout {
    fn name(&self) -> String {
        if self.knocked.is_empty() {
            return "searcher".into();
        }
        let slugs: Vec<&str> = self.knocked.iter().map(|s| s.slug()).collect();
        format!("searcher-no-{}", slugs.join("+"))
    }

    fn choose(&mut self, view: &View) -> Move {
        let (choice, mut pool) = self.searcher(view);
        self.base = Some(choice);
        if self.knocked.is_empty() || self.quiet(view, &choice) {
            return choice;
        }
        // The action skills: the best allowed alternative.
        let mut m = choice;
        if self.withheld(view, &choice) {
            pool.retain(|(x, _)| !self.withheld(view, x));
            if pool.is_empty() {
                // Nothing allowed in the pool: the allowed moves that bank
                // most at once, valued by the searcher.
                let mut allowed: Vec<Move> = view
                    .candidates()
                    .into_iter()
                    .filter(|x| !self.withheld(view, x))
                    .collect();
                if allowed.is_empty() {
                    return choice;
                }
                allowed.sort_by(|a, b| {
                    let key = |x: &Move| immediate_worth(&view.rules, &view.table, x).total();
                    key(b).total_cmp(&key(a))
                });
                allowed.truncate(self.search.width);
                pool = self.search.evaluate(view, &allowed);
            }
            m = Knockout::best(&pool).0;
        }
        // Restraint: the danger is not seen.
        if self.is_out(Skill::NoSweep)
            && !leaves_sweep(view, &m)
            && pool.iter().any(|(x, _)| leaves_sweep(view, x))
        {
            let now = |x: &Move| immediate_worth(&view.rules, &view.table, x).total();
            // Only the moves the danger told apart: the one chosen, and
            // those that leave a sweep.
            let chosen = pool.iter().copied().find(|(x, _)| *x == m);
            m = chosen
                .into_iter()
                .chain(pool.iter().copied().filter(|(x, _)| leaves_sweep(view, x)))
                .fold(None, |best: Option<(Move, f64)>, (x, v)| match best {
                    Some((b, bv)) if (now(&b), bv) >= (now(&x), v) => best,
                    _ => Some((x, v)),
                })
                .expect("a candidate")
                .0;
        }
        if matches!(m, Move::Build { .. }) && self.is_out(Skill::SafeBuilds) {
            m = view
                .candidates()
                .into_iter()
                .filter(|x| matches!(x, Move::Build { .. }) && !self.withheld(view, x))
                .fold(m, |best, x| {
                    if build_size(view, &x) > build_size(view, &best) {
                        x
                    } else {
                        best
                    }
                });
        }
        if matches!(m, Move::Trail { .. }) {
            let trails: Vec<Move> = view
                .candidates()
                .into_iter()
                .filter(|x| matches!(x, Move::Trail { .. }))
                .collect();
            let options: Vec<Move> = if self.is_out(Skill::Trailing) {
                trails
            } else if self.is_out(Skill::Valuables) {
                let mut o = vec![m];
                o.extend(trails.into_iter().filter(|x| valuable(x.card()) && *x != m));
                o
            } else {
                vec![m]
            };
            if options.len() > 1 {
                m = options[self.rng.below(options.len() as u64) as usize];
            }
        }
        m
    }
}

/// Reads `<skill>[+<skill>...]` (the slugs of [`Skill::slug`]) as the
/// skills of `searcher-no-<skills>`; `None` for an unknown or repeated name.
pub fn parse_knocked(text: &str) -> Option<Vec<Skill>> {
    let mut out: Vec<Skill> = Vec::new();
    for slug in text.split('+') {
        let skill = Skill::from_slug(slug)?;
        if out.contains(&skill) {
            return None;
        }
        out.push(skill);
    }
    Some(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cards::pack;
    use crate::hand::Hand;
    use crate::rules::Rules;
    use crate::table::Seat;

    #[test]
    fn names_parse_and_read_back_in_one_order() {
        for (text, name) in [
            ("searcher-no-building", "searcher-no-building"),
            ("searcher-no-sums+building", "searcher-no-sums+building"),
            ("searcher-no-building+sums", "searcher-no-sums+building"),
            ("searcher-no-sweeps", "searcher-no-sweeps"),
            ("searcher-no-safe-builds", "searcher-no-safe-builds"),
        ] {
            let a = crate::agents::by_name(text, Rng::seeded(1)).expect(text);
            assert_eq!(a.name(), name);
        }
        for s in Skill::ALL {
            let text = format!("searcher-no-{}", s.slug());
            assert!(crate::agents::by_name(&text, Rng::seeded(1)).is_some());
        }
        for bad in [
            "searcher-no-",
            "searcher-no-nothing",
            "searcher-no-sums+sums",
            "searcher-no-sums+",
            "searcher-sums",
        ] {
            assert!(
                crate::agents::by_name(bad, Rng::seeded(1)).is_none(),
                "{bad}"
            );
        }
    }

    /// Plays `seeds` deals of Classic and Royal with `a` in South's seat and
    /// the other seat played by `b`, calling `look` at every decision of `a`
    /// with the view and the choice.
    fn play(
        rules: Rules,
        seed: u64,
        a: &mut dyn Agent,
        b: &mut dyn Agent,
        mut look: impl FnMut(&View, Move),
    ) {
        let mut deck = pack();
        Rng::seeded(seed).shuffle(&mut deck);
        let (mut h, _) = Hand::deal(rules, Seat::North, deck);
        while let Some(seat) = h.to_move() {
            let v = h.view(seat, [0, 0]);
            let m = if seat == Seat::South {
                let m = a.choose(&v);
                look(&v, m);
                m
            } else {
                b.choose(&v)
            };
            h.play(&m).unwrap();
        }
    }

    fn quick(k: &mut Knockout) {
        k.search.worlds = 4;
        k.search.width = 4;
    }

    #[test]
    fn a_withheld_move_is_never_played_when_another_exists() {
        for skill in [
            Skill::Pairs,
            Skill::Sums,
            Skill::Building,
            Skill::AnsweringBuilds,
        ] {
            let mut seen = 0;
            for (seed, rules) in [(1, Rules::CLASSIC), (2, Rules::ROYAL), (3, Rules::CLASSIC)] {
                let mut k = Knockout::new(Rng::seeded(seed), &[skill]);
                quick(&mut k);
                let mut b = crate::agents::GreedyAgent;
                play(rules, seed, &mut k, &mut b, |v, m| {
                    if shows(v, &m).contains(&skill) {
                        assert!(
                            v.candidates().iter().all(|x| shows(v, x).contains(&skill)),
                            "{skill:?}: played {m}"
                        );
                    }
                    seen += 1;
                });
            }
            assert!(seen > 50);
        }
    }

    #[test]
    fn a_pair_of_skills_out_withholds_both() {
        let both = [Skill::Pairs, Skill::Sums];
        let mut k = Knockout::new(Rng::seeded(4), &both);
        quick(&mut k);
        let mut b = crate::agents::GreedyAgent;
        play(Rules::CLASSIC, 4, &mut k, &mut b, |v, m| {
            let u = shows(v, &m);
            if u.iter().any(|s| both.contains(s)) {
                assert!(v
                    .candidates()
                    .iter()
                    .all(|x| shows(v, x).iter().any(|s| both.contains(s))));
            }
        });
    }

    /// The searcher with the same seed and size, to compare with.
    fn twin(skills: &[Skill], seed: u64) -> (Knockout, Knockout) {
        let mut a = Knockout::new(Rng::seeded(seed), skills);
        let mut b = Knockout::new(Rng::seeded(seed), &[]);
        quick(&mut a);
        quick(&mut b);
        (a, b)
    }

    #[test]
    fn with_nothing_out_it_is_the_searcher() {
        let mut deck = pack();
        Rng::seeded(8).shuffle(&mut deck);
        let (mut h, _) = Hand::deal(Rules::CLASSIC, Seat::North, deck);
        let (mut a, b) = twin(&[], 8);
        let mut plain = SearchAgent::new(Rng::seeded(8));
        plain.worlds = 4;
        plain.width = 4;
        assert_eq!(b.name(), "searcher");
        while let Some(seat) = h.to_move() {
            let v = h.view(seat, [0, 0]);
            let (x, y) = (a.choose(&v), plain.choose(&v));
            assert_eq!(x, y);
            h.play(&x).unwrap();
        }
    }

    #[test]
    fn every_choice_is_a_legal_move_and_repeats_with_the_seed() {
        let all: Vec<Skill> = Skill::ALL.to_vec();
        let run = || {
            let mut k = Knockout::new(Rng::seeded(6), &all);
            quick(&mut k);
            let mut b = crate::agents::GreedyAgent;
            let mut picks = Vec::new();
            play(Rules::ROYAL, 6, &mut k, &mut b, |v, m| {
                assert!(v.candidates().contains(&m));
                picks.push(m);
            });
            picks
        };
        let first = run();
        assert!(first.len() > 20);
        assert_eq!(first, run());
    }

    /// The decisions of the knockout of `skills` that differ from the
    /// searcher's own choice there, as `(searcher's, knockout's, view)`.
    /// The game follows the searcher's moves.
    fn differences(skills: &[Skill], rules: Rules, seed: u64) -> Vec<(Move, Move, View)> {
        let mut deck = pack();
        Rng::seeded(seed).shuffle(&mut deck);
        let (mut h, _) = Hand::deal(rules, Seat::North, deck);
        let (mut a, _) = twin(skills, seed);
        let mut out = Vec::new();
        while let Some(seat) = h.to_move() {
            let v = h.view(seat, [0, 0]);
            let mine = a.choose(&v);
            let theirs = a.base.expect("set at every decision");
            if mine != theirs {
                out.push((theirs, mine, v));
            }
            h.play(&theirs).unwrap();
        }
        out
    }

    #[test]
    fn restraint_knockouts_differ_only_where_they_should() {
        let mut found = [0usize; 4];
        for seed in 1..=6u64 {
            for rules in [Rules::CLASSIC, Rules::ROYAL] {
                let d = differences(&[Skill::Trailing], rules, seed);
                for (s, k, _) in &d {
                    assert!(matches!(s, Move::Trail { .. }) && matches!(k, Move::Trail { .. }));
                }
                found[0] += d.len();
                let d = differences(&[Skill::Valuables], rules, seed);
                for (s, k, _) in &d {
                    assert!(matches!(s, Move::Trail { .. }), "{s} {k}");
                    assert!(matches!(k, Move::Trail { .. }) && valuable(k.card()));
                }
                found[1] += d.len();
                let d = differences(&[Skill::SafeBuilds], rules, seed);
                for (s, k, v) in &d {
                    assert!(matches!(s, Move::Build { .. }) && matches!(k, Move::Build { .. }));
                    assert!(build_size(v, k) >= build_size(v, s));
                }
                found[2] += d.len();
                let d = differences(&[Skill::NoSweep], rules, seed);
                for (s, k, v) in &d {
                    assert!(!leaves_sweep(v, s), "the searcher left a sweep: {s}");
                    assert!(leaves_sweep(v, k), "a safe move for a safe one: {s} {k}");
                }
                found[3] += d.len();
            }
        }
        // Each does bear somewhere in these games.
        assert!(found.iter().all(|&n| n > 0), "{found:?}");
    }
}
