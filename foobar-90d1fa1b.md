# Cassino / Royal Cassino score HUD: implementation handoff

**Audience:** the LLM implementing the game (three.js, mobile, portrait).
**What this is:** a spec for a two-player score HUD, plus the reference implementation exactly as the designer approved it (Appendix A). Treat the appendix as the source of truth for exact numbers; this document explains intent, behavior, and what to carry over.

**Status:** the visuals and motion were reviewed and approved by the designer in a design canvas over several rounds of iteration. The code is a prototype. It has not been tested across devices or integrated with a game engine. Section 10 lists known gaps.

---

## 1. What the widget is

- Two thin **segmented progress lines**, one per player (You on top, Opp below), 21 segments each.
- The two **scores** underneath, You on the left and Opp on the right, with a **chevron** between them.
- When a player scores, a **popup briefly replaces that player's score block** (like a basketball broadcast graphic), then the score returns, updated.
- The chevron expands a **per-hand ledger**: every hand's scoring lines, each hand's subtotal below its lines, and an overall total. This is a single level of expansion with no nested toggles.

Game constraints:
- Phones in vertical orientation.
- **No bundled fonts.** All text uses the system font (SF on iPhone and Mac).
- Restrained, mostly monochrome palette.
- Motion is spring-based and expressive (Material 3 Expressive-style).
- The widget lives in a three.js game, but it does not need to be 3D (see section 7).

## 2. Rules the HUD encodes (Cassino and Royal Cassino)

- First to **21** wins. Some tables play to 11. This HUD is built for 21 only.
- Points are tallied per hand (deal):

| Category (UI label) | Key | Points |
|---|---|---|
| Most cards | `cards` | 3 (nobody scores it on a tie) |
| Most spades | `spades` | 1 (nobody scores it on a tie) |
| Big Cassino (10 of diamonds) | `big` | 2 |
| Little Cassino (2 of spades) | `little` | 1 |
| Aces | `aces` | 1 each, so 4 per hand to split |
| Sweeps | `sweeps` | 1 each |

- That is 11 points per hand plus sweeps. Royal Cassino (face cards carry values 11, 12 and 13) changes how cards are captured, not this scoring.
- The ledger lists the six categories in exactly the order above. That is also the "fixed counting order" some rulebooks use.
- **Deliberately not implemented:** the 18, 19 and 20 endgame restrictions. They belong to one regional variant (the Dominican version of Royal Casino) and are not part of the rules this game plays.

## 3. Layout and anatomy (reference width 390 px)

Outer padding is 12 px. The card has background `#1b1f24`, radius 28 px, and padding `20 20 16`.

### 3.1 Progress lines
- Two rows 22 px tall with a 6 px gap. Each row holds 21 segments (flex row, equal widths).
- The last segment (the finish) is 1.8x wide.
- Gaps are 3 px between segments and 8 px before segments 6, 11, 16 and 21, so the line reads in groups of five.
- A segment `n` (1-based) is in one of three states relative to the player's score:
  - **reached** (`n < score`): 6 px tall, mid-tone
  - **cursor** (`n == score`): 12 px tall, bright; this is "where I am"
  - **unreached** (`n > score`): 4 px tall, dark
- A score of 0 lights nothing. Segments are fully rounded (radius 6).
- **The bars never slide.** Scoring lights the next segments and dims the old cursor to "reached".
- The segment tones are the only place the two players are colored differently.

### 3.2 Score row
- Layout is `[You block, flex 1] [chevron, 48 px] [Opp block, flex 1]`, with an 8 px gap and 14 px above it.
- Each block is **69 px tall** (17 px label + 52 px number) with `overflow: hidden`.
- Label: 13 px, `#9aa3ad`. Number: 48 px / 52 px, bold, tabular numerals, `#f7f8fa`.
- **Number and label colors are identical for both players.** Only the bar tones differ.
- The You block is left-aligned and the Opp block is right-aligned.

### 3.3 Scoring popup ("broadcast swap")
When a scoring event arrives for a player, the popup replaces that player's whole block, label and number included.
- **Two columns**, 6 px gap, vertically centered in the 69 px block.
  - Left: the label (for example "Sweep" or "Little Cassino"), 18 px / 20 px bold, centered text, wrapping to at most two rows.
  - Right: the points ("+3"), **36 px / 40 px bold, exactly twice the word size and as tall as two label rows**, tabular numerals.
- **Uniform type size for every popup**, with no auto-fit, so no popup looks different from the others. Both players use the same layout (text left, number right) and the same color (`#f7f8fa`).
- Motion is a vertical roll:
  - The score layer exits upward (translateY to -76 px, opacity 0).
  - The popup enters from below (76 px to 0) with an overshooting spring.
  - After **1700 ms** the popup exits downward and the score re-enters with a spring, showing the updated number with a small pop.
