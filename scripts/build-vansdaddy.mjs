import {readFile,writeFile,access} from 'node:fs/promises';
const base='research/vansdaddy',checkedAt='2026-10-29',primary='n35009085';
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

nameIndex.set(normalize('VD'),primary);
function person(name,source=null){name=name.trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'').trim();const key=normalize(name);if(nameIndex.has(key))return nameIndex.get(key);const id='c'+Buffer.from(key).toString('base64url');people.set(id,{id,name,kind:source?'person':'credit',source});nameIndex.set(key,id);return id;}
function parseCredit(line,source){const at=line.search(/[:：]/);if(at<0)return [];const label=line.slice(0,at).trim(),value=line.slice(at+1).trim().replace(/\s*@.*$/,'').replace(/\s+at SING Mastering.*$/i,'');let roles=[label];if(/(?:混音|mix)/i.test(label)&&/(?:母带|master)/i.test(label))roles=['混音','母带'];else if(/^(?:混音|mix)/i.test(label))roles=['混音'];else if(/^(?:母带|master)/i.test(label))roles=['母带'];else if(/^(?:制作人|制作|prod)/i.test(label))roles=['制作人'];else if(/^(?:编曲|arrang)/i.test(label))roles=['编曲'];return roles.flatMap(role=>value.split(/\s*(?:[／/]|、|×|\s[xX]\s)\s*/).filter(Boolean).map(name=>({personId:person(name),role,raw:line,source,level:'track'})));}
const tracks=raw.map(s=>{const source=`https://music.163.com/song?id=${s.id}`,lines=rawCredits[s.id]?.lines||[];return {id:'n'+s.id,platformId:s.id,title:s.name,aliases:s.alias||[],albumId:s.album.id?'n'+s.album.id:'unknown-n'+s.id,date:date(s.album.publishTime),trackNumber:s.no||0,duration:s.duration,artistIds:[...new Set(s.artists.map(a=>'n'+a.id))],credits:lines.flatMap(l=>parseCredit(l,source)),creditLines:lines,source,sourceLabel:'网易云音乐',checkedAt,kind:/伴奏|instrumental/i.test(s.name)?'instrumental':/\blive\b|现场/i.test(s.name)?'live':/remix/i.test(s.name)?'remix':'recording',status:'platform',...(!s.album.id?{note:'平台返回的发行 ID 和发布日期为空，保留单曲记录；不把零时间戳解释为 1970 年发行。'}:{})};});
const coreIds=[142302499,162410338,172333702,198572467,257047763,351117737,380120244];
const earlyIds=[];
const allAlbums=new Map();for(const s of raw)if(s.album.id&&!allAlbums.has(s.album.id))allAlbums.set(s.album.id,s.album);
for(const a of listed)allAlbums.set(a.id,{...allAlbums.get(a.id),...a});
for(const [id,d] of Object.entries(details))if(allAlbums.has(Number(id)))allAlbums.set(Number(id),{...allAlbums.get(Number(id)),...d.album});
const albums=[...allAlbums.values()].map(a=>({id:'n'+a.id,title:a.name,date:date(a.publishTime),type:a.type||'发行',edition:a.subType||null,totalTracks:a.size||null,artistNames:a.artists?.map(p=>p.name).filter(Boolean)||[],label:a.company||null,artwork:`./assets/album-${a.id}.jpg`,artworkSource:a.picUrl,source:`https://music.163.com/album?id=${a.id}`,sourceLabel:'网易云音乐',checkedAt,core:coreIds.includes(a.id),chapter:[198572467,257047763,351117737,380120244].includes(a.id)?'联合项目':coreIds.includes(a.id)?'个人项目':[151704880,397199509].includes(a.id)?'团体项目':'合作与其他发行',trackIds:tracks.filter(t=>t.albumId==='n'+a.id).map(t=>t.id),listedOnArtist:listed.some(x=>x.id===a.id)}));
const extras=[];
const matches={6777001436:380120244,1882691310:364806481,1707345773:156963450,1794535182:261932388,1841296038:277900099};
const externalReleases=[];for(const country of ['cn','us'])for(const a of (await read(`apple-albums-${country}`)).results.filter(a=>a.collectionId))externalReleases.push({id:`a${a.collectionId}-${country}`,title:a.collectionName,date:a.releaseDate.slice(0,10),trackCount:a.trackCount,artist:a.artistName,source:a.collectionViewUrl,sourceLabel:`Apple Music（${country==='cn'?'中国':'美国'}区）`,checkedAt,relatedAlbumId:matches[a.collectionId]?'n'+matches[a.collectionId]:null,artwork:a.artworkUrl100});
const excludedRecords=[];
const identitySources=['https://music.163.com/artist?id=35009085','https://music.apple.com/cn/artist/1654111268'];
const gaps=[
 {title:'团体发行与个人参与范围',year:'2022–2026',status:'保留部分曲单',detail:'Candytape2022 总曲单 16 条，本人分页返回 13 条；Candytape2 总曲单 17 条，本人返回 12 条。发行艺人栏还有 Monovisa、KITO、李文、叶轩池等其他成员，不把整张团体发行算作个人作品；详情受限时不推断缺少曲目的署名。',sources:[151704880,397199509].map(id=>({title:'网易云发行 '+id,url:`https://music.163.com/album?id=${id}`}))},
 {title:'早期与下架资料',year:'历年',status:'历史全量未证明',detail:'主账号两页返回 157 条，末页 more=false，只说明当次公开分页读完。早期、下架与视频发行尚需原始清单，平台时间跨度不等于出道或首次创作时间。',sources:[{title:'网易云艺人页',url:identitySources[0]}]},
 {title:'Apple 地区署名冲突与同名账号',year:'当前',status:'保留差异，不合并身份',detail:'Apple 中国区艺人 ID 1654111268 的发行显示 Vansdaddy；美国区多个相同发行 ID 和两条歌曲记录却显示硫克男孩Ryukboi。不能据此把两位音乐人当作别名，Apple 数据仅作地区发行对照，不生成关系或额外歌曲。另一个同名账号 1819308208 未返回发行，单独保存候选快照。',sources:[{title:'Apple 中国区',url:identitySources[1]},{title:'Apple 美国区',url:'https://music.apple.com/us/artist/1654111268'},{title:'同名候选',url:'https://music.apple.com/cn/artist/1819308208'}]}
];
const discrepancies=[
 {title:'目录统计与作品范围',detail:'网易云两页共 157 条平台记录，含现场、重复发行与版本，不等于 157 首独立原创。7 个核心个人或联合项目的本人署名记录均达到当前平台总曲数；两个 Candytape 团体发行保留各自 13/16、12/17 的参与范围。',sources:[identitySources[0]]},
 {title:'联合发行署名不下放到单曲',detail:'牛窝坑之子、牛窝坑秋冬随笔2024、都市醉漢、都市醉漢春日随笔2026 的发行艺人栏包含 LusciousBB；关系网仍由各首歌的艺人栏及明确制作字段生成，不从专辑联合署名推断每首角色。其他人的专辑也只收本人逐曲参与的歌曲。',sources:[198572467,257047763,351117737,380120244].map(id=>`https://music.163.com/album?id=${id}`)},
 {title:'跨平台地区信息与署名证据',detail:'Apple 中国/美国区分别 4/5 项发行，共 9 项地区记录，不等于 9 张不同发行。地区艺人名冲突原样保留并标注；制作、编曲、混音和母带来自明确单曲字段，不从标题 Prod. 推断。网易云日期按北京时间显示。',sources:identitySources}
];
const dates=tracks.map(t=>t.date).filter(Boolean).sort(),artist=(await read('netease-artist')).artist;
const catalog={schemaVersion:2,checkedAt,artist:{id:primary,name:'Vansdaddy',short:'Vansdaddy',aliases:['Vansdaddy','VANSDADDY','VD'],portrait:'./assets/vansdaddy-portrait.jpg',portraitSource:artist.img1v1Url,links:[{label:'网易云音乐',url:'https://music.163.com/artist?id=35009085'},{label:'Apple Music',url:'https://music.apple.com/cn/artist/1654111268'}]},coverage:{neteaseReported:pages[0].total,neteaseCollected:returned.length,neteaseIncluded:raw.length,neteaseExcluded:excludedRecords.length,neteaseHasMore:pages.at(-1).more,listedReleases:listed.length,associatedNeteaseReleases:allAlbums.size,appleComparedReleases:externalReleases.length,appleExtraTracks:extras.length,coreAlbums:coreIds.length,from:dates[0],through:dates.at(-1),historicallyComplete:false,description:`网易云完整两页取得 ${returned.length} 条歌曲记录，末页 more=false；7 个核心个人或联合项目当前曲单完整，两个 Candytape 团体发行只按本人逐曲署名收录。当前有日期范围 ${dates[0]} 至 ${dates.at(-1)}；Apple 地区艺人名冲突保留说明，不宣称历史全量。`},people:[...people.values()],albums:albums.sort((a,b)=>b.date.localeCompare(a.date)),tracks:tracks.sort((a,b)=>b.date.localeCompare(a.date)||a.trackNumber-b.trackNumber),externalReleases,excludedRecords,gaps,discrepancies};
for(const a of catalog.albums)await access(new URL('../dist/'+a.artwork.slice(2),import.meta.url));
await access(new URL('../dist/'+catalog.artist.portrait.slice(2),import.meta.url));
await writeFile('dist/catalog-vansdaddy.json',JSON.stringify(catalog,null,2)+'\n');
const pipe=s=>String(s??'').replace(/\|/g,'/').replace(/\n/g,' ');
let report=`# Vansdaddy 作品档案核查\n\n核查日期：${checkedAt}（北京时间）。\n\n${catalog.coverage.description}\n\n网易云艺人 ID 35009085；Apple Music 艺人 ID 1654111268。${listed.length} 个艺人页发行条目，${allAlbums.size} 个关联网易云发行容器；共 ${tracks.length} 条平台歌曲记录，包含版本，不等于独立原创总数。\n\n## 核心与早期项目\n\n|日期|发行|类别|平台总曲数|本人署名记录|来源|\n|---|---|---|---:|---:|---|\n`;
for(const a of [...albums].filter(a=>a.core||a.chapter==='团体项目').sort((a,b)=>a.date.localeCompare(b.date)))report+=`|${a.date}|${pipe(a.title)}|${a.chapter}|${a.totalTracks}|${a.trackIds.length}|[来源](${a.source})|\n`;
report+='\n## 差异与统计边界\n\n'+discrepancies.map(d=>`- **${d.title}**：${d.detail} ${d.sources.map(s=>`[来源](${s})`).join(' ')}`).join('\n');
report+='\n\n## 待补资料\n\n'+gaps.map(g=>`- **${g.title}**：${g.detail} ${g.sources.map(s=>`[${s.title}](${s.url})`).join(' ')}`).join('\n');
report+='\n\n## 身份待核记录（不计入作品与关系）\n\n'+excludedRecords.map(t=>`- [${t.title}](${t.source}) · ${t.album}`).join('\n');
report+='\n\n## 全部收录歌曲记录\n\n|发行日期|歌曲|发行|平台共同署名|来源|\n|---|---|---|---|---|\n';for(const t of [...catalog.tracks].reverse())report+=`|${t.date||'待核'}|${pipe(t.title)}|${pipe(albums.find(a=>a.id===t.albumId).title)}|${pipe(t.artistIds.map(id=>people.get(id).name).join(' / '))}|[${t.sourceLabel}](${t.source})|\n`;
const log=await read('collection-log');report+=`\n## 采集与署名\n\n${tracks.filter(t=>t.creditLines.length).length} 条收录记录取得明确署名字段。仅保留元数据与单曲署名，不保存歌词或音频。采集有 ${log.failures.length} 个请求失败，详见 research/vansdaddy/collection-log.json；未绕过平台限制。封面与肖像缓存于 dist/assets，权利归相应权利人。\n`;
await writeFile('research/VANSDADDY-DISCOGRAPHY.md',report);
console.log(JSON.stringify({tracks:tracks.length,excluded:excludedRecords.length,albums:albums.length,core:coreIds.length,people:people.size,credits:tracks.filter(t=>t.creditLines.length).length,dates:[dates[0],dates.at(-1)]}));
