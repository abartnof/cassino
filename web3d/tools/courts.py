#!/usr/bin/env python3
"""The twelve court cards your opponent can turn out to be, at the game's end:
cut from the pinned scan of a Spanish-suited pack of about 1760
(web3d/art/source/sarton-spanish-suited-c1760.jpg; SOURCES.md, CREDITS.md).

    python3 web3d/tools/courts.py           # write web3d/art/courts/*.webp
    python3 web3d/tools/courts.py --check   # fail if they are out of date

The scan is a grid of four rows (coins, cups, swords, clubs) and five
columns (ace, a numeral, sota, caballo, rey) on white, with white gutters
between the cards; the cards are found by those gutters, not by fixed
coordinates, and the three courts of each row are kept, whole.
"""

import io
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "web3d" / "art" / "source" / "sarton-spanish-suited-c1760.jpg"
OUT = ROOT / "web3d" / "art" / "courts"
SUITS = ["oros", "copas", "espadas", "bastos"]  # coins, cups, swords, clubs: the rows
RANKS = ["sota", "caballo", "rey"]  # the last three columns
QUALITY = 88


def spans(white_share, threshold=0.97):
    """The runs between the gutters: where a row or column of pixels is not
    almost all white."""
    out, start = [], None
    for i, share in enumerate(white_share):
        card = share <= threshold
        if card and start is None:
            start = i
        if not card and start is not None:
            out.append((start, i))
            start = None
    if start is not None:
        out.append((start, len(white_share)))
    return out


def courts():
    """Each court's key ("oros-rey") and its image, cut from the scan."""
    image = Image.open(SOURCE).convert("RGB")
    white = np.asarray(image.convert("L")) > 235
    columns = spans(white.mean(axis=0))
    rows = spans(white.mean(axis=1))
    assert len(columns) == 5 and len(rows) == 4, f"expected a 5 x 4 grid, found {len(columns)} x {len(rows)}"
    out = {}
    for suit, (top, bottom) in zip(SUITS, rows):
        for rank, (left, right) in zip(RANKS, columns[2:]):
            out[f"{suit}-{rank}"] = image.crop((left, top, right, bottom))
    return out


def encoded(img):
    buffer = io.BytesIO()
    img.save(buffer, "WEBP", quality=QUALITY, method=6)
    return buffer.getvalue()


def main():
    made = {key: encoded(img) for key, img in courts().items()}
    if "--check" in sys.argv:
        stale = [k for k, data in made.items() if not (OUT / f"{k}.webp").exists() or (OUT / f"{k}.webp").read_bytes() != data]
        if stale:
            print(f"out of date: {', '.join(stale)}; run web3d/tools/courts.py")
            return 1
        return 0
    OUT.mkdir(parents=True, exist_ok=True)
    for key, data in made.items():
        (OUT / f"{key}.webp").write_bytes(data)
    print(f"wrote {len(made)} courts to {OUT.relative_to(ROOT)} ({sum(map(len, made.values())):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
