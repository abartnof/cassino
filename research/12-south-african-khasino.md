# 12 — The South African game ("Khasino"): sources, rules, disagreements

Scope: the 40-card South African Cassino, called **Khasino** by its governing body, the Khasino Association of Southern Africa (KASA). This note gathers enough to write a rules document for a third game alongside Classic and Royal. The two-player game comes first. Partnerships and three- or four-hand play are covered briefly.

Method: everything was fetched on 3 October 2026. The KASA site (khasino.co.za) and KASA's online game (play.khasino.co.za) are single-page apps with empty HTML, so their text was read from the JavaScript bundles that an anonymous browser downloads, using a JavaScript tokenizer and the esbuild pretty-printer. Nothing was logged into, posted or bought. The one backend call made was the one the public /rules page makes for itself (its "last updated" date). The referee exam questions are only fetched for a signed-in user and were left alone. Open-source code (tier 6) comes from a separate survey of GitHub repositories. Its clones were spot-checked for the lines cited here.

Citation keys `[Sn]` are listed under **Sources** at the end. "Tier" follows the source priority set for this note: 1 = KASA's current site and rulebook; 2 = earlier KASA documents; 3 = other organised play; 4 = documented player descriptions; 5 = apps; 6 = open-source code; 7 = forums, social media, videos and app reviews. KASA's own online game is classed as tier 3: organised-play software that KASA recognises and that reports results to KASA.

---

## 1. Source inventory and authority

### 1.1 The sources

| Key | Source | Who / when / for whom | Derived from | Tier | Assessment |
|---|---|---|---|---|---|
| [S1] | KASA **/rules** page, "Official Rulebook… Master the Art of Khasino" (khasino.co.za/rules) | KASA, a non-profit company in Durban. The page's own date is "Last updated" **28 June 2026** (from the page's `page_content` record, `updated_at` 2026-06-28T09:39Z). Written for players, referees and organisers: "It enables players, referees and organisers to resolve disputes consistently" [S2] | New prose. It keeps the 2023 document's deck, deal, scoring and "small card on top" rule. Stealing types, "Cupha", "Khasino sweep" and the "double" limit on augmenting are new | 1 | **Canonical in intent but loosely drafted.** The site was built with Lovable, an AI site builder (og:image is an `…lovable.app` preview; the bundle links `https://lovable.dev`). Its backend key was issued 2025-12-29 and its preview image is dated 2026-09-09. It has internal contradictions (§1.3) |
| [S2] | KASA **"Download Rules PDF"** text (the same bundle; the section list that the page turns into a PDF) | Same as [S1] | Same text as [S1], sometimes worded differently. Its foul list lacks "small-card-on-top" | 1 | Same weight as [S1]. Where the two differ, both are quoted |
| [S3] | KASA **Academy**: "The Rules of Khasino" study text (/academy, before the KHA01 referee exam), plus the League Owner's and Tournament Organizer's guides | KASA, 2026. For referee candidates and organisers | A second, shorter rewrite of [S1] | 1 | **Weakest KASA text.** It contradicts [S1] on the deal (four floor cards) and on the target score (cumulative to 11) |
| [S4] | KASA site, other routes: home, /about, /terms ("Last updated: December 2024"), /terms/player and /terms/organizer (both "v1.0 — 29 June 2026"), /referees, /rankings, league and tournament creation forms, the referee's score-entry form | KASA, 2026 | — | 1 | Reliable on organised-play facts (formats, scoring records, Elo). The score-entry validation is code, so it shows what KASA actually records |
| [S5] | **KASA's online game**, play.khasino.co.za ("Khasino Card Game — Play Free… Recognised by KASA"), bundle `index-D94TP5GV.js`, app **v2.5.13** (changelog dated 2026-09-28) | Publisher in page metadata: "Vita Pty Ltd". It submits results to KASA ("Submitting match scores to KASA"). For the public, with ranked, league and tournament games | Same circle as [S1] and [S6]. Its changelog starts at v2.0.0 on 2026-08-14 | 3 (organised-play software) | **The most precise rules evidence available.** It is code that resolves every case an engine needs, and it is used for KASA-recognised daily tournaments. But it is software, revised weekly, and some behaviour may be implementation choice rather than rule |
| [S6] | **"KHASINO – RULES / DESIGN AND DEVELOPMENT OF NATIVE APP FOR A MOBILE GAME"**, Document Version 1.1, "Prepared By: A. Hlongwane", "COPYRIGHT © 2014-2023 Vita Business Solutions (Pty) Ltd", contact info@khasino.co.za; PDF creation date 2023-02-03 (UTC+2). Hosted on Tabletopia; mirrored on GitHub [S27] | The Khasino brand owners (not yet KASA by name). Written as a specification for an app developer | **Copies pagat's Swazi Casino text.** 57 of the 70 sentences of pagat's Swazi "play" section reappear (by prefix or suffix match), as do 4 of 5 sentences of its partnership section. South African changes are added: 40 cards, values to 10, "small card on top", round-1 discard ban, one build, rules for "taking other people's cards", "Shiya"/"Stash", "8 out" | 2 | **Authoritative for the 2023 house rules, but much of it is a rebadged Swazi text.** Where it keeps a Swazi rule that the South African sources contradict (opponent "can insist" on full captures; no direct capture of a pile top), weigh it less |
| [S7] | Tabletopia game page "Khasino" (tabletopia.com/games/khasino) | Credits as designers the 2023 document's preparer and a second person; "Beta"; 2–4 players | Blurb copied from [S6] | 3 | Confirms that [S6] is the module's rulebook and that the 3- and 4-singles games score 7 points |
| [S8] | Khasino shop (khasino.shop.netcash.co.za) | Brand owners | — | 3 | Ownership: "Khasino is a Trademark and Brand owned by Zishapp (Pty) Ltd & Vita Business Solutions (Pty) Ltd"; "Zishapp created Khasino™ in 2020". It shares an address with KASA |
| [S9] | YouTube **@KhasinoZA** ("Khasino South Africa"): video list, channel description, video descriptions, thumbnails | Same brand; 421 subscribers; about 30 videos from 2022 to July 2026 | — | 3 | Organised-play evidence (league finals, monthly tournaments, scorecards). **Captions could not be fetched**: YouTube asked for sign-in on every watch request |
| [S10] | YouTube oEmbed for the three videos linked in [S6] | — | — | 7 | Titles and channels only |
| [S11] | TikTok @khasino.za profile | Brand | — | 7 | Bio: "The South African Version is played by 2,3 or 4 players. For Tournaments, Plays"; 89 followers, 27 videos |
| [S12] | pagat.com **"African Casino"**, South African section (from Faizal Asmal), current page "Last updated: 1st October 2026" | John McLeod, from one South African contributor | Player description | 4 | A short, independent description from outside the KASA circle. Older than KASA |
| [S13] | The same pagat page as archived by the Wayback Machine on 2015-11-06 ("Last updated: 4th October 2015") | — | — | 4 | **The South African text is unchanged since at least October 2015**, so it predates the Khasino brand (2020) |
| [S14] | pagat.com "Card games in South Africa" (updated 6 April 2022) | McLeod | — | 4 | "A special version of Casino is played, in which cards can be recaptured from an opponent's capture pile" |
| [S15] | English Wikipedia "Cassino (card game)", oldid 1210204755 (25 Feb 2024), section "South Africa American cassino" (removed June 2024) | An unnamed editor | Folk testimony, unsourced | 7 | Valuable folk vocabulary ("FULL" build, "Calling", "Still"). Its scoring differs from every other source. Already summarised in note 01 |
| [S16] | Google Play reviews of **"Cassino Card Game South Africa"** (DZ Code, com.dzsoftware.topten, "10K+" installs, updated 12 Apr 2026): 94 reviews, Feb 2025 – Sep 2026, fetched from Play's public review endpoint | Players | — | 7 | **The best evidence of what ordinary players expect.** Reviewers say outright where the app "gets a rule wrong" |
| [S17] | Google Play listing, "Kasi Kasino" (Sibanyoni Tech Studio, com.kasi.kasino, updated 12 Sep 2026, "1+" installs) | Developer | — | 5 | New. Says "Learn the rules inside the app"; the in-app rules were not reachable |
| [S18] | Google Play listing, "Cassino Pro: Card Game" (Sizo Develops II, com.sizodevelops.sacasino, updated 17 Jun 2026, "50+") | Developer | — | 5 | Listing text summarised in the survey of open-source engines (§1.4, §2.16); no reviews |
| [S19]–[S21] | Wiktionary: *shiya*, *cupha*, *chow* | — | — | reference | Etymology of table talk |
| [S22]–[S28] | Open-source South African engines (GitHub; see §1.4) | Independent developers, 2025–2026 | Client specifications, pagat, or AI tools | 6 | Useful as independent readings of folk rules. Weak where AI-generated |
| [S29] | Project notes 01, 05, 06 | — | — | — | Cross-references only |

### 1.2 How the sources are related

- **One Durban circle produces all the tier 1–3 sources.** KASA's site, the shop and the Khasino brand share one Durban business address [S4][S8]. The 2023 rulebook is © Vita Business Solutions [S6]. The online game is published by "Vita Pty Ltd" and reports to KASA [S5]. The Tabletopia module credits the 2023 document's preparer [S7]. Agreement among these sources is therefore not independent confirmation.
- **Independent sources:** pagat's South African section (one contributor, by 2015) [S12][S13]; the Wikipedia folk section [S15]; app reviews [S16]; and the open-source engines, several of which were written to a client's specification of "how we play" [S22][S23].
- **Lineage of the KASA texts:** pagat Swazi Casino (Jonathan Dushoff) → 2023 document (Swazi sentences, South African changes) → 2026 site (new prose; drops the Swazi carry-overs on compulsory capture; adds new terms and the steal taxonomy). The online game (v2, August–September 2026) is newer than the 2026 rules page and **sometimes follows the 2023 document instead**: the round-1 discard ban, cardless additions to your own build, and capture piles face up.

