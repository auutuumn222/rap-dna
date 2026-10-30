import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {server} from '../server.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
const c=JSON.parse(await readFile(new URL('../dist/catalog-rapeter.json',import.meta.url),'utf8'));
await mkdir('qa/rapeter',{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
 const p=await browser.newPage({viewport:{width:1440,height:950},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('https://music.163.com/outchain/player?**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body>Player test</body>'}));
 const url=`http://127.0.0.1:${server.address().port}/?artist=rapeter`;await p.goto(url,{waitUntil:'networkidle'});await p.locator('.hero h1').waitFor();
 assert.match(await p.title(),/Rapeter/);assert.equal(new URL(p.url()).searchParams.get('artist'),'rapeter');assert.equal(await p.locator('.album-card').count(),4);assert.match(await p.locator('#track-count').innerText(),/150/);
 for(const q of ['Rapeter','Rapeter吴嘉轩']){await p.locator('#track-search').fill(q);assert.match(await p.locator('#track-count').innerText(),/150/);}await p.locator('#track-search').fill('');await p.screenshot({path:'qa/rapeter/desktop.png',fullPage:true});
 const d=p.waitForEvent('download');await p.locator('.catalog-download').click();assert.match((await d).suggestedFilename(),/RAPETER-catalog/);
 await p.setViewportSize({width:390,height:844});await p.goto(url,{waitUntil:'networkidle'});await p.screenshot({path:'qa/rapeter/mobile.png',fullPage:true});
 for(const id of ['journey','archive','network','sources']){await p.locator('#'+id).scrollIntoViewIfNeeded();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id);}
 await p.setViewportSize({width:320,height:740});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(await p.locator('img').evaluateAll(xs=>xs.filter(x=>x.complete&&x.naturalWidth===0).map(x=>x.src)),[]);assert.deepEqual(errors,[]);console.log('Rapeter browser checks passed: profile, albums, aliases, catalog export, and mobile layout.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
