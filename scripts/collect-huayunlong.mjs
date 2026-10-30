import {mkdir,writeFile} from 'node:fs/promises';
const base='research/huayunlong';await mkdir(base,{recursive:true});
async function snapshot(name,url){const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(`${name}: HTTP ${r.status}`);const d=await r.json();if(d.code&&d.code!==200)throw Error(`${name}: API ${d.code}`);await writeFile(`${base}/${name}.json`,JSON.stringify(d,null,2)+'\n');return d;}
const identity=await snapshot('netease-identity','https://music.163.com/api/search/get?s=华云龙KLE&type=100&limit=10');
if(!identity.result?.artists?.some(a=>a.id===33435403&&a.name==='华云龙KLE'))throw Error('Artist identity mismatch');
await snapshot('netease-artist','https://music.163.com/api/artist/33435403');
let albums=[],albumPages=[];
for(let offset=0;;offset+=100){const d=await snapshot(`netease-albums-${offset}`,`https://music.163.com/api/artist/albums/33435403?id=33435403&offset=${offset}&limit=100`);albumPages.push({offset,count:d.hotAlbums.length,more:d.more});albums.push(...d.hotAlbums);if(!d.more)break;if(!d.hotAlbums.length)throw Error('Empty album page with more=true');}
await writeFile(`${base}/netease-albums.json`,JSON.stringify({hotAlbums:[...new Map(albums.map(a=>[a.id,a])).values()],pages:albumPages},null,2));
for(let offset=0;;offset+=100){const d=await snapshot(`netease-songs-${offset}`,`https://music.163.com/api/v1/artist/songs?id=33435403&offset=${offset}&limit=100&order=time`);console.log(JSON.stringify({offset,count:d.songs.length,total:d.total,more:d.more}));if(!d.more)break;if(!d.songs.length)throw Error('Empty page with more=true');}
const apple=await snapshot('apple-search-cn','https://itunes.apple.com/search?term=华云龙KLE&entity=musicArtist&country=cn&limit=10');
const artist=apple.results.find(a=>a.artistId===1600550625);if(!artist)throw Error('No exact Apple artist identity');
for(const country of ['cn','us'])await snapshot(`apple-albums-${country}`,`https://itunes.apple.com/lookup?id=${artist.artistId}&entity=album&country=${country}&limit=200`);



for(const id of [1699561311,1835499303])for(const country of ['cn','us'])await snapshot(`apple-candidate-${id}-${country}`,`https://itunes.apple.com/lookup?id=${id}&entity=album&country=${country}&limit=200`);
