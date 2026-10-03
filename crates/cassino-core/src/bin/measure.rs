//! Measures one opponent level against another: mirrored pairs, run
//! sequentially with O'Brien–Fleming looks (`docs/DESIGN.md` §11.4).
//!
//! ```text
//! measure A B [--rules classic|royal|royal14] [--unit hand|game]
//!             [--batch N] [--looks K] [--seed S] [--out FILE.tsv]
//! ```
//!
//! The plan (batch and looks) is printed before the first batch, and the
//! run stops as soon as the boundary is crossed. With `--unit hand` each
//! observation is A's points less B's over one mirrored pair of hands; with
//! `--unit game`, +1 for each of the pair's two games A wins and −1 for each
//! it loses.

use std::fs::File;
use std::io::Write;
use std::time::Instant;

use cassino_core::agents::{self, Agent};
use cassino_core::rules::{Game, Rules};
use cassino_core::table::Seat;
use cassino_core::tournament::{
    agent_rng, mirrored_game, mirrored_hand, run_sequential, Plan, Verdict,
};

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let usage = "measure A B [--rules classic|royal|royal14] [--unit hand|game] [--batch N] [--looks K] [--seed S] [--out FILE]";
    let level = |s: Option<&String>| -> u8 {
        s.and_then(|v| v.parse().ok())
            .filter(|l| (1..=agents::TOP).contains(l))
            .unwrap_or_else(|| panic!("{usage}: levels are 1 to {}", agents::TOP))
    };
    let (a, b) = (level(args.first()), level(args.get(1)));
    let mut rules = Rules::CLASSIC;
    let mut games = false;
    let mut plan = Plan {
        batch: 100,
        looks: 4,
    };
    let mut first_seed = 1_000_000u64;
    let mut out: Option<File> = None;
    let mut i = 2;
    while i < args.len() {
        let value = args.get(i + 1).cloned().unwrap_or_default();
        match args[i].as_str() {
            "--rules" => {
                rules = match value.as_str() {
                    "classic" => Rules::CLASSIC,
                    "royal" => Rules::ROYAL,
                    "royal14" => Rules {
                        game: Game::Royal,
                        aces_fourteen: true,
                        sweeps: true,
                    },
                    _ => panic!("{usage}"),
                }
            }
            "--unit" => games = value == "game",
            "--batch" => plan.batch = value.parse().expect("--batch N"),
            "--looks" => plan.looks = value.parse().expect("--looks K"),
            "--seed" => first_seed = value.parse().expect("--seed S"),
            "--out" => out = Some(File::create(&value).expect("--out FILE")),
            other => panic!("unknown {other}; {usage}"),
        }
        i += 2;
    }
    let factory = |level: u8| {
        move |seed: u64, seat: Seat| -> Box<dyn Agent> {
            agents::by_level(level, agent_rng(seed, seat))
        }
    };
    let (fa, fb) = (factory(a), factory(b));
    let unit = if games {
        "games won less lost per pair"
    } else {
        "points per pair of hands"
    };
    println!(
        "level {a} ({}) against level {b} ({}), {:?}: {unit}",
        agents::describe(a),
        agents::describe(b),
        rules
    );
    println!(
        "plan: batches of {}, at most {} looks, boundaries {:?}, first seed {first_seed}",
        plan.batch,
        plan.looks,
        plan.boundaries()
            .iter()
            .map(|z| (z * 100.0).round() / 100.0)
            .collect::<Vec<_>>()
    );
    let started = Instant::now();
    let report = run_sequential(
        plan,
        |i| {
            let seed = first_seed + i as u64;
            let v = if games {
                mirrored_game(rules, seed, &fa, &fb)
            } else {
                mirrored_hand(rules, seed, &fa, &fb)
            };
            if let Some(f) = out.as_mut() {
                writeln!(f, "{seed}\t{v}").expect("write");
            }
            f64::from(v)
        },
        |look| {
            println!(
                "look {}: {} pairs, {:+.3} ± {:.3} (z {:+.2}, boundary ±{:.2}), {:.1}s",
                look.look,
                look.n,
                look.mean,
                look.se,
                look.z,
                look.boundary,
                started.elapsed().as_secs_f64()
            );
        },
    );
    match report.verdict {
        Verdict::Clear { look, n, mean, se } => println!(
            "CLEAR at look {look} ({n} pairs): level {a} {} level {b} by {:.3} ± {:.3}",
            if mean > 0.0 { "beats" } else { "loses to" },
            mean.abs(),
            se
        ),
        Verdict::NoClearDifference { n, mean, low, high } => println!(
            "NO CLEAR DIFFERENCE after {n} pairs: {mean:+.3}, 95% interval {low:+.3} to {high:+.3}"
        ),
    }
}
