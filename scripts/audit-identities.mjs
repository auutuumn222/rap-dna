import {readFile,writeFile} from 'node:fs/promises';
import {resolvePersonId} from '../dist/identity.js';
import {artistProfiles} from '../dist/artists.js';
// Candidate generation is deliberately separate from the reviewed runtime registry.
const groups=new Map();
for(const p of Object.values(artistProfiles)){
 const c=JSON.parse(await readFile(new URL('../dist/'+p.file.slice(2),import.meta.url),'utf8'));
 for(const person of c.people){
  if(resolvePersonId(person.id)!==person.id)continue;
  const key=person.name.normalize('NFKC').toLocaleLowerCase().replace(/[\s,，。.!！·_-]/g,'');if(!key)continue;
  if(!groups.has(key))groups.set(key,new Map());groups.get(key).set(person.id,{id:person.id,name:person.name,source:person.source||''});
 }
}
const candidates=[...groups.entries()].filter(([,people])=>people.size>1).map(([searchKey,people])=>({searchKey,status:'pending',people:[...people.values()]}));
const out=process.argv[2]||'research/identity-candidates.json';await writeFile(out,JSON.stringify({note:'仅为人工核对候选；不会自动进入身份映射。同名、相似名字、相同头像均不足以确认身份。',candidates},null,2));console.log(JSON.stringify({pending:candidates.length,output:out}));
