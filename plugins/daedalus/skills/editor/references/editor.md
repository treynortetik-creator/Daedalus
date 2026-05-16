# Daedalus editor toolbar

A reusable, drop-in HTML editor that turns any static page into a round-trip editable document. End users open the artifact in a browser, edit copy, swap photos, reorder/insert/delete blocks, apply theme-aware formatting, and save the result back to HTML or PDF — without an app, install, or build step.

**Drop into any HTML artifact you want a non-technical user to edit after you ship it** — reports, write-ups, explainers, case studies, one-pagers, landing pages, microsites. Skip for true throwaways (inline tools, dev-targeted scratch pages).

## What it does (in edit mode)

| Capability | How |
|---|---|
| Edit text | Click any outlined element, type |
| Text formatting (B / I / U / color / size / link) | Select text → a **floating menu** appears above the selection with all formatting controls. Pattern is Medium / Notion style. Same keyboard shortcuts still work (Cmd+B/I/U/K). The bottom toolbar stays minimal — only mode toggle, undo, and download/PDF live there. |
| Replace photo | Hover any photo → click "Replace photo" → file picker → auto-compressed to 2048px wide |
| Resize photo (inline only) | Hover photo → click `Full` / `Half` / `Third` pill in the overlay. Hero and CTA photos stay layout-locked. |
| Reposition photo within frame | Hover photo → click `Reposition` → drag the image. The visible portion shifts via `object-position`. Esc to lock. |
| Free-resize any block | In edit mode, every block has a brand-styled drag handle in the bottom-right corner (CSS `resize: both`). Drag to resize width and height freely. |
| Reorder blocks | Hover a block → grab the ≡ handle → drag, including across sections |
| Insert a block | Hover a block → click the + → pick from 7 templates (heading, paragraph, pull quote, callout, table, photo, spacer). Or click "+ Add block" at the end of a section. When the current block is inside a nested container (e.g., a 3-column grid), the menu also offers "↑ Add outside this section" to insert at the parent container level. |
| Change block style | Hover a text block → click the ↔ → pick heading / paragraph / pull quote / callout. The block's text (plus inline formatting + comment anchors + links) survives the conversion. Shortcuts: `Cmd+Opt+H/P/Q/C`. Only offered for text blocks — photos, tables, spacers don't have a sane text-block analog. |
| Delete a block | Hover a block → click the × |
| Insert / edit a hyperlink | Select text → `Cmd+K` or click the Link button. Modal accepts the URL and an "open in new tab" toggle. Editing an existing link surfaces a Remove button. Bare domains auto-prefix `https://`, bare emails auto-prefix `mailto:`. |
| Undo | `Cmd+Z` (when not in a contenteditable) or the Undo button (50-step stack) |
| Autosave + restore | Every 5s while editing, snapshots the artifact's content to `localStorage` (last 5 versions). On reload, if there are unsaved edits, a top-of-page banner offers Restore / Discard. Toolbar **Versions** button opens a popover to jump to any recent snapshot. |
| Present mode | Toolbar **Present** button → exits edit mode, hides all chrome, requests browser fullscreen, drops a dark frame around the artifact. Esc exits. Designed for Zoom share / live demo. |
| Lint banned words | Real-time outline on any editable element matching a word-choice rule you configure. Empty by default — populate the `VIOLATIONS` array in the JS block (regex + message) to enable. |
| Save as PDF | Toolbar **PDF** button → one-click PDF download. Bypasses the browser print dialog entirely so there's no date/URL/page-number junk added. PDF is image-based (text not selectable) but visually identical to the on-screen render. |
| Download HTML | Toolbar **HTML** button → saves a new `.html` with the toolbar + scripts stripped. Use this when you want to email the editable file to another editor. |

## What the editor will NOT let users change

- Layout grid, host-page font stack, and structural CSS — owned by your page template, not the editor. The editor only mutates content within the regions you mark editable.
- Chart SVGs, code blocks, or other "data not copy" elements — leave them out of `data-editable` regions. For updates, regenerate from source.
- Arbitrary color pickers and custom fonts — explicitly out. The editor exposes 4 theme color swatches (mapped to `--dae-color-1..4` CSS variables you control) and 5 preset font-size steps. This keeps the editing surface bounded; if your project needs full freedom, layer your own controls on top.

## When to skip the toolbar

- **Throwaway interactive tools** (triage kanbans, prompt tuners, dataset curators) — they have their own state UI; a second toolbar fights for attention.
- **Tiny one-off comparisons** under ~200 words with nothing meaningful to edit.
- **Dev-targeted pages** where source-editing is faster.

Default for everything else: include it.

## Markup contract

Mark editable regions on the elements that should be editable:

```html
<h1 data-editable>Increase NOI by an average of 20%.</h1>
<p data-editable>Body copy that the user can edit goes here.</p>

<!-- Inline editable spans within larger markup are fine -->
<p class="stat-num">
  <span data-editable>50</span><span class="stat-unit" data-editable>%</span>
</p>
```

Wrap every photo in `<span class="dae-photo-wrap">` and add `data-editable-photo` to the `<img>`:

```html
<span class="dae-photo-wrap">
  <img src="data:image/jpeg;base64,..." alt="..." class="hero-photo" data-editable-photo>
</span>
```

For **inline photos that should be resizable** (full / half / third), group the photo + caption inside a `<div class="dae-photo-block">`:

```html
<div class="dae-photo-block">
  <span class="dae-photo-wrap">
    <img src="data:image/jpeg;base64,..." alt="..." class="inline-photo" data-editable-photo>
  </span>
  <p class="photo-caption" data-editable>Caption text.</p>
</div>
```

The size toggle (Full / Half / Third) only appears for photos with class `inline-photo`. Hero photos (`hero-photo` class) and CTA photos (`cta-photo` class) skip the toggle because they're in grid cells with fixed dimensions — resizing them would break the layout.

Mark any container whose children should be individually reorderable / insertable / deletable with `dae-sortable-container`:

```html
<main class="prose dae-sortable-container">
  <section class="hero dae-sortable-container">
    <p class="eyebrow" data-editable>...</p>
    <h1 class="hero-title" data-editable>...</h1>
    <span class="dae-photo-wrap"><img data-editable-photo></span>
    ...
  </section>
  <section class="chapter dae-sortable-container">...</section>
  <div class="stat-strip dae-sortable-container">...</div>
  <div class="cta dae-sortable-container">...</div>
</main>
```

Nested containers are fine — Sortable groups share a name (`dae-blocks`) so blocks can drag between containers (e.g., move a paragraph from one chapter to another).

## Vendored dependencies

The editor ships three vendored libraries — all MIT-licensed, all inlined into every artifact (no CDN, so artifacts work offline):

| File | Used by | Size |
|---|---|---|
| `sortable.min.js` (1.15.3) | Block reorder via drag-and-drop | ~44 KB |
| `html2canvas.min.js` (1.4.1) | DOM-to-canvas capture for PDF export | ~194 KB |
| `jspdf.umd.min.js` (2.5.1) | Canvas-to-PDF assembly | ~358 KB |

All three live in `skills/editor/assets/`. Read them and inline as `<script>` blocks:

```python
from pathlib import Path
ASSETS = Path("skills/editor/assets")
for lib in ("sortable.min.js", "html2canvas.min.js", "jspdf.umd.min.js"):
    html += f"<script>{(ASSETS / lib).read_text()}</script>"
```

## Required HTML (bottom of `<body>`)

```html
<!-- Edit-mode toolbar (stripped from downloads) -->
<div class="dae-edit-toolbar" role="toolbar" aria-label="Document edit toolbar">
  <span class="dae-status" id="dae-status">view</span>
  <button id="dae-toggle-edit" aria-pressed="false" title="Toggle edit mode (Cmd/Ctrl+E)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    <span>Edit</span>
  </button>
  <span class="dae-divider"></span>
  <button id="dae-undo" disabled title="Undo (Cmd/Ctrl+Z)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
    <span>Undo</span>
  </button>
  <button id="dae-versions" disabled title="Recent versions (autosaved every 5s)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    <span>Versions</span>
  </button>
  <button id="dae-comments-toggle" title="Comments">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
    <span>Comments <span class="dae-comments-badge" id="dae-comments-badge">0</span></span>
  </button>
  <button id="dae-present" title="Present mode — fullscreen, no chrome (Esc to exit)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
    <span>Present</span>
  </button>
  <span class="dae-divider"></span>
  <button id="dae-save-pdf" class="primary" title="Save as PDF (one-click, no browser dialog)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
    <span>PDF</span>
  </button>
  <button id="dae-download" title="Download HTML with edits">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    <span>HTML</span>
  </button>
</div>

<!-- Floating text-formatting menu — appears above text selection in edit mode -->
<div class="dae-text-menu" id="dae-text-menu" role="toolbar" aria-label="Text formatting" aria-hidden="true">
  <button id="dae-tm-bold" class="dae-tm-btn" title="Bold (Cmd/Ctrl+B)"><b>B</b></button>
  <button id="dae-tm-italic" class="dae-tm-btn" title="Italic (Cmd/Ctrl+I)"><i>I</i></button>
  <button id="dae-tm-underline" class="dae-tm-btn" title="Underline (Cmd/Ctrl+U)"><u>U</u></button>
  <button id="dae-tm-size" class="dae-tm-btn" title="Font size">Aa</button>
  <span class="dae-tm-divider"></span>
  <button class="dae-tm-color swatch-1" data-color="1" title="Primary teal"></button>
  <button class="dae-tm-color swatch-2" data-color="2" title="Secondary teal"></button>
  <button class="dae-tm-color swatch-3" data-color="3" title="Accent cyan"></button>
  <button class="dae-tm-color swatch-4" data-color="4" title="Warm coral"></button>
  <button class="dae-tm-color dae-tm-color-reset" data-color="0" title="Reset color">×</button>
  <span class="dae-tm-divider"></span>
  <button id="dae-tm-link" class="dae-tm-btn" title="Link (Cmd/Ctrl+K)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
  <button id="dae-tm-comment" class="dae-tm-btn" title="Comment on selection"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></button>
</div>

<div class="dae-toast" id="dae-toast" role="status" aria-live="polite"></div>

<!-- Autosave restore prompt — surfaced on load if localStorage has unsaved edits -->
<div class="dae-restore-prompt" id="dae-restore-prompt" role="dialog" aria-modal="false" aria-hidden="true">
  <span class="dae-restore-msg">Unsaved edits found from <span id="dae-restore-when">a moment ago</span>.</span>
  <button type="button" id="dae-restore-discard" class="dae-restore-secondary">Discard</button>
  <button type="button" id="dae-restore-apply" class="dae-restore-primary">Restore</button>
</div>

<!-- Comments side panel — slides in from right when toolbar's Comments button clicked -->
<aside class="dae-comments-panel" id="dae-comments-panel" aria-hidden="true" aria-label="Comments">
  <header class="dae-comments-header">
    <h3>Comments</h3>
    <button type="button" id="dae-comments-close" title="Close" aria-label="Close comments">×</button>
  </header>
  <div class="dae-comments-list" id="dae-comments-list"></div>
  <div class="dae-comments-empty" id="dae-comments-empty">
    <p>No comments yet.</p>
    <p class="dae-comments-empty-hint">Enter edit mode, select text, and click the <strong>💬</strong> button in the floating menu.</p>
  </div>
</aside>

<!-- Hyperlink editor modal -->
<div class="dae-link-modal" id="dae-link-modal" role="dialog" aria-modal="true" aria-label="Edit link">
  <div class="dae-link-modal-inner">
    <p class="dae-link-modal-label">URL</p>
    <input type="url" id="dae-link-url" placeholder="https://example.com or contact@safely-you.com" autocomplete="off" spellcheck="false">
    <label class="dae-link-modal-check">
      <input type="checkbox" id="dae-link-new-tab" checked>
      <span>Open in new tab</span>
    </label>
    <div class="dae-link-modal-actions">
      <button type="button" id="dae-link-remove" hidden>Remove link</button>
      <span class="dae-link-modal-spacer"></span>
      <button type="button" id="dae-link-cancel" class="dae-link-secondary">Cancel</button>
      <button type="button" id="dae-link-save" class="dae-link-primary">Save</button>
    </div>
  </div>
</div>

<input type="file" id="dae-photo-input" accept="image/*" style="display:none">

<!-- Block templates (cloned by the insert menu) -->
<template id="tpl-heading"><h2 data-editable>New heading.</h2></template>
<template id="tpl-paragraph"><p data-editable>New paragraph. Click to edit.</p></template>
<template id="tpl-pullquote"><div class="pullquote"><p class="pullquote-num" data-editable>00</p><p class="pullquote-text" data-editable>Pull quote. Click to edit.</p></div></template>
<template id="tpl-callout"><div class="tldr"><p class="tldr-label">Callout</p><p data-editable>Callout text. Click to edit.</p></div></template>
<template id="tpl-photo"><div class="dae-photo-block"><span class="dae-photo-wrap"><img class="inline-photo" data-editable-photo alt="New photo"></span><p class="photo-caption" data-editable>Photo caption.</p></div></template>
<template id="tpl-spacer"><div class="dae-spacer" aria-hidden="true"></div></template>
<template id="tpl-table"><div class="dae-table-block"><table class="dae-table"><thead><tr><th data-editable>Header 1</th><th data-editable>Header 2</th><th data-editable>Header 3</th></tr></thead><tbody><tr><td data-editable>Cell</td><td data-editable>Cell</td><td data-editable>Cell</td></tr><tr><td data-editable>Cell</td><td data-editable>Cell</td><td data-editable>Cell</td></tr></tbody></table><div class="dae-table-toolbar" aria-label="Table actions"><button type="button" data-table-action="row-below" title="Insert row below current">+ Row</button><button type="button" data-table-action="col-right" title="Insert column right of current">+ Col</button><button type="button" data-table-action="del-row" title="Delete current row">− Row</button><button type="button" data-table-action="del-col" title="Delete current column">− Col</button></div></div></template>
```

## Required CSS (inside the artifact's `<style>` block)

All chrome and swatches read from the `--dae-*` CSS variables (with sensible fallbacks baked in via `var(name, default)`). To theme the editor for your project, override these in your page's `:root` — see "Theming" below.

