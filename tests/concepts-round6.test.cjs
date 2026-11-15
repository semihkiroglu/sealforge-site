/* Round 6 component/brand study, not a production signing test. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = (process.env.SITE_URL || 'file:///home/ubuntu/Projects/sealforge-site/').replace(/\/?$/, '/');
const evidence = process.env.CONCEPT_EVIDENCE;
if (evidence) fs.mkdirSync(evidence, { recursive: true });
function luminance(s) {
  const v = s.match(/[\d.]+/g).slice(0, 3).map(Number).map(n => {
    n /= 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
  });
  return v.reduce((a, n, i) => a + n * [.2126, .7152, .0722][i], 0);
}
function contrast(a, b) {
  const [low, high] = [luminance(a), luminance(b)].sort((a, b) => a - b);
  return (high + .05) / (low + .05);
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/home/ubuntu/.hermes/tools/chromium-1208/chrome-linux/chrome' });
  const rows = [];
  try {
    // The moving latest entry belongs to Round 7; this round stays immutable.
    for (const route of ['concepts/round-6/']) for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let url = base + route;
      if (url.startsWith('file:')) url += 'index.html';
      const response = await page.goto(url, { waitUntil: 'load' });
      assert(response && response.status() === 200, url);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('meta[name=robots]').getAttribute('content'), 'noindex,nofollow');
      assert.equal(await page.locator('[data-token]').count(), 6);
      assert.equal(await page.locator('#application').count(), 1);
      for (const mode of ['light', 'dark']) {
        if (mode === 'dark') await page.locator('#tone').click();
        for (const stamp of ['quiet', 'copper']) {
          await page.locator(`button[data-stamp="${stamp}"]`).click();
          await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
          assert.equal(await page.locator('html').getAttribute('data-tone'), mode);
          assert.equal(await page.locator('html').getAttribute('data-stamp'), stamp);
          assert.equal(await page.locator(`button[data-stamp="${stamp}"]`).getAttribute('aria-pressed'), 'true');
          assert.equal(await page.locator('#tone').getAttribute('aria-pressed'), String(mode === 'dark'));
          assert.equal((await page.locator('#accent-copy').innerText()).includes('both'), stamp === 'copper');
          assert(await page.locator('img[data-art]').evaluateAll((images, args) => images.every(i => i.src.includes(`/${args.stamp}-`) && i.src.endsWith(`-${args.mode}.png`)), { stamp, mode }));
          assert(await page.locator('img[data-mode]').evaluateAll((images, mode) => images.every(i => i.src.endsWith(`-${mode}.png`)), mode));
          assert(await page.locator('img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0)));
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
          const pairs = await page.evaluate(() => {
            const s = e => getComputedStyle(e), body = s(document.body), active = s(document.querySelector('button[data-stamp][aria-pressed=true]'));
            return [[body.color, body.backgroundColor], [s(document.querySelector('.lede')).color, body.backgroundColor], [active.color, active.backgroundColor], [s(document.querySelector('nav a')).color, body.backgroundColor]];
          });
          const ratios = pairs.map(pair => contrast(...pair));
          assert(ratios.every(r => r >= 4.5), JSON.stringify({ mode, stamp, ratios }));
          assert.deepEqual(errors, []);
          rows.push({ route, width, mode, stamp, minimumTextContrast: Math.min(...ratios), overflow: 0, errors: 0 });
          if (evidence && route === 'concepts/round-6/' && width >= 390 && stamp === 'quiet') {
            await page.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
            await page.screenshot({ path: path.join(evidence, `${width}-${mode}.png`), fullPage: true });
            await page.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = false));
          }
        }
      }
      const links = await page.locator('a').evaluateAll(a => a.map(i => i.href));
      for (const link of links) {
        const u = new URL(link);
        if (u.protocol === 'file:') assert(fs.existsSync(decodeURIComponent(u.pathname)), link);
        if (u.hash && u.pathname === new URL(page.url()).pathname) assert.equal(await page.locator(u.hash).count(), 1);
      }
      await page.locator('#tone').click();
      assert.equal(await page.locator('#tone').getAttribute('aria-pressed'), 'false');
      await page.close();
    }
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 } });
    const page = await context.newPage();
    await page.goto(base + 'concepts/round-6/' + (base.startsWith('file:') ? 'index.html' : ''), { waitUntil: 'load' });
    assert(await page.locator('.hero-art img').isVisible());
    assert(!(await page.locator('.tools').isVisible()));
    assert(await page.locator('[data-token] code').evaluateAll(nodes => nodes.every(n => /^#[\dA-F]{6}$/.test(n.textContent))));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    await context.close();
    if (evidence) fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(rows, null, 2));
    console.log(JSON.stringify({ states: rows.length, minimumTextContrast: Math.min(...rows.map(r => r.minimumTextContrast)), images: 'loaded', noJavaScript: true, overflow: 0, errors: 0 }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
