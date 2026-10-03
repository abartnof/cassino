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
    "Dk": "Dick's rewritten American Hoyle (1894): Royal's \"Knave eleven, the Queen twelve, "
          "and the King thirteen\" [03-S22]",
    "Tw": "Townsend (1891): \"I build seven\", a raise as \"I build nine\", \"I call sixes\" [03-S20]",
    "F": "Foster's Hoyles (1897-1914): \"Nine\", \"Ten\", \"Two Sevens\"; Royal's \"Jack is worth 11, "
         "the Queen 12, and the King 13\", the ace \"14 or 1 at the option of the holder\" (1907); "
         "\"Taking In\"; the last trick; \"claim the game\" [03-S31][03-S28]",
    "Us": "the United States Playing Card Company's rules (1898): Royal's aces \"either ones or "
          "fourteens, as the player may elect\" [03-S24]",
    "St": "the Standard Hoyle (1904): sweeps \"should be scored, as there is fine play made in "
          "the scoring of them\" [03-S25]",
    "H": "the mid-century Hoyles (1945-1952): \"Building eight\", \"Building sevens\", the dealer's "
         "announcement of the last cards, \"Sweeps do not count\" [03-S35][03-S36]",
    "Lo": "Long's Short Rules (1792), the first: \"The Majority of the Cards\", \"The Majority of "
          "the Spades\", a player who \"clears the Board\", \"take up as many as you can with one "
          "Card\" [03-S1]",
    "Po": "the mock-heroic poem Casino (1793): \"the Great Casino nam'd\", and the deuce of "
          "spades, \"Casino's younger Brother\" [04-S21]",
    "P": "pagat.com, the modern rules: \"building 5\", \"last\", a \"clear\", \"cash\", the Good Ten "
         "and the Good Two [02-S1]",
    "M": "the modern rules on the web: \"calling 5\", \"calling 8\" [05-S77][05-S78]",
    "B": "BoardGameGeek's players on sweeps: \"we play with them every single time\"; \"it's just "
         "the luck of the deal\" [05-S74]",
    "L": "Jack London's players (1912): \"Do you count sweeps?\" \"Certainly not.\" \"Low deals.\" "
         "\"I'll make 'cards'\" [04-S28]",
    "Ar": "Ardmore's novel To Love Is to Listen (1967): at Big Casino, a player \"screamed the "
          "word, 'Luck!'\" [04-S82]",
    "Fe": "Feydeau, in English translation: the count chanted, \"Cards... Spades... "
          "Ten of diamonds...\", \"Deuce... Aces...\", and \"Clean sweep!\" [04-S159]",
    "N": "the New York Dispatch's answers column (1877-1881): a build \"calling 'seven'\" or "
         "\"calls it six\", \"sevens\", \"fives all\", \"I have three points, and am out\" "
         "[04-S155][04-S130]",
    "Sw": "the Swedish game's calls, in translation: \"bygger till knekt\" (building to jack), "
          "\"sistan\" (the last one), \"sista given\" (last deal), \"storan\" and \"lillan\" "
          "(the big one, the little one) [10-S24][10-S25]; two players in Finland, \"Nu har jag "
          "stora kasino\", \"och jag har lilla\" (now I have Big Casino; and I have Little) [10-S13]",
    "Fi": "the Finnish game, in translation: the call \"rakennan ässälle\" (I'm building for the "
          "ace) [10-S1]; a big capture, a \"kahmaisu\" (a grab) [10-S8]",
    "Hu": "Tandori's Hungarian count, in translation: \"Card majority! Spade majority! big c., "
          "little c., the four aces!\" [10-S56]",
    "Ru": "the Russian rules, in translation: a sweep is \"to sweep clean\" [10-S57]",
    "Ge": "pagat's German edition: the dealer's warning, \"Letzte Runde\" (last round), in "
          "translation [02-S29]",
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
# The card that takes a build of each value: an ace takes fourteen.
TAKER = {**RANKS, 14: "ace"}
SUITS = {"S": "spades", "H": "hearts", "D": "diamonds", "C": "clubs"}


