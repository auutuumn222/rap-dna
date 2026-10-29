import {readFile,writeFile,access} from 'node:fs/promises';
const base='research/jinji',checkedAt='2026-10-29',primary='n13451886';
const read=async name=>JSON.parse(await readFile(`${base}/${name}.json`,'utf8'));
const pages=[];for(let offset=0;;offset+=100){const page=await read(`netease-songs-${offset}`);pages.push(page);if(!page.more)break;}
const returned=[...new Map(pages.flatMap(p=>p.songs).map(s=>[s.id,s])).values()];
const excludedIds=new Set();
const raw=returned;
const listed=(await read('netease-albums')).hotAlbums,details=await read('netease-album-details'),rawCredits=await read('netease-credits');
const apple=(await read('apple-albums-cn')).results.filter(a=>a.collectionId),appleData=(await read('apple-tracks-us')).results;
const normalize=s=>s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' '),date=ms=>Number(ms)>0?new Date(Number(ms)+28800000).toISOString().slice(0,10):'';
const people=new Map(),nameIndex=new Map();
for(const t of raw)for(const a of t.artists){const id='n'+a.id;if(!people.has(id))people.set(id,{id,name:a.name,kind:/^(Higher Brothers|更高兄弟|DIGI GHETTO|A Few Good Kids Records|成都集团|88rising)/i.test(a.name)?'collective':'person',source:String(a.id).startsWith('unlinked-')?`https://music.163.com/song?id=${t.id}`:`https://music.163.com/artist?id=${a.id}`});nameIndex.set(normalize(a.name),id);}
for(const [alias,name] of Object.entries({'Masiwei':'马思唯','馬思唯':'马思唯','Asen':'艾志恒Asen','A$en':'艾志恒Asen','艾志恒':'艾志恒Asen'}))if(nameIndex.has(normalize(name)))nameIndex.set(normalize(alias),nameIndex.get(normalize(name)));

