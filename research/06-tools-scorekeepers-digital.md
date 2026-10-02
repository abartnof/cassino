# 06 — Scorekeepers, physical aids, and digital implementations of Cassino and its relatives

Scope: how Cassino (and Scopa, Kasino, Pasur, Basra, Chkobba, Xeri/Diloti, Escoba) is **scored and tracked** at the physical table; what **patents / historical products** exist; and a survey of **digital implementations** (mobile, web, PC, Steam, open-source) with attention to *how they represent builds, captures, sweeps and scores*, what users complain about, and what a new video game can learn. Every bullet carries a citation to a source fetched in this session (2026-10-02). App-store install counts are Google Play "realInstalls" values (exact counts behind the public "100,000+" style bands), retrieved with the `google-play-scraper` library from the listed Play URLs; ratings are as returned that day.

---

## 1. Physical scorekeeping: how Cassino is traditionally tallied

### 1.1 Counting at the end of the hand ("showing")
- Foster (1897) describes the end-of-hand count, which he calls "Showing": "After the last card has been played, each player counts his cards face downward, and announces the number. The player having the majority scores the three points for cards. If it is a tie, neither scores. The cards are then turned face up, and the spades counted and claimed ; and then all the points for Cassinos and Aces." [S1, p. 446]
- The fixed total doubles as a check on the count: "the total number of points to be made in each hand, exclusive of sweeps, is eleven, and the total of the claims made must agree with that number." [S1, p. 446] → the 11-point total is the physical game's checksum.
- Foster's base point table: majority of cards 3, majority of spades 1, "The Ten of diamonds, Big Cassino" 2, "The deuce of spades, Little Cassino" 1, each Ace 1, "A Sweep of all the cards on the table" 1. [S1, p. 442]
- Only the most recent capture may be inspected: an error "must be challenged and proved before the next trick is taken in by another player, because only the last trick gathered can be seen." [S1, p. 446] (Captured piles are otherwise hidden. Compare the Southern African games in §1.6, where they are face up.)

### 1.2 Older scoring methods: 11 points, lurch, counters
- "The old way was to play 11 points up, deducting the lower score from the higher at the end of each deal. If one side reached 11 before the adversary reached 6, it was a lurch, and counted as a double game. The common method is to count every hand a game, and settle for it in counters." [S1, p. 446]
- Wikipedia's summary of the classic English rules: "Game is 11 points; if the loser has less than 6, he or she is lurched and loses double." [S7]

### 1.3 Twenty-one-point Cassino: counters, cribbage boards and "counting out"
- Foster on game equipment: "This game is usually marked with counters, or pegged on a cribbage board. Nothing is scored until the end of the hand, when each side reckons and claims its points." [S1, p. 447]
- Fixed tie-break ("count-out") order: "the points count out in the following order :— Cards first, then Spades, Big Cassino, Little Cassino, Aces, and Sweeps. If the Aces have to decide it, the spade Ace goes out first, then clubs, hearts, and diamonds." [S1, p. 447]
- Claiming during play, a mental running total: "It is better to agree to count out in twenty-one point Cassino; each player keeping mental count of the number of cards and spades he has taken in, together with any 'natural' points. The moment he reaches 21 he should claim the game, and if his claim is correct he wins, even if his adversary has 21 or more. If he is mistaken, and cannot show out, he loses the game". If neither player claims and both are found to be out, play continues "to 32 points, and so on, eleven points more each time". [S1, p. 447]
- Wikipedia dates 21-point Cassino to Dick's 1880 *Modern Pocket Hoyle* ("Cassino is now very generally played for a fixed number of points (usually twenty-one)"), with "points … scored as soon as made" and "A player who erroneously claims to have won loses the game." [S7, citing "Trumps" 1880 p. 181]
- Pagat describes the modern form of the claim: "Some players, when approaching the target score, count the points as they are earned - each sweep as it happens, aces, big and little casino as they are captured, and spades or cards as soon as one player has captured 7 or 27 of them respectively. In this case the play ends soon as a player correctly claims to have won by reaching the target score (even if the opponent has in fact scored more but failed to claim it)." [S2] → **the clinch thresholds of 7 spades and 27 cards** are natural targets for an on-screen counter.
- The CatsAtCards rules page uses the same order and calls the claim a "count out": "At any time during the game a player who thinks that they may have totaled 21 or more points in their hand and on the score sheet may call for a 'count out'." [S10] It also calls for a **score sheet** and says that during the scoring order, if "a player's score totals or exceeds the 21 needed for victory, he is instantly declared the winner of the game." [S10]
- An App Store reviewer describes a stricter house version of counting out: "when you get to 17, you have to get most cards and most spades to win. At 18 or 19, you have to get most cards to win. When you get to 20, you have to get most spades to win… If you have 18, any point cards you get don't count for you - you just keep the other person from scoring." (review of *Cassino!*, 2017) [S26]

### 1.4 The cribbage board (Spade Cassino)
- Spade Cassino was designed around pegging: "The game is scored on a cribbage board, every point being pegged immediately ; that is, every spade, every Ace, the Cassinos and the sweeps. There is nothing to count at the end of the hand but the cards. Sixty-one points is game, once round the board and into the game hole." There are 24 points per hand excluding sweeps (cards 3, Big Cassino 2, Little Cassino 1, four Aces 4, spade Jack 1, 13 spades). [S1, p. 448]
- Wikipedia repeats this: "Game is 61 and hence it is scored on a cribbage board, all points being pegged as they are made apart from 'most cards' which is pegged at the end." [S7]

### 1.5 Physical sweep markers: one card turned face up
This is the oldest and most widespread physical "UI" in the whole family. A card turned face up in the capture pile records a sweep:
- **Anglo-American Cassino:** "Sweeps are usually marked by leaving the cards with which they are made face upward at the bottom of the tricks taken in by the player. Sweeps made by opposite sides are sometimes turned down to cancel one another." [S1, p. 445]. Pagat: "When making a sweep, the capturing card is stored face-up in the pile of won cards, so that the number of sweeps can be checked when scoring." It also notes "Some players call this a clear." [S2]
- **Swedish Kasino (*tabbe*):** "the card which makes the capture is placed face up in your pile of captured cards, rotated so that the card remains visible, and the cards captured from the table are stacked face down on top of it." [S3]
- **Finnish Kasino (*mökki*, 'hut'):** sweeps are "recorded by turning one card face up in the player's captured card pile." [S3] Finnish Wikipedia gives more detail: sweeps are "usually marked … by placing one of the pile's cards crosswise, face up (*poikittain kuvapuoli ylöspäin*)", and adds the tip "Pisteettömän kortin käyttö on suositeltavaa pistelaskun selkeyttämiseksi" ("Using a non-scoring card is recommended, to make the scoring clearer"). [S8] Korttipeliopas: "Sen merkiksi laitetaan pistepinoon yksi otetuista korteista kuvapuoli ylöspäin" ("As its mark, one of the captured cards is put face up in the score pile"). [S9]
- **Scopa:** each scopa is "indicated by a card stored face up in the capture pile". [S5]
- **Pasur (*sur*):** "Each Sur is represented by a card taken from the player's capture pile and placed separately face down beside it", and a sur by one side cancels one of the opponent's, with "the card … returned to the opponent's capture pile". [S6]
- **Escoba (digital version of the same marker):** cardgames.io writes "they would typically keep one card face-up in their capture pile so the counting of escobas is easier. In this implementation, the trick denoting the Escoba glows with a yellow tint." [S36]

### 1.6 Variant rules that depend on running state (and so need a tracker)
- **Finnish Kasino:** points for aces and both Kasinos "are awarded as soon as they are captured, so the game can finish in the middle of a hand"; sweeps cancel if every side has one; there are no sweep points after the last deal, and none once anyone has 10 points; the game is to 16. [S3] Tied "most cards / most spades" points "jää 'pakkaan'" ("stay in the pack") and roll into the next round as 2, 3… points (cards) or 4, 6… (spades). [S8] A rare variant requires exactly 16: "17 pisteeseen päätyessä joutuu 15:een" ("ending on 17 sends you to 15"). [S8]
- **Thorium's open-source Kasino** puts these rules in code and in its help: "Tied categories carry over… Sweeps cancel out… Sweep freeze. Once any player has reached 10 cumulative points, sweeps score nothing for the rest of the game." [S60]
- **Pasur:** "a player who has 50 or more points on the score sheet can neither score a Sur nor cancel an opponent's Sur." [S6] The rule assumes a written score sheet.
- **Southern African Casino:** "captured cards are kept face up, and … a played card can capture not only cards from the central layout but also the top cards of opponents capture pile"; "Each build has an owner". Using a card for a build when it could have captured is called "drifting", and a capture is a "chow". [S4] Here the capture piles are part of the playing field, which reverses the hidden-pile convention in §1.1.

