import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeCreditName,normalizeCreditRaw,isPlaceholderName} from '../scripts/normalize-credit-name.mjs';
import {mergeCreatorIdentities,mergeSummary} from '../scripts/merge-creators.mjs';

const credit=(personId,role='编曲',raw='编曲 : Alice')=>({personId,role,raw,source:'https://music.163.com/song?id=1',checkedAt:'2026-10-30'});
const creator=(id,name,kind='credit')=>({id,name,kind,source:kind==='credit'?'':'https://music.163.com/artist?id='+id.slice(1),identity:id.startsWith('n')?'platform':'credit-name'});
const index=(creators,tracks)=>({version:1,scope:'未核验别名不自动合并。',artists:[{key:'a',id:'n1',name:'A'}],creators,tracks});

test('排版等价的署名姓名归一化到同一个 key',()=>{
 const same=[
  ['Mai＂No Label Crew＂','Mai “No Label Crew”'],
  ['Mai " No Label Crew "','Mai＂No Label Crew＂'],
  ['ATM Hanson','ATMHanson'],
  ['ATM Hanson，','ATM Hanson'],
  ['MAI&#13;','Mai'],
  ['吴冠仑HusH!    （HusH!）','吴冠仑 HusH!'],
  ['影帝inDy（','影帝inDy'],
  ['大 波_Double','大波_DOUBLE'],
  ['TQ','tq'],
 ];
 for(const [left,right] of same)assert.equal(normalizeCreditName(left),normalizeCreditName(right),`${left} 应等价于 ${right}`);
});

test('不同姓名不会被归一化误合并',()=>{
 const distinct=[['T. Q','TQ'],['王豆','王 小豆'],['Mai','Mai No Label Crew'],['李金城','李金城二']];
 for(const [left,right] of distinct)assert.notEqual(normalizeCreditName(left),normalizeCreditName(right),`${left} 不应等价于 ${right}`);
});

test('占位符姓名被识别，真实姓名不会',()=>{
 for(const name of ['“”','“ ”','ㅤ','!','','   '])assert.ok(isPlaceholderName(normalizeCreditName(name)),`${JSON.stringify(name)} 应判为占位符`);
 for(const name of ['AYO!','Mai','TQ','吴冠仑Hush!'])assert.ok(!isPlaceholderName(normalizeCreditName(name)),`${name} 不应判为占位符`);
});

test('署名原文只对齐分隔符与空白，保留合作者信息差异',()=>{
 assert.equal(normalizeCreditRaw('编曲 : 陈令韬'),normalizeCreditRaw('编曲：陈令韬'));
 assert.notEqual(normalizeCreditRaw('编曲 : 陈令韬'),normalizeCreditRaw('编曲：陈令韬/张三'));
});

test('末尾括注只在重复姓名时折叠，不用来区分成员的括注保持独立',()=>{
 assert.equal(normalizeCreditName('吴冠仑HusH!    （HusH!）'),normalizeCreditName('吴冠仑 HusH!'));
 const distinct=['BEAT SHARE','BEAT SHARE ( G.7 )','BEAT SHARE ( Provoke )','李金城','李金城（Kinghand. Lee）'];
 const keys=distinct.map(normalizeCreditName);
 assert.equal(new Set(keys).size,distinct.length,`这些姓名不应互相等价：${JSON.stringify(distinct)}`);
});

test('同一署名姓名的排版变体归并为一个创作者，并留下 mergedFrom 审计记录',()=>{
 const source=index(
  [creator('cMai1','Mai＂No Label Crew＂'),creator('cMai2','Mai “No Label Crew”'),creator('cMai3','Mai " No Label Crew "')],
  [{id:'n1',title:'S',date:'2025-01-01',album:'A',albumId:'a',artwork:'x',artistKeys:['a'],artistNames:['A'],catalogKeys:['a'],source:'https://music.163.com/song?id=1',checkedAt:'2026-10-30',
    credits:[credit('cMai1'),credit('cMai2'),credit('cMai3')]}]
 );
 const merged=mergeCreatorIdentities(source);
 assert.equal(merged.creators.length,1);
 // 三条署名数相同，展示名取排版最干净的半角写法
 assert.equal(merged.creators[0].id,'cMai3');
 assert.equal(merged.creators[0].name,'Mai " No Label Crew "');
 assert.deepEqual(merged.creators[0].mergedFrom.map(m=>m.id).sort(),['cMai1','cMai2']);
 assert.deepEqual(merged.tracks[0].credits.map(c=>c.personId),['cMai3']);
});

