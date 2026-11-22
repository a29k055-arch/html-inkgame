import {INK_CREATURE_REV} from '../../previews/creature-rig/runtime/ink-creature.mjs';
import {V5_CREATURE_RESOURCES} from './resource-manifest.js';

export const resourceBytes=V5_CREATURE_RESOURCES.reduce((sum,file)=>sum+file.bytes,0);
export function creatureResourceURL(file,base=import.meta.url){const url=new URL('../../'+file.path,base);url.searchParams.set('inkRigRev',INK_CREATURE_REV);return url.href;}

// Byte progress describes resources made available to this boot, including a
// browser cache hit. It is not a claim that every byte crossed the network.
// Fetch the exact runtime URLs and let the HTTP cache serve subsequent Image /
// rig reads. Never duplicate all images in an application-level Blob cache.
export async function prefetchV5Resources({onProgress=()=>{},fetcher=globalThis.fetch,resources=V5_CREATURE_RESOURCES,concurrency=4,now=()=>performance.now(),base=import.meta.url}={}){
 const started=now(),totalBytes=resources.reduce((sum,file)=>sum+file.bytes,0),loaded=new Map(),lengths=new Map(resources.map(file=>[file.path,file.bytes]));let completed=0,next=0,cacheHits=0,networkBytes=0;
 const report=phase=>{const bytes=[...loaded.values()].reduce((sum,n)=>sum+n,0),total=[...lengths.values()].reduce((sum,n)=>sum+n,0);const state={phase,loadedBytes:bytes,totalBytes:total,progress:total?Math.min(1,bytes/total):1,completed,total:resources.length,elapsedMs:Math.max(0,now()-started),cacheHits,networkBytes};onProgress(state);return state;};
 report('download');
 async function worker(){while(next<resources.length){const file=resources[next++],url=creatureResourceURL(file,base),response=await fetcher(url,{cache:'force-cache'});if(!response.ok)throw Error('Cannot prepare creature resource: '+response.status+' '+file.path);let count=0;
   if(response.body?.getReader){const reader=response.body.getReader();for(;;){const {value,done}=await reader.read();if(done)break;count+=value.byteLength;loaded.set(file.path,count);if(count>lengths.get(file.path))lengths.set(file.path,count);report('download');}}
   else{count=(await response.arrayBuffer()).byteLength;loaded.set(file.path,count);}
   // A changed source size is reflected honestly instead of freezing at 99%.
   lengths.set(file.path,count);completed++;
   const timing=globalThis.performance?.getEntriesByName?.(url)?.at(-1);if(timing){networkBytes+=timing.transferSize||0;if(timing.transferSize===0&&timing.decodedBodySize>0)cacheHits++;}
   report('download');
  }}
 await Promise.all(Array.from({length:Math.min(Math.max(1,concurrency),resources.length)},worker));
 return {...report('download-ready'),manifestBytes:totalBytes};
}
