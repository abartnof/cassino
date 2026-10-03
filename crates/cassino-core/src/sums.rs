//! The arithmetic of the table: which cards add up to a value.
//!
//! A *group* of value v is a set of loose cards whose values total v
//! (`docs/RULES.md` rule 4). Captures and builds are unions of disjoint groups,
//! so everything the move generator does starts here.

use std::collections::HashMap;

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
///
/// Whether a set splits depends only on the multiset of its values, so the
/// search runs on counts of each value and remembers the counts it has
/// already tried: fast even for the whole table at once (the engine review's
/// F2: 29 cards once took seconds).
pub fn partitions_into(rules: &Rules, set: CardSet, v: u8) -> bool {
    let mut counts = [0u8; 14];
    let mut total = 0u32;
    for c in set {
        let Some(x) = rules.build_value(c) else {
            return false;
        };
        if x > v {
            return false;
        }
        counts[x as usize] += 1;
        total += u32::from(x);
    }
    if set.is_empty() {
        return true;
    }
    if v == 0 || !total.is_multiple_of(u32::from(v)) {
        return false;
    }
    split(&mut counts, v, &mut HashMap::new())
}

/// The counts as a key: three bits for each of the values 1 to 13.
fn key(counts: &[u8; 14]) -> u64 {
    counts[1..].iter().fold(0, |k, &c| k << 3 | u64::from(c))
}

/// Splits the counted values into groups of `v`: the largest value left
/// must be in some group, so try each set of companions for it.
fn split(counts: &mut [u8; 14], v: u8, memo: &mut HashMap<u64, bool>) -> bool {
    let Some(x) = (1..=13usize).rev().find(|&i| counts[i] > 0) else {
        return true;
    };
    let k = key(counts);
    if let Some(&known) = memo.get(&k) {
        return known;
    }
    counts[x] -= 1;
    let ok = companions(counts, v - x as u8, x, v, memo);
    counts[x] += 1;
    memo.insert(k, ok);
    ok
}

