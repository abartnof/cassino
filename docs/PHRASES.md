# What the table says

Every phrase the dialogue boxes say, each in the ways it is said, so
that nothing is said the same way twice running. Generated from the
bank in `web3d/tools/phrases.py`; edit the bank, not this file. The
source IDs in brackets are the literature review's
(`cassino-lit-review.md`, Appendix B).

Sources:

- **D**: Dick, The American Hoyle (1866, 1867): the totals spoken as a build grows, "Seven." ... "Nine." ... "Ten.", and the plural for a call [03-S14][03-S15]
- **Dk**: Dick's rewritten American Hoyle (1894): Royal's "Knave eleven, the Queen twelve, and the King thirteen" [03-S22]
- **Tw**: Townsend (1891): "I build seven", a raise as "I build nine", "I call sixes" [03-S20]
- **F**: Foster's Hoyles (1897-1914): "Nine", "Ten", "Two Sevens"; Royal's "Jack is worth 11, the Queen 12, and the King 13", the ace "14 or 1 at the option of the holder" (1907); "Taking In"; the last trick; "claim the game" [03-S31][03-S28]
- **Us**: the United States Playing Card Company's rules (1898): Royal's aces "either ones or fourteens, as the player may elect" [03-S24]
- **St**: the Standard Hoyle (1904): sweeps "should be scored, as there is fine play made in the scoring of them" [03-S25]
- **H**: the mid-century Hoyles (1945-1952): "Building eight", "Building sevens", the dealer's announcement of the last cards, "Sweeps do not count" [03-S35][03-S36]
- **Lo**: Long's Short Rules (1792), the first: "The Majority of the Cards", "The Majority of the Spades", a player who "clears the Board", "take up as many as you can with one Card" [03-S1]
- **Po**: the mock-heroic poem Casino (1793): "the Great Casino nam'd", and the deuce of spades, "Casino's younger Brother" [04-S21]
- **P**: pagat.com, the modern rules: "building 5", "last", a "clear", "cash", the Good Ten and the Good Two [02-S1]
- **M**: the modern rules on the web: "calling 5", "calling 8" [05-S77][05-S78]
- **B**: BoardGameGeek's players on sweeps: "we play with them every single time"; "it's just the luck of the deal" [05-S74]
- **L**: Jack London's players (1912): "Do you count sweeps?" "Certainly not." "Low deals." "I'll make 'cards'" [04-S28]
- **Ar**: Ardmore's novel To Love Is to Listen (1967): at Big Casino, a player "screamed the word, 'Luck!'" [04-S82]
- **Fe**: Feydeau, in English translation: the count chanted, "Cards... Spades... Ten of diamonds...", "Deuce... Aces...", and "Clean sweep!" [04-S159]
- **N**: the New York Dispatch's answers column (1877-1881): a build "calling 'seven'" or "calls it six", "sevens", "fives all", "I have three points, and am out" [04-S155][04-S130]
- **Sw**: the Swedish game's calls, in translation: "bygger till knekt" (building to jack), "sistan" (the last one), "sista given" (last deal), "storan" and "lillan" (the big one, the little one) [10-S24][10-S25]; two players in Finland, "Nu har jag stora kasino", "och jag har lilla" (now I have Big Casino; and I have Little) [10-S13]
- **Fi**: the Finnish game, in translation: the call "rakennan ässälle" (I'm building for the ace) [10-S1]; a big capture, a "kahmaisu" (a grab) [10-S8]
- **Hu**: Tandori's Hungarian count, in translation: "Card majority! Spade majority! big c., little c., the four aces!" [10-S56]
- **Ru**: the Russian rules, in translation: a sweep is "to sweep clean" [10-S57]
- **Ge**: pagat's German edition: the dealer's warning, "Letzte Runde" (last round), in translation [02-S29]
- **Do**: the Dominican custom of pointing out the cards an opponent left behind (dejado) [02-S3]; the words are ours
- **T**: the table's own

| Group | Said | Source |
|---|---|---|
| `sweeps-ask` | Do you count sweeps? | L |
|  | Sweeps count? | T |
|  | Are we counting sweeps? | T |
|  | Shall we count sweeps? | T |
|  | Sweeps, or no sweeps? | T |
| `sweeps-yes` | We count them. | T |
|  | Of course. | T |
|  | Every one. | T |
|  | Every single time. | B |
|  | Yes, a point each. | T |
|  | They should be scored. | St |
| `sweeps-no` | Certainly not. | L |
|  | No sweeps. | T |
|  | Not this time. | T |
|  | Sweeps don't count. | H |
|  | No. They're the luck of the deal. | B |
|  | We'll leave them out. | T |
| `royal` | Royal, then: the court cards count. | T |
|  | Jack eleven, queen twelve, king thirteen. | F |
|  | Knave eleven, queen twelve, king thirteen. | Dk |
|  | Royal cassino. The court cards build. | T |
|  | We'll play royal. | T |
| `aces-14` | And an ace takes as one or fourteen. | T |
|  | Aces one or fourteen. | T |
|  | An ace is one or fourteen, as you like. | T |
|  | The ace is fourteen or one, at your option. | F |
|  | Aces one or fourteen, as the player elects. | Us |
| `low-deals` | Low deals. | L |
|  | Low card deals. | T |
|  | Cut. Low deals. | T |
|  | Cut for the deal: low deals. | T |
|  | Ace is low. Low deals. | T |
|  | Shall we cut? Low deals. | T |
| `my-deal` | My deal. | T |
|  | I deal. | T |
|  | I'll deal. | T |
|  | Low card. My deal. | T |
|  | The deal is mine. | T |
|  | Mine is lower. I deal. | T |
| `your-deal` | Your deal. | T |
|  | You deal. | T |
|  | Over to you. Your deal. | T |
|  | Low card. Your deal. | T |
|  | The deal is yours. | T |
|  | Yours is lower. Your deal. | T |
| `last` | Last. | P |
|  | Last cards. | H |
|  | The last cards. | H |
|  | Last deal. | Sw |
|  | The last one. | Sw |
|  | Last round. | Ge |
|  | The last of the pack. | T |
| `build-2` | Building two. | H |
|  | Two. | F |
|  | I build two. | Tw |
|  | Call it two. | N |
|  | Building to two. | Sw |
|  | Building for the two. | Fi |
| `build-3` | Building three. | H |
|  | Three. | F |
|  | I build three. | Tw |
|  | Call it three. | N |
|  | Building to three. | Sw |
|  | Building for the three. | Fi |
| `build-4` | Building four. | H |
|  | Four. | F |
|  | I build four. | Tw |
|  | Call it four. | N |
|  | Building to four. | Sw |
|  | Building for the four. | Fi |
| `build-5` | Building five. | H |
|  | Five. | F |
|  | I build five. | Tw |
|  | Call it five. | N |
|  | Building to five. | Sw |
|  | Building for the five. | Fi |
| `build-6` | Building six. | H |
|  | Six. | F |
|  | I build six. | Tw |
|  | Call it six. | N |
|  | Building to six. | Sw |
|  | Building for the six. | Fi |
| `build-7` | Building seven. | H |
|  | Seven. | F |
|  | I build seven. | Tw |
|  | Call it seven. | N |
|  | Building to seven. | Sw |
|  | Building for the seven. | Fi |
| `build-8` | Building eight. | H |
|  | Eight. | F |
|  | I build eight. | Tw |
|  | Call it eight. | N |
|  | Building to eight. | Sw |
|  | Building for the eight. | Fi |
| `build-9` | Building nine. | H |
|  | Nine. | F |
|  | I build nine. | Tw |
|  | Call it nine. | N |
|  | Building to nine. | Sw |
|  | Building for the nine. | Fi |
| `build-10` | Building ten. | H |
|  | Ten. | F |
|  | I build ten. | Tw |
|  | Call it ten. | N |
|  | Building to ten. | Sw |
|  | Building for the ten. | Fi |
| `build-11` | Building eleven. | H |
|  | Eleven. | F |
|  | I build eleven. | Tw |
|  | Call it eleven. | N |
|  | Building to eleven. | Sw |
|  | Building for the jack. | Fi |
| `build-12` | Building twelve. | H |
|  | Twelve. | F |
|  | I build twelve. | Tw |
|  | Call it twelve. | N |
|  | Building to twelve. | Sw |
|  | Building for the queen. | Fi |
| `build-13` | Building thirteen. | H |
|  | Thirteen. | F |
|  | I build thirteen. | Tw |
|  | Call it thirteen. | N |
|  | Building to thirteen. | Sw |
|  | Building for the king. | Fi |
| `build-14` | Building fourteen. | H |
|  | Fourteen. | F |
|  | I build fourteen. | Tw |
|  | Call it fourteen. | N |
|  | Building to fourteen. | Sw |
|  | Building for the ace. | Fi |
| `builds-2` | Building twos. | H |
|  | Twos. | D |
|  | I call twos. | Tw |
|  | Twos all. | N |
|  | Calling twos. | M |
|  | Twos, locked. | T |
| `builds-3` | Building threes. | H |
|  | Threes. | D |
|  | I call threes. | Tw |
|  | Threes all. | N |
|  | Calling threes. | M |
|  | Threes, locked. | T |
| `builds-4` | Building fours. | H |
|  | Fours. | D |
|  | I call fours. | Tw |
|  | Fours all. | N |
|  | Calling fours. | M |
|  | Fours, locked. | T |
| `builds-5` | Building fives. | H |
|  | Fives. | D |
|  | I call fives. | Tw |
|  | Fives all. | N |
|  | Calling fives. | M |
|  | Fives, locked. | T |
| `builds-6` | Building sixes. | H |
|  | Sixes. | D |
|  | I call sixes. | Tw |
|  | Sixes all. | N |
|  | Calling sixes. | M |
|  | Sixes, locked. | T |
| `builds-7` | Building sevens. | H |
|  | Sevens. | D |
|  | I call sevens. | Tw |
|  | Sevens all. | N |
|  | Calling sevens. | M |
|  | Sevens, locked. | T |
| `builds-8` | Building eights. | H |
|  | Eights. | D |
|  | I call eights. | Tw |
|  | Eights all. | N |
|  | Calling eights. | M |
|  | Eights, locked. | T |
| `builds-9` | Building nines. | H |
|  | Nines. | D |
|  | I call nines. | Tw |
|  | Nines all. | N |
|  | Calling nines. | M |
|  | Nines, locked. | T |
| `builds-10` | Building tens. | H |
|  | Tens. | D |
|  | I call tens. | Tw |
|  | Tens all. | N |
|  | Calling tens. | M |
|  | Tens, locked. | T |
| `builds-11` | Building elevens. | H |
|  | Elevens. | D |
|  | I call elevens. | Tw |
|  | Elevens all. | N |
|  | Calling elevens. | M |
|  | Elevens, locked. | T |
| `builds-12` | Building twelves. | H |
|  | Twelves. | D |
|  | I call twelves. | Tw |
|  | Twelves all. | N |
|  | Calling twelves. | M |
|  | Twelves, locked. | T |
| `builds-13` | Building thirteens. | H |
|  | Thirteens. | D |
|  | I call thirteens. | Tw |
|  | Thirteens all. | N |
|  | Calling thirteens. | M |
|  | Thirteens, locked. | T |
| `builds-14` | Building fourteens. | H |
|  | Fourteens. | D |
|  | I call fourteens. | Tw |
|  | Fourteens all. | N |
|  | Calling fourteens. | M |
|  | Fourteens, locked. | T |
| `raise-2` | Two. | D |
|  | Building two. | P |
|  | Make it two. | T |
|  | I build two. | Tw |
|  | Call it two. | N |
|  | Raise it to two. | T |
|  | Up to two. | T |
| `raise-3` | Three. | D |
|  | Building three. | P |
|  | Make it three. | T |
|  | I build three. | Tw |
|  | Call it three. | N |
|  | Raise it to three. | T |
|  | Up to three. | T |
| `raise-4` | Four. | D |
|  | Building four. | P |
|  | Make it four. | T |
|  | I build four. | Tw |
|  | Call it four. | N |
|  | Raise it to four. | T |
|  | Up to four. | T |
| `raise-5` | Five. | D |
|  | Building five. | P |
|  | Make it five. | T |
|  | I build five. | Tw |
|  | Call it five. | N |
|  | Raise it to five. | T |
|  | Up to five. | T |
| `raise-6` | Six. | D |
|  | Building six. | P |
|  | Make it six. | T |
|  | I build six. | Tw |
|  | Call it six. | N |
|  | Raise it to six. | T |
|  | Up to six. | T |
| `raise-7` | Seven. | D |
|  | Building seven. | P |
|  | Make it seven. | T |
|  | I build seven. | Tw |
|  | Call it seven. | N |
|  | Raise it to seven. | T |
|  | Up to seven. | T |
| `raise-8` | Eight. | D |
|  | Building eight. | P |
|  | Make it eight. | T |
|  | I build eight. | Tw |
|  | Call it eight. | N |
|  | Raise it to eight. | T |
|  | Up to eight. | T |
| `raise-9` | Nine. | D |
|  | Building nine. | P |
|  | Make it nine. | T |
|  | I build nine. | Tw |
|  | Call it nine. | N |
|  | Raise it to nine. | T |
|  | Up to nine. | T |
| `raise-10` | Ten. | D |
|  | Building ten. | P |
|  | Make it ten. | T |
|  | I build ten. | Tw |
|  | Call it ten. | N |
|  | Raise it to ten. | T |
|  | Up to ten. | T |
| `raise-11` | Eleven. | D |
|  | Building eleven. | P |
|  | Make it eleven. | T |
|  | I build eleven. | Tw |
|  | Call it eleven. | N |
|  | Raise it to eleven. | T |
|  | Up to eleven. | T |
| `raise-12` | Twelve. | D |
|  | Building twelve. | P |
|  | Make it twelve. | T |
|  | I build twelve. | Tw |
|  | Call it twelve. | N |
|  | Raise it to twelve. | T |
|  | Up to twelve. | T |
| `raise-13` | Thirteen. | D |
|  | Building thirteen. | P |
|  | Make it thirteen. | T |
|  | I build thirteen. | Tw |
|  | Call it thirteen. | N |
|  | Raise it to thirteen. | T |
|  | Up to thirteen. | T |
| `raise-14` | Fourteen. | D |
|  | Building fourteen. | P |
|  | Make it fourteen. | T |
|  | I build fourteen. | Tw |
|  | Call it fourteen. | N |
|  | Raise it to fourteen. | T |
|  | Up to fourteen. | T |
| `sweep` | Clear! | P |
|  | Clean sweep! | Fe |
|  | Sweep! | T |
|  | That clears it. | T |
|  | That clears the board. | Lo |
|  | Swept clean! | Ru |
|  | The table's clear. | T |
| `cash` | Cash. | P |
|  | Cash! | T |
|  | An ace for an ace. | T |
|  | Ace takes ace. | T |
|  | That's cash. | T |
|  | Ace on ace: cash. | T |
| `take-big-casino` | Now I have Big Casino. | Sw |
|  | Luck! Big Casino. | Ar |
|  | The big one's mine. | Sw |
|  | I'll have the good ten. | P |
|  | That's two points. | T |
|  | Big Casino comes to me. | T |
| `take-little-casino` | I have Little Casino. | Sw |
|  | The little one's mine. | Sw |
|  | I'll have the good two. | P |
|  | Little Casino, and a point. | T |
|  | That's a point. | T |
| `take-many` | A good haul. | T |
|  | That's a grab! | Fi |
|  | Taken in, every one. | F |
|  | As many as I can, with one card. | Lo |
|  | In they all come. | T |
|  | Quite a pile. | T |
| `clinch-cards` | That's the cards. | P |
|  | Twenty-seven. The cards are mine. | T |
|  | That's twenty-seven. | T |
|  | I've made cards. | L |
|  | Twenty-seven cards. Three points. | T |
|  | The cards are made. | T |
| `clinch-spades` | Seven spades. | P |
|  | That's the spades. | T |
|  | Seven spades. The point is mine. | T |
|  | Seven. The spades are mine. | T |
|  | I've made spades. | T |
|  | Seven spades, and the point. | T |
| `left-1` | You left the ace. | Do |
|  | The ace was left behind. | Do |
|  | The ace was there for you. | T |
|  | The ace could have come too. | T |
|  | You might have had the ace. | T |
| `left-2` | You left the two. | Do |
|  | The two was left behind. | Do |
|  | The two was there for you. | T |
|  | The two could have come too. | T |
|  | You might have had the two. | T |
| `left-3` | You left the three. | Do |
|  | The three was left behind. | Do |
|  | The three was there for you. | T |
|  | The three could have come too. | T |
|  | You might have had the three. | T |
| `left-4` | You left the four. | Do |
|  | The four was left behind. | Do |
|  | The four was there for you. | T |
|  | The four could have come too. | T |
|  | You might have had the four. | T |
| `left-5` | You left the five. | Do |
|  | The five was left behind. | Do |
|  | The five was there for you. | T |
|  | The five could have come too. | T |
|  | You might have had the five. | T |
| `left-6` | You left the six. | Do |
|  | The six was left behind. | Do |
|  | The six was there for you. | T |
|  | The six could have come too. | T |
|  | You might have had the six. | T |
| `left-7` | You left the seven. | Do |
|  | The seven was left behind. | Do |
|  | The seven was there for you. | T |
|  | The seven could have come too. | T |
|  | You might have had the seven. | T |
| `left-8` | You left the eight. | Do |
|  | The eight was left behind. | Do |
|  | The eight was there for you. | T |
|  | The eight could have come too. | T |
|  | You might have had the eight. | T |
| `left-9` | You left the nine. | Do |
|  | The nine was left behind. | Do |
|  | The nine was there for you. | T |
|  | The nine could have come too. | T |
|  | You might have had the nine. | T |
| `left-10` | You left the ten. | Do |
|  | The ten was left behind. | Do |
|  | The ten was there for you. | T |
|  | The ten could have come too. | T |
|  | You might have had the ten. | T |
| `left-11` | You left the jack. | Do |
|  | The jack was left behind. | Do |
|  | The jack was there for you. | T |
|  | The jack could have come too. | T |
|  | You might have had the jack. | T |
| `left-12` | You left the queen. | Do |
|  | The queen was left behind. | Do |
|  | The queen was there for you. | T |
|  | The queen could have come too. | T |
|  | You might have had the queen. | T |
| `left-13` | You left the king. | Do |
|  | The king was left behind. | Do |
|  | The king was there for you. | T |
|  | The king could have come too. | T |
|  | You might have had the king. | T |
| `left-more` | You left a few there. | Do |
|  | More could have come with it. | T |
|  | There was more for you there. | T |
|  | A few were left behind. | Do |
|  | There were more to take. | T |
| `residue` | And the rest are mine. | T |
|  | The last cards come to me. | T |
|  | I'll take what's left. | T |
|  | The last trick is mine. | F |
|  | Last to take, so the rest are mine. | T |
|  | Those come to me. | T |
| `count-cards` | Cards. | Fe |
|  | Most cards. | T |
|  | The cards. | T |
|  | Card majority! | Hu |
|  | The majority of the cards. | Lo |
|  | Three for cards. | T |
| `count-spades` | Spades. | Fe |
|  | Most spades. | T |
|  | The spades. | T |
|  | Spade majority! | Hu |
|  | The majority of the spades. | Lo |
|  | One for spades. | T |
| `count-big-casino` | Big Casino. | T |
|  | Ten of diamonds. | Fe |
|  | The big one. | Sw |
|  | Great Casino. | Po |
|  | The good ten. | P |
|  | Two for Big Casino. | T |
| `count-little-casino` | Little Casino. | T |
|  | Deuce. | Fe |
|  | The little one. | Sw |
|  | Casino's younger brother. | Po |
|  | The good two. | P |
|  | One for Little Casino. | T |
| `count-ace-S` | The ace of spades. | T |
|  | Ace of spades. | T |
|  | An ace. | Fe |
|  | And the ace of spades. | T |
|  | One for the ace of spades. | T |
| `count-ace-H` | The ace of hearts. | T |
|  | Ace of hearts. | T |
|  | An ace. | Fe |
|  | And the ace of hearts. | T |
|  | One for the ace of hearts. | T |
| `count-ace-D` | The ace of diamonds. | T |
|  | Ace of diamonds. | T |
|  | An ace. | Fe |
|  | And the ace of diamonds. | T |
|  | One for the ace of diamonds. | T |
| `count-ace-C` | The ace of clubs. | T |
|  | Ace of clubs. | T |
|  | An ace. | Fe |
|  | And the ace of clubs. | T |
|  | One for the ace of clubs. | T |
| `count-sweeps-1` | A sweep. | T |
|  | One sweep. | T |
|  | And a sweep. | T |
|  | One for the sweep. | T |
|  | A sweep, and a point. | T |
| `count-sweeps-2` | Two sweeps. | T |
|  | Sweeps: two. | T |
|  | And two sweeps. | T |
|  | Two for sweeps. | T |
|  | Two sweeps, two points. | T |
| `count-sweeps-3` | Three sweeps. | T |
|  | Sweeps: three. | T |
|  | And three sweeps. | T |
|  | Three for sweeps. | T |
|  | Three sweeps, three points. | T |
| `count-sweeps-4` | Four sweeps. | T |
|  | Sweeps: four. | T |
|  | And four sweeps. | T |
|  | Four for sweeps. | T |
|  | Four sweeps, four points. | T |
| `count-sweeps-5` | Five sweeps. | T |
|  | Sweeps: five. | T |
|  | And five sweeps. | T |
|  | Five for sweeps. | T |
|  | Five sweeps, five points. | T |
| `count-sweeps-6` | Six sweeps. | T |
|  | Sweeps: six. | T |
|  | And six sweeps. | T |
|  | Six for sweeps. | T |
|  | Six sweeps, six points. | T |
| `count-sweeps-7` | Seven sweeps. | T |
|  | Sweeps: seven. | T |
|  | And seven sweeps. | T |
|  | Seven for sweeps. | T |
|  | Seven sweeps, seven points. | T |
| `count-sweeps-8` | Eight sweeps. | T |
|  | Sweeps: eight. | T |
|  | And eight sweeps. | T |
|  | Eight for sweeps. | T |
|  | Eight sweeps, eight points. | T |
| `game-won` | And I am out. | N |
|  | That's game. | T |
|  | Game. Twenty-one. | T |
|  | I claim the game. | F |
|  | I'm out. | N |
|  | Twenty-one, and thank you. | T |
| `good-game` | Good game. | T |
|  | Well played. | T |
|  | Thank you for the game. | T |
|  | Well done. | T |
|  | Nicely played. | T |
|  | A good game. Thank you. | T |