```css
/* Themed text colors (applied via toolbar swatches) */
.dae-color-1 { color: var(--dae-primary, #1a1a1a); }
.dae-color-2 { color: var(--dae-secondary, #4a4a4a); }
.dae-color-3 { color: var(--dae-accent, #0066cc); }
.dae-color-4 { color: var(--dae-warm, #cc3300); }

/* ──────────────── EDIT MODE v2.1 ──────────────── */

.dae-edit-toolbar { position: fixed; bottom: 24px; right: 24px; z-index: 100; display: flex; align-items: center; gap: 0; background: var(--dae-primary, #1a1a1a); border-radius: 999px; padding: 6px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.30); font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.dae-edit-toolbar button { appearance: none; border: 0; cursor: pointer; background: transparent; color: white; font-family: inherit; font-weight: 600; font-size: 13px; padding: 10px 14px; border-radius: 999px; transition: background 0.15s, color 0.15s; display: flex; align-items: center; gap: 6px; }
.dae-edit-toolbar button:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
.dae-edit-toolbar button:disabled { opacity: 0.35; cursor: not-allowed; }
.dae-edit-toolbar button.active { background: var(--dae-accent, #0066cc); color: white; }
.dae-edit-toolbar button.primary { background: var(--dae-warm, #cc3300); color: white; margin-left: 4px; }
.dae-edit-toolbar button.primary:hover { background: #E84A2A; }
.dae-edit-toolbar .dae-status { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: var(--dae-tint-2, #d8d8d8); padding: 0 12px 0 8px; letter-spacing: 0.04em; text-transform: uppercase; }
.dae-edit-toolbar .dae-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.18); margin: 0 4px; }

/* Text-color palette in the toolbar */
.dae-color-palette { display: none; align-items: center; gap: 4px; padding: 0 4px; }
body.dae-edit-mode .dae-color-palette { display: flex; }
.dae-color-swatch { width: 22px; height: 22px; border-radius: 4px; border: 2px solid transparent; cursor: pointer; padding: 0; appearance: none; transition: transform 0.1s, border-color 0.15s, box-shadow 0.15s; }
.dae-color-swatch:hover { transform: scale(1.15); border-color: rgba(255,255,255,0.6); box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
.dae-color-swatch.swatch-1 { background: var(--dae-primary, #1a1a1a); }
.dae-color-swatch.swatch-2 { background: var(--dae-secondary, #4a4a4a); }
.dae-color-swatch.swatch-3 { background: var(--dae-accent, #0066cc); }
.dae-color-swatch.swatch-4 { background: var(--dae-warm, #cc3300); }
.dae-color-reset { width: 22px; height: 22px; border-radius: 4px; background: transparent; border: 1.5px solid rgba(255,255,255,0.35); color: white; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 700; cursor: pointer; padding: 0; line-height: 1; appearance: none; transition: border-color 0.15s; }
.dae-color-reset:hover { border-color: white; }

/* Floating text-formatting menu — appears above selection in edit mode.
   Replaces the old in-toolbar format buttons + color palette + size + link.
   Pattern: Medium / Notion floating menu. Position calculated from
   selection's bounding rect in the JS. */
.dae-text-menu { display: none; position: absolute; z-index: 200; background: var(--dae-primary, #1a1a1a); border-radius: 999px; padding: 5px; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35); font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; align-items: center; gap: 2px; white-space: nowrap; }
.dae-text-menu.visible { display: inline-flex; }
.dae-text-menu::after { content: ""; position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%); border: 7px solid transparent; border-top-color: var(--dae-primary, #1a1a1a); border-bottom: 0; }
.dae-text-menu.below::after { top: -7px; bottom: auto; border-top: 0; border-bottom: 7px solid var(--dae-primary, #1a1a1a); }
.dae-tm-btn { width: 28px; height: 28px; border-radius: 999px; background: transparent; color: white; font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; border: 0; padding: 0; appearance: none; transition: background 0.15s; display: flex; align-items: center; justify-content: center; line-height: 1; }
.dae-tm-btn:hover { background: rgba(255,255,255,0.18); }
.dae-tm-btn.active { background: var(--dae-accent, #0066cc); color: white; }
.dae-tm-btn b { font-weight: 800; }
.dae-tm-btn i { font-style: italic; font-weight: 700; }
.dae-tm-btn u { text-decoration: underline; font-weight: 700; }
.dae-tm-color { width: 18px; height: 18px; border-radius: 999px; border: 1.5px solid transparent; cursor: pointer; padding: 0; appearance: none; transition: transform 0.1s, border-color 0.15s; }
.dae-tm-color:hover { transform: scale(1.15); border-color: rgba(255,255,255,0.6); }
.dae-tm-color.swatch-1 { background: var(--dae-primary, #1a1a1a); border-color: rgba(255,255,255,0.35); }
.dae-tm-color.swatch-2 { background: var(--dae-secondary, #4a4a4a); }
.dae-tm-color.swatch-3 { background: var(--dae-accent, #0066cc); }
.dae-tm-color.swatch-4 { background: var(--dae-warm, #cc3300); }
.dae-tm-color-reset { background: transparent; border: 1.5px solid rgba(255,255,255,0.35); color: white; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 700; line-height: 1; }
.dae-tm-color-reset:hover { border-color: white; }
.dae-tm-divider { width: 1px; height: 18px; background: rgba(255,255,255,0.18); margin: 0 3px; }

/* Theme-aware font sizes — relative (em) so they cascade inside any context */
.dae-size-xs  { font-size: 0.75em;  }
.dae-size-sm  { font-size: 0.875em; }
.dae-size-lg  { font-size: 1.25em;  }
.dae-size-xl  { font-size: 1.5em;   }
.dae-size-2xl { font-size: 2em;     }

/* Font-size popover — pattern matches dae-insert-menu */
.dae-size-menu { position: absolute; z-index: 200; background: white; border: 1.5px solid var(--dae-tint-2, #d8d8d8); border-radius: 10px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18); padding: 6px; min-width: 160px; font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.dae-size-menu button { appearance: none; border: 0; width: 100%; background: transparent; text-align: left; cursor: pointer; padding: 8px 12px; border-radius: 6px; font-family: inherit; font-weight: 600; font-size: 13px; color: var(--dae-primary, #1a1a1a); display: flex; align-items: baseline; gap: 10px; transition: background 0.12s; }
.dae-size-menu button:hover { background: var(--dae-tint-4, #f6f6f6); }
.dae-size-menu .size-sample { color: var(--dae-secondary, #4a4a4a); font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.dae-size-menu .size-label { flex: 1; }

/* Hyperlinks inside editable content — brand-aligned underline, subtle edit-mode tint */
[data-editable] a { color: var(--dae-secondary, #4a4a4a); text-decoration: underline; text-decoration-color: var(--dae-tint-1, #cce0ff); text-underline-offset: 3px; transition: text-decoration-color 0.15s, color 0.15s; }
[data-editable] a:hover { color: var(--dae-primary, #1a1a1a); text-decoration-color: var(--dae-accent, #0066cc); }
body.dae-edit-mode [data-editable] a { background: var(--dae-tint-4, #f6f6f6); padding: 0 3px; border-radius: 3px; }

/* Hyperlink editor modal */
.dae-link-modal { display: none; position: fixed; inset: 0; z-index: 300; background: rgba(0, 0, 0, 0.4); align-items: center; justify-content: center; padding: 20px; }
.dae-link-modal.open { display: flex; }
.dae-link-modal-inner { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); width: 100%; max-width: 460px; font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.dae-link-modal-label { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dae-secondary, #4a4a4a); margin: 0 0 8px; }
.dae-link-modal input[type="url"] { width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1.5px solid var(--dae-tint-2, #d8d8d8); border-radius: 8px; font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 15px; color: var(--dae-primary, #1a1a1a); outline: none; transition: border-color 0.15s; }
.dae-link-modal input[type="url"]:focus { border-color: var(--dae-accent, #0066cc); }
.dae-link-modal-check { display: flex; align-items: center; gap: 8px; margin: 14px 0 22px; font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; color: var(--dae-primary, #1a1a1a); cursor: pointer; user-select: none; }
.dae-link-modal-check input { width: 16px; height: 16px; accent-color: var(--dae-accent, #0066cc); cursor: pointer; margin: 0; }
.dae-link-modal-actions { display: flex; align-items: center; gap: 8px; }
.dae-link-modal-spacer { flex: 1; }
.dae-link-modal-actions button { appearance: none; cursor: pointer; font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-weight: 600; font-size: 13px; padding: 10px 18px; border-radius: 8px; transition: background 0.15s, color 0.15s, border-color 0.15s; }
.dae-link-primary { background: var(--dae-primary, #1a1a1a); color: white; border: 0; }
.dae-link-primary:hover { background: var(--dae-secondary, #4a4a4a); }
.dae-link-secondary { background: transparent; color: var(--dae-secondary, #4a4a4a); border: 1.5px solid var(--dae-tint-2, #d8d8d8); }
.dae-link-secondary:hover { border-color: var(--dae-accent, #0066cc); color: var(--dae-primary, #1a1a1a); }
#dae-link-remove { background: transparent; color: var(--dae-warm, #cc3300); border: 1.5px solid var(--dae-warm, #cc3300); }
#dae-link-remove:hover { background: var(--dae-warm, #cc3300); color: white; }
#dae-link-remove[hidden] { display: none; }

/* Editable highlights */
body.dae-edit-mode [data-editable] { outline: 1.5px dashed var(--dae-tint-1, #cce0ff); outline-offset: 4px; border-radius: 4px; transition: outline-color 0.15s, background 0.15s; cursor: text; }
body.dae-edit-mode [data-editable]:hover { outline-color: var(--dae-accent, #0066cc); }
body.dae-edit-mode [data-editable]:focus { outline: 2px solid var(--dae-accent, #0066cc); outline-offset: 4px; background: var(--dae-tint-4, #f6f6f6); }

/* Word-choice violation indicator */
body.dae-edit-mode [data-editable].dae-violation { outline-color: var(--dae-warm, #cc3300); }
body.dae-edit-mode [data-editable].dae-violation::after { content: "⚠ " attr(data-violation-msg); display: inline-block; margin-left: 8px; padding: 2px 8px; background: var(--dae-warm, #cc3300); color: white; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 4px; vertical-align: middle; }

/* Native aspect ratio — no forced crop. Portrait photos render tall,
   landscape photos render wide, both at whatever the source actually is.
   Resize variants (half/third) scale width AND height proportionally, so
   the photo's intrinsic framing is preserved at every size. editors
   can use the size toggle to shrink overly tall portraits. */
.inline-photo { width: 100%; height: auto; border-radius: 12px; margin: 24px 0 12px; display: block; }

/* Photo block (inline-photo + caption grouped). Size variants apply here. */
.dae-photo-block { display: block; transition: max-width 0.2s; }
.dae-photo-block.size-half { max-width: 50%; margin-left: auto; margin-right: auto; }
.dae-photo-block.size-third { max-width: 33%; margin-left: auto; margin-right: auto; }
.dae-photo-block.size-half .photo-caption,
.dae-photo-block.size-third .photo-caption { text-align: center; }

/* Photo overlays */
.dae-photo-wrap { display: block; position: relative; }
body.dae-edit-mode [data-editable-photo] { cursor: pointer; }
.dae-photo-overlay { position: absolute; inset: 0; border-radius: 12px; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: rgba(0, 0, 0, 0.55); color: white; font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.15s; }
.dae-photo-overlay:hover { background: rgba(0, 0, 0, 0.78); }
body.dae-edit-mode .dae-photo-wrap .dae-photo-overlay { display: flex; }
.dae-photo-replace-row { display: flex; align-items: center; gap: 8px; }
.dae-photo-replace-row .icon { font-size: 18px; }

/* Photo size toggle (only rendered for inline-photo) */
.dae-photo-size-toggle { display: flex; gap: 6px; }
.dae-photo-size-toggle button { appearance: none; border: 0; cursor: pointer; background: rgba(255,255,255,0.18); color: white; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 5px 12px; border-radius: 999px; transition: background 0.15s, transform 0.1s; }
.dae-photo-size-toggle button:hover { background: rgba(255,255,255,0.32); transform: scale(1.04); }
.dae-photo-size-toggle button.active { background: var(--dae-accent, #0066cc); }

/* ──────────────── EDIT MODE v2.4 — added in this version ──────────────── */

/* Photo reposition mode — drag the image to shift object-position */
body.dae-edit-mode [data-editable-photo].dae-reposition-mode { cursor: move; outline: 3px solid var(--dae-accent, #0066cc); outline-offset: 2px; user-select: none; -webkit-user-drag: none; }
.dae-photo-reposition-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.dae-photo-reposition-btn { appearance: none; border: 0; cursor: pointer; background: rgba(255,255,255,0.18); color: white; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 5px 12px; border-radius: 999px; transition: background 0.15s; }
.dae-photo-reposition-btn:hover { background: rgba(255,255,255,0.32); }
.dae-photo-reposition-btn.active { background: var(--dae-accent, #0066cc); }

/* Spacer block — fully resizable empty space (invisible in print + downloads) */
.dae-spacer { display: block; width: 100%; min-height: 16px; background: transparent; }
body.dae-edit-mode .dae-spacer { background: repeating-linear-gradient(45deg, var(--dae-tint-4, #f6f6f6), var(--dae-tint-4, #f6f6f6) 6px, transparent 6px, transparent 12px); border: 1.5px dashed var(--dae-tint-2, #d8d8d8); border-radius: 4px; min-height: 28px; position: relative; }
body.dae-edit-mode .dae-spacer::after { content: "Spacer · drag corner to resize"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; color: var(--dae-secondary, #4a4a4a); letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.5; pointer-events: none; }

/* Table block — inserted via insert menu. The wrapper <div class="dae-table-block"> holds
   the table + a tiny actions toolbar revealed via :focus-within when any cell is focused. */
.dae-table-block { display: block; }
.dae-table { width: 100%; border-collapse: collapse; margin: 0; }
.dae-table th, .dae-table td { padding: 8px 12px; border: 1px solid var(--dae-tint-2, #d8d8d8); text-align: left; vertical-align: top; font-size: 14px; line-height: 1.45; }
.dae-table thead { background: var(--dae-tint-4, #f6f6f6); }
.dae-table thead th { font-weight: 700; color: var(--dae-primary, #1a1a1a); }
.dae-table td { color: var(--dae-fg, #1a1a1a); }
.dae-table-toolbar { display: none; gap: 4px; margin-top: 6px; font-family: ui-sans-serif, system-ui, sans-serif; }
body.dae-edit-mode .dae-table-block:focus-within > .dae-table-toolbar { display: inline-flex; }
.dae-table-toolbar button { appearance: none; border: 1.5px solid var(--dae-tint-2, #d8d8d8); background: white; color: var(--dae-secondary, #4a4a4a); font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; cursor: pointer; transition: border-color 0.15s, color 0.15s; }
.dae-table-toolbar button:hover { border-color: var(--dae-accent, #0066cc); color: var(--dae-accent, #0066cc); }
body.dae-pdf-export-mode .dae-table-toolbar,
body.dae-present-mode .dae-table-toolbar { display: none !important; }
@media print { .dae-table-toolbar { display: none !important; } }

/* PDF-export mode — applied by the Save-as-PDF button while html2pdf
   captures the page. Hides all edit-mode chrome the same way @media print
   does, but works for the html2canvas DOM-to-canvas capture too. */
body.dae-pdf-export-mode .dae-edit-toolbar,
body.dae-pdf-export-mode .dae-text-menu,
body.dae-pdf-export-mode .dae-photo-overlay,
body.dae-pdf-export-mode .dae-toast,
body.dae-pdf-export-mode .dae-block-controls,
body.dae-pdf-export-mode .dae-add-block-btn,
body.dae-pdf-export-mode .dae-insert-menu,
body.dae-pdf-export-mode .dae-link-modal,
body.dae-pdf-export-mode .dae-size-menu,
body.dae-pdf-export-mode .dae-style-menu,
body.dae-pdf-export-mode .dae-restore-prompt,
body.dae-pdf-export-mode .dae-versions-menu { display: none !important; }
body.dae-pdf-export-mode .dae-spacer { background: transparent !important; border: 0 !important; }
body.dae-pdf-export-mode .dae-spacer::after { display: none !important; }
body.dae-pdf-export-mode .dae-sortable-block { resize: none !important; overflow: visible !important; }

/* Free-resize: every editable block becomes corner-draggable in edit mode */
body.dae-edit-mode .dae-sortable-block { resize: both; overflow: auto; min-width: 120px; min-height: 36px; }
/* Brand-styled webkit resizer handle (Chrome, Safari, Edge) */
body.dae-edit-mode .dae-sortable-block::-webkit-resizer { background-image: linear-gradient(135deg, transparent 0%, transparent 45%, var(--dae-accent, #0066cc) 45%, var(--dae-accent, #0066cc) 100%); border-radius: 0 0 6px 0; }
/* Spacer blocks need the resize to show even without text content — explicit min size */
body.dae-edit-mode .dae-spacer.dae-sortable-block { min-height: 28px; }

/* Block controls (drag | + insert | × delete) */
body.dae-edit-mode .dae-sortable-block { position: relative; }
.dae-block-controls { position: absolute; top: -14px; right: 0; display: flex; gap: 4px; pointer-events: none; opacity: 0; transition: opacity 0.15s; z-index: 5; }
body.dae-edit-mode .dae-sortable-block:hover > .dae-block-controls { opacity: 1; }
.dae-block-controls > * { pointer-events: auto; }
.dae-block-controls button { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 0; appearance: none; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18); transition: background 0.15s, transform 0.15s; color: white; font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-weight: 700; font-size: 14px; line-height: 1; padding: 0; }
.dae-block-controls .dae-drag { background: var(--dae-primary, #1a1a1a); cursor: grab; }
.dae-block-controls .dae-drag:active { cursor: grabbing; }
.dae-block-controls .dae-drag:hover { background: var(--dae-accent, #0066cc); }
.dae-block-controls .dae-insert { background: var(--dae-accent, #0066cc); }
.dae-block-controls .dae-insert:hover { background: var(--dae-primary, #1a1a1a); }
.dae-block-controls .dae-style { background: var(--dae-secondary, #4a4a4a); }
.dae-block-controls .dae-style:hover { background: var(--dae-primary, #1a1a1a); }
.dae-block-controls .dae-delete { background: var(--dae-warm, #cc3300); }
.dae-block-controls .dae-delete:hover { background: #E84A2A; transform: scale(1.08); }

/* Block-style popover — opened by the ↔ button on each block */
.dae-style-menu { position: absolute; z-index: 200; background: white; border: 1.5px solid var(--dae-tint-2, #d8d8d8); border-radius: 10px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18); padding: 6px; min-width: 180px; font-family: ui-sans-serif, system-ui, sans-serif; }
.dae-style-menu button { appearance: none; border: 0; width: 100%; background: transparent; text-align: left; cursor: pointer; padding: 8px 10px; border-radius: 6px; font-family: inherit; font-weight: 600; font-size: 13px; color: var(--dae-primary, #1a1a1a); display: flex; align-items: center; gap: 10px; transition: background 0.12s; }
.dae-style-menu button:hover { background: var(--dae-tint-4, #f6f6f6); }
.dae-style-menu .menu-icon { flex: 0 0 24px; height: 24px; border-radius: 4px; background: var(--dae-tint-3, #ececec); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: var(--dae-primary, #1a1a1a); }
.dae-style-menu .menu-label { flex: 1; }

/* End-of-container "+ Add block" button */
.dae-add-block-btn { display: none; width: 100%; margin: 16px 0 0; padding: 12px 16px; background: transparent; border: 1.5px dashed var(--dae-tint-2, #d8d8d8); border-radius: 8px; color: var(--dae-secondary, #4a4a4a); font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.15s; }
body.dae-edit-mode .dae-add-block-btn { display: block; }
.dae-add-block-btn:hover, .dae-add-block-btn.open { border-color: var(--dae-accent, #0066cc); background: var(--dae-tint-4, #f6f6f6); color: var(--dae-primary, #1a1a1a); border-style: solid; }

/* Sortable.js drag state */
.sortable-ghost { opacity: 0.4; }
.sortable-chosen > * { pointer-events: none; }
.sortable-drag { box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25); border-radius: 8px; }

/* Insert menu popover */
.dae-insert-menu { position: absolute; z-index: 200; background: white; border: 1.5px solid var(--dae-tint-2, #d8d8d8); border-radius: 12px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18); padding: 6px; min-width: 240px; font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.dae-insert-menu button { appearance: none; border: 0; width: 100%; background: transparent; text-align: left; cursor: pointer; padding: 10px 14px; border-radius: 8px; font-family: inherit; font-weight: 600; font-size: 14px; color: var(--dae-primary, #1a1a1a); display: flex; align-items: center; gap: 12px; transition: background 0.12s; }
.dae-insert-menu button:hover { background: var(--dae-tint-4, #f6f6f6); }
.dae-insert-menu .menu-icon { flex: 0 0 28px; height: 28px; border-radius: 6px; background: var(--dae-tint-3, #ececec); display: flex; align-items: center; justify-content: center; color: var(--dae-primary, #1a1a1a); font-weight: 700; }
.dae-insert-menu .menu-label { flex: 1; }
.dae-insert-menu .menu-hint { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; font-weight: 400; color: var(--dae-secondary, #4a4a4a); letter-spacing: 0.04em; text-transform: uppercase; }
.dae-insert-menu .menu-header { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; font-weight: 700; color: var(--dae-secondary, #4a4a4a); letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 14px 4px; margin: 0; }
.dae-insert-menu .menu-divider { height: 1px; background: var(--dae-tint-2, #d8d8d8); margin: 6px 8px; }
.dae-insert-menu .menu-pop-out .menu-icon { background: var(--dae-warm, #cc3300); color: white; }

.dae-toast { position: fixed; bottom: 84px; right: 24px; z-index: 101; background: var(--dae-primary, #1a1a1a); color: white; font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; padding: 12px 18px; border-radius: 8px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25); opacity: 0; transform: translateY(8px); transition: opacity 0.2s, transform 0.2s; pointer-events: none; }
.dae-toast.show { opacity: 1; transform: translateY(0); }

/* Autosave restore prompt — top-center banner that stays until user clicks */
.dae-restore-prompt { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 102; display: none; align-items: center; gap: 12px; background: var(--dae-primary, #1a1a1a); color: white; font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; padding: 10px 14px 10px 18px; border-radius: 999px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.30); }
.dae-restore-prompt.show { display: inline-flex; }
.dae-restore-msg { padding: 0 4px; }
.dae-restore-msg #dae-restore-when { color: var(--dae-tint-2, #d8d8d8); font-weight: 600; }
.dae-restore-prompt button { appearance: none; border: 0; cursor: pointer; font-family: inherit; font-weight: 600; font-size: 12px; padding: 7px 14px; border-radius: 999px; transition: background 0.15s, border-color 0.15s, color 0.15s; }
.dae-restore-primary { background: var(--dae-warm, #cc3300); color: white; }
.dae-restore-primary:hover { background: #E84A2A; }
.dae-restore-secondary { background: transparent; color: var(--dae-tint-2, #d8d8d8); border: 1.5px solid rgba(255,255,255,0.25); }
.dae-restore-secondary:hover { border-color: white; color: white; }

/* Versions popover — same visual pattern as dae-size-menu / dae-insert-menu */
.dae-versions-menu { position: absolute; z-index: 200; background: white; border: 1.5px solid var(--dae-tint-2, #d8d8d8); border-radius: 10px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18); padding: 6px; min-width: 240px; font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.dae-versions-menu .v-header { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; font-weight: 700; color: var(--dae-secondary, #4a4a4a); letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 12px 4px; margin: 0; }
.dae-versions-menu button { appearance: none; border: 0; width: 100%; background: transparent; text-align: left; cursor: pointer; padding: 8px 12px; border-radius: 6px; font-family: inherit; font-weight: 600; font-size: 13px; color: var(--dae-primary, #1a1a1a); display: flex; align-items: baseline; gap: 10px; transition: background 0.12s; }
.dae-versions-menu button:hover { background: var(--dae-tint-4, #f6f6f6); }
.dae-versions-menu .v-when { flex: 1; }
.dae-versions-menu .v-ts { color: var(--dae-secondary, #4a4a4a); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; }
.dae-versions-menu .v-empty { padding: 14px 12px; color: var(--dae-secondary, #4a4a4a); font-size: 12px; font-style: italic; margin: 0; }

/* Present mode — fullscreen viewer with all edit chrome hidden, dark frame around the doc.
   Triggered by toolbar Present button. Esc or browser fullscreen-exit cleans up. */
body.dae-present-mode { background: #0a0f10 !important; overflow: auto; }
body.dae-present-mode .dae-edit-toolbar,
body.dae-present-mode .dae-text-menu,
body.dae-present-mode .dae-photo-overlay,
body.dae-present-mode .dae-toast,
body.dae-present-mode .dae-block-controls,
body.dae-present-mode .dae-add-block-btn,
body.dae-present-mode .dae-insert-menu,
body.dae-present-mode .dae-link-modal,
body.dae-present-mode .dae-size-menu,
body.dae-present-mode .dae-style-menu,
body.dae-present-mode .dae-restore-prompt,
body.dae-present-mode .dae-versions-menu { display: none !important; }
body.dae-present-mode [data-pdf-root] { box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6) !important; }
body.dae-present-mode [data-editable] { outline: none !important; background: transparent !important; cursor: default !important; }
body.dae-present-mode .dae-spacer { background: transparent !important; border: 0 !important; }
body.dae-present-mode .dae-spacer::after { display: none !important; }
body.dae-present-mode .dae-sortable-block { resize: none !important; overflow: visible !important; }

.dae-present-hint { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 1000; background: rgba(0, 0, 0, 0.70); color: white; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; letter-spacing: 0.10em; text-transform: uppercase; padding: 8px 16px; border-radius: 999px; pointer-events: none; opacity: 0; transition: opacity 0.3s; }
.dae-present-hint.show { opacity: 1; }

/* ── Comments ─────────────────────────────────────────────────────────
   Round-trip review layer. Comments anchor to text via wrapping spans
   (.dae-comment-anchor[data-comment-id="..."]). Data lives in a hidden
   <template id="dae-comments-data"> inside the [data-pdf-root] so it
   survives autosave snapshots and HTML download round-trips. */

.dae-comment-anchor {
  background: rgba(252, 211, 77, 0.35);
  border-bottom: 1.5px dotted #f59e0b;
  cursor: pointer;
  transition: background 0.15s;
}
.dae-comment-anchor:hover { background: rgba(252, 211, 77, 0.55); }
.dae-comment-anchor.resolved { background: transparent; border-bottom-color: rgba(245, 158, 11, 0.2); }
.dae-comment-anchor.active { background: rgba(252, 211, 77, 0.7); outline: 2px solid #f59e0b; outline-offset: 2px; border-radius: 2px; }

.dae-comments-badge {
  display: inline-block;
  background: #f59e0b;
  color: white;
  font-size: 10px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  padding: 1px 6px;
  border-radius: 999px;
  margin-left: 4px;
  min-width: 16px;
  text-align: center;
}
.dae-comments-badge:empty,
.dae-comments-badge[data-count="0"] { display: none; }

.dae-comments-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 360px;
  z-index: 200;
  background: white;
  border-left: 1.5px solid var(--dae-tint-2, #d8d8d8);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.12);
  display: none;
  flex-direction: column;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}
.dae-comments-panel.open { display: flex; }
.dae-comments-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1.5px solid var(--dae-tint-2, #d8d8d8); }
.dae-comments-header h3 { margin: 0; font-size: 15px; font-weight: 700; color: var(--dae-primary, #1a1a1a); letter-spacing: 0.02em; }
#dae-comments-close { appearance: none; background: transparent; border: 0; cursor: pointer; font-size: 24px; line-height: 1; color: var(--dae-secondary, #4a4a4a); padding: 4px 10px; border-radius: 6px; }
#dae-comments-close:hover { background: var(--dae-tint-4, #f6f6f6); color: var(--dae-primary, #1a1a1a); }

.dae-comments-list { flex: 1; overflow-y: auto; padding: 16px 16px 32px; }
.dae-comments-empty { padding: 32px 24px; text-align: center; color: var(--dae-secondary, #4a4a4a); font-size: 13px; line-height: 1.55; }
.dae-comments-empty p { margin: 0 0 8px; }
.dae-comments-empty-hint { font-size: 12px; opacity: 0.8; }

.dae-comment-card { background: white; border: 1.5px solid var(--dae-tint-2, #d8d8d8); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; transition: border-color 0.15s; cursor: pointer; }
.dae-comment-card:hover { border-color: var(--dae-tint-1, #cce0ff); }
.dae-comment-card.active { border-color: #f59e0b; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15); }
.dae-comment-card.resolved { opacity: 0.55; background: var(--dae-tint-4, #f6f6f6); }

.dae-comment-anchor-preview { font-size: 11px; color: var(--dae-secondary, #4a4a4a); font-style: italic; padding: 4px 8px; background: rgba(252, 211, 77, 0.18); border-left: 2px solid #f59e0b; border-radius: 2px; margin: 0 0 8px; line-height: 1.4; word-wrap: break-word; }
.dae-comment-card.resolved .dae-comment-anchor-preview { background: var(--dae-tint-3, #ececec); border-left-color: var(--dae-tint-2, #d8d8d8); }

.dae-comment-meta { display: flex; justify-content: space-between; align-items: baseline; font-size: 12px; margin: 0 0 6px; }
.dae-comment-author { font-weight: 700; color: var(--dae-primary, #1a1a1a); }
.dae-comment-time { color: var(--dae-secondary, #4a4a4a); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; letter-spacing: 0.02em; }

.dae-comment-body { font-size: 13px; line-height: 1.5; color: var(--dae-fg, #1a1a1a); margin: 0 0 10px; white-space: pre-wrap; word-wrap: break-word; }
.dae-comment-body:empty::before { content: "(empty)"; color: var(--dae-secondary, #4a4a4a); font-style: italic; }

.dae-comment-actions { display: flex; gap: 6px; }
.dae-comment-actions button { appearance: none; border: 1px solid var(--dae-tint-2, #d8d8d8); background: transparent; color: var(--dae-secondary, #4a4a4a); font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 4px; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.dae-comment-actions button:hover { border-color: var(--dae-accent, #0066cc); color: var(--dae-accent, #0066cc); }
.dae-comment-actions button.danger:hover { border-color: var(--dae-warm, #cc3300); color: var(--dae-warm, #cc3300); }

.dae-comment-edit { width: 100%; box-sizing: border-box; border: 1.5px solid var(--dae-tint-2, #d8d8d8); border-radius: 6px; padding: 8px 10px; font-family: inherit; font-size: 13px; line-height: 1.45; color: var(--dae-fg, #1a1a1a); resize: vertical; min-height: 60px; margin: 0 0 8px; outline: none; transition: border-color 0.15s; }
.dae-comment-edit:focus { border-color: var(--dae-accent, #0066cc); }

.dae-comment-edit-actions { display: flex; gap: 6px; justify-content: flex-end; }
.dae-comment-edit-actions button { appearance: none; cursor: pointer; font-family: inherit; font-weight: 600; font-size: 12px; padding: 6px 14px; border-radius: 6px; border: 1.5px solid transparent; transition: all 0.15s; }
.dae-comment-edit-actions .post { background: var(--dae-primary, #1a1a1a); color: white; border-color: var(--dae-primary, #1a1a1a); }
.dae-comment-edit-actions .post:hover { background: var(--dae-accent, #0066cc); border-color: var(--dae-accent, #0066cc); }
.dae-comment-edit-actions .cancel { background: transparent; color: var(--dae-secondary, #4a4a4a); border-color: var(--dae-tint-2, #d8d8d8); }
.dae-comment-edit-actions .cancel:hover { color: var(--dae-primary, #1a1a1a); }

/* Hide all comment chrome in PDF / present / print */
body.dae-pdf-export-mode .dae-comments-panel,
body.dae-present-mode .dae-comments-panel { display: none !important; }
body.dae-pdf-export-mode .dae-comment-anchor,
body.dae-present-mode .dae-comment-anchor { background: transparent !important; border-bottom: 0 !important; }
@media print {
  .dae-comments-panel, .dae-comments-badge { display: none !important; }
  .dae-comment-anchor { background: transparent !important; border-bottom: 0 !important; }
}

@media print {
  .dae-edit-toolbar, .dae-text-menu, .dae-photo-overlay, .dae-toast, .dae-block-controls, .dae-add-block-btn, .dae-insert-menu, .dae-link-modal, .dae-size-menu, .dae-style-menu, .dae-restore-prompt, .dae-versions-menu, .dae-present-hint { display: none !important; }
  /* Spacer keeps its layout reservation in print (so spacing carries to PDF) but loses the dashed-pattern fill */
  .dae-spacer { background: transparent !important; border: 0 !important; }
  .dae-spacer::after { display: none !important; }
}
```

