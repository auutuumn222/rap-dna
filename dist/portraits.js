export function createPortraits(entries={}){
 const failed=new Set();
 function imageFor(id){const image=entries?.[id]?.image;return !failed.has(id)&&typeof image==='string'&&/^\.\/assets\/(?:people\/)?[A-Za-z0-9_.-]+\.(?:jpe?g|png|webp)$/.test(image)?image:null;}
 function bind(root){
  for(const image of root.querySelectorAll('[data-person-portrait]')){
   const owner=image.closest('.person-node');
   image.addEventListener('load',()=>{if(image.isConnected)owner?.classList.add('has-portrait');},{once:true});
   image.addEventListener('error',()=>{if(!image.isConnected)return;failed.add(image.dataset.personPortrait);owner?.classList.remove('has-portrait');image.remove();},{once:true});
  }
 }
 return {imageFor,bind};
}
