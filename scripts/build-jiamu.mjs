import {readFile,writeFile,access} from 'node:fs/promises';

const base='research/jiamu',checkedAt='2026-11-02',primary='n49320722';
const read=async name=>JSON.parse(await readFile(`${base}/${name}.json`,'utf8'));

const pages=[];
for(let offset=0;;offset+=100){
 const p=await read(`netease-songs-${offset}`);
 pages.push(p);
 if(!p.more)break;
}
const raw=[...new Map(pages.flatMap(p=>p.songs).map(s=>[s.id,s])).values()];
if(pages.at(-1).more||raw.length!==pages[0].total||raw.some(s=>!s.artists.some(a=>a.id===49320722))){
 throw Error('Public pagination or primary identity mismatch');
}

const listed=(await read('netease-albums')).hotAlbums;
const details=await read('netease-album-details');
const rawCredits=await read('netease-credits');
const apple=(await read('apple-albums-cn')).results.filter(a=>a.collectionId);

const normalize=s=>s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const date=ms=>Number(ms)>0?new Date(Number(ms)+28800000).toISOString().slice(0,10):'';

const people=new Map(),nameIndex=new Map();

for(const t of raw){
 for(const a of t.artists){
  const id=a.id?'n'+a.id:'u'+Buffer.from(normalize(a.name)).toString('base64url');
  if(!people.has(id)){
   people.set(id,{
    id,
    name:a.name,
    kind:/^(说唱梦工厂|说唱听我的|中国说唱巅峰对决|GOSH|Higher Brothers|活死人|Sup Music|CDC|成都集团|D\.N\.A|DIGI GHETTO|A Few Good Kids Records|88rising)/i.test(a.name)?'collective':'person',
    source:a.id?`https://music.163.com/artist?id=${a.id}`:null
   });
  }
  nameIndex.set(normalize(a.name),id);
 }
}

for(const [alias,name] of Object.entries({
 '加木':'加木',
 'Jiamu':'加木',
 '加木Jiamu':'加木',
 '加木TRi':'加木',
 'JAM':'加木',
 '弹壳':'弹壳Danko',
 'Danko':'弹壳Danko',
 '弹壳Danko':'弹壳Danko',
 '贝贝':'贝贝（ljz329）',
 'ljz329':'贝贝（ljz329）',
 'GAI':'GAI周延',
 'GAI周延':'GAI周延',
 '周延':'GAI周延',
 '王以太':'王以太',
 '闪火':'王以太',
 '谢帝':'谢帝',
 'BO$$X':'谢帝',
 '法老':'法老 Pharaoh',
 'Pharaoh':'法老 Pharaoh',
 '杨和苏':'杨和苏 KeyNG',
 'KeyNG':'杨和苏 KeyNG',
 '杨和苏KeyNG':'杨和苏 KeyNG',
 '刘聪':'KEY.L刘聪',
 'KEY.L':'KEY.L刘聪',
 'KEY.L刘聪':'KEY.L刘聪',
 '功夫胖':'功夫胖KUNGFU-PEN',
 'KUNGFU-PEN':'功夫胖KUNGFU-PEN',
 '功夫胖KUNGFU-PEN':'功夫胖KUNGFU-PEN',
 '布瑞吉':'布瑞吉Bridge',
 'Bridge':'布瑞吉Bridge',
 '布瑞吉Bridge':'布瑞吉Bridge',
 '王齐铭':'王齐铭WatchMe',
 'WatchMe':'王齐铭WatchMe',
 '王齐铭WatchMe':'王齐铭WatchMe',
 '盛宇':'盛宇D-SHINE',
 'D-SHINE':'盛宇D-SHINE',
 '盛宇D-SHINE':'盛宇D-SHINE',
 '马思唯':'马思唯 Masiwei',
 'Masiwei':'马思唯 Masiwei',
 'KnowKnow':'KnowKnow',
 'PSY.P':'PSY.P',
 'Melo':'Melo',
 'GALI':'GALI',
 'Capper':'Capper',
 'TizzyT':'TizzyT',
 'Tizzy T':'TizzyT',
 'Jony J':'Jony J',
 '万妮达':'万妮达Vinida Weng',
 'Vinida Weng':'万妮达Vinida Weng',
 '连麻':'连麻Swimming',
 '连麻Swimming':'连麻Swimming',
 '罗言':'罗言',
 'RollFlash':'罗言'
})){
 if(nameIndex.has(normalize(name)))nameIndex.set(normalize(alias),nameIndex.get(normalize(name)));
}

