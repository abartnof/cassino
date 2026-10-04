//! Explanations and hints (`docs/DESIGN.md` §12.3–12.4).
//!
//! Everything here is computed from one observer's [`View`], so nothing it
//! says can reveal a card the observer could not know: notes on the
//! opponent's moves use only what was played and what the observer holds.
//!
//! - **Notes** interpret a move: the points it took, a sweep, a clinch, the
//!   card a build announces, a sweep it leaves open, cards it left behind
//!   (the Dominican *dejado* custom [02-S3]), a build at risk.
//! - **Sweep values**: which single card would clear a table.
//! - **The unseen summary**: the aces, Cassinos and spades still out, for the
//!   card-counting aid.
//! - **Hints** are what the top rung would do in the observer's place, and
//!   **ratings** compare a move with it. The advisor draws from a generator
//!   seeded by the position, so asking twice gives the same answer and
//!   asking changes nothing.

use crate::cards::{Card, CardSet, ACE};
use crate::hand::{Clinch, CARDS_CLINCH, SPADES_CLINCH};
use crate::moves::{self, Move};
use crate::observation::View;
use crate::rng::Rng;
use crate::rules::Rules;
use crate::search::SearchAgent;
use crate::sums::{bounded_unions, partitions_into, subsets_summing};
use crate::table::{Seat, Table};

/// One thing worth saying about a move.
#[derive(Clone, Debug, PartialEq)]
pub enum Note {
    /// The move took these point cards (the Cassinos and aces).
    TookPoints { seat: Seat, cards: CardSet },
    /// The move swept the table.
    Swept { seat: Seat },
    /// An ace took an ace.
    Cash { seat: Seat },
    /// The move reached 27 cards or 7 spades.
    Clinched { seat: Seat, what: Clinch },
    /// A build tells the table its maker holds a card of its value.
    Announces { seat: Seat, value: u8 },
    /// After the move, a single card of one of these values would sweep,
    /// for `next`, who moves next. `held`: the observer is `next` and holds
    /// one; otherwise how many such cards the observer cannot see.
    SweepOpen {
        next: Seat,
        values: Vec<u8>,
        held: bool,
        unseen: u8,
    },
    /// The card played could also have taken these.
    LeftBehind { seat: Seat, cards: CardSet },
    /// The observer's new build: this many cards that could take it are
    /// unseen.
    BuildAtRisk { value: u8, unseen: u8 },
    /// The opponent's build, which the observer holds a card to take.
    CanTakeBuild { value: u8 },
}

/// The values a single card could capture the whole of `table` as: every
/// build of the value and the loose cards in groups of it. A Classic court
/// card sweeps a table holding one card of its rank and nothing else (the
/// value given is its rank).
pub fn sweep_values(rules: &Rules, table: &Table) -> Vec<u8> {
    if table.is_empty() {
        return Vec::new();
    }
    if table.builds.is_empty() && table.loose.len() == 1 {
        let lone = table.loose.first().expect("one card");
        if rules.pairs_only(lone) {
            return vec![lone.rank()];
        }
    }
    (1..=rules.max_build())
        .filter(|&v| {
            table.builds.iter().all(|b| b.value == v) && partitions_into(rules, table.loose, v)
        })
        .collect()
}

/// The cards that capture as `value` (or, for a Classic court, pair with it).
fn capturers(rules: &Rules, value: u8) -> CardSet {
    match value {
        1..=13 => CardSet::of_rank(value),
        14 if rules.game == crate::rules::Game::Royal && rules.aces_fourteen => {
            CardSet::of_rank(ACE)
        }
        _ => CardSet::EMPTY,
    }
}

/// What the observer cannot see that scores on its own, for the counting
/// aid.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Unseen {
    pub aces: CardSet,
    pub big_casino: bool,
    pub little_casino: bool,
    pub spades: u8,
    pub cards: u8,
}

pub fn unseen(view: &View) -> Unseen {
    let u = view.unseen();
    Unseen {
        aces: u & CardSet::of_rank(ACE),
        big_casino: u.contains(Card::BIG_CASINO),
        little_casino: u.contains(Card::LITTLE_CASINO),
        spades: u.spades() as u8,
        cards: u.len() as u8,
    }
}