### 1.3 Internal consistency of the KASA 2026 texts

KASA's 2026 texts contradict themselves in places that matter to an engine:

1. **Augment limit vs its own example.** The rule says "The new value may not exceed double the original build's value" [S2]. The worked example on the same page turns a build of 4 into 9: "Opponent's Build 4 is (3 + 1). You add a 5 from your hand. Total = 3+1+5 = 9" [S2]. Nine is more than double four. The Academy adds "Build values that double past 10 are also untouchable" [S3], which fits neither reading.
2. **Captured cards "face-down"** [S1][S2][S3], but any player may steal the top card of an opponent's pile [S1]. KASA's own online game draws every pile face up [S5], and pagat says "kept face up" [S12].
3. **"Drifting (also known as "Shiya")"** [S2], while the same page uses **SHIYA** for a partner's call to claim a capture [S1].
4. **The deal and the target, in the Academy:** "**4 cards** are placed face up in the middle — the floor" and "Be the first to reach the target score — 11 points in a 2-player match — accumulated over a series of rounds"; "Multiple rounds are played until a player reaches the target score" [S3]. Both conflict with the rulebook, which gives 10 + 10 cards each and no floor (a 40-card pack leaves no cards for a floor), and "Count points; player with the most wins" [S2]. KASA's referee score form rejects any result whose two scores do not add up to 11 [S4].
5. **"Your Turn: Four Choices"** in the Academy lists five actions (Capture, Build, Augment, Discard, Steal) and omits Drift; the rulebook has "The Five Choices", including Drift [S1][S3].
6. **Tie-break.** "On a tie, the player holding the 10 of Diamonds (Mummy) wins" [S2]. In the two-player and partnership games a tie is impossible: the 11 points are integers that always total 11. The tie-break can only matter in the 7-point three- and four-singles games.
7. **"Play exactly one card"** [S2] versus its own examples of loading floor cards onto a build (§4, Q5).

**Reading adopted here:** where [S1]/[S2] are internally consistent, they are canonical. Where they contradict themselves, KASA's own online game [S5] decides, then the 2023 document [S6], then the independent sources.

### 1.4 Open-source engines (tier 6), as surveyed

Findings of the separate survey, with spot checks. File:line references are to the clones.

- **basil-dlamini/sa-cassino-play** (2026-10-03) [S22]. The most detailed engine, written for "SA/Mozambique/Eswatini/Lesotho". `js/rules.js` encodes dated "owner's law" rulings from a client. Terms: "**discard**… **top/augment** (equal-value card onto a build), **preg** (raise a build's value — only before it is augmented), **dig** (take an opponent's matching pile-top into a build), **Shiya** (a partner's "leave it to me" call)" (README:25-28).
- **Ritanzwe/south-african-casino** (2026-09-28) [S23]. RULES.md was "confirmed in planning" with a client; items marked "(default)" were never asked about.
- **lindabaloyi/casino-game-mobile-dev-dev** (2026-04) [S24]. Its `rules.tsx` text is generic and contradicts its own engine.
- **Tebogo60/casino_card_game** and **mosa-retha/Cassino-game** [S25]. The same team; rules in the README; code incomplete.
- **HotbitsZA/Khasino** [S26] and **sizodevelops/CardGame** (Godot, by the "Cassino Pro" developer).
- **Simon-Mufara/sa_casino** [S27] commits the 2023 KASA PDF ("Khasino.Rules.en (1).pdf", v1.1). It is the same document as [S6].
- **Weak, AI- or pagat-derived** [S28]: Mr-Zwalo/Kassino-Kings (written by an AI coding agent from pagat), ayanda4rbn/khasinomvp (Lovable/gpt-engineer), Mthabela00/Township-Casino-Game.
- Malungisa-Mndzebele (khasinogaming.com) is 52-card standard Cassino and not South African. **No repository cites KASA or pagat.**

---

## 2. The rules, section by section

Each subsection gives the **most authoritative reading** first, then the alternatives.

### 2.1 Deck and values
- **Reading:** a 40-card pack, "obtained by removing all picture cards (Jack, Queen, King) from a standard 52-card pack"; "Ace (counts as 1) through 10. The Ace always has value 1 for captures and builds" [S2]. Builds are at most 10: "The build value must be 10 or less" [S2]. Every source in the South African line agrees on the 40-card pack and ace = 1 [S6][S12][S15][S5].
- **Brand decks.** Khasino sells its own 40-card decks ("Khasino Standard Deck R46.00", "Khasino Premium Deck R100.00"; "The current decks only provide 52 cards") [S8]. Gold-coloured brand cards appear in the 2022 video [S9].
- **Alternatives:** the Swazi game uses 52 cards with J 11, Q 12, K 13 and ace 1 or 14 [S12]. A reviewer asks for "the kasi cassino where the ace is a 14, where we use all cards" [S16], so a 52-card township version also exists. The Lesotho players Alexey Lobashev met use the 40-card pack "as in South Africa" [S12].

### 2.2 Players, seating, direction
- **Reading:** 2, 3 or 4 players; partners opposite in the four-hand game [S2][S5]. "For 3 and 4 players the turn order is ANTI-CLOCKWISE. The cutter plays first, the shuffler plays last. Players must swap seats if seating does not honour this rule" [S2]. The 2023 document says "The game always goes anti-clockwise" [S6].
- The online game's partner lobby: "Team A (seats 1 & 3) vs Team B (seats 2 & 4)" [S5].

### 2.3 Choosing who shuffles, cuts and leads
- **Reading (KASA):** "1. Place at least 3 cards face-down on the table. 2. Each player flips one to reveal value. 3. Higher card shuffles. 4. Lower card cuts the deck at least once. 5. Deck returns face-down to the shuffler. 6. Cards dealt equally to each player. 7. The cutter plays first" [S2].
- **2023:** "The player with the biggest number i.e 10 will be the player given to shuffle the cards, the other player will cut the deck and return it to the shuffling player. The shuffling player will now deal the cards one by one faced down" [S6].
- **Online game:** "Select a card to determine who plays first — The player with the lower value card will play first"; partnerships: "One player per team draws — lower card value goes first" [S5]. It also reshuffles if any hand would hold all four 10s ("Reshuffled …x to avoid four-10s in a single hand") [S5]. That is an app safeguard, not a written rule.
- **Pagat:** "The first dealer is chosen at random. In subsequent hands the previous loser is the first person to be dealt cards, and also starts the game" [S12].
- **Wikipedia folk:** "Non-dealer plays the first card" [S15].
- **For the engine:** in two-player play all of these come to the same thing. The non-dealer (cutter) leads. Between games, either repeat the card draw (KASA) or let the previous loser lead (pagat).

### 2.4 The deal
- **Reading:** "2 Players: 2 rounds, 10 cards each. 3 Players: 1 round, 13 each + 1 to floor. 4 Players: 1 round, 10 cards each" [S2]. Cards are dealt "one by one faced down" [S6]. With two or four players "there are no face up cards on the table at the start, so the first player cannot capture but must simply play a card" [S6][S12].
- **Two-player second deal:** "the dealer will deal 10 cards to the opposition and 10 cards to themselves, the rest will be dealt on the second round after the first batch has been finished" [S6]. KASA's distribution table and its online game call each 10-card half a "round" [S2][S5]. Elsewhere KASA uses "round" loosely for the whole deal ("The last player to capture in a round…") [S2]. This note calls the 40-card deal a **game** (§2.17) and each half a **deal**.
- **Misdeal:** "Dealing the wrong number of cards" is a foul, punished by a STRAIGHT (11–0 loss) [S2]. Folk alternative: "If a dealer dealt extra cards more than 10 cards to each player. The opposite player/s may choose to either they win or choose to start afresh" [S15].
- **Rejected alternative:** the Academy's "4 cards are placed face up in the middle" [S3] (see §1.3).

### 2.5 The turn
- **KASA wording:** "Each turn you play exactly one card from your hand. That card must do one of: Capture (chow), Build, Augment, Drift, or Discard. You may also Steal the top card of an opponent's chowed pile if it completes a legal capture or build on the same turn" [S2].
- **2023 (copied from Swazi):** "Your turn can consist several actions, in any order. At some point during your turn you must play exactly one card from your hand… Actions 2 and 4 can involve playing a card from your hand, or can be performed using only cards that are already in play. As long as no card from your hand is involved, you can perform as many of actions 2 and 4 as you wish in any order, before or after playing from your hand" [S6].
- **Online game:** a turn ends with an **End Turn** button. Exactly one hand card is enforced: "Only one card can be played per turn"; "You must play a card before ending your turn!"; "You already played a card this turn. Press End Turn" [S5]. Loose floor cards can be dragged onto your own build of their value ("add-table-card-to-build", "add-combination-to-build"). Steals must come first: "Steal Too Late — You already chowed this turn. Steals must be collected before you capture" [S5]. Changelog 2.1.1 (2026-08-16): "Blocked playing a second hand card in the same turn (discard then build on the discarded card)" [S5].
- **Recommended reading** (Q5 in §4): one hand card per turn, plus any cardless additions to your own build and the steals that feed that hand card's move; a capture closes the turn.

