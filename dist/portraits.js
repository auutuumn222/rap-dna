import {resolvePersonId,identities} from './identity.js';
export function createPortraits(entries={}){
 const failed=new Set();
 function imageFor(id){const original=id;id=resolvePersonId(id);const image=entries?.[id]?.image||entries?.[original]?.image||identities.person(id).aliasIds?.map(alias=>entries?.[alias]?.image).find(Boolean);return !failed.has(id)&&typeof image==='string'&&/^\.\/assets\/(?:people\/)?[A-Za-z0-9_.-]+\.(?:jpe?g|png|webp)$/.test(image)?image:null;}
 function bind(root){
  for(const image of root.querySelectorAll('[data-person-portrait]')){
   const owner=image.closest('.person-node,.person-badge');
   image.addEventListener('load',()=>{if(image.isConnected)owner?.classList.add('has-portrait');},{once:true});
   image.addEventListener('error',()=>{if(!image.isConnected)return;failed.add(resolvePersonId(image.dataset.personPortrait));owner?.classList.remove('has-portrait');image.remove();},{once:true});
  }
 }
 return {imageFor,bind};
}
