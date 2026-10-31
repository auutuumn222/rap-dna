import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {server} from '../server.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
await mkdir('qa/daojiao',{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=`http://127.0.0.1:${server.address().port}/?artist=daojiao`;await page.goto(url,{waitUntil:'networkidle'});await page.locator('.hero h1').waitFor();
 assert.match(await page.title(),/刀脚/);assert.equal(await page.locator('#artist-select').inputValue(),'daojiao');assert.match(await page.locator('#track-count').innerText(),/92/);assert.equal(await page.locator('.album-card').count(),2);
 await page.screenshot({path:'qa/daojiao/desktop.png'});await page.locator('.floating-album.center').click();assert.match(await page.locator('#dialog-heading').innerText(),/大脚颂|脚殺传/);await page.locator('.dialog-close').click();
 await page.locator('#track-search').fill('辣椒面');assert.ok(await page.locator('#track-rows .song-button').count()>0);await page.locator('[data-mode="credits"]').click();assert.ok(await page.locator('.person-node').count()>0);
 await page.locator('#open-research').click();assert.match(await page.locator('#dialog-content').innerText(),/92|刀脚/);await page.locator('.dialog-close').click();
 for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.goto(url,{waitUntil:'networkidle'});await page.locator('.hero h1').waitFor();for(const id of ['top','journey','archive','network','sources']){await page.locator('#'+id).scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: ${id}`);}await page.screenshot({path:`qa/daojiao/mobile-${width}.png`});}
 assert.deepEqual(await page.locator('img').evaluateAll(xs=>xs.filter(x=>x.complete&&x.naturalWidth===0).map(x=>x.src)),[]);assert.deepEqual(errors,[]);
 console.log('刀脚 browser checks passed: catalog, core albums, creator graph, navigation and 390/320px layouts.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
