---
description: Generate a self-contained HTML artifact with the Daedalus round-trip editor baked in. The output file opens in any browser as a normal page; clicking Edit makes it WYSIWYG-editable, with autosave, PDF export, and present mode built in.
---

# /daedalus

Generate a single self-contained HTML file with the Daedalus editor inlined. The recipient opens it in a browser and can immediately edit text, swap photos, reorder blocks, save as PDF, or present fullscreen — no install, no app, no internet required.

## How to handle this request

1. **Invoke the `editor` skill** from this plugin — it owns the markup contract, the toolbar code, and the templates.

2. **Pick a template based on the request** — use the intent-matching table in the editor skill's SKILL.md. Don't ask which template if the match is clear from the request itself ("a one-pager about X" → `onepager.html`, "weekly status report" → `status-report.html`, "blog post" → `blog-post.html`, etc.). Ask only when the request is genuinely ambiguous or doesn't map to any template.

3. **Run a focused intake** for the missing pieces only — typically 1-3 questions max. Skip questions you can already answer from the request. Examples:
   - User said "a one-pager about our Q3 results" → ask for: hero claim, 3 proof stats, CTA target. Don't ask "what format?" or "who's editing it?" — those are settled.
   - User said "build me a Greek-mythology themed memo from Hephaestus" → just write it. Don't ask "TO?" "FROM?" — Hephaestus is from, the user is to.
   - Avoid the question "do you want to use the default theme?" — apply defaults unless they mention brand colors. They can always override after.

4. **Build the artifact:**
   - Inline the toolbar HTML/CSS/JS blocks from `skills/editor/references/editor.md`
   - Inline the three vendored libraries from `skills/editor/assets/`
   - Replace `{{TOKEN}}` placeholders with real content
   - Mark editable regions (`data-editable`), photos (`dae-photo-wrap` + `data-editable-photo`), sortable containers (`dae-sortable-container`), and the PDF/restore root (`data-pdf-root`)
   - Compress and inline photos as base64 (≤2048px wide, JPEG quality 0.85)
   - Optionally inline a theme from `skills/editor/themes/` if the brief calls for a distinct vibe

5. **Save to `~/Downloads/[topic].html`** (or the user's chosen path).

6. **Tell the user:** "Open in Chrome. Bottom-right toolbar: Edit toggles WYSIWYG, Versions shows autosaves, Comments opens the review sidebar, PDF saves a clean export, Present goes fullscreen. Drag handles on each block let you reorder/insert/delete."

## When to invoke this command

Any time the user asks for an HTML artifact that needs to be editable after you hand it over — reports, one-pagers, landing pages, case studies, internal docs, microsites. If the page is throwaway (scratch tool, dev script, no copy worth editing), skip the editor and produce a plain HTML page instead.
