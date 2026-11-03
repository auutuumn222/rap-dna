import {switchArtist} from './navigation-helpers.mjs';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {server} from '../server.mjs';

const require=createRequire(import.meta.url),{chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
const catalog=JSON.parse(await readFile(new URL('../dist/catalog-dengdianguo.json',import.meta.url),'utf8'));

await mkdir('qa/dengdianguo',{recursive:true});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;

try{
 browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://music.163.com/outchain/player?**',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="UTF-8"><body>播放器测试</body>'}));
 
 const root=`http://127.0.0.1:${server.address().port}`,url=root+'/?artist=dengdianguo';
 await page.goto(url,{waitUntil:'networkidle'});
 await page.locator('.hero h1').waitFor();

 assert.match(await page.title(),/邓典果DDG/i);
 assert.equal(await page.locator('#artist-select').inputValue(),'dengdianguo');
 assert.equal(await page.locator('.album-card').count(),8);
 assert.equal(await page.locator('#hero-dots button').count(),8);
 assert.match(await page.locator('#track-count').innerText(),/197/);

 await page.screenshot({path:'qa/dengdianguo/desktop.png',fullPage:true});

 await page.locator('.floating-album.center').click();
 assert.ok((await page.locator('.detail-track-row').count())>0);
 await page.locator('.dialog-close').click();

 await page.locator('[data-scope="all"]').click();
 assert.equal(await page.locator('.album-card').count(),catalog.albums.length);
 await page.locator('[data-scope="core"]').click();

 for(const query of ['邓典果DDG','邓典果','DDG']){
  await page.locator('#track-search').fill(query);
  assert.match(await page.locator('#track-count').innerText(),/197/);
 }

 await page.locator('#track-search').fill('摩登郊响');
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

 await page.locator('#open-external').click();
 assert.equal(await page.locator('.external-release').count(),catalog.externalReleases.length);
 await page.locator('.dialog-close').click();

 await page.locator('#open-research').click();
 assert.match(await page.locator('#dialog-content').innerText(),/IV-XV The Mixtape|下城摇|ALL I DO IS DRILLING|熊猫快递/);
 assert.match(await page.locator('#dialog-content').innerText(),/历史全量尚未证明|历史全量未证明/);
 await page.locator('.dialog-close').click();

 const download=page.waitForEvent('download');
 await page.locator('.catalog-download').click();
 assert.match((await download).suggestedFilename(),/邓典果DDG-catalog|dengdianguo/i);

 const song=catalog.tracks.find(t=>t.title==='摩登郊响');
 if(song){
  await page.goto(url+'&entry=shared#track/'+song.id,{waitUntil:'domcontentloaded'});
  await page.locator('#dialog-heading').waitFor();
  assert.match(await page.locator('#dialog-heading').innerText(),/摩登郊响/);
  assert.equal(new URL(page.url()).searchParams.get('artist'),'dengdianguo');
  await page.locator('.dialog-close').click();
 }

 await switchArtist(page,'asen');
 await page.locator('.hero h1').filter({hasText:'Asen'}).waitFor();
 assert.match(await page.locator('#track-count').innerText(),/168/);

 await switchArtist(page,'dengdianguo');
 await page.locator('.hero h1').filter({hasText:/邓典果DDG/}).waitFor();

 await page.setViewportSize({width:390,height:844});
 await page.goto(url,{waitUntil:'networkidle'});
 await page.screenshot({path:'qa/dengdianguo/mobile.png',fullPage:true});

 for(const id of ['journey','archive','network','sources']){
  await page.locator('#'+id).scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id);
 }

 await page.setViewportSize({width:320,height:740});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));

 assert.deepEqual(await page.locator('img').evaluateAll(xs=>xs.filter(x=>x.complete&&x.naturalWidth===0).map(x=>x.src)),[]);
 assert.deepEqual(errors,[]);

 console.log('邓典果DDG browser checks passed: catalog, aliases, timeline, credits, player, sources, export, deep links, artist switching and mobile.');
}finally{
 browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
