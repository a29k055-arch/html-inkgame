// Short deterministic ecology diagnostic. No GPU contact or 5–7 minute balance claim.
import assert from 'node:assert/strict';
import {RevealRun} from '../src/reveal/run.js';
const originalRandom=Math.random;
try{for(let seed=1;seed<=3;seed++){let n=seed;Math.random=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);const r=new RevealRun(()=>{},{duration:45,columns:48,completionThreshold:2,foodTarget:300,foodSpawnRate:20}),g=r.arena;
for(let i=0;i<902&&!r.finished;i++){const p=r.player;let target=g.foods.reduce((best,f)=>!best||Math.hypot(f.x-p.x,f.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?f:best,null)||g.center;const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;r.update(.05,{x:dx/d,y:dy/d});}
assert(r.finished&&r.result.reason==='timeout');assert(r.elapsed<=45.1);assert(r.mask.cells.every(v=>Number.isFinite(v)&&v>=0&&v<=1));const sum=r.mask.cells.reduce((a,b)=>a+b,0);assert(Math.abs(sum-r.mask.sum)<.001);assert(r.metrics.foodPickups>0);assert(g.ecology.npcFood>0);assert.equal(g.entities.filter(e=>!e.dead&&e.competitor).length,1);assert(g.entities.every(e=>Number.isFinite(e.r)&&e.r>0));console.log('PASS short ecology seed',seed,{food:r.metrics.foodPickups,npcFood:g.ecology.npcFood,npcSwallows:g.ecology.npcSwallows,progress:r.completion});}}
finally{Math.random=originalRandom;}
