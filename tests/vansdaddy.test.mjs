import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-vansdaddy.json');
test('Vansdaddy identity and complete public pagination stay separate from namesakes',async()=>{
 const identity=await read('research/vansdaddy/netease-identity.json');
 assert.ok(identity.result.artists.some(a=>a.id===35009085&&a.name==='Vansdaddy'));
 assert.equal(catalog.artist.id,'n35009085');
 const pages=await Promise.all([0,100].map(n=>read(`research/vansdaddy/netease-songs-${n}.json`)));
 const expected=new Set(pages.flatMap(p=>p.songs.map(s=>'n'+s.id)));
 assert.equal(pages.at(-1).more,false);assert.equal(expected.size,pages[0].total);assert.equal(expected.size,157);
 assert.deepEqual(new Set(catalog.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),expected);
 assert.equal(catalog.tracks.length,157);assert.equal(catalog.coverage.historicallyComplete,false);
 assert.equal(catalog.coverage.from,'2020-01-27');
});
test('every Vansdaddy credit, release and connection has song evidence',()=>{
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
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,147);
});
test('Candyshop participation and Apple identity conflicts stay separate from personal works',async()=>{
 const core=catalog.albums.filter(a=>a.core);assert.equal(core.length,7);
 for(const a of core)assert.equal(a.trackIds.length,a.totalTracks,a.title);
 for(const [id,total,count] of [[151704880,16,13],[397199509,17,12],[252450419,5,1],[241629953,27,1]]){const a=catalog.albums.find(a=>a.id==='n'+id);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,count);assert.equal(a.core,false);}
 for(const query of ['Vansdaddy','VD'])assert.equal(filterTracks(catalog,{query}).length,157);
 assert.equal(catalog.externalReleases.length,9);assert.equal(catalog.externalReleases.filter(a=>a.sourceLabel.includes('中国')).length,4);
 const cn=catalog.externalReleases.find(a=>a.id==='a1707345773-cn'),us=catalog.externalReleases.find(a=>a.id==='a1707345773-us');assert.equal(cn.artist,'Vansdaddy');assert.equal(us.artist,'硫克男孩Ryukboi');
 const candidate=await read('research/vansdaddy/apple-candidate-1819308208-cn.json');assert.ok(!candidate.results.some(a=>a.collectionId));
 assert.ok(catalog.tracks.every(t=>t.sourceLabel==='网易云音乐'));assert.equal(catalog.coverage.historicallyComplete,false);
});
test('all Vansdaddy assets exist locally',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
