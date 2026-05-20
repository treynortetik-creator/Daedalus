---
name: editor
description: Generate self-contained HTML artifacts with a built-in round-trip editor baked in. Use when the user wants "an editable HTML page", "a doc someone non-technical can edit", "a one-pager I can hand off", "a landing page with edit controls", or any HTML output that should be editable after delivery without an app or install. The editor lives inside the file — recipients open it in any browser, click to edit text, swap photos, reorder blocks, export to PDF, present fullscreen. Autosaves to localStorage. Works offline. No build step.
---

# Daedalus editor skill

This skill teaches you how to scaffold HTML artifacts that include the Daedalus editor — a self-contained round-trip editing toolbar that turns the page into an in-place WYSIWYG environment when the recipient opens it.

## What you produce

A single `.html` file the user can email, Slack, or drag into a browser. It looks normal in view mode. A small toolbar floats at bottom-right; clicking **Edit** activates edit mode (click any outlined text to type, hover a photo to replace it, drag handles to reorder blocks, floating menu for B/I/U/color/size/link). The user can save as PDF (one click, no print dialog junk), download a fresh `.html` with edits baked in, or present fullscreen.

## When to use this skill

- "Build me an editable web page about X"
- "Make a one-pager I can hand to Marketing to tweak"
- "I need a landing page someone can edit without me"
- "Spin up a report a non-developer can update"
- Any HTML output the user wants to be editable AFTER you ship it

Skip for: throwaway scratch pages, dev-targeted scripts, or anything that doesn't need post-delivery editing.

## How to scaffold an artifact

1. **Read `references/editor.md`** — that's the full reference. It contains the toolbar's HTML, CSS, and JS code blocks (copy them verbatim into your artifact), the markup contract for editable regions and photos, the theming hooks, and design rationale.

2. **Pick a starting template** based on the user's request — do NOT ask if the match is clear.

   **First, discover custom templates.** If `~/.daedalus/templates/` exists, list its `*.html` files and read each one's leading HTML comment for `Keywords:` and `Description:` (the convention is documented in `templates/README.md`). Match the user's request against those keywords alongside the bundled lookup below — a custom template is selectable exactly like a bundled one. **On a filename collision with a bundled template, the custom one wins**; note it to the user in one line when it happens (e.g. "Using your custom `onepager.html`."). If `~/.daedalus/templates/` doesn't exist, skip this and use the bundled table only.

   Bundled lookup:

   | User mentions / wants | Use template |
   |---|---|
   | "blog post", "article", "essay", "writeup", "explainer" | `blog-post.html` |
   | "case study", "customer story", "success story" | `case-study.html` |
   | "changelog", "release notes", "version history", "what's new" | `changelog.html` |
   | "comparison", "us vs them", "vendor eval", "buyer's guide", "feature matrix" | `comparison-matrix.html` |
   | "dashboard", "KPI", "metrics", "OKR check-in", "weekly numbers" | `dashboard.html` |
   | "invite", "event", "save the date", "RSVP", "launch party" | `invitation.html` |
   | "landing page", "product page", "microsite", "campaign page" | `landing.html` |
   | "memo", "business memo", "internal memo" | `memo.html` |
   | "newsletter", "digest", "issue", "subscriber update" | `newsletter.html` |
   | "one-pager", "summary", "exec brief", "overview", "product brief" | `onepager.html` |
   | "pricing", "tiers", "plans", "sponsorship packages" | `pricing-table.html` |
   | "PRD", "product spec", "RFC", "feature brief", "engineering spec", "requirements doc" | `product-spec.html` |
   | "recipe" | `recipe.html` |
   | "resume", "CV", "experience" | `resume.html` |
   | "proposal", "SOW", "statement of work", "agency pitch", "scope of work" | `sales-proposal.html` |
   | "status report", "weekly update", "project update", "standup notes" | `status-report.html` |
   | something else / unclear | `blank.html` (minimal scaffold, you design from scratch) |

   If two templates could fit (e.g. "sales pricing one-pager" → onepager OR pricing-table), pick the one with the stronger structural match for the request and mention the alternative in one line so the user can redirect.

   Full gallery in `templates/README.md`.

