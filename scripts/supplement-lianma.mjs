import {readFile,writeFile} from 'node:fs/promises';
const base='research/lianma',checkedAt='2026-10-29',read=async n=>JSON.parse(await readFile(`${base}/${n}.json`,'utf8'));
const details=await read('netease-album-details'),pages=await Promise.all([0,100].map(n=>read('netease-songs-'+n))),ids=new Set(pages.flatMap(p=>p.songs.map(s=>s.id)));
const songs=details[131027226].songs.filter(s=>!ids.has(s.id)&&s.artists.some(a=>a.name==='连麻Swimming')).map(s=>({...s,album:{...s.album,publishTime:details[131027226].album.publishTime}}));
await writeFile(`${base}/netease-supplemental.json`,JSON.stringify({source:'https://music.163.com/album?id=131027226',checkedAt,reason:'发行页逐曲艺人名明确署名，原 ID 为 0；不自动合并其他零 ID 人名。',songs},null,2));
const credits=await read('netease-credits');
const prefix=/^(?:作词|作曲|编曲|制作人|制作|监制|混音(?:师|工程师)?(?:\s*[&/和]\s*母带)?|母带(?:处理|工程师)?|录音(?:师|工程师)?|和声(?:编写|编唱)?|吉他|贝斯|键盘|钢琴|鼓|采样|词曲|Prod(?:uced)?(?:\.?\s*by)?|Producer|Arrangement|Arranger|Mix(?:ed|ing)?(?:\s*(?:and|&|\/)\s*Master(?:ed|ing)?)?(?:\s*(?:by|Engineer))?|Master(?:ed|ing)?(?:\s*(?:by|Engineer))?|Guitar|Bass|Piano|Vocals?)\s*[:：]/i;

for(const s of songs){const r=await fetch(`https://music.163.com/api/song/lyric?id=${s.id}&lv=1&kv=-1&tv=-1`,{signal:AbortSignal.timeout(25000)});const d=await r.json();if(!r.ok||d.code!==200)throw Error('Credit request failed '+s.id);const lines=(d.lrc?.lyric||'').split('\n').map(l=>l.replace(/\[[^\]]*\]/g,'').trim()).filter(l=>prefix.test(l));credits[s.id]={lines:[...new Set(lines)],source:`https://music.163.com/song?id=${s.id}`,checkedAt};}
await writeFile(`${base}/netease-credits.json`,JSON.stringify(credits,null,2));
const apple=(await read('apple-tracks-us')).results;
for(const id of [1637582935,1770060099]){const a=apple.find(a=>a.collectionId===id);const r=await fetch(a.artworkUrl100.replace('100x100bb','600x600bb'));if(!r.ok)throw Error('Artwork request failed');await writeFile(`dist/assets/apple-album-${id}.jpg`,Buffer.from(await r.arrayBuffer()));}
console.log('Supplemented '+songs.length+' explicitly named album tracks.');
