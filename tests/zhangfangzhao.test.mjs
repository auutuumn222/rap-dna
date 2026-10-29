import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {connections,filterTracks} from '../dist/model.js';
import {neteaseSongId} from '../dist/player.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('dist/catalog-zhangfangzhao.json');
test('Zhang Fangzhao identity and complete public pagination stay separate from namesakes',async()=>{
 const identity=await read('research/zhangfangzhao/netease-identity.json');
 assert.ok(identity.result.artists.some(a=>a.id===15194340&&a.name==='张方钊'&&a.alias.includes('河南说唱之神')));
 assert.equal(catalog.artist.id,'n15194340');
 const pages=await Promise.all([0,100,200].map(n=>read(`research/zhangfangzhao/netease-songs-${n}.json`)));
 const expected=new Set(pages.flatMap(p=>p.songs.map(s=>'n'+s.id)));
 assert.equal(pages.at(-1).more,false);assert.equal(expected.size,pages[0].total);assert.equal(expected.size,222);
 assert.deepEqual(new Set(catalog.tracks.filter(t=>neteaseSongId(t)).map(t=>t.id)),expected);
 assert.equal(catalog.tracks.length,235);assert.equal(catalog.coverage.historicallyComplete,false);
 assert.equal(catalog.coverage.from,'2016-07-02');
});
test('every Zhang Fangzhao credit, release and connection has song evidence',()=>{
 const people=new Set(catalog.people.map(p=>p.id)),albums=new Map(catalog.albums.map(a=>[a.id,a]));
 assert.equal(new Set(catalog.tracks.map(t=>t.id)).size,catalog.tracks.length);
 for(const t of catalog.tracks){
  assert.ok(t.artistIds.includes(catalog.artist.id),t.title);assert.ok(albums.get(t.albumId).trackIds.includes(t.id));
  assert.ok(!t.date||t.date>=catalog.coverage.from&&t.date<=catalog.checkedAt);
  for(const id of t.artistIds)assert.ok(people.has(id));
  for(const c of t.credits){assert.ok(people.has(c.personId));assert.equal(c.level,'track');assert.equal(c.source,t.source);assert.ok(t.creditLines.includes(c.raw));}
 }
 for(const mode of ['artists','credits'])for(const p of connections(catalog,{mode}))for(const e of p.evidence){
  const t=catalog.tracks.find(t=>t.id===e.trackId);assert.equal(e.source,t.source);
  assert.ok(mode==='artists'?t.artistIds.includes(p.id):t.credits.some(c=>c.personId===p.id&&c.role===e.role));
 }
 assert.equal(catalog.tracks.filter(t=>t.creditLines.length).length,209);
});
test('core projects are complete, collective participation stays partial and aliases are searchable',()=>{
 const core=catalog.albums.filter(a=>a.core);assert.equal(core.length,8);
 for(const a of core)assert.equal(a.trackIds.length,a.totalTracks,a.title);
 const group=catalog.albums.find(a=>a.id==='n172172163');assert.equal(group.core,false);assert.equal(group.chapter,'团体项目');assert.equal(group.totalTracks,9);assert.equal(group.trackIds.length,7);
 assert.equal(connections(catalog,{albumId:group.id}).find(p=>p.name==='卡力鲨鱼').trackIds.length>0,true);
 for(const query of ['张方钊','河南说唱之神','河南說唱之神'])assert.equal(filterTracks(catalog,{query}).length,235);
 assert.equal(filterTracks(catalog,{query:'Bucktown'}).length,1);
 const extra=catalog.tracks.filter(t=>t.id.startsWith('a'));assert.equal(extra.length,13);
 for(const t of extra){assert.equal(neteaseSongId(t),null);assert.equal(t.artistEvidence.length,t.artistIds.length);}
 assert.equal(catalog.albums.find(a=>a.id==='a6791944272').date,'2026-07-18');
 assert.ok(catalog.people.some(p=>p.name==='Luois 1520'));assert.ok(catalog.people.some(p=>p.name==='Louis 1520'));
});
test('all Zhang Fangzhao assets exist locally',async()=>{
 for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
 await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
});
