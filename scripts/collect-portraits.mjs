import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
const checkedAt='2026-10-29',files=['catalog.json','catalog-masiwei.json'];
const catalogs=await Promise.all(files.map(async file=>JSON.parse(await readFile('dist/'+file,'utf8'))));
const candidates=new Map(),people={},results=[],failures=[];
let previous={};try{previous=JSON.parse(await readFile('dist/people-portraits.json','utf8')).people||{};}catch{}
for(const catalog of catalogs){
 for(const p of catalog.people)if(/^n[1-9]\d*$/.test(p.id))candidates.set(p.id,p);
 const a=catalog.artist;people[a.id]={name:a.name,image:a.portrait,source:a.links[0].url,imageSource:a.portraitSource,checkedAt:catalog.checkedAt,kind:'person',reused:true};
}
await mkdir('dist/assets/people',{recursive:true});
const ids=[...candidates.keys()].filter(id=>!people[id]);let cursor=0;
await Promise.all(Array.from({length:3},async()=>{while(cursor<ids.length){const id=ids[cursor++],expected=candidates.get(id);try{
 const r=await fetch(`https://music.163.com/api/artist/${id.slice(1)}`,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`HTTP ${r.status}`);const data=await r.json();if(data.code!==200)throw Error(`API ${data.code}`);const a=data.artist;if(String(a?.id)!==id.slice(1))throw Error('Artist ID mismatch');
 const imageSource=a.img1v1Url;if(!imageSource||/5639395138885805|18686200114669622|\/default/i.test(imageSource))throw Error('No verified non-default portrait');
 const image=`./assets/people/${id}.jpg`;try{if(previous[id]?.imageSource!==imageSource)throw Error('Portrait source changed');await access('dist/'+image.slice(2));}catch{const pic=await fetch(imageSource+'?param=400y400',{signal:AbortSignal.timeout(20000)});if(!pic.ok||!pic.headers.get('content-type')?.startsWith('image/'))throw Error(`Portrait HTTP ${pic.status}`);await writeFile('dist/'+image.slice(2),Buffer.from(await pic.arrayBuffer()));}
 people[id]={name:a.name,catalogName:expected.name,aliases:a.alias||[],image,source:`https://music.163.com/artist?id=${a.id}`,imageSource,checkedAt,kind:expected.kind};results.push({id,name:a.name,status:'verified'});
 }catch(error){failures.push({id,name:expected.name,error:error.message});}if((results.length+failures.length)%25===0)console.log(JSON.stringify({inspected:results.length+failures.length,total:ids.length,portraits:Object.keys(people).length}));}}));
await writeFile('dist/people-portraits.json',JSON.stringify({schemaVersion:1,checkedAt,people},null,2)+'\n');
await writeFile('research/people-portraits.json',JSON.stringify({checkedAt,catalogs:files,matching:'Exact NetEase artist IDs only; no name searches or inferred credit-person matches',reused:2,requested:ids.length,verified:results.length,results,failures},null,2)+'\n');
console.log(JSON.stringify({portraits:Object.keys(people).length,missing:failures.length,failures}));