### 2.6 Capturing ("chow")
- **Reading:** "Three legal ways to capture: Match: same value (e.g. 7 captures another 7). Sum: played card equals the sum of two or more floor cards (e.g. 7 captures 3 + 4). Multiple Sums: a card may sweep several independent sums in one play (e.g. 8 takes 3+5 and 2+6)" [S2]. A build is captured by a card of its value: "Chow a card, sum or build off the floor" [S1].
- **Builds with loose cards in one capture:** "If you play a card that matches several separate cards, sets or builds you can capture them all"; "you can only capture a build by matching its value - you cannot add the value of another build or card to create a match" [S6].
- **No compulsion:** "You are never forced to chow or to load a card onto your own build" [S2]. Alternative (2023, copied from Swazi): if you capture or discard "but fail to take all the cards you are entitled to capture, any opponent can insist (if they wish) that you capture all the cards that it is legal for you to take" [S6]. Ritanzwe: "The player chooses which sets to take, and does not have to take every matching set" [S23].
- **Capturing with a stolen card** (§2.11): KASA allows a stolen card that matches a loose floor card to be chowed "both immediately", and a stolen card that matches an opponent's build to be used "to capture their entire build" [S1].
  - Pagat lets a pile top join a **sum**: "play one of his eights, capturing his build, the loose seven on the table, and the ace from player B's pile" [S12].
  - The online game forbids sums with a stolen card: "A stolen card can't be added up with table cards to make a capture. It only combines with a card of the same value, or a build of the matching value" (changelog 2.0.0: "Blocked illegal sum captures that combine a stolen card with table cards") [S5].
  - Ritanzwe allows sums since 2026-09-28 [S23].
  - The 2023 document keeps Swazi's "you cannot capture cards directly from the top of an opponent's capture pile" [S6].
- **House extremes:** basil's client: "One card or one stack — never a set (2026-09-15): a capture takes exactly ONE loose card, or ONE whole stack" (README:62-66) [S22]. This is the opposite of KASA's "Multiple Sums".

### 2.7 Simple builds
- **Reading:** "A build is one or more floor cards combined with a card from your hand whose values sum to a target value you still hold" [S2]. Rules [S2]:
  - "You must hold a card equal to the build's value."
  - "The build value must be 10 or less."
  - "You cannot build a value that already exists as a separate build on the floor."
  - "While you own a build you must always keep at least one capturing card in hand. You may discard duplicates of that value… but never the last one."
  - "In partners, you cannot build a value your partner is already holding as a build."
- **One build per player** (§4, Q4): 2023 action 2 is "to form a new build of your own; that is if you don't have another one already" [S6]. The online game refuses with "Already Have a Build — You already have a build. Capture it or add to it first" [S5].
- **Builds from floor cards only:** the 2023 document (from Swazi) allows a build made only of floor cards: "there is a 5, a 3 and a 2 in the layout and you have a 10 in your hand; you can combine the 5, 3 and 2 into a build of 10" [S6]. KASA's definition requires "a card from your hand" [S2], although its one-line summary of the Build choice reads "Combine floor cards into a single value to capture later" [S1]. That summary sits under "That card must do one of the following", so it is read here as a hand-card move. The online game's build paths all start from a played hand card. Its only cardless additions are to an existing own build [S5]. A DZ reviewer complains: "Opponents can drift after building with floor cards while I can't" [S16].
- **Stacking order: "small card on top."** "The rule is the small card must be on top. If you are building a 10 using 1,3,2,4 the order must be 4 at the bottom, followed by 3,2 and 1 must be on top" [S6]. KASA lists "Not following the small-card-on-top rule" as a foul [S1]. The online game sorts each set largest-at-bottom, smallest on top ("Build cards (bottom → top, smaller on top)") [S5].
- **Announcing:** "Announce all builds clearly" (KASA etiquette) [S2].

### 2.8 Compound builds
- **Reading:** "A compound build is the owner stacking another pair of cards equal to the build's value onto an existing build. Example: Owner has Build 10 from (5+5). Owner adds (6+4) onto it - it is now a compound Build 10." Rules: "Only the owner can compound their own build. Each set added must independently equal the build's value. Compound builds cannot be augmented, broken, or split. You cannot compound to a value that already exists as another build on the floor" [S2].
- **Order:** "Pairs are kept in the order they were added; cards within a pair are sorted by value" [S3]. Online changelog 2.0.0: "Compound build pairs now stack newest-on-top with larger card below, smaller on top" [S5].
- **What makes a build "compound" in the online game:** a build cannot be augmented if it is a drift, if two of its cards equal its value, or if its cards total at least twice its value [S5]:

  ```
  e.isDrift===!0 → "Cannot augment a drifted build"
  t.filter(a=>a.value===e.value).length>=2 → "Cannot augment a drifted build"
  t.reduce((a,s)=>a+s.value,0)>=2*e.value → "Cannot augment compound builds"
  ```

  This "sum ≥ 2 × value" test may be where the site's garbled "double" rule came from (§4, Q3).
- **Material for a compound set:** a hand card with loose floor cards and/or a stolen pile top, or loose floor cards alone. Online messages: "Card placed on build — Add … more from table or stolen cards, then End Turn"; "Pending stack sums to …"; changelog 2.5.12: "A completed table combination can now stage and finish a second pair with the opponent's top chowed card, such as 8+2 followed by 9+stolen 1 for build 10" [S5]. 2023: "When augmenting [compounding] a build you can use single cards from the layout, one card from your hand, and the top card of the opponents' capture pile(s)" [S6].
- **Opponents and compound builds:** only capture them. The 2023 document keeps Swazi's "You can augment a build owned by your opponent only if you also capture that build in the same turn" [S6]. KASA: "A stolen card cannot be used to compound an opponent's build, only to capture it" [S2].
- **Folk names:** "FULL" build: "building is FULL if it involve pairs, pair and combination and 4+ cards e.g A+A+2+3 is 7 opponent may not add build" [S15]. "Strong" vs "weak" build [S23]. "Augmented build" in the 2023 document and in Swazi [S6][S12].

### 2.9 Augmenting (changing the value of an opponent's build)
- **Reading:** "If your opponent owns a simple build, you may add a card from your hand to change its value. Ownership transfers to you and you must capture it on a later turn." Rules: "You must hold a card equal to the new value. The new value must be 10 or less. The new value may not exceed double the original build's value. Compound builds cannot be augmented. If you already own a build, augmenting must land on that same value (a merge)" [S2].
- **2023:** "You can change the value of a single build only if all of the following conditions hold: the build is currently owned by an opponent; you change the value by adding a single card from your hand; you have a card in your hand that matches the new value of the build." Also: "it is not possible to change the value of a build and capture it in the same turn"; "It is not possible to change the value of an augmented build (i.e a compound build)" [S6].
- **Online game:** a hand card only; the new value must be ≤ 10; you must hold another card of the new value; drift and compound builds are refused; if you own a build of a different value, "augment must merge into it". **No "double" check** [S5].
- See §4, Q3 for floor cards, stolen cards and the "double" limit.

### 2.10 Drifting, loading and "Stash"

The word **drift** has three meanings in the sources (§5):

- **(a) Any non-capturing play.** "In South Africa, playing a card without capturing is called drifting" [S12]. The 2023 glossary: "Drifting - Playing a card without capturing or Chowing" [S6].
- **(b) Using a card that could capture for a build instead** (Swazi, copied into 2023): "it is legal to play a card that could have captured, but to use it in a build instead… This is called drifting" [S6][S12].
- **(c) KASA 2026: pairing a same-value card.** "Drifting (also known as "Shiya") is playing a card that matches the value of a floor card and pairing them on the floor without capturing immediately. A later matching card chows them all at once. Drifting can also pair onto a same-value build to load it for a future capture" [S2]. Example: "Floor has a 5. You play your 5 and pair them. A future 5 captures both" [S1].

**Online game, sense (c):** a drift on a floor card creates a build object with `owner:"player"` and `isDrift:true`, valued at the card's value [S5]. It is allowed only if:
- the player holds another card of that value ("canDrift" requires at least one more in hand);
- the player owns no build of a different value;
- no build of that value already exists ("Build Already Exists") [S5].

A drift onto a build is offered only on **your own** build, and only while you hold another card of its value ("Player can capture OR drift build … showing choice dialog"). Dropping a matching card on an opponent's build captures it [S5].

**2023 "Stash"** (the same act, on your own build): "The word stash is used when a player has built a card, lets say 7(4+3) and its their turn again, they want to solidify and make it a compound build but there is no cards to add with. If they have more than one 7 they can put the 7 on top and say 'Stash' which means the 7 is still in play" [S6].

**Folk "Calling":** "A player with 2 or more cards in hand of the same rank as one or more table cards, may play one of them and call their rank e.g. "Fives"… An opponent may only capture the card by pairing, but may not build on that card or capture it as part of a combination" [S15]. "Still (placing same card) in one build" [S15].

### 2.11 Stealing (taking an opponent's pile top)
- **Reading:** "When you build, augment, or capture, you may pull the TOP card of an opponent's chowed pile back into play if it completes a legal action on the same turn" [S2]. KASA's five types [S2]:
  1. "Direct Steal - opponent's top card matches your build value, load it onto your build."
  2. "Combination Steal - stolen card plus a loose floor card together equal your build value."
  3. "Stack-on-Base Steal - no builds exist yet; stolen card + a hand card sit on a matching floor base to start a build."
  4. "Base Steal (Chow) - stolen card matches a loose floor card, letting you chow both immediately."
  5. "Capture-Opponent-Build Steal - stolen card matches the value of an opponent's build, letting you capture their build."

  Rules: "Only the top card of a chowed pile is ever stealable. Every steal must complete a legal capture or build on this turn. A stolen card cannot be used to compound an opponent's build, only to capture it" [S2]. The Academy adds: "A stolen card cannot be used purely to chow a hand card (no chow-via-steal shortcuts)" [S3].
