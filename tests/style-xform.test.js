// Block style transformer: convert heading↔paragraph↔pullquote↔callout
// without losing text + inline formatting. Cmd+Opt+H/P/Q/C shortcuts.
const { launch, makeAssert, sleep } = require('./helpers/setup');

(async () => {
  const { browser, page } = await launch();
  const { assert, summary } = makeAssert();

  await page.click('#dae-toggle-edit');
  await sleep(300);

  console.log('\nStyle transformer — basic conversion');
  assert(await page.evaluate(() => {
    const h = document.querySelector('h1[data-editable]');
    const block = h.closest('.dae-sortable-block') || h;
    return !!block.querySelector('.dae-style');
  }), 'Style (↔) button on text block');

  // Inject a paragraph to convert
  await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    const p = document.createElement('p');
    p.setAttribute('data-editable', '');
    p.textContent = 'This paragraph will become a heading.';
    root.appendChild(p);
  });
  await sleep(300);

  await page.evaluate(() => {
    const blocks = document.querySelectorAll('.dae-sortable-block');
    blocks[blocks.length - 1].querySelector('.dae-style').click();
  });
  await sleep(200);
  assert(!!(await page.$('.dae-style-menu')), 'style menu opens');
  const items = await page.evaluate(() =>
    [...document.querySelectorAll('.dae-style-menu button')].map(b => b.querySelector('.menu-label').textContent));
  assert(items.length === 4, `4 options offered (got ${items.length})`);
  assert(items.includes('Heading') && items.includes('Pull quote') && items.includes('Callout box'),
    'menu lists Heading / Pull quote / Callout');

  await page.evaluate(() => {
    [...document.querySelectorAll('.dae-style-menu button')]
      .find(b => b.querySelector('.menu-label').textContent === 'Heading').click();
  });
  await sleep(200);

  const conv = await page.evaluate(() => {
    const blocks = document.querySelectorAll('.dae-sortable-block');
    const last = blocks[blocks.length - 1];
    return { tag: last.tagName, text: last.textContent.replace(/[≡+↔×]/g, '').trim().slice(0, 80) };
  });
  assert(conv.tag === 'H2', `last block is now h2 (got ${conv.tag})`);
  assert(conv.text.includes('This paragraph will become a heading'), 'original text preserved in heading');
  assert(!(await page.$('.dae-style-menu')), 'menu auto-closes after selection');

  console.log('\nInline formatting preserved through conversion');
  await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    const p = document.createElement('p');
    p.setAttribute('data-editable', '');
    p.appendChild(document.createTextNode('Plain '));
    const b = document.createElement('b'); b.textContent = 'bold'; p.appendChild(b);
    p.appendChild(document.createTextNode(' and '));
    const i = document.createElement('i'); i.textContent = 'italic'; p.appendChild(i);
    p.appendChild(document.createTextNode(' and '));
    const a = document.createElement('a'); a.href = 'https://example.com'; a.textContent = 'a link'; p.appendChild(a);
    root.appendChild(p);
  });
  await sleep(200);

  await page.evaluate(() => {
    const blocks = document.querySelectorAll('.dae-sortable-block');
    blocks[blocks.length - 1].querySelector('.dae-style').click();
  });
  await sleep(150);
  await page.evaluate(() => {
    [...document.querySelectorAll('.dae-style-menu button')]
      .find(b => b.querySelector('.menu-label').textContent === 'Callout box').click();
  });
  await sleep(200);

  const fmt = await page.evaluate(() => {
    const blocks = document.querySelectorAll('.dae-sortable-block');
    const last = blocks[blocks.length - 1];
    return {
      isCallout: last.classList.contains('tldr') || !!last.querySelector('.tldr'),
      hasBold: !!last.querySelector('b'),
      hasItalic: !!last.querySelector('i'),
      hasLink: !!last.querySelector('a[href="https://example.com"]'),
    };
  });
  assert(fmt.isCallout, 'converted to callout');
  assert(fmt.hasBold, '<b> preserved');
  assert(fmt.hasItalic, '<i> preserved');
  assert(fmt.hasLink, '<a href> preserved');

  console.log('\nUndo restores original');
  await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    const p = document.createElement('p');
    p.setAttribute('data-editable', '');
    p.textContent = 'UNDO_TEST_MARKER';
    root.appendChild(p);
  });
  await sleep(200);
  await page.evaluate(() => {
    const blocks = document.querySelectorAll('.dae-sortable-block');
    blocks[blocks.length - 1].querySelector('.dae-style').click();
  });
  await sleep(150);
  await page.evaluate(() => {
    [...document.querySelectorAll('.dae-style-menu button')]
      .find(b => b.querySelector('.menu-label').textContent === 'Pull quote').click();
  });
  await sleep(200);

  const beforeUndo = await page.evaluate(() => {
    const last = document.querySelectorAll('.dae-sortable-block');
    return last[last.length - 1].textContent.includes('UNDO_TEST_MARKER');
  });
  assert(beforeUndo, 'marker preserved in pullquote');

  await page.click('#dae-undo');
  await sleep(200);
  const afterUndo = await page.evaluate(() => {
    const last = document.querySelectorAll('.dae-sortable-block');
    return { tag: last[last.length - 1].tagName, hasMarker: last[last.length - 1].textContent.includes('UNDO_TEST_MARKER') };
  });
  assert(afterUndo.hasMarker, 'marker survives undo');
  assert(afterUndo.tag === 'P', 'undo restored paragraph type');

  console.log('\nCmd+Opt+H keyboard shortcut');
  await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    const p = document.createElement('p');
    p.setAttribute('data-editable', '');
    p.textContent = 'KEYBOARD_SHORTCUT_TEST';
    root.appendChild(p);
  });
  await sleep(200);
  await page.evaluate(() => {
    const blocks = document.querySelectorAll('.dae-sortable-block');
    const last = blocks[blocks.length - 1];
    (last.querySelector('[data-editable]') || last).focus();
  });
  await page.keyboard.down('Meta');
  await page.keyboard.down('Alt');
  await page.keyboard.press('h');
  await page.keyboard.up('Alt');
  await page.keyboard.up('Meta');
  await sleep(200);

  const sc = await page.evaluate(() => {
    const blocks = document.querySelectorAll('.dae-sortable-block');
    const last = blocks[blocks.length - 1];
    return { tag: last.tagName, hasMarker: last.textContent.includes('KEYBOARD_SHORTCUT_TEST') };
  });
  assert(sc.tag === 'H2', `Cmd+Opt+H converted to heading (got ${sc.tag})`);
  assert(sc.hasMarker, 'marker preserved through keyboard shortcut');

  console.log('\nStyle NOT offered on photos/tables/spacers');
  await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    const tpl = document.querySelector('#tpl-table');
    root.appendChild(tpl.content.cloneNode(true).firstElementChild);
  });
  await sleep(300);
  assert(!(await page.evaluate(() => {
    const tables = document.querySelectorAll('.dae-table-block');
    return !!tables[tables.length - 1].querySelector('.dae-style');
  })), 'tables do NOT show Style button');

  const ok = summary();
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
