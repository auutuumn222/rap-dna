export function galleryOrder(albums,preferredIds){
 const selected=preferredIds?.length?albums.filter(a=>preferredIds.includes(a.id)):albums.filter(a=>a.core);
 const byDate=selected.sort((a,b)=>(b.date||'').localeCompare(a.date||'')||a.id.localeCompare(b.id));
 // Start with the newest, then walk right around the carousel back to its left-hand neighbors.
 const right=byDate.filter((_,i)=>i%2===1);
 const left=byDate.filter((_,i)=>i>0&&i%2===0).reverse();
 return [...byDate.slice(0,1),...right,...left].map(a=>a.id);
}
export function wrapGalleryIndex(index,count){
 return ((index%count)+count)%count;
}
export function gallerySlots(ids,selected=0){
 if(!ids.length)return [];
 const leftCount=Math.min(2,Math.floor((ids.length-1)/2));
 const rightCount=Math.min(2,Math.floor(ids.length/2));
 const slots=[];
 for(let offset=-leftCount;offset<=rightCount;offset++){
  slots.push({id:ids[wrapGalleryIndex(selected+offset,ids.length)],offset});
 }
 return slots;
}
