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
          "the Spades\", \"The Deuce of Spades, which is Little Cassino\", a player who \"clears the "
          "Board\", \"take up as many as you can with one Card\" [03-S1]",
    "Po": "the mock-heroic poem Casino (1793): \"the Great Casino nam'd\", and the deuce of "
          "spades, \"Casino's younger Brother\" [04-S21]",
    "P": "pagat.com, the modern rules: \"building 5\", \"last\", a \"clear\", \"cash\", the Good Ten "
         "and the Good Two [02-S1]",
    "M": "the modern rules on the web: \"calling 5\", \"calling 8\" [05-S77][05-S78]",
    "B": "BoardGameGeek's players on sweeps: \"we play with them every single time\"; \"it's just "
         "the luck of the deal\" [05-S74]",
    "L": "Jack London's players (1912): \"Do you count sweeps?\" \"Certainly not.\" \"Low deals.\" "
         "\"I'll make 'cards'\" [04-S28]",
    "Ar": "Ardmore's novel To Love Is to Listen (1967): at Big Cassino, a player \"screamed the "
          "word, 'Luck!'\"; \"You would have big cassino for the last. Such luck!\" [04-S82]",
    "Fe": "Feydeau, in English translation: \"Clean sweep!\" [04-S159]",
    "N": "the New York Dispatch's answers column (1877-1881): a build \"calling 'seven'\" or "
         "\"calls it six\", \"sevens\", \"fives all\", \"I have three points, and am out\" "
         "[04-S155][04-S130]",
    "Sw": "the Swedish game's calls, in translation: \"bygger till knekt\" (building to jack), "
          "\"sistan\" (the last one), \"sista given\" (last deal), \"storan\" and \"lillan\" "
          "(the big one, the little one) [10-S24][10-S25]; two players in Finland, \"Nu har jag "
          "stora kasino\", \"och jag har lilla\" (now I have Big Cassino; and I have Little) [10-S13]",
    "Fi": "the Finnish game, in translation: the call \"rakennan ässälle\" (I'm building for the "
          "ace) [10-S1]; a big capture, a \"kahmaisu\" (a grab) [10-S8]",
    "Ru": "the Russian rules, in translation: a sweep is \"to sweep clean\" [10-S57]",
    "Ge": "pagat's German edition: the dealer's warning, \"Letzte Runde\" (last round), in "
          "translation [02-S29]",
    "Do": "the Dominican custom of pointing out the cards an opponent left behind "
          "(dejado) [02-S3]; the words are ours",
    "Ec": "Cuarenta, Ecuador's cousin of the game, played loud and full of sayings (\"hay que "
          "ponerse charlatán\": you have to turn into a chatterbox): \"Dos, señor juez\" (two, "
          "Mr. Judge), \"Con esta te caigo\" (with this one I'll fall on you), \"As que no me "
          "caerás\" (ace, you won't fall on me), in translation [05-S56][05-S57][05-S59]",
    "Fs": "Finnish, in translation: the story \"Iso casino\" (1938), \"this was a big cassino for "
          "me\" [10-S6]",
    "Gu": "a French novel (1986), on laying down the deuce of spades: \"Little Cassino, a point "
          "for you, if you take it\", in translation [10-S62]",
    "Ti": "the German \"eine Karte für den Tisch bringen\" (bring a card for the table), in "
          "translation [05-S45]",
    "Bt": "the Swedish dealer's warning, \"Båten går!\" (the boat's leaving), in translation "
          "[05-S34][10-S24]",
    "Ka": "KASA, the South African game: \"8 out\", said on taking your own build of eight [12-S6]",
    "Sc": "the Italian game's shout at a sweep, \"Scopa!\" [05-S49]",
    "MP": "the Mineral Point Tribune (1878): \"It's hard on those who get swept.\" [04-S102]",
    "SM": "the Sporting Magazine (1793): \"Ne'er leave one card upon the board alone\" [08-S2]",
    "Rd": "the Richmond Dispatch (1894), asked which card one would be: \"I'd be the big "
          "cassino, because it counts so much every one would be after me.\" [04-S140]",
    "Mo": "Morehead: \"In Casino 'all' you have to do is keep track of the cards.\" [08-S14]",
    "Bg": "a board-game review: \"The cards in your hand are not yours until you have captured "
          "them\" [02-S57]",
    "Da": "a strategy blog reasoning aloud from what an opponent did: \"he must not have a Ten\" "
          "[08-S37]",
    "Ol": "a letter of 1804: cassino played \"very much at our leisure\" [04-S45]",
    "It": "the Italian table's \"Tocca a te\" (your turn) [05-S50]",
    # The period books on card play and their banter (research/13-table-banter.md),
    # for the seventh play-testing's ribbing and follow-ups.
    "Pp": "Pope, The Rape of the Lock, canto III (1714): \"swept the board\", \"On one nice Trick depends "
          "the gen'ral fate\", \"Now to the Baron fate inclines the field\", \"Too soon dejected, and too "
          "soon elate\", \"Sad chance of war!\" [13-S1]",
    "Au": "Austen: The Watsons (c. 1804), \"he lets nobody dream over their cards\"; Pride and Prejudice "
          "(1813), Mr. Collins \"apologizing if he thought he won too many\"; Mansfield Park (1814), \"The "
          "game will be yours\", \"No cold prudence for me\", \"with my usual luck\" [13-S3][13-S4][13-S5]",
    "Lm": "Lamb, \"Mrs. Battle's Opinions on Whist\" (1821): \"A clear fire, a clean hearth, and the rigour "
          "of the game\", \"cards were cards\", \"a long meal\", \"She fought a good fight: cut and "
          "thrust\", \"great battling, and little bloodshed\", those who \"play at playing\", one who "
          "\"neither showed you her cards, nor desired to see yours\" [13-S6]",
    "Dc": "Dickens: Pickwick (1836-37), \"Never was such luck\", \"Never was such cards\", \"the cards "
          "were against him\", \"you're a trump\"; Nickleby (1838-39), \"We have all the talking to "
          "ourselves\", \"I never had such luck, really\", \"We intend to win everything\", \"gains may be "
          "great\"; The Old Curiosity Shop (1840-41), \"many hundred thousand games of cribbage\"; Dombey "
          "and Son (1846-48), \"heave ahead\" [13-S7][13-S8][13-S9][13-S10]",
    "Tr": "Trollope: The Warden (1855), \"thrice has constant fortune favoured\", one who \"counts all his "
          "suits\"; The Way We Live Now (1875), \"I never saw a fellow have such a run of luck\", \"one run "
          "of luck\" [13-S13][13-S18]",
    "Mt": "Mark Twain: \"Science vs. Luck\" (c. 1867), \"I call it a game of science!\"; Roughing It "
          "(1872), \"I'll have to pass, I judge\", \"you've ruther got the bulge on me\" [13-S14][13-S17]",
    "Bh": "Bret Harte (1868-70): \"Luck ... is bound to change\", \"start him fair\" [13-S15]; and \"I "
          "am throwing my cards on the table\" (1885), as Farmer & Henley quote it [13-S53]",
    "Et": "George Eliot, Middlemarch (1871-72): \"Come now, let us be serious!\", \"no reason why the "
          "renewal of rubbers should end\" [13-S16]",
    "Bn": "E. F. Benson, Miss Mapp (1922): \"All those shillings mine? Fancy!\", \"in a friendly game like "
          "this\", \"O poor little me\" [13-S22]",
    "Cv": "Cavendish, Card-Table Talk (1879): \"Play the one nearest your thumb\", \"not slow ... "
          "deliberate\", Clay's \"the cards must lie lucky\"; and Seymour's \"Talking is not allowed at "
          "Whist\", in Cavendish (1889) [13-S28][13-S37]",
    "Fo": "R. F. Foster: Practical Poker (1905), \"Just my luck\", walking \"three times round the chair\", "
          "\"jolly the game along\", \"the man who sees everything and says nothing\"; Foster's Complete "
          "Hoyle (1914), \"If you hads\", \"cheerful lies about their hands\", \"Fluke\", \"they have been "
          "lucky up to that time\" [13-S41][13-S44]",
    "El": "Elwell, Bridge Axioms (1907): \"Luck is a false friend\", \"He who plays the best talks the "
          "least\", \"the expert thinks before he plays\" [13-S42]",
    "Ps": "Emily Post (1922): \"a cheerful loser, a quiet winner\"; \"tranquil and cheerful even though you "
          "hold nothing but yarboroughs\" [13-S45]",
    "Sf": "Swift, Polite Conversation (1738): \"you have such good Luck at Cards\", \"my Right Hand "
          "itches\", \"a long Evening at Play\" [13-S46]",
    "Gr": "Grose (1811): \"Something may turn up trumps\", \"All his cards are trumps\", \"He studies the "
          "history of the four kings\" [13-S48]",
    "Cb": "Crabbe (1819): \"The game is never lost till won\" [13-S49]",
    "Lw": "Lowsley, Whist of the Future (1898): \"the cards resented grumbling\", \"a turning point ahead\", "
          "\"the information such hesitation conveys\" [13-S55]",
    "Hn": "Hotten's Slang Dictionary (1874): a run of luck \"very BEEFY\" [13-S52]",
    "FH": "Farmer & Henley (1891), quoting Scott (1826): \"No card seemed to turn up favourable\" [13-S53]",
    "Ug": "\"Uncle George\" (1883): \"talkative players, or those who talk for a purpose\"; \"two or three "
          "hands would bring back all of your losing\" [13-S34]",
    "Kl": "Keller (1887): \"Never exult in victory\"; a time \"when it is impossible to win a pot\" [13-S35]",
    "Cu": "Curtis (1901): \"no run of luck can be expected to continue indefinitely\" [13-S40]",
    "Pb": "\"Pembridge\" (1880, 1895): players who grumble in the belief \"it will bring them luck\" [13-S38]",
    "Gs": "The Habits of Good Society (1859): \"Lose without a murmur, win without triumph\" [13-S25]",
    "Dh": "Dick's American Hoyle (1864), cribbage: \"Be careful, watchful, and steady\" [13-S26]",
    "Tl": "The Tatler (1831), a charming whist player: \"I never speak when I play\" [13-S50]",
    "Sk": "Schenck (1880): success in the game is \"good luck; good cards; plenty of cheek; and good "
          "temper\" [13-S29]",
    "Gt": "the Gettysburg Times (1926): \"Deal me in!\" [13-S64]",
    "Lc": "Lessons in Citizenship (1921), a good loser: \"I hope I'll beat you next time\" [13-S63]",
    "Od": "Our Deportment (1881): \"Never hurry any one who is playing\" [13-S33]",
    "Pe": "Pettes (1881): \"Well, play something\"; whist and talk, like turning \"somersaults\" [13-S30]",
    "Bs": "\"Bob Short\" (1791): \"When in doubt win the trick\" [13-S47]",
    "Ct": "Cooke (1896): \"nor undue exultation at winning\" [13-S39]",
    "Pl": "Pole (1889): \"keep your eyes on the table\" [13-S36]",
    "T": "the table's own",
    "Pt": "play-testing: a line asked for word for word",
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
        ("Sweeps don't count.", "H"), ("We'll leave them out.", "T"))
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
        ("Lowest card deals.", "T"), ("Ace is low. Low deals.", "T"))
    add("cut-again", ("Equal. Cut again.", "T"), ("A tie. Cut again.", "T"), ("The same. Again.", "T"),
        ("Even. Once more.", "T"), ("Equal cards: cut again.", "T"))
    add("my-deal",("My deal.", "T"), ("I deal.", "T"), ("I'll deal.", "T"),
        ("The deal is mine.", "T"), ("Mine is lower. I deal.", "T"))
    add("your-deal", ("Your deal.", "T"), ("You deal.", "T"),
        ("You're dealing.", "T"), ("The deal is yours.", "T"), ("Yours is lower. Your deal.", "T"))

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
        ("That clears the board.", "Lo"), ("Swept clean!", "Ru"), ("The table's clear.", "T"), ("Scopa!", "Sc"),
        ("Swept the board!", "Pp"))
    add("cash", ("Cash.", "P"), ("Cash!", "T"), ("An ace for an ace.", "T"), ("Ace takes ace.", "T"),
        ("That's cash.", "T"), ("Ace on ace: cash.", "T"))
    # A capture that takes a cassino card, or a haul of several cards, when no
    # sweep or cash speaks for it.
    add("take-big-casino", ("Now I have Big Cassino.", "Sw"), ("Luck! Big Cassino.", "Ar"),
        ("The big one's mine.", "Sw"), ("I'll have the good ten.", "P"), ("That's two points.", "T"),
        ("Big Cassino comes to me.", "T"), ("Two, Mr. Judge!", "Ec"))
    add("take-little-casino", ("I have Little Cassino.", "Sw"), ("The little one's mine.", "Sw"),
        ("I'll have the good two.", "P"), ("Little Cassino, and a point.", "T"), ("That's a point.", "T"),
        ("Cassino's younger brother!", "Po"), ("One, Mr. Judge!", "Ec"))
    add("take-many", ("A good haul.", "T"), ("That's a grab!", "Fi"), ("Taken in, every one.", "F"),
        ("As many as I can, with one card.", "Lo"), ("In they all come.", "T"), ("Quite a pile.", "T"),
        ("That was a big cassino for me.", "Fs"))
    add("clinch-cards", ("That's the cards.", "P"), ("Twenty-seven. The cards are mine.", "T"),
        ("That's twenty-seven.", "T"), ("I've made cards.", "L"), ("Twenty-seven cards. Three points.", "T"),
        ("The cards are made.", "T"))
    add("clinch-spades", ("Seven spades.", "P"), ("That's the spades.", "T"), ("Seven spades. The point is mine.", "T"),
        ("Seven. The spades are mine.", "T"), ("I've made spades.", "T"), ("Seven spades, and the point.", "T"))
    # What you left, pointed out as an observation, never a reproach.
    for r, name in RANKS.items():
        add(f"left-{r}", (f"You left the {name}.", "Do"), (f"The {name} was left behind.", "Do"),
            (f"The {name} was there for you.", "T"), (f"The {name} could have come too.", "T"),
            (f"You might have had the {name}.", "T"), (f"Dejado! The {name}.", "Do"))
    add("left-more", ("You left a few there.", "Do"), ("More could have come with it.", "T"),
        ("There was more for you there.", "T"), ("A few were left behind.", "Do"), ("There were more to take.", "T"),
        ("No 'if you hads' from me. But still.", "Fo"))
    add("residue", ("And the rest are mine.", "T"), ("The last cards come to me.", "T"), ("I'll take what's left.", "T"),
        ("The last trick is mine.", "F"), ("Last to take, so the rest are mine.", "T"), ("Those come to me.", "T"))

    # The game's end: one line, your opponent's (the seventh play-testing:
    # "the opponent should say 1 thing to me, no more"), gracious when you
    # have won.
    add("good-game", ("Good game.", "T"), ("Well played.", "T"), ("Thank you for the game.", "T"),
        ("Well done.", "T"), ("Nicely played.", "T"), ("A good game. Thank you.", "T"),
        ("A good fight. Cut and thrust.", "Lm"), ("Great battling, little bloodshed.", "Lm"), ("You're a trump.", "Dc"),
        ("Congratulations! I'll get you next time.", "Lc"), ("Cheerful in defeat, as they say.", "Ps"))
    # The court card's last word, when you lose: the game's end shows that
    # your opponent was a playing card all along.
    add("quite-normal", ("You are quite normal.", "Pt"))

    # The chatter (play-testing: the talk "VERY verbose", the conversation a
    # part of the game, as where Cuarenta is played loud and full of sayings).
    # Heard only when everything is, and said only where it has room. Its
    # {slots} are filled by the talk: {card}, {cards}, {acard} a rank's name
    # ("nine", "nines", "a nine"); {value} a total; {taker}, {ataker} the
    # card that takes it; {values} a build's value in the plural ("eights");
    # {old} a build's value before a raise. Nothing said claims a card the speaker
    # cannot be known to hold, nor what the speaker cannot know (that a
    # trail had nothing to take, except on a table swept clean).
    add("new-hand", ("New hand.", "T"), ("Fresh cards.", "T"), ("Here we go again.", "T"), ("Another hand, then.", "T"),
        ("Shuffled and ready.", "T"), ("A new hand. Good luck.", "T"), ("Cards again.", "T"))
    add("deal-more", ("Four more each.", "T"), ("More cards.", "T"), ("Four apiece.", "T"), ("Here's four more.", "T"),
        ("And four each.", "T"), ("Fresh cards for us both.", "T"), ("Four more, and on we go.", "T"),
        ("Another four.", "T"), ("Cards coming.", "T"))
    add("last-reply", ("Make them count.", "T"), ("Already?", "T"), ("The last ones, then.", "T"),
        ("The boat's leaving!", "Bt"), ("Down to the wire.", "T"), ("Last cards. Choose well.", "T"))
    add("trail", ("{Acard} for the table.", "Ti"), ("I'll lay down {acard}.", "T"), ("Just {acard}.", "T"),
        ("The {card} goes down.", "T"), ("Just following along: {acard}.", "F"),
        ("Here's {acard} for you.", "T"), ("{Acard}, and we'll see.", "T"), ("Let's see. {Acard}.", "T"),
        ("I'll let the {card} go.", "T"))
    # The run of play (the sixth play-testing: the talk "staccato", each line
    # about its own move): a trail onto a table swept clean, and the third
    # trail running; a capture that ends such a run, and one of the card
    # just trailed.
    add("trail-fresh", ("Nothing to take. {Acard}.", "T"), ("A fresh start: {acard}.", "T"), ("Back to it: {acard}.", "T"),
        ("Starting again with {acard}.", "T"), ("Something to begin with: {acard}.", "T"))
    add("trail-again", ("Still nothing for me.", "T"), ("Another for the table.", "T"), ("Nothing again: {acard}.", "T"),
        ("Biding my time: {acard}.", "T"), ("Patience. {Acard}.", "T"), ("The table grows: {acard}.", "T"))
    add("take-at-last", ("At last!", "T"), ("Finally, something.", "T"), ("That's more like it.", "T"),
        ("Worth the wait.", "T"), ("About time I took one.", "T"), ("There we are, at last.", "T"))
    add("take-trailed", ("Thanks for the {card}.", "T"), ("Just the {card} I wanted.", "T"), ("I was hoping for that {card}.", "T"),
        ("That {card} didn't stay long.", "T"), ("Your {card} comes in handy.", "T"), ("The {card}? I'll have it.", "T"),
        ("It's all thanks to you, I think.", "Dc"))
    add("trail-ace", ("Ace, you won't fall on me.", "Ec"), ("An ace, and I'll risk it.", "T"), ("I'll let an ace go.", "T"),
        ("An ace for the table.", "Ti"), ("An ace. Careful, now.", "T"))
    add("trail-little-casino", ("Little Cassino: a point, if you take it.", "Gu"), ("The deuce of spades. Yours, if you can.", "T"),
        ("A point on the table. Who'll have it?", "T"), ("Little Cassino goes down.", "T"))
    add("trail-big-casino", ("Big Cassino goes down.", "T"), ("Two points on the table.", "T"),
        ("The good ten. Yours, if you can.", "P"), ("Big Cassino, for whoever can take it.", "T"))
    add("take-pair", ("{Cards}.", "T"), ("A pair of {cards}.", "T"), ("{Card} takes {card}.", "T"), ("{Acard} for {acard}.", "T"),
        ("{Card} on {card}.", "T"), ("I'll pair the {card}.", "T"), ("The {cards} go together.", "T"),
        ("{Cards}, thank you.", "T"), ("That {card} is mine.", "T"))
    add("take-sum", ("That makes {value}.", "T"), ("{Value} on the nose.", "T"), ("Adds up to {value}.", "T"),
        ("{Value}, all told.", "T"), ("And that's {value}.", "T"), ("{Value} exactly.", "T"), ("Those make {value}.", "T"),
        ("Together, {value}.", "T"), ("I'll take those: {value}.", "T"))
    add("take-own", ("{Value} out.", "Ka"), ("And there's my {value}.", "T"), ("My {value}, as promised.", "T"),
        ("The {value} comes home.", "T"), ("Told you: {value}.", "T"), ("Safe and sound: my {value}.", "T"))
    add("take-theirs", ("I'll have your {value}.", "T"), ("Your {value}? Thank you kindly.", "T"), ("I had {ataker} too.", "T"),
        ("Thanks for building it.", "T"), ("Your {value} comes to me.", "T"), ("I'll take your build, thanks.", "T"))
    add("lost-build", ("My build!", "T"), ("Oh, I was building that!", "T"), ("There goes my {value}.", "T"),
        ("You had one too!", "T"), ("Hey, that was mine!", "T"), ("Oh, you rascal!", "T"), ("Well spotted.", "T"),
        ("In a friendly game like this?", "Bn"))
    add("raised-mine", ("Hey, that was my {old}!", "T"), ("{Value} now? Clever.", "T"), ("You've raised my build!", "T"),
        ("Up to {value}, is it?", "T"), ("My {old}, made {value}.", "T"), ("It's yours now, then.", "T"))
    # A build answered with what it tells of the builder's hand (never an
    # empty "Noted."); or, where it says more, for the card the other just
    # trailed, a build made surer by its builder, or another's build joined.
    # And a build taken back by its builder, as its call said, answered.
    add("build-reply", ("{Value}, is it?", "T"), ("So you have {ataker}.", "Da"), ("I'll remember that {value}.", "T"),
        ("{Value}? We'll see.", "T"), ("You must have {ataker}, then.", "Da"), ("{Ataker} in your hand, then.", "Da"),
        ("Holding {ataker}, are you?", "T"), ("That means {ataker}.", "Da"), ("One {taker} accounted for.", "T"))
    add("build-on-mine", ("Building on my {card}?", "T"), ("So that's what my {card} was for.", "T"), ("My {card}, put to work.", "T"),
        ("You found a use for my {card}.", "T"), ("My {card}, made {value}.", "T"))
    add("build-more-reply", ("Making sure of it.", "T"), ("More {values}, then.", "T"), ("Piling on the {values}.", "T"),
        ("Locked up tight.", "T"), ("{Values}, and more of them.", "T"))
    add("joined-mine", ("So you have {ataker} too.", "Da"), ("Taking over my {value}?", "T"), ("My build's yours now.", "T"),
        ("{Values} all round, then.", "T"), ("We're both building {values}?", "T"))
    add("own-build-reply", ("As I thought.", "T"), ("I thought you had it.", "T"), ("There it goes.", "T"),
        ("Just as you said.", "T"), ("No surprise there.", "T"), ("Fair enough.", "T"))
    add("sweep-reply", ("Well played.", "T"), ("Clean as a whistle.", "T"), ("Not a card left!", "T"),
        ("It's hard on those who get swept.", "MP"), ("Never leave one card alone, they say.", "SM"),
        ("Oh, nicely done.", "T"))
    add("big-casino-gone", ("Such luck!", "Ar"), ("There goes Big Cassino.", "T"), ("I had my eye on that one.", "T"),
        ("Ah, the good ten.", "P"), ("Two points, just like that.", "T"), ("Everyone was after that one.", "Rd"),
        ("Sad chance of war!", "Pp"))
    add("little-casino-gone", ("There goes the little one.", "T"), ("Ah, the deuce of spades.", "T"), ("A point for you.", "T"),
        ("Little Cassino, gone.", "T"), ("The good two. Nicely done.", "P"))
    add("ace-gone", ("There goes an ace.", "T"), ("An ace for you.", "T"), ("Ah, that ace.", "T"), ("One ace gone.", "T"),
        ("A point, that ace.", "T"))
    add("haul-reply", ("Leave some for me!", "T"), ("That's a handful.", "T"), ("Quite a haul.", "T"),
        ("Save a few for me.", "T"), ("That was a big cassino for you.", "Fs"))
    add("think", ("Hmm.", "T"), ("Let me see.", "T"), ("Now then.", "T"), ("Decisions, decisions.", "T"),
        ("Let me think.", "T"), ("What have we here?", "T"), ("Keep track of the cards, they say.", "Mo"),
        ("Cards in hand aren't yours till taken.", "Bg"), ("Tocca a me. My turn.", "It"), ("Hmm, what to do.", "T"),
        ("Oh, poor little me, is it?", "Bn"))
    add("think-take", ("With this one, I'll fall on you.", "Ec"), ("Aha.", "T"), ("I think I see something.", "T"),
        ("Now, what have we here?", "T"), ("Oh, I like this.", "T"), ("Wait, wait. Yes.", "T"),
        ("When in doubt, take it.", "Bs"), ("My right hand itches. Good sign!", "Sf"))
    add("idle", ("Take your time.", "T"), ("No hurry.", "T"), ("At your leisure.", "Ol"), ("Tocca a te. Your turn.", "It"),
        ("If I were a card, I'd be Big Cassino.", "Rd"), ("Thinking it over?", "T"), ("Whenever you're ready.", "T"),
        ("A tough one?", "T"), ("No dreaming over your cards!", "Au"), ("Play the one nearest your thumb!", "Cv"),
        ("Whenever you're ready, heave ahead.", "Dc"), ("Take your own time. I insist.", "Od"))

    # The seventh play-testing: "add even more IF X then Y triggers ... think
    # about metatextual ones- you've been playing for a while with no
    # builds, so the opponent gently ribs you", from the period books on
    # card play (research/13-table-banter.md), PG: luck, speed, the score and
    # the run of play, never the player. All chatter.
    # A word to begin the game on.
    add("game-start", ("A clean table, and the rigour of the game.", "Lm"), ("Come now, let us be serious!", "Et"),
        ("Good luck, good cards, plenty of cheek.", "Sk"), ("Deal me in!", "Gt"), ("A fresh deal all round. Start fair.", "Bh"),
        ("Gains may be great. So may losses.", "Dc"))
    # The run of play: a long while without a build of yours; your fourth
    # trail running; your opponent's own fourth, its dry spell; a third
    # capture running, yours ribbed and theirs enjoyed.
    add("rib-no-builds", ("No builds in a while!", "T"), ("Playing, or only playing at playing?", "Lm"),
        ("Saving your builds for later?", "T"), ("All pairs and trails, I see.", "T"),
        ("Small cards, no builds, still smiling!", "Ps"), ("A builder's game, this. Just saying.", "T"))
    add("rib-trails", ("Another for the table? Generous!", "T"), ("Trumps may turn up yet.", "Gr"),
        ("Are you sandbagging me?", "T"), ("Laying them all down, are we?", "T"), ("You're feeding me nicely.", "T"),
        ("Some hands, nothing comes. Patience.", "Kl"))
    add("own-dry-spell", ("I'll have to pass, I judge.", "Mt"), ("Just my luck.", "Fo"),
        ("If I grumble enough, luck will turn.", "Pb"), ("Shall I walk three times round my chair?", "Fo"),
        ("No grumbling. The cards resent it.", "Lw"), ("Cards on the table: I'm stuck.", "Bh"),
        ("No card turns up for me.", "FH"))
    add("rib-streak", ("Three running. Fortune favours you.", "Tr"), ("That's a beefy run of luck!", "Hn"),
        ("Lucky at cards today, aren't you?", "Sf"), ("No run lasts forever, they say.", "Cu"),
        ("Another? You're on a run.", "T"))
    add("own-streak", ("I never had such luck, really!", "Dc"), ("My usual luck!", "Au"),
        ("Pure fluke. I'll take it, though.", "Fo"), ("Couldn't play it better, I flatter myself.", "Dc"),
        ("All those cards mine? Fancy!", "Bn"))
    # Luck felt: a second sweep in a hand, both Cassinos to one player.
    add("sweep-again", ("Never was such luck!", "Dc"), ("Never were such cards!", "Dc"),
        ("Again? Such good luck at cards!", "Sf"), ("All your cards are trumps today.", "Gr"), ("Swept again! What a hand.", "T"))
    add("both-cassinos", ("Both Cassinos! Lucky at cards today.", "Sf"), ("The big one and the little one, both!", "Sw"),
        ("Both of them? Never was such luck!", "Dc"), ("Three points of Cassinos. Well done.", "T"),
        ("Both Cassinos to you. Fancy!", "Bn"))
    # Your clinch: your opponent sees you counting.
    add("counting-you", ("Counting all your suits, are you?", "Tr"), ("Studying the history of the four kings?", "Gr"),
        ("Sees everything, says nothing. I'm nervous.", "Fo"), ("I won't ask to see your cards.", "Lm"),
        ("Eyes on the table, as the books say.", "Pl"))
    # The score, as each new hand is dealt: your opponent far ahead, far
    # behind, close near the end, a comeback either way, a long game.
    add("score-ahead", ("Sorry. I think I've won too many.", "Au"), ("I intend to win everything.", "Dc"),
        ("No crowing yet. Fortune kicks back.", "Kl"), ("Luck? I call it a game of science!", "Mt"),
        ("Win without triumph. I'm trying.", "Gs"), ("Forgive my undue exultation.", "Ct"))
    add("score-behind", ("The game will be yours, certainly.", "Au"), ("You've got the bulge on me, partner.", "Mt"),
        ("The cards are against me.", "Dc"), ("I never saw such a run of luck!", "Tr"), ("You've been lucky. So far.", "Fo"),
        ("Luck's a fair-weather friend, you know.", "El"))
    add("score-close", ("It all comes down to this hand.", "Pp"), ("Never lost till it's won!", "Cb"),
        ("Don't get nervous now.", "T"), ("Careful, watchful, steady. Here we go.", "Dh"),
        ("The cards must lie lucky now.", "Cv"), ("I do love a determined opponent.", "Lm"))
    add("score-comeback-you", ("Now fate leans your way.", "Pp"), ("There, you see? Luck changes.", "Bh"),
        ("Too soon down, too soon up.", "Pp"), ("A good hand or two, and you're even.", "Ug"), ("Your turning point, was it?", "Lw"))
    add("score-comeback-them", ("Don't begrudge me one run of luck.", "Tr"), ("No cold prudence for me!", "Au"),
        ("Luck's bound to change, you know.", "Bh"), ("My turning point, I think.", "Lw"), ("Trumps turned up at last.", "Gr"))
    add("score-long", ("A long meal, this game.", "Lm"), ("No reason this should ever end.", "Et"),
        ("A long evening at play, this.", "Sf"), ("I could wish this lasted forever.", "Lm"),
        ("Our hundred-thousandth game, I think.", "Dc"))
    # What was said, followed up: a Cassino trailed as "a point, if you take
    # it" and taken; a build raised from under its builder, taken back by
    # them; kept waiting, then your move.
    add("take-offered", ("You did say if I could take it!", "T"), ("Don't mind if I do.", "T"),
        ("As offered. Thank you kindly.", "T"), ("Taken, as you said I might.", "T"), ("I could, so I did.", "T"))
    add("take-back-raised", ("Mine again, I think.", "T"), ("Back where it belongs.", "T"),
        ("You raised it for me. Thank you!", "T"), ("And back it comes, bigger.", "T"), ("Raised for me? How kind.", "T"))
    add("waited-take", ("Worth the wait!", "T"), ("Not slow. Deliberate.", "Cv"), ("Thinking first: the expert's way.", "El"),
        ("So that's what you were plotting.", "T"), ("Patience rewarded.", "T"))
    add("waited-other", ("All that thought, and there it is.", "T"), ("Well, you played something!", "Pe"),
        ("Hesitating? That tells me something.", "Lw"), ("Deliberate, not slow. I know.", "Cv"), ("Worth the thinking, I hope.", "T"))
    # Your opponent on its own talk, which keeps the game lively, and you
    # from counting quietly.
    add("talkative", ("I have all the talking to myself, it seems.", "Dc"), ("Just jollying the game along.", "Fo"),
        ("Good thing this isn't whist.", "Cv"), ("Am I talking too much? On purpose?", "Ug"),
        ("Pay no mind. Cheerful lies, mostly.", "Fo"), ("But cards are cards.", "Lm"), ("I never speak when I play. Ha!", "Tl"),
        ("Best players talk least. Oh dear.", "El"), ("Talk and play? Like turning somersaults.", "Pe"))
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
        "(`cassino-lit-review.md`, Appendix B), and, for 13-S, the note on",
        "card-table banter in the period books (`research/13-table-banter.md`).",
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
        # A line play-testing gave word for word ("Pt") is said its own way.
        assert len(ways) >= 2 or all(source == "Pt" for _, source in ways), f"{gid} is said only one way"
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
