import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {backstageRoles} from '../dist/creator-model.js';
import {mergeCreatorIdentities,mergeSummary} from './merge-creators.mjs';

export function buildCreatorIndex(entries){
 const artists=entries.map(({key,catalog:c})=>({key,id:c.artist.id,name:c.artist.short,aliases:c.artist.aliases||[],portrait:c.artist.portrait,checkedAt:c.checkedAt}));
 const people=new Map(),tracks=new Map(),creatorIds=new Set();
 for(const {key,catalog} of entries){
  const persons=new Map(catalog.people.map(p=>[p.id,p]));
  for(const p of catalog.people){if(!people.has(p.id))people.set(p.id,p);}
  const albums=new Map(catalog.albums.map(a=>[a.id,a]));
  for(const t of catalog.tracks){
   if(!t.artistIds.includes(catalog.artist.id))continue;
   const credits=t.credits.filter(c=>backstageRoles.includes(c.role)&&c.level==='track'&&c.raw?.trim()&&/^https:\/\//.test(c.source||'')&&c.personId!=='n0'&&persons.has(c.personId));
   if(!credits.length)continue;
   const album=albums.get(t.albumId);if(!album)continue;
   if(!tracks.has(t.id))tracks.set(t.id,{id:t.id,title:t.title,date:t.date||'',kind:t.kind,albumId:t.albumId,album:album.title,artwork:album.artwork,artistKeys:[],artistNames:t.artistIds.map(id=>persons.get(id)?.name).filter(Boolean),catalogKeys:[],source:t.source,checkedAt:t.checkedAt,credits:[]});
   const item=tracks.get(t.id);if(!item.catalogKeys.includes(key))item.catalogKeys.push(key);
   for(const artist of artists)if(t.artistIds.includes(artist.id)&&!item.artistKeys.includes(artist.key))item.artistKeys.push(artist.key);
   for(const c of credits){
    creatorIds.add(c.personId);
    if(!item.credits.some(x=>x.personId===c.personId&&x.role===c.role&&x.raw===c.raw&&x.source===c.source))item.credits.push({personId:c.personId,role:c.role,raw:c.raw,source:c.source,checkedAt:t.checkedAt});
   }
  }
 }
 const creators=[...creatorIds].map(id=>{const p=people.get(id);return {id,name:p.name,kind:p.kind,source:p.source||'',identity:id.startsWith('n')?'platform':'credit-name'};}).sort((a,b)=>a.id.localeCompare(b.id));
 return {version:1,scope:'仅汇总已收录歌手的单曲明确署名；按平台歌曲 ID 去重，版本保留不同 ID，不代表创作者全部作品。未核验别名不自动合并。',artists,creators,tracks:[...tracks.values()].sort((a,b)=>a.id.localeCompare(b.id))};
}

export async function readCatalogEntries(directory){
 const text=await readFile(path.join(directory,'artists.js'),'utf8');
 const {artistProfiles}=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
 return Promise.all(Object.values(artistProfiles).map(async p=>({key:p.key,catalog:JSON.parse(await readFile(path.join(directory,p.file),'utf8'))})));
}

export async function readPortraits(directory){
 try{return (JSON.parse(await readFile(path.join(directory,'people-portraits.json'),'utf8'))).people||{};}
 catch{return {};}
}

// 发布用入口：先按平台数据汇聚，再过署名身份归并这一级。
export async function buildFromDirectory(directory,{merge=true}={}){
 const index=buildCreatorIndex(await readCatalogEntries(directory));
 return merge?mergeCreatorIdentities(index,await readPortraits(directory)):index;
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 const directory=path.resolve(process.argv[2]||'dist');
 const base=buildCreatorIndex(await readCatalogEntries(directory));
 const index=mergeCreatorIdentities(base,await readPortraits(directory));
 await writeFile(path.join(directory,'creator-index.json'),JSON.stringify(index));
 console.log(JSON.stringify({...mergeSummary(base,index),artists:index.artists.length,records:index.tracks.length,bytes:Buffer.byteLength(JSON.stringify(index))}));
}
