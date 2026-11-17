const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = (process.env.SITE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const failures = [];
  const check = (message, condition) => { if (!condition) failures.push(message); };
  try {
    for (const language of ['en', 'tr']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      for (const file of ['index.html', 'details.html', 'development.html', 'usage.html', 'brand.html']) {
        const page = await context.newPage();
        await page.goto(`${base}${language === 'tr' ? 'tr/' : ''}${file}?lang=${language}`, { waitUntil: 'networkidle' });
        check(`${language}/${file}: no website-source link`, await page.locator('a[href*="github.com/semihkiroglu/sealforge-site"]').count() === 0);
        check(`${language}/${file}: no editable-source download`, await page.locator('a[href*="sealforge-editable-sources"]').count() === 0);
        if (file === 'index.html') {
          const text = await page.locator('#screenshots').innerText();
          check(`${language}/index: concise sample-data note`, /example data|örnek veri/i.test(text) && !/English-language interface|İngilizce arayüz|full size|tam boyut/i.test(text));
        }
        if (file === 'details.html') {
          check(`${language}/details: no verification command`, !(await page.locator('#artifacts').innerText()).includes('dotnet nuget verify'));
        }
        if (file === 'development.html' || file === 'usage.html') {
          const section = file === 'development.html' ? '#contribute' : '#start';
          const gap = await page.locator(`${section} h2 + .integration-flow`).evaluate(list => list.getBoundingClientRect().top - list.previousElementSibling.getBoundingClientRect().bottom);
          check(`${language}/${file}: first list clears its heading`, gap >= 16);
        }
        if (file === 'usage.html') {
          const labels = await page.locator('#admin strong, #sign strong').allTextContents();
          check(`${language}/usage: current Clients menu`, language === 'en' ? labels.includes('Clients') && !labels.includes('API Clients') : labels.includes('İstemciler'));
          check(`${language}/usage: no parenthesized English labels`, language !== 'tr' || labels.every(label => !/\([^)]*[A-Za-z][^)]*\)/.test(label)));
          const gap = await page.locator('#troubleshooting .doc-table + .guide-grid').evaluate(grid => grid.getBoundingClientRect().top - grid.previousElementSibling.getBoundingClientRect().bottom);
          check(`${language}/usage: space after status table`, gap >= 32);
          const groups = await page.locator('#troubleshooting [data-status-group]').evaluateAll(items => items.map(item => item.dataset.statusGroup));
          check(`${language}/usage: statuses grouped by action`, ['ready', 'progress', 'attention', 'closed'].every(group => groups.includes(group)));
        }
        await page.close();
      }
      await context.close();
    }
    assert.deepEqual(failures, []);
    console.log('Bilingual wording, menu, status-group and spacing checks passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
