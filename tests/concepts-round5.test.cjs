/* Isolated Round 5 preview checks; does not exercise the signing application. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = (process.env.SITE_URL || 'file:///home/ubuntu/Projects/sealforge-site/').replace(/\/?$/, '/');
const out = process.env.CONCEPT_EVIDENCE;
if (out) fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/home/ubuntu/.hermes/tools/chromium-1208/chrome-linux/chrome' });
  const report = [];
  try {
    // The latest entry now belongs to Round 6; keep this round's regression immutable.
    for (const route of ['concepts/round-5/', 'concepts/round-5/grip.html', 'concepts/round-5/imprint.html']) {
      for (const width of [320, 390, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 960 } });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        let url = base + route;
        if (base.startsWith('file:') && url.endsWith('/')) url += 'index.html';
        const response = await page.goto(url, { waitUntil: 'load' });
        assert(response && response.status() === 200, url);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('html').getAttribute('lang'), 'en');
        assert.equal(await page.locator('meta[name=robots]').getAttribute('content'), 'noindex,nofollow');
        for (const dark of [false, true]) {
          if (dark) await page.locator('#tone').click();
          await page.locator('img').evaluateAll(images => Promise.all(images.map(i => i.decode())));
          assert.equal(await page.locator('html').getAttribute('data-tone'), dark ? 'dark' : 'light');
          assert.equal(await page.locator('#tone').getAttribute('aria-pressed'), String(dark));
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
          assert(await page.locator('img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0)));
          assert(await page.locator('img[data-picture]').evaluateAll((images, mode) => images.every(i => i.src.endsWith(`-${mode}.png`)), dark ? 'dark' : 'light'));
          assert(await page.locator('a[data-open]').evaluateAll((links, mode) => links.every(a => a.href.endsWith(`-${mode}.png`)), dark ? 'dark' : 'light'));
          const state = { route, width, mode: dark ? 'dark' : 'light', overflow: 0, errors: 0 };
          report.push(state);
          if (out && route === 'concepts/round-5/' && width >= 390) {
            await page.screenshot({ path: path.join(out, `${width}-${state.mode}.png`), fullPage: true });
          }
        }
        const links = await page.locator('a').evaluateAll(a => a.map(i => i.href));
        for (const link of links) {
          const u = new URL(link);
          if (u.protocol === 'file:') assert(fs.existsSync(decodeURIComponent(u.pathname)), link);
        }
        await page.locator('#tone').click();
        assert.equal(await page.locator('#tone').getAttribute('aria-pressed'), 'false');
        assert.deepEqual(errors, []);
        await page.close();
      }
    }
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 960 } });
    const page = await context.newPage();
    const route = base + 'concepts/round-5/' + (base.startsWith('file:') ? 'index.html' : '');
    await page.goto(route, { waitUntil: 'load' });
    assert.equal(await page.locator('.study').count(), 2);
    assert(!(await page.locator('.tools').isVisible()));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    await context.close();
    if (out) fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ states: report.length, overflow: 0, errors: 0, images: 'loaded', themeRoundtrip: true, noJavaScript: true }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
