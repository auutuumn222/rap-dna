import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-mulasakee.json');
test('MULA SAKEE public pages are complete and all records belong to the selected identity',async()=>{
 const pages=await Promise.all([0,100].map(n=>read(`research/mulasakee/netease-songs-${n}.json`)));
 assert.equal(pages.at(-1).more,false);assert.equal(pages[0].total,148);
 assert.deepEqual(new Set(catalog.tracks.map(t=>t.id)),new Set(pages.flatMap(p=>p.songs.map(t=>'n'+t.id))));
 assert.equal(catalog.tracks.length,148);assert.equal(catalog.artist.id,'n14925064');assert.equal(catalog.coverage.historicallyComplete,false);
 assert.equal(catalog.coverage.from,'2018-06-01');assert.equal(catalog.coverage.through,'2026-08-06');
 for(const t of catalog.tracks){assert.ok(t.artistIds.includes(catalog.artist.id));assert.ok(neteaseSongId(t));}
});
test('core albums and group album preserve their actual participation scope',()=>{
 for(const [id,total] of [[98912120,9],[137725002,9],[161959979,16],[244462268,17],[353050240,20]]){
  const a=catalog.albums.find(a=>a.id==='n'+id);assert.equal(a.core,true);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,total);
 }
 assert.equal(catalog.albums.filter(a=>a.core).length,5);
 const group=catalog.albums.find(a=>a.id==='n138339265');assert.equal(group.totalTracks,18);assert.equal(group.trackIds.length,9);assert.equal(group.chapter,'团体项目');assert.equal(group.core,false);
 assert.equal(catalog.externalReleases.length,21);assert.equal(catalog.externalReleases.filter(a=>a.sourceLabel.includes('中国')).length,11);
 assert.ok(filterTracks(catalog,{query:'ATHENA'}).length);assert.equal(filterTracks(catalog,{year:'1970'}).length,0);
});
test('tracks, albums and relationship evidence resolve to source metadata',()=>{
 const people=new Set(catalog.people.map(p=>p.id)),albums=new Map(catalog.albums.map(a=>[a.id,a]));
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,138);
 for(const t of catalog.tracks){assert.ok(albums.get(t.albumId).trackIds.includes(t.id));for(const id of t.artistIds)assert.ok(people.has(id));for(const c of t.credits){assert.ok(people.has(c.personId));assert.equal(c.level,'track');assert.equal(c.source,t.source);assert.ok(t.creditLines.includes(c.raw));}}
 for(const mode of ['artists','credits'])for(const p of connections(catalog,{mode}))for(const e of p.evidence){const t=catalog.tracks.find(t=>t.id===e.trackId);assert.equal(e.source,t.source);assert.ok(mode==='artists'?t.artistIds.includes(p.id):t.credits.some(c=>c.personId===p.id&&c.role===e.role));}
 for(const a of catalog.albums)assert.deepEqual(new Set(a.trackIds),new Set(catalog.tracks.filter(t=>t.albumId===a.id).map(t=>t.id)));
});
test('all MULA SAKEE artwork and portrait assets are local',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
