import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const c=await read('dist/catalog-keyng.json');
test('KeyNG identity, complete public pagination and independently sourced Apple supplement',async()=>{
 const pages=await Promise.all([0,100,200].map(n=>read(`research/keyng/netease-songs-${n}.json`)));
 const ids=new Set(pages.flatMap(p=>p.songs.map(t=>'n'+t.id)));assert.equal(ids.size,203);assert.equal(ids.size,pages[0].total);assert.equal(pages.at(-1).more,false);
 assert.deepEqual(new Set(c.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),ids);assert.equal(c.artist.id,'n13899303');assert.equal(c.tracks.length,204);assert.equal(c.coverage.historicallyComplete,false);
 const extra=c.tracks.find(t=>t.id==='a1788508517');assert.equal(extra.title,'豫章書院');assert.equal(neteaseSongId(extra),null);assert.ok(extra.artistEvidence.every(e=>e.source===extra.source));
});
test('KeyNG references and relationships resolve to explicit song evidence',()=>{
 const people=new Set(c.people.map(p=>p.id)),albums=new Map(c.albums.map(a=>[a.id,a]));assert.equal(new Set(c.tracks.map(t=>t.id)).size,204);
 for(const t of c.tracks){assert.ok(t.artistIds.includes(c.artist.id));assert.ok(albums.get(t.albumId).trackIds.includes(t.id));assert.ok(t.date>=c.coverage.from&&t.date<=c.checkedAt);for(const id of t.artistIds)assert.ok(people.has(id));for(const x of t.credits){assert.ok(people.has(x.personId));assert.equal(x.level,'track');assert.equal(x.source,t.source);assert.ok(t.creditLines.includes(x.raw));}}
 for(const mode of ['artists','credits'])for(const p of connections(c,{mode}))for(const e of p.evidence){const t=c.tracks.find(t=>t.id===e.trackId);assert.ok(mode==='artists'?t.artistIds.includes(p.id):t.credits.some(x=>x.personId===p.id&&x.role===e.role));}
 assert.equal(c.tracks.filter(t=>t.creditLines.length).length,154);
});
test('KeyNG album gaps and partial collective/soundtrack participation remain explicit',()=>{
 assert.equal(c.albums.filter(a=>a.core).length,7);
 for(const [id,total,n] of [[75891244,10,8],[96777500,12,11],[81262294,11,2],[283228851,5,3]]){const a=c.albums.find(a=>a.id==='n'+id);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,n);}
 for(const a of c.albums.filter(a=>a.core&&!['n75891244','n96777500'].includes(a.id)))assert.equal(a.trackIds.length,a.totalTracks);
 for(const query of ['杨和苏','杨和苏KeyNG','KeyNG'])assert.equal(filterTracks(c,{query}).length,204);
 assert.equal(filterTracks(c,{query:'豫章书院'}).length,1);assert.ok(!c.tracks.some(t=>t.id==='a1744701486'||t.id==='a1757362075'));
});
test('KeyNG assets exist locally',async()=>{for(const a of c.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));await access(new URL('../dist/'+c.artist.portrait.slice(2),import.meta.url));});
