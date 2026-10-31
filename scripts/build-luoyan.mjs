import {readFile,writeFile,access} from 'node:fs/promises';
const base='research/luoyan',checkedAt='2026-10-31',primary='n33863232';
const read=async name=>JSON.parse(await readFile(`${base}/${name}.json`,'utf8'));
const pages=await Promise.all([0,100].map(n=>read(`netease-songs-${n}`)));
const returned=[...new Map(pages.flatMap(p=>p.songs).map(s=>[s.id,s])).values()];
const raw=returned;
const listed=(await read('netease-albums')).hotAlbums,details=await read('netease-album-details'),rawCredits=await read('netease-credits');
const normalize=s=>s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' '),date=ms=>Number(ms)>0?new Date(Number(ms)+28800000).toISOString().slice(0,10):'';
const people=new Map(),nameIndex=new Map();
for(const t of raw)for(const a of t.artists){const id='n'+a.id;if(!people.has(id))people.set(id,{id,name:a.name,kind:/^(Higher Brothers|更高兄弟|DIGI GHETTO|A Few Good Kids Records|成都集团|88rising)/i.test(a.name)?'collective':'person',source:`https://music.163.com/artist?id=${a.id}`});nameIndex.set(normalize(a.name),id);}
for(const [alias,name] of Object.entries({'罗言':'罗言'}))if(nameIndex.has(normalize(name)))nameIndex.set(normalize(alias),nameIndex.get(normalize(name)));
function person(name,source=null){name=name.trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'').trim();const key=normalize(name);if(nameIndex.has(key))return nameIndex.get(key);const id='c'+Buffer.from(key).toString('base64url');people.set(id,{id,name,kind:source?'person':'credit',source});nameIndex.set(key,id);return id;}
function parseCredit(line,source){const at=line.search(/[:：]/);if(at<0)return [];const label=line.slice(0,at).trim(),value=line.slice(at+1).trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'');let roles=[label];if(/(?:混音|mix)/i.test(label)&&/(?:母带|master)/i.test(label))roles=['混音','母带'];else if(/^(?:混音|mix)/i.test(label))roles=['混音'];else if(/^(?:母带|master)/i.test(label))roles=['母带'];else if(/^(?:制作人|制作|prod)/i.test(label))roles=['制作人'];else if(/^(?:编曲|arrang)/i.test(label))roles=['编曲'];return roles.flatMap(role=>value.split(/\s*(?:\/|、|×|[|｜]|\s[xX]\s)\s*/).filter(Boolean).map(name=>({personId:person(name),role,raw:line,source,level:'track'})));}
const tracks=raw.map(s=>{const source=`https://music.163.com/song?id=${s.id}`,lines=rawCredits[s.id]?.lines||[];return {id:'n'+s.id,platformId:s.id,title:s.name,aliases:s.alias||[],albumId:s.album.id?'n'+s.album.id:'unknown-n'+s.id,date:date(s.album.publishTime),trackNumber:s.no||0,duration:s.duration,artistIds:[...new Set(s.artists.map(a=>'n'+a.id))],credits:lines.flatMap(l=>parseCredit(l,source)),creditLines:lines,source,sourceLabel:'网易云音乐',checkedAt,kind:/伴奏|instrumental|官方beat/i.test(s.name)?'instrumental':/\blive\b|现场/i.test(s.name)?'live':/remix|slowed\s*\+?\s*reverb|sped\s*up/i.test(s.name)?'remix':'recording',status:'platform',...(!s.album.id?{note:'平台返回的发行 ID 和发布日期为空，保留单曲记录；不把零时间戳解释为 1970 年发行。'}:{})};});
const coreIds=[140087138,147776189,165314266,195957843,284460666];
const earlyIds=[];
const allAlbums=new Map();for(const s of raw)if(s.album.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});
for(const [id,d] of Object.entries(details))if(allAlbums.has(Number(id)))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});
const albums=[...allAlbums.values()].map(a=>({id:'n'+a.id,title:a.name,date:date(a.publishTime),type:a.type||'发行',edition:a.subType||null,totalTracks:a.size||null,artistNames:a.artists?.map(p=>p.name).filter(Boolean)||[],label:a.company||null,artwork:`./assets/album-${a.id}.jpg`,artworkSource:a.picUrl,source:`https://music.163.com/album?id=${a.id}`,sourceLabel:'网易云音乐',checkedAt,core:coreIds.includes(a.id),chapter:a.id===356287838?'现场项目':coreIds.includes(a.id)?'个人项目':earlyIds.includes(a.id)?'早期项目':'合作与其他发行',trackIds:tracks.filter(t=>t.albumId==='n'+a.id).map(t=>t.id),listedOnArtist:listed.some(x=>x.id===a.id)}));
for(const t of tracks.filter(t=>t.albumId.startsWith('unknown-')))albums.push({id:t.albumId,title:'发行资料待核',date:'',type:'待核发行',edition:null,totalTracks:null,artistNames:t.artistIds.map(id=>people.get(id).name),label:null,artwork:'./assets/luoyan-portrait.jpg',artworkSource:null,source:t.source,sourceLabel:'网易云音乐（单曲页）',checkedAt,core:false,chapter:'待核发行',trackIds:[t.id],listedOnArtist:false});