- The number ticks up while it is hidden: +1 every 70 ms, starting 90 ms after the event. The bars ripple immediately, so the bars lead the number.

### 3.4 Chevron toggle
- 48x48 button. The icon is a chevron-down that rotates 180 degrees with the fast spring (it overshoots slightly).
- The shape morphs from a circle (radius 24) to a rounded square (radius 15) on the default spring.
- Closed: bg `#2b3138`, icon `#f2f4f6`. Open: bg `#e8ebef`, icon `#121417`. Pressed: scale 0.88.
- Accessibility: `aria-expanded`, and a label that changes ("Show hand-by-hand scores" or "Hide ...").

### 3.5 Detail panel (single level)
- It opens and closes by animating height (default spring on open, 240 ms effects spring on close). Total height is `90 + listHeight`.
- Contents, top to bottom:
  1. A 2 px rule and a header row ("You" on the left, "Opp" on the right; 12 px, letter-spacing .04em).
  2. The **hand list** (see below).
  3. A 2 px rule and the **Total** row (44 px; 22 px bold; center label "Total").
- Each **hand block**, in chronological order (the live hand last), is 170 px tall:
  - Six line rows of 22 px, in the category order from section 2. Each row has the You value on the left, the label centered in a 128 px column, and the Opp value on the right. A value is the points awarded in that category, or an en dash "–" (muted `#6b747e`) when nobody got it.
  - **The hand's subtotal sits below its lines** (30 px row with a 1 px top rule, 18 px bold, You left and Opp right). The center label reads "Hand N subtotal", or "Hand N · live" for the hand in progress.
  - An 8 px spacer.
- The list's max height is 510 px (three hands). Beyond that it scrolls inside the panel, with the scrollbar hidden and the header and Total row pinned.
- Highlighting is symmetric and based on who leads: the larger number is bright (`#f7f8fa`) and the smaller is muted (`#9aa3ad`). A tie leaves both muted.
- In the live hand, the line value that just changed does a scale pop (1.45x, 640 ms).
- The hand block appears only when a hand is in play (`live`) or has been completed. There is no empty next-hand row between hands.

## 4. Motion spec

Three springs. The source ships them as CSS `linear()` easing curves sampled from the physics; use real spring integrators if you are not in CSS.

| Name | Damping ratio | Stiffness | ~Settle | Used for |
|---|---|---|---|---|
| fast spatial | 0.6 | 800 | 460 ms | segment flare/settle and dimming, popup roll-in, number pop, line pop, chevron rotation, row entrance |
| default spatial | 0.75 | 380 | 520 ms | panel and list height, chevron shape morph |
| effects | 1.0 | 1600 | 200 ms | fades, exits, color changes, panel close |

Underdamped spring (unit mass): `x(t) = 1 - e^(-ζω₀t) (cos ω_d t + (ζω₀/ω_d) sin ω_d t)`, with `ω₀ = sqrt(k)` and `ω_d = ω₀ sqrt(1-ζ²)`. For ζ = 1: `x(t) = 1 - (1 + ω₀t) e^(-ω₀t)`.

**Segment lighting.** When a player's score rises from `a` to `b`, segments `a+1 .. b` light in sequence, each starting 70 ms after the previous one:
- Each starts in its unreached look, flares to **20 px tall and a "peak" color at 38% of a 760 ms animation**, then settles with the fast spring into its final state: "reached" for the intermediate segments, "cursor" for segment `b`.
- The old cursor (segment `a`) dims to "reached" at the same moment, with height 460 ms (fast spring) and color 200 ms (effects).
- The sequence reads as a wave: a pulse runs along the line and leaves a bright cursor at the end.

**Other timings (ms):**
- Number ticks: +1 per 70, starting at 90.
- Popup visible: 1700 from the event.
- Number pop (scale 1.3, 640 ms): at 1900.
- Panel open: 520 default spring.
- Hand rows stagger in at 70 + 50 per hand; line rows stagger at +80 and +35 per line.
- Row entrance: translateY 14 px and scale 0.96 to rest.

**Reduced motion:** collapse all animation and transition durations to about 1 ms and all delays to 0, but keep the final states and the popup text.

## 5. Visual tokens

| Token | Value |
|---|---|
| Artboard / ground | `#121417` |
| Card | `#1b1f24` |
| Text primary | `#f7f8fa` (scores, popup), `#f2f4f6` (labels that need emphasis) |
| Text secondary | `#9aa3ad` |
| Muted / placeholder dash | `#6b747e` |
| Rules / dividers | `#2a3037` |
| Segments: unreached (both players) | `#2f363d` |
| Segments: You reached / cursor / peak | `#8b95a0` / `#f7f8fa` / `#ffffff` |
| Segments: Opp reached / cursor / peak | `#646d77` / `#c3cad2` / `#e4e8ec` |
| Chevron closed / open | bg `#2b3138` + `#f2f4f6`, bg `#e8ebef` + `#121417` |

