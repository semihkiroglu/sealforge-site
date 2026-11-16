// Exercise language negotiation and real navigation, not a second preference implementation.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = (process.env.SITE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  try {
    for (const [locale, expected] of [['tr-TR', 'tr'], ['en-US', 'en'], ['de-DE', 'en']]) {
      const context = await browser.newContext({ locale });
      const page = await context.newPage();
      await page.goto(base + 'brand.html', { waitUntil: 'networkidle' });
      assert.equal(await page.getAttribute('html', 'lang'), expected, locale);
      assert.equal(await page.locator('.language-switch a').count(), 2);
      const guide = await page.locator('a[href*="sealforge-brand-guidelines"][href$=".pdf"]').first().getAttribute('href');
      assert.equal(guide.includes('-tr.pdf'), expected === 'tr');
      await context.close();
    }
    for (const blocked of [false, true]) {
      const context = await browser.newContext({ locale: 'tr-TR' });
      if (blocked) await context.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }));
      const page = await context.newPage();
      await page.goto(base + 'details.html#security', { waitUntil: 'networkidle' });
      assert.equal(await page.getAttribute('html', 'lang'), 'tr');
      await page.locator('.language-switch a[lang="en"]').click();
      await page.waitForLoadState('networkidle');
      assert.equal(await page.getAttribute('html', 'lang'), 'en');
      assert.equal(new URL(page.url()).hash, '#security');
      await page.locator('.nav a[href*="usage.html"]').click();
      await page.waitForLoadState('networkidle');
      assert.equal(await page.getAttribute('html', 'lang'), 'en', 'Manual choice survives navigation, including blocked storage');
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.getAttribute('html', 'lang'), 'en');
      await context.close();
    }
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    const page = await nojs.newPage();
    await page.goto(base + 'tr/index.html');
    assert.equal(await page.getAttribute('html', 'lang'), 'tr');
    await page.locator('.language-switch a[lang="en"]').click();
    assert.equal(await page.getAttribute('html', 'lang'), 'en');
    await nojs.close();
    console.log('Language negotiation, explicit preference, hash/navigation, blocked storage and no-JavaScript links passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
