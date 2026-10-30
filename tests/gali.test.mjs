import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const c=await read('dist/catalog-gali.json');
test('GALI exact identity, complete public pagination and explicit Apple extras',async()=>{
 const pages=await Promise.all([0,100,200].map(n=>read(`research/gali/netease-songs-${n}.json`)));assert.equal(pages[0].total,217);assert.equal(pages.at(-1).more,false);assert.equal(c.artist.id,'n12127362');assert.equal(c.tracks.length,220);
 assert.deepEqual(new Set(c.tracks.filter(t=>t.id.startsWith('n')).map(t=>t.id)),new Set(pages.flatMap(p=>p.songs.map(t=>'n'+t.id))));assert.equal(c.coverage.historicallyComplete,false);
 assert.equal(c.tracks.filter(t=>t.id.startsWith('a')).length,3);for(const t of c.tracks){assert.ok(t.artistIds.includes(c.artist.id));assert.ok(c.albums.find(a=>a.id===t.albumId).trackIds.includes(t.id));if(t.id.startsWith('a'))assert.ok(t.artistEvidence.every(e=>e.source===t.source));}
 assert.equal(filterTracks(c,{query:'Know You Better'}).length,0);assert.equal(filterTracks(c,{year:'1970'}).length,0);
});
test('personal projects are complete while collaboration collections remain partial',()=>{
 for(const [id,count] of [[88135194,7],[88135306,6],[140566771,16],[190896190,12]]){const a=c.albums.find(a=>a.id==='n'+id);assert.ok(a.core);assert.equal(a.totalTracks,count);assert.equal(a.trackIds.length,count);}
 assert.equal(c.albums.filter(a=>a.core).length,4);for(const [id,total,count] of [[272136228,5,1],[178331377,13,3]]){const a=c.albums.find(a=>a.id==='n'+id);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,count);assert.equal(a.core,false);}
});
test('every GALI credit and relationship has exact song evidence and local art',async()=>{
 assert.equal(c.tracks.filter(t=>t.creditLines.length).length,201);const people=new Set(c.people.map(p=>p.id));
 for(const t of c.tracks)for(const cr of t.credits){assert.ok(people.has(cr.personId));assert.equal(cr.source,t.source);assert.equal(cr.level,'track');assert.ok(t.creditLines.includes(cr.raw));}
 for(const p of connections(c,{mode:'credits'}))for(const e of p.evidence)assert.ok(c.tracks.find(t=>t.id===e.trackId).credits.some(cr=>cr.personId===p.id&&cr.role===e.role));
 for(const a of c.albums){assert.deepEqual(new Set(a.trackIds),new Set(c.tracks.filter(t=>t.albumId===a.id).map(t=>t.id)));await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));}await access(new URL('../dist/'+c.artist.portrait.slice(2),import.meta.url));
});
