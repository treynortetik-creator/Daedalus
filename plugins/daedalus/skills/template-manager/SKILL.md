---
name: template-manager
description: Create and manage custom Daedalus templates that survive plugin updates. Use when the user wants to "save this as a template", "import a template", "make a new template", "create a template for X", "turn this into a reusable template", "list my templates", or "delete a template". Custom templates live in ~/.daedalus/templates/ and are auto-discovered by the editor skill at scaffold time.
---

# Daedalus template manager

Lets the user build a personal library of reusable templates in `~/.daedalus/templates/`. Templates there survive plugin updates (they live outside the plugin cache) and are auto-discovered by the `editor` skill when scaffolding — selectable exactly like the bundled templates.

## Storage + naming

- All custom templates live in `~/.daedalus/templates/`. Create it (`mkdir -p`) on first write.
- Filename is a kebab-case slug of the template name: `<slug>.html` — lowercase, spaces → hyphens, strip anything but `[a-z0-9-]`, collapse repeats.
- Every template carries a metadata header as its **leading HTML comment** (right after `<!doctype html>`):
  ```html
  <!--
    Daedalus template: <name>
    Keywords: <comma-separated trigger phrases>
    Description: <one-line summary>
  -->
  ```
  `Keywords` drive the editor skill's auto-selection; `Description` shows in listings. Both are required.

## The validate-and-repair gate (every create path ends here)

Before writing ANY template to disk, validate it by running the validator script in this skill's `scripts/` directory:

```
node <this-skill-dir>/scripts/validate-template.js <file>
```

- **Exit 0** → valid, write it.
- **Exit 1** → invalid; read the printed report and repair, then re-run until it passes:
  - **Missing markers** (marker-style only): re-inject following the inline contract in `../editor/SKILL.md` step 3 — the 3 library markers wrap in `<script>`, `DAE_EDIT_CSS_HERE` goes in a `<style>`, `DAE_EDIT_JS_HERE` inside a `<script>`. Not a flat string insert.
  - **Mixed shape** (both inlined toolbar and markers): pick one. Has a real inlined toolbar → strip the stray markers (pre-inlined). Otherwise → complete the 6 markers (marker-style).
  - **Missing data-pdf-root**: add `data-pdf-root` to the top-level content wrapper element.
  - **Missing header**: infer `Keywords`/`Description` from the content, or ask the user one question, then write the header.

This is a **structural smoke check, not a runtime guarantee** — it ensures the file opens as a Daedalus template. If an imported file genuinely can't be salvaged, tell the user plainly; don't write a brick.

## Intents

Infer which from the user's request. Ask only if genuinely ambiguous.

### Import — user has an existing HTML file (path or pasted)
1. Read it.
2. Validate → repair as needed.
3. Slugify a name (ask if none is obvious from the file/request), write to `~/.daedalus/templates/<slug>.html`.
4. Confirm: "Saved as `<slug>`. It'll auto-match on: <keywords>."

### Save-as — turn a finished artifact into a reusable template
For when the user just generated (or has open) a Daedalus artifact and wants it reusable.
1. Take the artifact's HTML.
2. **Strip content only within the `[data-pdf-root]` subtree** (leave the editor toolbar/scripts elsewhere untouched): replace text inside `[data-editable]` elements with meaningful `{{TOKEN}}` placeholders (e.g. `{{HEADLINE}}`, `{{BODY}}`, `{{CTA}}`), and replace photo `src` values with a small placeholder. Keep layout, structure, and theme (`:root` vars).
3. Add the metadata header. This template stays **pre-inlined** — keep the editor code baked in, do NOT re-markerize.
4. Validate → write → confirm.

### Generate — build a new template from a description
For when the user describes a template they want ("a template for podcast show notes with episode meta, chapter list, transcript").
1. Brief Q&A: purpose, the sections it needs, any theme leaning. A few questions, not an interrogation.
2. Write a lean **marker-style** template following the contract in `../editor/SKILL.md` and `../editor/references/editor.md`: real structure with `{{TOKEN}}` placeholders, the 6 `DAE_*_HERE` markers (NOT inlined code), `data-pdf-root` on the wrapper, and the metadata header.
3. Validate → write → confirm.

### List / delete
- **List**: enumerate `~/.daedalus/templates/*.html`, print each name + `Description` (parse the headers). If the dir is empty or absent, say so.
- **Delete**: match by name/slug, confirm with the user, remove the file.

## Notes
- You don't wire anything into the editor's lookup table — the metadata header IS the contract, and the editor skill discovers `~/.daedalus/templates/` on its own at scaffold time.
- Custom templates shadow bundled ones on filename collision.
- Marker-style vs pre-inlined: **generate** produces marker-style (lean, inlined at scaffold time); **save-as** produces pre-inlined (editor already baked in). The editor skill handles both — it skips inlining when a template has no markers.
