// Group platform editions into one album entry; individual recordings remain source-specific.
export function mergeGaiAlbums(albums,tracks,externalReleases){
 const key=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,''),groups=new Map(),aliases={},result=[];
 for(const a of albums){const k=key(a.title);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(a);}
 const edition=a=>({id:a.id,title:a.title,date:a.date,source:a.source,sourceLabel:a.sourceLabel,totalTracks:a.totalTracks,trackIds:[...a.trackIds]});
 for(const items of groups.values()){
  const ns=items.filter(a=>a.sourceLabel==='网易云音乐'),qs=items.filter(a=>a.sourceLabel==='QQ音乐');
  if(!ns.length||!qs.length||items[0].title==='发行待核'||!/[\p{L}\p{N}]/u.test(items[0].title)){result.push(...items);continue;}
  const preferred=[...ns].sort((a,b)=>Number(b.core)-Number(a.core)||a.date.localeCompare(b.date)||a.id.localeCompare(b.id))[0];
  const editions=[edition(preferred),...items.filter(a=>a!==preferred).map(edition)];
  const days=editions.map(e=>e.date).filter(Boolean).sort(),trackIds=items.flatMap(a=>a.trackIds);
  const merged={...preferred,date:days[0]||'',referenceDate:preferred.date,sourceEditions:editions,displayTrackIds:[...preferred.trackIds],trackIds,core:items.some(a=>a.core),datePolicy:'最早已取得的平台发行日期；不据此断言首次发行时间'};
  for(const a of items)if(a.id!==preferred.id)aliases[a.id]=preferred.id;
  result.push(merged);
 }
 for(const t of tracks)if(aliases[t.albumId]){t.sourceAlbumId=t.albumId;t.albumId=aliases[t.albumId];}
 for(const a of result)if(a.sourceEditions){for(const t of tracks.filter(t=>t.albumId===a.id))t.sourceAlbumId??=a.id;}
 for(const r of externalReleases){if(aliases[r.relatedAlbumId])r.relatedAlbumId=aliases[r.relatedAlbumId];if(!r.relatedAlbumId){const found=result.filter(a=>key(a.title)===key(r.title));if(found.length===1)r.relatedAlbumId=found[0].id;}}
 return {albums:result,albumAliases:aliases,mergedPlatformEditions:Object.keys(aliases).length};
}
