//! The arithmetic of the table: which cards add up to a value.
//!
//! A *group* of value v is a set of loose cards whose values total v
//! (`docs/RULES.md` rule 4). Captures and builds are unions of disjoint groups,
//! so everything the move generator does starts here.

use crate::cards::CardSet;
use crate::rules::Rules;

/// The total of the cards' values in sums and builds, or `None` if any card
/// has no value (a Classic court card).
pub fn value_sum(rules: &Rules, set: CardSet) -> Option<u32> {
    set.iter()
        .map(|c| rules.build_value(c).map(u32::from))
        .sum()
}

/// Every non-empty subset of `pool` whose values total `target`, in
/// ascending order of their bits. Cards without a value never take part.
pub fn subsets_summing(rules: &Rules, pool: CardSet, target: u8) -> Vec<CardSet> {
    // The candidates, highest value first, so the search prunes early.
    let mut cards: Vec<(u8, CardSet)> = pool
        .iter()
        .filter_map(|c| {
            let v = rules.build_value(c)?;
            (v <= target).then_some((v, CardSet::single(c)))
        })
        .collect();
    cards.sort_by(|a, b| b.0.cmp(&a.0).then(a.1.cmp(&b.1)));
    // suffix[i]: the total of cards[i..], to stop when the rest cannot reach.
    let mut suffix = vec![0u32; cards.len() + 1];
    for i in (0..cards.len()).rev() {
        suffix[i] = suffix[i + 1] + u32::from(cards[i].0);
    }
    let mut out = Vec::new();
    fn walk(
        cards: &[(u8, CardSet)],
        suffix: &[u32],
        i: usize,
        left: u32,
        acc: CardSet,
        out: &mut Vec<CardSet>,
    ) {
        if left == 0 {
            out.push(acc);
            return;
        }
        if i == cards.len() || suffix[i] < left {
            return;
        }
        let (v, bit) = cards[i];
        if u32::from(v) <= left {
            walk(cards, suffix, i + 1, left - u32::from(v), acc | bit, out);
        }
        walk(cards, suffix, i + 1, left, acc, out);
    }
    if target > 0 {
        walk(
            &cards,
            &suffix,
            0,
            u32::from(target),
            CardSet::EMPTY,
            &mut out,
        );
    }
    out.sort_unstable();
    out
}

/// Whether `set` splits into groups that each total `v`. The empty set does
/// (into no groups); a set with a valueless card never does.
pub fn partitions_into(rules: &Rules, set: CardSet, v: u8) -> bool {
    let Some(total) = value_sum(rules, set) else {
        return false;
    };
    if v == 0 || total % u32::from(v) != 0 {
        return set.is_empty();
    }
    // The lowest card belongs to exactly one group; try each, and split the
    // rest the same way.
    let Some(lowest) = set.first() else {
        return true;
    };
    let need = v - rules.build_value(lowest).expect("valued above");
    let rest = set.without(lowest);
    if need == 0 {
        return partitions_into(rules, rest, v);
    }
    subsets_summing(rules, rest, need)
        .into_iter()
        .any(|g| partitions_into(rules, rest - g, v))
}

