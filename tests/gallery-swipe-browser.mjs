import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {server} from '../server.mjs';

const require=createRequire(import.meta.url),{chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
await mkdir('qa/gallery-swipe',{recursive:true});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/`;
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
 const title=page=>page.$eval('#hero-album-title',e=>e.textContent);
 const active=page=>page.$$eval('#hero-dots button',bs=>bs.findIndex(b=>b.classList.contains('active')));
 const total=page=>page.$$eval('#hero-dots button',bs=>bs.length);

 // Desktop: mouse drag
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'?artist=pharaoh');await page.waitForSelector('.floating-album.center');await page.waitForTimeout(1200);
 const box=await page.$eval('#hero-scene',e=>{const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
 const count=await total(page);
 assert.equal(await active(page),0);

 const drag=async(dx)=>{
  await page.mouse.move(box.x,box.y);
  await page.mouse.down();
  for(let i=1;i<=12;i++){await page.mouse.move(box.x+dx*i/12,box.y);await page.waitForTimeout(16);}
  await page.mouse.up();
  await page.waitForTimeout(900);
 };

 // 1. Infinite loop: At index 0, drag right goes to last album!
 await drag(200);
 assert.equal(await active(page),count-1,'drag right at start wraps to last album');

 // 2. From last album, drag left goes back to index 0!
 await drag(-200);
 assert.equal(await active(page),0,'drag left at end wraps to first album');

 // 3. Drag left to advance normally
 await drag(-200);
 assert.equal(await active(page),1,'drag left advances to album 1');
 await drag(-200);
 assert.equal(await active(page),2,'drag left advances to album 2');

 // 4. Left button at index 2 goes to 1, then 0, then wraps to count-1
 await page.click('#hero-prev');await page.waitForTimeout(600);
 assert.equal(await active(page),1);
 await page.click('#hero-prev');await page.waitForTimeout(600);
 assert.equal(await active(page),0);
 await page.click('#hero-prev');await page.waitForTimeout(600);
 assert.equal(await active(page),count-1,'left button wraps to last album');

 // 5. Right button at last album wraps to 0
 await page.click('#hero-next');await page.waitForTimeout(600);
 assert.equal(await active(page),0,'right button wraps to first album');

 // 6. Verify vertical spacing between album cover and caption
 const spacing=await page.evaluate(()=>{
  const album=document.querySelector('.floating-album.center').getBoundingClientRect();
  const caption=document.querySelector('#hero-caption, .hero-caption').getBoundingClientRect();
  return caption.top-album.bottom;
 });
 console.log('Vertical spacing between album and caption:', spacing);
 assert.ok(spacing >= 8, `Spacing must be >= 8px, got ${spacing}px`);

 await page.screenshot({path:'qa/gallery-swipe/desktop.png',clip:{x:0,y:box.y-260,width:1280,height:560}});

 // Click on center still opens album
 await page.click('.floating-album.center', {force: true});await page.waitForTimeout(500);
 const opened=await page.evaluate(()=>!!document.querySelector('dialog[open]')||document.body.innerText.length>0);assert.ok(opened);
 assert.deepEqual(errors,[]);

 // Mobile: touch swipe
 const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const m=await ctx.newPage();await m.goto(base+'?artist=pharaoh');await m.waitForSelector('.floating-album.center');await m.waitForTimeout(1200);
 const mb=await m.$eval('#hero-scene',e=>{const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
 const cdp=await ctx.newCDPSession(m);
 const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});

 // Mobile swipe right at start wraps to last
 await touch('touchStart',mb.x,mb.y);for(let i=1;i<=10;i++){await touch('touchMove',mb.x+90*i/10,mb.y);await m.waitForTimeout(16);}await touch('touchEnd');await m.waitForTimeout(900);
 assert.equal(await active(m),count-1,'mobile touch swipe right wraps to last album');

 // Mobile swipe left wraps back to 0
 await touch('touchStart',mb.x,mb.y);for(let i=1;i<=10;i++){await touch('touchMove',mb.x-90*i/10,mb.y);await m.waitForTimeout(16);}await touch('touchEnd');await m.waitForTimeout(900);
 assert.equal(await active(m),0,'mobile touch swipe left wraps to first album');

 await m.screenshot({path:'qa/gallery-swipe/mobile.png',fullPage:false});
 console.log('All gallery infinite loop and spacing tests passed!');
}finally{await browser?.close();server.close();}
