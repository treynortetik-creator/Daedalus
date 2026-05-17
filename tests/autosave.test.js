// Autosave + restore + Versions menu + Discard.
// Adapted from the original autosave_test.js — uses dist/editor.html.
const { launch, makeAssert, sleep } = require('./helpers/setup');

(async () => {
  const { browser, page } = await launch();
  const { assert, summary } = makeAssert();

  console.log('\nPhase 1: edit + autosave');

  assert(!!(await page.$('.dae-edit-toolbar')), 'toolbar present');
  assert(!!(await page.$('#dae-versions')), 'Versions button present');
  assert(!!(await page.$('#dae-restore-prompt')), 'restore prompt element exists');

  const originalHeading = await page.evaluate(() => document.querySelector('h1[data-editable]').textContent);

  await page.click('#dae-toggle-edit');
  await sleep(200);
  assert(await page.evaluate(() => document.body.classList.contains('dae-edit-mode')), 'edit mode is on');

  await page.evaluate(() => {
    const h = document.querySelector('h1[data-editable]');
    h.focus();
    h.textContent = 'EDITED ' + h.textContent;
  });
  const edited = await page.evaluate(() => document.querySelector('h1[data-editable]').textContent);
  assert(edited.startsWith('EDITED '), 'heading was edited in DOM');

  console.log('  waiting 6s for autosave…');
  await sleep(6000);
  const storage = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('dae:autosave:'));
    if (!keys.length) return null;
    return { key: keys[0], data: JSON.parse(localStorage.getItem(keys[0])) };
  });
  assert(storage !== null, 'localStorage has an autosave key');
  assert(storage && Array.isArray(storage.data.versions), 'storage shape: { versions: [] }');
  assert(storage && storage.data.versions.length >= 1, `at least 1 snapshot (got ${storage ? storage.data.versions.length : 0})`);

  const snap = storage.data.versions[0];
  assert(snap && snap.html.includes('EDITED'), 'snapshot contains "EDITED"');
  assert(snap && typeof snap.ts === 'number' && snap.ts > 0, 'snapshot has numeric timestamp');
  assert(await page.evaluate(() => !document.querySelector('#dae-versions').disabled), 'Versions button now enabled');

  console.log('\nPhase 2: reload + restore prompt');
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(500);

  const afterReload = await page.evaluate(() => document.querySelector('h1[data-editable]').textContent);
  assert(!afterReload.startsWith('EDITED '), 'heading reverted to original on reload');
  assert(await page.evaluate(() => document.querySelector('#dae-restore-prompt').classList.contains('show')),
    'restore prompt visible after reload');

  const whenText = await page.evaluate(() => document.querySelector('#dae-restore-when').textContent);
  assert(whenText && whenText.length > 0, `prompt shows relative time: "${whenText}"`);

  console.log('\nPhase 3: click Restore');
  await page.click('#dae-restore-apply');
  await sleep(300);
  assert((await page.evaluate(() => document.querySelector('h1[data-editable]').textContent)).startsWith('EDITED '),
    'heading restored to EDITED state');
  assert(!(await page.evaluate(() => document.querySelector('#dae-restore-prompt').classList.contains('show'))),
    'restore prompt hidden after click');

  console.log('\nPhase 4: Versions menu');
  await page.click('#dae-toggle-edit');
  await sleep(200);
  await page.click('#dae-versions');
  await sleep(200);
  assert(!!(await page.$('.dae-versions-menu')), 'versions menu opens');
  const menuItems = await page.evaluate(() => document.querySelectorAll('.dae-versions-menu button').length);
  assert(menuItems >= 1, `menu shows at least 1 version (got ${menuItems})`);

  console.log('\nPhase 5: Discard');
  await page.evaluate(() => location.reload());
  await sleep(800);
  assert(await page.evaluate(() => document.querySelector('#dae-restore-prompt').classList.contains('show')),
    'restore prompt visible after second reload');
  await page.click('#dae-restore-discard');
  await sleep(200);
  const cleared = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('dae:autosave:'));
    return keys.length === 0;
  });
  assert(cleared, 'localStorage cleared after Discard');

  const ok = summary();
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
