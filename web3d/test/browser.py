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
import json
import re
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / "web3d" / "cassino3d.html"
SHOTS = next((Path(a) for a in sys.argv[1:] if not a.startswith("--")), None)
LOCAL = ("file:", "data:", "blob:")
WORDS = json.loads((ROOT / "web3d" / "words.json").read_text())


def wordings(*groups):
    """Every way the phrase bank says these groups."""
    return {WORDS["texts"][k] for g in groups for k in WORDS["groups"][g]}


def said_as(heard, *groups):
    """The lines heard that are these groups' wordings, their {slots}
    filled with anything."""
    patterns = [re.compile("^" + re.sub(r"\\\{\w+\\\}", ".+", re.escape(w)) + "$", re.I) for w in wordings(*groups)]
    return {h for h in heard if any(p.match(h) for p in patterns)}


def shot(page, name):
    if SHOTS:
        SHOTS.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SHOTS / f"{name}.png"))


def open_page(browser, query="seed=7", viewport=None, calm=False, device=None):
    """A fresh context, offline, recording every request the page makes.
    `calm`: with reduced motion, so the dialogue boxes appear without their
    pop-in -- which headless Chromium on SwiftShader, with the table's WebGL
    busy, never starts (a bare page animates; the shipped page in a real
    browser does too, as piquet's has). `device`: more of the context's
    options (a touch screen, a user agent)."""
    context = browser.new_context(viewport=viewport or {"width": 1280, "height": 800}, reduced_motion="reduce" if calm else "no-preference", **(device or {}))
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
    # The seeds here were chosen for plain Cassino: it, unless a game is
    # named, or the default is what is tested ("nogame"; Royal Cassino
    # since the seventh play-testing).
    if "game=" not in query and "nogame" not in query:
        query += "&game=classic"
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
    chip = page.locator(f'.move-bar [data-move="{move}"]')
    if chip.count() != 1:
        failures.append(f"no chip for {move}; chips {page.evaluate('window.cassino3d.chips()')}")
        return False
    chip.click()
    return True


def check_no_replay(page, failures):
    """After the game, no replay with both hands face up (the seventh
    play-testing: "remove the option to replay a game with both hands
    visible"): only a new game is offered."""
    if page.locator(".replay, .replay-bar").count():
        failures.append("the game's end still offers the replay with both hands")
    if page.locator(".controls md-filled-button.again").is_hidden():
        failures.append("the game's end offers no new game")


def check_count(page, s, failures):
    """At the end of a hand, once the HUD's popups have played and the count
    has been told to its end: it shows the game's totals, and its ledger has
    a counted hand for each hand played. (The hand joins the ledger as its
    count's last line ends, which can be after the last popup: aces after a
    side's first are told in its one popup.)"""
    counted = len([e for e in s["events"] if e["kind"] == "scored"])
    try:
        page.wait_for_function("(n) => window.cassino3d.hud().idle && window.cassino3d.hud().hands >= n", arg=counted, timeout=30_000)
    except Exception:
        pass  # reported below
    hud = page.evaluate("window.cassino3d.hud()")
    totals = {"you": s["scores"]["you"], "opp": s["scores"]["them"]}
    if hud["totals"] != totals or hud["shown"] != totals:
        failures.append(f"hand {s['hand_number']}: the HUD shows {hud['shown']} (totals {hud['totals']}), the game is {totals}")
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
            document.querySelector('.move-bar [data-move="{move}"]').click();
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
    # Your opponent leads with a build (seed 11): its badge waits for the
    # deal to be played, not shown on a card still in the pack.
    page = open_page(browser, "seed=11&skill=3&values&manual", calm=True)
    early = []
    for _ in range(40):
        page.evaluate("window.cassino3d.tick(100)")
        if page.evaluate("window.cassino3d.busy()"):
            early.append(page.locator(".badge").count())
    if any(early):
        failures.append(f"a build's badge shown before its cards were dealt: {early}")
    page.context.close()


def check_score_fits(page, failures, where):
    """The HUD's scores whole at two digits (play-testing: a score past 9 was
    cut off at its right), within the HUD's row. Measured in DejaVu Sans,
    whose digits are wider than most (headless Chromium's own font is narrow
    enough to hide the fault)."""
    cut = page.evaluate("""() => [...document.querySelectorAll('.hud-num')].filter((n) => {
        const was = n.textContent;
        n.textContent = '28';
        n.style.fontFamily = '"DejaVu Sans"';
        const row = n.closest('.hud-block').getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(n);
        const r = range.getBoundingClientRect();
        const out = r.right > row.right + 0.5 || r.left < row.left - 0.5 || n.scrollWidth > n.clientWidth + 1;
        n.textContent = was;
        n.style.fontFamily = '';
        return out;
    }).length""")
    if cut:
        failures.append(f"{where}: a two-digit score is cut off in the HUD")


def check_trackers(browser, failures):
    """The trackers' panel: folded at first; a tap anywhere on its heading
    opens it; a header's tip shows when pointed at (nothing lies over the
    panel); it folds again by its chevron; and opened, it stays open across
    a reload."""
    page = open_page(browser, "seed=7&speed=100", calm=True)
    settle(page)
    if page.locator(".tracker-table").is_visible():
        failures.append("the trackers' panel is not folded at first")
    page.locator(".aids-title").click()
    page.wait_for_timeout(200)
    if not page.locator(".tracker-table").is_visible():
        failures.append("a tap on the trackers' heading did not open the panel")
    try:
        page.locator(".tracker-table thead th.spades").hover(timeout=5000)
        page.wait_for_timeout(200)
        tip = page.locator(".tip")
        if not tip.is_visible() or "most spades is worth 1 point" not in tip.inner_text():
            failures.append(f"no tip on the trackers' Spades header saying what it is worth: {tip.inner_text()!r}")
    except Exception as e:  # something lies over the panel
        failures.append(f"the trackers' panel could not be pointed at: {str(e).splitlines()[0]}")
    page.locator(".aids-fold").click()
    page.wait_for_timeout(200)
    if page.locator(".tracker-table").is_visible():
        failures.append("the trackers' panel did not fold")
    # Opened again, a choice kept across a reload.
    page.locator(".aids-head").click()
    page.wait_for_timeout(200)
    page.reload()
    page.wait_for_function("window.cassino3d !== undefined", timeout=120_000)
    settle(page)
    if not page.locator(".tracker-table").is_visible():
        failures.append("the trackers' panel did not stay open across a reload")
    page.context.close()


def deal_from_menu(page, choose=None):
    """The new game's menu, open: `choose(dialog)` sets what it should, and
    Deal starts the game."""
    dialog = page.locator(".new-game-dialog")
    dialog.locator("md-filled-button.deal").wait_for(state="visible", timeout=10_000)
    if choose:
        choose(dialog)
    dialog.locator("md-filled-button.deal").click()
    page.wait_for_function("!document.querySelector('.new-game-dialog').open")


