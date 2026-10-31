import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {server} from '../server.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],base=process.env.RAP_DNA_QA_URL||`http://127.0.0.1:${server.address().port}/`;
 page.on('pageerror',e=>errors.push(e.message));
 page.setDefaultTimeout(45000);const visit=s=>page.goto(base+s,{waitUntil:'domcontentloaded',timeout:45000});
 await visit('?view=creators');await page.locator('#creator-search').waitFor();
 for(const name of ['ATM Hanson','ATMHanson','ATM Hanson，']){await page.locator('#creator-search').fill(name);assert.equal(await page.locator('#creator-grid .dna-creator-card').count(),1);assert.equal(await page.locator('#creator-grid .dna-creator-card').getAttribute('href'),'./?creator=n13911452');}
 for(const name of ['LusciousBB','LusciouBB','Luciousbb']){await page.locator('#creator-search').fill(name);assert.equal(await page.locator('#creator-grid .dna-creator-card').count(),1);assert.equal(await page.locator('#creator-grid .dna-creator-card').getAttribute('href'),'./?creator=n31093989');}
 await page.locator('#creator-search').fill('Mai \"No Label Crew\"');assert.equal(await page.locator('#creator-grid .dna-creator-card').count(),1);
 await page.locator('#creator-search').fill('atm');assert.equal(await page.locator('#creator-grid a[href="./?creator=n13911452"]').count(),1);assert.match(await page.locator('#creator-grid').innerText(),/The Heatmakerz/);
 for(const old of ['cYXRtIGhhbnNvbg','cYXRtaGFuc29u','cYXRtIGhhbnNvbiw']){await visit('?creator='+old+'&fromArtist=asen&fromSection=network');await page.locator('.dna-profile h1').waitFor();assert.equal(new URL(page.url()).searchParams.get('creator'),'n13911452');assert.equal(await page.locator('.dna-profile h1').innerText(),'ATM Hanson');assert.match(await page.locator('.dna-context-back').innerText(),/Asen/);}
 await page.locator('.dna-identity-details summary').click();assert.match(await page.locator('.dna-identity-details').innerText(),/ATMHanson/);assert.match(await page.locator('.dna-identity-details').innerText(),/ATM Hanson，/);
 await page.locator('#work-search').fill('PIPE DOWN');assert.equal(await page.locator('#creator-works .dna-work').count(),1);await page.locator('#creator-works [data-evidence]').click();assert.match(await page.locator('#dialog-content').innerText(),/编曲：ATMHanson/);assert.match(await page.locator('#dialog-content').innerText(),/原始署名：ATMHanson/);await page.locator('.dialog-close').click();
 await visit('?artist=cashtrippy#network');await page.locator('[data-mode="credits"]').click();await page.locator('#connection-search').fill('ATM');assert.equal(await page.locator('.person-node').count(),1);assert.equal(await page.locator('.person-node').getAttribute('data-node'),'n13911452');assert.match(await page.locator('.person-badge img').getAttribute('src'),/\.jpg/);await page.locator('#open-selected-person').click();await page.locator('.dna-profile h1').waitFor();assert.match(await page.locator('.dna-profile h1').innerText(),/ATM Hanson/);
 await visit('?view=common&a=asen&b=masiwei');await page.locator('#common-query').fill('ATMHanson');assert.equal(await page.locator('.dna-bridge').count(),1);assert.match(await page.locator('.dna-bridge-head').innerText(),/ATM Hanson/);
 await visit('?creator=cbHVzY2lvdWJi');await page.locator('.dna-profile h1').waitFor();assert.equal(new URL(page.url()).searchParams.get('creator'),'n31093989');assert.match(await page.locator('.dna-profile h1').innerText(),/LusciousBB/);await page.locator('#work-search').fill('神啊');await page.locator('#creator-works [data-evidence]').first().click();assert.match(await page.locator('#dialog-content').innerText(),/LusciouBB/);await page.locator('.dialog-close').click();
 await page.setViewportSize({width:390,height:844});await visit('?creator=cYXRtaGFuc29u');await page.locator('.dna-profile h1').waitFor();await page.locator('.dna-identity-details summary').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('Identity browser checks passed: unique alias search, unrelated Heatmakerz retained, old links, original evidence, unified graph/sidebar, shared creator lookup and mobile.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