- **2023 ("The rule for taking other people's cards"):** "You can take cards from your opponents when you are building or about to chow your build… The card must be built on the floor first before you can start going to other people's cards… If there is a 7 on the floor you can add a 3 and take the 10 from the opponent's chowed pile. If there is another 10 beneath the one you took you can take it as well, if the card beneath and the card on the floor add up to the card you are building you can continue adding" [S6]. And: "You are not allowed to use a card from the top of your own (or partner's) capture pile to augment a build" [S6].
- **Pagat:** "A player who already has a build on the table may steal the top card of a player's capture pile to incorporate into the build, provided that the building player simultaneously adds a card to the build from hand" [S12].
- **Online game:**
  - Only the top card: "Can only steal the top card" [S5].
  - A steal is allowed only when the card matches an opponent's build, combines with floor cards to reach your build's value, matches a floor base, or combines with a hand card to match a floor base. Otherwise: "No builds and no matching table base or combination - steal NOT allowed" [S5].
  - A steal binds the turn's hand card: "You stole onto your build of X. Only a X from your hand is allowed", or, if you own a different build, "the steal must chow at X" [S5].
  - An incomplete steal is undone: "Steal Rolled Back — Stolen card returned — the steal was not completed this turn" [S5].
  - Capturing an opponent's build of X also takes that opponent's top card if it is an X [S5].
- **Open source:**
  - basil's "dig": only into your own side's builds, one card from each pile, a loose base needed to start (rules.js:590), never captured directly (:1128) [S22].
  - Ritanzwe: only when the floor already makes N; same-value cards directly beneath follow on a capture (RULES.md:35-39) [S23].
  - HotbitsZA: "Illegal: Direct 1-to-1 steals are forbidden without a table connection" (KhasinoEngine.cc:100) [S26].
  - Tebogo60: only to extend your own build [S25].
  - mosa-retha: the top card "can be used to **add to an existing build** but **cannot be used to start a new build**" (README:124) [S25].
- See §4, Q1 for chains of steals.

### 2.12 The capture piles
- **KASA text:** "Captured cards go face-down into your chowed pile" [S2]; "into your won-cards pile" [S1]. Foul: "Not following the small-card-on-top rule" [S1].
- **Pagat:** "All captured cards are kept face up in a single pile in front of the player who captured them. New captures are added to the top of the pile. When you capture several cards at once, they must be placed on your pile in numerical order, with the lowest card on top" [S12].
- **2023 (partnership passage):** "In the game the person chowing the card puts their card on top and take the pile to their home while saying '8 out'" [S6].
- **Online game:** each pile is drawn as a face-up stack offset 1 px per card, so in practice only the top card can be read; "Tap or drag this card to steal it" appears only on the top card [S5]. The capturing hand card goes on top. Beneath it, a captured build keeps its stacked order, and loose cards follow in table order [S5]:

  ```
  setPlayerChowedCards(_ => [{...handCard}, ...stolenTop, ...pending, ...buildCardsTopFirst, ..._])
  ```

  A July 2026 screenshot of the game shows "AI chowed cards" with an 8♥ face up on top and the player's pile as a face-up stack [S9].
- **Swazi** (for comparison): "When you capture several cards at once, you may sort the captured cards however you like. The capturing card, however, must go on top of your pile" [S12].
- See §4, Q1 for the recommendation.

### 2.13 Discarding (trailing)
- **KASA:** "Discard: Place a card on the floor when no other play is wanted" [S1]. Foul: "Discarding while you own a build and hold the only capturing card" [S2]. Bait discards are legal: "The opponent discards a card that matches one in your hand. You are not forced to chow it - you may discard a different matching card right next to it" [S2].
- **2023:** "to discard a single card from your hand to the floor.(you can't do this if you have built a card and you haven't captured it when it's a 2 player game round 1)"; "The only time the Discard move is prohibited is when you are playing a 2 hands game and you have built a card and it is the first round" [S6].
- **Pagat:** "If you have a build on the table you are not allowed simply to drift; you must either add to your build or capture something"; in the second deal "players are always allowed to drift, even if they have a build on the table" [S12].
- **Online game:** `if (round === 1 && hasBuild)` → "You cannot discard when you have an existing build in round 1!"; otherwise "Cannot discard your last card matching your build value!" [S5].
- **Folk:** "In two players. Player can never place a card in a table when he has a build" [S15]. basil: "Two-hand game: first round, a player with a live build cannot discard at all; the second round lifts that lock" (README:45-46) [S22]. Ritanzwe: capturing is optional "unless they own a build" [S23].
- **Discarding a card whose value is on the floor:** KASA allows it (bait example above) [S2]. basil and lindabaloyi forbid trailing a card that matches a loose floor card or a live build's value (basil rules.js:189-191; lindabaloyi trail.js:47-71) [S22][S24].
- **After a sweep:** "After a sweep the next player must discard - there are no floor cards to act on" [S2]. This follows from the empty floor (a stolen card needs a floor base or build), unless that player owns a build.

### 2.14 Between the two deals (two-player game)
- **Reading:** the floor and any builds stay where they are; the dealer deals 10 more cards each; play continues in turn order, so the player who led the first deal leads the second.
  - Online game: round 2 is dealt without touching the table or builds, and the first player is the same one ("playerGoesFirst ? 0 : 1") [S5].
  - Swazi: "the layout is left intact and the remaining cards are dealt" [S12].
  - Folk: "the dealer deals TEN more cards each from the stock, Play continues in this way" [S15].
  - Open source: basil, Ritanzwe, Tebogo60 and Kassino-Kings all carry floor and builds over. lindabaloyi keeps only loose cards (round.js:67-74) [S24].
- **What changes in round 2:** discarding while owning a build becomes legal (except your last capturing card) [S5][S6][S12]. A reviewer wants more: "2nd roound build as much as you want and capture what you want" [S16]. In Swazi, the one-build limit is also lifted [S12].

### 2.15 End of the deal
- **Reading:** "The last player to capture in a round automatically wins any remaining floor cards once the deck is exhausted" [S2]. Every source agrees [S6][S12][S15].
  - Builds left on the floor go too: online game "Assigning remaining table/build cards … to" the last capturer [S5]; all surveyed engines do the same.
  - In the online game, a drift is a build and does not count as a capture. Ritanzwe: "Only a real capture sets `lastCapturePlayerId`. A drift never does" [S23].

### 2.16 Scoring
- **Reading (KASA, 2 players and partnerships, 11 points)** [S2]:

  | Item | Points |
  |---|---|
  | 10♦ "Mummy" | 2 |
  | 2♠ "Spy Two" | 1 |
  | Each ace | 1 (4 in all) |
  | Most cards | 2 ("1 each on tie") |
  | Most spades | 2 ("1 each on tie") |

  The same table appears in the 2023 document and in Swazi [S6][S12]. KASA league scorecards on YouTube itemise it: "ACES: 1 · SPY 2: 1 · MUMMY: 2 · CARDS: 2 · SPADES: 1" against "ACES: 3 · SPY 2: 0 · MUMMY: 0 · CARDS: 0 · SPADES: 1", final 7–4 [S9]. Two other "Khasino League" final-score cards on the channel read 2–9 and 1–10 [S9]. All three sum to 11.
- **"Sweep exception"** (all point cards to one side): "If a player captures no point cards at all, card and spade bonuses do not count — score reads 11 - 0" [S1]. Online game: if exactly one side has point cards, that side takes the 4 bonus points ("Sweep exception: AI captured no point cards, player takes all bonuses") [S5]. basil's client scores the same event much higher: "a sweep IS the score — the 11 points doubled to 22, or quadrupled to 44 for a clean sweep" (rules.js:1421-1433) [S22].
- **3 players and 4 singles: 7 points**, "no card or spade bonus" [S2][S6][S7]. In the online game, a 3- or 4-hand tie on top goes to the Mummy holder, else "tie" [S5].
- **Alternatives:**
  - Pagat: "For having at least five spades: 1 point" instead of most spades 2 (10 points, or 11 when both have five) [S12]. Ritanzwe, Kassino-Kings and the "Cassino Pro" listing agree.
  - Thresholds of 20 cards = 1 / 21+ = 2 and 5 spades = 1 / 6+ = 2: Tebogo60; mosa-retha only with at least one card point; lindabaloyi has the 6+ spades rule only [S24][S25].
  - "Cassino Pro" listing: 10♦ = 2, or 3 with another point card.
  - Wikipedia folk: "Most cards=3 points; Great Cassino (♦10) =2 points; 2 Little Cassino (♠2) =2 points; Most spades =1 points; Each Ace =1 point" [S15]. Folk 2020 (talk page, note 01): "6 card with Spades (+5♠️) recieve 3 points and player(parners) with more cards receive 1 point", game 11 [S29].
  - "Point Cassino", a regional variant a reviewer asks for: "you only add a card point on a build if that build has a point on it, if a build doesn't have a point you can also add any non-point card" [S16].
- **No points for a sweep (clearing the floor):** "Note that there is no extra score for sweeps" (Swazi) [S12]. KASA gives the "Khasino" sweep no points [S2].

### 2.17 The game, the match and tie-breaks
- **A game is one 40-card deal scored out of 11.** Evidence:
  - KASA's referee score form enforces "Scores must be whole numbers 0–11", "Maximum score is 11" and "Total points must add up to 11" [S4].
  - Elo: "Perfect Win Bonus: +10 points for winning 11-0" [S4].
  - Tournament format: "Best Of: Best of 1 / Best of 3 / Best of 5 — Number of games required to win a single match" [S4].
  - The online changelog records a tournament final won "7–4" [S5]. League scorecards: 7–4, 2–9, 1–10 [S9].
