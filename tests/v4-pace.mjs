import assert from 'node:assert/strict';
import {REVEAL_CONFIG as C} from '../src/reveal/config.js';
import {RevealRun} from '../src/reveal/run.js';

assert.equal(C.completionThreshold,.65);assert.equal(C.inkCompletionThreshold,.90);
function crossing(config,hz,speed){
 const r=new RevealRun(()=>{},{...config,width:400,height:400,columns:80,aiCount:1,foodTarget:0,foodSpawnRate:0,initialItems:0});
 const n=r.arena.entities[1];n.x=170;n.y=200;n.r=32;n.dead=false;n.vx=speed;n.vy=0;
 r.mask.cells.fill(.6);r.mask.sum=r.mask.cells.reduce((a,b)=>a+b,0);r.mask.version++;
 r.temporary.cells.fill(.6);r.temporary.coverage.fill(.6);r.temporary.holdUntil.fill(100);r.temporary.version++;
 // Isolate actual swept erosion from AI steering, food, and new player paint.
 r.arena.update=dt=>{n.x+=speed*dt;};
 const before=r.completion;
 for(let i=0;i<hz;i++)r.update(1/hz);
 const loss=before-r.completion;
 assert(loss>0);assert(r.mask.at(n.x,n.y)<.6);assert(r.temporary.cells.some(v=>v<.6));
 const snapshot=r.completion;n.dead=true;for(let i=0;i<hz;i++)r.update(1/hz);
 assert(Math.abs(snapshot-r.completion)<1e-6,'erased paint cannot refill after NPC leaves');
 return loss;
}
const old={...C,erosionPerSecond:.42,erosionMovingFactor:.15};
for(const speed of [0,120]){
 const before=crossing(old,60,speed),after=crossing(C,60,speed);
 assert(after<before);assert(after>before*.15,'whitening must remain meaningful');
 const rates=[30,60,120].map(hz=>crossing(C,hz,speed));
 assert(Math.max(...rates)-Math.min(...rates)<.0005,'swept erosion remains frame-rate stable');
 console.log('swept loss',JSON.stringify({speed,before,after,rates}));
}
console.log('PASS unchanged65%/90% goals, slower but real two-layer whitening, no refill, 30/60/120Hz parity');

