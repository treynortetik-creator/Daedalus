#!/usr/bin/env node
// Build dist/editor.html — the standalone single-file bundle that contains
// the entire Daedalus editor (toolbar HTML/CSS/JS + the three vendored
// libraries inlined). This is what tests run against and what end users
// can drag-and-drop into any project.
//
// Reads from plugins/daedalus/skills/editor/{references/editor.md,assets/}
// and writes to dist/editor.html.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKILL = path.join(ROOT, 'plugins/daedalus/skills/editor');
const REF = path.join(SKILL, 'references/editor.md');
const ASSETS = path.join(SKILL, 'assets');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'editor.html');

fs.mkdirSync(DIST, { recursive: true });

function extractBlock(md, lang, afterHeading) {
  const escaped = afterHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `##\\s*${escaped}[\\s\\S]*?\\n\`\`\`${lang}\\n([\\s\\S]*?)\\n\`\`\``,
    'i'
  );
  const m = md.match(pattern);
  if (!m) throw new Error(`Missing \`\`\`${lang} block after heading '${afterHeading}'`);
  return m[1];
}

const md = fs.readFileSync(REF, 'utf8');
const toolbarHtml = extractBlock(md, 'html', 'Required HTML');
const toolbarCss = extractBlock(md, 'css', 'Required CSS');
const toolbarJs = extractBlock(md, 'javascript', 'Required JS');

const sortableJs = fs.readFileSync(path.join(ASSETS, 'sortable.min.js'), 'utf8');
const html2canvasJs = fs.readFileSync(path.join(ASSETS, 'html2canvas.min.js'), 'utf8');
const jspdfJs = fs.readFileSync(path.join(ASSETS, 'jspdf.umd.min.js'), 'utf8');

const html = `<!doctype html>
<!--
  Daedalus editor — standalone bundle
  ===================================
  Drop your content inside the <article data-pdf-root> below. Every text
  element you want clickable-to-edit needs a \`data-editable\` attribute.
  Wrap photos in <span class="dae-photo-wrap"><img data-editable-photo></span>.
  Mark sortable parent containers with class="dae-sortable-container".

  Open this file in any browser. The toolbar appears at bottom-right.
  Click Edit → page becomes WYSIWYG. Cmd+B/I/U/K shortcuts work. Save as
  PDF or download a clean HTML copy. Esc exits Present mode.

  To theme: define --dae-* CSS variables in :root (see themes/ folder for
  presets). To change font, edit the body font-family below.

  Built from https://github.com/treynortetik-creator/Daedalus — MIT.
-->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Untitled — Daedalus</title>
<style>
:root {
  --dae-primary: #1a1a1a;
  --dae-secondary: #4a4a4a;
  --dae-accent: #0066cc;
  --dae-warm: #cc3300;
  --dae-tint-1: #cce0ff;
  --dae-tint-2: #d8d8d8;
  --dae-tint-3: #ececec;
  --dae-tint-4: #f6f6f6;
  --dae-bg: #ffffff;
  --dae-fg: #1a1a1a;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--dae-bg); }
body {
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  color: var(--dae-fg);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

/* ── Your page styles go here ──────────────────────────────────────── */
.page {
  max-width: 760px;
  margin: 48px auto;
  padding: 32px;
}
.page h1 { font-size: 36px; line-height: 1.15; margin: 0 0 16px; color: var(--dae-primary); }
.page p  { font-size: 16px; margin: 0 0 16px; color: var(--dae-secondary); line-height: 1.65; }

/* ── Editor toolbar CSS (do not edit) ──────────────────────────────── */
${toolbarCss}
</style>
</head>
<body>

<!-- ════════════════════════════════════════════════════════════════════
     YOUR CONTENT GOES HERE. Everything inside this <article> is what
     gets edited, saved to PDF, and round-tripped through download.
     ════════════════════════════════════════════════════════════════════ -->
<article class="page dae-sortable-container" data-pdf-root>

  <h1 data-editable>Replace this with your title.</h1>
  <p data-editable>Replace this paragraph with your content. Click into any outlined text in edit mode to type. Cmd+B/I/U for formatting. Cmd+K to add a link.</p>
  <p data-editable>Add more paragraphs, headings, or any other HTML. Mark every text element with <code>data-editable</code> if you want it editable.</p>

</article>

<!-- ════════════════════════════════════════════════════════════════════
     EDITOR — do not edit anything below this line unless you know what
     you're doing. To upgrade, replace this whole file from the dist/
     folder of https://github.com/treynortetik-creator/Daedalus.
     ════════════════════════════════════════════════════════════════════ -->

${toolbarHtml}

<script>${sortableJs}</script>
<script>${html2canvasJs}</script>
<script>${jspdfJs}</script>
<script>
${toolbarJs}
</script>

</body>
</html>
`;

fs.writeFileSync(OUT, html);
const sizeKb = Math.round(html.length / 1024);
console.log(`Wrote ${OUT} (${sizeKb} KB)`);
