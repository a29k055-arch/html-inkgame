import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prefetchV5Resources,creatureResourceURL,resourceBytes} from '../src-v5/reveal/resource-loader.js';
import {V5_CREATURE_RESOURCES} from '../src-v5/reveal/resource-manifest.js';
import {LoadingScroll,formatResourceProgress} from '../src-v5/ui/loading-scroll.js';

assert.equal(V5_CREATURE_RESOURCES.length,124);
assert.equal(resourceBytes,25301802);
for(const file of V5_CREATURE_RESOURCES)assert.equal(fs.statSync(new URL('../'+file.path,import.meta.url)).size,file.bytes,file.path+' manifest matches runtime file');
assert(V5_CREATURE_RESOURCES.every(file=>!file.path.includes('masters/')&&!file.path.includes('evidence/')));
const url=new URL(creatureResourceURL(V5_CREATURE_RESOURCES[0],'https://example.test/game/src-v5/reveal/resource-loader.js'));
assert(url.pathname.startsWith('/game/previews/creature-rig/'));
assert(url.searchParams.get('inkRigRev'));
let active=0,maximum=0,ticks=0;const events=[],requests=[];
const resources=[{path:'previews/creature-rig/a.bin',bytes:5},{path:'previews/creature-rig/b.bin',bytes:3},{path:'previews/creature-rig/c.bin',bytes:4}];
const result=await prefetchV5Resources({resources,concurrency:2,now:()=>++ticks*10,onProgress:q=>events.push(q),fetcher:async(url,options)=>{
 requests.push({url,options});active++;maximum=Math.max(active,maximum);await new Promise(r=>setTimeout(r,1));
 const size=resources.find(file=>url.includes(file.path)).bytes;let n=0;
 return {ok:true,body:{getReader:()=>({read:async()=>{if(n++===0)return{done:false,value:new Uint8Array(size-1)};if(n===2)return{done:false,value:new Uint8Array(1)};active--;return{done:true};}})}};
}});
assert.equal(maximum,2);assert.equal(result.loadedBytes,12);assert.equal(result.totalBytes,12);assert.equal(result.progress,1);assert.equal(result.completed,3);assert.equal(result.phase,'download-ready');assert(result.elapsedMs>0);
assert(events.some(q=>q.progress>0&&q.progress<1));assert(requests.every(q=>q.options.cache==='force-cache'));
await assert.rejects(prefetchV5Resources({resources:resources.slice(0,1),fetcher:async()=>({ok:false,status:404})}),/404/);
const fallback=await prefetchV5Resources({resources:resources.slice(0,1),fetcher:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(7)})});assert.equal(fallback.loadedBytes,7);assert.equal(fallback.totalBytes,7);assert.equal(fallback.progress,1);
assert.match(formatResourceProgress({loadedBytes:5e6,totalBytes:10e6,progress:.5,elapsedMs:2500},'zh-CN'),/5\.00 \/ 10\.00 MB · 50% · 已用 2秒/);
assert.match(formatResourceProgress({loadedBytes:5e6,totalBytes:10e6,progress:.5},'en'),/Creature resources/);
assert.match(formatResourceProgress({loadedBytes:5e6,totalBytes:10e6,progress:.5},'ja'),/生き物の素材/);

const fixture=()=>({done:new Set(),partials:new Map(),weights:{creatures:1},total:1,target:0,updateTarget:LoadingScroll.prototype.updateTarget});
const loader=fixture();let resolve;const pending=LoadingScroll.prototype.track.call(loader,'creatures',new Promise(r=>resolve=r),{required:true,timeoutMs:1});await new Promise(r=>setTimeout(r,5));assert.equal(loader.done.size,0,'required startup never times out into gameplay');resolve();await pending;assert(loader.done.has('creatures'));
const broken=fixture();await assert.rejects(LoadingScroll.prototype.track.call(broken,'creatures',Promise.reject(Error('critical animation failed')),{required:true}),/critical animation failed/);assert.equal(broken.done.size,0);
console.log('PASS accurate 124-file/25.30MB runtime manifest, streamed cache-compatible bytes, localized progress, changed-size fallback and strict animation startup gate');
