import {readFile,writeFile,access} from 'node:fs/promises';
const base='research/mulasakee',checkedAt='2026-10-29',primary='n14925064';
const read=async name=>JSON.parse(await readFile(`${base}/${name}.json`,'utf8'));
const pages=await Promise.all([0,100].map(n=>read(`netease-songs-${n}`)));
const returned=[...new Map(pages.flatMap(p=>p.songs).map(s=>[s.id,s])).values()];
const raw=returned;
const listed=(await read('netease-albums')).hotAlbums,details=await read('netease-album-details'),rawCredits=await read('netease-credits');
const normalize=s=>s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' '),date=ms=>Number(ms)>0?new Date(Number(ms)+28800000).toISOString().slice(0,10):'';
const people=new Map(),nameIndex=new Map();
for(const t of raw)for(const a of t.artists){const id='n'+a.id;if(!people.has(id))people.set(id,{id,name:a.name,kind:/^(Higher Brothers|更高兄弟|DIGI GHETTO|A Few Good Kids Records|成都集团|88rising)/i.test(a.name)?'collective':'person',source:`https://music.163.com/artist?id=${a.id}`});nameIndex.set(normalize(a.name),id);}
for(const [alias,name] of Object.entries({'Masiwei':'马思唯','馬思唯':'马思唯','Asen':'艾志恒Asen','A$en':'艾志恒Asen','艾志恒':'艾志恒Asen'}))if(nameIndex.has(normalize(name)))nameIndex.set(normalize(alias),nameIndex.get(normalize(name)));
function person(name,source=null){name=name.trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'').trim();const key=normalize(name);if(nameIndex.has(key))return nameIndex.get(key);const id='c'+Buffer.from(key).toString('base64url');people.set(id,{id,name,kind:source?'person':'credit',source});nameIndex.set(key,id);return id;}
function parseCredit(line,source){const at=line.search(/[:：]/);if(at<0)return [];const label=line.slice(0,at).trim(),value=line.slice(at+1).trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'');let roles=[label];if(/(?:混音|mix)/i.test(label)&&/(?:母带|master)/i.test(label))roles=['混音','母带'];else if(/^(?:混音|mix)/i.test(label))roles=['混音'];else if(/^(?:母带|master)/i.test(label))roles=['母带'];else if(/^(?:制作人|制作|prod)/i.test(label))roles=['制作人'];else if(/^(?:编曲|arrang)/i.test(label))roles=['编曲'];return roles.flatMap(role=>value.split(/\s*(?:\/|、|×|\s[xX]\s)\s*/).filter(Boolean).map(name=>({personId:person(name),role,raw:line,source,level:'track'})));}
const tracks=raw.map(s=>{const source=`https://music.163.com/song?id=${s.id}`,lines=rawCredits[s.id]?.lines||[];return {id:'n'+s.id,platformId:s.id,title:s.name,aliases:s.alias||[],albumId:s.album.id?'n'+s.album.id:'unknown-n'+s.id,date:date(s.album.publishTime),trackNumber:s.no||0,duration:s.duration,artistIds:[...new Set(s.artists.map(a=>'n'+a.id))],credits:lines.flatMap(l=>parseCredit(l,source)),creditLines:lines,source,sourceLabel:'网易云音乐',checkedAt,kind:/伴奏|instrumental/i.test(s.name)?'instrumental':/\blive\b|现场/i.test(s.name)?'live':/remix/i.test(s.name)?'remix':'recording',status:'platform',...(!s.album.id?{note:'平台返回的发行 ID 和发布日期为空，保留单曲记录；不把零时间戳解释为 1970 年发行。'}:{})};});
const coreIds=[98912120,137725002,161959979,244462268,353050240];
const earlyIds=[39524245,73981721,74959661,75010282,75836310,81182757];
const allAlbums=new Map();for(const s of raw)if(s.album.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});
for(const [id,d] of Object.entries(details))if(allAlbums.has(Number(id)))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});
const albums=[...allAlbums.values()].map(a=>({id:'n'+a.id,title:a.name,date:date(a.publishTime),type:a.type||'发行',edition:a.subType||null,totalTracks:a.size||null,artistNames:a.artists?.map(p=>p.name).filter(Boolean)||[],label:a.company||null,artwork:`./assets/album-${a.id}.jpg`,artworkSource:a.picUrl,source:`https://music.163.com/album?id=${a.id}`,sourceLabel:'网易云音乐',checkedAt,core:coreIds.includes(a.id),chapter:a.id===138339265?'团体项目':coreIds.includes(a.id)?'个人项目':earlyIds.includes(a.id)?'早期项目':'合作与其他发行',trackIds:tracks.filter(t=>t.albumId==='n'+a.id).map(t=>t.id),listedOnArtist:listed.some(x=>x.id===a.id)}));
const matches={1858273272:353050240,1837696651:98912120,1677481791:161959979,1762761070:244462268,1780981425:254459990,1766903016:196920436,1766901935:242059831,1694195824:155295515,1819876990:188879680};
const externalReleases=[];
for(const country of ['cn','us'])for(const a of (await read(`apple-albums-${country}`)).results.filter(a=>a.collectionId))externalReleases.push({id:`a${a.collectionId}-${country}`,title:a.collectionName,date:a.releaseDate.slice(0,10),trackCount:a.trackCount,artist:a.artistName,source:a.collectionViewUrl,sourceLabel:`Apple Music（${country==='cn'?'中国':'美国'}区）`,checkedAt,relatedAlbumId:matches[a.collectionId]?'n'+matches[a.collectionId]:null,artwork:a.artworkUrl100});
const artist=(await read('netease-artist')).artist,dates=tracks.map(t=>t.date).filter(Boolean).sort();
const source='https://music.163.com/artist?id=14925064',appleSource='https://music.apple.com/cn/artist/1646417661';
const gaps=[
 {title:'早期、下架与非正式作品',status:'历史全量未证明',detail:'公开分页已读至 more=false，仅保证当次主账号公开目录已读完。2018 年之前、已下架与视频发行仍待原始资料；同名账号及 MURA$AKI 等旧名关联未核实，不自动合并。',sources:[{title:'网易云主账号',url:source}]},
 {title:'Apple 地区曲单与未匹配发行',status:'待补曲目证据',detail:'Apple 中国 / 美国区返回 11 / 10 项发行，但歌曲查询只取得美国区 32 条歌曲，中国区未返回歌曲。ATHENA 独立单曲与 SSS 专辑曲目保留为版本对照；中国区另有《神机妙算》发行容器，未取得逐曲信息，不猜测曲目或增添关系。',sources:[{title:'Apple Music 艺人页',url:appleSource},{title:'神机妙算发行页',url:'https://music.apple.com/cn/album/1849953520'}]},
 {title:'部分发行详情受限',status:'保留已取得的目录字段',detail:'部分网易云发行详情返回 API -462。标题、日期、总曲数与图片使用艺人发行列表及歌曲分页的明确字段；不据此补写缺失曲单或幕后角色。失败请求保留在采集日志中。',sources:[{title:'网易云音乐',url:source}]}
];
const discrepancies=[
 {title:'团体作品的参与范围',detail:'DIGI GHETTO 同名专辑共 18 首，本档案仅收录平台明确署名 MULA SAKEE 的 9 首，团体成员身份不代替逐曲证据。5 个个人项目分别保留 9 / 9 / 16 / 17 / 20 条记录。',sources:['https://music.163.com/album?id=138339265',...coreIds.map(id=>`https://music.163.com/album?id=${id}`)]},
 {title:'跨平台名称与地区版本',detail:'《永玄大典》在美国区歌曲字段显示 THE OMNI ORACLE，《情绪价值》对应 Emotional Value，MAYDAY 对应联合署名 Mayday。通过发行曲单与艺人字段对照；中国 / 美国区版本分别保留，21 项地区记录不等于 21 张不同专辑。',sources:[appleSource,source]},
 {title:'单曲与专辑版本及合作署名',detail:'STATUS、倚天屠龙记、JUICE 等保留不同网易云 ID 的发行记录。Apple 已取得的 32 条歌曲均可在网易云目录找到对应曲目，不重复补入；其余发行仅作为地区发行对照，不宣称完成逐曲核对。共同署名和幕后角色分别取证，不从标题 Prod. 字样或团体成员身份推断关系。',sources:[source,appleSource]},
 {title:'同名账号分别保留',detail:'网易云搜索有多个 MULA SAKEE / Mula Sakee 同名账号；本档案使用 ID 14925064，其项目及合作曲目与现有 Asen、马思唯目录中的艺人 ID 相符。其他账号未经身份核对不并入。',sources:[source]}
];
const catalog={schemaVersion:2,checkedAt,artist:{id:primary,name:'MULA SAKEE',short:'MULA SAKEE',aliases:['Mula Sakee'],portrait:'./assets/mulasakee-portrait.jpg',portraitSource:artist.img1v1Url,links:[{label:'网易云音乐',url:source},{label:'Apple Music',url:appleSource}]},coverage:{neteaseReported:pages[0].total,neteaseCollected:returned.length,neteaseIncluded:raw.length,neteaseExcluded:0,neteaseHasMore:pages.at(-1).more,listedReleases:listed.length,associatedNeteaseReleases:allAlbums.size,appleComparedReleases:externalReleases.length,appleExtraTracks:0,coreAlbums:coreIds.length,from:dates[0],through:dates.at(-1),historicallyComplete:false,description:`网易云主账号两页取得 ${raw.length} 条歌曲记录，末页 more=false；${listed.length} 个艺人页发行条目、${albums.length} 个关联发行容器。5 个个人项目与 DIGI GHETTO 团体作品按本人逐曲署名收录。Apple 中国 / 美国区 11 / 10 项地区发行保留对照，未取得的曲单列为缺口。`},people:[...people.values()],albums:albums.sort((a,b)=>b.date.localeCompare(a.date)),tracks:tracks.sort((a,b)=>b.date.localeCompare(a.date)||a.trackNumber-b.trackNumber),externalReleases,excludedRecords:[],gaps,discrepancies};
for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
await writeFile('dist/catalog-mulasakee.json',JSON.stringify(catalog,null,2)+'\n');
const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');
let report=`# MULA SAKEE 作品档案核查\n\n核查日期：${checkedAt}（北京时间）。\n\n${catalog.coverage.description}\n\n网易云艺人 ID 14925064；Apple Music 艺人 ID 1646417661。有日期的发行记录跨度 ${dates[0]} 至 ${dates.at(-1)}，不等于出道时间或历史全量。\n\n## 核心及团体项目\n\n|日期|发行|类别|平台总曲数|本人署名记录|来源|\n|---|---|---|---:|---:|---|\n`;
for(const a of [...albums].filter(a=>a.core||a.chapter==='团体项目').sort((a,b)=>a.date.localeCompare(b.date)))report+=`|${a.date}|${pipe(a.title)}|${a.chapter}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
report+='\n## 差异及统计边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail} ${d.sources.map(s=>`[来源](${s})`).join(' ')}`).join('\n');
report+='\n\n## 待补资料\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail} ${g.sources.map(s=>`[${s.title}](${s.url})`).join(' ')}`).join('\n');
report+='\n\n## 全部收录歌曲记录\n\n|发行日期|歌曲|发行|平台共同署名|来源|\n|---|---|---|---|---|\n';
for(const t of [...catalog.tracks].reverse())report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albums.find(a=>a.id===t.albumId).title)}|${pipe(t.artistIds.map(id=>people.get(id).name).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
const log=await read('collection-log');report+=`\n## 采集与署名\n\n${tracks.filter(t=>t.creditLines.length).length} 条取得明确单曲署名。只保留元数据与署名，不保存歌词或音频。日志记录 ${log.failures.length} 个失败请求，详见 research/mulasakee/collection-log.json；部分发行详情复用已有本地来源快照，未绕过平台限制。封面与肖像本地缓存，权利归相应权利人。\n`;
await writeFile('research/MULASAKEE-DISCOGRAPHY.md',report);
console.log(JSON.stringify({tracks:tracks.length,albums:albums.length,core:coreIds.length,people:people.size,credits:tracks.filter(t=>t.creditLines.length).length,dates:[dates[0],dates.at(-1)]}));
