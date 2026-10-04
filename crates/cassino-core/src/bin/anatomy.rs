//! The anatomy of a hand: where one agent's points come from against
//! another's, over mirrored hands (`docs/DESIGN.md` §11.4). It answers *why*
//! a rung wins: more captures, more builds that survive, more sweeps, the
//! residue, or the point cards.
//!
//! ```text
//! anatomy A B [N] [--rules classic|royal|royal14] [--seed S]
//! ```
//!
//! A and B are levels (1 to TOP) or agents' names (`agents::by_name`).
//! Figures are per hand, each agent's average over both seats.

use cassino_core::agents::{self, Agent};
use cassino_core::cards::{pack, CardSet, ACE};
use cassino_core::hand::{Event, Hand};
use cassino_core::moves::{build_kind, BuildKind, Move};
use cassino_core::rng::{purpose, Rng};
use cassino_core::rules::{Game, Rules};
use cassino_core::scoring::Item;
use cassino_core::table::Seat;
use cassino_core::tournament::agent_rng;

/// A line of the report: its label, and how to read it from a tally.
type Row = (&'static str, fn(&Tally) -> f64);

#[derive(Default, Clone, Copy)]
struct Tally {
    hands: f64,
    points: f64,
    cards: f64,
    spades: f64,
    aces: f64,
    casinos: f64,
    sweeps: f64,
    captures: f64,
    trails: f64,
    builds: f64,
    raises: f64,
    adds: f64,
    builds_taken: f64,
    builds_lost: f64,
    residue: f64,
    most_cards: f64,
    most_spades: f64,
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let usage = "anatomy A B [N] [--rules classic|royal|royal14] [--seed S]";
    let name = |s: Option<&String>| -> String {
        let s = s.unwrap_or_else(|| panic!("{usage}"));
        match s.parse::<u8>() {
            Ok(l) if (1..=agents::TOP).contains(&l) => {
                ["legal", "greedy", "counter", "searcher"][l as usize - 1].to_string()
            }
            _ if agents::by_name(s, Rng::seeded(0)).is_some() => s.clone(),
            _ => panic!("{usage}"),
        }
    };
    let (a, b) = (name(args.first()), name(args.get(1)));
    let mut n = 200u64;
    let mut rules = Rules::CLASSIC;
    let mut first = 2_000_000u64;
    let mut i = 2;
    while i < args.len() {
        match args[i].as_str() {
            "--rules" => {
                rules = match args.get(i + 1).map(String::as_str) {
                    Some("royal") => Rules::ROYAL,
                    Some("royal14") => Rules {
                        game: Game::Royal,
                        aces_fourteen: true,
                        ..Rules::ROYAL
                    },
                    _ => Rules::CLASSIC,
                };
                i += 2;
            }
            "--seed" => {
                first = args[i + 1].parse().expect("--seed S");
                i += 2;
            }
            other => {
                n = other.parse().unwrap_or_else(|_| panic!("{usage}"));
                i += 1;
            }
        }
    }
    let mut tallies = [Tally::default(); 2];
    for seed in first..first + n {
        let mut deck = pack();
        Rng::stream(seed, purpose::DEALS).shuffle(&mut deck);
        for swap in [false, true] {
            // Agent 0 is A; it sits South first, then North.
            let seat_of = |agent: usize| {
                if (agent == 0) != swap {
                    Seat::South
                } else {
                    Seat::North
                }
            };
            let mut players: Vec<Box<dyn Agent>> = [&a, &b]
                .iter()
                .enumerate()
                .map(|(k, nm)| agents::by_name(nm, agent_rng(seed, seat_of(k))).unwrap())
                .collect();
            let (mut hand, _) = Hand::deal(rules, Seat::South, deck);
            while let Some(seat) = hand.to_move() {
                let agent = (0..2).find(|&k| seat_of(k) == seat).unwrap();
                let view = hand.view(seat, [0, 0]);
                let mv = players[agent].choose(&view);
                let before = *hand.table();
                match mv {
                    Move::Trail { .. } => tallies[agent].trails += 1.0,
                    Move::Capture { taken, .. } => {
                        tallies[agent].captures += 1.0;
                        for build in before
                            .builds
                            .iter()
                            .filter(|bd| taken.contains_all(bd.cards))
                        {
                            if build.controller == seat {
                                tallies[agent].builds_taken += 1.0;
                            } else {
                                tallies[1 - agent].builds_lost += 1.0;
                            }
                        }
                    }
                    Move::Build { .. } => match build_kind(&rules, &before, &mv) {
                        Some((BuildKind::New, _)) => tallies[agent].builds += 1.0,
                        Some((BuildKind::Raise { .. }, _)) => tallies[agent].raises += 1.0,
                        _ => tallies[agent].adds += 1.0,
                    },
                }
                for e in hand.play(&mv).unwrap().iter() {
                    match *e {
                        Event::Swept { seat: s } => {
                            tallies[(0..2).find(|&k| seat_of(k) == s).unwrap()].sweeps += 1.0
                        }
                        Event::Residue {
                            seat: Some(s),
                            cards,
                        } => {
                            tallies[(0..2).find(|&k| seat_of(k) == s).unwrap()].residue +=
                                f64::from(cards.len())
                        }
                        _ => {}
                    }
                }
            }
            let bd = hand.breakdown().unwrap();
            for (k, t) in tallies.iter_mut().enumerate() {
                let seat = seat_of(k);
                let pile: CardSet = hand.pile(seat);
                t.hands += 1.0;
                t.points += f64::from(bd.points(seat));
                t.cards += f64::from(pile.len());
                t.spades += f64::from(pile.spades());
                t.aces += f64::from((pile & CardSet::of_rank(ACE)).len());
                t.casinos += bd
                    .lines()
                    .iter()
                    .filter(|l| l.1 == seat && matches!(l.0, Item::BigCasino | Item::LittleCasino))
                    .map(|l| f64::from(l.2))
                    .sum::<f64>();
                t.most_cards += f64::from(u8::from(bd.cards == Some(seat)));
                t.most_spades += f64::from(u8::from(bd.spades == Some(seat)));
            }
        }
    }
    println!("{a} against {b}, {rules:?}, {n} mirrored pairs of hands; per hand:");
    println!("{:<28} {:>10} {:>10}", "", a, b);
    let rows: [Row; 16] = [
        ("points", |t| t.points),
        ("cards captured", |t| t.cards),
        ("  most cards (share)", |t| t.most_cards),
        ("spades", |t| t.spades),
        ("  most spades (share)", |t| t.most_spades),
        ("aces", |t| t.aces),
        ("Cassino points", |t| t.casinos),
        ("sweeps", |t| t.sweeps),
        ("captures", |t| t.captures),
        ("trails", |t| t.trails),
        ("new builds", |t| t.builds),
        ("raises", |t| t.raises),
        ("additions to builds", |t| t.adds),
        ("own builds taken in", |t| t.builds_taken),
        ("own builds lost", |t| t.builds_lost),
        ("residue cards", |t| t.residue),
    ];
    for (label, f) in rows {
        println!(
            "{label:<28} {:>10.2} {:>10.2}",
            f(&tallies[0]) / tallies[0].hands,
            f(&tallies[1]) / tallies[1].hands
        );
    }
}
