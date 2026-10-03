//! What a player can know (`docs/DESIGN.md` §9). [`View`] is the only way an
//! agent sees a hand.
//!
//! Hidden: the opponent's hand and the order of the undealt cards. Public:
//! the table, everything captured (all of it was seen when taken), the
//! sweeps, whose deal and turn it is, and the scores. Public and easy to
//! forget: **a build announces a card**. A player who controls a build of
//! value v holds a card that captures v (rule 5), so the opponent's hidden
//! hand is constrained by every build they control.
//!
//! Ask of every field: when was this said or shown aloud, and to whom?

use crate::cards::{Card, CardSet};
use crate::hand::Hand;
use crate::moves::{self, Move};
use crate::rng::Rng;
use crate::rules::Rules;
use crate::table::{Seat, Table};

/// One player's knowledge of the game at a moment.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct View {
    pub rules: Rules,
    pub me: Seat,
    pub dealer: Seat,
    /// The current deal, 1 to 6.
    pub deal: u8,
    pub to_move: Option<Seat>,
    pub hand: CardSet,
    pub table: Table,
    /// Both capture piles: everything in them was seen when it was taken.
    pub piles: [CardSet; 2],
    pub sweeps: [u8; 2],
    pub last_capturer: Option<Seat>,
    /// How many cards the opponent holds.
    pub opponent_holds: u8,
    /// How many cards are still to be dealt.
    pub undealt: u8,
    /// The game's totals before this hand.
    pub scores: [u32; 2],
}

impl View {
    pub fn opponent(&self) -> Seat {
        self.me.other()
    }

    /// The cards this player cannot see: the opponent's hand and the undealt
    /// cards together.
    pub fn unseen(&self) -> CardSet {
        !(self.hand | self.table.cards() | self.piles[0] | self.piles[1])
    }

    /// The build values the opponent must be holding a card for, one entry
    /// per distinct value of a build they control.
    pub fn opponent_must_hold(&self) -> Vec<u8> {
        let mut values: Vec<u8> = self
            .table
            .builds
            .iter()
            .filter(|b| b.controller == self.opponent())
            .map(|b| b.value)
            .collect();
        values.sort_unstable();
        values.dedup();
        values
    }

    /// Whether every unseen card is in the opponent's hand: from the last
    /// deal on, a player who counts knows both hands.
    pub fn perfect_information(&self) -> bool {
        self.undealt == 0
    }

    /// The moves offered to this player for play, if it is their turn: see
    /// [`moves::candidate_moves`].
    pub fn candidates(&self) -> Vec<Move> {
        if self.to_move != Some(self.me) {
            return Vec::new();
        }
        moves::candidate_moves(&self.rules, &self.table, self.hand, self.me)
    }

    /// Every legal move for this player, if it is their turn. Exhaustive:
    /// exponential on a crowded table.
    pub fn legal_moves(&self) -> Vec<Move> {
        if self.to_move != Some(self.me) {
            return Vec::new();
        }
        moves::legal_moves(&self.rules, &self.table, self.hand, self.me)
    }

    /// Whether `card` could be in the opponent's hand, as far as this player
    /// can tell.
    pub fn could_be_held(&self, card: Card) -> bool {
        self.unseen().contains(card)
    }
}

/// Draws the opponent's hidden hand and the undealt order, consistent with
/// `view`: the opponent holds `view.opponent_holds` unseen cards, among them a
/// card for every build they control. Exact (rejection sampling) when the
/// constraints are loose, as they almost always are; if a thousand draws all
/// fail, a card for each required value is placed first, which is slightly
/// biased but always consistent.
pub fn sample_hidden(view: &View, rng: &mut Rng) -> (CardSet, Vec<Card>) {
    let mut pool: Vec<Card> = view.unseen().iter().collect();
    let n = view.opponent_holds as usize;
    debug_assert_eq!(
        pool.len(),
        n + view.undealt as usize,
        "the unseen cards are the opponent's and the undealt"
    );
    let must = view.opponent_must_hold();
    let holds_all = |hidden: CardSet| must.iter().all(|&v| view.rules.holds_value(hidden, v));
    for _ in 0..1000 {
        rng.shuffle(&mut pool);
        let hidden: CardSet = pool[..n].iter().copied().collect();
        if holds_all(hidden) {
            return (hidden, pool[n..].to_vec());
        }
    }
    // Place a card for each required value first, then fill at random.
    rng.shuffle(&mut pool);
    let mut hidden = CardSet::EMPTY;
    for &v in &must {
        if view.rules.holds_value(hidden, v) {
            continue;
        }
        let rank = if v == 14 { crate::cards::ACE } else { v };
        if let Some(i) = pool.iter().position(|c| c.rank() == rank) {
            hidden.insert(pool.swap_remove(i));
        }
    }
    while (hidden.len() as usize) < n {
        hidden.insert(pool.pop().expect("enough unseen cards"));
    }
    (hidden, pool)
}

