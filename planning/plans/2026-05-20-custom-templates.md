# Daedalus Custom Templates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users build a library of custom Daedalus templates (import / save-as / AI-generate) that survives plugin updates, auto-discovered at scaffold time.

**Architecture:** Templates are read by Claude at scaffold time (not compiled). Custom templates live in `~/.daedalus/templates/` (outside the plugin cache). Two small Node utilities provide the testable guardrail (header parse + structural validator); the rest is skill/command markdown that teaches Claude the discovery + creation behaviors. Spec: `planning/specs/2026-05-20-custom-templates-design.md`.

> **Correction (during execution, Task 4):** the two Node utilities below are written as `scripts/template-meta.js` / `scripts/validate-template.js` in Tasks 1–2, but they were **relocated to `plugins/daedalus/skills/template-manager/scripts/`** — only `./plugins/daedalus` ships (per marketplace.json), so the validator must be inside the plugin tree for the skill to invoke it on an end-user install. Tests reference the in-plugin path. Repo-root `scripts/` keeps only `build-dist.js` + `run-tests.js`.

**Tech Stack:** Node 20 (CI pins Node 20; no deps for the utilities), existing Puppeteer test harness, Claude Code plugin skill/command markdown.

---

### Task 1: Header-parse utility (`template-meta.js`)

**Files:**
- Create: `scripts/template-meta.js`
- Test: `tests/template-meta.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/template-meta.test.js
const assert = require('assert');
const { parseTemplateHeader, firstComment } = require('../scripts/template-meta');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS ' + m); } else { fail++; console.log('  FAIL ' + m); } };

const sample = `<!doctype html>
<!--
  Daedalus template: podcast-shownotes
  Keywords: podcast, show notes, episode
  Description: Episode metadata + chapters
-->
<html><head></head><body data-pdf-root></body></html>`;

const meta = parseTemplateHeader(sample);
ok(meta.name === 'podcast-shownotes', 'parses name');
ok(meta.keywords.length === 3 && meta.keywords[0] === 'podcast', 'parses keywords as trimmed list');
ok(meta.description === 'Episode metadata + chapters', 'parses description');

const none = parseTemplateHeader('<!doctype html><html></html>');
ok(none.keywords.length === 0 && none.description === null, 'missing header → empty/null, no throw');

console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run to verify it fails**

Run: `node tests/template-meta.test.js`
Expected: FAIL — `Cannot find module '../scripts/template-meta'`.

- [ ] **Step 3: Implement**

```js
// scripts/template-meta.js
'use strict';
// Parse a Daedalus template's leading HTML comment for discovery metadata.
function firstComment(html) {
  const m = html.match(/<!--([\s\S]*?)-->/);
  return m ? m[1] : '';
}
function parseTemplateHeader(html) {
  const c = firstComment(html);
  const out = { name: null, keywords: [], description: null };
  const name = c.match(/Daedalus template:\s*(.+)/i);
  if (name) out.name = name[1].trim();
  const kw = c.match(/Keywords:\s*(.+)/i);
  if (kw) out.keywords = kw[1].split(',').map(s => s.trim()).filter(Boolean);
  const desc = c.match(/Description:\s*(.+)/i);
  if (desc) out.description = desc[1].trim();
  return out;
}
module.exports = { parseTemplateHeader, firstComment };
```

- [ ] **Step 4: Run to verify it passes** — `node tests/template-meta.test.js` → all PASS.
- [ ] **Step 5: Commit** — `feat(templates): header-parse utility for custom-template discovery`

---

### Task 2: Structural validator (`validate-template.js`)

**Files:**
- Create: `scripts/validate-template.js`
- Test: `tests/validate-template.test.js`
- Fixtures: `tests/fixtures/templates/{valid-marker.html, valid-inlined.html, missing-editor.html, missing-pdfroot.html, missing-header.html, partial-markers.html}`

**Fixture notes:** `valid-marker.html` = a minimal doc with all 6 `DAE_*_HERE` markers (in their proper comment/`/* */` forms), one `data-pdf-root`, and a Keywords/Description header. `valid-inlined.html` = same but with `<div class="dae-edit-toolbar">` and zero markers. The failure fixtures each break exactly one rule. Build `valid-marker.html` by copying the marker block layout from `plugins/daedalus/skills/editor/templates/blank.html`.

- [ ] **Step 1: Write the failing test** (asserts exit codes per fixture)

```js
// tests/validate-template.test.js
const { execFileSync } = require('child_process');
const path = require('path');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const SCRIPT = path.resolve(__dirname, '../scripts/validate-template.js');
const FIX = path.resolve(__dirname, 'fixtures/templates');
function exitCode(file) {
  try { execFileSync(process.execPath, [SCRIPT, path.join(FIX, file)], { stdio: 'pipe' }); return 0; }
  catch (e) { return e.status; }
}
ok(exitCode('valid-marker.html') === 0, 'valid marker-style → exit 0');
ok(exitCode('valid-inlined.html') === 0, 'valid pre-inlined → exit 0');
ok(exitCode('missing-editor.html') === 1, 'no editor → exit 1');
ok(exitCode('missing-pdfroot.html') === 1, 'no data-pdf-root → exit 1');
ok(exitCode('missing-header.html') === 1, 'no Keywords/Description → exit 1');
ok(exitCode('partial-markers.html') === 1, 'partial markers → exit 1');
console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
```

- [ ] **Step 2: Run to verify it fails** — module/fixtures missing.
- [ ] **Step 3: Create the 6 fixtures** (see notes above).
- [ ] **Step 4: Implement the validator**

```js
// scripts/validate-template.js
#!/usr/bin/env node
'use strict';
// Structural smoke check for Daedalus templates. Exit 0 = valid, 1 = invalid, 2 = usage/IO.
// NOT a runtime guarantee — see planning/specs/2026-05-20-custom-templates-design.md.
const fs = require('fs');
const { parseTemplateHeader } = require('./template-meta');
const MARKERS = ['DAE_EDIT_CSS_HERE','DAE_EDIT_TOOLBAR_HERE','DAE_SORTABLE_JS_HERE','DAE_HTML2CANVAS_JS_HERE','DAE_JSPDF_JS_HERE','DAE_EDIT_JS_HERE'];
const stripComments = (h) => h.replace(/<!--[\s\S]*?-->/g, '');

