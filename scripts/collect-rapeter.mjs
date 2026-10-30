import {mkdir,writeFile} from 'node:fs/promises';
const base='research/rapeter';await mkdir(base,{recursive:true});
async function snapshot(name,url){const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(`${name}: HTTP ${r.status}`);const d=await r.json();if(d.code&&d.code!==200)throw Error(`${name}: API ${d.code}`);await writeFile(`${base}/${name}.json`,JSON.stringify(d,null,2)+'\n');return d;}
await snapshot('netease-identity','https://music.163.com/api/search/get?s='+encodeURIComponent('Rapeter')+'&type=100&limit=20');
await snapshot('netease-artist','https://music.163.com/api/artist/12563131');
let albums=[],albumPages=[];
for(let offset=0;;offset+=100){const d=await snapshot(`netease-albums-${offset}`,`https://music.163.com/api/artist/albums/12563131?id=12563131&offset=${offset}&limit=100`);albumPages.push({offset,count:d.hotAlbums.length,more:d.more});albums.push(...d.hotAlbums);if(!d.more)break;if(!d.hotAlbums.length)throw Error('Empty album page with more=true');}
await writeFile(`${base}/netease-albums.json`,JSON.stringify({hotAlbums:albums,pages:albumPages},null,2));
for(let offset=0;;offset+=100){const d=await snapshot(`netease-songs-${offset}`,`https://music.163.com/api/v1/artist/songs?id=12563131&offset=${offset}&limit=100&order=time`);console.log(JSON.stringify({offset,count:d.songs.length,total:d.total,more:d.more}));if(!d.more)break;if(!d.songs.length)throw Error('Empty page with more=true');}
await snapshot('apple-search-cn','https://itunes.apple.com/search?term='+encodeURIComponent('Rapeter 吴嘉轩')+'&entity=musicArtist&country=cn&limit=10');
for(const country of ['cn','us'])await snapshot(`apple-albums-${country}`,'https://itunes.apple.com/lookup?id=1823588230&entity=album&country='+country+'&limit=200');