impl View {
    /// A whole hand consistent with this view: the opponent holding `hidden`
    /// and the undealt cards in the order `undealt`.
    pub fn world(&self, hidden: CardSet, undealt: &[Card]) -> Hand {
        let mut hands = [CardSet::EMPTY; 2];
        hands[self.me.index()] = self.hand;
        hands[self.opponent().index()] = hidden;
        Hand::from_parts(
            self.rules,
            self.dealer,
            self.deal,
            self.to_move,
            hands,
            self.table,
            self.piles,
            self.sweeps,
            self.last_capturer,
            undealt,
        )
    }

    /// A world drawn at random among those consistent with this view.
    pub fn sample_world(&self, rng: &mut Rng) -> Hand {
        let (hidden, undealt) = sample_hidden(self, rng);
        self.world(hidden, &undealt)
    }
}

impl Hand {
    /// What `seat` can see of this hand, with the game's totals before it.
    pub fn view(&self, seat: Seat, scores: [u32; 2]) -> View {
        View {
            rules: *self.rules(),
            me: seat,
            dealer: self.dealer(),
            deal: self.deal_number(),
            to_move: self.to_move(),
            hand: self.hand_of(seat),
            table: *self.table(),
            piles: [self.pile(Seat::South), self.pile(Seat::North)],
            sweeps: [self.sweeps(Seat::South), self.sweeps(Seat::North)],
            last_capturer: self.last_capturer(),
            opponent_holds: self.hand_of(seat.other()).len() as u8,
            undealt: self.undealt().len() as u8,
            scores,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cards::pack;
    use crate::rng::Rng;

    fn shuffled(seed: u64) -> [Card; 52] {
        let mut deck = pack();
        Rng::seeded(seed).shuffle(&mut deck);
        deck
    }

    /// The same hand, with the cards `seat` cannot see dealt differently:
    /// the opponent's hand and the undealt cards shuffled together and
    /// redistributed. Everything `seat` can see is unchanged.
    fn reshuffle_hidden(h: &Hand, seat: Seat, seed: u64) -> Hand {
        let opp = seat.other();
        let mut hidden: Vec<Card> = h
            .hand_of(opp)
            .iter()
            .chain(h.undealt().iter().copied())
            .collect();
        Rng::seeded(seed).shuffle(&mut hidden);
        let n = h.hand_of(opp).len() as usize;
        let opp_hand: CardSet = hidden[..n].iter().copied().collect();
        h.with_hidden(opp, opp_hand, &hidden[n..])
    }

    #[test]
    fn a_view_shows_your_hand_the_table_and_the_piles() {
        let (h, _) = Hand::deal(Rules::CLASSIC, Seat::North, pack());
        let v = h.view(Seat::South, [3, 5]);
        assert_eq!(v.hand, h.hand_of(Seat::South));
        assert_eq!(v.table, *h.table());
        assert_eq!(v.opponent_holds, 4);
        assert_eq!(v.undealt, 40);
        assert_eq!(v.scores, [3, 5]);
        assert_eq!(v.to_move, Some(Seat::South));
        assert_eq!(
            v.unseen(),
            h.hand_of(Seat::North) | h.undealt().iter().copied().collect()
        );
        assert!(!v.perfect_information());
    }

    #[test]
    fn a_view_never_depends_on_what_cannot_be_seen() {
        // The leak test: move the hidden cards around; the view must not move.
        for seed in 0..200 {
            let mut rng = Rng::seeded(seed);
            let (mut h, _) = Hand::deal(Rules::ROYAL, Seat::South, shuffled(seed));
            for _ in 0..rng.below(40) {
                if h.to_move().is_none() {
                    break;
                }
                let moves = h.legal_moves();
                h.play(&moves[rng.below(moves.len() as u64) as usize])
                    .unwrap();
            }
            for seat in Seat::BOTH {
                let other = reshuffle_hidden(&h, seat, seed + 1000);
                assert_eq!(
                    h.view(seat, [0, 0]),
                    other.view(seat, [0, 0]),
                    "seed {seed}"
                );
            }
        }
    }

    #[test]
    fn the_leak_test_catches_a_planted_leak() {
        // A view that told you the opponent's lowest card would differ
        // between the two deals: the comparison above has the power to see it.
        let (h, _) = Hand::deal(Rules::CLASSIC, Seat::South, shuffled(3));
        let differs = (0..20).any(|s| {
            let other = reshuffle_hidden(&h, Seat::South, s);
            other.hand_of(Seat::North).first() != h.hand_of(Seat::North).first()
        });
        assert!(differs);
    }

    #[test]
    fn a_controlled_build_announces_a_card() {
        let rules = Rules::CLASSIC;
        let table =
            Table::parse(&rules, "[8 @N: 5S 3H] [8* @N: 6D 2C 8H] [9 @S: 6C 3D] 4C").unwrap();
        let (h, _) = Hand::deal(rules, Seat::North, pack());
        let h = h.with_table(table);
        let v = h.view(Seat::South, [0, 0]);
        assert_eq!(v.opponent_must_hold(), vec![8]);
        let w = h.view(Seat::North, [0, 0]);
        assert_eq!(w.opponent_must_hold(), vec![9]);
    }

    #[test]
    fn the_last_deal_is_perfect_information() {
        let mut rng = Rng::seeded(9);
        let (mut h, _) = Hand::deal(Rules::CLASSIC, Seat::South, shuffled(9));
        while h.deal_number() < 6 {
            assert!(!h.view(Seat::South, [0, 0]).perfect_information());
            let moves = h.legal_moves();
            h.play(&moves[rng.below(moves.len() as u64) as usize])
                .unwrap();
        }
        for seat in Seat::BOTH {
            let v = h.view(seat, [0, 0]);
            assert!(v.perfect_information());
            assert_eq!(v.unseen(), h.hand_of(seat.other()));
        }
    }

    #[test]
    fn a_sampled_world_is_consistent_with_the_view() {
        for seed in 0..300 {
            let mut rng = Rng::seeded(seed);
            let (mut h, _) = Hand::deal(Rules::ROYAL, Seat::North, shuffled(seed));
            for _ in 0..rng.below(46) {
                if h.to_move().is_none() {
                    break;
                }
                let moves = h.legal_moves();
                h.play(&moves[rng.below(moves.len() as u64) as usize])
                    .unwrap();
            }
            if h.is_over() {
                continue;
            }
            for seat in Seat::BOTH {
                let v = h.view(seat, [0, 0]);
                let world = v.sample_world(&mut rng);
                // Everything the seat can see is the same in the world.
                assert_eq!(world.view(seat, [0, 0]), v, "seed {seed}");
                // The opponent holds a card for each build they control.
                for value in v.opponent_must_hold() {
                    assert!(
                        v.rules.holds_value(world.hand_of(seat.other()), value),
                        "seed {seed}"
                    );
                }
                // And the world is a real hand: it plays out.
                let mut w = world;
                while w.to_move().is_some() {
                    let m = w.candidates()[0];
                    w.play(&m).unwrap();
                }
            }
        }
    }

    #[test]
    fn sampling_is_uniform_over_the_unseen_cards() {
        // At the first deal, with no builds, each unseen card is in the
        // opponent's hand with probability 4/44.
        let (h, _) = Hand::deal(Rules::CLASSIC, Seat::North, shuffled(1));
        let v = h.view(Seat::South, [0, 0]);
        let mut rng = Rng::seeded(2);
        let mut counts = [0u32; 52];
        let n = 44_000;
        for _ in 0..n {
            let (hidden, _) = sample_hidden(&v, &mut rng);
            for c in hidden {
                counts[c.index() as usize] += 1;
            }
        }
        for c in v.unseen() {
            let p = f64::from(counts[c.index() as usize]) / f64::from(n);
            assert!((p - 4.0 / 44.0).abs() < 0.01, "{c}: {p}");
        }
        assert!(v.hand.iter().all(|c| counts[c.index() as usize] == 0));
    }

    #[test]
    fn a_controlled_build_is_honoured_even_when_rare() {
        // North controls a 9-build and holds one card; of the nine unseen
        // cards only 9♥ is a nine, so North's card must be 9♥.
        let rules = Rules::CLASSIC;
        let hand = CardSet::parse("2C 3C").unwrap();
        let table = Table::parse(&rules, "7D [9 @N: 5S 4S]").unwrap();
        let unseen = CardSet::parse("9H 2D 3D 4D 5D 6D 7H 8H TH").unwrap();
        let v = View {
            rules,
            me: Seat::South,
            dealer: Seat::North,
            deal: 5,
            to_move: Some(Seat::South),
            hand,
            table,
            piles: [!(hand | table.cards() | unseen), CardSet::EMPTY],
            sweeps: [0, 0],
            last_capturer: Some(Seat::South),
            opponent_holds: 1,
            undealt: 8,
            scores: [0, 0],
        };
        assert_eq!(v.unseen(), unseen);
        let mut rng = Rng::seeded(3);
        for _ in 0..50 {
            let (hidden, undealt) = sample_hidden(&v, &mut rng);
            assert_eq!(hidden, CardSet::parse("9H").unwrap());
            assert_eq!(undealt.len(), 8);
        }
    }

    #[test]
    fn a_view_offers_the_moves_only_on_your_turn() {
        let (h, _) = Hand::deal(Rules::CLASSIC, Seat::North, shuffled(4));
        assert_eq!(h.view(Seat::South, [0, 0]).legal_moves(), h.legal_moves());
        assert_eq!(h.view(Seat::South, [0, 0]).candidates(), h.candidates());
        assert!(h.view(Seat::North, [0, 0]).legal_moves().is_empty());
        assert!(h.view(Seat::North, [0, 0]).candidates().is_empty());
    }
}
