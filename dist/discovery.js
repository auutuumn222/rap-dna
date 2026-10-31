import {createPortraits} from './portraits.js';
import {resolvePersonId} from './identity.js';
import {backstageRoles,creatorWorks,creatorStats,sharedCreators,discoveryStories} from './creator-model.js';
import {createNeteasePlayer,neteaseSongId} from './player.js';
import {mountMainNavigation,creatorReturn} from './navigation.js';
const $=(s,root=document)=>root.querySelector(s),esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app=$('#app'),dialog=$('#detail-dialog');
let index,portraits={},artists,creators,tracks,stats,stories,player,timer;
let portraitImages=createPortraits();
let directory={query:'',role:'all',limit:12,open:false},works={artist:'all',role:'all',query:'',year:'all',limit:12},compare={query:'',role:'all',limit:8};
const href=(values={})=>'./'+(Object.keys(values).length?'?'+new URLSearchParams(values):'');
function creatorLink(id){
 const current=new URLSearchParams(location.search),values={creator:id};
 if(current.get('view')==='common'||current.get('from')==='common'){
  const a=current.get('a'),b=current.get('b');if(artists?.has(a)&&artists?.has(b))Object.assign(values,{from:'common',a,b});
 }else if(artists?.has(current.get('fromArtist')))Object.assign(values,{fromArtist:current.get('fromArtist'),fromSection:current.get('fromSection')||'network'});
 return href(values);
}
const artistLink=key=>href({artist:key});
const link=(url,label,cls='')=>`<a class="${cls}" href="${esc(url)}">${label}</a>`;
const external=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
const initials=name=>/^[\x00-\x7F]/.test(name)?name.split(/[\s._-]+/).map(x=>x[0]).join('').slice(0,2).toUpperCase():name.slice(0,2);
function portrait(person,size=''){const src=person.portrait||portraitImages.imageFor(person.id);return `<span class="dna-avatar ${size}" aria-hidden="true"><span>${esc(initials(person.name))}</span>${src?`<img src="${esc(src)}" alt="" loading="lazy">`:''}</span>`;}
function rolesFor(t,id){return [...new Set(t.credits.filter(c=>c.personId===id).map(c=>c.role))];}
const pills=roles=>roles.map(r=>`<span class="dna-pill">${esc(r)}</span>`).join('');
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('visible'),2600);}
function heading(kicker,title,note='',action=''){return `<div class="dna-section-head"><div><div class="dna-kicker">${kicker}</div><h2>${title}</h2>${note?`<p>${note}</p>`:''}</div>${action}</div>`;}
function scope(){return `<aside class="dna-scope" id="discovery-sources"><span class="dna-kicker">FOLLOW THE CREDITS</span><h3>每条联系，都从具体署名出发。</h3><p>${esc(index.scope)}当前覆盖 ${index.artists.length} 位 Rapper。共同署名与制作、编曲、混音、母带分别记录；同一制作人也可以带来完全不同的声音。</p><p>仅有姓名的署名按原字段保留，未确认与平台艺人账号相同的身份不会自动合并。作品中的「查看署名」可打开原始字段与来源。</p></aside>`;}
function playButton(t){return neteaseSongId(t)?`<button class="dna-play" data-listen="${esc(t.id)}" aria-label="播放 ${esc(t.title)}" aria-pressed="false">▶ <span>听听看</span></button>`:external(t.source,'去平台听');}
function workCard(t,id,{label='',compact=false}={}){return `<article class="dna-work ${compact?'compact':''}"><div class="dna-work-top"><img src="${esc(t.artwork)}" alt="${esc(t.album)} 封面" loading="lazy" width="64" height="64"><div>${label?`<span class="dna-work-label">${esc(label)}</span>`:''}<h3>${esc(t.title)}</h3><p>${esc(t.artistNames.join(' / '))}</p><small>${esc(t.date||'日期待核')} · ${esc(t.album)}</small></div></div><div class="dna-work-roles">${pills(rolesFor(t,id))}</div><div class="dna-work-actions">${playButton(t)}<button data-evidence="${esc(t.id)}" data-credit-person="${esc(id)}">查看署名 ↗</button></div></article>`;}
function storyCard(s,i){const [a,b]=s.artistKeys.map(k=>artists.get(k));return `<article class="dna-story"><div class="dna-story-top"><span class="dna-kicker">CONNECTION ${String(i+1).padStart(2,'0')}</span><span class="dna-story-dot"></span></div><h3>${esc(a.name)} <span>×</span> ${esc(b.name)}</h3><p>熟悉的两首歌，背后都有</p>${link(creatorLink(s.person.id),portrait(s.person)+`<span><b>${esc(s.person.name)}</b><small>看看 TA 还参与了什么 ↗</small></span>`,'dna-person-link')}<div class="dna-story-works">${s.pair.map((t,j)=>workCard(t,s.person.id,{label:[a,b][j].name,compact:true})).join('')}</div>${link(href({view:'common',a:a.key,b:b.key}),'探索他们的共同幕后 <span>→</span>','dna-card-link')}</article>`;}
function hero(s){
 const visual=s?(()=>{const [a,b]=s.artistKeys.map(k=>artists.get(k));return `<div class="dna-hero-visual"><div class="dna-orbit one"></div><div class="dna-orbit two"></div><div class="dna-visual-work left"><img src="${esc(s.pair[0].artwork)}" alt="${esc(s.pair[0].album)} 封面"><span>${esc(a.name)} · ${esc(s.pair[0].title)}</span></div><div class="dna-visual-work right"><img src="${esc(s.pair[1].artwork)}" alt="${esc(s.pair[1].album)} 封面"><span>${esc(b.name)} · ${esc(s.pair[1].title)}</span></div>${link(creatorLink(s.person.id),portrait(s.person,'hero-avatar')+`<b>${esc(s.person.name)}</b><small>两首不同的歌，同一位编曲者</small>`,'dna-visual-person')}<span class="dna-visual-caption">这就是一次幕后发现。向下看看他们的署名 ↓</span></div>`;})():'';
 return `<section class="dna-hero" id="top"><div class="dna-hero-copy"><span class="dna-kicker">RAP DNA / 发现声音背后的人</span><h1>从喜欢的 Rapper，<br>找到声音背后的<em>人。</em></h1><p>是谁编出了熟悉的旋律？TA 还参与过谁的作品？<br>沿着制作、编曲与混音署名，发现下一首好歌。</p><div class="dna-hero-actions">${link(href({view:'rappers'}),'从喜欢的 Rapper 开始 <span>↗</span>','dna-button')}${link(href({view:'common'}),'看看两位 Rapper 的共同幕后 →','dna-text-link')}</div><ol class="dna-start-steps" aria-label="探索路线"><li><span>01</span>选择 Rapper</li><li><span>02</span>认识幕后</li><li><span>03</span>听见新作品</li></ol></div>${visual}</section>`;
}
function creatorCard(p){const s=stats.get(p.id);return link(creatorLink(p.id),`${portrait(p)}<div><h3>${esc(p.name)}</h3><div class="dna-role-text">${esc(s.roles.join(' · '))}${p.identity==='credit-name'?'<small class="dna-name-status">姓名署名 · 身份待核</small>':''}</div><p>${s.artists.length} 位已收录 Rapper <span>·</span> ${s.works.length} 条作品记录</p></div><span class="dna-card-arrow">↗</span>`,'dna-creator-card');}
function renderDirectory(){
 const q=directory.query.trim().toLocaleLowerCase();
 const list=index.creators.filter(p=>{const s=stats.get(p.id);return (!q||[p.name,...(p.aliases||[]),...s.artists.map(k=>artists.get(k)?.name)].join(' ').toLocaleLowerCase().includes(q))&&(directory.role==='all'||s.roles.includes(directory.role));}).sort((a,b)=>stats.get(b.id).artists.length-stats.get(a.id).artists.length||stats.get(b.id).works.length-stats.get(a.id).works.length||a.name.localeCompare(b.name));
 $('#creator-count').textContent=`${list.length} 位 / 组创作者 · 按已收录合作范围排列`;
 $('#creator-grid').innerHTML=list.slice(0,directory.limit).map(creatorCard).join('')||'<div class="dna-empty"><h3>还没有找到这个署名。</h3><p>试试其他名字或角色。当前只包含已取得单曲署名的创作者。</p></div>';
 $('#more-creators').hidden=list.length<=directory.limit;
 bindImages();
}
function directorySection(){return `<section class="dna-section" id="creator-directory-content">${heading('THE PEOPLE BEHIND','下一次，记住 TA 的名字。','不止于一张专辑。沿着一个创作者，穿过不同 Rapper 的音乐世界。')}<div class="dna-toolbar"><label class="dna-search"><span>⌕</span><input id="creator-search" type="search" placeholder="搜索创作者或合作的 Rapper" aria-label="搜索创作者或合作的 Rapper"></label><label class="dna-select"><span>参与角色</span><select id="creator-role"><option value="all">全部幕后角色</option>${backstageRoles.map(r=>`<option>${r}</option>`).join('')}</select></label></div><p class="dna-result-note" id="creator-count" aria-live="polite"></p><div class="dna-creator-grid" id="creator-grid"></div><button class="dna-more" id="more-creators">再认识一些创作者 ↓</button></section>`;}
function home(){
 document.title='RAP DNA · 发现声音背后的人';
 app.innerHTML=hero(stories[0])+`<section class="dna-section" id="discover">${heading('先看一个真实的例子','原来也是 TA。','听听两首歌，看看共同署名，再走进这位创作者的其他作品。')}<div class="dna-stories">${stories.map(storyCard).join('')}</div></section><details class="dna-directory-fold" id="creators"><summary><span><b>已经有想找的幕后创作者？</b><small>展开后，按名字、合作的 Rapper 或具体角色搜索。</small></span><span class="dna-fold-label" aria-hidden="true">展开搜索 ＋</span></summary>${directorySection()}</details>`+scope();
 const fold=$('#creators');fold.open=directory.open||new URLSearchParams(location.search).get('view')==='creators'||location.hash==='#creators';
 fold.ontoggle=()=>{directory.open=fold.open;$('.dna-fold-label',fold).textContent=fold.open?'收起搜索 －':'展开搜索 ＋';};
 $('#creator-search').value=directory.query;$('#creator-role').value=directory.role;
 $('#creator-search').oninput=e=>{directory.query=e.target.value;directory.limit=12;renderDirectory();};$('#creator-role').onchange=e=>{directory.role=e.target.value;directory.limit=12;renderDirectory();};$('#more-creators').onclick=()=>{directory.limit+=12;renderDirectory();};renderDirectory();
}
function rapperDirectory(){
 document.title='Rapper 档案 · 从熟悉的声音开始 | RAP DNA';
 app.innerHTML=`<section class="dna-rapper-directory" id="top"><nav class="dna-breadcrumb" aria-label="当前位置">${link('./','发现')}<span aria-hidden="true">/</span><span aria-current="page">Rapper 档案</span></nav><span class="dna-kicker">从一个你熟悉的人开始</span><h1>选一位喜欢的 Rapper。</h1><p class="dna-page-purpose">这里浏览歌手的专辑、歌曲与合作网络。打开档案后，点击「找 TA 的幕后创作者」，认识参与制作这些声音的人。</p><label class="dna-search dna-rapper-search"><span>⌕</span><input id="rapper-search" type="search" placeholder="搜索名字或艺名" aria-label="搜索 Rapper 档案"></label><p class="dna-result-note" id="rapper-count" aria-live="polite"></p><div class="dna-rapper-grid" id="rapper-archives"></div><p class="dna-directory-next">想直接比较两位 Rapper？${link(href({view:'common'}),'去找共同幕后 →','dna-text-link')}</p></section>`+scope();
 const refresh=()=>{const q=$('#rapper-search').value.trim().toLocaleLowerCase(),list=index.artists.filter(a=>[a.name,...a.aliases].join(' ').toLocaleLowerCase().includes(q));$('#rapper-count').textContent=`${list.length} 位已收录 Rapper`;$('#rapper-archives').innerHTML=list.map(a=>link(artistLink(a.key),portrait(a)+`<b>${esc(a.name)}</b><span>作品档案 · 合作网络 ↗</span>`,'dna-rapper-card')).join('')||'<div class="dna-empty"><h3>这位 Rapper 还没有进入档案。</h3><p>换一个名字或艺名继续找找。</p></div>';bindImages();};
 $('#rapper-search').oninput=refresh;refresh();
}
function identityDetails(p){
 if(!p.identityEvidence?.length)return '';
 return `<details class="dna-identity-details"><summary>已核实的署名写法与依据 · ${p.identityEvidence.length} 项</summary><p>以下署名已归入此主页。作品数按歌曲记录去重，歌曲里的原始署名保持原样。</p>${p.identityEvidence.map(a=>`<div><b>${esc(a.name)}</b><small>${a.method==='same-track-role'?'同一作品、同一角色的署名记录交叉核对':a.method==='same-track-context'?'同一作品内的署名写法核对':'姓名末尾标点差异核对'}</small>${a.evidence.map(e=>`<p>${esc(e.note||e.role)} · ${external(e.source,'查看作品来源')}</p>`).join('')}</div>`).join('')}</details>`;
}
function creatorPage(id){
 const canonical=resolvePersonId(id);if(canonical!==id){const url=new URL(location.href);url.searchParams.set('creator',canonical);history.replaceState(null,'',url);id=canonical;}
 const p=creators.get(id);if(!p){app.innerHTML=`<div class="dna-empty dna-missing"><h1>这个创作者还没有进入档案。</h1>${link('./?view=creators','返回幕后发现 →','dna-text-link')}</div>`;document.title='RAP DNA · 暂未收录';return;}
 const s=stats.get(id),dates=s.works.map(t=>t.date).filter(Boolean).sort();
 const partners=s.artists.map(k=>({key:k,count:s.works.filter(t=>t.artistKeys.includes(k)).length})).sort((a,b)=>b.count-a.count);
 const back=creatorReturn(new URLSearchParams(location.search),artists),rapper=index.artists.find(a=>a.id===id);
 const breadcrumb=`<nav class="dna-breadcrumb" aria-label="当前位置">${link('./','发现')}<span aria-hidden="true">/</span><span>幕后参与</span><span aria-hidden="true">/</span><span aria-current="page">${esc(p.name)}</span></nav>`;
 document.title=`${p.name} · 幕后创作者 | RAP DNA`;
 app.innerHTML=`<section class="dna-profile" id="top">${breadcrumb}${link(back.url,'← '+esc(back.label),'dna-back dna-context-back')}<div class="dna-profile-heading">${portrait(p,'profile-avatar')}<div><span class="dna-kicker">创作者主页 / 幕后参与</span><h1>${esc(p.name)}</h1><div class="dna-profile-roles">${pills(s.roles)}</div><p>这里收集 ${esc(p.name)} 在已收录歌手作品中的幕后参与。按具体角色筛选，发现 TA 还参与过谁的声音。</p></div><button class="dna-copy" id="copy-creator">分享这个创作者 ↗</button></div>${rapper?`<nav class="dna-person-views" aria-label="人物档案类型"><span aria-current="page">幕后参与</span>${link(artistLink(rapper.key),'Rapper 作品档案 ↗')}</nav>`:''}<div class="dna-profile-stats"><div><b>${s.artists.length}</b><span>位已收录 Rapper</span></div><div><b>${s.works.length}</b><span>条去重平台记录</span></div><div><b>${dates[0]?.slice(0,4)||'—'}–${dates.at(-1)?.slice(0,4)||'—'}</b><span>当前署名记录跨度</span></div></div>${identityDetails(p)}${p.identity==='credit-name'?'<p class="dna-identity-note">此页按原始姓名署名建立，尚未与平台艺人账号或其他别名合并。</p>':''}</section><section class="dna-section dna-works-section">${heading('FOLLOW A PERSON, FIND A NEW SONG','TA 的声音，出现在哪里？','点选合作的 Rapper，或按角色筛选；每首歌都可以查看原始署名。')}<div class="dna-artist-filters" id="creator-artists"><button data-work-artist="all" class="active">全部合作</button>${partners.map(({key:k,count})=>{const a=artists.get(k);return `<button data-work-artist="${esc(k)}">${portrait(a)}<span>${esc(a.name)}</span><small>${count}</small></button>`;}).join('')}</div><div class="dna-toolbar"><label class="dna-search"><span>⌕</span><input id="work-search" type="search" placeholder="搜索歌名或专辑" aria-label="搜索创作者的歌曲或专辑"></label><label class="dna-select"><span>具体角色</span><select id="work-role"><option value="all">全部角色</option>${s.roles.map(r=>`<option>${r}</option>`).join('')}</select></label><label class="dna-select"><span>年份</span><select id="work-year"><option value="all">全部年份</option>${[...new Set(dates.map(d=>d.slice(0,4)))].reverse().map(y=>`<option>${y}</option>`).join('')}</select></label></div><p class="dna-result-note" id="work-count" aria-live="polite"></p><div class="dna-work-grid" id="creator-works"></div><button class="dna-more" id="more-works">继续听见 TA ↓</button></section><div class="dna-profile-bottom">${p.source?external(p.source,'创作者平台页'):''}${link(href({view:'common'}),'再找一组共同幕后 →','dna-text-link')}</div>`+scope();
 works={artist:'all',role:'all',query:'',year:'all',limit:12};
 const refresh=()=>{const list=creatorWorks(index,id,works);$('#work-count').textContent=`${list.length} 条平台记录 · 同一歌曲 ID 仅计一次，单曲 / 专辑等版本分别保留`;$('#creator-works').innerHTML=list.slice(0,works.limit).map(t=>workCard(t,id)).join('')||'<div class="dna-empty"><h3>这组筛选下还没有作品。</h3><p>换一个角色、年份或关键词继续探索。</p></div>';$('#more-works').hidden=list.length<=works.limit;$('#creator-artists').querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.workArtist===works.artist);b.setAttribute('aria-pressed',String(b.dataset.workArtist===works.artist));});bindImages();};
 $('#creator-artists').onclick=e=>{const b=e.target.closest('[data-work-artist]');if(b){works.artist=b.dataset.workArtist;works.limit=12;refresh();}};
 $('#work-search').oninput=e=>{works.query=e.target.value;works.limit=12;refresh();};$('#work-role').onchange=e=>{works.role=e.target.value;works.limit=12;refresh();};$('#work-year').onchange=e=>{works.year=e.target.value;works.limit=12;refresh();};$('#more-works').onclick=()=>{works.limit+=12;refresh();};$('#copy-creator').onclick=share;refresh();
}
function comparisonPage(){
 document.title='共同幕后 · 两位 Rapper 的音乐交集 | RAP DNA';
 const params=new URLSearchParams(location.search),a=artists.get(params.get('a'))||artists.get('asen')||index.artists[0],b=artists.get(params.get('b'))||artists.get('masiwei')||index.artists[1];
 app.innerHTML=`<section class="dna-common-hero" id="top"><nav class="dna-breadcrumb" aria-label="当前位置">${link('./','发现')}<span aria-hidden="true">/</span><span aria-current="page">找共同幕后</span></nav><span class="dna-kicker">DIFFERENT VOICES. SHARED CREATORS.</span><h1>他们的共同幕后。</h1><p class="dna-page-purpose">选择两位 Rapper，对比作品中共同的制作、编曲、混音与母带署名。<br>找到一个名字后，点进 TA 的幕后参与，继续听其他作品。</p><div class="dna-picker"><label>${portrait(a,'picker-avatar')}<span>第一位 Rapper</span><select id="common-a" aria-label="第一位 Rapper">${index.artists.map(x=>`<option value="${x.key}" ${a.key===x.key?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><button id="swap-rappers" aria-label="交换两位 Rapper">⇄</button><label>${portrait(b,'picker-avatar')}<span>第二位 Rapper</span><select id="common-b" aria-label="第二位 Rapper">${index.artists.map(x=>`<option value="${x.key}" ${b.key===x.key?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label></div><div class="dna-presets"><span>试试这两组</span>${link(href({view:'common',a:'asen',b:'masiwei'}),'Asen × 马思唯')}${link(href({view:'common',a:'pharaoh',b:'keyng'}),'法老 × 杨和苏')}</div></section><section class="dna-section dna-common-results"><div class="dna-toolbar"><label class="dna-search"><span>⌕</span><input type="search" id="common-query" placeholder="搜索这两人的共同创作者" aria-label="筛选共同创作者"></label><label class="dna-select"><span>参与角色</span><select id="common-role"><option value="all">全部幕后角色</option>${backstageRoles.map(r=>`<option>${r}</option>`).join('')}</select></label></div><div id="common-summary" class="dna-common-summary" aria-live="polite"></div><div id="common-results"></div><button class="dna-more" id="more-common">发现更多共同幕后 ↓</button><div id="same-song-results"></div></section>`+scope();
 const change=()=>{compare={...compare,query:'',limit:8};navigate(href({view:'common',a:$('#common-a').value,b:$('#common-b').value}),false);};$('#common-a').onchange=change;$('#common-b').onchange=change;$('#swap-rappers').onclick=()=>navigate(href({view:'common',a:b.key,b:a.key}),false);
 $('#common-query').value=compare.query;$('#common-role').value=compare.role;
 const refresh=()=>{
  const list=sharedCreators(index,a.key,b.key,compare.role).filter(x=>[x.person.name,...(x.person.aliases||[])].join(' ').toLocaleLowerCase().includes(compare.query.trim().toLocaleLowerCase())),bridges=list.filter(x=>x.independent),same=list.filter(x=>!x.independent);
  $('#common-summary').innerHTML=a.key===b.key?'<h2>换一个人，发现新的交集。</h2><p>请选择两位不同的 Rapper。</p>':`<h2>${bridges.length} 个幕后署名，连接不同作品。</h2><p>已关联艺人账号的署名优先展示；仅姓名的署名保留身份待核标记。每张卡片展示两首不同歌曲。另有 ${same.length} 个仅在同一首歌曲中出现的幕后署名，单独列在下方。角色筛选要求两边作品都具备该角色。</p>`;
  $('#common-results').innerHTML=bridges.slice(0,compare.limit).map(x=>`<article class="dna-bridge"><div class="dna-bridge-head">${link(creatorLink(x.person.id),portrait(x.person)+`<div><h3>${esc(x.person.name)}</h3>${x.person.identity==='credit-name'?'<small class="dna-name-status">姓名署名 · 身份待核</small>':''}<p>与 ${esc(a.name)} 有 ${x.left.length} 条记录 · 与 ${esc(b.name)} 有 ${x.right.length} 条记录</p></div>`,'dna-person-link')}${link(creatorLink(x.person.id),'打开创作者主页 ↗','dna-text-link')}</div><div class="dna-bridge-works">${x.pair.map((t,i)=>workCard(t,x.person.id,{label:[a,b][i].name})).join('')}<span class="dna-bridge-connector" aria-hidden="true">↔</span></div></article>`).join('')||`<div class="dna-empty"><h3>${a.key===b.key?'从两种声音开始。':'当前没有符合条件的不同作品交集。'}</h3><p>${compare.query||compare.role!=='all'?'试试清除关键词或切换到全部角色。':'这表示现有单曲署名暂时没有找到证据，不代表他们从未共享幕后创作者。'}</p></div>`;
  $('#more-common').hidden=bridges.length<=compare.limit;
  $('#same-song-results').innerHTML=same.length?`<details class="dna-same-song"><summary>仅在同一首歌曲中相遇 · ${same.length} 位 / 组</summary><p>这些是同一首歌里的幕后署名，暂时没有找到两首不同作品来建立另一条联系。</p>${same.map(x=>`<div class="dna-same-item">${link(creatorLink(x.person.id),esc(x.person.name)+(x.person.identity==='credit-name'?' · 姓名署名，身份待核':'')+' ↗','dna-text-link')}${workCard(x.pair[0],x.person.id,{compact:true})}</div>`).join('')}</details>`:'';bindImages();
 };
 $('#common-query').oninput=e=>{compare.query=e.target.value;compare.limit=8;refresh();};$('#common-role').onchange=e=>{compare.role=e.target.value;compare.limit=8;refresh();};$('#more-common').onclick=()=>{compare.limit+=8;refresh();};refresh();
}
function evidence(id,personId){
 const t=tracks.get(id),p=creators.get(personId);if(!t||!p)return;
 const credits=t.credits.filter(c=>c.personId===personId);
 $('#dialog-content').innerHTML=`<div class="dialog-body dna-evidence"><span class="dna-kicker">THE CREDIT, IN CONTEXT</span><h2 id="dialog-heading">${esc(t.title)}</h2><p>${esc(t.artistNames.join(' / '))}<br>${esc(t.album)} · ${esc(t.date||'日期待核')}</p>${link(creatorLink(p.id),portrait(p)+`<b>${esc(p.name)}</b>`,'dna-person-link')}<div class="dna-evidence-rows">${credits.map(c=>`<div><span class="dna-pill">${esc(c.role)}</span><p>原始署名：${esc(c.originalName||p.name)}</p>${c.originalPersonId&&c.originalPersonId!==p.id?`<small>已关联创作者：${esc(p.name)} · ${link(creatorLink(p.id),'查看身份与别名依据')}</small>`:''}<pre>${esc(c.raw)}</pre>${external(c.source,'原始歌曲页')}<small>单曲署名 · 核查于 ${esc(c.checkedAt)}</small></div>`).join('')}</div><p class="dna-evidence-note">按平台单曲署名整理，未据专辑级制作或共同艺人栏补填角色。</p><div class="dna-evidence-actions">${playButton(t)}${link(artistLink(t.catalogKeys[0])+'#track/'+encodeURIComponent(t.id),'打开完整歌曲档案 ↗','dna-text-link')}</div></div>`;
 if(!dialog.open)dialog.showModal();dialog.scrollTop=0;bindImages();
}
async function share(){try{await navigator.clipboard.writeText(location.href);toast('创作者主页链接已复制');}catch{$('#dialog-content').innerHTML=`<div class="dialog-body"><h2 id="dialog-heading">分享这个创作者</h2><textarea class="share-input" readonly>${esc(location.href)}</textarea></div>`;dialog.showModal();$('textarea',dialog).select();}}
function bindImages(){document.querySelectorAll('.dna-avatar img').forEach(img=>{img.onload=()=>img.parentElement.classList.add('loaded');img.onerror=()=>img.remove();if(img.complete&&img.naturalWidth)img.parentElement.classList.add('loaded');});}
function render(){
 if(dialog.open)dialog.close();const params=new URLSearchParams(location.search);
 const page=params.has('creator')?'creator':params.get('view')==='common'?'common':params.get('view')==='rappers'?'rappers':'discover';document.body.dataset.discoveryPage=page;
 if(page==='creator')creatorPage(params.get('creator'));else if(page==='common')comparisonPage();else if(page==='rappers')rapperDirectory();else home();
 bindImages();mountMainNavigation(page==='common'?'common':page==='rappers'?'rappers':'discover');
}
function navigate(url,scroll=true){history.pushState(null,'',url);render();if(scroll){const target=location.search==='?view=creators'?$('#creators'):null;if(target)target.scrollIntoView({behavior:'instant'});else scrollTo(0,0);}}
document.addEventListener('click',e=>{
 const evidenceButton=e.target.closest('[data-evidence]');if(evidenceButton){e.preventDefault();evidence(evidenceButton.dataset.evidence,evidenceButton.dataset.creditPerson);return;}
 const a=e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target||a.hasAttribute('download'))return;
 const url=new URL(a.href,location.href);if(url.origin!==location.origin||url.pathname!==location.pathname||url.searchParams.has('artist')||url.hash||url.pathname.endsWith('.json'))return;
 e.preventDefault();compare={query:'',role:'all',limit:8};navigate(url);
});
addEventListener('popstate',()=>{render();});
$('.dialog-close').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}};
async function boot(){try{
 const response=await fetch('./creator-index.json');if(!response.ok)throw Error('Creator index HTTP '+response.status);index=await response.json();
 const portraitResponse=await fetch('./people-portraits.json').catch(()=>null);if(portraitResponse?.ok)portraits=(await portraitResponse.json()).people||{};portraitImages=createPortraits(portraits);
 artists=new Map(index.artists.map(a=>[a.key,a]));creators=new Map(index.creators.map(p=>[p.id,p]));tracks=new Map(index.tracks.map(t=>[t.id,t]));stats=new Map(index.creators.map(p=>[p.id,creatorStats(index,p.id)]));stories=discoveryStories(index);
 const albums=new Map(index.tracks.map(t=>[t.albumId,{title:t.album,artwork:t.artwork}]));player=createNeteasePlayer({tracks,albums,names:t=>t.artistNames.join(' / '),beforeOpen:()=>dialog.close()});
 document.body.classList.add('discovery-page');document.title='RAP DNA · 发现声音背后的人';
 $('.skip-link').href='#app';$('.skip-link').textContent='跳至主要内容';
 $('.site-footer>div a').href='#discovery-sources';
 render();if(location.search==='?view=creators')$('#creators')?.scrollIntoView({behavior:'instant'});else if(location.hash)document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:'instant'});
}catch(error){console.error(error);app.innerHTML='<div class="dna-empty dna-missing"><h1>幕后档案暂时没有打开。</h1><p>请检查连接后重试。</p><button class="dna-button" id="retry-discovery">重新加载</button></div>';$('#retry-discovery').onclick=()=>location.reload();}}
boot();
