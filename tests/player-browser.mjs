import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {server} from '../server.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[],requests=[];
 page.on('pageerror',error=>errors.push(error.message));
 // Isolate our lifecycle from third-party availability; actual NetEase is checked separately.
 await page.route('https://music.163.com/outchain/player?**',async route=>{requests.push(route.request().url());await route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><body>网易云官方播放器测试占位</body></html>'});});
 const base=`http://127.0.0.1:${server.address().port}`;
 await page.goto(base,{waitUntil:'networkidle'});
 assert.equal(requests.length,0);assert.equal(await page.locator('#listening-panel').isVisible(),false);
 await page.locator('#track-search').fill('Going Down');await page.locator('#track-rows [data-listen]').first().click();
 await page.locator('#listen-frame iframe').waitFor();await page.waitForLoadState('networkidle');
 assert.equal(requests.length,1);assert.match(requests[0],/id=1995339510&auto=0/);assert.match(await page.locator('#listen-title').innerText(),/Going Down/);
 assert.match(await page.locator('#listen-external').getAttribute('href'),/song\?id=1995339510/);
 await page.locator('#listen-frame iframe').evaluate(el=>el.dataset.identity='same-frame');
 await page.locator('#listen-toggle').click();assert.equal(await page.locator('#listen-body').isVisible(),false);
 assert.equal(await page.locator('#listen-frame iframe').count(),1);
 await page.locator('#track-rows [data-listen]').first().click();assert.equal(await page.locator('#listen-body').isVisible(),true);assert.equal(await page.locator('#listen-frame iframe').getAttribute('data-identity'),'same-frame');assert.equal(requests.length,1);
 await page.locator('#network').scrollIntoViewIfNeeded();assert.equal(await page.locator('#listening-panel').isVisible(),true);
 await page.locator('#connection-detail [data-listen]').first().click();assert.equal(await page.locator('#listen-frame iframe').count(),1);assert.equal(await page.locator('#listen-frame iframe').getAttribute('data-identity'),null);
 await page.locator('#track-search').fill('错意');await page.locator('#track-rows .song-button').first().click();
 assert.equal(await page.locator('dialog').isVisible(),true);await page.locator('dialog [data-listen]').click();assert.equal(await page.locator('dialog').isVisible(),false);assert.equal(await page.locator('#listen-title').innerText(),'错意');
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.locator('#listen-external').isVisible(),true);
 await page.screenshot({path:'qa/asen/mobile-listening.png'});
 const before=requests.length;await page.locator('#listen-retry').click();await page.waitForLoadState('networkidle');assert.equal(requests.length,before+1);assert.equal(await page.locator('#listen-frame iframe').count(),1);
 await page.locator('#listen-close').click();assert.equal(await page.locator('#listening-panel').isVisible(),false);assert.equal(await page.locator('#listen-frame iframe').count(),0);assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('has-listening-panel')),false);
 await page.locator('#track-search').fill('Congelado');await page.locator('#track-rows .song-button').click();assert.equal(await page.locator('dialog [data-listen]').count(),0);assert.match(await page.locator('.track-listen-action a').getAttribute('href'),/^https:\/\/music.apple.com\//);
 assert.deepEqual(errors,[]);
 console.log('Player checks passed: lazy loading, single iframe, same-song reuse, switching, collapse, dialog handoff, mobile, retry, close and Apple-only fallback.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
