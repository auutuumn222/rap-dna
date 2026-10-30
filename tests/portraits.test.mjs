import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createPortraits} from '../dist/portraits.js';
const registry=JSON.parse(await readFile(new URL('../dist/people-portraits.json',import.meta.url),'utf8'));
test('existing archive portraits are shared by stable artist IDs',()=>{
 const portraits=createPortraits(registry.people);
 assert.equal(portraits.imageFor('n12198387'),'./assets/asen-portrait.jpg');
 assert.equal(portraits.imageFor('n1132392'),'./assets/masiwei-portrait.jpg');
 assert.equal(portraits.imageFor('n0'),null);
 assert.equal(portraits.imageFor('n31699751'),null);
 assert.equal(portraits.imageFor('n989028'),null);
 assert.equal(portraits.imageFor('unknown'),null);
 for(const image of ['javascript:alert(1)','https://example.com/photo.jpg','./assets/../private.jpg'])assert.equal(createPortraits({x:{image}}).imageFor('x'),null);
});
test('every registered portrait has an exact platform identity, evidence and a local asset',async()=>{
 assert.ok(Object.keys(registry.people).length>=2);
 for(const [id,entry] of Object.entries(registry.people)){
  if(/^n[1-9]\d*$/.test(id))assert.equal(entry.source,`https://music.163.com/artist?id=${id.slice(1)}`);else {assert.ok(entry.evidence);assert.match(entry.source,/^https:\/\/(music\.163\.com\/artist\?id=|music\.apple\.com\/)/);}assert.ok(entry.name);assert.ok(entry.imageSource);
  assert.ok(createPortraits(registry.people).imageFor(id));await access(new URL('../dist/'+entry.image.slice(2),import.meta.url));
 }
});
