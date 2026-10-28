import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {artists,shortestPaths} from '../dist/data.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.RAP_DNA_PLAYWRIGHT||'playwright');
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const output=fileURLToPath(new URL('../qa/',import.meta.url));
await mkdir(output,{recursive:true});
const server=createServer(async(req,res)=>{
  try{const name=new URL(req.url,'http://localhost').pathname;const file=path.join(root,name==='/'?'index.html':name);const type={'.html':'text/html','.css':'text/css','.js':'text/javascript'}[path.extname(file)];const bytes=await readFile(file);res.writeHead(200,{'Content-Type':type+'; charset=utf-8'}).end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.RAP_DNA_BROWSER?{executablePath:process.env.RAP_DNA_BROWSER}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Keep this check independent of external font availability.
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});
  await page.screenshot({path:path.join(output,'desktop.png'),fullPage:true});
  assert.equal(await page.locator('.graph-node').count(),13);
  await page.locator('#finder .primary').click();
  assert.equal(await page.locator('.path-person').count(),3);
  assert.match(await page.locator('.path-result').innerText(),/王以太/);
  await page.locator('.path-track').first().click();assert.equal(await page.locator('dialog').isVisible(),true);
  assert.match(await page.locator('.evidence-note').innerText(),/未核验/);
  await page.locator('.dialog-close').click();
  await page.locator('#swap').click();assert.equal(await page.locator('#from-artist').inputValue(),'aire');
  await page.locator('#to-artist').selectOption('aire');await page.locator('#finder .primary').click();
  assert.equal(await page.locator('.path-person').count(),1);
  await page.locator('#to-artist').selectOption('disconnected');await page.locator('#finder .primary').click();
  assert.match(await page.locator('.empty-state').innerText(),/未收录不代表/);
  await page.locator('#reset-network').click();await page.locator('#producer-toggle').click();
  assert.equal(await page.locator('.graph-node').count(),10);
  await page.locator('#works-tab').click();assert.equal(await page.locator('.song-network .track-row').count(),14);
  await page.locator('#network-tab').click();await page.locator('#zoom-in').click();
  assert.match(await page.locator('#graph-transform').getAttribute('transform'),/scale\(1.2\)/);
  await page.locator('.nav-item[data-page="producers"]').click();assert.equal(await page.locator('.producer-card').count(),3);
  await page.locator('[data-producer="mai"]').click();assert.match(await page.locator('.dialog-title').innerText(),/Mai/);await page.locator('.dialog-close').click();
  await page.locator('.nav-item[data-page="dna"]').click();assert.equal(await page.locator('#generate-dna').isDisabled(),true);
  await page.locator('#try-dna').click();assert.equal(await page.locator('.report-top-person').innerText(),'Mai');
  assert.match(await page.locator('.report-meta').innerText(),/4 \/ 5/);
  const downloadPromise=page.waitForEvent('download');await page.locator('#download-dna').click();const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'RAP-DNA-demo-report.svg');await download.saveAs(path.join(output,download.suggestedFilename()));
  await page.locator('.nav-item[data-page="challenge"]').click();
  const endpoints=await page.locator('.challenge-person:not(.unknown)').allTextContents();
  const ids=endpoints.map(text=>artists.find(a=>text.endsWith(a.name)).id);
  const answer=shortestPaths(ids[0],ids[1])[0][1];
  await page.locator('#challenge-hint').click();await page.locator('#challenge-choice').selectOption(answer);await page.locator('#challenge-form button').click();
  assert.match(await page.locator('#challenge-feedback').innerText(),/接上了/);
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#challenge-choice').isDisabled(),true);
  await page.locator('#reveal-path').click();assert.equal(await page.locator('dialog .track-row').count(),2);await page.locator('.dialog-close').click();
  await page.setViewportSize({width:390,height:844});
  for(const route of ['explore','producers','dna','challenge']){
    await page.locator(`.nav-item[data-page="${route}"]`).click();
    const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(dimensions.scroll<=dimensions.width,`${route} has horizontal overflow: ${JSON.stringify(dimensions)}`);
    await page.screenshot({path:path.join(output,`mobile-${route}.png`),fullPage:true});
  }
  assert.deepEqual(errors,[]);
  console.log('Browser checks passed: graph, paths, credits, producers, DNA/download, daily challenge/persistence, and 4 mobile routes.');
  console.log(`Screenshots: ${output}`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
