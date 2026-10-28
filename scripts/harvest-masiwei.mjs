import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
const base='research/masiwei',checkedAt='2026-10-28';
const read=async file=>JSON.parse(await readFile(file,'utf8'));
const pages=await Promise.all([0,100,200,300].map(n=>read(`${base}/netease-songs-${n}.json`)));
const songs=[...new Map(pages.flatMap(p=>p.songs||[]).map(s=>[s.id,s])).values()];
const listed=(await read(`${base}/netease-albums.json`)).hotAlbums;
const failures=[];
async function json(url){const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(`HTTP ${r.status}`);const d=await r.json();if(d.code&&d.code!==200)throw Error(`API ${d.code}`);return d;}
async function pool(items,fn){let index=0;await Promise.all(Array.from({length:3},async()=>{while(index<items.length){const item=items[index++];try{await fn(item);}catch(e){failures.push({item:typeof item==='object'?item.id||item.name:item,error:e.message});}}}));}
await mkdir('dist/assets',{recursive:true});
let credits={};try{credits=await read(`${base}/netease-credits.json`);}catch{}
const asen=await read('research/netease-credits.json');for(const s of songs)if(asen[s.id]&&!credits[s.id])credits[s.id]=asen[s.id];
const prefix=/^(?:作词|作曲|编曲|制作人|制作|监制|混音(?:师|工程师)?(?:\s*[&/和]\s*母带)?|母带(?:处理|工程师)?|录音(?:师|工程师)?|和声(?:编写|编唱)?|吉他|贝斯|键盘|钢琴|鼓|采样|词曲|Prod(?:uced)?(?:\.?\s*by)?|Producer|Arrangement|Arranger|Mix(?:ed|ing)?(?:\s*(?:and|&|\/)\s*Master(?:ed|ing)?)?(?:\s*(?:by|Engineer))?|Master(?:ed|ing)?(?:\s*(?:by|Engineer))?|Guitar|Bass|Piano|Vocals?)\s*[:：]/i;
await pool(songs.filter(s=>!credits[s.id]),async s=>{const d=await json(`https://music.163.com/api/song/lyric?id=${s.id}&lv=1&kv=-1&tv=-1`);const lines=(d.lrc?.lyric||'').split('\n').map(l=>l.replace(/\[[^\]]*\]/g,'').trim()).filter(l=>prefix.test(l));credits[s.id]={lines:[...new Set(lines)],source:`https://music.163.com/song?id=${s.id}`,checkedAt};});
await writeFile(`${base}/netease-credits.json`,JSON.stringify(credits,null,2));console.log(JSON.stringify({stage:'credits',inspected:Object.keys(credits).length,explicit:Object.values(credits).filter(c=>c.lines.length).length}));
let details={};try{details=await read(`${base}/netease-album-details.json`);}catch{}
const old=await read('research/netease-album-details.json'),albumIds=[...new Set([...listed.map(a=>a.id),...songs.map(s=>s.album.id).filter(Boolean)])];
for(const id of albumIds)if(old[id]&&!details[id])details[id]=old[id];
await pool(albumIds.filter(id=>!details[id]),async id=>{const d=await json(`https://music.163.com/api/album/${id}`);details[id]={album:d.album,songs:d.songs||d.album?.songs||[]};});
await writeFile(`${base}/netease-album-details.json`,JSON.stringify(details,null,2));console.log(JSON.stringify({stage:'albums',accessible:Object.keys(details).length,associated:albumIds.length}));
const artwork=[];for(const id of albumIds){const a=details[id]?.album||listed.find(a=>a.id===id)||songs.find(s=>s.album.id===id)?.album;if(a?.picUrl)artwork.push({id:`album-${id}`,url:a.picUrl+'?param=600y600'});}
const artist=(await read(`${base}/netease-artist.json`)).artist;artwork.push({id:'masiwei-portrait',url:artist.img1v1Url+'?param=1000y1000'});
await pool(artwork,async item=>{const file=`dist/assets/${item.id}.jpg`;try{await access(file);return;}catch{}const r=await fetch(item.url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(`Artwork HTTP ${r.status}`);await writeFile(file,Buffer.from(await r.arrayBuffer()));});
const cn=(await read(`${base}/apple-albums-cn.json`)).results.filter(a=>a.collectionId),us=(await read(`${base}/apple-albums-us.json`)).results.filter(a=>a.collectionId);
const ids=[...new Set([...cn,...us].map(a=>a.collectionId))],batches=[];for(let i=0;i<ids.length;i+=6)batches.push(ids.slice(i,i+6));const appleResults=[];
await pool(batches,async batch=>{const d=await json(`https://itunes.apple.com/lookup?id=${batch.join(',')}&entity=song&country=us&limit=200`);appleResults.push(...d.results);});
const apple=[...new Map(appleResults.map(x=>[(x.wrapperType==='track'?'t'+x.trackId:'a'+x.collectionId),x])).values()];await writeFile(`${base}/apple-tracks-us.json`,JSON.stringify({resultCount:apple.length,results:apple},null,2));
await writeFile(`${base}/collection-log.json`,JSON.stringify({checkedAt,artistId:1132392,reportedTracks:pages[0].total,returnedTracks:songs.length,pages:pages.map((p,i)=>({offset:i*100,count:p.songs.length,more:p.more})),listedReleases:listed.length,associatedReleases:albumIds.length,explicitCredits:Object.values(credits).filter(c=>c.lines.length).length,albumDetails:Object.keys(details).length,appleCnReleases:cn.length,appleUsReleases:us.length,appleSongRecords:apple.filter(a=>a.wrapperType==='track').length,failures},null,2));
console.log(JSON.stringify({stage:'finished',tracks:songs.length,images:artwork.length,appleSongs:apple.filter(a=>a.wrapperType==='track').length,failures:failures.length}));
