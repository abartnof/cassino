//! The Cassino rules engine.
//!
//! The rules are those of `docs/RULES.md` (pagat.com's Casino and Royal
//! Casino); the reasoning behind the structure is in `docs/DESIGN.md`.

pub mod cards;
pub mod moves;
pub mod rng;
pub mod rules;
pub mod scoring;
pub mod sums;
pub mod table;

#[cfg(test)]
mod reference;
