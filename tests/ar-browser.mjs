import {switchArtist} from './navigation-helpers.mjs';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {server} from '../server.mjs';

const require=createRequire(import.meta.url),{chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
const catalog=JSON.parse(await readFile(new URL('../dist/catalog-ar.json',import.meta.url),'utf8'));

await mkdir('qa/ar',{recursive:true});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;

try{
 browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://music.163.com/outchain/player?**',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="UTF-8"><body>播放器测试</body>'}));
 
 const root=`http://127.0.0.1:${server.address().port}`,url=root+'/?artist=ar';
 await page.goto(url,{waitUntil:'networkidle'});
 await page.locator('.hero h1').waitFor();

 assert.match(await page.title(),/AR|刘夫阳/i);
 assert.equal(await page.locator('#artist-select').inputValue(),'ar');
 assert.equal(await page.locator('.album-card').count(),10);
 assert.equal(await page.locator('#hero-dots button').count(),10);
 assert.match(await page.locator('#track-count').innerText(),/281/);

 await page.screenshot({path:'qa/ar/desktop.png',fullPage:true});

 await page.locator('.floating-album.center').click();
 assert.ok((await page.locator('.detail-track-row').count())>0);
 await page.locator('.dialog-close').click();

 await page.locator('[data-scope="all"]').click();
 assert.equal(await page.locator('.album-card').count(),catalog.albums.length);
 await page.locator('[data-scope="core"]').click();

 for(const query of ['AR刘夫阳','AR','刘夫阳','押韵狂魔','校长']){
  await page.locator('#track-search').fill(query);
  assert.match(await page.locator('#track-count').innerText(),/281/);
 }

 await page.locator('#track-search').fill('皇帝的新衣');
 assert.ok(await page.locator('#track-rows .song-button').count()>0);

 const loaded=page.waitForResponse(r=>r.url().startsWith('https://music.163.com/outchain/player?'));
 await page.locator('#track-rows [data-listen]').first().click();
 await loaded;

 assert.equal(await page.locator('#listen-frame iframe').count(),1);
 await page.locator('#listen-toggle').click();
 assert.equal(await page.locator('#listen-body').isVisible(),true);
 await page.locator('#listen-close').click();

 await page.locator('#network-album').selectOption('all');
 await page.locator('[data-mode="credits"]').click();
 assert.ok(await page.locator('.person-node').count()>0);

 const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await mobile.route('https://music.163.com/outchain/player?**',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="UTF-8"><body>播放器测试</body>'}));
 await mobile.goto(url,{waitUntil:'networkidle'});
 await mobile.screenshot({path:'qa/ar/mobile.png',fullPage:true});

 await switchArtist(page,'bridge');
 assert.match(await page.title(),/布瑞吉|Bridge/i);
 await switchArtist(page,'ar');
 assert.match(await page.title(),/AR|刘夫阳/i);

 assert.equal(errors.length,0);
 console.log('AR browser QA passed.');
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
