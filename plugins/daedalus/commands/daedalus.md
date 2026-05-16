---
description: Generate a self-contained HTML artifact with the Daedalus round-trip editor baked in. The output file opens in any browser as a normal page; clicking Edit makes it WYSIWYG-editable, with autosave, PDF export, and present mode built in.
---

# /daedalus

Generate a single self-contained HTML file with the Daedalus editor inlined. The recipient opens it in a browser and can immediately edit text, swap photos, reorder blocks, save as PDF, or present fullscreen — no install, no app, no internet required.

## How to handle this request

1. Invoke the `editor` skill from this plugin — it owns the markup contract, the toolbar code, and the templates.
2. Run a brief intake (2-4 questions): What's the page for? Who's editing it after delivery? Approximate length / sections? Brand colors to theme (or use defaults)?
3. Pick a starting template from `skills/editor/templates/` or design a custom layout. Default to `onepager.html` when in doubt.
4. Build the artifact:
   - Inline the toolbar HTML/CSS/JS blocks from `skills/editor/references/editor.md`
   - Inline the three vendored libraries from `skills/editor/assets/`
   - Replace `{{TOKEN}}` placeholders with real content from the intake
   - Mark editable regions (`data-editable`), photos (`dae-photo-wrap` + `data-editable-photo`), sortable containers (`dae-sortable-container`), and the PDF/restore root (`data-pdf-root`)
   - Compress and inline photos as base64
5. Save to `~/Downloads/[topic].html` (or the user's chosen path).
6. Tell the user: "Open in Chrome. Bottom-right toolbar: Edit toggles WYSIWYG, Versions shows autosaves, PDF saves a clean export, Present goes fullscreen. Drag handles on each block let you reorder/insert/delete."

## When to invoke this command

Any time the user asks for an HTML artifact that needs to be editable after you hand it over — reports, one-pagers, landing pages, case studies, internal docs, microsites. If the page is throwaway (scratch tool, dev script, no copy worth editing), skip the editor and produce a plain HTML page instead.
