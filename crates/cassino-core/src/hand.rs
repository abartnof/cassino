//! One hand: a pass through the pack in six deals (`docs/RULES.md` rules 2,
//! 3, 8 and 9), ending in the count.
//!
//! A `Hand` is a plain value that copies without allocating, so a search can
//! clone it freely. Each move returns the events it caused. The session keeps
//! them as the log that drives scoring, narration, the trackers and the
//! animation (`docs/DESIGN.md` §8).

use crate::cards::{Card, CardSet, ACE};
use crate::moves::{self, Illegal, Move};
use crate::rules::Rules;
use crate::scoring::Breakdown;
use crate::table::{Seat, Table};

/// The pile size that wins most cards outright, and the spade count that
/// wins most spades: the moments players claim them mid-hand [02-S1].
pub const CARDS_CLINCH: u32 = 27;
pub const SPADES_CLINCH: u32 = 7;

/// What a clinch won.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Clinch {
    Cards,
    Spades,
}

/// Something that happened at the table.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Event {
    /// A deal, 1 to 6; the sixth is announced "last".
    Dealt { deal: u8, last: bool },
    /// A move, as made.
    Played { seat: Seat, mv: Move },
    /// The capture just played emptied the table.
    Swept { seat: Seat },
    /// An ace took an ace: "cash".
    Cash { seat: Seat },
    /// A pile reached 27 cards or 7 spades: that point is won.
    Clinched { seat: Seat, what: Clinch },
    /// The cards left at the end, to the last capturer (or to nobody).
    Residue { seat: Option<Seat>, cards: CardSet },
    /// The count.
    Scored(Breakdown),
}

/// The events of one move: at most a handful, kept inline.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Events {
    items: [Event; 8],
    len: u8,
}

impl Events {
    fn new() -> Events {
        Events {
            items: [Event::Dealt {
                deal: 0,
                last: false,
            }; 8],
            len: 0,
        }
    }

    fn push(&mut self, e: Event) {
        self.items[self.len as usize] = e;
        self.len += 1;
    }

    pub fn as_slice(&self) -> &[Event] {
        &self.items[..self.len as usize]
    }

    pub fn iter(&self) -> std::slice::Iter<'_, Event> {
        self.as_slice().iter()
    }
}

impl<'a> IntoIterator for &'a Events {
    type Item = &'a Event;
    type IntoIter = std::slice::Iter<'a, Event>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

/// One hand of Cassino.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub struct Hand {
    rules: Rules,
    dealer: Seat,
    deck: [Card; 52],
    /// How many cards of `deck` have been dealt.
    dealt: u8,
    hands: [CardSet; 2],
    table: Table,
    piles: [CardSet; 2],
    sweeps: [u8; 2],
    last_capturer: Option<Seat>,
    deal: u8,
    to_move: Seat,
    over: bool,
}

impl Hand {
    /// Starts a hand from a shuffled `deck`, dealing the first round in
    /// pagat's order: two to the non-dealer, two to the table, two to the
    /// dealer, twice.
    pub fn deal(rules: Rules, dealer: Seat, deck: [Card; 52]) -> (Hand, Events) {
        let mut hand = Hand {
            rules,
            dealer,
            deck,
            dealt: 0,
            hands: [CardSet::EMPTY; 2],
            table: Table::new(),
            piles: [CardSet::EMPTY; 2],
            sweeps: [0; 2],
            last_capturer: None,
            deal: 0,
            to_move: dealer.other(),
            over: false,
        };
        let mut events = Events::new();
        hand.deal_round(&mut events);
        (hand, events)
    }

    /// Deals the next round: in twos, to the non-dealer, the table (first
    /// deal only) and the dealer, twice.
    fn deal_round(&mut self, events: &mut Events) {
        let first = self.deal == 0;
        let elder = self.dealer.other();
        for _ in 0..2 {
            let two = self.draw(2);
            self.hands[elder.index()] |= two;
            if first {
                let two = self.draw(2);
                self.table.loose |= two;
            }
            let two = self.draw(2);
            self.hands[self.dealer.index()] |= two;
        }
        self.deal += 1;
        self.to_move = elder;
        events.push(Event::Dealt {
            deal: self.deal,
            last: self.dealt == 52,
        });
    }

