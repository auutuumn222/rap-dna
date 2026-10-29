import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-beibei.json');
test('Beibei uses ljz329 exact identity and retains every public song including undated records',async()=>{
 const page=await read('research/beibei/netease-songs-0.json');assert.equal(page.total,32);assert.equal(page.more,false);
 assert.equal(catalog.artist.id,'n51957057');assert.equal(catalog.tracks.length,32);assert.equal(catalog.coverage.historicallyComplete,false);
 assert.deepEqual(new Set(catalog.tracks.map(t=>t.id)),new Set(page.songs.map(t=>'n'+t.id)));
 for(const t of catalog.tracks){assert.ok(t.artistIds.includes(catalog.artist.id));assert.ok(neteaseSongId(t));}
 for(const id of ['n2744377651','n2139367135']){const t=catalog.tracks.find(t=>t.id===id);assert.equal(t.date,'');assert.equal(catalog.albums.find(a=>a.id===t.albumId).date,'');}
 assert.equal(catalog.coverage.from,'2019-12-11');assert.equal(catalog.coverage.through,'2026-07-29');assert.equal(catalog.coverage.unknownReleaseRecords,2);
 for(const query of ['贝贝','ljz329','lij329'])assert.equal(filterTracks(catalog,{query}).length,32);
 assert.equal(filterTracks(catalog,{year:'2017'}).length,0);assert.ok(filterTracks(catalog,{query:'2017'}).length>0);assert.equal(filterTracks(catalog,{year:'1970'}).length,0);
});
test('singles stay singles, featured albums stay partial and Apple candidate identity is isolated',()=>{
 assert.equal(catalog.coverage.coreAlbums,0);assert.equal(catalog.albums.filter(a=>a.core).length,0);
 const singles=catalog.albums.filter(a=>a.listedOnArtist);assert.equal(singles.length,20);for(const a of singles){assert.equal(a.type,'Single');assert.equal(a.trackIds.length,1);}
 const feature=catalog.albums.find(a=>a.id==='n124269518');assert.equal(feature.totalTracks,12);assert.equal(feature.trackIds.length,1);
 assert.equal(catalog.externalReleases.length,0);assert.equal(catalog.coverage.appleExtraTracks,0);assert.equal(catalog.excludedIdentities[0].id,1581921427);
 assert.equal(catalog.people.find(p=>p.id==='n30003804').name,'404 RAPPER');
 const backbone=catalog.tracks.find(t=>t.id==='n1847059460');assert.ok(backbone.artistIds.includes('n30003804'));assert.ok(backbone.artistIds.includes(catalog.artist.id));
 assert.ok(!catalog.tracks.some(t=>t.title==='粉红法拉利'));assert.ok(!catalog.tracks.some(t=>t.id.startsWith('a')));
});
test('every relationship and credit resolves to an explicit track source',()=>{
 const people=new Set(catalog.people.map(p=>p.id)),albums=new Map(catalog.albums.map(a=>[a.id,a]));assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,31);
 for(const t of catalog.tracks){assert.ok(albums.get(t.albumId).trackIds.includes(t.id));for(const id of t.artistIds)assert.ok(people.has(id));for(const c of t.credits){assert.ok(people.has(c.personId));assert.equal(c.source,t.source);assert.equal(c.level,'track');assert.ok(t.creditLines.includes(c.raw));}}
 for(const mode of ['artists','credits'])for(const p of connections(catalog,{mode}))for(const e of p.evidence){const t=catalog.tracks.find(t=>t.id===e.trackId);assert.equal(e.source,t.source);assert.ok(mode==='artists'?t.artistIds.includes(p.id):t.credits.some(c=>c.personId===p.id&&c.role===e.role));}
 for(const a of catalog.albums)assert.deepEqual(new Set(a.trackIds),new Set(catalog.tracks.filter(t=>t.albumId===a.id).map(t=>t.id)));
});
test('all Beibei artwork and unknown-release placeholders are locally available',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
