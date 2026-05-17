// Link insertion + edit via the URL modal. Cmd+K shortcut + the floating
// menu's link button both open the same modal. URL normalization (bare
// domains → https://, emails → mailto:, unknown schemes → rejected).
const { launch, makeAssert, sleep } = require('./helpers/setup');

(async () => {
  const { browser, page } = await launch();
  const { assert, summary } = makeAssert();

  await page.click('#dae-toggle-edit');
  await sleep(300);

  console.log('\nLink modal opens via floating menu button');
  // Select text in first paragraph
  await page.evaluate(() => {
    const p = document.querySelector('p[data-editable]');
    p.focus();
    const r = document.createRange();
    r.setStart(p.firstChild, 0);
    r.setEnd(p.firstChild, Math.min(10, p.firstChild.textContent.length));
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await sleep(200);
  await page.evaluate(() => document.querySelector('#dae-tm-link').click());
  await sleep(200);
  assert(await page.evaluate(() => document.querySelector('#dae-link-modal').classList.contains('open')),
    'link modal opens via floating menu button');

  console.log('\nBare domain auto-prefixed with https://');
  await page.evaluate(() => {
    document.querySelector('#dae-link-url').value = 'example.com';
  });
  await page.click('#dae-link-save');
  await sleep(200);
  assert(await page.evaluate(() => {
    const a = document.querySelector('p[data-editable] a');
    return a && a.getAttribute('href') === 'https://example.com';
  }), 'bare domain wrapped as <a href="https://example.com">');

  console.log('\nEditing existing link pre-fills URL + reveals Remove');
  await page.evaluate(() => {
    const a = document.querySelector('p[data-editable] a');
    const r = document.createRange();
    r.selectNodeContents(a);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await sleep(200);
  await page.evaluate(() => document.querySelector('#dae-tm-link').click());
  await sleep(200);
  assert((await page.evaluate(() => document.querySelector('#dae-link-url').value)) === 'https://example.com',
    'URL input pre-filled with existing href');
  assert(!(await page.evaluate(() => document.querySelector('#dae-link-remove').hidden)),
    'Remove button visible when editing existing link');

  console.log('\nRemove button unwraps the link');
  await page.click('#dae-link-remove');
  await sleep(200);
  assert(!(await page.evaluate(() => !!document.querySelector('p[data-editable] a'))),
    'link unwrapped after clicking Remove');

  console.log('\nBare email auto-prefixed with mailto:');
  await page.evaluate(() => {
    const ps = document.querySelectorAll('p[data-editable]');
    const p = ps[1] || ps[0];
    p.focus();
    const r = document.createRange();
    r.setStart(p.firstChild, 0);
    r.setEnd(p.firstChild, Math.min(5, p.firstChild.textContent.length));
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await sleep(200);
  await page.evaluate(() => document.querySelector('#dae-tm-link').click());
  await sleep(200);
  await page.evaluate(() => { document.querySelector('#dae-link-url').value = 'alice@example.com'; });
  await page.click('#dae-link-save');
  await sleep(200);
  assert(await page.evaluate(() => {
    const links = document.querySelectorAll('a[href^="mailto:"]');
    return [...links].some(a => a.getAttribute('href') === 'mailto:alice@example.com');
  }), 'bare email auto-prefixed mailto:');

  console.log('\nJavascript: scheme rejected');
  await page.reload({ waitUntil: 'networkidle0' });
  await page.click('#dae-toggle-edit');
  await sleep(300);
  await page.evaluate(() => {
    const p = document.querySelector('p[data-editable]');
    p.focus();
    const r = document.createRange();
    r.setStart(p.firstChild, 0);
    r.setEnd(p.firstChild, 5);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await sleep(200);
  await page.evaluate(() => document.querySelector('#dae-tm-link').click());
  await sleep(200);
  await page.evaluate(() => { document.querySelector('#dae-link-url').value = 'javascript:alert(1)'; });
  await page.click('#dae-link-save');
  await sleep(200);
  assert(!(await page.evaluate(() => {
    const a = document.querySelector('p[data-editable] a');
    return a && /^javascript:/i.test(a.getAttribute('href') || '');
  })), 'javascript: URL rejected — no link with javascript: href created');

  console.log('\nCmd+K opens link modal');
  await page.reload({ waitUntil: 'networkidle0' });
  await page.click('#dae-toggle-edit');
  await sleep(300);
  await page.evaluate(() => {
    const p = document.querySelector('p[data-editable]');
    p.focus();
    const r = document.createRange();
    r.setStart(p.firstChild, 0);
    r.setEnd(p.firstChild, 5);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  });
  await page.keyboard.down('Meta');
  await page.keyboard.press('k');
  await page.keyboard.up('Meta');
  await sleep(200);
  assert(await page.evaluate(() => document.querySelector('#dae-link-modal').classList.contains('open')),
    'Cmd+K opens the modal');

  const ok = summary();
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
