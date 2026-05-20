# Daedalus Custom Templates — Design Spec

**Date:** 2026-05-20
**Status:** Approved (design), pending implementation plan
**Scope:** Phase 1 = Daedalus. Phase 2 = port to SY plugin (sketched, not specced here).

## Problem

Daedalus ships 17 bundled templates inside the plugin tree (`plugins/daedalus/skills/editor/templates/`). Heavy users want to reuse their own formats and theme variants without re-prompting from scratch. Two blockers today:

1. There's no pathway for a user to add a template.
2. Anything added inside the plugin tree is wiped on every plugin update (the plugin lives in `~/.claude/plugins/cache/<marketplace>/daedalus/<version>/`, a versioned cache dir).

## Key architectural insight

**Daedalus templates are not compiled.** Claude reads a template file directly at scaffold time, inlines the editor code into it, fills content, and ships. "Template discovery" today is purely the static lookup table in `editor/SKILL.md`. Therefore the core of this feature is not storage mechanics — it is teaching Claude to look in a *second* location and merge it with the bundled table. Storage + discovery is the foundation; the creation paths are UX layered on top.

## Design decisions (locked)

- **Storage:** `~/.daedalus/templates/`. Outside the plugin cache → survives updates by construction. Created on first save. Cross-platform via `os.homedir()`. (Windows-native path edge cases are out of scope for v1; Claude Code on macOS/Linux/WSL is the target.)
- **Collision:** user templates **shadow** bundled ones on filename match (simplest; namespacing deferred).
- **Command:** `/daedalus:template` routes to a new `template-manager` skill.
- **Template shape:** a template may be **marker-style** (lean, `DAE_*_HERE` markers — like the bundled ones) **or pre-inlined** (a full self-contained artifact with the editor code already baked in). Scaffold logic branches on marker presence. This avoids brittle "re-markerization" of finished artifacts during save-as.
- **Guardrail:** every creation path runs a **validate-and-auto-repair** pass. It guarantees the file *opens* in the editor; it does **not** gatekeep on quality. Detection lives in a testable Node script; repair is performed by Claude using the script's report.

## Components

### New

