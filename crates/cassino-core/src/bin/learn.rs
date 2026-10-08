//! What the learner makes of an agent's games (`docs/DESIGN.md` §12.8), for
//! setting the thresholds of `learner` and for looking at a student.
//! Descriptive, a fixed count.
//!
//! ```text
//! learn AGENT GAMES [--rules classic|royal] [--opponent SKILL] [--sweeps] [--first SEED]
//! ```
//!
//! `AGENT` is any name of `agents::by_name` (`searcher`, `counter`,
//! `searcher-no-building`...) or a number on the skill dial (`2` greedy,
//! `3.5`). It sits in the person's seat against the opponent (the counter
//! by default). After each game: its evidence, and the learner's focus and
//! mastered skills; at the end, the met rate of each skill over all the
//! games, which is what `learner::top_rate` holds for the strongest rung.
//! The game's default rules: sweeps not scored.

use cassino_core::agents::{self, Agent};
use cassino_core::learner::{self, Summary};
use cassino_core::opponent::Skill as Rung;
use cassino_core::rng::Rng;
use cassino_core::rules::{Game, Rules};
use cassino_core::tutor::Skill;

fn main() {
    let mut rules = Rules {
        sweeps: false,
        ..Rules::CLASSIC
    };
    let mut opponent = 3.0;
    let mut first = 1u64;
    let mut positional = Vec::new();
    let mut args = std::env::args().skip(1);
    while let Some(a) = args.next() {
        match a.as_str() {
            "--rules" => {
                rules.game = match args.next().as_deref() {
                    Some("classic") => Game::Classic,
                    Some("royal") => Game::Royal,
                    other => panic!("--rules classic|royal, not {other:?}"),
                }
            }
            "--opponent" => opponent = args.next().expect("a skill").parse().expect("a number"),
            "--first" => first = args.next().expect("a seed").parse().expect("a number"),
            "--sweeps" => rules.sweeps = true,
            _ => positional.push(a),
        }
    }
    let name = positional.first().expect("an agent").clone();
    let games: u64 = positional
        .get(1)
        .expect("a number of games")
        .parse()
        .expect("a number");
    println!(
        "{name} in the person's seat against skill {opponent}, {:?}, sweeps {}, {games} games from seed {first}",
        rules.game,
        if rules.sweeps { "scored" } else { "not scored" }
    );
    let mut summaries: Vec<Summary> = Vec::new();
    let (mut chances, mut met, mut missed) = ([0u32; 8], [0u32; 8], [0.0f64; 8]);
    for seed in first..first + games {
        let mut agent: Box<dyn Agent> = match name.parse::<f64>() {
            Ok(dial) => Box::new(Rung(dial).opponent(seed ^ 0x5eed)),
            Err(_) => agents::by_name(&name, Rng::seeded(seed ^ 0x5eed)).expect("an agent's name"),
        };
        let started = std::time::Instant::now();
        let session = learner::play_game(agent.as_mut(), rules, opponent, seed);
        let played = started.elapsed().as_secs_f64();
        let summary = learner::evidence(session.turns());
        for (i, skill) in Skill::ALL.into_iter().enumerate() {
            let t = summary.of(skill);
            chances[i] += t.chances;
            met[i] += t.met;
            missed[i] += t.missed;
        }
        summaries.push(summary);
        let l = learner::learn(&summaries);
        let mastered: Vec<&str> = Skill::ALL
            .into_iter()
            .filter(|&s| l.mastered(s))
            .map(Skill::slug)
            .collect();
        println!(
            "game {seed}: played {played:.1} s, judged {:.1} s; focus {}; mastered [{}]",
            started.elapsed().as_secs_f64() - played,
            l.focus.map_or("none", Skill::slug),
            mastered.join(" ")
        );
        let line: Vec<String> = Skill::ALL
            .into_iter()
            .map(|s| {
                let t = summaries.last().expect("one").of(s);
                format!("{} {}/{} ({:.1})", s.slug(), t.met, t.chances, t.missed)
            })
            .collect();
        println!("    {}", line.join("; "));
    }
    println!("\nOver all the games:");
    for (i, skill) in Skill::ALL.into_iter().enumerate() {
        let rate = if chances[i] > 0 {
            f64::from(met[i]) / f64::from(chances[i])
        } else {
            f64::NAN
        };
        println!(
            "  {:<17} met {:>4} of {:>4} = {:.3}; missed {:.1} points, {:.2} a game; {:.1} chances a game",
            skill.slug(),
            met[i],
            chances[i],
            rate,
            missed[i],
            missed[i] / games as f64,
            f64::from(chances[i]) / games as f64
        );
    }
}