function validate(html) {
  const errors = [];
  const stripped = stripComments(html);
  // 1. Editor present — one clean shape, never a mix. (markers live in comments → scan raw)
  const present = MARKERS.filter(m => html.includes(m));
  const hasToolbar = /class=["'][^"']*\bdae-edit-toolbar\b/.test(stripped);
  if (hasToolbar && present.length === 0) { /* pre-inlined ok */ }
  else if (!hasToolbar && present.length === MARKERS.length) { /* marker-style ok */ }
  else if (!hasToolbar && present.length === 0) errors.push('editor missing: no DAE_*_HERE markers and no inlined dae-edit-toolbar');
  else if (hasToolbar && present.length > 0) errors.push(`mixed shape: inlined toolbar + ${present.length} marker(s) — normalize to one shape`);
  else errors.push(`partial marker-style: missing ${MARKERS.filter(m => !html.includes(m)).join(', ')}`);
  // 2. data-pdf-root as a TAG attribute, at least once. Comment-stripped (drops header prose);
  //    tag-scoped (a real inlined file has data-pdf-root ~10× in CSS/JS but only 1× as a tag attr).
  const roots = stripped.match(/<[^>]*\bdata-pdf-root\b[^>]*>/g) || [];
  if (roots.length === 0) errors.push('missing data-pdf-root tag attribute');
  // 3. Metadata header (reads first comment)
  const meta = parseTemplateHeader(html);
  if (meta.keywords.length === 0) errors.push('header missing Keywords:');
  if (!meta.description) errors.push('header missing Description:');
  // 4. Structural smoke
  for (const t of ['<html','<head','<body','</html>']) if (!stripped.includes(t)) errors.push(`structural: missing ${t}`);
  return errors;
}

function main() {
  const file = process.argv[2];
  if (!file) { console.error('usage: validate-template.js <file>'); process.exit(2); }
  let html; try { html = fs.readFileSync(file, 'utf8'); }
  catch (e) { console.error(`cannot read ${file}: ${e.message}`); process.exit(2); }
  const errors = validate(html);
  if (errors.length === 0) { console.log('VALID'); process.exit(0); }
  console.error('INVALID:'); errors.forEach(e => console.error('  - ' + e)); process.exit(1);
}
if (require.main === module) main();
module.exports = { validate, stripComments, MARKERS };
```

- [ ] **Step 5: Run to verify it passes** — `node tests/validate-template.test.js` → all PASS.
- [ ] **Step 6: Commit** — `feat(templates): structural validator with marker/inlined/pdf-root/header checks`

---

### Task 3: Discovery + scaffold branch in editor SKILL.md

**Files:**
- Modify: `plugins/daedalus/skills/editor/SKILL.md`

- [ ] **Step 1:** Add a discovery step before the selection table (step 2): "Before selecting, if `~/.daedalus/templates/` exists, list `*.html`, read each file's leading comment, parse `Keywords:`/`Description:`. Merge these as additional rows in the lookup table below. **On filename collision with a bundled template, the custom one wins** — note this to the user in one line when it happens."
- [ ] **Step 2:** Add a scaffold branch to step 3: "If the chosen template has no `DAE_*_HERE` markers (a pre-inlined custom template), skip the inline step — the editor is already baked in. Only fill `{{TOKEN}}` content."
- [ ] **Step 3:** Cross-link the metadata-header convention (point to templates/README.md).
- [ ] **Step 4: Verify** — discovery integration check:

```js
// tests/discovery.test.js  (parse-level proof; the ls+merge is Claude-behavioral)
const fs = require('fs'); const os = require('os'); const path = require('path');
const { parseTemplateHeader } = require('../scripts/template-meta');
let pass = 0, fail = 0; const ok = (c,m)=>{c?(pass++,console.log('  PASS '+m)):(fail++,console.log('  FAIL '+m));};
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dae-tpl-'));
fs.writeFileSync(path.join(dir,'custom.html'),
  '<!doctype html>\n<!--\n  Daedalus template: my-thing\n  Keywords: widget, gadget\n  Description: A custom thing\n-->\n<html></html>');
const found = fs.readdirSync(dir).filter(f=>f.endsWith('.html'))
  .map(f=>parseTemplateHeader(fs.readFileSync(path.join(dir,f),'utf8')));
ok(found.length===1 && found[0].name==='my-thing', 'discovers + parses a dropped template');
ok(found[0].keywords.includes('widget'), 'keywords available for selection');
fs.rmSync(dir,{recursive:true,force:true});
console.log(`\nPASS: ${pass}  FAIL: ${fail}`); process.exit(fail===0?0:1);
```

- [ ] **Step 5: Commit** — `feat(editor): discover + merge custom templates from ~/.daedalus/templates`

---

### Task 4: `template-manager` skill + `/daedalus:template` command

**Files:**
- Create: `plugins/daedalus/skills/template-manager/SKILL.md`
- Create: `plugins/daedalus/commands/template.md`

- [ ] **Step 1:** Write `template-manager/SKILL.md` covering the four intents (import / save-as / generate / list+delete), each ending in: run `node scripts/validate-template.js <file>`; if it exits non-zero, repair per the report (marker re-inject following `editor/SKILL.md:54-65` wrapping rules; or add header) and re-run; write to `~/.daedalus/templates/<slug>.html` (`mkdir -p` first). For **save-as**, scope content-stripping to the `[data-pdf-root]` subtree only. For **generate**, produce lean marker-style.
- [ ] **Step 2:** Write `commands/template.md` — frontmatter `description:`, body routes intent to the template-manager skill **by instruction text** (mirror how `commands/daedalus.md` invokes the editor skill). Confirm the resulting slash name is `/daedalus:template` (see spec "Verify at implementation").
- [ ] **Step 3: Verify** — re-read both files against the spec's data-flow section; confirm every path ends in validate→repair→write and the save-as strip is `[data-pdf-root]`-scoped.
- [ ] **Step 4: Commit** — `feat(templates): /daedalus:template manager (import / save-as / generate / list)`

---

### Task 5: Docs + version sync

**Files:**
- Modify: `plugins/daedalus/skills/editor/templates/README.md`, `README.md`, `plugins/daedalus/.claude-plugin/plugin.json`, `package.json`

- [ ] **Step 1:** templates/README.md — document `~/.daedalus/templates/` + the `Keywords:`/`Description:` header convention + shadow-on-collision rule.
- [ ] **Step 2:** README.md — one-line feature mention + pointer to `/daedalus:template`.
- [ ] **Step 3:** Bump BOTH `plugin.json` (0.5.1) and `package.json` (0.5.2) to **0.6.0** (new feature; also resolves the pre-existing drift).
- [ ] **Step 4: Commit** — `0.6.0: custom template library docs + version sync`

---

### Task 6: Full suite + ship

- [ ] **Step 1:** `npm test` — confirm the new unit tests run alongside the 11 Puppeteer suites, all green. (Add new `*.test.js` files are auto-discovered by `run-tests.js`.)
- [ ] **Step 2:** Push, watch CI green.
- [ ] **Step 3:** Manual smoke (only the human/Claude-in-session can do this): `/daedalus:template` → generate a template → confirm it lands in `~/.daedalus/templates/` and is auto-picked on a subsequent `/daedalus` request matching its keywords.

---

## Notes for the implementer
- Markers live *inside* comments — scan **raw** HTML for markers, **comment-stripped** for `data-pdf-root`/toolbar/structural. Do not global-strip.
- The validator is a smoke check, not a runtime guarantee. Don't over-promise in error messages.
- No new npm deps. Node 20 syntax only.
- Skill/command markdown is consumed by Claude, not executed — "verify" steps are checklist reads, not red-green tests, except the two utilities and the discovery parse.
