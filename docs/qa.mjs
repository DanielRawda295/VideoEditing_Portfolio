// Browser integration checks. Uses installed Playwright; no production dependencies.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('C:/Users/TOSHIBA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
process.env.PORT = '4174';
const { server } = await import('./serve.mjs');
if (!server.listening) await new Promise(resolve => server.once('listening', resolve));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true, args:['--no-proxy-server'] });
const results = { checkedAt:new Date().toISOString(), checks:[], playback:[], errors:[], failedLocalRequests:[] };
const context = await browser.newContext({ viewport:{width:1440,height:1000} });
const page = await context.newPage();
page.on('pageerror', error => results.errors.push(error.message));
page.on('response', response => { if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) results.failedLocalRequests.push([response.status(),response.url()]); });
const base = 'http://127.0.0.1:4174';
function passed(text) { results.checks.push(text); console.log('PASS',text); }
try {
  await page.goto(base, {waitUntil:'domcontentloaded'});
  await page.waitForSelector('.project-card');
  await page.waitForTimeout(2200);
  assert.equal(await page.locator('.project-card').count(),19);
  await page.screenshot({path:'docs/qa-desktop.png'});
  passed('Gallery contains all 19 actual projects');
  console.log('Hero type metrics',await page.locator('h1').evaluate(h=>({width:h.clientWidth,font:getComputedStyle(h).fontSize,lines:[...h.querySelectorAll('.line>span')].map(s=>{const r=document.createRange();r.selectNodeContents(s);return r.getBoundingClientRect().width;})})));
  assert.equal(await page.locator('.hero-screen>img').evaluate(image => image.complete && image.naturalWidth > 0),true);
  await page.locator('.portrait-wrap').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('.portrait-wrap>img').complete&&document.querySelector('.portrait-wrap>img').naturalWidth>0);
  assert.equal(await page.locator('.portrait-wrap>img').evaluate(image => image.complete && image.naturalWidth > 0),true);
  const download = await page.request.get(base+'/assets/documents/daniel-rawda-resume.pdf');
  assert.equal(download.status(),200); assert((await download.body()).subarray(0,4).toString()==='%PDF');
  passed('Portrait, hero poster and real PDF load successfully');
  const counts = {'Entertainment':9,'Promotional':1,'Fitness':1,'Logo animation':6,'UGC':2};
  for (const [category,count] of Object.entries(counts)) {
    await page.locator(`[data-filter="${category}"]`).click();
    assert.equal(await page.locator('.project-card').count(),count);
    assert.equal(await page.locator(`[data-filter="${category}"]`).getAttribute('aria-pressed'),'true');
  }
  await page.locator('[data-filter="All"]').click();
  passed('All category filters return the matching projects');
  if(!process.argv.includes('--layout-only')) {
  await page.locator('.project-open').first().click();
  await page.waitForFunction(() => document.querySelector('#dialog-video').currentTime > .1);
  await page.locator('#next-project').click();
  assert.equal(await page.locator('#dialog-title').textContent(),'Street Snitch / App promo');
  await page.locator('#previous-project').click();
  assert.equal(await page.locator('#dialog-title').textContent(),'Worlds in motion');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.querySelector('#project-dialog').contains(document.activeElement)),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#project-dialog').evaluate(dialog=>dialog.open),false);
  assert.equal(await page.locator('.project-open').first().evaluate(button=>button===document.activeElement),true);
  passed('Dialog plays, navigates, contains focus, closes with Escape and restores focus');
  // Load, play and seek every delivery video, independent of the gallery's visual layout.
  for (let i=0;i<19;i++) {
    await page.locator('.project-open').nth(i).click();
    await page.waitForFunction(() => { const video=document.querySelector('#dialog-video');return video.readyState>=2 && video.currentTime>.05; },null,{timeout:15000});
    const metadata=await page.locator('#dialog-video').evaluate(async video=>{
      const source=video.getAttribute('src');
      const info={source,duration:video.duration,width:video.videoWidth,height:video.videoHeight};
      video.pause();
      await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('seek timeout')),5000);video.addEventListener('seeked',()=>{clearTimeout(timer);resolve();},{once:true});video.currentTime=Math.max(.15,video.duration-.25);});
      return {...info,error:video.error?.message||null};
    });
    assert(metadata.duration>0 && metadata.width>0 && metadata.height>0 && metadata.error===null);
    results.playback.push(metadata);
    await page.keyboard.press('Escape');
  }
  passed('All 19 videos decode, play and seek near the end without a media error');
  await page.locator('#showreel').scrollIntoViewIfNeeded();
  await page.locator('.featured-play').click();
  await page.waitForFunction(()=>document.querySelector('#featured-video').currentTime>.1);
  assert.equal(await page.locator('#featured-video').evaluate(video=>video.controls),true);
  await page.locator('#featured-video').evaluate(video=>video.pause());
  passed('Featured player plays with native seek, volume and fullscreen controls');
  }
  // Scroll each lazy poster into view before visual QA, as a visitor would.
  await page.mouse.move(0,0);
  for(const image of await page.locator('.project-image img').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true});}));
    assert.equal(await image.evaluate(image=>image.naturalWidth>0),true);
  }
  passed('Every gallery poster loads and corresponds to a real project asset');
  await page.locator('.project-open').first().hover();
  await page.waitForFunction(()=>document.querySelectorAll('.project-image.previewing').length===1);
  await page.locator('.project-open').nth(1).hover();
  await page.waitForFunction(()=>document.querySelectorAll('.project-image.previewing').length===1);
  assert.equal(await page.locator('.project-image video[src]').count(),1);
  await page.mouse.move(0,0);
  await page.waitForFunction(()=>document.querySelectorAll('.project-image video[src]').length===0);
  passed('Hover previews play one at a time and release video sources on exit');
  // Verify each responsive width after bringing all reveals into view.
  for(const [name,width,height] of [['desktop',1440,1000],['tablet',820,1180],['mobile',390,844],['narrow',320,740]]) {
    await page.setViewportSize({width,height});
    await page.evaluate(()=>{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));});
    await page.waitForTimeout(350);
    const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
    if(!fits){console.log('Overflow elements',await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth,elements:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||el.scrollWidth>el.clientWidth+1&&getComputedStyle(el).display!=='inline');}).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,25),client:el.clientWidth,scroll:el.scrollWidth,right:el.getBoundingClientRect().right})).slice(0,35)})));await page.screenshot({path:`docs/qa-${name}-overflow.png`,fullPage:true});}
    assert.equal(fits,true,`Overflow at ${width}px`);
    await page.evaluate(()=>scrollTo(0,0));
    await page.waitForTimeout(350);
    await page.screenshot({path:`docs/qa-${name}.png`});
    if(name==='desktop'||name==='mobile')await page.screenshot({path:`docs/qa-${name}-full.png`,fullPage:true});
  }
  passed('No horizontal overflow at 1440, 820, 390 and 320 pixels');
  await page.setViewportSize({width:390,height:844});
  await page.locator('.menu-toggle').click();
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
  await page.locator('#navigation a[href="#about"]').click();
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
  passed('Mobile navigation opens, follows anchors and closes');
  const reducedPage=await context.newPage();
  await reducedPage.emulateMedia({reducedMotion:'reduce'});
  const mediaRequests=[];
  reducedPage.on('request',request=>{if(request.url().endsWith('.mp4'))mediaRequests.push(request.url());});
  await reducedPage.goto(base,{waitUntil:'domcontentloaded'});
  await reducedPage.waitForTimeout(2000);
  assert.equal(mediaRequests.length,0);
  assert.equal(await reducedPage.locator('#hero-video').evaluate(video=>video.paused&&!video.hasAttribute('src')),true);
  passed('Reduced-motion visitors load no video until they explicitly play one');
  await reducedPage.close();
  const saverPage=await context.newPage();
  await saverPage.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true,addEventListener(){}}}));
  const saverRequests=[];
  saverPage.on('request',request=>{if(request.url().endsWith('.mp4'))saverRequests.push(request.url());});
  await saverPage.goto(base,{waitUntil:'domcontentloaded'});
  await saverPage.locator('.project-open').first().hover();
  await saverPage.waitForTimeout(600);
  assert.equal(saverRequests.length,0);
  passed('Save-Data disables automatic video loading and hover previews');
  await saverPage.close();
  assert.equal(results.errors.length,0,results.errors.join('\n'));
  assert.equal(results.failedLocalRequests.length,0,JSON.stringify(results.failedLocalRequests));
  passed('No JavaScript exceptions or broken local asset responses');
} finally {
  await writeFile('docs/qa-results.json',JSON.stringify(results,null,2));
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
