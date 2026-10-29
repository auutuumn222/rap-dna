import {readFile,writeFile,access} from 'node:fs/promises';
const base='research/thome',checkedAt='2026-10-29',primary='n12110173';
const read=async name=>JSON.parse(await readFile(`${base}/${name}.json`,'utf8'));
const pages=await Promise.all([0,100,200].map(n=>read(`netease-songs-${n}`)));
const returned=[...new Map(pages.flatMap(p=>p.songs).map(s=>[s.id,s])).values()];
const excludedIds=new Set();
const raw=returned;
const listed=(await read('netease-albums')).hotAlbums,details=await read('netease-album-details'),rawCredits=await read('netease-credits');
const apple=(await read('apple-albums-cn')).results.filter(a=>a.collectionId),appleData=(await read('apple-tracks-us')).results;
const normalize=s=>s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' '),date=ms=>Number(ms)>0?new Date(Number(ms)+28800000).toISOString().slice(0,10):'';
const people=new Map(),nameIndex=new Map();
for(const t of raw)for(const a of t.artists){const id='n'+a.id;if(!people.has(id))people.set(id,{id,name:a.name,kind:/^(Higher Brothers|更高兄弟|DIGI GHETTO|A Few Good Kids Records|成都集团|88rising)/i.test(a.name)?'collective':'person',source:String(a.id).startsWith('unlinked-')?`https://music.163.com/song?id=${t.id}`:`https://music.163.com/artist?id=${a.id}`});nameIndex.set(normalize(a.name),id);}
for(const [alias,name] of Object.entries({'Masiwei':'马思唯','馬思唯':'马思唯','Asen':'艾志恒Asen','A$en':'艾志恒Asen','艾志恒':'艾志恒Asen'}))if(nameIndex.has(normalize(name)))nameIndex.set(normalize(alias),nameIndex.get(normalize(name)));
for(const alias of ['Thome','thomeboydontkill'])nameIndex.set(normalize(alias),primary);
function person(name,source=null){name=name.trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'').trim();const key=normalize(name);if(nameIndex.has(key))return nameIndex.get(key);const id='c'+Buffer.from(key).toString('base64url');people.set(id,{id,name,kind:source?'person':'credit',source});nameIndex.set(key,id);return id;}
function parseCredit(line,source){const at=line.search(/[:：]/);if(at<0)return [];const label=line.slice(0,at).trim(),value=line.slice(at+1).trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'');let roles=[label];if(/(?:混音|mix)/i.test(label)&&/(?:母带|master)/i.test(label))roles=['混音','母带'];else if(/^(?:混音|mix)/i.test(label))roles=['混音'];else if(/^(?:母带|master)/i.test(label))roles=['母带'];else if(/^(?:制作人|制作|prod)/i.test(label))roles=['制作人'];else if(/^(?:编曲|arrang)/i.test(label))roles=['编曲'];return roles.flatMap(role=>value.split(/\s*(?:\/|、|×|\s[xX]\s)\s*/).filter(Boolean).map(name=>({personId:person(name),role,raw:line,source,level:'track'})));}
const tracks=raw.map(s=>{const source=`https://music.163.com/song?id=${s.id}`,lines=rawCredits[s.id]?.lines||[];return {id:'n'+s.id,platformId:s.id,title:s.name,aliases:s.alias||[],albumId:s.album.id?'n'+s.album.id:'unknown-n'+s.id,date:date(s.album.publishTime),trackNumber:s.no||0,duration:s.duration,artistIds:[...new Set(s.artists.map(a=>'n'+a.id))],credits:lines.flatMap(l=>parseCredit(l,source)),creditLines:lines,source,sourceLabel:'网易云音乐',checkedAt,kind:/伴奏|instrumental/i.test(s.name)?'instrumental':/\blive\b|现场/i.test(s.name)?'live':/remix/i.test(s.name)?'remix':'recording',status:'platform',...(!s.album.id?{note:'平台返回的发行 ID 和发布日期为空，保留单曲记录；不把零时间戳解释为 1970 年发行。'}:{})};});
const coreIds=[80662889,83855315,121441664,157935600,181663245,272168612];
const earlyIds=[];
const allAlbums=new Map();for(const s of raw)if(s.album.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});
for(const [id,d] of Object.entries(details))if(allAlbums.has(Number(id)))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});
const albums=[...allAlbums.values()].map(a=>({id:'n'+a.id,title:a.name,date:date(a.publishTime),type:a.type||'发行',edition:a.subType||null,totalTracks:a.size||null,artistNames:a.artists?.map(p=>p.name).filter(Boolean)||[],label:a.company||null,artwork:`./assets/album-${a.id}.jpg`,artworkSource:a.picUrl,source:`https://music.163.com/album?id=${a.id}`,sourceLabel:'网易云音乐',checkedAt,core:coreIds.includes(a.id),chapter:coreIds.includes(a.id)?'个人项目':a.id===138339265?'团体项目':earlyIds.includes(a.id)?'早期项目':'合作与其他发行',trackIds:tracks.filter(t=>t.albumId==='n'+a.id).map(t=>t.id),listedOnArtist:listed.some(x=>x.id===a.id)}));
const extras=[];
const matches={1818981717:272168612,1722522725:181663245,1868399991:121441664,1663817773:157935600,1664022980:157935600,1826003254:127636124,1826003020:127824986,1885959786:87333686};
const externalReleases=[];for(const country of ['cn','us'])for(const a of (await read(`apple-albums-${country}`)).results.filter(a=>a.collectionId))externalReleases.push({id:`a${a.collectionId}-${country}`,title:a.collectionName,date:a.releaseDate.slice(0,10),trackCount:a.trackCount,artist:a.artistName,source:a.collectionViewUrl,sourceLabel:`Apple Music（${country==='cn'?'中国':'美国'}区）`,checkedAt,relatedAlbumId:matches[a.collectionId]?'n'+matches[a.collectionId]:null,artwork:a.artworkUrl100});
const excludedRecords=[];
const identitySources=['https://music.163.com/artist?id=12110173','https://music.apple.com/cn/artist/1811532140','https://music.apple.com/cn/artist/1613535145'];
const gaps=[
 {title:'玉童子曲单与早期下架作品',year:'2018–2019',status:'原始曲单待补',detail:'JADEBOY（玉童子）平台总数为 5，本人分页返回 4 条，发行详情受限，暂不推断缺少曲目的署名。公开分页读完不代表历史全量，视频与下架发行仍待原始资料。',sources:[{title:'玉童子发行页',url:'https://music.163.com/album?id=83855315'}]},
 {title:'团体与客串项目',year:'历年',status:'按逐曲参与收录',detail:'DIGI GHETTO 的 18 条总曲单中仅收录 10 条本人署名；BEDROOM TAPE 为 1/5，The Collections（集）为 1/4。不把团体成员身份或艺人页关联发行当成每首歌的参与证据。',sources:[138339265,272136228,181549066].map(id=>({title:'网易云发行 '+id,url:`https://music.163.com/album?id=${id}`}))},
 {title:'Apple 曲单与跨平台标题',year:'当前',status:'仅对照，不推定缺失',detail:'部分 Apple 发行只返回发行元数据；NBS / 简阳的骄傲、MY-ZONE / 我的地盘、MISFIT KID 的英译标题等跨平台对应尚未逐项证明，不因标题不同重复补入作品。',sources:[{title:'Apple THOME',url:identitySources[1]}]}
];
const discrepancies=[
 {title:'新旧艺名与同名账号',detail:'网易云搜索 Thome 和 thomeboydontkill 均指向主账号 12110173，当前名为 THOME；不合并另一个 Thome 账号 12111107。Apple 旧名账号 1613535145 与新账号 1811532140 共享多项发行 ID，保留旧名来源快照；另一个旧名账号 1798416485 没有返回发行，不凭名字合并。',sources:identitySources},
 {title:'歌曲数与发行参与范围',detail:'网易云三页共 203 条平台记录，包含重复发行、混音和 skit；不等于 203 首独立原创。核心六个个人项目中五个当前曲单完整，玉童子保留 4/5。团体与他人项目只收本人逐曲署名。',sources:[identitySources[0]]},
 {title:'署名与日期',detail:'共同署名来自逐曲艺人字段，制作、编曲、混音和母带来自单曲明确署名；不从标题 Prod. 推断角色，不将专辑级署名下放。日期按北京时间处理，不将平台发行日称为首次创作日期。Apple 地区发行记录分别保留。',sources:[identitySources[0],identitySources[1]]}
];
const dates=tracks.map(t=>t.date).filter(Boolean).sort(),artist=(await read('netease-artist')).artist;
const catalog={schemaVersion:2,checkedAt,artist:{id:primary,name:'THOME',short:'Thome',aliases:['THOME','Thome','thomeboydontkill','Thomeboydontkill'],portrait:'./assets/thome-portrait.jpg',portraitSource:artist.img1v1Url,links:[{label:'网易云音乐',url:'https://music.163.com/artist?id=12110173'},{label:'Apple Music',url:'https://music.apple.com/cn/artist/1811532140'}]},coverage:{neteaseReported:pages[0].total,neteaseCollected:returned.length,neteaseIncluded:raw.length,neteaseExcluded:excludedRecords.length,neteaseHasMore:pages.at(-1).more,listedReleases:listed.length,associatedNeteaseReleases:allAlbums.size,appleComparedReleases:externalReleases.length,appleExtraTracks:extras.length,coreAlbums:coreIds.length,from:dates[0],through:dates.at(-1),historicallyComplete:false,description:`网易云全部三页取得 ${returned.length} 条歌曲记录，末页 more=false；Apple Music 中国 / 美国区分别保留发行对照。当前有日期的收录范围 ${dates[0]} 至 ${dates.at(-1)}。玉童子保留 4/5 条，团体与客串只按逐曲署名收录，不宣称历史全量。`},people:[...people.values()],albums:albums.sort((a,b)=>b.date.localeCompare(a.date)),tracks:tracks.sort((a,b)=>b.date.localeCompare(a.date)||a.trackNumber-b.trackNumber),externalReleases,excludedRecords,gaps,discrepancies};
for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
await writeFile('dist/catalog-thome.json',JSON.stringify(catalog,null,2)+'\n');
const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');
let report=`# THOME 作品档案核查\n\n核查日期：${checkedAt}（北京时间）。\n\n${catalog.coverage.description}\n\n网易云艺人 ID 12110173；Apple Music 艺人 ID 1811532140。${listed.length} 个艺人页发行条目，${allAlbums.size} 个关联网易云发行容器；共 ${tracks.length} 条平台歌曲记录，包含版本，不等于独立原创总数。\n\n## 核心与早期项目\n\n|日期|发行|类别|平台总曲数|本人署名记录|来源|\n|---|---|---|---:|---:|---|\n`;
for(const a of [...albums].filter(a=>a.core||a.chapter==='早期项目'||a.chapter==='联合现场').sort((a,b)=>a.date.localeCompare(b.date)))report+=`|${a.date}|${pipe(a.title)}|${a.chapter}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
report+='\n## 差异与统计边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail} ${d.sources.map(s=>`[来源](${s})`).join(' ')}`).join('\n');
report+='\n\n## 待补资料\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail} ${g.sources.map(s=>`[${s.title}](${s.url})`).join(' ')}`).join('\n');
report+='\n\n## 身份待核记录（不计入作品与关系）\n\n'+excludedRecords.map(t=>`- [${t.title}](${t.source}) · ${t.album}`).join('\n');
report+='\n\n## 全部收录歌曲记录\n\n|发行日期|歌曲|发行|平台共同署名|来源|\n|---|---|---|---|---|\n';for(const t of [...catalog.tracks].reverse())report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albums.find(a=>a.id===t.albumId).title)}|${pipe(t.artistIds.map(id=>people.get(id).name).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
const log=await read('collection-log');report+=`\n## 采集与署名\n\n${tracks.filter(t=>t.creditLines.length).length} 条收录记录取得明确署名字段。仅保留元数据与单曲署名，不保存歌词或音频。采集有 ${log.failures.length} 个请求失败，详见 research/thome/collection-log.json；未绕过平台限制。封面与肖像缓存于 dist/assets，权利归相应权利人。\n`;
await writeFile('research/THOME-DISCOGRAPHY.md',report);
console.log(JSON.stringify({tracks:tracks.length,excluded:excludedRecords.length,albums:albums.length,core:coreIds.length,people:people.size,credits:tracks.filter(t=>t.creditLines.length).length,dates:[dates[0],dates.at(-1)]}));
