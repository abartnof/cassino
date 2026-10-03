//! A game: the cut for the first deal, then hands until someone reaches 21
//! (`docs/RULES.md` rules 2 and 10).
//!
//! A seed fixes the whole game: the cut draws from one stream and the deals
//! from another, so the same seed gives the same cards natively and in
//! WebAssembly, however the players think.

use crate::cards::{pack, Card, CardSet};
use crate::hand::{Events, Hand};
use crate::moves::{Illegal, Move};
use crate::rng::{purpose, Rng};
use crate::rules::Rules;
use crate::scoring::Breakdown;
use crate::table::Seat;

/// The score that wins.
pub const TARGET: u32 = 21;

/// One cut for the deal: the card each player showed.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Cut {
    pub south: Card,
    pub north: Card,
}

/// Cuts until the ranks differ; the low card deals, the ace low. Returns
/// every cut, the deciding one last, and the dealer.
pub fn cut_for_deal(rng: &mut Rng) -> (Vec<Cut>, Seat) {
    let mut cuts = Vec::new();
    loop {
        // Each shows a card from the shuffled pack: two different cards.
        let south = rng.below(52) as u8;
        let mut north = rng.below(51) as u8;
        if north >= south {
            north += 1;
        }
        let cut = Cut {
            south: Card::from_index(south),
            north: Card::from_index(north),
        };
        cuts.push(cut);
        match cut.south.rank().cmp(&cut.north.rank()) {
            std::cmp::Ordering::Less => return (cuts, Seat::South),
            std::cmp::Ordering::Greater => return (cuts, Seat::North),
            std::cmp::Ordering::Equal => continue,
        }
    }
}

/// Who has won, given the totals after a hand: whoever has reached 21, or if
/// both have, the higher; nobody yet if neither has, or if both have and
/// they are equal.
pub fn winner_of(scores: [u32; 2]) -> Option<Seat> {
    let [south, north] = scores;
    match (south >= TARGET, north >= TARGET) {
        (false, false) => None,
        (true, false) => Some(Seat::South),
        (false, true) => Some(Seat::North),
        (true, true) => match south.cmp(&north) {
            std::cmp::Ordering::Greater => Some(Seat::South),
            std::cmp::Ordering::Less => Some(Seat::North),
            std::cmp::Ordering::Equal => None,
        },
    }
}

/// A game of Cassino.
#[derive(Clone, Debug)]
pub struct Game {
    rules: Rules,
    deals: Rng,
    cuts: Vec<Cut>,
    first_dealer: Seat,
    hand: Hand,
    scores: [u32; 2],
    history: Vec<Breakdown>,
    winner: Option<Seat>,
    /// Each hand's dealer and shuffled deck, for the replay after the game.
    decks: Vec<(Seat, [Card; 52])>,
}

impl Game {
    /// Cuts for the deal and deals the first hand. Also returns the first
    /// hand's opening events.
    pub fn new(rules: Rules, seed: u64) -> (Game, Events) {
        let (cuts, dealer) = cut_for_deal(&mut Rng::stream(seed, purpose::CUT));
        let mut deals = Rng::stream(seed, purpose::DEALS);
        let deck = shuffle(&mut deals);
        let (hand, events) = Hand::deal(rules, dealer, deck);
        let game = Game {
            rules,
            deals,
            cuts,
            first_dealer: dealer,
            hand,
            scores: [0, 0],
            history: Vec::new(),
            winner: None,
            decks: vec![(dealer, deck)],
        };
        (game, events)
    }

    pub fn rules(&self) -> &Rules {
        &self.rules
    }

    pub fn cuts(&self) -> &[Cut] {
        &self.cuts
    }

    pub fn first_dealer(&self) -> Seat {
        self.first_dealer
    }

    pub fn hand(&self) -> &Hand {
        &self.hand
    }

    /// The totals of finished hands.
    pub fn scores(&self) -> [u32; 2] {
        self.scores
    }

    /// The count of each finished hand, in order.
    pub fn history(&self) -> &[Breakdown] {
        &self.history
    }

    pub fn winner(&self) -> Option<Seat> {
        self.winner
    }

    /// Makes a move in the current hand. When it ends the hand, its count is
    /// added to the totals and the winner, if any, is decided.
    pub fn play(&mut self, mv: &Move) -> Result<Events, Illegal> {
        let events = self.hand.play(mv)?;
        if let Some(b) = self.hand.breakdown() {
            for seat in Seat::BOTH {
                self.scores[seat.index()] += u32::from(b.points(seat));
            }
            self.history.push(b);
            self.winner = winner_of(self.scores);
        }
        Ok(events)
    }

    /// Deals the next hand, the deal passing to the other player. `None` if
    /// the current hand is not over or the game is.
    pub fn next_hand(&mut self) -> Option<Events> {
        if !self.hand.is_over() || self.winner.is_some() {
            return None;
        }
        let dealer = self.hand.dealer().other();
        let deck = shuffle(&mut self.deals);
        let (hand, events) = Hand::deal(self.rules, dealer, deck);
        self.hand = hand;
        self.decks.push((dealer, deck));
        Some(events)
    }

