import {readFile,writeFile,access} from 'node:fs/promises';
const base='research/lianma',checkedAt='2026-10-29',primary='n12064019';
const read=async name=>JSON.parse(await readFile(`${base}/${name}.json`,'utf8'));
const pages=await Promise.all([0,100].map(n=>read(`netease-songs-${n}`)));
const returned=[...new Map(pages.flatMap(p=>p.songs).map(s=>[s.id,s])).values()];
const excludedIds=new Set();
const supplements=await read('netease-supplemental');
const raw=[...returned,...supplements.songs].map(s=>({...s,artists:s.artists.map(a=>a.id?a:{...a,id:a.name==='连麻Swimming'?12064019:'unlinked-'+Buffer.from(a.name).toString('base64url')})}));
const listed=(await read('netease-albums')).hotAlbums,details=await read('netease-album-details'),rawCredits=await read('netease-credits');
const apple=(await read('apple-albums-cn')).results.filter(a=>a.collectionId),appleData=(await read('apple-tracks-us')).results;
const normalize=s=>s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' '),date=ms=>Number(ms)>0?new Date(Number(ms)+28800000).toISOString().slice(0,10):'';
const people=new Map(),nameIndex=new Map();
for(const t of raw)for(const a of t.artists){const id='n'+a.id;if(!people.has(id))people.set(id,{id,name:a.name,kind:/^(Higher Brothers|更高兄弟|DIGI GHETTO|A Few Good Kids Records|成都集团|88rising)/i.test(a.name)?'collective':'person',source:String(a.id).startsWith('unlinked-')?`https://music.163.com/song?id=${t.id}`:`https://music.163.com/artist?id=${a.id}`});nameIndex.set(normalize(a.name),id);}
for(const [alias,name] of Object.entries({'Masiwei':'马思唯','馬思唯':'马思唯','Asen':'艾志恒Asen','A$en':'艾志恒Asen','艾志恒':'艾志恒Asen'}))if(nameIndex.has(normalize(name)))nameIndex.set(normalize(alias),nameIndex.get(normalize(name)));
function person(name,source=null){name=name.trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'').trim();const key=normalize(name);if(nameIndex.has(key))return nameIndex.get(key);const id='c'+Buffer.from(key).toString('base64url');people.set(id,{id,name,kind:source?'person':'credit',source});nameIndex.set(key,id);return id;}
function parseCredit(line,source){const at=line.search(/[:：]/);if(at<0)return [];const label=line.slice(0,at).trim(),value=line.slice(at+1).trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'');let roles=[label];if(/(?:混音|mix)/i.test(label)&&/(?:母带|master)/i.test(label))roles=['混音','母带'];else if(/^(?:混音|mix)/i.test(label))roles=['混音'];else if(/^(?:母带|master)/i.test(label))roles=['母带'];else if(/^(?:制作人|制作|prod)/i.test(label))roles=['制作人'];else if(/^(?:编曲|arrang)/i.test(label))roles=['编曲'];return roles.flatMap(role=>value.split(/\s*(?:\/|、|×|\s[xX]\s)\s*/).filter(Boolean).map(name=>({personId:person(name),role,raw:line,source,level:'track'})));}
const tracks=raw.map(s=>{const source=`https://music.163.com/song?id=${s.id}`,lines=rawCredits[s.id]?.lines||[];return {id:'n'+s.id,platformId:s.id,title:s.name,aliases:s.alias||[],albumId:s.album.id?'n'+s.album.id:'unknown-n'+s.id,date:date(s.album.publishTime),trackNumber:s.no||0,duration:s.duration,artistIds:[...new Set(s.artists.map(a=>'n'+a.id))],credits:lines.flatMap(l=>parseCredit(l,source)),creditLines:lines,source,sourceLabel:'网易云音乐',checkedAt,kind:/伴奏|instrumental/i.test(s.name)?'instrumental':/\blive\b|现场/i.test(s.name)?'live':/remix/i.test(s.name)?'remix':'recording',status:'platform',...(supplements.songs.some(x=>x.id===s.id)?{note:'CHUNGHWA 官方发行页逐曲艺人名明确署名连麻Swimming；原始艺人 ID 为 0，按该发行页字段归入本人。',artistEvidence:s.artists.map(a=>({personId:'n'+a.id,source,field:'网易云官方发行页逐曲 artists.name'}))}:{}),...(!s.album.id?{note:'平台返回的发行 ID 和发布日期为空，保留单曲记录；不把零时间戳解释为 1970 年发行。'}:{})};});
const coreIds=[35879652,79018776,94513292,131027226,156434952,195875404,404975764];
const earlyIds=[35879652];
const allAlbums=new Map();for(const s of raw)if(s.album.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});
for(const [id,d] of Object.entries(details))if(allAlbums.has(Number(id)))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});
const albums=[...allAlbums.values()].map(a=>({id:'n'+a.id,title:a.name,date:date(a.publishTime),type:a.type||'发行',edition:a.subType||null,totalTracks:a.size||null,artistNames:a.artists?.map(p=>p.name).filter(Boolean)||[],label:a.company||null,artwork:`./assets/album-${a.id}.jpg`,artworkSource:a.picUrl,source:`https://music.163.com/album?id=${a.id}`,sourceLabel:'网易云音乐',checkedAt,core:coreIds.includes(a.id),chapter:coreIds.includes(a.id)?'个人项目':a.id===276535300?'联合现场':earlyIds.includes(a.id)?'早期项目':'合作与其他发行',trackIds:tracks.filter(t=>t.albumId==='n'+a.id).map(t=>t.id),listedOnArtist:listed.some(x=>x.id===a.id)}));
// Only explicit unmatched collaboration records are added; producer/feature suffixes are not a new song.
const extras=[{id:1637582936,names:['连麻Swimming']},{id:1770060102,names:['连麻Swimming']}];
for(const extra of extras){
 const t=appleData.find(x=>x.trackId===extra.id),a=appleData.find(x=>x.wrapperType==='collection'&&x.collectionId===t?.collectionId);if(!t||!a)throw Error('Missing Apple extra '+extra.id);
 const source=t.trackViewUrl,artistIds=extra.names.map(name=>name==='连麻Swimming'?primary:person(name,source));
 tracks.push({id:'a'+t.trackId,platformId:t.trackId,title:t.trackName,aliases:[],albumId:'a'+t.collectionId,date:t.releaseDate.slice(0,10),trackNumber:t.trackNumber||1,duration:t.trackTimeMillis,artistIds,artistEvidence:artistIds.map(personId=>({personId,source,field:'Apple artistName'})),credits:[],creditLines:[],source,sourceLabel:'Apple Music（美国区）',checkedAt,kind:'recording',status:'platform',note:'Apple Music 明确署名的合作记录，当前网易云艺人分页未匹配到同名记录；不据此断言网易云没有此作品。未核实的跨平台别名保持独立。'});
 albums.push({id:'a'+a.collectionId,title:a.collectionName.replace(/ - Single$/,''),date:a.releaseDate.slice(0,10),type:'Single',totalTracks:a.trackCount,artistNames:extra.names,label:null,artwork:`./assets/apple-album-${a.collectionId}.jpg`,artworkSource:a.artworkUrl100,source:a.collectionViewUrl,sourceLabel:'Apple Music（美国区）',checkedAt,core:false,chapter:'跨平台补充',trackIds:['a'+t.trackId],listedOnArtist:false});
}
const matches={1747233791:195875404,1798560363:187488534,1826030694:149366080,1625181838:144861206};
const externalReleases=[];for(const country of ['cn','us'])for(const a of (await read(`apple-albums-${country}`)).results.filter(a=>a.collectionId))externalReleases.push({id:`a${a.collectionId}-${country}`,title:a.collectionName,date:a.releaseDate.slice(0,10),trackCount:a.trackCount,artist:a.artistName,source:a.collectionViewUrl,sourceLabel:`Apple Music（${country==='cn'?'中国':'美国'}区）`,checkedAt,relatedAlbumId:matches[a.collectionId]?'n'+matches[a.collectionId]:null,artwork:a.artworkUrl100});
const excludedRecords=returned.filter(s=>excludedIds.has(s.id)).map(s=>({id:'n'+s.id,title:s.name,album:s.album.name,source:`https://music.163.com/song?id=${s.id}`,reason:'原发行署名 Sasi，身份关联未证实；不计入作品及关系统计。'}));
const identitySources=['https://music.163.com/artist?id=12064019'];
const gaps=[
 {title:'早期项目的身份与曲单',year:'2017–2021',status:'保留原字段差异',detail:'Wake Up 总曲数为 5，主账号分页仅返回 4 条；同名单曲艺人栏为复合账号“连麻Swimming;RZ”，身份尚未拆分，不加入个人关系网。CHUNGHWA 的 8 条歌曲艺人 ID 为 0，但本人发行页逐曲艺人名明确写作连麻Swimming，按原字段证据补入；其他零 ID 署名不与已有账号自动合并。',sources:[{title:'Wake Up',url:'https://music.163.com/album?id=35879652'},{title:'CHUNGHWA',url:'https://music.163.com/album?id=131027226'}]},
 {title:'历史全量与同名账号',year:'历年',status:'历史全量未证明',detail:'主账号 12064019 已读至 more=false；搜索另有同名账号 96539322，身份未证实，不自动合并。早期下架、视频及未正式发行内容仍待原始证据，五人组成员身份不替代逐曲参与证据。',sources:[{title:'网易云艺人页',url:identitySources[0]}]},
 {title:'详情请求与 Apple 曲单',year:'当前',status:'平台返回限制',detail:'部分网易云发行详情返回 -462；保留艺人发行列表与歌曲分页，不绕过访问限制。Apple 部分发行仅返回发行元数据、未返回逐曲记录，保留发行对照，不声称取得全量曲单。',sources:[{title:'Apple Music',url:'https://music.apple.com/cn/artist/1577300746'}]}
];
const discrepancies=[
 {title:'分页记录与发行页补充',detail:'网易云主账号分页 158 条；CHUNGHWA 发行页补充 8 条本人明确署名但 ID 为零的歌曲，共 166 条网易云记录。另补比心、My Universe 两条 Apple Music 记录，歌曲数包含版本和重复发行。',sources:[identitySources[0],'https://music.163.com/album?id=131027226']},
 {title:'时间与地区版本',detail:'网易云时间戳统一按北京时间处理，斩鸭线为 2026-10-24。Apple 中国和美国区发行分别保留，平台发行日期不等于首次创作或出道时间。标题、制作后缀和客串名差异不自动视为新作品。',sources:[identitySources[0],'https://music.apple.com/cn/artist/1577300746']},
 {title:'合作与幕后署名',detail:'平台艺人栏形成共同署名关系；制作、编曲、混音、母带仅来自单曲明确署名。不从标题的 Prod. 字样推断角色，不将专辑级署名下放到每首歌。SASI、Sasi 等未核验名称保持独立。',sources:[identitySources[0]]}
];
const dates=tracks.map(t=>t.date).filter(Boolean).sort(),artist=(await read('netease-artist')).artist;
const catalog={schemaVersion:2,checkedAt,artist:{id:primary,name:'连麻Swimming',short:'连麻',aliases:['连麻Swimming','连麻','連麻','连麻swimming'],portrait:'./assets/lianma-portrait.jpg',portraitSource:artist.img1v1Url,links:[{label:'网易云音乐',url:'https://music.163.com/artist?id=12064019'},{label:'Apple Music',url:'https://music.apple.com/cn/artist/1577300746'}]},coverage:{neteaseReported:pages[0].total,neteaseCollected:returned.length,neteaseIncluded:raw.length,neteaseSupplemental:supplements.songs.length,neteaseExcluded:excludedRecords.length,neteaseHasMore:pages.at(-1).more,listedReleases:listed.length,associatedNeteaseReleases:allAlbums.size,appleComparedReleases:externalReleases.length,appleExtraTracks:extras.length,coreAlbums:coreIds.length,from:dates[0],through:dates.at(-1),historicallyComplete:false,description:`网易云全部分页取得 ${returned.length} 条，发行页补入 ${supplements.songs.length} 条本人明确署名，另补 ${extras.length} 条 Apple Music 记录。当前有日期的范围 ${dates[0]} 至 ${dates.at(-1)}；Wake Up 的复合艺人账号待核，不宣称历史全量。`},people:[...people.values()],albums:albums.sort((a,b)=>b.date.localeCompare(a.date)),tracks:tracks.sort((a,b)=>b.date.localeCompare(a.date)||a.trackNumber-b.trackNumber),externalReleases,excludedRecords,gaps,discrepancies};
for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
await writeFile('dist/catalog-lianma.json',JSON.stringify(catalog,null,2)+'\n');
const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');
let report=`# 连麻Swimming 作品档案核查\n\n核查日期：${checkedAt}（北京时间）。\n\n${catalog.coverage.description}\n\n网易云艺人 ID 12064019；Apple Music 艺人 ID 1577300746。${listed.length} 个艺人页发行条目，${allAlbums.size} 个关联网易云发行容器；共 ${tracks.length} 条平台歌曲记录，包含版本，不等于独立原创总数。\n\n## 核心与早期项目\n\n|日期|发行|类别|平台总曲数|本人署名记录|来源|\n|---|---|---|---:|---:|---|\n`;
for(const a of [...albums].filter(a=>a.core||a.chapter==='早期项目'||a.chapter==='联合现场').sort((a,b)=>a.date.localeCompare(b.date)))report+=`|${a.date}|${pipe(a.title)}|${a.chapter}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
report+='\n## 差异与统计边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail} ${d.sources.map(s=>`[来源](${s})`).join(' ')}`).join('\n');
report+='\n\n## 待补资料\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail} ${g.sources.map(s=>`[${s.title}](${s.url})`).join(' ')}`).join('\n');
report+='\n\n## 身份待核记录（不计入作品与关系）\n\n'+excludedRecords.map(t=>`- [${t.title}](${t.source}) · ${t.album}`).join('\n');
report+='\n\n## 全部收录歌曲记录\n\n|发行日期|歌曲|发行|平台共同署名|来源|\n|---|---|---|---|---|\n';for(const t of [...catalog.tracks].reverse())report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albums.find(a=>a.id===t.albumId).title)}|${pipe(t.artistIds.map(id=>people.get(id).name).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
const log=await read('collection-log');report+=`\n## 采集与署名\n\n${tracks.filter(t=>t.creditLines.length).length} 条收录记录取得明确署名字段。仅保留元数据与单曲署名，不保存歌词或音频。采集有 ${log.failures.length} 个请求失败，详见 research/lianma/collection-log.json；未绕过平台限制。封面与肖像缓存于 dist/assets，权利归相应权利人。\n`;
await writeFile('research/LIANMA-DISCOGRAPHY.md',report);
console.log(JSON.stringify({tracks:tracks.length,excluded:excludedRecords.length,albums:albums.length,core:coreIds.length,people:people.size,credits:tracks.filter(t=>t.creditLines.length).length,dates:[dates[0],dates.at(-1)]}));
