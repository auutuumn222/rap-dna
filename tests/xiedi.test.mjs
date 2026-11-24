import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-xiedi.json');
test('谢帝 identity and complete public pagination stay separate from namesakes',async()=>{
 const identity=await read('research/xiedi/netease-identity.json');
 assert.ok(identity.result.artists.some(a=>a.id===847107&&a.name==='谢帝'));
 assert.equal(catalog.artist.id,'n847107');
 const pages=await Promise.all([0,100,200,300].map(n=>read(`research/xiedi/netease-songs-${n}.json`)));
 const expected=new Set(pages.flatMap(p=>p.songs.map(s=>'n'+s.id)));
 assert.equal(pages.at(-1).more,false);assert.equal(expected.size,pages[0].total);assert.equal(expected.size,304);
 const release=await read('research/xiedi/netease-release-407630434.json');
 for(const song of release.songs)expected.add('n'+song.id);
 assert.deepEqual(new Set(catalog.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),expected);
 assert.equal(expected.size,320);assert.equal(catalog.tracks.length,365);assert.equal(catalog.coverage.historicallyComplete,false);
 assert.equal(catalog.coverage.from,'2011-12-02');
});
test('every 谢帝 credit, release and connection has song evidence',()=>{
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
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,284);
});
test('2026 蔡镇鸿 preserves the ordered tracks, track-level collaborators and credits',async()=>{
 const release=await read('research/xiedi/netease-release-407630434.json');
 const album=catalog.albums.find(a=>a.id==='n407630434');
 assert.equal(album.date,'2026-11-06');assert.equal(album.totalTracks,16);assert.ok(album.core);
 assert.deepEqual(album.trackIds,release.songs.map(song=>'n'+song.id));
 assert.deepEqual(catalog.albums.filter(a=>a.title==='蔡镇鸿').map(a=>a.date),['2026-11-06','2018-01-04']);
 const tracks=album.trackIds.map(id=>catalog.tracks.find(t=>t.id===id));
 assert.equal(tracks.filter(t=>t.artistIds.length>1).length,6);
 for(const [position,track] of tracks.entries()){
  const song=release.songs[position];
  assert.equal(track.title,song.name);assert.equal(track.trackNumber,position+1);
  assert.deepEqual(track.artistIds,song.artists.map(a=>'n'+a.id));
  assert.deepEqual(track.creditLines,release.credits[song.id].lines);
  assert.ok(track.credits.some(c=>c.role==='混音'&&c.raw==='混音 : Provoke'));
 }
});
test('Apple additions fill documented gaps without duplicate album cards or album-wide features',async()=>{
 assert.equal(catalog.albums.filter(a=>a.core).length,15);assert.equal(catalog.tracks.filter(t=>t.sourceLabel.startsWith('Apple')).length,45);
 const m=catalog.albums.find(a=>a.id==='n36186017');assert.equal(catalog.albums.filter(a=>a.title==='MY FRIEND WANNA TRAP').length,1);assert.equal(m.trackIds.length,22);assert.equal(m.displayTrackIds.length,22);assert.equal(m.sourceEditions.find(e=>e.sourceLabel==='网易云音乐').trackIds.length,0);
 for(const [id,n,added] of [[138120263,15,1],[36842411,7,1]]){const a=catalog.albums.find(a=>a.id==='n'+id);assert.equal(a.displayTrackIds.length,n);assert.equal(a.trackIds.length,n+added);}
 for(const t of catalog.tracks.filter(t=>t.sourceLabel.startsWith('Apple'))){assert.equal(neteaseSongId(t),null);assert.ok(t.artistEvidence.every(e=>e.source===t.source));}
 assert.equal(filterTracks(catalog,{query:'BO$$ X'}).length,365);assert.ok(!catalog.people.some(p=>p.id==='n94423405'));
 const candidate=await read('research/xiedi/apple-candidate-cn.json');assert.ok(candidate.results.some(a=>a.collectionName==='可愛的馬'));
});
test('all 谢帝 assets exist locally',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
