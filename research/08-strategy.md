# 08 — Cassino strategy and tactics: a cited compendium

Scope: every piece of playing advice I could fetch and read for Cassino/Casino (2-, 3- and 4-handed, Royal, Spade, Nordic/Finnish Kasino) and for closely related fishing games (Scopa, Scopone, Escoba, Pasur, Krypkasino, African Casino, Seep, Cuarenta, Basra, Diloti). It is organized by theme. Each tip gives **the tip**, **why**, **sources**, and **whether sources agree**. A final section turns the material into **AI-opponent difficulty tiers**.

Conventions: `[Sx]` points to the Sources list at the end. Quotes are verbatim, keeping the source's spelling (the 18th-century long-s is shown as "s"). Non-English quotes come with my translation. Anything I worked out myself, rather than read in a source, is marked **[Derived — not from a source]**.

---

## 0. Where the classical advice comes from (lineage)

This matters because many "independent" Hoyle editions repeat one text.

- **Earliest set of strategy maxims found: Robert Long, *Short Rules for Playing the Game of Cassino* (1792).** It is a 12-page pamphlet with nine numbered maxims and a few notes [S1]. Its first maxims are "I. Take up the Card played by your Adversary in Preference to any other. II. Take up Spades in Preference to the other Suits. III. When you hold a Pair, play one of them. IV. Aim at clearing the Board always, but forego an Advantage rather than give your Enemy that Chance. V. Never play a Ten while Great Cassino is in, nor a Deuce while Little Cassino is unplayed." [S1, p.3]
  - Note: Parlett's Penguin Book says "Cassino first appears in an edition of Hoyle in 1808" [S53]. The 1792 pamphlet [S1], the 1793 magazine [S2] and the 1796 Jones Hoyle [S3] read for this report all predate that.
- **The most detailed early treatment: *The Sporting Magazine*, vol. III (London, Nov 1793 – Jan 1794).** It ran "Rules and Instructions for playing the Game of Cassino" in three instalments: 21 numbered rules, many of them strategic, plus a mock-heroic verse on the points [S2]. Several of Long's maxims reappear here almost word for word, sometimes expanded with qualifications.
- **The "Hoyle" maxims.** *Hoyle's Games Improved*, revised by Charles Jones (1796), has a short "principal objects" paragraph [S3]. That paragraph was copied, with small edits, into:
  - Bohn's *Hand-book of Games* (1850) [S4]
  - *The American Hoyle* (1864, as "Maxims for Playing") [S5]
  - Dick's *American Card Player* (1866), which says "The following rules are given by Hoyle, and adopted by all his continuators" [S6]
  - Seymour's *New Hoyle Standard Games* (1929) [S11]

  The full-text search I ran on archive.org for the phrase "when three aces are out" also turns it up in the *Sporting Magazine* (1793), *The Field Book* (1833), Hoyle editions of 1814/1835/1847/1859, and Hoyle's Standard Games (1924), among others (search results from archive.org full-text search; I only read [S2–S6, S11] in full).
- **R. F. Foster's independent "Suggestions for Good Play"** (Foster's Complete Hoyle, 1897; reprinted unchanged in 1909/1914) is the other main classical source [S9].
- **20th-century American "pointers"** come mostly from Albert H. Morehead and Geoffrey Mott-Smith: *Games for Two* (1947) [S12], *Culbertson's Card Games Complete* (1952) [S13] and *Hoyle's Rules of Games* (1946; 1983 printing read) [S14]. They are supplemented by Scarne (1973) [S15], Silberstang (1972/1979/1996) [S16], Hervey (1977/1982) [S17] and Arnold (1988) [S18].
- **Modern web sources:**
  - pagat.com (John McLeod) [S19–S29]
  - Psellos, a Cassino app developer whose page is the only one that does an expected-value calculation [S36]
  - hobbyist blogs [S37–S38] and BoardGameGeek [S39–S42]
  - Finnish Kasino pages [S35, S46]
  - Italian/Spanish Scopa/Scopone/Escoba strategy material, including the "Chitarrella" rules [S30–S33, S47]

---

## 1. Priorities: what is worth capturing

