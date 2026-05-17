// Drag-and-drop image upload: replace on photo, insert on empty space,
// non-image no-op, view-mode no-op.
const { launch, makeAssert, sleep } = require('./helpers/setup');

const RED_PIXEL_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5/hPwAHggJ/PchI7wAAAABJRU5ErkJggg==';

(async () => {
  const { browser, page } = await launch();
  const { assert, summary } = makeAssert();

  console.log('\nDrag-drop chrome');
  await page.click('#dae-toggle-edit');
  await sleep(200);

  await page.evaluate((b64) => {
    const dt = new DataTransfer();
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    dt.items.add(new File([bytes], 'test.png', { type: 'image/png' }));
    document.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }));
  }, RED_PIXEL_B64);
  await sleep(100);
  assert(await page.evaluate(() => document.body.classList.contains('dae-dragging')),
    'body.dae-dragging on dragenter with files');

  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array(1)], 'x.png', { type: 'image/png' }));
    document.dispatchEvent(new DragEvent('dragleave', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  await sleep(100);
  assert(!(await page.evaluate(() => document.body.classList.contains('dae-dragging'))),
    'body sheds dae-dragging on dragleave');

  console.log('\nDrop on existing photo → replaces');
  await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    const tpl = document.querySelector('#tpl-photo');
    root.appendChild(tpl.content.cloneNode(true).firstElementChild);
  });
  await sleep(300);
  const before = await page.evaluate(() => document.querySelectorAll('[data-editable-photo]').length);

  const origSrc = await page.evaluate(() => {
    const imgs = document.querySelectorAll('[data-editable-photo]');
    return imgs[imgs.length - 1].src;
  });

  await page.evaluate((b64) => {
    const imgs = document.querySelectorAll('[data-editable-photo]');
    const target = imgs[imgs.length - 1];
    const dt = new DataTransfer();
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    dt.items.add(new File([bytes], 'replace.png', { type: 'image/png' }));
    const ev = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
    Object.defineProperty(ev, 'target', { value: target, configurable: true });
    target.dispatchEvent(ev);
  }, RED_PIXEL_B64);
  await sleep(1500);

  const newSrc = await page.evaluate(() => {
    const imgs = document.querySelectorAll('[data-editable-photo]');
    return imgs[imgs.length - 1].src;
  });
  assert(newSrc !== origSrc, 'photo src changed after drop');
  assert(newSrc.startsWith('data:image/jpeg'), 'dropped photo is now compressed JPEG');
  assert((await page.evaluate(() => document.querySelectorAll('[data-editable-photo]').length)) === before,
    'replace did NOT insert a new block');

  console.log('\nDrop on empty space → inserts');
  await page.evaluate((b64) => {
    const root = document.querySelector('[data-pdf-root]');
    const dt = new DataTransfer();
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    dt.items.add(new File([bytes], 'insert.png', { type: 'image/png' }));
    const ev = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
    Object.defineProperty(ev, 'target', { value: root, configurable: true });
    root.dispatchEvent(ev);
  }, RED_PIXEL_B64);
  await sleep(1500);

  const after = await page.evaluate(() => document.querySelectorAll('[data-editable-photo]').length);
  assert(after === before + 1, `inserted exactly 1 new photo (was ${before}, now ${after})`);

  console.log('\nNon-image drop → ignored');
  const before2 = after;
  await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    const dt = new DataTransfer();
    dt.items.add(new File(['just text'], 'note.txt', { type: 'text/plain' }));
    const ev = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
    Object.defineProperty(ev, 'target', { value: root, configurable: true });
    root.dispatchEvent(ev);
  });
  await sleep(500);
  assert((await page.evaluate(() => document.querySelectorAll('[data-editable-photo]').length)) === before2,
    'non-image drop is no-op');

  console.log('\nView-mode drop → ignored');
  await page.click('#dae-toggle-edit');
  await sleep(200);
  const before3 = await page.evaluate(() => document.querySelectorAll('[data-editable-photo]').length);
  await page.evaluate((b64) => {
    const root = document.querySelector('[data-pdf-root]');
    const dt = new DataTransfer();
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    dt.items.add(new File([bytes], 'shouldnotwork.png', { type: 'image/png' }));
    const ev = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
    Object.defineProperty(ev, 'target', { value: root, configurable: true });
    root.dispatchEvent(ev);
  }, RED_PIXEL_B64);
  await sleep(800);
  assert((await page.evaluate(() => document.querySelectorAll('[data-editable-photo]').length)) === before3,
    'view-mode drop is no-op');

  const ok = summary();
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
