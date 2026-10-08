//! The tutor (`docs/DESIGN.md` §12.8): the skills a game can show, and
//! which each needs first.

/// A skill a decision can show.
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Skill {
    /// Taking a card of the same rank.
    Pairs,
    /// Taking cards that add up to a card played.
    Sums,
    /// Building for a card held.
    Building,
    /// Choosing builds that survive to be taken.
    SafeBuilds,
    /// Taking or raising the opponent's builds.
    AnsweringBuilds,
    /// Leaving no table one card can clear.
    NoSweep,
    /// Keeping aces and Cassinos off the table.
    Valuables,
    /// Choosing which card to trail.
    Trailing,
}

impl Skill {
    pub const ALL: [Skill; 8] = [
        Skill::Pairs,
        Skill::Sums,
        Skill::Building,
        Skill::SafeBuilds,
        Skill::AnsweringBuilds,
        Skill::NoSweep,
        Skill::Valuables,
        Skill::Trailing,
    ];

    /// The skills this one needs first: the logical ones only.
    pub fn needs(self) -> &'static [Skill] {
        match self {
            Skill::Sums => &[Skill::Pairs],
            Skill::Building => &[Skill::Sums],
            Skill::SafeBuilds => &[Skill::Building],
            Skill::AnsweringBuilds => &[Skill::Sums],
            Skill::Pairs | Skill::NoSweep | Skill::Valuables | Skill::Trailing => &[],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_skill_is_listed_once() {
        let mut all = Skill::ALL.to_vec();
        all.sort();
        all.dedup();
        assert_eq!(all.len(), Skill::ALL.len());
    }

    #[test]
    fn prerequisites_come_before_and_never_loop() {
        // ALL is in an order that puts every prerequisite first.
        for (i, s) in Skill::ALL.iter().enumerate() {
            for n in s.needs() {
                let j = Skill::ALL.iter().position(|x| x == n).unwrap();
                assert!(j < i, "{s:?} needs {n:?}, listed after it");
            }
        }
    }

    #[test]
    fn building_needs_sums_and_pairs_need_nothing() {
        assert_eq!(Skill::Building.needs(), &[Skill::Sums]);
        assert!(Skill::Pairs.needs().is_empty());
    }
}
