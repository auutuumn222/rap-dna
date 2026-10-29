import {readFile,writeFile} from 'node:fs/promises';
const data=JSON.parse(await readFile('research/keyng/apple-tracks-us.json','utf8')).results;
const a=data.find(a=>a.wrapperType==='collection'&&a.collectionId===1788508499);
const r=await fetch(a.artworkUrl100.replace('100x100bb','600x600bb'),{signal:AbortSignal.timeout(25000)});
if(!r.ok)throw Error('Artwork HTTP '+r.status);
await writeFile('dist/assets/apple-album-1788508499.jpg',Buffer.from(await r.arrayBuffer()));
