//! How the end-of-game review (`review.rs`) reads each rung put in the
//! person's seat against the counter: how often each habit is mentioned,
//! and the slips and points each theme gave up a game. For setting
//! `review::HABIT_POINTS` above the top rung's noise.
//!
//! ```text
//! reviews [GAMES]
//! ```

use std::collections::BTreeMap;

use cassino_core::agents::Agent;
use cassino_core::opponent::Skill;
use cassino_core::review::Theme;
use cassino_core::rules::Rules;
use cassino_core::session::{Prompt, Session, Settings};

fn main() {
    let n: u64 = std::env::args()
        .nth(1)
        .and_then(|a| a.parse().ok())
        .unwrap_or(20);
    for (name, rules) in [("Classic", Rules::CLASSIC), ("Royal", Rules::ROYAL)] {
        for skill in [1.0, 2.0, 3.0, 4.0] {
            let mut told: BTreeMap<Theme, u32> = BTreeMap::new();
            let mut losses: BTreeMap<Theme, Vec<f64>> = BTreeMap::new();
            let mut quiet = 0;
            for seed in 100..100 + n {
                let mut s = Session::new(seed, Settings { rules, skill: 3.0 });
                let mut me = Skill(skill).opponent(seed ^ 0x5eed);
                loop {
                    match s.prompt() {
                        Prompt::Over => break,
                        Prompt::NextHand => assert!(s.send("next")),
                        Prompt::Play => {
                            let mv = me.choose(&s.view());
                            assert!(s.send(&mv.to_string()));
                        }
                    }
                }
                let r = s.review().expect("a review");
                quiet += u32::from(r.tries.is_empty());
                for t in &r.tries {
                    *told.entry(*t).or_default() += 1;
                }
                for (t, x) in &r.tallies {
                    losses.entry(*t).or_default().push(x.loss);
                }
            }
            println!("{name}, skill {skill} in your seat: nothing to work on in {quiet} of {n}; mentioned {told:?}");
            for (t, mut v) in losses {
                v.sort_by(f64::total_cmp);
                println!(
                    "  {t:?}: points given up a game, median {:.2}, worst {:.2}",
                    v[v.len() / 2],
                    v[v.len() - 1]
                );
            }
        }
    }
}
