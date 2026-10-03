//! A sitting at the table: one person (South) against the opponent (North),
//! advanced one human decision at a time (`docs/DESIGN.md` §10).
//!
//! The session cuts for the deal, runs the opponent between the person's
//! decisions, keeps a record from which the whole sitting can be replayed
//! (and so undone), and tells what happened as a list of events, each with a
//! sentence ready to show. Everything a client shows should come from
//! [`Session::view`], which holds only what the person may know.
//!
//! Commands are one line each:
//!
//! - a move in the text form of `moves`: `trail 7H`, `take 8S 5S 3H`,
//!   `build 8 3D 5C`, `build 9 2S on 3C`;
//! - `next`: deal the next hand, once the count has been seen;
//! - `undo`: take back the last decision, with the opponent's replies;
//! - `set <aid> on|off`: switch an aid (`hints`, `explain`, `play_forced`).

use crate::advice::{self, Quality};
use crate::agents::Agent;
use crate::cards::{Card, CardSet};
use crate::game::Game;
use crate::hand::{self, Clinch};
use crate::moves::{self, Move};
use crate::observation::View;
use crate::opponent::{Opponent, Skill};
use crate::rng::{purpose, Rng};
use crate::rules::Rules;
use crate::scoring::Breakdown;
use crate::table::{Seat, Table};
use crate::words;

/// The game and the opponent, chosen at the start.
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct Settings {
    pub rules: Rules,
    /// The skill dial, 1 to `agents::TOP` (`opponent::Skill`).
    pub skill: f64,
}

impl Default for Settings {
    fn default() -> Settings {
        Settings {
            rules: Rules::CLASSIC,
            skill: f64::from(crate::agents::TOP),
        }
    }
}

/// Aids change what the person is told or asked, never what happens.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub struct Aids {
    /// The top rung's move is available as a hint.
    pub hints: bool,
    /// Every move comes with notes on what it means, and the person's own
    /// with a verdict when it gives up points.
    pub explain: bool,
    /// A move is played for the person when it is the only one.
    pub play_forced: bool,
}

/// What the person must do now.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Prompt {
    /// Make a move (ask [`Session::offer`] or [`Session::candidates`]).
    Play,
    /// The hand is counted: deal the next one.
    NextHand,
    /// The game is over.
    Over,
}

/// Something that happened, to be told or animated.
#[derive(Clone, Debug, PartialEq)]
pub struct Event {
    pub kind: EventKind,
    /// The hand it happened in, from 1.
    pub hand: u32,
    /// One sentence, ready to show.
    pub text: String,
    /// What it means, when the explain aid is on.
    pub notes: Vec<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub enum EventKind {
    /// A pair of cards shown in the cut for the deal.
    Cut {
        yours: Card,
        theirs: Card,
    },
    /// Who deals first.
    FirstDealer {
        you: bool,
    },
    /// A deal, 1 to 6; the sixth is "last".
    Dealt {
        deal: u8,
        last: bool,
        you_deal: bool,
    },
    /// A move, with the groups a capture took and the call a build makes.
    Played {
        you: bool,
        mv: Move,
        groups: Vec<CardSet>,
        call: Option<String>,
    },
    Swept {
        you: bool,
    },
    Cash {
        you: bool,
    },
    Clinched {
        you: bool,
        what: Clinch,
    },
    /// The cards left at the end, to the last capturer (`None`: nobody).
    Residue {
        you: Option<bool>,
        cards: CardSet,
    },
    /// The count of a hand.
    Scored {
        breakdown: Breakdown,
    },
    /// A hand is over: this hand's points and the game's totals.
    HandEnds {
        yours: u32,
        theirs: u32,
        totals: [u32; 2],
    },
    /// The game is over.
    GameEnds {
        you_won: bool,
        totals: [u32; 2],
    },
    /// The explain aid's verdict on the person's move: it gave up points.
    Verdict {
        quality: Quality,
        better: Move,
        loss: f64,
    },
}

/// The version of the engine's play a record replays against: bump it
/// whenever a change alters the cards dealt or the opponent's choices, so a
/// saved record from before is refused rather than replayed into another
/// game.
pub const RECORD_VERSION: u32 = 1;

pub struct Session {
    seed: u64,
    settings: Settings,
    game: Game,
    opponent: Opponent,
    record: Vec<String>,
    events: Vec<Event>,
    aids: Aids,
    error: Option<String>,
    /// The sitting before each of the person's decisions, for undo. The
    /// opponent's decisions are pure functions of the position, so the game,
    /// the events and the record are all there is to restore.
    snapshots: Vec<Snapshot>,
}

#[derive(Clone)]
struct Snapshot {
    game: Game,
    events: usize,
    record: usize,
}

impl Session {
    /// Sits down: the cut is made, the first hand dealt, and if the opponent
    /// leads, its first move made.
    pub fn new(seed: u64, settings: Settings) -> Session {
        let (game, opening) = Game::new(settings.rules, seed);
        let opponent_seed = Rng::stream(seed, purpose::agent(Seat::North.index())).next_u64();
        let mut session = Session {
            seed,
            settings,
            game,
            opponent: Skill(settings.skill).opponent(opponent_seed),
            record: Vec::new(),
            events: Vec::new(),
            aids: Aids::default(),
            error: None,
            snapshots: Vec::new(),
        };
        let cuts = session.game.cuts().to_vec();
        for (i, cut) in cuts.iter().enumerate() {
            let again = if i + 1 < cuts.len() {
                " Equal: cut again."
            } else {
                ""
            };
            session.tell(
                EventKind::Cut {
                    yours: cut.south,
                    theirs: cut.north,
                },
                format!(
                    "You cut {}; your opponent, {}.{again}",
                    cut.south.label(),
                    cut.north.label()
                ),
            );
        }
        let you = session.game.first_dealer() == Seat::South;
        session.tell(
            EventKind::FirstDealer { you },
            format!(
                "Low deals: {} first.",
                if you {
                    "you deal"
                } else {
                    "your opponent deals"
                }
            ),
        );
        session.tell_hand(&Table::new(), None, opening.as_slice());
        session.advance();
        session
    }

