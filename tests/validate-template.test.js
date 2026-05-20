// tests/validate-template.test.js
const { execFileSync } = require('child_process');
const path = require('path');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const SCRIPT = path.resolve(__dirname, '../scripts/validate-template.js');
const FIX = path.resolve(__dirname, 'fixtures/templates');
function exitCode(file) {
  try { execFileSync(process.execPath, [SCRIPT, path.join(FIX, file)], { stdio: 'pipe' }); return 0; }
  catch (e) { return e.status; }
}
ok(exitCode('valid-marker.html') === 0, 'valid marker-style → exit 0');
ok(exitCode('valid-inlined.html') === 0, 'valid pre-inlined → exit 0');
ok(exitCode('missing-editor.html') === 1, 'no editor → exit 1');
ok(exitCode('missing-pdfroot.html') === 1, 'no data-pdf-root → exit 1');
ok(exitCode('missing-header.html') === 1, 'no Keywords/Description → exit 1');
ok(exitCode('partial-markers.html') === 1, 'partial markers → exit 1');
console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
