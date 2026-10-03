// The page's chrome: the top bar, the settings and the credits, in Material
// Design 3 (docs/TABLE3D.md section 8). It draws the person's settings and
// reports what they change; the page decides what that does.
//
// After piquet's overlay.js @ 254cb3c (the bar, its icons, the settings
// dialog's rows and selects, the credits); the settings are cassino's.

import "@material/web/button/filled-tonal-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/text-button.js";
import "@material/web/dialog/dialog.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";
import "@material/web/switch/switch.js";
import "@material/web/labs/segmentedbutton/outlined-segmented-button.js";
import "@material/web/labs/segmentedbuttonset/outlined-segmented-button-set.js";
import { DEFAULTS, SKILLS, SPEEDS } from "./prefs.js";
import { PATTERNS } from "./surfaces.js";

// Simple stroked icons, piquet's, drawn for its page.
const ICONS = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  narration: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  hint: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  // Cassino's own: a turning arrow, the last move played again.
  again: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4.5v4h4"/>',
};
// Material Symbols (Outlined, weight 400, 24 px), Apache License 2.0, Google:
// the plus for a new game, the question mark for help, and back, forward
// and close on the tutorial's pages. The paths are bundled, so nothing is
// fetched (CREDITS.md).
const SYMBOLS = {
  back: "m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z",
  forward: "M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z",
  close: "m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z",
  add: "M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z",
  help: "M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z",
};

function svg(viewBox, cls) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  node.setAttribute("viewBox", viewBox);
  node.setAttribute("aria-hidden", "true");
  node.setAttribute("class", cls);
  return node;
}
function icon(name) {
  const node = svg("0 0 24 24", "icon");
  node.innerHTML = ICONS[name];
  return node;
}
function symbol(name) {
  const node = svg("0 -960 960 960", "icon symbol");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", SYMBOLS[name]);
  node.append(path);
  return node;
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, "");
    else if (value !== false && value !== null && value !== undefined) node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
}

// The aids, each a switch: the engine's (sent to it) and the page's own.
const AIDS = [
  ["hints", "Hints", "Suggest the strongest move, and light up its cards"],
  ["explain", "Explanations", "Say what each move does in the game log, and when a better one was there"],
  ["play_forced", "Play forced moves", "Make my move for me when it is the only one"],
];
const PAGE_AIDS = [
  ["tutorial", "Tutorial", "Its pages open by themselves the first time each idea comes up. The question mark has them at any time"],
  ["trackers", "Trackers", "Each player's captures under their score: cards, spades, aces, the Casinos, sweeps"],
  ["unseen", "Cards still out", "Which aces and Casinos, and how many spades, you have not seen"],
  ["sweepWarning", "Sweep warning", "Say when a single card would clear the table"],
  ["undo", "Undo", "Allow taking back a move"],
];