## Required JS (single `<script>` block, runs after the Sortable.js inline)

Uses `createElement` + `textContent` + cloned DOM nodes — no string-to-HTML conversions, no DOMPurify dependency. Drag origin is captured at `onStart` (correct undo anchor). Highlight unwrap preserves nested formatting. Cancelled photo inserts auto-clean. A MutationObserver auto-wires controls on any new block added through any mutation path.

```javascript
(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const body = document.body;
  const els = {
    status: $('#dae-status'),
    toggleBtn: $('#dae-toggle-edit'),
    undoBtn: $('#dae-undo'),
    versionsBtn: $('#dae-versions'),
    downloadBtn: $('#dae-download'),
    savePdfBtn: $('#dae-save-pdf'),
    photoInput: $('#dae-photo-input'),
    toast: $('#dae-toast'),
    restorePrompt: $('#dae-restore-prompt'),
    restoreWhen: $('#dae-restore-when'),
    restoreApply: $('#dae-restore-apply'),
    restoreDiscard: $('#dae-restore-discard'),
  };

  let editMode = false;
  let activePhoto = null;
  let pendingPhotoBlock = null;
  let activeMenu = null;
  let activeMenuTrigger = null;
  let sortableInstances = [];
  let containerObservers = [];
  let dragOrigin = null;
  const undoStack = [];
  const MAX_UNDO = 50;

  const SORTABLE_CONTAINER = '.dae-sortable-container';

  // Word-choice lint patterns. Empty by default — fill with your own
  // banned-word rules if you want the editor to flag style violations
  // as the user types. Each entry is { pattern: RegExp, msg: string }.
  // The element gets outlined and the msg is shown on hover.
  const VIOLATIONS = [];

  const MENU_ITEMS = [
    { id: 'heading', label: 'Heading', icon: 'H', hint: 'h2' },
    { id: 'paragraph', label: 'Paragraph', icon: '¶', hint: 'body copy' },
    { id: 'pullquote', label: 'Pull quote', icon: '"', hint: 'big number + line' },
    { id: 'callout', label: 'Callout box', icon: '⚡', hint: 'pale teal block' },
    { id: 'table', label: 'Table', icon: '⊞', hint: '3 × 2 to start' },
    { id: 'photo', label: 'Photo + caption', icon: '◧', hint: 'image + caption' },
    { id: 'spacer', label: 'Spacer', icon: '⇕', hint: 'resizable blank space' },
  ];

  // Toast
  let toastTimer;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2800);
  }

  // Undo stack
  function pushUndo(action, data) {
    undoStack.push({ action, data });
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    els.undoBtn.disabled = false;
  }

  function undo() {
    const entry = undoStack.pop();
    if (!entry) return;
    const { action, data } = entry;
    if (action === 'photo-replace') {
      data.target.src = data.prevSrc;
    } else if (action === 'delete') {
      const restored = data.node;
      if (restored && data.parent.isConnected) {
        if (data.before && data.before.isConnected) data.parent.insertBefore(restored, data.before);
        else data.parent.appendChild(restored);
        // MutationObserver re-attaches controls and overlays via setupBlock
      }
    } else if (action === 'insert') {
      if (data.inserted && data.inserted.isConnected) data.inserted.remove();
    } else if (action === 'style-change') {
      if (data.replacement && data.replacement.isConnected && data.parent && data.parent.isConnected) {
        data.parent.replaceChild(data.previous, data.replacement);
        setupBlock(data.previous);
      }
    } else if (action === 'reorder') {
      if (data.item && data.parent && data.parent.isConnected) {
        if (data.before && data.before.isConnected) data.parent.insertBefore(data.item, data.before);
        else data.parent.appendChild(data.item);
      }
    }
    if (undoStack.length === 0) els.undoBtn.disabled = true;
    toast('Undone.');
  }
  els.undoBtn.addEventListener('click', undo);

  // Word-choice lint
  function lintViolation(el) {
    const text = el.textContent || '';
    for (const v of VIOLATIONS) {
      if (v.pattern.test(text)) {
        el.classList.add('dae-violation');
        el.setAttribute('data-violation-msg', v.msg);
        return;
      }
    }
    el.classList.remove('dae-violation');
    el.removeAttribute('data-violation-msg');
  }
  document.addEventListener('blur', (e) => {
    if (editMode && e.target.matches && e.target.matches('[data-editable]')) {
      lintViolation(e.target);
    }
  }, true);

  // Editable text toggle
  function applyEditable(on) {
    $$('[data-editable]').forEach(el => {
      if (on) {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'true');
      } else {
        el.removeAttribute('contenteditable');
        el.removeAttribute('spellcheck');
        el.classList.remove('dae-violation');
        el.removeAttribute('data-violation-msg');
      }
    });
  }

  // Photo overlays + compression on import
  const PHOTO_SIZES = [
    { id: 'full', label: 'Full' },
    { id: 'half', label: 'Half' },
    { id: 'third', label: 'Third' },
  ];

  function makeSizeToggle(photoBlock) {
    const toggle = document.createElement('div');
    toggle.className = 'dae-photo-size-toggle';
    const current = photoBlock.classList.contains('size-third') ? 'third'
      : photoBlock.classList.contains('size-half') ? 'half' : 'full';
    PHOTO_SIZES.forEach(size => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.size = size.id;
      btn.textContent = size.label;
      if (size.id === current) btn.classList.add('active');
      btn.addEventListener('mousedown', (e) => e.preventDefault());
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        photoBlock.classList.remove('size-half', 'size-third');
        if (size.id !== 'full') photoBlock.classList.add('size-' + size.id);
        toggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      toggle.appendChild(btn);
    });
    return toggle;
  }

  // Photo reposition mode — drag the image to shift object-position
  function makeRepositionButton(photo) {
    const row = document.createElement('div');
    row.className = 'dae-photo-reposition-row';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dae-photo-reposition-btn';
    btn.textContent = 'Reposition';
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!editMode) return;
      enterRepositionMode(photo);
    });
    row.appendChild(btn);
    return row;
  }

  function parseObjectPosition(img) {
    const v = (img.style.objectPosition || '').trim();
    if (!v) return { x: 50, y: 50 };
    const parts = v.split(/\s+/);
    const px = parts[0] ? parseFloat(parts[0]) : 50;
    const py = parts[1] ? parseFloat(parts[1]) : 50;
    return { x: isNaN(px) ? 50 : px, y: isNaN(py) ? 50 : py };
  }

  function enterRepositionMode(img) {
    img.classList.add('dae-reposition-mode');
    const wrap = img.closest('.dae-photo-wrap');
    const overlay = wrap && wrap.querySelector('.dae-photo-overlay');
    if (overlay) overlay.style.display = 'none';

    let isDragging = false;
    let startX = 0, startY = 0;
    let startPos = parseObjectPosition(img);

    const onMouseDown = (e) => {
      e.preventDefault();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startPos = parseObjectPosition(img);
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const rect = img.getBoundingClientRect();
      const dx = (e.clientX - startX) / rect.width * 100;
      const dy = (e.clientY - startY) / rect.height * 100;
      // Dragging right reveals more of the LEFT side of the source image,
      // which means object-position-x should DECREASE.
      const nx = Math.max(0, Math.min(100, startPos.x - dx));
      const ny = Math.max(0, Math.min(100, startPos.y - dy));
      img.style.objectPosition = nx.toFixed(1) + '% ' + ny.toFixed(1) + '%';
    };
    const onMouseUp = () => { isDragging = false; };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        exitRepositionMode(img);
      }
    };

    img.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKey);
    img._syRepositionCleanup = () => {
      img.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keydown', onKey);
    };
    toast('Drag the photo to reposition. Press Esc when done.');
  }

  function exitRepositionMode(img) {
    img.classList.remove('dae-reposition-mode');
    const wrap = img.closest('.dae-photo-wrap');
    const overlay = wrap && wrap.querySelector('.dae-photo-overlay');
    if (overlay) overlay.style.display = '';
    if (img._syRepositionCleanup) {
      img._syRepositionCleanup();
      delete img._syRepositionCleanup;
    }
    toast('Photo position locked.');
  }

  function attachPhotoOverlay(photo) {
    const wrap = photo.closest('.dae-photo-wrap');
    if (!wrap || wrap.querySelector('.dae-photo-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'dae-photo-overlay';
    // Size toggle (inline-photo only — hero/cta photos are layout-locked)
    const photoBlock = photo.closest('.dae-photo-block');
    if (photo.classList.contains('inline-photo') && photoBlock) {
      overlay.appendChild(makeSizeToggle(photoBlock));
    }
    // Reposition button — works on all photos with object-fit
    overlay.appendChild(makeRepositionButton(photo));
    const replaceRow = document.createElement('div');
    replaceRow.className = 'dae-photo-replace-row';
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = '⇄';
    const label = document.createElement('span');
    label.textContent = 'Replace photo';
    replaceRow.appendChild(icon);
    replaceRow.appendChild(label);
    overlay.appendChild(replaceRow);
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!editMode) return;
      activePhoto = photo;
      els.photoInput.click();
    });
    wrap.appendChild(overlay);
  }
  function refreshPhotoOverlays() {
    $$('[data-editable-photo]').forEach(attachPhotoOverlay);
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read failed'));
      reader.onload = (ev) => {
        const img = new Image();
        img.onerror = () => reject(new Error('decode failed'));
        img.onload = () => {
          const maxW = 2048;
          let w = img.naturalWidth, h = img.naturalHeight;
          if (w > maxW) { h = h * (maxW / w); w = maxW; }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            const r = new FileReader();
            r.onload = (e) => resolve(e.target.result);
            r.readAsDataURL(blob);
          }, 'image/jpeg', 0.85);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function cancelPendingPhotoInsert() {
    if (!pendingPhotoBlock) return;
    if (pendingPhotoBlock.isConnected) pendingPhotoBlock.remove();
    if (undoStack.length && undoStack[undoStack.length - 1].action === 'insert'
        && undoStack[undoStack.length - 1].data.inserted === pendingPhotoBlock) {
      undoStack.pop();
      if (undoStack.length === 0) els.undoBtn.disabled = true;
    }
    pendingPhotoBlock = null;
  }

  els.photoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
      cancelPendingPhotoInsert();
      activePhoto = null;
      return;
    }
    // Guard against the picker resolving after a DOM swap (restore, undo)
    // that detached the target img. Without this, src= would set on a
    // garbage-eligible node and silently no-op.
    if (!activePhoto || !activePhoto.isConnected) {
      activePhoto = null;
      els.photoInput.value = '';
      return;
    }
    pushUndo('photo-replace', { target: activePhoto, prevSrc: activePhoto.src });
    toast('Compressing photo…');
    try {
      activePhoto.src = await compressImage(file);
      toast('Photo replaced. Click Download to save.');
    } catch (err) {
      toast('Photo replace failed.');
    }
    activePhoto = null;
    pendingPhotoBlock = null;
    els.photoInput.value = '';
  });
  els.photoInput.addEventListener('cancel', () => {
    cancelPendingPhotoInsert();
    activePhoto = null;
  });

  // Block controls (drag | + insert | × delete)
  function makeControlButton(cls, glyph, title, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cls;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.textContent = glyph;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    });
    return btn;
  }

  function attachBlockControls(block) {
    if (block.dataset.daeControls === '1') return;
    block.classList.add('dae-sortable-block');
    const controls = document.createElement('div');
    controls.className = 'dae-block-controls';
    controls.appendChild(makeControlButton('dae-drag', '≡', 'Drag to reorder', () => {}));
    controls.appendChild(makeControlButton('dae-insert', '+', 'Insert block below', (e) => {
      openInsertMenu(e.currentTarget, block.parentElement, indexOfBlock(block) + 1);
    }));
    if (isStylableBlock(block)) {
      controls.appendChild(makeControlButton('dae-style', '↔', 'Change block style (heading / paragraph / quote / callout)', (e) => {
        openStyleMenu(e.currentTarget, block);
      }));
    }
    controls.appendChild(makeControlButton('dae-delete', '×', 'Delete block', () => deleteBlock(block)));
    block.appendChild(controls);
    block.dataset.daeControls = '1';
  }

  function indexOfBlock(block) {
    const children = [...block.parentElement.children].filter(c => !c.classList.contains('dae-add-block-btn'));
    return children.indexOf(block);
  }

  // ── Block style transformer (heading ↔ paragraph ↔ pullquote ↔ callout) ─
  // Turns one text block into another type without losing content. Source's
  // primary editable element's children move to the target's primary slot,
  // so inline formatting (B/I/U/links/colors), comment anchors, and any
  // other DOM state on the text all survive.
  //
  // Only offered for blocks that have a clean text mapping — skipped for
  // photos, tables, spacers (no sane text-to-text mapping exists).

  const STYLE_OPTIONS = [
    { id: 'heading',   label: 'Heading',     icon: 'H',  primarySelector: 'h2' },
    { id: 'paragraph', label: 'Paragraph',   icon: '¶',  primarySelector: 'p' },
    { id: 'pullquote', label: 'Pull quote',  icon: '"',  primarySelector: '.pullquote-text' },
    { id: 'callout',   label: 'Callout box', icon: '⚡', primarySelector: '.tldr > p:not(.tldr-label)' },
  ];

  function isStylableBlock(block) {
    // Skip photos, tables, spacers — they have no text-block analog.
    if (!block || !block.querySelector) return false;
    if (block.querySelector('[data-editable-photo]')) return false;
    if (block.classList.contains('dae-spacer')) return false;
    if (block.classList.contains('dae-table-block')) return false;
    // Block must have at least one editable text region to convert.
    return !!block.querySelector('[data-editable]') || (block.matches && block.matches('[data-editable]'));
  }

  function findPrimaryEditableEl(block) {
    // The element whose CONTENTS we'll move to the target. Strategy: longest
    // text wins. For single-editable blocks this is trivially the only one;
    // for compound blocks (pullquote with num + text) we want the text body.
    const candidates = [];
    if (block.matches && block.matches('[data-editable]')) candidates.push(block);
    block.querySelectorAll('[data-editable]').forEach(el => candidates.push(el));
    if (candidates.length === 0) return null;
    let best = candidates[0];
    for (const c of candidates) {
      if (c.textContent.length > best.textContent.length) best = c;
    }
    return best;
  }

  function convertBlockStyle(block, targetId) {
    const opt = STYLE_OPTIONS.find(o => o.id === targetId);
    if (!opt) return;
    if (!isStylableBlock(block)) {
      toast('This block type can\'t change style.');
      return;
    }
    const tpl = document.querySelector('#tpl-' + opt.id);
    if (!tpl) return;

    const sourceEl = findPrimaryEditableEl(block);
    if (!sourceEl) return;

    // Snapshot for undo BEFORE we mutate the source. Strip edit chrome
    // (controls divs, photo overlays, the class+dataset flags) so setupBlock
    // can re-wire from a clean state on undo.
    const undoClone = block.cloneNode(true);
    undoClone.querySelectorAll('.dae-block-controls, .dae-photo-overlay').forEach(el => el.remove());
    undoClone.classList.remove('dae-sortable-block');
    delete undoClone.dataset.daeControls;

    // Build the replacement block from the template.
    const fragment = tpl.content.cloneNode(true);
    const newBlock = fragment.firstElementChild;
    if (!newBlock) return;
    // When the template's primarySelector matches the root itself (e.g. a
    // <h2> template where the h2 IS the block), querySelector won't return
    // self — fall back to newBlock.
    const primary = newBlock.querySelector(opt.primarySelector) ||
                    (newBlock.matches && newBlock.matches(opt.primarySelector) ? newBlock : newBlock);

    // Move child nodes — but skip edit chrome that may have been appended to
    // sourceEl when sourceEl IS the block (heading/paragraph case). Without
    // this filter, the controls div would get yanked into the new block's
    // primary slot, then setupBlock would add a SECOND controls div.
    const nodesToMove = [...sourceEl.childNodes].filter(n => {
      if (n.nodeType !== 1) return true; // text nodes always move
      return !n.classList || (!n.classList.contains('dae-block-controls') &&
                              !n.classList.contains('dae-photo-overlay'));
    });
    while (primary.firstChild) primary.removeChild(primary.firstChild);
    for (const n of nodesToMove) primary.appendChild(n);

    const parent = block.parentElement;
    pushUndo('style-change', { previous: undoClone, replacement: newBlock, parent });
    parent.replaceChild(newBlock, block);
    setupBlock(newBlock);

    if (editMode) {
      applyEditable(true);
      const focusTarget = newBlock.querySelector('[data-editable]') ||
                          (newBlock.matches('[data-editable]') ? newBlock : null);
      if (focusTarget && focusTarget.focus) {
        focusTarget.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        try { range.selectNodeContents(focusTarget); range.collapse(false); sel.removeAllRanges(); sel.addRange(range); } catch (_) {}
      }
    }
    toast('Changed to ' + opt.label + '.');
  }

  let activeStyleMenu = null;

  function closeStyleMenu() {
    if (activeStyleMenu) { activeStyleMenu.remove(); activeStyleMenu = null; }
  }

  function openStyleMenu(trigger, block) {
    closeStyleMenu();
    const menu = document.createElement('div');
    menu.className = 'dae-style-menu';
    STYLE_OPTIONS.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const icon = document.createElement('span');
      icon.className = 'menu-icon';
      icon.textContent = opt.icon;
      const label = document.createElement('span');
      label.className = 'menu-label';
      label.textContent = opt.label;
      btn.appendChild(icon);
      btn.appendChild(label);
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        convertBlockStyle(block, opt.id);
        closeStyleMenu();
      });
      menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    const rect = trigger.getBoundingClientRect();
    menu.style.top = (window.scrollY + rect.bottom + 6) + 'px';
    menu.style.left = (window.scrollX + rect.left) + 'px';
    activeStyleMenu = menu;
  }

  document.addEventListener('click', (e) => {
    if (!activeStyleMenu) return;
    if (activeStyleMenu.contains(e.target)) return;
    if (e.target.closest && e.target.closest('.dae-style')) return;
    closeStyleMenu();
  });

  function deleteBlock(block) {
    const parent = block.parentElement;
    const next = block.nextElementSibling;
    // Deep-clone with edit chrome stripped — setupBlock re-adds on restore
    const clone = block.cloneNode(true);
    clone.querySelectorAll('.dae-block-controls, .dae-photo-overlay').forEach(el => el.remove());
    clone.classList.remove('dae-sortable-block');
    delete clone.dataset.daeControls;
    pushUndo('delete', { parent, node: clone, before: next });
    block.remove();
    toast('Block deleted. Undo with Cmd+Z.');
  }

  // End-of-container "+ Add block" buttons
  function ensureAddBlockButton(container) {
    if (container.querySelector(':scope > .dae-add-block-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dae-add-block-btn';
    btn.textContent = '+ Add block';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const children = [...container.children].filter(c => !c.classList.contains('dae-add-block-btn'));
      openInsertMenu(btn, container, children.length);
    });
    container.appendChild(btn);
  }

  // Block setup (also called by MutationObserver)
  function setupBlock(block) {
    if (!block || block.nodeType !== 1) return;
    if (block.classList.contains('dae-add-block-btn') || block.classList.contains('dae-block-controls')) return;
    attachBlockControls(block);
    block.querySelectorAll('[data-editable-photo]').forEach(attachPhotoOverlay);
    if (editMode) {
      const editables = [];
      if (block.matches && block.matches('[data-editable]')) editables.push(block);
      block.querySelectorAll('[data-editable]').forEach(el => editables.push(el));
      editables.forEach(el => {
        if (!el.hasAttribute('contenteditable')) {
          el.setAttribute('contenteditable', 'true');
          el.setAttribute('spellcheck', 'true');
        }
      });
    }
  }

  function watchContainer(container) {
    const observer = new MutationObserver((mutations) => {
      if (!editMode) return;
      for (const m of mutations) {
        for (const node of m.addedNodes) setupBlock(node);
      }
    });
    observer.observe(container, { childList: true });
    return observer;
  }

  // Insert menu
  function closeMenu() {
    if (activeMenu) { activeMenu.remove(); activeMenu = null; }
    if (activeMenuTrigger) { activeMenuTrigger.classList.remove('open'); activeMenuTrigger = null; }
  }

  function openInsertMenu(trigger, container, position) {
    closeMenu();
    activeMenuTrigger = trigger;
    trigger.classList.add('open');
    const menu = document.createElement('div');
    menu.className = 'dae-insert-menu';

    function renderMenu(targetContainer, targetPosition, label) {
      while (menu.firstChild) menu.removeChild(menu.firstChild);
      if (label) {
        const header = document.createElement('p');
        header.className = 'menu-header';
        header.textContent = label;
        menu.appendChild(header);
      }
      MENU_ITEMS.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const iconWrap = document.createElement('span');
        iconWrap.className = 'menu-icon';
        iconWrap.textContent = item.icon;
        const labelEl = document.createElement('span');
        labelEl.className = 'menu-label';
        labelEl.textContent = item.label;
        const hint = document.createElement('span');
        hint.className = 'menu-hint';
        hint.textContent = item.hint;
        btn.appendChild(iconWrap);
        btn.appendChild(labelEl);
        btn.appendChild(hint);
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          insertBlock(item.id, targetContainer, targetPosition);
          closeMenu();
        });
        menu.appendChild(btn);
      });
      // "Add outside this section" — only when container has a sortable
      // ancestor. Clicking it re-renders the menu pointing at that parent.
      const parentContainer = targetContainer.parentElement
        ? targetContainer.parentElement.closest(SORTABLE_CONTAINER)
        : null;
      if (parentContainer && parentContainer !== targetContainer) {
        const divider = document.createElement('div');
        divider.className = 'menu-divider';
        menu.appendChild(divider);
        const popBtn = document.createElement('button');
        popBtn.type = 'button';
        popBtn.className = 'menu-pop-out';
        const popIcon = document.createElement('span');
        popIcon.className = 'menu-icon';
        popIcon.textContent = '↑';
        const popLabel = document.createElement('span');
        popLabel.className = 'menu-label';
        popLabel.textContent = 'Add outside this section';
        const popHint = document.createElement('span');
        popHint.className = 'menu-hint';
        popHint.textContent = 'full-width';
        popBtn.appendChild(popIcon);
        popBtn.appendChild(popLabel);
        popBtn.appendChild(popHint);
        popBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Find target container's position within its parent and insert AFTER it
          const parentChildren = [...parentContainer.children]
            .filter(c => !c.classList.contains('dae-add-block-btn'));
          const idx = parentChildren.indexOf(targetContainer) + 1;
          renderMenu(parentContainer, idx, 'Add to outer section');
        });
        menu.appendChild(popBtn);
      }
    }
    renderMenu(container, position, null);
    document.body.appendChild(menu);
    const rect = trigger.getBoundingClientRect();
    menu.style.top = (window.scrollY + rect.bottom + 6) + 'px';
    menu.style.left = (window.scrollX + rect.left + Math.max(-160, (rect.width / 2) - 120)) + 'px';
    activeMenu = menu;
  }

  document.addEventListener('click', (e) => {
    if (activeMenu && !activeMenu.contains(e.target)
        && !e.target.closest('.dae-block-controls .dae-insert, .dae-add-block-btn')) {
      closeMenu();
    }
  });

  // Insertion
  function insertBlock(type, container, position) {
    const tpl = $('#tpl-' + type);
    if (!tpl) return;
    const fragment = tpl.content.cloneNode(true);
    const first = fragment.firstElementChild;
    if (!first) return;
    const children = [...container.children].filter(c => !c.classList.contains('dae-add-block-btn'));
    const target = children[position] || null;
    if (target) container.insertBefore(first, target);
    else container.insertBefore(first, container.querySelector(':scope > .dae-add-block-btn'));
    pushUndo('insert', { inserted: first });
    setupBlock(first);
    if (editMode) {
      applyEditable(true);
      if (type === 'photo') {
        const img = first.querySelector('[data-editable-photo]');
        if (img) {
          activePhoto = img;
          pendingPhotoBlock = first;
          els.photoInput.click();
        }
      } else if (type === 'spacer') {
        // Nothing to focus — the spacer block just exists and gets resized
        // via the corner drag handle (CSS resize: both on .dae-sortable-block)
      } else {
        const focusTarget = first.querySelector('[data-editable]') || first;
        if (focusTarget.setAttribute) focusTarget.setAttribute('contenteditable', 'true');
        focusTarget.focus && focusTarget.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        try { range.selectNodeContents(focusTarget); sel.removeAllRanges(); sel.addRange(range); } catch (_) {}
      }
    }
    toast(type.charAt(0).toUpperCase() + type.slice(1) + ' added.');
  }

  // ── Table cell controls (add row/col, delete row/col) ─────────────────
  // The table template ships with a small `.dae-table-toolbar` whose buttons
  // each have a `data-table-action="..."` attribute. We delegate clicks at
  // the document level so the buttons work even on tables added via undo or
  // restore. Actions operate on whichever cell currently has focus.

  function getActiveTableCell() {
    const el = document.activeElement;
    return el && el.closest ? el.closest('td, th') : null;
  }

  function tableAction(action) {
    const cell = getActiveTableCell();
    if (!cell) { toast('Click into a table cell first.'); return; }
    const table = cell.closest('table');
    const row = cell.closest('tr');
    if (!table || !row) return;
    const colIdx = [...row.children].indexOf(cell);

    if (action === 'row-below') {
      const newRow = document.createElement('tr');
      for (let i = 0; i < row.children.length; i++) {
        const td = document.createElement('td');
        td.setAttribute('data-editable', '');
        if (editMode) { td.setAttribute('contenteditable', 'true'); td.setAttribute('spellcheck', 'true'); }
        newRow.appendChild(td);
      }
      row.parentNode.insertBefore(newRow, row.nextSibling);
      const firstCell = newRow.firstChild;
      if (firstCell && firstCell.focus) firstCell.focus();
    } else if (action === 'col-right') {
      table.querySelectorAll('tr').forEach(tr => {
        const refCell = tr.children[colIdx];
        if (!refCell) return;
        const newCell = document.createElement(refCell.tagName.toLowerCase());
        newCell.setAttribute('data-editable', '');
        if (editMode) { newCell.setAttribute('contenteditable', 'true'); newCell.setAttribute('spellcheck', 'true'); }
        tr.insertBefore(newCell, refCell.nextSibling);
      });
    } else if (action === 'del-row') {
      const allRows = table.querySelectorAll('tr');
      if (allRows.length <= 1) { toast('Table must have at least one row.'); return; }
      row.remove();
    } else if (action === 'del-col') {
      if (row.children.length <= 1) { toast('Table must have at least one column.'); return; }
      table.querySelectorAll('tr').forEach(tr => {
        if (tr.children[colIdx]) tr.children[colIdx].remove();
      });
    }
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('[data-table-action]');
    if (!btn || !editMode) return;
    e.preventDefault();
    e.stopPropagation();
    tableAction(btn.getAttribute('data-table-action'));
  });

  // Text color (themed palette via --dae-color-* CSS variables)
  function applyTextColor(colorNum) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { toast('Select text first, then pick a color.'); return; }
    const range = sel.getRangeAt(0);
    const anchor = range.commonAncestorContainer.nodeType === 1
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
    if (!anchor || !anchor.closest('[data-editable]')) return;

    if (colorNum === 0) {
      const colorSpan = anchor.closest('span.dae-color-1, span.dae-color-2, span.dae-color-3, span.dae-color-4');
      if (colorSpan) {
        while (colorSpan.firstChild) colorSpan.parentNode.insertBefore(colorSpan.firstChild, colorSpan);
        colorSpan.remove();
      }
      return;
    }
    const span = document.createElement('span');
    span.className = 'dae-color-' + colorNum;
    try { range.surroundContents(span); }
    catch (_) {
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }
    sel.removeAllRanges();
  }
  $$('.dae-tm-color').forEach(btn => {
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      applyTextColor(parseInt(btn.dataset.color, 10));
    });
  });

  // ── Bold / italic / underline (B / I / U buttons + Cmd+B/I/U) ─────────
  // Uses document.execCommand because it's the only reliable cross-browser
  // way to format inside a contenteditable AND integrate with the browser's
  // native undo stack. queryCommandState reports the current selection's
  // formatting so we can show active state on the buttons.
  const formatBtns = {
    bold: $('#dae-tm-bold'),
    italic: $('#dae-tm-italic'),
    underline: $('#dae-tm-underline'),
  };
  function updateFormatButtonStates() {
    if (!editMode) return;
    try {
      formatBtns.bold.classList.toggle('active', document.queryCommandState('bold'));
      formatBtns.italic.classList.toggle('active', document.queryCommandState('italic'));
      formatBtns.underline.classList.toggle('active', document.queryCommandState('underline'));
    } catch (_) { /* ignore — selection out of editable */ }
  }
  function makeFormatBtn(btn, cmd) {
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!editMode) return;
      const sel = window.getSelection();
      const node = sel && sel.anchorNode;
      const el = node ? (node.nodeType === 1 ? node : node.parentElement) : null;
      if (!el || !el.closest('[data-editable]')) {
        toast('Click into editable text first.');
        return;
      }
      document.execCommand(cmd);
      updateFormatButtonStates();
    });
  }
  makeFormatBtn(formatBtns.bold, 'bold');
  makeFormatBtn(formatBtns.italic, 'italic');
  makeFormatBtn(formatBtns.underline, 'underline');
  document.addEventListener('selectionchange', () => {
    if (editMode) updateFormatButtonStates();
  });

  // ── Font size (Aa button → popover with 5 theme-aware sizes) ───────────
  const SIZES = [
    { id: 'xs',    label: 'Tiny',     sample: '0.75×' },
    { id: 'sm',    label: 'Small',    sample: '0.88×' },
    { id: 'reset', label: 'Normal',   sample: '1×ㅤ'   },
    { id: 'lg',    label: 'Large',    sample: '1.25×' },
    { id: 'xl',    label: 'X-Large',  sample: '1.5×ㅤ' },
    { id: '2xl',   label: 'Huge',     sample: '2×ㅤ'   },
  ];
  const SIZE_CLASS_RE = /dae-size-(xs|sm|lg|xl|2xl)/;
  const sizeBtn = $('#dae-tm-size');
  let activeSizeMenu = null;
  function closeSizeMenu() {
    if (activeSizeMenu) { activeSizeMenu.remove(); activeSizeMenu = null; }
    if (sizeBtn) sizeBtn.classList.remove('active');
  }
  function openSizeMenu() {
    if (!editMode) return;
    closeSizeMenu();
    sizeBtn.classList.add('active');
    const menu = document.createElement('div');
    menu.className = 'dae-size-menu';
    SIZES.forEach(size => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const label = document.createElement('span');
      label.className = 'size-label';
      label.textContent = size.label;
      const sample = document.createElement('span');
      sample.className = 'size-sample';
      sample.textContent = size.sample;
      btn.appendChild(label);
      btn.appendChild(sample);
      btn.addEventListener('mousedown', (e) => e.preventDefault());
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        applyFontSize(size.id);
        closeSizeMenu();
      });
      menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    const rect = sizeBtn.getBoundingClientRect();
    menu.style.top = (window.scrollY + rect.top - menu.offsetHeight - 8) + 'px';
    menu.style.left = (window.scrollX + rect.left + rect.width / 2 - menu.offsetWidth / 2) + 'px';
    activeSizeMenu = menu;
  }
  function applyFontSize(sizeId) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { toast('Select text first, then pick a size.'); return; }
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const anchor = container.nodeType === 1 ? container : container.parentElement;
    if (!anchor || !anchor.closest('[data-editable]')) return;

    if (sizeId === 'reset') {
      // Unwrap nearest size span (if any) — same pattern as text-color reset
      const sizeSpan = anchor.closest('span.dae-size-xs, span.dae-size-sm, span.dae-size-lg, span.dae-size-xl, span.dae-size-2xl');
      if (sizeSpan) {
        while (sizeSpan.firstChild) sizeSpan.parentNode.insertBefore(sizeSpan.firstChild, sizeSpan);
        sizeSpan.remove();
      }
      return;
    }
    const span = document.createElement('span');
    span.className = 'dae-size-' + sizeId;
    try { range.surroundContents(span); }
    catch (_) {
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }
    sel.removeAllRanges();
  }
  if (sizeBtn) {
    sizeBtn.addEventListener('mousedown', (e) => e.preventDefault());
    sizeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeSizeMenu) closeSizeMenu(); else openSizeMenu();
    });
  }
  document.addEventListener('click', (e) => {
    if (activeSizeMenu && !activeSizeMenu.contains(e.target) && e.target !== sizeBtn) closeSizeMenu();
  });

  // Hyperlink editor (toolbar button + modal + Cmd+K)
  const linkBtn = $('#dae-tm-link');
  const textMenu = $('#dae-text-menu');
  const linkModal = $('#dae-link-modal');
  const linkUrlInput = $('#dae-link-url');
  const linkNewTabInput = $('#dae-link-new-tab');
  const linkSaveBtn = $('#dae-link-save');
  const linkCancelBtn = $('#dae-link-cancel');
  const linkRemoveBtn = $('#dae-link-remove');
  let savedLinkRange = null;
  let editingLinkEl = null;

  function getLinkAtSelection(sel) {
    if (!sel || sel.rangeCount === 0) return null;
    const node = sel.anchorNode;
    const el = !node ? null : (node.nodeType === 1 ? node : node.parentElement);
    return el ? el.closest('a') : null;
  }

  function normalizeUrl(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) return '';
    // Explicit allow-list of safe URL forms.
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed)) return trimmed;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'mailto:' + trimmed;
    // Reject anything with an explicit scheme that ISN'T in the allow-list
    // (javascript:, data:, file:, vbscript:, etc.). Without this guard, an
    // unknown scheme falls through to the https:// prefix and produces a
    // weird but possibly-dangerous URL.
    if (/^[a-z][a-z0-9+.\-]*:/i.test(trimmed)) return '';
    return 'https://' + trimmed;
  }

  function openLinkModal() {
    if (!editMode) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { toast('Select text first to add a link.'); return; }
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const anchor = container.nodeType === 1 ? container : container.parentElement;
    if (!anchor || !anchor.closest('[data-editable]')) { toast('Click into editable text first.'); return; }
    const existingLink = getLinkAtSelection(sel);
    if (existingLink) {
      editingLinkEl = existingLink;
      linkUrlInput.value = existingLink.getAttribute('href') || '';
      linkNewTabInput.checked = existingLink.getAttribute('target') === '_blank';
      linkRemoveBtn.hidden = false;
      const linkRange = document.createRange();
      linkRange.selectNode(existingLink);
      savedLinkRange = linkRange;
    } else {
      if (sel.isCollapsed) { toast('Select text first to add a link.'); return; }
      editingLinkEl = null;
      linkUrlInput.value = '';
      linkNewTabInput.checked = true;
      linkRemoveBtn.hidden = true;
      savedLinkRange = range.cloneRange();
    }
    linkModal.classList.add('open');
    setTimeout(() => { linkUrlInput.focus(); linkUrlInput.select(); }, 0);
  }

  function closeLinkModal() {
    linkModal.classList.remove('open');
    savedLinkRange = null;
    editingLinkEl = null;
  }

  function saveLinkFromModal() {
    const url = normalizeUrl(linkUrlInput.value);
    if (!url) { toast('Enter a URL.'); return; }
    const openNewTab = linkNewTabInput.checked;
    if (!savedLinkRange) { closeLinkModal(); return; }
    if (editingLinkEl) {
      editingLinkEl.setAttribute('href', url);
      if (openNewTab) {
        editingLinkEl.setAttribute('target', '_blank');
        editingLinkEl.setAttribute('rel', 'noopener noreferrer');
      } else {
        editingLinkEl.removeAttribute('target');
        editingLinkEl.removeAttribute('rel');
      }
      closeLinkModal();
      toast('Link updated.');
      return;
    }
    const anchorEl = document.createElement('a');
    anchorEl.setAttribute('href', url);
    if (openNewTab) {
      anchorEl.setAttribute('target', '_blank');
      anchorEl.setAttribute('rel', 'noopener noreferrer');
    }
    try { savedLinkRange.surroundContents(anchorEl); }
    catch (_) {
      const fragment = savedLinkRange.extractContents();
      anchorEl.appendChild(fragment);
      savedLinkRange.insertNode(anchorEl);
    }
    closeLinkModal();
    toast('Link added.');
  }

  function removeCurrentLink() {
    if (!editingLinkEl) { closeLinkModal(); return; }
    const link = editingLinkEl;
    while (link.firstChild) link.parentNode.insertBefore(link.firstChild, link);
    link.remove();
    closeLinkModal();
    toast('Link removed.');
  }

  linkBtn.addEventListener('mousedown', (e) => e.preventDefault());
  linkBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openLinkModal(); });
  linkSaveBtn.addEventListener('click', saveLinkFromModal);
  linkCancelBtn.addEventListener('click', closeLinkModal);
  linkRemoveBtn.addEventListener('click', removeCurrentLink);
  linkModal.addEventListener('click', (e) => { if (e.target === linkModal) closeLinkModal(); });
  linkUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveLinkFromModal(); }
    if (e.key === 'Escape') { e.preventDefault(); closeLinkModal(); }
  });

  // ── Floating text-formatting menu — Medium/Notion style ─────────────────
  // Appears above the selection in edit mode. Hosts B/I/U, color swatches,
  // size, link. The bottom toolbar stays minimal (edit, undo, download).
  // All buttons use mousedown preventDefault so clicks don't blur the
  // selection.

  function positionTextMenu(rect) {
    // Probe-render the menu (visibility:hidden but visible class on) so
    // offsetWidth/Height are computable, then position it relative to the
    // selection rect.
    textMenu.style.visibility = 'hidden';
    textMenu.classList.add('visible');
    const mw = textMenu.offsetWidth;
    const mh = textMenu.offsetHeight;
    const gap = 12;
    const sx = window.scrollX, sy = window.scrollY;
    const vw = window.innerWidth;

    let top = rect.top + sy - mh - gap;
    let placeBelow = false;
    if (top < sy + 8) {
      // Not enough room above — place below the selection
      top = rect.bottom + sy + gap;
      placeBelow = true;
    }
    let left = rect.left + sx + rect.width / 2 - mw / 2;
    const maxLeft = sx + vw - mw - 8;
    if (left < sx + 8) left = sx + 8;
    if (left > maxLeft) left = maxLeft;

    textMenu.style.top = top + 'px';
    textMenu.style.left = left + 'px';
    textMenu.classList.toggle('below', placeBelow);
    textMenu.style.visibility = '';
    textMenu.setAttribute('aria-hidden', 'false');
  }

  function showTextMenu() {
    if (!editMode) { hideTextMenu(); return; }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { hideTextMenu(); return; }
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const anchor = container.nodeType === 1 ? container : container.parentElement;
    if (!anchor || !anchor.closest('[data-editable]')) { hideTextMenu(); return; }
    // Don't pop the menu when the selection is inside the menu's own URL input
    if (anchor.closest('.dae-text-menu, .dae-link-modal, .dae-edit-toolbar, .dae-size-menu')) return;
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) { hideTextMenu(); return; }
    positionTextMenu(rect);
    updateFormatButtonStates();
  }

  function hideTextMenu() {
    textMenu.classList.remove('visible', 'below');
    textMenu.setAttribute('aria-hidden', 'true');
  }

  // Debounce selectionchange — fires per-keystroke during drag-select
  let _selTimer = null;
  document.addEventListener('selectionchange', () => {
    clearTimeout(_selTimer);
    _selTimer = setTimeout(showTextMenu, 30);
  });

  // Hide menu when user clicks outside editable / outside menu chrome
  document.addEventListener('mousedown', (e) => {
    if (!textMenu.classList.contains('visible')) return;
    if (textMenu.contains(e.target)) return;             // clicking menu itself
    if (e.target.closest('.dae-text-menu, .dae-size-menu, .dae-link-modal')) return;
    if (e.target.closest('[data-editable]')) return;     // starting a new selection
    hideTextMenu();
  });

  // Hide on scroll so it doesn't float away from its selection
  document.addEventListener('scroll', () => {
    if (textMenu.classList.contains('visible')) {
      // Reposition rather than hide — selection is still active
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        positionTextMenu(sel.getRangeAt(0).getBoundingClientRect());
      }
    }
  }, true);

  // ── Keyboard shortcuts (Cmd+B/I/U/E/K/Z + Cmd+Opt+H/P/Q/C) ──────────────
  document.addEventListener('keydown', (e) => {
    const meta = e.metaKey || e.ctrlKey;
    if (!meta) return;
    if (e.key === 'e' && !e.altKey) { e.preventDefault(); setEditMode(!editMode); return; }
    if (!editMode) return;
    const focused = document.activeElement;
    const inEditable = focused && focused.closest && focused.closest('[data-editable]');
    // Block style transformer shortcuts (Cmd+Opt+H/P/Q/C): convert the
    // focused block to heading / paragraph / pullquote / callout.
    if (e.altKey && inEditable) {
      let targetId = null;
      if (e.key === 'h' || e.key === 'H' || e.code === 'KeyH') targetId = 'heading';
      else if (e.key === 'p' || e.key === 'P' || e.code === 'KeyP') targetId = 'paragraph';
      else if (e.key === 'q' || e.key === 'Q' || e.code === 'KeyQ') targetId = 'pullquote';
      else if (e.key === 'c' || e.key === 'C' || e.code === 'KeyC') targetId = 'callout';
      if (targetId) {
        const block = inEditable.closest('.dae-sortable-block');
        if (block && isStylableBlock(block)) {
          e.preventDefault();
          convertBlockStyle(block, targetId);
          return;
        }
      }
    }
    if (e.altKey) return;
    if (e.key === 'z' && !inEditable) { e.preventDefault(); undo(); return; }
    if (e.key === 'k' && inEditable) { e.preventDefault(); openLinkModal(); return; }
    if (!inEditable) return;
    if (e.key === 'b') { e.preventDefault(); document.execCommand('bold'); updateFormatButtonStates(); }
    if (e.key === 'i') { e.preventDefault(); document.execCommand('italic'); updateFormatButtonStates(); }
    if (e.key === 'u') { e.preventDefault(); document.execCommand('underline'); updateFormatButtonStates(); }
  });

  // Sortable.js integration
  function initSortable() {
    teardownSortable();
    $$(SORTABLE_CONTAINER).forEach(container => {
      const s = window.Sortable.create(container, {
        group: { name: 'dae-blocks', pull: true, put: true },
        handle: '.dae-drag',
        animation: 150,
        filter: '.dae-add-block-btn',
        preventOnFilter: false,
        onStart: (evt) => {
          closeMenu();
          // Block autosave snapshots — Sortable temporarily parks the dragged
          // item in the target container even before the user drops, so the
          // DOM is mid-rearrange. A snapshot here would capture a half-moved
          // layout the user never confirmed.
          isBusy = true;
          dragOrigin = {
            item: evt.item,
            parent: evt.item.parentElement,
            before: evt.item.nextElementSibling,
          };
        },
        onEnd: (evt) => {
          isBusy = false;
          const origin = dragOrigin;
          dragOrigin = null;
          if (!origin) return;
          if (evt.oldIndex === evt.newIndex && evt.from === evt.to) return;
          pushUndo('reorder', origin);
        },
      });
      sortableInstances.push(s);
    });
  }
  function teardownSortable() {
    sortableInstances.forEach(s => s.destroy && s.destroy());
    sortableInstances = [];
  }

  // ── Autosave to localStorage ─────────────────────────────────────────────
  // Snapshots [data-pdf-root] innerHTML every AUTOSAVE_INTERVAL ms while in
  // edit mode. Keeps the last AUTOSAVE_MAX versions. On load, if the latest
  // stored snapshot differs from the current DOM, surfaces a top-of-page
  // banner offering Restore / Discard. The toolbar Versions button opens a
  // popover listing recent snapshots for quick jump-to.
  //
  // Snapshots are CLEAN (edit chrome stripped) so restoring re-wires cleanly
  // via setupBlock. Storage key = document.title so each artifact gets its
  // own history; identical titles across artifacts will collide (edge case).
  // All localStorage ops are wrapped in try/catch — Safari may block on
  // file:// or the quota may be exceeded; the feature degrades silently.

  const AUTOSAVE_INTERVAL = 5000;
  const AUTOSAVE_MAX = 5;
  const AUTOSAVE_KEY = 'dae:autosave:' + (document.title || 'untitled');

  let autosaveTimer = null;
  let lastSnapshotHtml = null;
  let isBusy = false;                 // true while a Sortable drag is in flight
  let pendingRestoreVersion = null;   // pinned at banner show, used by Restore click
  let _quotaToasted = false;          // one-time storage-full toast

  // Sanitizer for restored HTML — defense-in-depth against localStorage
  // poisoning. innerHTML on a string from storage doesn't execute <script>
  // tags, but on* event handlers and javascript: URLs DO fire. Strip both
  // before assigning, so a hostile storage value cannot fire payloads on
  // restore or worm through a subsequent HTML download.
  function sanitizeRestoredHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script').forEach(s => s.remove());
    doc.querySelectorAll('*').forEach(el => {
      [...el.attributes].forEach(attr => {
        const name = attr.name.toLowerCase();
        const val = attr.value || '';
        if (name.startsWith('on')) el.removeAttribute(attr.name);
        if ((name === 'href' || name === 'src' || name === 'xlink:href' || name === 'formaction') &&
            /^\s*javascript:/i.test(val)) {
          el.removeAttribute(attr.name);
        }
      });
    });
    return doc.body.innerHTML;
  }

  // Centralized "we are about to swap the DOM under transient UI's feet"
  // teardown. Modals, floating menus, drag origin, photo refs — all hold
  // references to nodes the swap is about to invalidate. Must run before
  // any applyVersion() or fullscreen transition. Centralized so new
  // transient surfaces only need to add their close call here.
  function tearDownTransientUI() {
    closeLinkModal();
    hideTextMenu();
    closeSizeMenu();
    closeStyleMenu();
    closeMenu();
    closeVersionsMenu();
    activePhoto = null;
    pendingPhotoBlock = null;
    dragOrigin = null;
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
  }

  function storageGet() {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return { versions: [] };
      const parsed = JSON.parse(raw);
      return parsed && Array.isArray(parsed.versions) ? parsed : { versions: [] };
    } catch (_) { return { versions: [] }; }
  }

  function storageSet(data) {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
      return true;
    } catch (_) {
      // Likely quota. Drop oldest version and retry once.
      while (data.versions.length > 1) {
        data.versions.shift();
        try {
          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
          return true;
        } catch (_) { /* keep shrinking */ }
      }
      return false;
    }
  }

  function storageClear() {
    try { localStorage.removeItem(AUTOSAVE_KEY); } catch (_) {}
  }

  function getCleanSnapshot() {
    const root = findPdfRoot();
    if (!root) return '';
    const clone = root.cloneNode(true);
    clone.querySelectorAll('.dae-block-controls, .dae-photo-overlay, .dae-add-block-btn').forEach(el => el.remove());
    clone.querySelectorAll('.dae-sortable-block').forEach(el => {
      el.classList.remove('dae-sortable-block');
      delete el.dataset.daeControls;
    });
    clone.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
      el.removeAttribute('spellcheck');
    });
    clone.querySelectorAll('.dae-violation').forEach(el => {
      el.classList.remove('dae-violation');
      el.removeAttribute('data-violation-msg');
    });
    clone.querySelectorAll('.dae-reposition-mode').forEach(el => {
      el.classList.remove('dae-reposition-mode');
    });
    return clone.innerHTML;
  }

  function snapshotNow() {
    // Bail mid-drag — Sortable's ghost/dragged-clone makes the DOM transiently
    // inconsistent. Restoring such a snapshot reproduces a half-moved layout.
    if (isBusy) return;
    const html = getCleanSnapshot();
    if (!html || html === lastSnapshotHtml) return;
    // Always re-read before appending — another tab may have written since
    // our last write. Last-writer-wins still applies, but we no longer clobber
    // an in-memory stale view of the versions array.
    const data = storageGet();
    data.versions.push({ ts: Date.now(), html });
    while (data.versions.length > AUTOSAVE_MAX) data.versions.shift();
    if (storageSet(data)) {
      lastSnapshotHtml = html;
      refreshVersionsButtonState();
    } else {
      // Quota fully exhausted (single snapshot doesn't fit). Update the
      // dedupe baseline so we don't budae-loop retrying, and surface a
      // one-time toast so the user knows autosave has stopped.
      lastSnapshotHtml = html;
      if (!_quotaToasted) {
        toast('Autosave paused — storage full. Click HTML to download.');
        _quotaToasted = true;
      }
    }
  }

  // Cross-tab safety — another tab writing our key invalidates our
  // dedupe baseline so the next snapshot here doesn't skip on a stale match.
  window.addEventListener('storage', (e) => {
    if (e.key === AUTOSAVE_KEY) {
      lastSnapshotHtml = null;
      refreshVersionsButtonState();
    }
  });

  function startAutosave() {
    if (autosaveTimer) return;
    lastSnapshotHtml = getCleanSnapshot();
    autosaveTimer = setInterval(snapshotNow, AUTOSAVE_INTERVAL);
  }

  function stopAutosave() {
    if (!autosaveTimer) return;
    clearInterval(autosaveTimer);
    autosaveTimer = null;
    snapshotNow();
  }

  function formatTimeAgo(ts) {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + ' min ago';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' hr ago';
    const days = Math.floor(hours / 24);
    return days + ' day' + (days > 1 ? 's' : '') + ' ago';
  }

  function applyVersion(version) {
    const root = findPdfRoot();
    if (!root || !version || !version.html) return;
    // Disconnect observers + Sortable BEFORE the swap — otherwise the
    // in-flight MutationObserver will fire setupBlock() on the swap-added
    // nodes, then our explicit loop below double-wires every block. The
    // dataset guards mostly hide this, but Sortable's cloned drag nodes
    // surface it as wrong-target photo replace.
    tearDownTransientUI();
    containerObservers.forEach(o => o.disconnect());
    containerObservers = [];
    teardownSortable();
    // Sanitize before assigning — even though localStorage is same-origin
    // and innerHTML doesn't run <script>, on* attrs and javascript: URLs
    // DO fire (and would propagate into a subsequent HTML download).
    const clean = sanitizeRestoredHtml(version.html);
    root.innerHTML = clean;
    refreshPhotoOverlays();
    if (editMode) {
      applyEditable(true);
      $$(SORTABLE_CONTAINER).forEach(container => {
        [...container.children].forEach(child => setupBlock(child));
        ensureAddBlockButton(container);
        containerObservers.push(watchContainer(container));
      });
      initSortable();
    }
    // Restore comments — the snapshot contains the data template inside
    // [data-pdf-root], so loadCommentsFromTemplate reads the restored state.
    loadCommentsFromTemplate();
    renderComments();
    // Use the (sanitized) just-assigned HTML as the new baseline. Avoids
    // a redundant getCleanSnapshot() (cloneNode + serialize) on the tree
    // we literally just installed.
    lastSnapshotHtml = clean;
  }

  function showRestorePrompt(version) {
    if (!els.restorePrompt) return;
    els.restoreWhen.textContent = formatTimeAgo(version.ts);
    els.restorePrompt.classList.add('show');
    els.restorePrompt.setAttribute('aria-hidden', 'false');
  }

  function hideRestorePrompt() {
    if (!els.restorePrompt) return;
    els.restorePrompt.classList.remove('show');
    els.restorePrompt.setAttribute('aria-hidden', 'true');
  }

  if (els.restoreApply) {
    els.restoreApply.addEventListener('click', () => {
      // Restore the version PINNED at banner-show time, not "whatever is
      // latest now." If the user typed fresh edits before clicking Restore,
      // their fresh edits exist as newer versions in storage and remain
      // accessible via the Versions menu — they're not lost. But the
      // button must do what its banner text promised.
      if (pendingRestoreVersion) {
        applyVersion(pendingRestoreVersion);
        toast('Restored edits from ' + formatTimeAgo(pendingRestoreVersion.ts) + '.');
      }
      pendingRestoreVersion = null;
      hideRestorePrompt();
    });
  }
  if (els.restoreDiscard) {
    els.restoreDiscard.addEventListener('click', () => {
      storageClear();
      lastSnapshotHtml = getCleanSnapshot();
      refreshVersionsButtonState();
      pendingRestoreVersion = null;
      hideRestorePrompt();
      toast('Saved edits discarded.');
    });
  }

  function checkForRestoreOnLoad() {
    const data = storageGet();
    if (!data.versions.length) return;
    const latest = data.versions[data.versions.length - 1];
    if (!latest || !latest.html || latest.html === getCleanSnapshot()) return;
    pendingRestoreVersion = latest;
    showRestorePrompt(latest);
  }

  // Versions popover (toolbar button)
  let activeVersionsMenu = null;

  function refreshVersionsButtonState() {
    if (!els.versionsBtn) return;
    const data = storageGet();
    els.versionsBtn.disabled = data.versions.length === 0;
  }

  function closeVersionsMenu() {
    if (activeVersionsMenu) { activeVersionsMenu.remove(); activeVersionsMenu = null; }
    if (els.versionsBtn) els.versionsBtn.classList.remove('active');
  }

  function openVersionsMenu() {
    closeVersionsMenu();
    if (!els.versionsBtn) return;
    els.versionsBtn.classList.add('active');
    const data = storageGet();
    const menu = document.createElement('div');
    menu.className = 'dae-versions-menu';
    const header = document.createElement('p');
    header.className = 'v-header';
    header.textContent = 'Recent versions · click to restore';
    menu.appendChild(header);
    if (data.versions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'v-empty';
      empty.textContent = 'No saved versions yet. Snapshots are taken every 5s while editing.';
      menu.appendChild(empty);
    } else {
      [...data.versions].reverse().forEach((v) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const when = document.createElement('span');
        when.className = 'v-when';
        when.textContent = formatTimeAgo(v.ts);
        const ts = document.createElement('span');
        ts.className = 'v-ts';
        ts.textContent = new Date(v.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        btn.appendChild(when);
        btn.appendChild(ts);
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          applyVersion(v);
          toast('Restored version from ' + formatTimeAgo(v.ts) + '.');
          closeVersionsMenu();
        });
        menu.appendChild(btn);
      });
    }
    document.body.appendChild(menu);
    const rect = els.versionsBtn.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    let left = window.scrollX + rect.left + rect.width / 2 - mw / 2;
    const maxLeft = window.scrollX + window.innerWidth - mw - 8;
    if (left < window.scrollX + 8) left = window.scrollX + 8;
    if (left > maxLeft) left = maxLeft;
    menu.style.top = (window.scrollY + rect.top - mh - 8) + 'px';
    menu.style.left = left + 'px';
    activeVersionsMenu = menu;
  }

  if (els.versionsBtn) {
    els.versionsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeVersionsMenu) closeVersionsMenu(); else openVersionsMenu();
    });
  }
  document.addEventListener('click', (e) => {
    if (!activeVersionsMenu) return;
    if (activeVersionsMenu.contains(e.target)) return;
    if (els.versionsBtn && (e.target === els.versionsBtn || els.versionsBtn.contains(e.target))) return;
    closeVersionsMenu();
  });

  // Catch closes and refreshes — snapshot any unsaved work, but ONLY if we
  // were actively editing. Without the guard, reloading without restoring
  // would push a copy of the current (unchanged) DOM into versions, masking
  // the prior edited snapshot from the restore prompt's "latest" lookup.
  window.addEventListener('beforeunload', () => {
    if (editMode) snapshotNow();
  });

  // ── Comments / annotations layer ────────────────────────────────────────
  // Round-trip review. Comments anchor to text by wrapping the selection in
  // a <span class="dae-comment-anchor" data-comment-id="..."> tag. The
  // comment DATA (body, author, timestamps, resolved) lives in JSON inside
  // a <template id="dae-comments-data"> appended to [data-pdf-root] so it
  // survives autosave snapshots and HTML download round-trips.
  //
  // Author is prompted on the first comment and persisted to localStorage
  // (key: dae:author). Resolved comments stay in storage but fade visually.
  // Orphan comments (anchor span deleted) still appear in the sidebar so
  // the reviewer can still see what was said even after the text is gone.

  const COMMENTS_DATA_ID = 'dae-comments-data';
  const AUTHOR_KEY = 'dae:author';
  let commentsData = { comments: [] };
  let activeCommentId = null;

  function getAuthor() {
    try { return localStorage.getItem(AUTHOR_KEY) || ''; } catch (_) { return ''; }
  }
  function setAuthor(name) {
    try { localStorage.setItem(AUTHOR_KEY, name); } catch (_) {}
  }
  function ensureAuthor() {
    let author = getAuthor();
    if (author) return author;
    const name = (window.prompt('Your name (used as the author of your comments):') || '').trim();
    if (!name) return '';
    setAuthor(name);
    return name;
  }

  function ensureCommentsDataNode() {
    let tpl = $('#' + COMMENTS_DATA_ID);
    if (tpl) return tpl;
    const root = findPdfRoot();
    if (!root) return null;
    tpl = document.createElement('template');
    tpl.id = COMMENTS_DATA_ID;
    tpl.textContent = '{"comments":[]}';
    root.appendChild(tpl);
    return tpl;
  }

  function loadCommentsFromTemplate() {
    const tpl = $('#' + COMMENTS_DATA_ID);
    if (!tpl) { commentsData = { comments: [] }; return; }
    try {
      const raw = (tpl.textContent || '').trim() || '{}';
      const parsed = JSON.parse(raw);
      commentsData = parsed && Array.isArray(parsed.comments) ? parsed : { comments: [] };
    } catch (_) { commentsData = { comments: [] }; }
  }

  function saveCommentsToTemplate() {
    const tpl = ensureCommentsDataNode();
    if (!tpl) return;
    tpl.textContent = JSON.stringify(commentsData);
  }

  function makeCommentId() {
    return 'cmt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function findAnchorEl(commentId) {
    return document.querySelector('.dae-comment-anchor[data-comment-id="' + commentId + '"]');
  }

  function addCommentFromSelection() {
    if (!editMode) { toast('Enter edit mode to add comments.'); return; }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      toast('Select text first, then click 💬.');
      return;
    }
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const anchor = container.nodeType === 1 ? container : container.parentElement;
    if (!anchor || !anchor.closest('[data-editable]')) {
      toast('Comments only work on editable text.');
      return;
    }
    if (anchor.closest('.dae-comment-anchor')) {
      toast('Selection is already inside a comment.');
      return;
    }
    const author = ensureAuthor();
    if (!author) return;

    const id = makeCommentId();
    const span = document.createElement('span');
    span.className = 'dae-comment-anchor';
    span.setAttribute('data-comment-id', id);
    try { range.surroundContents(span); }
    catch (_) {
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }
    sel.removeAllRanges();

    commentsData.comments.push({
      id,
      anchorText: span.textContent.slice(0, 80),
      author,
      ts: Date.now(),
      body: '',
      resolved: false,
      editing: true,
    });
    saveCommentsToTemplate();
    renderComments();
    openCommentsPanel();
    setTimeout(() => {
      const textarea = $('.dae-comment-card[data-comment-id="' + id + '"] .dae-comment-edit');
      if (textarea) textarea.focus();
    }, 50);
  }

  function deleteComment(commentId) {
    const span = findAnchorEl(commentId);
    if (span) {
      while (span.firstChild) span.parentNode.insertBefore(span.firstChild, span);
      span.remove();
    }
    commentsData.comments = commentsData.comments.filter(c => c.id !== commentId);
    saveCommentsToTemplate();
    renderComments();
  }

  function resolveComment(commentId, resolved) {
    const c = commentsData.comments.find(x => x.id === commentId);
    if (!c) return;
    c.resolved = resolved;
    const span = findAnchorEl(commentId);
    if (span) span.classList.toggle('resolved', resolved);
    saveCommentsToTemplate();
    renderComments();
  }

  function updateCommentBody(commentId, body) {
    const c = commentsData.comments.find(x => x.id === commentId);
    if (!c) return;
    c.body = body;
    c.editing = false;
    saveCommentsToTemplate();
    renderComments();
  }

  function focusComment(commentId) {
    activeCommentId = commentId;
    document.querySelectorAll('.dae-comment-anchor.active').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.dae-comment-card.active').forEach(el => el.classList.remove('active'));
    const span = findAnchorEl(commentId);
    if (span) span.classList.add('active');
    const card = document.querySelector('.dae-comment-card[data-comment-id="' + commentId + '"]');
    if (card) {
      card.classList.add('active');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function syncAnchorClasses() {
    for (const c of commentsData.comments) {
      const span = findAnchorEl(c.id);
      if (span) span.classList.toggle('resolved', !!c.resolved);
    }
  }

  function renderComments() {
    const list = $('#dae-comments-list');
    const empty = $('#dae-comments-empty');
    const badge = $('#dae-comments-badge');
    if (!list || !empty || !badge) return;

    const unresolvedCount = commentsData.comments.filter(c => !c.resolved).length;
    badge.textContent = unresolvedCount > 0 ? String(unresolvedCount) : '';
    badge.setAttribute('data-count', String(unresolvedCount));

    if (commentsData.comments.length === 0) {
      empty.style.display = 'block';
      list.replaceChildren();
      return;
    }
    empty.style.display = 'none';

    const sorted = [...commentsData.comments].sort((a, b) => b.ts - a.ts);
    list.replaceChildren();
    for (const c of sorted) {
      list.appendChild(renderCommentCard(c));
    }
    syncAnchorClasses();
  }

  function renderCommentCard(c) {
    const card = document.createElement('div');
    card.className = 'dae-comment-card' + (c.resolved ? ' resolved' : '') + (c.id === activeCommentId ? ' active' : '');
    card.setAttribute('data-comment-id', c.id);

    const orphan = !findAnchorEl(c.id);
    const preview = document.createElement('p');
    preview.className = 'dae-comment-anchor-preview';
    preview.textContent = orphan ? '(anchor deleted) ' + (c.anchorText || '') : (c.anchorText || '');
    card.appendChild(preview);

    const meta = document.createElement('div');
    meta.className = 'dae-comment-meta';
    const authorEl = document.createElement('span');
    authorEl.className = 'dae-comment-author';
    authorEl.textContent = c.author || 'Anonymous';
    const tsEl = document.createElement('span');
    tsEl.className = 'dae-comment-time';
    tsEl.textContent = new Date(c.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    meta.appendChild(authorEl);
    meta.appendChild(tsEl);
    card.appendChild(meta);

    if (c.editing) {
      const ta = document.createElement('textarea');
      ta.className = 'dae-comment-edit';
      ta.placeholder = 'Type your comment...';
      ta.value = c.body || '';
      card.appendChild(ta);

      const actions = document.createElement('div');
      actions.className = 'dae-comment-edit-actions';
      const cancel = document.createElement('button');
      cancel.className = 'cancel';
      cancel.type = 'button';
      cancel.textContent = c.body ? 'Cancel' : 'Discard';
      cancel.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!c.body) { deleteComment(c.id); }
        else { c.editing = false; saveCommentsToTemplate(); renderComments(); }
      });
      const post = document.createElement('button');
      post.className = 'post';
      post.type = 'button';
      post.textContent = 'Post';
      post.addEventListener('click', (e) => {
        e.stopPropagation();
        const body = ta.value.trim();
        if (!body) { ta.focus(); return; }
        updateCommentBody(c.id, body);
      });
      actions.appendChild(cancel);
      actions.appendChild(post);
      card.appendChild(actions);
    } else {
      const body = document.createElement('div');
      body.className = 'dae-comment-body';
      body.textContent = c.body;
      card.appendChild(body);

      const actions = document.createElement('div');
      actions.className = 'dae-comment-actions';
      const resolveBtn = document.createElement('button');
      resolveBtn.type = 'button';
      resolveBtn.textContent = c.resolved ? 'Reopen' : 'Resolve';
      resolveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resolveComment(c.id, !c.resolved);
      });
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        c.editing = true;
        saveCommentsToTemplate();
        renderComments();
      });
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'danger';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.confirm('Delete this comment?')) deleteComment(c.id);
      });
      actions.appendChild(resolveBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      card.appendChild(actions);
    }

    card.addEventListener('click', () => focusComment(c.id));
    return card;
  }

  const commentsPanel = $('#dae-comments-panel');
  const commentsToggleBtn = $('#dae-comments-toggle');
  const commentsCloseBtn = $('#dae-comments-close');

  function openCommentsPanel() {
    if (!commentsPanel) return;
    commentsPanel.classList.add('open');
    commentsPanel.setAttribute('aria-hidden', 'false');
  }
  function closeCommentsPanel() {
    if (!commentsPanel) return;
    commentsPanel.classList.remove('open');
    commentsPanel.setAttribute('aria-hidden', 'true');
  }
  function toggleCommentsPanel() {
    if (commentsPanel.classList.contains('open')) closeCommentsPanel();
    else openCommentsPanel();
  }

  if (commentsToggleBtn) commentsToggleBtn.addEventListener('click', toggleCommentsPanel);
  if (commentsCloseBtn) commentsCloseBtn.addEventListener('click', closeCommentsPanel);

  document.addEventListener('click', (e) => {
    const span = e.target.closest && e.target.closest('.dae-comment-anchor');
    if (!span) return;
    const id = span.getAttribute('data-comment-id');
    if (!id) return;
    openCommentsPanel();
    focusComment(id);
  });

  const commentBtn = $('#dae-tm-comment');
  if (commentBtn) {
    commentBtn.addEventListener('mousedown', (e) => e.preventDefault());
    commentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      addCommentFromSelection();
    });
  }

  // ── Present mode — fullscreen viewer, all chrome hidden ─────────────────
  // Click Present → exits edit mode (clean view, no contenteditable cursor) →
  // adds body.dae-present-mode → requests browser fullscreen. Esc exits both.
  // Mousemove re-shows the "Press Esc to exit" hint, which fades after 1.8s.

  const presentBtn = $('#dae-present');
  let presentHintEl = null;
  let presentHintTimer = null;

  function ensurePresentHint() {
    if (presentHintEl) return presentHintEl;
    const hint = document.createElement('div');
    hint.className = 'dae-present-hint';
    hint.textContent = 'Press Esc to exit';
    document.body.appendChild(hint);
    presentHintEl = hint;
    return hint;
  }
  function showPresentHint() {
    ensurePresentHint().classList.add('show');
    clearTimeout(presentHintTimer);
    presentHintTimer = setTimeout(() => {
      if (presentHintEl) presentHintEl.classList.remove('show');
    }, 1800);
  }
  function hidePresentHint() {
    if (presentHintEl) presentHintEl.classList.remove('show');
    clearTimeout(presentHintTimer);
  }

  function enterPresentMode() {
    closeMenu();
    closeSizeMenu();
    closeStyleMenu();
    closeVersionsMenu();
    hideTextMenu();
    hideRestorePrompt();
    if (editMode) setEditMode(false);
    document.body.classList.add('dae-present-mode');
    showPresentHint();
    const root = document.documentElement;
    if (root.requestFullscreen) {
      root.requestFullscreen().catch(() => { /* user blocked; in-page present still works */ });
    }
  }

  function exitPresentMode() {
    if (!document.body.classList.contains('dae-present-mode')) return;
    document.body.classList.remove('dae-present-mode');
    hidePresentHint();
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  if (presentBtn) {
    presentBtn.addEventListener('click', enterPresentMode);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('dae-present-mode')) {
      exitPresentMode();
    }
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.classList.contains('dae-present-mode')) {
      exitPresentMode();
    }
  });
  document.addEventListener('mousemove', () => {
    if (document.body.classList.contains('dae-present-mode')) showPresentHint();
  });

  // Edit-mode toggle
  function setEditMode(on) {
    editMode = on;
    body.classList.toggle('dae-edit-mode', on);
    els.toggleBtn.classList.toggle('active', on);
    els.toggleBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    const span = els.toggleBtn.querySelector('span');
    if (span) span.textContent = on ? 'Done' : 'Edit';
    els.status.textContent = on ? 'editing' : 'view';
    applyEditable(on);
    refreshPhotoOverlays();
    if (!on) {
      closeLinkModal();
      hideTextMenu();
      closeSizeMenu();
    }
    if (on) {
      $$(SORTABLE_CONTAINER).forEach(container => {
        [...container.children].forEach(child => setupBlock(child));
        ensureAddBlockButton(container);
        containerObservers.push(watchContainer(container));
      });
      initSortable();
      startAutosave();
      toast('Edit mode. Cmd+B/I/U format · Cmd+K link · Aa to resize · drag ≡ to reorder · + to insert. Edits autosave every 5s.');
    } else {
      containerObservers.forEach(o => o.disconnect());
      containerObservers = [];
      teardownSortable();
      closeMenu();
      stopAutosave();
    }
  }
  els.toggleBtn.addEventListener('click', () => setEditMode(!editMode));

  // Save as PDF — bypasses browser print dialog so no date/URL/page-number
  // junk gets stamped on the output. Requires html2pdf.bundle.min.js to be
  // inlined into the artifact (see web/assets/html2pdf.bundle.min.js).
  // Trade-off: text is rasterized (not selectable in the PDF) but visually
  // identical to the on-screen render. For selectable text, the user can
  // still use File → Print → Save as PDF with "Headers and footers: off".
  //
  // Bugs this fixes vs naive html2pdf(body):
  //   - Blank pages before/after content: capture data-pdf-root / .onepager
  //     / main / article (in priority order) instead of the body, so the
  //     canvas matches the actual artifact dimensions
  //   - Warped photo (img with object-fit: cover stretched by html2canvas):
  //     the onclone hook swaps every object-fit img to a div with
  //     background-image + background-size: cover, which html2canvas
  //     renders correctly
  function findPdfRoot() {
    return document.querySelector('[data-pdf-root]')
        || document.querySelector('.onepager')
        || document.querySelector('main')
        || document.querySelector('article')
        || document.body;
  }
  els.savePdfBtn.addEventListener('click', async () => {
    // We use the html2canvas + jspdf globals that html2pdf.bundle.min.js
    // exposes, but CALL them directly — bypassing the html2pdf() wrapper.
    // The wrapper's internal pagination logic was producing blank pages
    // before/after the actual content even when format size matched source.
    // Going to canvas → addImage on a single jsPDF page is the simplest
    // path to "one page, no blanks."
    if (typeof window.html2canvas !== 'function' || !window.jspdf || !window.jspdf.jsPDF) {
      toast('PDF library not loaded — use File → Print → Save as PDF instead.');
      return;
    }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    closeMenu();

    document.body.classList.add('dae-pdf-export-mode');
    const wasEditMode = editMode;
    if (wasEditMode) document.body.classList.remove('dae-edit-mode');

    const root = findPdfRoot();

    // Capture dimensions of every object-fit img BEFORE the clone, so we can
    // swap them to background-image divs in the cloned doc. html2canvas
    // reliably renders background-image, but stretches imgs with object-fit.
    const imgDimensions = new Map();
    root.querySelectorAll('img').forEach(img => {
      const cs = getComputedStyle(img);
      if (cs.objectFit === 'cover' || cs.objectFit === 'contain') {
        imgDimensions.set(img, {
          src: img.src,
          width: img.offsetWidth + 'px',
          height: img.offsetHeight + 'px',
          objectPosition: img.style.objectPosition || cs.objectPosition || '50% 50%',
          borderRadius: cs.borderRadius,
          objectFit: cs.objectFit,
          alt: img.alt,
        });
      }
    });

    // Reflow so post-class-toggle layout settles, then measure in CSS px.
    // CSS absolute units: 1in = 96px regardless of zoom or screen DPI.
    void root.offsetHeight;
    const widthPx = root.offsetWidth;
    const heightPx = root.offsetHeight;
    const widthIn = widthPx / 96;
    const heightIn = heightPx / 96;
    const marginIn = 0.5;

    toast('Generating PDF…');
    try {
      const canvas = await window.html2canvas(root, {
        scale: 2,                                    // 2× canvas resolution for crisp rendering
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        // Force the captured viewport to match the source's CSS dimensions.
        // Without this, html2canvas uses the actual window viewport which
        // adds unrelated whitespace.
        windowWidth: widthPx,
        windowHeight: heightPx,
        width: widthPx,
        height: heightPx,
        onclone: (clonedDoc) => {
          const originals = Array.from(root.querySelectorAll('img'));
          const cloned = Array.from(clonedDoc.querySelectorAll('img'));
          originals.forEach((origImg, i) => {
            const dim = imgDimensions.get(origImg);
            const cloneImg = cloned[i];
            if (!dim || !cloneImg || !cloneImg.parentNode) return;
            const wrap = clonedDoc.createElement('div');
            wrap.style.width = dim.width;
            wrap.style.height = dim.height;
            wrap.style.backgroundImage = 'url("' + dim.src + '")';
            wrap.style.backgroundSize = dim.objectFit;
            wrap.style.backgroundPosition = dim.objectPosition;
            wrap.style.backgroundRepeat = 'no-repeat';
            wrap.style.borderRadius = dim.borderRadius;
            wrap.style.display = 'block';
            if (dim.alt) {
              wrap.setAttribute('role', 'img');
              wrap.setAttribute('aria-label', dim.alt);
            }
            cloneImg.parentNode.replaceChild(wrap, cloneImg);
          });
        },
      });

      // Build a single-page PDF sized to source + margin. addImage placed at
      // margin offset, sized to source dimensions. One page, no blanks.
      const pageW = widthIn + 2 * marginIn;
      const pageH = heightIn + 2 * marginIn;
      const pdf = new window.jspdf.jsPDF({
        unit: 'in',
        format: [pageW, pageH],
        orientation: pageH >= pageW ? 'portrait' : 'landscape',
      });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', marginIn, marginIn, widthIn, heightIn);
      pdf.save('dae-' + new Date().toISOString().slice(0, 10) + '.pdf');

      document.body.classList.remove('dae-pdf-export-mode');
      if (wasEditMode) document.body.classList.add('dae-edit-mode');
      toast('PDF saved.');
    } catch (err) {
      document.body.classList.remove('dae-pdf-export-mode');
      if (wasEditMode) document.body.classList.add('dae-edit-mode');
      toast('PDF generation failed. Try File → Print → Save as PDF.');
      console.error('Save PDF failed:', err);
    }
  });

  // Download (strips toolbar, scripts, and edit-mode chrome)
  els.downloadBtn.addEventListener('click', () => {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    closeMenu();

    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll(
      '.dae-edit-toolbar, .dae-comments-panel, #dae-photo-input, .dae-toast, .dae-link-modal, .dae-size-menu, .dae-photo-overlay, .dae-block-controls, .dae-add-block-btn, .dae-insert-menu, template:not(#dae-comments-data)'
    ).forEach(el => el.remove());
    const cloneBody = clone.querySelector('body');
    if (cloneBody) cloneBody.classList.remove('dae-edit-mode');
    clone.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
      el.removeAttribute('spellcheck');
    });
    clone.querySelectorAll('.dae-violation').forEach(el => {
      el.classList.remove('dae-violation');
      el.removeAttribute('data-violation-msg');
    });
    clone.querySelectorAll('.dae-sortable-block').forEach(el => {
      el.classList.remove('dae-sortable-block');
      delete el.dataset.daeControls;
    });
    // Strip transient reposition-mode marker; preserve any inline
    // object-position the user set (that's a real edit they made)
    clone.querySelectorAll('.dae-reposition-mode').forEach(el => {
      el.classList.remove('dae-reposition-mode');
    });
    clone.querySelectorAll('script').forEach(s => s.remove());
    // Belt-and-suspenders: strip on* event handler attributes and
    // javascript:/data: URLs from any element before serializing. Defends
    // against worm-style propagation if a poisoned snapshot somehow got
    // restored before the sanitizer caught it (or pre-existing hostile
    // markup in the source artifact).
    clone.querySelectorAll('*').forEach(el => {
      [...el.attributes].forEach(attr => {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) el.removeAttribute(attr.name);
        if ((name === 'href' || name === 'src' || name === 'xlink:href' || name === 'formaction') &&
            /^\s*javascript:/i.test(attr.value || '')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    const html = '<!DOCTYPE html>\n' + clone.outerHTML;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dae-edited-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    // Downloaded file = the user just saved. Clear autosave so a future
    // reload of the ORIGINAL artifact doesn't surface a stale "Restore?"
    // prompt for edits the user has already exported.
    storageClear();
    lastSnapshotHtml = getCleanSnapshot();
    refreshVersionsButtonState();
    toast('Downloaded. The new file has your edits baked in.');
  });

  refreshPhotoOverlays();
  refreshVersionsButtonState();
  checkForRestoreOnLoad();
  loadCommentsFromTemplate();
  renderComments();
})();
```

