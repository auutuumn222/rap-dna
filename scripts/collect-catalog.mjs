import {mkdir,writeFile,readFile} from 'node:fs/promises';
await mkdir('research',{recursive:true});
const jobs=[
 ['apple-tracks',`https://itunes.apple.com/lookup?id=${JSON.parse(await readFile('research/apple-albums-cn.json','utf8')).results.filter(x=>x.collectionId).map(x=>x.collectionId).join(',')}&entity=song&country=cn&limit=200`],
 ['apple-search',`https://itunes.apple.com/search?term=${encodeURIComponent('艾志恒')}&country=cn&entity=song&limit=200`],
 ['netease-search',`https://music.163.com/api/search/get?s=${encodeURIComponent('艾志恒Asen')}&type=100&limit=10`],
 ['apple-artist-page','https://music.apple.com/cn/artist/%E8%89%BE%E5%BF%97%E6%81%92asen/1636240804']
];
for(const [name,url] of jobs){
 try{const res=await fetch(url,{signal:AbortSignal.timeout(30000)});const text=await res.text();await writeFile(`research/${name}.${name.endsWith('page')?'html':'json'}`,text);console.log(name,res.status,text.length,text.slice(0,150).replace(/\s+/g,' '));}catch(e){console.log(name,e.message);}
}
