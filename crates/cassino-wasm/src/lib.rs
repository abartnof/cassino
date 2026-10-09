//! The table as a protocol: JSON out, one-line commands in
//! (`docs/PROTOCOL.md`).
//!
//! A client (the browser page, or anything that replaces it) holds no game
//! logic. It asks for the state, draws it, and sends back one command at a
//! time (`cassino_core::session` lists them):
//!
//! ```text
//! take 8S 5S 3H          a move, in the text form of cassino_core::moves
//! next                   deal the next hand, once the count has been seen
//! undo                   take back the last decision
//! set hints on           switch an aid: hints, explain, play_forced
//! (the hint query, when it answers, also records a `hint` command)
//! ```
//!
//! Two queries return JSON of their own: the **offer** for a selection
//! (a hand card and the table cards tapped, `3H AC 2D`), and the **hint**.
//! Every field comes from the person's view, so a client cannot show more
//! than the person at the table could know.
//!
//! Compiled to WebAssembly the crate exports a handful of functions (see
//! [`ffi`]), passing strings through linear memory, with no `wasm-bindgen`
//! (as bezique's does).

use cassino_core::advice::{self, Quality};
use cassino_core::cards::{Card, CardSet};
use cassino_core::hand::Clinch;
use cassino_core::learner::{self, Summary, EVIDENCE_VERSION};
use cassino_core::moves::{BuildKind, Move};
use cassino_core::rules::{Game, Rules};
use cassino_core::scoring::{Breakdown, Item as Line};
use cassino_core::select;
use cassino_core::session::{Event, EventKind, Prompt, Session, Settings};
use cassino_core::table::Seat;
use cassino_core::tutor::{self, Skill};
use cassino_core::words;

/// Bumped whenever the state changes shape in a way a client would notice.
pub const PROTOCOL: u32 = 1;

/// The rules from the numbers a page can pass: game 0 Classic, 1 Royal;
/// the settings as 0 or 1.
pub fn rules_of(game: u32, aces_fourteen: u32, sweeps: u32, raising: u32) -> Rules {
    Rules {
        game: if game == 1 {
            Game::Royal
        } else {
            Game::Classic
        },
        aces_fourteen: game == 1 && aces_fourteen == 1,
        sweeps: sweeps != 0,
        raising: raising != 0,
    }
}

/// A skill from thousandths, clamped to the dial.
pub fn skill_of(milli: u32) -> f64 {
    (f64::from(milli) / 1000.0).clamp(1.0, f64::from(cassino_core::agents::TOP))
}

/// A person's sitting from the numbers a page can pass.
pub fn sit_down(
    game: u32,
    aces_fourteen: u32,
    sweeps: u32,
    raising: u32,
    skill_milli: u32,
    seed: u32,
) -> Session {
    Session::new(
        u64::from(seed),
        Settings {
            rules: rules_of(game, aces_fourteen, sweeps, raising),
            skill: skill_of(skill_milli),
        },
    )
}

/// A watched game from the numbers a page can pass.
pub fn watch(
    game: u32,
    aces_fourteen: u32,
    sweeps: u32,
    raising: u32,
    south_milli: u32,
    north_milli: u32,
    seed: u32,
) -> Session {
    Session::watch(
        u64::from(seed),
        rules_of(game, aces_fourteen, sweeps, raising),
        [skill_of(south_milli), skill_of(north_milli)],
    )
}

// ---------------------------------------------------------------------------
// Writing JSON. From bezique crates/bezique-wasm/src/lib.rs @ 1b2179e: twenty
// lines rather than a dependency.
// ---------------------------------------------------------------------------