def check_new_game(browser, failures):
    """The game's own settings in the new game's menu, not the settings
    (the seventh play-testing: "it's confusing that you can set royal
    casino to be on, but it isn't happening"): the plus opens it, put aside
    it changes nothing, and Deal starts a game with what it shows; "Raise
    builds" on by default (play-testing asked for the choice)."""
    page = open_page(browser, "seed=7&speed=100&nogame", calm=True)
    settle(page)
    page.locator("md-icon-button.settings-open").click()
    page.wait_for_timeout(1200)
    settings = page.locator(".settings-dialog")
    if settings.locator("md-switch[data-rule], .game-set, md-outlined-select.skill, md-outlined-select.match").count():
        failures.append("new game: the game's own settings are still in the settings")
    # Royal Cassino the default (the user).
    if settings.locator('md-switch[data-pref="tutorial"]').count():
        failures.append("new game: the tutorial's switch is still in the settings")
    if "This game: Royal Cassino," not in settings.locator(".game-line").inner_text():
        failures.append(f"new game: the settings do not say what game is under way: {settings.locator('.game-line').inner_text()!r}")
    settings.locator("md-filled-tonal-button", has_text="Done").click()
    page.wait_for_timeout(800)
    before = page.evaluate("window.cassino3d.state().saved")
    # Put aside: nothing changes.
    page.locator("md-icon-button.new-game").click()
    dialog = page.locator(".new-game-dialog")
    dialog.locator("md-filled-button.deal").wait_for(state="visible", timeout=10_000)
    shot(page, "t6-new-game")
    if not page.evaluate("document.querySelector('.new-game-dialog md-switch[data-rule=\"raising\"]').selected"):
        failures.append("new game: Raise builds is not on by default")
    dialog.locator('md-outlined-segmented-button[data-game="classic"]').click()
    dialog.locator(".new-game-cancel").click()
    page.wait_for_function("!document.querySelector('.new-game-dialog').open")
    if page.evaluate("window.cassino3d.state().saved") != before or page.evaluate("window.cassino3d.prefs().rules.game") != "royal":
        failures.append("new game: the menu put aside changed the game or the next one's rules")
    # Royal, its aces 1 or 14 already on (the user: "Aces being high or
    # low should be selected by default"), no raising: dealt so.
    page.locator("md-icon-button.new-game").click()
    if not page.evaluate("document.querySelector('.new-game-dialog md-switch[data-rule=\"aces14\"]').selected"):
        failures.append("new game: Royal's aces 1 or 14 not on by default")

    def royal(d):
        d.locator('md-switch[data-rule="raising"]').click()

    deal_from_menu(page, royal)
    settle(page)
    rules = page.evaluate("window.cassino3d.state().rules")
    if rules != {"game": "royal", "aces14": True, "sweeps": False, "raising": False}:
        failures.append(f"new game: dealt with {rules}, not Royal with aces 1 or 14 and no raising")
    page.locator("md-icon-button.settings-open").click()
    page.wait_for_timeout(1200)
    if "This game: Royal Cassino, aces 1 or 14" not in page.locator(".settings-dialog .game-line").inner_text():
        failures.append(f"new game: the settings do not say Royal is under way: {page.locator('.settings-dialog .game-line').inner_text()!r}")
    page.locator(".settings-dialog md-filled-tonal-button", has_text="Done").click()
    page.wait_for_timeout(800)
    # The next menu starts from the game just played (the user: "make the
    # new game settings, consistent with their previous game settings").
    page.locator("md-icon-button.new-game").click()
    page.locator(".new-game-dialog md-filled-button.deal").wait_for(state="visible", timeout=10_000)
    shown = page.evaluate("""() => {
      const d = document.querySelector('.new-game-dialog');
      return [[...d.querySelectorAll('md-outlined-segmented-button')].find((b) => b.selected)?.dataset.game, d.querySelector('md-switch[data-rule="aces14"]').selected, d.querySelector('md-switch[data-rule="raising"]').selected,
        [...d.querySelectorAll('md-outlined-segmented-button')].map((b) => b.getAttribute('label'))];
    }""")
    if shown != ["royal", True, False, ["Royal Cassino", "Cassino"]]:
        failures.append(f"new game: the menu does not start from the last game, Royal Cassino left of Cassino: {shown}")
    page.locator(".new-game-dialog .new-game-cancel").click()
    if page.errors:
        failures.append(f"new game: console errors {page.errors[:5]}")
    page.context.close()


def check_welcome(browser, failures):
    """The page opens on the new game's menu, the one window (the user: "I
    asked for one new game window and this is two ... put tutorial mode as
    an option within the new game config"): the table held at the pack
    behind it; the game and the tutorial chosen there, the tutorial then
    from its first page; and with a game kept, Continue carries on with it."""
    page = open_page(browser, "welcome=1&tutorial=0")
    page.wait_for_timeout(1500)
    dialog = page.locator(".new-game-dialog")
    if not dialog.is_visible() or dialog.locator(".continue, .new-game-cancel").count() or page.locator(".welcome-dialog").count():
        failures.append("opening: the new game's menu did not open alone, or offered to continue or cancel with no game kept")
        page.context.close()
        return
    if page.evaluate("window.cassino3d.state().events.length") and page.evaluate("window.cassino3d.said().length"):
        failures.append("opening: the table talked behind the menu")
    shot(page, "t10-welcome")

    def tutorial_royal(d):
        d.locator('md-switch[data-pref="tutorial"]').click()
        d.locator('md-outlined-segmented-button[data-game="royal"]').click()

    deal_from_menu(page, tutorial_royal)
    page.locator(".tutorial-dialog .tutorial-close").wait_for(state="visible", timeout=10_000)
    prefs = page.evaluate("window.cassino3d.prefs()")
    if not prefs["tutorial"] or prefs["seen"] not in ([], ["intro"]):
        failures.append(f"opening: the tutorial chosen did not turn it on from its first page: {prefs['tutorial']}, {prefs['seen']}")
    if page.evaluate("window.cassino3d.state().rules.game") != "royal":
        failures.append(f"opening: not dealt the game chosen: {page.evaluate('window.cassino3d.state().rules')}")
    page.locator(".tutorial-close").click()
    settle(page)
    page.reload()
    page.wait_for_timeout(1500)
    if not page.locator(".new-game-dialog .continue").is_visible():
        failures.append("opening: no Continue offered with a game kept")
    else:
        saved = page.evaluate("window.cassino3d.state().saved")
        page.locator(".new-game-dialog .continue").click()
        page.wait_for_timeout(500)
        if page.evaluate("window.cassino3d.state().saved") != saved:
            failures.append("opening: Continue did not carry on with the game kept")
    if page.errors:
        failures.append(f"opening: console errors {page.errors[:3]}")
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
    # The lesser aid first (play-testing: explanations tell less than hints,
    # so they sit to the left), and so in the settings.
    order = page.evaluate("[...document.querySelectorAll('.aid-toggles [data-aid]')].map((b) => b.dataset.aid)")
    listed = page.evaluate("[...document.querySelectorAll('md-switch[data-aid]')].map((b) => b.dataset.aid)")
    if order != ["explain", "hints"] or listed[:2] != ["explain", "hints"]:
        failures.append(f"explanations not before hints: under the cards {order}, in the settings {listed}")
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
            # And nothing said while the count is told (the sixth
            # play-testing: "Remove the dialog balloons during scoring, and
            # let the pop-ups do the work").
            seen, spoken = page.evaluate("""() => new Promise((done) => {
                const all = new Map(); const said = new Set(); const t0 = performance.now();
                const look = () => {
                    const cheers = window.cassino3d.cheers();
                    for (const c of cheers) all.set(c.label, c.bursts);
                    if (cheers.length) for (const l of window.cassino3d.said()) said.add(l.words);
                    if (performance.now() - t0 < 4000) setTimeout(look, 30); else done([[...all], [...said]]);
                };
                look();
            })""")
            if spoken:
                failures.append(f"said while the count was told: {spoken}")
            labels = {label for label, _ in seen}
            if not labels or not labels <= {"Most cards", "Most spades", "Big Cassino", "Little Cassino", "Ace"}:
                failures.append(f"the count was not celebrated on the table: {seen}")
            if any(n != 4 for _, n in seen):
                failures.append(f"a celebration without its four bursts: {seen}")
            break
    page.context.close()


