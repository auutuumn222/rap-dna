import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-capper.json');
test('Capper identity and all public pages are preserved with explicit Apple additions',async()=>{
 const pages=await Promise.all([0,100].map(n=>read(`research/capper/netease-songs-${n}.json`)));
 assert.equal(pages.at(-1).more,false);assert.equal(pages[0].total,200);
 assert.deepEqual(new Set(catalog.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),new Set(pages.flatMap(p=>p.songs.map(t=>'n'+t.id))));
 assert.equal(catalog.tracks.length,202);assert.equal(catalog.artist.id,'n12193174');assert.equal(catalog.coverage.historicallyComplete,false);
 assert.equal(catalog.coverage.from,'2017-09-04');assert.equal(catalog.coverage.through,'2026-10-25');
 for(const t of catalog.tracks)assert.ok(t.artistIds.includes(catalog.artist.id));
 for(const t of catalog.tracks.filter(t=>t.id.startsWith('a'))){assert.equal(neteaseSongId(t),null);assert.equal(t.date,'2021-10-18');assert.ok(t.artistEvidence.every(e=>e.source===t.source));}
 assert.equal(catalog.albums.find(a=>a.id==='a1797157422').date,'2022-06-06');
});
test('Capper solo albums and joint EP have complete participation while feature albums stay partial',()=>{
 for(const [id,total] of [[138207036,22],[160890405,14],[242852408,23],[352728713,20],[382412149,7]]){const a=catalog.albums.find(a=>a.id==='n'+id);assert.equal(a.core,true);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,total);}
 assert.equal(catalog.albums.filter(a=>a.core).length,5);
 const joint=catalog.albums.find(a=>a.id==='n382412149');assert.equal(joint.chapter,'联合项目');
 for(const id of joint.trackIds){const t=catalog.tracks.find(t=>t.id===id);assert.ok(t.artistIds.some(p=>catalog.people.find(x=>x.id===p)?.name==='周震南'));}
 const feature=catalog.albums.find(a=>a.id==='n399154218');assert.equal(feature.core,false);assert.equal(feature.totalTracks,24);assert.equal(feature.trackIds.length,1);
 assert.equal(catalog.externalReleases.length,44);assert.equal(catalog.externalReleases.filter(a=>a.sourceLabel.includes('中国')).length,22);
 assert.ok(filterTracks(catalog,{query:'终章'}).length===2);assert.equal(filterTracks(catalog,{year:'1970'}).length,0);
 assert.equal(catalog.tracks.find(t=>t.id==='a1797157427').kind,'instrumental');
});
test('Capper track references and relationship evidence resolve to exact source fields',()=>{
 const people=new Set(catalog.people.map(p=>p.id)),albums=new Map(catalog.albums.map(a=>[a.id,a]));
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,176);
 for(const t of catalog.tracks){assert.ok(albums.get(t.albumId).trackIds.includes(t.id));for(const id of t.artistIds)assert.ok(people.has(id));for(const c of t.credits){assert.ok(people.has(c.personId));assert.equal(c.level,'track');assert.equal(c.source,t.source);assert.ok(t.creditLines.includes(c.raw));}}
 for(const mode of ['artists','credits'])for(const p of connections(catalog,{mode}))for(const e of p.evidence){const t=catalog.tracks.find(t=>t.id===e.trackId);assert.equal(e.source,t.source);assert.ok(mode==='artists'?t.artistIds.includes(p.id):t.credits.some(c=>c.personId===p.id&&c.role===e.role));}
 for(const a of catalog.albums)assert.deepEqual(new Set(a.trackIds),new Set(catalog.tracks.filter(t=>t.albumId===a.id).map(t=>t.id)));
});
test('all Capper artwork and portrait assets are locally available',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
