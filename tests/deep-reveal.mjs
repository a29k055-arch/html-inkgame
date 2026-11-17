import assert from 'node:assert/strict';
import {RevealRun} from '../src/reveal/run.js';
import {RevealMask} from '../src/reveal/mask.js';
import {TemporaryReveal} from '../src/reveal/temporary.js';
import {REVEAL_CONFIG as C} from '../src/reveal/config.js';
import {DROP_ALPHA,dropStage} from '../src/reveal/drop-shape.js';
const m=new RevealMask({width:100,height:100,columns:100}),t=new TemporaryReveal(m,C),data=new Uint8ClampedArray(40000),k=5050;
for(let y=45;y<55;y++)for(let x=45;x<55;x++)data[(y*100+x)*4+3]=255;
t.applyContact({data,width:100,height:100},{x:0,y:0,scale:1},100,100,0);assert.equal(m.cells[k],1);assert.equal(m.cells[5040],0);assert.equal(m.cells[3050],0);
m.update(300);assert.equal(m.cells[k],1,'contact paint must remain without time expiry');
m.erode(50.5,50.5,5,1);t.noteErosion(50.5,50.5,5);const erased=m.cells[k];t.applyContact({data,width:100,height:100},{x:0,y:0,scale:1},100,100,301);assert.equal(m.cells[k],erased,'lingering alpha cannot undo erosion');
t.applyContact({data:new Uint8ClampedArray(40000),width:100,height:100},{x:0,y:0,scale:1},100,100,302);t.applyContact({data,width:100,height:100},{x:0,y:0,scale:1},100,100,303);assert.equal(m.cells[k],1);
assert.deepEqual(dropStage(1),DROP_ALPHA);for(let i=1;i<=32;i++){const a=dropStage((i-1)/32),b=dropStage(i/32);assert(b.every((v,k)=>v>=a[k]&&v<=DROP_ALPHA[k]));}
const stamp=new RevealMask({width:400,height:400,columns:96});stamp.stampDrop({x:200,y:200,r:200,age:C.bloomDuration,angle:0});assert(stamp.completion>0&&stamp.completion<1);const progress=stamp.completion;stamp.update(60);assert.equal(stamp.completion,progress);stamp.erode(200,200,60,1);assert(stamp.completion<progress);
for(const threshold of [.50,.75,.85]){const r=new RevealRun(()=>{},{width:100,height:100,columns:10,aiCount:0,foodTarget:0,foodSpawnRate:0,initialItems:0,completionThreshold:threshold});r.mask.fill(threshold-.01);assert(!r.checkGoal());r.mask.fill(threshold+.01);assert(r.checkGoal());const state=[r.elapsed,r.completion,r.player.x,r.player.y];for(let i=0;i<80;i++)r.update(.05,{x:1,y:0});assert.deepEqual([r.elapsed,r.completion,r.player.x,r.player.y],state,'goal freezes game and mask');const result=r.finish('complete');assert(result.completed);assert.equal(r.finish(),result);}
console.log('PASS permanent contact, erosion/reentry, monotonic Drops alpha and explicit frozen-goal completion');
