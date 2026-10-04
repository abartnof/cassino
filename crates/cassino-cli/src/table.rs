//! A table in the terminal: a person against the computer, or two computer
//! players watched. A client of the engine's session only, like the page:
//! every rule, move, sentence and refusal comes from `cassino-core`.

use std::io::{self, BufRead, Write};

use cassino_core::cards::{Card, CardSet, Suit};
use cassino_core::rules::{Game as Kind, Rules};
use cassino_core::scoring::{Breakdown, Item};
use cassino_core::session::{Event, EventKind, Prompt, Session, Settings};
use cassino_core::table::Seat;
use cassino_core::words;

#[derive(Clone, Debug)]
pub struct Options {
    pub rules: Rules,
    pub seed: u64,
    /// The computer players' skills (1 to `agents::TOP`), South then North.
    /// South's is used only when watching.
    pub skills: [f64; 2],
    /// Two computer players, no person.
    pub watch: bool,
    /// When watching, show both hands.
    pub reveal: bool,
    /// When watching, wait for Enter after each step.
    pub pause: bool,
    /// Red hearts and diamonds.
    pub colour: bool,
    /// Notes on every move, and verdicts on the person's.
    pub explain: bool,
}

pub struct Table<R, W> {
    input: R,
    out: W,
    options: Options,
    /// How many of the session's events have been told.
    told: usize,
}

impl<R: BufRead, W: Write> Table<R, W> {
    pub fn new(input: R, out: W, options: Options) -> Table<R, W> {
        Table {
            input,
            out,
            options,
            told: 0,
        }
    }

    fn card(&self, card: Card) -> String {
        let red = matches!(card.suit(), Suit::Hearts | Suit::Diamonds);
        if self.options.colour && red {
            format!("\x1b[31m{}\x1b[0m", card.label())
        } else {
            card.label()
        }
    }

    fn cards(&self, set: CardSet) -> String {
        set.iter()
            .map(|c| self.card(c))
            .collect::<Vec<_>>()
            .join(" ")
    }

    /// Sits down and plays a game to its end.
    pub fn play(&mut self) -> io::Result<()> {
        let rules = self.options.rules;
        let mut kind = match rules.game {
            Kind::Classic => "Classic".to_string(),
            Kind::Royal => "Royal: jacks 11, queens 12, kings 13".to_string(),
        };
        if rules.aces_fourteen {
            kind += "; aces 1 or 14";
        }
        if !rules.sweeps {
            kind += "; sweeps not scored";
        }
        writeln!(
            self.out,
            "Cassino ({kind}). Game to 21. Seed {}.",
            self.options.seed
        )?;
        let mut session = if self.options.watch {
            Session::watch(self.options.seed, rules, self.options.skills)
        } else {
            writeln!(
                self.out,
                "Choose a move by its number, or type one: trail 7H, take 8S 5S 3H, build 8 3D 5C, build 9 2S on 3C. ? lists them, hint suggests one, u undoes, q quits."
            )?;
            let mut s = Session::new(
                self.options.seed,
                Settings {
                    rules,
                    skill: self.options.skills[1],
                },
            );
            s.send("set hints on");
            if self.options.explain {
                s.send("set explain on");
            }
            s
        };
        loop {
            self.tell(&session)?;
            match session.prompt() {
                Prompt::Over => return Ok(()),
                _ if session.watching() => {
                    session.step();
                    if self.options.pause && self.line()?.is_none() {
                        self.options.pause = false;
                    }
                }
                Prompt::NextHand => {
                    write!(self.out, "Enter for the next hand (q quits) > ")?;
                    self.out.flush()?;
                    match self.line()?.as_deref() {
                        None | Some("q") | Some("quit") => return self.leave(),
                        _ => {
                            session.send("next");
                        }
                    }
                }
                Prompt::Play => {
                    if !self.ask(&mut session)? {
                        return self.leave();
                    }
                }
            }
        }
    }

    fn leave(&mut self) -> io::Result<()> {
        writeln!(self.out, "You leave the table.")
    }

    /// Tells the events not yet told.
    fn tell(&mut self, session: &Session) -> io::Result<()> {
        let events: Vec<Event> = session.events()[self.told..].to_vec();
        self.told = session.events().len();
        for e in &events {
            if let EventKind::Dealt {
                deal, yours, table, ..
            } = e.kind
            {
                writeln!(self.out)?;
                writeln!(self.out, "-- Hand {}, deal {deal} of 6 --", e.hand)?;
                if !table.is_empty() {
                    writeln!(self.out, "{:<14} {}", "Table", self.cards(table))?;
                }
                if session.watching() {
                    writeln!(self.out, "{:<14} {}", "South is dealt", self.cards(yours))?;
                }
                if !e.text.starts_with("Deal ") {
                    writeln!(self.out, "{}", e.text)?;
                }
                continue;
            }
            writeln!(self.out, "{}", e.text)?;
            if let EventKind::Scored { breakdown } = &e.kind {
                self.tell_count(session, breakdown)?;
            }
            for note in &e.notes {
                writeln!(self.out, "    · {note}")?;
            }
        }
        Ok(())
    }

