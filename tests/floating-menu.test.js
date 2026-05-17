// Floating text menu: B/I/U buttons apply formatting, color swatches wrap
// selection in dae-color-N span, size popover wraps in dae-size-N. These
// were never directly tested before — only indirectly via the autosave
// snapshot containing some formatted text.
const { launch, makeAssert, sleep } = require('./helpers/setup');

async function selectFirstParagraphText(page, len) {
  // Find the first text node descendant of the first p[data-editable].
  // After Bold/Italic/Underline wrap content in <b>/<i>/<u>, firstChild may
  // no longer be a text node — we need to traverse to find one.
  await page.evaluate((n) => {
    const p = document.querySelector('p[data-editable]');
    p.focus();
    function findText(node) {
      if (node.nodeType === 3) return node;
      for (const c of node.childNodes) {
        const r = findText(c);
        if (r) return r;
      }
      return null;
    }
    const txt = findText(p);
    if (!txt) return;
    const r = document.createRange();
    r.setStart(txt, 0);
    r.setEnd(txt, Math.min(n, txt.textContent.length));
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
  }, len);
}

(async () => {
  const { browser, page } = await launch();
  const { assert, summary } = makeAssert();

  await page.click('#dae-toggle-edit');
  await sleep(300);

  console.log('\nFloating menu — Bold');
  await selectFirstParagraphText(page, 15);
  await sleep(200);
  assert(await page.evaluate(() => document.querySelector('#dae-text-menu')?.classList.contains('visible')),
    'floating menu visible on selection');

  await page.evaluate(() => document.querySelector('#dae-tm-bold').click());
  await sleep(150);
  // execCommand('bold') wraps in <b> or applies font-weight; check either way
  const hasBold = await page.evaluate(() => {
    const p = document.querySelector('p[data-editable]');
    return !!p.querySelector('b, strong') || /font-weight/.test(p.innerHTML);
  });
  assert(hasBold, 'Bold button applied formatting');

  console.log('\nFloating menu — Italic');
  await selectFirstParagraphText(page, 10);
  await sleep(200);
  await page.evaluate(() => document.querySelector('#dae-tm-italic').click());
  await sleep(150);
  const hasItalic = await page.evaluate(() => {
    const p = document.querySelector('p[data-editable]');
    return !!p.querySelector('i, em') || /font-style/.test(p.innerHTML);
  });
  assert(hasItalic, 'Italic button applied formatting');

  console.log('\nFloating menu — Underline');
  await selectFirstParagraphText(page, 8);
  await sleep(200);
  await page.evaluate(() => document.querySelector('#dae-tm-underline').click());
  await sleep(150);
  const hasUnderline = await page.evaluate(() => {
    const p = document.querySelector('p[data-editable]');
    return !!p.querySelector('u') || /text-decoration/.test(p.innerHTML);
  });
  assert(hasUnderline, 'Underline button applied formatting');

  console.log('\nFloating menu — Color swatch wraps in dae-color-N span');
  // Use the second paragraph to keep tests cleaner
  await page.evaluate(() => {
    const ps = document.querySelectorAll('p[data-editable]');
    const p = ps[1] || ps[0];
    p.focus();
    const txt = p.firstChild;
    const r = document.createRange();
    r.setStart(txt, 0);
    r.setEnd(txt, Math.min(12, txt.textContent.length));
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await sleep(200);
  await page.evaluate(() => {
    document.querySelector('.dae-tm-color[data-color="3"]').click();
  });
  await sleep(150);
  const hasColorSpan = await page.evaluate(() => !!document.querySelector('span.dae-color-3'));
  assert(hasColorSpan, 'color swatch wrapped selection in span.dae-color-3');

  console.log('\nFloating menu — Color reset unwraps');
  // Select text inside the color span
  await page.evaluate(() => {
    const span = document.querySelector('span.dae-color-3');
    const txt = span.firstChild;
    const r = document.createRange();
    r.selectNodeContents(span);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await sleep(200);
  await page.evaluate(() => document.querySelector('.dae-tm-color[data-color="0"]').click());
  await sleep(150);
  assert(!(await page.evaluate(() => !!document.querySelector('span.dae-color-3'))),
    'color reset unwraps the span');

  console.log('\nFloating menu — Font-size popover');
  // Reload to clean state
  await page.reload({ waitUntil: 'networkidle0' });
  await page.click('#dae-toggle-edit');
  await sleep(300);
  await selectFirstParagraphText(page, 10);
  await sleep(200);
  await page.evaluate(() => document.querySelector('#dae-tm-size').click());
  await sleep(200);
  assert(!!(await page.$('.dae-size-menu')), 'font-size popover opens');
  await page.evaluate(() => {
    [...document.querySelectorAll('.dae-size-menu button')]
      .find(b => /Large$/.test(b.textContent.trim()) || /^Large/.test(b.textContent.trim()))?.click();
  });
  await sleep(150);
  const hasSizeSpan = await page.evaluate(() =>
    !!document.querySelector('span.dae-size-lg, span.dae-size-xl, span.dae-size-sm, span.dae-size-xs, span.dae-size-2xl'));
  assert(hasSizeSpan, 'font-size pick wrapped selection in dae-size-* span');

  const ok = summary();
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