    fn draw(&mut self, n: u8) -> CardSet {
        let from = self.dealt as usize;
        self.dealt += n;
        self.deck[from..self.dealt as usize]
            .iter()
            .copied()
            .collect()
    }

    pub fn rules(&self) -> &Rules {
        &self.rules
    }

    pub fn dealer(&self) -> Seat {
        self.dealer
    }

    /// Whose turn it is, or `None` once the hand is over.
    pub fn to_move(&self) -> Option<Seat> {
        (!self.over).then_some(self.to_move)
    }

    pub fn is_over(&self) -> bool {
        self.over
    }

    pub fn table(&self) -> &Table {
        &self.table
    }

    pub fn hand_of(&self, seat: Seat) -> CardSet {
        self.hands[seat.index()]
    }

    pub fn pile(&self, seat: Seat) -> CardSet {
        self.piles[seat.index()]
    }

    pub fn sweeps(&self, seat: Seat) -> u8 {
        self.sweeps[seat.index()]
    }

    pub fn last_capturer(&self) -> Option<Seat> {
        self.last_capturer
    }

    /// The current deal, 1 to 6.
    pub fn deal_number(&self) -> u8 {
        self.deal
    }

    /// The cards not yet dealt, in the order they will be.
    pub fn undealt(&self) -> &[Card] {
        &self.deck[self.dealt as usize..]
    }

    /// The legal moves for the player to move; empty once the hand is over.
    pub fn legal_moves(&self) -> Vec<Move> {
        if self.over {
            return Vec::new();
        }
        moves::legal_moves(
            &self.rules,
            &self.table,
            self.hands[self.to_move.index()],
            self.to_move,
        )
    }

    /// The moves offered for play to the player to move: see
    /// [`moves::candidate_moves`].
    pub fn candidates(&self) -> Vec<Move> {
        if self.over {
            return Vec::new();
        }
        moves::candidate_moves(
            &self.rules,
            &self.table,
            self.hands[self.to_move.index()],
            self.to_move,
        )
    }

    /// Whether the player to move may make `mv`.
    pub fn check(&self, mv: &Move) -> Result<(), Illegal> {
        if self.over {
            return Err(Illegal::HandIsOver);
        }
        moves::check(
            &self.rules,
            &self.table,
            self.hands[self.to_move.index()],
            self.to_move,
            mv,
        )
    }

    /// Makes a move for the player to move.
    pub fn play(&mut self, mv: &Move) -> Result<Events, Illegal> {
        self.check(mv)?;
        let seat = self.to_move;
        let mut events = Events::new();
        events.push(Event::Played { seat, mv: *mv });
        let before = self.piles[seat.index()];
        let played = moves::apply(
            &self.rules,
            &mut self.table,
            &mut self.hands[seat.index()],
            seat,
            mv,
        );
        if !played.won.is_empty() {
            self.piles[seat.index()] |= played.won;
            self.last_capturer = Some(seat);
            if played.swept {
                self.sweeps[seat.index()] += 1;
                events.push(Event::Swept { seat });
            }
            if mv.card().rank() == ACE
                && !(played.won.without(mv.card()) & CardSet::of_rank(ACE)).is_empty()
            {
                events.push(Event::Cash { seat });
            }
            self.push_clinches(seat, before, &mut events);
        }
        self.to_move = seat.other();
        if self.hands[0].is_empty() && self.hands[1].is_empty() {
            if self.dealt < 52 {
                self.deal_round(&mut events);
            } else {
                self.finish(&mut events);
            }
        }
        Ok(events)
    }

    /// Announces a pile's reaching 27 cards or 7 spades.
    fn push_clinches(&self, seat: Seat, before: CardSet, events: &mut Events) {
        let after = self.piles[seat.index()];
        if before.len() < CARDS_CLINCH && after.len() >= CARDS_CLINCH {
            events.push(Event::Clinched {
                seat,
                what: Clinch::Cards,
            });
        }
        if before.spades() < SPADES_CLINCH && after.spades() >= SPADES_CLINCH {
            events.push(Event::Clinched {
                seat,
                what: Clinch::Spades,
            });
        }
    }