function person(name,source=null){
 name=name.trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'').trim();
 const key=normalize(name);
 if(nameIndex.has(key))return nameIndex.get(key);
 const id='c'+Buffer.from(key).toString('base64url');
 people.set(id,{id,name,kind:source?'person':'credit',source});
 nameIndex.set(key,id);
 return id;
}

function parseCredit(line,source){
 const at=line.search(/[:：]/);
 if(at<0)return [];
 const label=line.slice(0,at).trim();
 const value=line.slice(at+1).trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'');
 let roles=[label];
 if(/(?:混音|mix)/i.test(label)&&/(?:母带|master)/i.test(label))roles=['混音','母带'];
 else if(/^(?:混音|mix)/i.test(label))roles=['混音'];
 else if(/^(?:母带|master)/i.test(label))roles=['母带'];
 else if(/^(?:制作人|制作|prod)/i.test(label))roles=['制作人'];
 else if(/^(?:编曲|arrang)/i.test(label))roles=['编曲'];
 return roles.flatMap(role=>value.split(/\s*(?:\/|、|×|\s[xX]\s)\s*/).filter(Boolean).map(name=>({
  personId:person(name),
  role,
  raw:line,
  source,
  level:'track'
 })));
}

const tracks=raw.map(s=>{
 const source=`https://music.163.com/song?id=${s.id}`;
 const lines=rawCredits[s.id]?.lines||[];
 const hasAlbumId=s.album?.id&&s.album.id!==0;
 return {
  id:'n'+s.id,
  platformId:s.id,
  title:s.name,
  aliases:s.alias||[],
  albumId:hasAlbumId?'n'+s.album.id:'unknown-n'+s.id,
  date:date(s.album?.publishTime),
  trackNumber:s.no||0,
  duration:s.duration,
  artistIds:[...new Set(s.artists.map(a=>a.id?'n'+a.id:'u'+Buffer.from(normalize(a.name)).toString('base64url')))],
  credits:lines.flatMap(l=>parseCredit(l,source)),
  creditLines:lines,
  source,
  sourceLabel:'网易云音乐',
  checkedAt,
  kind:/伴奏|instrumental/i.test(s.name)?'instrumental':/\blive\b|现场/i.test(s.name)?'live':/remix/i.test(s.name)?'remix':'recording',
  status:'platform',
  ...(!hasAlbumId?{note:'平台返回的发行 ID 和发布日期为空，保留单曲记录；不把零时间戳解释为 1970 年发行。'}:{})
 };
});

const coreIds=[285568440,245657305,393758181];
const allAlbums=new Map();
for(const s of raw)if(s.album?.id&&s.album.id!==0&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});
for(const [id,d] of Object.entries(details))if(allAlbums.has(Number(id)))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});

const albums=[...allAlbums.values()].map(a=>({
 id:'n'+a.id,
 title:a.name,
 date:date(a.publishTime),
 type:a.type||'发行',
 edition:a.subType||null,
 totalTracks:a.size||null,
 artistNames:a.artists?.map(p=>p.name).filter(Boolean)||[],
 label:a.company||null,
 artwork:`./assets/album-${a.id}.jpg`,
 artworkSource:a.picUrl,
 source:`https://music.163.com/album?id=${a.id}`,
 sourceLabel:'网易云音乐',
 checkedAt,
 core:coreIds.includes(a.id),
 chapter:coreIds.includes(a.id)?'个人项目':a.artists?.length>1?'合作项目':'合作与其他发行',
 trackIds:tracks.filter(t=>t.albumId==='n'+a.id).map(t=>t.id),
 listedOnArtist:listed.some(x=>x.id===a.id)
}));