- **Matches:** "Singles - 1v1, first to win the set number of games. Partners - 2v2, combined team score. Tournaments - bracket elimination format. Time controls: Casual none, Ranked 30 minutes per player, Tournament as specified" [S2]. Tournament formats: "Single Elimination (Knockout)" and "Lowest Point Elimination — Players with lowest points are eliminated. Ties require playoff" [S4]. Leagues: "Single Round (1 game per pair)" or "Home & Away (2 games per pair)"; "Points: 3 for win, 0 for loss"; "Tiebreakers: head-to-head, then points diff" [S3][S4].
- **Tie within a game:** "On a tie, the player holding the 10 of Diamonds (Mummy) wins" [S2]. This can only arise in 7-point multi-hand games (§1.3). The online game sends "the Mummy (10♦) holder as mummy_player_id" with every result [S5], and KASA profiles count "Mummies" [S4].
- **Rejected alternative:** the Academy's cumulative "first to reach the target score — 11 points… accumulated over a series of rounds" [S3]. A 2014 US app review (not South African) calls an 11–0 "a body" (note 06) [S29].

### 2.18 Fouls and penalties
- **Reading:** "A foul results in a STRAIGHT (an 11-0 loss). Common fouls: Dealing the wrong number of cards. Discarding while you own a build and hold the only capturing card. Building a value you do not have in hand. Playing out of turn or touching opponent cards" [S2], plus "Not following the small-card-on-top rule" [S1]. "Referees may issue warnings for minor infractions or escalate to point deduction, forfeit or disqualification" [S2].
- **Online game:** a forfeit or idle timeout is scored 11–0 ("Forfeit (11-0)"; "Play a card now or you lose this match 11-0") [S5].
- **Folk fouls:** "Player make build of card that don't have"; "In two players. Player can never place a card in a table when he has a build"; "After two build a player is forced to capture or Still(placing same card) in one build not place card in a table" [S15].
- **For an engine:** these fouls cannot happen. The engine refuses the illegal moves, as KASA's own game does.

### 2.19 Partnerships (brief)
- Partners sit opposite; scoring combines "cards and spades" [S1]. "In partners, you cannot build a value your partner is already holding as a build" [S2].
- **Building for a partner.** The 2023 document copies Swazi: only after the partner's build of that value was changed or captured by someone else and the partner has not since played that rank. "This is the only circumstance in which you can build for your partner" [S6].
- **Shiya:**
  - KASA: "if your partner is about to chow a card you can call SHIYA to claim it instead. Once said your partner cannot object — but only if the cards have not yet touched their chowed pile" [S1].
  - 2023: "His partner can they say 'Shiya' or 'Stash' which means leave that card I will chow it this side, If the person who asked for the card to be left has a pile already built that means they now have to piles & this is the only circumstance where a player can have two builds belonging to them. They have to chow one of the builds when the game reaches their turn" [S6].
  - Online game: when a partner's chow takes only floor cards and you hold that value, a 5-second SHIYA window opens. Accepting turns the chow into a drift build owned by you ("called Shiya — drifted Xs") [S5].
  - Reviews: "it always force you to use the shiya button even when your friend is in trouble"; they ask for "add to build", "shiya", "capture", "add to friend build" options; "Shiya must be applicable when ever your partner remove any card"; "opening a second slot for shiya card while you have your own build card" [S16].
- **Piles.** The online game keeps a pile per seat [S5]. Swazi shares one pile per team; Sotho keeps them separate and lets you steal your partner's top card [S12]. basil: "only the owner (or an opponent) captures a build — never the owner's partner" (README:29-30) [S22].

### 2.20 Three players and four singles (brief)
- Three: 13 each plus one card face up to the floor; four singles: 10 each; one deal; 7 points; anti-clockwise [S2]. The online game added 3- and 4-hand modes; reviewers asked for online 3-player in 2025 [S5][S16].

---

## 3. Disagreement table

Abbreviations: **K26** = KASA site 2026 [S1][S2] (Academy [S3] noted where it differs); **KOG** = KASA online game, Sept 2026 [S5]; **K23** = 2023 document [S6]; **Pg-SA** = pagat South African [S12]; **Pg-Sw** = pagat Swazi [S12]; **OSS** = open-source engines [S22]–[S28]; **Folk** = Wikipedia folk text [S15] and app reviews [S16].

| Rule | K26 | KOG | K23 | Pg-SA | Pg-Sw | OSS | Folk |
|---|---|---|---|---|---|---|---|
| Deck | 40, A=1 | 40, A=1 | 40 | 40 | 52, J11 Q12 K13 A1/14 | 40 | 40; some want 52 with A=14 |
| 2p deal | 10+10 each, empty floor (Academy: 4 to floor) | 10+10, empty floor | 10+10 | 10+10 | 12+12 after 4 cut to floor | 10+10 | 10+10 |
| Leader | cutter (lower card) | lower card | not stated (lower card cuts) | previous loser | right of dealer | — | non-dealer |
| Captures compulsory? | never ("Cupha") | no | opponent may insist | — | opponent may insist | Ritanzwe no; basil in effect forced | — |
| Multiple sums | yes | yes | yes | yes (example) | yes | basil client: one card or one stack | yes |
| Build from floor cards only | needs hand card | new builds need hand card; own-build additions cardless | allowed | — | allowed | — | reviewer says the AI does it |
| Builds per player | one (merge) | one (guarded) | one, except via Shiya | — | 2p first half: one | one (basil, Ritanzwe, Tebogo60) | — |
| Raise own build | no (owner only compounds) | no | no | — | no | no (except two AI-written repos) | "not in succession" |
| Augment opponent's simple build | 1 hand card; ≤10; **≤ double**; merge | 1 hand card; ≤10; merge; no "double" | 1 hand card | — | 1 hand card | 1 hand card (basil); hand + floor (Ritanzwe) | — |
| Pairing a same-value card (drift, sense c) | yes, "Shiya" | yes: owned drift build, needs a spare, unaugmentable | "Stash" (own build) | "add one of his eights to his build" | augmented build from a matched single | basil "basetop"; Ritanzwe "strong 2-build" | "Calling 'Fives'" |
| Drift onto an opponent's build | unclear | no (that is a capture) | — | — | no | Ritanzwe no (RULES.md:67) | a reviewer wanted it |
| Steal into own build | yes (5 types) | yes | yes, after building first; chains | yes, with a hand card added | yes (augment) | varies (§2.11) | — |
| Steal into a capture | yes (base, opp. build) | yes, same value only; no sums | no ("cannot capture… directly") | yes, sums allowed | no | Ritanzwe yes (sums) | — |
| Pile orientation | face down | face up (top readable) | — | face up | face up | top only / all face up | — |
| Order of a capture on the pile | "small-card-on-top" foul | capturing card on top, build order kept | capturing card on top | lowest on top | capturing card on top, rest sorted freely | capturing card on top (basil, Ritanzwe, Tebogo60, lindabaloyi); lowest on top (Kassino-Kings) | — |
| Discard while owning a build | foul only if last capturer | round 1: never; round 2: not your last capturer | 2p round 1: never | not until second deal | 2p first half: never | basil, Ritanzwe: round 1 never | "never… when he has a build" |
| Floor between deals | — | carried over | — | — | carried over | carried over (lindabaloyi: loose only) | carried over |
| Most spades | 2 (tie 1–1) | 2 (tie 1–1) | 2 (tie 1–1) | ≥5 spades = 1 | 2 (tie 1–1) | 2 or ≥5 = 1, or thresholds | 1 (folk 2024) |
| Most cards | 2 (tie 1–1) | 2 | 2 | 2 | 2 | 2 or thresholds | 3 (folk 2024) |
| All point cards to one side | 11–0 | 11–0 | — | — | — | basil: 22 (44 clean) | — |
| Game | one deal of 11 (Academy: cumulative) | one deal of 11 | 11 per game | per hand | 11 per deal | — | game 11 |
| Tie-break | Mummy | Mummy | — | — | — | — | — |

---

## 4. The six questions

### Q1. Capture piles: which card is on top, is it visible, can steals chain?

**Recommended reading:**
- Each player keeps one capture pile **face up**. Only its top card is in play. Players may see the top card but may not spread or inspect the pile; anything below is known only from memory.
- On a capture, the **capturing hand card goes on top**. Beneath it, a captured build keeps its stacked order (newest set nearest the top, smallest card of each set uppermost). Loose captured cards go **lowest nearest the top** ("small card on top").
- When a top card is stolen, the next card becomes the top, and it may be used **in the same turn** if it too completes the move. Steals may therefore chain within a turn.

**Confidence:**
- Capturing card on top: **medium-high**. Face up with the top readable: **medium**. Order of loose cards under the capturer: **low**. Chaining allowed: **medium**.

**Evidence:**
- **Capturing card on top:**
  - 2023: "the person chowing the card puts their card on top and take the pile to their home" [S6].
  - KASA's online game puts the hand card first in every capture path [S5].
  - Swazi says the same [S12].
  - Four of five independent engines agree: basil "the played card lands on top" (tests.js:1591; rules.js:1105-1106); Ritanzwe "The **capturing card goes on top**", changed on 2026-09-28 from "lowest card to the top" (RULES.md:41); Tebogo60; lindabaloyi (capture.js:166) [S22]–[S25].
  - Only pagat's single contributor ("lowest card on top") [S12] and the AI-written Kassino-Kings, which copied pagat (game.js:197-199), put the lowest card on top [S28].
