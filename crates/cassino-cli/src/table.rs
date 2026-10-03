//! A table in the terminal: a person against the computer, or two computer
//! players watched. A client of the engine only: every rule, score and
//! refusal comes from `cassino-core`.

use std::io::{self, BufRead, Write};

use cassino_core::agents::{self, Agent};
use cassino_core::cards::{Card, CardSet, Suit};
use cassino_core::game::Game;
use cassino_core::hand::{Clinch, Event};
use cassino_core::moves::Move;
use cassino_core::rules::{Game as Kind, Rules};
use cassino_core::scoring::{Breakdown, Item};
use cassino_core::table::{Seat, Table as Layout};
use cassino_core::tournament::agent_rng;
use cassino_core::words;

#[derive(Clone, Debug)]
pub struct Options {
    pub rules: Rules,
    pub seed: u64,
    /// The computer players' levels, South then North. South's is used only
    /// when watching.
    pub levels: [u8; 2],
    /// Two computer players, no person.
    pub watch: bool,
    /// When watching, show both hands.
    pub reveal: bool,
    /// When watching, wait for Enter after each move.
    pub pause: bool,
    /// Red hearts and diamonds.
    pub colour: bool,
}

pub struct Table<R, W> {
    input: R,
    out: W,
    options: Options,
}

impl<R: BufRead, W: Write> Table<R, W> {
    pub fn new(input: R, out: W, options: Options) -> Table<R, W> {
        Table {
            input,
            out,
            options,
        }
    }

    fn human(&self) -> Option<Seat> {
        (!self.options.watch).then_some(Seat::South)
    }