def check_talk(browser, failures):
    """The opening: the cards dealt while the house rules are still being
    agreed, and what one speaker says at once said in one box; and quiet,
    nothing."""
    page = open_page(browser, "seed=7&manual&game=royal", calm=True)
    start = page.evaluate("window.cassino3d.state()")
    hand = {c["card"] for c in start["hand"]}
    # Your opponent's first move, when the game opens with it, comes only
    # once the opening's talk is said (play-testing: "Your deal." came after
    # they had played).
    first = next((e["card"]["card"] for e in start["events"] if e["kind"] == "played"), None)
    answered_at = played_at = None
    theirs, dealt_at, after = set(), None, set()
    for k in range(120):
        page.evaluate("window.cassino3d.tick(100)")
        said = page.evaluate("window.cassino3d.said()")
        if answered_at is None and any(l["who"] == "you" for l in said):
            answered_at = k
        if played_at is None and first and dealt_at is not None and first in page.evaluate("window.cassino3d.faces()"):
            played_at = k
        boxes = {(l["who"], l["words"]) for l in said}
        if dealt_at is None and set(page.evaluate("window.cassino3d.faces()")) & hand:
            dealt_at, before = k, boxes
        elif dealt_at is not None:
            after |= boxes - before
        theirs |= {l["words"] for l in said if l["who"] == "them"}
        spill = page.evaluate("[...document.querySelectorAll('.dialogue')].filter((d) => d.scrollWidth > d.clientWidth + 1).map((d) => d.textContent)")
        if spill:
            failures.append(f"words past their box's edge: {spill[0]}")
            break
    if dealt_at is None or not after:
        failures.append("the deal waited for the house rules to be agreed")
    if first and (played_at is None or answered_at is None or played_at < answered_at):
        failures.append(f"your opponent played (at {played_at}) before the opening's talk was said (answered at {answered_at})")
    # Royal: the cut seen, your opponent says low deals and whose deal it is
    # at once; as the deal begins, asks about sweeps; and after your answer
    # says Royal's rule: three boxes, not one a line.
    if len(theirs) != 3:
        failures.append(f"your opponent's lines at one moment were not said as one: {sorted(theirs)}")
    page.evaluate("localStorage.setItem('cassino.prefs', JSON.stringify({ talk: 'none' }))")
    page.reload()
    page.wait_for_function("window.cassino3d !== undefined", timeout=120_000)
    heard = []
    for _ in range(30):
        page.evaluate("window.cassino3d.tick(200)")
        heard += page.evaluate("window.cassino3d.said()")
    if heard:
        failures.append(f"talk set to quiet, but said: {heard[:2]}")
    page.context.close()
    # Everything said (play-testing: "VERY verbose"): the moves remarked as
    # they are made, and your opponent, kept waiting, says so.
    page = open_page(browser, "seed=7&speed=2&idle=1500", calm=True)
    page.evaluate("""() => { window.heardAll = new Set();
        setInterval(() => { for (const l of window.cassino3d.said()) window.heardAll.add(l.words); }, 40); }""")
    made = 0
    while made < 4 and play_by_clicking(page, failures, made + 500):
        made += 1
    settle(page)
    page.wait_for_timeout(3000)
    heard = set(page.evaluate("[...window.heardAll]"))
    remarks = ("trail", "trail-ace", "trail-fresh", "trail-again", "take-pair", "take-sum", "take-trailed", "take-at-last", "build-reply",
               "build-on-mine", "build-more-reply", "joined-mine", "think", "think-take", "take-own", "own-build-reply", "take-theirs")
    if len(said_as(heard, *remarks)) < 3:
        failures.append(f"the moves were not remarked: {sorted(heard)}")
    if not heard & wordings("idle"):
        failures.append(f"your opponent, kept waiting, said nothing: {sorted(heard)}")
    # Kept waiting, then your move: your opponent follows it up (the seventh
    # play-testing: "i said X, then Y, so I'll follow up on X").
    if play_by_clicking(page, failures, 600):
        settle(page)
        page.wait_for_timeout(2500)
        heard = set(page.evaluate("[...window.heardAll]"))
        # Said with their move's own words, in one box.
        if not any(w in h for h in heard for w in wordings("waited-take", "waited-other")):
            failures.append(f"your move, after the wait remarked, was not followed up: {sorted(heard)}")
    if page.errors:
        failures.append(f"console errors with everything said: {page.errors[:5]}")
    page.context.close()