/// The notes on `mv`, made by `mover`, as `observer_view` (the observer's
/// view just before the move) sees it.
pub fn notes(observer_view: &View, mover: Seat, mv: &Move) -> Vec<Note> {
    let v = observer_view;
    let rules = v.rules;
    let card = mv.card();
    let mut after = v.table;
    let mut played_from = CardSet::single(card);
    let played = moves::apply(&rules, &mut after, &mut played_from, mover, mv);
    let mut out = Vec::new();
    match *mv {
        Move::Capture { taken, .. } => {
            let points = played.won
                & (CardSet::of_rank(ACE)
                    | CardSet::single(Card::BIG_CASINO)
                    | CardSet::single(Card::LITTLE_CASINO));
            if !points.is_empty() {
                out.push(Note::TookPoints {
                    seat: mover,
                    cards: points,
                });
            }
            if played.swept {
                out.push(Note::Swept { seat: mover });
            }
            if card.rank() == ACE && !(taken & CardSet::of_rank(ACE)).is_empty() {
                out.push(Note::Cash { seat: mover });
            }
            let before = v.piles[mover.index()];
            let pile = before | played.won;
            if before.len() < CARDS_CLINCH && pile.len() >= CARDS_CLINCH {
                out.push(Note::Clinched {
                    seat: mover,
                    what: Clinch::Cards,
                });
            }
            if before.spades() < SPADES_CLINCH && pile.spades() >= SPADES_CLINCH {
                out.push(Note::Clinched {
                    seat: mover,
                    what: Clinch::Spades,
                });
            }
        }
        Move::Build { value, .. } => {
            out.push(Note::Announces { seat: mover, value });
            if mover == v.me {
                let unseen = (v.unseen() & capturers(&rules, value)).len() as u8;
                out.push(Note::BuildAtRisk { value, unseen });
            } else if rules.holds_value(v.hand, value) {
                out.push(Note::CanTakeBuild { value });
            }
        }
        Move::Trail { .. } => {}
    }
    if !matches!(mv, Move::Build { .. }) {
        let left = left_behind(&rules, &v.table, mv);
        if !left.is_empty() {
            out.push(Note::LeftBehind {
                seat: mover,
                cards: left,
            });
        }
    }
    let values = sweep_values(&rules, &after);
    if !values.is_empty() {
        let next = mover.other();
        if next == v.me {
            let hand = if mover == v.me {
                v.hand.without(card)
            } else {
                v.hand
            };
            let mine: Vec<u8> = values
                .into_iter()
                .filter(|&x| !(hand & capturers(&rules, x)).is_empty())
                .collect();
            if !mine.is_empty() {
                out.push(Note::SweepOpen {
                    next,
                    values: mine,
                    held: true,
                    unseen: 0,
                });
            }
        } else {
            let unseen = v.unseen();
            let possible: Vec<u8> = values
                .into_iter()
                .filter(|&x| !(unseen & capturers(&rules, x)).is_empty())
                .collect();
            if !possible.is_empty() {
                let count = possible
                    .iter()
                    .fold(CardSet::EMPTY, |acc, &x| {
                        acc | (unseen & capturers(&rules, x))
                    })
                    .len() as u8;
                out.push(Note::SweepOpen {
                    next,
                    values: possible,
                    held: false,
                    unseen: count,
                });
            }
        }
    }
    out
}

