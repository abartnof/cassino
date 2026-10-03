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
        check_count(page, s, failures)
    if s["prompt"] == "next_hand":
        if s["hand_number"] == 1:
            shot(page, "t4-count")
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
    """At the end of a hand: the sheet holds the count, line by line, and
    the score shows the new totals."""
    page.wait_for_function("window.cassino3d.sheet().total !== ''", timeout=20_000)
    sheet = page.evaluate("window.cassino3d.sheet()")
    scored = [e for e in s["events"] if e["kind"] == "scored" and e["hand"] == s["hand_number"]][-1]
    if len(sheet["lines"]) != len(scored["count"]["lines"]):
        failures.append(f"hand {s['hand_number']}: the sheet has {len(sheet['lines'])} lines, the count {len(scored['count']['lines'])}")
    scores = page.evaluate("window.cassino3d.scores()")
    if scores != s["scores"]:
        failures.append(f"hand {s['hand_number']}: the score shows {scores}, the game is {s['scores']}")


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
        browser = p.chromium.launch(executable_path="/usr/bin/chromium", args=["--use-angle=swiftshader"])
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
        page = open_page(browser, "seed=11&manual", calm=True)
        page.evaluate("window.cassino3d.tick(2500)")
        shot(page, "t5-talk")  # the house rules agreed before the deal
        said = page.evaluate("window.cassino3d.said()")
        if {line["who"] for line in said} != {"you", "them"}:
            failures.append(f"the house rules were not talked over: {said}")
        page.evaluate("window.cassino3d.tick(3000)")
        strip(page, "t3-deal", None, frames=12, step=180)
        for name, query, move in [
            ("t3-gather", "seed=11&manual", "take 9C 6S 3H 9H"),
            ("t3-sweep", "seed=112&manual", "take TC 2S 3S 7D 8C"),
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
