# Daedalus standalone bundle

`editor.html` is a single self-contained file containing the entire Daedalus editor — the toolbar, the autosave logic, PDF export, present mode, plus the three vendored JS libraries (Sortable, html2canvas, jsPDF). 692 KB. No build step, no install, no Claude Code required.

## Use it

1. **Copy `editor.html`** anywhere you want (rename it `report.html`, `proposal.html`, whatever).
2. **Open it in a browser.** Click the **Edit** button bottom-right. Click into the outlined text and start typing.
3. **Replace the placeholder content** between the `<!-- YOUR CONTENT GOES HERE -->` marker and the closing `</article>` tag. Add headings, paragraphs, images, lists — anything — and add `data-editable` to elements you want clickable-to-edit.
4. **Add photos** by wrapping them: `<span class="dae-photo-wrap"><img class="hero" src="..." data-editable-photo></span>`
5. **Save as PDF** via the toolbar's PDF button. Or **download** a fresh HTML copy with edits baked in. Or hit **Present** to go fullscreen.

That's it. The whole editor lives inside this one file.

## Theme it

Override the `--dae-*` CSS variables at the top of the file's `<style>` block, or include one of the presets from [`/plugins/daedalus/skills/editor/themes/`](../plugins/daedalus/skills/editor/themes/). All variables documented in the main [README](../README.md#theming).

## When to use this vs. the Claude Code plugin

| Use this `dist/` bundle | Use the `/daedalus` Claude Code command |
|---|---|
| You're hand-crafting the page | You want AI to scaffold content |
| You want one file, zero tooling | You want template choice + intake flow |
| You're embedding in an existing static site | You're producing one-off artifacts |

Both produce identical editor behavior — same toolbar, same shortcuts, same autosave, same PDF export. The `dist/` bundle is just the editor with a content shell; the plugin is the editor plus an AI workflow that fills the shell for you.
