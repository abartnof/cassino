// The score HUD: two segmented lines to 21, the two scores with a chevron
// between them, a popup that swaps into a player's score as they score (a
// broadcast's graphic), and under the chevron the per-hand ledger.
//
// Built from the designer's handoff (docs/TABLE3D.md section 8, "The score
// HUD"; the spec and its approved reference implementation are in this
// repository's history, commit c484091): the anatomy, the numbers, the three
// springs and the motion are the reference's, ported from its design tool's
// template to plain DOM. The model is a per-hand ledger derived from the
// protocol's events, the one source of truth; totals are derived from it.
// Integration choices (docs/TABLE3D.md): a sweep's point shows as the sweep
// happens and the count does not show it again; the count's aces come
// together, one popup a player; popups queue, one side at a time.

// ---- the model -----------------------------------------------------------------

// The categories, in the counting order (Foster's), with the ledger's words.
export const CATS = Object.freeze([
  ["cards", "Most cards"],
  ["spades", "Most spades"],
  ["big", "Big Casino"],
  ["little", "Little Casino"],
  ["aces", "Aces"],
  ["sweeps", "Sweeps"],
]);
const POPUP = { cards: "Most cards", spades: "Most spades", big: "Big Casino", little: "Little Casino", aces: "Aces", sweeps: "Sweep" };
const CAT_OF = { cards: "cards", spades: "spades", big_casino: "big", little_casino: "little", ace: "aces", sweeps: "sweeps" };
const sideOf = (you) => (you ? "you" : "opp");
export const N = 21;

export const blank = () => Object.fromEntries(CATS.map(([k]) => [k, { you: 0, opp: 0 }]));
export const handTotal = (h, side) => CATS.reduce((sum, [k]) => sum + h[k][side], 0);

// Where a segment (1-based) stands against a score: reached, the cursor
// ("where I am"), or unreached. Past 21 the line stops: the finish is the
// cursor.
export function segmentState(n, score) {
  const s = Math.min(N, score);
  return n < s ? "reached" : n === s ? "cursor" : "unreached";
}

// The ledger from a state's events: every counted hand, and the hand under
// way (its sweeps so far, when sweeps are scored), or null between hands.
export function ledgerOf(state) {
  const hands = [];
  let live = null;
  for (const e of state.events) {
    if (e.kind === "dealt" && e.deal === 1) live = blank();
    if (e.kind === "swept" && live && state.rules?.sweeps !== false) live.sweeps[sideOf(e.you)] += 1;
    if (e.kind === "scored") {
      const h = blank();
      for (const l of e.count.lines) h[CAT_OF[l.item]][sideOf(l.who === "you")] += l.points;
      hands.push(h);
      live = null;
    }
  }
  return { hands, live };
}

export function ledgerTotals({ hands, live }) {
  const all = live ? [...hands, live] : hands;
  return { you: all.reduce((s, h) => s + handTotal(h, "you"), 0), opp: all.reduce((s, h) => s + handTotal(h, "opp"), 0) };
}

// The scoring events among a state's events from index `since`, to play out:
// { side, cat, label, pts, at, line? }, `at` the event's index and `line`,
// in a count, the line to show it with; and { end: true, at, line } once a
// hand's count has been said.
export function hudEvents(state, since = 0) {
  const out = [];
  state.events.forEach((e, at) => {
    if (at < since) return;
    if (e.kind === "swept" && state.rules?.sweeps !== false) {
      out.push({ side: sideOf(e.you), cat: "sweeps", label: POPUP.sweeps, pts: 1, at });
    }
    if (e.kind === "scored") {
      const lines = e.count.lines;
      const aces = { you: 0, opp: 0 };
      for (const l of lines) if (l.item === "ace") aces[sideOf(l.who === "you")] += l.points;
      const told = new Set();
      lines.forEach((l, i) => {
        const side = sideOf(l.who === "you");
        const cat = CAT_OF[l.item];
        if (cat === "sweeps") return; // shown as each sweep was made
        if (cat === "aces") {
          if (told.has(side)) return;
          told.add(side);
          out.push({ side, cat, label: POPUP.aces, pts: aces[side], at, line: i });
          return;
        }
        out.push({ side, cat, label: POPUP[cat], pts: l.points, at, line: i });
      });
      out.push({ end: true, at, line: lines.length });
    }
  });
  return out;
}

// ---- the widget --------------------------------------------------------------

const HAND_H = 170;
const LIST_MAX = 510;
const POPUP_MS = 1700;
const TICK_MS = 70;
const TICK_FROM = 90;
const POP_AT = 1900;
const POPUP_BUSY = 1960; // a side's popup, the return included, before its next

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else node.setAttribute(k, v);
  }
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
}