/// The cards the played card could have taken besides what it took: the
/// largest capture of the same value (any value, for a trail) that contains
/// what was taken, less it.
pub fn left_behind(rules: &Rules, table: &Table, mv: &Move) -> CardSet {
    let (card, taken, values): (Card, CardSet, Vec<u8>) = match *mv {
        Move::Trail { card } => (card, CardSet::EMPTY, rules.capture_values(card).to_vec()),
        Move::Capture { card, taken, value } => (card, taken, vec![value]),
        Move::Build { .. } => return CardSet::EMPTY,
    };
    let mut best = taken;
    for value in values {
        let unions: Vec<CardSet> = if rules.pairs_only(card) {
            if !taken.is_empty() {
                continue;
            }
            (table.loose & CardSet::of_rank(card.rank()))
                .iter()
                .map(CardSet::single)
                .collect()
        } else {
            let mut groups = subsets_summing(rules, table.loose, value);
            groups.extend(
                table
                    .builds
                    .iter()
                    .filter(|b| b.value == value)
                    .map(|b| b.cards),
            );
            bounded_unions(&groups, moves::CANDIDATE_LIMIT)
        };
        for u in unions {
            if u.contains_all(taken) && u.len() > best.len() {
                best = u;
            }
        }
    }
    best - taken
}

/// A stable seed for the advisor from what the view shows, so a hint for
/// the same position is always the same.
pub fn advisor_seed(view: &View) -> u64 {
    // FNV-1a over what the view shows: stable on every platform and build.
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    let mut eat = |x: u64| {
        for b in x.to_le_bytes() {
            h ^= u64::from(b);
            h = h.wrapping_mul(0x0100_0000_01b3);
        }
    };
    let rules = view.rules.normalized();
    eat(rules.game as u64);
    eat(u64::from(rules.aces_fourteen));
    eat(u64::from(rules.sweeps));
    eat(view.me as u64);
    eat(view.dealer as u64);
    eat(u64::from(view.deal));
    eat(view.to_move.map_or(2, |s| s as u64));
    eat(view.hand.0);
    eat(view.table.loose.0);
    for b in view.table.builds.iter() {
        eat(b.cards.0);
        eat(u64::from(b.value) | u64::from(b.multiple) << 8 | (b.controller as u64) << 9);
    }
    eat(view.piles[0].0);
    eat(view.piles[1].0);
    eat(u64::from(view.sweeps[0]) | u64::from(view.sweeps[1]) << 8);
    eat(view.last_capturer.map_or(2, |s| s as u64));
    eat(u64::from(view.opponent_holds) | u64::from(view.undealt) << 8);
    eat(u64::from(view.scores[0]) | u64::from(view.scores[1]) << 32);
    h
}

/// The advisor's values: the counter's shortlist (as the top rung would
/// consider), and `extra` if given (a move to rate). Not every candidate: a
/// busy table can offer hundreds (the engine review's F3).
fn assessed(view: &View, extra: Option<Move>) -> Vec<(Move, f64)> {
    let mut advisor = SearchAgent::new(Rng::seeded(advisor_seed(view)));
    let mut moves = advisor.shortlist(view);
    if let Some(m) = extra {
        if !moves.contains(&m) {
            moves.push(m);
        }
    }
    advisor.evaluate(view, &moves)
}

/// The best of the assessed moves, the first among equals.
fn best_of(values: &[(Move, f64)]) -> (Move, f64) {
    values
        .iter()
        .fold(None, |best: Option<(Move, f64)>, &(m, v)| match best {
            Some((_, bv)) if bv >= v => best,
            _ => Some((m, v)),
        })
        .expect("a candidate")
}

/// How good a move is against the best the top rung finds.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Quality {
    Sound,
    Dubious,
    Blunder,
}

/// The loss below which a move is sound, and above which a blunder, in
/// points (a modelling choice, to be calibrated).
pub const SOUND: f64 = 0.15;
pub const BLUNDER: f64 = 0.6;

#[derive(Clone, Debug, PartialEq)]
pub struct Rating {
    pub best: Move,
    pub best_value: f64,
    pub value: f64,
    pub quality: Quality,
}

/// The top rung's move in the observer's place, its value, and the notes on
/// it.
#[derive(Clone, Debug, PartialEq)]
pub struct Hint {
    pub mv: Move,
    pub value: f64,
    pub notes: Vec<Note>,
}

/// `None` when it is not the viewer's turn.
pub fn hint(view: &View) -> Option<Hint> {
    if view.to_move != Some(view.me) {
        return None;
    }
    let (mv, value) = best_of(&assessed(view, None));
    Some(Hint {
        mv,
        value,
        notes: notes(view, view.me, &mv),
    })
}

