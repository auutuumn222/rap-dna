import {mkdir,writeFile} from 'node:fs/promises';
const base='research/masiwei';await mkdir(base,{recursive:true});
async function snapshot(name,url){const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(`${name}: HTTP ${r.status}`);const d=await r.json();if(d.code&&d.code!==200)throw Error(`${name}: API ${d.code}`);await writeFile(`${base}/${name}.json`,JSON.stringify(d,null,2));return d;}
await snapshot('netease-artist','https://music.163.com/api/artist/1132392');
await snapshot('netease-albums','https://music.163.com/api/artist/albums/1132392?id=1132392&offset=0&limit=100');
let offset=0;
while(true){const d=await snapshot(`netease-songs-${offset}`,`https://music.163.com/api/v1/artist/songs?id=1132392&offset=${offset}&limit=100&order=time`);console.log(JSON.stringify({offset,count:d.songs.length,total:d.total,more:d.more}));if(!d.more)break;if(!d.songs.length)throw Error('Empty page with more=true; stop without claiming completeness');offset+=100;}
await snapshot('apple-albums-cn','https://itunes.apple.com/lookup?id=1095181798&entity=album&country=cn&limit=200');
await snapshot('apple-albums-us','https://itunes.apple.com/lookup?id=1095181798&entity=album&country=us&limit=200');
await snapshot('group-albums','https://music.163.com/api/artist/albums/12002201?id=12002201&offset=0&limit=100');
