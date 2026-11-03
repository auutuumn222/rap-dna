import {writeFile,mkdir} from 'node:fs/promises';

const base='research/kenrobb',neteaseId=12529780,appleId=1535610125;
await mkdir(base,{recursive:true});

const headers={
 'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function get(url){
 const r=await fetch(url,{headers});
 if(!r.ok)throw Error(`HTTP ${r.status}: ${url}`);
 return r.json();
}

console.log('Fetching NetEase songs...');
let offset=0;
while(true){
 const data=await get(`https://music.163.com/api/v1/artist/songs?id=${neteaseId}&offset=${offset}&limit=100`);
 await writeFile(`${base}/netease-songs-${offset}.json`,JSON.stringify(data,null,2));
 console.log(`Saved netease-songs-${offset}.json (${data.songs.length} songs, total: ${data.total}, more: ${data.more})`);
 if(!data.more)break;
 offset+=100;
}

console.log('Fetching NetEase albums...');
const albums=await get(`https://music.163.com/api/artist/albums/${neteaseId}?offset=0&limit=100`);
await writeFile(`${base}/netease-albums.json`,JSON.stringify(albums,null,2));
console.log(`Saved netease-albums.json (${albums.hotAlbums.length} albums)`);

console.log('Fetching Apple Music CN albums...');
const appleCn=await get(`https://itunes.apple.com/lookup?id=${appleId}&entity=album&country=cn&limit=200`);
await writeFile(`${base}/apple-albums-cn.json`,JSON.stringify(appleCn,null,2));

console.log('Fetching Apple Music US albums...');
const appleUs=await get(`https://itunes.apple.com/lookup?id=${appleId}&entity=album&country=us&limit=200`);
await writeFile(`${base}/apple-albums-us.json`,JSON.stringify(appleUs,null,2));

console.log('Collect complete.');
