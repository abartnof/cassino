//! Measures the tutor's candidate rules (`lessons.rs`, `docs/DESIGN.md`
//! §12.8): the strongest rung (skill 4) plays the person's seat against skill
//! 3, and each decision it makes, the position and its move, is held against
//! every candidate rule. A rule's precision is how often the rung did as the
//! rule says when its trigger fired, with the Wilson 95% interval; its
//! coverage, how often the trigger fired where the skill mattered. A rule
//! ships only when the interval's lower bound reaches 0.80, and the winner
//! among the candidates is confirmed on fresh positions (`--confirm`).
//!
//! ```text
//! rules [GAMES] [--rules classic|royal] [--seed S] [--confirm]
//! ```
//!
//! A fixed count, descriptive and not sequential (`docs/DESIGN.md` §11.4).
//! Games are seeded `S .. S + GAMES`; selection starts at [`SELECT_SEED`] and
//! `--confirm` at [`CONFIRM_SEED`], which no selection run reaches, unless
//! `--seed` says otherwise. Decisions within a game are not independent, so
//! the intervals are a little narrower than the truth.

use std::time::Instant;

use cassino_core::agents::Agent;
use cassino_core::lessons::{Measure, CANDIDATES, SHIP_BOUND};
use cassino_core::opponent::Skill;
use cassino_core::rules::Rules;
use cassino_core::session::{Prompt, Session, Settings};

/// The first seed of a selection run, and of a confirmation run.
const SELECT_SEED: u64 = 1_000;
const CONFIRM_SEED: u64 = 5_000_000;

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let usage = "rules [GAMES] [--rules classic|royal] [--seed S] [--confirm]";
    let mut games: u64 = 20;
    let mut which = vec![("Classic", Rules::CLASSIC), ("Royal", Rules::ROYAL)];
    let mut seed: Option<u64> = None;
    let mut confirm = false;
    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--rules" => {
                i += 1;
                which = match args.get(i).map(String::as_str) {
                    Some("classic") => vec![("Classic", Rules::CLASSIC)],
                    Some("royal") => vec![("Royal", Rules::ROYAL)],
                    _ => panic!("{usage}"),
                };
            }
            "--seed" => {
                i += 1;
                seed = Some(
                    args.get(i)
                        .and_then(|s| s.parse().ok())
                        .unwrap_or_else(|| panic!("{usage}")),
                );
            }
            "--confirm" => confirm = true,
            a => games = a.parse().unwrap_or_else(|_| panic!("{usage}")),
        }
        i += 1;
    }
    let first = seed.unwrap_or(if confirm { CONFIRM_SEED } else { SELECT_SEED });
    println!(
        "Plan: {} games of the strongest rung (skill 4.0, in the person's seat) against skill 3.0, \
         seeds {first}..{}, for each of {:?}; {} candidate rules, each held against every decision. \
         Fixed count, descriptive; {}. A rule ships if its precision's 95% Wilson lower bound is at \
         least {SHIP_BOUND}.",
        games,
        first + games,
        which.iter().map(|w| w.0).collect::<Vec<_>>(),
        CANDIDATES.len(),
        if confirm {
            "fresh positions: this confirms the winner of a selection run"
        } else {
            "selection run: the best here must be confirmed on fresh seeds"
        },
    );
    for (name, rules) in which {
        let started = Instant::now();
        let mut measures = vec![Measure::default(); CANDIDATES.len()];
        let mut decisions = 0u64;
        for seed in first..first + games {
            let mut s = Session::new(seed, Settings { rules, skill: 3.0 });
            let mut me = Skill(4.0).opponent(seed ^ 0x5eed);
            loop {
                match s.prompt() {
                    Prompt::Over => break,
                    Prompt::NextHand => assert!(s.send("next")),
                    Prompt::Play => {
                        let view = s.view();
                        let mv = me.choose(&view);
                        decisions += 1;
                        for (m, rule) in measures.iter_mut().zip(CANDIDATES.iter()) {
                            m.record(rule, &view, &mv);
                        }
                        assert!(s.send(&mv.to_string()));
                    }
                }
            }
        }
        let secs = started.elapsed().as_secs_f64();
        println!(
            "\n{name}: {games} games, {decisions} decisions, {secs:.1} s ({:.2} s a game)",
            secs / games as f64
        );
        println!(
            "{:<4} {:<18} {:>6} {:>6}  {:>6} {:>13}  {:>6}  {:>13}  ships",
            "id", "skill", "fired", "hits", "prec", "95% interval", "cover", "prec if acting"
        );
        for (m, rule) in measures.iter().zip(CANDIDATES.iter()) {
            let (p, lo, hi) = m.precision();
            let (ap, alo, ahi) = m.acting_precision();
            println!(
                "{:<4} {:<18} {:>6} {:>6}  {:>6.3} {:>6.3}-{:<6.3}  {:>6.3}  {:>6.3} ({:.2}-{:.2}) n={}  {}",
                rule.id,
                format!("{:?}", rule.skill),
                m.triggered,
                m.hits,
                p,
                lo,
                hi,
                m.coverage(),
                ap,
                alo,
                ahi,
                m.acting,
                if m.ships() { "yes" } else { "no" },
            );
        }
        println!("Texts:");
        for rule in &CANDIDATES {
            println!("  {:<4} {}", rule.id, rule.text);
        }
    }
}
