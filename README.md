# Daedalus

> **A drop-in HTML editor that turns any static page into a round-trip editable artifact.**

You ship one `.html` file. Whoever opens it gets a small toolbar at bottom-right. They click **Edit**, the page becomes WYSIWYG: click any outlined text to type, hover a photo to swap it, drag handles to reorder blocks, pop a floating menu for B/I/U/color/size/links, autosave to localStorage every 5 seconds, save as a clean PDF in one click, or present fullscreen.

No app. No install. No build step. No server. Works offline. One self-contained file.

## What's in this repo

A Claude Code plugin that generates Daedalus-equipped HTML artifacts on demand. Two pieces:

- **The editor** — `plugins/daedalus/skills/editor/references/editor.md` is the canonical reference. It contains the toolbar's HTML, CSS, and JS as inline-able code blocks, plus the markup contract for editable regions, and the theming hooks. You can lift this into any HTML page by hand.
- **The Claude Code skill** — invoke `/daedalus` and Claude scaffolds a fresh artifact for you with the editor baked in.

## Install (Claude Code)

```bash
/plugin marketplace add treynor-the-creator/daedalus
/plugin install daedalus@daedalus-marketplace
```

Then in any conversation:

```
/daedalus
```

Claude will ask what kind of page (one-pager, landing, blank) and what it's about, then generate the file at `~/Downloads/[topic].html`. Open it in any browser.

## Use without Claude Code

You don't need Claude. Lift the editor into your own HTML directly:

1. Clone this repo (or just download the relevant files).
2. Copy the HTML, CSS, and JS blocks from `plugins/daedalus/skills/editor/references/editor.md` into the bottom of your page.
3. Copy the three vendored JS files from `plugins/daedalus/skills/editor/assets/` and inline them as `<script>` blocks (no CDN — artifacts must work offline).
4. Mark editable regions on your existing content:
   - `data-editable` on any text element you want clickable-to-edit
   - Wrap photos in `<span class="dae-photo-wrap"><img class="..." data-editable-photo></span>`
   - Mark sortable parent containers with `class="dae-sortable-container"`
   - Mark the top-level wrapper with `data-pdf-root` (this is what the PDF/restore code captures)

That's the whole contract. Full details in `editor.md`.

## What the toolbar does

| | |
|---|---|
| **Edit** | Toggles edit mode. Editable regions get a dashed outline; click to type. |
| **Floating format menu** | Pops above any text selection (Medium / Notion style). B / I / U, 4 color swatches, 5 preset font sizes, link insert/edit. Standard shortcuts: Cmd+B/I/U/K. |
| **Photo replace** | Hover any `data-editable-photo` → "Replace photo" → file picker → auto-compressed to 2048px wide. |
| **Photo reposition** | Hover → "Reposition" → drag to shift `object-position`. Esc to lock. |
| **Photo resize** | Inline photos get Full / Half / Third buttons. Hero photos stay layout-locked. |
| **Free-resize blocks** | Every block has a brand-styled corner drag handle (`resize: both`). |
| **Reorder / insert / delete blocks** | Hover any block → drag the `≡` to move, click `+` to insert a heading/paragraph/pullquote/callout/photo/spacer, click `×` to delete. Cmd+Z undoes. |
| **Undo** | 50-step undo for non-text operations (delete, insert, reorder, photo replace). Cmd+Z when not in a contenteditable. |
| **Autosave + Restore** | Snapshots every 5 seconds to `localStorage`. On reload, if there are unsaved edits, a banner offers Restore / Discard. |
| **Versions** | Toolbar button opens a popover listing the last 5 snapshots — click any to restore. |
| **PDF** | One-click PDF export. Bypasses the browser print dialog entirely so there's no date/URL/page-number junk. |
| **HTML** | Download a fresh `.html` with the editor's chrome stripped and edits baked in. Email this to a colleague. |
| **Present** | Fullscreen, no chrome, dark frame. Esc exits. Designed for Zoom share. |
| **Lint** | Optional word-choice linter. Populate the `VIOLATIONS` array with `{pattern, msg}` entries to flag off-brand language as the user types. |

## Theming

The editor's chrome reads from `--dae-*` CSS variables (with sensible fallbacks baked in). Override these in your page's `:root` to brand it:

```css
:root {
  --dae-primary: #1a1a1a;       /* toolbar bg, primary text */
  --dae-secondary: #4a4a4a;     /* secondary text */
  --dae-accent: #0066cc;        /* active states */
  --dae-warm: #cc3300;          /* PDF button + warm color swatch */
  --dae-tint-1: #cce0ff;        /* fills */
  --dae-tint-2: #d8d8d8;        /* borders */
  --dae-tint-3: #ececec;        /* light surfaces */
  --dae-tint-4: #f6f6f6;        /* lightest surface */
  --dae-bg: #ffffff;
  --dae-fg: #1a1a1a;
}
```

The toolbar inherits the host page's font stack. To change fonts, edit your page's `body { font-family }`, not the editor.

## Vendored dependencies

The editor uses three MIT-licensed libraries, all inlined into every artifact:

| Library | Used for | Size |
|---|---|---|
| [Sortable.js](https://github.com/SortableJS/Sortable) | Block reorder via drag-and-drop | ~44 KB |
| [html2canvas](https://github.com/niklasvh/html2canvas) | DOM-to-canvas capture for PDF | ~194 KB |
| [jsPDF](https://github.com/parallax/jsPDF) | Canvas-to-PDF assembly | ~358 KB |

A typical Daedalus artifact is ~600 KB to ~1.5 MB depending on inlined photos. The toolbar itself is ~30 KB of CSS+JS.

## What it WON'T let users do

- Free font sizes or arbitrary colors — the toolbar exposes 4 color swatches and 5 size steps, no more. Keeps the editing surface bounded.
- Change the layout grid or page structure — that's owned by your template, not the editor. The editor only mutates content within elements you mark editable.
- Edit chart SVGs or other "data not copy" elements — leave them out of `data-editable` regions.
- Reach the network — the editor is fully client-side. localStorage for autosave, that's it.

If your project needs unlimited editing, layer your own controls on top.

## Browser support

- Chrome / Edge / Brave: full support
- Safari: full support EXCEPT `localStorage` is partitioned/disabled on `file://` in some configurations. Autosave silently degrades; everything else works.
- Firefox: full support
- Mobile browsers: edit mode works but drag-to-reorder is finicky on touch. Best on desktop.

## License

MIT — do whatever you want. Attribution appreciated.

## Acknowledgements

The editor pattern is heavily inspired by Notion's and Medium's inline editing UX, and by the round-trip-editable HTML deliverable workflow common in agency / marketing tooling.

---

Built with Claude Code by [@treynor-the-creator](https://github.com/treynor-the-creator).
