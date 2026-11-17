// Exercise the actual static pages over HTTP/HTTPS; no screenshot or app backend is needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const base = (process.env.SITE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');
const output = process.env.SITE_EVIDENCE || path.resolve('site-evidence');
const repo = path.resolve(__dirname, '..');
const live = new URL(base).protocol === 'https:';
const pages = {
  'index.html': ['how', 'start'],
  'details.html': ['architecture', 'security', 'integration', 'deployment'],
  'development.html': ['source', 'build', 'contribute'],
  'usage.html': ['start', 'sign', 'automation', 'troubleshooting'],
  'brand.html': ['downloads', 'email'],
};
const navigation = ['index.html', 'details.html', 'development.html', 'usage.html'];
const report = { base, screenshots: false, cases: [] };
const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
const lum = values => values.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => { const [low, high] = [lum(rgb(a)), lum(rgb(b))].sort((a, b) => a - b); return (high + .05) / (low + .05); };
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  try {
     for (const language of ['en', 'tr']) for (const [file, sections] of Object.entries(pages)) for (const width of [320, 390, 768, 1440, 1920]) for (const theme of ['dark', 'light']) {
       const prefix = language === 'tr' ? 'tr/' : '';
       const context = await browser.newContext({ locale: language === 'tr' ? 'tr-TR' : 'en-US', viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      if (!live) await context.route('https://semihkiroglu.github.io/sealforge-site/assets/brand/email-logo.png', route => route.fulfill({ path: path.join(repo, 'assets/brand/email-logo.png'), contentType: 'image/png' }));
      await context.addInitScript(theme => { if (window.top === window) localStorage.setItem('sealforge.theme', theme); }, theme);
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
       assert.equal((await page.goto(base + prefix + file + '?lang=' + language, { waitUntil: 'networkidle' })).status(), 200);
      await page.evaluate(async () => { document.querySelectorAll('img,iframe').forEach(i => i.loading = 'eager'); await document.fonts.ready; });
      await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
      if (file === 'brand.html') {
        const image = page.frameLocator('.signature-preview').locator('img');
        await image.waitFor();
        let loaded = false;
        for (let attempt = 0; attempt < 75 && !loaded; attempt++) { loaded = await image.evaluate(i => i.complete && i.naturalWidth > 0); if (!loaded) await page.waitForTimeout(200); }
        assert(loaded, 'The real email-signature image must load');
      }
      const d = await page.evaluate(() => {
        const body = getComputedStyle(document.body), brand = document.querySelector('.brand'), word = brand.querySelector('.brand-wordmark');
        const visible = [...brand.querySelectorAll('img')].filter(i => getComputedStyle(i).display !== 'none');
        const muted = document.createElement('span'); muted.style.color = 'var(--muted)'; document.body.append(muted); const secondary = getComputedStyle(muted).color; muted.remove();
        const button = document.querySelector('.btn--primary');
        return {
          theme: document.documentElement.dataset.theme, lang: document.documentElement.lang,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          headerOverflow: document.querySelector('.header-inner').scrollWidth - document.querySelector('.header-inner').clientWidth,
          h1: document.querySelectorAll('h1').length, text: document.body.innerText,
           nav: [...document.querySelectorAll('.nav a')].map(a => new URL(a.href).pathname.split('/').pop()),
           active: [...document.querySelectorAll('.nav a[aria-current="page"]')].map(a => new URL(a.href).pathname.split('/').pop()),
          navFits: [...document.querySelectorAll('.nav a')].every(a => { const r = a.getBoundingClientRect(); return r.width > 0 && r.x >= 0 && r.right <= innerWidth; }),
          brand: { text: word.textContent, family: getComputedStyle(word).fontFamily, size: parseFloat(getComputedStyle(word).fontSize), weight: getComputedStyle(word).fontWeight, sources: visible.map(i => i.getAttribute('src')), boxes: visible.map(i => ({ width: i.getBoundingClientRect().width, height: i.getBoundingClientRect().height })) },
          fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family),
          ids: [...document.querySelectorAll('[id]')].map(e => e.id),
          deadAnchors: [...document.querySelectorAll('a[href^="#"]')].map(a => a.hash.slice(1)).filter(id => !document.getElementById(id)),
          images: [...document.images].every(i => i.complete && i.naturalWidth > 0 && i.hasAttribute('alt')),
          retiredMarkup: !!document.querySelector('[data-i18n],#lang-select,.capture'),
          pairs: [[body.color, body.backgroundColor], [secondary, body.backgroundColor], ...(button ? [[getComputedStyle(button).color, getComputedStyle(button).backgroundColor]] : [])],
          restrictedLinks: [...document.querySelectorAll('a[href^="https://github.com/semihkiroglu/SealForge"]')].every(a => a.dataset.access === 'restricted'),
        };
      });
      assert.deepEqual(d.nav, navigation, `${file}: four distinct primary destinations`);
      assert.deepEqual(d.active, file === 'brand.html' ? [] : [file]);
       assert.equal(d.theme, theme); assert.equal(d.lang, language); assert.equal(d.h1, 1);
      assert.equal(d.overflow, 0, `${file}/${width}/${theme}`); assert(d.headerOverflow <= 1 && d.navFits, `${file}: header must fit`);
      assert(sections.every(id => d.ids.includes(id)), `${file}: required content sections`);
      assert.equal(d.ids.length, new Set(d.ids).size); assert.deepEqual(d.deadAnchors, []);
      assert.equal(d.brand.text, 'SealForge'); assert(d.brand.family.includes('Manrope')); assert.equal(d.brand.weight, '600'); assert(d.brand.size <= 20);
      assert(d.fonts.some(f => f.includes('Manrope')) && d.fonts.some(f => f.includes('Inter')));
       assert.deepEqual(d.brand.sources, [`${prefix ? '../' : ''}assets/brand/head-on-${theme}.svg`]);
      assert(d.brand.boxes.every(b => b.width === (width <= 440 ? 28 : 32) && b.height === b.width));
      assert(d.images && !d.retiredMarkup && d.restrictedLinks);
      const ratios = d.pairs.map(([a,b]) => contrast(a,b)); assert(ratios.every(r => r >= 4.5), JSON.stringify(ratios));
      if (file === 'index.html') { assert(d.text.trim().split(/\s+/).length < 430); assert(!/PostgreSQL|PKCS#11|Apache-2\.0/.test(d.text), 'Keep technical and licensing depth off the overview'); }
       if (file === 'development.html') assert(/Apache-2\.0/.test(d.text) && /access.required|access.restricted|private|erişim|özeldir/i.test(d.text));
       if (file === 'usage.html') assert((language === 'tr' ? /İmzalama İzinleri/ : /Signing Permissions/).test(d.text) && /MFA/.test(d.text));
       await page.locator('#theme-toggle').click(); assert.equal(await page.getAttribute('html', 'data-theme'), theme === 'dark' ? 'light' : 'dark');
       assert.equal(await page.locator('#theme-toggle').getAttribute('aria-label'), language === 'tr' ? (theme === 'dark' ? 'Koyu temaya geç' : 'Açık temaya geç') : `Switch to ${theme} theme`);
      assert.deepEqual(errors, []);
       report.cases.push({ file, language, width, theme, overflow: 0, minimumContrast: Math.min(...ratios), errors });
      await context.close();
    }
    const context = await browser.newContext(), page = await context.newPage();
    await page.goto(base + 'index.html'); await page.locator('#theme-toggle').click();
    for (const file of Object.keys(pages)) { await page.goto(base + file); assert.equal(await page.getAttribute('html', 'data-theme'), 'light'); }
    await page.reload(); assert.equal(await page.getAttribute('html', 'data-theme'), 'light'); await context.close();
    const nojs = await browser.newContext({ javaScriptEnabled: false });
     for (const prefix of ['', 'tr/']) for (const file of Object.keys(pages)) { const p = await nojs.newPage(); assert.equal((await p.goto(base + prefix + file)).status(), 200); assert((await p.locator('h1').innerText()).trim()); assert.equal(await p.locator('.nav a').count(), navigation.length); assert.equal(await p.locator('#theme-toggle').isVisible(), false); assert.equal(await p.getAttribute('html', 'lang'), prefix ? 'tr' : 'en'); await p.close(); }
    await nojs.close();
    const blocked = await browser.newContext(); await blocked.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }));
    const p = await blocked.newPage(); await p.goto(base + 'index.html'); await p.locator('#theme-toggle').click(); assert.equal(await p.getAttribute('html', 'data-theme'), 'light'); await blocked.close();
    const links = new Set(), probe = await browser.newPage();
     for (const prefix of ['', 'tr/']) for (const file of Object.keys(pages)) {
       await probe.goto(base + prefix + file + '?lang=' + (prefix ? 'tr' : 'en'));
      for (const href of await probe.locator('a[href]').evaluateAll(a => a.map(x => x.href))) {
        if (!href.startsWith(base) || links.has(href)) continue;
        links.add(href); const target = new URL(href), r = await probe.request.get(target.href.split('#')[0]); assert.equal(r.status(), 200, href);
        if (target.hash) assert((await r.text()).includes(`id="${target.hash.slice(1)}"`), href);
      }
    }
    const catalogue = JSON.parse(fs.readFileSync(path.join(repo, 'assets/downloads/sealforge-downloads.json')));
    for (const [name, info] of Object.entries(catalogue.files)) { const r = await probe.request.get(base + 'assets/downloads/' + name); assert.equal(r.status(), 200); const data = await r.body(); assert.equal(data.length, info.bytes); assert.equal(crypto.createHash('sha256').update(data).digest('hex'), info.sha256); }
    for (const retired of ['assets/css/style.css', 'concepts/', 'concepts/round-11/', 'assets/downloads/sealforge-brand-kit-workshop.zip', 'assets/downloads/sealforge-editable-sources.zip']) assert.equal((await probe.request.get(base + retired)).status(), 404, retired);
    await probe.close(); report.checkedLocalLinks = links.size; report.persistence = true; report.noJavaScript = true; report.blockedStorage = true; report.downloads = Object.keys(catalogue.files).length;
     assert.equal(report.cases.length, Object.keys(pages).length * 2 * 5 * 2);
    fs.writeFileSync(path.join(output, 'site-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ passed: report.cases.length, links: links.size, downloads: report.downloads, retiredRoutes: 404, noJavaScript: true, blockedStorage: true, screenshots: false }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