- Font: system stack (`-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif`). **Do not bundle a font.**
- Always use tabular numerals for scores, so digits don't jitter while ticking.
- Sizes used: 48 (score), 36 (popup points), 22 (total), 18 (popup words and hand subtotals), 15 (line values), 13 and 12 (labels).
- The palette is neutral grays only, with no accent color. Lightness differences, not hue, tell things apart.

## 6. Integration contract (what the engine should feed it)

Prefer one source of truth, a per-hand ledger, and derive everything else from it.

```ts
type Side = 'you' | 'opp';
type Cat  = 'cards' | 'spades' | 'big' | 'little' | 'aces' | 'sweeps';
type Hand = Record<Cat, { you: number; opp: number }>;   // POINTS awarded per category (aces = count of aces)

// Engine -> HUD
scoreEvent({ side, cat, label, pts })   // adds pts to the live hand's line; shows the popup; moves the bar
endHand()                                // moves the live hand into the completed list; live = false until the next deal
// the next scoreEvent after endHand() starts a new live hand
newGame()                                // clears everything

// Derived by the HUD
score(side) = sum of all hands + live hand, over all six categories
handSubtotal(hand, side) = sum over six categories
```

Notes:
- **Popup labels** are `Sweep`, `Aces`, `Little Cassino`, `Big Cassino`, `Most spades` and `Most cards`. The wording is made up and easy to change. Points are shown as `+N` (an `Aces` popup for three aces reads `+3`).
- **Event timing.** Sweeps can fire live during play. The other categories are announced in a tally at the end of the hand, about 2 seconds apart in the demo.
- **Queue events.** The prototype does not queue popups: two events for the same side within about 2 seconds will overlap and cut each other short. The real engine will often emit several tally events at hand end, so add a per-side queue (a popup lasts about 1.9 s including the return).
- **Overshoot.** The prototype clamps a score at 21. The real game must allow totals above 21 and simply clamp the segment line at 21.
- The prototype stores the totals (`you`, `opp`) separately from the hand ledger. They agree only because the demo data is consistent. Derive them in the real implementation.

## 7. Porting notes (three.js)

- **Recommended: a DOM overlay** positioned over the canvas (respect the iPhone safe-area inset at the top). It keeps the system font and tabular numerals for free, gives you accessibility, and lets the CSS springs work as written.
- **If it must render inside the canvas:** draw to a 2D canvas using the system font stack and upload it as a `CanvasTexture` on an orthographic quad. Then:
  - Implement the springs as integrators (formulas in section 4).
  - Clip the 69 px score blocks, the list, and the popup rolls (stencil or scissor, or draw them into their own offscreen canvases).
  - Canvas `font` shorthand has no tabular-numeral switch, so draw each digit in a fixed-width cell to avoid jitter.
- **Browser support:** the CSS springs use `linear()` easing (Safari 17.2+, Chrome 113+). Check this against the iOS versions you target; if you need older iOS, drive the same curves from JS.
- **Touch target:** the chevron is 48x48. Add nothing smaller.

## 8. How to read the reference implementation (Appendix A)

It is written in a design tool's component format (`.dc.html`):
- `{{ ... }}` are template bindings. `<sc-for>` is a loop. `<x-dc>` wraps the markup.
- `class Component extends DCLogic` is a React-class-like component with `state`, `setState` and lifecycle hooks. `renderVals()` returns the values the template reads. Nothing in it needs to be run outside that tool; port the logic and the inline styles.
- **Real logic worth keeping:** the ledger model (`blank`, `total`, `view`), `score()`, the segment state rules in `segs()`, the popup and score layer states (`alertCss`/`scoreCss`), the hand and line construction in `renderVals()`, and the heights (`HAND_H` 170, `LIST_MAX` 510, panel `90 + listH`).
- **Demo scaffolding to replace with real engine events:** `script()`, `run()`, `resetModel()`'s fixture data, and the `autoplay` prop.
- **Workarounds for CSS limits, which you can drop in a different animation system:**
  - The `lit` / `anim` / `dly` bookkeeping and the alternating A/B keyframe names (`segA`/`segB`, `numPopA`/`numPopB`, `valA`/`valB`) exist only to retrigger CSS animations in that runtime.
  - `transition:none` on freshly lit segments exists to stop a transition from overriding the keyframe animation.

### Demo fixture (useful for visual checks)
Start state: You 10, Opp 13.
- Hand 1: You 6, Opp 5. cards You 3; spades Opp 1; big Opp 2; little You 1; aces You 2, Opp 2.
- Hand 2: You 4, Opp 8. cards Opp 3; spades You 1; big You 2; little Opp 1; aces You 1, Opp 3; sweeps Opp 1.
- Hand 3 plays live, in this order: Opp Sweep +1, You Sweep +1, You Aces +3, Opp Aces +1, You Little Cassino +1, Opp Big Cassino +2, You Most spades +1, You Most cards +3.
- Hand 3 ends at You 9, Opp 4, with totals **You 19, Opp 17**.

