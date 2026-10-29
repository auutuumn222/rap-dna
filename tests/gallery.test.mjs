import test from 'node:test';
import assert from 'node:assert/strict';
import {galleryOrder,gallerySlots} from '../dist/gallery.js';
test('latest-first gallery balances recent albums on both sides',()=>{
 const albums=[2021,2025,2022,2024,2023].map(year=>({id:String(year),date:year+'-01-01',core:true}));
 const ids=galleryOrder(albums);
 assert.deepEqual(ids,['2025','2024','2023','2022','2021']);
 assert.deepEqual(gallerySlots(ids,0).map(x=>x.id),['2021','2023','2025','2024','2022']);
});
test('every selection stays central without duplicate covers or invalid indices',()=>{
 for(let count=1;count<=10;count++){const ids=Array.from({length:count},(_,i)=>'a'+i);for(let i=0;i<count;i++){const slots=gallerySlots(ids,i);assert.equal(slots.find(x=>x.offset===0).id,ids[i]);assert.equal(slots.length,Math.min(5,count));assert.equal(new Set(slots.map(x=>x.id)).size,slots.length);assert.ok(slots.every(x=>Math.abs(x.offset)<=2));}}
 assert.deepEqual(gallerySlots([],0),[]);
});
test('curated album sets are preserved while manual ordering is replaced by release dates',()=>{
 assert.deepEqual(galleryOrder([{id:'old',date:'2020',core:true},{id:'new',date:'2025',core:true},{id:'guest',date:'2026',core:false}],['new','old']),['new','old']);
});
