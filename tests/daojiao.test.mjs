import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections} from '../dist/model.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const c=await read('dist/catalog-daojiao.json');
test('刀脚 pagination, albums and track level evidence',async()=>{
 const pages=await Promise.all([0].map(n=>read(`research/daojiao/netease-songs-${n}.json`)));
 assert.equal(pages[0].total,92);assert.equal(pages.at(-1).more,false);assert.equal(c.artist.id,'n54247662');assert.equal(c.tracks.length,92);
 assert.deepEqual(new Set(c.tracks.map(t=>t.id)),new Set(pages.flatMap(p=>p.songs.map(t=>'n'+t.id))));assert.equal(c.coverage.historicallyComplete,false);
 for(const [id,total] of [[159781353,10],[276535367,12]]){const a=c.albums.find(a=>a.id==='n'+id);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,total);assert.equal(a.core,true);}
 assert.equal(c.tracks.filter(t=>t.creditLines.length).length,83);
 const identity=await read('research/daojiao/netease-identity.json');assert.ok(identity.result.artists.some(a=>a.id===54247662&&a.name==='刀脚'));assert.ok(identity.result.artists.some(a=>a.id===127873983&&a.name==='刀脚'));
 assert.equal(c.people.some(p=>p.id==='n127873983'),false);assert.equal(c.coverage.appleExtraTracks,0);
 for(const [id,total,count] of [[399901830,13,1],[379533718,5,2],[286468525,13,2]]){const a=c.albums.find(a=>a.id==='n'+id);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,count);assert.equal(a.core,false);}
 for(const t of c.tracks){assert.ok(t.artistIds.includes(c.artist.id));assert.ok(c.albums.find(a=>a.id===t.albumId).trackIds.includes(t.id));for(const cr of t.credits){assert.equal(cr.source,t.source);assert.ok(t.creditLines.includes(cr.raw));}}
 for(const p of connections(c,{mode:'credits'}))for(const e of p.evidence)assert.ok(c.tracks.find(t=>t.id===e.trackId).credits.some(cr=>cr.personId===p.id&&cr.role===e.role));
 for(const a of c.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));await access(new URL('../dist/'+c.artist.portrait.slice(2),import.meta.url));
});
