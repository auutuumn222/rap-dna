import {switchArtist} from './navigation-helpers.mjs';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {server} from '../server.mjs';

const require=createRequire(import.meta.url),{chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
const catalog=JSON.parse(await readFile(new URL('../dist/catalog-chenyihao.json',import.meta.url),'utf8'));

await mkdir('qa/chenyihao',{recursive:true});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;

try{
 browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://music.163.com/outchain/player?**',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="UTF-8"><body>播放器测试</body>'}));
 
 const root=`http://127.0.0.1:${server.address().port}`,url=root+'/?artist=chenyihao';
 await page.goto(url,{waitUntil:'networkidle'});
 await page.locator('.hero h1').waitFor();

 assert.match(await page.title(),/陈一豪Clear/i);
 assert.equal(await page.locator('#artist-select').inputValue(),'chenyihao');
 assert.equal(await page.locator('.album-card').count(),7);
 assert.equal(await page.locator('#hero-dots button').count(),7);
 assert.match(await page.locator('#track-count').innerText(),/131/);

 await page.screenshot({path:'qa/chenyihao/desktop.png',fullPage:true});

 await page.locator('.floating-album.center').click();
 assert.ok((await page.locator('.detail-track-row').count())>0);
 await page.locator('.dialog-close').click();

 await page.locator('[data-scope="all"]').click();
 assert.equal(await page.locator('.album-card').count(),catalog.albums.length);
 await page.locator('[data-scope="core"]').click();

 for(const query of ['陈一豪Clear','陈一豪','让长沙再次骄傲','Clear']){
  await page.locator('#track-search').fill(query);
  assert.match(await page.locator('#track-count').innerText(),/131/);
 }

 await page.locator('#track-search').fill('蒙特卡洛在哪');
 assert.ok(await page.locator('#track-rows .song-button').count()>0);

 const loaded=page.waitForResponse(r=>r.url().startsWith('https://music.163.com/outchain/player?'));
 await page.locator('#track-rows [data-listen]').first().click();
 await loaded;

 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'qa/chenyihao/mobile.png',fullPage:true});

 await switchArtist(page,'gai');
 assert.equal(await page.locator('#artist-select').inputValue(),'gai');
 assert.match(await page.title(),/GAI/);

 await switchArtist(page,'chenyihao');
 assert.equal(await page.locator('#artist-select').inputValue(),'chenyihao');

 assert.equal(errors.length,0,'Expected no uncaught page errors');
 console.log('chenyihao-browser test passed');
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