    /// The end of the hand: the residue to the last capturer, then the count.
    fn finish(&mut self, events: &mut Events) {
        let cards = self.table.cards();
        self.table = Table::new();
        events.push(Event::Residue {
            seat: self.last_capturer,
            cards,
        });
        if let Some(seat) = self.last_capturer {
            let before = self.piles[seat.index()];
            self.piles[seat.index()] |= cards;
            self.push_clinches(seat, before, events);
        }
        self.over = true;
        events.push(Event::Scored(self.breakdown().expect("over")));
    }

    /// The same hand with what `seat` holds and the undealt cards replaced:
    /// a world consistent with what `seat`'s opponent can see, for a search
    /// that samples the hidden cards. `undealt` must have as many cards as
    /// are still to be dealt, and with `hand` must be exactly the cards they
    /// replace.
    pub fn with_hidden(&self, seat: Seat, hand: CardSet, undealt: &[Card]) -> Hand {
        let from = self.dealt as usize;
        assert_eq!(undealt.len(), 52 - from, "as many undealt cards as remain");
        let replaced = self.hands[seat.index()] | self.undealt().iter().copied().collect();
        let with: CardSet = undealt.iter().copied().collect::<CardSet>() | hand;
        assert_eq!(with, replaced, "the same cards, redistributed");
        assert_eq!(
            hand.len(),
            self.hands[seat.index()].len(),
            "the same number in hand"
        );
        let mut world = *self;
        world.hands[seat.index()] = hand;
        world.deck[from..].copy_from_slice(undealt);
        world
    }

    /// A hand assembled from its parts: what each player holds, the table,
    /// the piles and sweeps, and the undealt cards in the order they will be
    /// dealt. `to_move` is `None` for a hand that is over. Used to rebuild a
    /// world from a view; the parts must account for all 52 cards.
    #[allow(clippy::too_many_arguments)]
    pub fn from_parts(
        rules: Rules,
        dealer: Seat,
        deal: u8,
        to_move: Option<Seat>,
        hands: [CardSet; 2],
        table: Table,
        piles: [CardSet; 2],
        sweeps: [u8; 2],
        last_capturer: Option<Seat>,
        undealt: &[Card],
    ) -> Hand {
        assert_eq!(
            undealt.len() % 8,
            0,
            "two players are dealt eight cards a round"
        );
        let later: CardSet = undealt.iter().copied().collect();
        let out = hands[0] | hands[1] | table.cards() | piles[0] | piles[1];
        assert!(
            out.is_disjoint(later) && (out | later) == CardSet::FULL,
            "the parts are the pack"
        );
        let mut deck = [Card::from_index(0); 52];
        let dealt = 52 - undealt.len();
        for (slot, card) in deck.iter_mut().zip(out.iter()) {
            *slot = card;
        }
        deck[dealt..].copy_from_slice(undealt);
        Hand {
            rules,
            dealer,
            deck,
            dealt: dealt as u8,
            hands,
            table,
            piles,
            sweeps,
            last_capturer,
            deal,
            to_move: to_move.unwrap_or(dealer.other()),
            over: to_move.is_none(),
        }
    }

    /// The same hand with another table, for tests that need a position.
    #[cfg(test)]
    pub(crate) fn with_table(&self, table: Table) -> Hand {
        Hand { table, ..*self }
    }

