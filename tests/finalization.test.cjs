const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base = (process.env.SITE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const failures = [];
  const check = (message, condition) => { if (!condition) failures.push(message); };
  try {
    for (const language of ['en', 'tr']) {
      const prefix = language === 'tr' ? 'tr/' : '';
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      for (const file of ['index.html', 'details.html', 'development.html', 'usage.html', 'brand.html']) {
        const page = await context.newPage();
        await page.goto(`${base}${prefix}${file}?lang=${language}`, { waitUntil: 'networkidle' });
        const text = await page.locator('body').innerText();
        check(`${language}/${file}: repeated product-access notice`, !/product access is required|ürün erişimi gerekir|product packages require project access|ürün paketleri proje erişimi gerektir/i.test(text));
        check(`${language}/${file}: key-file wording`, !/key file|anahtar dosyas/i.test(text));
        check(`${language}/${file}: eyebrow nested in a two-column grid`, await page.locator('.guide-grid > * > .eyebrow').count() === 0);
        if (file === 'index.html') {
          const tops = await page.locator('#start .guide-grid > * > h2').evaluateAll(headings => headings.map(h => h.getBoundingClientRect().top));
          check(`${language}/index: start headings are aligned`, tops.length === 2 && Math.abs(tops[0] - tops[1]) <= 1);
          const images = page.locator('#screenshots img');
          await images.evaluateAll(items => items.forEach(i => { i.loading = 'eager'; }));
          if (await images.count() === 2) await page.waitForFunction(() => [...document.querySelectorAll('#screenshots img')].every(i => i.complete));
          check(`${language}/index: two app screenshots have descriptive alt text`, await images.count() === 2 && (await images.evaluateAll(items => items.every(i => i.complete && i.naturalWidth > 0 && i.alt.length > 15))));
          check(`${language}/index: screenshots open at full size`, await page.locator('#screenshots a').evaluateAll(items => items.length === 2 && items.every(a => a.href === a.querySelector('img')?.src)));
          const screenshots = page.locator('#screenshots');
          check(`${language}/index: example data is identified`, await screenshots.count() === 1 && /example data|örnek veri/i.test(await screenshots.innerText()));
        }
        if (file === 'details.html') {
          const tops = await page.locator('#security .guide-grid > * > :is(h2,h3)').evaluateAll(headings => headings.map(h => h.getBoundingClientRect().top));
          check(`${language}/details: security headings are aligned`, tops.length === 2 && Math.abs(tops[0] - tops[1]) <= 1);
        }
        if (file === 'usage.html') {
          check(`${language}/usage: current Sign button label`, (await page.locator('#sign strong').allTextContents()).includes(language === 'tr' ? 'İmzala' : 'Sign'));
        }
        await page.close();
      }
      await context.close();
    }
    assert.deepEqual(failures, []);
    console.log('Bilingual copy, screenshot and layout checks passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
