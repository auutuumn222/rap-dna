import test from 'node:test';
import assert from 'node:assert/strict';
import {creatorDestination,creatorReturn} from '../dist/navigation.js';
const artists=new Map([['asen',{key:'asen',name:'Asen'}],['masiwei',{key:'masiwei',name:'马思唯'}]]);
test('creator links carry their source archive and return to backstage mode',()=>{
 const url=new URL(creatorDestination('n13911452',{artist:'asen',section:'network'}),'https://example.test/demo/');
 const back=creatorReturn(url.searchParams,artists);
 assert.equal(url.searchParams.get('creator'),'n13911452');assert.equal(back.url,'./?artist=asen&mode=credits#network');assert.equal(back.label,'回到 Asen 的合作网络');
 const track=new URL(creatorDestination('name/id',{artist:'asen',section:'archive'}),'https://example.test/demo/');assert.equal(track.searchParams.get('creator'),'name/id');assert.equal(creatorReturn(track.searchParams,artists).url,'./?artist=asen#archive');
});
test('comparison return preserves both people and rejects arbitrary destinations',()=>{
 assert.equal(creatorReturn(new URLSearchParams({from:'common',a:'asen',b:'masiwei'}),artists).url,'./?view=common&a=asen&b=masiwei');
 assert.equal(creatorReturn(new URLSearchParams({fromArtist:'https://elsewhere.test',fromSection:'javascript:bad'}),artists).url,'./#creators');
 assert.equal(creatorReturn(new URLSearchParams({fromArtist:'asen',fromSection:'not-a-section'}),artists).url,'./?artist=asen&mode=credits#network');
 assert.equal(creatorReturn(new URLSearchParams({from:'common',a:'unknown',b:'masiwei'}),artists).url,'./#creators');
});
