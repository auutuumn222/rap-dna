import {readFile,writeFile} from 'node:fs/promises';
const d=JSON.parse(await readFile('research/cashtrippy/apple-tracks-us.json','utf8')),a=d.results.find(a=>a.collectionId===1550157215);const r=await fetch(a.artworkUrl100.replace('100x100bb','600x600bb'));if(!r.ok)throw Error(r.status);await writeFile('dist/assets/apple-album-1550157215.jpg',Buffer.from(await r.arrayBuffer()));
