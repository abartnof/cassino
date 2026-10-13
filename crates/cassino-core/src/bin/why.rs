//! Whether a plain reason explains the tutor's missed trails, for the
//! brief's example (`brief::example`). Descriptive, a fixed count.
//!
//! ```text
//! why GAMES [--rules classic|royal] [--agent DIAL]
//! ```
//!
//! The agent (the counter, 3, by default) sits in the person's seat against
//! the counter; sweeps not scored. For every missed chance at trailing, the
//! card trailed P and the best trail B, two reasons, each counted both ways
//! (that B has it over P, and that P has it over B):
//!
//! - R1 fewer unseen: fewer copies of B's rank are unseen than of P's.
//! - R2 adds up with nothing: B pairs and adds up with nothing on the
//!   table (`lessons::isolated`), and P does.
//!
//! A second round, written after the first fell short and before it ran:
//!
//! - R3 you can take it back: you hold another card of B's rank, and none
//!   of P's.
//! - R4 lower: B ranks below P.
//!
//! A reason is worth telling, where it holds, if it holds for B in at least
//! half the misses and at least three times as often as for P.

use cassino_core::cards::{Card, CardSet};
use cassino_core::learner;
use cassino_core::lessons::isolated;
use cassino_core::moves::Move;
use cassino_core::observation::View;
use cassino_core::opponent::Skill as Rung;
use cassino_core::rules::{Game, Rules};
use cassino_core::tutor::{self, Skill};

fn unseen(v: &View, c: Card) -> u32 {
    (v.unseen() & CardSet::of_rank(c.rank())).len()
}

fn main() {
    let mut rules = Rules {
        sweeps: false,
        ..Rules::CLASSIC
    };
    let mut dial = 3.0;
    let mut games = 0u64;
    let mut args = std::env::args().skip(1);
    while let Some(a) = args.next() {
        match a.as_str() {
            "--rules" => {
                rules.game = match args.next().as_deref() {
                    Some("royal") => Game::Royal,
                    _ => Game::Classic,
                }
            }
            "--agent" => dial = args.next().expect("a dial").parse().expect("a number"),
            n => games = n.parse().expect("a number of games"),
        }
    }
    let (mut misses, mut r1, mut r1_back, mut r2, mut r2_back, mut either) = (0, 0, 0, 0, 0, 0);
    let (mut r3, mut r3_back, mut r4, mut r4_back) = (0u32, 0u32, 0u32, 0u32);
    for seed in 1..=games {
        let mut agent = Rung(dial).opponent(seed ^ 0x5eed);
        let s = learner::play_game(&mut agent, rules, 3.0, seed);
        let pass = tutor::pass_of(s.turns(), |t| !t.assisted);
        for (t, values) in s.turns().iter().zip(&pass) {
            let Some(values) = values else { continue };
            if t.assisted || t.view.candidates().len() < 2 {
                continue;
            }
            let chances = tutor::chances_with(&t.view, &t.mv, tutor::margin(&t.view), values);
            if !chances.iter().any(|c| c.skill == Skill::Trailing && !c.met) {
                continue;
            }
            let Move::Trail { card: p } = t.mv else {
                continue;
            };
            let Some(b) = values
                .iter()
                .filter_map(|(m, x)| match m {
                    Move::Trail { card } => Some((*card, *x)),
                    _ => None,
                })
                .max_by(|a, b| a.1.total_cmp(&b.1))
                .map(|(c, _)| c)
            else {
                continue;
            };
            let v = &t.view;
            misses += 1;
            let a1 = unseen(v, b) < unseen(v, p);
            let a2 = isolated(v, b) && !isolated(v, p);
            r1 += a1 as u32;
            r1_back += (unseen(v, p) < unseen(v, b)) as u32;
            r2 += a2 as u32;
            r2_back += (isolated(v, p) && !isolated(v, b)) as u32;
            either += (a1 || a2) as u32;
            let back = |c: Card, o: Card| {
                !(v.hand.without(c) & CardSet::of_rank(c.rank())).is_empty()
                    && (v.hand.without(o) & CardSet::of_rank(o.rank())).is_empty()
            };
            r3 += back(b, p) as u32;
            r3_back += back(p, b) as u32;
            r4 += (b.rank() < p.rank()) as u32;
            r4_back += (p.rank() < b.rank()) as u32;
        }
    }
    let pc = |n: u32| 100.0 * f64::from(n) / f64::from(misses.max(1));
    println!(
        "{:?}, agent {dial}, {games} games: {misses} missed trails",
        rules.game
    );
    println!("R1 fewer unseen:   B {:.1}%  P {:.1}%", pc(r1), pc(r1_back));
    println!(
        "R2 adds up with nothing: B {:.1}%  P {:.1}%",
        pc(r2),
        pc(r2_back)
    );
    println!("either for B: {:.1}%", pc(either));
    println!("R3 take it back:   B {:.1}%  P {:.1}%", pc(r3), pc(r3_back));
    println!("R4 lower:          B {:.1}%  P {:.1}%", pc(r4), pc(r4_back));
}
