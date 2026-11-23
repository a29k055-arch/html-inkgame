import {GameRenderer} from '../src-v5/ink/game-renderer.js';
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
 const g=fixture(),a=g.arena,p=g.player;
 p.ink=7589;syncReserve(p,0,true);const unprojected=a.speed(p,false);a.playerScreenScale=()=>.4;const faster=a.speed(p,false);
 assert(unprojected>=166&&faster>=300&&faster<=400);assert(faster*.4>=120&&faster>unprojected);
 a.playerScreenScale=()=>.6;
 const npc=a.entities[1],npcSpeed=a.speed(npc,false);
 a.viewportShortSide=()=>900;
 assert.equal(a.speed(p,false),330);
 a.viewportShortSide=()=>390;
 assert.equal(a.speed(p,false),unprojected);
 assert.equal(a.speed(npc,false),npcSpeed);
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
 const normal=new RevealRun(()=>{},{columns:24,aiCount:0,living:{dragonEnabled:false}});assert.equal(normal.config.foodTarget,1850);assert.equal(normal.config.foodSpawnRate,45);
}
{const g=fixture(),a=g.arena,e=a.entities.find(e=>e.species==='fish');g.journey.stage=4;assert.equal(a.npcRadiusLimit(e),18);e.r=18;e.mass=324;g.journey.stage=1;assert.equal(a.npcRadiusLimit(e),18,'player regression does not shrink a surviving grown NPC');a.respawn(e);assert.equal(a.npcRadiusLimit(e),9,'a new individual restarts with the current low-stage birth cap');}
{
 for(const [width,height,edge] of [[4600,2200,'top'],[2200,4600,'left']]){
  const g=fixture({width,height}),a=g.arena,p=g.player,shrimp=a.entities[1];
  assert.equal(a.openingShore,edge);
  assert(shrimp.entering&&shrimp.r===2.2&&shrimp.openingShrimpRadius===2.2);
  assert(Math.hypot(shrimp.x-p.x,shrimp.y-p.y)<180);
  for(const e of a.entities.slice(1))assert(a.speed(e,false)<={shrimp:24,fish:42,turtle:36}[e.species]+1e-8);
  const speed=a.speed(shrimp,false);
  g.journey.stage=2;g.journey.transitionAge=0;assert.equal(a.speed(shrimp,false),speed);
  g.journey.transitionAge=6;const middle=a.speed(shrimp,false);
  g.journey.transitionAge=12;assert(middle>speed&&middle<a.speed(shrimp,false));
  a.respawn(shrimp);assert(!shrimp.openingShrimpRadius&&shrimp.r>=3);
 }
}
{
 const player=entity('human',100,100,15,{type:'human'});player.ink=310.5;
 const shrimp=Object.assign(entity('small',140,100,4,aiController(0)),{species:'shrimp'});
 const turtle=Object.assign(entity('wide',103,100,20,aiController(1)),{species:'turtle'});
 const locked=Object.assign(entity('big',145,110,12.48,aiController(2)),{species:'fish'});
 const samples=Array.from({length:64},(_,i)=>{
  const angle=i*2.399963229728653,r=turtle.r*Math.sqrt((i+.5)/64);
  return {x:Math.cos(angle)*r,y:Math.sin(angle)*r,w:1/64};
 });
 turtle.livingBody={species:'turtle',coreRadius:turtle.r,samples,bound:turtle.r};
 shrimp.livingBody={species:'shrimp',coreRadius:shrimp.r,samples:[{x:-2,y:0,w:.5},{x:2,y:0,w:.5}]};
 const entering={...shrimp,entering:true},immune={...shrimp,invincible:1};
 const view={camera:{x:0,y:0,scale:1},viewW:390,viewH:844};
 const labels=GameRenderer.prototype.nearbyPreyLabels.call(view,{player,entities:[player,entering,shrimp,turtle,locked,immune]});
 assert.equal(labels.length,3);
 assert.equal(labels[0].target,turtle);
 assert.equal(labels[0].state,'grow');assert(labels[0].coverage>0&&labels[0].coverage<80);
 assert.equal(labels.find(l=>l.target===shrimp).state,'ready');
 assert.equal(labels.find(l=>l.target===locked).state,'locked');
}
{
 const p=entity('human',100,100,12,{type:'human'});p.ink=100;
 const s=Object.assign(entity('long-shrimp',188,100,3.35,aiController(0)),{species:'shrimp'});
 const view={camera:{x:0,y:0,scale:1},viewW:390,viewH:844},arena={player:p,entities:[p,s]};
 const hint=()=>GameRenderer.prototype.nearbyPreyLabels.call(view,arena)[0].state;
 // High weight at separated ends of a thin torso. Total area fits, but no 24-wide circle can take 80%.
 s.livingBody={species:'shrimp',coreRadius:s.r,area:95,bound:24,samples:[{x:-21,y:0,w:.28},{x:0,y:0,w:.44},{x:20,y:0,w:.28}]};
 assert.equal(hint(),'grow');
 // Off-centre fit: the bounding box midpoint fails but a circle near the heavier end covers 82%.
 s.livingBody.samples=[{x:-30,y:0,w:.18},{x:-5,y:0,w:.4},{x:17,y:0,w:.42}];
 assert.equal(hint(),'ready');
 p.form={species:'fish',remaining:5};assert.equal(hint(),'align');
 p.form={species:'shrimp',remaining:5};
 p.livingBody={species:'shrimp',coreRadius:p.r,bound:12,samples:[{x:0,y:0,w:1}],sections:[{x:0,y:0,r:12}]};
 assert.equal(hint(),'ready');
}
console.log('PASS outside-edge entry/respawn, staged incoming bands, persistent dragon entry, ink-based swallowing, arc steering, projected-speed floor and bounded fading local food');