function person(name,source=null){name=name.trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'').trim();const key=normalize(name);if(nameIndex.has(key))return nameIndex.get(key);const id='c'+Buffer.from(key).toString('base64url');people.set(id,{id,name,kind:source?'person':'credit',source});nameIndex.set(key,id);return id;}
function parseCredit(line,source){const at=line.search(/[:：]/);if(at<0)return [];const label=line.slice(0,at).trim(),value=line.slice(at+1).trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'');let roles=[label];if(/(?:混音|mix)/i.test(label)&&/(?:母带|master)/i.test(label))roles=['混音','母带'];else if(/^(?:混音|mix)/i.test(label))roles=['混音'];else if(/^(?:母带|master)/i.test(label))roles=['母带'];else if(/^(?:制作人|制作|prod)/i.test(label))roles=['制作人'];else if(/^(?:编曲|arrang)/i.test(label))roles=['编曲'];return roles.flatMap(role=>value.split(/\s*(?:\/|、|×|\s[xX]\s)\s*/).filter(Boolean).map(name=>({personId:person(name),role,raw:line,source,level:'track'})));}
const tracks=raw.map(s=>{const source=`https://music.163.com/song?id=${s.id}`,lines=rawCredits[s.id]?.lines||[];return {id:'n'+s.id,platformId:s.id,title:s.name,aliases:s.alias||[],albumId:s.album.id?'n'+s.album.id:'unknown-n'+s.id,date:date(s.album.publishTime),trackNumber:s.no||0,duration:s.duration,artistIds:[...new Set(s.artists.map(a=>'n'+a.id))],credits:lines.flatMap(l=>parseCredit(l,source)),creditLines:lines,source,sourceLabel:'网易云音乐',checkedAt,kind:/伴奏|instrumental/i.test(s.name)?'instrumental':/\blive\b|现场/i.test(s.name)?'live':/remix/i.test(s.name)?'remix':'recording',status:'platform',...(!s.album.id?{note:'平台返回的发行 ID 和发布日期为空，保留单曲记录；不把零时间戳解释为 1970 年发行。'}:{})};});
const coreIds=[98339170,126303589,156434952,257212319,393319937];
const earlyIds=[];
const allAlbums=new Map();for(const s of raw)if(s.album.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});
for(const [id,d] of Object.entries(details))if(allAlbums.has(Number(id)))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});
const albums=[...allAlbums.values()].map(a=>({id:'n'+a.id,title:a.name,date:date(a.publishTime),type:a.type||'发行',edition:a.subType||null,totalTracks:a.size||null,artistNames:a.artists?.map(p=>p.name).filter(Boolean)||[],label:a.company||null,artwork:`./assets/album-${a.id}.jpg`,artworkSource:a.picUrl,source:`https://music.163.com/album?id=${a.id}`,sourceLabel:'网易云音乐',checkedAt,core:coreIds.includes(a.id),chapter:a.id===98339170?'联合专辑':a.id===156434952?'联合EP':coreIds.includes(a.id)?'个人项目':a.id===81189873?'早期合作':earlyIds.includes(a.id)?'早期项目':'合作与其他发行',trackIds:tracks.filter(t=>t.albumId==='n'+a.id).map(t=>t.id),listedOnArtist:listed.some(x=>x.id===a.id)}));
const extras=[];
const matches={6766645542:156434952,1798560363:187488534,1803381082:135783474,1785873895:257212319,1625181838:144861206};
const externalReleases=[];for(const country of ['cn','us'])for(const a of (await read(`apple-albums-${country}`)).results.filter(a=>a.collectionId))externalReleases.push({id:`a${a.collectionId}-${country}`,title:a.collectionName,date:a.releaseDate.slice(0,10),trackCount:a.trackCount,artist:a.artistName,source:a.collectionViewUrl,sourceLabel:`Apple Music（${country==='cn'?'中国':'美国'}区）`,checkedAt,relatedAlbumId:matches[a.collectionId]?'n'+matches[a.collectionId]:null,artwork:a.artworkUrl100});
const excludedRecords=[];
const identitySources=['https://music.163.com/artist?id=13451886','https://music.apple.com/cn/artist/1625179719'];
const gaps=[
 {title:'早期与下架作品',year:'历年',status:'历史全量未证明',detail:'网易云主账号一次分页返回 97 条并标记 more=false，仅说明当次公开目录读取完毕；早期、已下架与视频发行仍需原始清单。另有同名账号 50149549，身份关联尚未证实，不自动合并。',sources:[{title:'网易云主艺人页',url:identitySources[0]}]},
 {title:'联合项目的参与范围',year:'2019–2022',status:'按本人逐曲署名收录',detail:'冰冷热带鱼总曲单 12 条，其中 7 条本人署名，其他人的独立曲目不算进本人作品；0828 总曲单 4 条，本人只署名 say good bye 1 条。真假美猴王 5 条全部有本人逐曲署名。',sources:[98339170,81189873,156434952].map(id=>({title:'网易云发行 '+id,url:`https://music.163.com/album?id=${id}`}))},
 {title:'平台访问与 Apple 曲单',year:'当前',status:'部分资料未返回',detail:'部分发行详情返回 API -462，保留失败日志，不绕过限制。Apple 中国区没有返回逐曲记录，美国区取得 8 条；纯白小背心等仅保留发行对照，不从发行级艺人名推断每首合作署名，也不把标题后缀差异自动补为新作品。',sources:[{title:'Apple Music',url:identitySources[1]}]}
];
const discrepancies=[
 {title:'平台记录与作品总数',detail:'网易云取得 97 条平台记录，包含现场、remix 与重复发行，不等于 97 首独立原创。5 个核心个人或联合项目中，4 个当前曲单完整；冰冷热带鱼按本人署名保留 7/12 条。',sources:[identitySources[0]]},
 {title:'同名身份与跨平台版本',detail:'主账号名为 JinJiBeWater_隼，另一同名账号不按名字并入。Apple 中国/美国区分别 5/6 项发行，作为 11 项地区记录保留，不等于 11 张不同专辑。高，还没富，但帅、声色犬马等在架版本标题与日期不同，各平台信息分别保存。',sources:identitySources},
 {title:'逐曲署名与北京时间',detail:'共同署名来自单曲艺人字段；制作、编曲、混音和母带仅来自明确单曲署名。不会从歌曲标题 Prod. 推定角色，或把专辑署名下放。平台日期按北京时间处理，不视为出道或首次创作日期。未核验别名保留独立。',sources:[identitySources[0]]}
];
const dates=tracks.map(t=>t.date).filter(Boolean).sort(),artist=(await read('netease-artist')).artist;
const catalog={schemaVersion:2,checkedAt,artist:{id:primary,name:'JinJiBeWater_隼',short:'隼',aliases:['JinJiBeWater_隼','JinJiBeWater','JinJiBeWater隼','JinJiBeWater 隼'],portrait:'./assets/jinji-portrait.jpg',portraitSource:artist.img1v1Url,links:[{label:'网易云音乐',url:'https://music.163.com/artist?id=13451886'},{label:'Apple Music',url:'https://music.apple.com/cn/artist/1625179719'}]},coverage:{neteaseReported:pages[0].total,neteaseCollected:returned.length,neteaseIncluded:raw.length,neteaseExcluded:excludedRecords.length,neteaseHasMore:pages.at(-1).more,listedReleases:listed.length,associatedNeteaseReleases:allAlbums.size,appleComparedReleases:externalReleases.length,appleExtraTracks:extras.length,coreAlbums:coreIds.length,from:dates[0],through:dates.at(-1),historicallyComplete:false,description:`网易云完整公开分页取得 ${returned.length} 条歌曲记录，末页 more=false；Apple Music 中国 / 美国区共保留 ${externalReleases.length} 项地区发行对照。当前有日期范围 ${dates[0]} 至 ${dates.at(-1)}。冰冷热带鱼与早期合作项目仅按本人逐曲署名收录，不宣称历史全量。`},people:[...people.values()],albums:albums.sort((a,b)=>b.date.localeCompare(a.date)),tracks:tracks.sort((a,b)=>b.date.localeCompare(a.date)||a.trackNumber-b.trackNumber),externalReleases,excludedRecords,gaps,discrepancies};
for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
await writeFile('dist/catalog-jinji.json',JSON.stringify(catalog,null,2)+'\n');
const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');
let report=`# JinJiBeWater_隼 作品档案核查\n\n核查日期：${checkedAt}（北京时间）。\n\n${catalog.coverage.description}\n\n网易云艺人 ID 13451886；Apple Music 艺人 ID 1625179719。${listed.length} 个艺人页发行条目，${allAlbums.size} 个关联网易云发行容器；共 ${tracks.length} 条平台歌曲记录，包含版本，不等于独立原创总数。\n\n## 核心与早期项目\n\n|日期|发行|类别|平台总曲数|本人署名记录|来源|\n|---|---|---|---:|---:|---|\n`;
for(const a of [...albums].filter(a=>a.core||a.chapter==='早期项目'||a.chapter==='联合现场').sort((a,b)=>a.date.localeCompare(b.date)))report+=`|${a.date}|${pipe(a.title)}|${a.chapter}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
report+='\n## 差异与统计边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail} ${d.sources.map(s=>`[来源](${s})`).join(' ')}`).join('\n');
report+='\n\n## 待补资料\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail} ${g.sources.map(s=>`[${s.title}](${s.url})`).join(' ')}`).join('\n');
report+='\n\n## 身份待核记录（不计入作品与关系）\n\n'+excludedRecords.map(t=>`- [${t.title}](${t.source}) · ${t.album}`).join('\n');
report+='\n\n## 全部收录歌曲记录\n\n|发行日期|歌曲|发行|平台共同署名|来源|\n|---|---|---|---|---|\n';for(const t of [...catalog.tracks].reverse())report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albums.find(a=>a.id===t.albumId).title)}|${pipe(t.artistIds.map(id=>people.get(id).name).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
const log=await read('collection-log');report+=`\n## 采集与署名\n\n${tracks.filter(t=>t.creditLines.length).length} 条收录记录取得明确署名字段。仅保留元数据与单曲署名，不保存歌词或音频。采集有 ${log.failures.length} 个请求失败，详见 research/jinji/collection-log.json；未绕过平台限制。封面与肖像缓存于 dist/assets，权利归相应权利人。\n`;
await writeFile('research/JINJI-DISCOGRAPHY.md',report);
console.log(JSON.stringify({tracks:tracks.length,excluded:excludedRecords.length,albums:albums.length,core:coreIds.length,people:people.size,credits:tracks.filter(t=>t.creditLines.length).length,dates:[dates[0],dates.at(-1)]}));
