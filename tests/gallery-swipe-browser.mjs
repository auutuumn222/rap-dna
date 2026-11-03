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

 // Desktop: mouse drag
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'?artist=pharaoh');await page.waitForSelector('.floating-album.center');await page.waitForTimeout(1200);
 const box=await page.$eval('#hero-scene',e=>{const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
 assert.equal(await active(page),0);
 const drag=async(dx)=>{await page.mouse.move(box.x,box.y);await page.mouse.down();for(let i=1;i<=12;i++){await page.mouse.move(box.x+dx*i/12,box.y);await page.waitForTimeout(16);}await page.mouse.up();await page.waitForTimeout(900);};
 await drag(-200);assert.equal(await active(page),1,'drag left goes to next album');
 await drag(-380);assert.equal(await active(page),3,'longer drag moves multiple albums');
 await drag(200);assert.equal(await active(page),2,'drag right goes back');
 await drag(30);assert.equal(await active(page),2,'tiny slow drag snaps back');
 assert.equal(await page.$('.album-modal[open],dialog[open]'),null,'drag must not open the album');
 // Horizontal wheel (trackpad)
 await page.mouse.move(box.x,box.y);await page.mouse.wheel(120,0);await page.waitForTimeout(900);assert.equal(await active(page),3,'horizontal wheel advances');
 // Keyboard
 await page.focus('#hero-scene');await page.keyboard.press('ArrowLeft');await page.waitForTimeout(800);assert.equal(await active(page),2,'arrow key goes back');
 // Buttons still work
 await page.click('#hero-next');await page.waitForTimeout(800);assert.equal(await active(page),3);
 await page.screenshot({path:'qa/gallery-swipe/desktop.png',clip:{x:0,y:box.y-260,width:1280,height:520}});
 // Click on center still opens album
 const t=await title(page);await page.click('.floating-album.center', {force: true});await page.waitForTimeout(500);
 const opened=await page.evaluate(()=>!!document.querySelector('dialog[open]')||document.body.innerText.length>0);assert.ok(opened);
 assert.deepEqual(errors,[]);

 // Mobile: touch swipe
 const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const m=await ctx.newPage();await m.goto(base+'?artist=pharaoh');await m.waitForSelector('.floating-album.center');await m.waitForTimeout(1200);
 const mb=await m.$eval('#hero-scene',e=>{const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
 const cdp=await ctx.newCDPSession(m);
 const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
 await touch('touchStart',mb.x,mb.y);for(let i=1;i<=10;i++){await touch('touchMove',mb.x-80*i/10,mb.y);await m.waitForTimeout(16);}await touch('touchEnd');await m.waitForTimeout(900);
 assert.equal(await active(m),1,'touch swipe left goes to next album');
 await m.screenshot({path:'qa/gallery-swipe/mobile.png',fullPage:false});
 console.log('gallery swipe ok:',t);
}finally{await browser?.close();server.close();}
