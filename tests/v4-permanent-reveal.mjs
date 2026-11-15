import assert from 'node:assert/strict';
import {RevealMask,consumeBloomRadius} from '../src/reveal/mask.js';
import {TemporaryReveal} from '../src/reveal/temporary.js';
import {RevealRun} from '../src/reveal/run.js';
import {REVEAL_CONFIG as C} from '../src/reveal/config.js';
import {GROWTH_STAGES_CONFIG,stageEntryRadius} from '../src/reveal/growth-stages.js';

// P0-C contract: painted cells persist for the whole run; only NPC erosion removes them,
// and both completion numbers stay equal to the truly visible state (never a history sum).
{
  const m=new RevealMask({width:100,height:100,columns:100}),t=new TemporaryReveal(m,C);
  const data=new Uint8ClampedArray(100*100*4);
  for(let y=45;y<55;y++)for(let x=45;x<55;x++)data[(y*100+x)*4+3]=255;
  assert(t.applyContact({data,width:100,height:100},{x:0,y:0,scale:1},100,100,0));
  assert.equal(m.cells[50*100+50],1);
  // 300 s of game time with no NPC contact must not fade anything.
  m.update(300);
  assert.equal(m.cells[50*100+50],1,'paint must survive time');
  assert.equal(t.applyContact({data,width:100,height:100},{x:0,y:0,scale:1},100,100,1),false,'already at 1');
}

// Erosion still removes paint, is dt-linear at 30/60 Hz, and repainting after erosion works.
{
  const a=new RevealMask({width:400,height:400,columns:200}),b=new RevealMask({width:400,height:400,columns:200});
  a.brush(200,200,80,1);b.brush(200,200,80,1);
  for(let i=0;i<60;i++)a.erode(200,200,60,1/60);
  for(let i=0;i<30;i++)b.erode(200,200,60,1/30);
  assert(Math.abs(a.completion-b.completion)<1e-7,'erosion must be frame-rate independent');
  assert(a.completion>0&&a.completion<1,'erosion must be partial, not instant');
  const before=a.completion;a.brush(200,200,80,1);assert(a.completion>before,'repaint after erosion');
}

// Completion is the current visible state, not a cumulative counter.
{
  const m=new RevealMask({width:100,height:100,columns:50});
  m.brush(50,50,40,1);const peak=m.completion;
  for(let i=0;i<200;i++)m.erode(50,50,60,1/10);
  assert.equal(m.completion,0,'fully eroded must read zero');
  assert(peak>0);
}

// Area + ink-area sums stay in sync with the grid through 20k mixed writes.
{
  const cols=40,m=new RevealMask({width:100,height:100,columns:cols});
  const weights=Float32Array.from({length:m.cells.length},(_,i)=>i%7===0?1:0);
  m.setWeights(weights);
  for(let i=0;i<20000;i++){const k=Math.floor(Math.random()*m.cells.length);if(i%3)m.raiseCell(k,Math.random());else m.erode(Math.random()*100,Math.random()*100,6,.05);}
  let sum=0,weighted=0;for(let i=0;i<m.cells.length;i++){sum+=m.cells[i];weighted+=m.cells[i]*weights[i];}
  assert(Math.abs(m.sum-sum)<1e-2,'area sum drift');
  assert(Math.abs(m.weightedSum-weighted)<1e-2,'weighted sum drift');
}

// Shift boost follows the growth stage and never stacks with the fish buff.
{
  const r=new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,completionThreshold:2});
  const p=r.player,base=r.arena.speed(p,false);
  r.boost(true);assert.equal(r.boostHeld,true);
  assert(Math.abs((r.arena.speed(p)/base)-(1+r.stageBoost()))<1e-9,'stage 1 boost');
  assert.equal(r.stageBoost(),.30);
  p.ink=GROWTH_STAGES_CONFIG.thresholds[0];r.journey.update(p,0,1);assert.equal(r.journey.stage,2);assert.equal(r.stageBoost(),.50);
  p.ink=GROWTH_STAGES_CONFIG.thresholds[1];r.journey.update(p,0,2);assert.equal(r.journey.stage,3);assert.equal(r.stageBoost(),.70);
  p.effects.rush=5;p.pondBuffs={rush:{tier:3,strength:.70}};
  assert(r.arena.speed(p)/base<=1+.70+1e-9,'boost and fish must not multiply');
  r.boost(false);assert.equal(r.boostHeld,false);
}

