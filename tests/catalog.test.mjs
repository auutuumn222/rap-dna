import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const catalog=JSON.parse(await readFile(new URL('../dist/catalog.json',import.meta.url),'utf8'));
test('only exact NetEase song source URLs become playback targets',()=>{
 assert.equal(catalog.tracks.filter(t=>neteaseSongId(t)).length,166);
 for(const t of catalog.tracks.filter(t=>t.sourceLabel!=='网易云音乐'))assert.equal(neteaseSongId(t),null);
 for(const source of ['javascript:alert(1)','https://music.163.com.evil.test/song?id=1','https://music.163.com/album?id=1','https://music.163.com/song?id=x','http://music.163.com/song?id=1'])assert.equal(neteaseSongId({source}),null);
 assert.equal(neteaseSongId({source:'https://music.163.com/song?id=1995339510'}),'1995339510');
});
test('snapshot has all 166 distinct NetEase records plus 2 separately identified Apple additions',()=>{
 assert.equal(catalog.tracks.length,168);assert.equal(catalog.tracks.filter(t=>t.sourceLabel==='网易云音乐').length,166);
 assert.equal(new Set(catalog.tracks.map(t=>t.id)).size,168);assert.equal(catalog.coverage.neteaseHasMore,false);assert.equal(catalog.coverage.historicallyComplete,false);
 assert.equal(catalog.albums.filter(a=>a.core).length,7);assert.equal(catalog.externalReleases.length,18);
});
test('every song, performer, credit, album and evidence resolves without fabricated relationships',()=>{
 const people=new Set(catalog.people.map(p=>p.id)),albums=new Map(catalog.albums.map(a=>[a.id,a]));
 for(const t of catalog.tracks){
  assert.ok(t.artistIds.includes(catalog.artist.id));assert.ok(albums.get(t.albumId).trackIds.includes(t.id));assert.ok(t.date>='2018-01-01'&&t.date<=catalog.checkedAt);
  assert.match(t.source,/^https:\/\/(music\.163\.com|music\.apple\.com)\//);
  for(const id of t.artistIds)assert.ok(people.has(id));
  for(const c of t.credits){assert.ok(people.has(c.personId));assert.equal(c.level,'track');assert.equal(c.source,t.source);assert.ok(t.creditLines.includes(c.raw));}
 }
 for(const a of catalog.albums.filter(a=>a.core)){assert.equal(a.trackIds.length,a.totalTracks,`${a.title} must include its entire listed tracklist`);}
});
test('all source catalog artwork downloaded for offline use',async()=>{
 for(const a of catalog.albums.filter(a=>a.artwork.startsWith('./'))){await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));}
 await access(new URL('../dist/assets/asen-portrait.jpg',import.meta.url));
});
test('China release dates and different source versions stay distinct',()=>{
 assert.equal(catalog.albums.find(a=>a.title==='Nesa Tape').date,'2019-04-07');
 assert.equal(catalog.albums.find(a=>a.id==='n287974232').date,'2025-10-15');
 assert.equal(catalog.albums.find(a=>a.id==='n168054417').date,'2023-06-23');
 assert.equal(catalog.externalReleases.find(a=>a.id==='a1694463130').date,'2023-06-29');
 assert.equal(catalog.albums.find(a=>a.id==='n154372290').totalTracks,11);
 assert.equal(catalog.externalReleases.find(a=>a.id==='a1652831904').trackCount,10);
 assert.equal(catalog.tracks.filter(t=>t.title==='P.Y.T').length,2);
});
test('relationships are strictly supported by selected songs, never by unrelated artist appearances',()=>{
 const result=connections(catalog,{albumId:'n169119649'});
 const masiwei=result.find(p=>p.name==='马思唯');assert.equal(masiwei.trackIds.length,13);
 assert.ok(!result.some(p=>p.name==='王以太'));
 assert.equal(result.find(p=>p.name==='罗言').trackIds.length,1);
 assert.equal(connections(catalog,{year:'2016'}).length,0);
 for(const p of connections(catalog,{mode:'credits'})){assert.equal(p.trackIds.length,new Set(p.trackIds).size);assert.ok(p.evidence.every(e=>catalog.tracks.find(t=>t.id===e.trackId).credits.some(c=>c.personId===p.id&&c.role===e.role)));}
});
test('search and year/type filters correctly find real catalog entries',()=>{
 assert.equal(filterTracks(catalog,{query:'不存在的作品abcdefgh'}).length,0);
 assert.equal(filterTracks(catalog,{query:'GRAD SONG',kind:'instrumental'}).length,1);
 assert.equal(filterTracks(catalog,{albumId:'n287974232'}).length,15);
 assert.ok(filterTracks(catalog,{query:'谭玉堂'}).length>=14);
 const songs=filterTracks(catalog,{year:'2018'});assert.equal(songs.length,5);
});
