import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile} from 'node:fs/promises';
import {server} from '../server.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
const registry=JSON.parse(await readFile(new URL('../dist/people-portraits.json',import.meta.url),'utf8'));
await mkdir('qa/avatars',{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
 const base=`http://127.0.0.1:${server.address().port}`,page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 async function loaded(id){await page.waitForFunction(id=>document.querySelector(`[data-node="${id}"]`)?.classList.contains('has-portrait'),id);}
 await page.goto(base+'/?artist=masiwei',{waitUntil:'networkidle'});await loaded('n12198387');assert.match(await page.locator('[data-node="n12198387"] image').getAttribute('href'),/asen-portrait.jpg/);
 assert.equal(await page.locator('[data-node="n12198387"] image').evaluate(e=>getComputedStyle(e).filter),'none');
 await page.locator('[data-node="n12198387"]').click();assert.match(await page.locator('#connection-detail').innerText(),/艾志恒Asen/);assert.match(await page.locator('[data-node="n12198387"]').getAttribute('class'),/active/);
 await page.locator('#network').scrollIntoViewIfNeeded();await page.locator('.graph-canvas').screenshot({path:'qa/avatars/masiwei-desktop.png'});
 await page.locator('[data-mode="credits"]').click();await page.locator('#connection-search').fill('YYKBZ');assert.ok(await page.locator('.person-node').count()>0);
 await page.goto(base+'/',{waitUntil:'networkidle'});await loaded('n1132392');assert.match(await page.locator('[data-node="n1132392"] image').getAttribute('href'),/masiwei-portrait.jpg/);
 await page.locator('[data-node="n1132392"]').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#connection-detail').innerText(),/马思唯/);
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/?artist=masiwei',{waitUntil:'networkidle'});await loaded('n12198387');await page.locator('#network').scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.graph-canvas').screenshot({path:'qa/avatars/masiwei-mobile.png'});
 const failed=await browser.newPage();let failedRequests=0;
 await failed.route('**/'+registry.people.n27868624.image.slice(2),async route=>{failedRequests++;await route.fulfill({status:404,body:'Missing portrait'});});
 await failed.goto(base+'/?artist=masiwei',{waitUntil:'networkidle'});
 await failed.waitForFunction(()=>{const n=document.querySelector('[data-node="n27868624"]');return n&&!n.querySelector('image');});
 assert.equal(await failed.locator('[data-node="n27868624"] .node-monogram').evaluate(e=>getComputedStyle(e).visibility),'visible');
 await failed.locator('[data-node="n12198387"]').click();assert.equal(await failed.locator('[data-node="n27868624"] image').count(),0);assert.equal(failedRequests,1);await failed.close();
 const offline=await browser.newPage();await offline.route('**/people-portraits.json',r=>r.fulfill({status:503,body:'Unavailable'}));await offline.goto(base+'/?artist=masiwei',{waitUntil:'networkidle'});assert.ok(await offline.locator('.person-node').count()>0);assert.equal(await offline.locator('.person-node image').count(),0);await offline.close();
 for(const artist of ['asen','masiwei']){const c=JSON.parse(await readFile(new URL('../dist/'+(artist==='asen'?'catalog.json':'catalog-masiwei.json'),import.meta.url),'utf8'));const missing=c.people.find(p=>p.id==='n31699751'||p.id==='n989028');if(missing){await page.goto(base+'/?artist='+artist,{waitUntil:'networkidle'});await page.locator('#connection-search').fill(missing.name);const n=page.locator(`[data-node="${missing.id}"]`);if(await n.count()){assert.equal(await n.locator('image').count(),0);assert.equal(await n.locator('.node-monogram').evaluate(e=>getComputedStyle(e).visibility),'visible');break;}}}
 assert.deepEqual(errors,[]);console.log('Portrait checks passed: reciprocal portraits, correct colors, selection/keyboard, credit mode, mobile, missing-photo fallback, failed-image fallback and offline registry.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