- **Visibility:**
  - KASA's text says "face-down" three times [S1][S2][S3], but its steal rules need the top card identifiable, and its own game draws piles face up [S5][S9]. Pagat and Swazi say face up [S12].
  - In KASA's game the cards are drawn face up but offset only 1 px each, so the top card is the only one readable [S5]. Ritanzwe and basil show the top card only [S22][S23]; mosa-retha keeps the whole pile face up (README:123) [S25].
  - A reviewer was confused when "a card has been removed from your stack even if it is under other cards, then it returns when the opponent capture his stack" [S16]. Players clearly track their piles.
- **The "small-card-on-top rule"** (a KASA foul [S1]) is, in the 2023 document, a rule for stacking **builds** ("4 at the bottom, followed by 3,2 and 1 must be on top") and for the **order of steals** ("since it is small card on top you will start with the big card(7) then move to the small card(3)") [S6].
  - *Inference:* because a captured build goes to the pile intact under the capturing card, the build's stacking order decides which card is exposed after the capturing card is stolen. That would explain why mis-stacking is a foul in a game with stealing.
- **Chaining:**
  - 2023: "If there is another 10 beneath the one you took you can take it as well, if the card beneath and the card on the floor add up to the card you are building you can continue adding" [S6].
  - Swazi: "After it has been taken the card underneath it becomes available for use", with a worked example of two successive steals [S12].
  - KASA's game: its AI steals consecutive same-value tops into a new build ("Stole … top chowed …(s) into new build before ending turn") [S5]. Changelog 2.5.12 finishes "a second pair with the opponent's top chowed card" in one turn [S5].
  - **Limits:**
    - 2023: "You cannot return to the opponent twice… you can't go back to where you just took the 3, you must start elsewhere first", and "you must pick the big card first" [S6] (garbled, multi-pile).
    - A reviewer objects that after "unpacking the 5 4 you can now bring out your own 8 to continue playing 9", i.e. using a freshly exposed card with a new hand card [S16].
    - Ritanzwe lets only same-value cards directly under the top follow a capture; "Building and stealing still use only the top card" (RULES.md:39) [S23].
    - basil: "one card from each pile" [S22].
  - Chaining is the majority reading. An engine should still allow it to be switched off.

### Q2. Drifting in KASA's sense (pairing a same-value card)

**Recommended reading.** Playing a hand card of value X onto a loose floor X (or onto your own build of X) makes or extends a **build of X owned by the drifter**. The drifter must still hold another X afterwards; this is the ordinary capturer rule. A drift counts as that player's one build, so it is illegal if they own a build of another value or if any build of X already exists.

A drift build is **compound**:
- no one may augment it;
- the owner may add more X's or sets summing to X;
- anyone holding an X may capture it.

You may load a same-value card only onto your **own** build. A matching card played on an opponent's build is a capture.

**Confidence:** owned and unaugmentable: **high**. Spare card required: **high**. Own builds only: **medium**.

**Evidence:**
- **KASA site:** "Drifting can also pair onto a same-value build to load it"; "A later matching card chows them all at once" [S2]. "You must always keep at least one capturing card in hand for every build you own" [S1].
- **KASA's game:** drift = build with `owner` and `isDrift:true`; it needs another card of that value, no other own build, and no existing build of that value; it cannot be augmented ("Cannot augment a drifted build"; changelog 2.0.0: "Blocked augmenting drift/compound builds for both players and AI"); drift onto a build is only offered on your own [S5].
- **2023 "Stash":** the owner puts a duplicate on their own build: "If they have more than one 7 they can put the 7 on top" [S6].
- **Swazi** (source of the 2023 document): "If there is a single card in the layout which you can match with a card from your hand, you can make this card into an augmented build… You thereby become the owner of that build" [S12].
- **Pagat SA:** option "add one of his eights to his build" [S12].
- **Open source:** basil "basetop" needs "a spare capture card in hand, no live build of the value" and "one self-made build" (rules.js:393-403), and topping locks the build against raising (README:34-35) [S22]. Ritanzwe: "a hand 2 played onto a floor 2 makes a strong 2-build, and the player must hold another 2"; of a strong build, "You can only capture it" (RULES.md:56, :69) [S23]. khasinomvp auto-chows pairs instead [S28].
- **Folk:** "Calling… An opponent may only capture the card by pairing, but may not build on that card" [S15]. A reviewer wanted to "drift into my opponents stack" and called the refusal "cheating" [S16]. That is the one sign of a folk practice of loading an opponent's build.

### Q3. Augmenting: floor cards, stolen cards, and the "double" limit

**Recommended reading:**
- Augmenting means adding **exactly one card from hand**, and nothing else, to an opponent's **simple** build. A simple build is a single set that is not a drift.
- The new value must be ≤ 10, and the augmenter must hold another card of the new value.
- Ownership passes to the augmenter. If the augmenter already owns a build, the new value must equal it and the two merge.
- Loose floor cards and stolen pile tops may **not** be included.
- **Do not enforce the "double" limit** by default. Offer it as an option and ask KASA what it means.

**Confidence:** one hand card only: **high**. No floor or stolen cards: **medium-high**. "Double" limit: **low** (unconfirmed and self-contradicted).

**Evidence:**
- **One hand card:**
  - 2023: "you change the value by adding a single card from your hand" [S6].
  - K26: "you may add a card from your hand" [S2].
  - KASA's game checks only the hand card's value plus the build's [S5].
  - basil's "preg" uses one hand card (rules.js:463-468) [S22]; lindabaloyi and khasinomvp likewise [S24][S28].
- **Floor cards:** only Ritanzwe allows "one card from your hand, plus any loose table cards", added on 2026-09-28 at a client's request (RULES.md:66-68) [S23].
- **Stolen cards:**
  - K26: "A stolen card cannot be used to compound an opponent's build, only to capture it" [S2]. But K26 also lists "augment" among moves that may steal [S2].
  - Ritanzwe: "You can **never add a set of the same value** to another player's build, or steal into it" (RULES.md:67) [S23].
  - No source shows a stolen card used to augment.
- **Merge rule:**
  - K26: "If you already own a build, augmenting must land on that same value (a merge)" [S2].
  - KASA's game: "Cannot augment to …: you own a build of … — augment must merge into it" [S5].
  - Swazi has the same rule: "you must then amalgamate this with your existing 13-build" [S12].
- **"Double" limit:**
  - Appears only in K26 and its Academy: "The new value may not exceed double the original build's value"; "Never legal: Augmenting beyond double the original build value" [S1][S2][S3].
  - **Absent** from the 2023 document [S6], from KASA's own game, which has no such check [S5], from pagat [S12], and from every surveyed engine [S22]–[S28].
  - **Contradicted** by K26's own worked example (4 → 9) [S2].
  - A possible origin: the online game's test that a build whose cards total ≥ 2 × its value is compound [S5]. A loose paraphrase of that test could come out as "cannot exceed double".
  - If enforced literally, it means new ≤ 2 × old, i.e. the added card may not exceed the build's current value.

### Q4. Raising your own build; how many builds

**Recommended reading:**
- You **cannot change the value of your own build**. You can only compound it with further sets of the same value (or load it with same-value cards) and eventually capture it.
- In the two-player game each player owns **at most one build** at a time, in both deals. A second build of the same value merges into the first.
- In partnerships a second build can arrive only through a partner's Shiya, and one of the two must be captured on the receiver's next turn.

**Confidence:** no raising your own: **high**. One build: **high** for round 1, **medium** for round 2.

**Evidence:**
- **No raising your own:**
  - 2023: "the build is currently owned by an opponent… You would not be allowed to do this if the 9-build had been formed by yourself or your partner" [S6].
  - K26 defines augmenting only on an opponent's build, and the owner may only compound [S2].
  - KASA's game: `if (t.owner === a) return false` in the augment check [S5].
  - basil, Ritanzwe ("You **cannot** raise the value of your own build, whether it is weak or strong", RULES.md:63), Tebogo60, lindabaloyi (acceptBuildExtension.js:63-72) [S22]–[S25].
  - Only the two AI-written repos allow it [S28]. Folk: "Players may not build on their own build in succession" [S15].
- **One build:**
  - 2023 action 2: "that is if you don't have another one already"; Shiya: "this is the only circumstance where a player can have two builds" [S6].
  - KASA's game guards one build per owner and one build per value ("BUILD-GUARD") [S5].
  - K26's merge rule presupposes it [S2]. Ritanzwe: "A player can own **only one build at a time**" [S23]. basil: "a second self-owned build can only arrive via Shiya" [S22].
- **Round 2:**
  - Swazi lifts the one-build rule in the second half [S12].
  - Pagat SA and 2023 relax only discarding ("players are always allowed to drift") [S6][S12]. KASA's game relaxes only discarding [S5].
  - A reviewer wants "2nd roound build as much as you want" [S16].

### Q5. Is a turn a sequence of actions or one move?

**Recommended reading.** A turn is **one hand-card move**, with two kinds of accompanying cardless action:
- (a) adding loose floor cards to your **own** build, singly if they equal its value or as sets summing to it, at no cost and as often as the floor allows;
- (b) steals that complete the hand card's move. Several steals are allowed if each one completes a set (Q1).

A capture **ends** the turn: steals and additions must come first. Cardless additions are optional (Cupha).

**Confidence:** **medium**.

**Evidence:**
- **"Exactly one card" means one hand card:** KASA [S2]; KASA's game enforces one hand card plus End Turn [S5].
- **Cardless additions:**
  - 2023 (from Swazi): "As long as no card from your hand is involved, you can perform as many of actions 2 and 4 as you wish in any order, before or after playing from your hand" [S6].
  - KASA's own Cupha example presupposes them: "You own a Build 10. Opponent discards a 5. You may chow it against another floor 5 instead of loading it onto your build" [S1].
  - KASA's game: "add-table-card-to-build", "AI added a loose … to its build" [S5].