| Path | Responsibility |
|---|---|
| `plugins/daedalus/commands/template.md` | `/daedalus:template` entry point — routes intent (import / save-as / generate / list) to the skill. Invokes the skill by **instruction text** (the way `commands/daedalus.md` invokes the editor skill — there's no declarative skill binding). |
| `plugins/daedalus/skills/template-manager/SKILL.md` | The three creation paths + list/delete, the validate-then-repair loop, where files are written. |
| `plugins/daedalus/skills/template-manager/scripts/validate-template.js` | Node CLI: detect editor presence, `data-pdf-root`, metadata header, structural sanity. Detect + report (exit non-zero on failure). Node 20 compatible (CI runs Node 20). **Must live inside the plugin tree** (only `./plugins/daedalus` ships per marketplace.json) so the skill can invoke it at runtime on an end-user's install. |
| `plugins/daedalus/skills/template-manager/scripts/template-meta.js` | Header-parse helper (`parseTemplateHeader`/`firstComment`) imported by the validator. Co-located so it ships too. |
| `tests/validate-template.test.js`, `tests/template-meta.test.js`, `tests/discovery.test.js` | Unit tests; reference the in-plugin scripts via relative path. |
| `tests/fixtures/templates/` | Fixtures: valid marker-style, valid pre-inlined, missing-editor, missing-pdf-root, missing-header, partial-markers, mixed. |

### Modified

| Path | Change |
|---|---|
| `plugins/daedalus/skills/editor/SKILL.md` | Add a discovery step before template selection: list `~/.daedalus/templates/*.html`, parse each header, merge into the in-context selection table; user shadows bundled. Add scaffold branch: if template already has inlined editor (no markers), skip the inline step. |
| `plugins/daedalus/skills/editor/templates/README.md` | Document the custom-template dir + the metadata-header convention. |
| `README.md` | One-line feature mention + pointer. |
| `plugins/daedalus/.claude-plugin/plugin.json` | Version bump (also sync the 0.5.1→0.5.2 drift vs package.json while here). |
| `package.json` | Version bump. |

## Self-describing template header

Templates already carry a leading HTML comment (`Daedalus template: <name>`). Extend it with two parseable lines so custom templates are discoverable without a separate manifest that could drift:

```html
<!--
  Daedalus template: podcast-shownotes
  Keywords: podcast, show notes, episode, transcript, chapters
  Description: Episode metadata + chapter list + transcript
-->
```

Discovery parse rules (case-insensitive, within the first HTML comment):
- `Keywords:` → comma-separated trigger phrases (feed the selection table).
- `Description:` → one-line human summary.

Bundled templates keep using the static `SKILL.md` table (no churn). The header convention is what makes *custom* templates self-describing. At discovery, Claude appends parsed custom-template rows to the bundled table already in its context.

## Data flow

### Discovery (at scaffold time, inside `/daedalus` generation)
1. `editor/SKILL.md` step: if `~/.daedalus/templates/` exists, `ls *.html`, read each file's leading comment, parse `Keywords:`/`Description:`.
2. Merge into the selection table. On filename collision, the custom entry replaces the bundled row.
3. Selection proceeds as today. If a custom template is chosen and it has no `DAE_*_HERE` markers (pre-inlined), skip the inline step and only fill `{{TOKENS}}`.

### Creation (inside `/daedalus:template`)
All three converge on: validated file written to `~/.daedalus/templates/<slug>.html` with a metadata header.
- **Import** — user points at / pastes an HTML file. Validate. If editor missing/markers broken → repair (inject markers or note it's pre-inlined). If header missing → ask for keywords + description (or infer), write header. Slugify name, write.
- **Save-as** — take the current or just-generated artifact. Strip content **only within the `[data-pdf-root]` subtree** (so the strip can't touch toolbar/editor DOM that lives elsewhere in the doc): replace text in `[data-editable]` with `{{TOKEN}}` placeholders, photo `src` with a placeholder. Keep skeleton + theme (`:root` vars). Add header. Validate. Write. (No re-markerization — the inlined artifact stays inlined; scaffold handles it.)
- **Generate** — guided Q&A (purpose, sections, theme leanings). Claude writes a lean marker-style template following the contract in `references/editor.md`. Validate. Write.
- **list / delete** — enumerate `~/.daedalus/templates/`, show name + description; delete by name with confirm.

## Validator contract (`scripts/validate-template.js`)

`node scripts/validate-template.js <file>` → exit 0 (valid) or non-zero (invalid) with a line/JSON report of failures.

**What it guarantees (honest framing):** it is a **structural smoke check**, not a runtime guarantee. It catches "this isn't a Daedalus template" / "the editor is missing" / "no metadata" — the obvious bricks. It does **not** prove the file renders perfectly when scaffolded; genuine runtime breakage surfaces on first use, and per the agreed philosophy the user iterates on an imperfect template. (A deeper "inline to a temp file + headless-load + confirm the toolbar initializes" check reusing the existing Puppeteer toolchain is noted as v1.1 hardening — see Out of scope.)

**Preprocessing is per-check (this matters):** the 6 markers themselves *live inside comments* (`<!-- DAE_SORTABLE_JS_HERE -->`, `/* DAE_EDIT_CSS_HERE */`), so a global comment-strip would delete the very tokens we count. Therefore:
- **Marker detection** runs on **raw** HTML, counting the 6 *specific* marker tokens. (Our templates' descriptive headers use the glob `DAE_*_HERE`, not the 6 specific names, so raw counting is safe in practice. Known narrow edge case: an *imported* file with only 5 real markers whose header prose names the 6th verbatim would count as 6 and false-pass — accepted as a smoke-check limitation, surfaces on first use, not worth a logic change.)
- **`data-pdf-root`, toolbar-signature, and structural** checks run on **comment-stripped** HTML — the leading header mentions `data-pdf-root` in prose, which would otherwise false-match.
- **Header check** reads the **first HTML comment only**.

Checks:
1. **Editor present — one of two clean shapes, never a mix:**
   - **Marker-style:** all 6 specific `DAE_*_HERE` tokens present (raw scan) AND no inlined toolbar (comment-stripped scan finds no `class="dae-edit-toolbar"`).
   - **Pre-inlined:** `class="dae-edit-toolbar"` present (comment-stripped) AND zero `DAE_*_HERE` tokens (raw).
   - A **partial/mixed file** (1–5 markers, or markers + a baked toolbar) is **invalid** → repair normalizes it: has a toolbar → strip stray markers, treat as pre-inlined; has markers but no toolbar → repair the missing markers to reach all 6.
2. **`data-pdf-root`** — present as a **tag attribute** on **at least one** element (match `<[^>]*\bdata-pdf-root\b[^>]*>` on **comment-stripped** HTML). NOT "exactly one": a real pre-inlined file references `data-pdf-root` ~10× in CSS selectors / JS / prose but only once as an actual tag attribute — tag-scoping isolates the real one, and extra references are expected and ignored. (Verified against `docs/index.html`.)
3. **Metadata header** — the first HTML comment (note: line 2, after `<!doctype html>` — not byte 0) contains both `Keywords:` and `Description:` lines.
4. **Structural sanity (smoke only)** — comment-stripped HTML has `<html`, `<head`, `<body`, `</html>`. Explicitly NOT a guarantee of parseability; see framing above.

**Repair (Claude, using the report):**
- Missing markers → re-inject following the **exact inline contract** in `editor/SKILL.md:54-65` and `references/editor.md` — note the 3 library markers (`SORTABLE`/`HTML2CANVAS`/`JSPDF`) must be wrapped in `<script>` tags and `DAE_EDIT_JS_HERE` lives *inside* an existing `<script>`. This is not a flat string insert.
- Missing header → infer `Keywords`/`Description` from the template's content, or ask the user; write the header lines into the leading comment.
- Re-run the validator until it passes, or report honestly that an imported file can't be salvaged (don't write a brick).

## Error handling / edge cases

- `~/.daedalus/templates/` absent → discovery is a no-op (bundled table only); creation paths `mkdir -p` on first write.
- Malformed header → discovery skips that file for the table but still lists it under `delete`; creation repair adds a header.
- Filename collision with a bundled template → user wins (shadow). Surface a one-line note when it happens so the user knows their custom one is in effect.
- Pre-inlined template chosen → scaffold skips inlining (branch on marker absence).
- Validator can't be satisfied after repair (genuinely broken input on import) → tell the user plainly, don't write a brick.

## Testing

- `validate-template.test.js`: each fixture (valid marker-style, valid pre-inlined, each failure mode) asserts the expected exit code + report contents.
- Discovery: a test that drops a temp template in a temp dir, runs the parse logic, asserts it surfaces with the right keywords. (Discovery is Claude-behavioral, but the header-parse can be unit-tested as a small pure function if extracted — decide in plan.)
- Existing 11 Puppeteer suites must stay green (no editor regressions).

## Phase 2 — SY port (sketch only)

SY's 6 skills have heterogeneous template formats, so the port is not a clean copy:
- **onepager + web** — HTML with `SY_*_HERE` markers; near-direct reuse of this mechanism. Port these first (Phase 2a).
- **deck** (`deck_spec.json` + slide-type registry), **writing** (markdown forms), **social/email** (text sequences) — format-specific discovery + validation; separate design pass (Phase 2b).

Storage convention for SY: `~/Library/Application Support/sy/<skill>/templates/` (SY is macOS-only internal; the Mac-standard app-support path is appropriate there, unlike Daedalus's cross-platform `~/.daedalus/`).

## Out of scope (v1)

- Namespacing on collision (shadow only).
- Bundled assets (images/fonts) inside a template — text/HTML only.
- Sharing templates across teammates (pick a git-able folder layout later).
- Windows-native path handling.
- AI-generated template *quality* gating (only structural validity is enforced).
- **Deep "does it actually open" validation** (inline to temp + headless Puppeteer load + confirm toolbar inits). Reuses the existing CI toolchain; deferred to v1.1 hardening. v1 ships the structural smoke check + first-use iteration.

## Verify at implementation (not blocking design)

- **Slash-command namespacing.** Command slash-names derive from the *filename* (`daedalus.md` → `/daedalus`), with no `name` frontmatter override available. A new `commands/template.md` most plausibly yields `/daedalus:template` — confirm against Claude Code's plugin command resolution before finalizing the command file + docs.
