import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {identities,resolvePersonId,createIdentityResolver} from '../dist/identity.js';
import {identityRegistry} from '../dist/identity-registry.js';
import {creatorWorks,sharedCreators} from '../dist/creator-model.js';
import {buildCreatorIndex} from '../scripts/build-creators.mjs';
import {artistProfiles} from '../dist/artists.js';
import {createPortraits} from '../dist/portraits.js';
import {filterTracks} from '../dist/model.js';
test('song search accepts every reviewed alias, even when this song used the canonical spelling',()=>{
 const catalog=identities.catalog({artist:{id:'rapper'},people:[{id:'n13911452',name:'ATM Hanson'}],albums:[],tracks:[{id:'song',date:'2025',aliases:[],artistIds:[],credits:[{personId:'n13911452',role:'编曲',raw:'编曲 : ATM Hanson'}]}]});
 assert.equal(filterTracks(catalog,{query:'ATMHanson'}).length,1);assert.equal(filterTracks(catalog,{query:'ATM Hanson，'}).length,1);
});
test('reviewed aliases share the same avatar even when only an old alias has a registered image',()=>{
 const portraits=createPortraits({cYXRtaGFuc29u:{image:'./assets/people/atm.jpg'}});
 assert.equal(portraits.imageFor('n13911452'),'./assets/people/atm.jpg');assert.equal(portraits.imageFor('cYXRtIGhhbnNvbg'),'./assets/people/atm.jpg');assert.equal(portraits.imageFor('unknown'),null);
});
test('reviewed variants resolve exactly; similar names and unrelated accounts never do',()=>{
 for(const id of ['cYXRtIGhhbnNvbg','cYXRtaGFuc29u','cYXRtIGhhbnNvbiw'])assert.equal(resolvePersonId(id),'n13911452');
 for(const id of ['n987654','new-atmhanson','The Heatmakerz'])assert.equal(resolvePersonId(id),id);
 const resolver=createIdentityResolver({entities:[]});assert.equal(resolver.resolve('cYXRtaGFuc29u'),'cYXRtaGFuc29u');
 assert.throws(()=>createIdentityResolver({entities:[identityRegistry.entities[0],{...identityRegistry.entities[0],id:'n999'}]}),/conflicting/);
});
test('resolution keeps raw catalogs immutable, preserves original names and supports rollback',()=>{
 const input={people:[{id:'cYXRtaGFuc29u',name:'ATMHanson'}],tracks:[{id:'song',artistIds:['artist'],credits:[{personId:'cYXRtaGFuc29u',role:'编曲',raw:'编曲：ATMHanson'}]}]};
 const saved=structuredClone(input),result=identities.catalog(input);assert.deepEqual(input,saved);assert.equal(result.people[0].name,'ATM Hanson');assert.equal(result.tracks[0].credits[0].originalName,'ATMHanson');assert.equal(result.tracks[0].credits[0].raw,'编曲：ATMHanson');assert.deepEqual(identities.catalog(result),result);
 assert.equal(createIdentityResolver({entities:[]}).catalog(input).tracks[0].credits[0].personId,'cYXRtaGFuc29u');
});
const index=JSON.parse(await readFile(new URL('../dist/creator-index.json',import.meta.url),'utf8'));
test('merged creators count the union of track IDs and aliases work for old lookups',()=>{
 const ids=['n13911452','cYXRtIGhhbnNvbg','cYXRtaGFuc29u','cYXRtIGhhbnNvbiw'];
 assert.equal(index.creators.filter(p=>ids.includes(p.id)).length,1);
 const works=creatorWorks(index,'n13911452');assert.equal(works.length,new Set(works.map(t=>t.id)).size);assert.deepEqual(creatorWorks(index,'cYXRtaGFuc29u'),works);
 assert.ok(works.some(t=>t.credits.some(c=>c.originalName==='ATM Hanson，'&&c.raw.includes('，'))));
 assert.equal(sharedCreators(index,'asen','masiwei').filter(x=>ids.includes(x.person.id)).length,1);
});
test('build retains distinct original IDs as evidence while deduplicating song counts',()=>{
 const personIds=['n13911452','cYXRtIGhhbnNvbg'];
 const entries=personIds.map((personId,i)=>({key:'a'+i,catalog:{artist:{id:'artist',short:'Artist'},people:[{id:personId,name:'ATM Hanson'}],albums:[{id:'album',title:'Album'}],tracks:[{id:'song',albumId:'album',artistIds:['artist'],credits:[{personId,level:'track',role:'编曲',raw:'编曲 : ATM Hanson',source:'https://music.163.com/song?id=1'}]}]}}));
 const result=buildCreatorIndex(entries);assert.equal(result.tracks.length,1);assert.equal(result.creators.length,1);assert.equal(result.tracks[0].credits.length,2);
});
test('all registry mappings have dated, auditable source evidence',()=>{
 for(const p of identityRegistry.entities){assert.match(p.source,/^https:\/\/music.163.com\/artist\?id=\d+$/);assert.ok(p.reviewedAt);for(const a of p.aliases){assert.ok(a.method);assert.ok(a.evidence.length);for(const e of a.evidence){assert.ok(e.trackId&&e.role);assert.match(e.source,/^https:\/\/music.163.com\/song\?id=\d+$/);}}}
});
test('review evidence resolves to the original catalog credits, including both sides of cross-checks',async()=>{
 const catalogs=new Map(await Promise.all(Object.values(artistProfiles).map(async p=>[p.key,JSON.parse(await readFile(new URL('../dist/'+p.file.slice(2),import.meta.url),'utf8'))])));
 for(const entity of identityRegistry.entities)for(const alias of entity.aliases)for(const proof of alias.evidence){
  const matches=c=>c.tracks.find(t=>t.id===proof.trackId);
  if(proof.records){for(const [i,record] of proof.records.entries()){const t=matches(catalogs.get(record.catalog));assert.ok(t?.credits.some(c=>c.personId===(i===0?alias.id:entity.id)&&c.role===proof.role&&c.raw===record.raw),entity.name+' '+alias.name+' '+record.catalog);}}
  else{assert.ok([...catalogs.values()].some(c=>matches(c)?.credits.some(x=>x.personId===alias.id&&x.raw===proof.raw)),alias.name);}
 }
});
