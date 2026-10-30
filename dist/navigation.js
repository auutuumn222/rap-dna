const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sections={network:'合作网络',archive:'歌曲目录',journey:'作品年表',top:'作品概览'};

export function mountMainNavigation(active='discover'){
 const items=[['discover','./','发现'],['common','./?view=common','找共同幕后'],['rappers','./?view=rappers','Rapper 档案']];
 const nav=document.querySelector('.site-header nav');
 nav.innerHTML=items.map(([key,url,label])=>`<a href="${url}" ${key===active?'class="active" aria-current="page"':''}>${label}</a>`).join('');
 document.querySelectorAll('.brand').forEach(a=>a.href='./');
 document.querySelector('.artist-switch')?.setAttribute('hidden','');
 document.querySelector('.nav-cta')?.setAttribute('hidden','');
}

export function creatorDestination(id,{artist,section='network'}={}){
 const params=new URLSearchParams({creator:id});
 if(artist){params.set('fromArtist',artist);params.set('fromSection',sections[section]?section:'network');}
 return './?'+params;
}

export function creatorReturn(params,artists){
 const artist=artists.get(params.get('fromArtist'));
 if(artist){const section=sections[params.get('fromSection')]?params.get('fromSection'):'network',query=new URLSearchParams({artist:artist.key});if(section==='network')query.set('mode','credits');return {url:'./?'+query+'#'+section,label:`回到 ${artist.name} 的${sections[section]}`};}
 if(params.get('from')==='common'){
  const a=artists.get(params.get('a')),b=artists.get(params.get('b'));
  if(a&&b)return {url:'./?'+new URLSearchParams({view:'common',a:a.key,b:b.key}),label:`回到 ${a.name} × ${b.name} 的共同幕后`};
 }
 return {url:'./#creators',label:'返回幕后发现'};
}

export function mountArchiveGuide({key,name,onBackstage}){
 if(document.querySelector('.archive-guide'))return;
 const guide=document.createElement('div');guide.className='archive-guide';
 guide.innerHTML=`<nav class="dna-breadcrumb" aria-label="当前位置"><a href="./?view=rappers">Rapper 档案</a><span aria-hidden="true">/</span><span aria-current="page">${escape(name)} · 作品档案</span></nav><nav class="archive-section-nav" aria-label="歌手档案页内导航"><a href="#journey">作品年表</a><a href="#archive">歌曲目录</a><a href="#network">合作网络</a><a href="#sources">数据说明</a></nav>`;
 document.querySelector('#app').prepend(guide);
 const hero=document.querySelector('.hero');hero.classList.add('archive-hero');
 hero.after(guide.querySelector('.archive-section-nav'));
 hero.querySelector('h1').innerHTML=`<span class="artist-headline">${escape(name)}</span><span class="archive-hero-subtitle">沿着作品，听见幕后。</span>`;
 hero.querySelector('.hero-lead').textContent='从一张专辑出发，认识共同塑造这些声音的人。';
 const pill=hero.querySelector('.artist-pill'),image=pill.querySelector('img');
 pill.replaceChildren();if(image)pill.append(image);pill.append(document.createTextNode('RAPPER / 作品档案'));
 hero.querySelector('.hero-actions').innerHTML='<button class="primary" id="archive-backstage-start">发现幕后创作者 <span aria-hidden="true">↗</span></button><a class="text-link" href="#journey">浏览专辑 <span aria-hidden="true">↓</span></a>';
 hero.querySelector('#archive-backstage-start').onclick=onBackstage;
}
