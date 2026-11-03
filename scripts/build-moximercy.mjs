import {readFile,writeFile,access} from 'node:fs/promises';

const base='research/moximercy',checkedAt='2026-11-02',primary='n12200580';
const read=async name=>JSON.parse(await readFile(`${base}/${name}.json`,'utf8'));

const raw=await read('netease-songs');
const listed=await read('netease-albums');
const details=await read('netease-album-details');
const rawCredits=await read('netease-credits');
const apple=(await read('apple-albums-cn')).results.filter(a=>a.collectionId);

if(raw.length!==125||raw.some(s=>!s.artists.some(a=>a.id===12200580))){
 throw Error('Public pagination or primary identity mismatch');
}

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
    kind:/^(UDG Records|UDG|升音 Sound|INDEcompany|Taisheng Music|WHICHWAY_MUSIC|NOUS Underground|GOSH Music|Higher Brothers|成都集团|88rising|说唱会馆|CDC|说唱梦工厂|DIGI GHETTO|A Few Good Kids Records|Sup Music|活死人|家里屯Homeville|黄金唱段)/i.test(a.name)?'collective':'person',
    source:a.id?`https://music.163.com/artist?id=${a.id}`:null
   });
  }
  nameIndex.set(normalize(a.name),id);
 }
}

for(const [alias,name] of Object.entries({
 '谟西Mercy':'谟西Mercy',
 '谟西 Mercy':'谟西Mercy',
 '谟西':'谟西Mercy',
 'Mercy':'谟西Mercy',
 'Mercy Lago':'谟西Mercy',
 'MercyLago':'谟西Mercy',
 '孙宸宇':'谟西Mercy',
 'worst22':'谟西Mercy',
 'ReddB':'ReddB 白吉勒',
 'ReddB 白吉勒':'ReddB 白吉勒',
 '白吉勒':'ReddB 白吉勒',
 'SeanT肖恩恩':'SeanT肖恩恩',
 '肖恩恩':'SeanT肖恩恩',
 'SeanT':'SeanT肖恩恩',
 '王晓夫@VVS MUSIC':'王晓夫',
 '王晓夫 @VVS MUSIC':'王晓夫',
 '王晓夫':'王晓夫',
 'Philo 阿哲':'Philo阿哲',
 'Phlio阿哲':'Philo阿哲',
 '阿哲':'Philo阿哲',
 '朱莉@25hrs Music Team':'朱莉',
 '朱莉':'朱莉',
 '王天放@25hrs Music Team':'王天放',
 '王天放':'王天放',
 'Sako8@银河花店':'Sako8',
 'Sako8':'Sako8',
 '芝士男孩Cheezus':'芝士男孩Cheezus',
 '芝士男孩':'芝士男孩Cheezus',
 'Cheezus':'芝士男孩Cheezus',
 'Chief Maloney':'Chief Maloney',
 'ChiefMaloney':'Chief Maloney',
 '郭大Swag':'郭大Swag',
 '郭大':'郭大Swag',
 '恩德Andy18':'恩德Andy18',
 '恩德':'恩德Andy18'
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

const collisionSongIds = new Set([1326828990, 1360807301, 1341486733, 1323942164, 1323941413]);

const tracks=raw.map(s=>{
 const source=`https://music.163.com/song?id=${s.id}`;
 const lines=rawCredits[s.id]?.lines||[];
 const isCollision = collisionSongIds.has(s.id);
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
  status: isCollision ? 'collision' : 'platform',
  ...(isCollision ? { note: '平台元数据同名混淆曲目（海外同名 Mercy 唱片），已做隔离标识与说明。' } : {}),
  ...(!s.album?.id?{note:'平台返回的发行 ID 和发布日期为空，保留单曲记录；不把零时间戳解释为 1970 年发行。'}:{})
 };
});

const coreIds=[163999779, 150639621, 123491138, 73930204, 241506339, 137566246];
const allAlbums=new Map();
for(const s of raw)if(s.album?.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});
for(const [id,d] of Object.entries(details))if(allAlbums.has(Number(id)))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});

const showAlbumIds = [75018073, 72072796, 80235556, 167207905, 167207411, 71857075];

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
 chapter: a.id === 137566246 ? '团队项目' : [241506339, 148260864].includes(a.id) ? '联合项目' : showAlbumIds.includes(a.id) ? '企划与节目' : coreIds.includes(a.id) ? '个人项目' : '合作与其他发行',
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
  artwork:'./assets/moximercy-portrait.jpg',
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

const artistUrl='https://music.163.com/artist?id=12200580';
const appleUrl='https://music.apple.com/cn/artist/1604315395';

const gaps=[
 {
  title:'早期地下作品与历史 Mixtape',
  year:'历年',
  status:'历史全量待核',
  detail:'当前公开分页已完整取得 125 首公开歌曲记录。谟西Mercy（孙宸宇）早期在地下时期的部分作品、未正式数字上架的录音与 Mixtape，未完全收录于流媒体公开单曲页，保留待补证，不凭空伪造。',
  sources:[{title:'官方网易云主页',url:artistUrl},{title:'Apple 音乐人页',url:appleUrl}]
 },
 {
  title:'合作发行与节目合辑逐曲边界',
  year:'企划合作',
  status:'按逐曲参与收录',
  detail:'《说唱听我的2》、《ListenUp2018》、《中国新说唱2019》以及各类厂牌联名企划，严格按谟西Mercy个人实际署名收录其参演曲目，不把整张合辑泛化为主导个人专。',
  sources:[{title:'官方网易云主页',url:artistUrl}]
 },
 {
  title:'平台同名外文混入隔离',
  year:'历史存量',
  status:'已完成隔离标识',
  detail:'网易云早期自动聚合算法曾将少量海外同名 Mercy（如 60 年代合辑《Little Green Bag》及泰米尔原声带《Mei Mai》）混入其单曲分页。本档案完整保留平台返回原始记录保证分页穷尽，同时设立 collision 隔离标记并阐明事实边界。',
  sources:[{title:'官方网易云主页',url:artistUrl}]
 }
];