def phrase_groups():
    """Every group said in words, each with its wordings and their sources,
    in the order the table meets them. A group's first wording is the one
    the page times its talk by before it has chosen."""
    out = []
    add = lambda gid, *ways: out.append((gid, list(ways)))

    # Before the game: the house rules agreed aloud, as London's players do,
    # and the cut. Your settings answer: sweeps scored or not.
    add("sweeps-ask", ("Do you count sweeps?", "L"), ("Sweeps count?", "T"), ("Are we counting sweeps?", "T"),
        ("Shall we count sweeps?", "T"), ("Sweeps, or no sweeps?", "T"))
    add("sweeps-yes", ("We count them.", "T"), ("Of course.", "T"), ("Every one.", "T"),
        ("Every single time.", "B"), ("Yes, a point each.", "T"), ("They should be scored.", "St"))
    add("sweeps-no", ("Certainly not.", "L"), ("No sweeps.", "T"), ("Not this time.", "T"),
        ("Sweeps don't count.", "H"), ("No. They're the luck of the deal.", "B"), ("We'll leave them out.", "T"))
    add("royal", ("Royal, then: the court cards count.", "T"),
        ("Jack eleven, queen twelve, king thirteen.", "F"),
        ("Knave eleven, queen twelve, king thirteen.", "Dk"),
        ("Royal cassino. The court cards build.", "T"),
        ("We'll play royal.", "T"))
    add("aces-14", ("And an ace takes as one or fourteen.", "T"),
        ("Aces one or fourteen.", "T"),
        ("An ace is one or fourteen, as you like.", "T"),
        ("The ace is fourteen or one, at your option.", "F"),
        ("Aces one or fourteen, as the player elects.", "Us"))
    add("low-deals", ("Low deals.", "L"), ("Low card deals.", "T"), ("Cut. Low deals.", "T"),
        ("Cut for the deal: low deals.", "T"), ("Ace is low. Low deals.", "T"), ("Shall we cut? Low deals.", "T"))
    add("my-deal", ("My deal.", "T"), ("I deal.", "T"), ("I'll deal.", "T"),
        ("Low card. My deal.", "T"), ("The deal is mine.", "T"), ("Mine is lower. I deal.", "T"))
    add("your-deal", ("Your deal.", "T"), ("You deal.", "T"), ("Over to you. Your deal.", "T"),
        ("Low card. Your deal.", "T"), ("The deal is yours.", "T"), ("Yours is lower. Your deal.", "T"))

    # The dealer's last cards: the announcement the rules require, and the
    # same call in the other games that have it.
    add("last", ("Last.", "P"), ("Last cards.", "H"), ("The last cards.", "H"), ("Last deal.", "Sw"),
        ("The last one.", "Sw"), ("Last round.", "Ge"), ("The last of the pack.", "T"))

    # Builds: a single build called in the singular, a multiple one in the
    # plural (the 1867 grammar), a raise by its new total, as Dick's players
    # cry it. A multiple build is never "two eights": the call does not know
    # how many parts it has.
    for n in BUILD_VALUES:
        w = NUMBERS[n]
        add(f"build-{n}", (f"Building {w}.", "H"), (f"{w.capitalize()}.", "F"), (f"I build {w}.", "Tw"),
            (f"Call it {w}.", "N"), (f"Building to {w}.", "Sw"), (f"Building for the {TAKER[n]}.", "Fi"))
    for n in BUILD_VALUES:
        p = plural(n)
        add(f"builds-{n}", (f"Building {p}.", "H"), (f"{p.capitalize()}.", "D"), (f"I call {p}.", "Tw"),
            (f"{p.capitalize()} all.", "N"), (f"Calling {p}.", "M"), (f"{p.capitalize()}, locked.", "T"))
    for n in BUILD_VALUES:
        w = NUMBERS[n]
        add(f"raise-{n}", (f"{w.capitalize()}.", "D"), (f"Building {w}.", "P"), (f"Make it {w}.", "T"),
            (f"I build {w}.", "Tw"), (f"Call it {w}.", "N"), (f"Raise it to {w}.", "T"), (f"Up to {w}.", "T"))

    # Captures.
    add("sweep", ("Clear!", "P"), ("Clean sweep!", "Fe"), ("Sweep!", "T"), ("That clears it.", "T"),
        ("That clears the board.", "Lo"), ("Swept clean!", "Ru"), ("The table's clear.", "T"))
    add("cash", ("Cash.", "P"), ("Cash!", "T"), ("An ace for an ace.", "T"), ("Ace takes ace.", "T"),
        ("That's cash.", "T"), ("Ace on ace: cash.", "T"))
    # A capture that takes a casino card, or a haul of several cards, when no
    # sweep or cash speaks for it.
    add("take-big-casino", ("Now I have Big Casino.", "Sw"), ("Luck! Big Casino.", "Ar"),
        ("The big one's mine.", "Sw"), ("I'll have the good ten.", "P"), ("That's two points.", "T"),
        ("Big Casino comes to me.", "T"))
    add("take-little-casino", ("I have Little Casino.", "Sw"), ("The little one's mine.", "Sw"),
        ("I'll have the good two.", "P"), ("Little Casino, and a point.", "T"), ("That's a point.", "T"))
    add("take-many", ("A good haul.", "T"), ("That's a grab!", "Fi"), ("Taken in, every one.", "F"),
        ("As many as I can, with one card.", "Lo"), ("In they all come.", "T"), ("Quite a pile.", "T"))
    add("clinch-cards", ("That's the cards.", "P"), ("Twenty-seven. The cards are mine.", "T"),
        ("That's twenty-seven.", "T"), ("I've made cards.", "L"), ("Twenty-seven cards. Three points.", "T"),
        ("The cards are made.", "T"))
    add("clinch-spades", ("Seven spades.", "P"), ("That's the spades.", "T"), ("Seven spades. The point is mine.", "T"),
        ("Seven. The spades are mine.", "T"), ("I've made spades.", "T"), ("Seven spades, and the point.", "T"))
    # What you left, pointed out as an observation, never a reproach.
    for r, name in RANKS.items():
        add(f"left-{r}", (f"You left the {name}.", "Do"), (f"The {name} was left behind.", "Do"),
            (f"The {name} was there for you.", "T"), (f"The {name} could have come too.", "T"),
            (f"You might have had the {name}.", "T"))
    add("left-more", ("You left a few there.", "Do"), ("More could have come with it.", "T"),
        ("There was more for you there.", "T"), ("A few were left behind.", "Do"), ("There were more to take.", "T"))
    add("residue", ("And the rest are mine.", "T"), ("The last cards come to me.", "T"), ("I'll take what's left.", "T"),
        ("The last trick is mine.", "F"), ("Last to take, so the rest are mine.", "T"), ("Those come to me.", "T"))

    # The count, chanted line by line, each line by whoever wins it.
    add("count-cards", ("Cards.", "Fe"), ("Most cards.", "T"), ("The cards.", "T"), ("Card majority!", "Hu"),
        ("The majority of the cards.", "Lo"), ("Three for cards.", "T"))
    add("count-spades", ("Spades.", "Fe"), ("Most spades.", "T"), ("The spades.", "T"), ("Spade majority!", "Hu"),
        ("The majority of the spades.", "Lo"), ("One for spades.", "T"))
    add("count-big-casino", ("Big Casino.", "T"), ("Ten of diamonds.", "Fe"), ("The big one.", "Sw"),
        ("Great Casino.", "Po"), ("The good ten.", "P"), ("Two for Big Casino.", "T"))
    add("count-little-casino", ("Little Casino.", "T"), ("Deuce.", "Fe"), ("The little one.", "Sw"),
        ("Casino's younger brother.", "Po"), ("The good two.", "P"), ("One for Little Casino.", "T"))
    for s, name in SUITS.items():
        add(f"count-ace-{s}", (f"The ace of {name}.", "T"), (f"Ace of {name}.", "T"), ("An ace.", "Fe"),
            (f"And the ace of {name}.", "T"), (f"One for the ace of {name}.", "T"))
    add("count-sweeps-1", ("A sweep.", "T"), ("One sweep.", "T"), ("And a sweep.", "T"),
        ("One for the sweep.", "T"), ("A sweep, and a point.", "T"))
    for n in range(2, 9):
        w = NUMBERS[n]
        add(f"count-sweeps-{n}", (f"{w.capitalize()} sweeps.", "T"), (f"Sweeps: {w}.", "T"),
            (f"And {w} sweeps.", "T"), (f"{w.capitalize()} for sweeps.", "T"),
            (f"{w.capitalize()} sweeps, {w} points.", "T"))

    # The game: the winner claims it, the other is gracious.
    add("game-won", ("And I am out.", "N"), ("That's game.", "T"), ("Game. Twenty-one.", "T"),
        ("I claim the game.", "F"), ("I'm out.", "N"), ("Twenty-one, and thank you.", "T"))
    add("good-game", ("Good game.", "T"), ("Well played.", "T"), ("Thank you for the game.", "T"),
        ("Well done.", "T"), ("Nicely played.", "T"), ("A good game. Thank you.", "T"))
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