    /// The count's lines, in Foster's order.
    fn tell_count(&mut self, session: &Session, b: &Breakdown) -> io::Result<()> {
        let name = |seat: Seat| match (session.watching(), seat) {
            (true, Seat::South) => "South",
            (true, Seat::North) => "North",
            (false, Seat::South) => "you",
            (false, Seat::North) => "your opponent",
        };
        let [ts, tn] = b.tallies;
        for (item, seat, points) in b.lines() {
            let what = match item {
                Item::Cards => format!(
                    "Most cards, {} to {}",
                    ts.cards.max(tn.cards),
                    ts.cards.min(tn.cards)
                ),
                Item::Spades => format!(
                    "Most spades, {} to {}",
                    ts.spades.max(tn.spades),
                    ts.spades.min(tn.spades)
                ),
                Item::BigCasino => format!("Big Cassino, {}", self.card(Card::BIG_CASINO)),
                Item::LittleCasino => format!("Little Cassino, {}", self.card(Card::LITTLE_CASINO)),
                Item::Ace(suit) => format!("The ace of {}", suit_name(suit)),
                Item::Sweeps => format!("Sweeps, {}", b.sweeps[seat.index()]),
            };
            writeln!(self.out, "  {what}: {} +{points}", name(seat))?;
        }
        if b.cards.is_none() {
            writeln!(self.out, "  Cards are tied, 26 each: nobody scores them.")?;
        }
        Ok(())
    }

    /// The table as it stands, from the person's side (or both, watching).
    fn show(&mut self, session: &Session) -> io::Result<()> {
        let hand = session.game().hand();
        let watching = session.watching();
        let name = |seat: Seat| match (watching, seat) {
            (true, Seat::South) => "South",
            (true, Seat::North) => "North",
            (false, Seat::South) => "You",
            (false, Seat::North) => "Your opponent",
        };
        for seat in [Seat::North, Seat::South] {
            if !watching && seat == Seat::South {
                continue;
            }
            let held = hand.hand_of(seat);
            let shown = if watching && self.options.reveal {
                self.cards(held)
            } else {
                plural(held.len(), "card")
            };
            writeln!(
                self.out,
                "{:<14} {shown}  {}",
                name(seat),
                pile_line(session, seat)
            )?;
        }
        let view = session.view();
        let mut items = Vec::new();
        for item in session.items() {
            let set: CardSet = item.cards.iter().copied().collect();
            match view.table.builds.iter().find(|b| b.cards == set) {
                None => items.push(self.card(item.cards[0])),
                Some(b) => {
                    let whose = match (watching, b.controller) {
                        (false, Seat::South) => "yours".to_string(),
                        (false, Seat::North) => "theirs".to_string(),
                        (true, c) => name(c).to_string(),
                    };
                    let value = if b.multiple {
                        format!("{}s", b.value)
                    } else {
                        b.value.to_string()
                    };
                    let laid: Vec<String> = item.cards.iter().map(|&c| self.card(c)).collect();
                    items.push(format!("[{value}: {} ({whose})]", laid.join(" ")));
                }
            }
        }
        let shown = if items.is_empty() {
            "(empty)".to_string()
        } else {
            items.join("  ")
        };
        writeln!(self.out, "{:<14} {shown}", "Table")?;
        if !watching {
            writeln!(
                self.out,
                "{:<14} {}",
                "You",
                pile_line(session, Seat::South)
            )?;
        }
        writeln!(
            self.out,
            "{:<14} {} still to deal",
            "Stock",
            hand.undealt().len()
        )?;
        Ok(())
    }