### 1.7 Score sheets and scoring cards in commercial products (Scopa as the model)
- Winning Moves' boxed *SCOPA™* (2011) lists its "CONTENTS: Deck of 40 unique Scopa cards, 2 scoring cards (for your reference), pad of score sheets". Setup step 1 is "Pick a scorekeeper." The sample scoresheet marks each scopa with an "s" ("1 point Each Scopa ('s')"), and the cards carry a second index: "Primiera Value is shown in the top right-hand and lower left-hand corners of the cards". [S11] The product therefore does three jobs on paper: a reference card for the rules, a pad with a notation for sweeps, and dual indices printed on the cards.
- Phone scorekeepers took over the score-pad role for Scopa. GiMiSiS *Scopa Scorer* (6,938 installs, 2014) opens with: "How many times did you play Scopa and you have not a pen and paper handy?… Forget pen & paper and start playing." [S46] Matthew Miner's *Scopa Scorer* (586 installs, 2025) will "Automatically calculate remaining cards, primiera points, and tally the totals". [S46] The open-source `nigeleke/scopa` scorer exists because "For a beginner especially, the scoring seemed somewhat complicated. At the time I setup a quick spreadsheet to track each round of scores for each player." [S47]
- **Negative result:** a Google Play search for "cassino score keeper" turned up generic scorekeepers and Cassino *games*, but no Cassino-specific scoring app. [S52] Web searches for vintage Cassino score pads or markers returned only bridge/whist/Yahtzee pads and generic Etsy pages. [UNVERIFIED — no Cassino-specific score pad found in fetched sources.]

### 1.8 Patents and historical products
Google Patents full-text search is swamped by gambling "casino" patents and by people and places named Cassino. Queries for "cassino", "cassino card", "cassino counter" and "cassino score" turned up **no patent for a dedicated Cassino scoring device**. [S16] The relevant finds are game-design patents that reuse Cassino's scoring vocabulary:
- **US 599,767, Richard G. Clarke, "Game-Pieces", 1898.** Dominoes with playing-card suit and value marks, for a family of "court domino" games including "casino domino". Rule 7: "The game shall be twenty-one points, and shall be counted when casino-points show at either or both ends of the lay after a domino has been set. Big casino (ten of diamonds) shall count two points. Little casino (five of spades) shall count one point. Each ace shall count one point. Each sweep shall count two points". [S12] (Little casino is the five of spades here, because the domino set has no deuces.) Suits are also colour-coded ("the heart-spaces crimson, the diamond-spaces orange, the club-spaces green, and the spade-spaces blue"). [S12] This shows that by 1898 the 21-point game and the "casino points" vocabulary could be transplanted to new components.
- **US 1,012,574, Emma F. Adams, "Playing-Cards", 1911.** A standard deck with a letter printed on every card, for a word-building game "played as in the game of casino… a player may build, as in casino". The C+A+T example: "he can 'build' the card 'A' on the card 'C'… and then… play the 'T' card and take the three cards". Scoring keeps Cassino's points: "the holder of the most spades may count a point, as may the holder of little casino, and the holder of big casino, the ten of diamonds, may count two points. The aces may each count one". [S13] This is an early **re-skin of Cassino's build/capture mechanic onto a different matching rule**, the same move a video game makes with any new theme.
- **US 745,879, Catherine C. Meriwether, "Playing-Cards", 1903.** "Zero" cards with Roman numerals: "a game like ordinary casino may be played… while the zero-card, which corresponds to 'big casino,' may have any value whatever set upon it." [S14]
- **US 1,743,613, I. L. Lesavoy, 1930.** A chess-teaching deck. It mentions Cassino only in passing ("the long-known cassino deck of 52 cards"), which shows the name was a standard reference point for a 52-card pack. [S15]
- Two modern hits, US 2006/0249907 A1 "East-West Cassino" and US 8,511,687 B2, turned out to be gambling-machine patents with no connection to the card game (full text checked). [S16]
- **Historical boxed product:** an antique-games dealer lists "1820 - The Musical Game of Pope Joan, Cassino & Commerce", "published by Chappell & Co 50 New Bond Street London". It was meant to "teach keys to children", and the dealer believes surviving copies "are later versions of this game that appear to have extra cards and rules of other games". [S17]
- **Museums (negative result):** the V&A collections API returned no Cassino card-game objects for "cassino" (only Monte Cassino items). The Smithsonian Open Access API returned only rule books such as *Hoyle's games… cassino* and *The American card player* in its library holdings. [S18]

---

## 2. Digital implementations: catalogue

### 2.1 Mobile: Cassino proper (Android data from Google Play, 2026-10-02)

