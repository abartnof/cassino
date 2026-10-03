//! How fast the engine's pieces are, on positions from random play:
//! candidate moves, a random playout of a whole hand, and the exact solver
//! on a whole last deal. For deciding what a search can afford.
//!
//! ```text
//! bench [N]
//! ```

use std::time::Instant;

use cassino_core::cards::pack;
use cassino_core::hand::Hand;
use cassino_core::rng::Rng;
use cassino_core::rules::Rules;
use cassino_core::solver::{Margin, Solver};
use cassino_core::table::Seat;

fn main() {
    let n: u64 = std::env::args()
        .nth(1)
        .and_then(|a| a.parse().ok())
        .unwrap_or(200);
    for (name, rules) in [("Classic", Rules::CLASSIC), ("Royal", Rules::ROYAL)] {
        // Random playouts of whole hands: plies and candidate generation.
        let started = Instant::now();
        let mut plies = 0u64;
        for seed in 0..n {
            let mut deck = pack();
            Rng::seeded(seed).shuffle(&mut deck);
            let mut rng = Rng::seeded(seed + 1);
            let (mut h, _) = Hand::deal(rules, Seat::South, deck);
            while h.to_move().is_some() {
                let moves = h.candidates();
                h.play(&moves[rng.below(moves.len() as u64) as usize])
                    .unwrap();
                plies += 1;
            }
        }
        let per_hand = started.elapsed().as_secs_f64() / n as f64;
        println!(
            "{name}: a random playout of a hand takes {:.0} µs ({:.1} µs a ply, {plies} plies)",
            per_hand * 1e6,
            per_hand * 1e6 * n as f64 / plies as f64
        );
        // The exact solver on a whole last deal.
        let mut times = Vec::new();
        let mut nodes = Vec::new();
        for seed in 0..n.min(100) {
            let mut deck = pack();
            Rng::seeded(seed + 9000).shuffle(&mut deck);
            let mut rng = Rng::seeded(seed + 9001);
            let (mut h, _) = Hand::deal(rules, Seat::South, deck);
            while !h.undealt().is_empty()
                || h.hand_of(Seat::South).len() + h.hand_of(Seat::North).len() > 8
            {
                let moves = h.candidates();
                h.play(&moves[rng.below(moves.len() as u64) as usize])
                    .unwrap();
            }
            let started = Instant::now();
            let mut solver = Solver::new(&Margin);
            solver.best(&h);
            times.push(started.elapsed().as_secs_f64() * 1e3);
            nodes.push(solver.nodes);
        }
        times.sort_by(f64::total_cmp);
        nodes.sort_unstable();
        let mean = times.iter().sum::<f64>() / times.len() as f64;
        println!(
            "{name}: solving a whole last deal: mean {mean:.1} ms, median {:.1} ms, worst {:.1} ms; median {} nodes, worst {}",
            times[times.len() / 2],
            times[times.len() - 1],
            nodes[nodes.len() / 2],
            nodes[nodes.len() - 1]
        );
    }
}
