import {readFile,writeFile,access} from 'node:fs/promises';
const base='research/capper',checkedAt='2026-10-29',primary='n12193174';
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
const coreIds=[138207036,160890405,242852408,352728713,382412149];
const earlyIds=[81507826,84825059,86757916,87548367,94079450,98020484,122950249];
const allAlbums=new Map();for(const s of raw)if(s.album.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});
for(const [id,d] of Object.entries(details))if(allAlbums.has(Number(id)))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});
const albums=[...allAlbums.values()].map(a=>({id:'n'+a.id,title:a.name,date:date(a.publishTime),type:a.type||'发行',edition:a.subType||null,totalTracks:a.size||null,artistNames:a.artists?.map(p=>p.name).filter(Boolean)||[],label:a.company||null,artwork:`./assets/album-${a.id}.jpg`,artworkSource:a.picUrl,source:`https://music.163.com/album?id=${a.id}`,sourceLabel:'网易云音乐',checkedAt,core:coreIds.includes(a.id),chapter:a.id===382412149?'联合项目':coreIds.includes(a.id)?'个人项目':earlyIds.includes(a.id)?'早期项目':'合作与其他发行',trackIds:tracks.filter(t=>t.albumId==='n'+a.id).map(t=>t.id),listedOnArtist:listed.some(x=>x.id===a.id)}));
const appleData=(await read('apple-tracks-us')).results;
const extraAlbum=appleData.find(a=>a.wrapperType==='collection'&&a.collectionId===1797157422);
for(const id of [1797157424,1797157427]){
 const t=appleData.find(t=>t.trackId===id);if(!t||t.artistId!==1574279636)throw Error('Missing exact Apple extra identity');
 tracks.push({id:'a'+id,platformId:id,title:t.trackName,aliases:[],albumId:'a'+t.collectionId,date:t.releaseDate.slice(0,10),trackNumber:t.trackNumber,duration:t.trackTimeMillis,artistIds:[primary],artistEvidence:[{personId:primary,source:t.trackViewUrl,field:'Apple artistId 1574279636 / artistName Capper'}],credits:[],creditLines:[],source:t.trackViewUrl,sourceLabel:'Apple Music（美国区）',checkedAt,kind:/伴奏/.test(t.trackName)?'instrumental':'recording',status:'platform',note:'当前网易云主账号分页未匹配到的 Apple 明确署名记录。单曲平台日期为 2021-10-18，所在发行容器日期为 2022-06-06，分别保留。'});
}
albums.push({id:'a'+extraAlbum.collectionId,title:extraAlbum.collectionName.replace(/ - Single$/,''),date:extraAlbum.releaseDate.slice(0,10),type:'Single',totalTracks:extraAlbum.trackCount,artistNames:['Capper'],label:extraAlbum.copyright,artwork:'./assets/apple-album-1797157422.jpg',artworkSource:extraAlbum.artworkUrl100,source:extraAlbum.collectionViewUrl,sourceLabel:'Apple Music（美国区）',checkedAt,core:false,chapter:'跨平台补充',trackIds:['a1797157424','a1797157427'],listedOnArtist:false});
const matches={1611294039:'n138207036',1674696613:'n160890405',1761029019:'n242852408',1857699778:'n352728713',6797466085:'n382412149',1645020359:'n150574403',1631511784:'n139198022',1787122136:'n257743488',1696868883:'n167663804',1774636228:'n251380985',1688245417:'n165869217',1656913836:'n155720530',1711492771:'n176696238',1813795831:'n146622678',1625808765:'n144552247',1625817375:'n144552247',1823183340:'n273729605',1797157422:'a1797157422'};
const externalReleases=[];
for(const country of ['cn','us'])for(const a of (await read(`apple-albums-${country}`)).results.filter(a=>a.collectionId))externalReleases.push({id:`a${a.collectionId}-${country}`,title:a.collectionName,date:a.releaseDate.slice(0,10),trackCount:a.trackCount,artist:a.artistName,source:a.collectionViewUrl,sourceLabel:`Apple Music（${country==='cn'?'中国':'美国'}区）`,checkedAt,relatedAlbumId:matches[a.collectionId]||null,artwork:a.artworkUrl100});
const artist=(await read('netease-artist')).artist,dates=tracks.map(t=>t.date).filter(Boolean).sort();
const source='https://music.163.com/artist?id=12193174',appleSource='https://music.apple.com/cn/artist/1574279636';
const gaps=[
 {title:'早期、下架与视频作品',status:'历史全量未证明',detail:'主账号两页已读至 more=false，仅说明当次公开目录已读完。早期下架、视频及非正式发行仍待原始资料；同名 Capper、Cäpper 及其他账号不自动合并。',sources:[{title:'网易云主账号',url:source},{title:'Apple Music 已核对账号',url:appleSource}]},
 {title:'Apple 地区与曲单限制',status:'缺失曲单单独保留',detail:'Apple 中国 / 美国区分别返回 22 / 22 项发行，中国区另有《终章 Final Chapter》地区容器，美国区另有 NPC 合作版本。中国区歌曲接口未返回歌曲；美国区取得 103 条。你呢、一日明星、MISTAKE 的 Apple 容器未返回逐曲字段，不按容器推断参与关系；这些作品的网易云明确署名记录已保留。',sources:[{title:'Apple Music',url:appleSource}]},
 {title:'部分网易云发行详情受限',status:'记录失败',detail:'部分发行详情返回 API -462，使用已取得的歌曲分页和艺人发行列表字段；未取得的整张曲单及制作角色不猜测补入。采集失败保存在 collection-log.json，不绕过平台限制。',sources:[{title:'网易云音乐',url:source}]}
];
const cnCount=externalReleases.filter(a=>a.sourceLabel.includes('中国')).length,usCount=externalReleases.length-cnCount;
gaps[1].detail=gaps[1].detail.replace('22 / 22',`${cnCount} / ${usCount}`);
const discrepancies=[
 {title:'个人项目与合作方专辑',detail:'主线包含 4 张个人专辑与 1 张联合 EP：剑，蔷薇、Uniconfication、P.I.G.、槍火天使、子弹与花期，分别收录 22 / 14 / 23 / 20 / 7 条。STUPID HIGH、We BeëN OutSidé、红秩序等仅列有 Capper 明确逐曲署名的歌曲，不收整张合作方专辑。',sources:coreIds.map(id=>`https://music.163.com/album?id=${id}`)},
 {title:'单曲、现场与伴奏分别保留',detail:'唉 Sigh、纵容、无人区玫瑰等不同网易云 ID 作为各自的平台记录保留。现场、伴奏及 Remix 独立分类；统计包含版本，不等于独立原创总数。节目汇演条目使用原平台艺人栏，不将其解释为每个艺人演唱了每一段。',sources:[source]},
 {title:'终章的跨平台补充及日期差异',detail:'Apple 明确署名 Capper 的《终章 Final Chapter》及伴奏 2 条，未在当前网易云主账号分页匹配到，作为补充收录。Apple 单曲日期 2021-10-18，发行容器日期 2022-06-06；CN 另一个发行 ID 保留为地区记录，不复制歌曲。',sources:['https://music.apple.com/us/album/1797157422','https://music.apple.com/cn/album/1764228849']},
 {title:'跨平台曲名和署名差异',detail:'底牌对应 hole cards，雪 Distance 与 Distance Remix 分别保留。NPC 的 Apple 英文标题 Whatchu Know Bout Npc 与网易云 NPC 的日期及署名对应，但时长不同（195665 / 198400 毫秒），保留为版本待核对照，未重复补入；Apple 的 Peanuts / 花生、Yan Luo / 罗言等名称不据字面自动建立新关系。美国区未返回的曲目不宣称已核对。',sources:[appleSource,source]}
];
const catalog={schemaVersion:2,checkedAt,artist:{id:primary,name:'Capper',short:'Capper',aliases:['Capper'],portrait:'./assets/capper-portrait.jpg',portraitSource:artist.img1v1Url,links:[{label:'网易云音乐',url:source},{label:'Apple Music',url:appleSource}]},coverage:{neteaseReported:pages[0].total,neteaseCollected:returned.length,neteaseIncluded:raw.length,neteaseExcluded:0,neteaseHasMore:pages.at(-1).more,listedReleases:listed.length,associatedNeteaseReleases:allAlbums.size,appleComparedReleases:externalReleases.length,appleExtraTracks:2,coreAlbums:coreIds.length,from:dates[0],through:dates.at(-1),historicallyComplete:false,description:`网易云主账号两页取得 ${raw.length} 条歌曲记录，末页 more=false；${listed.length} 个艺人页发行条目、${allAlbums.size} 个关联网易云发行容器。另补 Apple《终章》及伴奏 2 条，共 ${tracks.length} 条。4 张个人专辑与 1 张联合 EP 逐曲收录，Apple 中国 / 美国区 ${cnCount} / ${usCount} 项地区发行分别保留。`},people:[...people.values()],albums:albums.sort((a,b)=>b.date.localeCompare(a.date)),tracks:tracks.sort((a,b)=>b.date.localeCompare(a.date)||a.trackNumber-b.trackNumber),externalReleases,excludedRecords:[],gaps,discrepancies};
for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
await writeFile('dist/catalog-capper.json',JSON.stringify(catalog,null,2)+'\n');
const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');
let report=`# Capper 作品档案核查\n\n核查日期：${checkedAt}（北京时间）。\n\n${catalog.coverage.description}\n\n网易云艺人 ID 12193174；Apple Music 艺人 ID 1574279636。有日期的收录范围 ${dates[0]} 至 ${dates.at(-1)}，不等于出道时间或历史全量。\n\n## 主线项目\n\n|日期|发行|类别|平台总曲数|本人署名记录|来源|\n|---|---|---|---:|---:|---|\n`;
for(const a of [...albums].filter(a=>a.core).sort((a,b)=>a.date.localeCompare(b.date)))report+=`|${a.date}|${pipe(a.title)}|${a.type}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
report+='\n## 差异及统计边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail} ${d.sources.map(s=>`[来源](${s})`).join(' ')}`).join('\n');
report+='\n\n## 待补资料\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail} ${g.sources.map(s=>`[${s.title}](${s.url})`).join(' ')}`).join('\n');
report+='\n\n## 全部收录歌曲记录\n\n|歌曲平台日期|歌曲|发行|平台共同署名|来源|\n|---|---|---|---|---|\n';
for(const t of [...catalog.tracks].reverse())report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albums.find(a=>a.id===t.albumId).title)}|${pipe(t.artistIds.map(id=>people.get(id).name).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
const log=await read('collection-log');report+=`\n## 采集与署名\n\n${tracks.filter(t=>t.creditLines.length).length} 条取得明确单曲署名。只保留元数据和署名，不保存歌词或音频。日志记录 ${log.failures.length} 个失败请求，详见 research/capper/collection-log.json。封面与肖像本地缓存，权利归相应权利人。\n`;
await writeFile('research/CAPPER-DISCOGRAPHY.md',report);
console.log(JSON.stringify({tracks:tracks.length,albums:albums.length,core:coreIds.length,people:people.size,credits:tracks.filter(t=>t.creditLines.length).length,dates:[dates[0],dates.at(-1)],regions:[cnCount,usCount]}));
