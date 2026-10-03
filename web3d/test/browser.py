#!/usr/bin/env python3
"""The 3D table in a real browser, offline.

    python3 web3d/build.py
    <python with Playwright> web3d/test/browser.py [screenshot-dir]

Needs Playwright's Python package and the system Chromium (`/usr/bin/chromium`,
from apt). On the development VM piquet's `.venv` has Playwright:
`~/piquet/.venv/bin/python web3d/test/browser.py`. WebGL runs on SwiftShader,
so no GPU is needed. The page is opened from a file:// URL.

From piquet web3d/test/browser.py @ 254cb3c (its helpers). Checks what only a
browser can show: that the page makes **no network request of any kind** (it
is one file and must work offline), that it draws a lit table with its cards,
that a whole game can be played by clicking, and that nothing is ever written
to the console in error. With a screenshot directory it also saves strips of
a gather and of a sweep, frame by frame on the table's own clock (?manual), to
read back by eye (docs/TABLE3D.md section 10, T3).
"""

import io
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / "web3d" / "cassino3d.html"
SHOTS = next((Path(a) for a in sys.argv[1:] if not a.startswith("--")), None)
LOCAL = ("file:", "data:", "blob:")


def shot(page, name):
    if SHOTS:
        SHOTS.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SHOTS / f"{name}.png"))


def open_page(browser, query="seed=7", viewport=None, calm=False):
    """A fresh context, offline, recording every request the page makes.
    `calm`: with reduced motion, so the dialogue boxes appear without their
    pop-in -- which headless Chromium on SwiftShader, with the table's WebGL
    busy, never starts (a bare page animates; the shipped page in a real
    browser does too, as piquet's has)."""
    context = browser.new_context(viewport=viewport or {"width": 1280, "height": 800}, reduced_motion="reduce" if calm else "no-preference")
    context.set_offline(True)
    page = context.new_page()
    page.requests = []
    page.errors = []
    page.on("request", lambda r: page.requests.append(r.url))
    page.on("console", lambda m: m.type == "error" and page.errors.append(m.text))
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    # The tutorial's pages would hold the table: off, unless being tested.
    if "tutorial" not in query:
        query += "&tutorial=0"
    # Nor the welcome, unless it is what is tested.
    if "welcome" not in query:
        query += "&welcome=0"
    page.goto(f"{PAGE.as_uri()}?{query}")
    page.wait_for_function("window.cassino3d !== undefined", timeout=120_000)
    return page


def canvas_image(page):
    return Image.open(io.BytesIO(page.locator("canvas#stage").screenshot())).convert("RGB")


def check_offline(page, failures):
    remote = [u for u in page.requests if not u.startswith(LOCAL)]
    if remote:
        failures.append(f"the page asked the network for {len(remote)} things: {remote[:5]}")
    pages = {u.split("?")[0] for u in page.requests if u.startswith("file:")}
    if len(pages) != 1:
        failures.append(f"expected the page to load exactly one file, it loaded {pages}")


def check_drawn(page, failures, where=""):
    """A lit table: the canvas is not one colour, and not mostly black (the
    colour of WebGL that failed)."""
    small = canvas_image(page).resize((160, 100))
    colours = small.getcolors(maxcolors=160 * 100)
    dark = sum(n for n, (r, g, b) in colours if r + g + b < 60)
    if len(colours) < 4:
        failures.append(f"the canvas is nearly flat {where}: {len(colours)} colours")
    if dark > 0.5 * 160 * 100:
        failures.append(f"the canvas is mostly black {where} -- WebGL may have failed")


HEARD = set()  # every line seen in a dialogue box


def settle(page):
    """Wait for the cards to come to rest."""
    page.wait_for_function("!window.cassino3d.busy()", timeout=60_000)


def click_card(page, code):
    point = page.evaluate("(c) => window.cassino3d.screenPoint(c)", code)
    if point is None:
        raise AssertionError(f"no card {code} to click")
    page.mouse.click(point["x"], point["y"])


def table_cards(move):
    """The table cards a move uses, from its text: what a capture takes; the
    loose cards and the target of a build (`on X` names a card in it)."""
    words = move.split()
    if words[0] == "trail":
        return []
    if words[0] == "take":
        return words[2:]
    rest = words[3:]
    return [w for w in rest if w != "on"]


