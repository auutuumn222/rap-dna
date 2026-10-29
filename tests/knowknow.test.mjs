import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections} from '../dist/model.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const c=await read('dist/catalog-knowknow.json');
test('KnowKnow complete pagination, project scope and source evidence',async()=>{
 const pages=await Promise.all([0,100,200,300].map(n=>read(`research/knowknow/netease-songs-${n}.json`)));assert.equal(pages.at(-1).more,false);assert.equal(pages[0].total,335);assert.equal(c.tracks.length,335);assert.deepEqual(new Set(c.tracks.filter(t=>t.id.startsWith('n')).map(t=>t.id)),new Set(pages.flatMap(p=>p.songs.map(t=>'n'+t.id))));
 assert.equal(c.artist.id,'n27868624');assert.equal(c.albums.filter(a=>a.core).length,8);for(const a of c.albums.filter(a=>a.core))assert.equal(a.trackIds.length,a.totalTracks,a.title);
 assert.equal(c.tracks.find(t=>t.id==='n865887493').date,'');assert.equal(c.tracks.find(t=>t.id==='n865887493').platformDate,'1994-09-03');assert.equal(c.tracks.filter(t=>t.creditLines.length).length,266);
 for(const t of c.tracks){assert.ok(t.artistIds.includes(c.artist.id));assert.ok(c.albums.find(a=>a.id===t.albumId).trackIds.includes(t.id));for(const cr of t.credits){assert.equal(cr.source,t.source);assert.ok(t.creditLines.includes(cr.raw));}}
 for(const p of connections(c,{mode:'credits'}))for(const e of p.evidence)assert.ok(c.tracks.find(t=>t.id===e.trackId).credits.some(cr=>cr.personId===p.id&&cr.role===e.role));
 for(const a of c.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));await access(new URL('../dist/'+c.artist.portrait.slice(2),import.meta.url));
});
