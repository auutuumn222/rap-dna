import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-jinji.json');
test('JinJiBeWater_隼 identity and complete public pagination stay separate from namesakes',async()=>{
 const identity=await read('research/jinji/netease-identity.json');
 assert.ok(identity.result.artists.some(a=>a.id===13451886&&a.name==='JinJiBeWater_隼'));
 assert.equal(catalog.artist.id,'n13451886');
 const pages=await Promise.all([0].map(n=>read(`research/jinji/netease-songs-${n}.json`)));
 const expected=new Set(pages.flatMap(p=>p.songs.map(s=>'n'+s.id)));
 assert.equal(pages.at(-1).more,false);assert.equal(expected.size,pages[0].total);assert.equal(expected.size,97);
 assert.deepEqual(new Set(catalog.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),expected);
 assert.equal(catalog.tracks.length,97);assert.equal(catalog.coverage.historicallyComplete,false);
 assert.equal(catalog.coverage.from,'2018-04-27');
});
test('every JinJiBeWater_隼 credit, release and connection has song evidence',()=>{
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
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,87);
});
test('joint projects include only actual participation and regional records remain distinct',()=>{
 const core=catalog.albums.filter(a=>a.core);assert.equal(core.length,5);
 for(const a of core)assert.equal(a.trackIds.length,a.id==='n98339170'?7:a.totalTracks,a.title);
 const early=catalog.albums.find(a=>a.id==='n81189873');assert.equal(early.totalTracks,4);assert.equal(early.trackIds.length,1);
 assert.ok(!catalog.tracks.some(t=>t.id==='n1495969252'));assert.ok(!catalog.people.some(p=>p.id==='n50149549'));
 for(const query of ['JinJiBeWater_隼','JinJiBeWater','JinJiBeWater隼'])assert.equal(filterTracks(catalog,{query}).length,97);
 assert.equal(catalog.externalReleases.length,11);assert.equal(catalog.externalReleases.filter(a=>a.sourceLabel.includes('中国')).length,5);
 assert.equal(catalog.coverage.historicallyComplete,false);
});
test('all JinJiBeWater_隼 assets exist locally',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
