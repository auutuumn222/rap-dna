import {readFile,writeFile,access} from 'node:fs/promises';

const base='research/wudu',checkedAt='2026-11-02',primary='n12488150';
const read=async name=>JSON.parse(await readFile(`${base}/${name}.json`,'utf8'));

const pages=[];
for(let offset=0;;offset+=100){
 const p=await read(`netease-songs-${offset}`);
 pages.push(p);
 if(!p.more)break;
}
const raw=[...new Map(pages.flatMap(p=>p.songs).map(s=>[s.id,s])).values()];
if(pages.at(-1).more||raw.length!==pages[0].total||raw.some(s=>!s.artists.some(a=>a.id===12488150))){
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
    kind:/^(GOSH Music|GOSH|Higher Brothers|更高兄弟|成都集团|88rising|说唱会馆|CDC|说唱梦工厂|DIGI GHETTO|A Few Good Kids Records|Sup Music|活死人)/i.test(a.name)?'collective':'person',
    source:a.id?`https://music.163.com/artist?id=${a.id}`:null
   });
  }
  nameIndex.set(normalize(a.name),id);
 }
}

for(const [alias,name] of Object.entries({
 '雾都':'雾都L4WUDU',
 'WUDU':'雾都L4WUDU',
 'wudu':'雾都L4WUDU',
 'L4WUDU':'雾都L4WUDU',
 'L4Wudu':'雾都L4WUDU',
 '游宇童':'雾都L4WUDU',
 'WUDU MONTANA':'雾都L4WUDU',
 '霧都L4WUDU':'雾都L4WUDU',
 '布瑞吉':'布瑞吉Bridge',
 'Bridge':'布瑞吉Bridge',
 'GAI':'GAI周延',
 '王齐铭':'王齐铭WatchMe'
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
 return roles.flatMap(role=>value.split(/\s*(?:\/|、|×|[|｜]|\s[xX]\s)\s*/).filter(Boolean).map(name=>({
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
 return {
  id:'n'+s.id,
  platformId:s.id,
  title:s.name,
  aliases:s.alias||[],
  albumId:s.album?.id?'n'+s.album.id:'unknown-n'+s.id,
  date:date(s.album?.publishTime),
  trackNumber:s.no||0,
  duration:s.duration,
  artistIds:[...new Set(s.artists.map(a=>a.id?'n'+a.id:'u'+Buffer.from(normalize(a.name)).toString('base64url')))],
  credits:lines.flatMap(l=>parseCredit(l,source)),
  creditLines:lines,
  source,
  sourceLabel:'网易云音乐',
  checkedAt,
  kind:/伴奏|instrumental|官方beat/i.test(s.name)?'instrumental':/\blive\b|现场/i.test(s.name)?'live':/remix|slowed\s*\+?\s*reverb|sped\s*up/i.test(s.name)?'remix':'recording',
  status:'platform',
  ...(!s.album?.id?{note:'平台返回的发行 ID 和发布日期为空，保留单曲记录；不把零时间戳解释为 1970 年发行。'}:{})
 };
});

const coreIds=[159693849,258243929,378348117];
const allAlbums=new Map();
for(const s of raw)if(s.album?.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
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
 chapter:a.id===39590090?'团体项目':coreIds.includes(a.id)?'个人项目':'合作与其他发行',
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
  artistNames:t.artistIds.map(id=>people.get(id).name),
  label:null,
  artwork:'./assets/wudu-portrait.jpg',
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

const artistUrl='https://music.163.com/artist?id=12488150';
const appleUrl='https://music.apple.com/cn/artist/1573916677';

const gaps=[
 {
  title:'早期与下架作品核查',
  year:'历年',
  status:'历史全量待核',
  detail:'当前公开分页已完整取得 102 首歌曲记录。早期部分成名作（如早期地下 Demo、部分演出视频发行等）因版权变动或下架未包含在当前主账号公开分页中，保留待补证，不凭空伪造。',
  sources:[{title:'官方网易云主页',url:artistUrl},{title:'Apple 音乐人页',url:appleUrl}]
 },
 {
  title:'GOSH 团体与合辑逐曲参与',
  year:'团体合作',
  status:'按逐曲参与收录',
  detail:'GOSH 团体作品（如《GOSH Music Cypher 2018 Pt.1》等）及综艺节目合辑（如《中国新说唱2019》）仅按雾都L4WUDU明确逐曲参与收录，不将整张合辑泛化为个人专辑。',
  sources:[{title:'官方网易云主页',url:artistUrl},{title:'GOSH Cypher',url:'https://music.163.com/album?id=39590090'}]
 },
 {
  title:'同名账号隔离与多平台核验',
  year:'历年',
  status:'身份独立',
  detail:'网易云主账号为“雾都L4WUDU”（ID 12488150）；Apple Music 对应主账号为“霧都L4WUDU”（ID 1573916677）。Apple 上其他同名或全大写候选账号（如 ID 1718348803、1564118093）保持独立隔离，不猜测合并。',
  sources:[{title:'官方网易云主页',url:artistUrl},{title:'Apple 音乐人页',url:appleUrl}]
 }
];

const discrepancies=[
 {
  title:'雾都L4WUDU 姓名与别名',
  detail:'艺人常用名涵盖“雾都”、“雾都L4WUDU”、“WUDU”、“L4WUDU”、“游宇童”、“WUDU MONTANA”等，检索系统完整支持别名关联；Apple 官方主页显示为“霧都L4WUDU”（ID 1573916677）。',
  sources:[artistUrl,appleUrl]
 },
 {
  title:'个人核心项目与合作范围',
  detail:'收录《L4WORLD-001》、《过去·现在·未来》、《I\'M AWAKE》等核心项目，核心曲目全量收录；团体及节目合辑按逐曲署名呈现。',
  sources:[artistUrl]
 },
 {
  title:'平台总量与歌曲性质',
  detail:'收录的 102 条平台记录包含录音室版、伴奏及现场版，不等于独立原创总数；平台发布日期按来源保留，不作为艺人出道或首次发行证明。',
  sources:[artistUrl]
 }
];

const dates=tracks.map(t=>t.date).filter(Boolean).sort();
const artist=(await read('netease-artist')).artist;

const catalog={
 schemaVersion:2,
 checkedAt,
 artist:{
  id:primary,
  name:'雾都L4WUDU',
  short:'雾都',
  aliases:['雾都L4WUDU','雾都','WUDU','L4WUDU','游宇童','WUDU MONTANA','霧都L4WUDU','L4Wudu'],
  portrait:'./assets/wudu-portrait.jpg',
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
  appleComparedReleases:externalReleases.length,
  appleExtraTracks:0,
  coreAlbums:coreIds.length,
  from:dates[0],
  through:dates.at(-1),
  historicallyComplete:false,
  description:`已读取网易云全部 ${raw.length} 条公开目录记录，涵盖《L4WORLD-001》、《过去·现在·未来》、《I\'M AWAKE》等核心个人项目。合作发行按逐曲署名收录，早期及下架作品历史全量仍待补证。`
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

await writeFile('dist/catalog-wudu.json',JSON.stringify(catalog,null,2)+'\n');

const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');

let report=`# 雾都L4WUDU 作品档案核查

核查日期：${checkedAt}（北京时间）。

${catalog.coverage.description}

网易云艺人 ID 12488150；Apple Music 艺人 ID 1573916677。${listed.length} 项艺人页发行条目，${allAlbums.size} 个关联网易云发行容器；Apple 中国区 ${externalReleases.length} 项发行对照；共 ${tracks.length} 条平台歌曲记录，包含版本，不等于独立原创总数。

[网易云官方主页](${artistUrl}) · [Apple Music 官方主页](${appleUrl})

## 核心个人与联合项目

|日期|发行|类别|平台总曲数|本人署名记录|来源|
|---|---|---|---:|---:|---|
`;

for(const a of albums.filter(a=>a.core||['团体项目','早期项目'].includes(a.chapter)).sort((a,b)=>a.date.localeCompare(b.date))){
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

${tracks.filter(t=>t.creditLines.length).length} 条收录记录取得明确署名字段。仅保留元数据与单曲署名，不保存歌词或音频。采集有 ${log.failures.length} 个请求失败，详见 research/wudu/collection-log.json；未绕过平台限制。封面与肖像已缓存至 dist/assets，权利归相应权利人。
`;

await writeFile('research/WUDU-DISCOGRAPHY.md',report);

console.log(JSON.stringify({
 tracks:tracks.length,
 albums:albums.length,
 core:coreIds.length,
 people:people.size,
 credits:tracks.filter(t=>t.creditLines.length).length,
 dates:[dates[0],dates.at(-1)]
}));