/// Chooses companions totalling `need`, each no larger than `max` (so each
/// set is tried once), then splits what is left.
fn companions(
    counts: &mut [u8; 14],
    need: u8,
    max: usize,
    v: u8,
    memo: &mut HashMap<u64, bool>,
) -> bool {
    if need == 0 {
        return split(counts, v, memo);
    }
    for y in (1..=max.min(need as usize)).rev() {
        if counts[y] > 0 {
            counts[y] -= 1;
            let ok = companions(counts, need - y as u8, y, v, memo);
            counts[y] += 1;
            if ok {
                return true;
            }
        }
    }
    false
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

/// The unions a bounded generator offers: every disjoint union when there
/// are at most `limit` groups, as [`disjoint_unions`] gives them; otherwise
/// the empty union, each of the first `limit` groups alone (pairs first,
/// then the fewest cards), and a greedy maximal packing started from each.
/// Always a subset of [`disjoint_unions`], and never more than
/// `2 * limit + 1` unions.
pub fn bounded_unions(groups: &[CardSet], limit: usize) -> Vec<CardSet> {
    if groups.len() <= limit {
        return disjoint_unions(groups);
    }
    let mut ranked: Vec<CardSet> = groups.to_vec();
    ranked.sort_by_key(|g| (g.len(), *g));
    let mut out = vec![CardSet::EMPTY];
    for &start in ranked.iter().take(limit) {
        out.push(start);
        let packed = ranked.iter().fold(
            start,
            |acc, &g| if acc.is_disjoint(g) { acc | g } else { acc },
        );
        out.push(packed);
    }
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

    /// The search as first written: exact, and exponential.
    fn slow_partitions(rules: &Rules, set: CardSet, v: u8) -> bool {
        let Some(total) = value_sum(rules, set) else {
            return false;
        };
        if v == 0 || total % u32::from(v) != 0 {
            return set.is_empty();
        }
        let Some(lowest) = set.first() else {
            return true;
        };
        let Some(need) = v.checked_sub(rules.build_value(lowest).unwrap()) else {
            return false;
        };
        let rest = set.without(lowest);
        if need == 0 {
            return slow_partitions(rules, rest, v);
        }
        subsets_summing(rules, rest, need)
            .into_iter()
            .any(|g| slow_partitions(rules, rest - g, v))
    }

    #[test]
    fn the_fast_partition_search_agrees_with_the_slow_one() {
        let mut rng = crate::rng::Rng::seeded(31);
        let pack = crate::cards::pack();
        for _ in 0..4_000 {
            let n = 1 + rng.below(12) as usize;
            let mut deck = pack;
            rng.shuffle(&mut deck);
            let set: CardSet = deck[..n].iter().copied().collect();
            for v in 1..=14 {
                for rules in [Rules::CLASSIC, Rules::ROYAL] {
                    assert_eq!(
                        partitions_into(&rules, set, v),
                        slow_partitions(&rules, set, v),
                        "{set} into {v}"
                    );
                }
            }
        }
    }

    #[test]
    fn a_crowded_claim_is_refused_quickly() {
        // The review's F2: 29 cards totalling a multiple of 13 that cannot
        // split into thirteens (no ace to pair a queen).
        let set = s("2S 3S 4S 5S 6S 7S QS 2H 3H 4H 5H 6H 7H 8H 2D 3D 4D 5D 6D 7D 8D 2C 3C 4C 5C 6C 7C 8C QH");
        assert_eq!(set.len(), 29);
        assert_eq!(value_sum(&Rules::ROYAL, set).unwrap() % 13, 0);
        let started = std::time::Instant::now();
        assert!(!partitions_into(&Rules::ROYAL, set, 13));
        assert!(
            started.elapsed().as_millis() < 10,
            "{:?}",
            started.elapsed()
        );
        // And one that does split, as fast.
        let fine = s("2S 3S 4S 5S 6S 7S 8S 9S TS 2H 3H 4H 5H 6H 7H 8H 9H TH");
        let started = std::time::Instant::now();
        assert!(
            partitions_into(&Rules::CLASSIC, fine, 10)
                == slow_partitions(&Rules::CLASSIC, fine, 10)
        );
        assert!(started.elapsed().as_millis() < 2_000);
    }

    #[test]
    fn a_card_worth_more_than_the_value_never_splits() {
        // 5 is a multiple of 1, but a five is not a group of ones.
        assert!(!partitions_into(&Rules::CLASSIC, s("5S"), 1));
        assert!(!partitions_into(&Rules::CLASSIC, s("AS 9D"), 5));
        assert!(partitions_into(&Rules::CLASSIC, s("AS AD"), 1));
    }

    #[test]
    fn bounded_unions_are_exhaustive_when_few_and_bounded_when_many() {
        let groups = [s("8D"), s("2D 6C"), s("3H 5S"), s("AC 2D 5S")];
        assert_eq!(bounded_unions(&groups, 4), disjoint_unions(&groups));
        // Many groups: a crowded table of small cards summing to 10.
        let pool = s("AS 2S 3S 4S 5S 6S AH 2H 3H 4H 5H 6H AD 2D 3D 4D 5D 6D AC 2C 3C 4C");
        let many = subsets_summing(&Rules::CLASSIC, pool, 10);
        assert!(many.len() > 100, "{}", many.len());
        let bounded = bounded_unions(&many, 12);
        assert!(bounded.len() <= 25, "{}", bounded.len());
        assert!(bounded.contains(&CardSet::EMPTY));
        // Each is a union of disjoint groups: it splits into tens.
        for u in &bounded {
            assert!(partitions_into(&Rules::CLASSIC, *u, 10), "{u}");
        }
        // And some take a lot at once.
        assert!(
            bounded.iter().any(|u| u.len() >= 12),
            "a packing takes many cards"
        );
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
