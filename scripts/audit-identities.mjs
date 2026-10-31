import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {resolvePersonId,identities} from '../dist/identity.js';
// Review candidates only. Fuzzy matching is never used by the website resolver.
const out=process.argv[2]||'research/identity-candidates.json',directory=process.argv[3]||'dist';
const text=await readFile(path.join(directory,'artists.js'),'utf8');
const {artistProfiles}=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
const groups=new Map(),people=new Map(),roles=['制作人','编曲','混音','母带'];
const key=s=>s.replace(/&#(\d+);/g,(_,n)=>Number(n)<=0x10ffff?String.fromCodePoint(Number(n)):'').replace(/&amp;/g,'&').normalize('NFKC').toLocaleLowerCase().replace(/[\p{P}\p{Z}\p{C}]/gu,'');
for(const p of Object.values(artistProfiles)){
 const catalog=JSON.parse(await readFile(path.join(directory,p.file),'utf8')),pm=new Map(catalog.people.map(x=>[x.id,x]));
 for(const t of catalog.tracks)for(const c of t.credits){
  if(!roles.includes(c.role)||c.level!=='track'||!c.raw||!c.source||!pm.has(c.personId))continue;
  const id=resolvePersonId(c.personId),person=identities.person(id,pm.get(id)||pm.get(c.personId));
  if(!people.has(id))people.set(id,{id,name:person.name,source:person.source||'',examples:[]});
  const item=people.get(id);if(item.examples.length<2&&!item.examples.some(e=>e.trackId===t.id))item.examples.push({trackId:t.id,role:c.role,raw:c.raw,source:c.source});
 }
}
for(const p of people.values()){const k=key(p.name);if(!k)continue;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}
const exact=[...groups].filter(([,list])=>list.length>1).map(([searchKey,list])=>({searchKey,status:'pending',reason:list.filter(p=>/^n\d+$/.test(p.id)).length>1?'多个不同平台账号，不按同名合并':'姓名相同或排版相近，仍需更多身份依据',people:list}));
function distance(a,b){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}return row[b.length];}
const names=[...people.values()].map(p=>({...p,key:key(p.name)})),similar=[];
for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){
 const a=names[i],b=names[j];if(a.key===b.key||Math.min(a.key.length,b.key.length)<6||Math.abs(a.key.length-b.key.length)>2||a.key.slice(0,2)!==b.key.slice(0,2))continue;
 const difference=distance(a.key,b.key);if(difference>(Math.min(a.key.length,b.key.length)>=10?2:1))continue;
 similar.push({status:'pending',reason:'仅名称相似，不能作为自动合并依据',difference,people:[a,b].map(({key,...p})=>p)});
}
await writeFile(out,JSON.stringify({note:'待人工核对；不自动改变网站身份。已审定的映射见 identity-registry.js；本轮处理结论见 identity-review.json。',artistsScanned:Object.keys(artistProfiles).length,backstageIdentities:people.size,exact,similar},null,2));
console.log(JSON.stringify({artistsScanned:Object.keys(artistProfiles).length,exact:exact.length,similar:similar.length,output:out}));
