/* Concept-only regression checks. This does not exercise the signing application. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = (process.env.SITE_URL || 'http://127.0.0.1:4186/').replace(/\/?$/, '/');
const output = process.env.CONCEPT_EVIDENCE;
const chrome = process.env.CHROMIUM_PATH || '/home/ubuntu/.hermes/tools/chromium-1208/chrome-linux/chrome';
if (output) fs.mkdirSync(output, { recursive: true });
function contrast(a, b) {
  function luminance(rgb) {
    const values = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(x => {
      x /= 255;
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return values.reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
  }
  const values = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (values[1] + 0.05) / (values[0] + 0.05);
}

(async () => {
  const browser = await chromium.launch({ executablePath: chrome });
  const report = { cases: [], links: [], noJavaScript: false };
  const links = new Set();
  try {
    for (const route of ['concepts/round-4/', 'concepts/']) {
      for (const width of [320, 390, 768, 1440]) {
        for (const palette of ['coast', 'indigo']) {
          for (const mode of ['light', 'dark']) {
            const page = await browser.newPage({ viewport: { width, height: 960 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.addInitScript(() => localStorage.setItem('sealforge.theme', 'unchanged-by-concept'));
            const response = await page.goto(`${base}${route}?palette=${palette}&mode=${mode}`, { waitUntil: 'networkidle' });
            assert.equal(response.status(), 200);
            await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
            assert.equal(await page.locator('html').getAttribute('data-palette'), palette);
            assert.equal(await page.locator('html').getAttribute('data-mode'), mode);
            assert.equal(await page.locator('h1').count(), 1);
            assert.equal(await page.locator('h1').innerText(), 'Your signing workshop.');
            assert.equal(await page.locator(`button[data-palette="${palette}"]`).getAttribute('aria-pressed'), 'true');
            assert.equal(await page.locator('#tone').getAttribute('aria-pressed'), String(mode === 'dark'));
            assert((await page.locator('#hero-logo').getAttribute('src')).endsWith(`logo-${palette}-${mode}.png`));
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
            assert(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
            assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,nofollow');
            assert.equal(await page.evaluate(() => localStorage.getItem('sealforge.theme')), 'unchanged-by-concept');
            const pairs = await page.evaluate(() => {
              const style = getComputedStyle(document.body);
              const card = document.querySelector('.palette-card');
              const active = document.querySelector('button[data-palette][aria-pressed="true"]');
              return [
                [style.color, style.backgroundColor],
                [getComputedStyle(document.querySelector('.lede')).color, style.backgroundColor],
                [getComputedStyle(document.querySelector('.warm-note')).color, style.backgroundColor],
                [getComputedStyle(document.querySelector('.palette-description')).color, getComputedStyle(card).backgroundColor],
                [getComputedStyle(active).color, getComputedStyle(active).backgroundColor],
                [getComputedStyle(document.querySelector('nav a')).color, style.backgroundColor],
              ];
            });
            const ratios = pairs.map(([foreground, background]) => contrast(foreground, background));
            assert(ratios.every(value => value >= 4.5), JSON.stringify({ width, palette, mode, ratios }));
            const hrefs = await page.locator('a').evaluateAll(nodes => nodes.map(a => a.href));
            for (const href of hrefs) {
              if (href.startsWith(base)) {
                const url = new URL(href);
                if (url.hash && url.pathname === new URL(page.url()).pathname) {
                  assert.equal(await page.locator(url.hash).count(), 1, href);
                }
                url.hash = ''; links.add(url.href);
              }
            }
            if (output && route === 'concepts/round-4/' && [390, 1440].includes(width)) {
              await page.screenshot({ path: path.join(output, `${palette}-${mode}-${width}.png`), fullPage: true });
            }
            const other = palette === 'coast' ? 'indigo' : 'coast';
            await page.locator(`button[data-palette="${other}"]`).click();
            assert.equal(await page.locator('html').getAttribute('data-palette'), other);
            await page.locator('#tone').click();
            const changed = mode === 'light' ? 'dark' : 'light';
            await page.locator('#hero-logo').evaluate(image => image.decode());
            assert.equal(await page.locator('html').getAttribute('data-mode'), changed);
            assert((await page.locator('#hero-logo').getAttribute('src')).endsWith(`logo-${other}-${changed}.png`));
            assert.equal(await page.evaluate(() => localStorage.getItem('sealforge.theme')), 'unchanged-by-concept');
            assert.deepEqual(errors, []);
            report.cases.push({ route, width, palette, mode, minimumTextContrast: Math.min(...ratios), overflow: 0, errors: 0 });
            await page.close();
          }
        }
      }
    }
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 960 } });
    const page = await context.newPage();
    await page.goto(`${base}concepts/round-4/`, { waitUntil: 'networkidle' });
    assert(await page.locator('#hero-logo').isVisible());
    assert(!(await page.locator('.controls').isVisible()));
    assert.equal(await page.locator('.palette-card').count(), 2);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    report.noJavaScript = true;
    await context.close();
    const request = await browser.newContext();
    for (const href of links) {
      const response = await request.request.get(href);
      assert.equal(response.status(), 200, href);
      report.links.push(href);
    }
    await request.close();
    if (output) fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ cases: report.cases.length, checkedLinks: report.links.length,
      minimumTextContrast: Math.min(...report.cases.map(row => row.minimumTextContrast)),
      overflow: 0, pageErrors: 0, noJavaScript: report.noJavaScript }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
