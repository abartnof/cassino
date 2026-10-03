#!/usr/bin/env python3
"""The phrase bank: everything said at the cassino table, for the dialogue
boxes (docs/TABLE3D.md section 7, docs/DESIGN.md section 12.1).

    python3 web3d/tools/phrases.py           # rewrite docs/PHRASES.md and web3d/words.json
    python3 web3d/tools/phrases.py --check   # fail if either is out of date

The bank is of *groups*, each a moment at the table ("Building eight.", a
sweep, the dealer's "Last."), and each is said in several ways, which the
page picks among without saying anything the same way twice running
(bag.js). The wordings come from the sources the literature review found
(cassino-lit-review.md, section 6), each marked with a letter; "T" marks the
table's own, a period formula carried to a case the sources do not spell
out, or plain table talk.

The structure is piquet's web3d/tools/phrases.py @ 254cb3c; the bank is
cassino's. The page reads web3d/words.json; docs/PHRASES.md lists every
phrase with its source. The Node tests check that every group the talk asks
for is here, and that both files are up to date.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SOURCES = {
    "D": "Dick, The American Hoyle (1866, 1867): the totals spoken as a build grows, "
         "\"Seven.\" ... \"Nine.\" ... \"Ten.\", and the plural for a call [03-S14][03-S15]",
    "Tw": "Townsend (1891): \"I build seven\", \"I call sixes\" [03-S20]",
    "F": "Foster's Complete Hoyle (1897-1914): \"Nine\", \"Ten\", \"Two Sevens\" [03-S31]",
    "H": "the mid-century Hoyles (1945-1952): \"Building eight\", \"Building sevens\", "
         "the dealer's announcement of the last cards [03-S35][03-S36]",
    "P": "pagat.com, the modern rules: \"building 5\", \"last\", a \"clear\" [02-S1]",
    "L": "Jack London's players agreeing their rules (1912): \"Do you count sweeps?\" "
         "\"Certainly not ... That's a sissy game.\" \"Low deals.\" [04-S28]",
    "Fe": "Feydeau, in English translation: the count chanted, \"Cards... Spades... "
          "Ten of diamonds...\", \"Deuce... Aces...\", and \"Clean sweep!\" [04-S159]",
    "N": "the New York Dispatch's answers column (1877-1881): \"sevens\", "
         "\"I have three points, and am out\" [04-S155][04-S130]",
    "Do": "the Dominican custom of pointing out the cards an opponent left behind "
          "(dejado) [02-S3]; the words are ours",
    "T": "the table's own",
}

NUMBERS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
           "eleven", "twelve", "thirteen", "fourteen"]


def plural(n):
    """A value in the plural, as a call is made: "eights", "sixes"."""
    return "sixes" if n == 6 else NUMBERS[n] + "s"


# The values a build can have: 2 to 10 in Classic, to 13 in Royal, and 14
# when an ace may count fourteen.
BUILD_VALUES = range(2, 15)
RANKS = {1: "ace", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven",
         8: "eight", 9: "nine", 10: "ten", 11: "jack", 12: "queen", 13: "king"}
SUITS = {"S": "spades", "H": "hearts", "D": "diamonds", "C": "clubs"}


def phrase_groups():
    """Every group said in words, each with its wordings and their sources,
    in the order the table meets them."""
    out = []
    add = lambda gid, *ways: out.append((gid, list(ways)))

    # Before the game: the house rules agreed aloud, as London's players do,
    # and the cut.
    add("sweeps-ask", ("Do you count sweeps?", "L"), ("Sweeps count?", "T"), ("Are we counting sweeps?", "T"))
    add("sweeps-yes", ("We count them.", "T"), ("Of course.", "T"), ("Every one.", "T"))
    add("sweeps-no", ("Certainly not. That's a sissy game.", "L"), ("Certainly not.", "L"), ("No sweeps.", "T"))
    add("royal", ("Royal, then: the court cards count.", "T"),
        ("Jack eleven, queen twelve, king thirteen.", "T"),
        ("Royal cassino. The court cards build.", "T"))
    add("aces-14", ("And an ace takes as one or fourteen.", "T"),
        ("Aces one or fourteen.", "T"),
        ("An ace is one or fourteen, as you like.", "T"))
    add("low-deals", ("Low deals.", "L"), ("Low card deals.", "T"), ("Cut. Low deals.", "T"))
    add("my-deal", ("My deal.", "T"), ("I deal.", "T"), ("I'll deal.", "T"))
    add("your-deal", ("Your deal.", "T"), ("You deal.", "T"), ("Over to you. Your deal.", "T"))

    # The dealer's last cards: the announcement the rules require.
    add("last", ("Last.", "P"), ("Last cards.", "H"), ("The last cards.", "H"), ("Last deal.", "T"))

    # Builds: a single build called in the singular, a multiple one in the
    # plural (the 1867 grammar), a raise by its new total, as Dick's players
    # cry it.
    for n in BUILD_VALUES:
        w = NUMBERS[n]
        add(f"build-{n}", (f"Building {w}.", "H"), (f"{w.capitalize()}.", "F"), (f"I build {w}.", "Tw"))
    for n in BUILD_VALUES:
        p = plural(n)
        add(f"builds-{n}", (f"Building {p}.", "H"), (f"{p.capitalize()}.", "D"), (f"I call {p}.", "Tw"))
    for n in BUILD_VALUES:
        w = NUMBERS[n]
        add(f"raise-{n}", (f"{w.capitalize()}.", "D"), (f"Building {w}.", "P"), (f"Make it {w}.", "T"))

    # Captures.
    add("sweep", ("Clear!", "P"), ("Clean sweep!", "Fe"), ("Sweep!", "T"), ("That clears it.", "T"))
    add("cash", ("Cash.", "P"), ("Cash!", "T"), ("An ace for an ace.", "T"))
    add("clinch-cards", ("That's the cards.", "P"), ("Twenty-seven. The cards are mine.", "T"),
        ("That's twenty-seven.", "T"))
    add("clinch-spades", ("Seven spades.", "P"), ("That's the spades.", "T"), ("Seven spades. The point is mine.", "T"))
    for r, name in RANKS.items():
        add(f"left-{r}", (f"You left the {name}.", "Do"), (f"You missed the {name}.", "T"),
            (f"The {name} was there for you.", "T"))
    add("left-more", ("You left a few there.", "Do"), ("You could have taken more.", "T"),
        ("There was more for you there.", "T"))
    add("residue", ("And the rest are mine.", "T"), ("The last cards come to me.", "T"), ("I'll take what's left.", "T"))

    # The count, chanted line by line.
    add("count-cards", ("Cards.", "Fe"), ("Most cards.", "T"), ("The cards.", "T"))
    add("count-spades", ("Spades.", "Fe"), ("Most spades.", "T"), ("The spades.", "T"))
    add("count-big-casino", ("Big Casino.", "T"), ("Ten of diamonds.", "Fe"), ("The big one.", "T"))
    add("count-little-casino", ("Little Casino.", "T"), ("Deuce.", "Fe"), ("The little one.", "T"))
    for s, name in SUITS.items():
        add(f"count-ace-{s}", (f"The ace of {name}.", "T"), (f"Ace of {name}.", "T"), ("An ace.", "Fe"))
    add("count-sweeps-1", ("A sweep.", "T"), ("One sweep.", "T"), ("And a sweep.", "T"))
    for n in range(2, 9):
        add(f"count-sweeps-{n}", (f"{NUMBERS[n].capitalize()} sweeps.", "T"), (f"Sweeps: {NUMBERS[n]}.", "T"),
            (f"And {NUMBERS[n]} sweeps.", "T"))

    # The game.
    add("game-won", ("And I am out.", "N"), ("That's game.", "T"), ("Game. Twenty-one.", "T"))
    add("good-game", ("Good game.", "T"), ("Well played.", "T"), ("Thank you for the game.", "T"))
    return out


def files():
    """Every wording: key -> its words."""
    return {f"{gid}.{k}": text for gid, ways in phrase_groups() for k, (text, _) in enumerate(ways)}


def groups():
    """Every group the page can ask for: id -> the wordings it picks among."""
    return {gid: [f"{gid}.{k}" for k in range(len(ways))] for gid, ways in phrase_groups()}


def words_json():
    """The words of every group, for the page's dialogue boxes
    (web3d/words.json): the build embeds it."""
    return json.dumps({"groups": groups(), "texts": files()},
                      ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n"


def document():
    """docs/PHRASES.md: every phrase the table says, written down."""
    lines = [
        "# What the table says",
        "",
        "Every phrase the dialogue boxes say, each in the ways it is said, so",
        "that nothing is said the same way twice running. Generated from the",
        "bank in `web3d/tools/phrases.py`; edit the bank, not this file. The",
        "source IDs in brackets are the literature review's",
        "(`cassino-lit-review.md`, Appendix B).",
        "",
        "Sources:",
        "",
        *[f"- **{tag}**: {name}" for tag, name in SOURCES.items()],
        "",
        "| Group | Said | Source |",
        "|---|---|---|",
    ]
    for gid, ways in phrase_groups():
        for k, (text, source) in enumerate(ways):
            lines.append(f"| {'`' + gid + '`' if k == 0 else ''} | {text} | {source} |")
    lines.append("")
    return "\n".join(lines)


DOC = ROOT / "docs" / "PHRASES.md"
WORDS = ROOT / "web3d" / "words.json"


def main():
    for gid, ways in phrase_groups():
        assert len(ways) >= 2, f"{gid} is said only one way"
        assert all(source in SOURCES for _, source in ways), gid
    if "--check" in sys.argv:
        stale = [p for p, text in ((DOC, document()), (WORDS, words_json())) if not p.exists() or p.read_text() != text]
        if stale:
            print(f"out of date: {', '.join(str(p.relative_to(ROOT)) for p in stale)}; run web3d/tools/phrases.py")
            return 1
        return 0
    DOC.write_text(document())
    WORDS.write_text(words_json())
    print(f"wrote {DOC.relative_to(ROOT)} and {WORDS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
