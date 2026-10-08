//! The advisor's noise, for setting the margin of a clear chance
//! (`docs/DESIGN.md` §12.8, measurement 1). Descriptive, a fixed count, no
//! looks.
//!
//! Positions come from the strongest rung's own games (it in the person's
//! seat against the counter), every fifth eligible decision, skipping the
//! last deal (exact there) and decisions with fewer than two candidates.
//! For each position and each skill whose gap is defined there
//! ([`tutor::gap`]: the best move showing the skill less the best that
//! does not), the gap is re-evaluated by the advisor under independent
//! seeds on the same move list, and the standard deviation across seeds
//! is the noise of that gap. Reported per skill, and overall: the number
//! of positions, and the median, 90th and 95th percentile of that
//! standard deviation, in points.
//!
//! ```text
//! noise [POSITIONS] [SEEDS] [--rules classic|royal]
//! ```

use std::time::Instant;

use cassino_core::advice::advisor_seed;
use cassino_core::agents::Agent;
use cassino_core::observation::View;
use cassino_core::opponent::Skill as Rung;
use cassino_core::rng::Rng;
use cassino_core::rules::Rules;
use cassino_core::search::SearchAgent;
use cassino_core::session::{Prompt, Session, Settings};
use cassino_core::tutor::{self, Skill};

/// The sample standard deviation.
fn sd(xs: &[f64]) -> f64 {
    let n = xs.len() as f64;
    let mean = xs.iter().sum::<f64>() / n;
    (xs.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1.0)).sqrt()
}

/// The `p`th percentile (0 to 1) of sorted `xs`, by the nearest rank.
fn percentile(xs: &[f64], p: f64) -> f64 {
    let i = ((p * xs.len() as f64).ceil() as usize).clamp(1, xs.len()) - 1;
    xs[i]
}

/// The person's decisions in one game of the strongest rung.
fn decisions(rules: Rules, seed: u64) -> Vec<View> {
    let mut s = Session::new(seed, Settings { rules, skill: 3.0 });
    let mut me = Rung(4.0).opponent(seed ^ 0x5eed);
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
    s.turns().iter().map(|t| t.view).collect()
}

fn main() {
    let mut numbers = Vec::new();
    let mut rules = Rules::CLASSIC;
    let mut args = std::env::args().skip(1);
    while let Some(a) = args.next() {
        if a == "--rules" {
            rules = match args.next().as_deref() {
                Some("classic") => Rules::CLASSIC,
                Some("royal") => Rules::ROYAL,
                other => panic!("--rules classic|royal, not {other:?}"),
            };
        } else {
            numbers.push(a.parse::<usize>().expect("a number"));
        }
    }
    let positions = numbers.first().copied().unwrap_or(50);
    let seeds = numbers.get(1).copied().unwrap_or(6);
    assert!(seeds >= 2, "at least two seeds");
    println!(
        "Plan: {positions} positions (every fifth eligible decision of the strongest rung's \
         games, {:?}), each skill's gap re-evaluated under {seeds} advisor seeds; \
         descriptive, no looks.",
        rules.game
    );
    let started = Instant::now();
    let mut found: Vec<View> = Vec::new();
    let mut eligible = 0;
    let mut game = 1_000;
    while found.len() < positions {
        for v in decisions(rules, game) {
            if v.perfect_information() || v.candidates().len() < 2 {
                continue;
            }
            eligible += 1;
            if eligible % 5 == 0 && found.len() < positions {
                found.push(v);
            }
        }
        game += 1;
    }
    println!(
        "{} positions from {} games in {:.1} s",
        found.len(),
        game - 1_000,
        started.elapsed().as_secs_f64()
    );
    let started = Instant::now();
    let mut sds: Vec<(Skill, f64)> = Vec::new();
    for v in &found {
        let moves = SearchAgent::new(Rng::seeded(advisor_seed(v))).shortlist(v);
        let mut gaps: Vec<Vec<f64>> = vec![Vec::new(); Skill::ALL.len()];
        for k in 0..seeds {
            let mut advisor = SearchAgent::new(Rng::seeded(0x6e01_5e00 + k as u64));
            let values = advisor.evaluate(v, &moves);
            for (i, skill) in Skill::ALL.into_iter().enumerate() {
                if let Some(g) = tutor::gap(skill, v, &values) {
                    gaps[i].push(g);
                }
            }
        }
        for (i, skill) in Skill::ALL.into_iter().enumerate() {
            if gaps[i].len() == seeds {
                sds.push((skill, sd(&gaps[i])));
            }
        }
    }
    let secs = started.elapsed().as_secs_f64();
    println!(
        "advisor re-evaluations: {secs:.1} s, {:.2} s a position",
        secs / found.len() as f64
    );
    println!("standard deviation of the gap across seeds, in points:");
    let report = |name: &str, mut xs: Vec<f64>| {
        if xs.is_empty() {
            println!("  {name:<16} no positions");
            return;
        }
        xs.sort_by(f64::total_cmp);
        println!(
            "  {name:<16} n {:>4}  median {:.3}  p90 {:.3}  p95 {:.3}",
            xs.len(),
            percentile(&xs, 0.5),
            percentile(&xs, 0.9),
            percentile(&xs, 0.95)
        );
    };
    for skill in Skill::ALL {
        report(
            &format!("{skill:?}"),
            sds.iter().filter(|s| s.0 == skill).map(|s| s.1).collect(),
        );
    }
    report("all", sds.iter().map(|s| s.1).collect());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn standard_deviation_is_the_sample_one() {
        assert!((sd(&[1.0, 3.0]) - 2.0_f64.sqrt()).abs() < 1e-12);
        assert_eq!(sd(&[2.0, 2.0, 2.0]), 0.0);
    }

    #[test]
    fn percentiles_by_nearest_rank() {
        let xs: Vec<f64> = (1..=20).map(f64::from).collect();
        assert_eq!(percentile(&xs, 0.5), 10.0);
        assert_eq!(percentile(&xs, 0.9), 18.0);
        assert_eq!(percentile(&xs, 0.95), 19.0);
        assert_eq!(percentile(&xs, 1.0), 20.0);
        assert_eq!(percentile(&[7.0], 0.5), 7.0);
    }
}
