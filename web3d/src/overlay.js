// The overlay: the 2D surfaces floating over the table, in Material Design 3
// (docs/TABLE3D.md section 8): the prompt, the chips that offer what a
// selection makes, the running sum, the "why not?" line, the next hand and
// the end of the game; the badges over the builds; the score, as a
// broadcast's bug, with each player's trackers under their number; the
// score sheet, where each hand's count is written down line by line; and
// what is said at the table, in boxes by each speaker's hand.
//
// It draws what it is given and reports what is pressed; it holds no rules.

import "@material/web/button/filled-button.js";
import "@material/web/chips/assist-chip.js";
import "@material/web/chips/chip-set.js";

// `later(ms, fn)` runs `fn` after `ms` on the table's clock (director.at),
// so a box lingers as long as the table runs, and holds when it is held.
export function createOverlay(root, { onChip, onNext, onNewGame, later = (ms, fn) => setTimeout(fn, ms) }) {
  root.innerHTML = `
    <div class="badges"></div>
    <div class="afloat"></div>
    <header class="bug" aria-label="The score">
      <div class="side you"><span class="side-name">You</span><span class="side-num"><span class="n">0</span></span><span class="goal-bar"><i></i></span><ul class="tally" aria-label="Your captures"></ul></div>
      <div class="period"></div>
      <div class="side them"><span class="side-name">Your opponent</span><span class="side-num"><span class="n">0</span></span><span class="goal-bar"><i></i></span><ul class="tally" aria-label="Your opponent's captures"></ul></div>
    </header>
    <aside class="sheet" hidden aria-live="polite">
      <h2 class="sheet-title"></h2>
      <ol class="count-lines"></ol>
      <p class="sheet-total"></p>
      <table class="history"><thead><tr><th>Hand</th><th class="you">You</th><th class="them">Opp.</th></tr></thead><tbody></tbody></table>
    </aside>
    <section class="controls">
      <p class="prompt" aria-live="polite"></p>
      <p class="note" aria-live="polite"></p>
      <div class="sum" hidden></div>
      <md-chip-set class="chips"></md-chip-set>
      <md-filled-button class="next" hidden>Next hand</md-filled-button>
      <md-filled-button class="again" hidden>New game</md-filled-button>
    </section>`;
  const $ = (s) => root.querySelector(s);
  const prompt = $(".prompt");
  const note = $(".note");
  const sum = $(".sum");
  const chipSet = $(".chips");
  const next = $(".next");
  const again = $(".again");
  const badges = $(".badges");
  next.addEventListener("click", () => onNext());
  again.addEventListener("click", () => onNewGame());

  // The prompt, the chips and the buttons, for a state and the offer for the
  // person's selection (null if nothing is chosen).
  function show({ state, chips, sum: total, message, busy = false }) {
    prompt.textContent = busy ? "" : promptText(state, chips);
    note.textContent = message ?? "";
    sum.hidden = total == null;
    sum.textContent = total == null ? "" : `Sum ${total}`;
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
    next.hidden = busy || state.prompt !== "next_hand";
    again.hidden = busy || state.prompt !== "over";
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

  // ---- the score ---------------------------------------------------------

  const sides = {};
  for (const who of ["you", "them"]) {
    const node = root.querySelector(`.bug .side.${who}`);
    sides[who] = { node, n: node.querySelector(".n"), fill: node.querySelector(".goal-bar i"), tally: node.querySelector(".tally"), shown: null };
  }
  const periodNode = $(".period");

  // The two numbers, the bars filling toward the target, and the period. A
  // number that goes up bumps as it changes.
  function score({ you, them, target, period: when }) {
    for (const [who, value] of [
      ["you", you],
      ["them", them],
    ]) {
      const side = sides[who];
      if (side.shown !== null && value > side.shown) replay(side.n, "bump");
      side.shown = value;
      side.n.textContent = String(value);
      side.fill.style.width = `${Math.min(100, (100 * value) / target)}%`;
      side.node.querySelector(".goal-bar").title = value >= target ? `${target} reached` : `${target - value} to go to ${target}`;
    }
    periodNode.replaceChildren(el("span", { class: "period-when" }, when), el("span", { class: "period-to" }, `to ${target}`));
  }

  // Each player's captures this hand, under their number: cards toward 27,
  // spades toward 7, aces, the Casinos, sweeps. A point that is theirs for
  // certain (a clinch, a Casino taken) is filled in; a point clinched by
  // the other player is struck through.
  function trackers(t) {
    for (const who of ["you", "them"]) {
      sides[who].tally.replaceChildren(
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

  // ---- the score sheet ---------------------------------------------------

  const sheet = $(".sheet");
  const linesNode = $(".count-lines");
  const sheetTotal = $(".sheet-total");
  const historyBody = sheet.querySelector(".history tbody");

  // A hand's count begins: the sheet opens on a clean page.
  function openCount(title) {
    sheet.hidden = false;
    $(".sheet-title").textContent = title;
    linesNode.replaceChildren();
    sheetTotal.textContent = "";
    replay(sheet, "arrive");
  }
  // One line of the count, as it is said: what, whose, how many points.
  function countLine(line) {
    const whose = line.who === "you" ? "You" : "Opponent";
    linesNode.append(
      el("li", { class: `count-line ${line.who}` }, el("span", { class: "what" }, line.label), el("span", { class: "who" }, whose), el("span", { class: "points" }, `+${line.points}`)),
    );
  }
  // The hand's points and the game's, and every hand so far.
  function closeCount({ text, rows }) {
    sheetTotal.textContent = text;
    historyBody.replaceChildren(
      ...rows.map((r) =>
        el("tr", {}, el("td", {}, String(r.hand)), el("td", { class: "you" }, `${r.you} · ${r.totals.you}`), el("td", { class: "them" }, `${r.them} · ${r.totals.them}`)),
      ),
    );
  }
  function hideSheet() {
    sheet.hidden = true;
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
    // Centred on the hand, kept on the screen.
    const half = node.offsetWidth / 2 + 8;
    node.style.left = `${Math.min(Math.max(anchor.x, half), window.innerWidth - half)}px`;
    node.style.top = `${anchor.y}px`;
    boxes[who] = node;
    later(LINGER, () => boxes[who] === node && takeDown(who));
  }
  function hush() {
    takeDown("you", true);
    takeDown("them", true);
  }

  return {
    show,
    placeBadges,
    say,
    hush,
    said: () => [...afloat.querySelectorAll(".dialogue")].map((d) => ({ who: d.classList.contains("you") ? "you" : "them", words: d.textContent })),
    score,
    trackers,
    openCount,
    countLine,
    closeCount,
    hideSheet,
    chips: () => [...chipSet.children].map((c) => c.label),
    sheet: () => ({ open: !sheet.hidden, lines: [...linesNode.children].map((li) => li.textContent), total: sheetTotal.textContent }),
    scores: () => ({ you: Number(sides.you.n.textContent), them: Number(sides.them.n.textContent) }),
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

// Restart a CSS animation on an element.
function replay(node, cls) {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

function promptText(state, chips) {
  const last = [...state.events].reverse().find((e) => e.kind === "game_ends" || e.kind === "hand_ends");
  if (state.prompt === "over") return last?.text ?? "The game is over.";
  if (state.prompt === "next_hand") return last?.text ?? "The hand is over.";
  if (!chips.length) return "Choose a card from your hand, then the table cards to go with it.";
  return "Choose what to do.";
}