    /// Rebuilds a sitting from its seed, settings and record: how a client
    /// reloads a game. Entries marked `*` were made by the table and are made
    /// again; a record that replays differently is refused.
    pub fn replay(seed: u64, settings: Settings, record: &[String]) -> Result<Session, String> {
        let mut session = Session::new(seed, settings);
        for entry in record {
            let fits = match entry.strip_prefix('*') {
                Some(made) => match Move::parse(made) {
                    Ok(mv)
                        if session.prompt() == Prompt::Play
                            && session.game.hand().check(&mv).is_ok() =>
                    {
                        session.record.push(entry.clone());
                        session.play_move(Seat::South, mv);
                        session.advance();
                        true
                    }
                    _ => false,
                },
                None => session.send(entry),
            };
            if !fits {
                return Err(format!(
                    "the record does not fit at {entry:?}: {}",
                    session.error().unwrap_or("refused")
                ));
            }
        }
        if session.record != record {
            return Err("the record replays differently: it was made by another version".into());
        }
        Ok(session)
    }

    /// Carries out one command. A command the rules forbid is refused, the
    /// sitting is left as it was, and `error` says why.
    pub fn send(&mut self, command: &str) -> bool {
        self.error = None;
        match self.execute(command.trim()) {
            Ok(()) => true,
            Err(why) => {
                self.error = Some(why);
                false
            }
        }
    }

    fn execute(&mut self, command: &str) -> Result<(), String> {
        if command == "undo" {
            let snap = self.snapshots.pop().ok_or("There is nothing to undo.")?;
            self.game = snap.game;
            self.events.truncate(snap.events);
            self.record.truncate(snap.record);
            return Ok(());
        }
        if let Some(rest) = command.strip_prefix("set ") {
            let (aid, state) = rest.split_once(' ').ok_or("set <aid> on|off")?;
            let on = match state {
                "on" => true,
                "off" => false,
                _ => return Err("set <aid> on|off".into()),
            };
            match aid {
                "hints" => self.aids.hints = on,
                "explain" => self.aids.explain = on,
                "play_forced" => self.aids.play_forced = on,
                _ => return Err(format!("no aid called {aid}")),
            }
            if on && aid == "play_forced" {
                self.advance();
            }
            return Ok(());
        }
        if command == "next" {
            if self.prompt() != Prompt::NextHand {
                return Err("There is no hand to deal now.".into());
            }
            self.snapshot();
            self.record.push("next".into());
            let opening = self.game.next_hand().expect("between hands");
            self.tell_hand(&Table::new(), None, opening.as_slice());
            self.advance();
            return Ok(());
        }
        match self.prompt() {
            Prompt::Over => return Err("The game is over.".into()),
            Prompt::NextHand => return Err("The hand is over: deal the next one.".into()),
            Prompt::Play => {}
        }
        let mv = Move::parse(command)?;
        self.game.hand().check(&mv).map_err(|why| why.to_string())?;
        self.snapshot();
        self.record.push(mv.to_string());
        self.play_move(Seat::South, mv);
        self.advance();
        Ok(())
    }