fn text(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// A number as JSON, which has no NaN or infinity: those are `null`.
fn number(x: f64) -> String {
    if x.is_finite() {
        x.to_string()
    } else {
        "null".into()
    }
}

fn object(fields: &[(&str, String)]) -> String {
    let body: Vec<String> = fields
        .iter()
        .map(|(k, v)| format!("{}:{}", text(k), v))
        .collect();
    format!("{{{}}}", body.join(","))
}

fn list(items: impl IntoIterator<Item = String>) -> String {
    format!("[{}]", items.into_iter().collect::<Vec<_>>().join(","))
}

fn or_null(value: Option<String>) -> String {
    value.unwrap_or_else(|| "null".to_string())
}

fn boolean(b: bool) -> String {
    b.to_string()
}

// ---------------------------------------------------------------------------
// The state.
// ---------------------------------------------------------------------------

fn card(c: Card) -> String {
    object(&[
        ("card", text(&c.to_string())),
        ("label", text(&c.label())),
        ("rank", c.rank().to_string()),
        ("suit", text(&c.suit().letter().to_string())),
    ])
}

/// Cards in the order a fishing hand is read: by rank, then suit.
fn cards(set: CardSet) -> String {
    let mut ordered: Vec<Card> = set.iter().collect();
    ordered.sort_by_key(|c| (c.rank(), c.suit()));
    list(ordered.into_iter().map(card))
}

fn whose(you: bool) -> String {
    text(if you { "you" } else { "them" })
}

fn tally(t: &cassino_core::scoring::Tally) -> String {
    object(&[
        ("cards", t.cards.to_string()),
        ("spades", t.spades.to_string()),
        ("aces", t.aces.to_string()),
        ("big_casino", boolean(t.big_casino)),
        ("little_casino", boolean(t.little_casino)),
        ("sweeps", t.sweeps.to_string()),
    ])
}

fn totals(t: [u32; 2]) -> String {
    object(&[("you", t[0].to_string()), ("them", t[1].to_string())])
}

fn breakdown(b: &Breakdown) -> String {
    let lines = b.lines().into_iter().map(|(item, seat, points)| {
        let (name, suit) = match item {
            Line::Cards => ("cards", None),
            Line::Spades => ("spades", None),
            Line::BigCasino => ("big_casino", None),
            Line::LittleCasino => ("little_casino", None),
            Line::Ace(s) => ("ace", Some(s.letter())),
            Line::Sweeps => ("sweeps", None),
        };
        object(&[
            ("item", text(name)),
            ("suit", or_null(suit.map(|s| text(&s.to_string())))),
            ("who", whose(seat == Seat::South)),
            ("points", points.to_string()),
        ])
    });
    object(&[
        ("lines", list(lines)),
        (
            "tallies",
            object(&[
                ("you", tally(&b.tallies[0])),
                ("them", tally(&b.tallies[1])),
            ]),
        ),
        ("total", b.total().to_string()),
    ])
}

fn move_fields(m: &Move) -> Vec<(&'static str, String)> {
    let mut f = vec![("move", text(&m.to_string())), ("card", card(m.card()))];
    match *m {
        Move::Trail { .. } => f.push(("type", text("trail"))),
        Move::Capture { value, taken, .. } => {
            f.push(("type", text("take")));
            f.push(("value", value.to_string()));
            f.push(("taken", cards(taken)));
        }
        Move::Build {
            value, onto, loose, ..
        } => {
            f.push(("type", text("build")));
            f.push(("value", value.to_string()));
            f.push(("onto", or_null(onto.map(card))));
            f.push(("loose", cards(loose)));
        }
    }
    f
}

fn event(e: &Event) -> String {
    let mut fields: Vec<(&str, String)> = vec![
        ("hand", e.hand.to_string()),
        ("text", text(&e.text)),
        ("notes", list(e.notes.iter().map(|n| text(n)))),
    ];
    let kind = match &e.kind {
        EventKind::Cut { yours, theirs } => {
            fields.push(("yours", card(*yours)));
            fields.push(("theirs", card(*theirs)));
            "cut"
        }
        EventKind::FirstDealer { you } => {
            fields.push(("you", boolean(*you)));
            "first_dealer"
        }
        EventKind::Dealt {
            deal,
            last,
            you_deal,
            yours,
            table,
        } => {
            fields.push(("deal", deal.to_string()));
            fields.push(("last", boolean(*last)));
            fields.push(("you_deal", boolean(*you_deal)));
            fields.push(("yours", cards(*yours)));
            fields.push(("table", cards(*table)));
            "dealt"
        }
        EventKind::Played {
            you,
            mv,
            groups,
            call,
            build,
            left,
        } => {
            fields.push(("you", boolean(*you)));
            fields.extend(move_fields(mv));
            fields.push(("groups", list(groups.iter().map(|g| cards(*g)))));
            fields.push(("call", or_null(call.as_deref().map(text))));
            let (kind, from, multiple) = match build {
                None => ("null".to_string(), "null".to_string(), "null".to_string()),
                Some((kind, multiple)) => {
                    let (name, from) = match kind {
                        BuildKind::New => ("new", "null".to_string()),
                        BuildKind::Raise { from } => ("raise", from.to_string()),
                        BuildKind::Add => ("add", "null".to_string()),
                    };
                    (text(name), from, boolean(*multiple))
                }
            };
            fields.push(("build_kind", kind));
            fields.push(("raised_from", from));
            fields.push(("multiple", multiple));
            fields.push(("left", cards(*left)));
            "played"
        }
        EventKind::Swept { you } => {
            fields.push(("you", boolean(*you)));
            "swept"
        }
        EventKind::Cash { you } => {
            fields.push(("you", boolean(*you)));
            "cash"
        }
        EventKind::Clinched { you, what } => {
            fields.push(("you", boolean(*you)));
            fields.push((
                "what",
                text(if *what == Clinch::Cards {
                    "cards"
                } else {
                    "spades"
                }),
            ));
            "clinched"
        }
        EventKind::Residue { you, cards: c } => {
            fields.push(("you", or_null(you.map(boolean))));
            fields.push(("cards", cards(*c)));
            "residue"
        }
        EventKind::Scored { breakdown: b } => {
            fields.push(("count", breakdown(b)));
            "scored"
        }
        EventKind::HandEnds {
            yours,
            theirs,
            totals: t,
        } => {
            fields.push(("yours", yours.to_string()));
            fields.push(("theirs", theirs.to_string()));
            fields.push(("totals", totals(*t)));
            "hand_ends"
        }
        EventKind::GameEnds { you_won, totals: t } => {
            fields.push(("you_won", boolean(*you_won)));
            fields.push(("totals", totals(*t)));
            "game_ends"
        }
        EventKind::Verdict {
            quality,
            better,
            loss,
        } => {
            fields.push((
                "quality",
                text(if *quality == Quality::Blunder {
                    "blunder"
                } else {
                    "dubious"
                }),
            ));
            fields.push(("better", text(&better.to_string())));
            fields.push(("loss", format!("{loss:.2}")));
            "verdict"
        }
    };
    fields.insert(0, ("kind", text(kind)));
    object(&fields)
}

/// The whole state as JSON, from the person's side (South's, when
/// watching).
pub fn state(session: &Session) -> String {
    let view = session.view();
    let rules = view.rules;
    let game = session.game();
    let prompt = match session.prompt() {
        Prompt::Play => "play",
        Prompt::NextHand => "next_hand",
        Prompt::Over => "over",
    };
    let items = session.items().iter().map(|item| {
        let set: CardSet = item.cards.iter().copied().collect();
        let build = view.table.builds.iter().find(|b| b.cards == set).map(|b| {
            object(&[
                ("value", b.value.to_string()),
                ("multiple", boolean(b.multiple)),
                ("controller", whose(b.controller == Seat::South)),
                (
                    "call",
                    text(&if b.multiple {
                        words::value_plural(b.value)
                    } else {
                        words::value_word(b.value).to_string()
                    }),
                ),
            ])
        });
        object(&[
            ("id", item.id.to_string()),
            ("cards", list(item.cards.iter().map(|&c| card(c)))),
            ("build", or_null(build)),
        ])
    });
    let unseen = advice::unseen(&view);
    let tallies = |seat: Seat| {
        tally(&cassino_core::scoring::Tally::of(
            view.piles[seat.index()],
            view.sweeps[seat.index()],
        ))
    };
    let aids = session.aids();
    object(&[
        ("protocol", PROTOCOL.to_string()),
        ("seed", session.seed().to_string()),
        (
            "rules",
            object(&[
                (
                    "game",
                    text(if rules.game == Game::Royal {
                        "royal"
                    } else {
                        "classic"
                    }),
                ),
                ("aces14", boolean(rules.aces_fourteen)),
                ("sweeps", boolean(rules.sweeps)),
                ("raising", boolean(rules.raising)),
            ]),
        ),
        ("skill", number(session.settings().skill)),
        ("watching", boolean(session.watching())),
        ("prompt", text(prompt)),
        ("hand", cards(view.hand)),
        (
            "moves",
            list(session.candidates().iter().map(|m| text(&m.to_string()))),
        ),
        ("opponent_holds", view.opponent_holds.to_string()),
        ("undealt", view.undealt.to_string()),
        ("deal", view.deal.to_string()),
        (
            "hand_number",
            (game.history().len() + usize::from(!game.hand().is_over()))
                .max(1)
                .to_string(),
        ),
        ("dealer", whose(view.dealer == Seat::South)),
        (
            "to_move",
            or_null(view.to_move.map(|s| whose(s == Seat::South))),
        ),
        ("table_cards", view.table.cards().len().to_string()),
        ("table", list(items)),
        (
            "piles",
            object(&[
                ("you", tallies(Seat::South)),
                ("them", tallies(Seat::North)),
            ]),
        ),
        (
            "last_capturer",
            or_null(view.last_capturer.map(|s| whose(s == Seat::South))),
        ),
        ("scores", totals(game.scores())),
        ("target", cassino_core::game::TARGET.to_string()),
        ("events", list(session.events().iter().map(event))),
        ("can_undo", boolean(session.can_undo())),
        (
            "aids",
            object(&[
                ("hints", boolean(aids.hints)),
                ("explain", boolean(aids.explain)),
                ("play_forced", boolean(aids.play_forced)),
            ]),
        ),
        ("error", or_null(session.error().map(text))),
        ("error_code", or_null(session.error_code().map(text))),
        (
            "record_version",
            cassino_core::session::RECORD_VERSION.to_string(),
        ),
        ("saved", text(&session.saved().to_text())),
        (
            "unseen",
            object(&[
                ("aces", cards(unseen.aces)),
                ("big_casino", boolean(unseen.big_casino)),
                ("little_casino", boolean(unseen.little_casino)),
                ("spades", unseen.spades.to_string()),
                ("cards", unseen.cards.to_string()),
            ]),
        ),
        (
            "sweep_values",
            list(
                advice::sweep_values(&rules, &view.table)
                    .iter()
                    .map(|v| v.to_string()),
            ),
        ),
        ("record", list(session.record().iter().map(|r| text(r)))),
    ])
}

fn error(why: &str) -> String {
    object(&[("error", text(why))])
}

/// A sitting restored from the text of its `Saved` record.
pub fn restore(text: &str) -> Result<Session, String> {
    Session::restore(&cassino_core::session::Saved::parse(text)?)
}

/// The offer for a selection, `"<hand card> [table cards…]"`, as JSON: the
/// moves it makes exactly, the cards that could still be added, the running
/// sum, and why each other item cannot join.
pub fn offer(session: &Session, selection: &str) -> String {
    if session.prompt() != Prompt::Play || session.watching() {
        return error("It is not your turn.");
    }
    let mut words_in = selection.split_whitespace();
    let Some(first) = words_in.next() else {
        return error("Choose a card from your hand.");
    };
    let played: Card = match first.parse() {
        Ok(c) => c,
        Err(e) => return error(&e.to_string()),
    };
    let view = session.view();
    if !view.hand.contains(played) {
        return error("That card is not in your hand.");
    }
    let picked = match CardSet::parse(&words_in.collect::<Vec<_>>().join(" ")) {
        Ok(p) => p,
        Err(e) => return error(&e.to_string()),
    };
    if !view.table.cards().contains_all(picked) {
        return error("Some of those cards aren't on the table.");
    }
    let rules = view.rules;
    let o = select::offer(&rules, &view.table, view.hand, Seat::South, played, picked);
    let moves = o.moves.iter().map(|m| {
        let (kind, label, value, multiple) = match *m {
            Move::Trail { .. } => ("trail", "Trail".to_string(), None, false),
            Move::Capture { value, .. } => ("take", "Take".to_string(), Some(value), false),
            Move::Build { value, .. } => {
                let multiple = cassino_core::moves::build_kind(&rules, &view.table, m)
                    .is_some_and(|(_, mult)| mult);
                let label = if multiple {
                    format!("Build {value}s")
                } else {
                    format!("Build {value}")
                };
                ("build", label, Some(value), multiple)
            }
        };
        object(&[
            ("move", text(&m.to_string())),
            (
                "chip",
                object(&[
                    ("kind", text(kind)),
                    ("label", text(&label)),
                    ("value", or_null(value.map(|v| v.to_string()))),
                    ("multiple", boolean(multiple)),
                ]),
            ),
            ("said", text(&words::advise(&rules, &view.table, m))),
            (
                "call",
                or_null(words::call(&rules, &view.table, m).as_deref().map(text)),
            ),
            ("leaves_sweep", leaves_sweep(&view, m)),
        ])
    });
    object(&[
        ("card", card(played)),
        ("picked", cards(select::whole(&view.table, picked))),
        ("sum", or_null(o.sum.map(|s| s.to_string()))),
        ("moves", list(moves)),
        ("can_add", cards(o.can_add)),
        (
            "why_not",
            list(
                o.why_not.iter().map(|(c, why)| {
                    object(&[("card", card(*c)), ("reason", text(&why.to_string()))])
                }),
            ),
        ),
    ])
}

/// Whether a move of the person's would leave the table to a sweep by the
/// opponent: the capture values that would clear it and how many cards of
/// them the person cannot see (the sweep warning, before the move is made),
/// or `null`.
fn leaves_sweep(view: &cassino_core::observation::View, mv: &Move) -> String {
    advice::notes(view, Seat::South, mv)
        .into_iter()
        .find_map(|n| match n {
            advice::Note::SweepOpen {
                next: Seat::North,
                values,
                unseen,
                ..
            } => Some(object(&[
                ("values", list(values.iter().map(|v| v.to_string()))),
                ("unseen", unseen.to_string()),
                (
                    "words",
                    text(&cassino_core::words::sweep_warning(
                        &view.rules,
                        &values,
                        unseen,
                    )),
                ),
            ])),
            _ => None,
        })
        .unwrap_or_else(|| "null".into())
}

/// Every hand's deals once the game is over, as JSON, or `null` while it is
/// played: `{hands: [{hand, dealer, deals: [{you, them, table}]}]}`, for the
/// replay with both hands face up.
pub fn reveal(session: &Session) -> String {
    let Some(hands) = session.deals() else {
        return "null".into();
    };
    let hands = hands.iter().enumerate().map(|(i, (dealer, deals))| {
        object(&[
            ("hand", (i + 1).to_string()),
            ("dealer", whose(*dealer == Seat::South)),
            (
                "deals",
                list(deals.iter().map(|d| {
                    object(&[
                        ("you", cards(d[Seat::South.index()])),
                        ("them", cards(d[Seat::North.index()])),
                        ("table", cards(d[2])),
                    ])
                })),
            ),
        ])
    });
    object(&[("hands", list(hands))])
}

/// The hint, as JSON, or `null` when hints are off or it is not the
/// person's turn.
pub fn hint(session: &mut Session) -> String {
    let Some(h) = session.hint() else {
        return "null".into();
    };
    // The hint is shown: the decision it was for is no evidence of what the
    // person knows. A recorded command, not a change to the game.
    session.send("hint");
    let view = session.view();
    let rules = view.rules;
    object(&[
        ("move", text(&h.mv.to_string())),
        ("advice", text(&words::advise(&rules, &view.table, &h.mv))),
        ("value", format!("{:.3}", h.value)),
        (
            "notes",
            list(
                h.notes
                    .iter()
                    .map(|n| text(&words::note_text(&rules, n, Seat::South))),
            ),
        ),
    ])
}

// ---------------------------------------------------------------------------
// The tutor: evidence, the brief, the learner, the nudge (`docs/PROTOCOL.md`).
// ---------------------------------------------------------------------------

/// The line that separates summaries in the text a client passes in.
pub const SUMMARY_SEPARATOR: &str = "--";

/// Summaries from their text, oldest first, separated by lines of `--`. An
/// entry that is empty, or does not parse, is `None`: it counts as stale
/// (the client recomputes it from its record).
pub fn summaries(text: &str) -> Vec<Option<Summary>> {
    if text.trim().is_empty() {
        return Vec::new();
    }
    let mut out = vec![String::new()];
    for line in text.lines() {
        if line.trim() == SUMMARY_SEPARATOR {
            out.push(String::new());
        } else if let Some(last) = out.last_mut() {
            last.push_str(line);
            last.push('\n');
        }
    }
    out.iter().map(|t| Summary::parse(t).ok()).collect()
}

/// This game's evidence summary as `{"summary": text}` once the game is
/// over; `null` before and in a watched game. Runs the advisor over the
/// game (about 0.8 s natively): the client calls it off the game-end path.
pub fn evidence(session: &Session) -> String {
    match session.evidence() {
        Some(summary) => object(&[("summary", text(&summary.to_text()))]),
        None => "null".into(),
    }
}

/// The summary of a stored record (a saved text of a finished game), as
/// [`evidence`] gives it: `{"summary": text}`, or `{"error": …}` when the
/// text does not restore or the game was not over.
pub fn evidence_of(record: &str) -> String {
    // Explanations off: they cost an advisor run a move and the evidence has no use for them.
    match cassino_core::session::Saved::parse(record)
        .and_then(|saved| Session::restore_quietly(&saved))
    {
        Ok(session) if session.prompt() == Prompt::Over && !session.watching() => {
            evidence(&session)
        }
        Ok(_) => error("that game was not finished"),
        Err(why) => error(&why),
    }
}

/// The learner over the summaries in `history` (oldest first, separated
/// by `--`): `{games, focus, mastered, stale}`. `focus` is a skill's slug
/// or `null`; `mastered` the slugs; `stale` the indexes of entries the
/// client must recompute from their records before they count.
pub fn learner_of(history: &str) -> String {
    let all = summaries(history);
    let stale = all
        .iter()
        .enumerate()
        .filter(|(_, s)| s.as_ref().is_none_or(|s| !s.is_current()))
        .map(|(i, _)| i.to_string());
    let stale = list(stale);
    let kept: Vec<Summary> = all.into_iter().flatten().collect();
    let learnt = learner::learn(&kept);
    object(&[
        ("games", learnt.games.to_string()),
        ("focus", or_null(learnt.focus.map(|s| text(s.slug())))),
        (
            "mastered",
            list(
                Skill::ALL
                    .into_iter()
                    .filter(|&s| learnt.mastered(s))
                    .map(|s| text(s.slug())),
            ),
        ),
        ("stale", stale),
        ("version", EVIDENCE_VERSION.to_string()),
    ])
}

/// The brief of a finished game, in bullets and a method: `{bullets:
/// [{lead, text}], method}`; `null` before the game is over. `input` is
/// this game's summary (empty to have it worked out here), then, after a
/// `--` line, the earlier games' summaries, oldest first.
pub fn brief_of(session: &Session, input: &str) -> String {
    brief_fields(session, input, None)
}

/// The brief's JSON, with the game's summary added when `summary` is given.
fn brief_fields(session: &Session, input: &str, summary: Option<&Summary>) -> String {
    let (game, history) = match input.split_once(&format!("\n{SUMMARY_SEPARATOR}\n")) {
        Some((game, rest)) => (game, rest),
        None if input.trim() == SUMMARY_SEPARATOR => ("", ""),
        None => (input, ""),
    };
    // Without the game's summary it is worked out here, sharing the
    // advisor pass with the review.
    let Some(game) = Summary::parse(game).ok().or_else(|| session.evidence()) else {
        return "null".into();
    };
    let history: Vec<Summary> = summaries(history).into_iter().flatten().collect();
    let Some(brief) = session.brief_with(&game, &history) else {
        return "null".into();
    };
    let mut fields = vec![
        (
            "bullets",
            list(
                brief
                    .bullets
                    .iter()
                    .map(|b| object(&[("lead", text(&b.lead)), ("text", text(&b.text))])),
            ),
        ),
        ("method", text(&brief.method)),
    ];
    if let Some(summary) = summary {
        fields.push(("summary", text(&summary.to_text())));
    }
    object(&fields)
}

/// The brief of a stored record (the saved text of a finished game), the
/// sitting left alone: `{bullets, method, summary}`, `summary` being the
/// game's own, worked out in the same advisor pass. `input` is the record,
/// a line `==`, then the earlier games' summaries, oldest first, separated
/// by `--` lines (empty: none). `null` if the record does not restore or the
/// game was not over. For a client that keeps no sitting of the game (a
/// worker).
pub fn brief_of_record(input: &str) -> String {
    let Some((record, history)) = input.split_once("\n==\n") else {
        return "null".into();
    };
    let Ok(session) = cassino_core::session::Saved::parse(record)
        .and_then(|saved| Session::restore_quietly(&saved))
    else {
        return "null".into();
    };
    if session.prompt() != Prompt::Over || session.watching() {
        return "null".into();
    }
    let Some(summary) = session.evidence() else {
        return "null".into();
    };
    let rest = format!("{}\n{SUMMARY_SEPARATOR}\n{history}", summary.to_text());
    brief_fields(&session, &rest, Some(&summary))
}

/// Sets the tutor's focus (a skill's slug, or empty for none); false if the
/// slug is not a skill.
pub fn set_focus(session: &mut Session, slug: &str) -> bool {
    let slug = slug.trim();
    if slug.is_empty() {
        session.set_focus(None);
        return true;
    }
    match Skill::from_slug(slug) {
        Some(skill) => {
            session.set_focus(Some(skill));
            true
        }
        None => false,
    }
}

/// The nudge for the current decision: `{skill, words}` or `null`. One
/// advisor run per decision until it fires (the session remembers the
/// answer). Showing it is the recorded command `nudged <skill>`.
pub fn nudge(session: &Session) -> String {
    let Some(skill) = session.nudge() else {
        return "null".into();
    };
    object(&[
        ("skill", text(skill.slug())),
        ("words", text(tutor::nudge_words(skill))),
    ])
}

// ---------------------------------------------------------------------------
// Scripted games, for checking that every build plays alike.
// ---------------------------------------------------------------------------

/// FNV-1a over the bytes: the same function the Node check computes.
pub fn fnv(bytes: &[u8]) -> u64 {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for &b in bytes {
        h ^= u64::from(b);
        h = h.wrapping_mul(0x0100_0000_01b3);
    }
    h
}

/// Plays a scripted game to its end: at its `n`th decision the person plays
/// the move at index `n` modulo how many are offered, or deals the next
/// hand. Returns the hash of the final state's JSON. The Node check
/// (`tests/smoke.mjs`) plays the same script through the module and must
/// get the same hash.
pub fn scripted(game: u32, aces_fourteen: u32, sweeps: u32, skill_milli: u32, seed: u32) -> u64 {
    let mut session = sit_down(game, aces_fourteen, sweeps, 1, skill_milli, seed);
    let mut n = 0;
    loop {
        match session.prompt() {
            Prompt::Over => break,
            Prompt::NextHand => {
                session.send("next");
            }
            Prompt::Play => {
                let moves = session.candidates();
                session.send(&moves[n % moves.len()].to_string());
            }
        }
        n += 1;
    }
    fnv(state(&session).as_bytes())
}

// ---------------------------------------------------------------------------
// The exports.
// ---------------------------------------------------------------------------

pub mod ffi {
    use super::{
        brief_of, brief_of_record, evidence, evidence_of, hint, learner_of, nudge, offer, reveal,
        set_focus, sit_down, state, watch, Session,
    };
    use std::cell::RefCell;

    thread_local! {
        static SESSION: RefCell<Option<Session>> = const { RefCell::new(None) };
        static OUT: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
        static IN: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
    }

    /// A buffer of `len` bytes for the host to write a command into. Valid
    /// until the next call to this function.
    #[no_mangle]
    pub extern "C" fn cassino_alloc(len: usize) -> *mut u8 {
        IN.with(|buffer| {
            let mut buffer = buffer.borrow_mut();
            buffer.clear();
            buffer.resize(len, 0);
            buffer.as_mut_ptr()
        })
    }

    /// Sits down at a new table, discarding any old one: game 0 Classic or
    /// 1 Royal; aces at 14, sweeps and raising as 0 or 1; skill in
    /// thousandths.
    #[no_mangle]
    pub extern "C" fn cassino_new(
        game: u32,
        aces_fourteen: u32,
        sweeps: u32,
        raising: u32,
        skill_milli: u32,
        seed: u32,
    ) {
        SESSION.with(|s| {
            *s.borrow_mut() = Some(sit_down(
                game,
                aces_fourteen,
                sweeps,
                raising,
                skill_milli,
                seed,
            ))
        });
        render();
    }

    /// Two computer players to watch, at skills in thousandths.
    #[no_mangle]
    pub extern "C" fn cassino_watch(
        game: u32,
        aces_fourteen: u32,
        sweeps: u32,
        raising: u32,
        south_milli: u32,
        north_milli: u32,
        seed: u32,
    ) {
        SESSION.with(|s| {
            *s.borrow_mut() = Some(watch(
                game,
                aces_fourteen,
                sweeps,
                raising,
                south_milli,
                north_milli,
                seed,
            ))
        });
        render();
    }

    fn input(len: usize) -> String {
        IN.with(|buffer| {
            let buffer = buffer.borrow();
            String::from_utf8_lossy(&buffer[..len.min(buffer.len())]).into_owned()
        })
    }

    /// Carries out the command in the `len` bytes just written; 1 if
    /// accepted. The state is rendered either way.
    #[no_mangle]
    pub extern "C" fn cassino_send(len: usize) -> u32 {
        let command = input(len);
        let accepted = SESSION.with(|s| {
            s.borrow_mut()
                .as_mut()
                .is_some_and(|session| session.send(&command))
        });
        render();
        u32::from(accepted)
    }

    /// One step of a watched game; 1 if a step was made.
    #[no_mangle]
    pub extern "C" fn cassino_step() -> u32 {
        let stepped = SESSION.with(|s| s.borrow_mut().as_mut().is_some_and(Session::step));
        render();
        u32::from(stepped)
    }

    /// Renders the offer for the selection in the `len` bytes just written.
    #[no_mangle]
    pub extern "C" fn cassino_offer(len: usize) {
        let selection = input(len);
        let json = SESSION.with(|s| {
            s.borrow()
                .as_ref()
                .map_or_else(|| "null".to_string(), |session| offer(session, &selection))
        });
        OUT.with(|out| *out.borrow_mut() = json.into_bytes());
    }

    /// Renders the hint.
    #[no_mangle]
    pub extern "C" fn cassino_hint() {
        let json = SESSION.with(|s| {
            s.borrow_mut()
                .as_mut()
                .map_or_else(|| "null".to_string(), hint)
        });
        OUT.with(|out| *out.borrow_mut() = json.into_bytes());
    }

    fn give(json: String) {
        OUT.with(|out| *out.borrow_mut() = json.into_bytes());
    }

    /// Renders this game's evidence summary, once it is over (`null`
    /// before). The advisor runs over the whole game: call it off the
    /// game-end path.
    #[no_mangle]
    pub extern "C" fn cassino_evidence() {
        give(SESSION.with(|s| {
            s.borrow()
                .as_ref()
                .map_or_else(|| "null".to_string(), evidence)
        }));
    }

    /// Renders the summary of the stored record in the `len` bytes just
    /// written, without touching the sitting.
    #[no_mangle]
    pub extern "C" fn cassino_evidence_of(len: usize) {
        give(evidence_of(&input(len)));
    }

    /// Renders the learner over the summaries in the `len` bytes just
    /// written (separated by `--` lines, oldest first).
    #[no_mangle]
    pub extern "C" fn cassino_learner(len: usize) {
        give(learner_of(&input(len)));
    }

    /// Renders the brief of the finished game, from the summaries in the
    /// `len` bytes just written (this game's, `--`, then the history).
    #[no_mangle]
    pub extern "C" fn cassino_brief(len: usize) {
        let history = input(len);
        give(SESSION.with(|s| {
            s.borrow()
                .as_ref()
                .map_or_else(|| "null".to_string(), |session| brief_of(session, &history))
        }));
    }

    /// Renders the brief of the stored record in the `len` bytes just
    /// written (see [`brief_of_record`]), the sitting left alone.
    #[no_mangle]
    pub extern "C" fn cassino_brief_of_record(len: usize) {
        give(brief_of_record(&input(len)));
    }

    /// Sets the tutor's focus from the skill slug in the `len` bytes just
    /// written (empty: none); 1 if it was a skill.
    #[no_mangle]
    pub extern "C" fn cassino_set_focus(len: usize) -> u32 {
        let slug = input(len);
        u32::from(SESSION.with(|s| {
            s.borrow_mut()
                .as_mut()
                .is_some_and(|session| set_focus(session, &slug))
        }))
    }

    /// Renders the nudge for the current decision, if any.
    #[no_mangle]
    pub extern "C" fn cassino_nudge() {
        give(SESSION.with(|s| {
            s.borrow()
                .as_ref()
                .map_or_else(|| "null".to_string(), nudge)
        }));
    }

    /// Renders every hand's deals, once the game is over (`null` before).
    #[no_mangle]
    pub extern "C" fn cassino_reveal() {
        let json = SESSION.with(|s| {
            s.borrow()
                .as_ref()
                .map_or_else(|| "null".to_string(), reveal)
        });
        OUT.with(|out| *out.borrow_mut() = json.into_bytes());
    }

    /// Restores a sitting from the saved text in the `len` bytes just
    /// written; 1 if it fitted. Otherwise the old sitting stays, and the
    /// rendered JSON is `{"error": …}`.
    #[no_mangle]
    pub extern "C" fn cassino_restore(len: usize) -> u32 {
        match super::restore(&input(len)) {
            Ok(session) => {
                SESSION.with(|s| *s.borrow_mut() = Some(session));
                render();
                1
            }
            Err(why) => {
                OUT.with(|out| *out.borrow_mut() = super::error(&why).into_bytes());
                0
            }
        }
    }

    /// Renders the state again (after an offer or a hint).
    #[no_mangle]
    pub extern "C" fn cassino_render() {
        render();
    }

    /// Where the last rendered JSON begins.
    #[no_mangle]
    pub extern "C" fn cassino_out() -> *const u8 {
        OUT.with(|out| out.borrow().as_ptr())
    }

    #[no_mangle]
    pub extern "C" fn cassino_out_len() -> usize {
        OUT.with(|out| out.borrow().len())
    }

    fn render() {
        let json = SESSION.with(|s| {
            s.borrow()
                .as_ref()
                .map_or_else(|| "null".to_string(), state)
        });
        OUT.with(|out| *out.borrow_mut() = json.into_bytes());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Value;

    fn parse(json: &str) -> Value {
        serde_json::from_str(json).unwrap_or_else(|e| panic!("not JSON ({e}): {json}"))
    }

    fn cards_of(v: &Value) -> Vec<String> {
        v.as_array()
            .unwrap()
            .iter()
            .map(|c| c["card"].as_str().unwrap().to_string())
            .collect()
    }

    #[test]
    fn the_state_is_json_with_the_documented_fields() {
        let s = sit_down(0, 0, 1, 1, 3000, 7);
        let v = parse(&state(&s));
        assert_eq!(v["protocol"], PROTOCOL);
        assert_eq!(v["seed"], 7);
        assert_eq!(v["rules"]["game"], "classic");
        assert_eq!(v["rules"]["sweeps"], true);
        assert_eq!(v["skill"], 3.0);
        assert_eq!(number(f64::NAN), "null");
        assert_eq!(number(f64::INFINITY), "null");
        assert_eq!(number(2.5), "2.5");
        assert_eq!(v["prompt"], "play");
        assert_eq!(v["watching"], false);
        assert_eq!(cards_of(&v["hand"]).len(), 4);
        let moves: Vec<String> = v["moves"]
            .as_array()
            .unwrap()
            .iter()
            .map(|m| m.as_str().unwrap().to_string())
            .collect();
        assert_eq!(
            moves,
            s.candidates()
                .iter()
                .map(|m| m.to_string())
                .collect::<Vec<_>>()
        );
        assert!(v["table"].as_array().is_some());
        assert_eq!(
            v["opponent_holds"].as_u64().unwrap()
                + v["undealt"].as_u64().unwrap()
                + 4
                + v["table_cards"].as_u64().unwrap()
                + v["piles"]["you"]["cards"].as_u64().unwrap()
                + v["piles"]["them"]["cards"].as_u64().unwrap(),
            52
        );
        assert_eq!(v["scores"]["you"], 0);
        assert_eq!(v["target"], 21);
        assert!(v["events"]
            .as_array()
            .unwrap()
            .iter()
            .any(|e| e["kind"] == "cut"));
        assert_eq!(v["can_undo"], false);
        assert_eq!(v["aids"]["hints"], false);
        assert!(v["error"].is_null());
        assert!(v["unseen"]["aces"].as_array().is_some());
        assert!(v["record"].as_array().unwrap().is_empty());
    }

    #[test]
    fn a_game_plays_out_through_the_protocol() {
        let mut s = sit_down(1, 1, 1, 1, 2500, 3);
        for _ in 0..2_000 {
            let v = parse(&state(&s));
            match v["prompt"].as_str().unwrap() {
                "play" => {
                    let first = s.candidates()[0].to_string();
                    assert!(s.send(&first));
                }
                "next_hand" => assert!(s.send("next")),
                "over" => {
                    let ends = v["events"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .filter(|e| e["kind"] == "game_ends")
                        .count();
                    assert_eq!(ends, 1);
                    let scored = v["events"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .find(|e| e["kind"] == "scored")
                        .unwrap();
                    let lines = scored["count"]["lines"].as_array().unwrap();
                    assert!(
                        !lines.is_empty()
                            && lines.iter().all(|l| l["points"].as_u64().unwrap() > 0)
                    );
                    let total: u64 = lines.iter().map(|l| l["points"].as_u64().unwrap()).sum();
                    assert_eq!(total, scored["count"]["total"].as_u64().unwrap());
                    return;
                }
                other => panic!("{other}"),
            }
        }
        panic!("the game did not end");
    }

    #[test]
    fn a_refused_command_reports_its_error() {
        let mut s = sit_down(0, 0, 1, 1, 3000, 7);
        assert!(!s.send("trail ZZ"));
        let v = parse(&state(&s));
        assert!(v["error"].as_str().unwrap().contains("not a card"));
    }

    #[test]
    fn the_state_never_names_a_card_in_the_opponents_hand() {
        for seed in 0..20u32 {
            let mut s = sit_down(seed % 2, 1, 1, 1, 3000, seed);
            for _ in 0..200 {
                let json = state(&s);
                let v = parse(&json);
                // Every string in the state, but: the cut (drawn from another
                // shuffle, before the deal); earlier hands' events (the pack
                // is shuffled again for every hand); and the unseen summary
                // (which names cards in the opponent's hand *or* the stock,
                // and cannot tell which: the next test checks it).
                let current = v["hand_number"].clone();
                let mut events = v.clone();
                events["unseen"] = Value::Null;
                events["events"] = Value::Array(
                    v["events"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .filter(|e| e["kind"] != "cut" && e["hand"] == current)
                        .cloned()
                        .collect(),
                );
                let flat = events.to_string();
                for c in s.game().hand().hand_of(Seat::North) {
                    assert!(
                        !flat.contains(&format!("\"{c}\"")),
                        "seed {seed}: {c} leaked"
                    );
                    assert!(
                        !flat.contains(&c.label()),
                        "seed {seed}: {} leaked",
                        c.label()
                    );
                }
                match v["prompt"].as_str().unwrap() {
                    "play" => {
                        let m = s.candidates()[seed as usize % s.candidates().len()].to_string();
                        assert!(s.send(&m));
                    }
                    "next_hand" => assert!(s.send("next")),
                    _ => break,
                }
            }
        }
    }

    #[test]
    fn the_state_is_the_same_however_the_hidden_cards_lie() {
        // Two sittings whose deals differ only in the opponent's hand and
        // the stock, at the first decision: the person's state must match.
        // (The record differs from seed to seed, so compare views instead.)
        for seed in 0..30u32 {
            let s = sit_down(0, 0, 1, 1, 1000, seed);
            let view = s.view();
            let mut rng = cassino_core::rng::Rng::seeded(u64::from(seed) + 99);
            let (hidden, undealt) = cassino_core::observation::sample_hidden(&view, &mut rng);
            let world = view.world(hidden, &undealt);
            assert_eq!(world.view(Seat::South, view.scores), view);
            let summary = |v: &cassino_core::observation::View| {
                let u = advice::unseen(v);
                (u.aces, u.big_casino, u.little_casino, u.spades, u.cards)
            };
            assert_eq!(
                summary(&world.view(Seat::South, view.scores)),
                summary(&view)
            );
        }
    }

    #[test]
    fn table_items_carry_their_builds() {
        let mut s = sit_down(0, 0, 1, 1, 1000, 12);
        for _ in 0..400 {
            let v = parse(&state(&s));
            for item in v["table"].as_array().unwrap() {
                let n = item["cards"].as_array().unwrap().len();
                assert_eq!(item["build"].is_null(), n == 1, "{item}");
                if !item["build"].is_null() {
                    assert!(item["build"]["value"].as_u64().unwrap() >= 1);
                    assert!(
                        ["you", "them"].contains(&item["build"]["controller"].as_str().unwrap())
                    );
                }
            }
            match v["prompt"].as_str().unwrap() {
                "play" => {
                    let builds: Vec<Move> = s
                        .candidates()
                        .into_iter()
                        .filter(|m| matches!(m, Move::Build { .. }))
                        .collect();
                    let m = builds.first().copied().unwrap_or(s.candidates()[0]);
                    assert!(s.send(&m.to_string()));
                }
                "next_hand" => assert!(s.send("next")),
                _ => break,
            }
        }
    }

    #[test]
    fn an_offer_answers_a_selection() {
        let s = sit_down(0, 0, 1, 1, 3000, 7);
        let card = s.view().hand.first().unwrap();
        let v = parse(&offer(&s, &card.to_string()));
        let moves: Vec<&str> = v["moves"]
            .as_array()
            .unwrap()
            .iter()
            .map(|m| m["move"].as_str().unwrap())
            .collect();
        assert!(
            moves.contains(&format!("trail {card}").as_str())
                || s.view().table.controls_any(Seat::South)
        );
        assert!(v["can_add"].as_array().is_some());
        assert!(v["why_not"].as_array().is_some());
        assert!(v["moves"]
            .as_array()
            .unwrap()
            .iter()
            .all(|m| ["trail", "take", "build"].contains(&m["chip"]["kind"].as_str().unwrap())));
        assert!(parse(&offer(&s, "ZZ"))["error"].is_string());
        assert!(parse(&offer(&s, "")).get("error").is_some());
    }

    #[test]
    fn an_offer_warns_of_a_sweep_left_open() {
        for sweeps in [1, 0] {
            warns_of_a_sweep(sweeps);
        }
    }

    fn warns_of_a_sweep(sweeps: u32) {
        // Over a game, every offered move says whether it leaves a sweep,
        // and some do: the values that would clear the table, and how many
        // cards of them the person has not seen. The person captures when
        // they can, which keeps the table small enough to be swept.
        let mut warned = 0;
        for seed in [11, 12, 13] {
            let mut s = sit_down(1, 0, sweeps, 1, 1000, seed);
            while s.prompt() != Prompt::Over {
                if s.prompt() == Prompt::NextHand {
                    assert!(s.send("next"));
                    continue;
                }
                for card in s.view().hand {
                    let v = parse(&offer(&s, &card.to_string()));
                    for m in v["moves"].as_array().unwrap() {
                        let w = &m["leaves_sweep"];
                        if w.is_null() {
                            continue;
                        }
                        warned += 1;
                        assert!(!w["values"].as_array().unwrap().is_empty());
                        assert!(w["unseen"].as_u64().unwrap() >= 1);
                        let words = w["words"].as_str().unwrap();
                        if sweeps == 1 {
                            assert!(words.starts_with("leaves a sweep: "), "{words}");
                        } else {
                            assert!(!words.contains("sweep"), "no point promised: {words}");
                            assert!(words.contains("every card"), "{words}");
                        }
                    }
                }
                let moves = s.candidates();
                let mv = moves
                    .iter()
                    .find(|m| matches!(m, Move::Capture { .. }))
                    .unwrap_or(&moves[0]);
                assert!(s.send(&mv.to_string()));
            }
        }
        assert!(warned > 0, "some move left a sweep open");
    }

    #[test]
    fn the_deals_are_revealed_only_once_the_game_is_over() {
        let mut s = sit_down(0, 0, 1, 1, 2000, 9);
        assert_eq!(reveal(&s), "null", "never while the game is played");
        while s.prompt() != Prompt::Over {
            let command = if s.prompt() == Prompt::NextHand {
                "next".to_string()
            } else {
                s.candidates()[0].to_string()
            };
            assert!(s.send(&command));
            if s.prompt() != Prompt::Over {
                assert_eq!(reveal(&s), "null");
            }
        }
        let v = parse(&reveal(&s));
        let hands = v["hands"].as_array().unwrap();
        assert_eq!(hands.len(), s.game().history().len());
        // Your cards in each deal are what the dealt events said you got.
        let dealt: Vec<CardSet> = s
            .events()
            .iter()
            .filter_map(|e| match e.kind {
                EventKind::Dealt { yours, .. } => Some(yours),
                _ => None,
            })
            .collect();
        let revealed: Vec<CardSet> = hands
            .iter()
            .flat_map(|h| h["deals"].as_array().unwrap().iter())
            .map(|d| {
                d["you"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|c| c["card"].as_str().unwrap().parse::<Card>().unwrap())
                    .collect()
            })
            .collect();
        assert_eq!(revealed, dealt);
        for h in hands {
            let mut all = CardSet::EMPTY;
            for d in h["deals"].as_array().unwrap() {
                for part in ["you", "them", "table"] {
                    for c in d[part].as_array().unwrap() {
                        let card: Card = c["card"].as_str().unwrap().parse().unwrap();
                        assert!(!all.contains(card));
                        all = all.with(card);
                    }
                }
            }
            assert_eq!(all.len(), 52);
        }
    }

    #[test]
    fn a_hint_only_when_hints_are_on() {
        let mut s = sit_down(0, 0, 1, 1, 3000, 7);
        assert_eq!(hint(&mut s), "null");
        assert!(s.send("set hints on"));
        let v = parse(&hint(&mut s));
        let m = Move::parse(v["move"].as_str().unwrap()).unwrap();
        assert!(s.candidates().contains(&m));
        assert!(v["advice"].as_str().unwrap().len() > 3);
        assert!(v["notes"].as_array().is_some());
        // Showing it is recorded, so that the decision is not evidence.
        assert_eq!(s.record().last().map(String::as_str), Some("hint"));
    }

    /// A game played to its end by the first candidate each time.
    fn played_out(seed: u32) -> Session {
        let mut s = sit_down(1, 1, 0, 1, 3000, seed);
        for _ in 0..2_000 {
            match s.prompt() {
                Prompt::Play => {
                    let m = s.candidates()[0];
                    assert!(s.send(&m.to_string()));
                }
                Prompt::NextHand => assert!(s.send("next")),
                Prompt::Over => break,
            }
        }
        s
    }

    #[test]
    fn evidence_is_the_summary_of_a_finished_game_and_of_a_stored_record() {
        let live = sit_down(1, 1, 0, 1, 3000, 12);
        assert_eq!(evidence(&live), "null", "not while it is played");
        let s = played_out(12);
        let v = parse(&evidence(&s));
        let summary = v["summary"].as_str().unwrap();
        assert!(summary.starts_with("cassino evidence v"));
        assert!(Summary::parse(summary).unwrap().is_current());
        // The same from the stored record, the sitting left alone.
        let record = parse(&state(&s))["saved"].as_str().unwrap().to_string();
        assert_eq!(parse(&evidence_of(&record))["summary"], v["summary"]);
        assert!(parse(&evidence_of("nonsense"))["error"].is_string());
        let unfinished = parse(&state(&live))["saved"].as_str().unwrap().to_string();
        assert!(parse(&evidence_of(&unfinished))["error"].is_string());
        let w = watch(1, 0, 1, 1, 2000, 2000, 3);
        assert_eq!(evidence(&w), "null");
    }

    #[test]
    fn the_learner_over_a_history_names_a_focus_and_the_stale_entries() {
        let empty = parse(&learner_of(""));
        assert_eq!(empty["games"], 0);
        assert!(empty["focus"].is_null());
        assert_eq!(empty["stale"].as_array().unwrap().len(), 0);
        let good = parse(&evidence(&played_out(12)))["summary"]
            .as_str()
            .unwrap()
            .to_string();
        let old = good.replacen(
            &format!("v{}", Summary::parse(&good).unwrap().version),
            "v0",
            1,
        );
        let history = format!("{good}\n--\n{old}\n--\n\n--\n{good}\n");
        let v = parse(&learner_of(&history));
        assert_eq!(v["games"], 2, "the stale and the empty are skipped");
        assert_eq!(v["stale"], serde_json::json!([1, 2]));
        assert!(v["mastered"].is_array());
        if let Some(slug) = v["focus"].as_str() {
            assert!(Skill::from_slug(slug).is_some());
        }
    }

    #[test]
    fn the_brief_comes_in_bullets_with_a_method_and_works_with_no_history() {
        let live = sit_down(1, 1, 0, 1, 3000, 12);
        assert_eq!(brief_of(&live, ""), "null");
        let s = played_out(12);
        let v = parse(&brief_of(&s, ""));
        let bullets = v["bullets"].as_array().unwrap();
        assert!((1..=3).contains(&bullets.len()));
        for b in bullets {
            assert!(b["lead"].is_string() && b["text"].is_string());
        }
        assert!(v["method"].as_str().unwrap().len() > 40);
        // With the game's own summary passed in, and a history, the same
        // game gives a brief all the same.
        let game = parse(&evidence(&s))["summary"]
            .as_str()
            .unwrap()
            .to_string();
        let again = parse(&brief_of(&s, &format!("{game}\n--\n{game}\n--\n{game}")));
        assert!(!again["bullets"].as_array().unwrap().is_empty());
        let alone = parse(&brief_of(&s, &format!("{game}\n--\n")));
        assert_eq!(alone["bullets"], v["bullets"], "an empty history is none");
    }

    #[test]
    fn the_brief_of_a_stored_record_needs_no_sitting_and_hands_back_the_summary() {
        let s = played_out(12);
        let record = parse(&state(&s))["saved"].as_str().unwrap().to_string();
        let live = parse(&brief_of(&s, ""));
        let v = parse(&brief_of_record(&format!("{record}\n==\n")));
        assert_eq!(
            v["bullets"], live["bullets"],
            "the same brief, from the record"
        );
        assert_eq!(
            v["summary"],
            parse(&evidence(&s))["summary"],
            "and the game's summary with it"
        );
        let with_history = parse(&brief_of_record(&format!(
            "{record}\n==\n{}",
            v["summary"].as_str().unwrap()
        )));
        assert!(!with_history["bullets"].as_array().unwrap().is_empty());
        let unfinished = parse(&state(&sit_down(1, 1, 0, 1, 3000, 12)))["saved"]
            .as_str()
            .unwrap()
            .to_string();
        assert_eq!(brief_of_record(&format!("{unfinished}\n==\n")), "null");
        assert_eq!(brief_of_record("nonsense"), "null");
    }

    #[test]
    fn the_learner_names_the_evidence_version_it_knows() {
        let v = parse(&learner_of(""));
        assert_eq!(v["version"], EVIDENCE_VERSION);
    }

    #[test]
    fn a_focus_is_set_by_slug_and_a_nudge_comes_with_its_words() {
        let mut s = sit_down(1, 1, 0, 1, 3000, 12);
        assert_eq!(nudge(&s), "null", "no focus, no nudge");
        assert!(!set_focus(&mut s, "juggling"));
        assert!(set_focus(&mut s, "pairs"));
        let mut seen = None;
        for _ in 0..2_000 {
            match s.prompt() {
                Prompt::Play => {
                    let v = parse(&nudge(&s));
                    if !v.is_null() && seen.is_none() {
                        assert_eq!(v["skill"], "pairs");
                        assert_eq!(v["words"], tutor::nudge_words(Skill::Pairs));
                        assert!(s.send("nudged pairs"));
                        assert_eq!(nudge(&s), "null", "once a game");
                        seen = Some(());
                    }
                    let m = s.candidates()[0];
                    assert!(s.send(&m.to_string()));
                }
                Prompt::NextHand => assert!(s.send("next")),
                Prompt::Over => break,
            }
        }
        assert!(seen.is_some(), "a game of pairs holds a chance");
        assert!(set_focus(&mut s, ""));
    }

    #[test]
    fn the_tutor_exports_round_trip() {
        ffi::cassino_new(1, 1, 0, 1, 3000, 12);
        let put = |text: &str| {
            let buf = ffi::cassino_alloc(text.len());
            unsafe { std::ptr::copy_nonoverlapping(text.as_ptr(), buf, text.len()) };
            text.len()
        };
        let read = || {
            let bytes =
                unsafe { std::slice::from_raw_parts(ffi::cassino_out(), ffi::cassino_out_len()) };
            parse(std::str::from_utf8(bytes).unwrap())
        };
        ffi::cassino_evidence();
        assert!(read().is_null());
        let n = put("");
        ffi::cassino_learner(n);
        assert_eq!(read()["games"], 0);
        let n = put("pairs");
        assert_eq!(ffi::cassino_set_focus(n), 1);
        let n = put("nonsense");
        assert_eq!(ffi::cassino_set_focus(n), 0);
        ffi::cassino_nudge();
        let _ = read();
        let n = put("");
        ffi::cassino_brief(n);
        assert!(read().is_null());
    }

    #[test]
    fn a_watched_game_steps_through_the_protocol() {
        let mut s = watch(1, 0, 1, 1, 2000, 4000, 5);
        let v = parse(&state(&s));
        assert_eq!(v["watching"], true);
        let mut steps = 0;
        while s.step() {
            steps += 1;
        }
        let v = parse(&state(&s));
        assert_eq!(v["prompt"], "over");
        assert!(steps > 40);
        assert!(v["events"]
            .as_array()
            .unwrap()
            .iter()
            .any(|e| e["text"].as_str().unwrap().starts_with("North ")));
    }

    /// The golden games: each line is `game aces14 sweeps skill seed hash`.
    const GOLDEN: &str = include_str!("../tests/golden.txt");

    #[test]
    fn scripted_games_end_as_the_golden_record_says() {
        let mut checked = 0;
        for line in GOLDEN
            .lines()
            .filter(|l| !l.starts_with('#') && !l.trim().is_empty())
        {
            let n: Vec<u64> = line
                .split_whitespace()
                .map(|w| w.parse().unwrap())
                .collect();
            let got = scripted(
                n[0] as u32,
                n[1] as u32,
                n[2] as u32,
                n[3] as u32,
                n[4] as u32,
            );
            assert_eq!(
                got, n[5],
                "{line}: the final state differs. If intended, regenerate tests/golden.txt (and if play changed, not just the state's shape, bump session::RECORD_VERSION)"
            );
            checked += 1;
        }
        assert!(checked >= 12, "{checked}");
    }

    /// Regenerates the golden lines: `cargo test -p cassino-wasm print_golden
    /// -- --ignored --nocapture`.
    #[test]
    #[ignore]
    fn print_golden() {
        for (i, (game, aces, sweeps, skill)) in [
            (0, 0, 1, 1000),
            (0, 0, 1, 2000),
            (0, 0, 1, 3000),
            (0, 0, 1, 4000),
            (0, 0, 0, 3500),
            (1, 0, 1, 1000),
            (1, 0, 1, 2500),
            (1, 0, 1, 4000),
            (1, 1, 1, 3000),
            (1, 1, 1, 4000),
            (1, 1, 0, 2000),
            (0, 0, 1, 3700),
        ]
        .into_iter()
        .enumerate()
        {
            let seed = 1000 + i as u32;
            println!(
                "{game} {aces} {sweeps} {skill} {seed} {}",
                scripted(game, aces, sweeps, skill, seed)
            );
        }
    }

    #[test]
    fn a_sitting_is_saved_as_text_and_restored() {
        let mut s = sit_down(1, 1, 1, 1, 3000, 21);
        assert!(s.send("set explain on"));
        for _ in 0..10 {
            if s.prompt() != Prompt::Play {
                break;
            }
            let m = s.candidates()[0].to_string();
            assert!(s.send(&m));
        }
        let v = parse(&state(&s));
        let text = v["saved"].as_str().unwrap().to_string();
        assert_eq!(v["record_version"], cassino_core::session::RECORD_VERSION);
        let again = restore(&text).unwrap();
        assert_eq!(state(&again), state(&s), "restored exactly");
        assert!(restore("cassino record v999\nseed 1").is_err());
        let refused = {
            let mut t = sit_down(0, 0, 1, 1, 3000, 7);
            t.send("frobnicate");
            parse(&state(&t))
        };
        assert_eq!(refused["error_code"], "not_a_move");
    }

    #[test]
    fn the_exports_round_trip_a_command() {
        ffi::cassino_new(0, 0, 1, 1, 2000, 9);
        let read = || {
            let ptr = ffi::cassino_out();
            let len = ffi::cassino_out_len();
            let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
            parse(std::str::from_utf8(bytes).unwrap())
        };
        let v = read();
        let card = v["hand"][0]["card"].as_str().unwrap().to_string();
        let command = format!("trail {card}");
        let buf = ffi::cassino_alloc(command.len());
        unsafe { std::ptr::copy_nonoverlapping(command.as_ptr(), buf, command.len()) };
        let accepted = ffi::cassino_send(command.len());
        let v = read();
        assert_eq!(accepted == 1, v["error"].is_null());
        let _ = (
            CardSet::EMPTY,
            Card::BIG_CASINO,
            Quality::Sound,
            Clinch::Cards,
            Prompt::Play,
        );
    }
}
