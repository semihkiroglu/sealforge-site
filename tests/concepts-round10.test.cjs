/* Focused Round 10 comparison; no application, backend or final-vector claims. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const base=(process.env.SITE_URL||'http://127.0.0.1:4173/').replace(/\/?$/,'/');
const output=process.env.SITE_EVIDENCE||path.resolve('round10-evidence');
const repo=path.resolve(__dirname,'..');
fs.mkdirSync(output,{recursive:true});
const luminance=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
(async()=>{
  const study=JSON.parse(fs.readFileSync(path.join(repo,'concepts/round-10/study.json')));
  assert(Object.values(study.checks).every(Boolean));
  for(const [name,data] of Object.entries(study.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,'concepts/round-10/assets',name))).digest('hex'),data.sha256);
  for(const tone of ['light','dark'])for(const [next,previous] of [['primary-head','primary-head'],['glide-original','glide-head'],['glide-body','glide-body']]){
    const ext=next==='primary-head'?'svg':'png';
    assert.deepEqual(fs.readFileSync(path.join(repo,`concepts/round-10/assets/${next}-${tone}.${ext}`)),fs.readFileSync(path.join(repo,`concepts/round-9/assets/${previous}-${tone}.${ext}`)));
  }
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/home/ubuntu/.hermes/tools/chromium-1208/chrome-linux/chrome'});
  const rows=[];
  try{
    for(const route of ['concepts/round-10/'])for(const width of [320,390,768,1440]){
      const context=await browser.newContext({viewport:{width,height:1000}});
      await context.addInitScript(()=>localStorage.setItem('sealforge.theme','dark'));
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
      const response=await page.goto(base+route,{waitUntil:'load'});assert.equal(response.status(),200);
      await page.waitForURL('**/concepts/round-10/');await page.evaluate(()=>document.fonts.ready);
      for(const tone of ['light','dark']){
        if(tone==='dark')await page.locator('#tone').click();
        await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
        const data=await page.evaluate(()=>{
          const root=document.documentElement,css=getComputedStyle(document.body),cards=[...document.querySelectorAll('#comparison .card')];
          return {tone:root.dataset.tone,overflow:root.scrollWidth-root.clientWidth,h1:document.querySelectorAll('h1').length,
            boxes:cards.map(c=>{const r=c.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right};}),
            files:[...document.querySelectorAll('[data-art]')].map(i=>({key:i.dataset.art,name:new URL(i.src).pathname.split('/').pop(),loaded:i.complete&&i.naturalWidth>0,alt:i.hasAttribute('alt')})),
            links:[...document.querySelectorAll('[data-open]')].map(a=>new URL(a.href).pathname.split('/').pop()),
            board:new URL(document.querySelector('#board-link').href).pathname.split('/').pop(),pressed:document.querySelector('#tone').getAttribute('aria-pressed'),storage:localStorage.getItem('sealforge.theme'),
            pairs:[[css.color,css.backgroundColor],[getComputedStyle(document.querySelector('.lede')).color,css.backgroundColor],[getComputedStyle(document.querySelector('nav a')).color,css.backgroundColor]]};
        });
        assert.equal(data.tone,tone);assert.equal(data.overflow,0);assert.equal(data.h1,1);assert.equal(data.boxes.length,3);
        assert(data.boxes.every(b=>Math.abs(b.y-data.boxes[0].y)<1&&b.right<=width));assert(data.boxes[0].right<data.boxes[1].x&&data.boxes[1].right<data.boxes[2].x,'All three must remain side by side, including mobile');
        assert(data.files.length===6&&data.files.every(i=>i.loaded&&i.alt&&i.name===`${i.key}-${tone}.${i.key==='primary-head'?'svg':'png'}`));
        assert.deepEqual(data.links,[`primary-head-${tone}.svg`,`glide-original-${tone}.png`,`glide-baseline-${tone}.png`]);assert.equal(data.board,`comparison-${tone}.png`);
        assert.equal(data.pressed,String(tone==='dark'));assert.equal(data.storage,'dark');assert.deepEqual(errors,[]);
        const ratios=data.pairs.map(([a,b])=>{const[x,y]=[luminance(a),luminance(b)].sort((a,b)=>a-b);return(y+.05)/(x+.05);});assert(ratios.every(r=>r>=4.5));
        rows.push({route,width,tone,sideBySide:true,overflow:0,primaryAndOriginalPreserved:true,minimumTextContrast:Math.min(...ratios)});
        if(route==='concepts/round-10/'&&[390,1440].includes(width)){
          await page.screenshot({path:path.join(output,`${width}-${tone}.png`),fullPage:true});
          await page.locator('#comparison').screenshot({path:path.join(output,`three-up-${width}-${tone}.png`)});
        }
      }
      await context.close();
    }
    const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:1000}}),page=await context.newPage();
    await page.goto(base+'concepts/round-10/',{waitUntil:'load'});await page.waitForURL('**/concepts/round-10/');await page.waitForLoadState('networkidle');assert.equal(await page.locator('#comparison article').count(),3);assert.equal(await page.locator('#tone').isVisible(),false);assert.equal(await page.locator('[data-open]').count(),3);await context.close();
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({base,cases:rows,noJavaScript:true},null,2));
    console.log(JSON.stringify({states:rows.length,columns:3,themes:2,overflow:0,errors:0,noJavaScript:true,report:path.join(output,'report.json')}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