def check_faces(page, s, failures):
    """No face on a card the person could not know: their hand, the table,
    the sweep cards of the hand under way, and its count once it is over
    (the table review's Q3: checked at every rest, not once)."""
    known = {c["card"] for c in s["hand"]} | {c["card"] for i in s["table"] for c in i["cards"]}
    last = None
    for e in s["events"]:
        if e["hand"] != s["hand_number"]:
            continue
        if e["kind"] == "played":
            last = e
        if e["kind"] == "swept" and last:
            known.add(last["card"]["card"])
        if e["kind"] == "scored":
            for l in e["count"]["lines"]:
                if l["item"] == "ace":
                    known.add("A" + l["suit"])
                elif l["item"] == "big_casino":
                    known.add("TD")
                elif l["item"] == "little_casino":
                    known.add("2S")
    shown = set(page.evaluate("window.cassino3d.faces()"))
    if not shown <= known:
        failures.append(f"faces shown that the person cannot know: {sorted(shown - known)}")


def play_by_clicking(page, failures, moves_made):
    """One decision, made the way a person makes it."""
    settle(page)
    check_faces(page, page.evaluate("window.cassino3d.state()"), failures)
    for line in page.evaluate("window.cassino3d.said()"):
        HEARD.add(line["words"])
    s = page.evaluate("window.cassino3d.state()")
    if s["prompt"] in ("next_hand", "over"):
        if s["hand_number"] == 1:
            page.wait_for_timeout(500)
            shot(page, "t4-count")  # the HUD's popups under way
            # The last move seen again while the count's popups still play:
            # the HUD must still catch up (the second review, S1).
            page.evaluate("() => document.querySelector('md-icon-button.again-last').click()")
            settle(page)
        check_count(page, s, failures)
    if s["prompt"] == "next_hand":
        if s["hand_number"] == 1:
            page.locator(".hud-chev").click()
            page.wait_for_timeout(1200)
            shot(page, "t4-ledger")
            if page.locator(".hud-chev").get_attribute("aria-expanded") != "true":
                failures.append("the HUD's chevron did not open the ledger")
            page.locator(".hud-chev").click()
            page.wait_for_timeout(600)
        page.locator("md-filled-button.next").click()
        return True
    if s["prompt"] != "play":
        return False
    move = s["moves"][moves_made % len(s["moves"])]
    played = move.split()[1].split("=")[0] if move.split()[0] != "build" else move.split()[2]
    click_card(page, played)
    settle(page)
    # One card of each table item: a build is picked whole.
    items = {c["card"]: i["id"] for i in s["table"] for c in i["cards"]}
    done = set()
    for code in table_cards(move):
        if items[code] in done:
            continue
        done.add(items[code])
        click_card(page, code)
        settle(page)
    if moves_made in (6, 20):
        shot(page, f"t2-choosing-{moves_made}")
    chip = page.locator(f'md-assist-chip[data-move="{move}"]')
    if chip.count() != 1:
        failures.append(f"no chip for {move}; chips {page.evaluate('window.cassino3d.chips()')}")
        return False
    chip.click()
    return True


def check_replay(page, failures):
    """After the game, its replay with both hands face up: stepped forward,
    your opponent's cards shown; stepped back; and left, the game over as it
    was."""
    over = page.evaluate("window.cassino3d.state()")
    page.locator("md-outlined-button.replay").click()
    settle(page)
    r = page.evaluate("window.cassino3d.replay()")
    if not r or r["k"] != 0 or r["n"] < 10:
        failures.append(f"replay: did not start at the deal: {r}")
        return
    for _ in range(3):
        page.locator(".replay-next").click()
        settle(page)
    s = page.evaluate("window.cassino3d.state()")
    shown = set(page.evaluate("window.cassino3d.faces()"))
    mine = {c["card"] for c in s["hand"]} | {c["card"] for i in s["table"] for c in i["cards"]}
    if len(shown - mine) < s["opponent_holds"]:
        failures.append(f"replay: your opponent's hand is not face up ({len(shown - mine)} of {s['opponent_holds']})")
    shot(page, "t9-replay")
    page.locator(".replay-back").click()
    settle(page)
    if page.evaluate("window.cassino3d.replay()")["k"] != 2:
        failures.append("replay: back did not step back")
    # Driven from the keyboard too (the second review, S6).
    page.locator(".replay-next").focus()
    page.keyboard.press("Enter")
    settle(page)
    if page.evaluate("window.cassino3d.replay()")["k"] != 3:
        failures.append("replay: Enter on Next did not step")
    page.locator(".replay-back").click()
    settle(page)
    page.locator(".replay-leave").click()
    settle(page)
    back = page.evaluate("window.cassino3d.state()")
    if page.evaluate("window.cassino3d.replay()") is not None or back["saved"] != over["saved"]:
        failures.append("replay: leaving did not bring the finished game back")


