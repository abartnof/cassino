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
SHOTS = Path(sys.argv[1]) if len(sys.argv) > 1 else None
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


def play_by_clicking(page, failures, moves_made):
    """One decision, made the way a person makes it."""
    settle(page)
    for line in page.evaluate("window.cassino3d.said()"):
        HEARD.add(line["words"])
    s = page.evaluate("window.cassino3d.state()")
    if s["prompt"] in ("next_hand", "over"):
        if s["hand_number"] == 1:
            page.wait_for_timeout(500)
            shot(page, "t4-count")  # the HUD's popups under way
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
    # A move made, then the page reloaded: the sitting comes back.
    s = page.evaluate("window.cassino3d.state()")
    page.locator(f'md-assist-chip[data-move="{hint["move"]}"]').count()
    page.evaluate("(m) => window.cassino3d.engine.send(m)", s["moves"][0])
    made = page.evaluate("window.cassino3d.engine.state()")
    page.evaluate("() => localStorage.setItem('cassino.sitting', window.cassino3d.engine.state().saved)")
    page.reload()
    page.wait_for_function("window.cassino3d !== undefined", timeout=120_000)
    settle(page)
    back = page.evaluate("window.cassino3d.state()")
    if back["saved"] != made["saved"]:
        failures.append("settings: the sitting did not come back after a reload")
    if not page.evaluate("window.cassino3d.prefs()")["aids"]["hints"]:
        failures.append("settings: hints were not kept across the reload")
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


def main() -> int:
    failures = []
    with sync_playwright() as p:
        # Software compositing: SwiftShader's GPU compositing of the
        # table's canvas starves CSS animations (the boxes' pop-in, the
        # dialogs) of frames in a headless browser.
        browser = p.chromium.launch(executable_path="/usr/bin/chromium", args=["--use-angle=swiftshader", "--disable-gpu-compositing"])
        page = open_page(browser, "seed=7&speed=6")
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
        end = page.evaluate("window.cassino3d.state()")
        if end["prompt"] != "over":
            failures.append(f"the game did not end by clicking: {end['prompt']} after {made} decisions")
        shot(page, "t2-over")
        if len(HEARD) < 5 or not any("ast" in w for w in HEARD):
            failures.append(f"too little said at the table: {sorted(HEARD)}")
        check_offline(page, failures)
        if page.errors:
            failures.append(f"console errors: {page.errors[:5]}")
        # The gather and the sweep, frame by frame (seeds found to open with
        # them: a pair and a sum taken with 9C; all four cards with 10C).
        check_settings(browser, failures)
        check_tutorial(browser, failures)
        check_phone(browser, failures)
        page = open_page(browser, "seed=11&skill=4&manual", calm=True)
        page.evaluate("window.cassino3d.tick(2500)")
        shot(page, "t5-talk")  # the house rules agreed before the deal
        said = page.evaluate("window.cassino3d.said()")
        if {line["who"] for line in said} != {"you", "them"}:
            failures.append(f"the house rules were not talked over: {said}")
        page.evaluate("window.cassino3d.tick(3000)")
        strip(page, "t3-deal", None, frames=12, step=180)
        for name, query, move in [
            ("t3-gather", "seed=11&skill=4&manual", "take 9C 6S 3H 9H"),
            ("t3-sweep", "seed=112&skill=4&manual", "take TC 2S 3S 7D 8C"),
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
    sys.exit(main())
