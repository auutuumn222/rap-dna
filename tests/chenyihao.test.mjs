import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';

const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const c=await read('dist/catalog-chenyihao.json');

test('陈一豪Clear exact identity and exhaustive public pagination',async()=>{
 const pages=await Promise.all([0,100].map(n=>read(`research/chenyihao/netease-songs-${n}.json`)));
 const ids=new Set(pages.flatMap(p=>p.songs).map(t=>'n'+t.id));
 assert.equal(ids.size,131);
 assert.equal(ids.size,pages[0].total);
 assert.equal(pages.at(-1).more,false);
 assert.deepEqual(new Set(c.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),ids);
 assert.equal(c.artist.id,'n32893629');
 assert.equal(c.tracks.length,131);
 assert.equal(c.coverage.historicallyComplete,false);
 assert.equal(c.tracks.filter(t=>t.id.startsWith('a')).length,0);
});

test('陈一豪Clear song references, dates and relationship evidence are explicit',()=>{
 const people=new Set(c.people.map(p=>p.id)),albums=new Map(c.albums.map(a=>[a.id,a]));
 assert.equal(new Set(c.tracks.map(t=>t.id)).size,131);
 for(const t of c.tracks){
  assert.ok(t.artistIds.includes(c.artist.id));
  assert.ok(albums.get(t.albumId).trackIds.includes(t.id));
  assert.ok(!t.date||(t.date>=c.coverage.from&&t.date<=c.checkedAt));
  for(const id of t.artistIds)assert.ok(people.has(id));
  for(const x of t.credits){
   assert.ok(people.has(x.personId));
   assert.equal(x.level,'track');
   assert.equal(x.source,t.source);
   assert.ok(t.creditLines.includes(x.raw));
  }
 }
 for(const mode of ['artists','credits']){
  for(const p of connections(c,{mode})){
   for(const e of p.evidence){
    const t=c.tracks.find(t=>t.id===e.trackId);
    assert.ok(mode==='artists'?t.artistIds.includes(p.id):t.credits.some(x=>x.personId===p.id&&x.role===e.role));
   }
  }
 }
 assert.equal(c.tracks.filter(t=>t.creditLines.length).length,109);
});

test('seven main core projects, partial features and aliases retain their boundaries',()=>{
 assert.equal(c.albums.filter(a=>a.core).length,7);
 const coreSpecs=[
  [96547607,32,32],
  [145594993,12,12],
  [178081825,5,5],
  [183333481,6,6],
  [250418440,10,10],
  [276554774,12,12],
  [385731179,12,12]
 ];
 for(const [id,total,tracksCount] of coreSpecs){
  const alb=c.albums.find(a=>a.id==='n'+id);
  assert.ok(alb,`Album n${id} exists`);
  assert.equal(alb.totalTracks,total);
  assert.equal(alb.trackIds.length,tracksCount);
  assert.equal(alb.core,true);
 }
 for(const query of ['陈一豪Clear','陈一豪','让长沙再次骄傲','Clear']){
  assert.equal(filterTracks(c,{query}).length,131);
 }
});

test('all 陈一豪Clear portraits and cover art exist locally',async()=>{
 for(const a of c.albums){
  await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 }
 await access(new URL('../dist/'+c.artist.portrait.slice(2),import.meta.url));
});