def check_ending(browser, failures):
    """The game's end (?ending: a game taken to your last card): you play
    it, the camera pulls back and your opponent stands across the table as a
    court card, saying the last words; the arrows step through the endings;
    a new game brings the play's eye back."""
    page = open_page(browser, "ending&speed=2", calm=True)
    settle(page)
    if page.evaluate("window.cassino3d.state().prompt") != "play":
        failures.append("ending: not staged at your last decision")
        page.context.close()
        return
    play_by_clicking(page, failures, 0)
    try:
        page.wait_for_function("window.cassino3d.state().prompt === 'over' && window.cassino3d.opponent().revealed === 1", timeout=60_000)
        page.wait_for_function("window.cassino3d.said().some((l) => l.who === 'them')", timeout=15_000)
    except Exception:
        failures.append(f"ending: no reveal, or your opponent said nothing: {page.evaluate('window.cassino3d.opponent()')}")
        page.context.close()
        return
    shot(page, "t11-ending")
    # Losing, the court card's last word (play-testing).
    if not page.evaluate("window.cassino3d.state().events.findLast((e) => e.kind === 'game_ends').you_won"):
        try:
            page.wait_for_function("window.cassino3d.said().some((l) => l.who === 'them' && l.words === 'You are quite normal.')", timeout=20_000)
        except Exception:
            failures.append(f"ending: lost, and your opponent did not say you are quite normal: {page.evaluate('window.cassino3d.said()')}")
    before = page.evaluate("window.cassino3d.opponent()")
    page.locator(".endings-step").nth(1).click()
    page.wait_for_timeout(1500)
    after = page.evaluate("window.cassino3d.opponent()")
    if not before["court"] or not after["ending"] or after["ending"] == before["ending"]:
        failures.append(f"ending: the arrows did not step to another ending: {before} then {after}")
    page.locator("md-filled-button.again").click()
    deal_from_menu(page)
    settle(page)
    if page.evaluate("window.cassino3d.opponent()")["revealed"] is not None:
        failures.append("ending: a new game kept the camera pulled back")
    if page.errors:
        failures.append(f"ending: console errors {page.errors[:5]}")
    page.context.close()


def check_move_bar(browser, failures):
    """The move bar, always there on your turn: Take, Build and Trail dimmed
    with nothing chosen, lit by a choice, and between the table and your
    hand, on a desktop and on a phone held upright; each in its place."""
    for viewport in ({"width": 1280, "height": 800}, {"width": 390, "height": 844}, {"width": 844, "height": 390}):
        check_move_bar_at(browser, failures, viewport)
        check_split_place(browser, failures, viewport)


def check_split_place(browser, failures, viewport):
    """Two moves of a kind share its place (seed 85 opens with A♠ and 3♥ 4♦
    making builds of 4s and of 8): the places stay put, and each move's
    words fit its button."""
    where = f"{viewport['width']}x{viewport['height']}"
    page = open_page(browser, "seed=85&skill=1&speed=6", viewport=viewport, calm=True)
    settle(page)
    places = page.evaluate(PLACES_JS)
    for code in ("AS", "3H", "4D"):
        click_card(page, code)
        settle(page)
    if page.evaluate("window.cassino3d.chips()") != ["Build 4s", "Build 8"]:
        failures.append(f"{where}: seed 85's two builds not offered: {page.evaluate('window.cassino3d.chips()')}")
    if page.evaluate(PLACES_JS) != places:
        failures.append(f"{where}: two builds moved the places: {places} then {page.evaluate(PLACES_JS)}")
    over = page.evaluate("""() => [...document.querySelectorAll('.move-bar md-filled-button')].filter((b) => {
      const label = b.shadowRoot.querySelector('.label');
      return label.scrollWidth > b.shadowRoot.querySelector('button').clientWidth - 2;
    }).map((b) => b.textContent)""")
    if over:
        failures.append(f"{where}: labels wider than their buttons, two builds sharing a place: {over}")
    shot(page, f"t2-move-bar-split-{where}")
    page.context.close()


PLACES_JS = """() => Object.fromEntries([...document.querySelectorAll('.move-bar .place')].map((e) => {
  const r = e.getBoundingClientRect();
  return [e.dataset.kind, [Math.round(r.left), Math.round(r.width)]];
}))"""


def check_move_bar_at(browser, failures, viewport):
    where = f"{viewport['width']}x{viewport['height']}"
    page = open_page(browser, "seed=2&skill=1&speed=6", viewport=viewport, calm=True)
    settle(page)
    chips = page.locator(".move-bar md-filled-button")
    labels = [chips.nth(i).inner_text().strip() for i in range(chips.count())]
    # The moves least made at the left, the most at the right (the user,
    # from how often each is made: selection.js BAR_ORDER).
    if labels != ["Build", "Take", "Trail"] or page.evaluate("window.cassino3d.chips()"):
        failures.append(f"{where}: the move bar with nothing chosen: {labels}, lit {page.evaluate('window.cassino3d.chips()')}")
    # Every place there from the start, and none moving as a choice is made
    # (play-testing: "have all possible buttons up, so the user doesn't have
    # to constantly wonder if the buttons are in the right place"); no
    # running sum (the seventh play-testing: "remove the sum button").
    places = page.evaluate(PLACES_JS)
    if sorted(places) != ["build", "take", "trail"] or page.locator(".move-bar .sum").count():
        failures.append(f"{where}: the move bar's places with nothing chosen: {places}")
    s = page.evaluate("window.cassino3d.state()")
    build = next((m for m in s["moves"] if m.startswith("build")), None)
    if build:
        click_card(page, build.split()[2])
        settle(page)
        for code in [w for w in build.split()[3:] if w != "on"][:1]:
            click_card(page, code)
            settle(page)
        if page.evaluate(PLACES_JS) != places:
            failures.append(f"{where}: the move bar's places moved as a move was chosen: {places} then {page.evaluate(PLACES_JS)}")
        click_card(page, build.split()[2])  # let it go
        settle(page)
    trail = next(m for m in s["moves"] if m.startswith("trail"))
    card = trail.split()[1]
    click_card(page, card)
    settle(page)
    if "Trail" not in page.evaluate("window.cassino3d.chips()"):
        failures.append(f"{where}: choosing a card did not light Trail")
    if page.evaluate(PLACES_JS) != places:
        failures.append(f"{where}: the move bar's places moved as a card was chosen: {places} then {page.evaluate(PLACES_JS)}")
    bar = page.locator(".move-bar").bounding_box()
    table_y = max(page.evaluate("(c) => window.cassino3d.screenPoint(c).y", c["card"]) for i in s["table"] for c in i["cards"])
    hand_y = min(page.evaluate("(c) => window.cassino3d.screenPoint(c).y", c["card"]) for c in s["hand"] if c["card"] != card)
    if not page.evaluate("document.documentElement.classList.contains('sideways')"):
        if not (table_y < bar["y"] and bar["y"] + bar["height"] < hand_y):
            failures.append(f"{where}: the move bar is not between the table and your hand: {bar}, table at {table_y}, hand at {hand_y}")
    if bar["x"] < 0 or bar["x"] + bar["width"] > viewport["width"]:
        failures.append(f"{where}: the move bar runs off the screen: {bar}")
    # Every label inside its button, with a little to spare: a label wider
    # than its room is cut short with an ellipsis.
    over = page.evaluate("""() => [...document.querySelectorAll('.move-bar md-filled-button')].filter((b) => {
      const label = b.shadowRoot.querySelector('.label');
      return label.scrollWidth > b.shadowRoot.querySelector('button').clientWidth - 2;
    }).map((b) => b.textContent)""")
    if over:
        failures.append(f"{where}: labels wider than their buttons: {over}")
    # A faint outline round each move's button (play-testing), lit or not.
    lines = page.evaluate("""() => [...document.querySelectorAll('.move-bar md-filled-button')].map((b) => {
      const s = getComputedStyle(b);
      return [b.dataset.kind, s.outlineStyle, parseFloat(s.outlineWidth), s.outlineColor];
    })""")
    for kind, style, width, colour in lines:
        alpha = float(colour.rsplit(",", 1)[1].strip(" )")) if colour.startswith("rgba") else 1.0
        if not (style == "solid" and width >= 1 and 0 < alpha <= 0.4):
            failures.append(f"{where}: the {kind} has no faint outline: {style} {width} {colour}")
    shot(page, f"t2-move-bar-{where}")
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
    ladder = {"Taking a match", "Taking cards that add up", "Building", "Raising a build", "Multiple builds"}
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
    check_score_fits(page, failures, "phone")
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
    check_score_fits(page, failures, "phone sideways")
    made = 0
    while made < 4 and play_by_clicking(page, failures, made + 300):
        made += 1
    settle(page)
    shot(page, "t8-phone-sideways")
    if page.errors:
        failures.append(f"phone sideways: console errors {page.errors[:5]}")


