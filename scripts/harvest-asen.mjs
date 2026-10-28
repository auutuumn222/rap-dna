import {readFile,writeFile,mkdir} from 'node:fs/promises';
const read=async name=>JSON.parse(await readFile(`research/${name}.json`,'utf8'));
const songs=[...(await read('netease-songs')).songs,...(await read('netease-songs-page2')).songs];
const albums=[...new Set([...songs.map(s=>s.album.id),...(await read('netease-albums')).hotAlbums.map(a=>a.id)])];
const failures=[];
async function fetchJSON(url){const res=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!res.ok)throw Error(`HTTP ${res.status}`);const d=await res.json();if(d.code&&d.code!==200)throw Error(`API ${d.code}`);return d;}
async function pool(items,fn){let cursor=0;await Promise.all(Array.from({length:3},async()=>{while(cursor<items.length){const item=items[cursor++];try{await fn(item);}catch(e){failures.push({item,error:e.message});}}}));}
await mkdir('dist/assets',{recursive:true});
let details={};try{details=await read('netease-album-details');}catch{}
await pool(albums.filter(id=>!details[id]),async id=>{const d=await fetchJSON(`https://music.163.com/api/album/${id}`);details[id]={album:d.album,songs:d.songs||d.album?.songs||[]};});
await writeFile('research/netease-album-details.json',JSON.stringify(details,null,2));
console.log('Album metadata:',Object.keys(details).length,'/',albums.length);
let credits={};try{credits=await read('netease-credits');}catch{}
const creditPrefix=/^(?:作词|作曲|编曲|制作人|制作|监制|混音(?:师|工程师)?|母带(?:处理|工程师)?|录音(?:师|工程师)?|和声(?:编写|编唱)?|吉他|贝斯|键盘|钢琴|鼓|采样|词曲|Prod(?:uced)?(?:\.?\s*by)?|Producer|Arrangement|Arranger|Mix(?:ed|ing)?(?:\s*(?:and|&)\s*Master(?:ed|ing)?)?(?:\s*(?:by|Engineer))?|Master(?:ed|ing)?(?:\s*(?:by|Engineer))?|Guitar|Bass|Piano|Vocals?)\s*[:：]/i;
await pool(songs.filter(s=>!credits[s.id]),async s=>{
  const d=await fetchJSON(`https://music.163.com/api/song/lyric?id=${s.id}&lv=1&kv=-1&tv=-1`);
  // Retain credit metadata only. Lyrics are neither saved nor shipped.
  const lines=(d.lrc?.lyric||'').split('\n').map(l=>l.replace(/\[[^\]]*\]/g,'').trim()).filter(l=>creditPrefix.test(l));
  credits[s.id]={lines:[...new Set(lines)],source:`https://music.163.com/song?id=${s.id}`,checkedAt:'2026-10-28'};
});
await writeFile('research/netease-credits.json',JSON.stringify(credits,null,2));
console.log('Tracks inspected for credits:',Object.keys(credits).length,'with explicit credits:',Object.values(credits).filter(c=>c.lines.length).length);
const artwork=[];
for(const id of albums){const d=details[id]?.album||songs.find(s=>s.album.id===id)?.album; if(d?.picUrl)artwork.push({id:'album-'+id,url:d.picUrl+'?param=600y600'});}
const artist=(await read('netease-artist')).artist;
artwork.push({id:'asen-portrait',url:artist.img1v1Url+'?param=1000y1000'});
await pool(artwork,async a=>{try{await readFile(`dist/assets/${a.id}.jpg`);return;}catch{}const r=await fetch(a.url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`Artwork HTTP ${r.status}`);const b=Buffer.from(await r.arrayBuffer());await writeFile(`dist/assets/${a.id}.jpg`,b);});
await writeFile('research/collection-log.json',JSON.stringify({checkedAt:'2026-10-28',platform:'网易云音乐公开目录',artistId:12198387,reportedTracks:(await read('netease-songs')).total,returnedTracks:songs.length,artistListedReleases:(await read('netease-albums')).hotAlbums.length,associatedReleases:albums.length,failures},null,2));
console.log('Artwork items:',artwork.length,'Failures:',JSON.stringify(failures));
