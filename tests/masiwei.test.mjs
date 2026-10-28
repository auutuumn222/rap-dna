import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const catalog=JSON.parse(await readFile(new URL('../dist/catalog-masiwei.json',import.meta.url),'utf8'));
test('Masiwei snapshot exhausts all reported public pages without silently dropping undated records',async()=>{
 const pages=await Promise.all([0,100,200,300].map(n=>readFile(new URL(`../research/masiwei/netease-songs-${n}.json`,import.meta.url),'utf8').then(JSON.parse)));
 const expected=new Set(pages.flatMap(p=>p.songs.map(s=>'n'+s.id)));
 assert.equal(pages.at(-1).more,false);assert.equal(expected.size,pages[0].total);assert.equal(expected.size,318);
 assert.deepEqual(new Set(catalog.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),expected);
 assert.equal(catalog.tracks.length,322);assert.equal(catalog.tracks.filter(t=>t.id.startsWith('a')).length,4);
 assert.equal(catalog.tracks.find(t=>t.id==='n2014306991').date,'');assert.equal(catalog.coverage.from,'2014-01-01');assert.equal(catalog.coverage.historicallyComplete,false);
});
test('all Masiwei connections resolve to explicit song evidence and the correct artist',()=>{
 const people=new Set(catalog.people.map(p=>p.id)),albums=new Map(catalog.albums.map(a=>[a.id,a]));
 assert.equal(catalog.artist.id,'n1132392');assert.equal(new Set(catalog.tracks.map(t=>t.id)).size,catalog.tracks.length);
 for(const t of catalog.tracks){assert.ok(t.artistIds.includes(catalog.artist.id),t.title);assert.ok(albums.get(t.albumId).trackIds.includes(t.id));assert.ok(!t.date||t.date>=catalog.coverage.from&&t.date<=catalog.checkedAt);for(const id of t.artistIds)assert.ok(people.has(id));for(const c of t.credits){assert.ok(people.has(c.personId));assert.equal(c.source,t.source);assert.equal(c.level,'track');assert.ok(t.creditLines.includes(c.raw));}}
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,274);
 for(const p of connections(catalog,{mode:'credits'}))for(const e of p.evidence)assert.ok(catalog.tracks.find(t=>t.id===e.trackId).credits.some(c=>c.personId===p.id&&c.role===e.role));
});
test('core project tracklists are complete while featured albums remain partial',()=>{
 const core=catalog.albums.filter(a=>a.core);assert.equal(core.length,10);
 for(const a of core)assert.equal(a.trackIds.length,a.totalTracks,a.title);
 assert.equal(catalog.albums.find(a=>a.id==='n272136228').trackIds.length,1);
 assert.equal(catalog.albums.find(a=>a.id==='n272136228').core,false);
 assert.equal(catalog.albums.find(a=>a.id==='n363421958').trackIds.length,4);
 assert.equal(catalog.albums.find(a=>a.id==='n363421958').chapter,'团体项目');
 assert.equal(catalog.albums.find(a=>a.id==='n35559140').chapter,'团体项目');
 assert.equal(catalog.albums.find(a=>a.id==='n35559140').trackIds.length,1);
 const dog=connections(catalog,{albumId:'n169119649'});assert.equal(dog.find(p=>p.id==='n12198387').trackIds.length,13);assert.ok(!dog.some(p=>p.id===catalog.artist.id));assert.ok(!dog.some(p=>p.name==='王以太'));
 assert.equal(filterTracks(catalog,{year:'1970'}).length,0);assert.ok(filterTracks(catalog,{query:'Lion'}).some(t=>t.id==='a1705160834'));
});
test('all Masiwei album and portrait assets are available locally',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
