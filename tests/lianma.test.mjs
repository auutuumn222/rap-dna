import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-lianma.json');
test('Lianma Swimming identity and complete public pagination stay separate from namesakes',async()=>{
 const identity=await read('research/lianma/netease-identity.json');
 assert.ok(identity.result.artists.some(a=>a.id===12064019&&a.name==='连麻Swimming'));
 assert.equal(catalog.artist.id,'n12064019');
 const pages=await Promise.all([0,100].map(n=>read(`research/lianma/netease-songs-${n}.json`)));
 const expected=new Set(pages.flatMap(p=>p.songs.map(s=>'n'+s.id)));
 assert.equal(pages.at(-1).more,false);assert.equal(expected.size,pages[0].total);assert.equal(expected.size,158);
 const supplements=await read('research/lianma/netease-supplemental.json');assert.equal(supplements.songs.length,8);for(const s of supplements.songs){assert.ok(s.artists.some(a=>a.id===0&&a.name==='连麻Swimming'));expected.add('n'+s.id);const t=catalog.tracks.find(t=>t.id==='n'+s.id);assert.ok(t.artistEvidence.some(e=>e.personId===catalog.artist.id));}assert.deepEqual(new Set(catalog.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),expected);
 assert.equal(catalog.tracks.length,168);assert.equal(catalog.coverage.historicallyComplete,false);
 assert.equal(catalog.coverage.from,'2017-08-05');
});
test('every Lianma Swimming credit, release and connection has song evidence',()=>{
 const people=new Set(catalog.people.map(p=>p.id)),albums=new Map(catalog.albums.map(a=>[a.id,a]));
 assert.equal(new Set(catalog.tracks.map(t=>t.id)).size,catalog.tracks.length);
 for(const t of catalog.tracks){
  assert.ok(t.artistIds.includes(catalog.artist.id),t.title);assert.ok(albums.get(t.albumId).trackIds.includes(t.id));
  assert.ok(!t.date||t.date>=catalog.coverage.from&&t.date<=catalog.checkedAt);
  for(const id of t.artistIds)assert.ok(people.has(id));
  for(const c of t.credits){assert.ok(people.has(c.personId));assert.equal(c.level,'track');assert.equal(c.source,t.source);assert.ok(t.creditLines.includes(c.raw));}
 }
 for(const mode of ['artists','credits'])for(const p of connections(catalog,{mode}))for(const e of p.evidence){
  const t=catalog.tracks.find(t=>t.id===e.trackId);assert.equal(e.source,t.source);
  assert.ok(mode==='artists'?t.artistIds.includes(p.id):t.credits.some(c=>c.personId===p.id&&c.role===e.role));
 }
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,132);
});
test('partial early album, full later projects and Apple records keep evidence boundaries',()=>{
 const core=catalog.albums.filter(a=>a.core);assert.equal(core.length,7);
 for(const a of core)assert.equal(a.trackIds.length,a.id==='n35879652'?4:a.totalTracks,a.title);
 const ch=catalog.albums.find(a=>a.id==='n131027226');assert.equal(ch.trackIds.length,10);
 assert.equal(catalog.albums.find(a=>a.id==='n404975764').date,'2026-10-24');
 assert.equal(catalog.externalReleases.length,11);
 for(const query of ['连麻Swimming','连麻','連麻'])assert.equal(filterTracks(catalog,{query}).length,168);
 for(const t of catalog.tracks.filter(t=>t.id.startsWith('a'))){assert.equal(neteaseSongId(t),null);assert.equal(t.artistEvidence.length,t.artistIds.length);}
 assert.ok(!catalog.tracks.some(t=>t.id==='n498012243'));assert.ok(!catalog.people.some(p=>p.id==='n96539322'));
 assert.ok(!catalog.people.some(p=>p.id==='n0'));
});
test('all Lianma Swimming assets exist locally',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