## Theme-aware formatting controls (and what's deliberately *not* exposed)

| Exposed | How | Why it's theme-aware |
|---|---|---|
| Bold / italic | `Cmd+B` / `Cmd+I` via `document.execCommand` | Produces `<strong>` / `<em>` which inherit brand colors via CSS |
| Text color | Toolbar swatches → wraps in `<span class="dae-color-N">` | Only the 4 brand text colors are pickable; the 4 tints fail contrast and aren't offered |
| Inline photo size | Full / Half / Third pill in the photo overlay → toggles `size-half` / `size-third` on `.dae-photo-block` | Three preset sizes with centered alignment. No drag handles, no arbitrary widths. Hero and CTA photos stay layout-locked. |
| Hyperlink | `Cmd+K` or toolbar Link button → modal collecting URL + "open in new tab" → wraps the selection in `<a href>` (with `rel="noopener noreferrer"` when new-tab) | The link styling is part of the brand stylesheet (`[data-editable] a`). Users can't pick link color; only the URL and target are configurable. Bare domains auto-prefix `https://`; bare emails auto-prefix `mailto:`. |

**Deliberately NOT exposed** (and why):

- **Free font size** — breaks typographic hierarchy. Use a Heading block instead.
- **Arbitrary color picker** — brand drift. The 4 swatches cover the legitimate cases.
- **Free-form drag-to-resize** — breaks the layout grid. The 3 preset photo sizes cover the legitimate cases; everything else regenerates via Claude.
- **Custom fonts** — the editor inherits the host page's font stack. To swap fonts, edit your page's CSS, not the editor.