## 9. Decisions made, and things deliberately removed

Do not reintroduce these unless asked:
- **No 18, 19 or 20 endgame zone.** There was a bracket under those segments, then hollow segments there, then "Needs ..." captions. All were removed because the rule is a regional variant, and because extra visual marks distracted from the straightforward line.
- **No second layer of toggles** in the detail panel. Everything for every hand shows when the one chevron is open.
- **No alert chips under the scores.** The old "whitespace under the scores" is gone. Alerts swap into the score block instead.
- **No different text colors for player versus opponent.** Only the bars differ.
- **The bars do not move.** Scoring lights segments and dims the previous cursor.
- **No "x to go" text.**

## 10. Known gaps and open items

- **No win state** at 21 (no final flourish, no "game over" treatment).
- **Counting order and simultaneous finish are unresolved.** Some rulebooks tally in the fixed order cards, spades, Big, Little, aces, sweeps and let the first player to cross 21 win. If both reach 21 or more in the same deal, the higher total usually wins and a tie means another deal. The HUD has no "tied at 21 or more" state. If the game adopts the counting-order rule, fire the tally popups in that order and stop the ripple at the moment someone crosses 21.
- **No tie popups** ("Most cards: tied"), so a missing +3 is explained only by dashes in the ledger.
- **Royal Cassino sweep cancellation** (opposing sweeps cancel each other in some versions) is not modeled.
- **11-point games** would need the segment count to become a setting, which also changes the group-of-five spacing.
- **Not designed:** turn or dealer indicator, sound or haptics per segment, landscape, tablets, dark/light theming.
- **Untested:** devices, screen readers, the older-iOS `linear()` fallback.

---

## Appendix A: reference implementation (verbatim)

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Cassino score HUD</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
body{margin:0}
:root{--sp-fast:linear(0, 0.048, 0.167, 0.323, 0.488, 0.646, 0.784, 0.896, 0.98, 1.038, 1.074, 1.091, 1.095, 1.088, 1.076, 1.061, 1.045, 1.03, 1.018, 1.008, 1, 0.995, 0.992, 0.991, 0.991, 0.992, 0.993, 0.995, 0.996, 0.997, 0.999, 0.999, 1, 1.001, 1.001, 1.001, 1.001, 1.001, 1.001, 1);--sp-def:linear(0, 0.03, 0.104, 0.204, 0.316, 0.43, 0.538, 0.638, 0.725, 0.8, 0.861, 0.911, 0.949, 0.978, 0.999, 1.013, 1.022, 1.027, 1.028, 1.028, 1.026, 1.023, 1.02, 1.017, 1.014, 1.011, 1.008, 1.006, 1.004, 1.003, 1.002, 1.001, 1, 1, 0.999, 0.999, 0.999, 0.999, 0.999, 1);--sp-fx:linear(0, 0.018, 0.064, 0.127, 0.199, 0.274, 0.348, 0.42, 0.488, 0.551, 0.608, 0.659, 0.705, 0.745, 0.781, 0.812, 0.839, 0.863, 0.883, 0.901, 0.916, 0.929, 0.94, 0.949, 0.957, 0.964, 0.969, 0.974, 0.978, 0.982, 0.985, 0.987, 0.989, 0.991, 0.993, 0.994, 0.995, 0.996, 0.996, 1)}
@keyframes segA{0%{height:4px;background-color:var(--d)}38%{height:20px;background-color:var(--p);animation-timing-function:var(--sp-fast)}}
@keyframes segB{0%{height:4px;background-color:var(--d)}38%{height:20px;background-color:var(--p);animation-timing-function:var(--sp-fast)}}
@keyframes numPopA{0%{transform:scale(1)}28%{transform:scale(1.3);animation-timing-function:var(--sp-fast)}100%{transform:scale(1)}}
@keyframes numPopB{0%{transform:scale(1)}28%{transform:scale(1.3);animation-timing-function:var(--sp-fast)}100%{transform:scale(1)}}
@keyframes valA{0%{transform:scale(1)}30%{transform:scale(1.45);animation-timing-function:var(--sp-fast)}100%{transform:scale(1)}}
@keyframes valB{0%{transform:scale(1)}30%{transform:scale(1.45);animation-timing-function:var(--sp-fast)}100%{transform:scale(1)}}
@keyframes rowIn{0%{opacity:0;transform:translateY(18px) scale(.96);animation-timing-function:var(--sp-fast)}}
.chev{-webkit-tap-highlight-color:transparent}
.chev:active{transform:scale(.88)}
.chev:focus-visible{outline:2px solid #f7f8fa;outline-offset:3px}
.sl{scrollbar-width:none;overscroll-behavior:contain}
.sl::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){*{animation-duration:1ms!important;animation-delay:0s!important;transition-duration:1ms!important;transition-delay:0s!important}}
</style>
</helmet>
<div style="width:390px;height:810px;box-sizing:border-box;padding:12px;background:#121417;color:#f2f4f6;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif">
<div style="box-sizing:border-box;background:#1b1f24;border-radius:28px;padding:20px 20px 16px">

