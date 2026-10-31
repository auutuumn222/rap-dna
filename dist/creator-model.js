import {resolvePersonId} from './identity.js';
export const backstageRoles=['制作人','编曲','混音','母带'];

export function creatorWorks(index,id,{artist='all',role='all',query='',year='all'}={}){
 id=resolvePersonId(id);
 const q=query.trim().toLocaleLowerCase();
 return index.tracks.filter(t=>t.credits.some(c=>c.personId===id&&(role==='all'||c.role===role))&&(artist==='all'||t.artistKeys.includes(artist))&&(year==='all'||t.date.startsWith(year))&&(!q||[t.title,t.album,...t.artistNames].join(' ').toLocaleLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}
export function creatorStats(index,id){
 const works=creatorWorks(index,id);
 return {works,artists:[...new Set(works.flatMap(t=>t.artistKeys))],roles:backstageRoles.filter(r=>works.some(t=>t.credits.some(c=>c.personId===id&&c.role===r)))};
}
export function sharedCreators(index,left,right,role='all'){
 if(!left||!right||left===right)return [];
 const result=[];
 for(const p of index.creators){
  const works=creatorWorks(index,p.id,{role}),a=works.filter(t=>t.artistKeys.includes(left)),b=works.filter(t=>t.artistKeys.includes(right));
  if(!a.length||!b.length)continue;
  const sharedIds=a.filter(t=>b.some(u=>u.id===t.id)).map(t=>t.id);
  const independent=a.some(t=>b.some(u=>u.id!==t.id));
  // Prefer separate works that do not already bill the other rapper.
  const first=a.find(t=>!t.artistKeys.includes(right)&&b.some(u=>u.id!==t.id))||a.find(t=>b.some(u=>u.id!==t.id))||a[0];
  const second=b.find(t=>t.id!==first.id&&!t.artistKeys.includes(left))||b.find(t=>t.id!==first.id)||b[0];
  result.push({person:p,left:a,right:b,pair:[first,second],sharedIds,independent});
 }
 return result.sort((a,b)=>Number(b.independent)-Number(a.independent)||Number(b.person.identity==='platform')-Number(a.person.identity==='platform')||Math.min(b.left.length,b.right.length)-Math.min(a.left.length,a.right.length)||a.person.name.localeCompare(b.person.name));
}

export function discoveryStories(index){
 const preferred=['n13911452','n12110173'];
 const candidates=index.creators.filter(p=>p.identity==='platform').map(p=>({p,...creatorStats(index,p.id)})).filter(x=>x.artists.length>=2).sort((a,b)=>b.artists.length-a.artists.length);
 candidates.sort((a,b)=>{const rank=id=>preferred.includes(id)?preferred.indexOf(id):99;return rank(a.p.id)-rank(b.p.id);});
 const stories=[];
 for(const {p,artists} of candidates){
  let result;
  const pairs=p.id==='n13911452'?[['asen','masiwei'],...artists.flatMap((a,i)=>artists.slice(i+1).map(b=>[a,b]))]:artists.flatMap((a,i)=>artists.slice(i+1).map(b=>[a,b]));
  for(const [a,b] of pairs){result=sharedCreators({...index,creators:[p]},a,b).find(x=>x.independent&&x.pair[0].id!==x.pair[1].id&&!x.pair[0].artistKeys.includes(b)&&!x.pair[1].artistKeys.includes(a));if(result){result={...result,artistKeys:[a,b]};break;}}
  if(result){
   if(p.id==='n13911452'){
    const a=index.tracks.find(t=>t.id==='n2754174746'),b=index.tracks.find(t=>t.id==='n2683306407');
    if(a?.credits.some(c=>c.personId===p.id&&c.role==='编曲')&&b?.credits.some(c=>c.personId===p.id&&c.role==='编曲'))result.pair=[a,b];
   }
   stories.push(result);
  }
  if(stories.length===3)break;
 }
 return stories;
}