    fn snapshot(&mut self) {
        self.snapshots.push(Snapshot {
            game: self.game.clone(),
            events: self.events.len(),
            record: self.record.len(),
        });
    }

    /// Runs the opponent until it is the person's turn or the hand is over,
    /// and plays a forced move for the person when that aid is on.
    fn advance(&mut self) {
        loop {
            match self.game.hand().to_move() {
                Some(Seat::North) => {
                    let view = self.game.hand().view(Seat::North, self.game.scores());
                    let mv = self.opponent.choose(&view);
                    self.play_move(Seat::North, mv);
                }
                Some(Seat::South) if self.aids.play_forced => {
                    let moves = self.game.hand().candidates();
                    if moves.len() != 1 {
                        return;
                    }
                    self.record.push(format!("*{}", moves[0]));
                    self.play_move(Seat::South, moves[0]);
                }
                _ => return,
            }
        }
    }

    /// Plays a move already checked, and tells it.
    fn play_move(&mut self, seat: Seat, mv: Move) {
        let before = *self.game.hand().table();
        let observer = self.view();
        let events = self.game.play(&mv).expect("checked before it was played");
        self.tell_hand(&before, Some(&observer), events.as_slice());
        if seat == Seat::South && self.aids.explain {
            let rating = advice::rate(&observer, &mv);
            if rating.quality != Quality::Sound {
                let loss = rating.best_value - rating.value;
                let verdict = if rating.quality == Quality::Blunder {
                    "A mistake"
                } else {
                    "Doubtful"
                };
                self.tell(
                    EventKind::Verdict {
                        quality: rating.quality,
                        better: rating.best,
                        loss,
                    },
                    format!(
                        "{verdict}: better to {} (about {loss:.1} points better).",
                        words::advise(&self.settings.rules, &before, &rating.best)
                    ),
                );
            }
        }
    }

    fn tell(&mut self, kind: EventKind, text: String) {
        let hand = self.game.history().len() as u32 + u32::from(!self.game.hand().is_over());
        self.events.push(Event {
            kind,
            hand: hand.max(1),
            text,
            notes: Vec::new(),
        });
    }

    /// Tells a hand's events. `before` is the table before the move, and
    /// `observer` South's view then (for the explain aid's notes).
    fn tell_hand(&mut self, before: &Table, observer: Option<&View>, events: &[hand::Event]) {
        let rules = self.settings.rules;
        let who = |seat: Seat| {
            if seat == Seat::South {
                "You"
            } else {
                "Your opponent"
            }
        };
        for e in events {
            match *e {
                hand::Event::Dealt { deal, last } => {
                    let you_deal = self.game.hand().dealer() == Seat::South;
                    let mut text = format!("Deal {deal} of 6.");
                    if last {
                        text = format!(
                            "{} deals the last cards: \"Last.\"",
                            who(self.game.hand().dealer())
                        );
                    }
                    self.tell(
                        EventKind::Dealt {
                            deal,
                            last,
                            you_deal,
                        },
                        text,
                    );
                }
                hand::Event::Played { seat, mv } => {
                    let said = if seat == Seat::South {
                        words::advise(&rules, before, &mv)
                    } else {
                        words::describe(&rules, before, &mv)
                    };
                    let call = words::call(&rules, before, &mv);
                    let mut text = format!("{} {said}.", who(seat));
                    if let Some(c) = &call {
                        text += &format!(" \"{c}\"");
                    }
                    let groups = moves::groups(&rules, before, &mv);
                    self.tell(
                        EventKind::Played {
                            you: seat == Seat::South,
                            mv,
                            groups,
                            call,
                        },
                        text,
                    );
                    if let (true, Some(observer)) = (self.aids.explain, observer) {
                        let notes = advice::notes(observer, seat, &mv)
                            .iter()
                            .map(|n| words::note_text(&rules, n, Seat::South))
                            .collect();
                        self.events.last_mut().expect("just told").notes = notes;
                    }
                }
                hand::Event::Swept { seat } => {
                    self.tell(
                        EventKind::Swept {
                            you: seat == Seat::South,
                        },
                        format!("{} swept the table.", who(seat)),
                    );
                }
                hand::Event::Cash { seat } => {
                    self.tell(
                        EventKind::Cash {
                            you: seat == Seat::South,
                        },
                        "Cash: an ace for an ace.".into(),
                    );
                }
                hand::Event::Clinched { seat, what } => {
                    let note = advice::Note::Clinched { seat, what };
                    self.tell(
                        EventKind::Clinched {
                            you: seat == Seat::South,
                            what,
                        },
                        words::note_text(&rules, &note, Seat::South),
                    );
                }
                hand::Event::Residue { seat, cards } => {
                    let text = match seat {
                        _ if cards.is_empty() => "Nothing is left on the table.".to_string(),
                        Some(s) => format!(
                            "The last cards, {}, go to {}: the last to capture.",
                            cards.labels(),
                            if s == Seat::South {
                                "you"
                            } else {
                                "your opponent"
                            }
                        ),
                        None => "Nobody captured, so the last cards go to nobody.".to_string(),
                    };
                    self.tell(
                        EventKind::Residue {
                            you: seat.map(|s| s == Seat::South),
                            cards,
                        },
                        text,
                    );
                }
                hand::Event::Scored(breakdown) => {
                    let (yours, theirs) =
                        (breakdown.points(Seat::South), breakdown.points(Seat::North));
                    self.tell(
                        EventKind::Scored { breakdown },
                        format!("The count: you {yours}, your opponent {theirs}."),
                    );
                    let totals = self.game.scores();
                    self.tell(
                        EventKind::HandEnds {
                            yours: u32::from(yours),
                            theirs: u32::from(theirs),
                            totals,
                        },
                        format!("Game: you {}, your opponent {}.", totals[0], totals[1]),
                    );
                    if let Some(winner) = self.game.winner() {
                        let you_won = winner == Seat::South;
                        let (w, l) = (totals[winner.index()], totals[winner.other().index()]);
                        let text = if you_won {
                            format!("You win the game, {w} to {l}.")
                        } else {
                            format!("Your opponent wins the game, {w} to {l}.")
                        };
                        self.tell(EventKind::GameEnds { you_won, totals }, text);
                    }
                }
            }
        }
    }

