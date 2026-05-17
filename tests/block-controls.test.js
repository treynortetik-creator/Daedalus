// Block control buttons (≡ + ↔ ×) — insert menu opens via +, blocks
// delete via ×, and undo restores both insertions and deletions. Drag-
// reorder via ≡ is not tested here (HTML5 native DnD is unreliable to
// simulate in headless puppeteer; works in actual browsers).
const { launch, makeAssert, sleep } = require('./helpers/setup');

(async () => {
  const { browser, page } = await launch();
  const { assert, summary } = makeAssert();

  await page.click('#dae-toggle-edit');
  await sleep(300);

  console.log('\nInsert via + button → menu opens with all primitives');
  await page.evaluate(() => {
    const h1 = document.querySelector('h1[data-editable]');
    const block = h1.closest('.dae-sortable-block') || h1;
    block.querySelector('.dae-insert').click();
  });
  await sleep(200);
  assert(!!(await page.$('.dae-insert-menu')), 'insert menu opens');
  const menuLabels = await page.evaluate(() =>
    [...document.querySelectorAll('.dae-insert-menu button')]
      .map(b => b.querySelector('.menu-label')?.textContent).filter(Boolean));
  console.log('  insert menu labels:', JSON.stringify(menuLabels));
  assert(menuLabels.includes('Heading'), 'menu includes Heading');
  assert(menuLabels.includes('Paragraph'), 'menu includes Paragraph');
  assert(menuLabels.includes('Pull quote'), 'menu includes Pull quote');
  assert(menuLabels.includes('Callout box'), 'menu includes Callout box');
  assert(menuLabels.includes('Table'), 'menu includes Table');
  assert(menuLabels.includes('Photo + caption'), 'menu includes Photo');
  assert(menuLabels.includes('Spacer'), 'menu includes Spacer');

  console.log('\nClick "Paragraph" → new <p> inserted after the source block');
  const blocksBefore = await page.evaluate(() =>
    document.querySelectorAll('[data-pdf-root] > .dae-sortable-block').length);
  await page.evaluate(() => {
    [...document.querySelectorAll('.dae-insert-menu button')]
      .find(b => b.querySelector('.menu-label')?.textContent === 'Paragraph').click();
  });
  await sleep(300);
  const blocksAfter = await page.evaluate(() =>
    document.querySelectorAll('[data-pdf-root] > .dae-sortable-block').length);
  assert(blocksAfter === blocksBefore + 1, `block count grew (${blocksBefore} → ${blocksAfter})`);

  console.log('\nDelete via × button → block removed');
  // Inject a marker block we can identify
  await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    const p = document.createElement('p');
    p.setAttribute('data-editable', '');
    p.textContent = 'DELETE_ME_MARKER';
    root.appendChild(p);
  });
  await sleep(300);
  const beforeDelete = await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    return [...root.children].some(b => b.textContent.includes('DELETE_ME_MARKER'));
  });
  assert(beforeDelete, 'marker block exists before delete');

  // Click the × on the marker block
  await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    const marker = [...root.children].find(b => b.textContent.includes('DELETE_ME_MARKER'));
    marker.querySelector('.dae-delete').click();
  });
  await sleep(200);
  const afterDelete = await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    return [...root.children].some(b => b.textContent.includes('DELETE_ME_MARKER'));
  });
  assert(!afterDelete, 'marker block deleted');

  console.log('\nUndo restores deleted block');
  // Undo only works when focus is OUTSIDE a contenteditable
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await page.click('#dae-undo');
  await sleep(200);
  const afterUndo = await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    return [...root.children].some(b => b.textContent.includes('DELETE_ME_MARKER'));
  });
  assert(afterUndo, 'deleted block restored via Cmd+Z');

  console.log('\nUndo also removes inserted block');
  // Insert via insert menu, then undo
  const beforeInsert = await page.evaluate(() =>
    document.querySelectorAll('[data-pdf-root] > .dae-sortable-block').length);
  await page.evaluate(() => {
    const h1 = document.querySelector('h1[data-editable]');
    const block = h1.closest('.dae-sortable-block') || h1;
    block.querySelector('.dae-insert').click();
  });
  await sleep(200);
  await page.evaluate(() => {
    [...document.querySelectorAll('.dae-insert-menu button')]
      .find(b => b.querySelector('.menu-label')?.textContent === 'Heading').click();
  });
  await sleep(300);
  const afterInsert = await page.evaluate(() =>
    document.querySelectorAll('[data-pdf-root] > .dae-sortable-block').length);
  assert(afterInsert === beforeInsert + 1, 'block inserted (count went up)');

  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await page.click('#dae-undo');
  await sleep(200);
  const afterUndoInsert = await page.evaluate(() =>
    document.querySelectorAll('[data-pdf-root] > .dae-sortable-block').length);
  assert(afterUndoInsert === beforeInsert, `undo removed inserted block (${afterInsert} → ${afterUndoInsert})`);

  const ok = summary();
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
