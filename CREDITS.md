# Credits

The project's own work (the rules engine, the table, the documents) is
released under the **MIT License** (`LICENSE`). Everything listed below is
someone else's and keeps its own licence. Notably the card back is CC BY-SA
3.0. Quotations in the research and the literature review remain their
authors', credited where they appear.

Credit is given where it is due, including where no licence demands it.
**Every third-party asset is recorded here, in the commit that brings it
in**: art, fonts, icons, libraries, build tools, and the design systems we
follow. The table, its art pipeline and much of its code come from the
sibling project piquet, whose credits these follow.

## Card art

### The faces

**"Public domain complete playing card deck"**, by **AustinGabriel64**, from
Wikimedia Commons (uploaded 27 July 2026).
<https://commons.wikimedia.org/wiki/File:Public_domain_complete_playing_card_deck.svg>

Licence: **CC0 1.0 Universal**, a public-domain dedication
(<https://creativecommons.org/publicdomain/zero/1.0/>). No attribution is
required; it is given anyway, gladly. The game uses all 52 cards, rasterised
from the vector original (`web3d/tools/art.py`).

### The back

**"Reverso baraja española"**, by **Germarquezm**, from Wikimedia Commons
(2013). <https://commons.wikimedia.org/wiki/File:Reverso_baraja_espa%C3%B1ola.svg>

It includes elements from **"Baraja española.svg"**, also by Germarquezm
(<https://commons.wikimedia.org/wiki/File:Baraja_espa%C3%B1ola.svg>).

Licence: **CC BY-SA 3.0** (<https://creativecommons.org/licenses/by-sa/3.0/>).
Attribution is **required**, and ShareAlike applies to adaptations.

Our changes: it is rasterised, and re-framed from its Spanish proportions
(about 1:1.53) to the 5:7 of the face cards, as piquet does. That makes the
back the game shows an adaptation, so **that image is itself licensed CC
BY-SA 3.0**, and the game credits it on screen, not only here.

The pinned originals, with checksums and measurements, are in
`web3d/art/source/`.

## Design system

**Material Design 3**, by **Google**: <https://m3.material.io/>. The table's
controls follow its components, colour system, shape and motion guidance, as
piquet's do. They are used through `@material/web` (below), and the colour
tokens are piquet's, generated from one seed colour with Google's Material
Color Utilities.

The page's own icons (undo, settings, the game log, the hint) are simple
strokes drawn for piquet's page and reused. Seven come from **Material
Symbols** (Outlined, weight 400, 24 px), by **Google**,
<https://github.com/google/material-design-icons>, Apache License 2.0: *add*
(the plus for a new game) and *help* (the question mark) in the top bar,
*arrow_back*, *arrow_forward* and *close* on the tutorial's pages, and
*expand_less* and *expand_more* on the fold of the trackers' panel. Their
SVG paths are copied into `web3d/src/chrome.js` and `web3d/src/overlay.js`;
no icon font is fetched or bundled.

## Software in the page

The single-file page (`web3d/cassino3d.html`; see `docs/TABLE3D.md`) bundles
exactly what esbuild's metafile says is in the bundle, not merely what is
installed. The build keeps each library's licence comment at the end of the
script.

| Package | Version | Licence | Holder |
|---|---|---|---|
| three.js | 0.186.1 | MIT | three.js authors |
| @material/web (Material Design 3 components) | 2.5.0 | Apache-2.0 | Google LLC |
| lit-html (part of Lit 3.3.3) | 3.3.3 | BSD-3-Clause | Google LLC |
| @lit/reactive-element (part of Lit) | 2.1.2 | BSD-3-Clause | Google LLC |
| lit-element (part of Lit) | 4.2.2 | BSD-3-Clause | Google LLC |
| tslib (TypeScript's helpers, used by Material Web) | 2.8.1 | 0BSD | Microsoft Corporation |

The rules engine and everything else in this repository are the project's
own.

## Build tools (used, not shipped)

| Tool | Version | Licence | Use |
|---|---|---|---|
| esbuild | 0.28.2 | MIT | Bundling the page's JavaScript |
| librsvg (`rsvg-convert`) | Debian 12 | LGPL-2.1+ | Rasterising the card art |
| Pillow | current | MIT-CMU (HPND) | Cropping and encoding the card images |

## Test-only libraries (used, not shipped)

The engine and the page use no third-party Rust. The wasm module's tests
read JSON with **serde_json** 1.0.151 (MIT OR Apache-2.0, by David Tolnay
and the Serde authors), which brings in serde_core, itoa (MIT OR
Apache-2.0), memchr (Unlicense OR MIT) and zmij (MIT).

## Rules, history and method

The sources behind the rules, the table talk and the strategy are credited in
`cassino-lit-review.md` (Appendix B), and every rule in `docs/RULES.md` cites
them by those IDs.