- **Steals bound to the move:** "Every steal must complete a legal capture or build on this turn" [S2]. In KASA's game an unused steal is rolled back, and a steal onto your build locks the hand card to that value [S5]. Pagat: "provided that the building player simultaneously adds a card to the build from hand" [S12].
- **Capture closes the turn:** "Steals must be collected before you capture"; "Turn resolved by capture — steals are now closed" [S5].
  - A reviewer: "in cassino you are not allowed to play a card from your hand after you have started a capture, its either you capture or drift as you had no way of knowing what card was underneath the top card" [S16].
  - basil: "a capture… closes the taking for the turn" (rules.js:1109) [S22].
- **Optional, not compulsory:**
  - K26: "you are never forced to load a card onto your own build" [S2].
  - The 2023 and Swazi texts make it compulsory on demand: "any opponent can insist that you add such cards to your build(s) before you end your turn" [S6][S12].

### Q6. Other points an engine needs

**(a) Discarding while owning a build.** Recommended: in the two-player game's **first deal**, a build owner may not discard at all. In the second deal (and in 3/4-hand play) a build owner may discard, but never their last card of the build's value. **Confidence: high.**
- Sources for the round-1 ban: 2023, pagat, KASA's game, the folk text, basil and Ritanzwe [S5][S6][S12][S15][S22][S23].
- K26 states only the last-card foul [S2]. Its silence on rounds is better read as an omission than as a repeal, because KASA's own game enforces the round-1 ban as of September 2026, three months after the rules page was last updated.

**(b) Between the deals.** The floor and builds stay. The second 10 cards each are dealt, and the round-1 leader leads again (which is simply the next turn in rotation). **Confidence: high** (§2.14).

**(c) Captures.**
- Several sums and sets, builds and loose cards, may be taken in one capture with a card of their value [S2][S6]. Capturing is never compulsory, nor is taking everything [S2].
- A stolen card may join a capture only as a same-value card on a floor base or build of that value [S2][S5].
- **Option:** pagat's and Ritanzwe's stolen-card sums [S12][S23].
- **Confidence: medium-high.**

**(d) End and scoring.**
- The last capturer takes the remaining floor and builds.
- Scoring is 11 points (2p/partners) or 7 (3p/4 singles).
- If one side captured no point cards, it scores 0 and the other 11.
- A tie-break (Mummy) applies only in 7-point games.
- A foul is a "straight", 11–0.
- **Confidence: high** for scoring, **medium** for the exception's exact form. KASA's game gives the 4 bonus points to the side with point cards, which comes to 11–0.

**(e) The match.** A game is one deal. A match is best of N games (1, 3 or 5 in KASA tournaments), or a league table at 3 points per win. **Confidence: high** (score form, scorecards, Elo bonus) [S4][S9]. Recommend the engine count games won, and optionally the points difference as a tie-breaker [S3].

**(f) Announcements.**
- "Announce all builds clearly" [S2].
- "8 out" when capturing your own build of 8 [S6].
- "Shiya" (partner's claim), "Stash" (loading your own build) [S6][S1].
- Folk "Calling… 'Fives'" [S15].
- The engine's log can use these words (§5).

**(g) Partners** (brief): shared scoring, a pile per seat, no building a value your partner owns, building for a partner only when their holding is proven, and the Shiya window [S1][S5][S6].

---

## 5. Terminology and table talk

| Term | Meaning(s) | Language / origin | Sources |
|---|---|---|---|
| **Khasino** | (1) The game's name (the "Kh-" spelling is the brand, "a registered Trademark"). (2) A sweep: "A Khasino (sweep) is a single capture that clears the entire floor. It is the most prized table moment in the game" | Brand of Zishapp/Vita (2020) | [S2][S7][S8][S9] |
| **casino / cassino / kasino** | Everyday names; "Kasi Cassino", "Mzansi" casino in reviews | English | [S16][S17] |
| **chow**, **chowing**, **chowed pile** | Capture; the capture pile. "Capturing — also called chowing" | South African English slang "To eat" (Wiktionary: "(slang, South Africa) To eat") | [S1][S6][S21] |
| **drift / drifting** | (a) any non-capturing play [S12][S6 glossary]; (b) using a capturing card to build [S6][S12]; (c) KASA: pairing a same-value card on the floor or onto your own build [S2]. Online: "Created a drift with …s" | English | [S2][S5][S6][S12] |
| **Shiya** | Partner's call: "leave that card I will chow it this side" [S6]; KASA: "call SHIYA to claim it instead" [S1]; also KASA's alias for drifting [S2]; online "called Shiya — drifted …s" [S5]; DZ app "shiya button" [S16] | isiZulu, isiXhosa, siSwati *shiya* "to leave" | [S1][S2][S5][S6][S16][S19] |
| **Stash** | Placing a duplicate of your build's value on your own build; "To Stash: This is to hold a card for chowing later" | English | [S6] |
| **Cupha** | Entrapment: "the right to IGNORE a legal capture or build option in order to set a trap" | isiZulu *cupha* "to set a snare, to set a trap" | [S2][S20] |
| **Mummy** | 10♦ (2 points). Profiles count "Mummies" | English | [S2][S4][S5] |
| **Spy Two**, "SPY 2" | 2♠ (1 point) | English (also Swazi) | [S2][S9][S12] |
| **big ten** | 10♦ in Swazi | English | [S12] |
| **straight** | An 11–0 loss imposed for a foul | English | [S2] |
| **8 out** | Said when capturing your own build ("he/she is chowing the card he built which was 8") | English | [S6] |
| **simple / compound build** | Single-set / multi-set build | KASA | [S2] |
| **augment** | KASA 2026: change the value of an opponent's simple build. 2023/Swazi: **add same-value sets** (= KASA's "compound") | English | [S2][S6] |
| **load / loaded build** | Put a same-value card on a build ("Loaded Build 6") | KASA | [S1] |
| **steal** (direct, combination, stack-on-base, base, capture-opponent-build) | Take an opponent's pile top into a move | KASA | [S2] |
| **base** | A loose floor card that a steal can be built on ("Base Steal") | 2023/Swazi, KASA | [S2][S6] |
| **floor**, **won-cards pile**, **home** ("take the pile to their home"), **home pile** | Layout; capture pile | South African English | [S1][S6][S16] |
| **40 on Deck** | KASA video tag for the 40-card game | Brand | [S9] |
| **FULL** build | A build no one may change ("pairs, pair and combination and 4+ cards") | Folk | [S15] |
| **Calling** ("Fives") | Pairing a same-value card and calling its rank | Folk | [S15] |
| **Still** | "placing same card" on a build | Folk | [S15] |
| **weak / strong build** | Single-set / multi-set | Ritanzwe client | [S23] |
| **top / augment, preg, dig** | Equal-value card onto a build; raise a build; take an opponent's pile top into a build | basil client | [S22] |
| **point Cassino** | Regional variant restricting point cards on builds | Reviewer | [S16] |
| **kasi**, **ekasi**, **Mzansi** | Township; South Africa ("Great online Mzansi card game that is played ekasi"; "Kasi rules that embrace Kasi culture") | Township slang / isiZulu | [S16] |
| **Top Ten** | The DZ app's package name is `com.dzsoftware.topten`. A search result also titled a tutoring listing "how to play top ten card game which [is] played [in] the townships" | Unknown | [S16]; Superprof URL in Gaps |

