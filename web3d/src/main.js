// Cassino at a three-dimensional table.
//
// A client of the table protocol (docs/PROTOCOL.md): it draws the engine's
// state and sends back commands, and holds no rules. The plan is
// docs/TABLE3D.md. A move is chosen by tapping (selection.js); every change
// of state is played out on the cards by the director (director.js,
// choreography.js); the score HUD, its popups timed to the sweeps and to
// the count as its cards turn up (hud.js), and the trackers (scorebug.js);
// what is said at the table, in boxes by each speaker's hand (talk.js,
// dialogue.js); the settings, the aids and the sitting kept across a
// reload (chrome.js, prefs.js); and the tutorial's pages, each at its first
// moment, and at any time from the question mark (tutorial.js).

import { Mesh, Texture, Vector3 } from "three";
import { loadTextures, vectorWidth } from "./art.js";
import { cardGeometry } from "./cards.js";
import { createChrome } from "./chrome.js";
import { createDeck } from "./deck.js";
import { TURN, createDialogue, saying } from "./dialogue.js";
import { createDirector } from "./director.js";
import { facesFor, jumboTextures, largeTextHere } from "./faces.js";
import { handOrder, layout, tableOrder } from "./layout.js";
import { decodeBase64, loadEngine } from "./engine.js";
import { POPUP_BUSY, createHud, hudEvents, ledgerOf, popupsOf } from "./hud.js";
import { RAMPS, cardMaterials, cardTexture } from "./materials.js";
import { createOverlay } from "./overlay.js";
import { badgeFontPx, badgeText, badgeTitle, badgesShown } from "./badges.js";
import { badgesOn, chooseGame, dailySeed, loadPrefs, menuChoices, welcomeWanted, loadSeries, loadSitting, savePrefs, saveSeries, saveSitting, withUrl } from "./prefs.js";
import { recordGame, seriesLine } from "./series.js";
import { COURTS as COURTS_ORDER, FIGURE, REVEAL_MS, courtFor, courtName, figureSides } from "./reveal.js";
import { createScene } from "./scene.js";
import { celebrationOf, trackers } from "./scorebug.js";
import { EMPTY, choose, chipsOf, itemState, moveBarFit, pick, selectionOf, selectionText, sweepWarning, valuesSaid, whyNot } from "./selection.js";
import { chooseSurface } from "./surfaces.js";
import { chunk, heard, speech } from "./talk.js";
import { pageDue, parseTutorial } from "./tutorial.js";
import TUTORIAL_TEXT from "../tutorial.md";
import { CARD, PORTRAIT_BELOW, ZONES, ZONES_PORTRAIT, ZONES_TOUCH } from "./units.js";
import { cardCorners } from "./kinematics.js";
import { decisionKey } from "./decision.js";
import { addGame, clearProgress, exportProgress, historyOf, importProgress, loadProgress, progressSaid, refreshOne, setSummary } from "./progress.js";

/* global WASM_BASE64, ART, COURTS, WORDS */

const params = new URL(window.location.href).searchParams;
const WATCH_PAUSE = 650; // ms between the moves of a watched game
// How long your opponent waits on your move before remarking on it ("Take
// your time."), once a turn, when everything is said; ?idle=ms for tests.
const IDLE_MS = Number(params.get("idle")) || 25_000;
const PAGES = parseTutorial(TUTORIAL_TEXT);

// The browser's storage, if there is any to have.
function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

