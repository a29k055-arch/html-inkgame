import assert from 'node:assert/strict';
import {RevealRun} from '../src/reveal/run.js';
import {GrowthJourney,growthCameraTarget,followGrowthCamera,GROWTH_STAGES_CONFIG as C} from '../src/reveal/growth-stages.js';
import {reserveRadius,resetReserveOnDeath,syncReserve} from '../src/game/ink-reserve.js';
import {GAME_CONFIG} from '../src/game/config.js';
const r=new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,initialItems:0}),p=r.player;
assert.equal(p.ink,80);assert.equal(p.r,12);assert.equal(p.mass,144);
assert.equal(reserveRadius(p.ink,p.reserveRules),12);assert.notEqual(reserveRadius(p.ink),12,'legacy mapping is unchanged');
const originalMedium={r:24,mass:576};
assert(originalMedium.r>p.r*GAME_CONFIG.consumeRatio,'same medium actor is initially dangerous');
r.elapsed=1000;r.update(.01);assert.equal(r.journey.stage,1);assert.equal(r.state,'playing','no countdown or time gate');
p.effects.giant=3;p.r*=1.3;r.update(.01);assert.equal(r.journey.stage,1,'temporary size cannot promote');
p.effects={};p.ink=C.expansionInk;syncReserve(p,0,true);
const snapshot={ink:p.ink,mass:p.mass,r:p.r,world:{...r.world}};
assert(p.r>originalMedium.r*GAME_CONFIG.consumeRatio,'grown player can eat that same medium actor');
assert.deepEqual(originalMedium,{r:24,mass:576},'prey relationship changes without resizing the NPC');
const event=r.journey.update(p,0,r.elapsed);assert(event);assert.equal(r.journey.stage,2);assert.equal(r.journey.transitions,1);
assert.deepEqual({ink:p.ink,mass:p.mass,r:p.r,world:{...r.world}},snapshot,'stage does not shrink or rewrite world');
p.ink=80;syncReserve(p,0,true);r.journey.update(p,100,2000);assert.equal(r.journey.stage,2);
p.ink=5000;syncReserve(p,0,true);resetReserveOnDeath(p);assert(p.r>=12);assert(Math.abs(p.r-reserveRadius(p.ink,p.reserveRules))<1e-9);assert.equal(r.journey.stage,2);
for(const [width,height,mobile] of [[1440,900,false],[390,844,true],[844,390,true],[900,1440,false]]){
 const world={width:2606.6666667,height:3910};
 for(const ink of [80,900,1600,5000,25000]){
  p.ink=ink;syncReserve(p,0,true);r.journey.stage=ink<C.expansionInk?1:2;r.journey.transitionAge=0;p.x=world.width/2;p.y=world.height/2;
  let old=followGrowthCamera({x:0,y:0,scale:1},p,width,height,mobile,0,true,null,world);
  assert(Math.abs((p.x-old.x)*old.scale-width/2)<1e-6);
  for(const [x,y] of [[p.r,p.r],[world.width-p.r,p.r],[p.r,world.height-p.r],[world.width-p.r,world.height-p.r]]){
   p.x=x;p.y=y;const cam=followGrowthCamera(old,p,width,height,mobile,.016,false,null,world);
   assert(cam.x>=0&&cam.y>=0);assert(cam.x+width/cam.scale<=world.width+1e-6);assert(cam.y+height/cam.scale<=world.height+1e-6);
  }
 }
 p.ink=1600;syncReserve(p,0,true);r.journey.stage=1;p.x=1300;p.y=1900;
 const near=growthCameraTarget(p,mobile);let cam=followGrowthCamera({x:0,y:0,scale:1},p,width,height,mobile,0,true,null,world);
 r.journey.stage=2;r.journey.transitionAge=0;let maxStep=0;
 for(let i=0;i<240;i++){const next=followGrowthCamera(cam,p,width,height,mobile,1/60,false,null,world);maxStep=Math.max(maxStep,Math.abs(next.scale/cam.scale-1));cam=next;r.journey.transitionAge+=1/60;}
 assert(cam.scale<near*.65);assert(maxStep<.025,'smooth expansion, no one-frame zoom jump');
}
assert.equal(r.config.completionThreshold,.65);assert.equal(r.config.inkCompletionThreshold,.90);
console.log('PASS real-ink-only two-stage latch, V4-only reserve mapping/respawn, no countdown, immutable world/mass, smooth expansion and 4-aspect corner bounds');
