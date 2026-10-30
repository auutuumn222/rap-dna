// 入库管线的最后一级：署名身份归并。
//
// 输入是 buildCreatorIndex() 产出的原始索引，输出仍是同一套 schema，只做三件事：
//   1. 丢弃占位符身份（平台用 `“”`、`ㅤ`、`!` 之类填空，不是人）；
//   2. 把「同一串姓名的不同排版写法」归并成一个创作者；
//   3. 折叠同一首歌内只差分隔符的重复署名。
//
// 边界（有意为之，与站点「未核验别名不自动合并」的立场一致）：
//   - 只归并 kind==='credit' 的记录。这类 id 是 `'c'+base64url(name)`，身份完全由姓名字符串
//     派生，排版差异是归一化缺陷，不是两个人。
//   - kind==='person'/'collective'（带平台 artist id 的 `n*` 记录）永不按姓名归并：两个不同的
//     平台 id 就是两个实体，即便同名。
//   - `credit` 与 `person` 之间永不归并：那是别名断言，需要人工核验，不在本阶段职责内。

import {normalizeCreditName,normalizeCreditRaw,isPlaceholderName} from './normalize-credit-name.mjs';

const CREDIT_KIND='credit';

export const MERGE_SCOPE_NOTE='同一署名姓名的排版差异（全半角、空白、弯直引号、末尾括注与标点、大小写）会归并为同一创作者，原写法保留在 mergedFrom；平台账号身份仍不自动合并，未核验的别名与同名不同人不会被合并。';

function creditCounts(tracks){
 const counts=new Map();
 for(const t of tracks)for(const c of t.credits)counts.set(c.personId,(counts.get(c.personId)||0)+1);
 return counts;
}

// 展示名优先取出现次数最多的写法；同票时取排版更干净的，再按 id 稳定排序。
function fullWidthPenalty(name){
 return /[\uff01-\uff5e\u201c\u201d\u2018\u2019]/.test(name)?1:0;
}

function pickCanonical(members,counts){
 return [...members].sort((a,b)=>
  (counts.get(b.id)||0)-(counts.get(a.id)||0)
  ||fullWidthPenalty(a.name)-fullWidthPenalty(b.name)
  ||a.id.localeCompare(b.id)
 )[0];
}

/**
 * @param {{creators:Array,tracks:Array,scope?:string}} index 原始索引
 * @param {Record<string,{image?:string}>} [portraits] people-portraits.json 的 people 映射
 */
export function mergeCreatorIdentities(index,portraits={}){
 const counts=creditCounts(index.tracks);
 const dropped=new Set();
 const groups=new Map();

 for(const creator of index.creators){
  const key=normalizeCreditName(creator.name);
  if(creator.kind===CREDIT_KIND&&isPlaceholderName(key)){dropped.add(creator.id);continue;}
  if(creator.kind!==CREDIT_KIND)continue;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(creator);
 }

 const absorbed=new Map();   // 被归并的 id → 规范 id
 const mergedFrom=new Map(); // 规范 id → 被归并成员
 for(const members of groups.values()){
  if(members.length<2)continue;
  const canonical=pickCanonical(members,counts);
  const others=members.filter(m=>m.id!==canonical.id);
  for(const other of others)absorbed.set(other.id,canonical.id);
  mergedFrom.set(canonical.id,others.map(m=>({id:m.id,name:m.name})));
 }

 const creators=[];
 for(const creator of index.creators){
  if(dropped.has(creator.id)||absorbed.has(creator.id))continue;
  const from=mergedFrom.get(creator.id);
  if(!from){creators.push(creator);continue;}
  const portrait=creator.portrait||[creator.id,...from.map(m=>m.id)].map(id=>portraits[id]?.image).find(Boolean);
  creators.push({...creator,...(portrait?{portrait}:{}),mergedFrom:from});
 }

 const tracks=[];
 for(const track of index.tracks){
  const seen=new Set(),credits=[];
  for(const credit of track.credits){
   const personId=absorbed.get(credit.personId)||credit.personId;
   if(dropped.has(personId))continue;
   const key=personId+'\u0000'+credit.role+'\u0000'+normalizeCreditRaw(credit.raw);
   if(seen.has(key))continue;
   seen.add(key);
   credits.push(personId===credit.personId?credit:{...credit,personId});
  }
  if(!credits.length)continue;
  tracks.push(credits.length===track.credits.length?track:{...track,credits});
 }

 return {
  ...index,
  version:index.version??1,
  scope:index.scope?index.scope.replace(/未核验别名不自动合并。?$/,MERGE_SCOPE_NOTE):MERGE_SCOPE_NOTE,
  creators,
  tracks,
 };
}

export function mergeSummary(before,after){
 const creditBefore=before.tracks.reduce((n,t)=>n+t.credits.length,0);
 const creditAfter=after.tracks.reduce((n,t)=>n+t.credits.length,0);
 return {
  creators:before.creators.length,
  creatorsAfter:after.creators.length,
  mergedCreators:after.creators.filter(c=>c.mergedFrom).length,
  absorbedRecords:after.creators.reduce((n,c)=>n+(c.mergedFrom?.length||0),0),
  droppedPlaceholders:before.creators.filter(c=>c.kind===CREDIT_KIND&&isPlaceholderName(normalizeCreditName(c.name))).length,
  credits:creditBefore,
  creditsAfter:creditAfter,
  duplicateCreditsRemoved:creditBefore-creditAfter,
  tracks:before.tracks.length,
  tracksAfter:after.tracks.length,
 };
}
