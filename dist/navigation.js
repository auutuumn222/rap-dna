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
 guide.innerHTML=`<nav class="dna-breadcrumb" aria-label="当前位置"><a href="./?view=rappers">Rapper 档案</a><span aria-hidden="true">/</span><span aria-current="page">${escape(name)} · 作品档案</span></nav><div class="archive-purpose"><div><span class="dna-kicker">RAPPER / 作品档案</span><p>浏览 ${escape(name)} 的专辑、歌曲与合作。想认识声音背后的人，从幕后创作者开始。</p></div><button class="dna-button" id="archive-backstage-start">找 TA 的幕后创作者 ↗</button></div><nav class="archive-section-nav" aria-label="歌手档案页内导航"><a href="#journey">作品年表</a><a href="#archive">歌曲目录</a><a href="#network">合作网络</a><a href="#sources">数据说明</a></nav>`;
 document.querySelector('#app').prepend(guide);
 guide.after(guide.querySelector('.archive-section-nav'));
 guide.querySelector('#archive-backstage-start').onclick=onBackstage;
}
