import {resolvePersonId} from './identity.js';
export const backstageRoles=['制作人','编曲','混音','母带'];
const featuredCreatorId='n13911452';
const featuredArtistKeys=['asen','masiwei'];
const featuredTrackIds=['n2754174746','n2683306407'];

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

export function featuredDiscoveryStory(index){
 const person=index.creators.find(creator=>creator.id===featuredCreatorId);
 if(!person||!featuredArtistKeys.every(key=>index.artists.some(artist=>artist.key===key)))return;
 const pair=featuredTrackIds.map(id=>index.tracks.find(track=>track.id===id));
 const verified=pair.every((track,i)=>track?.artistKeys.includes(featuredArtistKeys[i])
  &&!track.artistKeys.includes(featuredArtistKeys[1-i])
  &&track.credits.some(credit=>credit.personId===person.id&&credit.role==='编曲'));
 if(verified)return {person,artistKeys:featuredArtistKeys,pair};
}

export function discoveryStories(index,{stats,previous=[],seen=new Set(),random=Math.random}={}){
 const rankedRappers=index.artists.filter(artist=>artist.fans>0).sort((a,b)=>b.fans-a.fans);
 const maxFans=rankedRappers[0]?.fans||1;
 const rapperReach=new Map(rankedRappers.map(artist=>[artist.key,Math.sqrt(artist.fans/maxFans)]));
 const creatorReach=new Map(rankedRappers.map(artist=>[artist.id,rapperReach.get(artist.key)]));
 const familiarRappers=rankedRappers.slice(0,Math.ceil(rankedRappers.length/5));
 const familiarKeys=new Set(familiarRappers.map(artist=>artist.key));
 const familiarIds=new Set(familiarRappers.map(artist=>artist.id));
 const recent=new Set(previous);
 const priority=id=>recent.has(id)?2:Number(seen.has(id));
 const candidates=[];
 for(const person of index.creators){
  if(person.identity!=='platform')continue;
  const {artists}=stats?.get(person.id)??creatorStats(index,person.id);
  if(artists.length<2)continue;
  const collaborators=[...artists].sort((a,b)=>(rapperReach.get(b)||0)-(rapperReach.get(a)||0));
  const [first,second]=collaborators;
  // Cap the collaboration boost and dampen large differences in follower counts.
  const breadth=1+Math.min(collaborators.length,25)/3;
  const reach=1+3*(rapperReach.get(first)||0)+2*(rapperReach.get(second)||0)+(creatorReach.get(person.id)||0);
  const draw=-Math.log1p(-random())/(breadth*reach);
  candidates.push({p:person,artists:collaborators,draw});
 }
 // Smaller weighted draws come first, within each group of unseen or recent creators.
 candidates.sort((a,b)=>priority(a.p.id)-priority(b.p.id)||a.draw-b.draw);
 const lead=candidates.findIndex(({p,artists})=>priority(p.id)===priority(candidates[0].p.id)
  &&(familiarIds.has(p.id)||artists.some(key=>familiarKeys.has(key))));
 if(lead>0)candidates.unshift(...candidates.splice(lead,1));
 const pairKey=([a,b])=>a<b?`${a}/${b}`:`${b}/${a}`;
 const displayedPairs=new Set();
 const stories=[];
 for(const {p,artists} of candidates){
  let result;
  const pairs=artists.flatMap((a,i)=>artists.slice(i+1).map(b=>[a,b]));
  if(p.id===featuredCreatorId)pairs.unshift(featuredArtistKeys);
  pairs.sort((a,b)=>Number(displayedPairs.has(pairKey(a)))-Number(displayedPairs.has(pairKey(b))));
  for(const [a,b] of pairs){result=sharedCreators({...index,creators:[p]},a,b).find(x=>x.independent&&x.pair[0].id!==x.pair[1].id&&!x.pair[0].artistKeys.includes(b)&&!x.pair[1].artistKeys.includes(a));if(result){result={...result,artistKeys:[a,b]};break;}}
  if(result){
   if(p.id===featuredCreatorId&&featuredArtistKeys.every((key,i)=>key===result.artistKeys[i])){
    const featured=featuredDiscoveryStory(index);
    if(featured)result.pair=featured.pair;
   }
   stories.push(result);
   displayedPairs.add(pairKey(result.artistKeys));
  }
  if(stories.length===3)break;
 }
 return stories;
}
