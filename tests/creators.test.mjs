import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {buildCreatorIndex,buildFromDirectory} from '../scripts/build-creators.mjs';
import {creatorWorks,creatorStats,sharedCreators,discoveryStories} from '../dist/creator-model.js';

const credit=(personId,role='编曲')=>({personId,role,level:'track',raw:role+' : Alice',source:'https://music.163.com/song?id=1'});
function fixture(key,rows){return {key,catalog:{artist:{id:key,short:key},checkedAt:'2026-10-30',people:[{id:'p',name:'Alice'},{id:'q',name:'Alice'}],albums:[{id:'album',title:'Album',artwork:'./assets/album.jpg'}],tracks:rows.map(t=>({id:'1',title:'Song',date:'2025-01-01',kind:'recording',albumId:'album',artistIds:[key],credits:[credit('p')],source:'https://music.163.com/song?id=1',...t}))}};}
test('cross-catalog records deduplicate by platform ID and do not infer unbilled artist membership',()=>{
 const index=buildCreatorIndex([fixture('a',[{artistIds:['a','b']}]),fixture('b',[{artistIds:['a','b']}]),fixture('c',[{artistIds:['a','b']}])]);
 assert.equal(index.tracks.length,1);assert.deepEqual(index.tracks[0].artistKeys,['a','b']);assert.deepEqual(index.tracks[0].catalogKeys,['a','b']);assert.equal(index.tracks[0].credits.length,1);
});
test('only explicit track role evidence creates a creator, and identical names do not merge identities',()=>{
 const index=buildCreatorIndex([fixture('a',[{id:'1',credits:[credit('p'),credit('q'),{...credit('x'),level:'album'},credit('p','作词'),{...credit('q'),raw:''}]}])]);
 assert.deepEqual(index.creators.map(p=>p.id),['p','q']);assert.equal(index.tracks[0].credits.length,2);
});
test('same-song-only overlap is distinct from a bridge between different songs',()=>{
 const same=buildCreatorIndex([fixture('a',[{artistIds:['a','b']}]),fixture('b',[{artistIds:['a','b']}])]);
 assert.equal(sharedCreators(same,'a','b')[0].independent,false);
 const bridge=buildCreatorIndex([fixture('a',[{id:'1'}]),fixture('b',[{id:'2'}])]);
 const result=sharedCreators(bridge,'a','b')[0];assert.equal(result.independent,true);assert.notEqual(result.pair[0].id,result.pair[1].id);assert.equal(sharedCreators(bridge,'a','a').length,0);
});
test('role filtering requires the role on both sides and preserves different version IDs',()=>{
 const index=buildCreatorIndex([fixture('a',[{id:'1'},{id:'3'}]),fixture('b',[{id:'2',credits:[credit('p','混音')]}])]);
 assert.equal(creatorWorks(index,'p').length,3);assert.equal(sharedCreators(index,'a','b','编曲').length,0);assert.equal(sharedCreators(index,'a','b').length,1);
 assert.equal(creatorWorks(index,'p',{artist:'a',role:'编曲',query:'song',year:'2025'}).length,2);
 assert.equal(creatorWorks(index,'p',{year:'2024'}).length,0);
});
const actual=JSON.parse(await readFile(new URL('../dist/creator-index.json',import.meta.url),'utf8'));
test('published creator index is reproducible from current archives',async()=>{
 assert.deepEqual(actual,await buildFromDirectory(fileURLToPath(new URL('../dist/',import.meta.url))));
});
test('discovery samples verified stories and avoids creators shown on the previous visit',()=>{
 const stats=new Map(actual.creators.filter(p=>p.identity==='platform').map(p=>[p.id,creatorStats(actual,p.id)]));
 const first=discoveryStories(actual,{stats,random:()=>0});
 const previous=first.map(s=>s.person.id);
 const next=discoveryStories(actual,{stats,previous,random:()=>0});
 const shuffled=discoveryStories(actual,{stats,random:()=>0.99});
 assert.notDeepEqual(shuffled.map(s=>s.person.id),previous);
 assert.ok(next.every(s=>!previous.includes(s.person.id)));
 for(const stories of [first,next,shuffled]){
  assert.equal(stories.length,3);
  assert.equal(new Set(stories.map(s=>s.person.id)).size,3);
  for(const s of stories){
   assert.equal(s.person.identity,'platform');
   assert.notEqual(s.pair[0].id,s.pair[1].id);
   for(const [i,t] of s.pair.entries()){
    assert.ok(t.artistKeys.includes(s.artistKeys[i]));
    assert.ok(!t.artistKeys.includes(s.artistKeys[1-i]));
    assert.ok(t.credits.some(c=>c.personId===s.person.id&&c.raw&&c.source));
   }
  }
 }
});
test('a small discovery pool can reuse recent creators and still show the curated ATM example',()=>{
 const creator=actual.creators.find(p=>p.id==='n13911452');
 const [story]=discoveryStories({...actual,creators:[creator]},{previous:[creator.id]});
 assert.equal(story.person.id,creator.id);
 assert.deepEqual(story.pair.map(t=>t.title),['英雄','Pop Music']);
});