def check_desktop_frame(browser, failures):
    """Across the table (the sixth play-testing: "too much white space on
    the screen (desktop mode) - try to make the hand and the cards on the
    table bigger"): the table's cards a seventh of the window's height; your
    hand clear of the controls' strip, the hints' line shown too; the hints
    and explanations at the window's bottom right, clear of the prompt; and
    your opponent's words beside their hand, not over the table."""
    for vp in ({"width": 1440, "height": 900}, {"width": 1366, "height": 650}):
        where = f"{vp['width']}x{vp['height']}"
        page = open_page(browser, "seed=7&speed=6&skill=1", viewport=vp, calm=True)
        settle(page)
        middle = page.evaluate("window.cassino3d.zoneBounds('middle')")
        if middle["bottom"] - middle["top"] < vp["height"] / 7 - 2:
            failures.append(f"{where}: the table's cards {middle['bottom'] - middle['top']:.0f} px tall")
        page.locator('.aid-toggles [data-aid="hints"]').click()
        page.wait_for_timeout(300)
        settle(page)
        if not page.locator(".controls .aid-line").is_visible():
            failures.append(f"{where}: no hint shown under the prompt with hints on")
        hand = page.evaluate("window.cassino3d.zoneBounds('your-hand')")
        lines = page.evaluate("""() => [...document.querySelectorAll('.controls .prompt, .controls .note, .controls .aid-line')]
            .filter((e) => !e.hidden && e.textContent.trim()).map((e) => e.getBoundingClientRect().top)""")
        if lines and hand["bottom"] > min(lines) + 1:
            failures.append(f"{where}: your hand (to {hand['bottom']:.0f} px) runs under the controls' words (from {min(lines):.0f} px)")
        toggles = page.locator(".aid-toggles").bounding_box()
        if toggles["x"] + toggles["width"] < vp["width"] - 40 or toggles["y"] + toggles["height"] < vp["height"] - 40:
            failures.append(f"{where}: the hints and explanations not at the bottom right: {toggles}")
        prompt = page.locator(".controls .prompt").bounding_box()
        if prompt and prompt["x"] + prompt["width"] > toggles["x"] and prompt["y"] + prompt["height"] > toggles["y"]:
            failures.append(f"{where}: the prompt runs under the toggles: {prompt}, {toggles}")
        # Every box your opponent says beside their hand, as it is said.
        page.evaluate("""() => { window.theirBoxes = [];
            setInterval(() => { for (const d of document.querySelectorAll('.dialogue.them')) {
              const hand = window.cassino3d.zoneBounds('their-hand'); if (!hand) continue;
              const r = d.getBoundingClientRect();
              window.theirBoxes.push({ words: d.textContent, left: r.left, right: r.right, middle: (r.top + r.bottom) / 2, hand });
            } }, 50); }""")
        made = 0
        while made < 4 and play_by_clicking(page, failures, made + 600):
            made += 1
        settle(page)
        boxes = page.evaluate("window.theirBoxes")
        if not boxes:
            failures.append(f"{where}: your opponent said nothing to check")
        for b in boxes:
            h = b["hand"]
            beside = b["left"] >= h["right"] - 2 or b["right"] <= h["left"] + 2
            level = max(h["top"], 0) - 2 <= b["middle"] <= h["bottom"] + 2
            if not (beside and level):
                failures.append(f"{where}: your opponent's \"{b['words']}\" not beside their hand: {b}")
                break
        page.context.close()


def check_phone_room(browser, failures):
    """On a phone held upright, in the window a browser leaves it (390 by 664,
    Safari's on an iPhone), the table has the room (the sixth play-testing:
    the table's cards "still too small to read"): the top strip no more
    than the score, "Captured this hand" folded into it (the score's
    chevron shows the trackers with the hand-by-hand scores), the prompt
    one line, and a table card at least 55 px tall."""
    page = open_page(browser, "seed=2&speed=6&skill=1&faces=jumbo", viewport={"width": 390, "height": 664}, calm=True, device={"has_touch": True, "is_mobile": True})
    settle(page)
    strips = page.evaluate("window.cassino3d.strips()")
    if strips["top"] > 125 or strips["foot"] > 125:
        failures.append(f"upright phone: the strips take {strips['top']:.0f} px above the table and {strips['foot']:.0f} below")
    if page.locator(".aids-panel").is_visible():
        failures.append("upright phone: \"Captured this hand\" shown apart from the score")
    card = page.evaluate("window.cassino3d.cardRects('middle')")[0]
    if card["bottom"] - card["top"] < 55:
        failures.append(f"upright phone: a table card {card['bottom'] - card['top']:.0f} px tall")
    prompt = page.locator(".controls .prompt").bounding_box()
    if prompt["height"] > 26:
        failures.append(f"upright phone: the prompt runs to more than a line: {prompt}")
    page.locator(".hud-chev").click()
    page.wait_for_timeout(600)
    if not page.locator(".tracker-table").is_visible():
        failures.append("upright phone: the score's chevron did not show the trackers")
    page.locator(".hud-chev").click()
    page.wait_for_timeout(600)
    if page.locator(".tracker-table").is_visible():
        failures.append("upright phone: the trackers stayed with the score folded")
    if page.errors:
        failures.append(f"upright phone: console errors {page.errors[:3]}")
    page.context.close()


