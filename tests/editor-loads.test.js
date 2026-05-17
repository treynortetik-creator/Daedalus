// Basic smoke: editor + all 3 vendored libs load, edit mode toggles, text
// is editable, autosave fires, PDF generates.
const { launch, makeAssert, sleep } = require('./helpers/setup');

(async () => {
  const { browser, page } = await launch();
  const { assert, summary } = makeAssert();

  assert(await page.evaluate(() => !!document.querySelector('.dae-edit-toolbar')), 'toolbar loaded');
  assert(await page.evaluate(() => !!document.querySelector('#dae-versions')), 'Versions button');
  assert(await page.evaluate(() => !!document.querySelector('#dae-present')), 'Present button');
  assert(await page.evaluate(() => !!document.querySelector('#dae-comments-toggle')), 'Comments button');
  assert(await page.evaluate(() => !!document.querySelector('[data-pdf-root]')), 'pdf-root container');
  assert(await page.evaluate(() => typeof window.Sortable === 'function'), 'Sortable loaded');
  assert(await page.evaluate(() => typeof window.html2canvas === 'function'), 'html2canvas loaded');
  assert(await page.evaluate(() => window.jspdf && typeof window.jspdf.jsPDF === 'function'), 'jsPDF loaded');

  await page.click('#dae-toggle-edit');
  await sleep(200);
  assert(await page.evaluate(() => document.body.classList.contains('dae-edit-mode')), 'edit mode toggles on');

  await page.evaluate(() => {
    const h = document.querySelector('h1[data-editable]');
    h.focus();
    h.textContent = 'TEST EDIT';
  });
  const edited = await page.evaluate(() => document.querySelector('h1[data-editable]').textContent);
  assert(edited === 'TEST EDIT', 'inline text edit works');

  console.log('  waiting 6s for autosave…');
  await sleep(6000);
  const stored = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('dae:autosave:'));
    if (!key) return null;
    const d = JSON.parse(localStorage.getItem(key));
    return d.versions[0] && d.versions[0].html.includes('TEST EDIT');
  });
  assert(stored, 'autosave snapshot captured');

  await page.evaluate(() => {
    window._toasts = [];
    const t = document.querySelector('#dae-toast');
    new MutationObserver(() => window._toasts.push(t.textContent)).observe(t, { childList: true, characterData: true, subtree: true });
  });
  await page.click('#dae-save-pdf');
  await sleep(4000);
  const toasts = await page.evaluate(() => window._toasts);
  assert(toasts.some(t => /PDF saved/i.test(t)), 'PDF saved');

  const ok = summary();
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