test('署名次数不同时，展示名取出现最多的写法',()=>{
 const source=index(
  [creator('cMai1','Mai＂No Label Crew＂'),creator('cMai3','Mai " No Label Crew "')],
  [{id:'n1',title:'S1',date:'2025-01-01',album:'A',albumId:'a',artwork:'x',artistKeys:['a'],artistNames:['A'],catalogKeys:['a'],source:'https://music.163.com/song?id=1',checkedAt:'2026-10-30',credits:[credit('cMai1')]},
   {id:'n2',title:'S2',date:'2025-01-01',album:'A',albumId:'a',artwork:'x',artistKeys:['a'],artistNames:['A'],catalogKeys:['a'],source:'https://music.163.com/song?id=2',checkedAt:'2026-10-30',credits:[credit('cMai1')]},
   {id:'n3',title:'S3',date:'2025-01-01',album:'A',albumId:'a',artwork:'x',artistKeys:['a'],artistNames:['A'],catalogKeys:['a'],source:'https://music.163.com/song?id=3',checkedAt:'2026-10-30',credits:[credit('cMai3')]}]
 );
 const merged=mergeCreatorIdentities(source);
 assert.equal(merged.creators.length,1);
 assert.equal(merged.creators[0].id,'cMai1');
 assert.equal(merged.creators[0].name,'Mai＂No Label Crew＂');
 assert.deepEqual(merged.creators[0].mergedFrom.map(m=>m.id),['cMai3']);
});

test('平台账号即便同名也不按姓名归并，credit 与 platform 之间同样不归并',()=>{
 const source=index(
  [creator('n100','ATM Hanson','person'),creator('n200','ATM Hanson','person'),creator('cATM','ATMHanson')],
  [{id:'n1',title:'S',date:'2025-01-01',album:'A',albumId:'a',artwork:'x',artistKeys:['a'],artistNames:['A'],catalogKeys:['a'],source:'https://music.163.com/song?id=1',checkedAt:'2026-10-30',
    credits:[credit('n100'),credit('n200'),credit('cATM')]}]
 );
 const merged=mergeCreatorIdentities(source);
 assert.deepEqual(merged.creators.map(c=>c.id),['n100','n200','cATM']);
 assert.equal(merged.creators.filter(c=>c.mergedFrom).length,0);
 assert.deepEqual(merged.tracks[0].credits.map(c=>c.personId),['n100','n200','cATM']);
});

test('占位符创作者被丢弃，其署名一并移除；只剩占位符署名的曲目不再进入索引',()=>{
 const source=index(
  [creator('cQuote','“”'),creator('cReal','陈令韬')],
  [
   {id:'n1',title:'S1',date:'2025-01-01',album:'A',albumId:'a',artwork:'x',artistKeys:['a'],artistNames:['A'],catalogKeys:['a'],source:'https://music.163.com/song?id=1',checkedAt:'2026-10-30',credits:[credit('cQuote'),credit('cReal')]},
   {id:'n2',title:'S2',date:'2025-01-01',album:'A',albumId:'a',artwork:'x',artistKeys:['a'],artistNames:['A'],catalogKeys:['a'],source:'https://music.163.com/song?id=2',checkedAt:'2026-10-30',credits:[credit('cQuote')]},
  ]
 );
 const merged=mergeCreatorIdentities(source);
 assert.deepEqual(merged.creators.map(c=>c.id),['cReal']);
 assert.deepEqual(merged.tracks.map(t=>t.id),['n1']);
 assert.deepEqual(merged.tracks[0].credits.map(c=>c.personId),['cReal']);
 assert.equal(mergeSummary(source,merged).droppedPlaceholders,1);
});

test('归并后继承被吸收成员的头像，避免人物图丢失',()=>{
 const source=index(
  [creator('cA','Mai " No Label Crew "'),creator('cB','Mai＂No Label Crew＂')],
  [{id:'n1',title:'S',date:'2025-01-01',album:'A',albumId:'a',artwork:'x',artistKeys:['a'],artistNames:['A'],catalogKeys:['a'],source:'https://music.163.com/song?id=1',checkedAt:'2026-10-30',credits:[credit('cA'),credit('cB')]}]
 );
 const merged=mergeCreatorIdentities(source,{cB:{image:'./assets/people/cB.jpg'}});
 assert.equal(merged.creators.length,1);
 assert.equal(merged.creators[0].portrait,'./assets/people/cB.jpg');
});

test('发布索引已通过归并：无占位符身份、无排版重复署名、platform 身份未被吸收',async()=>{
 const actual=JSON.parse(await readFile(new URL('../dist/creator-index.json',import.meta.url),'utf8'));
 assert.equal(actual.creators.filter(c=>c.kind==='credit'&&isPlaceholderName(normalizeCreditName(c.name))).length,0);
 for(const c of actual.creators){
  if(!c.mergedFrom)continue;
  assert.equal(c.kind,'credit',`${c.name} 不应吸收平台身份`);
  for(const member of c.mergedFrom)assert.ok(member.id.startsWith('c'),`${c.name} 吸收了非 credit 身份 ${member.id}`);
 }
 for(const track of actual.tracks){
  const seen=new Set();
  for(const c of track.credits){
   const key=c.personId+'\u0000'+c.role+'\u0000'+normalizeCreditRaw(c.raw);
   assert.ok(!seen.has(key),`${track.title} 存在排版重复署名 ${c.personId}/${c.role}`);
   seen.add(key);
  }
 }
 const used=new Set(actual.tracks.flatMap(t=>t.credits.map(c=>c.personId)));
 assert.equal(actual.creators.filter(c=>!used.has(c.id)).length,0,'不应出现没有任何署名记录的创作者');
});
