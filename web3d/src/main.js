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

import { Vector3 } from "three";
import { loadTextures, vectorWidth } from "./art.js";
import { createChrome } from "./chrome.js";
import { createDeck } from "./deck.js";
import { createDialogue } from "./dialogue.js";
import { createDirector } from "./director.js";
import { facesFor, jumboTextures, phoneHere } from "./faces.js";
import { decodeBase64, loadEngine } from "./engine.js";
import { createHud, hudEvents, ledgerOf } from "./hud.js";
import { createOverlay } from "./overlay.js";
import { badgeText, badgeTitle, badgesShown } from "./badges.js";
import { badgesOn, dailySeed, loadPrefs, loadSeries, loadSitting, savePrefs, saveSeries, saveSitting, withUrl } from "./prefs.js";
import { recordGame, seriesLine } from "./series.js";
import { createScene } from "./scene.js";
import { trackers } from "./scorebug.js";
import { EMPTY, choose, chipsOf, itemState, pick, selectionOf, selectionText, sweepWarning, valuesSaid, whyNot } from "./selection.js";
import { chooseSurface } from "./surfaces.js";
import { speech } from "./talk.js";
import { commandsBetween, prefix, stops } from "./replay.js";
import { pageDue, parseTutorial } from "./tutorial.js";
import TUTORIAL_TEXT from "../tutorial.md";
import { CARD, PORTRAIT_BELOW, ZONES, ZONES_PORTRAIT } from "./units.js";

/* global WASM_BASE64, ART, WORDS */

