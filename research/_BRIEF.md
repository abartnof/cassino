# Shared research brief (for all research agents)

Project: an extremely thorough, fully-cited literature review of the card game **Cassino / Casino** (and its close family), for a team building a **video game** version. Pay special attention to:
  (a) things people SAY during the game (calls, announcements, slang, jargon, table talk, idioms, in any language),
  (b) scorekeepers / tools / apps / physical aids with unique affordances (how they show builds, captures, scores),
  (c) statistics (probabilities, simulations, AI/game-theory papers, popularity data),
  (d) distinct strategies.

RULES — these are strict:
1. EVERY claim you record must carry a citation to a source you ACTUALLY fetched/read in this session (URL; for books also title, author, year, page/chapter when possible). Never cite from memory. If you can't verify something, either drop it or mark it explicitly "[UNVERIFIED — not found in fetched sources]".
2. Prefer verbatim short quotes (in quotation marks) for key claims, especially for terminology, calls/phrases, historical dates, and rules. For non-English sources give the original quote plus your English translation.
3. Tools: `curl` works from Bash (use it freely: Wikipedia API `https://<lang>.wikipedia.org/w/index.php?title=X&action=raw`, archive.org advancedsearch + full text `https://archive.org/advancedsearch.php?q=...&fl[]=identifier,title,year&rows=100&output=json` and `https://archive.org/download/<id>/<id>_djvu.txt`, archive.org full-text search `https://archive.org/advancedsearch.php` or the scholar/fts API, gutenberg.org `https://www.gutenberg.org/ebooks/search/?query=...` and `https://www.gutenberg.org/cache/epub/<n>/pg<n>.txt`, HathiTrust full-text search `https://babel.hathitrust.org/cgi/ls?q1=...`, Chronicling America, Google Books, arXiv API, Semantic Scholar API `https://api.semanticscholar.org/graph/v1/paper/search?query=...`, OpenAlex `https://api.openalex.org/works?search=...`, crossref). WebSearch/WebFetch deferred tools are also available (load via ToolSearch "select:WebSearch,WebFetch"). Download large texts to your scratch area and grep them rather than reading everything.
4. Write your findings to the markdown file you are assigned in `research/`. Structure: topical sections; each bullet = one claim + inline citation like `[S3]`, plus a "Sources" list at the end mapping `[S3]` → full reference + URL (+ archive.org identifier/page if relevant). Include a short "Gaps / leads not followed" section at the end.
5. Be THOROUGH: aim for depth and breadth. Dozens of sources is good. Fetch the actual pages; follow references; chase primary sources.
6. Do NOT create git commits (the coordinator handles git). Do not touch files other than your assigned one (and your own scratch files, in a scratch directory of your own).
7. Your final reply to the coordinator: a ~200-word summary of the most important findings and the file path. The file is the real deliverable.