| App (developer) | Installs (exact) | Rating (n) | Released | Rules / modes noted | Source |
|---|---|---|---|---|---|
| Cassino Card Game (Zol's Apps) | 165,691 | 3.99 (1,121) | Apr 2014 | 2 players; match to 21; sweeps; "Daily-5" same-deal competition; PvP | [S19] |
| Casino Card Game (Paris Pinkney) | 139,313 | 3.74 (997) | May 2013 | first hand deals 6 cards, then 4; "build, stack and capture" | [S20] |
| G4A: Cassino (Games4All) | 37,779 | 3.71 (386) | Jun 2013 | 3-handed (you vs 2 AIs: "Cary", "Laura") | [S21] |
| Cassino Card Game SA (DZ Code) | 27,545 | 3.71 (ZA store) | Feb 2025 | South African 40-card, 10-card hands, two rounds; online ELO; 4-player pairs; "shiya" button | [S22] |
| Kasino – Cassino Card Game (O-P Card House, Finland) | 16,073 | — | May 2026 | Nordic rules; "dungeon-style" Trials with bosses and relics; no ads | [S24] |
| Cassino Card Game Classic (DZ Code) | 2,292 | 2.71 (17) | Nov 2020 | 52-card classic, vs computer | [S23] |
| Pocket Cassino (Pocket of Games) | 652 | iOS 3.75 (4) | Jun 2024 | customizable rules; spectator mode; subscription $2.99/mo | [S25] |
| Cassino! (Michael Dokken), Android | 276 | — | Jun 2026 | 1–3 AIs; Easy/Medium/Hard/Insane; variation builder; replay mode | [S27] |
| Cassino Pro (Sizo Develops II) | 59 | — | Jun 2026 | SA 40-card; room codes; LAN | [S48] |

iOS:
- **Cassino! (Michael Dokken):** 3.76 stars from 302 ratings, released 2012-09-13, v2.5. Supports "2 player, 3 player, and 4 player… Local multiplayer games can be played over bluetooth or wifi. Online… through game center… Turn-Based"; "Four difficulty levels"; variations "Royal, Draw, Sweep, Other Variations"; tutorial; statistics. [S26]
- **Cassino Royale (PikeSquare, 2026):** "Training mode suggests your best move — and explains why • It even explains the computer's moves"; "A new Daily Challenge every day — the same deal for everyone"; "Pass & Play: two players, one device"; "Large, readable cards designed for comfortable play at any age"; "No ads. No data collection." [S28]
- **Casino Card Game (Paris Pinkney):** 4.33 stars from 6 ratings on iOS. [S30]

**Scale comparison with relatives.** The same day, Scopa and Basra apps were one to two orders of magnitude larger than any Cassino app:
- Scopa: *Scopa: la Sfida* (WhatWapp) 12,339,804 installs and 4.36 stars (229,507 ratings); *Scopa originale Dal Negro* 3,560,675; *Scopa (Broom)* (Lisitso) 1,888,672; *Scopa!* (Escogitare) 1,637,117; *Scopa Più* 1,221,038; *Scopa 15* (Escoba) 865,798. [S40]
- Others: *Egyptian Basra v2* 831,177; *Egyptian Basra – كوتشينه* 532,117; *Chkobba Tn* 531,113; the Iranian Pasur app *چهاربرگ آنلاین 11* 142,848; *Xeri+* 68,376. [S42]
- iOS: *Scopa!* (Marcarelli) 4.73 stars from 3,743 ratings; *La Scopa* (OutOfTheBit) 4.72 from 3,322; *Pasur11* 4.63 from 1,239; compared with Cassino!'s 302 ratings. [S30][S43]

### 2.2 Web
- **Board Game Arena, *Cassino*:** "Available since Apr 7th 2025"; "Number of players: 2,3,4,6"; "Game duration: 17 mn"; "Number of games played: 2 653"; complexity 1/5; "Developed by: ufm". [S31] The in-game quick rules note "An opponent can 'steal' a build by increasing its value (only for 'single' builds)", give "Most Cards: 3 points (0 if tied)", and play to 21. [S31]
- **Psellos *Cassino in the Browser*:** "a transplanted iOS app" offering Traditional, Royal and "Casual Cassino". It runs "at the pixel dimensions of the original iPhone", and "The app is an effective card counter, but it can be beaten with a little strategy." [S33] Interface details are in §3–§5.
- **CardzMania *Cassino*:** "2-12 Players", Classic and Royal modes, "No Ads", "No Sign Up"; rules text is "coming soon". [S32]
- **playpasur.com (Pasur):** live, **asynchronous** and solo play ("Start a game in your browser, continue on Android or iPhone, and get a reminder when it's your turn"); a scoring guide that teaches players to "Count Haft Khaj, special cards, and net Surs step by step"; "Made with care for the diaspora"; "1,574 games played". [S45]
- **cardgames.io** has Escoba but no Cassino page: `/casino/` and `/cassino/` return 404, and Escoba is in the site menu. [S36]
- **Thorium/Kasino** (F#/Fable) has a public browser build. [S60]

### 2.3 PC / console / Steam
- **SpiteNET *Cassino* v3.0.0 (Windows):** "Price $12.99 $9.99 US"; 30-day trial limited to "10 different deals"; 2 players vs computer or "online against another player"; "tutorial included". [S34]
- **Thanos Card Games:** freeware Windows Cassino and Scopa programs, as listed by pagat. [S2][S5][S35]
- **Hoyle and Nintendo compilations (negative result):** the Wikipedia articles for *Hoyle Card Games*, *Clubhouse Games*, *Clubhouse Games: 51 Worldwide Classics* and *Microsoft Entertainment Pack* do not mention Cassino or Casino (grep of raw wikitext). [S38]
- **Steam (negative result):** the store search API returned **no results** for "cassino", "casino card", "kasino", "pasur" or "tablanette". [S37]
- Related Steam titles: *Escoba* (Quarzo, Oct 2025, $4.99; tutorial, "Practice mode (allows you to undo moves)", 4 AI levels) and **Scopa Sweep** (Static Fire Games, coming Oct 2026). Scopa Sweep is a "Traditional Italian Scopa card game turned roguelike… Sweep the board with a SCOPA to increase your multiplier… Patrons at your table… changing the rules… Boss twists". [S37] O-P Card House's Kasino "Trials mode" (bosses such as "Näkkirouva") follows the same trend. [S24]

### 2.4 Open-source implementations (GitHub)
- **Search counts:** "cassino card game" returned 21 repositories; "scopa" 424 (mostly unrelated); "basra card" 25; "scopone" 30. [S53]
- **Finnish university projects.** Many Cassino repositories come from a recurring Finnish course assignment:
  - penkkaa1/Cassino: "Project for 'Programming Studio 2' course". [S54]
  - PGHM/kasino: "Kasino card game with GUI done in Java as part of first year programming course at Aalto University". [S53]
  - Others include tikkanr1, jooakar/scalassino, atreyaray, Rayska and viivi-uhari (Scala). [S53]
  - A separate Hungarian course ("Homework 2 — Kaszinó (Hungarian two-player Cassino)") ships only a test suite and asks students to build "a table in the browser where you play a whole deal against the computer". [S55]
- **South African builds.** Several recent repositories target the 40-card South African game:
  - basil-dlamini/sa-cassino-play [S56]
  - Malungisa-Mndzebele/cassino-card-game (live at khasinogaming.com) [S57]
  - Tebogo60/casino_card_game: "the most beloved card game from South African townships… played on stoeps, in backyards, and on street corners" [S58]
  - mosa-retha/Cassino-game [S59]
- **Commercial-leaning:** *American Cassino* (RandyNorthrup) offers "Full American Cassino rules (capture, build, call, trail)", "Three AI difficulty levels", "Online multiplayer with ranked play", and "Themes, achievements, and leaderboards". [S61]
- **Others:** dkmccandless/cassino (Go engine, simple vs compound builds) [S62]; cbtechny/Cassinito (Godot, Royal variant) [S63]; k-Constable/cassino_project (Java Swing) [S64]; penkkaa1/Cassino-cpp (C++/SFML, Finnish rules) [S54]; Thorium/Kasino (MonoGame + web) [S60]; SuneReeh/kasino ("'Nørdekasino' — variant… developed with friends at the University of Copenhagen") [S53].

---

## 3. How builds are represented on screen

| Approach | Example (evidence) |
|---|---|
| **Numeric label on the pile** | Psellos: "A build on the table is labeled with its value—A, 2, 3, and so on." [S33] SpiteNET v3 fixed a bug that shows labels mattered: "If you have version 1 and the numbers on your Build piles don't show or appear as funny pictures, please update your game to version 3.0.0." [S34] |
| **Separate "Builds" tray with a value label and owner styling** | Malungisa's `GameBoard.svelte` draws builds in their own area headed "Builds". Each is a button showing `Value: {build.value}` above all member cards in miniature, with a `my-build` CSS class when `build.owner` is the viewer. [S57] |
| **Owner as an explicit rule object** | South African rules: "Each build has an owner, who is responsible for eventually capturing it". [S4] basil-dlamini's house rulings: "Builds have owners. In pairs, only the owner (or an opponent) captures a build — never the owner's partner." [S56] |
| **Explicit value choice when building** | Malungisa computes the list of legal build values and opens a modal to pick one. [S57] k-Constable: after right-clicking cards, "A window will pop up, asking for the value you are building towards. Write this value". [S64] Diloti (Greek): "Full declaration system with clear on-screen guidance". [S44] |
| **Implicit, inferred by the engine** (failure mode) | Paris Pinkney: "When stacking or building cards, always start from the middle. If stacking or building from hand, click the middle card first, then click the card from your hand." [S20] Users could not tell which outcome they would get: "Controls are so horrible you cannot know whether the app will build or take!" (2018); "wish there was a way to tell if the app was building vs. stacking" (2015). [S20] |
| **Simple vs compound/multiple builds** | Engines model the distinction the paper rules make. Foster: "Two Sevens… cannot be increased to 8, 9, or 10 under any circumstances". [S1, p. 444] dkmccandless: "A compound build's value is fixed." [S62] SpiteNET: "A Single Build's value can be increased. A Multiple Build's value cannot be changed". [S34] |

The commonest complaints in reviews concern **raising or modifying builds**, and especially **unequal rules for the human and the AI**:
- "Can't build on what the bot builds, but the bot can build on what you build. Have played on and off for like 6 months, still hasn't be fixed." (Zol's, 1★ 2022) [S19]
- "I put an A on 5 to build 6 and the computer laid on a 2 to build 8. That was fine. BUT when the computer laid a 5 on a 3 to build 8 and I laid a 2 from my hand to build 10 it wouldn't let me." (Zol's, 3★ 2023) [S19]
- "my opponent has built '7s' with a 5 and a 2. There is a 3 and a 10 on the board. I have a 10… the game does not allow this." (Zol's, 4★ 2026) [S19]
- The Cassino! developer answers a similar complaint by restating the rule: "A build of 8 can only be captured with an 8… It is allowed to increase a single 8-build to 10 with a 2 from your hand". [S26]

---

## 4. How captures and sweeps are made and shown
- **Explicit selection with confirm buttons (Psellos):** "you can select any one card from your hand and any number of cards on the table… As you select and deselect cards, the blue buttons at the bottom change to show the legal plays for the selected cards." [S33]
- **Staged play plus End Turn (SpiteNET):** "The hand card that is put into play is placed slightly above the table until the End Turn button has been clicked." It also has a rules referee: "The game will stop you from making any illegal moves and display an appropriate message explaining why you cannot make the move". [S34]
- **Select, then Play/Clear (penkkaa1):** "Selected Cards are highlighted in red. Press `Play Selected`… or `Clear Selected`"; hovering a card shows "their Table and Hand values" (Finnish cards have different values in hand and on the table). [S54]
- **Listing alternatives:** Lisitso Scopa was praised because "when you pick up, if theres more than one option, it lists it for you" (3★ 2016). [S40] A Scopa Più reviewer asks for the reverse: "manca la possibilità di correggere la presa scelta" ("there's no way to correct the chosen capture"). [S40]
- **Ambiguous drag (failure mode):** "if you drag a card onto a center card with the intent to stack, the card is usually just picked up. How do you get to specify stack or pick up?" (Pinkney, 2021) [S20]
- **Sweep display:** SpiteNET shows sweeps "in the status bar at the bottom of the game window". [S34] cardgames.io makes the escoba trick glow yellow. [S36] Lisitso's "Scopa" banner drew a complaint: "When the Scopa sign comes up during the game, it stays on too long, and that freezes play." [S40]
- **Pace of AI moves (complaints in both directions):**
  - Too fast: "The app/computer moves WAY to fast. I can't determine what card the app used sometimes" (2015). "I would put a little pip (picture in picture) to show what computer picked up" (2014). [S20] "I'd like to see an option to slow down what the computer opponent is taking so I can have a chance to see it when he picks up four or five cards in a sweep" (Zol's, 2023). [S19] "adjust the speed at which the cards are removed… heck, a click to confirm would be even better" (G4A, 2014). [S21]
  - Too slow: "The gameplay is incredibly slow with no option to speed it up at all" (G4A, 2019). [S21] "Gameplay way to slow fix the speed between player turns faster" (Zol's, 2020). [S19]
- **Fixes in shipped products:**
  - Adjustable speed: Scopa 15 "adjustable animation speed" [S40]; Cassino! "tune animation speed" [S27]; Pasur11 "set up the game speed". [S43]
  - Move history: Thorium Kasino's "**?** button opens a small panel listing every other seat's play since your own (who played which card, and what it took or that it was placed)". [S60] penkkaa1's "`Last Turn:`" panel. [S54]
  - Telegraphing: the Psellos AI first "turns over the card it plans to play and selects the cards from the table" before playing it. [S33]

---

## 5. Score screens and running score
- **Running counters during play (Psellos):** "To help track most cards and most spades during the game, the counts of cards and spades are shown at the top of the green play area." The game score sits "at the position of your rightmost card", and the match score sits by the buttons. [S33]
- **End-of-round breakdown:** SpiteNET: "A window will open which displays the scoring breakdown… The cumulative Round scores are shown in the status bar". [S34] Diloti: "Scoring breakdown at the end of every round". [S44] Pasur11: "At the end of each game the points will be shown separately for each player(team)." [S43]
- **Missing breakdown (Paris Pinkney, repeated requests):**
  - "it would be nice to see the points broken down at the end of the game" (2014)
  - "At the end of each game, I want to see a point breakdown summary" (2014)
  - "you don't see the score, only if you win or lose" (2017) [S20]
  - In 2026, after an update, scoring broke ("Sometimes the final total is greater than 11 (combined) per round"), and "it will show I have 21 pts but the game continues on to a new deal and never logs my win." [S20]
  - The 11-point checksum in §1.1 is exactly what would catch the first bug.
- **Ads covering results:** "la pubblicità alla fine delle partite… mi oscura il risultato finale" ("the ad at the end of games… hides my final result", Scopa, 4★ 2021). [S40] "I couldn't see if I won or lost on my screen and the point system is not clear to understand" (Zol's, 2024). [S19]
- **Per-variant statistics:** Cassino! tracks "wins and losses tracked separately for every combination of variation, player count, and difficulty". [S27] Xeri+ offers "complete statistics… and even graphs!" [S42]
- **Same-deal leaderboards:** Zol's "Daily-5" ("compete daily against all players where they are all dealt the exact same cards") [S19] and Cassino Royale's Daily Challenge ("the same deal for everyone, worldwide"). [S28] The public stats also became evidence in fairness arguments: "321 players played the Daily 5 today. 2 had a winning score, 1 had a tie." (Zol's, 1★ 2020) [S19]

---

## 6. Teaching: tutorials, hints, coaching, replay
- **Suggest button (Psellos):** "touch the Suggest button… It selects the right cards for the play, and highlights the play button for its specific suggestion. The highlight is helpful in cases where there is more than one possible play." [S33]
- **Coach (Cassino Royale):** explains both your best move and the computer's moves. [S28]
- **Scripted tutorial plus replay (Cassino!):** "a hand-scripted practice game that walks you through every action" and "**Replay mode**: step back through your most recent game one move at a time with every player's hand revealed — a great way to study the AI's choices". [S27]
- **Hints and transparency toggles (Pasur11):** "Hint: get help from the game to choose a card", an explicit "Cheat: watch sneaky other cards such as other players hands", and an option to "undo surs by surs". [S43]
- **Hint as rewarded ad:** basil-dlamini's design puts the hint behind a "Rewarded video only when you ask: the 💡 Hint button". [S56]
- **Instructions that skip how to build (Paris Pinkney reviews):**
  - "it tells you the rules of the game it doesnt tell you how to build or stack in the instructions and yiu have to figure it out yourself" (2019)
  - "The instructions are not adequate… so I muddled through a few games" (2015)
  - "Game promised much. Fails in every respect with the examples in the tutorial." (2014) [S20]
  - A Zol's reviewer simply asks: "Should provide hints to help users." (2021) [S19]

---

## 7. Multiplayer, seats and social play
- **Player-count limits draw complaints in both directions:**
  - G4A is 3-handed only: "need to see a two-payer option" (2015), "Would be better if you had the option between 2 player & 3 player game" (2013). [S21]
  - Zol's is 1v1 only: "there's only 1v1" (2025), "three handed would make the game more interesting" (2018). [S19]
  - Cassino! supports 2–4 players, local and online. [S26]
- **Remote family play is a core motive:** "My brother and I… are both retired and live in different cities. Is there any way that we would be able to do that?" [S19] "I've enjoyed playing with My partner while he is abroad" (Cassino!). [S26] playpasur.com: "Made with care for the diaspora". [S45]
- **Online play: abandonment and rating:** Cassino Card Game SA reviewers write:
  - "players tend to just leave when they are losing" (23👍)
  - "even when your partner quits the game you lose the same points"
  - "you lose more Elo when you lose than you used to gain"
  - and ask to block bad partners: "we can play against them but not partner with them". [S22]
- **Format changes can backfire:** WhatWapp Scopa's 2024 redesign moved online play to single-hand matches with random opponents, prompting reviews such as: "le partite… durano solo una mano… non si può scegliere se giocare ad 11 punti" ("matches last only one hand… you can't choose to play to 11"), 321👍, and "Non posso più giocare con i miei amici, né aprire un tavolo" ("I can no longer play with my friends or open a table"). [S40]
- **Chat:** "more communication line should be open. Let them add more sentences to messages between two online players" (SA, 2025) [S22]; "non c'è neanche un minimo di possibilità di scambiare due parole con l'avversario" ("not even a minimal way to exchange a few words with the opponent", Scopa 2024). [S40]
- **Hot-seat privacy:** penkkaa1 hides hands between players: "your Cards are covered with a blue box titled `Click to reveal Cards`". [S54] Cassino Royale offers "Pass & Play". [S28]
- **Low-data and offline play:** "I like the fact that the app is simple and low data mode" (SA, 5★ 9👍). [S22] "alot of load shedding in south africa would be nice to maybe watch some videos to cover up instead of penalizing" (SA, 2025). [S22] Cassino Pro advertises "Local WiFi multiplayer (LAN)… no internet and no data". [S48]

---

## 8. AI opponents, and the "the computer cheats" problem
- **The dominant negative theme in every Cassino-family app examined:**
  - Zol's: "The cpu gets the Big Cassino 95% of the time"; "the computer always gets the last face card no matter what" (35👍). [S19]
  - G4A: "'Cary' wins a despondent amount of games while 'Laura' appears to have been designed to be the weak player". [S21]
  - Cassino!: "on the expert level, the computer doesn't just play better… He usually gets better cards". [S26]
  - Scopa (Italian): "La sequenza di carte… sembra leggermente 'truccata'" ("The sequence of cards… seems slightly 'rigged'"). [S40]
  - Basra: "The computer must win all the Jacks and the seven of diamond must go to the computer". [S42]
  - Pasur (Persian 1★): reports the deal seems to give all the soldiers (jacks) to one side. [S42]
- **Developers' replies:**
  - Dokken: "The cards are dealt completely randomly and there is no cheating, it's just a tough game." He also gives the strong player concrete advice: "remember how many aces/big-cassino/little-cassino have been played… especially near the end of the deck". [S26]
  - A satisfied reviewer frames the same thing as perception: "Players who complain that the computer or AI cheats… perhaps are not very good strategists" (Zol's, 2020). [S19]
- **Product answers to the fairness complaint:**
  - Replay with all hands revealed (Cassino!) [S27]
  - cardgames.io's bug-report form has a category "The game is rigged", which explains: "True randomness often looks less fair than expected - streaks and clusters are normal. Common misconceptions: Gambler's fallacy, Clustering illusion, Apophenia… Try it yourself: Doubles, Dice, Shuffle". [S36]
  - Xeri+ ties difficulty only to memory: "The difference between the levels of difficulty has nothing to do with the way the computer plays (for example, it does not deliberately let you win and it does not cheat on you) but only with how many cards it remembers". [S42]
  - Cassino Pro promises "no scripts, no rubber-banding, and no cheap house edge". [S48]
  - Pasur11 says "AI has no idea about your cards". [S43]
- **Research parallel:** Di Palma & Lanzi built Scopone AIs and contrast plain MCTS, which "requires complete information about the game state and thus implements a cheating player", with ISMCTS, which "can deal with incomplete information and thus implements a fair player". ISMCTS "is stronger than all the rule-based players… and it also turns out to be a challenging opponent for human players." [S49]
- **Difficulty ladders and personalities:**
  - Cassino!: Easy/Medium/Hard/Insane. A reviewer reports a 56% win rate on Hard (2,516 games) and 39% on Insane (216 games), which the developer calls "typical". [S26]
  - basil-dlamini: "Sipho (Aggressive)… Thandi (Patient)… Naledi (Calculating)… They only see what a human sees". [S56]
  - Thorium Kasino: optional "AI personalities… *Reno the Risk-taker*, *Cautious Cara*" and "AI table-talk (chat)" in which "Computer players make short remarks as they play". [S60]
  - Kasino (O-P): "The AI adapts to your playstyle". [S24]

---

## 9. Rule variants players expect to configure
Reviews show there is no single "correct" Cassino. Each request below is a real player's household rule:
- **Target score:** 11 vs 21 ("There should only be 11 points to win. Two hands per game. With 11-0 being called a body"). [S20] Matches to 31 in "the Portuguese version". [S19]
- **Point values:** a "10 of diamonds=3, 2 of spades=2… 11 pts" scheme ("it's called casino cause when u get all 11 pts you win. You must shout that you just CASINOed your opponent") [S19]. Pagat records the same 3/2/1 scheme from Connecticut and New York. [S2] Others: "only gave 2 points for most cards and 2 for the little cassino… if you have a tie in cards you split the points". [S26]
- **Sweeps on/off:** "never heard of sweep so that gets turned off" [S19]; "thankyou so much for adding the sweeps option" [S19]; "Scarne's rules do not allow a point for a sweep". [S19]
- **Royal values for face cards** ("I only wish I could play Royal Casino, which assigns 11-13 for the three face cards and either 1 or 14 for the aces") [S19]; "Can't stack face cards" [S19]; "couldn't build a queen with an ace and a jack". [S19]
- **Deal shape:** 6 cards on the first deal [S20]; "four cards are turned face up and four dealt to each player rather than 6". [S20]
- **Building restrictions:**
  - "can't build on point cards" [S19]
  - "Real casino players don't play identical card building" [S19]
  - "can't have 2 different builds on board at same time" [S20]
  - "2 of the same number cards are not supposed to be on the table. that is called, casino on board" [S19]
- **Jokers and multiple decks:** "We use the jokers as (-1/-2) wild cards… We also play with multiple decks" (Cassino!, "commercial fisherman"). [S26]
- **South African regional rules:** "please add point Cassino. In point Cassino you only add a card point on a build if that build has a point on it" [S22]; "We want the kasi cassino where the ace is a 14… please research on kasi style" [S22]; "there's different kinds of Casino in mzansi, please create another version". [S22]
- **What shipped products offer:**
  - Cassino!: "Original rules (Royal + Draw), the Traditional ruleset (match face cards only 1 at a time), or build your own combination from many individual options including Sweep, Royal Aces (aces as 1 or 14), Royal 2 and 10, and Pirate". [S27] The developer also cites a "Build-To-Anything variation". [S26]
  - Pocket Cassino: "Customizable Rules: Adapt the game to reflect the Cassino rules you're familiar with… tailored to your region." [S25]
  - Psellos: Traditional, Royal and Casual. [S33]
  - Scopa 15: rules for "points needed to win… primiera scored with 7s only or with all the cards". [S40]
  - Xeri+: "2 or 4 players, 4 or 6 cards in hand, 16 or 24 points". [S42]
- **Rule-description errors in shipped products:**
  - Pocket Cassino's site says "Other players cannot capture your builds" and "Maximum possible per hand: 21 points". [S51] Standard rules have 11 points per hand plus sweeps [S1], and any holder of the matching card can take a build. [S1][S34]
  - Malungisa's README swaps the names: "**2 of Spades**: 1 point (Big Casino)… **10 of Diamonds**: 2 points (Little Casino)". [S57]

---

## 10. Readability and accessibility
- **Small card indices:** "the ranks are so small on a phone I have to go by amount of symbols on the card" (Zol's, 2026). [S19]
- **Touch accuracy:** "If you are an adult with normal sized fingers, or God forbid, long nails, then this game isn't for you. Points are missed if you are not exactly precise in where you touch the screen" (Pinkney, 2015). [S20]
- **Large-index decks:**
  - Thorium's "Screen-optimized: big index and one large centre pip, made for phones", with hand and table cards drawn "about twice as large" in mobile mode. [S60]
  - SpiteNET's "tile or steel cards sets with large numbers that are easy on the eyes". [S34]
  - Scopa 15's "larger cards". [S40]
  - Cassino Royale's "Large, readable cards designed for comfortable play at any age". [S28]
- **Screen readers:**
  - Scopa 15: "Accessible with full TalkBack support (with cards and moves announced aloud)". [S40]
  - Scopa! (Marcarelli, iOS): "This app uses VoiceOver to improve its accessibility." [S41]
  - Spoken announcements of moves are the digital equivalent of the traditional "Building nine" calls.
- **Layout:** Thorium offers "Strict Grid and Random Scatter" table layouts, with grid as the default on phones. [S60] A Pinkney reviewer complains there is no "landscape rotated layout". [S20]
- **Older players are a core audience:** "I'm 71 and learned to play Casino when I was 18. It is easy for me to use the app" (Zol's). [S19] Many reviews cite grandparents. [S19][S20][S26]

---

## 11. Announcements and talk at the table, as surfaced by these sources
(Collected here because several are already implemented, or missed, as UI. Other research files may cover table talk in more depth.)
- **Building calls:**
  - "announcing the total value; 'Nine'"; "announcing the build as 'Two Sevens'"; "'two Eights,' called" (partner builds). [S1, pp. 443–445]
  - "the player must declare the value he is building… 'Building Nines'". [S10]
  - "Building 7" (BGA quick rules) [S31]; "announce 'building 8'" (Malungisa) [S57]; "'building 9 for partner'". [S2]
- **"Last":** "The dealer must announce 'last' when dealing the last cards." [S2] "When the dealer deals the sixth and last deal… he should announce 'Last'." [S10]
  - SpiteNET plays a sound instead: "A sound is played after the last deal so that everyone is aware that it is the last hand of the round." [S34]
  - Players notice when the cue disappears: "Why has it stopped calling cards? It's no longer notifying it being the last hand. please fix." (Pinkney, 2016, 13👍) [S20]
- **"Count out" / claiming the win** [S1][S10]; **"clear"** for a sweep [S2]; ***tabbe*** (Swedish) and ***mökki*** (Finnish, "hut") for a sweep. [S3][S8]
- **Slang in reviews:**
  - "casino a.k.a sweepy" (G4A, 2014) [S21]
  - "11-0 being called a body" (Pinkney, 2014) [S20]
  - "You must shout that you just CASINOed your opponent" (Zol's, 2023) [S19]
  - Origin stories: "this is an old jailhouse game i learned in 90s" [S20]; "in the U.S. mostly the only ppl who know how to play learned in prison" [S20]; "I learned that game in DRP" [S21]; "classic commercial fisherman passed time". [S26]
- **South African vocabulary:**
  - "drift" (play a card that could capture into a build instead) [S4][S22][S48]
  - "chow" (capture) [S4]
  - "shiya" ("a partner's 'leave it to me' call"; implemented as a button and a 3-second window) [S56][S22]
  - "preg" (raise a build), "dig" (take an opponent's pile-top into a build), "top/augment" [S56]
  - "floor cards", "home pile" [S22]
  - "kasi", "ekasi", "Mzansi" (township and South Africa identity) [S22]
- **Chkobba:** "el sab3a el 7aya" (Tunisian Arabic in Latin letters for the prized 7 of diamonds), from a review complaining that an "unskippable ad while your round is played Automatically" made the player lose it. [S42]
- **Basra:** the Egyptian app names the game "Al-Komi" or "Ash El Walad"; the 7♦ ("komy") is a wild card. [S42]

---

## 12. Design lessons for a new Cassino video game (each with its evidence)

1. **Every build gets a visible value label, an owner marker, and a "locked/raisable" state.**
   - Shipped games put the number on the pile (Psellos, SpiteNET), and SpiteNET treated missing numbers as a bug worth a version fix. [S33][S34]
   - The physical rules distinguish raisable single builds from fixed multiple builds ("Two Sevens… cannot be increased"). [S1, p. 444][S62][S34]
   - Southern African rules make ownership a formal concept. [S4][S56]
   - Players still say "can't change a stack into a number". [S19]
   - Suggestion: show the label "8", a coloured owner rim, and a lock glyph on compound builds.

2. **Never infer intent between capture, build and trail. Let the player state it, and show only legal options.**
   - Implicit inference produced the most bitter control complaints ("you cannot know whether the app will build or take", "the game automatically TAKES"). [S20]
   - Psellos's context-sensitive buttons, SpiteNET's staged card with End Turn, and Malungisa's legal-value picker solve this. [S33][S34][S57]
   - When several captures are possible, list them, as Lisitso does. [S40]

3. **Give the human exactly the move generator the AI uses, and say *why* a move is illegal.**
   - "The AI can do X but I can't" is the most specific recurring complaint across Zol's, Pinkney, G4A and Cassino!. [S19][S20][S21][S26]
   - SpiteNET's referee explains each rejected move. [S34] The Cassino! developer had to explain the rule in reply to a review. [S26]
   - An in-game "why not?" tooltip would answer these complaints before they become 1★ reviews.

4. **Build fairness transparency in from day one.**
   - Rigging accusations dominate negative reviews for Cassino, Scopa, Basra and Pasur apps. [S19][S21][S26][S40][S42]
   - Proven counter-measures: post-game replay with all hands revealed [S27]; a "same deal for everyone" daily mode [S19][S28]; an in-app explainer on streakiness [S36]; difficulty defined by card memory, not information or luck [S42]; an explicit "no rubber-banding" promise. [S48]
   - Use a fair-information AI (ISMCTS-style) rather than one that peeks. [S49]
   - Consider showing the shuffle seed on the replay screen. (Suggestion, not evidenced.)

5. **Show score categories live, with clinch thresholds, and keep the 11-point checksum.**
   - Physical players run mental tallies and claim at 7 spades and 27 cards. [S1][S2] Psellos shows live card and spade counts. [S33]
   - The 11-point invariant would have caught Pinkney's ">11 per round" bug. [S1][S20]
   - End every hand with a category-by-category breakdown, the most requested missing feature. [S20][S34][S44]
   - Never let ads cover it. [S40]

6. **Make "count-out" and claiming a feature, not a hidden rule.**
   - Twenty-one-point Cassino historically ends on a correct claim, and a wrong claim loses. [S1][S7] Finnish Kasino ends mid-hand when aces and Kasinos are captured. [S3]
   - An optional "Claim!" button (or auto-claim) with the traditional count-out order gives these endings their drama. [S1][S10]

7. **Use the face-up sweep card as the sweep icon.**
   - Across Cassino, Kasino, Scopa and Escoba, players mark a sweep by leaving one card face up or crosswise in the capture pile. [S1][S2][S3][S5][S8][S36]
   - A rotated card in the player's pile (cf. cardgames.io's glowing trick) reads instantly to veterans. [S36]
   - Keep the celebration short; a long "Scopa" banner was criticised for freezing play. [S40]

8. **Let players control pace, and always make the opponent's last move reviewable.**
   - "Too fast to see what the computer took" and "too slow, no way to speed up" are both common. [S19][S20][S21]
   - Fixes: speed slider [S27][S40][S43]; per-seat play log [S60]; a "Last Turn" panel [S54]; the AI pre-selecting its capture before taking it [S33]; the "picture-in-picture of what the computer picked up" a user asked for. [S20]

9. **Treat the rules as a configurable family, with named presets.**
   - Players hold strong and divergent household rules on target score, point values, sweeps, Royal values, deal size, identical-card builds and multiple builds. [S19][S20][S26][S22]
   - Successful apps expose a variation builder or presets (Dokken; Pocket Cassino "tailored to your region"; Psellos). [S27][S25][S33]
   - Ship "Classic (Hoyle/Foster)", "Royal", "Spade (61 on a cribbage board)", "Nordic/Finnish to 16", and "South African 40-card" presets. Rules sources: [S1][S3][S4][S7][S8]

10. **Turn the traditional announcements into UI and audio cues.**
    - Announce build values ("Building nine", "Two Sevens") and the dealer's "Last". [S1][S2][S10]
    - SpiteNET used a sound for "last" [S34], and players noticed when an app stopped "calling" the last hand. [S20]
    - Spoken move announcements also serve accessibility (TalkBack/VoiceOver in Scopa apps). [S40][S41]

11. **Design for phones and for older eyes.**
    - Big indices, a large-pip deck option, grid layout on phones, generous touch targets and a landscape option. [S60][S34][S28][S19][S20]
    - Older players are a core audience. [S19][S26]

12. **Support the social modes people actually want.**
    - 1v1, 3-handed and 4-handed partnerships [S21][S19][S26]; pass-and-play [S28][S54]; remote friends and family [S19][S26][S45]; asynchronous turns with reminders [S45].
    - Online ranked play needs abandonment handling that does not punish the partner left behind. [S22]
    - Format changes such as forced one-hand random matches can alienate a core base. [S40]
    - Offer canned table-talk richer than a few phrases, plus blocking. [S22][S40]

13. **Survive interruptions.**
    - Saving and resuming is expected: "if you leave the screen for anything a text or phone call the game is lost?" [S20]; "I switched out of the app… and it gave my capture to the computer". [S19]
    - Pasur11 advertises "Resume ability". [S43]

14. **Monetise without touching the table.**
    - Short ads only between games were praised ("very, very minimal adds… 1 every 3 or 4 games"). [S19]
    - Ads that pop up mid-turn, auto-play your move, or hide results were condemned. [S40][S42]
    - Several new entrants lead with "No ads". [S24][S28]

15. **Solve the name problem.**
    - Store searches for "cassino" and "casino card game" return mostly slot machines. [S30][S52]
    - Dokken's newest listing opens with "Despite the name, it has nothing to do with gambling or real-money casinos". [S27]
    - Use "Cassino" with the card-game qualifier everywhere, and consider regional names (Kasino, "Kasi Cassino") in store metadata. [S22][S24]

16. **Teach building explicitly, and coach in context.**
    - Building is the most confusing part ("doesnt tell you how to build or stack"). [S20]
    - Good patterns: Suggest with highlighted alternatives [S33]; a coach that explains both your move and the AI's [S28]; a hand-scripted tutorial [S27]; practice mode with undo [S37]. Undo is a common request. [S19][S20]

17. **There is room for roguelike and progression wrappers around the classic core.**
    - Kasino's Trials/dungeon mode and the Scopa Sweep roguelike suggest a current trend toward rules-mutating runs on top of fishing games. [S24][S37]
    - The 1911 word-casino patent and a 2020 organic-chemistry "Cassino" teaching game show how far the build/capture core can be re-skinned. [S13][S65]

18. **Respect the cultures that keep the game alive.**
    - The largest Cassino audience growth found is South African ("Great online Mzansi card game that is played ekasi"; "the most beloved card game from South African townships"). [S22][S58]
    - Finnish and Nordic players are the other core group, with university course projects and a dedicated Kasino app. [S53][S24]
    - Americans' attachment is mostly nostalgic and family-based. [S19][S26][S50]
    - Local vocabulary (shiya, drift, mökki) belongs in the UI. [S22][S56][S8]

---

## Gaps / leads not followed
- **No Cassino-specific physical scorer found.** No dedicated score pad, peg board or "cassino counter" turned up. Patent search was limited by Google Patents rate limits after the first queries; USPTO full-text (PPUBS) and the CPC class A63F 1/18 (score counters for card games) were not systematically browsed. Lead: search A63F 1/18 and A63F 2001/0458 for pre-1950 card-game counters that mention cassino in the claims.
- **Product catalogues and collectors not reached.** US Playing Card Co. catalogues and *Official Rules of Card Games* scans on archive.org were access-restricted (401/500). eBay and BoardGameGeek pages were blocked (403), so vintage boxed Cassino sets and BGG publisher/version data are unverified. The Strong museum collection search was not reachable through search results.
- **App Store reviews were thin.** The iTunes RSS review feeds returned no entries, so App Store reviews come only from the six "most helpful" reviews on the Cassino! web page; Cassino Royale and Pocket Cassino have too few reviews to quote.
- **Android data omissions.** Zol's in-app UI (exact build visuals) and G4A's UI were not screen-inspected; claims rely on store text and reviews. Zol's lists an Amazon Appstore version, and BlueStacks/Google Play PC builds exist (seen in search results, not analysed).
- **Microsoft Store "Casino" listing (9WZDNCRDN5VH)** could not be read (only the page title loaded).
- **Social and video channels not followed.** YouTube tutorials and gameplay videos were not examined. Reddit discussions were not surfaced by search.
- **Relatives only briefly covered.** Scopa, Basra, Chkobba and Pasur apps were surveyed mainly through descriptions and top reviews in English and Italian. Arabic, Persian and Greek reviews were not translated in depth (one Persian review only summarised).
- **Ludii** search returned no Cassino ruleset; this was not confirmed in Ludii's own game list.

---

## Sources
- [S1] *Foster's Complete Hoyle* (R. F. Foster), 1897 ed., "Cassino" pp. 441–448 (scoring, building, "Two Sevens", sweeps marked face up, irregularities, "Showing", Twenty-One Point, Royal, Spade Cassino). archive.org id `fosterscomplete00fostgoog`, full text https://archive.org/download/fosterscomplete00fostgoog/fosterscomplete00fostgoog_djvu.txt
- [S2] John McLeod, "Casino", pagat.com (last updated 6 May 2026): https://www.pagat.com/fishing/casino.html (fetched via /fishing/cassino.html). Sections: Deal ("last"), Sweeps ("clear"), Scoring variants (11/50 points, CT/NY 3-2-1, count as earned with 7/27 thresholds), Software.
- [S3] John McLeod, "Nordic Casino", pagat.com: https://www.pagat.com/fishing/nordic_casino.html (Swedish *tabbe* marker; Finnish Kasino scoring, *mökki*, 16 points).
- [S4] John McLeod (with J. Dushoff, F. Asmal), "African Casino", pagat.com: https://www.pagat.com/fishing/african_casino.html (face-up capture piles, build owners, "drifting", "chow").
- [S5] John McLeod, "Scopa", pagat.com: https://www.pagat.com/fishing/scopa.html (scopa marked face up; software list incl. Thanos, Net.Scopa/Net.Chkobba).
- [S6] John McLeod, "Pâsur", pagat.com: https://www.pagat.com/fishing/pasur.html (Sur marker and cancellation; 50-point rule; playpasur.com link).
- [S7] Wikipedia, "Cassino (card game)", raw wikitext fetched 2026-10-02: https://en.wikipedia.org/w/index.php?title=Cassino_(card_game)&action=raw (lurch; 21-point Cassino from "Trumps" 1880 p. 181; Spade Cassino on a cribbage board from Foster 1897 p. 448).
- [S8] Wikipedia (fi), "Kasino (korttipeli)", raw: https://fi.wikipedia.org/w/index.php?title=Kasino_(korttipeli)&action=raw (mökki marked crosswise, non-point-card tip, "jää pakkaan" carry-over, exact-16 variant).
- [S9] Mikko Saari, "Kasino", Korttipeliopas.fi: https://korttipeliopas.fi/kasino
- [S10] "How To Play Cassino", CatsAtCards: https://www.catsatcards.com/Games/Cassino.html (fetched via WebFetch; "Building Nines", "Last", "count out", scoring order).
- [S11] Winning Moves Inc., *SCOPA™ The Great Italian Card Game* rules sheet (© 2011): https://winning-moves.com/images/scopa%20rulesv2.pdf (contents incl. "pad of score sheets", "2 scoring cards"; sample scoresheet with "s").
- [S12] US Patent 599,767, Richard G. Clarke, "Game-Pieces" (filed 3 Jun 1897, issued 1 Mar 1898). PDF https://patentimages.storage.googleapis.com/pdfs/US599767.pdf; Google Patents page US599767A.
- [S13] US Patent 1,012,574, Emma F. Adams, "Playing-Cards" (filed 13 Dec 1910, issued 26 Dec 1911). https://patentimages.storage.googleapis.com/pdfs/US1012574.pdf
- [S14] US Patent 745,879, Catherine C. Meriwether, "Playing-Cards" (filed 9 Oct 1903, issued 1 Dec 1903). https://patentimages.storage.googleapis.com/pdfs/US745879.pdf
- [S15] US Patent 1,743,613, Isadore L. Lesavoy, "Playing Cards" (filed 4 Jan 1929, issued 14 Jan 1930). https://patentimages.storage.googleapis.com/pdfs/US1743613.pdf
- [S16] Google Patents query results (xhr endpoint) for q=cassino, cassino+card, cassino+counter, cassino+score, "little casino", casino+"big casino" before 1970, run 2026-10-02 (https://patents.google.com/?q=cassino); full texts of US 2006/0249907 A1 (Wong & Anderson, "East-West Cassino") and US 8,511,687 B2 (Kennedy) checked via https://patentimages.storage.googleapis.com/pdfs/US20060249907.pdf and …/US8511687.pdf: gambling patents, not relevant.
- [S17] Antique Card and Table Games (dealer), "Card Games 1801–1850": https://antiquecardandtablegames.co.uk/card-games-1801-1850/ ("1820 – The Musical Game of Pope Joan, Cassino & Commerce", Chappell & Co).
- [S18] V&A Collections API search: https://api.vam.ac.uk/v2/objects/search?q=cassino ; Smithsonian Open Access API search: https://api.si.edu/openaccess/api/v1.0/search?q=cassino+game (2026-10-02).
- [S19] Google Play, "Cassino Card Game" (Zol's Apps): https://play.google.com/store/apps/details?id=com.zolsapps.cassino. Listing, metadata and ~288 reviews retrieved via google-play-scraper 2026-10-02 (quoted reviews dated as shown).
- [S20] Google Play, "Casino Card Game" (Paris Pinkney): https://play.google.com/store/apps/details?id=casino.game. Listing and ~287 reviews, same method.
- [S21] Google Play, "G4A: Cassino" (Games4All): https://play.google.com/store/apps/details?id=org.games4all.android.games.cassino.prod. Listing and ~96 reviews.
- [S22] Google Play, "Cassino Card Game SA / South Africa" (DZ Code): https://play.google.com/store/apps/details?id=com.dzsoftware.topten. Listing and ~94 reviews; ZA-store rating from search with country=za.
- [S23] Google Play, "Cassino Card Game Classic" (DZ Code): https://play.google.com/store/apps/details?id=com.dzsoftware.cassinoclassic
- [S24] Google Play, "Kasino – Cassino Card Game" (O-P Card House): https://play.google.com/store/apps/details?id=com.opcardhouse.kasino ; developer site "Kasino of The North": http://www.opsahkopalvelut.fi/opcardhouse/
- [S25] Pocket Cassino: App Store https://apps.apple.com/app/pocket-cassino/id6475610484 (iTunes lookup API); Google Play https://play.google.com/store/apps/details?id=com.pocketofgames.pocketcassino
- [S26] App Store, "Cassino!" (Michael Dokken), id527702079: iTunes lookup API https://itunes.apple.com/lookup?id=527702079 and ratings/reviews page https://apps.apple.com/us/app/id527702079?see-all=reviews (reviews 2016–2025 with developer responses).
- [S27] Google Play, "Cassino!" (Michael Dokken): https://play.google.com/store/apps/details?id=com.mkdokken.cassino (description: variations, Insane, Replay mode, per-variation stats, gambling disclaimer).
- [S28] App Store, "Cassino Royale" (PikeSquare, LLC), id6780693107: https://itunes.apple.com/lookup?id=6780693107
- [S29] (reserved; not used)
- [S30] iTunes Search API results for "cassino", "casino card game", "kasino", "scopa", "pasur", "basra" (US store, 2026-10-02): https://itunes.apple.com/search?term=cassino&entity=software
- [S31] Board Game Arena, Cassino game panel: https://en.boardgamearena.com/gamepanel?game=cassino ; BGA wiki quick rules: https://en.doc.boardgamearena.com/Gamehelpcassino
- [S32] CardzMania, "Cassino": https://www.cardzmania.com/Cassino
- [S33] Psellos, "Cassino in the Browser": https://psellos.com/cassino/ and "Cassino Interface": https://psellos.com/cassino/touch-interface.html (fetched via WebFetch).
- [S34] SpiteNET, *Cassino by SpiteNET*: http://www.spitenet.com/Cassino/ , how-to-play http://www.spitenet.com/Cassino/play.htm , screenshots http://www.spitenet.com/Cassino/shots.htm , about http://www.spitenet.com/Cassino/about.htm
- [S35] Thanos Card Games: https://thanoscardgames.jimdofree.com/
- [S36] CardGames.io, "Escoba" (rules and error-report text): https://cardgames.io/escoba/ ; 404 checks for https://cardgames.io/casino/ and /cassino/.
- [S37] Steam store search API (https://store.steampowered.com/api/storesearch/?term=cassino …) and appdetails/reviews for *Scopa Sweep* (app 5048870) and *Escoba* (app 3866030), 2026-10-02.
- [S38] Wikipedia raw wikitext of "Hoyle Card Games", "Clubhouse Games", "Clubhouse Games: 51 Worldwide Classics", "Microsoft Entertainment Pack" (no Cassino/Casino card-game mention; 2026-10-02).
- [S39] (reserved; not used)
- [S40] Google Play Scopa-family listings and reviews (google-play-scraper; Italian store for the first four):
  - WhatWapp "Scopa: la Sfida": https://play.google.com/store/apps/details?id=com.WhatWapp.Scopa
  - Escogitare "Scopa!": …?id=com.escogitare.scopa
  - Spaghetti Interactive "Scopa Più": …?id=it.spaghettiinteractive.scopapiu
  - Digitalmoka "Scopa originale Dal Negro": …?id=com.digitalmoka.scopadalnegro
  - Lisitso "Scopa (Broom)": …?id=com.application.game.scopa
  - Escogitare "Scopa 15": …?id=com.escogitare.scopa15
- [S41] App Store, "Scopa!" (Sonya Marcarelli) id455507367 and "Scopa Pro" (Evocon) id501678276, via https://itunes.apple.com/lookup?id=455507367
- [S42] Google Play listings and reviews:
  - Egyptian Basra v2: https://play.google.com/store/apps/details?id=com.theedarkseraph.egybasra
  - Egyptian Basra – كوتشينه: …?id=eg.kotshena.kotshenamasrya
  - Chkobba Tn: …?id=com.chadli.ChkobbaTn
  - Pasur/Chaharbarg 11 (IcecreamLab): …?id=ir.IcecreamLab.RemasteredCharbarg
  - Xeri+: …?id=com.charisis.xeriplusplus
- [S43] App Store, "Pasur11" (mahmoud amiri), id1329519990: https://itunes.apple.com/lookup?id=1329519990
- [S44] App Store, "Δηλωτή – Diloti Card Game" (Themistoklis Valtinos), id6763237145: https://itunes.apple.com/lookup?id=6763237145
- [S45] playpasur.com: https://playpasur.com/ (via WebFetch).
- [S46] Google Play, "Scopa Scorer" (GiMiSiS Interactive): https://play.google.com/store/apps/details?id=com.gimisis.pointerscopa ; "Scopa Scorer" (Matthew Miner): …?id=name.matthewminer.scopascorer
- [S47] GitHub, nigeleke/scopa (scoring app) README: https://github.com/nigeleke/scopa
- [S48] Google Play, "Cassino Pro: Card Game" (Sizo Develops II): https://play.google.com/store/apps/details?id=com.sizodevelops.sacasino
- [S49] S. Di Palma & P. L. Lanzi, "Traditional Wisdom and Monte Carlo Tree Search Face-to-Face in the Card Game Scopone", *IEEE Transactions on Games*, 2018, doi:10.1109/TG.2018.2834618 (abstract via OpenAlex https://api.openalex.org/works/https://doi.org/10.1109/tg.2018.2834618).
- [S50] Zol's Apps homepage: http://www.zolsapps.com ("I played it with my daughters when they were young…").
- [S51] Pocket of Games, "Pocket Cassino — Rules, Strategy & Download": https://pocketofgames.com/pocket-cassino/
- [S52] Google Play search results (google-play-scraper `search`, US store) for "cassino card game", "casino card game build capture", "kasino", "scopa", "scopone", "pasur", "basra card game", "chkobba", "cassino score keeper", "scopa punteggio segnapunti", 2026-10-02.
- [S53] GitHub repository search API, e.g. https://api.github.com/search/repositories?q=cassino+card+game , q=kasino+card, q=cassino+game+scala, q=scopa, q=basra+card, q=scopone (2026-10-02). Includes repo descriptions for PGHM/kasino, SuneReeh/kasino, tikkanr1/Cassino, jooakar/scalassino etc.
- [S54] GitHub, penkkaa1/Cassino-cpp README: https://github.com/penkkaa1/Cassino-cpp ; penkkaa1/Cassino (description "Project for 'Programming Studio 2' course"): https://github.com/penkkaa1/Cassino
- [S55] GitHub, esst-prog2/casino README ("Homework 2 — Kaszinó"): https://github.com/esst-prog2/casino
- [S56] GitHub, basil-dlamini/sa-cassino-play README: https://github.com/basil-dlamini/sa-cassino-play
- [S57] GitHub, Malungisa-Mndzebele/cassino-card-game README and `src/lib/components/GameBoard.svelte`: https://github.com/Malungisa-Mndzebele/cassino-card-game
- [S58] GitHub, Tebogo60/casino_card_game README: https://github.com/Tebogo60/casino_card_game
- [S59] GitHub, mosa-retha/Cassino-game README: https://github.com/mosa-retha/Cassino-game
- [S60] GitHub, Thorium/Kasino README (Finnish Kasino and Laistokasino; web build https://thorium.github.io/Kasino/): https://github.com/Thorium/Kasino
- [S61] GitHub, RandyNorthrup/american-cassino-releases README: https://github.com/RandyNorthrup/american-cassino-releases
- [S62] GitHub, dkmccandless/cassino README: https://github.com/dkmccandless/cassino
- [S63] GitHub, cbtechny/Cassinito README: https://github.com/cbtechny/Cassinito
- [S64] GitHub, k-Constable/cassino_project README: https://github.com/k-Constable/cassino_project
- [S65] P. T. Bell, B. A. Martinez-Ortega, A. Birkenfeld, "Organic Chemistry I Cassino: A Card Game for Learning Functional Group Transformations…", *J. Chem. Educ.* 2020, doi:10.1021/acs.jchemed.9b00995 (abstract via OpenAlex). [Supplementary: an educational re-skin of Cassino, cf. lesson 17.]
