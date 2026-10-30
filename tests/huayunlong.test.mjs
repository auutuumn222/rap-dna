import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-huayunlong.json');
test('华云龙KLE identity and complete public pagination stay separate from namesakes',async()=>{
 const identity=await read('research/huayunlong/netease-identity.json');
 assert.ok(identity.result.artists.some(a=>a.id===33435403&&a.name==='华云龙KLE'));
 assert.equal(catalog.artist.id,'n33435403');
 const pages=await Promise.all([0].map(n=>read(`research/huayunlong/netease-songs-${n}.json`)));
 const expected=new Set(pages.flatMap(p=>p.songs.map(s=>'n'+s.id)));
 assert.equal(pages.at(-1).more,false);assert.equal(expected.size,pages[0].total);assert.equal(expected.size,70);
 assert.deepEqual(new Set(catalog.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),expected);
 assert.equal(catalog.tracks.length,70);assert.equal(catalog.coverage.historicallyComplete,false);
 assert.equal(catalog.coverage.from,'2019-11-27');
});
test('every 华云龙KLE credit, release and connection has song evidence',()=>{
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
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,48);
});
test('official album scope and cross-platform version remain linked',async()=>{
 const core=catalog.albums.filter(a=>a.core);assert.equal(core.length,4);for(const a of core)assert.equal(a.trackIds.length,a.totalTracks,a.title);
 assert.equal(catalog.albums.filter(a=>a.title==='龙年').length,1);assert.equal(catalog.externalReleases.length,1);const r=catalog.externalReleases[0];assert.equal(r.relatedAlbumId,'n272444963');assert.equal(r.date,'2025-05-23');assert.equal(r.trackCount,14);
 for(const id of [1699561311,1835499303]){const d=await read(`research/huayunlong/apple-candidate-${id}-cn.json`);assert.ok(!d.results.some(x=>x.collectionId));}
 assert.equal(filterTracks(catalog,{query:'華雲龍KLE'}).length,70);assert.equal(catalog.coverage.historicallyComplete,false);
});
test('all 华云龙KLE assets exist locally',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
