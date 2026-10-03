// The overlay: the 2D surfaces floating over the table, in Material Design 3
// (docs/TABLE3D.md section 8): the prompt, the chips that offer what a
// selection makes, the running sum, the "why not?" line, the next hand and
// the end of the game; the badges over the builds; at the top left, a slot
// for the score HUD (hud.js); at the foot of the left, the aids' panel (each
// player's captures, the cards still out); under the top bar, the game log;
// and what is said at the table, in boxes by each speaker's hand. Each sits
// clear of the table's corners: the HUD ends above your opponent's pile.
//
// It draws what it is given and reports what is pressed; it holds no rules.

import "@material/web/button/filled-button.js";
import "@material/web/button/filled-button.js";
import "@material/web/iconbutton/icon-button.js";
import { trackerTable } from "./scorebug.js";
import { moveBar } from "./selection.js";

// `later(ms, fn)` runs `fn` after `ms` on the table's clock (director.at),
// so a box lingers as long as the table runs, and holds when it is held.
export function createOverlay(root, { onChip, onNext, onNewGame, onReplay = () => {}, onBadge = () => {}, onFold = () => {}, later = (ms, fn) => setTimeout(fn, ms) }) {
  root.innerHTML = `
    <div class="badges"></div>
    <div class="cheers" aria-hidden="true"></div>
    <div class="afloat"></div>
    <div class="info"><div class="hud-slot"></div></div>
    <p class="focus-told" aria-live="polite"></p>
    <section class="aids-panel" hidden aria-label="Captures and the cards still out">
      <div class="aids-head"><h2 class="aids-title">Captured this hand</h2></div>
      <div class="aids-body">
        <table class="tracker-table"><thead><tr></tr></thead><tbody></tbody></table>
        <p class="out" hidden></p>
      </div>
    </section>
    <div class="tip" role="tooltip" hidden></div>
    <aside class="game-log" hidden aria-label="The game log"><h2>Game log</h2><ol></ol></aside>
    <section class="controls">
      <p class="prompt" aria-live="polite"></p>
      <p class="note" aria-live="polite"></p>
      <p class="aid-line" hidden></p>
      <div class="move-bar" hidden><div class="sum" hidden></div><div class="chips" role="group" aria-label="Your move"></div></div>
      <md-filled-button class="next" hidden>Next hand</md-filled-button>
      <md-filled-button class="again" hidden>New game</md-filled-button>
      <md-outlined-button class="replay" hidden>Replay with both hands</md-outlined-button>
      <div class="replay-bar" hidden>
        <md-text-button class="replay-back">Back</md-text-button>
        <span class="replay-where"></span>
        <md-text-button class="replay-next">Next</md-text-button>
        <md-text-button class="replay-play">Play</md-text-button>
        <md-text-button class="replay-leave">Leave the replay</md-text-button>
      </div>
    </section>`;
  const $ = (s) => root.querySelector(s);
  const prompt = $(".prompt");
  const note = $(".note");
  const sum = $(".sum");
  const chipSet = $(".chips");
  const next = $(".next");
  const again = $(".again");
  const badges = $(".badges");
  const aidLine = $(".aid-line");
  next.addEventListener("click", () => onNext());
  again.addEventListener("click", () => onNewGame());
  // The replay after the game, with both hands face up.
  const replayButton = $(".replay");
  const replayBar = $(".replay-bar");
  replayButton.addEventListener("click", () => onReplay("start"));
  $(".replay-back").addEventListener("click", () => onReplay("back"));
  $(".replay-next").addEventListener("click", () => onReplay("next"));
  $(".replay-play").addEventListener("click", () => onReplay("play"));
  $(".replay-leave").addEventListener("click", () => onReplay("leave"));

  // The prompt, the chips and the buttons, for a state and the offer for the
  // person's selection (null if nothing is chosen).
  // `aid`: a line the aids add under the prompt (a hint, the sweep warning).
  // `replay`: { k, n, playing } while the game is replayed.
  // `after`: a line for the end of the game (the series, if one is played).
  const bar = $(".move-bar");
  function show({ state, chips, sum: total, message, busy = false, aid = null, replay = null, after = null }) {
    prompt.textContent = replay ? "The game replayed, both hands face up." : busy ? "" : promptText(state, chips);
    if (!replay && !busy && after && state.prompt === "over") prompt.textContent += ` ${after}`;
    replayBar.hidden = !replay;
    if (replay) {
      $(".replay-where").textContent = `Move ${replay.k} of ${replay.n}`;
      $(".replay-back").disabled = replay.k === 0;
      $(".replay-next").disabled = replay.k === replay.n;
      $(".replay-play").textContent = replay.playing ? "Pause" : "Play";
    }
    aidLine.hidden = busy || !aid;
    aidLine.textContent = aid ?? "";
    note.textContent = message ?? "";
    sum.hidden = total == null;
    sum.textContent = total == null ? "" : `Sum ${total}`;
    // The move bar, always there on your turn (play-testing): Take, Build
    // and Trail, lit when the choice makes one and dimmed when not
    // (selection.js moveBar). The chips are made again only when what they
    // offer changes, so one that has the keyboard's focus keeps it (the
    // table review's T15).
    bar.hidden = Boolean(replay) || state.watching || state.prompt !== "play";
    const offered = moveBar(chips);
    const moves = offered.map((c) => `${c.kind}|${c.label}|${c.move ?? ""}`).join("\n");
    if (chipSet.dataset.moves !== moves) {
      chipSet.dataset.moves = moves;
      // Filled buttons, large and opaque (play-testing: they are there for
      // the play, no need to hide them), dimmed but still solid when not.
      chipSet.replaceChildren(
        ...offered.map((c) => {
          const button = document.createElement("md-filled-button");
          button.textContent = c.label;
          button.dataset.kind = c.kind;
          if (!c.enabled) {
            button.disabled = true;
            return button;
          }
          button.dataset.move = c.move;
          if (c.call) button.title = c.call;
          button.addEventListener("click", () => onChip(c));
          return button;
        }),
      );
    }
    next.hidden = busy || replay || state.prompt !== "next_hand";
    again.hidden = busy || replay || state.prompt !== "over";
    replayButton.hidden = busy || replay || state.prompt !== "over" || state.watching;
  }

  // A badge over each build: its value ("8", "8s" for a multiple build) at
  // a point on the screen, its title saying whose and of what. Placed every
  // frame the table is drawn, so each is kept by its item's id and moved.
  const placed = new Map();
  function placeBadges(list) {
    const keep = new Set();
    for (const { id, text, title, x, y, font } of list) {
      keep.add(id);
      let badge = placed.get(id);
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "badge";
        badge.addEventListener("click", () => onBadge(id));
        placed.set(id, badge);
        badges.append(badge);
      }
      if (badge.textContent !== text) badge.textContent = text;
      if (badge.title !== title) badge.title = title;
      badge.style.left = `${x}px`;
      badge.style.top = `${y}px`;
      if (font) badge.style.fontSize = `${font.toFixed(1)}px`;
    }
    for (const [id, badge] of placed) {
      if (keep.has(id)) continue;
      badge.remove();
      placed.delete(id);
    }
  }

  // ---- a score celebrated on the table -------------------------------------

  // As the HUD's popup does on the score, a score is celebrated where it was
  // won: a disc with its words just above the card (or the pile) on the
  // screen, clear of it -- below it where there is no room above, under the
  // HUD or the screen's top -- and its points bursting out of the disc like
  // a firework: a jolt, then slowing, sinking a little and fading. Gone in
  // under two seconds, on the table's clock (`later`). `top` and `bottom`:
  // the card's extent on the screen.
  const cheers = $(".cheers");
  const DISC = 54; // the disc's radius, as drawn
  const BURSTS = [
    { angle: -160, reach: 104, rot: -16 },
    { angle: -115, reach: 122, rot: -6 },
    { angle: -65, reach: 120, rot: 6 },
    { angle: -20, reach: 102, rot: 16 },
  ];
  function celebrate({ label, pts, x, top, bottom }) {
    const hud = root.querySelector(".info")?.getBoundingClientRect();
    const GAP = 14; // between the disc and the card
    const above = top - DISC - GAP;
    const underHud = hud && x + DISC > hud.left && x - DISC < hud.right && above - DISC < hud.bottom;
    const down = above - DISC < 8 || underHud;
    const y = down ? bottom + DISC + GAP : above;
    const lean = x < 200 ? 22 : x > window.innerWidth - 200 ? -22 : 0;
    const node = el(
      "div",
      { class: "cheer" },
      el("div", { class: "cheer-disc" }, label),
      ...BURSTS.map(({ angle, reach, rot }, k) => {
        const burst = el("span", { class: "cheer-burst" }, `+${pts}`);
        const a = (((down ? -angle - lean : angle + lean) * Math.PI) / 180);
        burst.style.setProperty("--dx", `${Math.round(Math.cos(a) * reach)}px`);
        burst.style.setProperty("--dy", `${Math.round(Math.sin(a) * reach)}px`);
        burst.style.setProperty("--rot", `${rot}deg`);
        burst.style.setProperty("--k", String(k));
        return burst;
      }),
    );
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    cheers.append(node);
    later(1900, () => node.remove());
  }

  // ---- the aids' panel ----------------------------------------------------

  const panel = $(".aids-panel");
  const table = panel.querySelector(".tracker-table");
  const title = panel.querySelector(".aids-title");
  const body = panel.querySelector(".aids-body");
  const outLine = $(".out");
  let showing = { trackers: true, unseen: false, open: true };
  // Folded to its heading, or open; the heading says what is in it.
  const fold = el("md-icon-button", { class: "aids-fold", toggle: true }, chevron("less"), chevron("more"));
  fold.lastChild.setAttribute("slot", "selected");
  fold.addEventListener("change", () => {
    showing.open = !fold.selected;
    fit();
    onFold(showing.open);
  });
  panel.querySelector(".aids-head").append(fold);
  const fit = () => {
    table.hidden = !showing.trackers;
    body.hidden = !showing.open;
    panel.classList.toggle("folded", !showing.open);
    fold.selected = !showing.open;
    fold.setAttribute("aria-label", showing.open ? "Fold the panel" : "Open the panel");
    fold.title = showing.open ? "Fold the panel" : "Open the panel";
    title.textContent = showing.trackers ? "Captured this hand" : "Still out";
    panel.hidden = !showing.trackers && outLine.hidden;
  };

  // Each player's captures this hand, as a table (scorebug.js): a column
  // for each point, a row for each player, only the value in each cell. A
  // point that is theirs for certain (a clinch, a Casino taken) is filled
  // in; one that is the other player's is dimmed. Every header and cell
  // has its tip.
  function trackers(t, watching = false) {
    const { columns, rows } = trackerTable(t, { watching });
    table.tHead.rows[0].replaceChildren(
      el("td", {}),
      ...columns.map((c) => el("th", { scope: "col", class: c.key, "data-tip": c.tip, tabindex: "0" }, c.head)),
    );
    table.tBodies[0].replaceChildren(
      ...rows.map((r) =>
        el(
          "tr",
          { class: r.who },
          el("th", { scope: "row", "data-tip": r.tip }, r.name),
          ...r.cells.map((c) => el("td", { class: [c.key, c.look].filter(Boolean).join(" "), "data-tip": c.tip }, c.text)),
        ),
      ),
    );
  }
  function showTrackers(on) {
    showing.trackers = on;
    fit();
  }
  function setOpen(open) {
    showing.open = open;
    fit();
  }

  // The tip: what a header or a cell means, shown above it while the
  // pointer rests on it or it has the keyboard's focus; a tap shows it a
  // while (no pointer rests on a phone).
  const tipBox = $(".tip");
  let tipFor = null;
  let tipTimer = null;
  function showTip(target) {
    clearTimeout(tipTimer);
    tipFor = target;
    tipBox.textContent = target.dataset.tip;
    tipBox.hidden = false;
    const r = target.getBoundingClientRect();
    const w = tipBox.offsetWidth;
    const h = tipBox.offsetHeight;
    const x = Math.min(Math.max(r.left + r.width / 2 - w / 2, 8), window.innerWidth - w - 8);
    const above = r.top - h - 8;
    tipBox.style.left = `${x}px`;
    tipBox.style.top = `${above >= 8 ? above : r.bottom + 8}px`;
  }
  function hideTip(target) {
    if (target && target !== tipFor) return;
    tipFor = null;
    tipBox.hidden = true;
  }
  const tipOf = (e) => e.target.closest?.("[data-tip]");
  panel.addEventListener("pointerover", (e) => tipOf(e) && e.pointerType === "mouse" && showTip(tipOf(e)));
  panel.addEventListener("pointerout", (e) => tipOf(e) && e.pointerType === "mouse" && hideTip(tipOf(e)));
  panel.addEventListener("focusin", (e) => tipOf(e) && showTip(tipOf(e)));
  panel.addEventListener("focusout", (e) => tipOf(e) && hideTip(tipOf(e)));
  panel.addEventListener("click", (e) => {
    const target = tipOf(e);
    if (!target) return;
    showTip(target);
    tipTimer = setTimeout(() => hideTip(target), 3500);
  });

  // The cards you have not seen (the counting aid), or nothing.
  function unseen(u) {
    outLine.hidden = !u;
    if (u) {
      const parts = [];
      if (u.aces.length) parts.push(u.aces.map((c) => c.label).join(" "));
      if (u.big_casino) parts.push("10♦");
      if (u.little_casino) parts.push("2♠");
      parts.push(`${u.spades} spade${u.spades === 1 ? "" : "s"}`, `${u.cards} card${u.cards === 1 ? "" : "s"}`);
      outLine.textContent = `Still out: ${parts.join(" · ")}`;
    }
    fit();
  }

  // ---- the game log ------------------------------------------------------

  const logPanel = $(".game-log");
  const logList = logPanel.querySelector("ol");
  // What has happened, newest last, each with its notes (the explain aid);
  // a verdict on a move of yours stands out.
  function log(entries, open) {
    logPanel.hidden = !open;
    if (!open) return;
    logList.replaceChildren(
      ...entries.map((e) =>
        el("li", { class: `entry ${e.kind}${e.who ? ` ${e.who}` : ""}` }, el("span", { class: "said" }, e.text), ...e.notes.map((n) => el("span", { class: "note-line" }, n))),
      ),
    );
    logList.lastElementChild?.scrollIntoView({ block: "end" });
  }

  // ---- what is said at the table ------------------------------------------

  // Each line in a box by the hand of whoever said it, at `anchor(who)` on
  // the screen: one box a speaker, a new line replacing the last; each stays
  // a while unless replaced (after piquet's overlay.js, showBox).
  const LINGER = 3200;
  const boxes = { you: null, them: null };
  const afloat = $(".afloat");
  function takeDown(who, atOnce = false) {
    const node = boxes[who];
    if (!node) return;
    boxes[who] = null;
    if (atOnce) return node.remove();
    node.classList.add("leaving");
    node.addEventListener("animationend", () => node.remove(), { once: true });
    setTimeout(() => node.remove(), 400);
  }
  function say(who, words, anchor) {
    takeDown(who, true);
    if (!anchor || !words) return;
    // Beside the hand, its tail pointing back at it (`anchor.side`): your
    // words on a desktop, where the move bar sits above your hand.
    if (anchor.side) {
      const node = el("div", { class: `dialogue ${who} side`, role: "status" }, words);
      afloat.append(node);
      node.style.left = `${Math.min(anchor.x, window.innerWidth - node.offsetWidth - 8)}px`;
      node.style.top = `${anchor.y}px`;
      boxes[who] = node;
      later(LINGER, () => boxes[who] === node && takeDown(who));
      return;
    }
    const node = el("div", { class: `dialogue ${who}`, role: "status" }, words);
    afloat.append(node);
    // Centred on the hand, kept on the screen, and clear of the HUD (the
    // table review's T11).
    const half = node.offsetWidth / 2 + 8;
    let x = Math.min(Math.max(anchor.x, half), window.innerWidth - half);
    node.style.left = `${x}px`;
    node.style.top = `${anchor.y}px`;
    const hud = root.querySelector(".info")?.getBoundingClientRect();
    const box = node.getBoundingClientRect();
    const overlaps = hud && box.left < hud.right && box.right > hud.left && box.top < hud.bottom && box.bottom > hud.top;
    if (overlaps) {
      x = Math.min(hud.right + 8 + half - 8, window.innerWidth - half);
      node.style.left = `${x}px`;
    }
    boxes[who] = node;
    later(LINGER, () => boxes[who] === node && takeDown(who));
  }
  function hush() {
    takeDown("you", true);
    takeDown("them", true);
  }

  // What the keyboard's focus is on, told to a screen reader.
  const told = $(".focus-told");
  function tell(text) {
    told.textContent = text ?? "";
  }

  return {
    show,
    placeBadges,
    say,
    hush,
    tell,
    celebrate,
    cheers: () => [...cheers.querySelectorAll(".cheer")].map((c) => ({ label: c.querySelector(".cheer-disc").textContent, bursts: c.querySelectorAll(".cheer-burst").length })),
    trackers,
    showTrackers,
    setOpen,
    unseen,
    log,
    hudSlot: $(".hud-slot"),
    said: () => [...afloat.querySelectorAll(".dialogue")].map((d) => ({ who: d.classList.contains("you") ? "you" : "them", words: d.textContent })),
    chips: () => [...chipSet.children].filter((c) => !c.disabled).map((c) => c.textContent),
    // Where the move bar is to sit on a desktop, between the table and your
    // hand (the page measures it as the cards are drawn).
    placeMoveBar(y, h) {
      bar.style.setProperty("--move-bar-y", `${Math.round(y)}px`);
      bar.style.setProperty("--move-h", `${Math.round(h)}px`);
    },
  };
}

// Material Symbols' expand less and more (Apache License 2.0, Google;
// CREDITS.md), for the panel's fold.
const CHEVRONS = {
  less: "m296-345-56-56 240-240 240 240-56 56-184-184-184 184Z",
  more: "M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z",
};
function chevron(which) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  node.setAttribute("viewBox", "0 -960 960 960");
  node.setAttribute("aria-hidden", "true");
  node.setAttribute("class", "icon symbol");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", CHEVRONS[which]);
  node.append(path);
  return node;
}

// An element, its attributes and its children.
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
}

function promptText(state, chips) {
  const last = [...state.events].reverse().find((e) => e.kind === "game_ends" || e.kind === "hand_ends");
  if (state.prompt === "over") return last?.text ?? "The game is over.";
  if (state.prompt === "next_hand") return last?.text ?? "The hand is over.";
  if (!chips.length) return "Choose a card from your hand, then the table cards to go with it.";
  return "Choose what to do.";
}
