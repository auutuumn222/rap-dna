import {readFile,writeFile,access} from 'node:fs/promises';
const base='research/bobbynopeace',checkedAt='2026-10-31',primary='n48277407';
const read=async name=>JSON.parse(await readFile(`${base}/${name}.json`,'utf8'));
const pages=[];for(let offset=0;;offset+=100){const page=await read(`netease-songs-${offset}`);pages.push(page);if(!page.more)break;}
const returned=[...new Map(pages.flatMap(p=>p.songs).map(s=>[s.id,s])).values()];
const excludedIds=new Set();
const raw=returned;
const listed=(await read('netease-albums')).hotAlbums,details=await read('netease-album-details'),rawCredits=await read('netease-credits');
const apple=(await read('apple-albums-cn')).results.filter(a=>a.collectionId);
const normalize=s=>s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' '),date=ms=>Number(ms)>0?new Date(Number(ms)+28800000).toISOString().slice(0,10):'';
const people=new Map(),nameIndex=new Map();
for(const t of raw)for(const a of t.artists){const id='n'+a.id;if(!people.has(id))people.set(id,{id,name:a.name,kind:/^(Higher Brothers|更高兄弟|DIGI GHETTO|A Few Good Kids Records|成都集团|88rising)/i.test(a.name)?'collective':'person',source:String(a.id).startsWith('unlinked-')?`https://music.163.com/song?id=${t.id}`:`https://music.163.com/artist?id=${a.id}`});nameIndex.set(normalize(a.name),id);}
for(const [alias,name] of Object.entries({'Masiwei':'马思唯','馬思唯':'马思唯','Asen':'艾志恒Asen','A$en':'艾志恒Asen','艾志恒':'艾志恒Asen'}))if(nameIndex.has(normalize(name)))nameIndex.set(normalize(alias),nameIndex.get(normalize(name)));

