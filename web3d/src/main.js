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
import { loadTextures } from "./art.js";
import { createChrome } from "./chrome.js";
import { createDeck } from "./deck.js";
import { createDialogue } from "./dialogue.js";
import { createDirector } from "./director.js";
import { decodeBase64, loadEngine } from "./engine.js";
import { createHud, hudEvents, ledgerOf } from "./hud.js";
import { createOverlay } from "./overlay.js";
import { dailySeed, loadPrefs, loadSitting, savePrefs, saveSitting, withUrl } from "./prefs.js";
import { createScene } from "./scene.js";
import { trackers } from "./scorebug.js";
import { EMPTY, choose, chipsOf, itemState, pick, selectionOf, selectionText, whyNot } from "./selection.js";
import { chooseSurface } from "./surfaces.js";
import { speech } from "./talk.js";
import { pageDue, parseTutorial } from "./tutorial.js";
import TUTORIAL_TEXT from "../tutorial.md";
import { CARD } from "./units.js";

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
  let prefs = withUrl(loadPrefs(store), params);
  const fixedSeed = Number(params.get("seed")) || null;
  const randomSeed = () => fixedSeed ?? Math.floor(Math.random() * 2 ** 31);

  let state = null;
  let sel = EMPTY;
  let offer = null;
  let message = null;
  let hint = null; // the hint for this turn, if hints are on
  let logOpen = false;

  const stage = createScene(document.getElementById("stage"), {
    table: chooseSurface({ chosen: prefs.surface, saved: null }),
  });
  const anisotropy = stage.renderer.capabilities.getMaxAnisotropy();
  const textures = await loadTextures(ART, { anisotropy, pixelRatio: stage.renderer.getPixelRatio() });
  const deck = createDeck(stage, textures);

  // The cards' lines: while choosing, the hand card chosen and the table
  // cards picked in amber, what could join in cyan, what cannot dimmed; with
  // nothing chosen, the hint's cards in cyan.
  function decorate(placement, deck, meshes) {
    const shown = hint && !sel.chosen ? selectionOf(hint.move, state.table) : null;
    const hinted = new Set(shown ? [shown.chosen, ...shown.picked] : []);
    for (const m of placement) {
      let look = m.zone === "middle" ? itemState(m.code, offer, sel) : m.code && m.code === sel.chosen ? "picked" : "idle";
      if (look === "idle" && hinted.has(m.code)) look = "addable";
      deck.decorate(meshes[m.id], {
        line: look === "picked" ? "chosen" : look === "addable" ? "hint" : "plain",
        dim: look === "refused",
      });
    }
  }

  const director = createDirector({
    stage,
    deck,
    view: () => sel,
    decorate,
    rested: () => {
      placeBadges();
      overlay.trackers(trackers(state));
      show();
      if (state.watching) watchOn();
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
    later: (ms, fn) => director.at(ms, fn),
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
    overlay.names(who);
    const none = { cards: 0, spades: 0, aces: 0, big_casino: false, little_casino: false, sweeps: 0 };
    overlay.trackers(trackers(upTo < state.events.length ? { ...seen, piles: { you: none, them: none } } : state));
  }

  const keep = () => savePrefs(store, prefs);
  const chrome = createChrome(document.getElementById("overlay"), {
    newGame: () => newGame(),
    daily: () => newGame({ seed: dailySeed() }),
    watch: () => newGame({ watch: true }),
    rules: (rules) => {
      prefs = { ...prefs, rules };
      keep();
    },
    skill: (value) => {
      prefs = { ...prefs, skill: value };
      keep();
    },
    aid: (name, on) => {
      prefs = { ...prefs, aids: { ...prefs.aids, [name]: on } };
      keep();
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
      prefs = { ...prefs, [name]: value };
      keep();
      if (name === "speed") director.setSpeed(value);
      if (name === "surface") stage.setSurface(chooseSurface({ chosen: value, saved: null }));
      refresh();
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
    undo: () => {
      const sent = engine.send("undo");
      if (!sent.ok) return;
      director.cancelTimed();
      overlay.hush();
      dialogue.stop();
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
    log: (open) => {
      logOpen = open;
      drawLog();
    },
    help: () => readPages(0),
  });

  // ---- the game -----------------------------------------------------------

  // A new sitting, played or watched, with the next game's rules; the
  // opening deal waits for the house rules to be agreed aloud.
  function newGame({ seed = randomSeed(), watch = false } = {}) {
    director.cancelTimed();
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
    const timing = director.restart(state, { dealt, waits: dealt ? openingTalk(state) : {} });
    if (dealt) {
      talk(state, 0, timing);
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
    prefs = { ...prefs, seen: [...prefs.seen, key] };
    keep();
  }
  function introduce() {
    if (!prefs.tutorial || chrome.tutorialOpen()) return;
    if (director.held()) return; // a page is up, or closing
    const key = pageDue(state, prefs.seen, tutorialSince);
    tutorialSince = state.events.length;
    if (key) readPages(PAGES.findIndex((p) => p.key === key));
  }
  function readPages(at) {
    if (chrome.tutorialOpen()) return;
    director.gate(0, (release) => chrome.showTutorial(PAGES, at, { seen: markSeen, done: release, popups: prefs.tutorial }));
  }

  // The engine's next state, played out.
  function advance(next) {
    const before = state;
    state = next;
    sel = EMPTY;
    offer = null;
    overlay.placeBadges([]);
    const timing = director.advance(state);
    playScore(before.events.length, timing);
    talk(state, before.events.length, timing);
    persist();
    refresh();
  }

  // The sitting kept across a reload; a watched game, or one that is over,
  // is not kept.
  function persist() {
    if (!state.watching) saveSitting(store, state.prompt === "over" ? null : state.saved);
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

  // The house rules are agreed aloud and the cut made before the cards are
  // dealt: the opening deal waits until that has been said.
  function openingTalk(s) {
    const deal = s.events.findIndex((e) => e.kind === "dealt");
    if (deal < 0) return {};
    const before = speech({ ...s, events: s.events.slice(0, deal) }, 0);
    const said = dialogue.plan(before.map((l) => ({ ...l, delay: 0 })));
    return { [deal]: Math.max(0, ...said.map((l) => l.end)) + 250 };
  }

  // Each line at the moment its event is seen (a line of the count, as it
  // is written down), in its speaker's box.
  function talk(s, since, { beats, count }) {
    const lines = speech(s, since).map((l) => ({
      ...l,
      delay: l.line !== undefined && count ? count.lines[l.line] : (beats[l.at] ?? 0),
    }));
    dialogue.say(lines, (line, words, ms) => director.at(ms, () => overlay.say(line.who, words, director.handEdge(line.who))));
  }

  // ---- the score ------------------------------------------------------------

  // The HUD's events, each at its moment: a sweep's point as the sweep is
  // seen, the count's lines as their cards turn up, the hand's end after
  // its count, and a new hand's live block as it is dealt.
  function playScore(since, { beats, count }) {
    const at = (ms, fn) => director.at(Math.max(0, ms ?? 0), fn);
    state.events.forEach((e, k) => {
      if (k >= since && e.kind === "dealt" && e.deal === 1) at(beats[k], () => hud.dealt());
    });
    const pace = count && count.lines.length > 1 ? count.lines[1] - count.lines[0] : 600;
    for (const e of hudEvents(state, since)) {
      const ms = e.line !== undefined && count ? (count.lines[e.line] ?? (count.lines.at(-1) ?? 0) + pace) : beats[e.at];
      at(ms, () => (e.end ? hud.endHand() : hud.score(e)));
    }
  }

  // A badge just above each build's top card, once the cards are still.
  function placeBadges() {
    if (director.busy()) return overlay.placeBadges([]);
    const list = [];
    for (const item of state.table) {
      if (!item.build) continue;
      const top = director.meshOf(item.cards[item.cards.length - 1].card);
      if (!top) continue;
      const at = director.toScreen(top.position.clone().add(new Vector3(0, 0, -CARD.height / 2 - 1)));
      list.push({ ...item.build, ...at });
    }
    overlay.placeBadges(list);
  }
  window.addEventListener("resize", placeBadges);

  // ---- the prompt, the aids and the log ----------------------------------

  // The line the aids add under the prompt: the hint, or the sweep warning.
  function aidLine() {
    if (state.watching || state.prompt !== "play") return null;
    if (hint) return `Hint: ${hint.advice}.`;
    if (prefs.sweepWarning && state.sweep_values.length) {
      const values = state.sweep_values.map((v) => (v === 1 || v === 14 ? "an ace" : v === 8 || v === 11 ? `an ${v}` : `a ${v}`));
      const text = `${[...new Set(values)].join(" or ")} would clear the table.`;
      return text[0].toUpperCase() + text.slice(1);
    }
    return null;
  }

  function show() {
    const busy = director.busy();
    overlay.show({ state, chips: busy ? [] : chipsOf(offer), sum: offer?.sum ?? null, message, busy, aid: aidLine() });
    overlay.unseen(prefs.unseen && !state.watching ? state.unseen : null);
    overlay.showTrackers(prefs.trackers);
    chrome.sync(prefs, state);
    drawLog();
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
    hint = !state.watching && state.prompt === "play" && state.aids.hints ? engine.hint() : null;
    if (!hint?.move) hint = null;
    director.rearrange();
    show();
  }

  // A tap on a card. While the cards are moving, a tap lands them.
  function tapped(slot) {
    if (director.busy()) {
      director.skip();
      return;
    }
    message = null;
    if (!slot || state.prompt !== "play" || state.watching) return;
    if (slot.zone === "your-hand") {
      sel = choose(sel, slot.code);
    } else if (slot.zone === "middle") {
      if (!sel.chosen) {
        message = "Choose a card from your hand first.";
      } else if (itemState(slot.code, offer, sel) === "refused") {
        message = whyNot(slot.code, offer);
      } else {
        const item = state.table.find((i) => i.id === slot.item);
        sel = pick(sel, item.cards.map((c) => c.card));
      }
    }
    refresh();
  }

  const canvas = stage.renderer.domElement;
  canvas.addEventListener("click", (event) => tapped(director.pick(event.clientX, event.clientY)));

  // ---- the start ----------------------------------------------------------

  // The sitting under way when the page was last open, if there is one and
  // no game was asked for; else a new one.
  const kept = fixedSeed || params.has("watch") ? null : loadSitting(store);
  const restored = kept ? engine.restore(kept) : null;
  if (restored?.ok && restored.state.prompt !== "over") {
    state = restored.state;
    director.restart(state);
    scoreShown();
    refresh();
    tutorialSince = state.events.length;
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
    tutorialOpen: () => chrome.tutorialOpen(),
    pageDue: () => pageDue(state, prefs.seen, tutorialSince),
    screenPoint: (code) => director.screenPoint(code),
    busy: () => director.busy(),
    skip: () => director.skip(),
    tick: (ms) => director.tick(ms),
  };
}

main().catch((error) => {
  console.error(error);
  const loading = document.getElementById("loading");
  if (loading) loading.textContent = "The table could not be set.";
});
