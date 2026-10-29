export const coreRoles=['制作人','编曲','混音','母带'];
export function filterTracks(catalog,{query='',year='all',kind='all',albumId='all'}={}){
 const q=query.trim().toLocaleLowerCase(),people=new Map(catalog.people.map(p=>[p.id,p.name])),albums=new Map(catalog.albums.map(a=>[a.id,a.title]));
 return catalog.tracks.filter(t=>{
  if(year!=='all'&&!t.date.startsWith(year))return false;
  if(albumId!=='all'&&t.albumId!==albumId)return false;
  if(kind==='solo'&&t.artistIds.length!==1)return false;
  if(kind==='collaboration'&&t.artistIds.length<2)return false;
  if(['instrumental','remix','live'].includes(kind)&&t.kind!==kind)return false;
  if(q&&![t.title,...t.aliases,albums.get(t.albumId),...t.artistIds.map(id=>people.get(id)),...(t.artistIds.includes(catalog.artist.id)?catalog.artist.aliases||[]:[]),...t.credits.map(c=>people.get(c.personId))].filter(Boolean).join(' ').toLocaleLowerCase().includes(q))return false;
  return true;
 });
}
export function connections(catalog,{mode='artists',year='all',albumId='all',query=''}={}){
 const result=new Map(),people=new Map(catalog.people.map(p=>[p.id,p]));
 for(const t of filterTracks(catalog,{year,albumId})){
  const entries=mode==='artists'?t.artistIds.map(personId=>({personId,role:'共同署名'})):t.credits.filter(c=>coreRoles.includes(c.role));
  for(const {personId,role} of entries){
   if(personId===catalog.artist.id)continue;
   if(!result.has(personId))result.set(personId,{...people.get(personId),trackIds:[],roles:[],evidence:[]});
   const item=result.get(personId);if(!item.trackIds.includes(t.id))item.trackIds.push(t.id);if(!item.roles.includes(role))item.roles.push(role);
   if(!item.evidence.some(e=>e.trackId===t.id&&e.role===role))item.evidence.push({trackId:t.id,role,source:t.source});
  }
 }
 const q=query.trim().toLocaleLowerCase();return [...result.values()].filter(r=>!q||r.name.toLocaleLowerCase().includes(q)).sort((a,b)=>b.trackIds.length-a.trackIds.length||a.name.localeCompare(b.name));
}
