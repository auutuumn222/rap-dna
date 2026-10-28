import test from 'node:test';
import assert from 'node:assert/strict';
import {artists,tracks,collaborationEdges,shortestPaths,dnaFor} from '../dist/data.js';
test('every credit resolves to a unique artist, and every sample is marked demo',()=>{
  const ids=new Set(artists.map(a=>a.id));assert.equal(ids.size,artists.length);
  assert.equal(new Set(tracks.map(t=>t.id)).size,tracks.length);
  for(const t of tracks){assert.equal(t.demo,true);assert.ok(t.origin);for(const id of [...t.artists,...t.credits.map(([id])=>id)])assert.ok(ids.has(id));}
});
test('shortest paths are valid and have the independently computed minimum length for every pair',()=>{
  for(const includeProducers of [false,true]){
    const edges=collaborationEdges(includeProducers),adj=new Map(artists.map(a=>[a.id,new Set()]));
    for(const {a,b} of edges){adj.get(a).add(b);adj.get(b).add(a);}
    for(const from of artists){
      const distances=new Map([[from.id,0]]),queue=[from.id];
      while(queue.length){const id=queue.shift();for(const next of adj.get(id))if(!distances.has(next)){distances.set(next,distances.get(id)+1);queue.push(next);}}
      for(const to of artists){const paths=shortestPaths(from.id,to.id,{includeProducers});
        if(!distances.has(to.id)){assert.deepEqual(paths,[]);continue;}
        assert.ok(paths.length);assert.equal(new Set(paths.map(p=>p.join('|'))).size,paths.length);
        for(const path of paths){assert.equal(path[0],from.id);assert.equal(path.at(-1),to.id);assert.equal(path.length-1,distances.get(to.id));assert.equal(new Set(path).size,path.length);for(let i=1;i<path.length;i++)assert.ok(adj.get(path[i-1]).has(path[i]));}
      }
    }
  }
});
test('paths do not invent connections for missing or isolated artists',()=>{
  assert.deepEqual(shortestPaths('unknown','aire'),[]);assert.deepEqual(shortestPaths('masiwei','disconnected'),[]);assert.deepEqual(shortestPaths('masiwei','masiwei'),[['masiwei']]);
});
test('DNA aggregates track-level roles and deduplicates selected song IDs',()=>{
  const result=dnaFor(['do-it','wuyan','demo-01','demo-03','demo-08','demo-01']);
  const mai=result.find(r=>r.id==='mai');assert.equal(mai.count,4);assert.equal(mai.tracks.length,4);assert.deepEqual([...mai.roles].sort(),['制作','混音']);
  assert.equal(result.find(r=>r.id==='harikiri').count,3);assert.deepEqual(dnaFor([]),[]);
});