**1.1 "Cards" (the 3-point majority) is the biggest single prize; go for it above everything else.**
- Why: in standard scoring, the majority of cards is 3 of the 11 points.
- Sources:
  - Foster: "Go for 'cards' in preference to everything else, and always make combinations that take in as many cards as possible." [S9]
  - Sporting Magazine rule 21: the majority of cards "is of great consequence, and makes the difference of six points" (3 won plus 3 denied) [S2]
  - Long VII: "Try to win the Majority of the Cards, and take up as many as you can with one Card." [S1]
  - Culbertson: "In general, play to win as many cards as possible until the points for cards are settled." [S13]
  - Morehead (Hoyle's Rules): "Try for cards above all else so long as you have a chance." [S14]
  - Silberstang: "it is better to take in three cards than two spades in most cases." [S16]
  - Cassell's example: with a 9 and a K in hand and 6, 3, K on the table, take the 6+3 "as, that will help to a majority in cards." [S7]
- Agreement: strong in standard Cassino. Morehead [S12] and Culbertson [S13] add a stop rule: "you don't want to strain for cards or spades after you have won a majority" [S12].
- **Disagrees for Nordic Kasino.** There, most spades is worth 2 and most cards only 1, so pagat recommends taking a lone Q♠ over capturing three cards [S20] (see §12).

**1.2 Prefer spades when the choice is otherwise even.**
- Sources:
  - Long II [S1]. Long also says "Always prefer the Spades to the other Suits, because they make a Point in the Game" [S1, p.6].
  - Hoyle/Bohn/American Hoyle: "In making pairs and combinations a preference should generally be given to spades, for obtaining a majority of them may save the game." [S4] (same text in [S3, S5, S6, S11])
  - Foster: "give preference to those containing spades, and if you have to trail, do not play a spade if you can help it." [S9]
  - Culbertson: "Playing from a pair, prefer to take in with a spade, to trail with a non-spade." [S13]
  - Morehead: "Take a spade in preference to another card when you can, until you have the majority." [S14]
  - Cassell's: with 9♥ and K♠ in hand and a 9 and a K on the board, "he should take the king in preference to the nine, as it will secure him a spade." [S7]
- **Qualification (1793):** "Take up spades, in preference to any other suit, if it is a matter of indifference which pair, of two, you take: but the desire of taking spades should never bias your play, unless your adversaries have taken all the other points, and have evidently taken more cards than you, then you must endeavour to make the spades, in order to save the game." [S2, rule 3]
- Agreement: universal as a tie-breaker. The sources disagree only on how much weight spades get against cards (see 1.1).

**1.3 Secure the "cash points" (Big Cassino ♦10, Little Cassino ♠2, aces).**
- Peel/"Baxter-Wray": "Secure the Cassino cards on the first opportunity, also aces and spades, after which aim to make as many combinations as possible, leaving the pairs until last, unless they be the ten or the two, which are always best got off the board as early as possible, so as to prevent the opponents making the Cassinos if they have them in hand." [S8]
- Danon blog: "Whenever you play Cassino your first priority should be to save any point cards you can from the table or from in your hand. Only if there aren't any point cards to worry about should you start to think about grabbing any other cards you can." [S37]
- Dan…on games "Pro Tips": "Don't be greedy. If you can take a point card, just take it." Example: with an Ace and Four on the board and 2, 5, 7 in hand, "don't use the Two to build Seven; just take the Ace and Four with the Five." [S38]
- Agreement: broad. **Tension:** the "Saving your Ten" trick deliberately leaves Big Cassino on the table for a turn (see 6.4).

**1.4 With Big Cassino and an Ace both on the board, take the Ace first.**
- Why: an ace can be taken by many combinations. The ten can only be taken by another ten.
- Sources:
  - 1793: "if the great cassino and an ace be upon the board, and you have a ten and an ace in your hand, take up the aces in preference, as the aces may be taken by combination, and the ten can only be taken by another ten." [S2, rule 5]
  - Repeated in Hoyle [S4, S5, S6, S11] as "great cassino can only be paired".
- Agreement: all classical sources agree.

**1.5 Take the opponent's trailed card in preference to cards that were already on the table.**
- Long I [S1]; 1793 rule 2 [S2]; Hoyle line: "always prefer taking up the card laid down by the opponent" [S4, S5, S6, S11]; Foster: "As between cards which were on the table and those trailed by an adversary, take in those trailed if you have a choice." [S9]
- Why: no source states one. A likely reading is that a freshly trailed card is the one the opponent is trying to set up, so taking it denies him the follow-up. **[Derived — the sources give no rationale.]**
- Agreement: unanimous in the classical line (1792–1929).

**1.6 Prefer the capture that takes the most cards; combine before pairing early in the deal.**
- Hoyle: "At the commencement of a game, combine all the cards possible, for that is more difficult than pairing; but when combinations cannot be made, do not omit to pair" [S3, S4, S5, S6, S11].
- Foster's example: "If you have a Nine, and the cards on the table are 2 2 5 7, take in the 2 2 5, in preference to the 2 7." [S9]
- Peel: "make as many combinations as possible, leaving the pairs until last" [S8].
- Agreement: yes.

---

## 2. Memory, card counting and inference

**2.1 Remember the cards. Every source puts this first.**
- Long, final note: "It is recommended to the Players to remember the Cards played, as no one can be permitted to refer to the Tricks." [S1, p.12]
- 1793 rule 20: "It is of importance to remember how many tens, aces, and deuces have been played, and whether two court cards of the same sort were turned up at first on the board: this is more essentially necessary, as no one can be permitted to refer to the tricks, or count the number of tricks he has made." [S2]
- 1796 Hoyle: "The principal objects are to remember how many Tens, Aces, and Deuces have been played" [S3]. Later Hoyles shorten this to "remember what has been played" [S4, S5, S6, S11].
- Foster: "The principal thing in Cassino is to remember what has been played especially in the counting and high cards, such as Aces, Eights, Nines, and Tens." [S9]
- Morehead (Games for Two): "If you want to be an expert, you must above all else train your memory. In the last deal, you should know the rank of every card held by your opponent. At every stage before that, you should know how many cards of each rank are still to come. This is not so difficult as it sounds, because happily you do not have to bother about the suits." [S12]
- Morehead (Hoyle's Rules): "In Casino 'all' you have to do is keep track of the cards." [S14]
- Scarne: "The important thing is to keep a mental count of the cards, spades, and points you have taken in." [S15]
- Hervey: "a player must have a good memory and much mental alertness. He has to remember not only how many cards he has taken in tricks, but how many his opponent has taken; not only how many Spades he has taken but also how many his opponent has." [S17]
- Chitarrella (Scopone): "Chi non ha memoria o e' incapace di concentrazione costante, lasci lo scopone e vada a giocare alle biglie." ("Whoever has no memory or cannot concentrate constantly should leave Scopone and go play marbles.") [S30]

**2.2 Which cards to track (a priority order).** The sources weight the tracking load differently:

| Source | Track first | Explicitly *not* worth tracking |
|---|---|---|
| 1793 [S2] | tens, aces, deuces; whether court cards were turned up as a pair | — |
| Foster 1897 [S9] | aces, eights, nines, tens | — |
| Culbertson 1952 [S13] | "cash points" (♦10, ♠2, aces); "likewise the highest spot cards, tens, nines and eights" | "Most players do not make a great effort to remember all other cards" |
| Silberstang [S16] | aces, ♦10, ♠2, plus "how many 10s and 9s have been played … they become the ultimate builds" | face cards: "They play themselves, and, at the end of a deal, all will have been taken in since they cannot be built upon." |
| Psellos [S36] | "A good initial goal is to keep track of the face cards and aces." | — |
| Danon [S38] | number of 10s played (for Big Cassino), aces, Little Cassino | — |
| Seres (Finnish Kasino) [S35] | "Try to remember how many aces there are left." | — |

- **Disagreement on face cards.** Psellos says start with face cards [S36]. Silberstang says face cards need no tracking [S16]. The two may be talking about different games: Psellos's app is Royal-Cassino style, where courts are numeric (13/12/11) and are prime builders. Silberstang describes standard Cassino, where courts can only pair.

**2.3 Track running totals of cards and spades taken (yours and the opponent's).**
- Culbertson: "Good players keep count of the cards and spades each player has taken in." [S13]
- Silberstang: "keep a running count of the cards you have taken in. Since the player holding the majority of cards scores three points, this is a critical area of the game." [S16]
- Scarne's worked example: with 23 cards and 3 points already, take 3+5+8 with the 8 (reaching 27 cards, so the 3 points for cards are locked) rather than take the aces, which "will lose if, as is possible, you don't take another card." [S15]
- Hervey's example: with 9, 9 in hand and a 6+3 available, combine for three cards "if he has counted the cards and knows that he has the majority". Otherwise trail a 9 and call "Nines" to win four cards next turn, accepting the risk of the opponent holding a red 9. [S17]
- Threshold: 27 cards clinch "cards"; 7 spades clinch "spades" (pagat notes some players claim "as soon as one player has captured 7 or 27 of them respectively") [S19].

**2.4 Track unpaired ranks ("spariglio" counting) to know the opponent's last hand.**
- Culbertson (Cassino): "try to know the opponent's last four cards by keeping track of cards unpaired because of building. For example, a four and three are taken in by a seven; the ranks [3], 4, 7 are unpaired. If later a four and two are taken by a six, the previous four is paired but the unpaired cards now are 2, [3], 6, 7. When the final hands are dealt, all unpaired cards not paired by the table or by your own hand will be in the opponent's hand." [S13] (The scanned text prints "8" for 3; corrected in brackets.)
- The same idea appears in Scopa/Scopone:
  - Chitarrella's "contare il Quarantotto" ("counting the forty-eight"): "Se il mazziere ricorda gli sparigli, alla fine del gioco … potra' sapere dalle carte in tavola chi ha in mano le tre carte superstiti." ("If the dealer remembers the unpairings, at the end … he can tell from the table cards who holds the three remaining cards.") [S30]
  - The modern "metodo del 48" [S47]
  - pagat Scopone: "Remembering which cards are unpaired is especially important for the dealer" [S23]
- Agreement: Cassino and Scopa sources describe the same technique independently. It is the expert-level counting technique.

**2.5 Infer the opponent's hand from plays they did NOT make.**
- Culbertson: "When there are several cards on the table, it is often possible to figure out an opponent's hand by plays he failed to make. This should be done systematically: 'If he had a ten he would have done this, if he had a nine he would have done that,' and so on." [S13]
- Danon's "Saving your Ten": if the opponent trails while Big Cassino sits on the table, "there is no way he would leave Big Cassino sitting there if he could take it, so he must not have a Ten." [S37]
- BGG thread: if your build is still there on your turn, "it is likely that your opponent doesn't have a 6". The reply notes the inference is weaker when the opponent had other uses for his turn. [S40]
- Nordic: "If the other two players have already played without taking these cards, our player can be fairly confident that neither of them has a 10 or a Queen." [S20]
- saannot.com (Finnish): "Jos vastustaja ei ottanut helppoa korttia, hänellä todennäköisesti ei ollut sopivaa kättä. Käytä tätä tietoa hyväksesi" ("If the opponent did not take an easy card, he probably had no suitable card. Use this information.") [S46b]
- Scopone/Scopa:
  - Di Palma & Lanzi's encoding of the Chitarrella–Saracino rules: "if a player did not do a scopa move, we can fairly assume that the card required for the scopa was not in her hand" [S48]
  - dimensionepoker: when the opponent fails to capture from a busy table, "prova a calcolare tutte le combinazioni che avrebbe potuto prendere e cerca di lasciargli identiche combinazioni" ("work out all the combinations he could have taken and leave him the same ones") [S47a]
- Caveat (Psellos): its own computer opponent "doesn't try to guess your cards based on the plays you choose to make", which the developer calls a weakness humans can exploit [S36].

**2.6 Early-deal probability rule of thumb (2-player).**
- Psellos: "At the beginning, the probability that your opponent has at least one of a particular card is 9% for each of those cards you can't see … your opponent is holding 4/44, or around 9%, of the unseen cards." Two unseen kings means about 18%; four unseen nines about 36%. "The 9% rule is only good at the very beginning of a game." [S36]
- Endgame: in the last round, if you hold two kings and none are on the table, the chance the opponent has one is 0% or 100% depending on whether the other two have been played [S36].

**2.7 Endgame arithmetic: totals and parity.**
- In Scopa (40 cards, values 1–10) the deck totals 220. The "regola del 220 / di Luciani" subtracts everything seen from 220 to get the sum of the opponent's last cards [S47a].
- Pagat on Escoba: "The values of all the cards in the pack add up to 220 … so at the end of the play there will be 10, 25, 40 or 55 points left on the table. Knowing this can be very helpful in working out what cards the other players have left in the last deal." [S24]
- A "pari e dispari" (odd/even) rule also exists for Scopa's last hand [S47a, S47b].
- **[Derived — not from a source]:** In standard Cassino the numeral cards A–10 of four suits also total 4 × 55 = 220 (courts have no pip value). So the subtraction trick carries over. In Royal Cassino (J=11, Q=12, K=13, aces as 1) the total is 4 × 91 = 364.
- **[Derived]:** The Scopa parity rule does **not** carry over cleanly. A Cassino capture can take several equal-value groups at once (Foster: "two such combinations might be gathered at the same time, 3, 2, 6, 7" [S9]), so the cards removed in one capture need not sum to an even number.

---

## 3. Trailing: what to discard and why

**3.1 Trail court cards first (standard Cassino).**
- Why: they can only pair, so they are least useful to the opponent and least useful to you.
- Sources:
  - Long VIII: "When obliged to lay down a Card, let it be a Court-Card, or a little one, but keep the Aces if possible." [S1, p.4]
  - Long p.7 gives the reason: court cards "can only take up as many of the same Kind as are on the Board, and are less profitable than the Eights, Nines, Tens, &c." [S1]
  - 1793 rule 10: "put down court cards in preference to others, as the court cards can never be of any other use than to make a pair; but other cards, may, by combination, take many to great advantage." [S2]
  - Hoyle line: "to clear the hand of court cards, which cannot be combined, and are only of service in pairing or in gaining the final sweep" [S3, S4, S5, S6, S11]
  - Silberstang: "In trailing cards, it is wise to first play the face cards if they are odd cards." [S16]
- **Exception (last deal):** keep a court card back to take the last trick (see §8).

**3.2 If no court cards, trail small cards, except aces (and Little Cassino).**
- Hoyle: "it is best to play any small ones, except Aces, as thereby combinations are often prevented." [S4, S5, S6, S11]. The 1796 text omits "except Aces" [S3].
- Foster: "In trailing it is usually the best policy to play the smaller cards, except Aces and Little Cassino, because as other players will probably trail small cards also, these may be combined and won with the larger cards kept in the player's hand." [S9]
- **Strong disagreement from Psellos (Royal-Cassino app, 2-player):** small cards combine with many table cards, so trailing one hands the opponent captures. "in the initial plays to a round, it is generally better to trail higher cards, especially if there are already several cards on the table … In the beginning of a round, all other things being equal, we suggest you trail middle-valued cards (between sevens and jacks, say), and then trail lower valued cards as the round progresses." [S36]
- Pasur advice (pagat, Ali Jahânshiri): "it'd be better to play a high card because it's less probable that your opponent can use it to make a combination." [S25]
- Reconciliation **[Derived]:** Foster trails small cards because he expects to *collect* them with the big cards he keeps (offence). Psellos trails high or middle cards to *deny* captures (defence), and shifts to low cards as the opponent's hand shrinks. Psellos's courts are numeric, which makes his high cards combinable too. An AI should let the trail choice depend on how many cards the opponent still holds.

**3.3 Never trail a ten while Big Cassino is out, or a deuce while Little Cassino is out.**
- Why: you hand the opponent a card he can pair with the Cassino.
- Sources: Long V [S1]; 1793 rule 5 [S2]; Hoyle "While great or little Cassino is in, avoid playing either a ten or a deuce." [S4, S5, S6, S11]
- Foster's variant: "If Big Cassino is still to come, avoid trailing cards that will make a Ten with those on the table." [S9]
- Morehead: "When feasible, avoid trailing with a card that allows ten to be built from the table, so long as Big Casino has not appeared." [S12]
- Agreement: unanimous. The modern sources extend it from "tens" to "anything that makes ten".

**3.4 Don't trail an Ace (or the Cassinos) unless it is safe; know when it becomes safe.**
- 1793 rule 12: "When three aces are out, it is good play to put down the fourth ace the first card; but never, on any account, to reserve it after the first round."
- Hoyle: "When three aces are out, take the first opportunity to play the fourth, as it then cannot pair". The 1796 text adds "nor combine". [S3, S4, S5, S6, S11]
- Foster: "If three Aces have been taken in, play the fourth … at the first opportunity, because it cannot be paired; but if there is another Ace to come, keep yours until you can make a good build with it." [S9]
- Choosing between Ace and Little Cassino as a forced trail: trail Little Cassino. 1793 rule 14: "If you hold one ace, and the little cassino, and must put down one, let it be the latter; because your adversaries can only gain one point by taking up the little cassino; but they gain two, if they happen to pair the ace." Hoyle: the Ace "may be paired by the opponent, and make a difference of two points" [S4]. (A paired ace gives the opponent two aces.)
- Inference-based exception (1796): "when any Player holds an Ace and has reason to imagine the Antagonist has neither Ace nor Nine, then 'tis advisable to play that Ace." [S3]
- Position-based timing (1793 rule 11): if few aces are out "and the elder or second hand holds one; he should watch an opportunity, when there are only tens or court cards on the board, or when it makes but few combinations, to put it down: the third hand and dealer should reserve it to the last." [S2]
- Silberstang: "If you hold the little casino (♠2) or any ace, it is not wise to play it as a trail card. It is best to retain it, in the hope that your opponent also holds a 2 or ace and plays it first." [S16]
- Seres (Finnish Kasino): "It is not advisable to leave an ace as the last card." [S35] (Ambiguous. In that game an ace is 14 in hand but 1 on the table, so "an ace can not be taken using another ace" [S35].)

**3.5 Trail ranks that are dead or nearly dead.**
- 1796 Hoyle: "When the Deuces are out, an eight is an eligible Lead; and when the Trays, a Seven, as they cannot then be combined." [S3] (With every 2 gone, nothing can turn an 8 into a 10 capture; same logic for 3s and 7s.)
- Nordic: "It is sometimes best to trail a card of a rank that has already been played. For example if someone has just captured an 8 with an 8, playing another 8 is unlikely to help your opponents." [S20]
- Nordiccardgames.com: "The safest card to let go is usually a rank that has just been used up" [S44]
- Cuarenta: "play something that has already been played … an already-played-card or face-card is a good choice"; "Playing an Ace is bad because it adds up with just about anything." [S27]
- Escoba: "if three sixes have already been played and you hold the fourth, it is safe to play a caballo [9] to the empty table." [S24]
- Agreement: cross-game consensus.

**3.6 Trail a card you hold a pair of (the "pair trick" / calling setup).**
- Long III/IX and 1793 rule 4: "When you hold a pair play one of them."
- 1793 rule 15 and Long p.7–8: with two of a kind in hand and a third on the table, "you may … lay down one of them, and wait your turn; and, if it should not be matched by your adversary, you may lay down the third, and take up the former two with it … But this method of playing is not to be adopted, when the fourth card is out." [S2; S1 p.8 "N.B. This ought only to be done when the Fourth Card is out." — the two texts disagree on this condition]
- Hoyle: "When you hold a pair, lay down one of them, unless when there is a similar card on the table, and the fourth not yet out." [S4, S5, S6, S11]
- Note on the disagreement: Long (1792) says do it *only when* the fourth is out. The 1793 magazine says do *not* do it *when* the fourth is out. Hoyle's "unless … the fourth not yet out" reads closer to Long. Logically, Long and Hoyle are right: if the fourth card is out, the opponent cannot hold it, so the trap is safe. **[Derived interpretation.]**
- Scopone equivalent (Chitarrella): "Chi non puo' prendere, giochi una doppia, cioe' una carta di cui possiede l'eguale." ("Whoever cannot capture should play a double, a card he holds a twin of.") [S30]
- pagat Scopone: "you should lead, or leave on the table, cards which you hold two or more of in your hand." [S23]
- it.wikipedia Scopa: playing a card you hold two of reduces the risk of conceding a sweep [S32].
- Morehead's counter-caution about *building* (not trailing) a pair: "Beware of building a pair, when you have a third of the same rank, if there are some middling or low cards on the table … To get one extra card, you have committed yourself to the build". At the next turn you may want to be free to make another build. [S12]

**3.7 Don't trail spades if you can help it.**
- Foster [S9]; Culbertson [S13]; pagat Nordic: "it is better not to … trail a spade if there is a reasonable alternative" [S20]; nordiccardgames: "Thirteen spades are in the deck and seven of them settle the point, so each one you hand over counts." [S44]

**3.8 Trailing to set up your own play, and trailing as a bluff.**
- BGG review: "Sometimes you can bluff by trailing instead of building, since building announces your next move." [S39]
- Danon's "Trailing Build": trail 4♦ next to an opponent's 4♥ so both fours plus a 2 can be built to Ten next turn, to save Big Cassino. "losing a couple of non-pointers doesn't matter". He notes this is best used "later in the round". [S37]
- officialgamerules.org: "Trailing strategically can set up a later play." [S45]
- Partnership: trail a card for partner (see §10).

**3.9 Low-value cards and position (dealer vs non-dealer).** See §9.

---

## 4. Building tactics

**4.1 When to build vs. capture now: expected value.**
- Psellos: an immediate capture is certain. A build risks the opponent holding the capturing rank. Example: K, K in hand, 5 and 8 on the table, with a ~20% chance the opponent has one of the two unseen kings. Capturing now = EV 3. Building kings to take 4 next turn = 0.8 × 4 − 0.2 × 3 = 2.6, so capture. "Furthermore, … if you capture immediately, you are still left with a king in your hand". (Psellos counts each card as one point-unit in this illustration.) [S36]
- Rule of thumb: "In the early rounds you should build only if you get more than 1 extra point, and capture immediately otherwise. After a few rounds have been played, you could factor in how many cards are outstanding and be willing to make a few more builds." [S36]
- Danon: "The odds that the one card you're not taking will make a difference in winning Cards doesn't make up for the odds of losing your build"; "sometimes you have to build in order to have a chance at keeping a point card. Think about when it's a good time to take a risk … (based on the score primarily)." [S38]
- Finnish saannot.com: "Älä rakenna mökkiä, jos sinulla ei ole turvallista korttia ottaaksesi sen" ("Don't build if you don't have a safe card to take it with") [S46b]. Note that this site uses "mökki" for builds, while elsewhere "mökki" means a sweep [S35].
- officialgamerules.org: "Never create a build your opponent can immediately capture." [S45]
- BGG: "Knowing when to build and when to capture is a fine art, partly related to the scoring and partly to your opponent's play." [S39]

**4.2 Build with your cash cards early (in the right seat).**
- Morehead (Games for Two): "In the early play, do not avoid building with aces and Little Casino for fear that your opponent will take the build. Your chances of saving these low cards are better by building than by trailing. At a late stage of play, your knowledge of what cards are left may occasionally show you that trailing is safer." [S12]
- Morehead (Hoyle's Rules): "When dealt a cash card, plan how you can possibly save it. If you are dealer, build with it as soon as possible. If you are nondealer, and nothing better offers, save it for your last play, since you will have first chance at it next deal." [S14]
- **Disagreement:**
  - Silberstang: build with the ace or ♠2 only "If you have the correct count on 9s and 10s and know a build with the ace or ♠2 added is safe" [S16].
  - Danon's "Decoy": rather than put 2♠ on an 8 for Ten (risking Little Cassino if the opponent has a Ten), build 3♥+7♥ to Ten first as a decoy, then make "the 'real' build" next turn [S37].

**4.3 Multiple (doubled) builds protect; single builds invite raising.**
- Foster: a doubled build "cannot be increased … nothing but a 7 will win it." [S9]
- gambiter (older Wikipedia text): "The first form of building is a weaker form of protection, and primarily protects cards against combination by mid-to-high range cards. Natural building is a much stronger protection, and prevents adversaries from taking cards unless they hold a card of specific face value" [S43]
- BGG (Scopa thread): "Building groups cards together so that they are less likely to be captured, but you get more if you capture them." [S41]
- Arnold's annotated hand: a 9 on the table that "duplicated the build of 9 for non-dealer, saved him from an unlucky play". As a simple build it could have been raised by the dealer's ♦A to "Building 10", "capturing on his next turn four cards including an Ace and big casino." [S18]

**4.4 Raise and steal the opponent's builds.**
- Foster: "Take in the adversary's build in preference to your own, if you can, and build on his build at every opportunity." [S9]
- 1864 terminology example: Seven raised to "Nine", then "Ten". The original builder's card is no longer available [S5].
- Silberstang (letting the opponent build first): with J, 6, 9, 10 in hand and 3, J, 5 on the board, "first take in the jack. If you build nine, your opponent may take it in. Let him build first … he may very well put the 5, 3, and ace into a nine build, and then you can take in his build." [S16]
- Silberstang on information leaks: once your Ten build has been taken, "knowing you have a 10 he will play to avoid letting you build to 10." [S16]
- Rules caveat: whether you may raise your own build varies. Foster argues "there is no reason why a player should be denied a privilege which is freely granted to his adversary" [S9]. Building rules vary widely between houses [S19, S43]; the tactics depend on which rule is used (§13).

**4.5 Builds and the "obligation to act".** Under most rule sets the builder may not trail while his build stands [S19, S12, S13, S14]. The tactical consequences:
- Under the Hoyle-style rule "the builder has a profound advantage; if they know that their adversary lacks the cards necessary to steal their build, they can often take several cards trailed by their adversary before taking in their build at the end of the round" [S43].
- A rule that forces the builder to take or add on the next turn "allows the adversary to trail a card they wish to subsequently capture without the risk of it being taken, reducing the builder's advantage." [S43]

**4.6 Building is worth more in 2-player than 4-player.**
- "In a two-player game, one requires only one adversary to be bereft of the necessary cards; in a four-player game, one requires three adversaries … building effectively in a two-player game can be very advantageous, but in a four-player game is very difficult." [S43]
- Danon: "once you get into 3 and 4 player games strategy becomes pretty iffy." [S37]

**4.7 Prefer building to blocking sweeps.** A BGG reply suggests using a 2 to make an 8 "only … if there were one other card on the board, and you were trying to defend against a sweep." [S40]

**4.8 High-value build monopolies (African Casino; relevant to Royal Cassino with aces = 14).**
- "Build piles with a high capture value are most powerful, because they are easy to augment … If your opponent has a pile of 13's or 14's, all your cards are potentially at risk." [S22]
- "it is particularly important not to release your queens, kings and aces too early if this may give your opponent a monopoly." [S22]
- "capturing early can put you at a disadvantage, especially in the three-player game, because your capture pile then becomes available to your opponents to augment their builds" (an African-Casino-specific rule) [S22].

---

## 5. Holding cards ("keeping back")

**5.1 Hold a non-diamond 10 / non-spade 2 as an answer to the Cassinos.**
- pagat Nordic: "If you have a non-spade 2 in your hand, it may be good to hold onto it in case the player before you eventually has to play the lillan, which you can capture. The same applies to a non-diamond 10, which might capture the storan." [S20]
- nordiccardgames: "Keep back a 10 in another suit if you have one, because it is the surest answer to Big Casino when somebody is finally forced to trail it. A 2 outside spades does the same job for Little Casino." [S44]
- Silberstang (aces and ♠2): hold them hoping the opponent plays his first [S16].

**5.2 Hold Big Cassino when the other tens are out; or play it quickly when it is safe.**
- 1793 rule 16: "Sometimes too, having the great cassino in your hand, (the other three tens being out) you should prefer putting down a small card, which, by combination, makes the number ten on the board, in hopes of taking up the combined cards with the great cassino."
- 1793 rule 17: as dealer with Big Cassino in the last four cards (other tens out) "and no court card to preserve for the sweep, keep the cassino, to give you a chance of combination; unless you have an eight or a nine, when it would be good play to put down the cassino, reckoning on the probability of having it in the sweep."
- **Disagreement on tempo:**
  - Silberstang: "If you hold the ♦10 (big casino or Good Ten), try and cash it in as soon as possible." Example: take the 7+3 build with ♦10 rather than build another ten with 4+6 [S16].
  - Seres (Finnish): "Sometimes it pays to play a card such as an ace or a big kasino as quickly as possible". If you hold ♦10 and another 10 and every table card is over 5, trail the ♦10 and take it back next turn with the other 10, because a small card trailed later makes this much harder [S35].
  - saannot.com (Finnish) warns the opposite: don't take ♦10 early with small cards; "Säästä iso Kasino moneen korttiin" ("save Big Kasino for a many-card capture") [S46b].

**5.3 Hold a court card to the end of the last deal (see §8).**

**5.4 Hold big cards for big captures; hold low cards for safety at the right moment.**
- Foster: keep larger cards to collect the small cards others trail [S9].
- saannot.com: "Säilytä isot kortit … loppupeliin" ("Keep big cards … for the endgame") [S46b].
- Krypkasino (misère) reverses this: "get rid of your higher cards (especially aces) early if you can do so cheaply, because when you are down to one or two cards … these high cards are more likely to capture cards that you do not want" [S21].

---

## 6. Sweep avoidance and sweep set-up

**6.1 Don't leave one card, or cards one card can take, on the table, but know the exceptions.**
- 1793 rule 21 (the most nuanced classical statement): "It is laid down as a general rule, not to leave on the board one card only, or such cards as, by combination, may be taken with one card, lest your adversaries should clear the board: but this should not be the practice at all times; as the majority of cards is of great consequence … some risk is worth hazarding. This general rule, however, should never be attended to at the beginning of a game, when, by combination, you can take up many cards; nor when you can take up any point; nor when a trick or two will make the difference of the cards; nor when your score is high, and your adversaries have not scored more than two or three." It closes by quoting the mock-heroic poem: "Ne'er leave one card upon the board alone; / Lest your quick foe should find a partner meet, / And add a counter for the glorious feat" [S2].
- Long IV: "Aim at clearing the Board always, but forego an Advantage rather than give your Enemy that Chance." [S1]
- Danon: "Try to maintain 'sweep defense'. Don't leave the board with only one card (or two cards that can be taken together) unless you have to." [S38]
- BGG: "Sometimes it is better to trail than to capture, normally because the capture would give your opponent a sweep." [S39]
- Morehead: "Taking in a face card is usually a safe, non-committal play, but not if it leaves the possibility of a sweep open to your opponent." [S12]
- Nordic/Finnish/Norwegian: avoid leaving totals of 14, 15 or 16 (the hand values of Ace, ♠2 and ♦10). Seres: "Avoid laying a card which makes a combination of 14, 15 or 16 together with the cards on the table." [S35]. Norwegian Wikipedia: "spolere muligheten hans ved å unngå at det ligger en samlet verdi av 14, 15 eller 16 på bordet" ("spoil his chance by avoiding a combined value of 14, 15 or 16 on the table") [S34]. Nordiccardgames: "Breaking up a total like that is sometimes worth more than one extra capture." [S44]
- Scopa/Scopone/Pasur analogues:
  - Leave a total of at least 11 (Scopa: "evitando di lasciare sul tavolo carte per un valore totale minore o uguale a 10" [S32]; Scopone [S23]; Pasur [S25]; dimensionepoker rule 1 [S47a]).
  - Seep: if two loose cards are left "they should total at least 14 to avoid the danger of a sweep" [S26].
  - Escoba: don't put a card of 5 or more on an empty table [S24].
- **[Derived]** The Cassino version of "leave more than the biggest capture value": in standard Cassino the largest capture value is 10 and courts only pair. So leaving two or more different court ranks, or numeral totals above 10 with no subset summing to a likely-held rank, blocks sweeps. The classical sources state the narrower one-card version [S2, S38].

**6.2 Court-card locks.**
- Foster: "It is considered bad policy to take in three court cards, as it stops all sweeps when the fourth appears." [S9] (Meaning: once three of a rank are gone, the fourth on the table can never be captured, so no more sweeps are possible.)
- BGG review, the inverse use: "If three kings have been taken and you are dealt the fourth king, playing it will ensure no more sweeps occur that game." [S39]
- Scopone: Chitarrella's dealer reshuffles if three kings are dealt to the table, because three kings "impediscono di far scopa per tutta la mano" ("prevent any scopa for the whole hand") [S30].
- Scopa: a card only one side still holds ("carta mula") lets that side "comandare il giro" ("control the round") [S32].
- Agreement: these are consistent. Whether you *want* the lock depends on who is likelier to sweep (Foster wants sweeps; the BGG reviewer wants to deny them).

**6.3 Clearing the table to force the opponent onto an empty board.**
- Basra: "An important tactic is to clear the floor with a jack when you know that your opponent's next play to the empty floor is likely to give you a basra." [S28]
- Pasur: "clear the table with a Jack because your opponent's next play to the empty table is likely to give you a Sur." [S25]
- Krypkasino example: capture 6+2 with the 8 to leave a lone Q, setting up a queen sweep [S21].
- Cuarenta: "When the table is empty, the player whose turn it is is in trouble." [S27]
- Scopone "mulinello/whirlwind": a sweep forces the next player to trail, and partner may sweep again [S23, S30].

**6.4 Leaving a capturable point card deliberately (bait / "Saving your Ten").**
- Danon: if the opponent has just trailed past Big Cassino, he has no Ten. Leave ♦10 and take something else, hoping to build Ten onto it later. "You can't be hurt by letting Big Casino sit there, and you can very easily gain … close to half the time you will." [S37]
- Nordic (3-player): with 10, 10 in hand and 2, 5, 8, Q on the table, trail a 10 and collect 8+2+10+10 next turn. "This kind of tactic should be used with caution, and only when you are sure that an opponent is not sitting on any card that could ruin the plan." [S20]
- Nordic: deliberately leave a Q uncaptured "to prevent the next player from scoring a tabbe [sweep]" [S20].

---

## 7. Dealer vs. non-dealer (eldest) position

- **The dealer plays last in the final deal and is best placed for the last capture.** Foster: "The last trick is usually made by the dealer, who always keeps back a court card if he has one" [S9]. pagat: "it is often good for the dealer to hold back a face card to play last if possible" [S19]. nordiccardgames: "The dealer plays the final card of the round. Save a card you know will capture something" [S44].
- **Non-dealer should save cash cards and low cards for his last play of a deal,** because he plays first in the next deal and gets first chance at whatever is trailed.
  - Morehead: "If you are nondealer, and no better course offers, save a cash point card (ace or Little Casino) for your last trail, as you may be able to take it in—your first play of the next deal." [S12]
  - Culbertson: "Dealer must take a chance on building or trailing with his low cards, hoping to take them in; non-dealer (or eldest hand) should hold such cards to his last play or plays, unless he can safely build them or take them in, for he will play first on the next round and will have the best chance to take in." [S13]
  - Morehead (Hoyle's Rules): dealer builds cash cards ASAP; non-dealer saves them for last [S14].
  - 1793 rule 11 makes a similar seat-dependent split for aces (elder/second hand vs third hand/dealer) [S2].
- BGG: play an even number of hands "as dealer and eldest positions play quite differently" [S39].
- Scopa/Scopone: the dealer's side (playing last) wants to keep ranks paired; the opponents want to unpair them.
  - Chitarrella: "il mazziere e il suo compagno cerchino di mantenere le carte pari, gli avversari di sparigliarle" ("the dealer and partner try to keep the cards paired, the opponents to unpair them") [S30]; also [S23, S32, S47c].
  - Di Palma & Lanzi measured a dealer-side ("deck team") edge with random players: "the deck team … winning 45.7% … while the hand team wins 41.7%", though "the reported difference is not statistically significant for a 95% confidence level" [S48].
  - Escoba: the dealer's capture of the initial table "gives the dealer a slight advantage" (gamelearn.eu, low-reliability source) [S52].
- Cuarenta: "This is one reason why the dealer is somewhat at an advantage." [S27]

---

## 8. Last deal / last capture endgame

- **Keep a court card (or a sure capturer) for the last trick.**
  - Long: "In the last Deal, a Court-Card or some other ought to be kept to secure the Advantage of the Cards on the Board." [S1, p.12]
  - 1793 rule 16: "When you are dealer, and the cards are all dealt out, keep a court card back, to ensure the sweep."
  - 1929 Hoyle: "In the last hand dealt it is well sometimes, especially if you are the last to play, to hold a face card to take the last trick, as it may decide the cards." [S11]
  - Morehead: "in the last deal, save a face card that pairs with one on the table to the last, so as to try for the table cards if you need them to score for majority." [S12]
  - Also [S9, S19, S44, S45]
  - Long VI: "Try to win the last Trick." [S1]
- **Think of the last capture in terms of the count.** Morehead's worked example: near the end, with 20 vs 22 cards taken, the dealer trails rather than capturing the non-dealer's 8-build. "If dealer should take the build, he would lose the rest of the cards". He then builds and takes the build plus the last card, "making twenty-seven in all … a net difference of 8 points hinging on his third play." [S14]
- **In the last deal you can know the opponent's exact hand** [S12]. Use unpaired-rank tracking [S13] and the 220 total [S24; Derived §2.7].
- **Scopone dealer endgame:** "Quando il gioco volge al termine, conviene calare il 7 sparigliato e tenersi la carta pari" ("Near the end, play the unpaired 7 and keep the paired card") [S30]. Seep: the dealer with an unbreakable "house" should leave it until his last turn [S26].
- **Low-card holding for the last deal (Morehead, partly garbled scan):** "When dealt a pair of aces, or a pair of deuces including Little Casino, and your other cards give little hope of using them in a high build, your best chance is to let your opponent deplete the table. Trail with your lowest remaining card, and hold back until he has made a build or taken some of the cards from the table. Then trail a card of your pair. By that time there may be nothing left with which he can build it." [S12]

---

## 9. Score-state awareness

- **Lurch (11-point game):** Hoyle: "Attend to the adversaries' score, and, if possible, prevent them from saving their lurch, even though you otherwise seemingly get less yourself, particularly if you can hinder them from clearing the board." [S4, S11; shorter in S3]. The 1793 magazine: never risk a sweep "when your adversaries have scored five, lest they save their lurch; and especially when they have scored nine or ten, lest you give them the game." [S2]
- **Your own score:** 1793: relax the anti-sweep rule "when your score is high, and your adversaries have not scored more than two or three." [S2]
- **Counting out (21-point game):** Foster: "each player keeping mental count of the number of cards and spades he has taken in, together with any 'natural' points. The moment he reaches 21 he should claim the game … If he is mistaken … he loses the game" [S9]. Arnold: a player can claim "as soon as he has scored 21 points, e.g. if he begins the deal with 18 and takes big casino and an Ace." [S18]
- **Danon:** risk-taking "based on the score primarily" [S38].
- **Rule-dependent [Derived]:** where points are counted out in a fixed order (cards, spades, Big Cassino, Little Cassino, aces, sweeps [S9, S19]), the early items are worth more in a race to 21.

---

## 10. Partnership (4-handed) play and signalling

Cassino-specific:
- **Building for partner's declared card.** Foster: partners "may make builds which can be won by the card declared in the partner's hand … One player builds an 8, and his partner holds Little Cassino. If there is a 6 on the table, the Cassino can be built on it, and 'two Eights,' called, although the player has no 8 in his own hand" [S9]. The 1892 American Hoyle says this "should be made the subject of special agreement" [S10]. pagat lists "build for partner" as an optional rule [S19].
- **Trailing a matching card for partner.** pagat: "if you suspect that your partner has a second 10, you can play your 10 and not capture, leaving both tens on the table for your partner." [S19]
- **Protect partner's trailed ace.** 1793 rule 13: "if your partner puts down an ace, and you cannot take it up by combination, endeavour to lessen the combinations, in order to hinder your adversary from taking it." Also: "If you hold two aces, embrace the first eligible opportunity to play one, in hopes it may not be taken up till it is your turn to play again" [S2].
- **Builds as declarations.** A build announces a held card. Silberstang notes opponents use this ("knowing you have a 10") [S16]; the BGG reviewer recommends occasionally trailing instead to hide intent [S39]. In partnership, the same announcement tells partner what you hold. That is why Foster's partner-building works [S9].

From related games, where signalling by play is explicit (Cassino sources do not discuss it):
- **Doubles as signals (Scopone).** Chitarrella: playing a "doppia" "chiede al compagno di giocare a sua volta l'eguale, se l'ha" ("asks partner to play the matching card in turn, if he has it"); "Anche potendo, non bisogna prendere la carta doppia del compagno, ma lasciarla a lui." ("Even if you can, do not take partner's double; leave it to him.") [S30] pagat: "if your partner plays (say) a 5 and your LHO takes it, you should also play a 5 if you have one, because it is likely that partner holds the fourth 5." [S23]
- **Value signals (Scopa).** "se vi è un tre sul tavolo e il giocatore desidera far sapere al compagno di avere il settebello o un qualsiasi sette, può giocare un quattro. Ovviamente va tenuto conto che questi segnali sono comprensibili anche dagli avversari" ("with a 3 on the table, to tell partner you hold a 7, play a 4. Of course these signals can also be read by the opponents") [S32].
- **Drift signals (African Casino).** "a drift by the player who owns the pile signals that he or she has two more of the card in question; a drift by the other partner signals one more"; partners "may drift reciprocally, so that both can be assured that the build is safe." [S22]
- **Body-language signal (Chitarrella, Scopone):** in a risky spot, "mostrati un tantino pensieroso, perche' il tuo compagno mangi la foglia" ("look a little pensive, so your partner catches on") [S30].
- **Table-talk prohibition.**
  - Tamanini's Scopone rules: "non sono ammessi segni di sorta, commenti o suggerimenti alle giocate" ("no signs of any kind, comments or suggestions on plays are allowed") [S30b].
  - Di Palma & Lanzi: "Scopone players are not allowed to speak and players have only the information they can gather from the cards" [S48].
  - Escoba partnership: "La comunicación entre compañeros no está permitida", but experienced partners "aprenden a leer los patrones de arrastre del otro" ("learn to read each other's trailing patterns") [S52].
- **Three-handed coalition.** Pasur 3-player: help your right-hand opponent sweep to cancel a left-hand opponent's sweep [S25]. (A Hervey snippet about two trailing players combining against the leader turned up in the full-text search, but I could not confirm it refers to Casino. **[UNVERIFIED — context not seen]**)

---

## 11. Royal Cassino (courts numeric: J 11, Q 12, K 13, aces 1/14)

- **Is Royal more or less skilful? The sources disagree directly.**
  - Morehead & Mott-Smith: "This variant is much preferred by children. At the same time, it is regarded by some authorities as superior in its opportunities for skillful play." [S14]
  - Scarne: "This variant is recommended for children and family play merely because it is less strategic than regular Two-Handed Casino." [S15]
  - Seres (Finnish Rakennuskasino, Royal-like): it "lacks the charm of normal Kasino because it is possible to build on the special cards, small and big kasino." [S35]
  - Parlett (1987) sides with the variant-preferrers: "Experts tend to prefer one or more of the advanced 'variants' appended to this account". He recommends Royal Spade Cassino "for its variety". He also says the game "does not work well for three", and that because these adding-up games are "recommended for children … their potential depth has gone unnoticed, especially in Britain." [S53]
- **Trailing high cards is defensive in Royal.** Psellos (Royal rules) recommends trailing middle cards (7–J) early, because small cards combine with many table cards [S36] (§3.2). In standard Cassino courts can only pair, which is why the classical sources make trailing courts the default safe discard [S1, S2, S9].
- **High builds (13/14) are the power plays.** See African Casino [S22] (§4.8). The 9% opening probability rule and EV build test were worked out on a king-build example [S36].
- **Nordic/Finnish hand values (Ace 14, ♠2 15, ♦10 16)** make "don't leave 14/15/16 on the table" a core defensive rule [S34, S35, S44]. The Finnish site advises watching whether the opponent is building toward 16 or 15: "Tarkkaile yrittääkö vastapelaaja rakentaa 16 tai 15 pisteen yhdistelmää" [S46a].

---

## 12. Variant-specific notes

- **Nordic Kasino (most cards 1, most spades 2):** spades over cards. "Because the majority of spades is worth 2 points while the majority of cards is worth only 1, taking the ♠Q from the table may be better than capturing three cards with the 9." Another example: take 2♠-3♠-4♠ with a 9 instead of the lone 2 with lillan, "a matter of judgment … depends on how many cards are still to be played and what has been captured up to now." [S20] Seres: "Consentrate on spades, they are worth two points." [S35]
- **Spade Cassino (every spade 1, J♠ +1, 24 points + sweeps):** every spade is a point and is pegged immediately [S9]. I found no strategy text specific to it. **[Gap]** **[Derived]** Spade preference (1.2) gets much stronger and trailing spades (3.7) much worse.
- **Krypkasino / Misère (avoid points):** "avoid taking in scoring cards by creeping when possible … get rid of your higher cards (especially aces) early"; sweeps still matter; "pay attention to the play of your left-hand opponent, so that you can take advantage of the best opportunities to set up a sweep" [S21]. Laistokasino (Finnish misère): "Turvallisinta on kerätä tavallisia kortteja ja pyrkiä olemaan nostamatta silloin kun pöydässä on paljon pisteitä." ("It is safest to collect ordinary cards and avoid capturing when there are many points on the table.") [S46a]
- **Draw Cassino** (keep the hand at 4 by drawing): no strategy found. **[Gap]**
- **Scopone (Italian partnership, 9 cards):** the 7 of coins (settebello) first; avoid conceding sweeps; anchor cards and "whirlwinds"; dealer keeps ranks paired [S23, S30]. "Col settebello o con due 7 in mano bisogna sempre prendere il 7 in tavola." ("With the settebello or two 7s in hand, always take the 7 on the table.") [S30] The summary maxim: "la filosofia dello scopone insegna a saper aspettare e a guardare, oltre il lucro immediato, al risultato finale" ("the philosophy of scopone teaches you to know how to wait and to look past immediate gain to the final result") [S30].
- **Escoba (sum to 15):** avoid 5+ to an empty table; prioritize 7 of coins, then sevens and sixes, coins, cards; the 220 total [S24].
- **Pasur:** high trails; clubs; Jack clears; leave ≥ 11 [S25].
- **Seep (India):** count 9–K and point cards; leave at most two items; dealer saves the unbreakable house to his last turn [S26].
- **Cuarenta (Ecuador):** play one of a pair; count cards; face cards are safe trails; aces are bad trails [S27].
- **Diloti (Greece):** avoid captures that leave a single capturable card ("xeri") [S29].

---

## 13. Rule-dependence of tactics (an engineering warning)

Tactics change with house rules. A game should make the AI's heuristics conditional on the active ruleset.
- Whether the builder may trail, must take, or must add next turn changes the builder's advantage [S43]. pagat lists permissive variants (trail plus build in one move; trailing with a build on the table; using table cards to raise single builds; treating single builds as single cards) [S19].
- Whether you may raise your own build [S9, S43].
- Partner building [S9, S10, S19].
- Scoring (3-for-cards vs Nordic 1/2; sweeps scored or not; 11-point lurch vs 21 counting-out) changes the priority order (§1, §9) [S2, S9, S19, S20].
- Royal vs standard values change which discards are safe (§3.2, §11).

---

## 14. Agreement / disagreement summary

| Topic | Consensus | Dissent |
|---|---|---|
| Remember cards | Universal [S1–S17, S30] | — |
| Cards > spades > tie-breaks | Standard Cassino [S1, S2, S9, S13, S14, S16] | Nordic reverses it (spades 2 pts) [S20, S35] |
| Prefer spades in ties | Universal | 1793: don't let it bias play [S2] |
| Trail courts first (standard) | [S1, S2, S3–S6, S16] | Psellos (Royal): trail 7–J early [S36] |
| Trail small cards (except aces) | Hoyle line, Foster [S4, S9] | Psellos, Pasur: trail high to deny combos [S36, S25] |
| Never trail 10/2 while the Cassinos are out | Universal [S1, S2, S4, S9, S12] | — |
| Pair trick with the 4th card out | Long, Hoyle [S1, S4] | 1793 reverses the condition [S2] |
| Build with cash cards early | Morehead [S12, S14] (dealer) | Silberstang: only when safe by count [S16]; Danon decoy first [S37] |
| Cash Big Cassino ASAP | Silberstang [S16]; Seres (when safe) [S35] | saannot.com: save it for a big capture [S46b]; Danon: leave it on the table if the opponent has shown no Ten [S37] |
| Track face cards | Psellos (Royal) [S36] | Silberstang (standard): unnecessary [S16] |
| Royal Cassino skill | Morehead: "superior" per some authorities [S14]; Parlett: experts prefer the advanced variants [S53] | Scarne: "less strategic" [S15]; Seres: "lacks the charm" [S35] |
| Avoid leaving one capturable card | Universal [S1, S2, S38, S39] | 1793 lists exceptions (early game, points, close cards race, comfortable score) [S2] |
| Take 3 court cards? | Foster: bad (kills sweeps) [S9] | BGG: playing the 4th king deliberately to kill sweeps [S39] |

---

## 15. Implications for AI opponent difficulty tiers

Design principle: tiers differ in (a) what the AI *remembers*, (b) how far it *looks ahead*, (c) whether it *infers* hidden cards, and (d) how many of the classical heuristics it applies. The Scopone study is the best empirical template. It built a beginner "Greedy" bot and expert rule bots (Chitarrella–Saracino and Cicuti–Guardamagna), plus a fair ISMCTS bot that beat them, and humans won "47.6% against Greedy and 42.9% against CS … and won only the 23.8% of the matches against the fair ISMCTS player" [S48]. Rule-based bots built from traditional maxims therefore make credible mid tiers. Search with hidden-card sampling makes a credible top tier.

### Tier 1 — Beginner ("Greedy, no memory")
Behaviour, each item cited:
- Capture whenever possible; otherwise trail. This is the BGG solo-variant automaton: "If it can capture one or more cards, it will … If it can't … it will trail them … The AI does not build." [S42]
- Among captures, take the most valuable or most cards: "tries to perform the best capture available or it plays the least valuable card if a capture is not available" [S48]. Cassino prizes: cards, spades, cash points [S1, S9, S14].
- Trail simple discards: court cards first, then small cards [S1, S2, S4]. Never trail a 10/2 while a Cassino is out [S1, S4]. This is cheap to implement and makes the bot look sensible.
- Basic sweep defence: avoid leaving a lone card when possible [S38]. Di Palma & Lanzi's Greedy bot also prioritizes "moves that do not leave on the table a combination of cards which could be captured by a card that is still in play" [S48].
- No card memory, no inference, no deliberate building (or only "build if I hold the capture card and the pile ≥ N", like the hobby bot's lowest level, which disfavours special cards and caps "max amount of table cards to pick" at 2 [S50]).
- Expected feel: Psellos notes that a strong-memory bot that "doesn't try to guess your cards" is beatable "plenty of the time" [S36]. A beginner bot should be weaker than that.

### Tier 2 — Intermediate ("Hoyle player")
Adds the classical maxims and partial memory:
- Tracks the cash points and the high spot cards (♦10, ♠2, aces; tens, nines, eights) but not everything: "Most players do not make a great effort to remember all other cards" [S13]; see also [S2, S9, S16].
- Keeps running totals of cards and spades and switches priorities once a majority is clinched (27 cards / 7 spades) [S13, S15, S12, S19].
- Capture preferences: the opponent's trailed card [S1, S2, S9]; spades in ties [S4, S9]; the Ace before Big Cassino [S2]; combinations before pairs early [S4]; more cards per capture [S9].
- Trail heuristics conditioned on counts: play the 4th ace at once when three are out [S2, S9]; prefer Little Cassino over an Ace as a forced trail [S2]; trail dead ranks [S3, S20]; avoid trailing spades [S9, S13]; don't make ten while ♦10 is unseen [S9, S12].
- Builds only by a simple EV test: "build only if you get more than 1 extra point" early, more freely later [S36]. Uses multiple builds for protection [S9, S43]. Raises or steals opponent builds when holding the card [S9].
- Endgame: as dealer, keeps a court card for the last capture [S1, S9, S19]. As non-dealer, saves a cash card for the last trail of a deal [S12, S14].
- Score-aware sweep defence per the 1793 rule-21 exceptions [S2].
- Hobby precedent for tuning: the MakinenJO bot's level 3 adds `tactic_next` ("try placing card tactically for good pickup next round") and higher weights for aces, ♠2 and spades [S50].

### Tier 3 — Expert ("Morehead/Culbertson player")
Adds full memory and inference:
- Knows every rank still to come, and in the last deal the opponent's exact hand [S12]. Tracks unpaired ranks to deduce the final hands [S13, S30]. Uses the 220/364 pip total as a cross-check [S24, S47a; Derived §2.7].
- Systematic negative inference: "If he had a ten he would have done this…" [S13]; the opponent passing a Cassino means he lacks its pair [S37]; a surviving build means he lacks its rank [S40].
- Opening probability model: about 9% per unseen card per opponent card [S36]. EV comparison of capture vs build vs trail [S36].
- Seat-aware cash-card plans: dealer builds them early, non-dealer saves them [S14, S13]. Ace timing by seat [S2].
- Advanced tricks:
  - "Saving your Ten" (leave ♦10 when the opponent has shown no Ten) [S37]
  - Decoy builds to draw out an opponent's Ten [S37]
  - Trailing builds to rescue Big Cassino [S37]
  - Letting the opponent build first, then taking his build [S16]
  - Bluff-trailing instead of building to hide intent [S39]
  - Pair-trap trailing when the 4th card is out [S1, S4]
- Sweep locks: plays or holds the 4th court card depending on whether it wants sweeps [S9, S39]. Avoids leaving one-card-capturable tables unless the 1793 exceptions apply [S2].
- Score-state play: lurch denial [S4, S2]; counting out at 21 [S9, S18].
- Partnership mode (4-handed): builds for partner's declared card where the rules allow it [S9, S10, S19]; trails a matching card for partner [S19]; protects partner's trailed ace [S2]; treats a partner's repeated rank as a likely "double" signal (Scopone/African practice) [S23, S30, S22].

### Tier 4 (optional) — "Search" opponent
- Determinized search (ISMCTS) over hidden hands, seeded by the Tier-3 inference model. In Scopone, ISMCTS beat the best rule-based expert and was the hardest fair opponent for humans [S48].
- A cheating perfect-information MCTS was strongest (humans won 4.8%) but was not fair [S48]. Avoid it, or label it clearly.
- Equilibrium methods (CFR) have been applied to Pasur, a close relative, though under a simplified "full knowledge of each other's hands" setting [S49]. That paper also reports that "the distribution of high-value cards heavily influences match outcomes" [S49]. That is a reminder that even perfect play has high variance, which argues for multi-deal matches when testing tiers.

### Knobs for tuning between tiers (each tied to a sourced behaviour)
1. Memory scope: none → cash points + high cards [S13] → all ranks [S12] → unpaired-rank tracking [S13, S30].
2. Inference: off → negative inference from passed captures [S13, S37] → probabilistic hand model [S36].
3. Build appetite: never [S42] → EV-gated [S36] → seat- and score-aware [S14, S2].
4. Trail policy: courts/small [S1, S4] → count-aware dead ranks [S3, S20] → game-phase aware (high early, low late) [S36].
5. Endgame: none → keep court for last [S1, S9] → full last-deal hand reading [S12].
6. Deliberate errors at low tiers (Psellos: "Only really serious Cassino players will track all the cards" [S36]). A beginner bot that "forgets" whether ♦10 has been seen behaves like a typical human.

---

## Gaps / leads not followed

- **Parlett's Cassino strategy.** I only reached the Penguin Book (1987) and Card Games for Two (1978) through archive.org full-text snippets. From the Penguin chapter I recovered the introduction (~500 words) [S53]; from Card Games for Two, rules text only. I did not find a dedicated Cassino strategy section in what I recovered. The Oxford Guide / Oxford Dictionary of Card Games was not reached.
- **Scarne's full "Strategy at Casino"** section: only the first example was recovered [S15]. Same for Silberstang's middle portion [S16] and Hervey's continuation [S17].
- **Bicycle (bicyclecards.com).** The Casino/Cassino pages return 404, and Wayback snapshots of /how-to-play/royal-cassino etc. are 404s from 2016. No current Bicycle strategy text found.
- **Reddit:** blocked to WebSearch. PullPush was rate-limited after one query and gave nothing useful. **YouTube:** descriptions fetched (PPIC "Casino Card Game Tutorial & Strategy", Gather Together Games) contain no strategy; captions could not be retrieved. Not cited.
- **BGG:** the Casino (id 18121) "Strategy" forum has 0 threads; general/rules/review threads were read [S39–S42]. Royal Casino or other BGG entries were not checked.
- **Chitarrella dating:** pagat and the Scopone paper treat the rules as historic. Italian Wikipedia reports Pratesi's finding that the "1750" first edition is unattested and that the Scopone *jonta* was probably written in the 1930s [S31]. Treat "Chitarrella (1750)" as legendary.
- **Saracino (1963) and Cicuti & Guardamagna (1978) Scopone books:** known only through Di Palma & Lanzi's summary [S48]. Their companion summary documents ([46], [47] in that paper) were not fetched.
- **Newspapers** (Chronicling America, HathiTrust full text): the endpoints were blocked or changed, so they were not searched. Foster wrote syndicated card columns that might contain Cassino problems.
- **Spade Cassino / Draw Cassino strategy:** none found.
- **Finnish affiliate pages [S46]** are low-quality gambling-affiliate content. One (parhaatkorttipelit.fi) misstates the scoring ("Iso kasino on 3 pistettä"), so it is not cited for substantive tips. gamelearn.eu [S52] and spielkarten.org [S51] look like generic or possibly machine-written content and are cited only for minor, corroborated points.

---

## Sources

- **[S1]** Robert Long, *Short Rules for Playing the Game of Cassino* (Twickenham?, 1792), 12 pp. Maxims I–V p.3, VI–IX p.4; "Of Playing" pp.6–8; "N.B. … remember the Cards" p.12. Read from page images (OCR unusable). archive.org id `bim_eighteenth-century_short-rules-for-playing-_long-robert_1792`, https://archive.org/details/bim_eighteenth-century_short-rules-for-playing-_long-robert_1792 (page images n2–n11).
- **[S2]** *The Sporting Magazine*, vol. III (London, 1793–94):
  - "Rules and Instructions for playing the Game of Cassino", No. XIV (Nov 1793) pp.88–89, rules 1–10
  - "Further Rules for Playing", No. XV (Dec 1793) pp.124–125, rules 11–21
  - concluding instalment on four-, three- and two-handed play
  - "The Game at Cassino. A Conversation" (letter signed Carolus, Jan. 20, 1794), p.~197

  archive.org `sportingmagazine03londuoft`, https://archive.org/details/sportingmagazine03londuoft (djvu text lines ~11060–11290, 16730–16860, 25624–25780, 27099–27150).
- **[S3]** *Hoyle's Games Improved*, revised and corrected by Charles Jones, Esq. (London, 1796), "The Game of Cassino", pp.298–300. archive.org `bim_eighteenth-century_hoyles-games-improved-b_hoyle-edmond_1796`.
- **[S4]** Henry G. Bohn (ed.), *The Hand-book of Games* (London, 1850), "Cassino" pp.330–332, "Rules". archive.org `handbookofgamesc00bohn`.
- **[S5]** [W. B. Dick], *The American Hoyle; or, Gentleman's Hand-book of Games* (New York: Dick & Fitzgerald, 1864), "Cassino" pp.218–222 incl. "Maxims for Playing". archive.org `americanhoyleorg00dick`.
- **[S6]** [W. B. Dick], *The American Card Player* (New York, 1866), "The Mode of Playing Cassino" pp.128–130. archive.org `americancardplay00dick`.
- **[S7]** *Cassell's Book of In-door Amusements, Card Games, and Fireside Fun*, 3rd ed. (London: Cassell, Petter, Galpin & Co., undated, c.1881), "Cassino". Project Gutenberg #49137, https://www.gutenberg.org/ebooks/49137.
- **[S8]** Baxter-Wray [W. H. Peel], *Round Games with Cards* (London, 1891/1897), "Cassino" pp.97–100. Project Gutenberg #27819, https://www.gutenberg.org/ebooks/27819.
- **[S9]** R. F. Foster, *Foster's Complete Hoyle* (New York: Stokes, 1897; rev. 1909, 1914), "Cassino" pp.478–485 incl. "Trailing", "Last Cards", "Suggestions for Good Play", "Twenty-one Point Cassino", "Royal/Spade/Draw Cassino"; "Discrimination" in the laws chapter. Project Gutenberg #53881, https://www.gutenberg.org/ebooks/53881. The 1897 text was checked as identical: archive.org `fosterscomplete00fostgoog`.
- **[S10]** *The American Hoyle* (New York: Dick & Fitzgerald, 1892 ed.), "Cassino" pp.316–322, incl. "Three and Four Handed Cassino". archive.org `americanhoyle0000unse`.
- **[S11]** Paul H. Seymour, *The New Hoyle Standard Games* (Laidlaw Brothers, 1929), "Rules for Playing Cassino" pp.115–116. archive.org `newhoylestandard0000paul_n1n9`.
- **[S12]** Albert H. Morehead & Geoffrey Mott-Smith, *Games for Two* (1947), Casino, "Pointers on Play" (c. pp.36–38). Read through archive.org full-text-search snippets chained together; borrow-only item `gamesfortwo0000albe`.
- **[S13]** Albert H. Morehead & Geoffrey Mott-Smith, *Culbertson's Card Games Complete, with Official Rules* (1952), Casino, "Pointers on Casino play" (c. p.258). Read through archive.org full-text-search snippets; `culbertsonscardg0000albe`.
- **[S14]** Albert H. Morehead & Geoffrey Mott-Smith, *Hoyle's Rules of Games* (orig. 1946; New American Library printing 1983), Casino "Strategy of Casino" pp.171–172 and "Royal Casino" p.172. Read through archive.org full-text-search snippets; `hoylesrulesofgam00albe_0`.
- **[S15]** John Scarne, *Scarne's Encyclopedia of Games* (New York: Harper & Row, 1973), Casino, "Strategy at Casino" and "Royal Casino". Read through archive.org full-text-search snippets; `scarnesencyclope0000scar`.
- **[S16]** Edwin Silberstang, *Silberstang's Encyclopedia of Games & Gambling* (New York: Cardoza, 1996), Casino "Strategy" pp.279–281. Same text in *Playboy's Book of Games* (1972/1979). Read through archive.org full-text-search snippets; `silberstangsency00silb`, `playboysbookofga0000silb`.
- **[S17]** George F. Hervey, *Card Games for All the Family* (Teach Yourself Books, Hodder & Stoughton, 1977; 3rd impr. 1982), Casino, "Strategy". Read through archive.org full-text-search snippets; `cardgamesforallf0000herv`.
- **[S18]** Peter Arnold, *The Book of Card Games* (London: Christopher Helm, 1988), Casino, illustrative hand and counting out. Read through archive.org full-text-search snippets; `bookofcardgames0000arno`.
- **[S19]** John McLeod, "Casino", pagat.com (last updated 6 May 2026), incl. "Hint on tactics", partnership trailing example, variations. https://www.pagat.com/fishing/casino.html
- **[S20]** pagat.com, "Nordic Casino" — "Tactics" section with examples. https://www.pagat.com/fishing/nordic_casino.html (Swedish version https://www.pagat.com/fishing/kasino_i_norden_sv.html, "Taktik").
- **[S21]** pagat.com, "Krypkasino" — "Tactics". https://www.pagat.com/fishing/krypkasino.html
- **[S22]** pagat.com, "African Casino" — "Notes on tactics". https://www.pagat.com/fishing/african_casino.html
- **[S23]** pagat.com, "Scopone" — "Advice on playing Scopone". https://www.pagat.com/fishing/scopone.html
- **[S24]** pagat.com, "Escoba" — "Strategy". https://www.pagat.com/fishing/escoba.html
- **[S25]** pagat.com, "Pâsur" — "Tactics" (advice from Ali Jahânshiri). https://www.pagat.com/fishing/pasur.html
- **[S26]** pagat.com, "Seep" — "Basic Tactics". https://www.pagat.com/fishing/seep.html
- **[S27]** pagat.com, "Cuarenta" — "Tactics". https://www.pagat.com/fishing/cuarenta.html
- **[S28]** pagat.com, "Basra" — "Customs and Tactics". https://www.pagat.com/fishing/basra.html
- **[S29]** pagat.com, "Diloti". https://www.pagat.com/fishing/diloti.html
- **[S30]** "Le regole del Chitarrella (tradotte in italiano)", Sandro Tamanini, pagat.com Italian section (© 2005). https://www.pagat.com/it/fishing/chita.html. **[S30b]** Sandro Tamanini, "Lo scopone scientifico", https://www.pagat.com/it/fishing/tamanini.html
- **[S31]** "Codice di Chitarrella", it.wikipedia.org (raw wikitext fetched), citing F. Pratesi, *JIPCS* XXVII/4 (1999) 166–172. https://it.wikipedia.org/wiki/Codice_di_Chitarrella
- **[S32]** "Scopa (gioco)", it.wikipedia.org, section "Strategia". https://it.wikipedia.org/wiki/Scopa_(gioco)
- **[S33]** "Scopa", en.wikipedia.org (tactic of capturing aces and sixes for primiera). https://en.wikipedia.org/wiki/Scopa
- **[S34]** "Kasino (kortspill)", no.wikipedia.org, section "Strategi". https://no.wikipedia.org/wiki/Kasino_(kortspill)
- **[S35]** Cristian Seres, "Kasino (in English)", korttipelit.net, archived 7 Mar 2013, "The Strategy" and variations. https://web.archive.org/web/20130307135755/www.korttipelit.net/Kasino_in_English
- **[S36]** Psellos, "Cassino Strategy" (Cassino in the Browser). http://psellos.com/cassino/strategy.html (rules page http://psellos.com/cassino/rules.html)
- **[S37]** "Cassino tips and tricks", *Dan…on games!* blog, 19 Dec 2011. https://danongames.wordpress.com/2011/12/19/cassino-tips-and-tricks/
- **[S38]** "Pro Tips", *Dan…on games!* blog, 7 Apr 2011 (Cassino section). https://danongames.wordpress.com/2011/04/07/pro-tips/
- **[S39]** BoardGameGeek, Casino (id 18121), review thread "A simple and elegant card game" (2005), thread 85266. Fetched through BGG JSON `api/articles?threadid=85266`. https://boardgamegeek.com/thread/85266
- **[S40]** BoardGameGeek, "Noob questions." (2011–2016), thread 703492. https://boardgamegeek.com/thread/703492
- **[S41]** BoardGameGeek, "This vs. Scopa?" (2013), thread 952175. https://boardgamegeek.com/thread/952175
- **[S42]** BoardGameGeek, "Cassino solo variant" (2022), thread 2988271. https://boardgamegeek.com/thread/2988271
- **[S43]** gambiter.com, "Cassino – card game", sections "Advantages gained through building" and "Acting with builds on the table". The text appears to mirror an older English Wikipedia revision; the current Wikipedia article lacks it, and that provenance is unverified. https://gambiter.com/cards/Cassino_card_game.html
- **[S44]** Nordic Card Games (Runar), "Casino Card Game Rules", "Tips and strategy" (updated 18 Aug 2026). https://nordiccardgames.com/game/casino
- **[S45]** Official Game Rules, "How to Play Casino Card Game", "Strategy Tips". https://officialgamerules.org/game-rules/casino/
- **[S46]** Finnish Kasino guides:
  - (a) kasinokorttipeli.fi, "Kasino-korttipeli | Pelisäännöt sekä vinkit voittamiseen", https://kasinokorttipeli.fi/
  - (b) saannot.com, "Kasino korttipeli – Viralliset säännöt, ohjeet ja strategiat", "Strategia ja voittovinkit", https://saannot.com/kasino-korttipeli/
  - also parhaatkorttipelit.fi (not relied on; see Gaps), https://parhaatkorttipelit.fi/kasino-korttipeli-saannot-peliohjeet-ja-vinkit/
- **[S47]** Italian Scopa/Scopone strategy pages:
  - (a) DimensionePoker, "Strategie per vincere a Scopa: 6 'trucchi'" (updated 9 May 2025), https://www.dimensionepoker.com/giochi-di-carte/strategie-scopa
  - (b) Ludopoli, "Giocare a scopa online: la regola del pari e dispari!", https://www.ludopoli.it/scopa-online-regola-pari-dispari.aspx/doc/strategie_giochi_carte.aspx
  - (c) Scoponescientifico.net, "Strategie di scopone scientifico: lo spariglio", http://www.scoponescientifico.net/scopone_online_strategia.html
- **[S48]** Stefano Di Palma & Pier Luca Lanzi, "Traditional Wisdom and Monte Carlo Tree Search Face-to-Face in the Card Game Scopone", *IEEE Transactions on Games* (2018), doi:10.1109/TG.2018.2834618; preprint arXiv:1807.06813 (read in full). https://arxiv.org/abs/1807.06813
- **[S49]** Sina Baghal, "Solving Pasur Using GPU-Accelerated Counterfactual Regret Minimization", arXiv:2508.06559 (Aug 2025). https://arxiv.org/abs/2508.06559
- **[S50]** MakinenJO, "Cassino — A card game with human/AI opponents" (GitHub), `brain.py` difficulty multipliers. https://github.com/MakinenJO/Cassino/blob/HEAD/brain.py
- **[S51]** spielkarten.org, "Mastering Cassino: A Comprehensive Card Game Guide" (24 Apr 2024) (generic; corroborative only). https://spielkarten.org/en/blog/mastering-cassino-a-comprehensive-card-game-guide/
- **[S52]** gamelearn.eu, "Escoba" (Spanish), "Consejos de Estrategia", variants (low reliability; corroborative only). https://gamelearn.eu/es/card-games/escoba
- **[S53]** David Parlett, *The Penguin Book of Card Games* (1979; 1987 printing, London: Treasure), "Cassino Games" introduction and "Cassino" (pp.349–355). Read through archive.org full-text-search snippets chained together; `penguinbookofcar0000parl`.