<div role="img" aria-label="{{ summary }}" style="display:flex;flex-direction:column;gap:6px">
<div style="display:flex;align-items:center;height:22px">
<sc-for list="{{ youSegs }}" as="seg" hint-placeholder-count="21"><div style="box-sizing:border-box;{{ seg.css }}"></div></sc-for>
</div>
<div style="display:flex;align-items:center;height:22px">
<sc-for list="{{ oppSegs }}" as="seg" hint-placeholder-count="21"><div style="box-sizing:border-box;{{ seg.css }}"></div></sc-for>
</div>
</div>

<div style="display:flex;align-items:flex-start;gap:8px;margin-top:14px">

<div style="flex:1 1 0;min-width:0;position:relative;height:69px;overflow:hidden">
<div style="position:absolute;left:0;top:0;right:0;display:flex;flex-direction:column;align-items:flex-start;{{ youScoreCss }}">
<div style="font-size:13px;line-height:17px;color:#9aa3ad">You</div>
<div style="font-size:48px;line-height:52px;font-weight:700;font-variant-numeric:tabular-nums;color:#f7f8fa;{{ youPopCss }}">{{ youShown }}</div>
</div>
<div aria-live="polite" style="position:absolute;left:0;top:0;right:0;height:69px;display:flex;flex-direction:row;align-items:center;gap:6px;{{ aYouCss }}">
<span style="flex:1 1 0;min-width:0;font-size:18px;line-height:20px;font-weight:700;color:#f7f8fa;text-align:center">{{ aYouLabel }}</span>
<span style="flex:none;font-size:36px;line-height:40px;font-weight:700;color:#f7f8fa;font-variant-numeric:tabular-nums">{{ aYouPts }}</span>
</div>
</div>

<button class="chev" aria-label="{{ toggleLabel }}" aria-expanded="{{ expanded }}" onClick="{{ toggle }}" style="flex:none;width:48px;height:48px;margin-top:12px;padding:0;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;{{ chevCss }}">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:block;{{ iconCss }}"><path d="M6 9l6 6 6-6"></path></svg>
</button>

<div style="flex:1 1 0;min-width:0;position:relative;height:69px;overflow:hidden">
<div style="position:absolute;left:0;top:0;right:0;display:flex;flex-direction:column;align-items:flex-end;text-align:right;{{ oppScoreCss }}">
<div style="font-size:13px;line-height:17px;color:#9aa3ad">Opp</div>
<div style="font-size:48px;line-height:52px;font-weight:700;font-variant-numeric:tabular-nums;color:#f7f8fa;{{ oppPopCss }}">{{ oppShown }}</div>
</div>
<div aria-live="polite" style="position:absolute;left:0;top:0;right:0;height:69px;display:flex;flex-direction:row;align-items:center;gap:6px;{{ aOppCss }}">
<span style="flex:1 1 0;min-width:0;font-size:18px;line-height:20px;font-weight:700;color:#f7f8fa;text-align:center">{{ aOppLabel }}</span>
<span style="flex:none;font-size:36px;line-height:40px;font-weight:700;color:#f7f8fa;font-variant-numeric:tabular-nums">{{ aOppPts }}</span>
</div>
</div>

</div>

