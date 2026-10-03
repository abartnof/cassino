//! `cassino`: play Cassino in the terminal, or watch two computer players.
//!
//! ```text
//! cassino [--royal [--aces-14]] [--no-sweeps] [--seed N] [--level 1-TOP]
//!         [--watch [--levels A,B] [--reveal] [--fast]] [--no-colour]
//! ```

mod table;

use std::io::{self, IsTerminal};
use std::time::{SystemTime, UNIX_EPOCH};

use cassino_core::agents;
use cassino_core::rules::{Game, Rules};
use table::{Options, Table};

fn main() {
    let mut options = Options {
        rules: Rules::CLASSIC,
        seed: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_or(1, |d| d.as_secs() % 1_000_000),
        levels: [agents::TOP, agents::TOP],
        watch: false,
        reveal: false,
        pause: true,
        colour: io::stdout().is_terminal() && std::env::var_os("NO_COLOR").is_none(),
    };
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--royal" => options.rules.game = Game::Royal,
            "--aces-14" => options.rules.aces_fourteen = true,
            "--no-sweeps" => options.rules.sweeps = false,
            "--seed" => options.seed = number(args.next(), "--seed"),
            "--level" => options.levels[1] = level(args.next()),
            "--levels" => {
                let text = args.next().unwrap_or_default();
                let Some((a, b)) = text.split_once(',') else {
                    fail("--levels needs two levels, as 1,2");
                };
                options.levels = [level(Some(a.into())), level(Some(b.into()))];
            }
            "--watch" => options.watch = true,
            "--reveal" => options.reveal = true,
            "--fast" => options.pause = false,
            "--no-colour" | "--no-color" => options.colour = false,
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

fn help() {
    println!(
        "cassino [--royal [--aces-14]] [--no-sweeps] [--seed N] [--level 1-{}]",
        agents::TOP
    );
    println!("        [--watch [--levels A,B] [--reveal] [--fast]] [--no-colour]");
    println!("  --royal      Royal Cassino: jacks 11, queens 12, kings 13");
    println!("  --aces-14    (Royal) an ace from the hand may capture as 14");
    println!("  --no-sweeps  sweeps score nothing");
    for level in 1..=agents::TOP {
        println!(
            "  --level {level}    your opponent {}",
            agents::describe(level)
        );
    }
    println!("  --seed       deals the same cards again (the seed is printed at the top)");
    println!("  --watch      two computer players (--levels South,North); Enter after each");
    println!("               move (--fast: no pauses; --reveal: both hands face up)");
    println!("  --no-colour  plain text");
}

fn level(value: Option<String>) -> u8 {
    value
        .and_then(|v| v.trim().parse().ok())
        .filter(|l| (1..=agents::TOP).contains(l))
        .unwrap_or_else(|| fail(&format!("a level is 1 to {}", agents::TOP)))
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
