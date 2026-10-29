export function galleryOrder(albums,preferredIds){
 const selected=preferredIds?.length?albums.filter(a=>preferredIds.includes(a.id)):albums.filter(a=>a.core);
 return [...selected].sort((a,b)=>(b.date||'').localeCompare(a.date||'')||a.id.localeCompare(b.id)).map(a=>a.id);
}
export function gallerySlots(ids,selected=0){
 if(!ids.length)return [];
 const center=Math.max(0,Math.min(selected,ids.length-1));
 const nearest=ids.map((id,index)=>({id,index})).filter(a=>a.index!==center).sort((a,b)=>Math.abs(a.index-center)-Math.abs(b.index-center)||b.index-a.index).slice(0,4);
 return [{id:ids[center],offset:0},...nearest.map((a,i)=>({id:a.id,offset:(i%2===0?1:-1)*(Math.floor(i/2)+1)}))].sort((a,b)=>a.offset-b.offset);
}
