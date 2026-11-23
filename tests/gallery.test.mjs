import test from 'node:test';
import assert from 'node:assert/strict';
import {galleryOrder,gallerySlots,wrapGalleryIndex} from '../dist/gallery.js';
test('latest-first gallery balances recent albums on both sides',()=>{
 const albums=[2021,2025,2022,2024,2023].map(year=>({id:String(year),date:year+'-01-01',core:true}));
 const ids=galleryOrder(albums);
 assert.deepEqual(ids,['2025','2024','2022','2021','2023']);
 assert.deepEqual(gallerySlots(ids,0).map(x=>x.id),['2021','2023','2025','2024','2022']);
});
test('visible neighbors stay in carousel order across every selection and wrap',()=>{
 for(let count=1;count<=10;count++){
  const ids=Array.from({length:count},(_,i)=>'a'+i);
  for(let i=0;i<count;i++){
   const slots=gallerySlots(ids,i);
   assert.equal(slots.length,Math.min(5,count));
   assert.equal(new Set(slots.map(x=>x.id)).size,slots.length);
   for(const {id,offset} of slots){
    assert.ok(Math.abs(offset)<=2);
    assert.equal(id,ids[(i+offset+count)%count]);
   }
   assert.equal(slots.find(x=>x.offset===0).id,ids[i]);
   if(count>=2)assert.equal(slots.find(x=>x.offset===1).id,ids[wrapGalleryIndex(i+1,count)]);
   if(count>=3)assert.equal(slots.find(x=>x.offset===-1).id,ids[wrapGalleryIndex(i-1,count)]);
  }
 }
 assert.deepEqual(gallerySlots([],0),[]);
});
test('curated album sets are preserved while manual ordering is replaced by release dates',()=>{
 assert.deepEqual(galleryOrder([{id:'old',date:'2020',core:true},{id:'new',date:'2025',core:true},{id:'guest',date:'2026',core:false}],['new','old']),['new','old']);
});