def check_phone_talk(browser, failures):
    """On a phone, held either way, what is said never covers the cards (the
    sixth play-testing: "in mobile mode, the dialog balloons can completely
    obscure the cards, so you can't play until they go away"): no box over a
    table card, a card in your hand, or the move bar, as each is said."""
    for vp in ({"width": 390, "height": 844}, {"width": 844, "height": 390}):
        where = f"{vp['width']}x{vp['height']}"
        page = open_page(browser, "seed=7&speed=6&skill=1", viewport=vp, calm=True)
        page.evaluate("""() => { window.covered = []; window.boxesSeen = 0;
            setInterval(() => {
              const cards = [...window.cassino3d.cardRects('middle'), ...window.cassino3d.cardRects('your-hand')];
              const bar = document.querySelector('.move-bar');
              const keep = bar && !bar.hidden ? [...bar.querySelectorAll('md-filled-button')].map((b) => b.getBoundingClientRect()) : [];
              for (const d of document.querySelectorAll('.dialogue:not(.leaving)')) {
                window.boxesSeen++;
                const r = d.getBoundingClientRect();
                const over = (c) => r.left < c.right - 1 && r.right > c.left + 1 && r.top < c.bottom - 1 && r.bottom > c.top + 1;
                if (cards.some(over) || keep.some(over)) window.covered.push(d.textContent);
              }
            }, 50); }""")
        made = 0
        while made < 6 and play_by_clicking(page, failures, made + 700):
            made += 1
        settle(page)
        page.wait_for_timeout(1500)
        if not page.evaluate("window.boxesSeen"):
            failures.append(f"{where}: nothing said to check")
        covered = page.evaluate("[...new Set(window.covered)]")
        if covered:
            failures.append(f"{where}: said over the cards or the move bar: {covered[:4]}")
        page.context.close()


IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"


def check_tablet_faces(browser, failures):
    """Large Text by default on a tablet (play-testing: "on an ipad, default
    to large-view cards"), an iPad's Safari saying it is a Mac with touch;
    the classic faces on a computer."""
    for name, device, want in (
        ("an iPad", {"user_agent": IPAD, "has_touch": True}, "jumbo"),
        ("an Android tablet", {"has_touch": True, "is_mobile": True}, "jumbo"),
        ("a computer", None, "classic"),
    ):
        page = open_page(browser, "seed=7&speed=8", viewport={"width": 1180, "height": 820}, device=device)
        settle(page)
        if page.evaluate("window.cassino3d.facesShown()") != want:
            failures.append(f"{name}: faces {page.evaluate('window.cassino3d.facesShown()')} by default, not {want}")
        page.context.close()


WATCH_STILL_JS = """() => {
  const s = window.cassino3d.state();
  const code = s.table[0].cards[0].card;
  const from = window.cassino3d.screenPoint(code);
  const strips = JSON.stringify(window.cassino3d.strips());
  window.moved = [];
  window.watching = true;
  const watch = () => {
    if (!window.watching) return;
    const p = window.cassino3d.screenPoint(code);
    if (Math.hypot(p.x - from.x, p.y - from.y) > 0.5) window.moved.push(`${code} moved ${(p.x - from.x).toFixed(1)}, ${(p.y - from.y).toFixed(1)} px`);
    const now = JSON.stringify(window.cassino3d.strips());
    if (now !== strips) window.moved.push(`strips ${strips} became ${now}`);
    requestAnimationFrame(watch);
  };
  requestAnimationFrame(watch);
}"""


def check_still(browser, failures):
    """The table holds still while cards are chosen, on a tablet and a phone
    held upright (the seventh play-testing: "at least on iPad, the camera is
    often slightly moving when I'm selecting cards, and it's nauseating"),
    and while the score's hand-by-hand ledger is open, which lies over the
    table instead of shrinking it ("The hud shouldn't shrink everything, it
    should just overlap it")."""
    for viewport in ({"width": 820, "height": 1180}, {"width": 390, "height": 844}):
        where = f"{viewport['width']}x{viewport['height']}"
        page = open_page(browser, "seed=7&speed=2", viewport=viewport, device={"user_agent": IPAD, "has_touch": True})
        settle(page)
        page.wait_for_timeout(1500)
        s = page.evaluate("window.cassino3d.state()")
        if s["prompt"] != "play" or not s["table"]:
            failures.append(f"still {where}: not your turn with a table to watch ({s['prompt']})")
            page.context.close()
            continue
        page.evaluate(WATCH_STILL_JS)
        hand = [c["card"] for c in s["hand"]]
        for code in hand[:2]:
            click_card(page, code)  # chosen: it lifts, and the prompt changes
            page.wait_for_timeout(900)
            click_card(page, code)  # let go
            page.wait_for_timeout(900)
        # A table card tapped with nothing chosen: the note says why not.
        click_card(page, s["table"][-1]["cards"][-1]["card"])
        page.wait_for_timeout(900)
        page.locator(".hud-chev").click()
        page.wait_for_timeout(1200)
        page.locator(".hud-chev").click()
        page.wait_for_timeout(1200)
        moved = page.evaluate("window.watching = false, window.moved")
        if moved:
            failures.append(f"still {where}: the table moved as cards were chosen or the score opened: {moved[:3]} ({len(moved)} frames)")
        page.context.close()


LONG_GAME_JS = """() => {
  // A game some hands along (three if any seed gets there, else two),
  // kept as the page keeps a sitting, for the page to restore on its next
  // load.
  const e = window.cassino3d.engine;
  let two = null;
  for (let seed = 1; seed < 80; seed++) {
    let s = e.start({ game: "classic", aces14: false, sweeps: false, raising: true, skill: 1, seed });
    s = e.send("set hints on").state;
    for (let n = 0; n < 3000 && s.prompt !== "over"; n++) {
      const hands = s.events.filter((x) => x.kind === "hand_ends").length;
      if (s.prompt === "next_hand" && hands >= 3) {
        localStorage.setItem("cassino.sitting", s.saved);
        return 3;
      }
      if (s.prompt === "next_hand" && hands === 2 && !two) two = s.saved;
      // You play the hint, so the game stays close.
      s = e.send(s.prompt === "play" ? (e.hint()?.move ?? s.moves[0]) : "next").state;
    }
  }
  if (!two) return null;
  localStorage.setItem("cassino.sitting", two);
  return 2;
}"""


