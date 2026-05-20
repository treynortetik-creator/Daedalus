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