<div style="overflow:hidden;{{ panelCss }}">
<div style="padding-top:6px;padding-bottom:8px">
<div style="height:2px;background:#2a3037;border-radius:1px"></div>
<div style="display:flex;align-items:center;height:28px;font-size:12px;letter-spacing:0.04em;color:#9aa3ad">
<div style="flex:1 1 0;padding-left:4px">You</div>
<div style="width:128px;flex:none"></div>
<div style="flex:1 1 0;text-align:right;padding-right:4px">Opp</div>
</div>
<div class="sl" style="overflow-y:auto;{{ listCss }}">
<sc-for list="{{ hands }}" as="hand" hint-placeholder-count="3">
<div style="animation:rowIn 460ms ease-out backwards;{{ hand.css }}">
<sc-for list="{{ hand.lines }}" as="ln" hint-placeholder-count="6">
<div style="display:flex;align-items:center;height:22px;{{ ln.css }}">
<div style="flex:1 1 0;min-width:0;padding-left:4px;font-size:15px;font-weight:600;font-variant-numeric:tabular-nums;{{ ln.youCss }}">{{ ln.you }}</div>
<div style="width:128px;flex:none;text-align:center;font-size:12px;color:#9aa3ad">{{ ln.label }}</div>
<div style="flex:1 1 0;min-width:0;padding-right:4px;text-align:right;font-size:15px;font-weight:600;font-variant-numeric:tabular-nums;{{ ln.oppCss }}">{{ ln.opp }}</div>
</div>
</sc-for>
<div style="display:flex;align-items:center;height:30px;box-shadow:inset 0 1px 0 #2a3037">
<span style="flex:1 1 0;min-width:0;padding-left:4px;font-size:18px;font-weight:700;font-variant-numeric:tabular-nums;{{ hand.youCss }}">{{ hand.you }}</span>
<span style="width:128px;flex:none;text-align:center;font-size:13px;{{ hand.labelCss }}">{{ hand.label }}</span>
<span style="flex:1 1 0;min-width:0;padding-right:4px;text-align:right;font-size:18px;font-weight:700;font-variant-numeric:tabular-nums;{{ hand.oppCss }}">{{ hand.opp }}</span>
</div>
<div style="height:8px"></div>
</div>
</sc-for>
</div>
<div style="height:2px;background:#2a3037;border-radius:1px"></div>
<div style="display:flex;align-items:center;height:44px">
<div style="flex:1 1 0;min-width:0;padding-left:4px;font-size:22px;font-weight:700;font-variant-numeric:tabular-nums;{{ totYouCss }}">{{ totYou }}</div>
<div style="width:128px;flex:none;text-align:center;font-size:13px;color:#f2f4f6">Total</div>
<div style="flex:1 1 0;min-width:0;padding-right:4px;text-align:right;font-size:22px;font-weight:700;font-variant-numeric:tabular-nums;{{ totOppCss }}">{{ totOpp }}</div>
</div>
</div>
</div>