def check_count(page, s, failures):
    """At the end of a hand, once the HUD's popups have played: it shows the
    game's totals, and its ledger has a counted hand for each hand played."""
    page.wait_for_function("window.cassino3d.hud().idle", timeout=30_000)
    hud = page.evaluate("window.cassino3d.hud()")
    totals = {"you": s["scores"]["you"], "opp": s["scores"]["them"]}
    if hud["totals"] != totals or hud["shown"] != totals:
        failures.append(f"hand {s['hand_number']}: the HUD shows {hud['shown']} (totals {hud['totals']}), the game is {totals}")
    counted = len([e for e in s["events"] if e["kind"] == "scored"])
    if hud["hands"] != counted:
        failures.append(f"hand {s['hand_number']}: the HUD's ledger has {hud['hands']} hands, {counted} were counted")


def check_badges(browser, failures):
    """The build values on: a build's badge stays in view while the cards
    move for a move that leaves it alone, and none shows with them off."""
    page = open_page(browser, "seed=1&skill=1&values", calm=True)
    for _ in range(30):
        settle(page)
        s = page.evaluate("window.cassino3d.state()")
        if s["prompt"] != "play":
            continue
        builds = [i for i in s["table"] if i.get("build")]
        trails = [m for m in s["moves"] if m.startswith("trail")]
        move = trails[0] if builds and trails else (sorted([m for m in s["moves"] if m.startswith("build")], key=lambda m: -len(m.split())) or s["moves"])[0]
        played = move.split()[1].split("=")[0] if move.split()[0] != "build" else move.split()[2]
        click_card(page, played)
        settle(page)
        items = {c["card"]: i["id"] for i in s["table"] for c in i["cards"]}
        for item in {items[code] for code in table_cards(move)}:
            code = next(c for c, i in items.items() if i == item)
            click_card(page, code)
            settle(page)
        # Pressed, then looked at frame by frame while the trail moves (the
        # badges are placed as each frame is drawn), until it lands.
        samples = page.evaluate(f"""() => new Promise((done) => {{
            document.querySelector('md-assist-chip[data-move="{move}"]').click();
            const seen = [];
            const look = () => {{
                const busy = window.cassino3d.busy();
                if (busy) seen.push(document.querySelectorAll('.badge').length);
                if (busy || seen.length === 0 && performance.now() - t0 < 500) requestAnimationFrame(look);
                else done(seen);
            }};
            const t0 = performance.now();
            requestAnimationFrame(look);
        }})""")
        if builds and trails:
            if not samples:
                failures.append("the trail beside a build did not move")
            elif min(samples) < len(builds):
                failures.append(f"a build's badge went out of view while a trail moved: {samples}, {len(builds)} builds")
            break
    else:
        failures.append("no build to watch the badges of")
    page.context.close()
    page = open_page(browser, "seed=1&skill=1&values=0", calm=True)
    settle(page)
    if page.locator(".badge").count():
        failures.append("badges shown with the build values off")
    page.context.close()


def check_trackers(browser, failures):
    """The trackers' panel: a header's tip shows when pointed at (nothing
    lies over the panel), and the panel folds to its heading and stays
    folded across a reload."""
    page = open_page(browser, "seed=7&speed=100", calm=True)
    settle(page)
    try:
        page.locator(".tracker-table thead th.spades").hover(timeout=5000)
        page.wait_for_timeout(200)
        tip = page.locator(".tip")
        if not tip.is_visible() or "Spades" not in tip.inner_text():
            failures.append("no tip on the trackers' Spades header")
    except Exception as e:  # something lies over the panel
        failures.append(f"the trackers' panel could not be pointed at: {str(e).splitlines()[0]}")
    page.locator(".aids-fold").click()
    page.wait_for_timeout(200)
    if page.locator(".tracker-table").is_visible():
        failures.append("the trackers' panel did not fold")
    page.reload()
    page.wait_for_function("window.cassino3d !== undefined", timeout=120_000)
    settle(page)
    if page.locator(".tracker-table").is_visible() or not page.locator(".aids-title").is_visible():
        failures.append("the trackers' panel did not stay folded across a reload")
    page.context.close()


