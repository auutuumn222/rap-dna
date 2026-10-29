import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-macovaseas.json');
test('mac ova seas exact identity and all public pages include undated songs',async()=>{
 const pages=await Promise.all([0,100].map(n=>read(`research/macovaseas/netease-songs-${n}.json`)));
 assert.equal(pages[0].total,156);assert.equal(pages.at(-1).more,false);assert.equal(catalog.artist.id,'n30704161');assert.equal(catalog.tracks.length,156);
 assert.deepEqual(new Set(catalog.tracks.map(t=>t.id)),new Set(pages.flatMap(p=>p.songs.map(t=>'n'+t.id))));
 assert.equal(catalog.coverage.from,'2018-05-29');assert.equal(catalog.coverage.through,'2026-05-31');assert.equal(catalog.coverage.historicallyComplete,false);
 for(const t of catalog.tracks){assert.ok(t.artistIds.includes(catalog.artist.id));assert.ok(neteaseSongId(t));}
 for(const id of ['n2152462419','n1485814481']){const t=catalog.tracks.find(t=>t.id===id);assert.equal(t.date,'');assert.equal(catalog.albums.find(a=>a.id===t.albumId).date,'');}
 for(const query of ['mac ova seas','Mac Ova Seas','macovaseas'])assert.equal(filterTracks(catalog,{query}).length,156);
 assert.equal(filterTracks(catalog,{year:'1970'}).length,0);
});
test('four main projects are complete and group or guest albums retain exact participation',()=>{
 for(const [id,total] of [[88186995,15],[175686385,16],[265601262,7],[378439209,15]]){const a=catalog.albums.find(a=>a.id==='n'+id);assert.equal(a.core,true);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,total);}
 assert.equal(catalog.albums.filter(a=>a.core).length,4);
 for(const [id,total,count] of [[138339265,18,6],[181549066,4,1],[39389511,9,7],[243035746,12,1]]){const a=catalog.albums.find(a=>a.id==='n'+id);assert.equal(a.core,false);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,count);}
 const collection=catalog.albums.find(a=>a.id==='n181549066');assert.equal(collection.chapter,'合作合辑');assert.equal(catalog.tracks.find(t=>t.id===collection.trackIds[0]).title,'莫来头 （Late Night Talk）');
 assert.equal(catalog.externalReleases.length,35);assert.equal(catalog.externalReleases.filter(a=>a.sourceLabel.includes('中国')).length,18);
 assert.equal(catalog.coverage.appleExtraTracks,0);assert.ok(catalog.discrepancies.some(d=>d.title.includes('Born 2 Be')));
 assert.ok(filterTracks(catalog,{kind:'instrumental'}).some(t=>t.title.includes('官方beat')));assert.ok(filterTracks(catalog,{kind:'remix'}).some(t=>t.title.includes('Sped Up')));
});
test('all credits and relationship edges resolve to explicit source fields',()=>{
 const people=new Set(catalog.people.map(p=>p.id)),albums=new Map(catalog.albums.map(a=>[a.id,a]));assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,142);
 for(const t of catalog.tracks){assert.ok(albums.get(t.albumId).trackIds.includes(t.id));for(const id of t.artistIds)assert.ok(people.has(id));for(const c of t.credits){assert.ok(people.has(c.personId));assert.equal(c.source,t.source);assert.equal(c.level,'track');assert.ok(t.creditLines.includes(c.raw));}}
 for(const mode of ['artists','credits'])for(const p of connections(catalog,{mode}))for(const e of p.evidence){const t=catalog.tracks.find(t=>t.id===e.trackId);assert.equal(e.source,t.source);assert.ok(mode==='artists'?t.artistIds.includes(p.id):t.credits.some(c=>c.personId===p.id&&c.role===e.role));}
 for(const a of catalog.albums)assert.deepEqual(new Set(a.trackIds),new Set(catalog.tracks.filter(t=>t.albumId===a.id).map(t=>t.id)));
});
test('all mac ova seas artwork and unknown-release placeholders are local',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
