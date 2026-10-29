import {readFile,writeFile,access} from 'node:fs/promises';
const a=JSON.parse(await readFile('research/capper/apple-tracks-us.json','utf8')).results.find(a=>a.wrapperType==='collection'&&a.collectionId===1797157422);
const file='dist/assets/apple-album-1797157422.jpg';
try{await access(file);}catch{const r=await fetch(a.artworkUrl100.replace('100x100bb','600x600bb'),{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('HTTP '+r.status);await writeFile(file,Buffer.from(await r.arrayBuffer()));}