    pub fn prompt(&self) -> Prompt {
        let hand = self.game.hand();
        if self.game.winner().is_some() {
            Prompt::Over
        } else if hand.is_over() {
            Prompt::NextHand
        } else {
            Prompt::Play
        }
    }

    /// The person's view.
    pub fn view(&self) -> View {
        self.game.hand().view(Seat::South, self.game.scores())
    }

    /// The moves offered to the person, when it is their turn.
    pub fn candidates(&self) -> Vec<Move> {
        if self.prompt() == Prompt::Play {
            self.game.hand().candidates()
        } else {
            Vec::new()
        }
    }

    pub fn game(&self) -> &Game {
        &self.game
    }

    pub fn settings(&self) -> Settings {
        self.settings
    }

    pub fn seed(&self) -> u64 {
        self.seed
    }

    pub fn events(&self) -> &[Event] {
        &self.events
    }

    /// Every command taken from the person's seat; `*` marks what the table
    /// did for them.
    pub fn record(&self) -> &[String] {
        &self.record
    }

    pub fn aids(&self) -> Aids {
        self.aids
    }

    pub fn error(&self) -> Option<&str> {
        self.error.as_deref()
    }

    /// The top rung's move in the person's place, when the hints aid is on
    /// and it is their turn.
    pub fn hint(&self) -> Option<advice::Hint> {
        (self.aids.hints && self.prompt() == Prompt::Play).then(|| advice::hint(&self.view()))
    }

