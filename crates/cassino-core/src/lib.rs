//! The Cassino rules engine.
//!
//! The rules are those of `docs/RULES.md` (pagat.com's Casino and Royal
//! Casino); the reasoning behind the structure is in `docs/DESIGN.md`.

pub mod agents;
pub mod cards;
pub mod counter;
pub mod game;
pub mod hand;
pub mod moves;
pub mod observation;
pub mod rng;
pub mod rules;
pub mod scoring;
pub mod solver;
pub mod sums;
pub mod table;
pub mod tournament;
pub mod words;
pub mod worth;

#[cfg(test)]
mod reference;
