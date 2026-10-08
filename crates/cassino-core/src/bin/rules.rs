//! Measures the tutor's candidate rules (`lessons.rs`, `docs/DESIGN.md`
//! §12.8): the strongest rung (skill 4) plays the person's seat against skill
//! 3, and each decision it makes, the position and its move, is held against
//! every candidate rule. A rule's precision is how often the rung did as the
//! rule says when its trigger fired, with a 95% interval clustered by game
//! (decisions within a game are correlated: `lessons::clustered`). Its
//! coverage is how often the trigger fired in decisions holding a clear
//! chance at the skill (`tutor::chances` with `tutor::margin`). The
//! safe-build rules are measured only where the rung built. A rule ships only
//! when the interval's lower bound reaches 0.80; the chosen rules are then
//! confirmed on fresh seeds with `--confirm --only ID[,ID...]`, which
//! measures only those rules and prints "confirmed" or "not confirmed".
//!
//! ```text
//! rules [GAMES] [--rules classic|royal] [--sweeps] [--aces14] [--no-raise] [--seed S] [--confirm] [--only ID,ID]
//! ```
//!
//! The game's default rules: sweeps not scored (`--sweeps` scores them),
//! "Aces count 1 or 14" off (`--aces14` turns it on; Royal only), builds
//! raised (`--no-raise` turns raising off). A fixed count, descriptive and
//! not sequential (`docs/DESIGN.md` §11.4). Games are seeded `S .. S +
//! GAMES`; selection starts at [`SELECT_SEED`] and `--confirm` at
//! [`CONFIRM_SEED`], which no selection run reaches, unless `--seed` says
//! otherwise.

use std::time::Instant;

use cassino_core::agents::Agent;
use cassino_core::lessons::{Measure, Rule, CANDIDATES, SHIP_BOUND};
use cassino_core::opponent::Skill;
use cassino_core::rules::Rules;
use cassino_core::session::{Prompt, Session, Settings};
use cassino_core::tutor;

/// The first seed of a selection run, and of a confirmation run.
const SELECT_SEED: u64 = 1_000;
const CONFIRM_SEED: u64 = 5_000_000;

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let usage =
        "rules [GAMES] [--rules classic|royal] [--sweeps] [--aces14] [--no-raise] [--seed S] [--confirm] [--only ID,ID]";
    let mut games: u64 = 20;
    let mut which = vec![("Classic", Rules::CLASSIC), ("Royal", Rules::ROYAL)];
    let mut sweeps = false;
    let mut aces14 = false;
    let mut raising = true;
    let mut only: Option<Vec<String>> = None;
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
            "--sweeps" => sweeps = true,
            "--aces14" => aces14 = true,
            "--no-raise" => raising = false,
            "--only" => {
                i += 1;
                only = Some(
                    args.get(i)
                        .unwrap_or_else(|| panic!("{usage}"))
                        .split(',')
                        .map(str::to_string)
                        .collect(),
                );
            }
            a => games = a.parse().unwrap_or_else(|_| panic!("{usage}")),
        }
        i += 1;
    }
    if let Some(ids) = &only {
        for id in ids {
            assert!(
                CANDIDATES.iter().any(|r| r.id == id),
                "no rule {id}; {usage}"
            );
        }
    }
    let candidates: Vec<&Rule> = CANDIDATES
        .iter()
        .filter(|r| {
            only.as_ref()
                .is_none_or(|ids| ids.iter().any(|i| i == r.id))
        })
        .collect();
    let first = seed.unwrap_or(if confirm { CONFIRM_SEED } else { SELECT_SEED });
    println!(
        "Plan: {} games of the strongest rung (skill 4.0, in the person's seat) against skill 3.0, \
         seeds {first}..{}, for each of {:?} (sweeps {}, aces at 14 {}, raising {}); {} candidate rules, each held against every \
         decision. Fixed count, descriptive; {}. A rule ships if its game-clustered precision's 95% \
         lower bound is at least {SHIP_BOUND}.",
        games,
        first + games,
        which.iter().map(|w| w.0).collect::<Vec<_>>(),
        if sweeps { "scored" } else { "not scored" },
        if aces14 { "on (Royal only)" } else { "off" },
        if raising { "on" } else { "off" },
        candidates.len(),
        if confirm {
            "fresh seeds: this confirms rules chosen in a selection run"
        } else {
            "selection run: the best here must be confirmed on fresh seeds"
        },
    );
    for (name, mut rules) in which {
        rules.sweeps = sweeps;
        rules.aces_fourteen = aces14 && rules.game == cassino_core::rules::Game::Royal;
        rules.raising = raising;
        let started = Instant::now();
        let mut measures = vec![Measure::default(); candidates.len()];
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
                        let chances = tutor::chances(&view, &mv, tutor::margin(&view));
                        for (m, rule) in measures.iter_mut().zip(&candidates) {
                            m.record(rule, &view, &mv, &chances);
                        }
                        assert!(s.send(&mv.to_string()));
                    }
                }
            }
            for m in &mut measures {
                m.end_game();
            }
        }
        let secs = started.elapsed().as_secs_f64();
        println!(
            "\n{name}: {games} games, {decisions} decisions, {secs:.1} s ({:.2} s a game)",
            secs / games as f64
        );
        println!(
            "{:<4} {:<18} {:>6} {:>6}  {:>6} {:>13} {:>6}  {:>6}  {:>13}  verdict",
            "id",
            "skill",
            "fired",
            "hits",
            "prec",
            "clustered 95%",
            "n_eff",
            "cover",
            "prec if acting"
        );
        for (m, rule) in measures.iter().zip(&candidates) {
            let c = m.clustered();
            let (ap, alo, ahi) = m.acting_precision();
            println!(
                "{:<4} {:<18} {:>6} {:>6}  {:>6.3} {:>6.3}-{:<6.3} {:>6.0}  {:>6.3}  {:>6.3} ({:.2}-{:.2}) n={}  {}",
                rule.id,
                format!("{:?}", rule.skill),
                m.triggered,
                m.hits,
                c.p,
                c.lo,
                c.hi,
                c.n_eff,
                m.coverage(),
                ap,
                alo,
                ahi,
                m.acting,
                match (confirm, m.ships()) {
                    (true, true) => "confirmed",
                    (true, false) => "not confirmed",
                    (false, true) => "ships",
                    (false, false) => "no",
                },
            );
        }
        println!("Texts:");
        for rule in &candidates {
            println!("  {:<4} {}", rule.id, rule.text);
        }
    }
}
