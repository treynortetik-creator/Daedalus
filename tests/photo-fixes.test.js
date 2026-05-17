// Photo lifecycle fixes (v0.5.x):
//   - Reposition mode: click outside exits (overlay restored)
//   - Free-resize: dragging wrapper grows the inner img, not empty space
const { launch, makeAssert, sleep } = require('./helpers/setup');

(async () => {
  const { browser, page } = await launch();
  const { assert, summary } = makeAssert();

  await page.click('#dae-toggle-edit');
  await sleep(300);

  // Inject a bare photo-wrap (NOT the tpl-photo template — that wraps in a
  // .dae-photo-block container, which would be the sortable-block instead
  // of the wrap itself, and the resize fix targets `.dae-photo-wrap.dae-
  // sortable-block`). Bare wrap matches the Lestat artifact's pattern.
  await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    const wrap = document.createElement('span');
    wrap.className = 'dae-photo-wrap';
    const img = document.createElement('img');
    img.setAttribute('data-editable-photo', '');
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5/hPwAHggJ/PchI7wAAAABJRU5ErkJggg==';
    img.style.height = '200px';
    img.style.width = '100%';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    wrap.appendChild(img);
    root.appendChild(wrap);
  });
  await sleep(300);

  console.log('\nFix: click-outside exits reposition mode');
  await page.evaluate(() => {
    const btn = document.querySelector('.dae-photo-reposition-btn');
    if (btn) btn.click();
  });
  await sleep(200);
  assert(await page.evaluate(() => {
    const img = document.querySelector('[data-editable-photo]');
    return img && img.classList.contains('dae-reposition-mode');
  }), 'image enters reposition mode');
  assert(await page.evaluate(() => {
    const o = document.querySelector('.dae-photo-overlay');
    return o && o.style.display === 'none';
  }), 'overlay hidden during reposition');

  // Click outside the photo wrapper
  await page.evaluate(() => {
    const target = document.querySelector('h1[data-editable]');
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await sleep(200);
  assert(!(await page.evaluate(() => {
    const img = document.querySelector('[data-editable-photo]');
    return img && img.classList.contains('dae-reposition-mode');
  })), 'clicking outside exits reposition');
  assert(await page.evaluate(() => {
    const o = document.querySelector('.dae-photo-overlay');
    return o && o.style.display !== 'none';
  }), 'overlay restored (Replace button accessible again)');

  console.log('\nFix: free-resize grows the image');
  const heightBefore = await page.evaluate(() =>
    document.querySelector('[data-editable-photo]').getBoundingClientRect().height);
  await page.evaluate(() => {
    const wrap = document.querySelector('.dae-photo-wrap.dae-sortable-block');
    wrap.style.width = '500px';
    wrap.style.height = '400px';
  });
  await sleep(200);
  const heightAfter = await page.evaluate(() =>
    document.querySelector('[data-editable-photo]').getBoundingClientRect().height);
  console.log(`  img height before=${heightBefore}, after wrapper→400px=${heightAfter}`);
  assert(heightAfter > heightBefore + 50, `img grew with wrapper (${heightBefore} → ${heightAfter})`);
  assert(heightAfter >= 350, `img fills the resized wrapper (${heightAfter} of 400px)`);

  const ok = summary();
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
