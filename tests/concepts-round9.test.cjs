/* Round 9 raster identity study; not application/backend or tiny-icon evidence. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = (process.env.SITE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');
const output = process.env.SITE_EVIDENCE || path.resolve('round9-evidence');
const repo = path.resolve(__dirname, '..');
fs.mkdirSync(output, { recursive: true });
const luminance = s => s.match(/[\d.]+/g).slice(0,3).map(Number).map(v => v/255).map(v => v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const contrast = (a,b) => { const [x,y]=[luminance(a),luminance(b)].sort((a,b)=>a-b); return (y+.05)/(x+.05); };
(async () => {
  for (const tone of ['light','dark']) assert.deepEqual(fs.readFileSync(path.join(repo,`concepts/round-9/assets/primary-head-${tone}.svg`)),fs.readFileSync(path.join(repo,`assets/brand/head-on-${tone}.svg`)));
  const manifest=JSON.parse(fs.readFileSync(path.join(repo,'concepts/round-9/study.json')));
  assert.equal(manifest.variants.length,3);
  assert(manifest.variants.every(v=>v.sameHeadAndBodySource && v.sameLightDarkGeometry));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/home/ubuntu/.hermes/tools/chromium-1208/chrome-linux/chrome'});
  const rows=[];
  try {
    for(const route of ['concepts/round-9/','concepts/']) for(const width of [320,390,768,1440]) {
      const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
      await context.addInitScript(()=>localStorage.setItem('sealforge.theme','dark'));
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
      page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
      const response=await page.goto(base+route,{waitUntil:'load'});
      assert.equal(response.status(),200);
      await page.waitForURL('**/concepts/round-9/');
      await page.waitForFunction(()=>document.documentElement.classList.contains('js'));
      await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.locator('h1').count(),1);
      assert.equal(await page.locator('html').getAttribute('data-tone'),'light');
      for(const tone of ['light','dark']) {
        if(tone==='dark')await page.locator('#tone').click();
        for(const choice of ['glide','turn','lookout']) for(const format of ['landscape','portrait']) {
          await page.locator(`button[data-choice="${choice}"]`).click();
          await page.locator(`button[data-format="${format}"]`).click();
          await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
          const data=await page.evaluate(()=>{
            const root=document.documentElement,full=document.querySelector('#full-seal'),box=full.getBoundingClientRect(),css=getComputedStyle(document.body);
            return {
              tone:root.dataset.tone,choice:root.dataset.choice,format:root.dataset.format,
              overflow:root.scrollWidth-root.clientWidth,
              images:[...document.images].every(i=>i.complete&&i.naturalWidth>0&&i.hasAttribute('alt')),
              primary:[...document.querySelectorAll('[data-primary]')].map(i=>new URL(i.src).pathname.split('/').pop()),
              full:new URL(full.src).pathname.split('/').pop(),
              head:new URL(document.querySelector('#head-file').href).pathname.split('/').pop(),
              body:new URL(document.querySelector('#body-file').href).pathname.split('/').pop(),
              selected:[...document.querySelectorAll('button[data-choice][aria-pressed=true]')].map(b=>b.dataset.choice),
              formatSelected:[...document.querySelectorAll('button[data-format][aria-pressed=true]')].map(b=>b.dataset.format),
              ratioError:Math.abs((box.width/box.height)/(full.naturalWidth/full.naturalHeight)-1),
              storage:localStorage.getItem('sealforge.theme'),
              pairs:[[css.color,css.backgroundColor],[getComputedStyle(document.querySelector('.lede')).color,css.backgroundColor],[getComputedStyle(document.querySelector('nav a')).color,css.backgroundColor]],
            };
          });
          assert.equal(data.tone,tone);assert.equal(data.choice,choice);assert.equal(data.format,format);
          assert.equal(data.overflow,0,JSON.stringify({route,width,...data}));assert(data.images);
          assert(data.primary.length===3&&data.primary.every(s=>s===`primary-head-${tone}.svg`));
          assert.equal(data.full,`${choice}-body-${tone}.png`);assert.equal(data.head,`${choice}-head-${tone}.png`);assert.equal(data.body,data.full);
          assert.deepEqual(data.selected,[choice]);assert.deepEqual(data.formatSelected,[format]);
          assert(data.ratioError<.01);assert.equal(data.storage,'dark','Study must not modify production theme storage');
          const ratios=data.pairs.map(p=>contrast(...p));assert(ratios.every(v=>v>=4.5));assert.deepEqual(errors,[]);
          rows.push({route,width,tone,choice,format,overflow:0,minimumTextContrast:Math.min(...ratios),aspectRatioPreserved:true,productionThemeUntouched:true});
          if(route==='concepts/round-9/' && ((width===1440 && tone==='light')||(width===1440&&tone==='dark'&&choice==='turn'&&format==='portrait')||(width===390&&choice==='glide'&&format==='landscape'))) {
            await page.evaluate(()=>window.scrollTo(0,0));
            await page.screenshot({path:path.join(output,`${choice}-${format}-${width}-${tone}.png`),fullPage:true});
            await page.locator('.composition').screenshot({path:path.join(output,`composition-${choice}-${format}-${width}-${tone}.png`)});
          }
        }
      }
      await context.close();
    }
    const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:1000}}),page=await context.newPage();
    await page.goto(base+'concepts/',{waitUntil:'load'});await page.waitForURL('**/concepts/round-9/');
    assert(await page.locator('#full-seal').isVisible());assert.equal(await page.locator('.controls:visible').count(),0);
    assert.equal(await page.locator('a[data-full]').count(),3);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),0);
    await context.close();
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({base,cases:rows,noJavaScript:true},null,2));
    console.log(JSON.stringify({states:rows.length,views:3,formats:2,themes:2,primaryLogo:'byte-identical',overflow:0,consoleErrors:0,noJavaScript:true,report:path.join(output,'report.json')}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
