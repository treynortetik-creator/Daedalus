#!/usr/bin/env node
// Run all tests/*.test.js files, aggregate results.
// Each test file is a standalone Node script that exits 0 on success,
// non-zero on failure. We just shell out to them in sequence and tally.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.resolve(__dirname, '..', 'tests');
const files = fs.readdirSync(TESTS_DIR)
  .filter(f => f.endsWith('.test.js'))
  .sort();

if (files.length === 0) {
  console.error('No test files found in', TESTS_DIR);
  process.exit(1);
}

const results = [];
let failures = 0;

for (const f of files) {
  const fp = path.join(TESTS_DIR, f);
  console.log(`\n━━━━━━━━━━━━━━━━ ${f} ━━━━━━━━━━━━━━━━`);
  const start = Date.now();
  try {
    execFileSync(process.execPath, [fp], { stdio: 'inherit' });
    results.push({ file: f, ok: true, ms: Date.now() - start });
  } catch (_) {
    failures++;
    results.push({ file: f, ok: false, ms: Date.now() - start });
  }
}

console.log('\n━━━━━━━━━━━━━━━━ SUMMARY ━━━━━━━━━━━━━━━━');
for (const r of results) {
  const mark = r.ok ? '✓' : '✗';
  console.log(`  ${mark}  ${r.file.padEnd(30)}  ${r.ms} ms`);
}
console.log(`\n${failures === 0 ? '✓ ALL SUITES PASSED' : `✗ ${failures} SUITE(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