function person(name,source=null){name=name.trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'').trim();const key=normalize(name);if(nameIndex.has(key))return nameIndex.get(key);const id='c'+Buffer.from(key).toString('base64url');people.set(id,{id,name,kind:source?'person':'credit',source});nameIndex.set(key,id);return id;}
function parseCredit(line,source){const at=line.search(/[:：]/);if(at<0)return [];const label=line.slice(0,at).trim(),value=line.slice(at+1).trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'');let roles=[label];if(/(?:混音|mix)/i.test(label)&&/(?:母带|master)/i.test(label))roles=['混音','母带'];else if(/^(?:混音|mix)/i.test(label))roles=['混音'];else if(/^(?:母带|master)/i.test(label))roles=['母带'];else if(/^(?:制作人|制作|prod)/i.test(label))roles=['制作人'];else if(/^(?:编曲|arrang)/i.test(label))roles=['编曲'];return roles.flatMap(role=>value.split(/\s*(?:\/|、|×|\s[xX]\s)\s*/).filter(Boolean).map(name=>({personId:person(name),role,raw:line,source,level:'track'})));}
const tracks=raw.map(s=>{const source=`https://music.163.com/song?id=${s.id}`,lines=rawCredits[s.id]?.lines||[];return {id:'n'+s.id,platformId:s.id,title:s.name,aliases:s.alias||[],albumId:s.album.id?'n'+s.album.id:'unknown-n'+s.id,date:date(s.album.publishTime),trackNumber:s.no||0,duration:s.duration,artistIds:[...new Set(s.artists.map(a=>'n'+a.id))],credits:lines.flatMap(l=>parseCredit(l,source)),creditLines:lines,source,sourceLabel:'网易云音乐',checkedAt,kind:/伴奏|instrumental/i.test(s.name)?'instrumental':/\blive\b|现场/i.test(s.name)?'live':/remix/i.test(s.name)?'remix':'recording',status:'platform',...(!s.album.id?{note:'平台返回的发行 ID 和发布日期为空，保留单曲记录；不把零时间戳解释为 1970 年发行。'}:{})};});
const coreIds=[397597058,274537222,249140275,180551695,166898307,156129365,146205465,137241068,128678815];
const earlyIds=[];
const allAlbums=new Map();for(const s of raw)if(s.album.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});
for(const [id,d] of Object.entries(details))if(allAlbums.has(Number(id)))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});
const albums=[...allAlbums.values()].map(a=>({id:'n'+a.id,title:a.name,date:date(a.publishTime),type:a.type||'发行',edition:a.subType||null,totalTracks:a.size||null,artistNames:a.artists?.map(p=>p.name).filter(Boolean)||[],label:a.company||null,artwork:`./assets/album-${a.id}.jpg`,artworkSource:a.picUrl,source:`https://music.163.com/album?id=${a.id}`,sourceLabel:'网易云音乐',checkedAt,core:coreIds.includes(a.id),chapter:coreIds.includes(a.id)?'个人项目':a.id===367807555?'团体项目':'合作与其他发行',trackIds:tracks.filter(t=>t.albumId==='n'+a.id).map(t=>t.id),listedOnArtist:listed.some(x=>x.id===a.id)}));
for(const t of tracks.filter(t=>!albums.some(a=>a.id===t.albumId)))albums.push({id:t.albumId,title:'发行待核',date:'',type:'待核',totalTracks:null,artistNames:[],artwork:'./assets/bobbynopeace-portrait.jpg',source:t.source,sourceLabel:'网易云音乐',checkedAt,core:false,chapter:'发行资料待核',trackIds:[t.id]});
const extras=[];
const matches={6768855776:146205465,1691246277:166898307,6810503623:397597058,6768779448:128678815,1880611539:363874348,6773334465:378341104,1748045431:197217655,1825347914:240873147};
const externalReleases=[];for(const country of ['cn','us'])for(const a of (await read(`apple-albums-${country}`)).results.filter(a=>a.collectionId))externalReleases.push({id:`a${a.collectionId}-${country}`,title:a.collectionName,date:a.releaseDate.slice(0,10),trackCount:a.trackCount,artist:a.artistName,source:a.collectionViewUrl,sourceLabel:`Apple Music（${country==='cn'?'中国':'美国'}区）`,checkedAt,relatedAlbumId:matches[a.collectionId]?'n'+matches[a.collectionId]:null,artwork:a.artworkUrl100});
const excludedRecords=[];
const identitySources=['https://music.163.com/artist?id=48277407','https://music.apple.com/cn/artist/1606883988'];
const gaps=[{title:'历史全量与同名账号',year:'历年',status:'待核',detail:'网易云两页返回169条且末页more=false，只代表本次公开目录。其他同名账号未核实，不合并。部分专辑详情不可用。',sources:identitySources.map(url=>({title:'平台艺人页',url}))}];
const discrepancies=[{title:'跨平台版本',detail:'已核对对应发行关联同一张专辑卡，各平台发行日期与曲目数量分别保留；罪冕网易云12首，Apple版本11首。作品记录含现场和合作，不等同独立原创歌曲数量。',sources:identitySources}];
const dates=tracks.map(t=>t.date).filter(Boolean).sort(),artist=(await read('netease-artist')).artist;
const catalog={schemaVersion:2,checkedAt,artist:{id:primary,name:'BOBBYNOPEACE',short:'BOBBYNOPEACE',aliases:['BOBBYNOPEACE','bobbynopeace'],portrait:'./assets/bobbynopeace-portrait.jpg',portraitSource:artist.img1v1Url,links:[{label:'网易云音乐',url:'https://music.163.com/artist?id=48277407'},{label:'Apple Music',url:'https://music.apple.com/cn/artist/1606883988'}]},coverage:{neteaseReported:pages[0].total,neteaseCollected:returned.length,neteaseIncluded:raw.length,neteaseExcluded:excludedRecords.length,neteaseHasMore:pages.at(-1).more,listedReleases:listed.length,associatedNeteaseReleases:allAlbums.size,appleComparedReleases:externalReleases.length,appleExtraTracks:extras.length,coreAlbums:coreIds.length,from:dates[0],through:dates.at(-1),historicallyComplete:false,description:`网易云两页 ${returned.length} 条，末页more=false；Apple Music对应发行关联同一专辑卡，历史全量尚未证明。当前有日期范围 ${dates[0]} 至 ${dates.at(-1)}。`},people:[...people.values()],albums:albums.sort((a,b)=>b.date.localeCompare(a.date)),tracks:tracks.sort((a,b)=>b.date.localeCompare(a.date)||a.trackNumber-b.trackNumber),externalReleases,excludedRecords,gaps,discrepancies};
for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
await writeFile('dist/catalog-bobbynopeace.json',JSON.stringify(catalog,null,2)+'\n');
const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');
let report=`# BOBBYNOPEACE 作品档案核查\n\n核查日期：${checkedAt}（北京时间）。\n\n${catalog.coverage.description}\n\n网易云艺人 ID 48277407；Apple Music 艺人 ID 1606883988。${listed.length} 个艺人页发行条目，${allAlbums.size} 个关联网易云发行容器；共 ${tracks.length} 条平台歌曲记录，包含版本，不等于独立原创总数。\n\n## 核心与早期项目\n\n|日期|发行|类别|平台总曲数|本人署名记录|来源|\n|---|---|---|---:|---:|---|\n`;
for(const a of [...albums].filter(a=>a.core||a.chapter==='早期项目'||a.chapter==='联合现场').sort((a,b)=>a.date.localeCompare(b.date)))report+=`|${a.date}|${pipe(a.title)}|${a.chapter}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
report+='\n## 差异与统计边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail} ${d.sources.map(s=>`[来源](${s})`).join(' ')}`).join('\n');
report+='\n\n## 待补资料\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail} ${g.sources.map(s=>`[${s.title}](${s.url})`).join(' ')}`).join('\n');
report+='\n\n## 身份待核记录（不计入作品与关系）\n\n'+excludedRecords.map(t=>`- [${t.title}](${t.source}) · ${t.album}`).join('\n');
report+='\n\n## 全部收录歌曲记录\n\n|发行日期|歌曲|发行|平台共同署名|来源|\n|---|---|---|---|---|\n';for(const t of [...catalog.tracks].reverse())report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albums.find(a=>a.id===t.albumId).title)}|${pipe(t.artistIds.map(id=>people.get(id).name).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
const log=await read('collection-log');report+=`\n## 采集与署名\n\n${tracks.filter(t=>t.creditLines.length).length} 条收录记录取得明确署名字段。仅保留元数据与单曲署名，不保存歌词或音频。采集有 ${log.failures.length} 个请求失败，详见 research/bobbynopeace/collection-log.json；未绕过平台限制。封面与肖像缓存于 dist/assets，权利归相应权利人。\n`;
await writeFile('research/BOBBYNOPEACE-DISCOGRAPHY.md',report);
console.log(JSON.stringify({tracks:tracks.length,excluded:excludedRecords.length,albums:albums.length,core:coreIds.length,people:people.size,credits:tracks.filter(t=>t.creditLines.length).length,dates:[dates[0],dates.at(-1)]}));
