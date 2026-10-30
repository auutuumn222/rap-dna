import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {server} from '../server.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
await mkdir('qa/creators',{recursive:true});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // Exercise our player lifecycle without relying on a third-party playback grant.
 await page.route('https://music.163.com/outchain/**',r=>r.fulfill({contentType:'text/html',body:'<p>Official player test fixture</p>'}));
 const base=process.env.RAP_DNA_QA_URL||`http://127.0.0.1:${server.address().port}/`;
 const visit=async suffix=>{await page.goto(base+suffix,{waitUntil:'networkidle'});};
 const fits=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page fits viewport');
 await visit('');await page.locator('.dna-story').first().waitFor();assert.equal(await page.locator('.dna-story').count(),3);assert.equal(await page.locator('.dna-rapper-card').count(),0);assert.equal(await page.locator('.site-header nav a').count(),3);assert.equal(await page.locator('.artist-switch').isVisible(),false);assert.equal(await page.locator('#creators').evaluate(el=>el.open),false);assert.equal(await page.locator('#listening-panel iframe').count(),0);await fits();
 await page.screenshot({path:'qa/creators/home-desktop.png'});
 await page.locator('#creators>summary').click();await page.locator('#creator-search').fill('ATM Hanson');assert.ok(await page.locator('#creator-grid .dna-creator-card').count()>=1);await page.locator('#creator-grid a[href="./?creator=n13911452"]').click();await page.locator('.dna-profile h1').waitFor();assert.equal(await page.locator('.dna-profile h1').innerText(),'ATM Hanson');assert.match(page.url(),/creator=n13911452/);await fits();
 const artistCount=await page.locator('[data-work-artist]').count();assert.ok(artistCount>2);
 await page.locator('[data-work-artist="asen"]').click();await page.locator('#work-search').fill('英雄');assert.equal(await page.locator('#creator-works .dna-work').count(),1);
 await page.locator('#creator-works [data-evidence]').click();assert.match(await page.locator('#dialog-content').innerText(),/编曲 : ATM Hanson/);assert.ok(await page.locator('#dialog-content a[href="https://music.163.com/song?id=2754174746"]').count());
 await page.locator('.dialog-close').click();await page.locator('#creator-works [data-listen]').click();await page.locator('#listening-panel iframe').waitFor({state:'attached'});assert.ok(await page.locator('#listening-panel').evaluate(x=>x.classList.contains('collapsed')));assert.match(await page.locator('#listening-panel iframe').getAttribute('src'),/id=2754174746&auto=1/);await page.locator('#listen-close').click();
 await page.locator('#work-search').fill('');await page.locator('[data-work-artist="all"]').click();await page.screenshot({path:'qa/creators/creator-desktop.png'});
 await page.goBack();await page.locator('#creator-search').waitFor();assert.equal(await page.locator('#creator-search').inputValue(),'ATM Hanson');await page.goForward();await page.locator('.dna-profile h1').waitFor();
 await visit('?view=common&a=asen&b=masiwei');await page.locator('.dna-bridge').first().waitFor();await page.locator('#common-query').fill('ATM Hanson');assert.equal(await page.locator('.dna-bridge').count(),1);assert.equal(await page.locator('.dna-bridge .dna-work').count(),2);await page.locator('#common-role').selectOption('编曲');assert.equal(await page.locator('.dna-bridge').count(),1);await page.locator('.dna-bridge [data-evidence]').first().click();assert.match(await page.locator('#dialog-content').innerText(),/编曲/);await page.locator('.dialog-close').click();
 await page.screenshot({path:'qa/creators/common-desktop.png'});await page.locator('#common-a').selectOption('masiwei');assert.equal(await page.locator('.dna-bridge').count(),0);assert.match(await page.locator('#common-summary').innerText(),/两位不同/);
 await page.locator('#common-a').selectOption('pharaoh');await page.locator('#common-b').selectOption('keyng');assert.ok(await page.locator('.dna-bridge').count()>0);await fits();
 await visit('?creator=not-a-person');assert.match(await page.locator('#app').innerText(),/还没有进入档案/);
 await visit('?artist=asen#network');await page.locator('.person-node').first().waitFor();assert.equal(await page.locator('.floating-album').count(),5);await page.locator('[data-mode="credits"]').click();await page.locator('#connection-search').fill('ATM Hanson');await page.locator('#open-selected-person').click();await page.locator('.dna-profile h1').waitFor();assert.equal(await page.locator('.dna-profile h1').innerText(),'ATM Hanson');
 await page.setViewportSize({width:390,height:844});
 for(const [suffix,name,selector] of [['','home','.dna-story'],['?creator=n13911452','creator','.dna-profile h1'],['?view=common&a=asen&b=masiwei','common','.dna-bridge'],['?artist=masiwei#network','archive','.person-node']]){await visit(suffix);await page.locator(selector).first().waitFor();await fits();await page.screenshot({path:`qa/creators/${name}-mobile.png`,fullPage:name==='creator'});}
 await page.setViewportSize({width:320,height:740});await visit('');await page.locator('.dna-story').first().waitFor();await fits();await visit('?view=common&a=asen&b=masiwei');await page.locator('.dna-bridge').first().waitFor();await fits();
 const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src));assert.deepEqual(broken,[]);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,artistCount,desktop:true,mobile:[390,320],playerLifecycle:true,archiveCreatorNavigation:true}));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
