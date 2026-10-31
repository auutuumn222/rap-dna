import {identityRegistry} from './identity-registry.js';

export function createIdentityResolver(registry){
 const entities=new Map(),aliases=new Map();
 for(const entity of registry.entities){
  if(!/^(?:n\d+|c[A-Za-z0-9_-]+)$/.test(entity.id)||entities.has(entity.id))throw Error('Invalid canonical identity: '+entity.id);
  entities.set(entity.id,entity);
  for(const alias of entity.aliases){
   if(!/^(?:c[A-Za-z0-9_-]+|nunlinked-[A-Za-z0-9_-]+|u[A-Za-z0-9_-]+)$/.test(alias.id)||alias.id===entity.id||aliases.has(alias.id)||!alias.evidence?.length)throw Error('Invalid or conflicting identity alias: '+alias.id);
   aliases.set(alias.id,entity.id);
  }
 }
 for(const id of entities.keys())if(aliases.has(id))throw Error('Canonical identity cannot also be an alias: '+id);
 const resolve=id=>aliases.get(id)||id;
 function person(id,fallback={}){
  const canonical=resolve(id),entity=entities.get(canonical);if(!entity)return {...fallback,id:canonical};
  return {...fallback,id:canonical,name:entity.name,source:entity.source,kind:entity.kind||(/^n\d+$/.test(canonical)?'person':'credit'),aliases:[...new Set([...(fallback.aliases||[]),...entity.aliases.map(a=>a.name)])],aliasIds:entity.aliases.map(a=>a.id),identityEvidence:entity.aliases,identityReviewedAt:entity.reviewedAt};
 }
 function catalog(input){
  const original=new Map(input.people.map(p=>[p.id,p])),merged=new Map();
  for(const p of input.people){const id=resolve(p.id);merged.set(id,person(id,original.get(id)||merged.get(id)||p));}
  const tracks=input.tracks.map(t=>({...t,artistIds:[...new Set(t.artistIds.map(resolve))],credits:t.credits.map(c=>({...c,personId:resolve(c.personId),originalPersonId:c.originalPersonId||c.personId,originalName:c.originalName||original.get(c.personId)?.name||c.personId}))}));
  return {...input,people:[...merged.values()],tracks};
 }
 return {resolve,person,catalog,aliases:Object.fromEntries(aliases)};
}
export const identities=createIdentityResolver(identityRegistry);
export const resolvePersonId=identities.resolve;
export const resolveCatalogIdentities=identities.catalog;
