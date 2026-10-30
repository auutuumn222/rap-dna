import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {server} from '../server.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
await mkdir('qa/navigation',{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),base=process.env.RAP_DNA_QA_URL||`http://127.0.0.1:${server.address().port}/`,errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://music.163.com/outchain/**',r=>r.fulfill({contentType:'text/html',body:'Player lifecycle fixture'}));
 const visit=async suffix=>page.goto(base+suffix,{waitUntil:'networkidle'});
 const fits=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
 const nav=async()=>{assert.deepEqual(await page.locator('.site-header nav a').allTextContents(),['发现','找共同幕后','Rapper 档案']);assert.equal(await page.locator('.site-header nav a[aria-current="page"]').count(),1);for(const a of await page.locator('.site-header nav a').all())assert.ok(await a.isVisible());assert.equal(await page.locator('.artist-switch').isVisible(),false);};
 await visit('');await page.locator('.dna-story').first().waitFor();await nav();assert.equal(await page.locator('#creators').evaluate(e=>e.open),false);assert.equal(await page.locator('.dna-rapper-card').count(),0);assert.equal(await page.locator('.dna-compare-invite').count(),0);await fits();await page.screenshot({path:'qa/navigation/home-desktop.png'});
 await page.locator('.dna-hero-actions .dna-button').click();await page.locator('#rapper-search').waitFor();await nav();assert.ok(await page.locator('.dna-rapper-card').count()>=17);await page.locator('#rapper-search').fill('艾志恒');assert.equal(await page.locator('.dna-rapper-card').count(),1);await page.locator('.dna-rapper-card').click();await page.locator('.archive-guide').waitFor();await nav();assert.match(await page.locator('.archive-guide').innerText(),/Asen · 作品档案/);assert.equal(await page.locator('.archive-section-nav a').count(),4);assert.equal(await page.locator('.site-header nav [aria-current="page"]').innerText(),'Rapper 档案');await fits();await page.screenshot({path:'qa/navigation/archive-desktop.png'});
 await page.locator('#archive-backstage-start').click();assert.equal(await page.locator('[data-mode="credits"]').getAttribute('aria-pressed'),'true');await page.locator('#connection-search').fill('ATM Hanson');await page.locator('#open-selected-person').click();await page.locator('.dna-profile h1').waitFor();assert.equal(new URL(page.url()).searchParams.get('fromArtist'),'asen');assert.match(await page.locator('.dna-context-back').innerText(),/回到 Asen 的合作网络/);assert.match(await page.locator('.dna-profile-heading').innerText(),/幕后参与/);await nav();await page.screenshot({path:'qa/navigation/creator-desktop.png'});
 await page.locator('.dna-context-back').click();await page.locator('.archive-guide').waitFor();assert.equal(await page.locator('[data-mode="credits"]').getAttribute('aria-pressed'),'true');await page.locator('.archive-section-nav a[href="#archive"]').click();await nav();
 await visit('?view=common&a=asen&b=masiwei');await page.locator('.dna-bridge').first().waitFor();await page.locator('#common-query').fill('ATM Hanson');await page.locator('.dna-bridge-head>a').first().click();await page.locator('.dna-profile h1').waitFor();assert.equal(new URL(page.url()).searchParams.get('from'),'common');assert.match(await page.locator('.dna-context-back').innerText(),/Asen × 马思唯/);await page.locator('.dna-context-back').click();await page.locator('#common-a').waitFor();assert.equal(await page.locator('#common-a').inputValue(),'asen');assert.equal(await page.locator('#common-b').inputValue(),'masiwei');await nav();
 await visit('?creator=n1132392');await page.locator('.dna-profile h1').waitFor();assert.equal(await page.locator('.dna-person-views [aria-current="page"]').innerText(),'幕后参与');await page.locator('.dna-person-views a').click();await page.locator('.archive-guide').waitFor();assert.match(await page.locator('.archive-guide').innerText(),/马思唯 · 作品档案/);
 await visit('?view=creators');await page.locator('#creator-search').waitFor();assert.equal(await page.locator('#creators').evaluate(e=>e.open),true);await visit('#rapper-archives');await page.locator('#rapper-search').waitFor();await page.locator('#rapper-search').fill('no-such-rapper');assert.match(await page.locator('#rapper-archives').innerText(),/还没有进入档案/);
 for(const width of [390,320,768]){
  await page.setViewportSize({width,height:844});
  for(const [suffix,selector,name] of [['','.dna-hero','home'],['?view=rappers','#rapper-search','rappers'],['?artist=asen','.archive-guide','archive'],['?creator=n13911452&fromArtist=asen&fromSection=network','.dna-profile h1','creator'],['?view=common&a=asen&b=masiwei','.dna-bridge','common']]){
   await visit(suffix);await page.locator(selector).first().waitFor();await nav();await fits();
   if(name==='home'){for(const action of await page.locator('.dna-hero-actions a').all()){const box=await action.boundingBox();assert.ok(box&&box.y+box.height<844,'both first-time actions fit first screen');}}
   if(width===390)await page.screenshot({path:`qa/navigation/${name}-mobile.png`});
  }
 }
 assert.deepEqual(errors,[]);console.log('Navigation checks passed: three consistent entries, homepage guidance, archive search, backstage route and contextual return, comparison return, dual-role labels, legacy links, desktop and 390/320/768 layouts.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
