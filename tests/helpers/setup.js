// Shared puppeteer scaffolding. Each test file imports launch() to get a
// browser + page pointed at dist/editor.html, plus a tiny assert helper.

const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_URL = 'file://' + path.resolve(__dirname, '..', '..', 'dist', 'editor.html');

async function launch(opts = {}) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
    ...opts,
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[PAGE ERROR]', e.message));
  page.on('dialog', async (d) => { await d.dismiss(); });
  await page.goto(ARTIFACT_URL, { waitUntil: 'networkidle0' });
  return { browser, page };
}

function makeAssert() {
  const state = { pass: 0, fail: 0 };
  const assert = (cond, label) => {
    if (cond) { state.pass++; console.log('  PASS', label); }
    else { state.fail++; console.log('  FAIL', label); }
  };
  const summary = () => {
    console.log(`\nPASS: ${state.pass}  FAIL: ${state.fail}`);
    return state.fail === 0;
  };
  return { assert, summary, state };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = { launch, makeAssert, sleep, ARTIFACT_URL };
