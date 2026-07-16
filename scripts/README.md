# Agent Tooling

Per `~/docs/TOOLS_CONVENTION.md`.

**Note on existing files in this folder:** `analyze-igdb.js`,
`build-extended-keywords.mjs`, `categorise-prompt.txt`,
`categorise-response.txt`, `enrich-intermediate.json`,
`enrich-keywords.mjs`, `parse-categorisation.mjs`,
`prove-multi-keyword.mjs`, and `run-analysis.bat` predate this convention
and are **application/data-pipeline code** — part of GameFinder's
IGDB-enrichment build process, not agent-authored tooling. They are
intentionally left undocumented here and out of scope for this convention;
don't move or repurpose them based on this file. This README only covers
genuinely reusable agent tooling added going forward.

Add an entry here whenever you build something reusable for agent work
(not the product's build pipeline):

### <script-name>
**Purpose:** one line.
**Invocation:** `node scripts/<script-name>.js [args]`
**Added:** YYYY-MM-DD