3. **Replace the `<!-- DAE_* -->` markers** in the template by inlining the corresponding block from `references/editor.md`:
   - `<!-- DAE_EDIT_TOOLBAR_HERE -->` → the toolbar HTML block
   - `/* DAE_EDIT_CSS_HERE */` → the toolbar CSS block
   - `/* DAE_EDIT_JS_HERE */` → the toolbar JS block (inside a `<script>` tag)
   - `<!-- DAE_SORTABLE_JS_HERE -->` → `<script>` with the contents of `assets/sortable.min.js`
   - `<!-- DAE_HTML2CANVAS_JS_HERE -->` → `<script>` with the contents of `assets/html2canvas.min.js`
   - `<!-- DAE_JSPDF_JS_HERE -->` → `<script>` with the contents of `assets/jspdf.umd.min.js`

   **Custom pre-inlined templates skip this step.** A custom template saved from a finished artifact already has the editor code baked in (it has no `DAE_*_HERE` markers). If the chosen template contains no markers, leave it as-is and go straight to filling content.

4. **Mark editable regions** with `data-editable` on any text element, and wrap photos in `<span class="dae-photo-wrap"><img data-editable-photo ...></span>`. Mark sortable containers with `class="dae-sortable-container"`. Set `data-pdf-root` on the top-level wrapper element so PDF export and autosave know which subtree to capture.

5. **Fill in real content** — replace `{{TOKEN}}` placeholders with the user's actual copy. Inline images as base64 data URIs (the editor is self-contained; loading external images would break offline use). Compress photos to ~2048px wide before inlining.

6. **Save to `~/Downloads/[name].html`** (or wherever the user asked). Tell them: "Open in Chrome, click the **Edit** button at bottom-right, and start typing. The toolbar shows what's editable."

## Themable, not branded

Daedalus ships with neutral defaults (grays + a blue accent + a coral warm color), plus 4 preset themes in `themes/` that the user can copy-paste:

- `themes/greek.css` — sepia parchment, terracotta + umber, serif
- `themes/dark.css` — dark mode with cyan accents
- `themes/minimal.css` — quiet grayscale, journalism-friendly
- `themes/brutalist.css` — high-contrast black borders + mono headlines

If the user wants brand colors, override the `--dae-*` CSS variables in their page's `:root`:

```css
:root {
  --dae-primary: #1a1a1a;      /* toolbar background, primary text */
  --dae-secondary: #4a4a4a;    /* secondary text */
  --dae-accent: #0066cc;       /* active states, accent text */
  --dae-warm: #cc3300;         /* PDF button, warm-color swatch */
  --dae-tint-1: #cce0ff;       /* fills */
  --dae-tint-2: #d8d8d8;       /* borders */
  --dae-tint-3: #ececec;       /* light surfaces */
  --dae-tint-4: #f6f6f6;       /* lightest surface */
  --dae-bg: #ffffff;
  --dae-fg: #1a1a1a;
}
```

The toolbar inherits the host page's font stack — to change fonts, edit the page's body font-family, not the toolbar.

## What the editor handles

Read `references/editor.md` for the full capabilities table. Highlights:
- Text editing via `contenteditable` with brand-styled outlines on hover/focus
- Photo replace (auto-compressed to 2048px) + reposition (drag to shift `object-position`) + resize (Full/Half/Third for inline photos)
- Drag-and-drop image upload: drop a file onto any photo to swap it, or onto empty doc space to insert a new photo block
- Block reorder/insert/delete via floating handles + Sortable.js
- Floating format menu (Medium/Notion style) for B/I/U, color swatches, font sizes, link insert/edit
- Autosave to localStorage every 5s while editing, with restore-on-reload banner
- Versions popover for jumping to any of the last 5 snapshots
- One-click PDF export (bypasses browser print dialog)
- HTML download (strips editor chrome, ships the clean artifact)
- Present mode (fullscreen, no chrome, Esc to exit)
- Word-choice linter (empty by default, configurable via `VIOLATIONS` array)

## When NOT to inline the editor

If the user is asking for a one-shot interactive tool (calculator, prompt tuner, dataset viewer) where there's no copy meaningful to edit, skip the toolbar. The editor is for documents, not apps.