const discrepancies=[
 {
  title:'谟西Mercy 艺名、别名与本名',
  detail:'艺人常用名包括“谟西Mercy”、“谟西”、“Mercy”、“Mercy Lago”、“MercyLago”，本名“孙宸宇”（代表作《遇见孙宸宇》）。别名索引全量支持跨名检索。',
  sources:[artistUrl,appleUrl]
 },
 {
  title:'核心录音室与合作项目边界',
  detail:'收录《Royal & Savage（高贵与野性）》、《通俗小说.一》、《家里屯Vol.1》、《异乡人》、《全职Rapper》以及与 SHarK 合作的《谟言鲨语》等 6 张核心代表项目，核心曲目全量收录。',
  sources:[artistUrl]
 },
 {
  title:'平台公开曲目与独立作品统计',
  detail:'收录的 125 条平台单曲记录包含伴奏、Live 现场、Remix 以及少量平台算法历史混淆曲目，不直接等同于独立录音室原创总数。',
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
  name:'谟西Mercy',
  short:'谟西Mercy',
  aliases:['谟西Mercy','谟西 Mercy','谟西','Mercy','Mercy Lago','MercyLago','孙宸宇','worst22'],
  portrait:'./assets/moximercy-portrait.jpg',
  portraitSource:artist.img1v1Url||artist.picUrl,
  links:[
   {label:'网易云音乐',url:artistUrl},
   {label:'Apple Music',url:appleUrl}
  ]
 },
 coverage:{
  neteaseReported:125,
  neteaseCollected:raw.length,
  neteaseHasMore:false,
  listedReleases:listed.length,
  associatedNeteaseReleases:allAlbums.size,
  appleComparedReleases:externalReleases.length,
  appleExtraTracks:0,
  coreAlbums:coreIds.length,
  from:dates[0],
  through:dates.at(-1),
  historicallyComplete:false,
  description:`已读取网易云全部 ${raw.length} 条公开目录记录，涵盖《Royal & Savage》、《通俗小说.一》、《家里屯Vol.1》、《异乡人》、《全职Rapper》与《谟言鲨语》等核心个人与合作项目。合作与节目合辑按逐曲署名收录，早期地下录音与未上架版本仍待补证。`
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

await writeFile('dist/catalog-moximercy.json',JSON.stringify(catalog,null,2)+'\n');

const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');

let report=`# 谟西Mercy 作品档案核查

核查日期：${checkedAt}（北京时间）。

${catalog.coverage.description}

网易云艺人 ID 12200580；Apple Music 艺人 ID 1604315395。${listed.length} 项艺人页发行条目，${allAlbums.size} 个关联网易云发行容器；Apple 中国区 ${externalReleases.length} 项发行对照；共 ${tracks.length} 条平台歌曲记录，包含版本与隔离曲目，不等于独立原创总数。

[网易云官方主页](${artistUrl}) · [Apple Music 官方主页](${appleUrl})

## 核心个人与联合项目

|日期|发行|类别|平台总曲数|本人署名记录|来源|
|---|---|---|---:|---:|---|
`;

for(const a of albums.filter(a=>a.core||['团队项目','联合项目','企划与节目'].includes(a.chapter)).sort((a,b)=>a.date.localeCompare(b.date))){
 report+=`|${a.date}|${pipe(a.title)}|${a.chapter}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
}

report+='\n## 差异与统计边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail}`).join('\n');
report+='\n\n## 待补资料与缺口\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail} ${g.sources.map(s=>`[${s.title}](${s.url})`).join(' ')}`).join('\n');

report+='\n\n## 全部收录歌曲记录\n\n|发行日期|歌曲|发行|平台共同署名|来源|\n|---|---|---|---|---|\n';
for(const t of [...catalog.tracks].reverse()){
 const albName=albums.find(a=>a.id===t.albumId)?.title||'未知发行';
 report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albName)}|${pipe(t.artistIds.map(id=>people.get(id)?.name||id).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
}

report+=`\n## 采集与署名

${tracks.filter(t=>t.creditLines.length).length} 条收录记录取得明确署名字段。仅保留元数据与单曲署名，不保存歌词或音频。采集日志详见 research/moximercy/collection-log.json；未绕过平台限制。封面与肖像已缓存至 dist/assets，权利归相应权利人。
`;

await writeFile('research/MOXIMERCY-DISCOGRAPHY.md',report);

console.log(JSON.stringify({
 tracks:tracks.length,
 albums:albums.length,
 core:coreIds.length,
 people:people.size,
 credits:tracks.filter(t=>t.creditLines.length).length,
 dates:[dates[0],dates.at(-1)]
}));