for(const t of tracks.filter(t=>t.albumId.startsWith('unknown-'))){
 albums.push({
  id:t.albumId,
  title:'发行资料待核',
  date:'',
  type:'待核发行',
  edition:null,
  totalTracks:null,
  artistNames:t.artistIds.map(id=>people.get(id)?.name||id),
  label:null,
  artwork:'./assets/jiamu-portrait.jpg',
  artworkSource:null,
  source:t.source,
  sourceLabel:'网易云音乐（单曲页）',
  checkedAt,
  core:false,
  chapter:'待核发行',
  trackIds:[t.id],
  listedOnArtist:false
 });
}

const externalReleases=apple.map(a=>({
 id:'a'+a.collectionId,
 title:a.collectionName,
 date:a.releaseDate.slice(0,10),
 trackCount:a.trackCount,
 artist:a.artistName,
 source:a.collectionViewUrl,
 sourceLabel:'Apple Music（中国区）',
 checkedAt,
 relatedAlbumId:null,
 artwork:a.artworkUrl100
}));

const artistUrl='https://music.163.com/artist?id=49320722';
const appleUrl='https://music.apple.com/cn/artist/1710934456';

const gaps=[
 {
  title:'早期、下架与现场作品',
  year:'历年',
  status:'历史全量未证明',
  detail:'当前公开分页已完整取得 101 首歌曲记录。部分早期创作、现场比赛音源及下架单曲未包含在当前主账号公开分页中，保留待补证，不凭空伪造。',
  sources:[{title:'官方网易云主页',url:artistUrl},{title:'Apple 音乐人页',url:appleUrl}]
 },
 {
  title:'同名账号隔离与多平台核验',
  year:'历年',
  status:'身份独立',
  detail:'网易云及 Apple Music 存在其他同名“加木”或衍生账号，未经逐曲核查前保持隔离，不因拼写相同合并。',
  sources:[{title:'官方网易云主页',url:artistUrl},{title:'Apple 音乐人页',url:appleUrl}]
 },
 {
  title:'综艺节目合辑与合作逐曲参与',
  year:'节目合辑',
  status:'按逐曲参与收录',
  detail:'《说唱梦工厂》等各期节目合辑仅收录加木明确逐曲参与的曲目，不把整期节目合辑算作个人专辑。',
  sources:[{title:'官方网易云主页',url:artistUrl}]
 }
];

const discrepancies=[
 {
  title:'加木 / Jiamu / 加木TRi 姓名与别名',
  detail:'网易云官方主账号为“加木”，支持加木、Jiamu、加木Jiamu、加木TRi、JAM 搜索；Apple 官方主页为“加木”(ID 1710934456)。',
  sources:[artistUrl,appleUrl]
 },
 {
  title:'个人核心项目与专辑范围',
  detail:'收录《嵌入生长》（12首）、《羲和》（6首）、《星光大道》（4首）3 个核心项目。合作合辑按逐曲参与收录。',
  sources:[artistUrl]
 },
 {
  title:'平台总量与歌曲性质',
  detail:'收录的 101 条平台记录包含录音室版、现场版及伴奏，不等于独立原创作品总数；平台发布日期按来源保留，不作为艺人出道或首次发行证明。',
  sources:[artistUrl]
 }
];

const dates=tracks.map(t=>t.date).filter(Boolean).sort();
const artist=(await read('netease-artist')).artist;

if(people.has(primary)){
 const p=people.get(primary);
 p.aliases=['加木','Jiamu','加木Jiamu','加木TRi','JAM'];
}

