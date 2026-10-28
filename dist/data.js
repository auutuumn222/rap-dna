// Demonstration dataset. Names identify the product's subject, not verified credits.
export const artists = [
  { id:'masiwei', name:'马思唯', en:'MASIWEI', short:'马', city:'成都', color:'#b88a59', x:360,y:230, size:52 },
  { id:'wangyitai', name:'王以太', en:'WANG YITAI', short:'闪', city:'成都', color:'#a4afa3', x:610,y:170, size:43 },
  { id:'aire', name:'艾热 AIR', en:'AIR', short:'AIR', city:'喀什', color:'#baa18a', x:815,y:265, size:40 },
  { id:'asen', name:'艾志恒 Asen', en:'ASEN', short:'A', city:'成都', color:'#8c929e', x:425,y:420, size:38 },
  { id:'knowknow', name:'KnowKnow', en:'KNOWKNOW', short:'K', city:'成都', color:'#9e9d87', x:150,y:330, size:37 },
  { id:'psy', name:'PSY.P', en:'PSY.P', short:'P', city:'成都', color:'#9e8585', x:140,y:130, size:31 },
  { id:'melo', name:'Melo', en:'MELO', short:'M', city:'成都', color:'#9eab9e', x:345,y:70, size:30 },
  { id:'jonyj', name:'Jony J', en:'JONY J', short:'J', city:'南京', color:'#a4967a', x:850,y:440, size:34 },
  { id:'gai', name:'GAI 周延', en:'GAI', short:'G', city:'重庆', color:'#8a9e97', x:1020,y:180, size:33 },
  { id:'lexie', name:'刘柏辛 Lexie', en:'LEXIE LIU', short:'L', city:'长沙', color:'#a599b1', x:685,y:475, size:32 },
  { id:'mai', name:'Mai', en:'MAI', short:'MAI', role:'producer', city:'制作人', color:'#e7a35f', x:630,y:330, size:36 },
  { id:'harikiri', name:'HARIKIRI', en:'HARIKIRI', short:'H', role:'producer', city:'制作人', color:'#ca8e65', x:100,y:485, size:30 },
  { id:'myles', name:'Myles William', en:'MYLES WILLIAM', short:'MW', role:'producer', city:'制作人', color:'#bc986c', x:1000,y:370, size:29 },
  { id:'disconnected', name:'未收录音乐人', en:'NOT INDEXED', short:'?', city:'资料待补充', color:'#777', x:1050,y:510,size:24, hidden:true }
];
export const tracks = [
  {id:'do-it',title:'Do It Like This',artists:['masiwei','wangyitai'],credits:[['harikiri','编曲']],year:2021,origin:'用户提供的构想中提到的合作案例；尚未独立核验作品署名。',cover:'orange'},
  {id:'wuyan',title:'无言以对',artists:['wangyitai','aire'],credits:[['mai','制作']],year:2021,origin:'用户提供的构想中提到的合作案例；尚未独立核验。制作人字段仅为演示。',cover:'green'},
  {id:'demo-01',title:'夜行电台',artists:['masiwei','knowknow'],credits:[['harikiri','制作'],['mai','混音']],year:2024,cover:'blue'},
  {id:'demo-02',title:'城市切片',artists:['masiwei','psy','melo'],credits:[['harikiri','编曲']],year:2023,cover:'purple'},
  {id:'demo-03',title:'After Hours',artists:['masiwei','asen'],credits:[['mai','制作']],year:2025,cover:'orange'},
  {id:'demo-04',title:'在路上',artists:['asen','wangyitai'],credits:[['mai','编曲']],year:2024,cover:'green'},
  {id:'demo-05',title:'另一种引力',artists:['wangyitai','lexie'],credits:[['myles','制作']],year:2025,cover:'purple'},
  {id:'demo-06',title:'回声之间',artists:['aire','jonyj'],credits:[['myles','编曲']],year:2023,cover:'blue'},
  {id:'demo-07',title:'山城来信',artists:['aire','gai'],credits:[['mai','制作']],year:2024,cover:'green'},
  {id:'demo-08',title:'低频漫游',artists:['knowknow','lexie'],credits:[['harikiri','制作'],['mai','混音']],year:2025,cover:'orange'},
  {id:'demo-09',title:'未完待续',artists:['psy','asen'],credits:[['harikiri','制作']],year:2022,cover:'purple'},
  {id:'demo-10',title:'长夜留声',artists:['jonyj','gai'],credits:[['myles','混音']],year:2024,cover:'blue'},
  {id:'demo-11',title:'慢速星球',artists:['melo','knowknow'],credits:[['mai','编曲']],year:2023,cover:'green'},
  {id:'demo-12',title:'平行声场',artists:['lexie','gai'],credits:[['myles','制作']],year:2025,cover:'purple'}
].map(t=>({...t,demo:true,origin:t.origin||'虚构演示作品与署名，仅用于展示交互；不代表这些音乐人的真实合作。'}));
export const artistById = id => artists.find(a=>a.id===id);
export const tracksFor = id => tracks.filter(t=>t.artists.includes(id)||t.credits.some(([p])=>p===id));
export function collaborationEdges(includeProducers=false){
  const result = new Map();
  for(const t of tracks){
    const ids = includeProducers ? [...new Set([...t.artists,...t.credits.map(([id])=>id)])] : t.artists;
    for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
      const key=[ids[i],ids[j]].sort().join('|');
      if(!result.has(key))result.set(key,{a:ids[i],b:ids[j],tracks:[]});
      result.get(key).tracks.push(t.id);
    }
  }
  return [...result.values()];
}
export function shortestPaths(from,to,{includeProducers=false,limit=8}={}){
  if(!artistById(from)||!artistById(to))return [];
  if(from===to)return [[from]];
  const adjacency = new Map(artists.map(a=>[a.id,[]]));
  for(const {a,b} of collaborationEdges(includeProducers)){adjacency.get(a).push(b);adjacency.get(b).push(a);}
  let queue=[[from]], found=[], depth=Infinity;
  const distance=new Map([[from,0]]);
  while(queue.length){
    const path=queue.shift(), last=path.at(-1);
    if(path.length>depth)break;
    if(last===to){depth=path.length;found.push(path);if(found.length>=limit)break;continue;}
    for(const next of adjacency.get(last)||[]){
      const d=path.length;
      if(!path.includes(next)&&(!distance.has(next)||distance.get(next)>=d)){
        distance.set(next,d);queue.push([...path,next]);
      }
    }
  }
  return found;
}
export function dnaFor(trackIds){
  const selected=tracks.filter(t=>trackIds.includes(t.id));
  const count=new Map();
  for(const t of selected){
    const people=new Map();
    for(const [id,role] of t.credits){if(!people.has(id))people.set(id,new Set());people.get(id).add(role);}
    for(const [id,roles] of people){
      if(!count.has(id))count.set(id,{id,count:0,roles:new Set(),tracks:[]});
      const entry=count.get(id);entry.count++;entry.tracks.push(t.id);roles.forEach(r=>entry.roles.add(r));
    }
  }
  return [...count.values()].sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id));
}