def check_hud_room(browser, failures):
    """The score's hand-by-hand ledger, two or three hands along (eleven
    points a hand: a fourth would end the game), scrolls rather
    than running down over the drawer at the foot of the left (the seventh
    play-testing: "when the hud gets long enough, it collides with the
    bottom drawer"); upright, over the table and its panel under it, both
    clear of the controls."""
    for viewport in ({"width": 1280, "height": 720}, {"width": 1366, "height": 650}, {"width": 820, "height": 1180}, {"width": 390, "height": 844}):
        where = f"{viewport['width']}x{viewport['height']}"
        context = browser.new_context(viewport=viewport)
        context.set_offline(True)
        page = context.new_page()
        page.errors = []
        page.on("pageerror", lambda e: page.errors.append(str(e)))
        url = f"{PAGE.as_uri()}?tutorial=0&welcome=0&speed=8"
        page.goto(url)
        page.wait_for_function("window.cassino3d !== undefined", timeout=120_000)
        hands = page.evaluate(LONG_GAME_JS)
        if hands is None:
            failures.append(f"hud {where}: no game found hands along")
            context.close()
            continue
        page.goto(url)
        page.wait_for_function("window.cassino3d !== undefined", timeout=120_000)
        settle(page)
        if page.evaluate("window.cassino3d.state().events.filter((x) => x.kind === 'hand_ends').length") < hands:
            failures.append(f"hud {where}: the long game was not restored")
            context.close()
            continue
        # The drawer open too, where it is a drawer (across the table).
        upright = page.evaluate("document.documentElement.classList.contains('upright')")
        if not upright and page.locator(".aids-head").is_visible():
            page.locator(".aids-head").click()
        page.locator(".hud-chev").click()
        page.wait_for_timeout(1500)
        box = page.locator(".hud").bounding_box()
        hud_bottom = box["y"] + box["height"]
        scrolls = page.evaluate("(() => { const l = document.querySelector('.hud-list'); return l.scrollHeight > l.clientHeight + 1; })()")
        panel = page.locator(".aids-panel")
        drawer = panel.bounding_box() if panel.is_visible() else None
        if upright:
            controls = page.evaluate("Math.min(document.querySelector('.controls').getBoundingClientRect().top, document.querySelector('.bar').getBoundingClientRect().top)")
            lowest = drawer["y"] + drawer["height"] if drawer else hud_bottom
            if lowest > controls:
                failures.append(f"hud {where}: the score and its panel run down to {lowest:.0f} px, over the controls at {controls:.0f}")
        elif drawer and hud_bottom > drawer["y"]:
            failures.append(f"hud {where}: the score runs down to {hud_bottom:.0f} px, over the drawer at {drawer['y']:.0f}")
        if not scrolls and viewport["height"] < 700:
            failures.append(f"hud {where}: {hands} hands' ledger does not scroll on a short window")
        shot(page, f"t4-hud-room-{where}")
        # The next hand dealt, the ledger open: it lies over the move bar,
        # not under it (the user: "the action buttons occlude the hud
        # when the hud is opened").
        page.locator("md-filled-button.next").click()
        settle(page)
        # (Next hand, a tap outside the score, folded it: open it again.)
        if not page.locator(".hud.open").count():
            page.locator(".hud-chev").click()
        page.wait_for_timeout(1500)
        under = page.evaluate("""() => {
          const hud = document.querySelector('.hud').getBoundingClientRect();
          const out = [];
          for (const b of document.querySelectorAll('.move-bar md-filled-button')) {
            const r = b.getBoundingClientRect();
            const x = (Math.max(r.left, hud.left) + Math.min(r.right, hud.right)) / 2;
            const y = (Math.max(r.top, hud.top) + Math.min(r.bottom, hud.bottom)) / 2;
            if (r.right <= hud.left || r.left >= hud.right || r.bottom <= hud.top || r.top >= hud.bottom) continue;
            if (!document.elementFromPoint(x, y)?.closest('.info')) out.push(b.dataset.label);
          }
          return out;
        }""")
        if under:
            failures.append(f"hud {where}: the move bar's {under} lie over the open score")
        # A tap outside the open score folds it (the user: "if the scoring
        # heads up display is extended, and you click outside of it, it
        # should automatically retract").
        if not page.locator(".hud.open").count():
            failures.append(f"hud {where}: the score was not open to fold")
        # The prompt's line: never under the score (hudRoom stops it above).
        line = page.locator(".controls .prompt").bounding_box()
        page.mouse.click(line["x"] + line["width"] / 2, line["y"] + line["height"] / 2)
        page.wait_for_timeout(800)
        if page.locator(".hud.open").count():
            failures.append(f"hud {where}: a tap outside the open score did not fold it")
        if page.errors:
            failures.append(f"hud {where}: console errors {page.errors[:3]}")
        context.close()


TABLE_ORDER_JS = """() => {
  const s = window.cassino3d.state();
  const ranks = "A23456789TJQK";
  return s.table.map((i) => {
    const top = i.cards[i.cards.length - 1].card;
    const p = window.cassino3d.screenPoint(i.cards[0].card);
    return { id: i.id, value: i.build ? i.build.value : ranks.indexOf(top[0]) + 1, x: p.x, y: p.y };
  });
}"""