def check_welcome(browser, failures):
    """The welcome on opening: the table held at the pack until a choice;
    the tutorial chosen turns the tutorial on, from its first page; with a
    game kept, Continue is offered and carries on with it."""
    page = open_page(browser, "welcome=1&tutorial")
    page.wait_for_timeout(1500)
    dialog = page.locator(".welcome-dialog")
    if not dialog.is_visible() or page.locator(".welcome-continue").count():
        failures.append("the welcome did not open, or offered to continue with no game kept")
        return
    if page.evaluate("window.cassino3d.state().events.length") and page.evaluate("window.cassino3d.said().length"):
        failures.append("the table talked behind the welcome")
    shot(page, "t10-welcome")
    page.locator(".welcome-tutorial").click()
    page.locator(".tutorial-dialog .tutorial-close").wait_for(state="visible", timeout=10_000)
    prefs = page.evaluate("window.cassino3d.prefs()")
    if not prefs["tutorial"] or prefs["seen"] not in ([], ["intro"]):
        failures.append(f"the tutorial chosen did not turn it on from its first page: {prefs['tutorial']}, {prefs['seen']}")
    page.locator(".tutorial-close").click()
    settle(page)
    page.reload()
    page.wait_for_timeout(1500)
    if not page.locator(".welcome-continue").is_visible():
        failures.append("no Continue offered with a game kept")
    else:
        saved = page.evaluate("window.cassino3d.state().saved")
        page.locator(".welcome-continue").click()
        page.wait_for_timeout(500)
        if page.evaluate("window.cassino3d.state().saved") != saved:
            failures.append("Continue did not carry on with the game kept")
    page.context.close()


def check_aid_toggles(browser, failures):
    """On a desktop, the hints and the explanations are toggled under the
    cards (on a phone, in the settings only): hints on lights a hint;
    explanations on opens the game log."""
    page = open_page(browser, "seed=7&speed=6", calm=True)
    settle(page)
    bar = page.locator(".aid-toggles")
    if not bar.is_visible():
        failures.append("no hint and explanation toggles under the cards")
        page.context.close()
        return
    bar.locator('[data-aid="hints"]').click()
    page.wait_for_timeout(300)
    settle(page)
    if not page.evaluate("window.cassino3d.state().aids.hints") or page.evaluate("window.cassino3d.hint()") is None:
        failures.append("the hints toggle did not turn hints on")
    bar.locator('[data-aid="explain"]').click()
    page.wait_for_timeout(300)
    if not page.evaluate("window.cassino3d.state().aids.explain") or not page.locator(".game-log").is_visible():
        failures.append("the explanations toggle did not turn them on and open the log")
    if not page.evaluate("window.cassino3d.prefs().aids.hints"):
        failures.append("the hints toggle was not kept in the settings")
    page.context.close()
    phone = open_page(browser, "seed=7&speed=6", viewport={"width": 390, "height": 844}, calm=True)
    settle(phone)
    if phone.locator(".aid-toggles").is_visible():
        failures.append("the hint and explanation toggles shown on a phone, where the settings hold them")
    phone.context.close()


def check_cheers(browser, failures):
    """The count celebrated on the table: a disc for each line scored, with
    four of its points bursting out of it."""
    page = open_page(browser, "seed=7&speed=100", calm=True)
    made = 0
    while True:
        settle(page)
        s = page.evaluate("window.cassino3d.state()")
        if s["prompt"] != "play":
            failures.append("no count reached to celebrate")
            break
        last = len(s["hand"]) == 1 and any(e["kind"] == "dealt" and e.get("last") for e in s["events"] if e["hand"] == s["hand_number"])
        play_by_clicking(page, failures, made)
        made += 1
        if last:
            seen = page.evaluate("""() => new Promise((done) => {
                const all = new Map(); const t0 = performance.now();
                const look = () => {
                    for (const c of window.cassino3d.cheers()) all.set(c.label, c.bursts);
                    if (performance.now() - t0 < 4000) setTimeout(look, 30); else done([...all]);
                };
                look();
            })""")
            labels = {label for label, _ in seen}
            if not labels or not labels <= {"Most cards", "Most spades", "Big Casino", "Little Casino", "Ace"}:
                failures.append(f"the count was not celebrated on the table: {seen}")
            if any(n != 4 for _, n in seen):
                failures.append(f"a celebration without its four bursts: {seen}")
            break
    page.context.close()


