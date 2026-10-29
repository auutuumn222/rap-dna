import {readFile,writeFile,access} from 'node:fs/promises';
const base='research/beibei',checkedAt='2026-10-29',primary='n51957057';
const read=async name=>JSON.parse(await readFile(`${base}/${name}.json`,'utf8'));
const pages=await Promise.all([0].map(n=>read(`netease-songs-${n}`)));
const returned=[...new Map(pages.flatMap(p=>p.songs).map(s=>[s.id,s])).values()];
const raw=returned;
const listed=(await read('netease-albums')).hotAlbums,details=await read('netease-album-details'),rawCredits=await read('netease-credits');
const normalize=s=>s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' '),date=ms=>Number(ms)>0?new Date(Number(ms)+28800000).toISOString().slice(0,10):'';
const people=new Map(),nameIndex=new Map();
for(const t of raw)for(const a of t.artists){const id='n'+a.id;if(!people.has(id))people.set(id,{id,name:a.name,kind:/^(Higher Brothers|更高兄弟|DIGI GHETTO|A Few Good Kids Records|成都集团|88rising)/i.test(a.name)?'collective':'person',source:`https://music.163.com/artist?id=${a.id}`});nameIndex.set(normalize(a.name),id);}
for(const [alias,name] of Object.entries({'Masiwei':'马思唯','馬思唯':'马思唯','Asen':'艾志恒Asen','A$en':'艾志恒Asen','艾志恒':'艾志恒Asen'}))if(nameIndex.has(normalize(name)))nameIndex.set(normalize(alias),nameIndex.get(normalize(name)));
function person(name,source=null){name=name.trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'').trim();const key=normalize(name);if(nameIndex.has(key))return nameIndex.get(key);const id='c'+Buffer.from(key).toString('base64url');people.set(id,{id,name,kind:source?'person':'credit',source});nameIndex.set(key,id);return id;}
function parseCredit(line,source){const at=line.search(/[:：]/);if(at<0)return [];const label=line.slice(0,at).trim(),value=line.slice(at+1).trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'');let roles=[label];if(/(?:混音|mix)/i.test(label)&&/(?:母带|master)/i.test(label))roles=['混音','母带'];else if(/^(?:混音|mix)/i.test(label))roles=['混音'];else if(/^(?:母带|master)/i.test(label))roles=['母带'];else if(/^(?:制作人|制作|prod)/i.test(label))roles=['制作人'];else if(/^(?:编曲|arrang)/i.test(label))roles=['编曲'];return roles.flatMap(role=>value.split(/\s*(?:\/|、|×|[|｜]|\s[xX]\s)\s*/).filter(Boolean).map(name=>({personId:person(name),role,raw:line,source,level:'track'})));}
const tracks=raw.map(s=>{const source=`https://music.163.com/song?id=${s.id}`,lines=rawCredits[s.id]?.lines||[];return {id:'n'+s.id,platformId:s.id,title:s.name,aliases:s.alias||[],albumId:s.album.id?'n'+s.album.id:'unknown-n'+s.id,date:date(s.album.publishTime),trackNumber:s.no||0,duration:s.duration,artistIds:[...new Set(s.artists.map(a=>'n'+a.id))],credits:lines.flatMap(l=>parseCredit(l,source)),creditLines:lines,source,sourceLabel:'网易云音乐',checkedAt,kind:/伴奏|instrumental/i.test(s.name)?'instrumental':/\blive\b|现场/i.test(s.name)?'live':/remix/i.test(s.name)?'remix':'recording',status:'platform',...(!s.album.id?{note:'平台返回的发行 ID 和发布日期为空，保留单曲记录；不把零时间戳解释为 1970 年发行。'}:{})};});
const coreIds=[];
const earlyIds=[84028625,124269518,127807464];
const allAlbums=new Map();for(const s of raw)if(s.album.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});
for(const [id,d] of Object.entries(details))if(allAlbums.has(Number(id)))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});
const albums=[...allAlbums.values()].map(a=>({id:'n'+a.id,title:a.name,date:date(a.publishTime),type:a.type||'发行',edition:a.subType||null,totalTracks:a.size||null,artistNames:a.artists?.map(p=>p.name).filter(Boolean)||[],label:a.company||null,artwork:`./assets/album-${a.id}.jpg`,artworkSource:a.picUrl,source:`https://music.163.com/album?id=${a.id}`,sourceLabel:'网易云音乐',checkedAt,core:coreIds.includes(a.id),chapter:coreIds.includes(a.id)?'个人项目':earlyIds.includes(a.id)?'早期合作':'合作与其他发行',trackIds:tracks.filter(t=>t.albumId==='n'+a.id).map(t=>t.id),listedOnArtist:listed.some(x=>x.id===a.id)}));
for(const t of tracks.filter(t=>t.albumId.startsWith('unknown-')))albums.push({id:t.albumId,title:'发行资料待核',date:'',type:'待核发行',edition:null,totalTracks:null,artistNames:t.artistIds.map(id=>people.get(id).name),label:null,artwork:'./assets/beibei-portrait.jpg',artworkSource:null,source:t.source,sourceLabel:'网易云音乐（单曲页）',checkedAt,core:false,chapter:'待核发行',trackIds:[t.id],listedOnArtist:false});
const artist=(await read('netease-artist')).artist,dates=tracks.map(t=>t.date).filter(Boolean).sort();
const source='https://music.163.com/artist?id=51957057';
const rejectedApple=(await read('apple-search-cn')).results.find(a=>a.artistId===1581921427);
const excludedIdentities=[{platform:'Apple Music',id:1581921427,name:rejectedApple.artistName,source:rejectedApple.artistLinkUrl,reason:'搜索相关性不等于身份一致。网易云单曲同时列出 404 RAPPER（30003804）和 ljz329（51957057），且作词、作曲字段分别署名；不将前者曲库并入后者。',evidence:['https://music.163.com/song?id=1847059460','https://music.163.com/song?id=1408930588']}];
const gaps=[
 {title:'早期与下架作品',status:'历史全量未证明',detail:'当前 ljz329 账号公开分页返回 32 条，不代表贝贝早期作品已全部收录。旧发行、视频、演出与未正式发行曲目仍需原始署名和账号关联证据；同名贝贝、贝贝ljz等账号不自动合并。',sources:[{title:'网易云主账号',url:source}]},
 {title:'两条缺失发行与日期的记录',status:'保留单曲，日期待核',detail:'TALKING SH*T FREESTYLE（2017）与 How You Feel 的分页发行 ID 为 0、日期为空，保留在目录与搜索中。标题中的 2017 不是已核实的发行日期，不填为 2017 年，也不把零时间戳显示为 1970 年。待核发行使用艺人肖像作占位，不声称是原始封面。',sources:[{title:'TALKING SH*T FREESTYLE（2017）',url:'https://music.163.com/song?id=2744377651'},{title:'How You Feel',url:'https://music.163.com/song?id=2139367135'}]},
 {title:'Apple Music 账号身份未确认',status:'相关搜索结果隔离',detail:'搜索 ljz329、贝贝与李京泽返回 404 RAPPER，但其与 ljz329 在网易云是分别署名的艺人。Apple 候选账号的中国 / 美国区 9 / 6 项发行及 12 条歌曲仅保留研究快照，不进入作品统计、发行对照与关系网；没有确认的 Apple 账号或补充歌曲。',sources:[{title:'404 RAPPER 候选账号',url:rejectedApple.artistLinkUrl},...excludedIdentities[0].evidence.map(url=>({title:'两位艺人分别署名的单曲',url}))]},
 {title:'部分发行详情受限',status:'保留失败日志',detail:'部分网易云发行详情返回 API -462。使用歌曲分页、艺人发行列表及已保存详情的明确字段，不猜测缺失曲目或制作角色。',sources:[{title:'网易云音乐',url:source}]}
];
const discrepancies=[
 {title:'平台名与常用名',detail:'本档案按用户指明的贝贝及其平台账号定位。网易云搜索贝贝与 ljz329 均返回同一 ID 51957057，实际拼写是 ljz329；lij329 作为用户提供的搜索写法保留，不替换来源中的原始艺人名。',sources:[source]},
 {title:'单曲主线与合作容器',detail:`艺人发行列表有 ${listed.length} 个单曲条目，没有已核实的完整个人专辑；页面按单曲主线展示，专辑数记为 0。KINGDOM、我与世界、Couple Hunnid Mixtape Vol.2 等只收录 ljz329 明确逐曲署名的歌曲，不归入他人的整张作品。`,sources:[source,'https://music.163.com/album?id=145231495','https://music.163.com/album?id=151719469','https://music.163.com/album?id=124269518']},
 {title:'404 RAPPER 保持独立身份',detail:excludedIdentities[0].reason,sources:excludedIdentities[0].evidence},
 {title:'统计与日期边界',detail:'32 条记录包含 30 条有平台日期记录及 2 条日期待核记录。网易云当前主账号分页完整，不等于历史全量；共同署名及幕后角色分别记录，未取得署名的歌曲不会猜测制作关系。',sources:[source]}
];
const catalog={schemaVersion:2,checkedAt,artist:{id:primary,name:'贝贝（ljz329）',short:'贝贝',aliases:['贝贝','ljz329','lij329'],portrait:'./assets/beibei-portrait.jpg',portraitSource:artist.img1v1Url,links:[{label:'网易云音乐 · ljz329',url:source}]},coverage:{neteaseReported:pages[0].total,neteaseCollected:returned.length,neteaseIncluded:raw.length,neteaseExcluded:0,neteaseHasMore:pages.at(-1).more,listedReleases:listed.length,associatedNeteaseReleases:allAlbums.size,unknownReleaseRecords:tracks.filter(t=>!t.date).length,appleComparedReleases:0,appleExtraTracks:0,coreAlbums:0,from:dates[0],through:dates.at(-1),historicallyComplete:false,description:`网易云 ljz329 主账号完整返回 ${raw.length} 条歌曲记录，末页 more=false；${listed.length} 个艺人页单曲条目、${allAlbums.size} 个已知关联发行容器，另有 2 条发行与日期待核记录。没有已核实的个人专辑；404 RAPPER 的 Apple 相关搜索结果隔离，不并入作品和关系。`},people:[...people.values()],albums:albums.sort((a,b)=>b.date.localeCompare(a.date)),tracks:tracks.sort((a,b)=>b.date.localeCompare(a.date)||a.trackNumber-b.trackNumber),externalReleases:[],excludedRecords:[],excludedIdentities,gaps,discrepancies};
for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
await writeFile('dist/catalog-beibei.json',JSON.stringify(catalog,null,2)+'\n');
const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');
let report=`# 贝贝 / ljz329 作品档案核查\n\n核查日期：${checkedAt}（北京时间）。\n\n${catalog.coverage.description}\n\n网易云艺人 ID 51957057。有日期的收录范围 ${dates[0]} 至 ${dates.at(-1)}，另有 2 条日期待核；不代表出道时间或历史全量。\n\n## 主账号单曲发行\n\n|日期|发行|平台总曲数|本人署名记录|来源|\n|---|---|---:|---:|---|\n`;
for(const a of [...albums].filter(a=>a.listedOnArtist).sort((a,b)=>a.date.localeCompare(b.date)))report+=`|${a.date}|${pipe(a.title)}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
report+='\n## 差异及统计边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail} ${d.sources.map(s=>`[来源](${s})`).join(' ')}`).join('\n');
report+='\n\n## 待补资料\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail} ${g.sources.map(s=>`[${s.title}](${s.url})`).join(' ')}`).join('\n');
report+='\n\n## 全部收录歌曲记录\n\n|歌曲平台日期|歌曲|发行|平台共同署名|来源|\n|---|---|---|---|---|\n';
for(const t of [...catalog.tracks].reverse())report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albums.find(a=>a.id===t.albumId).title)}|${pipe(t.artistIds.map(id=>people.get(id).name).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
const log=await read('collection-log');report+=`\n## 采集与署名\n\n${tracks.filter(t=>t.creditLines.length).length} 条取得明确单曲署名。只保存元数据及署名，不保存歌词和音频。日志记录 ${log.failures.length} 个失败请求，详见 research/beibei/collection-log.json。封面及肖像本地缓存，权利归相应权利人。\n`;
await writeFile('research/BEIBEI-DISCOGRAPHY.md',report);
console.log(JSON.stringify({tracks:tracks.length,albums:albums.length,listed:listed.length,core:0,people:people.size,credits:tracks.filter(t=>t.creditLines.length).length,dates:[dates[0],dates.at(-1)]}));
