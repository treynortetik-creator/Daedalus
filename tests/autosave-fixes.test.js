// Regression tests for the race + security fixes shipped in v0.7.4:
//   HIGH-3: Restore button pins the version shown in banner
//   SEC-1: sanitizer strips on* / javascript: from restored HTML
//   SEC-2: download stripper does same
//   Present mode lifecycle
const { launch, makeAssert, sleep, ARTIFACT_URL } = require('./helpers/setup');

(async () => {
  const { browser, page } = await launch();
  const { assert, summary } = makeAssert();

  console.log('\nHIGH-3: Restore pins banner version, not latest');
  await page.evaluate(() => {
    const key = 'dae:autosave:' + (document.title || 'untitled');
    const html = document.querySelector('[data-pdf-root]').innerHTML
      .replace(/Replace this with your title\./, 'OLD_VERSION_MARKER title');
    localStorage.setItem(key, JSON.stringify({
      versions: [{ ts: Date.now() - 60000, html }],
    }));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(400);
  assert(await page.evaluate(() => document.querySelector('#dae-restore-prompt').classList.contains('show')),
    'restore prompt visible after reload');

  await page.click('#dae-toggle-edit');
  await sleep(200);
  await page.evaluate(() => {
    const h = document.querySelector('h1[data-editable]');
    h.focus();
    h.textContent = 'FRESH_EDIT_MARKER';
  });
  await sleep(6000);
  const versionCount = await page.evaluate(() => {
    const key = Object.keys(localStorage).filter(k => k.startsWith('dae:autosave:'))[0];
    return JSON.parse(localStorage.getItem(key)).versions.length;
  });
  assert(versionCount >= 2, `storage has both old + fresh (got ${versionCount})`);

  await page.click('#dae-restore-apply');
  await sleep(400);
  const heading = await page.evaluate(() => document.querySelector('h1[data-editable]').textContent);
  assert(heading.includes('OLD_VERSION_MARKER'), 'restored OLD version (pinned at banner-show)');
  assert(!heading.includes('FRESH_EDIT_MARKER'), 'fresh edits did NOT clobber the Restore target');

  // Clear storage for next test
  await page.evaluate(() => {
    Object.keys(localStorage).filter(k => k.startsWith('dae:autosave:'))
      .forEach(k => localStorage.removeItem(k));
  });

  console.log('\nSEC-1: sanitizer strips on* + javascript: from restored HTML');
  await page.goto(ARTIFACT_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => { window._xssFired = false; window.xssCanary = () => { window._xssFired = true; }; });
  await page.evaluate(() => {
    const key = 'dae:autosave:' + (document.title || 'untitled');
    const pdfRoot = document.querySelector('[data-pdf-root]');
    const evil = pdfRoot.innerHTML +
      '<img src="x" onerror="window.xssCanary()" data-evil="1">' +
      '<a href="javascript:window.xssCanary()" data-evil="2">click</a>';
    localStorage.setItem(key, JSON.stringify({ versions: [{ ts: Date.now(), html: evil }] }));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(400);
  await page.click('#dae-restore-apply');
  await sleep(500);
  assert(!(await page.evaluate(() => window._xssFired === true)), 'onerror did NOT fire after restore');
  assert(!(await page.evaluate(() => !!document.querySelector('[data-evil="1"][onerror]'))), 'onerror attribute stripped');
  assert(!(await page.evaluate(() => {
    const a = document.querySelector('[data-evil="2"]');
    return a && a.getAttribute('href') && /^javascript:/i.test(a.getAttribute('href'));
  })), 'javascript: href stripped');

  console.log('\nSEC-2: download stripper kills on* + javascript:');
  await page.evaluate(() => {
    const root = document.querySelector('[data-pdf-root]');
    const img = document.createElement('img');
    img.setAttribute('src', 'x');
    img.setAttribute('onerror', 'window.xssCanary()');
    img.setAttribute('data-evil', '3');
    root.appendChild(img);
    const a = document.createElement('a');
    a.setAttribute('href', 'javascript:window.xssCanary()');
    a.setAttribute('data-evil', '4');
    a.textContent = 'click';
    root.appendChild(a);
  });
  const downloadedHtml = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const orig = URL.createObjectURL;
      URL.createObjectURL = (blob) => { blob.text().then(resolve); return orig(blob); };
      document.querySelector('#dae-download').click();
    });
  });
  assert(!/onerror=/i.test(downloadedHtml), 'downloaded HTML has no onerror=');
  assert(!/href=["']javascript:/i.test(downloadedHtml), 'downloaded HTML has no javascript: hrefs');
  assert(downloadedHtml.includes('data-evil'), 'sanity: data-evil markers preserved (strip is selective)');

  console.log('\nPresent mode toggles + Esc exits');
  await page.goto(ARTIFACT_URL, { waitUntil: 'networkidle0' });
  await page.click('#dae-present');
  await sleep(300);
  assert(await page.evaluate(() => document.body.classList.contains('dae-present-mode')),
    'body.dae-present-mode after click');
  assert(await page.evaluate(() => getComputedStyle(document.querySelector('.dae-edit-toolbar')).display === 'none'),
    'toolbar hidden in present mode');
  await page.keyboard.press('Escape');
  await sleep(300);
  assert(!(await page.evaluate(() => document.body.classList.contains('dae-present-mode'))),
    'Esc exits present mode');

  const ok = summary();
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
