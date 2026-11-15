// Uses an existing Playwright installation; the published site has no dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const output = process.env.SITE_EVIDENCE || path.resolve('site-evidence');
const live = new URL(base).protocol === 'https:';
const pages = ['index.html', 'details.html', 'brand.html'];
const report = { base, signatureImage: live ? 'public HTTPS asset' : 'local PNG mapped to its published URL', cases: [] };
fs.mkdirSync(output, { recursive: true });
const rgb = (v) => v.match(/[\d.]+/g).slice(0, 3).map(Number);
const lum = (a) => a.map((v) => v / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => { const x = [lum(rgb(a)), lum(rgb(b))].sort((a, b) => b - a); return +((x[0] + .05) / (x[1] + .05)).toFixed(2); };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/home/ubuntu/.hermes/tools/chromium-1208/chrome-linux/chrome' });
  try {
    for (const file of pages) {
      for (const width of [320, 390, 768, 1440]) {
        for (const theme of ['dark', 'light']) {
          const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
          if (!live) {
            // The email template already uses its final HTTPS URL; preview the identical local PNG before publication.
            await context.route('https://semihkiroglu.github.io/sealforge-site/assets/brand/email-logo.png', (route) => route.fulfill({ path: path.resolve(__dirname, '../assets/brand/email-logo.png'), contentType: 'image/png' }));
          }
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', (e) => errors.push(e.message));
          page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
          page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
          await page.addInitScript((theme) => { if (window.top === window) localStorage.setItem('sealforge.theme', theme); }, theme);
          const response = await page.goto(base + file, { waitUntil: 'networkidle' });
          assert.equal(response.status(), 200);
          await page.evaluate(async () => { document.querySelectorAll('img, iframe').forEach((i) => i.loading = 'eager'); await document.fonts.ready; });
          if (file === 'brand.html') {
            await page.frameLocator('.signature-preview').locator('table').waitFor();
            await page.frameLocator('.signature-preview').locator('img').evaluate((i) => new Promise((resolve, reject) => { if (i.complete) return i.naturalWidth > 0 ? resolve() : reject(new Error('Email logo missing')); i.onload = resolve; i.onerror = () => reject(new Error('Email logo missing')); }));
          }
          await page.waitForTimeout(150);
          const data = await page.evaluate(() => {
            const css = getComputedStyle(document.body);
            const button = document.querySelector('.btn--primary');
            const keys = [...document.querySelectorAll('[data-i18n]')].map((e) => e.dataset.i18n);
            return {
              theme: document.documentElement.dataset.theme,
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              h1: document.querySelectorAll('h1').length,
              images: [...document.images].map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, alt: i.hasAttribute('alt') })),
              language: { value: document.documentElement.lang, hidden: document.querySelector('#lang-select').offsetParent === null, tab: document.querySelector('#lang-select').tabIndex, options: [...document.querySelector('#lang-select').options].map((x) => x.value) },
              duplicateKeys: keys.filter((x, i) => keys.indexOf(x) !== i),
              emptyTranslation: [...document.querySelectorAll('[data-i18n]')].some((e) => !e.textContent.trim()),
              navVisible: [...document.querySelectorAll('.nav a')].every((a) => a.getBoundingClientRect().width > 0),
              colors: { text: css.color, bg: css.backgroundColor, muted: css.getPropertyValue('--muted').trim(), button: button ? getComputedStyle(button).backgroundColor : null, buttonText: button ? getComputedStyle(button).color : null },
              height: document.body.scrollHeight,
              deadAnchors: [...document.querySelectorAll('a[href^="#"]')].map((a) => a.hash.slice(1)).filter((id) => !document.getElementById(id)),
            };
          });
          // Resolve the custom-property colour to CSS rgb before calculating contrast.
          const muted = await page.evaluate(() => { const p = document.createElement('p'); p.style.color = 'var(--muted)'; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; });
          const ratios = { body: contrast(data.colors.text, data.colors.bg), muted: contrast(muted, data.colors.bg) };
          if (data.colors.button) ratios.button = contrast(data.colors.buttonText, data.colors.button);
          assert.equal(data.overflow, 0, `${file} ${width} ${theme}: horizontal overflow`);
          assert.equal(data.h1, 1);
          assert(data.images.every((i) => i.ok && i.alt), JSON.stringify(data.images));
          assert.deepEqual(data.language, { value: 'en', hidden: true, tab: -1, options: ['en'] });
          assert.deepEqual(data.duplicateKeys, []);
          assert(!data.emptyTranslation);
          assert(data.navVisible);
          assert.deepEqual(data.deadAnchors, []);
          assert(Object.values(ratios).every((v) => v >= 4.5), JSON.stringify(ratios));
          await page.click('#theme-toggle');
          const flipped = theme === 'dark' ? 'light' : 'dark';
          assert.equal(await page.getAttribute('html', 'data-theme'), flipped);
          assert.equal(await page.getAttribute('#theme-toggle', 'aria-pressed'), String(flipped === 'light'));
          await page.reload({ waitUntil: 'networkidle' });
          // addInitScript seeds the original theme on reload; persistence is tested below in an unseeded context.
          assert.deepEqual(errors, []);
          if (width === 1440 || width === 390) {
            if (file === 'brand.html') {
              await page.locator('.signature-preview').scrollIntoViewIfNeeded();
              await page.waitForTimeout(150);
              await page.screenshot({ path: path.join(output, `email-preview-${width}-${theme}.png`) });
            }
            await page.evaluate((t) => { localStorage.setItem('sealforge.theme', t); document.documentElement.dataset.theme = t; document.querySelectorAll('img').forEach(i => i.loading = 'eager'); }, theme);
            await page.waitForTimeout(100);
            await page.screenshot({ path: path.join(output, `${file.replace('.html', '')}-${width}-${theme}.png`), fullPage: true });
          }
          report.cases.push({ file, width, theme, height: data.height, ratios, imageCount: data.images.length, errors });
          await context.close();
        }
      }
    }
    // Fresh context: verify the real storage path across navigation and reload.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(base + 'index.html');
    await page.click('#theme-toggle');
    await page.goto(base + 'details.html');
    assert.equal(await page.getAttribute('html', 'data-theme'), 'light');
    await page.reload();
    assert.equal(await page.getAttribute('html', 'data-theme'), 'light');
    await page.evaluate(() => localStorage.setItem('sealforge.lang', 'invalid'));
    await page.reload();
    assert.equal(await page.getAttribute('html', 'lang'), 'en');
    await context.close();
    // Cross-page anchors and download URLs resolve, not just the current page's anchors.
    const linkPage = await browser.newPage();
    const seen = new Set();
    for (const file of pages) {
      await linkPage.goto(base + file);
      const links = await linkPage.locator('a[href]').evaluateAll((a) => a.map((x) => x.href));
      for (const href of links) {
        if (!href.startsWith(base) || seen.has(href)) continue;
        seen.add(href);
        const target = new URL(href);
        const r = await linkPage.request.get(target.href.split('#')[0]);
        assert.equal(r.status(), 200, href);
        if (target.hash) {
          const html = await r.text();
          assert(html.includes(`id="${target.hash.slice(1)}"`), href);
        }
      }
    }
    await linkPage.close();
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    for (const file of pages) {
      const p = await nojs.newPage(); await p.goto(base + file);
      assert((await p.locator('h1').innerText()).trim());
      assert.equal(await p.locator('#lang-select').isVisible(), false);
      await p.close();
    }
    await nojs.close();
    if (live) {
      const p = await browser.newPage();
      await p.goto(base + 'assets/brand/email-signature.html', { waitUntil: 'networkidle' });
      assert(await p.locator('img').evaluate((i) => i.complete && i.naturalWidth === 648));
      assert.equal(await p.locator('img').getAttribute('alt'), 'SealForge');
      await p.close();
    }
    report.checkedLocalLinks = seen.size;
    report.persistence = 'passed'; report.noJavaScript = 'passed';
    fs.writeFileSync(path.join(output, 'site-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ passed: report.cases.length, checkedLocalLinks: seen.size, persistence: report.persistence, noJavaScript: report.noJavaScript, report: path.join(output, 'site-report.json') }));
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