def check_tutorial(browser, failures):
    """The tutorial: the introduction as the game begins, holding the table;
    then, playing on, a page of the teaching ladder at its moment; and the
    question mark's pages at any time."""
    page = open_page(browser, "seed=7&speed=8&skill=2&tutorial=1")
    page.wait_for_function("window.cassino3d.tutorialOpen()", timeout=30_000)
    page.wait_for_timeout(1200)
    shot(page, "t7-intro")
    title = page.locator(".tutorial-title").inner_text()
    if title != "Cassino":
        failures.append(f"tutorial: the first page is {title!r}")
    page.locator(".tutorial-close").click()
    page.wait_for_timeout(800)
    ladder = {"Pairing", "Summing", "Building", "Raising a build", "Multiple builds"}
    seen = set()
    for n in range(24):
        # A page opens once the cards are still after a move.
        settle(page)
        if page.evaluate("window.cassino3d.pageDue()"):
            page.wait_for_function("window.cassino3d.tutorialOpen()", timeout=20_000)
        if page.evaluate("window.cassino3d.tutorialOpen()"):
            page.wait_for_timeout(800)
            seen.add(page.locator(".tutorial-title").inner_text())
            if len(seen) == 1:
                shot(page, "t7-ladder")
            page.locator(".tutorial-close").click()
            page.wait_for_timeout(800)
            continue
        if seen & ladder or not play_by_clicking(page, failures, n + 100):
            break
    if not seen & ladder:
        failures.append(f"tutorial: no page of the ladder came in play: {seen}")
    # The question mark: the pages at any time, Next paging on.
    if not page.evaluate("window.cassino3d.tutorialOpen()"):
        page.locator("md-icon-button.help").click()
        page.wait_for_timeout(1000)
    page.locator(".tutorial-next").click()
    page.wait_for_timeout(300)
    if page.locator(".tutorial-title").inner_text() == "Cassino":
        failures.append("tutorial: Next did not page on")
    if page.errors:
        failures.append(f"tutorial: console errors {page.errors[:5]}")


def check_phone(browser, failures):
    """A phone held upright: the stacked table framed between the HUD and
    the controls, decisions made by tapping, Large Text faces; and held
    sideways, between the HUD's column and the controls'."""
    page = open_page(browser, "seed=7&speed=8&skill=2&faces=jumbo", viewport={"width": 390, "height": 844})
    settle(page)
    if page.evaluate("window.cassino3d.facesShown()") != "jumbo":
        failures.append("phone: the Large Text faces are not shown")
    made = 0
    while made < 10 and play_by_clicking(page, failures, made + 200):
        made += 1
    settle(page)
    shot(page, "t8-phone")
    if made < 10:
        failures.append(f"phone: only {made} decisions made by tapping")
    if page.errors:
        failures.append(f"phone: console errors {page.errors[:5]}")
    # A tablet held upright, and a tall desktop window: the stacked table,
    # framed in a band the overlay truly leaves, and playable by tapping.
    for vp in ({"width": 768, "height": 1024}, {"width": 900, "height": 1100}):
        page = open_page(browser, "seed=7&speed=8&skill=2", viewport=vp)
        settle(page)
        strips = page.evaluate("window.cassino3d.strips()")
        band = vp["height"] - strips["top"] - strips["foot"]
        if band < 0.4 * vp["height"]:
            failures.append(f"upright {vp}: the table's band is {band} px ({strips})")
        made = 0
        while made < 4 and play_by_clicking(page, failures, made + 400):
            made += 1
        if made < 4:
            failures.append(f"upright {vp}: only {made} decisions made by tapping")
        shot(page, f"t8-upright-{vp['width']}")
    page = open_page(browser, "seed=7&speed=8&skill=2", viewport={"width": 844, "height": 390})
    settle(page)
    made = 0
    while made < 4 and play_by_clicking(page, failures, made + 300):
        made += 1
    settle(page)
    shot(page, "t8-phone-sideways")
    if page.errors:
        failures.append(f"phone sideways: console errors {page.errors[:5]}")


