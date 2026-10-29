import {readFile,writeFile} from 'node:fs/promises';
const data=JSON.parse(await readFile('research/zhangfangzhao/apple-tracks-us.json','utf8')).results;
for(const id of [6791944272,1772215616]){
 const a=data.find(a=>a.wrapperType==='collection'&&a.collectionId===id);
 const r=await fetch(a.artworkUrl100.replace('100x100bb','600x600bb'),{signal:AbortSignal.timeout(25000)});
 if(!r.ok)throw Error('Artwork '+id+' HTTP '+r.status);
 await writeFile(`dist/assets/apple-album-${id}.jpg`,Buffer.from(await r.arrayBuffer()));
}
// The resized URL returned HTTP 400 during the initial harvest; the original works.
const cover='https://p2.music.126.net/BTv1T9C278YxzY_eo8ow6g==/109951164456034798.jpg';
const r=await fetch(cover,{signal:AbortSignal.timeout(25000)});
if(!r.ok)throw Error('Original artwork HTTP '+r.status);
await writeFile('dist/assets/album-82784067.jpg',Buffer.from(await r.arrayBuffer()));
