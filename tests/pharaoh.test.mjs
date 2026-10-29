import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-pharaoh.json');
test('Pharaoh uses the verified identity and all 250 public song records including undated tracks',async()=>{
 const identity=await read('research/pharaoh/netease-identity.json');assert.ok(identity.result.artists.some(a=>a.id===865007&&a.name==='法老'));
 const pages=await Promise.all([0,100,200].map(n=>read(`research/pharaoh/netease-songs-${n}.json`)));
 const ids=new Set(pages.flatMap(p=>p.songs.map(t=>'n'+t.id)));assert.equal(pages.at(-1).more,false);assert.equal(ids.size,pages[0].total);assert.equal(ids.size,250);
 assert.deepEqual(new Set(catalog.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),ids);assert.equal(catalog.tracks.length,253);assert.equal(catalog.artist.id,'n865007');
 for(const id of ['n2647567562','n1472255266'])assert.equal(catalog.tracks.find(t=>t.id===id).date,'');
 assert.equal(catalog.coverage.unknownReleaseRecords,2);assert.equal(catalog.coverage.from,'2014-12-01');assert.equal(catalog.coverage.historicallyComplete,false);
});
test('all Pharaoh songs, releases and relationships resolve to explicit song evidence',()=>{
 const people=new Set(catalog.people.map(p=>p.id)),albums=new Map(catalog.albums.map(a=>[a.id,a]));
 assert.equal(new Set(catalog.tracks.map(t=>t.id)).size,catalog.tracks.length);
 for(const t of catalog.tracks){assert.ok(t.artistIds.includes(catalog.artist.id),t.title);assert.ok(albums.get(t.albumId).trackIds.includes(t.id));assert.ok(!t.date||t.date>=catalog.coverage.from&&t.date<=catalog.checkedAt);for(const id of t.artistIds)assert.ok(people.has(id));for(const c of t.credits){assert.ok(people.has(c.personId));assert.equal(c.level,'track');assert.equal(c.source,t.source);assert.ok(t.creditLines.includes(c.raw));}}
 for(const mode of ['artists','credits'])for(const p of connections(catalog,{mode}))for(const e of p.evidence){const t=catalog.tracks.find(t=>t.id===e.trackId);assert.equal(e.source,t.source);assert.ok(mode==='artists'?t.artistIds.includes(p.id):t.credits.some(c=>c.personId===p.id&&c.role===e.role));}
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,215);assert.ok(!people.has('n0'));
});
test('Pharaoh partial joint projects stay partial and Apple album featuring is never applied to every track',()=>{
 assert.equal(catalog.albums.filter(a=>a.core).length,7);
 for(const a of catalog.albums.filter(a=>a.core&&a.id!=='n153023757'))assert.equal(a.trackIds.length,a.totalTracks,a.title);
 for(const [id,total,count] of [[153023757,11,9],[81262294,11,2],[126088091,14,11]]){const a=catalog.albums.find(a=>a.id==='n'+id);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,count);}
 assert.equal(catalog.externalReleases.find(a=>a.id==='a1652758115').trackCount,10);
 const extra=catalog.tracks.filter(t=>t.id.startsWith('a'));assert.equal(extra.length,3);assert.ok(extra.every(t=>t.albumId==='a1567735053'));
 for(const t of extra){assert.equal(neteaseSongId(t),null);assert.equal(t.artistEvidence.length,t.artistIds.length);}
 assert.ok(!catalog.tracks.some(t=>t.id==='a1752250305'||t.id==='a1692124195'));
 const group=connections(catalog,{albumId:'n81262294'});assert.ok(group.length>0);assert.ok(group.every(p=>p.id!==catalog.artist.id));
 for(const query of ['法老','Pharaoh','MC法老','孙权'])assert.equal(filterTracks(catalog,{query}).length,253);
 assert.equal(filterTracks(catalog,{year:'1970'}).length,0);
});
test('all Pharaoh artwork is cached locally',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
