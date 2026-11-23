import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prefetchV5Resources,creatureResourceURL,resourceBytes} from '../src-v5/reveal/resource-loader.js';
import {V5_CREATURE_RESOURCES} from '../src-v5/reveal/resource-manifest.js';
import {LoadingScroll,formatResourceProgress,titleRevealTarget} from '../src-v5/ui/loading-scroll.js';

assert.equal(V5_CREATURE_RESOURCES.length,128);
assert.equal(resourceBytes,25332337);
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
await assert.rejects(prefetchV5Resources({resources:resources.slice(0,1),retries:0,fetcher:async()=>({ok:false,status:404})}),/404/);
const fallback=await prefetchV5Resources({resources:resources.slice(0,1),fetcher:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(7)})});assert.equal(fallback.loadedBytes,7);assert.equal(fallback.totalBytes,7);assert.equal(fallback.progress,1);
assert.match(formatResourceProgress({loadedBytes:5e6,totalBytes:10e6,progress:.5,elapsedMs:2500},'zh-CN'),/5\.00 \/ 10\.00 MB · 50% · 已用 2秒/);
assert.match(formatResourceProgress({loadedBytes:5e6,totalBytes:10e6,progress:.5},'en'),/Creature resources/);
assert.match(formatResourceProgress({loadedBytes:5e6,totalBytes:10e6,progress:.5},'ja'),/生き物の素材/);

const fixture=()=>({done:new Set(),partials:new Map(),weights:{creatures:1},total:1,target:0,updateTarget:LoadingScroll.prototype.updateTarget});
const loader=fixture();let resolve;const pending=LoadingScroll.prototype.track.call(loader,'creatures',new Promise(r=>resolve=r),{required:true,timeoutMs:1});await new Promise(r=>setTimeout(r,5));assert.equal(loader.done.size,0,'required startup never times out into gameplay');resolve();await pending;assert(loader.done.has('creatures'));
const broken=fixture();await assert.rejects(LoadingScroll.prototype.track.call(broken,'creatures',Promise.reject(Error('critical animation failed')),{required:true}),/critical animation failed/);assert.equal(broken.done.size,0);

// Both a fetch that never returns headers and a reader that stops mid-body are
// bounded by the same complete-file deadline, even if the mock ignores abort.
for(const phase of ['fetch','reader']){
 const attempts=[],partial=[];let cancelled=0;
 const fetcher=async(url,options)=>{attempts.push(options);if(phase==='fetch')return new Promise(()=>{});let n=0;return{ok:true,body:{getReader:()=>({read:async()=>n++===0?{done:false,value:new Uint8Array(2)}:new Promise(()=>{}),cancel:async()=>{cancelled++;}})}};};
 await assert.rejects(prefetchV5Resources({resources:resources.slice(0,1),fetcher,timeoutMs:8,retryDelayMs:0,onProgress:q=>partial.push(q)}),/timeout.*a\.bin/);
 assert.equal(attempts.length,3,'one initial request and at most two retries');
 assert.deepEqual(attempts.map(a=>a.cache),['force-cache','reload','reload']);
 assert(attempts.every(a=>a.signal.aborted),'deadline aborts each request');
 assert.equal(partial.at(-1).retryCount,2);assert(!partial.some(q=>q.phase==='download-ready'));
 if(phase==='reader')assert.equal(cancelled,3,'stalled readers are cancelled too');
}
{
 let attempts=0;const progress=[];
 const recovered=await prefetchV5Resources({resources:resources.slice(0,1),timeoutMs:8,retryDelayMs:0,onProgress:q=>progress.push(q),fetcher:async()=>{
  if(attempts++===0){let first=true;return{ok:true,body:{getReader:()=>({read:async()=>first?(first=false,{done:false,value:new Uint8Array(2)}):new Promise(()=>{}),cancel:async()=>{}})}};}
  return{ok:true,arrayBuffer:async()=>new ArrayBuffer(5)};
 }});
 assert.equal(attempts,2);assert.equal(recovered.retryCount,1);assert.equal(recovered.loadedBytes,5,'failed partial bytes cannot count twice');assert.equal(recovered.completed,1);assert.equal(recovered.progress,1);
}
{
 const calls=[];await assert.rejects(prefetchV5Resources({resources:resources.slice(0,1),retries:2,retryDelayMs:0,fetcher:async(_,options)=>{calls.push(options);throw Error('network offline');}}),/network offline/);assert.equal(calls.length,3);
}

assert.equal(titleRevealTarget({complete:true,naturalWidth:0},1,false),0);
assert.equal(titleRevealTarget({complete:true,naturalWidth:0},1,true),1);
assert.equal(titleRevealTarget(null,1,true),1);
// Drive the actual menu-release gate with a broken optional title image; both
// decode rejection and a decode that never settles must still reach finish().
for(const timeout of [false,true]){
 const loader={...fixture(),weights:{title:1},done:new Set(),partials:new Map(),titleReveal:0,menuReveal:0,progress:0,failed:false,scroll:{style:{setProperty(){}},dataset:{}},renderResourceLines(){}};
 const previousWarn=console.warn;console.warn=()=>{};
 try{await LoadingScroll.prototype.track.call(loader,'title',timeout?new Promise(()=>{}):Promise.reject(Error('missing optional title')),{timeoutMs:2});}finally{console.warn=previousWarn;}
 assert(loader.done.has('title'));
 const bar={},root={hidden:false,querySelector:()=>bar,classList:{add(){}}};loader.root=root;
 const previous={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame,removeEventListener:globalThis.removeEventListener};
 globalThis.document={querySelector:()=>({complete:true,naturalWidth:0}),body:{style:{setProperty(){}},classList:{remove(){}}}};globalThis.window={};globalThis.requestAnimationFrame=()=>1;globalThis.removeEventListener=()=>{};
 try{
  const finished=LoadingScroll.prototype.finish.call(loader);for(let i=0;i<200&&loader.scroll.dataset.state!=='home';i++)LoadingScroll.prototype.tick.call(loader,i*50+1);
  await finished;assert(root.hidden);assert.equal(loader.scroll.dataset.state,'home');assert.equal(window.loadingMetrics.progress,1);
 }finally{for(const [key,value]of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
}
console.log('PASS accurate 128-file/25.33MB manifest, byte/cache progress, strict preparation, fetch/body deadlines with bounded reload retries, and optional-title failure/timeout menu release');
