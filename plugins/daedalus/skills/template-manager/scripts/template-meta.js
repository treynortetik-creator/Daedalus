// scripts/template-meta.js
'use strict';
// Parse a Daedalus template's leading HTML comment for discovery metadata.
function firstComment(html) {
  const m = html.match(/<!--([\s\S]*?)-->/);
  return m ? m[1] : '';
}
function parseTemplateHeader(html) {
  const c = firstComment(html);
  const out = { name: null, keywords: [], description: null };
  const name = c.match(/Daedalus template:\s*(.+)/i);
  if (name) out.name = name[1].trim();
  const kw = c.match(/Keywords:\s*(.+)/i);
  if (kw) out.keywords = kw[1].split(',').map(s => s.trim()).filter(Boolean);
  const desc = c.match(/Description:\s*(.+)/i);
  if (desc) out.description = desc[1].trim();
  return out;
}
module.exports = { parseTemplateHeader, firstComment };