// `on`: { newGame(), daily(), watch(), rules(rules), skill(value),
// aid(name, on), pref(name, value), copy(button), undo(), hint(), again(),
// log(open), help() }.
export function createChrome(root, on) {
  // ---- the top bar ---------------------------------------------------------
  const fresh = el("md-icon-button", { class: "new-game", title: "A new game", "aria-label": "A new game", onclick: () => on.newGame() }, symbol("add"));
  const hint = el("md-icon-button", { class: "hint", title: "A hint", "aria-label": "A hint", onclick: () => on.hint() }, icon("hint"));
  const undo = el("md-icon-button", { class: "undo", title: "Take back your move", "aria-label": "Undo", onclick: () => on.undo() }, icon("undo"));
  const again = el("md-icon-button", { class: "again-last", title: "See the last move again", "aria-label": "See the last move again", onclick: () => on.again() }, icon("again"));
  const log = el("md-icon-button", { class: "log-toggle", title: "The game log", "aria-label": "The game log", toggle: true }, icon("narration"));
  // `change` comes after the button has toggled (a click comes before: the
  // table review's T3).
  log.addEventListener("change", () => on.log(log.selected));
  const help = el("md-icon-button", { class: "help", title: "How to play", "aria-label": "How to play", onclick: () => on.help() }, symbol("help"));
  const gear = el("md-icon-button", { class: "settings-open", title: "Settings", "aria-label": "Settings", onclick: () => settings.show() }, icon("settings"));
  const bar = el("header", { class: "surface bar" }, el("span", { class: "brand" }, "Cassino"), fresh, hint, undo, again, log, help, gear);

  // ---- settings ------------------------------------------------------------
  const row = (title, words, control) =>
    el("label", { class: "setting" }, el("span", { class: "setting-text" }, el("span", { class: "setting-title" }, title), el("span", { class: "setting-words" }, words)), control);
  const sw = (attrs, onChange) => {
    const s = el("md-switch", attrs);
    s.addEventListener("change", () => onChange(s.selected));
    return s;
  };

  // The next game's rules.
  let rules = { ...DEFAULTS.rules };
  const segment = (value, label) => el("md-outlined-segmented-button", { "data-game": value, label });
  const gameSet = el("md-outlined-segmented-button-set", { class: "game-set", "aria-label": "The game" }, segment("classic", "Classic"), segment("royal", "Royal"));
  gameSet.addEventListener("segmented-button-set-selection", (e) => {
    const game = e.detail.button.dataset.game;
    rules = { ...rules, game, aces14: game === "royal" && rules.aces14 };
    on.rules(rules);
    draw();
  });
  const aces = sw({ "data-rule": "aces14" }, (v) => {
    rules = { ...rules, aces14: v };
    on.rules(rules);
  });
  const sweeps = sw({ "data-rule": "sweeps" }, (v) => {
    rules = { ...rules, sweeps: v };
    on.rules(rules);
  });
  const skill = el(
    "md-outlined-select",
    { class: "skill", label: "Your opponent" },
    SKILLS.map((s) => el("md-select-option", { value: String(s.value) }, el("div", { slot: "headline" }, `${s.value} — ${s.words}`))),
  );
  skill.addEventListener("change", () => on.skill(Number(skill.value)));
  const match = el(
    "md-outlined-select",
    { class: "match", "data-pref": "match", label: "The match" },
    [
      ["single", "One game to 21"],
      ["best-of-7", "A World Series: the best of seven games"],
    ].map(([v, words]) => el("md-select-option", { value: v }, el("div", { slot: "headline" }, words))),
  );
  match.addEventListener("change", () => on.pref("match", match.value));
  const startNew = el("md-filled-tonal-button", { class: "start-new", onclick: () => (settings.close(), on.newGame()) }, "New game");
  const daily = el("md-outlined-button", { class: "daily", onclick: () => (settings.close(), on.daily()) }, "Today's deal");
  const watch = el("md-outlined-button", { class: "watch", onclick: () => (settings.close(), on.watch()) }, "Watch a game");

  const aidSwitches = AIDS.map(([name, title, words]) => row(title, words, sw({ "data-aid": name }, (v) => on.aid(name, v))));
  const pageSwitches = PAGE_AIDS.map(([name, title, words]) => row(title, words, sw({ "data-pref": name }, (v) => on.pref(name, v))));
  const select = (name, label, options) => {
    const s = el(
      "md-outlined-select",
      { "data-pref": name, label },
      options.map(([value, words]) => el("md-select-option", { value: String(value) }, el("div", { slot: "headline" }, words))),
    );
    s.addEventListener("change", () => on.pref(name, name === "speed" ? Number(s.value) : s.value));
    return s;
  };
  const speed = select("speed", "Animation", SPEEDS.map((s) => [s.value, s.words]));
  const surface = select("surface", "The table", [["random", "A new one each time the page opens"], ...PATTERNS.map((p) => [p.id, p.name])]);
  const faces = select("faces", "Card faces", [
    ["auto", "Automatic: Large Text on a phone"],
    ["classic", "Classic"],
    ["jumbo", "Large Text (Optimized for smaller screens)"],
  ]);
  // Fairness you can check (DESIGN.md §12.3): the seed deals the cards.
  const seedLine = el("p", { class: "seed-line" });
  const copy = el("md-text-button", { class: "copy", onclick: () => on.copy(copy) }, "Copy game record");
  const creditsOpen = el("md-text-button", { onclick: () => (settings.close(), credits.show()) }, "Credits");
  const settings = el(
    "md-dialog",
    { class: "settings-dialog" },
    el("div", { slot: "headline" }, "Settings"),
    el(
      "div",
      { slot: "content", class: "settings" },
      seedLine,
      el("h3", {}, "The next game"),
      gameSet,
      row("Aces count 1 or 14", "Royal: an ace in your hand takes as one or as fourteen", aces),
      row("Score sweeps", "A point for each capture that clears the table", sweeps),
      el("div", { class: "selects" }, skill, match),
      el("div", { class: "starts" }, startNew, daily, watch),
      el("h3", {}, "Help at the table"),
      aidSwitches,
      pageSwitches,
      el("h3", {}, "The table"),
      el("div", { class: "selects" }, speed, surface, faces),
    ),
    el("div", { slot: "actions" }, copy, creditsOpen, el("md-filled-tonal-button", { onclick: () => settings.close() }, "Done")),
  );

  // ---- credits ----------------------------------------------------------------
  const credits = el(
    "md-dialog",
    { class: "credits-dialog" },
    el("div", { slot: "headline" }, "Credits"),
    el("div", { slot: "content", class: "credits" }, creditItems()),
    el("div", { slot: "actions" }, el("md-filled-tonal-button", { onclick: () => credits.close() }, "Close")),
  );

  // ---- the tutorial's pages ----------------------------------------------------
  const tutorial = el("md-dialog", { class: "tutorial-dialog" });

  // The pages, from page `at`; `seen(key)` as each is shown, `done()` when
  // the dialog closes. `popups`: the tutorial is on, and the introduction
  // says the pages come by themselves.
  function showTutorial(pages, at, { seen, done, popups = false } = {}) {
    let i = at;
    const spans = (list) => list.map((x) => (x.bold ? el("strong", {}, x.text) : x.italic ? el("em", {}, x.text) : x.text));
    const block = (b) =>
      b.type === "h" ? el("h3", {}, spans(b.spans)) : b.type === "p" ? el("p", {}, spans(b.spans)) : el(b.type, {}, b.items.map((it) => el("li", {}, spans(it))));
    const title = el("span", { class: "tutorial-title" });
    const dots = el("span", { class: "tutorial-dots", "aria-hidden": "true" }, pages.map(() => el("span", { class: "dot" })));
    const content = el("div", { slot: "content", class: "tutorial-page" });
    const close = el("md-icon-button", { class: "tutorial-close", title: "Close", "aria-label": "Close", onclick: () => tutorial.close() }, symbol("close"));
    const back = el("md-text-button", { class: "tutorial-back" }, symbol("back"), "Back");
    const next = el("md-text-button", { class: "tutorial-next", "trailing-icon": true }, "Next", symbol("forward"));
    back.firstChild.setAttribute("slot", "icon");
    next.lastChild.setAttribute("slot", "icon");
    const note = el("p", { class: "tutorial-note" }, "Next shows the other pages now, but there is no need: each opens by itself when its moment comes.");
    const show = (to) => {
      i = Math.max(0, Math.min(pages.length - 1, to));
      const page = pages[i];
      title.textContent = page.title;
      content.replaceChildren(...page.blocks.map(block));
      dots.querySelectorAll(".dot").forEach((d, n) => d.classList.toggle("on", n === i));
      back.disabled = i === 0;
      next.disabled = i === pages.length - 1;
      note.hidden = !(popups && page.key === "intro");
      tutorial.shadowRoot?.querySelector(".scroller")?.scrollTo(0, 0);
      seen?.(page.key);
    };
    back.addEventListener("click", () => show(i - 1));
    next.addEventListener("click", () => show(i + 1));
    tutorial.replaceChildren(
      el("div", { slot: "headline", class: "tutorial-head" }, title, close),
      content,
      el("div", { slot: "actions", class: "tutorial-actions" }, note, el("div", { class: "tutorial-pager" }, back, dots, next)),
    );
    const keys = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        show(i + (e.key === "ArrowRight" ? 1 : -1));
      }
    };
    document.addEventListener("keydown", keys);
    tutorial.addEventListener(
      "closed",
      () => {
        document.removeEventListener("keydown", keys);
        done?.();
      },
      { once: true },
    );
    show(at);
    tutorial.show();
  }

  root.append(bar, settings, credits, tutorial);

  // Everything drawn from the person's settings and the state.
  let last = { prefs: null, state: null, busy: false };
  function draw() {
    const { prefs, state, busy } = last;
    if (!prefs) return;
    for (const b of gameSet.querySelectorAll("md-outlined-segmented-button")) b.selected = b.dataset.game === rules.game;
    aces.selected = rules.aces14;
    aces.disabled = rules.game !== "royal";
    sweeps.selected = rules.sweeps;
    skill.value = String(prefs.skill);
    match.value = prefs.match;
    // The aids as the person set them (a watched game has none of its own:
    // the table review's T14).
    for (const s of settings.querySelectorAll("md-switch[data-aid]")) s.selected = Boolean(state?.watching ? prefs.aids[s.dataset.aid] : (state?.aids?.[s.dataset.aid] ?? prefs.aids[s.dataset.aid]));
    for (const s of settings.querySelectorAll("md-switch[data-pref]")) s.selected = Boolean(prefs[s.dataset.pref]);
    speed.value = String(prefs.speed);
    surface.value = prefs.surface;
    faces.value = prefs.faces;
    // During the replay nothing acts on its position but its own controls
    // (the table's second review, S3).
    const replaying = Boolean(last.replaying);
    // Shown once the game is over: during it, the seed in a second window
    // would show what your opponent holds (the table's second review, S4).
    seedLine.textContent = !state
      ? ""
      : state.prompt === "over" || replaying
        ? `This game's seed was ${state.seed}: the same seed deals the same cards, and your opponent saw only what you saw. Add ?seed=${state.seed} to the page's address to deal it again.`
        : "This game's seed is shown when it is over: the same seed deals the same cards, so it would show your opponent's hand now.";
    const watching = Boolean(state?.watching);
    hint.hidden = watching || replaying || !state?.aids?.hints;
    hint.disabled = state?.prompt !== "play" || busy; // not while cards move (T10)
    again.disabled = !last.canAgain || busy;
    again.hidden = replaying;
    undo.hidden = watching || replaying || !prefs.undo;
    undo.disabled = !state?.can_undo;
  }

  return {
    sync(prefs, state, { busy = false, canAgain = false, replaying = false } = {}) {
      if (!last.prefs) rules = { ...prefs.rules };
      last = { prefs, state, busy, canAgain, replaying };
      draw();
    },
    setRules(r) {
      rules = { ...r };
      draw();
    },
    logOpen(open) {
      log.selected = open;
    },
    settings,
    credits,
    showTutorial,
    tutorialOpen: () => tutorial.open,
  };
}

