import assert from 'node:assert/strict';
import {RevealRun} from '../src-v5/reveal/run.js';
import {GrowthEcology} from '../src-v5/reveal/growth-ecology.js';
import {entity} from '../src-v5/game/inkstone.js';
import {aiController} from '../src-v5/game/ai.js';
import {advancePondEntry,steerLivingVelocity} from '../src-v5/game/pond-entry.js';
import {livingInk} from '../src-v5/game/living-resource.js';
import {syncReserve} from '../src-v5/game/ink-reserve.js';
const fixture=(more={})=>new RevealRun(()=>{},{columns:24,foodTarget:0,foodSpawnRate:0,completionThreshold:2,inkCompletionThreshold:2,pond:{initialLeaves:0},living:{dragonEnabled:false},...more});
{
 const g=fixture(),a=g.arena,w=a.world;
 for(const e of a.entities.slice(1)){
  assert(e.entering&&e.entry);assert(e.x<-e.r||e.y<-e.r||e.x>w.width+e.r||e.y>w.height+e.r);
  const before={x:e.x,y:e.y};a.constrain(e);assert.deepEqual({x:e.x,y:e.y},before,'constraints cannot teleport entry bodies');
  assert(!a.kill(e,g.player),'entry cannot be farmed outside paper');
  let steps=0;while(e.entering&&steps++<600)advancePondEntry(e,a,.05);
  assert(!e.entering&&e.entry.age>0);assert(e.x>=e.r&&e.y>=e.r&&e.x<=w.width-e.r&&e.y<=w.height-e.r);
 }
 const e=a.entities[1];a.respawn(e);assert(e.entering&&e.entry.age===0,'respawns use an edge route too');
 g.journey.stage=2;g.living.tick(0);const big=a.entities.filter(e=>e.birthSlot>=10);assert.equal(big.length,2);assert(big.every(e=>e.entering));
 g.living.config.dragonEnabled=true;g.elapsed=60;g.living.tick(0);assert(g.living.dragon?.entering);
}
{
 const g=fixture(),a=g.arena,means=[];
 for(const stage of [1,2,3,4]){
  const eco=new GrowthEcology(()=>stage,{},()=>.75),samples=Array.from({length:30},(_,i)=>eco.spawn(a,i%4));
  const rs=samples.map(e=>e.radius);means.push(rs.reduce((a,b)=>a+b)/rs.length);
  if(stage===1)assert(rs.every(r=>r<=4.5),'only tiny shrimp enter in stage one');
 }
 assert(means.every((m,i)=>!i||m>means[i-1]),'later phases favour larger incoming shrimp');
}
{
 const g=fixture({aiCount:0}),a=g.arena,p=g.player;
 p.ink=7589;syncReserve(p,0,true);const unprojected=a.speed(p,false);a.playerScreenScale=()=>.4;const faster=a.speed(p,false);
 assert(unprojected>=166&&faster>=300&&faster<=400);assert(faster*.4>=120&&faster>unprojected);
 a.playerScreenScale=()=>.05;assert.equal(a.speed(p,false),400);p.effects.rush=5;p.pondBuffs={rush:{strength:1}};assert.equal(a.speed(p),800,'active boost remains separate');
 for(const species of ['fish','turtle','dragon']){const e={vx:120,vy:0,aim:{x:1,y:0},form:{species,remaining:5}},v=steerLivingVelocity(e,{x:-1,y:0},140,.1);assert(v.x>0&&v.y>0,'reversal begins a forward arc, not a spin');assert(Math.hypot(v.x,v.y)>120);}
}
{
 const g=fixture({aiCount:0}),a=g.arena,p=g.player;p.invincible=0;
 const fish=Object.assign(entity('ink-fish',p.x,p.y,10,aiController(0)),{species:'fish',appearance:'living'});a.entities=[p,fish];
 assert.equal(livingInk(fish),200);p.ink=190;syncReserve(p,0,true);a.update(0,{x:0,y:0});assert(!fish.dead,'radius advantage alone is insufficient');
 p.ink=201;syncReserve(p,0,true);a.update(0,{x:0,y:0});assert(fish.dead>0&&p.form.species==='fish');
 assert(Math.abs(livingInk({species:'shrimp',mass:9})-10.8)<1e-9);assert(Math.abs(livingInk({species:'turtle',mass:784})-548.8)<1e-9);assert.equal(livingInk({...p,ink:1200,turtleInk:200}),1200,'temporary real ink is included in swallowing eligibility');
}
{
 const g=fixture({aiCount:0}),a=g.arena,p=g.player;a.movement={...a.movement,nearbyFoodChance:1};
 for(let i=0;i<40;i++){const f=a.food(true);assert(f.nearPlayer);assert(Math.hypot(f.x-p.x,f.y-p.y)>=p.r+32);assert.equal(f.alpha,0);a.foods.push(f);}
 a.update(.2,{x:0,y:0});assert(a.foods.every(f=>f.alpha>0&&f.alpha<f.baseAlpha));a.update(.3,{x:0,y:0});assert(a.foods.every(f=>f.alpha===f.baseAlpha));
 const first=a.foods[0];a.foods=Array.from({length:220},()=>({...first,x:p.x+100,y:p.y+100}));assert(!a.food(true).nearPlayer,'nearby density budget prevents unlimited local stocking');
 const normal=new RevealRun(()=>{},{columns:24,aiCount:0,living:{dragonEnabled:false}});assert.equal(normal.config.foodTarget,1850);assert.equal(normal.config.foodSpawnRate,120);
}
{const g=fixture(),a=g.arena,e=a.entities.find(e=>e.species==='fish');g.journey.stage=4;assert.equal(a.npcRadiusLimit(e),18);e.r=18;e.mass=324;g.journey.stage=1;assert.equal(a.npcRadiusLimit(e),18,'player regression does not shrink a surviving grown NPC');a.respawn(e);assert.equal(a.npcRadiusLimit(e),9,'a new individual restarts with the current low-stage birth cap');}
console.log('PASS outside-edge entry/respawn, staged incoming bands, persistent dragon entry, ink-based swallowing, arc steering, projected-speed floor and bounded fading local food');