    fn name(&self, seat: Seat) -> &'static str {
        match (self.human(), seat) {
            (Some(_), Seat::South) => "You",
            (Some(_), Seat::North) => "Your opponent",
            (None, Seat::South) => "South",
            (None, Seat::North) => "North",
        }
    }

    /// The name inside a sentence: "you" and "your opponent" in lower case,
    /// the compass seats as they are.
    fn named(&self, seat: Seat) -> String {
        match self.human() {
            Some(_) => self.name(seat).to_lowercase(),
            None => self.name(seat).to_string(),
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
        if self.human().is_some() {
            writeln!(
                self.out,
                "Choose a move by its number, or type one: trail 7H, take 8S 5S 3H, build 8 3D 5C, build 9 2S on 3C. ? lists them, q quits."
            )?;
        }
        let (mut game, opening) = Game::new(rules, self.options.seed);
        self.tell_cut(&game)?;
        let mut agents: [Option<Box<dyn Agent>>; 2] = [None, None];
        for seat in Seat::BOTH {
            if Some(seat) != self.human() {
                let level = self.options.levels[seat.index()];
                agents[seat.index()] =
                    Some(agents::by_level(level, agent_rng(self.options.seed, seat)));
            }
        }
        self.tell(&game, &Layout::new(), opening.as_slice())?;
        loop {
            while let Some(seat) = game.hand().to_move() {
                let before = *game.hand().table();
                let mv = match agents[seat.index()].as_mut() {
                    Some(agent) => {
                        let view = game.hand().view(seat, game.scores());
                        agent.choose(&view)
                    }
                    None => match self.ask(&game)? {
                        Some(mv) => mv,
                        None => {
                            writeln!(self.out, "You leave the table.")?;
                            return Ok(());
                        }
                    },
                };
                let events = game.play(&mv).expect("checked before it was played");
                self.tell(&game, &before, events.as_slice())?;
                if self.options.watch && self.options.pause {
                    self.wait()?;
                }
            }
            let [s, n] = game.scores();
            writeln!(
                self.out,
                "Game: {} {s}, {} {n}.",
                self.name(Seat::South),
                self.name(Seat::North)
            )?;
            if let Some(winner) = game.winner() {
                let verb = if self.human() == Some(winner) {
                    "win"
                } else {
                    "wins"
                };
                writeln!(
                    self.out,
                    "{} {verb} the game, {}.",
                    self.name(winner),
                    self.final_score(game.scores(), winner)
                )?;
                return Ok(());
            }
            let opening = game.next_hand().expect("no winner yet");
            self.tell(&game, &Layout::new(), opening.as_slice())?;
        }
    }

    fn final_score(&self, scores: [u32; 2], winner: Seat) -> String {
        format!(
            "{} to {}",
            scores[winner.index()],
            scores[winner.other().index()]
        )
    }

    fn tell_cut(&mut self, game: &Game) -> io::Result<()> {
        for cut in game.cuts() {
            let line = format!(
                "{} cut{} {}, {} {}.",
                self.name(Seat::South),
                if self.human().is_some() { "" } else { "s" },
                self.card(cut.south),
                self.named(Seat::North),
                self.card(cut.north)
            );
            writeln!(self.out, "{line}")?;
        }
        let dealer = game.first_dealer();
        let deals = if self.human() == Some(dealer) {
            "deal"
        } else {
            "deals"
        };
        writeln!(self.out, "Low deals: {} {deals}.", self.name(dealer))?;
        Ok(())
    }

    /// Narrates events; `before` is the table as it was before the move.
    fn tell(&mut self, game: &Game, before: &Layout, events: &[Event]) -> io::Result<()> {
        let rules = self.options.rules;
        for e in events {
            match *e {
                Event::Dealt { deal, last } => {
                    let hand = game.history().len() + 1;
                    writeln!(self.out)?;
                    writeln!(self.out, "-- Hand {hand}, deal {deal} of 6 --")?;
                    if last {
                        let dealer = game.hand().dealer();
                        writeln!(self.out, "{}: \"Last.\"", self.name(dealer))?;
                    }
                    if self.human().is_none() {
                        self.show(game)?;
                    }
                }
                Event::Played { seat, mv } => {
                    let mut line = format!(
                        "{}: {}",
                        self.name(seat),
                        words::describe(&rules, before, &mv)
                    );
                    if let Some(call) = words::call(&rules, before, &mv) {
                        line += &format!(". \"{call}\"");
                    }
                    writeln!(self.out, "{line}")?;
                }
                Event::Swept { seat } => writeln!(self.out, "{}: \"Sweep!\"", self.name(seat))?,
                Event::Cash { seat } => writeln!(self.out, "{}: \"Cash.\"", self.name(seat))?,
                Event::Clinched { seat, what } => {
                    let said = match what {
                        Clinch::Cards => "That's the cards.",
                        Clinch::Spades => "Seven spades.",
                    };
                    writeln!(self.out, "{}: \"{said}\"", self.name(seat))?;
                }
                Event::Residue { seat, cards } => {
                    if !cards.is_empty() {
                        match seat {
                            Some(s) => writeln!(
                                self.out,
                                "The last {} card{} go to {}, the last to capture: {}.",
                                cards.len(),
                                if cards.len() == 1 { "" } else { "s" },
                                self.named(s),
                                self.cards(cards)
                            )?,
                            None => {
                                writeln!(self.out, "Nobody captured; the last cards go to nobody.")?
                            }
                        }
                    }
                }
                Event::Scored(b) => self.tell_count(&b)?,
            }
        }
        Ok(())
    }

    /// The count, called in Foster's order.
    fn tell_count(&mut self, b: &Breakdown) -> io::Result<()> {
        writeln!(self.out, "The count:")?;
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
                Item::BigCasino => format!("Big Casino, {}", self.card(Card::BIG_CASINO)),
                Item::LittleCasino => format!("Little Casino, {}", self.card(Card::LITTLE_CASINO)),
                Item::Ace(suit) => format!("The ace of {}", suit_name(suit)),
                Item::Sweeps => format!("Sweeps, {}", b.sweeps[seat.index()]),
            };
            writeln!(self.out, "  {what}: {} +{points}", self.name(seat))?;
        }
        if b.cards.is_none() {
            writeln!(self.out, "  Cards are tied, 26 each: nobody scores them.")?;
        }
        let s = b.points(Seat::South);
        let n = b.points(Seat::North);
        writeln!(
            self.out,
            "This hand: {} {s}, {} {n}.",
            self.name(Seat::South),
            self.name(Seat::North)
        )?;
        Ok(())
    }

    /// The table as it stands, from the person's side (or both, watching).
    fn show(&mut self, game: &Game) -> io::Result<()> {
        let hand = game.hand();
        let viewer = self.human();
        for seat in [Seat::North, Seat::South] {
            if Some(seat) == viewer {
                continue;
            }
            let held = hand.hand_of(seat);
            let shown = if viewer.is_none() && self.options.reveal {
                self.cards(held)
            } else {
                format!("{} cards", held.len())
            };
            writeln!(
                self.out,
                "{:<14} {shown}  {}",
                self.name(seat),
                self.pile_line(game, seat)
            )?;
        }
        let table = hand.table();
        let mut items: Vec<String> = table.loose.iter().map(|c| self.card(c)).collect();
        for b in table.builds.iter() {
            let whose = match (viewer, b.controller) {
                (Some(v), c) if v == c => "yours".to_string(),
                (Some(_), _) => "theirs".to_string(),
                (None, c) => self.name(c).to_string(),
            };
            let value = if b.multiple {
                format!("{}s", b.value)
            } else {
                b.value.to_string()
            };
            items.push(format!("[{value}: {} ({whose})]", self.cards(b.cards)));
        }
        let shown = if items.is_empty() {
            "(empty)".to_string()
        } else {
            items.join("  ")
        };
        writeln!(self.out, "{:<14} {shown}", "Table")?;
        if let Some(me) = viewer {
            writeln!(self.out, "{:<14} {}", "You", self.pile_line(game, me))?;
        }
        writeln!(
            self.out,
            "{:<14} {} still to deal",
            "Stock",
            hand.undealt().len()
        )?;
        Ok(())
    }

    fn pile_line(&self, game: &Game, seat: Seat) -> String {
        let pile = game.hand().pile(seat);
        let sweeps = game.hand().sweeps(seat);
        let mut line = format!("pile {} ({} spades)", pile.len(), pile.spades());
        if sweeps > 0 {
            line += &format!(", sweeps {sweeps}");
        }
        line
    }

    /// Asks the person for a move: a number from the list, or the text form.
    fn ask(&mut self, game: &Game) -> io::Result<Option<Move>> {
        let rules = self.options.rules;
        let me = Seat::South;
        let mut listed = false;
        loop {
            let hand = game.hand();
            let moves = hand.candidates();
            if !listed {
                self.show(game)?;
                let mine: Vec<String> = hand.hand_of(me).iter().map(|c| self.card(c)).collect();
                writeln!(self.out, "{:<14} {}", "Your hand", mine.join("  "))?;
                for (i, mv) in moves.iter().enumerate() {
                    let mut line = words::describe(&rules, hand.table(), mv);
                    if let Some(call) = words::call(&rules, hand.table(), mv) {
                        line += &format!(" (\"{call}\")");
                    }
                    writeln!(self.out, "  {:>2}) {line}", i + 1)?;
                }
                listed = true;
            }
            write!(self.out, "> ")?;
            self.out.flush()?;
            let Some(line) = self.line()? else {
                return Ok(None);
            };
            match line.as_str() {
                "q" | "quit" => return Ok(None),
                "" => continue,
                "?" | "h" | "help" => {
                    listed = false;
                    continue;
                }
                _ => {}
            }
            if let Ok(n) = line.parse::<usize>() {
                match moves.get(n.wrapping_sub(1)) {
                    Some(mv) => return Ok(Some(*mv)),
                    None => {
                        writeln!(self.out, "Choose 1 to {}.", moves.len())?;
                        continue;
                    }
                }
            }
            match Move::parse(&line) {
                Err(e) => writeln!(self.out, "{e}. (? lists your moves.)")?,
                Ok(mv) => match hand.check(&mv) {
                    Ok(()) => return Ok(Some(mv)),
                    Err(why) => writeln!(self.out, "{why}")?,
                },
            }
        }
    }

    fn line(&mut self) -> io::Result<Option<String>> {
        let mut text = String::new();
        if self.input.read_line(&mut text)? == 0 {
            return Ok(None);
        }
        Ok(Some(text.trim().to_string()))
    }

    /// Waits for Enter while watching; stops pausing at the end of input.
    fn wait(&mut self) -> io::Result<()> {
        if self.line()?.is_none() {
            self.options.pause = false;
        }
        Ok(())
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
            levels: [1, 2],
            watch,
            reveal: true,
            pause: false,
            colour: false,
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
            text.contains("You cut") && text.contains(", your opponent "),
            "{text}"
        );
        assert!(
            text.contains("win the game") || text.contains("wins the game"),
            "{text}"
        );
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
