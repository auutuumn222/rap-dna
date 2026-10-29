import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-sasioverlxrd.json');
test('all public pages are accounted for, with identity conflicts quarantined',async()=>{
 const pages=await Promise.all([0,100,200].map(n=>read(`research/sasioverlxrd/netease-songs-${n}.json`)));
 const returned=new Set(pages.flatMap(p=>p.songs.map(s=>'n'+s.id)));
 assert.equal(pages.at(-1).more,false);assert.equal(returned.size,pages[0].total);assert.equal(returned.size,244);
 const included=catalog.tracks.filter(t=>neteaseSongId(t)),excluded=new Set(catalog.excludedRecords.map(t=>t.id));
 assert.equal(included.length,236);assert.equal(excluded.size,8);assert.equal(catalog.tracks.length,239);
 assert.deepEqual(new Set([...included.map(t=>t.id),...excluded]),returned);
 for(const t of included)assert.ok(!excluded.has(t.id));
 assert.equal(catalog.coverage.from,'2018-04-20');assert.equal(catalog.coverage.historicallyComplete,false);
 for(const p of connections(catalog))for(const e of p.evidence)assert.ok(!excluded.has(e.trackId));
 assert.ok(!catalog.people.some(p=>['Nhato','Babbe','Violet Delta','綾倉盟'].includes(p.name)));
});
test('every track and connection has source evidence and valid references',()=>{
 const people=new Set(catalog.people.map(p=>p.id)),albums=new Map(catalog.albums.map(a=>[a.id,a]));
 assert.equal(catalog.artist.id,'n14117457');assert.equal(new Set(catalog.tracks.map(t=>t.id)).size,239);
 for(const t of catalog.tracks){assert.ok(t.artistIds.includes(catalog.artist.id));assert.ok(albums.get(t.albumId).trackIds.includes(t.id));assert.ok(t.date>=catalog.coverage.from&&t.date<=catalog.checkedAt);for(const id of t.artistIds)assert.ok(people.has(id));for(const c of t.credits){assert.ok(people.has(c.personId));assert.equal(c.source,t.source);assert.equal(c.level,'track');assert.ok(t.creditLines.includes(c.raw));}}
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,218);
 for(const p of connections(catalog,{mode:'credits'}))for(const e of p.evidence)assert.ok(catalog.tracks.find(t=>t.id===e.trackId).credits.some(c=>c.personId===p.id&&c.role===e.role));
 for(const a of catalog.albums)assert.deepEqual(new Set(a.trackIds),new Set(catalog.tracks.filter(t=>t.albumId===a.id).map(t=>t.id)));
});
test('core, early projects and region editions retain their actual participation scope',()=>{
 assert.equal(catalog.albums.filter(a=>a.core).length,8);
 for(const a of catalog.albums.filter(a=>a.core&&a.id!=='n98339170'))assert.equal(a.trackIds.length,a.totalTracks,a.title);
 for(const [id,total,collected] of [[98339170,12,11],[38473693,7,6],[71849511,13,10],[74999965,12,10]]){const a=catalog.albums.find(a=>a.id==='n'+id);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,collected);}
 assert.equal(catalog.externalReleases.length,16);assert.equal(catalog.externalReleases.filter(a=>a.sourceLabel.includes('中国')).length,7);
 assert.equal(catalog.externalReleases.find(a=>a.id==='a1837674874-cn').trackCount,8);assert.equal(catalog.albums.find(a=>a.id==='n139836920').trackIds.length,9);
 const cypher=connections(catalog,{albumId:'n149077237'});assert.equal(cypher.find(p=>p.id==='n12198387').trackIds.length,1);assert.ok(!cypher.some(p=>p.id===catalog.artist.id));
 assert.equal(filterTracks(catalog,{year:'2013'}).length,0);assert.ok(filterTracks(catalog,{query:'旁光'}).some(t=>t.id==='a1832632012'));
 for(const t of catalog.tracks.filter(t=>t.id.startsWith('a'))){assert.equal(neteaseSongId(t),null);assert.ok(t.artistEvidence.every(e=>e.source===t.source));}
});
test('all artwork and portrait files are locally available',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
