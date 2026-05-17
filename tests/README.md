# Daedalus tests

Puppeteer-driven end-to-end tests for the editor. Each test file is a standalone Node script that boots a headless browser, loads `dist/editor.html`, exercises a feature, and exits with code 0 on success or non-zero on failure.

## Run

```bash
npm install
npm test
```

`npm test` builds `dist/editor.html` from the canonical reference (`plugins/daedalus/skills/editor/references/editor.md`) and then runs every `tests/*.test.js` file in sequence. The summary at the end shows which suites passed and which failed.

If you just want to re-run tests against the existing `dist/editor.html` (no rebuild):

```bash
npm run test:only
```

## What's covered

| Suite | What it verifies |
|---|---|
| `editor-loads.test.js` | Toolbar + all 3 vendored libs load, edit mode toggles, text editable, autosave fires, PDF generates |
| `autosave.test.js` | Snapshot every 5s, restore prompt on reload, Versions menu, Discard |
| `autosave-fixes.test.js` | Restore pins banner version (HIGH-3 race), sanitizer strips on*/javascript: on restore + download (SEC-1/2), Present mode lifecycle |
| `tables-comments.test.js` | Table insert + add/remove rows/cols, Comment add/post/resolve, badge updates, data persists in `<template>` |
| `style-xform.test.js` | Block style transformer (heading↔paragraph↔pullquote↔callout), inline formatting + comment anchors preserved, undo, Cmd+Opt+H/P/Q/C |
| `drag-drop.test.js` | File drop on photo → replace, on empty space → insert, non-image no-op, view-mode no-op |
| `photo-fixes.test.js` | Reposition mode click-outside exit, overlay restored, free-resize grows the image (not empty space) |
| `floating-menu.test.js` | B/I/U buttons apply formatting, color swatches wrap in `.dae-color-N` spans, reset unwraps, font-size popover wraps in `.dae-size-N` |
| `link-modal.test.js` | Open via floating button + Cmd+K, bare-domain → https://, bare-email → mailto:, javascript: rejected, Remove unwraps |
| `block-controls.test.js` | + button opens insert menu with all primitives, Paragraph insertion works, × deletes, Cmd+Z restores deletes AND insertions |
| `html-download.test.js` | Edits round-trip, all chrome stripped, no `<script>` tags, comments-data template preserved, on*/javascript: sanitized |

## What's NOT covered (and why)

- **Sortable.js drag-to-reorder** — HTML5 native drag-and-drop is unreliable to simulate in headless puppeteer (the API requires real OS-level events). Works in actual browsers; relies on visual / manual checks.
- **Print mode CSS** — purely visual, no behavior to assert. Manual check via Cmd+P.
- **Storage quota exhaustion** — environment-specific; would need to fill localStorage to ~5–10MB to trigger. Code path is wrapped in try/catch + degrades gracefully (one-time toast).
- **Word-choice lint** — empty by default (per-host configuration); not core to editor.
- **Touch / mobile gestures** — desktop-only for v1.

## Writing a new test

Each test follows the same pattern:

```js
const { launch, makeAssert, sleep } = require('./helpers/setup');

(async () => {
  const { browser, page } = await launch();
  const { assert, summary } = makeAssert();

  // ... interact with page, call assert(condition, label) ...

  const ok = summary();
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
```

Drop the file in `tests/`, name it `*.test.js`, and the runner picks it up automatically.

## CI

`.github/workflows/ci.yml` runs `npm test` on every push and pull request. The README badge at the top of the repo reflects the latest run status.