def check_sorted(browser, failures):
    """The table sorted by default, highest on the left (the user: "cards
    and [builds] on the table, dynamically automatically sort in
    descending order, left to right"); turned off in the settings, as the
    cards came."""
    page = open_page(browser, "seed=7&speed=8", calm=True)
    settle(page)
    made = 0
    while made < 3 and play_by_clicking(page, failures, made + 700):
        made += 1
    settle(page)

    def rows():
        items = page.evaluate(TABLE_ORDER_JS)
        first = max(i["y"] for i in items)
        return [i for i in sorted(items, key=lambda i: i["x"]) if abs(i["y"] - first) < 30], items

    row, items = rows()
    values = [i["value"] for i in row]
    if len(row) < 2 or values != sorted(values, reverse=True):
        failures.append(f"sorted: the table's first row is not highest first, left to right: {values}")
    # Your hand too (the user: "their own cards should also stay sorted"),
    # an ace low in plain Cassino.
    hand_js = """() => window.cassino3d.state().hand.map((c) => ({ code: c.card, x: window.cassino3d.screenPoint(c.card).x }))"""
    held = sorted(page.evaluate(hand_js), key=lambda c: c["x"])
    ranks = ["A23456789TJQK".index(c["code"][0]) + 1 for c in held]
    if ranks != sorted(ranks, reverse=True):
        failures.append(f"sorted: your hand is not highest first, left to right: {[c['code'] for c in held]}")
    page.locator("md-icon-button.settings-open").click()
    page.wait_for_timeout(1200)
    page.locator('.settings-dialog md-switch[data-pref="sortTable"]').click()
    page.locator(".settings-dialog md-filled-tonal-button", has_text="Done").click()
    page.wait_for_timeout(800)
    settle(page)
    row, items = rows()
    came = [i["id"] for i in page.evaluate("window.cassino3d.state().table")][: len(row)]
    if [i["id"] for i in row] != came:
        failures.append(f"sorted: turned off, the table is not as the cards came: {[i['id'] for i in row]} against {came}")
    if page.evaluate("window.cassino3d.prefs().sortTable") is not False:
        failures.append("sorted: the setting was not kept off")
    held = [c["code"] for c in sorted(page.evaluate(hand_js), key=lambda c: c["x"])]
    if held != [c["card"] for c in page.evaluate("window.cassino3d.state().hand")]:
        failures.append(f"sorted: turned off, your hand is not as dealt: {held}")
    # Left-handed: the move bar the other way round (the user).
    labels = lambda: [b.inner_text().strip() for b in page.locator(".move-bar md-filled-button").all()]
    if labels() != ["Build", "Take", "Trail"]:
        failures.append(f"left-handed: the move bar right-handed is {labels()}")
    page.locator("md-icon-button.settings-open").click()
    page.wait_for_timeout(1200)
    page.locator('.settings-dialog md-switch[data-pref="leftHanded"]').click()
    page.locator(".settings-dialog md-filled-tonal-button", has_text="Done").click()
    page.wait_for_timeout(800)
    if labels() != ["Trail", "Take", "Build"]:
        failures.append(f"left-handed: the move bar left-handed is {labels()}")
    if page.errors:
        failures.append(f"sorted: console errors {page.errors[:3]}")
    page.context.close()


def check_bar_under(browser, failures):
    """The move bar under the cards (the user: "put the action buttons
    (take, build, trail) on a layer lower than the cards so that they do
    not occlude the cards"): as the cards are dealt over it on a phone,
    each is cut out of the bar while it crosses it; at rest, nothing is."""
    page = open_page(browser, "seed=7&manual", viewport={"width": 390, "height": 664}, calm=True, device={"has_touch": True, "is_mobile": True})
    masked = 0
    for k in range(160):
        page.evaluate("window.cassino3d.tick(40)")
        if page.evaluate("(() => { const b = document.querySelector('.move-bar'); return !b.hidden && [b, ...b.querySelectorAll('.chips, .place')].some((e) => e.style.clipPath.includes('path')); })()"):
            masked += 1
            if masked == 1:
                shot(page, "t2-bar-under")
    if not masked:
        failures.append("bar under: no card was cut out of the move bar as the cards were dealt over it")
    page.evaluate("window.cassino3d.skip()")
    page.evaluate("window.cassino3d.tick(100)")
    crossing = page.evaluate("""() => {
      const b = document.querySelector('.move-bar').getBoundingClientRect();
      return ['middle', 'your-hand'].flatMap((z) => window.cassino3d.cardRects(z)).some((r) => r.right > b.left && r.left < b.right && r.bottom > b.top && r.top < b.bottom);
    }""")
    still = page.evaluate("[document.querySelector('.move-bar'), ...document.querySelectorAll('.move-bar .chips, .move-bar .place')].some((e) => e.style.clipPath.includes('path'))")
    if still and not crossing:
        failures.append("bar under: at rest, the move bar is cut with no card across it")
    if page.errors:
        failures.append(f"bar under: console errors {page.errors[:3]}")
    page.context.close()


def check_settings(browser, failures):
    """The settings: hints turned on in the dialog; a hint shown, lit and
    chosen and played; no undo (the seventh play-testing: "remove undo");
    the sitting kept across a reload; the credits; and a watched game that
    plays itself."""
    page = open_page(browser, "skill=2&speed=8")
    settle(page)
    page.locator("md-icon-button.settings-open").click()
    page.wait_for_timeout(1500)
    shot(page, "t6-settings")
    page.locator('md-switch[data-aid="hints"]').click()
    if page.locator('md-switch[data-pref="undo"]').count() or page.locator("md-icon-button.undo").count():
        failures.append("settings: undo is still offered")
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
    chip = page.locator(f'.move-bar [data-move="{hint["move"]}"]')
    if chip.count() != 1:
        failures.append(f"settings: the hint's move {hint['move']} is not offered once chosen: {page.evaluate('window.cassino3d.chips()')}")
        return
    before = len(s["events"])
    chip.click()
    settle(page)
    if len(page.evaluate("window.cassino3d.state()")["events"]) <= before:
        failures.append("settings: the hint's move was not played")
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
    # The move bar answers the card chosen. A card alone can only trail, and
    # not while a build of yours is on the table (the game here has no
    # seed, so sometimes there is one): then every button is dimmed.
    bar = page.evaluate("[...document.querySelectorAll('.move-bar md-filled-button')].map((c) => [c.dataset.label, !c.disabled])")
    yours = any(i["build"] and i["build"]["controller"] == "you" for i in page.evaluate("window.cassino3d.state().table"))
    if not bar or [label for label, lit in bar if lit] != ([] if yours else ["Trail"]):
        failures.append(f"keyboard: the move bar for the card chosen shows {bar} (a build of yours on the table: {yours})")
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
    page.locator("md-icon-button.new-game").click()
    page.locator(".new-game-dialog md-outlined-button.watch").click()
    page.wait_for_function("!document.querySelector('.new-game-dialog').open")
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
        chip = page.locator(".move-bar [data-move]").filter(has_text="Take")
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
        check_score_fits(page, failures, "desktop")
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
        check_no_replay(page, failures)
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
        check_new_game(browser, failures)
        check_welcome(browser, failures)
        check_aid_toggles(browser, failures)
        check_cheers(browser, failures)
        check_talk(browser, failures)
        check_move_bar(browser, failures)
        check_ending(browser, failures)
        check_tutorial(browser, failures)
        check_phone(browser, failures)
        check_tablet_faces(browser, failures)
        check_still(browser, failures)
        check_sorted(browser, failures)
        check_bar_under(browser, failures)
        check_hud_room(browser, failures)
        check_desktop_frame(browser, failures)
        check_phone_talk(browser, failures)
        check_phone_room(browser, failures)
        page = open_page(browser, "seed=11&skill=4&manual", calm=True)
        # The game proposed and accepted, then the house rules: both speak
        # within the opening's first seconds.
        speakers = set()
        for _ in range(40):
            page.evaluate("window.cassino3d.tick(150)")
            speakers |= {line["who"] for line in page.evaluate("window.cassino3d.said()")}
            if speakers == {"you", "them"}:
                break
        shot(page, "t5-talk")  # the house rules agreed before the deal
        if speakers != {"you", "them"}:
            failures.append(f"the house rules were not talked over: {speakers}")
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
