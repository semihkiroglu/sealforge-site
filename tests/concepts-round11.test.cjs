/* Round 11 single-emblem concept matrix; no final-vector or application claims. */
const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const base=(process.env.SITE_URL||'http://127.0.0.1:4173/').replace(/\/?$/,'/');
const output=process.env.SITE_EVIDENCE||path.resolve('round11-evidence');
const repo=path.resolve(__dirname,'..');
fs.mkdirSync(output,{recursive:true});
const lum=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
(async()=>{
  const study=JSON.parse(fs.readFileSync(path.join(repo,'concepts/round-11/study.json')));
  assert.equal(study.variants.length,3);assert(study.variants.every(v=>v.sameGeometryAcrossThemes&&!v.hasSeparateFullAnimal));
  for(const[name,data]of Object.entries(study.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,'concepts/round-11/assets',name))).digest('hex'),data.sha256);
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/home/ubuntu/.hermes/tools/chromium-1208/chrome-linux/chrome'}),rows=[];
  try{
    for(const route of ['concepts/round-11/','concepts/'])for(const width of [320,390,768,1440]){
      const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
      await context.addInitScript(()=>localStorage.setItem('sealforge.theme','dark'));
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
      const response=await page.goto(base+route,{waitUntil:'load'});assert.equal(response.status(),200);await page.waitForURL('**/concepts/round-11/');await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.locator('html').getAttribute('data-tone'),'light');
      for(const tone of ['light','dark']){
        if(tone==='dark')await page.locator('#tone').click();
        for(const choice of ['cove','pip','harbor']){
          await page.locator(`button[data-choice="${choice}"]`).click();await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
          const d=await page.evaluate(()=>{
            const root=document.documentElement,css=getComputedStyle(document.body),name=i=>new URL(i.src).pathname.split('/').pop();
            return {tone:root.dataset.tone,choice:root.dataset.choice,overflow:root.scrollWidth-root.clientWidth,h1:document.querySelectorAll('h1').length,
              loaded:[...document.images].every(i=>i.complete&&i.naturalWidth>0&&i.hasAttribute('alt')),imageCount:document.images.length,
              main:[...document.querySelectorAll('[data-logo]')].map(i=>({key:i.dataset.logo,name:name(i),natural:i.naturalWidth})),
              small:[...document.querySelectorAll('[data-small]')].map(i=>({key:i.dataset.small,size:+i.dataset.size,name:name(i),natural:i.naturalWidth,width:i.getBoundingClientRect().width})),
              selected:[...document.querySelectorAll('button[data-choice][aria-pressed=true]')].map(i=>i.dataset.choice),
              header:name(document.querySelector('#header-logo')),tile:name(document.querySelector('#tile-logo')),
              links:[...document.querySelectorAll('[data-open]')].map(a=>new URL(a.href).pathname.split('/').pop()),board:new URL(document.querySelector('#comparison-board').href).pathname.split('/').pop(),
              boxes:[...document.querySelectorAll('.concept')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,right:r.right};}),
              storage:localStorage.getItem('sealforge.theme'),hasOldBodySurface:!!document.querySelector('#full-seal,.full-art,.composition-art'),
              pairs:[[css.color,css.backgroundColor],[getComputedStyle(document.querySelector('.lede')).color,css.backgroundColor],[getComputedStyle(document.querySelector('nav a')).color,css.backgroundColor]]};
          });
          assert.equal(d.tone,tone);assert.equal(d.choice,choice);assert.equal(d.overflow,0);assert.equal(d.h1,1);assert(d.loaded&&d.imageCount===11);assert(!d.hasOldBodySurface);
          assert.equal(d.main.length,3);assert(d.main.every(i=>i.name===`${i.key}-${tone}.png`&&i.natural===1024));
          assert.equal(d.small.length,6);assert(d.small.every(i=>i.name===`${i.key}-${i.size}-${tone}.png`&&i.natural===i.size&&Math.abs(i.width-i.size)<1));
          assert.deepEqual(d.selected,[choice]);assert.equal(d.header,`${choice}-32-${tone}.png`);assert.equal(d.tile,`${choice}-64-dark.png`);assert.equal(d.board,`comparison-${tone}.png`);assert.deepEqual(d.links,['cove','pip','harbor'].map(k=>`${k}-${tone}.png`));assert(d.boxes.length===3&&d.boxes.every(b=>b.x>=0&&b.right<=width));
          assert.equal(d.storage,'dark');assert.deepEqual(errors,[]);const ratios=d.pairs.map(([a,b])=>{const[x,y]=[lum(a),lum(b)].sort((a,b)=>a-b);return(y+.05)/(x+.05);});assert(ratios.every(v=>v>=4.5));
          rows.push({route,width,tone,choice,singleEmblem:true,overflow:0,smallPreviews:'native 32/64',productionThemeUnchanged:true,minimumTextContrast:Math.min(...ratios)});
          if(route==='concepts/round-11/'&&((width===1440&&tone==='light')||(width===390&&choice==='harbor')||(width===1440&&tone==='dark'&&choice==='harbor'))){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(output,`${choice}-${width}-${tone}.png`),fullPage:true});}
        }
      }
      await context.close();
    }
    const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:1000}}),page=await context.newPage();
    await page.goto(base+'concepts/',{waitUntil:'load'});await page.waitForURL('**/concepts/round-11/');await page.waitForLoadState('networkidle');assert.equal(await page.locator('.concept').count(),3);assert.equal(await page.locator('#tone').isVisible(),false);assert.equal(await page.locator('[data-open]').count(),3);await context.close();
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({base,cases:rows,noJavaScript:true},null,2));console.log(JSON.stringify({states:rows.length,concepts:3,fullAnimalVariants:0,themes:2,smallPreviews:[32,64],overflow:0,errors:0,noJavaScript:true,report:path.join(output,'report.json')}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
