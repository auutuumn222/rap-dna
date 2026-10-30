const params=new URLSearchParams(location.search);
const legacy=params.has('artist')||(!params.has('creator')&&!params.has('view')&&/^#(?:track\/|album\/|journey$|archive$|network$|sources$)/.test(location.hash));
document.querySelectorAll('.brand').forEach(a=>a.href='./');
if(legacy){
 const nav=document.querySelector('.site-header nav');
 const a=document.createElement('a');a.href='./?view=creators';a.textContent='幕后发现';a.className='backstage-nav';nav.prepend(a);
 await import('./asen.js');
}else await import('./discovery.js');
