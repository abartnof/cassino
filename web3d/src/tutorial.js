// The tutorial: its pages, written in web3d/tutorial.md so they can be
// reworded without touching code, and the moment each one opens by itself
// (docs/TABLE3D.md section 9): the introduction as the game begins; Royal's
// court cards and the ace's 1 or 14 when those rules are on; then the
// teaching ladder, pairing, summing, building, raising, multiple builds
// (DESIGN.md §12.5), each the first time it comes up in the game, as a move
// you could make or one your opponent has just made; and the count at the
// first hand's end. The last page, the table talk, is for the help.
//
// The parser is piquet's tutorial.js @ 254cb3c (its small Markdown); the
// pages and their moments are cassino's.

export const PAGE_KEYS = ["intro", "pairing", "summing", "building", "raising", "multiple", "royal", "aces14", "count", "talk"];
// The order in which pages fall due, when more than one could.
const DUE = ["intro", "royal", "aces14", "pairing", "summing", "building", "raising", "multiple", "count"];

// The small piece of Markdown the pages use: `# page`, `## heading`,
// paragraphs, `- ` and `1. ` lists, **bold** and *italic*. A page is
// { key, title, blocks }; a block is { type: "h" | "p", spans } or
// { type: "ul" | "ol", items: [spans] }; a span is { text, bold?, italic? }.
export function parseTutorial(markdown) {
  const pages = [];
  let page = null;
  let para = null; // the paragraph or list item being gathered, as lines
  let list = null;
  const flush = () => {
    if (para) {
      const spans = inline(para.lines.join(" "));
      if (para.list) para.list.items.push(spans);
      else page.blocks.push({ type: "p", spans });
    }
    para = null;
  };
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    let m;
    if ((m = /^# (.+)$/.exec(line))) {
      flush();
      list = null;
      page = { key: PAGE_KEYS[pages.length] ?? `page-${pages.length}`, title: m[1], blocks: [] };
      pages.push(page);
    } else if (!page) {
      continue;
    } else if ((m = /^## (.+)$/.exec(line))) {
      flush();
      list = null;
      page.blocks.push({ type: "h", spans: inline(m[1]) });
    } else if ((m = /^(-|\d+\.) (.+)$/.exec(line))) {
      flush();
      const type = m[1] === "-" ? "ul" : "ol";
      if (!list || list.type !== type) {
        list = { type, items: [] };
        page.blocks.push(list);
      }
      para = { lines: [m[2]], list };
    } else if (line === "") {
      flush();
      list = null;
    } else if (para) {
      para.lines.push(line);
    } else {
      para = { lines: [line], list: null };
    }
  }
  flush();
  return pages;
}

// **bold** and *italic*, as spans of plain text.
function inline(text) {
  const spans = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let at = 0;
  let m;
  while ((m = pattern.exec(text))) {
    if (m.index > at) spans.push({ text: text.slice(at, m.index) });
    spans.push(m[1] !== undefined ? { text: m[1], bold: true } : { text: m[2], italic: true });
    at = pattern.lastIndex;
  }
  if (at < text.length) spans.push({ text: text.slice(at) });
  return spans;
}

// A card's value for sums and builds: none for a Classic court card.
function value(code, rules) {
  const r = code[0];
  if (r === "A") return 1;
  if (r === "T") return 10;
  if ("JQK".includes(r)) return rules.game === "royal" ? { J: 11, Q: 12, K: 13 }[r] : null;
  return Number(r);
}

// What the moves on offer teach: "pair", "sum", "build", "raise",
// "multiple", "ace14". From each move's command text and the table.
export function moveKinds(state) {
  const kinds = new Set();
  const rules = state.rules ?? {};
  const itemOf = (code) => state.table.find((i) => i.cards.some((c) => c.card === code));
  const loose = (code) => itemOf(code)?.cards.length === 1;
  for (const move of state.moves ?? []) {
    const w = move.split(/\s+/);
    if (w[0] === "take") {
      if (w[1].endsWith("=14")) kinds.add("ace14");
      const played = w[1].split("=")[0];
      const taken = w.slice(2).filter(loose);
      if (taken.some((c) => c[0] === played[0])) kinds.add("pair");
      if (taken.filter((c) => c[0] !== played[0]).length >= 2) kinds.add("sum");
    } else if (w[0] === "build") {
      const v = Number(w[1]);
      const on = w.indexOf("on");
      if (on > 0) {
        const target = itemOf(w[on + 1])?.build;
        if (!target) continue;
        kinds.add(!target.multiple && target.value !== v ? "raise" : "multiple");
      } else {
        const total = w.slice(2).reduce((sum, c) => sum + (value(c, rules) ?? 0), 0);
        kinds.add(total > v ? "multiple" : "build");
      }
    }
  }
  return kinds;
}

// What your opponent's moves among the events from `since` teach.
function shownKinds(events, since) {
  const kinds = new Set();
  events.slice(since).forEach((e) => {
    if (e.kind !== "played" || e.you || e.type !== "build") return;
    if (e.multiple) kinds.add("multiple");
    else kinds.add(e.build_kind === "raise" ? "raise" : "build");
  });
  return kinds;
}

const TRIGGER = { pairing: "pair", summing: "sum", building: "build", raising: "raise", multiple: "multiple", aces14: "ace14" };

// The page due now, if any: the first in order whose moment has come and
// that has not been seen. Never while two computer players are watched.
export function pageDue(state, seen, since = 0) {
  if (state.watching) return null;
  const rules = state.rules ?? {};
  const playing = state.prompt === "play";
  const kinds = playing ? moveKinds(state) : new Set();
  for (const k of shownKinds(state.events ?? [], since)) kinds.add(k);
  for (const key of DUE) {
    if (seen.includes(key)) continue;
    if (key === "intro") return key;
    if (key === "royal" && rules.game === "royal" && playing) return key;
    if (key === "aces14" && rules.aces14 && playing) return key;
    if (key === "count" && state.prompt !== "play" && (state.events ?? []).some((e) => e.kind === "scored")) return key;
    if (TRIGGER[key] && key !== "aces14" && kinds.has(TRIGGER[key])) return key;
  }
  return null;
}