// The credits, on screen as the card back's licence requires (CREDITS.md).
function creditItems() {
  const item = (title, ...lines) => el("div", { class: "credit" }, el("strong", {}, title), ...lines.map((l) => el("p", {}, l)));
  return [
    item(
      "Cassino",
      "Released under the MIT License: free to use, copy, change and share, with this notice kept.",
      "The parts by others below keep their own licences, the card back's CC BY-SA 3.0 among them.",
    ),
    item("The card faces", "“Public domain complete playing card deck”, by AustinGabriel64, from Wikimedia Commons. CC0 1.0: no rights reserved; credited gladly."),
    item(
      "The card back",
      "Adapted from “Reverso baraja española”, by Germarquezm, from Wikimedia Commons, which includes elements of his “Baraja española.svg”.",
      "Licensed CC BY-SA 3.0 (creativecommons.org/licenses/by-sa/3.0). Changed: rasterised and re-framed from its Spanish proportions to the faces' 5:7. The back shown here is therefore also CC BY-SA 3.0.",
    ),
    item(
      "Material Design 3",
      "The controls follow Google's Material Design 3 (m3.material.io), through Material Web 2.5.0 (Apache License 2.0, © Google LLC) and Lit 3.3.3 (BSD 3-Clause, © Google LLC), with tslib 2.8.1 (0BSD, © Microsoft). The plus and question-mark icons are Material Symbols (Apache License 2.0, © Google LLC).",
    ),
    item("three.js", "The table is drawn with three.js 0.186.1: MIT License, © 2010–2026 three.js authors."),
    item(
      "The rules and the talk",
      "Classic and Royal Cassino after pagat.com; the count after Foster's Complete Hoyle. What is said at the table comes from the period books and pagat.com, each phrase's source listed in the game's phrase bank.",
    ),
  ];
}
