import {mountMainNavigation} from './navigation.js';
const params=new URLSearchParams(location.search);
if(location.hash==='#rapper-archives'&&!params.has('artist')&&!params.has('creator')&&!params.has('view')){params.set('view','rappers');history.replaceState(null,'','./?view=rappers');}
const legacy=params.has('artist')||(!params.has('creator')&&!params.has('view')&&/^#(?:track\/|album\/|journey$|archive$|network$|sources$)/.test(location.hash));
mountMainNavigation(legacy?'rappers':params.get('view')==='common'?'common':params.get('view')==='rappers'?'rappers':'discover');
if(legacy){
 await import('./asen.js');
}else await import('./discovery.js');
