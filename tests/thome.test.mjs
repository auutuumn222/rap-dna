import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-thome.json');
test('Thome identity and complete public pagination stay separate from namesakes',async()=>{
 const identity=await read('research/thome/netease-identity.json');
 assert.ok(identity.result.artists.some(a=>a.id===12110173&&a.name==='THOME'));
 assert.equal(catalog.artist.id,'n12110173');
 const pages=await Promise.all([0,100,200].map(n=>read(`research/thome/netease-songs-${n}.json`)));
 const expected=new Set(pages.flatMap(p=>p.songs.map(s=>'n'+s.id)));
 assert.equal(pages.at(-1).more,false);assert.equal(expected.size,pages[0].total);assert.equal(expected.size,203);
 assert.deepEqual(new Set(catalog.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),expected);
 assert.equal(catalog.tracks.length,203);assert.equal(catalog.coverage.historicallyComplete,false);
 assert.equal(catalog.coverage.from,'2018-03-30');
});
test('every Thome credit, release and connection has song evidence',()=>{
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
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,191);
});
test('old artist identity, partial group albums and regional editions retain their scope',async()=>{
 const old=await read('research/thome/netease-identity-old.json');assert.ok(old.result.artists.some(a=>a.id===12110173));
 const former=await read('research/thome/apple-old-1613535145-cn.json'),current=await read('research/thome/apple-albums-cn.json');
 assert.ok(former.results.some(a=>a.collectionId===1722522725));assert.ok(current.results.some(a=>a.collectionId===1722522725));
 const core=catalog.albums.filter(a=>a.core);assert.equal(core.length,6);
 for(const a of core)assert.equal(a.trackIds.length,a.id==='n83855315'?4:a.totalTracks,a.title);
 for(const [id,total,collected] of [[138339265,18,10],[272136228,5,1],[181549066,4,1]]){const a=catalog.albums.find(a=>a.id==='n'+id);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,collected);assert.equal(a.core,false);}
 for(const query of ['Thome','thomeboydontkill','THOMEBOYDONTKILL'])assert.equal(filterTracks(catalog,{query}).length,203);
 assert.ok(!catalog.people.some(p=>p.id==='n12111107'));assert.equal(catalog.externalReleases.length,41);
});
test('all Thome assets exist locally',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