const catalog={
 schemaVersion:2,
 checkedAt,
 artist:{
  id:primary,
  name:'加木',
  short:'加木',
  aliases:['加木','Jiamu','加木Jiamu','加木TRi','JAM'],
  portrait:'./assets/jiamu-portrait.jpg',
  portraitSource:artist.img1v1Url,
  links:[
   {label:'网易云音乐',url:artistUrl},
   {label:'Apple Music',url:appleUrl}
  ]
 },
 coverage:{
  neteaseReported:pages[0].total,
  neteaseCollected:raw.length,
  neteaseHasMore:pages.at(-1).more,
  listedReleases:listed.length,
  associatedNeteaseReleases:allAlbums.size,
  appleComparedReleases:apple.length,
  appleExtraTracks:0,
  coreAlbums:coreIds.length,
  from:dates[0],
  through:dates.at(-1),
  historicallyComplete:false,
  description:`已读取网易云全部 ${raw.length} 条公开目录记录，涵盖《嵌入生长》、《羲和》、《星光大道》等 3 个核心项目。合作发行按逐曲署名收录，早期及未上架作品历史全量仍待补证。`
 },
 people:[...people.values()],
 albums:albums.sort((a,b)=>b.date.localeCompare(a.date)),
 tracks:tracks.sort((a,b)=>b.date.localeCompare(a.date)||a.trackNumber-b.trackNumber),
 externalReleases,
 gaps,
 discrepancies
};

for(const a of catalog.albums){
 await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
}
await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));

await writeFile('dist/catalog-jiamu.json',JSON.stringify(catalog,null,2)+'\n');

const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');

let report=`# 加木 作品档案核查

核查日期：${checkedAt}（北京时间）。

${catalog.coverage.description}

网易云艺人 ID 49320722；Apple Music 艺人 ID 1710934456。${listed.length} 项艺人页发行条目，${allAlbums.size} 个关联网易云发行容器；Apple 中国区 ${apple.length} 项发行对照；共 ${tracks.length} 条平台歌曲记录，包含版本，不等于独立原创总数。

[网易云官方主页](${artistUrl}) · [Apple Music 官方主页](${appleUrl})

## 核心个人与联合项目

|日期|发行|类别|平台总曲数|本人署名记录|来源|
|---|---|---|---:|---:|---|
`;

for(const a of albums.filter(a=>a.core).sort((a,b)=>a.date.localeCompare(b.date))){
 report+=`|${a.date}|${pipe(a.title)}|${a.chapter}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
}

report+='\n## 差异与统计边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail}`).join('\n');
report+='\n\n## 待补资料与缺口\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail} ${g.sources.map(s=>`[${s.title}](${s.url})`).join(' ')}`).join('\n');

report+='\n\n## 全部收录歌曲记录\n\n|发行日期|歌曲|发行|平台共同署名|来源|\n|---|---|---|---|---|\n';
for(const t of [...catalog.tracks].reverse()){
 const albName=albums.find(a=>a.id===t.albumId)?.title||'未知发行';
 report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albName)}|${pipe(t.artistIds.map(id=>people.get(id)?.name||id).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
}

const log=await read('collection-log');
report+=`\n## 采集与署名

${tracks.filter(t=>t.creditLines.length).length} 条收录记录取得明确署名字段。仅保留元数据与单曲署名，不保存歌词或音频。采集有 ${log.failures.length} 个请求失败，详见 research/jiamu/collection-log.json；未绕过平台限制。封面与肖像已缓存至 dist/assets，权利归相应权利人。
`;

await writeFile('research/JIAMU-DISCOGRAPHY.md',report);

console.log(JSON.stringify({
 tracks:tracks.length,
 albums:albums.length,
 core:coreIds.length,
 people:people.size,
 credits:tracks.filter(t=>t.creditLines.length).length,
 dates:[dates[0],dates.at(-1)]
}));