    pub fn can_undo(&self) -> bool {
        !self.snapshots.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn settings() -> Settings {
        Settings {
            rules: Rules::CLASSIC,
            skill: 3.0,
        }
    }

    /// Plays the person's first candidate (or `next`) until the game ends.
    fn play_out(s: &mut Session) {
        for _ in 0..2_000 {
            match s.prompt() {
                Prompt::Play => {
                    let m = s.candidates()[0];
                    assert!(s.send(&m.to_string()), "{m}: {:?}", s.error());
                }
                Prompt::NextHand => assert!(s.send("next")),
                Prompt::Over => return,
            }
        }
        panic!("the game did not end");
    }

    #[test]
    fn a_sitting_begins_with_the_cut_and_the_deal() {
        let s = Session::new(7, settings());
        let kinds: Vec<&EventKind> = s.events().iter().map(|e| &e.kind).collect();
        assert!(matches!(kinds[0], EventKind::Cut { .. }));
        assert!(kinds
            .iter()
            .any(|k| matches!(k, EventKind::FirstDealer { .. })));
        assert!(kinds
            .iter()
            .any(|k| matches!(k, EventKind::Dealt { deal: 1, .. })));
        assert_eq!(
            s.prompt(),
            Prompt::Play,
            "the opponent has led if it was its turn"
        );
        assert_eq!(s.view().to_move, Some(Seat::South));
        assert!(s.events().iter().all(|e| !e.text.is_empty()));
    }

    #[test]
    fn a_refused_move_says_why_and_changes_nothing() {
        let mut s = Session::new(7, settings());
        let before = s.view();
        let theirs = s.game().hand().hand_of(Seat::North).first().unwrap();
        assert!(!s.send(&format!("trail {theirs}")));
        assert_eq!(s.error(), Some("That card is not in your hand."));
        assert!(!s.send("frobnicate"));
        assert!(s.error().unwrap().contains("not a move"));
        assert!(!s.send("next"), "not between hands");
        assert_eq!(s.view(), before);
        assert!(s.record().is_empty());
    }

    #[test]
    fn a_whole_game_plays_out_and_says_so() {
        let mut s = Session::new(3, settings());
        play_out(&mut s);
        assert_eq!(s.prompt(), Prompt::Over);
        let ends = s
            .events()
            .iter()
            .filter(|e| matches!(e.kind, EventKind::GameEnds { .. }))
            .count();
        assert_eq!(ends, 1);
        let scored = s
            .events()
            .iter()
            .filter(|e| matches!(e.kind, EventKind::Scored { .. }))
            .count();
        assert_eq!(scored, s.game().history().len());
        assert!(
            s.events().iter().any(|e| e.text.contains("\"Last.\"")),
            "the dealer calls the last deal"
        );
        assert!(
            !s.send(&format!("trail {}", Card::BIG_CASINO)),
            "nothing to play"
        );
    }

    #[test]
    fn the_record_replays_the_sitting_exactly() {
        let mut s = Session::new(11, settings());
        for _ in 0..30 {
            match s.prompt() {
                Prompt::Play => assert!(s.send(&s.candidates()[0].to_string())),
                Prompt::NextHand => assert!(s.send("next")),
                Prompt::Over => break,
            }
        }
        let again = Session::replay(11, settings(), s.record()).unwrap();
        assert_eq!(again.events(), s.events());
        assert_eq!(again.view(), s.view());
        assert!(Session::replay(11, settings(), &["trail ZZ".to_string()]).is_err());
    }

    #[test]
    fn undo_takes_back_the_last_decision_and_the_replies() {
        let mut s = Session::new(5, settings());
        let before = s.view();
        let told = s.events().len();
        let m = s.candidates()[0];
        assert!(s.send(&m.to_string()));
        assert_ne!(s.view(), before);
        assert!(s.can_undo());
        assert!(s.send("undo"));
        assert_eq!(s.view(), before);
        assert_eq!(s.events().len(), told);
        assert!(!s.can_undo());
        assert!(!s.send("undo"));
    }

    #[test]
    fn explain_notes_moves_and_judges_the_persons() {
        let mut s = Session::new(3, settings());
        assert!(s.send("set explain on"));
        let mut noted = false;
        let mut judged = false;
        for _ in 0..60 {
            match s.prompt() {
                // The last candidate is often a poor trail: a verdict comes.
                Prompt::Play => assert!(s.send(&s.candidates().last().unwrap().to_string())),
                Prompt::NextHand => assert!(s.send("next")),
                Prompt::Over => break,
            }
        }
        for e in s.events() {
            noted |= matches!(e.kind, EventKind::Played { .. }) && !e.notes.is_empty();
            judged |= matches!(e.kind, EventKind::Verdict { .. });
        }
        assert!(noted && judged, "noted {noted}, judged {judged}");
    }

    #[test]
    fn forced_moves_are_made_for_the_person_and_replay() {
        let mut s = Session::new(4, settings());
        assert!(s.send("set play_forced on"));
        play_out(&mut s);
        assert!(
            s.record().iter().any(|r| r.starts_with('*')),
            "some move was forced"
        );
        let again = Session::replay(4, settings(), s.record()).unwrap();
        assert_eq!(again.events(), s.events());
    }

    #[test]
    fn a_hint_only_when_asked_for_and_only_on_your_turn() {
        let mut s = Session::new(6, settings());
        assert!(s.hint().is_none());
        assert!(s.send("set hints on"));
        let h = s.hint().expect("a hint");
        assert!(s.candidates().contains(&h.mv));
        assert_eq!(s.hint(), Some(h), "asked twice, the same");
        assert!(!s.send("set nonsense on"));
        assert!(!s.send("set hints maybe"));
    }

    #[test]
    fn the_opponent_is_the_skill_chosen() {
        // Two sittings with the same seed and different skills part ways.
        let mut low = Session::new(
            9,
            Settings {
                skill: 1.0,
                ..settings()
            },
        );
        let mut high = Session::new(
            9,
            Settings {
                skill: 4.0,
                ..settings()
            },
        );
        play_out(&mut low);
        play_out(&mut high);
        assert_ne!(low.events(), high.events());
    }
}
