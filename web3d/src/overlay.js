// The overlay: the 2D surfaces floating over the table, in Material Design 3
// (docs/TABLE3D.md section 8): the prompt, the move bar that offers what a
// selection makes, the "why not?" line, the next hand and the end of the
// game; the badges over the builds; at the top left, a slot
// for the score HUD (hud.js); at the foot of the left, the aids' panel (each
// player's captures, the cards still out); under the top bar, the game log;
// and what is said at the table, in boxes by each speaker's hand. Each sits
// clear of the table's corners: the HUD ends above your opponent's pile.
//
// It draws what it is given and reports what is pressed; it holds no rules.

import "@material/web/button/filled-button.js";
import "@material/web/button/filled-button.js";
import "@material/web/iconbutton/icon-button.js";
import { besideAt, choosePlace } from "./dialogue.js";
import { trackerTable } from "./scorebug.js";
import { BAR, barAcross, barHoles, clipPathFor, fitLabels, mergeHoles, moveBar, pointIn } from "./selection.js";

// `later(ms, fn)` runs `fn` after `ms` on the table's clock (director.at),
// so a box lingers as long as the table runs, and holds when it is held.
export function createOverlay(root, { onChip, onNext, onNewGame, onCardTap = () => {}, onBadge = () => {}, onFold = () => {}, later = (ms, fn) => setTimeout(fn, ms) }) {
  root.innerHTML = `
    <div class="badges"></div>
    <div class="cheers" aria-hidden="true"></div>
    <div class="afloat"></div>
    <div class="info"><div class="hud-slot"></div></div>
    <p class="focus-told" aria-live="polite"></p>
    <section class="aids-panel" hidden aria-label="Captures and the cards still out">
      <h2 class="aids-heading"><button type="button" class="aids-head" aria-controls="aids-body"><span class="aids-title">Captured this hand</span></button></h2>
      <div class="aids-body" id="aids-body">
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
      <div class="move-bar" hidden><div class="chips" role="group" aria-label="Your move"></div></div>
      <md-filled-button class="next" hidden>Next hand</md-filled-button>
      <md-filled-button class="again" hidden>New game</md-filled-button>
    </section>`;
  const $ = (s) => root.querySelector(s);
  const prompt = $(".prompt");
  const note = $(".note");
  const chipSet = $(".chips");
  const next = $(".next");
  const again = $(".again");
  const badges = $(".badges");
  const aidLine = $(".aid-line");
  next.addEventListener("click", () => onNext());
  again.addEventListener("click", () => onNewGame());

  // The prompt, the chips and the buttons, for a state and the offer for the
  // person's selection (null if nothing is chosen).
  // `aid`: a line the aids add under the prompt (a hint, the sweep warning).
  // `after`: a line for the end of the game (the series, if one is played).
  const bar = $(".move-bar");
  // The places' widths, in the bar's heights (selection.js BAR), for the
  // style sheet.
  bar.style.setProperty("--move-place", String(BAR.place));
  // The move bar under the cards: each card crossing it cut out of it, by a
  // clip path drawn at once (a mask image flickered), cards that overlap
  // cut out as one (selection.js barHoles, mergeHoles, clipPathFor); and a
  // tap there the card's, not a button's.
  let holes = [];
  bar.addEventListener(
    "click",
    (e) => {
      if (!holes.some((poly) => pointIn(poly, e.clientX, e.clientY))) return;
      e.stopPropagation();
      e.preventDefault();
      onCardTap(e.clientX, e.clientY);
    },
    true,
  );
  function maskMoveBar(polys) {
    const box = bar.hidden ? null : bar.getBoundingClientRect();
    holes = box ? mergeHoles(barHoles(box, polys)) : [];
    const value = box ? clipPathFor(box, holes) : "";
    if (bar.dataset.clip === value) return;
    bar.dataset.clip = value;
    bar.style.clipPath = value;
  }
  bar.style.setProperty("--move-pad", String(BAR.pad));
  bar.style.setProperty("--move-split", String(BAR.split));
  // `leftHanded`: the move bar the other way round (selection.js moveBar).
  // `explain`: the explanations on, and with them the helper text under the
  // cards, what to do and why a card cannot join (the user: "fold all on
  // screen helper text that's just sort of loose into the explanations
  // mode"); the game's result is said whatever.
  function show({ state, chips, message, busy = false, aid = null, after = null, leftHanded = false, explain = false }) {
    prompt.textContent = busy || (!explain && state.prompt !== "over") ? "" : promptText(state, chips);
    if (!busy && after && state.prompt === "over") prompt.textContent += ` ${after}`;
    aidLine.hidden = busy || !aid;
    aidLine.textContent = aid ?? "";
    note.textContent = explain ? (message ?? "") : "";
    // The move bar, always there on your turn (play-testing): Take, Build
    // and Trail each in its place, lit when the choice makes one and dimmed
    // when not (selection.js moveBar). The chips are made again only when
    // what they offer changes, so one that has the keyboard's focus keeps it
    // (the table review's T15).
    const hidden = bar.hidden;
    bar.hidden = state.watching || state.prompt !== "play";
    if (hidden && !bar.hidden) requestAnimationFrame(fitBar);
    const places = moveBar(chips, { leftHanded });
    const moves = places.flatMap((p) => p.buttons.map((c) => `${c.kind}|${c.label}|${c.move ?? ""}`)).join("\n");
    if (chipSet.dataset.moves !== moves) {
      chipSet.dataset.moves = moves;
      // Filled buttons, large and opaque (play-testing: they are there for
      // the play, no need to hide them), dimmed but still solid when not.
      chipSet.replaceChildren(
        ...places.map((p) =>
          el(
            "div",
            { class: "place", "data-kind": p.kind, "data-n": String(p.buttons.length) },
            ...p.buttons.map((c) => {
              const button = document.createElement("md-filled-button");
              button.textContent = c.label;
              button.dataset.kind = c.kind;
              button.dataset.label = c.label;
              button.dataset.short = c.short;
              if (!c.enabled) {
                button.disabled = true;
                return button;
              }
              button.dataset.move = c.move;
              button.setAttribute("aria-label", c.label);
              if (c.call) button.title = c.call;
              button.addEventListener("click", () => onChip(c));
              return button;
            }),
          ),
        ),
      );
      fitBar();
    }
    next.hidden = busy || state.prompt !== "next_hand";
    again.hidden = busy || state.prompt !== "over";
  }

  // Each place's words fitted to its width, as laid out, at the bar's height
  // (selection.js fitLabels): measured in the page's own font.
  const ruler = document.createElement("canvas").getContext("2d");
  const font = () => getComputedStyle(document.documentElement).getPropertyValue("--font") || "system-ui, sans-serif";
  function fitBar() {
    if (bar.hidden || !ruler) return;
    const h = parseFloat(getComputedStyle(bar).getPropertyValue("--move-h")) || 44;
    const family = font();
    const measure = (text, px) => {
      ruler.font = `600 ${px}px ${family}`;
      return ruler.measureText(text).width;
    };
    for (const place of chipSet.querySelectorAll(".place")) {
      const buttons = [...place.children];
      const gap = parseFloat(getComputedStyle(place).columnGap) || 0;
      const fitted = fitLabels(
        buttons.map((b) => ({ label: b.dataset.label, short: b.dataset.short })),
        { width: place.clientWidth, h, gap, measure },
      );
      buttons.forEach((b, i) => {
        if (b.textContent !== fitted[i].text) b.textContent = fitted[i].text;
        b.style.setProperty("--md-filled-button-label-text-size", `${fitted[i].px.toFixed(1)}px`);
        b.style.setProperty("--md-filled-button-label-text-line-height", `${(fitted[i].px * 1.32).toFixed(1)}px`);
      });
    }
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
  let showing = { trackers: true, unseen: false, open: false };
  // On a phone held upright the panel has no heading of its own: it is
  // folded into the score, open while the score's hand-by-hand scores are
  // (the sixth play-testing: the table given the room its heading took).
  let scoreOpen = false;
  const upright = () => document.documentElement.classList.contains("upright");
  // Folded to its heading, or open; the heading says what is in it. The
  // whole heading is the button, the chevron at its end saying which way
  // it goes (play-testing: the chevron alone, a small target, "isn't
  // working").
  const head = panel.querySelector(".aids-head");
  const fold = el("span", { class: "aids-fold", "aria-hidden": "true" }, chevron("less"), chevron("more"));
  head.append(fold);
  head.addEventListener("click", () => {
    showing.open = !showing.open;
    fit();
    onFold(showing.open);
  });
  const fit = () => {
    const open = upright() ? scoreOpen : showing.open;
    table.hidden = !showing.trackers;
    body.hidden = !open;
    panel.classList.toggle("folded", !open);
    head.setAttribute("aria-expanded", String(open));
    head.title = open ? "Fold the panel" : "Open the panel";
    title.textContent = showing.trackers ? "Captured this hand" : "Still out";
    panel.hidden = (!showing.trackers && outLine.hidden) || (upright() && !scoreOpen);
  };

  // Each player's captures this hand, as a table (scorebug.js): a column
  // for each point, a row for each player, only the value in each cell, a
  // dash for nothing. A point that is theirs for certain (a clinch, a
  // Cassino taken) is filled in. Every header and cell has its tip.
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
  // The score's hand-by-hand scores opened or folded; and the panel fitted
  // again when the phone turns.
  function setScoreOpen(open) {
    scoreOpen = open;
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
    // On a phone, the first of the speaker's places that covers none of
    // what must stay in view (`anchor.avoid`: the cards, the move bar),
    // else the one that covers least, and never one beside the speaker too
    // narrow for its words (dialogue.js choosePlace).
    if (anchor.places) {
      const node = el("div", { class: `dialogue ${who}`, role: "status" }, words);
      afloat.append(node);
      const view = { width: window.innerWidth, height: window.innerHeight };
      const keep = [...anchor.avoid, ...[".info", ".bar", ".aids-panel"].map((q) => root.ownerDocument.querySelector(q)).filter((e) => e && !e.hidden).map((e) => e.getBoundingClientRect())];
      placeBox(node, { kind: "above", x: view.width / 2, y: view.height / 2 }, view);
      const natural = node.offsetWidth;
      const measure = (place) => {
        placeBox(node, place, view);
        return { w: node.offsetWidth, h: node.offsetHeight, natural, spills: spills(node) };
      };
      placeBox(node, choosePlace(anchor.places, measure, keep, view), view);
      boxes[who] = node;
      later(LINGER, () => boxes[who] === node && takeDown(who));
      return;
    }
    // Beside its speaker, its tail pointing back at them (`anchor.side`):
    // your words on a desktop, where the move bar sits above your hand, and
    // your opponent's at the game's end, beside the court card (dialogue.js).
    if (anchor.side) {
      const node = el("div", { class: `dialogue ${who} side`, role: "status" }, words);
      afloat.append(node);
      const place = besideAt(anchor, node.offsetWidth, window.innerWidth);
      // Its room is the whole box's, padding and all: wrapped to it, the
      // box ends at the screen's margin, not past it.
      const style = getComputedStyle(node);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      if (place.room !== null) node.style.maxWidth = `min(${place.room - padding}px, 78vw, 340px)`;
      if (place.side === "left") {
        node.classList.add("left");
        node.style.right = `${window.innerWidth - place.at}px`;
      } else node.style.left = `${place.at}px`;
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
  // Whether a box's words run past its edge: a word wider than the room
  // its padding leaves. Measured on the words themselves, not the box's
  // scrolling width, which counts a tail pointing right as a spill.
  function spills(node) {
    const box = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const words = root.ownerDocument.createRange();
    words.selectNodeContents(node);
    const at = words.getBoundingClientRect();
    return at.left < box.left + parseFloat(style.paddingLeft) - 1 || at.right > box.right - parseFloat(style.paddingRight) + 1;
  }
  // A box at one of its places: beside its point (`right`, `left`, as wide
  // as the room to `limit` allows), or above or below it, centred and kept
  // on the screen (style.css).
  function placeBox(node, place, view) {
    node.classList.remove("side", "left", "above", "below");
    node.style.left = node.style.right = node.style.maxWidth = "";
    node.style.boxSizing = "border-box"; // its room is the whole box's, padding and all
    node.style.top = `${place.y}px`;
    if (place.kind === "right" || place.kind === "left") {
      node.classList.add("side");
      const room = place.kind === "right" ? (place.limit ?? view.width - 8) - place.x : place.x - (place.limit ?? 8);
      node.style.maxWidth = `${Math.max(0, Math.min(room, 340))}px`;
      if (place.kind === "left") {
        node.classList.add("left");
        node.style.right = `${view.width - place.x}px`;
      } else node.style.left = `${place.x}px`;
      return;
    }
    node.classList.add(place.kind);
    const half = node.offsetWidth / 2 + 8;
    node.style.left = `${Math.min(Math.max(place.x, half), view.width - half)}px`;
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
    setScoreOpen,
    refold: () => fit(),
    unseen,
    log,
    hudSlot: $(".hud-slot"),
    said: () => [...afloat.querySelectorAll(".dialogue")].map((d) => ({ who: d.classList.contains("you") ? "you" : "them", words: d.textContent })),
    chips: () => [...chipSet.querySelectorAll("md-filled-button")].filter((c) => !c.disabled).map((c) => c.dataset.label),
    // Where the move bar is to sit on a desktop or a phone held upright,
    // between the table and your hand (the page measures it as the cards
    // are drawn).
    placeMoveBar(y, h) {
      const was = bar.style.getPropertyValue("--move-h");
      bar.style.setProperty("--move-bar-y", `${Math.round(y)}px`);
      bar.style.setProperty("--move-h", `${Math.round(h)}px`);
      if (was !== bar.style.getPropertyValue("--move-h")) fitBar();
    },
    // How the bar's width goes with its height (selection.js moveBarFit
    // `across`): its places' widths are fixed in heights of it, so only the
    // gaps between them, as laid out, are measured.
    barAcross() {
      return barAcross(window.innerWidth - 16, parseFloat(getComputedStyle(chipSet).columnGap) || 0);
    },
    fitBar,
    maskMoveBar,
    // What a box on a phone must not cover besides the cards: the move
    // bar's places, while it is up.
    cardsAvoided: () => (bar.hidden ? [] : [...chipSet.children].map((c) => c.getBoundingClientRect())),
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
  node.setAttribute("class", `icon symbol ${which}`);
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
  // At a hand's end, nothing: the score says the game's score (the user:
  // the line "after a hand that says game you n, opponent N is redundant
  // information given the scoring hud").
  if (state.prompt === "next_hand") return "";
  if (!chips.length) return "Choose a card from your hand, then the table cards.";
  return "Choose what to do.";
}