/// `mv` rated against the top rung's best; `None` unless it is the viewer's
/// turn and `mv` is legal for them.
pub fn rate(view: &View, mv: &Move) -> Option<Rating> {
    if view.to_move != Some(view.me)
        || moves::check(&view.rules, &view.table, view.hand, view.me, mv).is_err()
    {
        return None;
    }
    let values = assessed(view, Some(*mv));
    let (best, best_value) = best_of(&values);
    let value = values.iter().find(|(m, _)| m == mv).expect("assessed").1;
    let loss = best_value - value;
    let quality = if loss <= SOUND {
        Quality::Sound
    } else if loss < BLUNDER {
        Quality::Dubious
    } else {
        Quality::Blunder
    };
    Some(Rating {
        best,
        best_value,
        value,
        quality,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cards::pack;
    use crate::hand::Hand;
    use crate::rules::Game;

    const ROYAL_14: Rules = Rules {
        game: Game::Royal,
        aces_fourteen: true,
        sweeps: true,
    };

    fn t(rules: &Rules, s: &str) -> Table {
        Table::parse(rules, s).unwrap()
    }

    fn set(s: &str) -> CardSet {
        CardSet::parse(s).unwrap()
    }

    fn mv(s: &str) -> Move {
        Move::parse(s).unwrap()
    }

    /// South's view before moving: `table`, `hand`, `seen` in South's pile,
    /// a consistent first deal (40 to deal) if the counts allow.
    fn view(rules: Rules, table: &str, hand: &str, seen: &str) -> View {
        let (h, _) = Hand::deal(rules, Seat::North, pack());
        let mut v = h.view(Seat::South, [0, 0]);
        v.table = t(&rules, table);
        v.hand = set(hand);
        v.piles = [set(seen), CardSet::EMPTY];
        v.opponent_holds = 4;
        v.undealt = v.unseen().len() as u8 - 4;
        v
    }

    #[test]
    fn sweep_values_of_tables() {
        let c = Rules::CLASSIC;
        assert_eq!(sweep_values(&c, &t(&c, "4H 5D")), vec![9]);
        assert_eq!(sweep_values(&c, &t(&c, "[8: 5S 3H] 8D")), vec![8]);
        assert_eq!(sweep_values(&c, &t(&c, "[8: 5S 3H] 7D")), Vec::<u8>::new());
        assert_eq!(sweep_values(&c, &t(&c, "KD")), vec![13]);
        assert_eq!(sweep_values(&c, &t(&c, "KD 4C")), Vec::<u8>::new());
        assert_eq!(sweep_values(&c, &t(&c, "AD AC")), vec![1, 2]);
        assert_eq!(sweep_values(&c, &Table::new()), Vec::<u8>::new());
        let r = Rules::ROYAL;
        assert_eq!(sweep_values(&r, &t(&r, "KD")), vec![13]);
        assert_eq!(sweep_values(&r, &t(&r, "QD AC")), vec![13]);
        assert_eq!(sweep_values(&ROYAL_14, &t(&ROYAL_14, "KS AH")), vec![14]);
        assert_eq!(
            sweep_values(&r, &t(&r, "KS AH")),
            Vec::<u8>::new(),
            "no 14 without the setting"
        );
    }

    #[test]
    fn the_unseen_summary() {
        let v = view(Rules::CLASSIC, "AS 7D", "TD 2H 3H 4H", "2S AH");
        let u = unseen(&v);
        assert_eq!(u.aces, set("AD AC"));
        assert!(!u.big_casino && !u.little_casino);
        assert_eq!(u.spades, 11);
        assert_eq!(u.cards, 44);
    }

    #[test]
    fn notes_on_a_capture() {
        // South takes Big Cassino and an ace, sweeping.
        let v = view(Rules::CLASSIC, "TD", "TC AS 2H 3H", "");
        let n = notes(&v, Seat::South, &mv("take TC TD"));
        assert!(n.contains(&Note::TookPoints {
            seat: Seat::South,
            cards: set("TD")
        }));
        assert!(n.contains(&Note::Swept { seat: Seat::South }));
        let v = view(Rules::CLASSIC, "AD 5C", "AS 2H 3H 4H", "");
        let n = notes(&v, Seat::South, &mv("take AS AD"));
        assert!(n.contains(&Note::Cash { seat: Seat::South }));
        assert!(n.contains(&Note::TookPoints {
            seat: Seat::South,
            cards: set("AS AD")
        }));
    }

    #[test]
    fn a_clinch_is_noted() {
        // South has 25 cards; taking two more reaches 27.
        let pile: CardSet = pack()
            .into_iter()
            .filter(|c| c.rank() >= 7)
            .take(25)
            .collect();
        assert_eq!(pile.len(), 25);
        let mut v = view(Rules::CLASSIC, "3D", "3C 2H 4H 5H", "");
        v.piles = [pile, CardSet::EMPTY];
        v.undealt = v.unseen().len() as u8 - 4;
        let n = notes(&v, Seat::South, &mv("take 3C 3D"));
        assert!(
            n.contains(&Note::Clinched {
                seat: Seat::South,
                what: Clinch::Cards
            }),
            "{n:?}"
        );
    }

    #[test]
    fn notes_on_a_build() {
        let v = view(Rules::CLASSIC, "5C KD", "3D 8S 2C 9H", "8D");
        let n = notes(&v, Seat::South, &mv("build 8 3D 5C"));
        assert!(n.contains(&Note::Announces {
            seat: Seat::South,
            value: 8
        }));
        assert!(
            n.contains(&Note::BuildAtRisk {
                value: 8,
                unseen: 2
            }),
            "{n:?}"
        );
    }

    #[test]
    fn notes_on_the_opponents_build_say_what_you_can_do() {
        // North builds 8 on the table; South (the observer) holds an 8.
        let v = view(Rules::CLASSIC, "5C KD", "8S 2C 9H 4D", "");
        let n = notes(&v, Seat::North, &mv("build 8 3D 5C"));
        assert!(n.contains(&Note::Announces {
            seat: Seat::North,
            value: 8
        }));
        assert!(n.contains(&Note::CanTakeBuild { value: 8 }), "{n:?}");
    }

    #[test]
    fn a_trail_that_opens_a_sweep_is_noted() {
        let v = view(Rules::CLASSIC, "4D", "5H KC 2C 3C", "");
        let n = notes(&v, Seat::South, &mv("trail 5H"));
        let open = n
            .iter()
            .find(|x| matches!(x, Note::SweepOpen { .. }))
            .expect("a sweep open");
        assert_eq!(
            open,
            &Note::SweepOpen {
                next: Seat::North,
                values: vec![9],
                held: false,
                unseen: 4
            }
        );
        let n = notes(&v, Seat::South, &mv("trail KC"));
        assert!(
            !n.iter().any(|x| matches!(x, Note::SweepOpen { .. })),
            "{n:?}"
        );
    }

    #[test]
    fn the_opponents_trail_can_open_a_sweep_for_you() {
        let v = view(Rules::CLASSIC, "4D", "9H KC 2C 3C", "");
        let n = notes(&v, Seat::North, &mv("trail 5H"));
        assert!(
            n.contains(&Note::SweepOpen {
                next: Seat::South,
                values: vec![9],
                held: true,
                unseen: 0
            }),
            "{n:?}"
        );
    }

    #[test]
    fn cards_left_behind_are_noted() {
        let v = view(Rules::CLASSIC, "AC 2D 3H 5S 6C 8D", "8S 2H 3C 4C", "");
        let n = notes(&v, Seat::South, &mv("take 8S 8D"));
        let left = n.iter().find_map(|x| match x {
            Note::LeftBehind { cards, .. } => Some(*cards),
            _ => None,
        });
        assert_eq!(left, Some(set("2D 6C 5S 3H")));
        let n = notes(&v, Seat::South, &mv("take 8S 8D 6C 2D 5S 3H"));
        assert!(
            !n.iter().any(|x| matches!(x, Note::LeftBehind { .. })),
            "{n:?}"
        );
        let n = notes(&v, Seat::South, &mv("trail 2H"));
        assert!(
            n.contains(&Note::LeftBehind {
                seat: Seat::South,
                cards: set("2D")
            }),
            "the 2 could have taken 2♦: {n:?}"
        );
    }

    #[test]
    fn notes_never_depend_on_what_the_observer_cannot_see() {
        // Notes on North's moves from South's view: shuffle North's hand and
        // the stock, and the notes must not change.
        for seed in 0..100 {
            let mut deck = pack();
            Rng::seeded(seed).shuffle(&mut deck);
            let mut rng = Rng::seeded(seed + 1);
            let (mut h, _) = Hand::deal(Rules::ROYAL, Seat::South, deck);
            while let Some(seat) = h.to_move() {
                let mv = h.candidates()[rng.below(h.candidates().len() as u64) as usize];
                if seat == Seat::North {
                    let v = h.view(Seat::South, [0, 0]);
                    let (hidden, undealt) =
                        crate::observation::sample_hidden(&v, &mut Rng::seeded(seed + 2));
                    let other = h.with_hidden(Seat::North, hidden, &undealt);
                    if other.hand_of(Seat::North).contains(mv.card()) {
                        assert_eq!(
                            notes(&v, Seat::North, &mv),
                            notes(&other.view(Seat::South, [0, 0]), Seat::North, &mv)
                        );
                    }
                }
                h.play(&mv).unwrap();
            }
        }
    }

    #[test]
    fn hints_are_legal_repeatable_and_rate_as_sound() {
        let mut deck = pack();
        Rng::seeded(4).shuffle(&mut deck);
        let (mut h, _) = Hand::deal(Rules::CLASSIC, Seat::North, deck);
        for _ in 0..10 {
            let seat = h.to_move().unwrap();
            let v = h.view(seat, [0, 0]);
            let a = hint(&v).unwrap();
            assert_eq!(
                Some(a.clone()),
                hint(&v),
                "the same position, the same hint"
            );
            assert!(v.candidates().contains(&a.mv));
            let r = rate(&v, &a.mv).unwrap();
            assert_eq!(r.quality, Quality::Sound);
            assert_eq!(r.best, a.mv);
            h.play(&a.mv).unwrap();
        }
        assert_ne!(
            advisor_seed(&h.view(Seat::South, [0, 0])),
            advisor_seed(&h.view(Seat::North, [0, 0]))
        );
    }

    #[test]
    fn hints_and_ratings_are_quick_on_a_busy_table() {
        // The review's F3: deal 4, twelve loose cards; the hint once took
        // 40 s, evaluating all 456 candidates.
        let rules = Rules::CLASSIC;
        let hands = [set("9C TD 8S 7H"), set("KC QD JH 9H")];
        let mut table = Table::new();
        for r in 1..=3 {
            table.loose |= CardSet::of_rank(r);
        }
        let rest: Vec<Card> = (!(hands[0] | hands[1] | table.loose)).iter().collect();
        let undealt: Vec<Card> = rest[..16].to_vec();
        let piles = [
            rest[16..24].iter().copied().collect(),
            rest[24..].iter().copied().collect(),
        ];
        let h = Hand::from_parts(
            rules,
            Seat::North,
            4,
            Some(Seat::South),
            hands,
            table,
            piles,
            [0, 0],
            None,
            &undealt,
        );
        let v = h.view(Seat::South, [0, 0]);
        let started = std::time::Instant::now();
        let a = hint(&v).expect("a hint");
        let r = rate(&v, &v.candidates()[0]).expect("a rating");
        assert!(
            started.elapsed().as_secs_f64() < 3.0,
            "{:?}",
            started.elapsed()
        );
        assert!(v.candidates().contains(&a.mv));
        assert!(r.best_value >= r.value);
    }

    #[test]
    fn a_blunder_is_called_one() {
        // Trailing the ten next to Big Cassino when the ten could take it.
        let v = view(Rules::CLASSIC, "TD 4C KH", "TC 3S 7H 8C", "2H");
        let r = rate(&v, &mv("trail TC")).unwrap();
        assert_eq!(r.quality, Quality::Blunder, "{r:?}");
        assert_eq!(r.best, mv("take TC TD"));
    }
}
