const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = (process.env.SITE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');
const menus = {
  en: ['Overview', 'Usage', 'Technical', 'Development'],
  tr: ['Genel bakış', 'Kullanım', 'Teknik', 'Geliştirme']
};

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
        const footer = await page.locator('.site-footer').innerText();
        check(`${language}/${file}: single footer slogan`, footer.includes(language === 'tr' ? 'Kodu imzalayın, anahtar sizde kalsın.' : 'Sign code, keep your keys.') && !/Your keys\. Your signature|Anahtarınız\. İmzanız|Your infrastructure\. Your keys|Altyapınız\. Anahtarınız|signed with care|özenle imzalı/i.test(footer));
        for (const profile of ['https://github.com/SealForgeProject', 'https://www.linkedin.com/company/SealForgeProject', 'https://www.youtube.com/@SealForgeProject']) {
          check(`${language}/${file}: profile ${profile}`, await page.locator(`.site-footer a[href="${profile}"][rel~="me"]`).count() === 1);
        }
        check(`${language}/${file}: menu starts with user destinations`, JSON.stringify(await page.locator('.nav a').allTextContents()) === JSON.stringify(menus[language]));
        if (file === 'index.html') {
          const text = await page.locator('#screenshots').innerText();
          check(`${language}/index: concise sample-data note`, /example data|örnek veri/i.test(text) && !/English-language interface|İngilizce arayüz|full size|tam boyut/i.test(text));
          check(`${language}/index: quick start present`, await page.locator('#quickstart .flow li').count() === 3);
        }
        if (file === 'details.html') {
          const artifacts = await page.locator('#artifacts').innerText();
          check(`${language}/details: removed NuGet whole-package detail`, !/bir bütün olarak|processed as a whole|repackaged|yeniden paketlenmez/i.test(artifacts));
          check(`${language}/details: Docker install placeholder`, /Docker/i.test(await page.locator('#deployment').innerText()));
        }
        if (file === 'development.html' || file === 'usage.html') {
          const list = file === 'development.html' ? '#contribute h2 + .integration-flow' : '#start h3 + .integration-flow';
          const gap = await page.locator(list).evaluate(items => items.getBoundingClientRect().top - items.previousElementSibling.getBoundingClientRect().bottom);
          check(`${language}/${file}: first list clears its heading`, gap >= 16);
        }
        if (file === 'brand.html') {
          check(`${language}/brand: three social profile files`, await page.locator('#social .profile-card').count() === 3 && await page.locator('#social img').count() === 3);
          check(`${language}/brand: social profiles linked`, await page.locator('#social a[rel~="me"]').count() === 3);
        }
        if (file === 'development.html') {
          check(`${language}/development: GitHub organisation linked`, await page.locator('main a[href="https://github.com/SealForgeProject"]').count() === 1);
        }
        if (file === 'usage.html') {
          const labels = await page.locator('#admin strong, #sign strong').allTextContents();
          check(`${language}/usage: current Clients menu`, language === 'en' ? labels.includes('Clients') && !labels.includes('API Clients') : labels.includes('İstemciler'));
          check(`${language}/usage: no parenthesized English labels`, language !== 'tr' || labels.every(label => !/\([^)]*[A-Za-z][^)]*\)/.test(label)));
          const gap = await page.locator('#troubleshooting .doc-table + .guide-grid').evaluate(grid => grid.getBoundingClientRect().top - grid.previousElementSibling.getBoundingClientRect().bottom);
          check(`${language}/usage: space after status table`, gap >= 32);
          const groups = await page.locator('#troubleshooting [data-status-group]').evaluateAll(items => items.map(item => item.dataset.statusGroup));
          check(`${language}/usage: statuses grouped by action`, ['ready', 'progress', 'attention', 'closed'].every(group => groups.includes(group)));
          const statuses = await page.locator('.status-table code').allTextContents();
          check(`${language}/usage: exact API status values`, ['ReadyForDownload', 'Created', 'Queued', 'Processing', 'AwaitingAdminApproval', 'BlockedByTokenState', 'Failed', 'Cancelled', 'Expired'].every(value => statuses.includes(value)));
        }
        await page.close();
      }
      await context.close();
    }
    assert.deepEqual(failures, []);
    console.log('Structure, wording, menu, status-group, quick-start and footer checks passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
