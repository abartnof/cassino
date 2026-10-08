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

    /// The name used on the command line (`searcher-no-<slug>`).
    pub fn slug(self) -> &'static str {
        match self {
            Skill::Pairs => "pairs",
            Skill::Sums => "sums",
            Skill::Building => "building",
            Skill::SafeBuilds => "safe-builds",
            Skill::AnsweringBuilds => "answering-builds",
            Skill::NoSweep => "sweeps",
            Skill::Valuables => "valuables",
            Skill::Trailing => "trailing",
        }
    }

    /// The skill whose [`slug`](Skill::slug) this is.
    pub fn from_slug(slug: &str) -> Option<Skill> {
        Skill::ALL.into_iter().find(|s| s.slug() == slug)
    }

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
    fn slugs_name_each_skill_once_and_read_back() {
        for s in Skill::ALL {
            assert_eq!(Skill::from_slug(s.slug()), Some(s));
        }
        assert_eq!(Skill::from_slug("nothing"), None);
    }

    #[test]
    fn building_needs_sums_and_pairs_need_nothing() {
        assert_eq!(Skill::Building.needs(), &[Skill::Sums]);
        assert!(Skill::Pairs.needs().is_empty());
    }
}