</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"autoplay":{"editor":"boolean","default":true},"$preview":{"width":390,"height":810}}'>
class Component extends DCLogic {
constructor(props) {
super(props);
this.timers = [];
this.resetModel();
this.state = Object.assign({ open: false, flash: null, aYou: { label: '', pts: '', show: false }, aOpp: { label: '', pts: '', show: false }, popYou: 'none', popOpp: 'none', youShown: this.m.you, oppShown: this.m.opp }, this.view());
}
cats() {
return [['cards', 'Most cards'], ['spades', 'Most spades'], ['big', 'Big Cassino'], ['little', 'Little Cassino'], ['aces', 'Aces'], ['sweeps', 'Sweeps']];
}
blank() {
return { cards: { you: 0, opp: 0 }, spades: { you: 0, opp: 0 }, big: { you: 0, opp: 0 }, little: { you: 0, opp: 0 }, aces: { you: 0, opp: 0 }, sweeps: { you: 0, opp: 0 } };
}
total(h, side) {
return h.cards[side] + h.spades[side] + h.big[side] + h.little[side] + h.aces[side] + h.sweeps[side];
}
clone(x) {
return JSON.parse(JSON.stringify(x));
}
resetModel() {
const h1 = this.blank();
h1.cards.you = 3;
h1.spades.opp = 1;
h1.big.opp = 2;
h1.little.you = 1;
h1.aces.you = 2;
h1.aces.opp = 2;
const h2 = this.blank();
h2.cards.opp = 3;
h2.spades.you = 1;
h2.big.you = 2;
h2.little.opp = 1;
h2.aces.you = 1;
h2.aces.opp = 3;
h2.sweeps.opp = 1;
this.m = { you: 10, opp: 13, hands: [h1, h2], cur: this.blank(), live: true };
this.sc = 0;
this.cnt = { you: 0, opp: 0 };
this.anim = { you: [], opp: [] };
this.dly = { you: [], opp: [] };
for (let i = 0; i < 21; i++) {
this.anim.you.push('none');
this.anim.opp.push('none');
this.dly.you.push(0);
this.dly.opp.push(0);
}
this.lit = { you: [], opp: [] };
}
view() {
const m = this.m;
return { you: m.you, opp: m.opp, hands: this.clone(m.hands), cur: this.clone(m.cur), live: m.live };
}
later(fn, ms) {
this.timers.push(setTimeout(fn, ms));
}
componentDidMount() {
this.run(0);
}
componentWillUnmount() {
this.timers.forEach((t) => clearTimeout(t));
}
script() {
return [
{ d: 2200, side: 'opp', cat: 'sweeps', label: 'Sweep', pts: 1 },
{ d: 2600, side: 'you', cat: 'sweeps', label: 'Sweep', pts: 1 },
{ d: 2800, side: 'you', cat: 'aces', label: 'Aces', pts: 3 },
{ d: 2200, side: 'opp', cat: 'aces', label: 'Aces', pts: 1 },
{ d: 2200, side: 'you', cat: 'little', label: 'Little Cassino', pts: 1 },
{ d: 2200, side: 'opp', cat: 'big', label: 'Big Cassino', pts: 2 },
{ d: 2200, side: 'you', cat: 'spades', label: 'Most spades', pts: 1 },
{ d: 2200, side: 'you', cat: 'cards', label: 'Most cards', pts: 3 },
{ d: 2400, end: true },
{ d: 4200, reset: true }
];
}
run(i) {
const steps = this.script();
const step = steps[i % steps.length];
this.later(() => {
if (this.props.autoplay === false) {
this.run(i);
return;
}
if (step.reset) {
this.resetModel();
this.setState(Object.assign({ flash: null, aYou: { label: '', pts: '', show: false }, aOpp: { label: '', pts: '', show: false }, popYou: 'none', popOpp: 'none', youShown: this.m.you, oppShown: this.m.opp }, this.view()));
} else if (step.end) {
this.m.hands.push(this.clone(this.m.cur));
this.m.cur = this.blank();
this.m.live = false;
this.setState(Object.assign({ flash: null }, this.view()));
} else {
this.score(step.side, step.cat, step.label, step.pts);
}
this.run(i + 1);
}, step.d);
}
score(side, cat, label, pts) {
const m = this.m;
const prev = m[side];
const next = Math.min(21, prev + pts);
const gained = next - prev;
this.lit = { you: [], opp: [] };
m.live = true;
m[side] = next;
m.cur[cat][side] += pts;
this.sc += 1;
const name = this.sc % 2 ? 'segA' : 'segB';
const flashName = this.sc % 2 ? 'valA' : 'valB';
for (let k = prev + 1; k <= next; k++) {
this.anim[side][k - 1] = name;
this.dly[side][k - 1] = (k - prev - 1) * 70;
this.lit[side].push(k - 1);
}
this.cnt[side] += 1;
const popName = 'numPop' + (this.cnt[side] % 2 ? 'A' : 'B');
const popKey = side === 'you' ? 'popYou' : 'popOpp';
const alertKey = side === 'you' ? 'aYou' : 'aOpp';
const shownKey = side === 'you' ? 'youShown' : 'oppShown';
const ptsText = '+' + pts;
this.setState(Object.assign(this.view(), { [alertKey]: { label: label, pts: ptsText, show: true }, flash: { cat: cat, side: side, name: flashName } }));
for (let k = 1; k <= gained; k++) {
this.later(() => this.setState({ [shownKey]: prev + k }), (k - 1) * 70 + 90);
}
this.later(() => this.setState({ [alertKey]: { label: label, pts: ptsText, show: false } }), 1700);
this.later(() => this.setState({ [popKey]: popName }), 1900);
}
renderVals() {
const s = this.state;
const N = 21;
const open = !!s.open;
const TONE = {
you: { dark: '#2f363d', fill: '#8b95a0', cur: '#f7f8fa', peak: '#ffffff' },
opp: { dark: '#2f363d', fill: '#646d77', cur: '#c3cad2', peak: '#e4e8ec' }
};
const segs = (side, score) => {
const t = TONE[side];
const out = [];
for (let i = 0; i < N; i++) {
const n = i + 1;
const st = n < score ? 'f' : (n === score ? 'c' : 'd');
const h = st === 'c' ? 12 : (st === 'f' ? 6 : 4);
const bg = st === 'c' ? t.cur : (st === 'f' ? t.fill : t.dark);
const gap = i === 0 ? 0 : (i % 5 === 0 ? 8 : 3);
const grow = i === N - 1 ? '1.8' : '1';
const name = this.anim[side][i];
const lighting = this.lit[side].indexOf(i) >= 0;
let css = 'flex:' + grow + ' 1 0;min-width:0;border-radius:6px;margin-left:' + gap + 'px;height:' + h + 'px;background-color:' + bg + ';--d:' + t.dark + ';--p:' + t.peak + ';';
css += lighting ? 'transition:none;' : 'transition:height 460ms var(--sp-fast),background-color 200ms var(--sp-fx);';
css += name === 'none' ? 'animation:none;' : 'animation:' + name + ' 760ms ease-out ' + this.dly[side][i] + 'ms 1 backwards;';
out.push({ css: css });
}
return out;
};
const alertCss = (a) => a.show
? 'opacity:1;transform:translateY(0px);transition:transform 460ms var(--sp-fast) 80ms,opacity 120ms var(--sp-fx) 80ms;'
: 'opacity:0;transform:translateY(76px);transition:transform 240ms var(--sp-fx),opacity 120ms var(--sp-fx) 100ms;';
const scoreCss = (a) => a.show
? 'opacity:0;transform:translateY(-76px);transition:transform 260ms var(--sp-fx),opacity 120ms var(--sp-fx) 100ms;'
: 'opacity:1;transform:translateY(0px);transition:transform 460ms var(--sp-fast) 120ms,opacity 140ms var(--sp-fx) 120ms;';
const popCss = (name, origin) => 'transform-origin:' + origin + ';' + (name === 'none' ? 'animation:none;' : 'animation:' + name + ' 640ms ease-out 1;');
const HAND_H = 170;
const LIST_MAX = 510;
const cats = this.cats();
const all = s.live ? s.hands.concat([s.cur]) : s.hands;
const hands = all.map((h, i) => {
const isLive = s.live && i === s.hands.length;
const y = this.total(h, 'you');
const o = this.total(h, 'opp');
const hd = 70 + i * 50;
const lines = cats.map((c, j) => {
const yv = h[c[0]].you;
const ov = h[c[0]].opp;
const fl = isLive && s.flash && s.flash.cat === c[0];
const d = hd + 80 + j * 35;
return {
label: c[1],
you: yv > 0 ? yv : '\u2013',
opp: ov > 0 ? ov : '\u2013',
youCss: 'transform-origin:left center;color:' + (yv > 0 ? '#f7f8fa' : '#6b747e') + ';' + (fl && s.flash.side === 'you' ? 'animation:' + s.flash.name + ' 640ms ease-out 1;' : 'animation:none;'),
oppCss: 'transform-origin:right center;color:' + (ov > 0 ? '#f7f8fa' : '#6b747e') + ';' + (fl && s.flash.side === 'opp' ? 'animation:' + s.flash.name + ' 640ms ease-out 1;' : 'animation:none;'),
css: open
? 'opacity:1;transform:translateY(0px);transition:opacity 180ms var(--sp-fx) ' + d + 'ms,transform 420ms var(--sp-fast) ' + d + 'ms;'
: 'opacity:0;transform:translateY(8px);transition:opacity 100ms var(--sp-fx),transform 140ms var(--sp-fx);'
};
});
return {
label: isLive ? 'Hand ' + (i + 1) + ' \u00b7 live' : 'Hand ' + (i + 1) + ' subtotal',
you: y,
opp: o,
youCss: y > o ? 'color:#f7f8fa;' : 'color:#9aa3ad;',
oppCss: o > y ? 'color:#f7f8fa;' : 'color:#9aa3ad;',
labelCss: isLive ? 'color:#f2f4f6;' : 'color:#9aa3ad;',
css: open
? 'opacity:1;transform:translateY(0px) scale(1);transition:opacity 200ms var(--sp-fx) ' + hd + 'ms,transform 460ms var(--sp-fast) ' + hd + 'ms;'
: 'opacity:0;transform:translateY(14px) scale(0.96);transition:opacity 120ms var(--sp-fx),transform 160ms var(--sp-fx);',
lines: lines
};
});
const listH = Math.min(all.length * HAND_H, LIST_MAX);
const ph = 90 + listH;
return {
youSegs: segs('you', s.you),
oppSegs: segs('opp', s.opp),
youShown: s.youShown,
oppShown: s.oppShown,
youPopCss: popCss(s.popYou, 'left center'),
oppPopCss: popCss(s.popOpp, 'right center'),
aYouLabel: s.aYou.label,
aYouPts: s.aYou.pts,
aOppLabel: s.aOpp.label,
aOppPts: s.aOpp.pts,
aYouCss: alertCss(s.aYou),
aOppCss: alertCss(s.aOpp),
youScoreCss: scoreCss(s.aYou),
oppScoreCss: scoreCss(s.aOpp),
summary: 'You ' + s.youShown + ' of 21 points. Opponent ' + s.oppShown + ' of 21 points.',
expanded: open ? 'true' : 'false',
toggleLabel: open ? 'Hide hand-by-hand scores' : 'Show hand-by-hand scores',
toggle: () => this.setState({ open: !this.state.open }),
chevCss: open
? 'background:#e8ebef;color:#121417;border-radius:15px;transition:border-radius 520ms var(--sp-def),background-color 200ms var(--sp-fx),color 200ms var(--sp-fx),transform 150ms var(--sp-fx);'
: 'background:#2b3138;color:#f2f4f6;border-radius:24px;transition:border-radius 520ms var(--sp-def),background-color 200ms var(--sp-fx),color 200ms var(--sp-fx),transform 150ms var(--sp-fx);',
iconCss: 'transform:rotate(' + (open ? 180 : 0) + 'deg);transition:transform 460ms var(--sp-fast);',
panelCss: open
? 'height:' + ph + 'px;transition:height 520ms var(--sp-def);'
: 'height:0px;transition:height 240ms var(--sp-fx);',
listCss: 'height:' + listH + 'px;transition:height 520ms var(--sp-def);',
hands: hands,
totYou: s.you,
totOpp: s.opp,
totYouCss: s.you > s.opp ? 'color:#f7f8fa;' : 'color:#9aa3ad;',
totOppCss: s.opp > s.you ? 'color:#f7f8fa;' : 'color:#9aa3ad;'
};
}
}
</script>
</body>
</html>
```