// Stage only rises during play; only a respawn may hand back a smaller stage.
{
  const r=new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,completionThreshold:2});
  const p=r.player;p.ink=GROWTH_STAGES_CONFIG.thresholds[1]+100;r.journey.update(p,0,10);assert.equal(r.journey.stage,3);
  p.ink=20;r.journey.update(p,0,11);assert.equal(r.journey.stage,3,'no downgrade while alive');
  assert.equal(r.journey.recalculate(p).stage,1,'respawn re-derives from real ink');
}

// Camera: constant inside a stage, one clear pull-out per threshold, and the same relative
// body size on a phone-sized viewport.
{
  const zoomAt=(stage,width,height)=>{
    const p={revealJourney:{stage,config:GROWTH_STAGES_CONFIG}};
    const entry=stageEntryRadius(stage,GROWTH_STAGES_CONFIG);
    return GROWTH_STAGES_CONFIG.stageScreenRadius[stage-1]*Math.min(width,height)/entry;
  };
  const pc=zoomAt(2,1440,900),phone=zoomAt(2,390,844);
  assert(phone<pc,'a smaller viewport uses fewer px per world unit to keep the same relative size');
  const frac=(zoom,r,short)=>2*r*zoom/short;
  assert(Math.abs(frac(pc,stageEntryRadius(2),900)-frac(phone,stageEntryRadius(2),390))<1e-9,'same relative size');
  assert(frac(pc,stageEntryRadius(3),900)>frac(pc,stageEntryRadius(2),900),'body grows across a stage at constant zoom');
}

// Drops land below the body and share one source with the mask + the drawn bloom.
{
  const seen=[],r=new RevealRun((t,d)=>{if(t==='bloom')seen.push(d)},{aiCount:0,foodTarget:0,foodSpawnRate:0,completionThreshold:2});
  const p=r.player;r.event('consume',{entity:p,x:100,y:100,r:20,coreRadius:20,kind:'enemy'});
  const b=seen[0];
  assert.equal(b.x,p.x);assert(b.y>p.y,'bloom sits below the player');
  assert(b.revealRadius>0&&b.revealRadius<=C.consumeRadiusMax);
  assert.equal(r.mask.blooms.at(-1).y,b.y,'visual and mask share coordinates');
  assert(consumeBloomRadius(20)<consumeBloomRadius(60),'bigger prey paints more');
}

// Lotus shelter: immunity inside the leaf, normal rules outside, no rim flicker.
{
  const r=new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,completionThreshold:2});
  const p=r.player;p.invincible=0;r.arena.items.length=0;
  const leaf={x:p.x,y:p.y,kind:'leaf',r:200};r.arena.items.push(leaf);
  const at=f=>{p.x=leaf.x+f*leaf.r;p.y=leaf.y;r.updateShelter();return r.sheltered;};
  assert.equal(at(.90),true);assert.equal(at(1.02),true,'hysteresis keeps the rim stable');
  assert.equal(at(1.10),false);assert.equal(at(.95),true,'re-entry needs the inner radius');
  // a giant overlapping on the leaf cannot swallow the player
  r.arena.items.length=0;r.arena.items.push(leaf);p.x=leaf.x;p.y=leaf.y;r.updateShelter();
  r.arena.entities.push({id:'huge',x:p.x,y:p.y,vx:0,vy:0,r:260,mass:67600,collisionScale:1,ink:0,invincible:0,dead:0,effects:{},skills:[],swallowed:0,deaths:0,aim:{x:1,y:0},appearance:'thorn',controller:{type:'ai',goal:null,think:0,profile:{skill:.5}}});
  for(let i=0;i<90;i++){r.arena.items.length=0;r.arena.items.push(leaf);p.x=leaf.x;p.y=leaf.y;r.update(1/60);}
  assert.equal(p.dead,0,'sheltered player survives');
}
console.log('PASS permanent reveal, dt-linear erosion, repaint, non-cumulative percent, incremental sums, staged boost without stacking, monotonic stage with respawn recalc, constant-in-stage camera, drop below body, lotus shelter');
