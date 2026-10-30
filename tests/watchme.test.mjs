import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-watchme.json');
test('王齐铭WatchMe identity and complete public pagination stay separate from namesakes',async()=>{
 const identity=await read('research/watchme/netease-identity.json');
 assert.ok(identity.result.artists.some(a=>a.id===12320060&&a.name==='王齐铭WatchMe'));
 assert.equal(catalog.artist.id,'n12320060');
 const pages=await Promise.all([0,100].map(n=>read(`research/watchme/netease-songs-${n}.json`)));
 const expected=new Set(pages.flatMap(p=>p.songs.map(s=>'n'+s.id)));
 assert.equal(pages.at(-1).more,false);assert.equal(expected.size,pages[0].total);assert.equal(expected.size,177);
 assert.deepEqual(new Set(catalog.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),expected);
 assert.equal(catalog.tracks.length,186);assert.equal(catalog.coverage.historicallyComplete,false);
 assert.equal(catalog.coverage.from,'2017-07-18');
});
test('every 王齐铭WatchMe credit, release and connection has song evidence',()=>{
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
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,157);
});
test('Apple collaborations have song-level participation and translated album releases share one card',()=>{
 assert.equal(catalog.albums.filter(a=>a.core).length,8);assert.equal(catalog.tracks.filter(t=>t.sourceLabel.startsWith('Apple')).length,9);
 const a=catalog.albums.find(a=>a.title==='少年梦');assert.equal(a.totalTracks,10);assert.equal(a.trackIds.length,8);assert.equal(a.core,false);
 for(const t of catalog.tracks.filter(t=>t.sourceLabel.startsWith('Apple'))){assert.equal(neteaseSongId(t),null);assert.ok(t.artistEvidence.every(e=>e.source===t.source));assert.ok(t.artistIds.includes(catalog.artist.id));}
 assert.equal(catalog.albums.filter(a=>a.title==='生活麻辣烫').length,1);for(const id of ['a1847564203-us','a1847558720-cn'])assert.equal(catalog.externalReleases.find(r=>r.id===id).relatedAlbumId,'n289139414');
 assert.equal(filterTracks(catalog,{query:'WatchMe'}).length,186);assert.equal(catalog.externalReleases.length,25);
});
test('all 王齐铭WatchMe assets exist locally',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