// Restart a CSS animation.
function replay(node, cls) {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

// `later(ms, fn)` runs on the table's clock (director.at), so the HUD holds
// when the table is held and keeps time with the cards.
export function createHud(root, { later = (ms, fn) => setTimeout(fn, ms) } = {}) {
  const lines = { you: [], opp: [] };
  const line = (side) => {
    const row = el("div", { class: `hud-line ${side}` });
    for (let n = 1; n <= N; n++) {
      const seg = el("div", { class: "seg unreached" });
      if (n > 1) seg.style.marginLeft = (n - 1) % 5 === 0 ? "8px" : "3px";
      if (n === N) seg.style.flexGrow = "1.8";
      lines[side].push(seg);
      row.append(seg);
    }
    return row;
  };
  const block = (side, name) => {
    const nameNode = el("div", { class: "hud-name" }, name);
    const num = el("div", { class: "hud-num" }, "0");
    const score = el("div", { class: "hud-score" }, nameNode, num);
    const popLabel = el("span", { class: "hud-pop-label" });
    const popPts = el("span", { class: "hud-pop-pts" });
    const pop = el("div", { class: "hud-pop", "aria-live": "polite" }, popLabel, popPts);
    return { node: el("div", { class: `hud-block ${side}` }, score, pop), nameNode, num, popLabel, popPts };
  };
  const linesNode = el("div", { class: "hud-lines", role: "img" }, line("you"), line("opp"));
  const blocks = { you: block("you", "You"), opp: block("opp", "Opp") };
  const chevron = el("button", { class: "hud-chev", type: "button", "aria-expanded": "false", "aria-label": "Show hand-by-hand scores" });
  chevron.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>';
  const headYou = el("div", { class: "hud-head-you" }, "You");
  const headOpp = el("div", { class: "hud-head-opp" }, "Opp");
  const list = el("div", { class: "hud-list" });
  const totYou = el("div", { class: "hud-tot-you" }, "0");
  const totOpp = el("div", { class: "hud-tot-opp" }, "0");
  const panel = el(
    "div",
    { class: "hud-panel" },
    el(
      "div",
      { class: "hud-panel-inner" },
      el("div", { class: "hud-rule" }),
      el("div", { class: "hud-head" }, headYou, el("div", { class: "hud-mid" }), headOpp),
      list,
      el("div", { class: "hud-rule" }),
      el("div", { class: "hud-total" }, totYou, el("div", { class: "hud-mid" }, "Total"), totOpp),
    ),
  );
  const hud = el(
    "section",
    { class: "hud", "aria-label": "The score" },
    linesNode,
    el("div", { class: "hud-row" }, blocks.you.node, chevron, blocks.opp.node),
    panel,
  );
  root.append(hud);

  // What the HUD shows: the ledger as played out so far, and the numbers.
  let model = { hands: [], live: null };
  let totals = { you: 0, opp: 0 };
  let shown = { you: 0, opp: 0 };
  let open = false;
  let flash = null; // { cat, side }: the live line that just changed
  let names = { you: "You", opp: "Opp" };
  let epoch = 0; // a reset cancels what was queued before it
  const queue = { you: [], opp: [] };
  const busyUntil = { you: false, opp: false };
  let ends = 0; // hand endings waiting for the popups before them

  function drawSegments(side, from = null) {
    lines[side].forEach((seg, i) => {
      const n = i + 1;
      const st = segmentState(n, totals[side]);
      const lighting = from !== null && n > from && n <= Math.min(N, totals[side]);
      seg.className = `seg ${st}`;
      if (lighting) {
        seg.style.animationDelay = `${(n - from - 1) * TICK_MS}ms`;
        replay(seg, "lighting");
      }
    });
  }

  function drawNumbers() {
    blocks.you.num.textContent = String(shown.you);
    blocks.opp.num.textContent = String(shown.opp);
    linesNode.setAttribute("aria-label", `${names.you} ${totals.you} of ${N} points. ${names.opp} ${totals.opp} of ${N} points.`);
  }

  function drawList() {
    const all = model.live ? [...model.hands, model.live] : model.hands;
    list.replaceChildren(
      ...all.map((h, i) => {
        const isLive = model.live && i === model.hands.length;
        const y = handTotal(h, "you");
        const o = handTotal(h, "opp");
        const hand = el("div", { class: `hud-hand${isLive ? " live" : ""}` });
        hand.style.setProperty("--d", `${70 + i * 50}ms`);
        CATS.forEach(([cat, label], j) => {
          const yv = h[cat].you;
          const ov = h[cat].opp;
          const you = el("div", { class: `hud-v you${yv > 0 ? "" : " none"}` }, yv > 0 ? String(yv) : "–");
          const opp = el("div", { class: `hud-v opp${ov > 0 ? "" : " none"}` }, ov > 0 ? String(ov) : "–");
          const row = el("div", { class: "hud-ln" }, you, el("div", { class: "hud-mid" }, label), opp);
          row.style.setProperty("--d", `${70 + i * 50 + 80 + j * 35}ms`);
          if (isLive && flash?.cat === cat) replay(flash.side === "you" ? you : opp, "flash");
          hand.append(row);
        });
        const sub = el(
          "div",
          { class: "hud-sub" },
          el("span", { class: `hud-sv${y > o ? " lead" : ""}` }, String(y)),
          el("span", { class: "hud-mid" }, isLive ? `Hand ${i + 1} · live` : `Hand ${i + 1} subtotal`),
          el("span", { class: `hud-sv${o > y ? " lead" : ""}` }, String(o)),
        );
        hand.append(sub, el("div", { class: "hud-gap" }));
        return hand;
      }),
    );
    const listH = Math.min(all.length * HAND_H, LIST_MAX);
    list.style.height = `${listH}px`;
    panel.style.height = open ? `${90 + listH}px` : "0px";
    totYou.textContent = String(totals.you);
    totOpp.textContent = String(totals.opp);
    totYou.classList.toggle("lead", totals.you > totals.opp);
    totOpp.classList.toggle("lead", totals.opp > totals.you);
  }

  chevron.addEventListener("click", () => {
    open = !open;
    hud.classList.toggle("open", open);
    chevron.setAttribute("aria-expanded", String(open));
    chevron.setAttribute("aria-label", open ? "Hide hand-by-hand scores" : "Show hand-by-hand scores");
    drawList();
  });

  // One scoring event, played out: the bars ripple at once, the popup rolls
  // in over the score while the number ticks up beneath it, and the score
  // rolls back, popping.
  function play(e) {
    const mine = epoch;
    const side = e.side;
    const from = totals[side];
    model.live ??= blank();
    model.live[e.cat][side] += e.pts;
    totals = { ...totals, [side]: totals[side] + e.pts };
    flash = { cat: e.cat, side };
    drawSegments(side, from);
    drawList();
    const b = blocks[side];
    b.popLabel.textContent = e.label;
    b.popPts.textContent = `+${e.pts}`;
    b.node.classList.add("popped");
    for (let k = 1; k <= e.pts; k++) {
      later((k - 1) * TICK_MS + TICK_FROM, () => {
        if (mine !== epoch) return;
        shown = { ...shown, [side]: from + k };
        drawNumbers();
      });
    }
    later(POPUP_MS, () => mine === epoch && b.node.classList.remove("popped"));
    later(POP_AT, () => mine === epoch && replay(b.num, "pop"));
    busyUntil[side] = true;
    later(POPUP_BUSY, () => {
      if (mine !== epoch) return;
      busyUntil[side] = false;
      const next = queue[side].shift();
      if (next) play(next);
      else settleEnds();
    });
  }

  // A hand's end waits until every popup before it has played.
  function settleEnds() {
    if (!ends || busyUntil.you || busyUntil.opp || queue.you.length || queue.opp.length) return;
    while (ends > 0) {
      ends--;
      if (model.live) model.hands.push(model.live);
      model.live = null;
    }
    flash = null;
    drawList();
  }

  return {
    // Shown at once, nothing played out: a new game, a sitting restored, an
    // undo.
    reset(ledger, who = { you: "You", opp: "Opp" }) {
      epoch++;
      queue.you.length = 0;
      queue.opp.length = 0;
      busyUntil.you = busyUntil.opp = false;
      ends = 0;
      names = who;
      blocks.you.nameNode.textContent = who.you;
      blocks.opp.nameNode.textContent = who.opp;
      headYou.textContent = who.you;
      headOpp.textContent = who.opp;
      model = JSON.parse(JSON.stringify(ledger));
      totals = ledgerTotals(ledger);
      shown = { ...totals };
      flash = null;
      blocks.you.node.classList.remove("popped");
      blocks.opp.node.classList.remove("popped");
      drawSegments("you");
      drawSegments("opp");
      drawNumbers();
      drawList();
    },
    // A scoring event, played out when its side is free.
    score(e) {
      if (busyUntil[e.side]) queue[e.side].push(e);
      else play(e);
    },
    // A hand ends: the live hand joins the counted ones, once its popups
    // have played.
    endHand() {
      ends++;
      settleEnds();
    },
    // A new hand dealt: its live block appears (empty until it scores).
    dealt() {
      if (ends) return;
      if (!model.live) {
        model.live = blank();
        drawList();
      }
    },
    idle: () => !busyUntil.you && !busyUntil.opp && !queue.you.length && !queue.opp.length && !ends,
    shown: () => ({ ...shown }),
    totals: () => ({ ...totals }),
    hands: () => model.hands.length,
    node: hud,
  };
}
