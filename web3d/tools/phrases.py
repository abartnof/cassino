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
    "Ha": "Harper's Bazaar (1883), a father at the count: \"The cards are a tie, Katy, so neither "
          "of us takes that point.\" [04-S135]",
    "Ar": "Ardmore's novel To Love Is to Listen (1967): at Big Casino, a player \"screamed the "
          "word, 'Luck!'\"; \"You would have big cassino for the last. Such luck!\" [04-S82]",
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
    "Ec": "Cuarenta, Ecuador's cousin of the game, played loud and full of sayings (\"hay que "
          "ponerse charlatán\": you have to turn into a chatterbox): \"Dos, señor juez\" (two, "
          "Mr. Judge), \"Con esta te caigo\" (with this one I'll fall on you), \"As que no me "
          "caerás\" (ace, you won't fall on me), in translation [05-S56][05-S57][05-S59]",
    "Fs": "Finnish, in translation: the story \"Iso casino\" (1938), \"this was a big casino for "
          "me\" [10-S6]",
    "Gu": "a French novel (1986), on laying down the deuce of spades: \"Little Casino, a point "
          "for you, if you take it\", in translation [10-S62]",
    "Ti": "the German \"eine Karte für den Tisch bringen\" (bring a card for the table), in "
          "translation [05-S45]",
    "Bt": "the Swedish dealer's warning, \"Båten går!\" (the boat's leaving), in translation "
          "[05-S34][10-S24]",
    "Ka": "KASA, the South African game: \"8 out\", said on taking your own build of eight [12-S6]",
    "Sc": "the Italian game's shout at a sweep, \"Scopa!\" [05-S49]",
    "Hk": "the Hungarian game's \"Ausz!\" (out!) [05-S12][01-S20]",
    "Gz": "the Literary Gazette (1818): \"The game is up.\" [04-S49]",
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
    "Ws": "a family's \"World Series\" of cassino, the best of seven [05-S74]",
    "Tn": "the Tunisian game's loser's plea, \"Khallini narba7 marra!\" (let me win once!), in "
          "translation [05-S67]",
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
        ("That clears the board.", "Lo"), ("Swept clean!", "Ru"), ("The table's clear.", "T"), ("Scopa!", "Sc"))
    add("cash", ("Cash.", "P"), ("Cash!", "T"), ("An ace for an ace.", "T"), ("Ace takes ace.", "T"),
        ("That's cash.", "T"), ("Ace on ace: cash.", "T"))
    # A capture that takes a casino card, or a haul of several cards, when no
    # sweep or cash speaks for it.
    add("take-big-casino", ("Now I have Big Casino.", "Sw"), ("Luck! Big Casino.", "Ar"),
        ("The big one's mine.", "Sw"), ("I'll have the good ten.", "P"), ("That's two points.", "T"),
        ("Big Casino comes to me.", "T"), ("Two, Mr. Judge!", "Ec"))
    add("take-little-casino", ("I have Little Casino.", "Sw"), ("The little one's mine.", "Sw"),
        ("I'll have the good two.", "P"), ("Little Casino, and a point.", "T"), ("That's a point.", "T"),
        ("Casino's younger brother!", "Po"), ("One, Mr. Judge!", "Ec"))
    add("take-many", ("A good haul.", "T"), ("That's a grab!", "Fi"), ("Taken in, every one.", "F"),
        ("As many as I can, with one card.", "Lo"), ("In they all come.", "T"), ("Quite a pile.", "T"),
        ("That was a big casino for me.", "Fs"))
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
        ("There was more for you there.", "T"), ("A few were left behind.", "Do"), ("There were more to take.", "T"))
    add("residue", ("And the rest are mine.", "T"), ("The last cards come to me.", "T"), ("I'll take what's left.", "T"),
        ("The last trick is mine.", "F"), ("Last to take, so the rest are mine.", "T"), ("Those come to me.", "T"))

    # The count, chanted line by line, each line by whoever wins it; a tie on
    # the cards, which scores nobody, said first. The count is written a line
    # a second, so its words are short, or the chant falls behind the sheet.
    add("count-cards-tie", ("The cards are a tie.", "Ha"), ("Twenty-six each.", "T"), ("A tie on the cards.", "T"),
        ("No points for cards.", "T"), ("Twenty-six all.", "T"))
    add("count-cards", ("Cards.", "Fe"), ("Most cards.", "T"), ("The cards.", "T"), ("Card majority!", "Hu"),
        ("Majority of cards.", "Lo"), ("Three for cards.", "T"))
    add("count-spades", ("Spades.", "Fe"), ("Most spades.", "T"), ("The spades.", "T"), ("Spade majority!", "Hu"),
        ("Majority of spades.", "Lo"), ("One for spades.", "T"))
    add("count-big-casino", ("Big Casino.", "T"), ("Ten of diamonds.", "Fe"), ("The big one.", "Sw"),
        ("Great Casino.", "Po"), ("The good ten.", "P"), ("Two for Big Casino.", "T"))
    add("count-little-casino", ("Little Casino.", "T"), ("Deuce.", "Fe"), ("The little one.", "Sw"),
        ("The deuce of spades.", "Lo"), ("The good two.", "P"), ("Little Casino, one.", "T"))
    for s, name in SUITS.items():
        add(f"count-ace-{s}", (f"The ace of {name}.", "T"), (f"Ace of {name}.", "T"), ("An ace.", "Fe"),
            ("And an ace.", "T"), (f"The {name[:-1]} ace.", "T"))
    add("count-sweeps-1", ("A sweep.", "T"), ("One sweep.", "T"), ("And a sweep.", "T"),
        ("One for the sweep.", "T"), ("Sweeps: one.", "T"))
    for n in range(2, 9):
        w = NUMBERS[n]
        add(f"count-sweeps-{n}", (f"{w.capitalize()} sweeps.", "T"), (f"Sweeps: {w}.", "T"),
            (f"And {w} sweeps.", "T"), (f"{w.capitalize()} for sweeps.", "T"), (f"That's {w} sweeps.", "T"))

    # The game: the winner claims it, the other is gracious.
    add("game-won", ("And I am out.", "N"), ("That's game.", "T"), ("Game. Twenty-one.", "T"),
        ("I claim the game.", "F"), ("I'm out.", "N"), ("Twenty-one, and thank you.", "T"), ("Out!", "Hk"),
        ("The game is up.", "Gz"))
    add("good-game", ("Good game.", "T"), ("Well played.", "T"), ("Thank you for the game.", "T"),
        ("Well done.", "T"), ("Nicely played.", "T"), ("A good game. Thank you.", "T"))
    # The court card's last word, when you lose: the game's end shows that
    # your opponent was a playing card all along.
    add("quite-normal", ("You are quite normal.", "Pt"))

    # The chatter (play-testing: the talk "VERY verbose", the conversation a
    # part of the game, as where Cuarenta is played loud and full of sayings).
    # Heard only when everything is, and said only where it has room. Its
    # {slots} are filled by the talk: {card}, {cards}, {acard} a rank's name
    # ("nine", "nines", "a nine"); {value} a total; {taker}, {ataker} the
    # card that takes it; {old} a build's value before a raise; {mine},
    # {yours}, {n} the score; {need} the points still needed. Nothing said
    # claims a card the speaker cannot be known to hold.
    add("new-hand", ("New hand.", "T"), ("Fresh cards.", "T"), ("Here we go again.", "T"), ("Another hand, then.", "T"),
        ("Shuffled and ready.", "T"), ("A new hand. Good luck.", "T"), ("Cards again.", "T"))
    add("deal-more", ("Four more each.", "T"), ("More cards.", "T"), ("Four apiece.", "T"), ("Here's four more.", "T"),
        ("And four each.", "T"), ("Fresh cards for us both.", "T"), ("Four more, and on we go.", "T"),
        ("Another four.", "T"), ("Cards coming.", "T"))
    add("last-reply", ("Make them count.", "T"), ("Already?", "T"), ("The last ones, then.", "T"),
        ("The boat's leaving!", "Bt"), ("Down to the wire.", "T"), ("Last cards. Choose well.", "T"))
    add("trail", ("{Acard} for the table.", "Ti"), ("I'll lay down {acard}.", "T"), ("Just {acard}.", "T"),
        ("The {card} goes down.", "T"), ("Nothing to take. {Acard}.", "T"), ("Just following along: {acard}.", "F"),
        ("Here's {acard} for you.", "T"), ("{Acard}, and we'll see.", "T"), ("Let's see. {Acard}.", "T"),
        ("I'll let the {card} go.", "T"))
    add("trail-ace", ("Ace, you won't fall on me.", "Ec"), ("An ace, and I'll risk it.", "T"), ("I'll let an ace go.", "T"),
        ("An ace for the table.", "Ti"), ("An ace. Careful, now.", "T"))
    add("trail-little-casino", ("Little Casino: a point, if you take it.", "Gu"), ("The deuce of spades. Yours, if you can.", "T"),
        ("A point on the table. Who'll have it?", "T"), ("Little Casino goes down.", "T"))
    add("trail-big-casino", ("Big Casino goes down.", "T"), ("Two points on the table.", "T"),
        ("The good ten. Yours, if you can.", "P"), ("Big Casino, for whoever can take it.", "T"))
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
        ("You had one too!", "T"), ("Hey, that was mine!", "T"), ("Oh, you rascal!", "T"), ("Well spotted.", "T"))
    add("raised-mine", ("Hey, that was my {old}!", "T"), ("{Value} now? Clever.", "T"), ("You've raised my build!", "T"),
        ("Up to {value}, is it?", "T"), ("My {old}, made {value}.", "T"), ("It's yours now, then.", "T"))
    add("build-reply", ("{Value}, is it?", "T"), ("So you have {ataker}.", "Da"), ("I'll remember that {value}.", "T"),
        ("{Value}? We'll see.", "T"), ("You must have {ataker}, then.", "Da"), ("I'll keep an eye on that.", "T"),
        ("Noted.", "T"), ("Building, are we?", "T"), ("{Value}. Interesting.", "T"))
    add("sweep-reply", ("Well played.", "T"), ("Clean as a whistle.", "T"), ("Not a card left!", "T"),
        ("It's hard on those who get swept.", "MP"), ("Never leave one card alone, they say.", "SM"),
        ("Oh, nicely done.", "T"))
    add("big-casino-gone", ("Such luck!", "Ar"), ("There goes Big Casino.", "T"), ("I had my eye on that one.", "T"),
        ("Ah, the good ten.", "P"), ("Two points, just like that.", "T"), ("Everyone was after that one.", "Rd"))
    add("little-casino-gone", ("There goes the little one.", "T"), ("Ah, the deuce of spades.", "T"), ("A point for you.", "T"),
        ("Little Casino, gone.", "T"), ("The good two. Nicely done.", "P"))
    add("ace-gone", ("There goes an ace.", "T"), ("An ace for you.", "T"), ("Ah, that ace.", "T"), ("One ace gone.", "T"),
        ("A point, that ace.", "T"))
    add("haul-reply", ("Leave some for me!", "T"), ("That's a handful.", "T"), ("Quite a haul.", "T"),
        ("Save a few for me.", "T"), ("That was a big casino for you.", "Fs"))
    add("think", ("Hmm.", "T"), ("Let me see.", "T"), ("Now then.", "T"), ("Decisions, decisions.", "T"),
        ("Let me think.", "T"), ("What have we here?", "T"), ("Keep track of the cards, they say.", "Mo"),
        ("Cards in hand aren't yours till taken.", "Bg"), ("Tocca a me. My turn.", "It"), ("Hmm, what to do.", "T"))
    add("think-take", ("With this one, I'll fall on you.", "Ec"), ("Aha.", "T"), ("I think I see something.", "T"),
        ("Now, what have we here?", "T"), ("Oh, I like this.", "T"), ("Wait, wait. Yes.", "T"))
    add("score-mine", ("I have {mine}; you have {yours}.", "T"), ("{Mine} to {yours}, my way.", "T"),
        ("That's {mine} to {yours}.", "T"), ("{Mine}, {yours}. I lead.", "T"), ("I lead, {mine} to {yours}.", "T"))
    add("score-yours", ("You lead, {yours} to {mine}.", "T"), ("{Yours} to {mine}. Your lead.", "T"),
        ("You have {yours}; I have {mine}.", "T"), ("{Yours}, {mine}. You're ahead.", "T"), ("You're up, {yours} to {mine}.", "T"))
    add("score-tie", ("{N} all.", "T"), ("All square at {n}.", "T"), ("{N} each.", "T"), ("Level, at {n}.", "T"),
        ("Even: {n} apiece.", "T"))
    add("score-reply-ahead", ("So far, so good.", "T"), ("I'll take it.", "T"), ("Long may it last.", "T"),
        ("Early days yet.", "T"), ("The cards are kind tonight.", "T"))
    add("score-reply-behind", ("I'll catch up.", "T"), ("Plenty of game left.", "T"), ("Not over yet.", "T"),
        ("My turn next hand.", "T"), ("We'll see about that.", "T"))
    add("score-reply-tie", ("Neck and neck.", "T"), ("Anyone's game.", "T"), ("As it should be.", "T"), ("Nothing in it.", "T"))
    add("need", ("Just {need} more.", "T"), ("{Need} to go.", "T"), ("Only {need} more for me.", "T"),
        ("{Need} more, and I'm out.", "N"), ("I'll make cards. That's all I need.", "L"))
    add("rematch", ("Another game?", "T"), ("Same again?", "T"), ("Shall we go again?", "T"), ("Best of seven?", "Ws"),
        ("One more?", "T"))
    add("rematch-reply", ("You're on.", "T"), ("Gladly.", "T"), ("Let me win one back.", "T"), ("Let me win once!", "Tn"),
        ("Deal them up.", "T"))
    add("idle", ("Take your time.", "T"), ("No hurry.", "T"), ("At your leisure.", "Ol"), ("Tocca a te. Your turn.", "It"),
        ("If I were a card, I'd be Big Casino.", "Rd"), ("Thinking it over?", "T"), ("Whenever you're ready.", "T"),
        ("A tough one?", "T"))
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