    /// Asks the person for a move; false if they leave.
    fn ask(&mut self, session: &mut Session) -> io::Result<bool> {
        let mut listed = false;
        loop {
            let moves = session.candidates();
            let rules = session.settings().rules;
            let table = session.view().table;
            if !listed {
                self.show(session)?;
                let mine: Vec<String> = session.view().hand.iter().map(|c| self.card(c)).collect();
                writeln!(self.out, "{:<14} {}", "Your hand", mine.join("  "))?;
                for (i, mv) in moves.iter().enumerate() {
                    let mut line = words::advise(&rules, &table, mv);
                    if let Some(call) = words::call(&rules, &table, mv) {
                        line += &format!(" (\"{call}\")");
                    }
                    writeln!(self.out, "  {:>2}) {line}", i + 1)?;
                }
                listed = true;
            }
            write!(self.out, "> ")?;
            self.out.flush()?;
            let Some(line) = self.line()? else {
                return Ok(false);
            };
            let command = match line.as_str() {
                "q" | "quit" => return Ok(false),
                "" => continue,
                "?" | "h" | "help" => {
                    listed = false;
                    continue;
                }
                "u" | "undo" => "undo".to_string(),
                "hint" => {
                    if let Some(hint) = session.hint() {
                        let n = moves
                            .iter()
                            .position(|m| *m == hint.mv)
                            .map_or(String::new(), |i| format!(" ({})", i + 1));
                        writeln!(
                            self.out,
                            "Hint{n}: {}.",
                            words::advise(&rules, &table, &hint.mv)
                        )?;
                        for note in hint.notes {
                            writeln!(
                                self.out,
                                "    · {}",
                                words::note_text(&rules, &note, Seat::South)
                            )?;
                        }
                    }
                    continue;
                }
                text => match text.parse::<usize>() {
                    Ok(n) => match moves.get(n.wrapping_sub(1)) {
                        Some(mv) => mv.to_string(),
                        None => {
                            writeln!(self.out, "Choose 1 to {}.", moves.len())?;
                            continue;
                        }
                    },
                    Err(_) => text.to_string(),
                },
            };
            if session.send(&command) {
                if command == "undo" {
                    self.told = session.events().len();
                    writeln!(self.out, "Taken back to your last decision.")?;
                    listed = false;
                    continue;
                }
                return Ok(true);
            }
            writeln!(self.out, "{}", session.error().unwrap_or("Refused."))?;
        }
    }

    fn line(&mut self) -> io::Result<Option<String>> {
        let mut text = String::new();
        if self.input.read_line(&mut text)? == 0 {
            return Ok(None);
        }
        Ok(Some(text.trim().to_string()))
    }
}

fn pile_line(session: &Session, seat: Seat) -> String {
    let hand = session.game().hand();
    let pile = hand.pile(seat);
    let mut line = format!("pile {} ({})", pile.len(), plural(pile.spades(), "spade"));
    if hand.sweeps(seat) > 0 {
        line += &format!(", sweeps {}", hand.sweeps(seat));
    }
    line
}

/// "1 card", "3 cards".
fn plural(n: u32, noun: &str) -> String {
    if n == 1 {
        format!("1 {noun}")
    } else {
        format!("{n} {noun}s")
    }
}

fn suit_name(suit: Suit) -> &'static str {
    match suit {
        Suit::Spades => "spades",
        Suit::Hearts => "hearts",
        Suit::Diamonds => "diamonds",
        Suit::Clubs => "clubs",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn options(watch: bool, seed: u64, rules: Rules) -> Options {
        Options {
            rules,
            seed,
            skills: [1.0, 2.5],
            watch,
            reveal: true,
            pause: false,
            colour: false,
            explain: false,
        }
    }

    fn run(input: &str, options: Options) -> String {
        let mut out = Vec::new();
        Table::new(input.as_bytes(), &mut out, options)
            .play()
            .unwrap();
        String::from_utf8(out).unwrap()
    }

    #[test]
    fn watching_plays_a_whole_game() {
        for rules in [Rules::CLASSIC, Rules::ROYAL] {
            for seed in 1..4 {
                let text = run("", options(true, seed, rules));
                assert!(text.contains("-- Hand 1, deal 1 of 6 --"), "{text}");
                assert!(text.contains("\"Last.\""));
                assert!(text.contains("The count:"));
                assert!(text.contains("wins the game"), "{text}");
                assert!(text.contains("Low deals:"));
                assert!(
                    !text.contains("north") && !text.contains("south"),
                    "seats keep their capitals"
                );
            }
        }
    }

    #[test]
    fn a_person_can_play_by_numbers() {
        let input = "1\n".repeat(400);
        let text = run(&input, options(false, 5, Rules::CLASSIC));
        assert!(text.contains("Your hand"));
        assert!(
            text.contains("You cut") && text.contains("; your opponent, "),
            "{text}"
        );
        assert!(
            text.contains("win the game") || text.contains("wins the game"),
            "{text}"
        );
    }

    #[test]
    fn explanations_hints_and_undo() {
        let mut o = options(false, 5, Rules::CLASSIC);
        o.explain = true;
        let text = run("hint\n1\nu\n1\n1\nq\n", o);
        assert!(text.contains("Hint ("), "{text}");
        assert!(text.contains("Taken back to your last decision."), "{text}");
    }

    #[test]
    fn a_refused_move_says_why_and_asks_again() {
        let text = run(
            "build 99 AS\nfrobnicate\n999\nq\n",
            options(false, 5, Rules::CLASSIC),
        );
        assert!(text.contains("not a move: frobnicate"), "{text}");
        assert!(text.contains("Choose 1 to"), "{text}");
        assert!(text.contains("You leave the table."));
    }
}
