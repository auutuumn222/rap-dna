import {readFile,writeFile,access} from 'node:fs/promises';
const base='research/cashtrippy',checkedAt='2026-10-29',primary='n33937972';
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
const coreIds=[97665213,130732322,146625791,154635117,266596790,372704382];
const earlyIds=[];
const allAlbums=new Map();for(const s of raw)if(s.album.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});
for(const [id,d] of Object.entries(details))if(allAlbums.has(Number(id)))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});
const albums=[...allAlbums.values()].map(a=>({id:'n'+a.id,title:a.name,date:date(a.publishTime),type:a.type||'发行',edition:a.subType||null,totalTracks:a.size||null,artistNames:a.artists?.map(p=>p.name).filter(Boolean)||[],label:a.company||null,artwork:`./assets/album-${a.id}.jpg`,artworkSource:a.picUrl,source:`https://music.163.com/album?id=${a.id}`,sourceLabel:'网易云音乐',checkedAt,core:coreIds.includes(a.id),chapter:a.id===146625791?'联合专辑':coreIds.includes(a.id)?'个人项目':a.id===128015189?'团体项目':a.id===354418917?'联合现场':'合作与其他发行',trackIds:tracks.filter(t=>t.albumId==='n'+a.id).map(t=>t.id),listedOnArtist:listed.some(x=>x.id===a.id)}));
const extras=[{id:1550157640,names:['T Bobby','CashTrippy']}];
for(const extra of extras){
 const t=appleData.find(x=>x.trackId===extra.id),a=appleData.find(x=>x.wrapperType==='collection'&&x.collectionId===t?.collectionId);if(!t||!a)throw Error('Missing Apple extra '+extra.id);
 const source=t.trackViewUrl,artistIds=extra.names.map(name=>name==='CashTrippy'?primary:person(name,source));
 tracks.push({id:'a'+t.trackId,platformId:t.trackId,title:t.trackName,aliases:[],albumId:'a'+t.collectionId,date:t.releaseDate.slice(0,10),trackNumber:t.trackNumber||1,duration:t.trackTimeMillis,artistIds,artistEvidence:artistIds.map(personId=>({personId,source,field:'Apple artistName'})),credits:[],creditLines:[],source,sourceLabel:'Apple Music（美国区）',checkedAt,kind:'recording',status:'platform',note:'Apple Music 明确署名的合作记录，当前网易云艺人分页未匹配到同名记录；不据此断言网易云没有此作品。未核实的跨平台别名保持独立。'});
 albums.push({id:'a'+a.collectionId,title:a.collectionName.replace(/ - Single$/,''),date:a.releaseDate.slice(0,10),type:'Single',totalTracks:a.trackCount,artistNames:extra.names,label:null,artwork:`./assets/apple-album-${a.collectionId}.jpg`,artworkSource:a.artworkUrl100,source:a.collectionViewUrl,sourceLabel:'Apple Music（美国区）',checkedAt,core:false,chapter:'跨平台补充',trackIds:['a'+t.trackId],listedOnArtist:false});
}
const matches={1894983294:372704382,1803421791:266596790,1862532295:188557999,1853778309:350996556,1862850583:148715482,1840074043:168358233};
const externalReleases=[];for(const country of ['cn','us'])for(const a of (await read(`apple-albums-${country}`)).results.filter(a=>a.collectionId))externalReleases.push({id:`a${a.collectionId}-${country}`,title:a.collectionName,date:a.releaseDate.slice(0,10),trackCount:a.trackCount,artist:a.artistName,source:a.collectionViewUrl,sourceLabel:`Apple Music（${country==='cn'?'中国':'美国'}区）`,checkedAt,relatedAlbumId:matches[a.collectionId]?'n'+matches[a.collectionId]:null,artwork:a.artworkUrl100});
const excludedRecords=[];
const identitySources=['https://music.163.com/artist?id=33937972','https://music.apple.com/cn/artist/1550156401'];
const gaps=[
 {title:'历史全量与同名身份',year:'历年',status:'历史全量未证明',detail:'网易云三页返回209条，末页more=false，仅说明当次公开目录已读完。另一个同名账号58322051不凭名字并入。早期、下架和视频发行尚需原始清单。',sources:[{title:'主艺人页',url:identitySources[0]}]},
 {title:'团体与他人项目的参与范围',year:'历年',status:'按逐曲署名收录',detail:'Goodkidstape 1总数13条，本人署名9条；The Collections（集）总数4条，仅后座羁客1条有本人署名。不把厂牌或专辑关联当成每首作品的参与证据。HEATROOM TAPE 4th作为现场企划单列。',sources:[128015189,181549066,354418917].map(id=>({title:'发行 '+id,url:`https://music.163.com/album?id=${id}`}))},
 {title:'详情限制与地区版本',year:'当前',status:'部分资料未返回',detail:'部分网易云发行详情返回-462，保留失败日志，不绕过限制。Apple中国区与美国区发行分别保留；仅凭英译、制作或客串后缀不同不重复补入歌曲，不从专辑艺人字段推断单曲合作。',sources:[{title:'Apple Music',url:identitySources[1]}]}
];
const discrepancies=[
 {title:'歌曲统计与跨平台补充',detail:'网易云209条，Apple另补T Bobby与CashTrippy明确共同署名的No Brakes，共210条平台记录；包含版本、现场与重复发行，不等于独立原创总数。',sources:[identitySources[0],appleData.find(t=>t.trackId===1550157640).trackViewUrl]},
 {title:'核心曲单与合作边界',detail:'TrippyHood、Slayer、Two Head Snake双头蛇、Nafia Fever、万古、RACER六个个人或联合项目当前本人署名曲单完整；Goodkidstape 1仅保留9/13，不把其他成员独立曲目算入。',sources:[identitySources[0]]},
 {title:'署名与日期',detail:'共同署名来自单曲艺人栏，制作、编曲、混音和母带来自明确单曲字段；不把专辑级署名下放，不从标题Prod.推断角色。网易云日期按北京时间处理，Apple地区日期原样保留，平台日期不等于首次创作时间。',sources:identitySources}
];
const dates=tracks.map(t=>t.date).filter(Boolean).sort(),artist=(await read('netease-artist')).artist;
const catalog={schemaVersion:2,checkedAt,artist:{id:primary,name:'CashTrippy',short:'CashTrippy',aliases:['CashTrippy','CASHTRIPPY'],portrait:'./assets/cashtrippy-portrait.jpg',portraitSource:artist.img1v1Url,links:[{label:'网易云音乐',url:'https://music.163.com/artist?id=33937972'},{label:'Apple Music',url:'https://music.apple.com/cn/artist/1550156401'}]},coverage:{neteaseReported:pages[0].total,neteaseCollected:returned.length,neteaseIncluded:raw.length,neteaseExcluded:excludedRecords.length,neteaseHasMore:pages.at(-1).more,listedReleases:listed.length,associatedNeteaseReleases:allAlbums.size,appleComparedReleases:externalReleases.length,appleExtraTracks:extras.length,coreAlbums:coreIds.length,from:dates[0],through:dates.at(-1),historicallyComplete:false,description:`网易云完整三页取得 ${returned.length} 条，Apple另补 ${extras.length} 条，共 ${tracks.length} 条平台记录；六个核心个人或联合项目当前曲单完整。当前有日期范围 ${dates[0]} 至 ${dates.at(-1)}。团体与他人发行只按逐曲署名收录，不宣称历史全量。`},people:[...people.values()],albums:albums.sort((a,b)=>b.date.localeCompare(a.date)),tracks:tracks.sort((a,b)=>b.date.localeCompare(a.date)||a.trackNumber-b.trackNumber),externalReleases,excludedRecords,gaps,discrepancies};
for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
await writeFile('dist/catalog-cashtrippy.json',JSON.stringify(catalog,null,2)+'\n');
const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');
let report=`# CashTrippy 作品档案核查\n\n核查日期：${checkedAt}（北京时间）。\n\n${catalog.coverage.description}\n\n网易云艺人 ID 33937972；Apple Music 艺人 ID 1550156401。${listed.length} 个艺人页发行条目，${allAlbums.size} 个关联网易云发行容器；共 ${tracks.length} 条平台歌曲记录，包含版本，不等于独立原创总数。\n\n## 核心与早期项目\n\n|日期|发行|类别|平台总曲数|本人署名记录|来源|\n|---|---|---|---:|---:|---|\n`;
for(const a of [...albums].filter(a=>a.core||a.chapter==='早期项目'||a.chapter==='联合现场').sort((a,b)=>a.date.localeCompare(b.date)))report+=`|${a.date}|${pipe(a.title)}|${a.chapter}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
report+='\n## 差异与统计边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail} ${d.sources.map(s=>`[来源](${s})`).join(' ')}`).join('\n');
report+='\n\n## 待补资料\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail} ${g.sources.map(s=>`[${s.title}](${s.url})`).join(' ')}`).join('\n');
report+='\n\n## 身份待核记录（不计入作品与关系）\n\n'+excludedRecords.map(t=>`- [${t.title}](${t.source}) · ${t.album}`).join('\n');
report+='\n\n## 全部收录歌曲记录\n\n|发行日期|歌曲|发行|平台共同署名|来源|\n|---|---|---|---|---|\n';for(const t of [...catalog.tracks].reverse())report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albums.find(a=>a.id===t.albumId).title)}|${pipe(t.artistIds.map(id=>people.get(id).name).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
const log=await read('collection-log');report+=`\n## 采集与署名\n\n${tracks.filter(t=>t.creditLines.length).length} 条收录记录取得明确署名字段。仅保留元数据与单曲署名，不保存歌词或音频。采集有 ${log.failures.length} 个请求失败，详见 research/cashtrippy/collection-log.json；未绕过平台限制。封面与肖像缓存于 dist/assets，权利归相应权利人。\n`;
await writeFile('research/CASHTRIPPY-DISCOGRAPHY.md',report);
console.log(JSON.stringify({tracks:tracks.length,excluded:excludedRecords.length,albums:albums.length,core:coreIds.length,people:people.size,credits:tracks.filter(t=>t.creditLines.length).length,dates:[dates[0],dates.at(-1)]}));