/// Every distinct union of pairwise-disjoint groups from `groups`, the empty
/// union included, in ascending order of their bits.
pub fn disjoint_unions(groups: &[CardSet]) -> Vec<CardSet> {
    fn walk(groups: &[CardSet], i: usize, acc: CardSet, out: &mut Vec<CardSet>) {
        out.push(acc);
        for j in i..groups.len() {
            if acc.is_disjoint(groups[j]) {
                walk(groups, j + 1, acc | groups[j], out);
            }
        }
    }
    let mut out = Vec::new();
    walk(groups, 0, CardSet::EMPTY, &mut out);
    out.sort_unstable();
    out.dedup();
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn s(text: &str) -> CardSet {
        CardSet::parse(text).unwrap()
    }

    #[test]
    fn sums_of_values() {
        assert_eq!(value_sum(&Rules::CLASSIC, s("AS 2D TC")), Some(13));
        assert_eq!(value_sum(&Rules::CLASSIC, s("")), Some(0));
        assert_eq!(value_sum(&Rules::CLASSIC, s("AS KD")), None);
        assert_eq!(value_sum(&Rules::ROYAL, s("AS KD")), Some(14));
    }

    #[test]
    fn subsets_summing_finds_pagats_eight() {
        // W1's table: A 2 3 5 6 8.
        let pool = s("AC 2D 3H 5S 6C 8D");
        let got = subsets_summing(&Rules::CLASSIC, pool, 8);
        let mut want = vec![s("8D"), s("2D 6C"), s("3H 5S"), s("AC 2D 5S")];
        want.sort();
        assert_eq!(got, want);
    }

    #[test]
    fn subsets_summing_ignores_classic_courts() {
        assert!(subsets_summing(&Rules::CLASSIC, s("KS 3H"), 13).is_empty());
        assert_eq!(subsets_summing(&Rules::ROYAL, s("KS 3H TD"), 13), {
            let mut v = vec![s("KS"), s("3H TD")];
            v.sort();
            v
        });
        assert!(subsets_summing(&Rules::CLASSIC, s(""), 5).is_empty());
        assert!(subsets_summing(&Rules::CLASSIC, s("5S"), 0).is_empty());
    }

    #[test]
    fn subsets_summing_matches_brute_force() {
        // Every subset of a crowded pool, checked one by one.
        let pool = s("AS AH 2S 3D 4C 5H 6S 7D 9C TH");
        let cards: Vec<_> = pool.iter().collect();
        for target in 1..=14u8 {
            let mut want = Vec::new();
            for mask in 1u32..(1 << cards.len()) {
                let sub: CardSet = (0..cards.len())
                    .filter(|i| mask >> i & 1 == 1)
                    .map(|i| cards[i])
                    .collect();
                if value_sum(&Rules::ROYAL, sub) == Some(u32::from(target)) {
                    want.push(sub);
                }
            }
            want.sort();
            assert_eq!(
                subsets_summing(&Rules::ROYAL, pool, target),
                want,
                "{target}"
            );
        }
    }

    #[test]
    fn partitions() {
        let r = Rules::CLASSIC;
        assert!(partitions_into(&r, s("8D 6C 2D 5S 3H"), 8));
        assert!(partitions_into(&r, s("8D 5S 2D AC"), 8));
        assert!(
            !partitions_into(&r, s("AC 2D 3H 5S 6C 8D"), 8),
            "25 is not a multiple of 8"
        );
        // 16 is a multiple of 8, but 7 7 2 cannot be split into eights.
        assert!(!partitions_into(&r, s("7S 7H 2D"), 8));
        assert!(partitions_into(&r, s("7S AH 7D AC"), 8));
        assert!(partitions_into(&r, s(""), 8));
        assert!(
            !partitions_into(&r, s("KS"), 13),
            "a Classic king has no value"
        );
        assert!(partitions_into(&Rules::ROYAL, s("KS 6H 7D"), 13));
    }

    #[test]
    fn unions_of_disjoint_groups() {
        let groups = [s("8D"), s("2D 6C"), s("3H 5S"), s("AC 2D 5S")];
        let got = disjoint_unions(&groups);
        let mut want = vec![
            s(""),
            s("8D"),
            s("2D 6C"),
            s("3H 5S"),
            s("AC 2D 5S"),
            s("8D 2D 6C"),
            s("8D 3H 5S"),
            s("8D AC 2D 5S"),
            s("2D 6C 3H 5S"),
            s("8D 2D 6C 3H 5S"),
        ];
        want.sort();
        assert_eq!(got, want);
        assert_eq!(disjoint_unions(&[]), vec![s("")]);
    }
}