If a user genuinely needs something the editor can't do (new chart, custom layout, structural rearrangement), they go back to Claude. The editor handles the 80% case (copy edits, photo swaps, reorder, add a paragraph).

## Things that look weird but are correct

Future Claude sessions may be tempted to "fix" these — don't.

- **`document.execCommand('bold'/'italic')`** is deprecated but the only reliable cross-browser way to do inline formatting inside `contenteditable` that integrates with the browser's native undo. Manual Range surgery is 10× the code for marginal correctness wins.
- **`compressImage` chains two FileReaders + Image + Canvas + Blob** because Safari's `createImageBitmap` doesn't handle HEIC well, which matters for editors on Mac.
- **Delete-undo stores a cloned DOM node, not a string.** Cleaner and faster than re-parsing on restore.
- **The download strips ALL scripts** including Sortable.js. The downloaded file is a final-deliverable read-only output; edit mode doesn't survive the download by design.
- **The big IIFE** containing all the editor logic is monolithic but keeps the artifact self-contained and debuggable in DevTools. Don't split into ES modules — there's no build step.
- **HTML download clears the autosave** but PDF save does not. Rationale: the downloaded HTML is the canonical "saved" artifact; future reloads of the original shouldn't surface a stale restore prompt for already-exported edits. PDF is image-based and not the editable copy, so it doesn't represent a save of the editing state.
- **`sanitizeRestoredHtml` strips `on*` attrs and `javascript:` URLs** on every restore, and the download handler does the same before serializing. localStorage is same-origin so the realistic threat is small (`file://` is per-path partitioned in modern browsers), but a hostile sibling tab or browser extension can write to our key, and the download path would otherwise propagate `<a href="javascript:…">` and `<img onerror="…">` into the saved file. The sanitizer is the cheap defense; don't remove it.
- **Restore button pins `pendingRestoreVersion` at banner-show time** instead of reading `data.versions[length-1]` when clicked. If the user types fresh edits before clicking Restore, those edits become newer versions in storage — but the button must still restore the *version shown in the banner*, not "whatever is now latest." Otherwise Restore becomes a confusing no-op.
- **`isBusy` flag is gated by Sortable `onStart`/`onEnd` only** — not by photo replace or modal open. Sortable temporarily parks the dragged node in the destination container before the drop, so a snapshot mid-drag captures a half-moved DOM. Photo replace and modals don't need the flag because their DOM mutations are atomic — a snapshot either catches the before-state or the after-state, both consistent.
- **`applyVersion` disconnects observers + Sortable BEFORE the `innerHTML` swap.** Letting the existing MutationObserver fire on the swap-added nodes causes double-wiring (photo overlays get attached twice; the cloned drag node carries stale closures that fire "Replace photo" against the wrong element).

## Filename convention

The download names the file `daedalus-edited-YYYY-MM-DD.html` by default. To customize, edit the `a.download = …` line in the HTML download handler — use a topic-specific stem (e.g. `pricing-comparison`) so reviewers don't end up with `daedalus-edited-2026-05-15 (3).html` after a few rounds.

## Implementation hint for programmatic builders

Daedalus has no build step. The editor is a single CSS block and a single JS IIFE, both inlined into every artifact. The three vendored libraries (Sortable.js, html2canvas, jsPDF) are also inlined so artifacts work offline. This keeps the contract simple: an editable Daedalus artifact is one self-contained HTML file you can email anywhere.

When a programmatic builder generates the artifact, read the three vendored JS files from `skills/editor/assets/` (`sortable.min.js`, `html2canvas.min.js`, `jspdf.umd.min.js`) and inline them as `<script>` blocks. Paste the CSS and JS blocks above into `<style>` and `<script>` respectively. Mark editable regions with `data-editable` and photos with `dae-photo-wrap` + `data-editable-photo` from the start — embed them inline as the artifact is generated, not as a post-processing pass. The single `data-pdf-root` attribute on your top-level container tells the PDF/restore code which subtree to capture.