const params = new URL(window.location.href).searchParams;
const WATCH_PAUSE = 650; // ms between the moves of a watched game
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
  let logOpen = false;
  let badgeFrom = null; // the state the cards are moving from (badges.js)

  const stage = createScene(document.getElementById("stage"), {
    table: chooseSurface({ chosen: prefs.surface, saved: null }),
  });
  const anisotropy = stage.renderer.capabilities.getMaxAnisotropy();
  const textures = await loadTextures(ART, { anisotropy, pixelRatio: stage.renderer.getPixelRatio() });
  const deck = createDeck(stage, textures);

  // The card faces: Large Text on a phone and the classic faces elsewhere,
  // or whichever is chosen in the settings, changed where the cards lie
  // (faces.js, after piquet's main.js).
  const phone = phoneHere();
  const faceSets = { classic: textures.faces };
  let facesShown = "classic";
  function showFaces(choice) {
    const want = facesFor(choice, phone);
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
    // out stacked (units.js ZONES_PORTRAIT).
    view: () => ({ ...sel, zones: stage.portrait ? ZONES_PORTRAIT : ZONES, revealed: replay?.revealed ?? null }),
    decorate,
    rested: () => {
      badgeFrom = state; // from here, a move starts from this table
      placeBadges();
      overlay.trackers(trackers(state), state.watching);
      show();
      if (state.watching) watchOn();
      else if (replay) replayOn();
      else introduce();
    },
    manual: params.has("manual"),
    speed: prefs.speed,
  });

  const overlay = createOverlay(document.getElementById("overlay"), {
    onChip: (chip) => {
      const sent = engine.send(chip.move);
      message = sent.ok ? null : sent.state.error;
      advance(sent.state);
    },
    onNext: () => advance(engine.send("next").state),
    onNewGame: () => newGame(),
    onReplay: (what) => replayDo(what),
    // A badge tapped is its build tapped.
    onBadge: (id) => tapped(director.placement().find((m) => m.item === id) ?? null),
    // The trackers' panel folded or opened: kept for next time.
    onFold: (open) => change({ trackersOpen: open }),
    later: (ms, fn) => director.at(ms, fn, "linger"),
  });

  const hud = createHud(overlay.hudSlot, { later: (ms, fn) => director.at(ms, fn) });
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
    newGame: () => newGame(),
    daily: () => newGame({ seed: dailySeed() }),
    watch: () => newGame({ watch: true }),
    rules: (rules) => change({ rules }),
    skill: (value) => change({ skill: value }),
    aid: (name, on) => {
      change({ aids: { ...prefs.aids, [name]: on } });
      // A watched game, or the replay's sitting, keeps its own (S3).
      if (state.watching || replay) return;
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
      if (name === "match") {
        series = { format: value, you: 0, them: 0, counted: [] };
        saveSeries(store, series);
      }
      refresh();
    },
    copy: async (button) => {
      try {
        // During the replay, the whole game's record, not the step's (S3).
        await navigator.clipboard.writeText(replay?.record ?? state.saved);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Could not copy";
      }
      setTimeout(() => (button.textContent = "Copy game record"), 1600);
    },
    undo: () => {
      const sent = engine.send("undo");
      if (!sent.ok) return;
      director.cancelTimed();
      overlay.hush();
      dialogue.stop();
      lastMove = null;
      badgeFrom = state;
      state = sent.state;
      sel = EMPTY;
      director.advance(state);
      scoreShown();
      persist();
      refresh();
    },
    hint: () => {
      if (!hint) return;
      sel = selectionOf(hint.move, state.table);
      refresh();
    },
    // The last move seen again (DESIGN.md §12.3, "a 'last turn' replay"):
    // the cards from where they were, the score and the talk as they are.
    again: () => {
      if (!lastMove || replay || director.busy()) return;
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
  // opening deal waits for the house rules to be agreed aloud.
  function newGame({ seed = randomSeed(), watch = false } = {}) {
    replay = null;
    badgeFrom = null;
    lastMove = null;
    director.cancelTimed();
    watchStep = false; // a step pending was cancelled with the rest (review T2)
    overlay.hush();
    dialogue.stop();
    state = watch
      ? engine.watch({ ...prefs.rules, skills: [prefs.skill, prefs.skill], seed })
      : engine.start({ ...prefs.rules, skill: prefs.skill, seed });
    if (!watch) for (const [aid, on] of Object.entries(prefs.aids)) if (on) state = engine.send(`set ${aid} on`).state;
    sel = EMPTY;
    offer = null;
    message = null;
    const dealt = !params.has("nodeal");
    const opening = dialogue.words(speech(state, 0));
    const timing = director.restart(state, { dealt, waits: dealt ? openingTalk(state, opening) : {} });
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
    if (!prefs.tutorial || replay || chrome.tutorialOpen()) return;
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
    lastMove = before && before.seed === next.seed && !next.watching && !replay ? { before, after: next } : null;
    state = next;
    sel = EMPTY;
    offer = null;
    badgeFrom = before;
    const timing = director.advance(state);
    playScore(before.events.length, timing);
    talk(state, before.events.length, timing);
    if (state.prompt === "over") countGame();
    persist();
    refresh();
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
    const ends = state.events.findLast((e) => e.kind === "game_ends");
    if (!ends || state.watching || replay || prefs.match !== "best-of-7") return;
    // Each game counted once, by its record (a seed can deal more than one
    // game: a seeded link, today's deal twice; the second review, S8); a
    // game from a seeded link is not kept in the saved series.
    series = recordGame({ ...series, format: "best-of-7" }, { seed: gameKey(state.saved), youWon: ends.you_won });
    if (!fixedSeed) saveSeries(store, series);
  }

  function persist() {
    // A game from a seeded link is not kept over the sitting saved (T16),
    // nor a step of the replay.
    if (state.watching || fixedSeed || replay) return;
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

  // ---- the replay, both hands face up --------------------------------------

  // After the game: its record stepped through, a decision at a time, with
  // your opponent's hand shown (fairness you can check, DESIGN.md §12.3).
  // Forward sends the record's next command to the replayed sitting; back
  // restores the record up to there; leaving restores the finished game.
  let replay = null; // { record, revealed, at, k, playing }
  let replayStepping = false;
  function settleOn(next) {
    badgeFrom = null;
    director.cancelTimed();
    replayStepping = false; // a step pending went with the rest (as review T2)
    lastMove = null; // nothing to see again across a replay (S5)
    overlay.hush();
    dialogue.stop();
    state = next;
    sel = EMPTY;
    offer = null;
    director.restart(state);
    scoreShown();
    refresh();
  }
  function replayOn() {
    if (!replay?.playing || replayStepping) return;
    if (replay.k >= replay.at.length - 1) {
      replay.playing = false;
      show();
      return;
    }
    replayStepping = true;
    const token = replayToken;
    director.at(900, () => {
      replayStepping = false;
      // A step pressed by hand meanwhile takes this one's place (S7).
      if (token === replayToken && replay?.playing && !director.busy()) replayDo("next", true);
    });
  }
  let replayToken = 0;
  function replayDo(what, auto = false) {
    if (!auto) replayToken++;
    if (what === "start") {
      if (state.prompt !== "over" || state.watching) return;
      const record = state.saved;
      replay = { record, revealed: engine.reveal(), at: stops(record), k: 0, playing: false };
      const r = engine.restore(prefix(record, 0));
      if (!r.ok) {
        replay = null;
        return;
      }
      settleOn(r.state);
      return;
    }
    if (!replay) return;
    if (what === "leave") {
      const r = engine.restore(replay.record);
      replay = null;
      if (r.ok) settleOn(r.state);
      return;
    }
    if (what === "play") {
      replay.playing = !replay.playing;
      show();
      if (replay.playing && !director.busy()) replayOn();
      return;
    }
    if (director.busy()) director.skip();
    if (what === "next" && replay.k < replay.at.length - 1) {
      const k = replay.k + 1;
      // A command refused would leave the record: stop there (S2).
      for (const command of commandsBetween(replay.record, replay.at[k - 1], replay.at[k])) {
        if (!engine.send(command).ok) {
          replay.playing = false;
          show();
          return;
        }
      }
      replay.k = k;
      advance(engine.state());
    } else if (what === "back" && replay.k > 0) {
      const k = replay.k - 1;
      const r = engine.restore(prefix(replay.record, replay.at[k]));
      if (!r.ok) return;
      replay.k = k;
      settleOn(r.state);
    }
  }

  // ---- what is said -------------------------------------------------------

  const dialogue = createDialogue(WORDS, () => director.clock());

  // The house rules are agreed aloud and the cut made before the cards are
  // dealt: the opening deal waits until that has been said.
  // The words are chosen once, so the wait is planned on what is said (the
  // table review's T18).
  function openingTalk(s, lines) {
    const deal = s.events.findIndex((e) => e.kind === "dealt");
    if (deal < 0) return {};
    const said = dialogue.plan(lines.filter((l) => l.at < deal).map((l) => ({ ...l, delay: 0 })));
    return { [deal]: Math.max(0, ...said.map((l) => l.end)) + 250 };
  }

  // Each line at the moment its event is seen (a line of the count, as it
  // is written down), in its speaker's box.
  function talk(s, since, { beats, count }, said = speech(s, since)) {
    // Lines still waiting from moves already past are not said now.
    if (since > 0) {
      director.drop("talk");
      dialogue.skip();
    }
    const lines = said.map((l) => ({
      ...l,
      delay: l.line !== undefined && count ? count.lines[l.line] : (beats[l.at] ?? 0),
    }));
    dialogue.say(lines, (line, words, ms) => director.at(ms, () => overlay.say(line.who, words, director.handEdge(line.who)), "talk"));
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
    const pace = count && count.lines.length > 1 ? count.lines[1] - count.lines[0] : 600;
    for (const e of hudEvents(state, since)) {
      const ms = e.line !== undefined && count ? (count.lines[e.line] ?? (count.lines.at(-1) ?? 0) + pace) : beats[e.at];
      at(ms, () => (e.end ? hud.endHand(e.hand) : hud.score(e)));
    }
  }

  // A badge on the top right corner of each build's top card (clear of the
  // indices, which are top left and bottom right), with the build values on (or
  // the tutorial): drawn with every frame, following the card, and kept
  // through every move that leaves its build alone (badges.js).
  function placeBadges() {
    if (!state || !badgesOn(prefs)) return overlay.placeBadges([]);
    const whose = state.watching ? { you: "South's", them: "North's" } : undefined;
    const list = [];
    for (const item of badgesShown(badgeFrom ?? state, state, director.busy())) {
      const top = director.meshOf(item.cards[item.cards.length - 1].card);
      if (!top) continue;
      const corner = new Vector3(CARD.width / 2 - 0.5, CARD.height / 2 - 0.5, CARD.thickness / 2);
      const at = director.toScreen(corner.applyQuaternion(top.quaternion).add(top.position));
      list.push({ id: item.id, text: badgeText(item.build), title: badgeTitle(item, whose), ...at });
    }
    overlay.placeBadges(list);
  }
  window.addEventListener("resize", placeBadges);
  stage.onRender = placeBadges;

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
    document.documentElement.classList.toggle("upright", isUpright());
    document.documentElement.classList.toggle("sideways", sideways.matches);
  }
  arrange();
  function fitStrips() {
    arrange();
    const rect = (sel) => document.querySelector(sel).getBoundingClientRect();
    const panel = document.querySelector(".aids-panel");
    const hud = rect(".info");
    const upright = isUpright();
    panel.style.top = upright ? `${hud.bottom + 6}px` : "";
    if (sideways.matches) {
      stage.setStrips({ top: 0, foot: 0, left: hud.right + 8, right: window.innerWidth - rect(".controls").left + 8, raised: 0 });
      return;
    }
    const top = (upright && !panel.hidden ? panel.getBoundingClientRect().bottom : hud.bottom) + 6;
    const foot = window.innerHeight - Math.min(rect(".controls").top, rect(".bar").top) + 6;
    stage.setStrips({ top, foot, raised: 0 });
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
    const replaying = replay ? { k: replay.k, n: replay.at.length - 1, playing: replay.playing } : null;
    const after = prefs.match === "best-of-7" && !state.watching ? seriesLine(series) : null;
    overlay.show({ state, chips: busy || replay ? [] : chipsOf(offer), sum: replay ? null : (offer?.sum ?? null), message, busy, aid: replay ? null : aidLine(), replay: replaying, after });
    // The cards still out and the log tell what the cards have shown: they
    // wait for the cards to come to rest, as the trackers do (review T7).
    if (!busy) {
      overlay.unseen(prefs.unseen && !state.watching ? state.unseen : null);
      drawLog();
    }
    overlay.showTrackers(prefs.trackers);
    overlay.setOpen(prefs.trackersOpen);
    chrome.sync(prefs, state, { busy, canAgain: Boolean(lastMove) && !replay, replaying: Boolean(replay) });
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
    const hintFor = !state.watching && !replay && state.prompt === "play" && state.aids.hints ? state.saved : null;
    if (hintFor !== hintKey) {
      hintKey = hintFor;
      hint = hintFor ? engine.hint() : null;
      if (!hint?.move) hint = null;
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
    if (!slot || state.prompt !== "play" || state.watching || replay) return;
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
    row === "hand" ? state.hand.map((c) => c.card) : state.table.map((item) => item.cards[item.cards.length - 1].card);
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
    if (event.defaultPrevented || document.querySelector("md-dialog[open]") || state.watching || replay) return;
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
  const kept = fixedSeed || params.has("watch") ? null : loadSitting(store);
  const restored = kept ? engine.restore(kept) : null;
  if (restored?.ok && restored.state.prompt !== "over") {
    state = restored.state;
    // The person's aids, as they set them, over the record's (T14).
    for (const [aid, on] of Object.entries(prefs.aids)) if (Boolean(state.aids[aid]) !== on) state = engine.send(`set ${aid} ${on ? "on" : "off"}`).state;
    tutorialSince = state.events.length; // the history restored is not news (review T8)
    director.restart(state);
    scoreShown();
    refresh();
  } else {
    newGame({ watch: params.has("watch") });
  }
  document.getElementById("loading").remove();

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
    hud: () => ({ shown: hud.shown(), totals: hud.totals(), hands: hud.hands(), idle: hud.idle() }),
    hint: () => hint,
    selection: () => sel,
    tutorialOpen: () => chrome.tutorialOpen(),
    replay: () => (replay ? { k: replay.k, n: replay.at.length - 1 } : null),
    series: () => series,
    facesShown: () => facesShown,
    pageDue: () => pageDue(state, prefs.seen, tutorialSince),
    screenPoint: (code) => director.screenPoint(code),
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