async function main() {
  const engine = await loadEngine(decodeBase64(WASM_BASE64));
  const store = params.has("fresh") ? null : storage();
  // What is saved is the person's own settings; the URL's say (for tests and
  // links) is laid over them but never saved (the table review's T16).
  let saved = loadPrefs(store);
  let prefs = withUrl(saved, params);
  const fixedSeed = Number(params.get("seed")) || null;
  // The match: a World Series, the best of seven, if chosen (series.js).
  let series = loadSeries(store);
  const randomSeed = () => fixedSeed ?? Math.floor(Math.random() * 2 ** 31);

  let state = null;
  let sel = EMPTY;
  let offer = null;
  let message = null;
  let hint = null; // the hint for this turn, if hints are on
  let hintKey = null; // the position it is for
  let nudge = null; // the tutor's nudge for this turn, if the engine names one
  let nudgeKey = null; // the position it was asked for (once a turn, not per frame)
  let nudgeSent = false; // whether `nudged` is recorded for it
  let logOpen = false;
  let badgeFrom = null; // the state the cards are moving from (badges.js)

  // A phone or a tablet: Large Text faces by default, and your hand a row
  // the table's size (the seventh play-testing), under the tablet's own eye
  // across the table (units.js ZONES_TOUCH, CAMERA_TOUCH); ?touch=0 or 1
  // says so for tests.
  const touch = params.has("touch") ? params.get("touch") !== "0" : largeTextHere();
  const stage = createScene(document.getElementById("stage"), {
    table: chooseSurface({ chosen: prefs.surface, saved: null }),
    touch,
  });
  // Where everything rests: stacked on a phone held upright (or sideways,
  // between columns), and across the table a tablet's arrangement or a
  // computer's.
  const zonesNow = () => (stage.portrait ? ZONES_PORTRAIT : touch ? ZONES_TOUCH : ZONES);
  const anisotropy = stage.renderer.capabilities.getMaxAnisotropy();
  const textures = await loadTextures(ART, { anisotropy, pixelRatio: stage.renderer.getPixelRatio() });
  const deck = createDeck(stage, textures);

  // The card faces: Large Text on a phone or a tablet and the classic faces
  // elsewhere, or whichever is chosen in the settings, changed where the
  // cards lie (faces.js, after piquet's main.js).
  const faceSets = { classic: textures.faces };
  let facesShown = "classic";
  function showFaces(choice) {
    const want = facesFor(choice, touch);
    if (want === facesShown) return;
    faceSets[want] ??= jumboTextures(Object.keys(textures.faces), { width: textures.width ?? vectorWidth(stage.renderer.getPixelRatio()), anisotropy });
    deck.setFaces(faceSets[want]);
    for (const texture of Object.values(faceSets[facesShown])) texture.dispose();
    facesShown = want;
    stage.render();
  }
  showFaces(prefs.faces);

  // The card the keyboard's focus is on (below), once the keyboard is used.
  let focusedCard = () => null;

  // The cards' lines: while choosing, the hand card chosen and the table
  // cards picked in amber, what could join in cyan, what cannot dimmed; with
  // nothing chosen, the hint's cards in cyan.
  function decorate(placement, deck, meshes) {
    const shown = hint && !sel.chosen ? selectionOf(hint.move, state.table) : null;
    const hinted = new Set(shown ? [shown.chosen, ...shown.picked] : []);
    for (const m of placement) {
      let look = m.zone === "middle" ? itemState(m.code, offer, sel, state.table) : m.code && m.code === sel.chosen ? "picked" : "idle";
      if (look === "idle" && hinted.has(m.code)) look = "addable";
      const line = look === "picked" ? "chosen" : look === "addable" ? "hint" : "plain";
      deck.decorate(meshes[m.id], {
        line: line === "plain" && m.code && m.code === focusedCard() ? "hover" : line,
        dim: look === "refused",
      });
    }
  }

  const director = createDirector({
    stage,
    deck,
    // A phone held upright (or sideways, between columns) lays the table
    // out stacked (units.js ZONES_PORTRAIT); a tablet across it, its hand
    // in a row (ZONES_TOUCH).
    view: () => ({ ...sel, zones: zonesNow(), sort: prefs.sortTable }),
    decorate,
    rested: () => {
      badgeFrom = state; // from here, a move starts from this table
      placeBadges();
      overlay.trackers(trackers(state), state.watching);
      show();
      if (state.watching) watchOn();
      else introduce();
      waitOnYou();
    },
    manual: params.has("manual"),
    speed: prefs.speed,
  });

  const overlay = createOverlay(document.getElementById("overlay"), {
    onChip: (chip) => {
      const sent = engine.send(chip.move);
      // A refused move changes nothing: say why, and keep the last move.
      if (!sent.ok) {
        message = sent.state.error;
        show();
        return;
      }
      message = null;
      advance(sent.state);
    },
    onNext: () => advance(engine.send("next").state),
    onNewGame: () => askNewGame(),
    onReview: () => chrome.showReview(reviewed),
    // A tap on a card over the move bar is the card's.
    onCardTap: (x, y) => tapped(director.pick(x, y)),
    // A badge tapped is its build tapped.
    onBadge: (id) => tapped(director.placement().find((m) => m.item === id) ?? null),
    // The trackers' panel folded or opened: kept for next time.
    onFold: (open) => change({ trackersOpen: open }),
    later: (ms, fn) => director.at(ms, fn, "linger"),
  });

  const hud = createHud(overlay.hudSlot, { later: (ms, fn) => director.at(ms, fn), onToggle: (open) => overlay.setScoreOpen(open), room: () => hudRoom() });
  // The score's ledger, open, folds at a tap anywhere but on it (or on the
  // aids' panel that opens with it upright); the tap still does what it
  // does there (the user: "if the scoring heads up display is extended, and
  // you click outside of it, it should automatically retract").
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (hud.isOpen() && !(e.target instanceof Element && e.target.closest(".info, .aids-panel, .tip"))) hud.fold();
    },
    true,
  );
  const seats = () => (state.watching ? { you: "South", them: "North" } : { you: "You", them: "Opp" });
  // The HUD and the panel's names, shown at once from the state -- or, as a
  // game opens, from its deal (`upTo`: the events seen so far), so nothing
  // shows before the cards have shown it.
  function scoreShown(upTo = state.events.length) {
    const who = seats();
    const seen = { ...state, events: state.events.slice(0, upTo) };
    hud.reset(ledgerOf(seen), { you: who.you, opp: who.them });
    const none = { cards: 0, spades: 0, aces: 0, big_casino: false, little_casino: false, sweeps: 0 };
    overlay.trackers(trackers(upTo < state.events.length ? { ...seen, piles: { you: none, them: none } } : state), state.watching);
  }

  // A setting changed: in what is shown and in what is saved.
  function change(patch) {
    prefs = { ...prefs, ...patch };
    saved = { ...saved, ...patch };
    savePrefs(store, saved);
  }
  const chrome = createChrome(document.getElementById("overlay"), {
    newGame: () => askNewGame(),
    aid: (name, on) => {
      change({ aids: { ...prefs.aids, [name]: on } });
      // A watched game keeps its own (S3).
      if (state.watching) return;
      const sent = engine.send(`set ${name} ${on ? "on" : "off"}`).state;
      // A forced move may now have been made for you: show what happened.
      if (sent.events.length !== state.events.length) advance(sent);
      else {
        state = sent;
        persist();
        refresh();
      }
    },
    pref: (name, value) => {
      change({ [name]: value });
      if (name === "speed") director.setSpeed(value);
      if (name === "surface") stage.setSurface(chooseSurface({ chosen: value, saved: null }));
      if (name === "faces") showFaces(value);
      if (name === "buildValues" || name === "tutorial") placeBadges();
      if (name === "tutor") tutorFocus();
      refresh();
    },
    progress: {
      exportFile: () => download("cassino-progress.json", exportProgress(loadProgress(store))),
      importText: (text) => {
        const got = importProgress(store, text);
        if (got.ok) {
          tutorFocus();
          staleSoon();
        }
        return got.ok ? progressSaid(loadProgress(store).length) : got.error;
      },
      clear: () => {
        clearProgress(store);
        summaries.clear();
        tutorFocus();
        return progressSaid(0);
      },
    },
    copy: async (button) => {
      try {
        await navigator.clipboard.writeText(state.saved);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Could not copy";
      }
      setTimeout(() => (button.textContent = "Copy game record"), 1600);
    },
    hint: () => {
      if (!hint) return;
      sel = selectionOf(hint.move, state.table);
      refresh();
    },
    // The last move seen again (DESIGN.md §12.3, "a 'last turn' replay"):
    // the cards from where they were, the score and the talk as they are.
    again: () => {
      if (!lastMove || director.busy()) return;
      hideOpponent();
      badgeFrom = lastMove.before;
      director.again(lastMove.before, lastMove.after);
      show();
    },
    log: (open) => {
      logOpen = open;
      if (!director.busy()) drawLog();
    },
    help: () => readPages(0),
  });

  // ---- the game -----------------------------------------------------------

  // A new sitting, played or watched, with the next game's rules; the
  // house rules are agreed aloud as the cards are dealt. `welcome`:
  // the table held at the pack while the new game's menu, opening the
  // page, asks how to begin.
  function newGame({ seed = randomSeed(), watch = false, welcome = false } = {}) {
    hideOpponent();
    badgeFrom = null;
    lastMove = null;
    director.cancelTimed();
    watchStep = false; // a step pending was cancelled with the rest (review T2)
    overlay.hush();
    overlay.clearCheers();
    dialogue.stop();
    state = watch
      ? engine.watch({ ...prefs.rules, skills: [prefs.skill, prefs.skill], seed })
      : engine.start({ ...prefs.rules, skill: prefs.skill, seed });
    figureFor(courtFor(state.seed));
    if (!watch) for (const [aid, on] of Object.entries(prefs.aids)) if (on) state = engine.send(`set ${aid} on`).state;
    tutorFocus();
    sel = EMPTY;
    offer = null;
    message = null;
    // The cards are dealt while the house rules are agreed: nobody waits
    // for the talk (play-testing).
    const dealt = !params.has("nodeal");
    const opening = dialogue.words(heard(speech(state, 0), prefs.talk));
    const timing = director.restart(state, { dealt, waits: dealt ? openingWaits(opening) : {} });
    // On opening, the new game's menu holds the clock before anything
    // timed on it, the talk included, can come (a line scheduled first
    // would slip out behind it), over the table held at the pack; put
    // aside, the game behind it is played as it was dealt.
    if (welcome)
      director.gate(0, (release) =>
        askNewGame({
          opening: true,
          cancelled: () => {
            release();
            refresh();
            introduce();
          },
        }),
      );
    if (dealt) {
      talk(state, 0, timing, opening);
      const deal = state.events.findIndex((e) => e.kind === "dealt") + 1;
      scoreShown(deal);
      playScore(deal, timing);
    } else scoreShown();
    persist();
    refresh();
    tutorialSince = 0;
    introduce();
  }

  // Your opponent's first move, when the game opens with it, waits for the
  // opening's calls (play-testing: "Your deal." came after they had
  // played), planned on the opening's moments; chatter does not hold it.
  // Not at the Instant speed, where nothing waits for the talk.
  function openingWaits(lines) {
    const first = state.events.findIndex((e) => e.kind === "played");
    if (first < 0 || !lines.length || prefs.speed > 10) return {};
    const beats = director.preview(state);
    const timed = lines.filter((l) => l.at < first && !l.chatter).map((l) => ({ ...l, delay: beats[l.at] ?? 0 }));
    const said = dialogue.plan(chunk(timed.sort((a, b) => a.delay - b.delay)));
    return said.length ? { [first]: Math.max(...said.map((l) => l.end)) + TURN } : {};
  }

  // The new game's menu (chrome.js showNewGame; the seventh play-testing:
  // the game's own settings chosen there, the tutorial among them, with the
  // game they start): its choices kept for the next, a new match begun if
  // another was chosen, and the game dealt, played or watched. `opening`:
  // it opens the page, with Continue for a game kept (`canContinue`), which
  // carries on with it, the tutorial as chosen there. `cancelled()` if it
  // was put aside, or the game kept carried on.
  function askNewGame({ opening = false, canContinue = false, cancelled = () => {} } = {}) {
    chrome.showNewGame(menuChoices(prefs, state), (picked) => {
      if (!picked) return cancelled();
      const chosen = chooseGame(prefs, series, picked);
      if (picked.kind === "continue") {
        change({ tutorial: chosen.patch.tutorial, ...(chosen.patch.seen ? { seen: chosen.patch.seen } : {}) });
        placeBadges();
        return cancelled();
      }
      if (chosen.series !== series) {
        series = chosen.series;
        saveSeries(store, series);
      }
      change(chosen.patch);
      newGame({ seed: picked.kind === "daily" ? dailySeed() : randomSeed(), watch: picked.kind === "watch" });
    }, { opening, canContinue });
  }

  // ---- the tutorial -------------------------------------------------------

  // Each page the first time its moment comes, the table held still while
  // it is read; a page read already (paging on from the introduction, or
  // from the question mark) does not come again.
  let tutorialSince = 0;
  function markSeen(key) {
    if (prefs.seen.includes(key)) return;
    change({ seen: [...prefs.seen, key] });
  }
  function introduce() {
    if (!prefs.tutorial || chrome.tutorialOpen()) return;
    if (director.held() || director.gatePending()) return; // a page is up, closing, or coming
    const key = pageDue(state, prefs.seen, tutorialSince);
    tutorialSince = state.events.length;
    if (key) readPages(PAGES.findIndex((p) => p.key === key));
  }
  function readPages(at) {
    if (chrome.tutorialOpen()) return;
    director.gate(0, (release) => chrome.showTutorial(PAGES, at, { seen: markSeen, done: release, popups: prefs.tutorial }));
  }

  // The last change of state played, to see again; none across games.
  let lastMove = null;

  // The engine's next state, played out.
  function advance(next) {
    const before = state;
    lastMove = before && before.seed === next.seed && !next.watching ? { before, after: next } : null;
    state = next;
    sel = EMPTY;
    offer = null;
    badgeFrom = before;
    // Kept waiting over this move, and told so: your opponent follows it up.
    const waited = waitedOn !== null && waitedOn === before.saved;
    waitedOn = null;
    const said = dialogue.words(heard(speech(state, before.events.length, { waited }), prefs.talk));
    // The count paced by the score's popups, which tell it (nothing is said
    // then: the sixth play-testing).
    const scored = state.events.slice(before.events.length).find((e) => e.kind === "scored");
    const pace = scored ? { popups: popupsOf(scored.count.lines), busy: POPUP_BUSY } : null;
    const timing = director.advance(state, { pace });
    playScore(before.events.length, timing);
    // At the game's end the camera pulls back first, and the last words are
    // said from across the table once it is there.
    const end = state.events.findIndex((e, k) => k >= before.events.length && e.kind === "game_ends");
    let heardAt = timing;
    if (end >= 0) {
      const at = timing.beats[end] ?? 0;
      director.at(at, () => revealOpponent(), "hard");
      if (!calm()) heardAt = { ...timing, beats: { ...timing.beats, [end]: at + REVEAL_MS } };
    } else if (state.prompt !== "over") hideOpponent();
    talk(state, before.events.length, heardAt, said);
    if (state.prompt === "over") {
      countGame();
      keepGame();
    }
    persist();
    refresh();
  }

  // ---- the tutor (docs/DESIGN.md §12.8): what the page keeps and asks -------

  // Work for when the page is idle: the evidence of a game is the engine's
  // advisor over every decision (about half a second), so it never runs
  // while a game's ending plays.
  const idle = (fn, ms = 0) => setTimeout(() => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 4000 }) : fn()), ms);
  const ENDING_SETTLES = 4500; // ms after the game's end before its evidence is worked out

  // The summaries worked out this sitting, by record: the stored ones are
  // read from storage, so with none the brief still rests on this game.
  const summaries = new Map();
  function summaryOf(record) {
    let summary = summaries.get(record);
    if (!summary) {
      summary = engine.evidenceOf(record);
      if (summary) {
        summaries.set(record, summary);
        setSummary(store, record, summary);
      }
    }
    return summary;
  }
  const sayProgress = () => chrome.progressSaid(progressSaid(loadProgress(store).length));

  // A finished game of yours is kept at once with its record, and its
  // summary follows when the ending has settled (a game left before then
  // is summed up at the next opening: the stale ones are recomputed).
  function keepGame() {
    if (state.watching) return;
    const record = state.saved;
    addGame(store, { record, summary: summaries.get(record) ?? null });
    idle(() => {
      summaryOf(record);
      sayProgress();
    }, ENDING_SETTLES);
  }

  // Summaries made by another version of the evidence are recomputed from
  // their records, one at a time, when idle (learner::stale).
  const tried = new Set();
  function staleSoon(ms = 1500) {
    idle(() => {
      if (refreshOne(store, engine, tried)) staleSoon(2500);
      else sayProgress();
    }, ms);
  }

  // The skill to work on, from the games kept, handed to the sitting at a
  // new game (and a game restored: the record does not hold it); none with
  // the tips off.
  function tutorFocus() {
    nudge = null;
    nudgeKey = null;
    if (state.watching) return;
    const focus = prefs.tutor ? engine.learner(historyOf(loadProgress(store))).focus : null;
    engine.setFocus(focus);
  }

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // The brief of the game just played, worked out once however often it is
  // opened: the game's summary (made already, or now) and the earlier games'.
  let review = { of: null, words: null };
  function reviewed() {
    if (review.of !== state.saved) {
      const record = state.saved;
      const earlier = loadProgress(store).filter((g) => g.record !== record);
      review = { of: record, words: engine.brief(summaryOf(record), historyOf(earlier)) };
    }
    return review.words;
  }

  // The sitting kept across a reload; a watched game, or one that is over,
  // is not kept.
  // A short fingerprint of a game's record.
  function gameKey(text) {
    let h = 2166136261;
    for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  }

  // A game finished counts in the series, once.
  function countGame() {
    const ends = [...state.events].reverse().find((e) => e.kind === "game_ends");
    if (!ends || state.watching || STAGING || prefs.match !== "best-of-7") return;
    // Each game counted once, by its record (a seed can deal more than one
    // game: a seeded link, today's deal twice; the second review, S8); a
    // game from a seeded link is not kept in the saved series.
    series = recordGame({ ...series, format: "best-of-7" }, { seed: gameKey(state.saved), youWon: ends.you_won });
    if (!fixedSeed) saveSeries(store, series);
  }

  function persist() {
    // A game from a seeded link is not kept over the sitting saved (T16).
    if (state.watching || fixedSeed || STAGING) return;
    saveSitting(store, state.prompt === "over" ? null : state.saved);
  }

  // A watched game moves on by itself once the cards are still.
  let watchStep = false;
  function watchOn() {
    if (watchStep || state.prompt === "over") return;
    watchStep = true;
    director.at(WATCH_PAUSE, () => {
      watchStep = false;
      if (!state.watching || director.busy()) return;
      const { stepped, state: next } = engine.step();
      if (stepped) advance(next);
    });
  }

  // ---- what is said -------------------------------------------------------

  const dialogue = createDialogue(WORDS, () => director.clock());

  // Each line at the moment its event is seen (a line of the count, as it
  // is written down), in its speaker's box.
  function talk(s, since, { beats, count }, said = speech(s, since)) {
    // Lines still waiting from moves already past are not said now.
    if (since > 0) {
      director.drop("talk");
      dialogue.skip();
    }
    // In the order they come: a line's moment can fall inside an earlier
    // event's motion ("Cash." as the ace lands, before the heap is carried
    // in), and is not held back behind what is said at the end of it.
    // And what one speaker says at one moment, said as one (chunk).
    const lines = chunk(said.map((l) => ({ ...l, delay: beats[l.at] ?? 0 })).sort((a, b) => a.delay - b.delay));
    // Nothing said while a hand is scored, and what was still being said
    // taken down as the count begins: the score's popups and the
    // celebrations on the table tell it (the sixth play-testing: "Remove the
    // dialog balloons during scoring, and let the pop-ups do the work").
    const quiet = count ? { from: beats[count.at] ?? count.lines[0] ?? 0, to: count.end } : null;
    if (quiet) director.at(quiet.from, () => overlay.hush(), "talk");
    dialogue.say(lines, (line, words, ms) => {
      if (quiet && ms + saying(words) > quiet.from && ms < quiet.to) return;
      director.at(ms, () => overlay.say(line.who, words, speakerAt(line.who)), "talk");
    });
  }

  // Your opponent, waiting on your move a while, says so: once a turn, on
  // the wall's clock (a line queued on the table's would keep it drawing
  // while you think), and not while the table is held or the page hidden.
  let idleTimer = null;
  let waitedOn = null; // the position your opponent remarked waiting on
  function waitOnYou() {
    clearTimeout(idleTimer);
    if (state.prompt !== "play" || state.watching || prefs.talk !== "all") return;
    const position = state.saved;
    idleTimer = setTimeout(() => {
      if (state.saved !== position || state.prompt !== "play" || prefs.talk !== "all") return;
      if (document.hidden || director.held() || director.gatePending() || chrome.tutorialOpen() || director.busy()) return;
      waitedOn = position;
      dialogue.say([{ who: "them", phrase: "idle", delay: 0, chatter: true }], (line, words, ms) =>
        director.at(ms, () => overlay.say(line.who, words, speakerAt(line.who)), "talk"),
      );
    }, IDLE_MS);
  }

  // ---- the score ------------------------------------------------------------

  // The HUD's events, each at its moment: a sweep's point as the sweep is
  // seen, the count's lines as their cards turn up, the hand's end after
  // its count, and a new hand's live block as it is dealt.
  function playScore(since, { beats, count }) {
    const at = (ms, fn) => director.at(Math.max(0, ms ?? 0), fn);
    state.events.forEach((e, k) => {
      if (k >= since && e.kind === "dealt" && e.deal === 1) at(beats[k], () => hud.dealt(e.hand));
    });
    // The hand ends with its count (its last line said).
    for (const e of hudEvents(state, since)) {
      const ms = e.line !== undefined && count ? (count.lines[e.line] ?? count.end) : beats[e.at];
      at(ms, () => (e.end ? hud.endHand(e.hand) : hud.score(e)));
      // A sweep scored, celebrated on its card once it is held up.
      if (e.cat === "sweeps") {
        const card = state.events.slice(0, e.at).reverse().find((p) => p.kind === "played")?.card.card;
        at(ms + 380 / prefs.speed, () => cheer({ label: "Sweep", pts: e.pts, card, pile: null }, true));
      }
    }
    // Each line of the count celebrated on the table, as it is said.
    state.events.forEach((e, k) => {
      if (k < since || e.kind !== "scored" || !count) return;
      e.count.lines.forEach((line, i) => {
        const c = celebrationOf(line);
        if (c) at(count.lines[i], () => cheer(c));
      });
    });
  }

  // A celebration by its card where it lies (or, `moving`, where it is
  // now), or by the top of its taker's pile: the card's extent on the
  // screen, for the overlay to place it clear of the card.
  function cheer({ label, pts, card, pile }, moving = false) {
    let pose = null;
    if (card) {
      const mesh = director.meshOf(card);
      pose = moving ? mesh && { position: mesh.position, quaternion: mesh.quaternion } : director.placement().find((m) => m.code === card)?.pose;
    }
    if (!pose && pile) {
      const zone = pile === "you" ? "your-pile" : "their-pile";
      pose = director
        .placement()
        .filter((m) => m.zone === zone)
        .sort((a, b) => b.pose.position.y - a.pose.position.y)[0]?.pose;
    }
    if (!pose) return;
    const corners = cardCorners(pose).map((c) => director.toScreen(c));
    const ys = corners.map((c) => c.y);
    const x = corners.reduce((sum, c) => sum + c.x, 0) / corners.length;
    overlay.celebrate({ label, pts, x, top: Math.min(...ys), bottom: Math.max(...ys) });
  }

  // A badge on the top right corner of each build's top card (clear of the
  // indices, which are top left and bottom right), with the build values on (or
  // the tutorial): drawn with every frame, following the card, and kept
  // through every move that leaves its build alone (badges.js).
  function placeBadges() {
    if (!state || !badgesOn(prefs)) return overlay.placeBadges([]);
    const whose = state.watching ? { you: "South's", them: "North's" } : undefined;
    const list = [];
    // With no table known before the cards moved (a new game's deal, whose
    // first state may hold your opponent's opening build), none until they
    // rest.
    for (const item of badgesShown(badgeFrom, state, director.busy())) {
      const top = director.meshOf(item.cards[item.cards.length - 1].card);
      if (!top) continue;
      const corner = new Vector3(CARD.width / 2 - 0.5, CARD.height / 2 - 0.5, CARD.thickness / 2);
      const below = corner.clone().add(new Vector3(0, -1, 0)); // a centimetre down the card
      const at = director.toScreen(corner.applyQuaternion(top.quaternion).add(top.position));
      const by = director.toScreen(below.applyQuaternion(top.quaternion).add(top.position));
      const font = badgeFontPx(facesShown, Math.hypot(by.x - at.x, by.y - at.y));
      list.push({ id: item.id, text: badgeText(item.build), title: badgeTitle(item, whose), font, ...at });
    }
    overlay.placeBadges(list);
  }
  window.addEventListener("resize", placeBadges);
  stage.onRender = () => {
    placeBadges();
    placeMoveBar();
    maskMoveBar();
  };
  // The move bar under the cards (the user: "put the action buttons ... on
  // a layer lower than the cards so that they do not occlude the cards"):
  // each card's face as it is drawn, for the bar to cut out where they
  // cross it (overlay.js maskMoveBar).
  const FACE = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => new Vector3((sx * CARD.width) / 2, (sy * CARD.height) / 2, 0));
  function maskMoveBar() {
    const polys = director.meshes.filter((m) => m.visible).map((m) => FACE.map((c) => director.toScreen(c.clone().applyQuaternion(m.quaternion).add(m.position))));
    overlay.maskMoveBar(polys);
  }

  // On a desktop, not a phone (upright or sideways); and a phone held
  // upright.
  const desktop = () => !document.documentElement.classList.contains("upright") && !document.documentElement.classList.contains("sideways");
  const upright = () => document.documentElement.classList.contains("upright");
  // Each card of a zone, its extent on the screen as it rests.
  function cardRectsOf(zone) {
    return director
      .placement()
      .filter((m) => m.zone === zone)
      .map((m) => {
        const ps = cardCorners(m.pose).map((c) => director.toScreen(c));
        return { left: Math.min(...ps.map((p) => p.x)), right: Math.max(...ps.map((p) => p.x)), top: Math.min(...ps.map((p) => p.y)), bottom: Math.max(...ps.map((p) => p.y)) };
      });
  }
  // Where a zone's cards lie on the screen, as they rest: their extent, or
  // null with none there.
  function zoneOnScreen(zone) {
    const points = director
      .placement()
      .filter((m) => m.zone === zone)
      .flatMap((m) => cardCorners(m.pose).map((c) => director.toScreen(c)));
    if (!points.length) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  }
  // Your hand's cards as they rest, a card chosen not lifted.
  function yourHandOnScreen() {
    const all = director.placement().filter((m) => m.zone === "your-hand");
    const resting = all.filter((m) => m.code !== sel.chosen);
    const cards = resting.length ? resting : all;
    if (!cards.length) return null;
    const points = cards.flatMap((m) => cardCorners(m.pose).map((c) => director.toScreen(c)));
    const ys = points.map((p) => p.y);
    const xs = points.map((p) => p.x);
    // How far up the screen a card chosen from it stands (layout.js lifts
    // it 1.6 cm along its own length).
    const m = cards[0];
    const up = new Vector3(0, 1, 0).applyQuaternion(m.pose.quaternion).multiplyScalar(1.6);
    const tip = new Vector3(0, CARD.height / 2, 0).applyQuaternion(m.pose.quaternion).add(m.pose.position);
    const lift = director.toScreen(tip).y - director.toScreen(tip.clone().add(up)).y;
    return { top: Math.min(...ys), bottom: Math.max(...ys), right: Math.max(...xs), lift };
  }
  // The move bar, filling the space between the table's first row (its
  // near edge, a build's fan included) and your hand, clear of a card
  // chosen from it: where a move is chosen from (selection.js moveBarFit).
  // It stays put as the table fills, the rows growing away from you. On a
  // desktop, and on a phone held upright (play-testing: "above the cards,
  // not below, to match the desktop version"); held sideways it is in the
  // controls' column beside the table.
  let barFit = null;
  function placeMoveBar() {
    if (!desktop() && !upright()) return (barFit = null);
    const Z = zonesNow();
    const near = director.toScreen(new Vector3(Z.middle.x, 0, Z.middle.z + CARD.height / 2 + Z.stack.dz)).y;
    const hand = yourHandOnScreen();
    // On a desktop the bar's width goes with its height; upright, it spans
    // the screen whatever its height.
    const across = desktop() ? overlay.barAcross() : null;
    barFit = moveBarFit({ near, top: hand ? hand.top : director.handEdge("you").y, lift: hand ? hand.lift : 0, across });
    overlay.placeMoveBar(barFit.y, barFit.h);
  }
  // Where a line is said from: by the speaker's hand; yours, on a desktop,
  // beside it, the move bar being above it; on a phone held upright, where
  // there is no room beside it, above the move bar.
  // Where a hand lies, as a full hand of four would: the words beside it
  // stay clear of it as it is dealt and played out. With `row`, on a
  // phone, the speaker's whole row: the hand, the pile beside it (as one
  // card, there from the start) and the stock when theirs to deal.
  const FULL = ["AS", "AH", "AD", "AC"];
  function fullHand(who, row = false) {
    if (!state) return null;
    const zones = zonesNow();
    const yours = who === "you";
    const pile = { ...state.piles[who], cards: Math.max(1, state.piles[who].cards) };
    const full = { ...state, ...(yours ? { hand: FULL.map((card) => ({ card })) } : { opponent_holds: 4 }), piles: { ...state.piles, [who]: pile } };
    const own = yours ? ["your-hand", "your-pile"] : ["their-hand", "their-pile"];
    const wanted = row ? [...own, ...(state.dealer === who ? ["stock"] : [])] : [own[0]];
    const points = layout(full, { zones })
      .filter((m) => wanted.includes(m.zone))
      .flatMap((m) => cardCorners(m.pose).map((c) => director.toScreen(c)));
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  }
  // On a phone, where a speaker's words may go, the first clear of the
  // cards and the move bar taken (overlay.js say; the sixth play-testing:
  // "in mobile mode, the dialog balloons can completely obscure the cards,
  // so you can't play until they go away"): beside the speaker's row, as
  // far as the screen's edge (what it would cover there, the score, the
  // move bar, is counted as the cards are); your opponent's below or above
  // their hand; yours, held upright, below your hand, over the prompt
  // (there is no room beside the row, and the table and the move bar are
  // above it), held sideways above it, between it and the table, or else
  // beside the row, under the score. Beside the row, not the hand: beside
  // the hand a box lay over the pile, squeezed into the room left there
  // (an iPhone, the user: "when the dialogue box shows up on the left hand
  // side of the hand, the text sometimes exceeds the text box").
  function phonePlaces(who) {
    const hand = fullHand(who);
    const row = fullHand(who, true);
    const mid = { x: (hand.left + hand.right) / 2, y: (Math.max(hand.top, 8) + hand.bottom) / 2 };
    const right = { kind: "right", x: row.right + 14, y: mid.y, limit: window.innerWidth - 8 };
    const left = { kind: "left", x: row.left - 14, y: mid.y, limit: 8 };
    const below = { kind: "below", x: mid.x, y: hand.bottom };
    const above = { kind: "above", x: mid.x, y: hand.top };
    const places = who === "them" ? [right, left, below, above] : upright() ? [below, right, left, above] : [above, right, left, below];
    const cards = [...overlay.cardsAvoided(), ...["middle", "your-hand"].flatMap((zone) => cardRectsOf(zone))];
    return { places, avoid: cards };
  }
  function speakerAt(who) {
    // At the game's end your opponent speaks from across the table, beside
    // the court card, three quarters up it.
    if (who === "them" && standing && stage.revealed() !== null) {
      const [left, right] = figureSides().map(director.screenOf);
      return { x: right.x + 14, left: left.x - 14, y: right.y, side: true };
    }
    if (!desktop() && state) return phonePlaces(who);
    // Across the table, your opponent's words beside their hand, level with
    // what of it is in view: below it they would cover the table, which
    // starts just beyond it (the sixth play-testing).
    const theirs = who === "them" ? fullHand("them") : null;
    if (theirs) {
      const top = Math.max(theirs.top, 8);
      return { x: theirs.right + 14, left: theirs.left - 14, y: (top + theirs.bottom) / 2, side: true };
    }
    const hand = who === "you" && desktop() ? yourHandOnScreen() : null;
    if (!hand) return director.handEdge(who);
    return { x: hand.right + 18, y: hand.top + (hand.bottom - hand.top) * 0.35, side: true };
  }

  // ---- the game's end: who you were playing --------------------------------

  // The camera pulls back past the table's near edge, and your opponent is a
  // court card standing across the table (reveal.js), cel-shaded and inked
  // like the cards; it says the game's last words from there. Gone again
  // with a new game, or the last move seen again.
  // Each game's figure is made as the game begins, so that it stands, and
  // its words are placed beside it, the moment the game ends.
  const figures = new Map(); // court -> its mesh, once made
  const making = new Map(); // court -> its mesh on the way
  function figureFor(court) {
    if (!making.has(court)) making.set(court, courtMesh(court).then((mesh) => (figures.set(court, mesh), mesh)));
    return making.get(court);
  }
  let standing = null; // the court standing, while revealed
  const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || prefs.speed > 10;
  async function courtMesh(court) {
    const image = new Image();
    image.src = COURTS[court];
    await image.decode();
    const face = cardTexture(new Texture(image), stage.renderer.capabilities.getMaxAnisotropy());
    const width = FIGURE.height * FIGURE.aspect;
    const geometry = cardGeometry({ width, height: FIGURE.height, radius: width * 0.05, thickness: 0.6 });
    const mesh = new Mesh(geometry, cardMaterials({ face, back: textures.back, ramp: RAMPS.card() }));
    mesh.add(new Mesh(geometry, deck.ink));
    mesh.position.set(0, FIGURE.bottom + FIGURE.height / 2, FIGURE.z);
    mesh.castShadow = true;
    mesh.name = courtName(court);
    mesh.visible = false;
    stage.scene.add(mesh);
    return mesh;
  }
  // This court standing across the table, and no other (its figure made).
  function stand(court) {
    for (const [c, mesh] of figures) mesh.visible = c === court;
    standing = court;
    stage.render();
  }
  // At once, if the figure is made, so the last words, due at the same
  // moment with reduced motion, are said from beside it; else once it is,
  // if the game has not moved on meanwhile.
  function revealOpponent() {
    const court = courtFor(state.seed);
    if (!figures.has(court)) return figureFor(court).then(() => state.prompt === "over" && revealOpponent());
    stand(court);
    return stage.reveal({ instant: calm() }).then(() => STAGING && standing && showEndings());
  }
  function hideOpponent() {
    for (const mesh of figures.values()) mesh.visible = false;
    standing = null;
    endingsBar.hidden = true;
    stage.unreveal();
  }

  // ?ending -- the game's end staged (play-testing, as piquet's): a game
  // played by a dull script to its end, then taken back to your last
  // decision, so you play the last card and the ending comes; then arrows
  // step through every ending, each court winning and losing, each saying
  // its line. Nothing of it is kept.
  const STAGING = params.has("ending");
  function stageEnding() {
    let s = engine.start({ ...prefs.rules, skill: prefs.skill, seed: fixedSeed ?? 31 });
    for (let n = 0; n < 2000 && s.prompt !== "over"; n++) s = engine.send(s.prompt === "play" ? s.moves[0] : "next").state;
    // The record without its last decision of yours (a "*" line is a move
    // the table made for you, so it goes too).
    const lines = s.saved.trimEnd().split("\n");
    const last = lines.length - 1 - [...lines].reverse().findIndex((l) => /^(take|build|trail) /.test(l));
    const taken = engine.restore(lines.slice(0, last).join("\n") + "\n");
    state = taken.ok ? taken.state : engine.start({ ...prefs.rules, skill: prefs.skill, seed: fixedSeed ?? 31 });
    director.restart(state);
    badgeFrom = state;
    scoreShown();
    refresh();
  }
  const ENDINGS = COURTS_ORDER.flatMap((court) => [true, false].map((theyWon) => ({ court, theyWon })));
  let ending = 0;
  const endingsBar = document.createElement("div");
  endingsBar.className = "endings";
  endingsBar.hidden = true;
  const endingWords = document.createElement("span");
  const stepper = (label, by) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "endings-step";
    button.setAttribute("aria-label", label);
    button.textContent = by < 0 ? "\u2039" : "\u203a";
    button.addEventListener("click", () => showEnding((ending + by + ENDINGS.length) % ENDINGS.length));
    return button;
  };
  endingsBar.append(stepper("The ending before", -1), endingWords, stepper("The next ending", 1));
  document.getElementById("overlay").append(endingsBar);
  function showEndings() {
    const theyWon = ![...state.events].reverse().find((e) => e.kind === "game_ends")?.you_won;
    ending = ENDINGS.findIndex((e) => e.court === standing && e.theyWon === theyWon);
    endingsBar.hidden = false;
    endingWords.textContent = endingLabel(ENDINGS[ending]);
  }
  const endingLabel = (e) => `${courtName(e.court).replace(/^the/, "The")}, ${e.theyWon ? "winning" : "losing"} (${ending + 1} of ${ENDINGS.length})`;
  async function showEnding(k) {
    ending = k;
    const e = ENDINGS[k];
    await figureFor(e.court);
    stand(e.court);
    endingWords.textContent = endingLabel(e);
    director.drop("talk");
    dialogue.skip();
    const last = [e.theyWon ? "you-lost" : "good-game"];
    dialogue.say(last.map((phrase) => ({ who: "them", phrase, delay: 0 })), (line, words, ms) =>
      director.at(ms, () => overlay.say(line.who, words, speakerAt(line.who)), "talk"),
    );
  }

  // ---- phones ------------------------------------------------------------

  // On a phone the table is framed in the band the overlay leaves: upright,
  // between the HUD (and the aids' panel under it) and the controls; held
  // sideways, between the HUD's column and the controls' (framing.js). The
  // strips are measured as the overlay lays itself out.
  // The overlay's arrangement follows the framing's own rule (the window's
  // shape, framing.js), set as a class on <html> for the CSS, so the two
  // never disagree (the table review's T1: an upright tablet had the
  // desktop's overlay over a phone's framing).
  const sideways = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
  const isUpright = () => !sideways.matches && window.innerWidth / Math.max(1, window.innerHeight) < PORTRAIT_BELOW;
  function arrange() {
    const was = document.documentElement.className;
    document.documentElement.classList.toggle("upright", isUpright());
    document.documentElement.classList.toggle("sideways", sideways.matches);
    if (document.documentElement.className !== was) overlay.refold();
  }
  arrange();
  // The room the score's ledger may take, down from the score as folded: it
  // scrolls past it, and never comes down over the drawer at the foot of
  // the left, the trackers' panel (the seventh play-testing: "ensure the
  // scoring hud is scrollable, but it won't overlap with the bottom
  // drawer"). Upright, the panel lies under the score, open with its
  // ledger, and both stop above the controls; sideways, at the window's
  // foot.
  function hudRoom() {
    const rect = (sel) => document.querySelector(sel).getBoundingClientRect();
    const folded = rect(".info").bottom - rect(".hud-panel").height;
    const panel = document.querySelector(".aids-panel");
    const drawer = panel.hidden ? null : panel.getBoundingClientRect();
    let floor;
    if (sideways.matches) floor = window.innerHeight - 8;
    else if (isUpright()) floor = Math.min(rect(".controls").top, rect(".bar").top) - 8 - (drawer ? drawer.height + 6 : 0);
    else floor = (drawer ? drawer.top : window.innerHeight) - 12;
    return floor - folded;
  }
  function hudFit() {
    hud.fit();
  }

  // The strips are what stays put: the score as it is folded (its
  // hand-by-hand ledger, and the aids' panel under it upright, lie over the
  // table when open: the seventh play-testing, "The hud shouldn't shrink
  // everything, it should just overlap it"), and the controls at a height
  // of their own (style.css), so nothing said in them frames the table
  // afresh ("on iPad, the camera is often slightly moving when I'm
  // selecting cards": the prompt, emptied while a chosen card rose, did).
  function fitStrips() {
    arrange();
    const rect = (sel) => document.querySelector(sel).getBoundingClientRect();
    const panel = document.querySelector(".aids-panel");
    const hud = rect(".info");
    const folded = hud.bottom - rect(".hud-panel").height;
    const upright = isUpright();
    panel.style.top = upright ? `${hud.bottom + 6}px` : "";
    hudFit();
    if (sideways.matches) {
      stage.setStrips({ top: 0, foot: 0, left: hud.right + 8, right: window.innerWidth - rect(".controls").left + 8, raised: 0 });
      return;
    }
    const foot = window.innerHeight - Math.min(rect(".controls").top, rect(".bar").top) + 6;
    stage.setStrips({ top: folded + 6, foot, raised: 0 });
  }
  new ResizeObserver(() => {
    fitStrips();
    placeBadges();
  }).observe(document.getElementById("overlay"));
  for (const sel of [".info", ".controls", ".aids-panel"]) new ResizeObserver(fitStrips).observe(document.querySelector(sel));
  // The phone turned: the cards to their places in the other arrangement.
  stage.onReframe = () => {
    director.relayout();
    placeBadges();
  };

  // ---- the prompt, the aids and the log ----------------------------------

  // The line the aids add under the prompt: the hint, or the sweep warning.
  // With the sweep warning, a move that would leave your opponent a sweep
  // says so before it is made; otherwise, what would clear the table now.
  function aidLine() {
    if (state.watching || state.prompt !== "play") return null;
    if (hint) return `Hint: ${hint.advice}.`;
    if (nudge) return `Tip: ${nudge.words}`;
    if (!prefs.sweepWarning) return null;
    const warning = sweepWarning(chipsOf(offer));
    if (warning) return warning;
    if (state.sweep_values.length) {
      const text = `${valuesSaid(state.sweep_values)} would clear the table.`;
      return text[0].toUpperCase() + text.slice(1);
    }
    return null;
  }

  function show() {
    const busy = director.busy();
    // Room for the aids' line under the prompt, upright, while an aid that
    // speaks there is on; and for the prompt and the note, while the
    // explanations are (style.css).
    const explain = Boolean(state.watching ? prefs.aids.explain : state.aids?.explain);
    document.documentElement.classList.toggle("aid-line-on", !state.watching && Boolean(state.aids?.hints || prefs.sweepWarning || nudge));
    // The nudge is shown once the cards are still: that is the command that
    // records it (an assisted decision is no evidence), and it keeps the
    // sitting saved to match, so a reload does not show it twice.
    if (nudge && !nudgeSent && !busy && state.prompt === "play" && !hint) {
      nudgeSent = true;
      const sent = engine.send(`nudged ${nudge.skill}`);
      if (sent.ok && !fixedSeed && !STAGING) saveSitting(store, sent.state.saved);
    }
    document.documentElement.classList.toggle("explain-on", explain);
    const after = prefs.match === "best-of-7" && !state.watching ? seriesLine(series) : null;
    overlay.show({ state, chips: busy ? [] : chipsOf(offer), message, busy, aid: aidLine(), after, leftHanded: prefs.leftHanded, explain });
    // The cards still out and the log tell what the cards have shown: they
    // wait for the cards to come to rest, as the trackers do (review T7).
    if (!busy) {
      overlay.unseen(prefs.unseen && !state.watching ? state.unseen : null);
      drawLog();
    }
    overlay.showTrackers(prefs.trackers);
    overlay.setOpen(prefs.trackersOpen);
    chrome.sync(prefs, state, { busy, canAgain: Boolean(lastMove) });
  }

  function drawLog() {
    const entries = state.events
      .filter((e) => e.text)
      .slice(-60)
      .map((e) => ({ kind: e.kind, text: e.text, notes: e.notes ?? [], who: e.you === true ? "you" : e.you === false ? "them" : null }));
    overlay.log(entries, logOpen);
  }

  // The selection changed, or the state: ask the engine what it makes (and,
  // with hints on, what it would do), and show it.
  function refresh() {
    offer = sel.chosen && state.prompt === "play" ? engine.offer(selectionText(sel)) : null;
    if (offer?.error) offer = null;
    // The hint, once a position: it cannot change within a turn (T13).
    const hintFor = !state.watching && state.prompt === "play" && state.aids.hints ? decisionKey(state.saved) : null;
    if (hintFor !== hintKey) {
      hintKey = hintFor;
      hint = hintFor ? engine.hint() : null;
      if (!hint?.move) hint = null;
    }
    // The tutor's nudge, once a turn as the hint is (the engine remembers
    // its answer for the position; it costs an advisor run until it fires).
    const nudgeFor = prefs.tutor && !state.watching && state.prompt === "play" ? decisionKey(state.saved) : null;
    if (nudgeFor !== nudgeKey) {
      nudgeKey = nudgeFor;
      nudgeSent = false;
      nudge = nudgeFor ? engine.nudge() : null;
    }
    director.rearrange();
    show();
  }

  // A tap on a card. While the cards are moving, a tap lands them.
  function tapped(slot) {
    if (director.busy()) {
      director.skip();
      dialogue.skip();
      return;
    }
    message = null;
    if (!slot || state.prompt !== "play" || state.watching) return;
    if (slot.zone === "your-hand") {
      sel = choose(sel, slot.code);
    } else if (slot.zone === "middle") {
      if (!sel.chosen) {
        message = "Choose a card from your hand first.";
      } else if (itemState(slot.code, offer, sel, state.table) === "refused") {
        message = whyNot(slot.code, offer, state.table);
      } else {
        const item = state.table.find((i) => i.id === slot.item);
        sel = pick(sel, item.cards.map((c) => c.card));
      }
    }
    refresh();
  }

  const canvas = stage.renderer.domElement;
  canvas.addEventListener("click", (event) => tapped(director.pick(event.clientX, event.clientY)));

  // ---- the keyboard -------------------------------------------------------

  // A move chosen without a pointer (the table review's T15): the arrows
  // move a focus along your hand and across the table's items (up to the
  // table, down to your hand), Enter or Space taps what it is on, Escape lets
  // go of the selection. The focused card takes the heavier line, and what
  // it is is told to a screen reader.
  let focus = null; // { row: "hand" | "table", index }
  focusedCard = () => focused();
  const rowCards = (row) =>
    row === "hand" ? handOrder(state.hand, prefs.sortTable, state.rules?.aces14).map((c) => c.card) : tableOrder(state.table, prefs.sortTable).map((item) => item.cards[item.cards.length - 1].card);
  function focused() {
    if (!focus) return null;
    const cards = rowCards(focus.row);
    if (!cards.length) return null;
    return cards[Math.min(focus.index, cards.length - 1)];
  }
  function describe(code) {
    if (!code) return "";
    if (focus.row === "hand") {
      const label = state.hand.find((c) => c.card === code)?.label ?? code;
      return `${label}, in your hand${sel.chosen === code ? ", chosen" : ""}.`;
    }
    const item = state.table.find((i) => i.cards.some((c) => c.card === code));
    const labels = item.cards.map((c) => c.label).join(" ");
    const what = item.build ? `A build of ${item.build.value}${item.build.multiple ? "s" : ""}: ${labels}` : labels;
    const look = itemState(code, offer, sel, state.table);
    const why = look === "refused" ? ` ${whyNot(code, offer, state.table)}` : look === "addable" ? ", can join" : look === "picked" ? ", picked" : "";
    return `${what}, on the table${why}.`;
  }
  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || document.querySelector("md-dialog[open]") || state.watching) return;
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " ", "Escape"];
    if (!keys.includes(event.key)) return;
    // Keys pressed on a button are the button's own.
    if (event.target instanceof Element && event.target.closest("button, [role=button], md-assist-chip, md-filled-button, md-outlined-button, md-text-button, md-filled-tonal-button, md-icon-button, md-switch, md-outlined-select, md-outlined-segmented-button")) return;
    if (state.prompt !== "play") return;
    event.preventDefault();
    if (event.key === "Escape") {
      sel = EMPTY;
      refresh();
      return;
    }
    if (!focus) focus = { row: "hand", index: 0 };
    else if (event.key === "ArrowLeft") focus = { ...focus, index: Math.max(0, Math.min(focus.index, rowCards(focus.row).length - 1) - 1) };
    else if (event.key === "ArrowRight") focus = { ...focus, index: Math.min(rowCards(focus.row).length - 1, focus.index + 1) };
    else if (event.key === "ArrowUp" && state.table.length) focus = { row: "table", index: 0 };
    else if (event.key === "ArrowDown") focus = { row: "hand", index: 0 };
    else if (event.key === "Enter" || event.key === " ") {
      const code = focused();
      const slot = code && director.placement().find((m) => m.code === code);
      if (slot) tapped(slot);
    }
    overlay.tell(describe(focused()));
    director.redecorate();
  });

  // ---- the start ----------------------------------------------------------

  // The sitting under way when the page was last open, if there is one and
  // no game was asked for; else a new one.
  const kept = fixedSeed || params.has("watch") || STAGING ? null : loadSitting(store);
  const restored = kept ? engine.restore(kept) : null;
  if (restored?.ok && restored.state.prompt !== "over") {
    state = restored.state;
    // The person's aids, as they set them, over the record's (T14).
    for (const [aid, on] of Object.entries(prefs.aids)) if (Boolean(state.aids[aid]) !== on) state = engine.send(`set ${aid} ${on ? "on" : "off"}`).state;
    tutorialSince = state.events.length; // the history restored is not news (review T8)
    tutorFocus();
    director.restart(state);
    badgeFrom = state;
    scoreShown();
    refresh();
    if (welcomeWanted(params))
      askNewGame({
        opening: true,
        canContinue: true,
        cancelled: () => {
          refresh();
          introduce();
        },
      });
  } else if (STAGING) {
    stageEnding();
  } else {
    newGame({ watch: params.has("watch"), welcome: welcomeWanted(params) });
  }
  figureFor(courtFor(state.seed));
  document.getElementById("loading").remove();
  sayProgress();
  staleSoon(4000);

  // For the browser test: where a card is on the screen, the chips, the
  // sheet and the talk, and the clock (with ?manual, the test moves it).
  window.cassino3d = {
    engine,
    state: () => state,
    prefs: () => prefs,
    meshes: () => director.meshes.length,
    faces: () => director.meshes.filter((m) => m.userData.code).map((m) => m.userData.code),
    chips: () => overlay.chips(),
    said: () => overlay.said(),
    cheers: () => overlay.cheers(),
    hud: () => ({ shown: hud.shown(), totals: hud.totals(), hands: hud.hands(), idle: hud.idle() }),
    hint: () => hint,
    nudge: () => nudge,
    progress: () => loadProgress(store),
    // The game's end: who your opponent turned out to be, whether the figure
    // stands, and how far the camera has pulled back (null in play).
    opponent: () => ({ court: standing, revealed: stage.revealed(), ending: endingsBar.hidden ? null : endingWords.textContent }),
    selection: () => sel,
    tutorialOpen: () => chrome.tutorialOpen(),
    series: () => series,
    facesShown: () => facesShown,
    pageDue: () => pageDue(state, prefs.seen, tutorialSince),
    screenPoint: (code) => director.screenPoint(code),
    zoneBounds: (zone) => zoneOnScreen(zone),
    // Each card of a zone, its extent on the screen as it rests.
    cardRects: (zone) => cardRectsOf(zone),
    pickAt: (x, y) => {
      const m = director.pick(x, y);
      return m ? { zone: m.zone, code: m.code } : null;
    },
    busy: () => director.busy() || stage.reframing(),
    strips: () => stage.strips(),
    skip: () => director.skip(),
    tick: (ms) => director.tick(ms),
  };
}

main().catch((error) => {
  console.error(error);
  const loading = document.getElementById("loading");
  if (loading) loading.textContent = "The table could not be set.";
});
