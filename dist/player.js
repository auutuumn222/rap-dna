export function neteaseSongId(track){
 try{const url=new URL(track?.source);const id=url.searchParams.get('id');return url.protocol==='https:'&&url.hostname==='music.163.com'&&url.pathname==='/song'&&/^\d+$/.test(id||'')?id:null;}catch{return null;}
}

export function createNeteasePlayer({tracks,albums,names,beforeOpen}){
 const panel=document.querySelector('#listening-panel');
 let current=null,frame=null,timeout,collapsed=true;
 const text=(selector,value)=>{panel.querySelector(selector).textContent=value;};
 function reserveSpace(){document.body.style.setProperty('--listening-space',`${panel.hidden?0:panel.getBoundingClientRect().height+36}px`);}
 new ResizeObserver(reserveSpace).observe(panel);
 function syncButtons(){document.querySelectorAll('[data-listen]').forEach(button=>{const selected=button.dataset.listen===current?.id;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});}
 function collapse(value){collapsed=value;panel.classList.toggle('collapsed',value);const body=panel.querySelector('#listen-body');body.inert=value;body.setAttribute('aria-hidden',String(value));panel.querySelector('#listen-toggle').setAttribute('aria-expanded',String(!value));text('#listen-toggle',value?'展开播放器':'收起');reserveSpace();}
 function loadFrame(){
  clearTimeout(timeout);
  const id=neteaseSongId(current);if(!id)return;
  text('#listen-status','正在连接网易云并请求播放…');
  frame=document.createElement('iframe');
  frame.title=`网易云音乐：${current.title}`;
  frame.allow='autoplay';frame.referrerPolicy='strict-origin-when-cross-origin';
  frame.src=`https://music.163.com/outchain/player?type=2&id=${id}&auto=1&height=66`;
  const loadingFrame=frame;
  frame.onload=()=>{if(frame!==loadingFrame||panel.hidden)return;clearTimeout(timeout);text('#listen-status','已请求播放。若未响，可在此重试或前往网易云。');};
  frame.onerror=()=>{if(frame!==loadingFrame||panel.hidden)return;clearTimeout(timeout);text('#listen-status','播放器暂未加载，请重试或前往网易云。');};
  panel.querySelector('#listen-frame').replaceChildren(frame);
  timeout=setTimeout(()=>text('#listen-status','加载较慢，可以重试或前往网易云。'),15000);
 }
 function close(){
  clearTimeout(timeout);panel.replaceChildren();panel.hidden=true;document.body.classList.remove('has-listening-panel');current=frame=null;syncButtons();reserveSpace();
 }
 function open(id){
  const track=tracks.get(id);if(!neteaseSongId(track))return;
  beforeOpen?.();
  if(current?.id===id){collapse(true);loadFrame();panel.querySelector('#listen-toggle').focus({preventScroll:true});return;}
  current=track;collapsed=true;
  panel.innerHTML='<div class="listen-header"><img id="listen-art" alt="" width="48" height="48"><div class="listen-copy"><span class="listen-eyebrow">沿着关系，听见作品</span><strong id="listen-title"></strong><span id="listen-meta"></span></div><div class="listen-actions"><button id="listen-toggle" aria-controls="listen-body" aria-expanded="true">收起</button><button id="listen-close" aria-label="关闭播放器并停止播放">×</button></div></div><div id="listen-body" class="listen-body"><div class="listen-platform"><span class="listen-provider"><i></i>网易云音乐 · 官方播放器</span><p id="listen-status" role="status" aria-live="polite"></p><p class="listen-note">部分作品可能受会员、地区或版权限制。</p><div class="listen-links"><a id="listen-external" target="_blank" rel="noopener noreferrer">去网易云收听 ↗</a><button id="listen-retry">重新加载</button></div></div><div id="listen-frame" class="listen-frame"></div></div>';
  const album=albums.get(track.albumId);panel.querySelector('#listen-art').src=album.artwork;
  text('#listen-title',track.title);text('#listen-meta',`${names(track)} · ${album.title}`);
  panel.querySelector('#listen-external').href=track.source;
  panel.querySelector('#listen-close').onclick=close;
  panel.querySelector('#listen-toggle').onclick=()=>collapse(!collapsed);
  panel.querySelector('#listen-retry').onclick=loadFrame;
  panel.hidden=false;collapse(true);document.body.classList.add('has-listening-panel');
  loadFrame();syncButtons();reserveSpace();panel.querySelector('#listen-toggle').focus({preventScroll:true});
 }
 document.addEventListener('click',event=>{const button=event.target.closest('[data-listen]');if(button){event.preventDefault();open(button.dataset.listen);}});
 return {open,close,syncButtons};
}
