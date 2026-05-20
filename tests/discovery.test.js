// tests/discovery.test.js
// Proves the parse layer behind custom-template discovery: a template dropped
// into a templates dir is found and its Keywords surface for selection. The
// ls + merge-into-the-table step itself is Claude-behavioral (driven by the
// editor SKILL.md instructions), so this covers the testable parse half.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseTemplateHeader } = require('../scripts/template-meta');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS ' + m); } else { fail++; console.log('  FAIL ' + m); } };

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dae-tpl-'));
fs.writeFileSync(path.join(dir, 'custom.html'),
  '<!doctype html>\n<!--\n  Daedalus template: my-thing\n  Keywords: widget, gadget\n  Description: A custom thing\n-->\n<html></html>');
const found = fs.readdirSync(dir).filter(f => f.endsWith('.html'))
  .map(f => parseTemplateHeader(fs.readFileSync(path.join(dir, f), 'utf8')));
ok(found.length === 1 && found[0].name === 'my-thing', 'discovers + parses a dropped template');
ok(found[0].keywords.includes('widget'), 'keywords available for selection');
fs.rmSync(dir, { recursive: true, force: true });

console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
