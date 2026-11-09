import assert from 'node:assert/strict';
import {StartTransition} from '../src/ink/start-transitions.js';

// The real atlas / pixel-alpha browser checks remain in work/nov10-pair-transition-qa.json.
// This fast lifecycle test verifies the public contract without starting a browser.
const events=new Map(),documentEvents=new Map();let clock=0;
Object.assign(globalThis,{innerWidth:901,innerHeight:601,devicePixelRatio:1.25,
 requestAnimationFrame:callback=>setImmediate(()=>callback(clock+=16)),
 document:{hidden:false,addEventListener:(name,callback)=>documentEvents.set(name,callback),removeEventListener:name=>documentEvents.delete(name)},
 addEventListener:(name,callback,{signal}={})=>{events.set(name,callback);signal?.addEventListener('abort',()=>events.delete(name));}});
function make(options={}){
 const draws=[],ctx={globalAlpha:1,setTransform(){},clearRect(){this.opaque=false;},drawImage(image){draws.push(image.id);},fillRect(){if(this.globalAlpha===1)this.opaque=true;}},canvas={style:{},hidden:true,getContext:()=>ctx,setAttribute(){},removeAttribute(){}};
 const items=['a','b','c'].map(id=>({id,image:{id},frames:36,columns:6,width:256,height:135}));
 const transition=new StartTransition(canvas,{coverDuration:0,revealDuration:0,preload:async()=>({items}),random:()=>0,...options});
 return {transition,canvas,ctx,draws,items};
}
const first=make();let release,callbackCount=0,signal;
const pending=first.transition.run(async incoming=>{signal=incoming;callbackCount++;assert.equal(first.transition.phase,'changing');assert(first.ctx.opaque);assert(!first.canvas.hidden);assert.equal(first.transition.currentId,first.transition.currentIds[0]);await new Promise(resolve=>release=resolve);});
while(!release)await new Promise(setImmediate);
assert.equal(await first.transition.run(()=>callbackCount++),false);
globalThis.innerWidth=393;globalThis.innerHeight=851;events.get('resize')();
assert(first.ctx.opaque);assert.equal(first.canvas.width,491);assert.equal(first.canvas.height,1064);
release();assert.equal(await pending,true);assert.equal(callbackCount,1);assert.equal(first.transition.switches,1);assert(!signal.aborted);assert(first.canvas.hidden&&!first.transition.busy);assert.equal(first.transition.phase,'idle');assert.notEqual(...first.transition.currentIds);assert.equal(first.transition.currentId,first.transition.currentIds[1]);assert.deepEqual([...new Set(first.draws)],first.transition.currentIds);
const last=first.transition.currentId;
await first.transition.run(()=>callbackCount++);assert.notEqual(first.transition.currentIds[0],last);assert.equal(callbackCount,2);assert.equal(first.transition.switches,2);
const fallback=make({preload:async()=>{throw Error('asset failure')}});let fallbackCount=0;
assert.equal(await fallback.transition.run(()=>{fallbackCount++;assert(fallback.ctx.opaque);}),true);assert.equal(fallbackCount,1);assert(fallback.transition.fallback);assert.deepEqual(fallback.transition.currentIds,['fallback','fallback']);assert(fallback.canvas.hidden);
const failure=make();await assert.rejects(failure.transition.run(()=>{throw Error('scene failure')}),/scene failure/);assert.equal(failure.transition.switches,0);assert(failure.canvas.hidden&&!failure.transition.busy);assert.equal(failure.transition.phase,'idle');assert.equal(documentEvents.size,0);assert.equal(events.size,0);
console.log('PASS pair lifecycle: actual two atlas draw sources, opaque single awaited scene callback, busy gate, resize, adjacent-repeat prevention, asset fallback, rejected-scene cleanup');
