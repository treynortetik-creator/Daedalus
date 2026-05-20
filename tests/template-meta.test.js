// tests/template-meta.test.js
const assert = require('assert');
const { parseTemplateHeader, firstComment } = require('../scripts/template-meta');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS ' + m); } else { fail++; console.log('  FAIL ' + m); } };

const sample = `<!doctype html>
<!--
  Daedalus template: podcast-shownotes
  Keywords: podcast, show notes, episode
  Description: Episode metadata + chapters
-->
<html><head></head><body data-pdf-root></body></html>`;

const meta = parseTemplateHeader(sample);
ok(meta.name === 'podcast-shownotes', 'parses name');
ok(meta.keywords.length === 3 && meta.keywords[0] === 'podcast', 'parses keywords as trimmed list');
ok(meta.description === 'Episode metadata + chapters', 'parses description');

const none = parseTemplateHeader('<!doctype html><html></html>');
ok(none.keywords.length === 0 && none.description === null, 'missing header → empty/null, no throw');

console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
