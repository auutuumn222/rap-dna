import {readFile,writeFile,access} from 'node:fs/promises';
const base='research/zhangfangzhao',checkedAt='2026-10-29',primary='n15194340';
const read=async name=>JSON.parse(await readFile(`${base}/${name}.json`,'utf8'));
const pages=await Promise.all([0,100,200].map(n=>read(`netease-songs-${n}`)));
const raw=[...new Map(pages.flatMap(p=>p.songs).map(s=>[s.id,s])).values()];
const listed=(await read('netease-albums')).hotAlbums,details=await read('netease-album-details'),rawCredits=await read('netease-credits');
const apple=(await read('apple-albums-cn')).results.filter(a=>a.collectionId),appleData=(await read('apple-tracks-us')).results;
const normalize=s=>s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' '),date=ms=>Number(ms)>0?new Date(Number(ms)+28800000).toISOString().slice(0,10):'';
const people=new Map(),nameIndex=new Map();
for(const t of raw)for(const a of t.artists){const id='n'+a.id;if(!people.has(id))people.set(id,{id,name:a.name,kind:/^(WASTED CLUB|网上邻居official|后千禧浪潮|A1 TRIP|OuttaWave|NewPlanCrew|BustinG Music|UnlockMusic安洛音樂)/i.test(a.name)?'collective':'person',source:`https://music.163.com/artist?id=${a.id}`});nameIndex.set(normalize(a.name),id);}
for(const [alias,name] of Object.entries({'河南说唱之神':'张方钊','河南說唱之神':'张方钊','Masiwei':'马思唯','馬思唯':'马思唯','Asen':'艾志恒Asen','A$en':'艾志恒Asen','艾志恒':'艾志恒Asen'}))if(nameIndex.has(normalize(name)))nameIndex.set(normalize(alias),nameIndex.get(normalize(name)));
function person(name,source=null){name=name.trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'').trim();const key=normalize(name);if(nameIndex.has(key))return nameIndex.get(key);const id='c'+Buffer.from(key).toString('base64url');people.set(id,{id,name,kind:source?'person':'credit',source});nameIndex.set(key,id);return id;}
function parseCredit(line,source){const at=line.search(/[:：]/);if(at<0)return [];const label=line.slice(0,at).trim(),value=line.slice(at+1).trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'');let roles=[label];if(/(?:混音|mix)/i.test(label)&&/(?:母带|master)/i.test(label))roles=['混音','母带'];else if(/^(?:混音|mix)/i.test(label))roles=['混音'];else if(/^(?:母带|master)/i.test(label))roles=['母带'];else if(/^(?:制作人|制作|prod)/i.test(label))roles=['制作人'];else if(/^(?:编曲|arrang)/i.test(label))roles=['编曲'];return roles.flatMap(role=>value.split(/\s*(?:\/|、|×|\s[xX]\s)\s*/).filter(Boolean).map(name=>({personId:person(name),role,raw:line,source,level:'track'})));}
const tracks=raw.map(s=>{const source=`https://music.163.com/song?id=${s.id}`,lines=rawCredits[s.id]?.lines||[];return {id:'n'+s.id,platformId:s.id,title:s.name,aliases:s.alias||[],albumId:s.album.id?'n'+s.album.id:'unknown-n'+s.id,date:date(s.album.publishTime),trackNumber:s.no||0,duration:s.duration,artistIds:[...new Set(s.artists.map(a=>'n'+a.id))],credits:lines.flatMap(l=>parseCredit(l,source)),creditLines:lines,source,sourceLabel:'网易云音乐',checkedAt,kind:/伴奏|instrumental/i.test(s.name)?'instrumental':/\blive\b|现场/i.test(s.name)?'live':/remix/i.test(s.name)?'remix':'recording',status:'platform',...(!s.album.id?{note:'平台返回的发行 ID 和发布日期为空，保留单曲记录；不把零时间戳解释为 1970 年发行。'}:{})};});
const coreIds=[85602381,90382727,121309558,148817435,163040720,283080124,397430271];
const allAlbums=new Map();for(const s of raw)if(s.album.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});for(const [id,d] of Object.entries(details))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});
const albums=[...allAlbums.values()].map(a=>({id:'n'+a.id,title:a.name,date:date(a.publishTime),type:a.type||'发行',edition:a.subType||null,totalTracks:a.size||null,artistNames:a.artists?.map(p=>p.name).filter(Boolean)||[],label:a.company||null,artwork:`./assets/album-${a.id}.jpg`,artworkSource:a.picUrl,source:`https://music.163.com/album?id=${a.id}`,sourceLabel:'网易云音乐',checkedAt,core:coreIds.includes(a.id),chapter:coreIds.includes(a.id)?'个人项目':a.id===172172163?'团体项目':'合作与其他发行',trackIds:tracks.filter(t=>t.albumId==='n'+a.id).map(t=>t.id),listedOnArtist:listed.some(x=>x.id===a.id)}));
for(const t of tracks.filter(t=>t.albumId.startsWith('unknown-')))albums.push({id:t.albumId,title:'发行资料待核',date:'',type:'待核发行',edition:null,totalTracks:null,artistNames:t.artistIds.map(id=>people.get(id).name),label:null,artwork:'./assets/zhangfangzhao-portrait.jpg',artworkSource:null,source:t.source,sourceLabel:'网易云音乐（单曲页）',checkedAt,core:false,chapter:'待核发行',trackIds:[t.id],listedOnArtist:false});
// Explicit Apple records absent from this NetEase snapshot. Match identity by artistId,
// and preserve the collaborator spelling supplied by Apple rather than guessing aliases.
const extraAlbumIds=[6791944272,1772215616];
for(const collectionId of extraAlbumIds){
 const a=appleData.find(x=>x.wrapperType==='collection'&&x.collectionId===collectionId);
 if(!a)throw Error('Missing Apple release '+collectionId);
 const songs=appleData.filter(x=>x.wrapperType==='track'&&x.collectionId===collectionId);
 if(songs.length!==a.trackCount)throw Error('Incomplete Apple tracklist '+collectionId);
 for(const t of songs){
  if(t.artistId!==1530555222)throw Error('Unexpected Apple artist '+t.trackId);
  const source=t.trackViewUrl,names=t.artistName.split(/\s+&\s+/),artistIds=names.map(name=>/^(河南說唱之神|河南说唱之神|张方钊)$/.test(name)?primary:person(name,source));
  if(!artistIds.includes(primary))throw Error('Missing primary credit '+t.trackId);
  tracks.push({id:'a'+t.trackId,platformId:t.trackId,title:t.trackName,aliases:[],albumId:'a'+collectionId,date:t.releaseDate.slice(0,10),trackNumber:t.trackNumber,duration:t.trackTimeMillis,artistIds,artistEvidence:artistIds.map(personId=>({personId,source,field:'Apple artistName'})),credits:[],creditLines:[],source,sourceLabel:'Apple Music（美国区）',checkedAt,kind:'recording',status:'platform',note:'当前网易云艺人分页中未取得对应发行，单独保留 Apple 平台记录；不据此断言其他平台从未发行。'});
 }
 albums.push({id:'a'+collectionId,title:a.collectionName.replace(/ - Single$/,''),date:a.releaseDate.slice(0,10),type:a.collectionType,totalTracks:a.trackCount,artistNames:[a.artistName],label:null,artwork:`./assets/apple-album-${collectionId}.jpg`,artworkSource:a.artworkUrl100,source:a.collectionViewUrl,sourceLabel:'Apple Music（美国区）',checkedAt,core:collectionId===6791944272,chapter:collectionId===6791944272?'个人项目':'跨平台补充',trackIds:songs.map(t=>'a'+t.trackId),listedOnArtist:false});
}
const matches={1550738609:90382727,1548671913:121309558,1641149807:148817435,1835895791:283080124,6820463916:397430271};
const externalReleases=apple.map(a=>({id:'a'+a.collectionId,title:a.collectionName,date:a.releaseDate.slice(0,10),trackCount:a.trackCount,artist:a.artistName,source:a.collectionViewUrl,sourceLabel:'Apple Music（中国区）',checkedAt,relatedAlbumId:matches[a.collectionId]?'n'+matches[a.collectionId]:extraAlbumIds.includes(a.collectionId)?'a'+a.collectionId:null,artwork:a.artworkUrl100}));
const artistUrl='https://music.163.com/artist?id=15194340';
const gaps=[
 {title:'早期、已下架与视频发行',year:'历年',status:'历史全量未证明',detail:'当前网易云公开分页已读取至 more=false，不代表早期、下架、视频和未正式发行作品已全部收录。当前有日期记录最早在 2016 年，不能当作出道日期。',sources:[{title:'网易云艺人页',url:artistUrl}]},
 {title:'WASTED CLUB 逐曲参与',year:'团体',status:'逐曲计入',detail:'《大牌走在东里路》平台共 9 首，当前目录中张方钊明确署名 7 首；另外两首不因团体身份自动归入个人统计。',sources:[{title:'团体发行页',url:'https://music.163.com/album?id=172172163'}]},
 {title:'Apple 地区目录与原始发行日期',year:'跨平台',status:'保留地区版本',detail:'中国区与美国区返回的发行范围不同，查询结果不代表 Apple 历史全部发行。2022 wasted 的标题年份不作为发布日期，以平台 releaseDate 单独记录。',sources:[{title:'Apple 艺人页',url:'https://music.apple.com/cn/artist/1530555222'}]}
];
const discrepancies=[
 {title:'张方钊与河南说唱之神',detail:'网易云官方搜索结果在艺人 ID 15194340 下显示姓名张方钊、别名河南说唱之神；Apple ID 1530555222 仍使用旧艺名。统一主档案身份，原始逐曲署名保留平台拼写；同名的其他网易云账号不合并。',sources:[artistUrl,'https://music.apple.com/cn/artist/1530555222']},
 {title:'同名与版本记录分别保留',detail:'河南宇宙存在两个不同发行 ID；NEW WAVE 的网易云标题含制作署名，Apple 标题可能含 featuring，不能按标题字符串自动合并歌曲。核心项目逐平台保留曲单。',sources:['https://music.163.com/album?id=83945571','https://music.163.com/album?id=83855415','https://music.apple.com/us/album/1550738609']},
 {title:'共同署名与幕后角色分开',detail:'共同作品只依据平台逐曲艺人栏或 Apple 明确署名；制作、编曲、混音和母带只取单曲字段，不把专辑署名下放到所有歌曲。Apple 的 Luois 1520 与网易云 Louis 1520 拼写不同，尚未证明别名对应，暂不合并。',sources:[artistUrl,'https://music.apple.com/us/album/6791944272']},
 {title:'跨平台补充',detail:'2022 wasted 的 12 条及 Bucktown 的 1 条记录独立保留。总量含版本、现场与伴奏，不是独立原创作品数量。',sources:extraAlbumIds.map(id=>appleData.find(a=>a.wrapperType==='collection'&&a.collectionId===id).collectionViewUrl)}
];
const dates=tracks.map(t=>t.date).filter(Boolean).sort(),artist=(await read('netease-artist')).artist,log=await read('collection-log');
const catalog={schemaVersion:2,checkedAt,artist:{id:primary,name:'张方钊',short:'张方钊',aliases:['张方钊','河南说唱之神','河南說唱之神'],portrait:'./assets/zhangfangzhao-portrait.jpg',portraitSource:artist.img1v1Url,links:[{label:'网易云音乐',url:artistUrl},{label:'Apple Music',url:'https://music.apple.com/cn/artist/1530555222'}]},coverage:{neteaseReported:pages[0].total,neteaseCollected:raw.length,neteaseHasMore:pages.at(-1).more,listedReleases:listed.length,associatedNeteaseReleases:allAlbums.size,appleComparedReleases:apple.length,appleExtraTracks:tracks.length-raw.length,coreAlbums:albums.filter(a=>a.core).length,from:dates[0],through:dates.at(-1),historicallyComplete:false,description:`已读取网易云全部 ${raw.length} 条公开目录记录，另补 ${tracks.length-raw.length} 条 Apple Music 记录。张方钊与旧艺名河南说唱之神使用同一档案；团体作品只按逐曲明确署名计入。`},people:[...people.values()],albums:albums.sort((a,b)=>b.date.localeCompare(a.date)),tracks:tracks.sort((a,b)=>b.date.localeCompare(a.date)||a.trackNumber-b.trackNumber),externalReleases,gaps,discrepancies};
for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
await writeFile('dist/catalog-zhangfangzhao.json',JSON.stringify(catalog,null,2)+'\n');
const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');
let report=`# 张方钊（河南说唱之神）作品档案核查\n\n核查日期：${checkedAt}（北京时间）。\n\n网易云艺人 ID 15194340，三页共 ${raw.length} 个不同歌曲 ID，平台报告 ${pages[0].total}，末页 more=false。艺人页列出 ${listed.length} 项发行，关联 ${allAlbums.size} 个网易云发行容器。Apple 中国区 ${apple.length} 项发行作对照；新增 13 条歌曲记录。共 ${tracks.length} 条平台记录，${catalog.coverage.coreAlbums} 个核心个人项目。日期跨度 ${dates[0]} 至 ${dates.at(-1)}，不证明历史全量。\n\n[网易云艺人页](${artistUrl}) · [Apple 艺人页](https://music.apple.com/cn/artist/1530555222)\n\n## 核心与团体项目\n\n|日期|发行|类别|平台曲数|本档案署名记录|来源|\n|---|---|---|---:|---:|---|\n`;
for(const a of [...albums].filter(a=>a.core||a.chapter==='团体项目').sort((a,b)=>a.date.localeCompare(b.date)))report+=`|${a.date}|${pipe(a.title)}|${a.chapter}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
report+='\n## 差异与边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail}`).join('\n')+'\n\n## 待补资料\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail}`).join('\n');
report+=`\n\n## 采集说明\n\n${tracks.filter(t=>t.creditLines.length).length} 条记录有明确单曲署名字段。${log.failures.length} 个请求失败，逐项见 research/zhangfangzhao/collection-log.json；专辑详情受限时保留歌曲附带的发行元数据，不绕过限制。仅保存元数据、署名及识别图片，不保存歌词或音频。\n\n## 全部歌曲记录\n\n|日期|歌曲|发行|平台署名|来源|\n|---|---|---|---|---|\n`;
for(const t of [...catalog.tracks].reverse())report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albums.find(a=>a.id===t.albumId).title)}|${pipe(t.artistIds.map(id=>people.get(id).name).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
await writeFile('research/ZHANGFANGZHAO-DISCOGRAPHY.md',report);
console.log(JSON.stringify({tracks:tracks.length,albums:albums.length,core:catalog.coverage.coreAlbums,credits:tracks.filter(t=>t.creditLines.length).length,dates:[dates[0],dates.at(-1)]}));
