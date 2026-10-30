import {readFile,writeFile} from 'node:fs/promises';
const a=JSON.parse(await readFile('research/topbarry/netease-albums.json','utf8')).hotAlbums.find(a=>a.id===165315163);
const r=await fetch(a.picUrl+'?param=600y600',{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Artwork '+r.status);await writeFile('dist/assets/album-165315163.jpg',Buffer.from(await r.arrayBuffer()));
