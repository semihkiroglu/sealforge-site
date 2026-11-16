/* Round 8 targeted artwork study, not a production application test. */
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
  const rows=[];
  try {
    for (const route of ['concepts/round-8/']) for (const width of [320,390,1440]) {
      const page=await browser.newPage({ viewport:{width,height:1000} });
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const response=await page.goto(base+route+(base.startsWith('file:')?'index.html':''),{waitUntil:'load'});
      assert.equal(response.status(),200);
      assert.equal(await page.locator('h1').count(),1);
      assert.equal(await page.locator('button').count(),1);
      for (const mode of ['light','dark']) {
        if(mode==='dark') await page.locator('#tone').click();
        await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
        assert.equal(await page.locator('html').getAttribute('data-tone'),mode);
        assert.equal(await page.locator('#tone').getAttribute('aria-pressed'),String(mode==='dark'));
        assert(await page.locator('img[data-image]').evaluateAll((images,mode)=>images.length===5&&images.every(i=>i.src.endsWith(i.dataset.image+'-'+mode+'.png')&&i.naturalWidth>0),mode));
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),0);
        const pairs=await page.evaluate(()=>{
          const s=e=>getComputedStyle(e),b=s(document.body),t=s(document.querySelector('#tone'));
          return [[b.color,b.backgroundColor],[s(document.querySelector('.lede')).color,b.backgroundColor],[s(document.querySelector('nav a')).color,b.backgroundColor],[t.color,t.backgroundColor]];
        });
        const ratios=pairs.map(p=>contrast(...p));assert(ratios.every(r=>r>=4.5));
        assert.deepEqual(errors,[]);rows.push({route,width,mode,overflow:0,minimumTextContrast:Math.min(...ratios)});
        if(evidence&&route==='concepts/round-8/'&&width>=390) await page.screenshot({path:path.join(evidence,`${width}-${mode}.png`),fullPage:true});
      }
      for(const href of await page.locator('a').evaluateAll(a=>a.map(e=>e.href))) {
        const u=new URL(href);if(u.protocol==='file:')assert(fs.existsSync(decodeURIComponent(u.pathname)),href);
      }
      await page.close();
    }
    const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:1000}}),page=await context.newPage();
    await page.goto(base+'concepts/round-8/'+(base.startsWith('file:')?'index.html':''));
    assert(await page.locator('.hero-art img').isVisible());assert(!(await page.locator('.tools').isVisible()));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),0);
    await context.close();
    if(evidence)fs.writeFileSync(path.join(evidence,'report.json'),JSON.stringify(rows,null,2));
    console.log(JSON.stringify({states:rows.length,images:'loaded',overflow:0,errors:0,noJavaScript:true}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