const externalReleases=[];
const artist=(await read('netease-artist')).artist,dates=tracks.map(t=>t.date).filter(Boolean).sort(),source='https://music.163.com/artist?id=33863232';
const gaps=[{title:'同名身份区分',detail:'仅使用网易云罗言（艺人ID 33863232，平台别名 RollFlash）的逐曲记录。RollFlash罗言（59649368）及其他同名罗言账号均未合并；Apple Music 同名候选仍待核验。',sources:[{title:'网易云主账号',url:source}]},{title:'历史范围',detail:'公开分页已读完，不代表早期、下架及视频作品历史全量。Apple Music 搜索出现同名艺人，跨平台身份和曲目仍待核验。',sources:[{title:'网易云艺人页',url:source}]},{title:'发行详情接口受限',detail:'部分发行详情返回 API -462；仅依据单曲艺人和明确署名收录，失败请求记录在采集日志中。',sources:[{title:'网易云艺人页',url:source}]}];
const discrepancies=[];
const catalog={schemaVersion:2,checkedAt,artist:{id:primary,name:'罗言',short:'罗言',aliases:['罗言','RollFlash'],portrait:'./assets/luoyan-portrait.jpg',portraitSource:artist.img1v1Url,links:[{label:'网易云音乐',url:source}]},coverage:{neteaseReported:pages[0].total,neteaseCollected:raw.length,neteaseHasMore:pages.at(-1).more,listedReleases:listed.length,associatedNeteaseReleases:allAlbums.size,appleComparedReleases:0,appleExtraTracks:0,coreAlbums:coreIds.length,from:dates[0],through:dates.at(-1),historicallyComplete:false,description:`网易云歌曲接口报告 ${pages[0].total} 条并完整返回 ${raw.length} 条。合作发行按逐曲艺人署名收录；历史范围不宣称完整。`},people:[...people.values()],albums:albums.sort((a,b)=>b.date.localeCompare(a.date)),tracks:tracks.sort((a,b)=>b.date.localeCompare(a.date)||a.trackNumber-b.trackNumber),externalReleases,gaps,discrepancies};
for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
await writeFile('dist/catalog-luoyan.json',JSON.stringify(catalog,null,2)+'\n');
const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');
let report=`# 罗言 作品档案核查\n\n核查日期：${checkedAt}（北京时间）。\n\n${catalog.coverage.description}\n\n网易云艺人 ID 33863232；Apple Music 同名账号仍待进一步核验。有日期的收录范围 ${dates[0]} 至 ${dates.at(-1)}；不代表出道时间或历史全量。\n\n## 个人专辑\n\n|日期|发行|类别|平台总曲数|本人署名记录|来源|\n|---|---|---|---:|---:|---|\n`;
for(const a of [...albums].filter(a=>a.core||['团体项目','合作合辑','联合现场','早期项目'].includes(a.chapter)).sort((a,b)=>a.date.localeCompare(b.date)))report+=`|${a.date}|${pipe(a.title)}|${a.chapter}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
report+='\n## 差异及统计边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail} ${d.sources.map(s=>`[来源](${s})`).join(' ')}`).join('\n');
report+='\n\n## 待补资料\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail} ${g.sources.map(s=>`[${s.title}](${s.url})`).join(' ')}`).join('\n');
report+='\n\n## 全部收录歌曲记录\n\n|歌曲平台日期|歌曲|发行|平台共同署名|来源|\n|---|---|---|---|---|\n';
for(const t of [...catalog.tracks].reverse())report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albums.find(a=>a.id===t.albumId).title)}|${pipe(t.artistIds.map(id=>people.get(id).name).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
const log=await read('collection-log');report+=`\n## 采集与署名\n\n${tracks.filter(t=>t.creditLines.length).length} 条取得明确单曲署名信息；平台歌词接口只读取署名行并立即结构化，不留存歌词文本。日志记录 ${log.failures.length} 个发行详情失败请求，详见 research/luoyan/collection-log.json。封面肖像本地缓存，权利归相应权利人。\n`;
await writeFile('research/LUOYAN-DISCOGRAPHY.md',report);
console.log(JSON.stringify({tracks:tracks.length,albums:albums.length,core:coreIds.length,people:people.size,credits:tracks.filter(t=>t.creditLines.length).length,dates:[dates[0],dates.at(-1)]}));