def check_settings(browser, failures):
    """The settings: hints and undo turned on in the dialog; a hint shown,
    lit and chosen; a move taken back; the sitting kept across a reload;
    the credits; and a watched game that plays itself."""
    page = open_page(browser, "skill=2&speed=8")
    settle(page)
    page.locator("md-icon-button.settings-open").click()
    page.wait_for_timeout(1500)
    shot(page, "t6-settings")
    page.locator('md-switch[data-aid="hints"]').click()
    page.locator('md-switch[data-pref="undo"]').click()
    page.locator(".settings-dialog md-filled-tonal-button", has_text="Done").click()
    page.wait_for_timeout(1200)
    settle(page)
    s = page.evaluate("window.cassino3d.state()")
    if s["prompt"] != "play":
        failures.append(f"settings: expected your turn, found {s['prompt']}")
        return
    hint = page.evaluate("window.cassino3d.hint()")
    if not hint or page.locator(".aid-line").inner_text().strip() != f"Hint: {hint['advice']}.":
        failures.append(f"settings: no hint shown with hints on: {hint}")
        return
    shot(page, "t6-hint")
    page.locator("md-icon-button.hint").click()
    settle(page)
    chip = page.locator(f'md-assist-chip[data-move="{hint["move"]}"]')
    if chip.count() != 1:
        failures.append(f"settings: the hint's move {hint['move']} is not offered once chosen: {page.evaluate('window.cassino3d.chips()')}")
        return
    before = len(s["events"])
    chip.click()
    settle(page)
    page.locator("md-icon-button.undo").click()
    settle(page)
    if len(page.evaluate("window.cassino3d.state()")["events"]) != before:
        failures.append("settings: undo did not take the move back")
    # A move made by clicking, then the page reloaded: the sitting the page
    # saved itself comes back (the table review's Q1).
    play_by_clicking(page, failures, 3)
    settle(page)
    made = page.evaluate("window.cassino3d.state()")
    page.reload()
    page.wait_for_function("window.cassino3d !== undefined", timeout=120_000)
    settle(page)
    back = page.evaluate("window.cassino3d.state()")
    if back["saved"] != made["saved"]:
        failures.append("settings: the sitting did not come back after a reload")
    if not page.evaluate("window.cassino3d.prefs()")["aids"]["hints"]:
        failures.append("settings: hints were not kept across the reload")
    # A move chosen from the keyboard (the table review's T15): the focus
    # on your hand, Enter chooses its card and the chips come; up to the
    # table; Escape lets go.
    settle(page)
    page.evaluate("document.activeElement && document.activeElement.blur()")
    page.keyboard.press("ArrowRight")
    told = page.locator(".focus-told").inner_text()
    page.keyboard.press("Enter")
    settle(page)
    chosen = page.evaluate("window.cassino3d.selection().chosen")
    if not chosen or "in your hand" not in told:
        failures.append(f"keyboard: Enter did not choose the focused card ({chosen!r}, told {told!r})")
    if not page.evaluate("window.cassino3d.chips()"):
        failures.append("keyboard: no chips for the card chosen")
    page.keyboard.press("ArrowUp")
    if "on the table" not in page.locator(".focus-told").inner_text():
        failures.append("keyboard: ArrowUp did not reach the table")
    page.keyboard.press("Escape")
    settle(page)
    if page.evaluate("window.cassino3d.selection().chosen"):
        failures.append("keyboard: Escape did not let go")
    # The game log opens at the first press, and shows what has happened
    # (the table review's T3).
    page.locator("md-icon-button.log-toggle").click()
    page.wait_for_timeout(300)
    if page.locator(".game-log").is_hidden() or page.locator(".game-log li").count() == 0:
        failures.append("settings: the game log did not open at the first press")
    page.locator("md-icon-button.log-toggle").click()
    page.wait_for_timeout(300)
    if not page.locator(".game-log").is_hidden():
        failures.append("settings: the game log did not close at the second press")
    page.locator("md-icon-button.settings-open").click()
    page.wait_for_timeout(400)
    page.locator(".settings-dialog md-text-button", has_text="Credits").click()
    page.wait_for_timeout(400)
    if "CC BY-SA 3.0" not in page.locator(".credits-dialog").inner_text():
        failures.append("settings: the credits do not credit the card back's licence")
    shot(page, "t6-credits")
    if page.errors:
        failures.append(f"settings: console errors {page.errors[:5]}")
    # Watched: it plays itself.
    page = open_page(browser, "watch&speed=30&seed=5&manual")
    start = len(page.evaluate("window.cassino3d.state()")["events"])
    for _ in range(80):  # the table's clock, moved by hand
        page.evaluate("window.cassino3d.tick(400)")
    w = page.evaluate("window.cassino3d.state()")
    if not w["watching"] or len(w["events"]) <= start + 10:
        failures.append(f"watch: the game did not play itself ({start} -> {len(w['events'])} events)")
    shot(page, "t6-watch")
    # Another watched game started while this one waits between moves
    # plays on too (the table review's T2).
    page.locator("md-icon-button.settings-open").click()
    page.wait_for_function("document.querySelector('.settings-dialog').open")
    page.locator(".settings-dialog md-outlined-button.watch").click()
    page.wait_for_function("!document.querySelector('.settings-dialog').open")
    start = len(page.evaluate("window.cassino3d.state()")["events"])
    for _ in range(80):
        page.evaluate("window.cassino3d.tick(400)")
    after = len(page.evaluate("window.cassino3d.state()")["events"])
    if after <= start + 10:
        failures.append(f"watch: a second watched game did not play ({start} -> {after} events)")
    if page.errors:
        failures.append(f"watch: console errors {page.errors[:5]}")


