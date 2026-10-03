// The overlay: the 2D surfaces floating over the table, in Material Design 3
// (docs/TABLE3D.md section 8). Phase T2: the prompt, the chips that offer
// what a selection makes, the running sum, the "why not?" line, the next
// hand and the end of the game; and the badges over the builds.
//
// It draws what it is given and reports what is pressed; it holds no rules.

import "@material/web/button/filled-button.js";
import "@material/web/chips/assist-chip.js";
import "@material/web/chips/chip-set.js";

export function createOverlay(root, { onChip, onNext, onNewGame }) {
  root.innerHTML = `
    <div class="badges"></div>
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
  function show({ state, chips, sum: total, message }) {
    prompt.textContent = promptText(state, chips);
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
    next.hidden = state.prompt !== "next_hand";
    again.hidden = state.prompt !== "over";
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

  return { show, placeBadges, chips: () => [...chipSet.children].map((c) => c.label) };
}

function promptText(state, chips) {
  const last = [...state.events].reverse().find((e) => e.kind === "game_ends" || e.kind === "hand_ends");
  if (state.prompt === "over") return last?.text ?? "The game is over.";
  if (state.prompt === "next_hand") return last?.text ?? "The hand is over.";
  if (!chips.length) return "Choose a card from your hand, then the table cards to go with it.";
  return "Choose what to do.";
}
