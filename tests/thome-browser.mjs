import {switchArtist} from './navigation-helpers.mjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {server} from '../server.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
await mkdir('qa/thome',{recursive:true});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://music.163.com/outchain/player?**',r=>r.fulfill({contentType:'text/html',body:'Player test'}));
 const url=`http://127.0.0.1:${server.address().port}/?artist=thome`;
 await page.goto(url,{waitUntil:'networkidle'});await page.locator('.hero h1').waitFor();
 assert.match(await page.title(),/Thome/);assert.equal(await page.locator('#artist-select').inputValue(),'thome');
 assert.equal(await page.locator('.album-card').count(),6);assert.equal(await page.locator('#hero-dots button').count(),6);assert.match(await page.locator('#track-count').innerText(),/203/);
 await page.screenshot({path:'qa/thome/desktop.png'});
 await page.locator('.floating-album.center').click();assert.match(await page.locator('#dialog-heading').innerText(),/KILL THOME II/);assert.equal(await page.locator('.detail-track-row').count(),16);await page.locator('.dialog-close').click();
 await page.locator('[data-scope="group"]').click();assert.equal(await page.locator('.album-card').count(),1);await page.locator('[data-scope="all"]').click();assert.equal(await page.locator('.album-card').count(),105);
 await page.locator('#track-search').fill('不存在的曲目abcdefgh');assert.match(await page.locator('#track-rows').innerText(),/还没有找到/);
 await page.locator('#track-search').fill('thomeboydontkill');assert.match(await page.locator('#track-count').innerText(),/203/);await page.locator('#track-rows .song-button').first().click();assert.ok(await page.locator('dialog [data-listen]').count()>0);assert.equal(new URL(page.url()).searchParams.get('artist'),'thome');const hash=new URL(page.url()).hash;await page.reload({waitUntil:'networkidle'});await page.locator('dialog[open]').waitFor();assert.equal(new URL(page.url()).hash,hash);await page.locator('.dialog-close').click();
 await page.locator('#network-album').selectOption('n138339265');assert.match(await page.locator('#connection-detail').innerText(),/mac ova seas|TOYOKI|MULA SAKEE|Digi Ghetto/i);await page.locator('#network-album').selectOption('all');await page.locator('[data-mode="credits"]').click();assert.ok(await page.locator('.person-node').count()>0);
 await page.locator('#open-research').click();assert.match(await page.locator('#dialog-content').innerText(),/艺名|身份/);assert.match(await page.locator('#dialog-content').innerText(),/203/);await page.locator('.dialog-close').click();
 await page.locator('#open-external').click();assert.equal(await page.locator('.external-release').count(),41);await page.locator('.dialog-close').click();
 const download=page.waitForEvent('download');await page.locator('.catalog-download').click();assert.match((await download).suggestedFilename(),/THOME-catalog/);
 await page.locator('#track-search').fill('KILL THOME');await page.locator('#track-rows [data-listen]').first().click();assert.equal(await page.locator('#listen-frame iframe').count(),1);assert.match(await page.locator('#listen-frame iframe').getAttribute('src'),/auto=1/);await page.locator('#listen-close').click();
 for(const [artist,name] of [['asen','Asen'],['masiwei','马思唯'],['thome','Thome']]){await switchArtist(page,artist);await page.locator('.hero h1').filter({hasText:name}).waitFor();}
 for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.goto(url,{waitUntil:'networkidle'});await page.locator('.hero h1').waitFor();for(const id of ['top','journey','archive','network','sources']){await page.locator('#'+id).scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: ${id}`);}await page.locator('#top').scrollIntoViewIfNeeded();const bounds=await page.locator('.hero h1').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width,'artist heading fits');await page.screenshot({path:`qa/thome/mobile-${width}.png`});}
 assert.deepEqual(await page.locator('img').evaluateAll(xs=>xs.filter(x=>x.complete&&x.naturalWidth===0).map(x=>x.src)),[]);assert.deepEqual(errors,[]);
 console.log('Thome browser checks passed: catalog, relationships, identity gaps, deep links, export, player, switching and 390/320px layouts.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
