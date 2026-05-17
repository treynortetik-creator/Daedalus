// Tables + Comments (v0.3 features).
const { launch, makeAssert, sleep } = require('./helpers/setup');

(async () => {
  const { browser, page } = await launch();
  const { assert, summary } = makeAssert();

  await page.evaluate(() => localStorage.setItem('dae:author', 'Tester'));
  await page.click('#dae-toggle-edit');
  await sleep(300);

  console.log('\nTables');
  await page.evaluate(() => {
    const container = document.querySelector('.dae-sortable-container');
    const tpl = document.querySelector('#tpl-table');
    container.insertBefore(tpl.content.cloneNode(true).firstElementChild, container.firstChild);
  });
  await sleep(200);
  assert(await page.evaluate(() => !!document.querySelector('.dae-table')), 'table inserted');

  await page.evaluate(() => {
    document.querySelector('.dae-table tbody tr td').focus();
    document.querySelector('[data-table-action="row-below"]').click();
  });
  assert((await page.evaluate(() => document.querySelectorAll('.dae-table tbody tr').length)) === 3,
    'row-below adds a row');

  await page.evaluate(() => {
    document.querySelector('.dae-table tbody tr td').focus();
    document.querySelector('[data-table-action="col-right"]').click();
  });
  assert((await page.evaluate(() => document.querySelector('.dae-table thead tr').children.length)) === 4,
    'col-right adds a column');

  await page.evaluate(() => {
    document.querySelector('.dae-table tbody tr td').focus();
    document.querySelector('[data-table-action="del-row"]').click();
  });
  assert((await page.evaluate(() => document.querySelectorAll('.dae-table tbody tr').length)) === 2,
    'del-row removes a row');

  await page.evaluate(() => {
    document.querySelector('.dae-table tbody tr td').focus();
    document.querySelector('[data-table-action="del-col"]').click();
  });
  assert((await page.evaluate(() => document.querySelector('.dae-table thead tr').children.length)) === 3,
    'del-col removes a column');

  console.log('\nComments');
  await page.click('#dae-comments-toggle');
  await sleep(200);
  assert(await page.evaluate(() => document.querySelector('#dae-comments-panel').classList.contains('open')),
    'panel opens on toolbar button click');

  await page.evaluate(() => {
    const h = document.querySelector('h1[data-editable]');
    h.focus();
    const txt = h.firstChild;
    const r = document.createRange();
    r.setStart(txt, 0);
    r.setEnd(txt, Math.min(8, txt.textContent.length));
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    document.querySelector('#dae-tm-comment').click();
  });
  await sleep(300);
  assert(await page.evaluate(() => !!document.querySelector('.dae-comment-anchor')), 'anchor span wraps selection');
  assert(await page.evaluate(() => !!document.querySelector('.dae-comment-edit')), 'card in editing mode');

  await page.evaluate(() => {
    document.querySelector('.dae-comment-edit').value = 'Looks good.';
    document.querySelector('.dae-comment-edit-actions .post').click();
  });
  await sleep(200);
  assert((await page.evaluate(() => document.querySelector('.dae-comment-body')?.textContent)) === 'Looks good.',
    'body posted');
  assert((await page.evaluate(() => document.querySelector('#dae-comments-badge').textContent)) === '1',
    'badge shows 1');

  // Read via .content.textContent — the storage went into the template's
  // DocumentFragment, not the element's direct children (see _tplSet in
  // editor.md for why textContent on a <template> element is the wrong API).
  const stored = await page.evaluate(() => {
    const tpl = document.querySelector('#dae-comments-data');
    return JSON.parse(tpl.content.textContent);
  });
  assert(stored.comments.length === 1, '1 comment in template data');
  assert(stored.comments[0].body === 'Looks good.', 'body in template data');
  assert(stored.comments[0].author === 'Tester', 'author in template data');

  await page.evaluate(() => {
    [...document.querySelectorAll('.dae-comment-actions button')].find(b => b.textContent === 'Resolve').click();
  });
  await sleep(200);
  assert((await page.evaluate(() => document.querySelector('#dae-comments-badge').textContent)) === '',
    'badge empty after resolve');
  assert(await page.evaluate(() => document.querySelector('.dae-comment-anchor').classList.contains('resolved')),
    'anchor has resolved class');

  const ok = summary();
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