Isolated phrases in reviews: "hayi yona intswampu" (isiXhosa/isiZulu, roughly "no, it's the real thing") and "ke ba betha gore" (Sesotho/Setswana, roughly "I beat them so that…"). These are table-talk register, not game terms [S16]. [UNVERIFIED — the rough translations are this note's own and were not checked against a dictionary.]

---

## 6. Organised play (brief)

- **KASA** describes itself as "A registered Non-Profit Company (NPC)… under the Companies Act 71 of 2008", governed by "a Board of Directors elected at our Annual General Meeting", in Durban [S4].
  - Membership: General (free), Associate ("R300/year"), Affiliate ("R500/year") [S4].
  - Its mission: "To promote, foster, advance, and control the practice of the Khasino card game in South Africa" [S4].
- **Ratings:** "Starting Elo: 400. Provisional period: first 10 games. K-factor: 40 for new players, 20 standard, 10 masters (>2200)"; "Perfect Win Bonus: +10 points for winning 11-0" [S2][S4].
- **Referees:** "KHA01" exam: "20 Questions", "70% to Pass". Sections "Game Setup and Basics", "Card Play and Builds", "Prohibitions", "Special Situations", "Game Management". Higher grades: "KHA03 > KHA02 > KHA01". "Match results may only be recorded by a certified referee" [S3][S4].
- **Formats:**
  - Leagues: singles or partners; online, in person or hybrid; "Points: 3 for win" [S3][S4].
  - Tournaments: knockout or "Lowest Point Elimination"; best of 1/3/5; "Allocate 20-30 minutes per match"; "Late arrivals: 10-min grace, then forfeit"; "Rule violations: Yellow/Red card system" [S3][S4].
  - Player and organiser agreements v1.0 of 29 June 2026 are "Modelled on federation governance standards (FIDE, Chess SA, ITTF)" [S4].
- **Events on record:** YouTube has monthly tournament games (February, March, May, July and August 2025) and a "Khasino Champions League" with a "Final 2022/23". One thumbnail shows a handwritten "Solo Khasino Tournament 28 June 2025" round-robin sheet [S9].
  - KASA's online game runs automated daily tournaments with check-in windows, byes and walkovers (changelog 2.0.0–2.5.13, Aug–Sep 2026) [S5].
  - A 2022 KASA video, "40 on Deck Game Play", shows the gold brand deck [S9].
- **Scale:** small. YouTube had 421 subscribers, and its tournament videos had 13–192 views [S9]. TikTok had 89 followers [S11]. KASA's own leaderboard and member counts are loaded from its backend and were not fetched.
- **No mainstream media coverage was found** (§7).

---

## 7. Gaps and leads not followed

- **Ask KASA directly** (info@khasino.co.za):
  - What does "may not exceed double the original build's value" mean?
  - Are capture piles face up or face down?
  - Does the round-1 discard ban still apply? (Its own game enforces it; the site omits it.)
  - Is the "small-card-on-top" foul about builds, captures or both?
  - Can a player drift onto an opponent's build?
- **KHA01 exam questions** (table `exam_questions`) load only for signed-in users and were not accessed. They would settle many edge cases ("Special Situations", "Prohibitions").
- **Video evidence:** YouTube refused every playback request without sign-in, so captions and frames of KASA's tournament videos were unavailable. Only titles, descriptions and thumbnails were used. Watching the league games (e.g. `XPbH5ukijSI`, `bYL_MGy7JSI`, `OqSk3pJi_cY`, `m9LirEGUQqs`) would show pile orientation, capture order and table talk directly.
- **Facebook (Khasino.za), Instagram (khasino.za) and X (@KASA_Khasino)** return nothing without login. Not read.
- **Company and trademark registers:** no CIPC record for KASA NPC, Vita Business Solutions or Zishapp was found through search, and the "Khasino" trademark claim was not checked against the CIPC trademark register.
- **Media:** searches for Khasino or South African "casino" card-game tournaments in News24, IOL, TimesLIVE, SowetanLIVE, Daily Sun and GroundUp found nothing. Searches only covered the US-indexed web. A South African news archive search, or a search in isiZulu ("umdlalo wekhadi"), may do better.
- **Terms in other languages:** only *shiya*, *cupha* and *chow* were confirmed (Wiktionary). The isiZulu.net lookup timed out. Sesotho/Setswana and Afrikaans terms for the game and its moves were not found. Lead: ask players, or search township-slang dictionaries.
- **"Top Ten" as a name:** a search returned a Superprof tutoring listing whose URL reads "how-play-top-ten-card-game-which-played-the-townships-south-africa-you-build-the-card-you-have-your-hands" (superprof.co.za). The page was CAPTCHA-blocked and not read.
- **Kasi Kasino** (com.kasi.kasino, Sep 2026) has in-app rules; not installed.
- **A 52-card township variant** ("the ace is a 14, where we use all cards") [S16], resembling Swazi, is out of scope but may matter if players ask for it.
- **Pagat's 2015 contributor text** has never been revised. Whether "at least five spades: 1 point" is a regional rule or a mistake could be asked of pagat.
- **Online game details not pinned down:**
  - whether cardless additions to your own build are allowed after the hand card in the same turn;
  - the exact conditions of the multi-seat "Cannot Steal Here" message ("you can't take a card from a pile to capture that same player's build"), which conflicts with the two-player path that steals the build owner's top card onto their build before the capture.
- **The open-source survey** (§1.4) was done separately and is folded in as tier 6; its repositories were spot-checked, not re-surveyed.

---

## Sources

- **[S1]** KASA, "Khasino Rules — Official Rulebook: Master the Art of Khasino", https://www.khasino.co.za/rules. Text from the site bundle https://www.khasino.co.za/assets/index-CILIvUmv.js (fetched 2026-10-03). Page date from the page's own request `GET /rest/v1/page_content?select=updated_at&page_slug=eq.rules` → `2026-06-28T09:39:07Z`.
- **[S2]** KASA, the rulebook text used by the /rules page's "Download Rules PDF" (sections "Purpose of the Document" … "Ranking & Rating System"), same bundle.
- **[S3]** KASA Academy, https://www.khasino.co.za/academy: "The Rules of Khasino" study text, "League Owner's Guide", "Tournament Organizer's Guide", KHA01 exam shell. Same bundle.
- **[S4]** KASA site, other routes (/, /about, /terms, /terms/player, /terms/organizer, /referees, /rankings; league and tournament creation forms; referee score entry). Same bundle. Site HTML https://www.khasino.co.za/ (og:image on `…lovable.app`, timestamp 1788943973830 = 2026-09-09).
- **[S5]** KASA online game, https://play.khasino.co.za/ ("Khasino Card Game — Play Free 1v1, Tournaments & Leagues", author meta "Vita Pty Ltd"). Bundle https://play.khasino.co.za/assets/index-D94TP5GV.js, app v2.5.13 with embedded changelog 2.0.0 (2026-08-14) – 2.5.13 (2026-09-28). Fetched 2026-10-03.
- **[S6]** "KHASINO – RULES / DESIGN AND DEVELOPMENT OF NATIVE APP FOR A MOBILE GAME", Document Version 1.1, prepared by A. Hlongwane, © 2014–2023 Vita Business Solutions (Pty) Ltd; PDF created 2023-02-03. https://c.tabletopia.com/games/khasino/rules/khasino-rules/en
- **[S7]** Tabletopia, "Khasino", https://tabletopia.com/games/khasino
- **[S8]** Khasino shop, https://khasino.shop.netcash.co.za/
- **[S9]** YouTube, "Khasino South Africa" (@KhasinoZA): https://www.youtube.com/@KhasinoZA/videos and /about. Video pages and descriptions for `m9LirEGUQqs` (2022-04-14), `bYL_MGy7JSI` (2025-08-17), `Nn_h4-8xfB0` and `lzz7Yzzn1-w` (2026-05-25), `qb7My6ToMGs` (2026-07-12). Thumbnails https://i.ytimg.com/vi/{XPbH5ukijSI, bYL_MGy7JSI, 9ETNbcG54Cc, OqSk3pJi_cY, qb7My6ToMGs}/maxresdefault.jpg
- **[S10]** YouTube oEmbed: `WrdSVHMYocc` ("How To Play Casino (Card Game)", Gather Together Games); `ZNZhI3DvzAY` ("South Africa Casino Durban Best Card Game", 2013-08-02); `m9LirEGUQqs` ("Khasino Game Play - OB vs 22 Pagez").
- **[S11]** TikTok, @khasino.za, https://www.tiktok.com/@khasino.za
- **[S12]** J. McLeod, "African Casino" (Swazi from J. Dushoff; South African from F. Asmal), pagat.com, last updated 1 Oct 2026, https://www.pagat.com/fishing/african_casino.html
- **[S13]** The same page, Wayback Machine capture 2015-11-06 ("Last updated: 4th October 2015"), https://web.archive.org/web/20151106143923/http://www.pagat.com/fishing/african_casino.html
- **[S14]** J. McLeod, "Card games in South Africa", pagat.com, last updated 6 Apr 2022, https://www.pagat.com/national/south_africa.html
- **[S15]** Wikipedia, "Cassino (card game)", oldid 1210204755 (2024-02-25), section "South Africa American cassino", https://en.wikipedia.org/w/index.php?oldid=1210204755
- **[S16]** Google Play, "Cassino Card Game South Africa" (DZ Code), https://play.google.com/store/apps/details?id=com.dzsoftware.topten. 94 reviews (2025-02-12 to 2026-09-22) from Play's public review endpoint (RPC `UsvDTd`), fetched 2026-10-03.
- **[S17]** Google Play, "Kasi Kasino" (Sibanyoni Tech Studio), https://play.google.com/store/apps/details?id=com.kasi.kasino
- **[S18]** Google Play, "Cassino Pro: Card Game" (Sizo Develops II), https://play.google.com/store/apps/details?id=com.sizodevelops.sacasino
- **[S19]** Wiktionary, "shiya", https://en.wiktionary.org/wiki/shiya
- **[S20]** Wiktionary, "cupha", https://en.wiktionary.org/wiki/cupha
- **[S21]** Wiktionary, "chow" (verb, "(slang, South Africa) To eat"), https://en.wiktionary.org/wiki/chow
- **[S22]** basil-dlamini/sa-cassino-play, https://github.com/basil-dlamini/sa-cassino-play (README.md; js/rules.js; js/tests.js)
- **[S23]** Ritanzwe/south-african-casino, https://github.com/Ritanzwe/south-african-casino (RULES.md)
- **[S24]** lindabaloyi/casino-game-mobile-dev-dev, https://github.com/lindabaloyi/casino-game-mobile-dev-dev (shared/game/actions/capture.js, trail.js, acceptBuildExtension.js, round.js)
- **[S25]** Tebogo60/casino_card_game, https://github.com/Tebogo60/casino_card_game; mosa-retha/Cassino-game, https://github.com/mosa-retha/Cassino-game (README.md)
- **[S26]** HotbitsZA/Khasino, https://github.com/HotbitsZA/Khasino (utils/KhasinoEngine.cc); sizodevelops/CardGame, https://github.com/sizodevelops/CardGame
- **[S27]** Simon-Mufara/sa_casino, https://github.com/Simon-Mufara/sa_casino ("Khasino.Rules.en (1).pdf", the same document as [S6])
- **[S28]** Mr-Zwalo/Kassino-Kings, https://github.com/Mr-Zwalo/Kassino-Kings (game.js); ayanda4rbn/khasinomvp, https://github.com/ayanda4rbn/khasinomvp; Mthabela00/Township-Casino-Game, https://github.com/Mthabela00/Township-Casino-Game
- **[S29]** Project notes: `research/01-wikipedia.md` (§2.2–2.3), `research/05-table-talk-terminology.md`, `research/06-tools-scorekeepers-digital.md` (§2.1, review vocabulary).