    /// Every hand's deals, `[south, north, table]` each, with its dealer:
    /// what was dealt to whom, for the replay with both hands face up. Only
    /// once the game is over, so nothing can be seen early.
    pub fn deals(&self) -> Option<Vec<(Seat, Vec<[CardSet; 3]>)>> {
        self.winner?;
        Some(
            self.decks
                .iter()
                .map(|(dealer, deck)| (*dealer, crate::hand::deals_of(*dealer, deck)))
                .collect(),
        )
    }
}

/// A freshly shuffled pack.
fn shuffle(rng: &mut Rng) -> [Card; 52] {
    let mut deck = pack();
    rng.shuffle(&mut deck);
    deck
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::hand::Event;
    use crate::rules::Game as Kind;

    #[test]
    fn whoever_reaches_21_wins_and_the_higher_if_both_do() {
        assert_eq!(winner_of([21, 10]), Some(Seat::South));
        assert_eq!(winner_of([10, 21]), Some(Seat::North));
        assert_eq!(winner_of([22, 21]), Some(Seat::South));
        assert_eq!(winner_of([25, 30]), Some(Seat::North));
        assert_eq!(winner_of([21, 21]), None, "equal: another hand");
        assert_eq!(winner_of([20, 20]), None);
        assert_eq!(winner_of([0, 0]), None);
    }

    #[test]
    fn low_deals_and_equal_ranks_cut_again() {
        let mut recut = 0;
        for seed in 0..500 {
            let (cuts, dealer) = cut_for_deal(&mut Rng::seeded(seed));
            let (last, earlier) = cuts.split_last().unwrap();
            assert!(earlier.iter().all(|c| c.south.rank() == c.north.rank()));
            assert_ne!(last.south.rank(), last.north.rank());
            assert_ne!(last.south, last.north);
            let low = if last.south.rank() < last.north.rank() {
                Seat::South
            } else {
                Seat::North
            };
            assert_eq!(dealer, low);
            recut += usize::from(!earlier.is_empty());
        }
        // Equal ranks come up about one cut in seventeen (3/51).
        assert!((10..70).contains(&recut), "{recut}");
    }

    /// Plays a whole game at random.
    fn random_game(rules: Rules, seed: u64) -> (Game, Vec<Seat>) {
        let mut rng = Rng::seeded(seed ^ 77);
        let (mut g, _) = Game::new(rules, seed);
        let mut dealers = vec![g.hand().dealer()];
        loop {
            while g.hand().to_move().is_some() {
                let moves = g.hand().legal_moves();
                let mv = moves[rng.below(moves.len() as u64) as usize];
                g.play(&mv).unwrap();
            }
            match g.next_hand() {
                Some(_) => dealers.push(g.hand().dealer()),
                None => break,
            }
        }
        (g, dealers)
    }

    #[test]
    fn a_game_runs_to_21_with_the_deal_alternating() {
        for rules in [Rules::CLASSIC, Rules::ROYAL] {
            for seed in 0..60 {
                let (g, dealers) = random_game(rules, seed);
                let winner = g.winner().expect("a game ends with a winner");
                let s = g.scores();
                assert!(s[winner.index()] >= TARGET);
                assert!(s[winner.index()] > s[winner.other().index()]);
                for seat in Seat::BOTH {
                    let sum: u32 = g.history().iter().map(|b| u32::from(b.points(seat))).sum();
                    assert_eq!(sum, s[seat.index()]);
                }
                assert_eq!(dealers[0], g.first_dealer());
                assert!(dealers.windows(2).all(|w| w[0] != w[1]), "{dealers:?}");
                assert_eq!(g.history().len(), dealers.len());
                // Totals before the last hand had no winner.
                let before: Vec<u32> = Seat::BOTH
                    .iter()
                    .map(|&seat| {
                        s[seat.index()] - u32::from(g.history().last().unwrap().points(seat))
                    })
                    .collect();
                assert_eq!(winner_of([before[0], before[1]]), None);
            }
        }
    }

    #[test]
    fn a_seed_fixes_the_game() {
        let (a, _) = random_game(Rules::ROYAL, 42);
        let (b, _) = random_game(Rules::ROYAL, 42);
        assert_eq!(a.scores(), b.scores());
        assert_eq!(a.history(), b.history());
        assert_eq!(a.cuts(), b.cuts());
        let (c, _) = Game::new(Rules::ROYAL, 43);
        let (d, _) = Game::new(Rules::ROYAL, 42);
        assert_ne!(c.hand().undealt(), d.hand().undealt());
    }

    #[test]
    fn moves_wait_for_the_next_hand_and_the_game_ends() {
        let (mut g, opening) = Game::new(Rules::CLASSIC, 5);
        assert_eq!(
            opening.as_slice()[0],
            Event::Dealt {
                deal: 1,
                last: false
            }
        );
        assert!(g.next_hand().is_none(), "the hand is not over");
        let mut rng = Rng::seeded(1);
        while g.hand().to_move().is_some() {
            let moves = g.hand().legal_moves();
            g.play(&moves[rng.below(moves.len() as u64) as usize])
                .unwrap();
        }
        let any = pack()[0];
        assert_eq!(g.play(&Move::Trail { card: any }), Err(Illegal::HandIsOver));
        assert_eq!(g.history().len(), 1);
        let rules = Rules {
            game: Kind::Classic,
            aces_fourteen: false,
            sweeps: true,
        };
        assert_eq!(*g.rules(), rules);
    }
}
