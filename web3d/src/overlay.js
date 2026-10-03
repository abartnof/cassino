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
import "@material/web/chips/assist-chip.js";
import "@material/web/chips/chip-set.js";

// `later(ms, fn)` runs `fn` after `ms` on the table's clock (director.at),
// so a box lingers as long as the table runs, and holds when it is held.
export function createOverlay(root, { onChip, onNext, onNewGame, onReplay = () => {}, later = (ms, fn) => setTimeout(fn, ms) }) {
  root.innerHTML = `
    <div class="badges"></div>
    <div class="afloat"></div>
    <div class="info"><div class="hud-slot"></div></div>
    <p class="focus-told" aria-live="polite"></p>
    <section class="aids-panel" hidden aria-label="Captures and the cards still out">
      <div class="tally-row you"><span class="who">You</span><ul class="tally" aria-label="Your captures"></ul></div>
      <div class="tally-row them"><span class="who">Opp</span><ul class="tally" aria-label="Your opponent's captures"></ul></div>
      <p class="out" hidden></p>
    </section>
    <aside class="game-log" hidden aria-label="The game log"><h2>Game log</h2><ol></ol></aside>
    <section class="controls">
      <p class="prompt" aria-live="polite"></p>
      <p class="note" aria-live="polite"></p>
      <p class="aid-line" hidden></p>
      <div class="sum" hidden></div>
      <md-chip-set class="chips"></md-chip-set>
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
    // The chips are made again only when the moves change, so one that has
    // the keyboard's focus keeps it (the table review's T15).
    const moves = chips.map((c) => `${c.move}|${c.label}`).join("\n");
    if (chipSet.dataset.moves !== moves) {
      chipSet.dataset.moves = moves;
      chipSet.replaceChildren(
        ...chips.map((c) => {
          const chip = document.createElement("md-assist-chip");
          chip.label = c.label;
          chip.dataset.move = c.move;
          if (c.call) chip.title = c.call;
          chip.addEventListener("click", () => onChip(c));
          return chip;
        }),
      );
    }
    next.hidden = busy || replay || state.prompt !== "next_hand";
    again.hidden = busy || replay || state.prompt !== "over";
    replayButton.hidden = busy || replay || state.prompt !== "over" || state.watching;
  }

  // A badge over each build: its value ("8", "8s" for a multiple build),
  // in its controller's colour, at a point on the screen.
  function placeBadges(list) {
    badges.replaceChildren(
      ...list.map(({ value, multiple, controller, x, y }) => {
        const badge = document.createElement("div");
        badge.className = `badge ${controller}`;
        badge.textContent = multiple ? `${value}s` : `${value}`;
        badge.style.left = `${x}px`;
        badge.style.top = `${y}px`;
        return badge;
      }),
    );
  }

  // ---- the aids' panel ----------------------------------------------------

  const panel = $(".aids-panel");
  const rows = { you: panel.querySelector(".tally-row.you"), them: panel.querySelector(".tally-row.them") };
  const outLine = $(".out");
  let showing = { trackers: true, unseen: false };
  const fit = () => {
    rows.you.hidden = rows.them.hidden = !showing.trackers;
    panel.hidden = !showing.trackers && outLine.hidden;
  };

  // Each player's captures this hand: cards toward 27, spades toward 7,
  // aces, the Casinos, sweeps. A point that is theirs for certain (a clinch,
  // a Casino taken) is filled in; a point clinched by the other player is
  // struck through.
  function trackers(t) {
    for (const who of ["you", "them"]) {
      rows[who].querySelector(".tally").replaceChildren(
        ...t[who].map((x) => {
          const has = x.have !== undefined;
          const toward = x.of && x.n < x.of && !x.done && !x.lost;
          const text = has ? x.label : toward ? `${x.label} ${x.n}/${x.of}` : `${x.label} ${x.n}`;
          const won = x.done || (has && x.have);
          const cls = ["tracker", x.key, won ? "won" : "", x.lost ? "lost" : "", has && !x.have ? "none" : "", !has && !x.n ? "none" : ""];
          return el("li", { class: cls.filter(Boolean).join(" "), title: trackerTitle(x) }, text);
        }),
      );
    }
  }
  function showTrackers(on) {
    showing.trackers = on;
    fit();
  }

  // Who sits where: "You" and "Opp", or South and North when two computer
  // players are watched.
  function names({ you, them }) {
    rows.you.querySelector(".who").textContent = you;
    rows.them.querySelector(".who").textContent = them;
  }

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
    trackers,
    showTrackers,
    names,
    unseen,
    log,
    hudSlot: $(".hud-slot"),
    said: () => [...afloat.querySelectorAll(".dialogue")].map((d) => ({ who: d.classList.contains("you") ? "you" : "them", words: d.textContent })),
    chips: () => [...chipSet.children].map((c) => c.label),
  };
}

function trackerTitle(x) {
  if (x.have !== undefined) return x.key === "big_casino" ? "Big Casino: 2 points" : "Little Casino: 1 point";
  if (x.done) return `${x.label}: the point is clinched`;
  if (x.lost) return `${x.label}: the point is the other player's`;
  if (x.key === "cards") return "Cards: 27 or more wins 3 points";
  if (x.key === "spades") return "Spades: 7 or more wins 1 point";
  if (x.key === "aces") return "Aces: 1 point each";
  return "Sweeps: 1 point each";
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
