#!/usr/bin/env python3
"""Build web3d/cassino3d.html: the 3D table, as one self-contained file.

From piquet web3d/build.py @ 254cb3c.

    python3 web3d/build.py

Compiles the engine to WebAssembly, bundles web3d/src with three.js and
Material Web through esbuild, and inlines the engine, the bundle and the
stylesheet into web3d/src/index.html. The page needs no server and no
network: open it from disk and play.

It prints what every part weighs. Over 5 MB it warns rather than fails: the user
set that figure as a guideline for modesty ("i want this to be rather modest
and easy to use, but it's not a HARD limit"), so the size is weighed against
what the bytes buy, not treated as a wall.

Needs `npm ci` in web3d/ first (esbuild and the libraries, pinned by
package-lock.json).
"""

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HERE = ROOT / "web3d"
SRC = HERE / "src"
OUT = HERE / "cassino3d.html"
WASM = ROOT / "target" / "wasm32-unknown-unknown" / "release" / "cassino_wasm.wasm"
ESBUILD = HERE / "node_modules" / ".bin" / "esbuild"
CARDS = HERE / "art" / "cards"
COURTS = HERE / "art" / "courts"
GUIDELINE = 5 * 1024 * 1024

# Where each bundled source file is reported, by path prefix; first match wins.
PARTS = [
    ("three.js", "node_modules/three/"),
    ("Material Web + Lit", "node_modules/"),
    ("the table's own code", ""),
]


def build_wasm() -> bytes:
    cargo = Path.home() / ".cargo" / "bin" / "cargo"
    subprocess.run(
        [str(cargo) if cargo.exists() else "cargo", "build", "--release", "-q",
         "-p", "cassino-wasm", "--lib", "--target", "wasm32-unknown-unknown"],
        cwd=ROOT, check=True,
    )
    return WASM.read_bytes()


def bundle() -> tuple[str, dict[str, int]]:
    """The page's script, minified, and how many of its bytes each part owns."""
    if not ESBUILD.exists():
        sys.exit("esbuild is missing: run `npm ci` in web3d/ first")
    with tempfile.TemporaryDirectory() as tmp:
        out, meta = Path(tmp) / "app.js", Path(tmp) / "meta.json"
        subprocess.run(
            [str(ESBUILD), "src/main.js", "--bundle", "--minify", "--format=iife",
             "--target=es2022", "--platform=browser", "--legal-comments=eof",
             # The tutorial's pages are Markdown, inlined as text (web3d/tutorial.md).
             "--loader:.md=text",
             f"--outfile={out}", f"--metafile={meta}", "--log-level=warning"],
            cwd=HERE, check=True,
        )
        code = out.read_text()
        inputs = json.loads(meta.read_text())["outputs"]
    owned = {name: 0 for name, _ in PARTS}
    for output in inputs.values():
        for path, info in output.get("inputs", {}).items():
            name = next(n for n, prefix in PARTS if path.startswith(prefix))
            owned[name] += info["bytesInOutput"]
    # Whatever the inputs do not account for is esbuild's glue and the legal
    # comments gathered at the end of the file; report it with the libraries.
    owned["licence notices and glue"] = len(code.encode()) - sum(owned.values())
    return code, owned


def art(way: str) -> str:
    """The 53 card images as a JSON object keyed by card code (and "back").

    Way A, "webp": data URIs of the images web3d/tools/art.py made, committed.
    Way B, "svg": the SVGs themselves, cut from the pinned originals at build
    time, for the browser to rasterise at whatever size the screen wants.
    """
    if way == "svg":
        sys.path.insert(0, str(HERE / "tools"))
        import art as pipeline
        return json.dumps({**pipeline.face_svgs(), "back": pipeline.back_svg()}, separators=(",", ":"))
    images = sorted(CARDS.glob("*.webp"))
    if len(images) != 53:
        sys.exit(f"expected 53 card images in {CARDS}, found {len(images)}: run web3d/tools/art.py")
    return json.dumps({
        p.stem: "data:image/webp;base64," + base64.b64encode(p.read_bytes()).decode("ascii")
        for p in images
    }, separators=(",", ":"))


def courts() -> str:
    """The twelve courts your opponent can turn out to be, at the game's end
    (web3d/tools/courts.py), as a JSON object of data URIs keyed "oros-rey"."""
    images = sorted(COURTS.glob("*.webp"))
    if len(images) != 12:
        sys.exit(f"expected 12 court images in {COURTS}, found {len(images)}: run web3d/tools/courts.py")
    return json.dumps({
        p.stem: "data:image/webp;base64," + base64.b64encode(p.read_bytes()).decode("ascii")
        for p in images
    }, separators=(",", ":"))


def phrases() -> str:
    """The phrase bank's words, for the dialogue boxes (web3d/words.json,
    which web3d/tools/phrases.py writes; empty until the bank exists)."""
    path = HERE / "words.json"
    if not path.exists():
        return "{}"
    return json.dumps(json.loads(path.read_text()), separators=(",", ":"), ensure_ascii=False)


def fill(template: str, values: dict[str, str]) -> str:
    """Replace every placeholder in one pass, so nothing inserted is rescanned."""
    missing = [k for k in values if k not in template]
    if missing:
        sys.exit(f"the template has no {', '.join(missing)}")
    pattern = re.compile("|".join(re.escape(k) for k in values))
    return pattern.sub(lambda m: values[m.group(0)], template)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the 3D table's single-file page.")
    parser.add_argument("--art", choices=["webp", "svg"], default="webp",
                        help="ship the card art rasterised (webp, the default) or as vectors (svg), "
                             "which writes web3d/cassino3d-svg.html instead")
    parser.add_argument("--check", action="store_true",
                        help="build in memory and fail if the committed page differs (bin/gate): "
                             "the build is deterministic, so a difference means a stale page")
    args = parser.parse_args()
    out = OUT if args.art == "webp" else OUT.with_name("cassino3d-svg.html")
    wasm = build_wasm()
    code, owned = bundle()
    if "</script" in code.lower():
        sys.exit("the bundle contains '</script', which would end the inline script early")
    style = (SRC / "style.css").read_text()
    engine = base64.b64encode(wasm).decode("ascii")
    cards = art(args.art)
    figures = courts()
    words = phrases()
    page = fill((SRC / "index.html").read_text(), {
        "/*STYLE*/": style,
        "/*APP*/": code,
        "__WASM_BASE64__": engine,
        "/*ART*/": cards,
        "/*COURTS*/": figures,
        "/*WORDS*/": words,
    })
    if args.check:
        if not out.exists() or out.read_text() != page:
            print(f"{out.relative_to(ROOT)} is out of date: run python3 web3d/build.py and commit it")
            return 1
        return 0
    out.write_text(page)

    size = len(page.encode())
    art_name = "the card art (WebP, base64)" if args.art == "webp" else "the card art (SVG)"
    rows = [("the engine (wasm, base64)", len(engine)), (art_name, len(cards.encode())),
            ("the courts at the game's end (WebP, base64)", len(figures.encode())),
            ("the dialogue's words", len(words.encode())),
            *owned.items(),
            ("stylesheet", len(style.encode()))]
    rows.append(("page skeleton", size - sum(n for _, n in rows)))
    print(f"{out.relative_to(ROOT)}: {size:,} bytes")
    for name, n in rows:
        print(f"  {n:>10,}  {name}")
    if size > GUIDELINE:
        print(f"note: over the {GUIDELINE:,}-byte guideline -- weigh what the extra buys")
    return 0


if __name__ == "__main__":
    os.chdir(ROOT)
    sys.exit(main())
