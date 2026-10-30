import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections} from '../dist/model.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const c=await read('dist/catalog-wangyitai.json');
test('Wang Yitai complete pagination and evidence-based partial albums',async()=>{
 const pages=await Promise.all([0,100,200].map(n=>read(`research/wangyitai/netease-songs-${n}.json`)));assert.equal(pages[0].total,220);assert.equal(pages.at(-1).more,false);assert.equal(c.artist.id,'n12236125');assert.equal(c.tracks.length,220);
 assert.deepEqual(new Set(c.tracks.map(t=>t.id)),new Set(pages.flatMap(p=>p.songs.map(t=>'n'+t.id))));assert.equal(c.coverage.historicallyComplete,false);assert.equal(c.albums.filter(a=>a.core).length,7);
 for(const [id,total,count] of [[240032220,14,13],[386145067,5,4],[132874562,11,11]]){const a=c.albums.find(a=>a.id==='n'+id);assert.equal(a.totalTracks,total);assert.equal(a.trackIds.length,count);}
 for(const id of ['n2662064367','n2662028623'])assert.equal(c.tracks.find(t=>t.id===id).date,'');assert.equal(c.tracks.filter(t=>t.creditLines.length).length,191);
 for(const t of c.tracks){assert.ok(t.artistIds.includes(c.artist.id));assert.ok(c.albums.find(a=>a.id===t.albumId).trackIds.includes(t.id));for(const cr of t.credits){assert.equal(cr.source,t.source);assert.ok(t.creditLines.includes(cr.raw));}}
 for(const p of connections(c,{mode:'credits'}))for(const e of p.evidence)assert.ok(c.tracks.find(t=>t.id===e.trackId).credits.some(cr=>cr.personId===p.id&&cr.role===e.role));
 for(const a of c.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));await access(new URL('../dist/'+c.artist.portrait.slice(2),import.meta.url));
});
