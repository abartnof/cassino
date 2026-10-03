//! `cassino`: play Cassino in the terminal, or watch two computer players.
//!
//! ```text
//! cassino [--royal [--aces-14]] [--sweeps] [--seed N] [--skill 1-TOP]
//!         [--watch [--skills A,B] [--reveal] [--fast]] [--explain] [--no-colour]
//! ```

mod table;

use std::io::{self, IsTerminal};
use std::time::{SystemTime, UNIX_EPOCH};

use cassino_core::agents;
use cassino_core::rules::{Game, Rules};
use table::{Options, Table};

/// The rules unless asked otherwise: Classic, sweeps not scored (as the
/// table's default, docs/RULES.md).
const DEFAULT_RULES: Rules = Rules {
    sweeps: false,
    ..Rules::CLASSIC
};

fn main() {
    let mut options = Options {
        rules: DEFAULT_RULES,
        seed: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_or(1, |d| d.as_secs() % 1_000_000),
        skills: [f64::from(agents::TOP); 2],
        watch: false,
        reveal: false,
        pause: true,
        colour: io::stdout().is_terminal() && std::env::var_os("NO_COLOR").is_none(),
        explain: false,
    };
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        match arg.as_str() {
            rule if rule_flag(&mut options.rules, rule) => {}
            "--seed" => options.seed = number(args.next(), "--seed"),
            "--skill" | "--level" => options.skills[1] = skill(args.next()),
            "--skills" | "--levels" => {
                let text = args.next().unwrap_or_default();
                let Some((a, b)) = text.split_once(',') else {
                    fail("--skills needs two skills, as 1,2.5");
                };
                options.skills = [skill(Some(a.into())), skill(Some(b.into()))];
            }
            "--watch" => options.watch = true,
            "--reveal" => options.reveal = true,
            "--fast" => options.pause = false,
            "--no-colour" | "--no-color" => options.colour = false,
            "--explain" => options.explain = true,
            "-h" | "--help" => {
                help();
                return;
            }
            other => fail(&format!("unknown option {other:?}; try --help")),
        }
    }
    if options.rules.aces_fourteen && options.rules.game != Game::Royal {
        fail("--aces-14 is a Royal setting: add --royal");
    }
    let stdin = io::stdin();
    if let Err(error) = Table::new(stdin.lock(), io::stdout(), options).play() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}

/// A rule set on the command line, if `arg` is one.
fn rule_flag(rules: &mut Rules, arg: &str) -> bool {
    match arg {
        "--royal" => rules.game = Game::Royal,
        "--aces-14" => rules.aces_fourteen = true,
        "--sweeps" => rules.sweeps = true,
        "--no-sweeps" => rules.sweeps = false,
        _ => return false,
    }
    true
}

fn help() {
    println!(
        "cassino [--royal [--aces-14]] [--sweeps] [--seed N] [--skill 1-{}]",
        agents::TOP
    );
    println!("        [--watch [--skills A,B] [--reveal] [--fast]] [--no-colour]");
    println!("  --royal      Royal Cassino: jacks 11, queens 12, kings 13");
    println!("  --aces-14    (Royal) an ace from the hand may capture as 14");
    println!("  --sweeps     a point for each sweep (not scored by default)");
    println!(
        "  --skill      how well your opponent plays, from 1 to {} (default {}):",
        agents::TOP,
        agents::TOP
    );
    for level in 1..=agents::TOP {
        println!("               {level}  {}", agents::describe(level));
    }
    println!("               between two, the higher slips to the lower now and then (3.5)");
    println!("  --seed       deals the same cards again (the seed is printed at the top)");
    println!("  --watch      two computer players (--skills South,North); Enter after each");
    println!("               move (--fast: no pauses; --reveal: both hands face up)");
    println!("  --explain    say what each move means, and how yours compares with the best");
    println!("               (type hint at your turn for a suggestion)");
    println!("  --no-colour  plain text");
}

fn skill(value: Option<String>) -> f64 {
    value
        .and_then(|v| v.trim().parse().ok())
        .filter(|s: &f64| (1.0..=f64::from(agents::TOP)).contains(s))
        .unwrap_or_else(|| fail(&format!("a skill is 1 to {}", agents::TOP)))
}

fn number(value: Option<String>, flag: &str) -> u64 {
    value
        .and_then(|v| v.parse().ok())
        .unwrap_or_else(|| fail(&format!("{flag} needs a number")))
}

fn fail(message: &str) -> ! {
    eprintln!("{message}");
    std::process::exit(2);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rules(args: &[&str]) -> Rules {
        let mut rules = DEFAULT_RULES;
        for arg in args {
            assert!(rule_flag(&mut rules, arg), "{arg} is a rule");
        }
        rules
    }

    #[test]
    fn sweeps_score_only_when_asked_for() {
        assert_eq!(
            rules(&[]),
            Rules {
                sweeps: false,
                ..Rules::CLASSIC
            }
        );
        assert!(rules(&["--sweeps"]).sweeps);
        assert_eq!(rules(&["--royal", "--aces-14"]).game, Game::Royal);
        assert!(!rule_flag(&mut rules(&[]), "--seed"));
    }
}
