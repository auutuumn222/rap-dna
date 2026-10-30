import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections} from '../dist/model.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const c=await read('dist/catalog-jonyj.json');
test('Jony J pagination, albums and track level evidence',async()=>{
 const pages=await Promise.all([0,100].map(n=>read(`research/jonyj/netease-songs-${n}.json`)));
 assert.equal(pages[0].total,131);assert.equal(pages.at(-1).more,false);assert.equal(c.artist.id,'n784257');assert.equal(c.tracks.length,131);
 assert.deepEqual(new Set(c.tracks.map(t=>t.id)),new Set(pages.flatMap(p=>p.songs.map(t=>'n'+t.id))));assert.equal(c.coverage.historicallyComplete,false);
 for(const [id,total] of [[3115574,13],[34935458,7],[74266126,11],[134652275,12],[181642166,12],[356287838,10]]){const a=c.albums.find(a=>a.id==='n'+id);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,total);assert.equal(a.core,true);}
 assert.equal(c.tracks.filter(t=>t.creditLines.length).length,107);
 for(const t of c.tracks){assert.ok(t.artistIds.includes(c.artist.id));assert.ok(c.albums.find(a=>a.id===t.albumId).trackIds.includes(t.id));for(const cr of t.credits){assert.equal(cr.source,t.source);assert.ok(t.creditLines.includes(cr.raw));}}
 for(const p of connections(c,{mode:'credits'}))for(const e of p.evidence)assert.ok(c.tracks.find(t=>t.id===e.trackId).credits.some(cr=>cr.personId===p.id&&cr.role===e.role));
 for(const a of c.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));await access(new URL('../dist/'+c.artist.portrait.slice(2),import.meta.url));
});