    /// The count, once the hand is over.
    pub fn breakdown(&self) -> Option<Breakdown> {
        self.over
            .then(|| Breakdown::new(&self.rules, self.piles, self.sweeps))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cards::pack;
    use crate::rng::Rng;
    use crate::rules::Game;

    const ROYAL_14: Rules = Rules {
        game: Game::Royal,
        aces_fourteen: true,
        sweeps: true,
    };

    fn set(s: &str) -> CardSet {
        CardSet::parse(s).unwrap()
    }

    fn shuffled(seed: u64) -> [Card; 52] {
        let mut deck = pack();
        Rng::seeded(seed).shuffle(&mut deck);
        deck
    }

    /// Every card is in exactly one place.
    fn assert_conserved(h: &Hand) {
        let places = [
            h.hand_of(Seat::South),
            h.hand_of(Seat::North),
            h.table().cards(),
            h.pile(Seat::South),
            h.pile(Seat::North),
            h.undealt().iter().copied().collect(),
        ];
        let mut all = CardSet::EMPTY;
        for p in places {
            assert!(all.is_disjoint(p), "a card in two places");
            all |= p;
        }
        assert_eq!(all, CardSet::FULL);
    }

    #[test]
    fn the_first_deal_goes_in_twos() {
        // The pack in index order: AS 2S 3S ... so the deal is legible.
        let (h, events) = Hand::deal(Rules::CLASSIC, Seat::North, pack());
        assert_eq!(h.hand_of(Seat::South), set("AS 2S 7S 8S"));
        assert_eq!(h.table().loose, set("3S 4S 9S TS"));
        assert_eq!(h.hand_of(Seat::North), set("5S 6S JS QS"));
        assert_eq!(h.to_move(), Some(Seat::South), "the non-dealer leads");
        assert_eq!(
            events.as_slice(),
            &[Event::Dealt {
                deal: 1,
                last: false
            }]
        );
        assert_eq!(h.deal_number(), 1);
        assert_eq!(h.undealt().len(), 40);
        assert_conserved(&h);
    }

    #[test]
    fn turns_alternate_and_a_new_deal_follows_empty_hands() {
        let (mut h, _) = Hand::deal(Rules::CLASSIC, Seat::North, pack());
        let mut last = Vec::new();
        let mut movers = Vec::new();
        for _ in 0..8 {
            let seat = h.to_move().unwrap();
            movers.push(seat.letter());
            let card = h.hand_of(seat).first().unwrap();
            last = h.play(&Move::Trail { card }).unwrap().as_slice().to_vec();
        }
        assert_eq!(movers.iter().collect::<String>(), "SNSNSNSN");
        assert_eq!(
            last.last(),
            Some(&Event::Dealt {
                deal: 2,
                last: false
            })
        );
        assert_eq!(h.deal_number(), 2);
        assert_eq!(h.hand_of(Seat::South), set("KS AH 4H 5H"));
        assert_eq!(h.hand_of(Seat::North), set("2H 3H 6H 7H"));
        assert_eq!(h.to_move(), Some(Seat::South));
    }

    #[test]
    fn playing_out_of_turn_is_refused() {
        let (mut h, _) = Hand::deal(Rules::CLASSIC, Seat::North, pack());
        let theirs = h.hand_of(Seat::North).first().unwrap();
        assert_eq!(
            h.play(&Move::Trail { card: theirs }),
            Err(Illegal::NotInHand)
        );
    }

    #[test]
    fn a_hand_with_no_capture_leaves_the_residue_to_nobody() {
        let (mut h, _) = Hand::deal(Rules::CLASSIC, Seat::North, pack());
        let mut dealt = vec![1u8];
        let mut tail = Vec::new();
        while let Some(seat) = h.to_move() {
            let card = h.hand_of(seat).first().unwrap();
            let events = h.play(&Move::Trail { card }).unwrap();
            for e in &events {
                if let Event::Dealt { deal, last } = *e {
                    assert_eq!(last, deal == 6);
                    dealt.push(deal);
                }
            }
            tail = events.as_slice().to_vec();
        }
        assert_eq!(dealt, [1, 2, 3, 4, 5, 6]);
        assert!(matches!(tail[1], Event::Residue { seat: None, cards } if cards == CardSet::FULL));
        let Event::Scored(b) = tail[2] else {
            panic!("{tail:?}")
        };
        assert_eq!(b.total(), 0);
        assert_eq!(h.breakdown(), Some(b));
        assert!(h.legal_moves().is_empty());
        assert_eq!(
            h.play(&Move::Trail { card: pack()[0] }),
            Err(Illegal::HandIsOver)
        );
    }

    /// Plays a hand at random, checking the invariants at every step, and
    /// returns its events.
    fn random_hand(rules: Rules, seed: u64) -> (Hand, Vec<Event>) {
        let mut rng = Rng::seeded(seed);
        let dealer = if seed.is_multiple_of(2) {
            Seat::South
        } else {
            Seat::North
        };
        let (mut h, first) = Hand::deal(rules, dealer, shuffled(seed));
        let mut log: Vec<Event> = first.as_slice().to_vec();
        let mut plays = 0;
        while let Some(seat) = h.to_move() {
            assert_conserved(&h);
            let moves = h.legal_moves();
            assert!(
                !moves.is_empty(),
                "no legal move: {} / {}",
                h.table(),
                h.hand_of(seat)
            );
            let mv = moves[rng.below(moves.len() as u64) as usize];
            log.extend(h.play(&mv).unwrap().iter());
            plays += 1;
        }
        assert_eq!(plays, 48);
        assert_conserved(&h);
        (h, log)
    }

    #[test]
    fn random_hands_keep_every_invariant() {
        for rules in [Rules::CLASSIC, Rules::ROYAL, ROYAL_14] {
            for seed in 0..300 {
                let (h, log) = random_hand(rules, seed);
                assert!(h.table().is_empty(), "the residue is taken");
                let b = h.breakdown().unwrap();
                // The checksum: eleven, or eight with a tie for cards, plus sweeps.
                let base = if b.cards.is_none() { 8 } else { 11 };
                let sweeps = b.sweeps[0] + b.sweeps[1];
                if h.last_capturer().is_some() {
                    assert_eq!(b.total(), base + sweeps, "{rules:?} seed {seed}");
                }
                // The log agrees with the count.
                let swept = |s: Seat| {
                    log.iter()
                        .filter(|e| **e == Event::Swept { seat: s })
                        .count()
                };
                assert_eq!(swept(Seat::South) as u8, b.sweeps[0]);
                assert_eq!(swept(Seat::North) as u8, b.sweeps[1]);
                assert_eq!(log.last(), Some(&Event::Scored(b)));
                let deals = log
                    .iter()
                    .filter(|e| matches!(e, Event::Dealt { .. }))
                    .count();
                assert_eq!(deals, 6);
                // A clinch is announced once, by the eventual winner.
                for (what, winner) in [(Clinch::Cards, b.cards), (Clinch::Spades, b.spades)] {
                    let claims: Vec<Seat> = log
                        .iter()
                        .filter_map(|e| match *e {
                            Event::Clinched { seat, what: w } if w == what => Some(seat),
                            _ => None,
                        })
                        .collect();
                    assert!(claims.len() <= 1, "{claims:?}");
                    if let Some(&seat) = claims.first() {
                        assert_eq!(Some(seat), winner);
                    }
                }
                if b.spades.is_some() {
                    // 13 spades: whoever has most has at least 7.
                    let n = log
                        .iter()
                        .filter(|e| {
                            matches!(
                                e,
                                Event::Clinched {
                                    what: Clinch::Spades,
                                    ..
                                }
                            )
                        })
                        .count();
                    assert_eq!(n, 1, "seed {seed}");
                }
            }
        }
    }

    #[test]
    fn the_residue_goes_to_the_last_capturer_and_is_not_a_sweep() {
        let mut checked = 0;
        for seed in 0..200 {
            let (h, log) = random_hand(Rules::CLASSIC, seed);
            let residue = log.iter().find_map(|e| match *e {
                Event::Residue { seat, cards } => Some((seat, cards)),
                _ => None,
            });
            let (seat, cards) = residue.unwrap();
            assert_eq!(seat, h.last_capturer());
            // A residue means the last play did not empty the table, so the
            // hand's closing events hold no sweep.
            let closing: Vec<&Event> = log.iter().rev().take(3).collect();
            assert!(cards.is_empty() || !closing.iter().any(|e| matches!(e, Event::Swept { .. })));
            checked += usize::from(!cards.is_empty());
        }
        assert!(checked > 100, "most hands leave a residue: {checked}");
    }

    #[test]
    fn cash_is_an_ace_taking_an_ace() {
        // South holds AS; the table has AH.
        let mut deck = pack();
        // Arrange: South (non-dealer) gets AS 2C 3C 4C; table AH 5C 6C 7C.
        let order = [
            "AS", "2C", "AH", "5C", "8D", "9D", "3C", "4C", "6C", "7C", "TD", "JD",
        ];
        for (i, code) in order.iter().enumerate() {
            let card: Card = code.parse().unwrap();
            let j = deck.iter().position(|&c| c == card).unwrap();
            deck.swap(i, j);
        }
        let (mut h, _) = Hand::deal(Rules::CLASSIC, Seat::North, deck);
        assert_eq!(h.hand_of(Seat::South), set("AS 2C 3C 4C"));
        assert_eq!(h.table().loose, set("AH 5C 6C 7C"));
        let events = h.play(&Move::parse("take AS AH").unwrap()).unwrap();
        assert!(events
            .as_slice()
            .contains(&Event::Cash { seat: Seat::South }));
        assert_eq!(h.pile(Seat::South), set("AS AH"));
        assert_eq!(h.last_capturer(), Some(Seat::South));
    }

    #[test]
    fn legal_moves_match_the_reference_in_real_play() {
        // Positions from random play, where builds arise as they do at the
        // table. Crowded tables are skipped: the reference is exponential.
        let mut compared = 0;
        for rules in [Rules::CLASSIC, Rules::ROYAL, ROYAL_14] {
            for seed in 0..40 {
                let mut rng = Rng::seeded(seed + 7);
                let (mut h, _) = Hand::deal(rules, Seat::South, shuffled(seed + 500));
                while let Some(seat) = h.to_move() {
                    let moves = h.legal_moves();
                    let items = h.table().loose.len() as usize + h.table().builds.len();
                    if items <= 10 {
                        let mut fast: Vec<String> = moves.iter().map(|m| m.to_string()).collect();
                        let mut slow: Vec<String> =
                            crate::reference::legal_moves(&rules, h.table(), h.hand_of(seat), seat)
                                .iter()
                                .map(|m| m.to_string())
                                .collect();
                        fast.sort();
                        slow.sort();
                        assert_eq!(
                            fast,
                            slow,
                            "{rules:?} seed {seed}: {} / {}",
                            h.table(),
                            h.hand_of(seat)
                        );
                        compared += 1;
                    }
                    let mv = moves[rng.below(moves.len() as u64) as usize];
                    h.play(&mv).unwrap();
                }
            }
        }
        assert!(compared > 4000, "{compared}");
    }

    #[test]
    fn a_legal_move_always_exists_even_for_eager_builders() {
        // Random play that builds whenever it can, in every rule set: the
        // positions where builds pile up, and where F1 hid (one ace
        // answering for a 1-build and a 14-build at once).
        for rules in [Rules::CLASSIC, Rules::ROYAL, ROYAL_14] {
            for seed in 0..3_000 {
                let mut rng = Rng::seeded(seed + 70_000);
                let (mut h, _) = Hand::deal(rules, Seat::South, shuffled(seed + 80_000));
                while let Some(seat) = h.to_move() {
                    let moves = h.candidates();
                    assert!(
                        !moves.is_empty(),
                        "{rules:?} seed {seed}: no move at {} / {}",
                        h.table(),
                        h.hand_of(seat)
                    );
                    let builds: Vec<Move> = moves
                        .iter()
                        .copied()
                        .filter(|m| matches!(m, Move::Build { .. }))
                        .collect();
                    let pool = if builds.is_empty() || rng.below(4) == 0 {
                        &moves
                    } else {
                        &builds
                    };
                    h.play(&pool[rng.below(pool.len() as u64) as usize])
                        .unwrap();
                }
            }
        }
    }

    #[test]
    fn a_last_card_sweep_counts_and_leaves_no_residue() {
        // South's last card takes everything left: a sweep, and an empty
        // residue (rules 8 and 9).
        let rules = Rules::CLASSIC;
        let hands = [set("7S"), CardSet::EMPTY];
        let table = Table::parse(&rules, "3H 4D").unwrap();
        let rest: Vec<Card> = (!(hands[0] | hands[1] | table.cards())).iter().collect();
        let piles = [
            rest[..20].iter().copied().collect(),
            rest[20..].iter().copied().collect(),
        ];
        let mut h = Hand::from_parts(
            rules,
            Seat::South,
            6,
            Some(Seat::South),
            hands,
            table,
            piles,
            [0, 0],
            Some(Seat::North),
            &[],
        );
        let events = h.play(&Move::parse("take 7S 3H 4D").unwrap()).unwrap();
        assert!(events
            .as_slice()
            .contains(&Event::Swept { seat: Seat::South }));
        assert!(events.as_slice().contains(&Event::Residue {
            seat: Some(Seat::South),
            cards: CardSet::EMPTY
        }));
        assert_eq!(h.breakdown().unwrap().sweeps, [1, 0]);
    }

    #[test]
    fn a_hand_copies_without_allocating() {
        fn is_copy<T: Copy>() {}
        is_copy::<Hand>();
        is_copy::<Events>();
    }
}
