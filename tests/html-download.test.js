// HTML download produces a clean, re-openable artifact: edit chrome
// stripped, scripts gone, but user-edited content present, and the
// comments-data template preserved if any comments exist.
const { launch, makeAssert, sleep } = require('./helpers/setup');

async function captureDownload(page, clickSelector) {
  return page.evaluate(async (sel) => {
    return new Promise((resolve) => {
      const orig = URL.createObjectURL;
      URL.createObjectURL = (blob) => { blob.text().then(resolve); return orig(blob); };
      document.querySelector(sel).click();
    });
  }, clickSelector);
}

(async () => {
  const { browser, page } = await launch();
  const { assert, summary } = makeAssert();

  await page.click('#dae-toggle-edit');
  await sleep(200);

  // Make a recognizable edit
  await page.evaluate(() => {
    const h = document.querySelector('h1[data-editable]');
    h.focus();
    h.textContent = 'DOWNLOAD_MARKER_HEADING';
  });

  console.log('\nDownload contains the edits');
  const downloaded = await captureDownload(page, '#dae-download');
  assert(downloaded.includes('DOWNLOAD_MARKER_HEADING'), 'downloaded HTML contains the edited heading');

  console.log('\nDownload strips all edit-mode chrome');
  assert(!/class=["'][^"']*dae-edit-toolbar/i.test(downloaded), 'toolbar element stripped');
  assert(!/id=["']dae-text-menu/i.test(downloaded), 'floating menu stripped');
  assert(!/id=["']dae-comments-panel/i.test(downloaded), 'comments panel stripped');
  assert(!/class=["'][^"']*dae-block-controls/i.test(downloaded), 'block-controls divs stripped');
  assert(!/class=["'][^"']*dae-add-block-btn/i.test(downloaded), 'add-block buttons stripped');
  assert(!/class=["'][^"']*dae-photo-overlay/i.test(downloaded), 'photo overlays stripped');
  assert(!/<script\b/i.test(downloaded), 'all <script> tags stripped');
  assert(!/contenteditable=/i.test(downloaded), 'contenteditable attrs stripped');

  console.log('\nDownload starts with valid DOCTYPE + <html>');
  assert(/^<!DOCTYPE\s+html>/i.test(downloaded.trim()), 'starts with <!DOCTYPE html>');
  assert(/<html[\s>]/i.test(downloaded), 'has <html> tag');
  assert(/<\/html>/i.test(downloaded), 'has closing </html>');

  console.log('\nDownload preserves user-added comments (round-trip)');
  // Add a comment, then download, verify it's in the output
  await page.evaluate(() => localStorage.setItem('dae:author', 'Tester'));
  await page.evaluate(() => {
    const ps = document.querySelectorAll('p[data-editable]');
    const p = ps[0];
    p.focus();
    const r = document.createRange();
    r.setStart(p.firstChild, 0);
    r.setEnd(p.firstChild, 5);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    document.querySelector('#dae-tm-comment').click();
  });
  await sleep(300);
  await page.evaluate(() => {
    document.querySelector('.dae-comment-edit').value = 'ROUNDTRIP_COMMENT_BODY';
    document.querySelector('.dae-comment-edit-actions .post').click();
  });
  await sleep(300);

  const withComments = await captureDownload(page, '#dae-download');
  assert(/id=["']dae-comments-data["']/i.test(withComments), 'dae-comments-data template preserved');
  assert(/ROUNDTRIP_COMMENT_BODY/.test(withComments), 'comment body present in downloaded HTML');
  assert(/dae-comment-anchor/.test(withComments), 'comment anchor span preserved');

  console.log('\nDownload sanitizes on* / javascript: defensively');
  // Inject hostile attrs directly into DOM then download
  await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    const img = document.createElement('img');
    img.setAttribute('src', 'x');
    img.setAttribute('onerror', 'window._evil()');
    img.setAttribute('data-evil', '1');
    root.appendChild(img);
    const a = document.createElement('a');
    a.setAttribute('href', 'javascript:void(0)');
    a.setAttribute('data-evil', '2');
    a.textContent = 'click';
    root.appendChild(a);
  });
  const wormCheck = await captureDownload(page, '#dae-download');
  assert(!/onerror=/i.test(wormCheck), 'on* attributes stripped from download');
  assert(!/href=["']javascript:/i.test(wormCheck), 'javascript: hrefs stripped from download');
  assert(/data-evil/.test(wormCheck), 'sanity: data-evil markers still present (strip is selective)');

  const ok = summary();
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
