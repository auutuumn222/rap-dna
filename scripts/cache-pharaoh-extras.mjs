import {readFile,writeFile} from 'node:fs/promises';
const data=JSON.parse(await readFile('research/pharaoh/apple-tracks-us.json','utf8')).results;
const a=data.find(a=>a.wrapperType==='collection'&&a.collectionId===1567735053);
if(!a)throw Error('Missing In 10 Years, Pt. 1');
const r=await fetch(a.artworkUrl100.replace('100x100bb','600x600bb'),{signal:AbortSignal.timeout(25000)});
if(!r.ok)throw Error('Artwork HTTP '+r.status);
await writeFile('dist/assets/apple-album-1567735053.jpg',Buffer.from(await r.arrayBuffer()));
