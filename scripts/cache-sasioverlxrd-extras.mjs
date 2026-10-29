import {readFile,writeFile,access} from 'node:fs/promises';
const data=JSON.parse(await readFile('research/sasioverlxrd/apple-tracks-us.json','utf8'));
for(const id of [1678434929,1832632011,6790351680]){
 const file=`dist/assets/apple-album-${id}.jpg`;try{await access(file);continue;}catch{}
 const a=data.results.find(x=>x.wrapperType==='collection'&&x.collectionId===id);if(!a)throw Error('Missing collection '+id);
 const r=await fetch(a.artworkUrl100.replace('100x100bb','600x600bb'),{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Artwork HTTP '+r.status);
 await writeFile(file,Buffer.from(await r.arrayBuffer()));
}
