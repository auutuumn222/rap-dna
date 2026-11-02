import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';

const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const c=await read('dist/catalog-danbao.json');

test('蛋堡 exact identity and exhaustive public pagination',async()=>{
 const pages=await Promise.all([0,100].map(n=>read(`research/danbao/netease-songs-${n}.json`)));
 const ids=new Set(pages.flatMap(p=>p.songs.map(t=>'n'+t.id)));
 assert.equal(ids.size,117);
 assert.equal(ids.size,pages[0].total);
 assert.equal(pages.at(-1).more,false);
 assert.deepEqual(new Set(c.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),ids);
 assert.equal(c.artist.id,'n2514');
 assert.equal(c.tracks.length,117);
 assert.equal(c.coverage.historicallyComplete,false);
 assert.equal(c.tracks.filter(t=>t.id.startsWith('a')).length,0);
});

test('蛋堡 song references, dates and relationship evidence are explicit',()=>{
 const people=new Set(c.people.map(p=>p.id)),albums=new Map(c.albums.map(a=>[a.id,a]));
 assert.equal(new Set(c.tracks.map(t=>t.id)).size,117);
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
 assert.equal(c.tracks.filter(t=>t.creditLines.length).length,76);
});

test('six main core projects, partial features and aliases retain their boundaries',()=>{
 assert.equal(c.albums.filter(a=>a.core).length,6);
 for(const [id,total] of [[7546,9],[7547,14],[7543,15],[7542,11],[7539,10],[2628001,24]]){
  const alb=c.albums.find(a=>a.id==='n'+id);
  assert.equal(alb.totalTracks,total);
  assert.equal(alb.trackIds.length,total);
  assert.equal(alb.core,true);
 }
 for(const query of ['蛋堡','Soft Lipa','SoftLipa','杜振熙','任性的人']){
  assert.equal(filterTracks(c,{query}).length,117);
 }
});

test('all 蛋堡 portraits and cover art exist locally',async()=>{
 for(const a of c.albums){
  await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 }
 await access(new URL('../dist/'+c.artist.portrait.slice(2),import.meta.url));
});