def strip(page, name, move, frames=16, step=150):
    """A capture chosen by clicking on a still table, then played out frame
    by frame on the table's own clock, the frames tiled into one image.
    Without a move, the opening deal."""
    if move:
        page.evaluate("window.cassino3d.skip()")
        words = move.split()
        for code in [words[1]] + table_cards(move):
            click_card(page, code)
            page.evaluate("window.cassino3d.skip()")
        chip = page.locator("md-assist-chip").filter(has_text="Take")
        chip.first.click()
    images = []
    for _ in range(frames):
        page.evaluate(f"window.cassino3d.tick({step})")
        img = canvas_image(page)
        w, h = img.size
        images.append(img.crop((0, int(0.12 * h), w, int(0.8 * h))).resize((w * 2 // 5, int(0.68 * h) * 2 // 5)))
    if SHOTS:
        cols = 4
        fw, fh = images[0].size
        sheet = Image.new("RGB", (fw * cols, fh * ((len(images) + cols - 1) // cols)), "white")
        for i, img in enumerate(images):
            sheet.paste(img, ((i % cols) * fw, (i // cols) * fh))
        SHOTS.mkdir(parents=True, exist_ok=True)
        sheet.save(SHOTS / f"{name}.png")


def quick() -> int:
    """A minute's smoke test (--quick), for before a commit that touches the
    table: the page loads offline with no error in the console, and a few
    decisions are made by clicking. The full run is the thorough one."""
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/chromium", args=["--use-angle=swiftshader", "--disable-gpu-compositing"])
        page = open_page(browser, "seed=7&speed=8")
        settle(page)
        made = 0
        while made < 4 and play_by_clicking(page, failures, made):
            made += 1
        if made < 4:
            failures.append(f"only {made} decisions made by clicking")
        check_offline(page, failures)
        if page.errors:
            failures.append(f"console errors: {page.errors[:5]}")
        browser.close()
    for f in failures:
        print("FAIL:", f)
    print("browser (quick): ok" if not failures else f"browser (quick): {len(failures)} failures")
    return 1 if failures else 0


def main() -> int:
    failures = []
    with sync_playwright() as p:
        # Software compositing: SwiftShader's GPU compositing of the
        # table's canvas starves CSS animations (the boxes' pop-in, the
        # dialogs) of frames in a headless browser.
        browser = p.chromium.launch(executable_path="/usr/bin/chromium", args=["--use-angle=swiftshader", "--disable-gpu-compositing"])
        page = open_page(browser, "seed=7&speed=6")
        # Played as the first game of a World Series, the best of seven.
        page.evaluate("localStorage.setItem('cassino.prefs', JSON.stringify({ match: 'best-of-7' }))")
        page.reload()
        page.wait_for_function("window.cassino3d !== undefined", timeout=120_000)
        settle(page)
        check_drawn(page, failures, "at the start")
        shot(page, "t1-table")
        meshes = page.evaluate("window.cassino3d.meshes()")
        if meshes != 52:
            failures.append(f"expected 52 cards on the table, found {meshes}")
        st = page.evaluate("window.cassino3d.state()")
        seen = {c["card"] for c in st["hand"]} | {c["card"] for i in st["table"] for c in i["cards"]}
        faces = set(page.evaluate("window.cassino3d.faces()"))
        if not faces <= seen:
            failures.append(f"faces shown that the person cannot see: {sorted(faces - seen)}")
        # A whole game, played by clicking.
        made = 0
        while play_by_clicking(page, failures, made) and made < 400:
            made += 1
            if made == 8:
                # The last move seen again: the cards move, the game does not.
                settle(page)
                before = page.evaluate("window.cassino3d.state().saved")
                # Clicked and looked at in one step: at this speed the move
                # is over before a separate look could see it.
                moved = page.evaluate("() => { document.querySelector('md-icon-button.again-last').click(); return window.cassino3d.busy(); }")
                settle(page)
                if not moved or page.evaluate("window.cassino3d.state().saved") != before:
                    failures.append("seeing the last move again did not replay it, or changed the game")
        end = page.evaluate("window.cassino3d.state()")
        if end["prompt"] != "over":
            failures.append(f"the game did not end by clicking: {end['prompt']} after {made} decisions")
        shot(page, "t2-over")
        series = page.evaluate("window.cassino3d.series()")
        if series["you"] + series["them"] != 1 or "Series:" not in page.locator(".prompt").inner_text():
            failures.append(f"the finished game was not counted in the series: {series}")
        check_replay(page, failures)
        if len(HEARD) < 5 or not any("ast" in w for w in HEARD):
            failures.append(f"too little said at the table: {sorted(HEARD)}")
        check_offline(page, failures)
        if page.errors:
            failures.append(f"console errors: {page.errors[:5]}")
        # The gather and the sweep, frame by frame (seeds found to open with
        # them: a pair and a sum taken with 9C; all four cards with 10C).
        check_settings(browser, failures)
        check_badges(browser, failures)
        check_trackers(browser, failures)
        check_welcome(browser, failures)
        check_aid_toggles(browser, failures)
        check_cheers(browser, failures)
        check_tutorial(browser, failures)
        check_phone(browser, failures)
        page = open_page(browser, "seed=11&skill=4&manual", calm=True)
        page.evaluate("window.cassino3d.tick(2500)")
        shot(page, "t5-talk")  # the house rules agreed before the deal
        said = page.evaluate("window.cassino3d.said()")
        if {line["who"] for line in said} != {"you", "them"}:
            failures.append(f"the house rules were not talked over: {said}")
        # A tap lands the cards and drops what is not yet said, but what is
        # said stays up its while (the table review's T4).
        page.mouse.click(640, 400)
        page.wait_for_timeout(600)
        if not page.evaluate("window.cassino3d.said()"):
            failures.append("a tap took the table talk down at once")
        page.evaluate("window.cassino3d.tick(3000)")
        strip(page, "t3-deal", None, frames=12, step=180)
        for name, query, move in [
            ("t3-gather", "seed=11&skill=4&manual&sweeps", "take 9C 6S 3H 9H"),
            ("t3-sweep", "seed=112&skill=4&manual&sweeps", "take TC 2S 3S 7D 8C"),
        ]:
            page = open_page(browser, query)
            strip(page, name, move)
            if page.errors:
                failures.append(f"console errors in {name}: {page.errors[:5]}")
            end = page.evaluate("window.cassino3d.state()")
            if not any(e["kind"] == "played" and e["move"].startswith("take") for e in end["events"]):
                failures.append(f"{name}: the capture was not made")
        browser.close()
    for f in failures:
        print("FAIL:", f)
    print("browser: ok" if not failures else f"browser: {len(failures)} failures")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(quick() if "--quick" in sys.argv else main())
