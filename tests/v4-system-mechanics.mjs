import assert from 'node:assert/strict';
import {RevealRun} from '../src/reveal/run.js';
import {GROWTH_STAGES_CONFIG as C,GrowthJourney,growthCameraTarget,followGrowthCamera} from '../src/reveal/growth-stages.js';
import {GROWTH_ECOLOGY_CONFIG as E} from '../src/reveal/growth-ecology.js';
import {syncReserve,reserveRadius} from '../src/game/ink-reserve.js';
import {coreRadius} from '../src/game/alien-geometry.js';
const make=(extra={})=>new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,initialItems:0,completionThreshold:2,...extra});
const none={x:0,y:0};
// A huge award has three explicit camera legs, while death restoration is immediate and exact.
{
 const j=new GrowthJourney(),p={ink:10000,revealJourney:j};assert.equal(j.update(p,.01,0).stage,2);assert.equal(j.targetStage,4);assert.equal(j.update(p,1,1),null);assert.equal(j.update(p,1.81,2.81).stage,3);assert.equal(j.update(p,2.81,5.62).stage,4);assert.deepEqual(j.history.map(x=>x.stage),[2,3,4]);p.ink=200;j.recalculate(p);assert.equal(j.stage,1);p.ink=5000;p.turtleInk=4800;assert.equal(j.update(p,10,15),null,'temporary ink is not a journey reward');
}
for(const world of [{width:3910,height:1800},{width:1500,height:3910}])for(const [width,height] of [[1440,900],[390,844]]){
 const j=new GrowthJourney(),p={ink:5000,r:100,x:0,y:0,revealJourney:j};j.stage=3;const z=growthCameraTarget(p,width,height,world);assert(width/z<world.width&&height/z<world.height);
 const cam=followGrowthCamera({x:-500,y:-500,scale:.2},p,width,height,false,1,true,null,world);assert(cam.x>0&&cam.y>0);assert(cam.x+width/cam.scale<world.width);assert(cam.y+height/cam.scale<world.height);
 j.stage=4;const last=followGrowthCamera(cam,p,width,height,false,1,true,null,world);assert(last.x<0&&last.y<0);assert(growthCameraTarget(p,width,height,world)<z);
}
// Awards are absolute, visual-size based and settle exactly once for both low and high reserves.
for(const [radius,reward] of [[2.5,4],[3.2,7],[4,11]])for(const ink of [100,10000]){
 const r=make(),p=r.player;p.ink=ink;syncReserve(p,0,true);r.arena.foods=[{x:p.x,y:p.y,r:radius,mass:radius*radius*2.8}];r.arena.update(0,none);assert.equal(p.ink-ink,reward);r.arena.update(0,none);assert.equal(p.ink-ink,reward);
}
// Turtle adds one temporary budget, does not compound on re-pickup, never double-scales.
{
 const r=make(),p=r.player;p.ink=4000;syncReserve(p,0,true);const base=p.r;
 const pick=()=>{r.arena.items.push({kind:'shield',tier:1,r:17,x:p.x,y:p.y});r.update(0);};pick();assert(Math.abs(p.turtleInk-base*.3/C.sizeLinear)<1e-7);syncReserve(p,0,true);assert(Math.abs(p.r-base*1.3)<1e-7);const bonus=p.turtleInk;pick();assert(Math.abs(p.turtleInk-bonus)<1e-8);r.journey.recalculate(p);assert.equal(r.journey.stage,2);delete p.effects.giant;r.update(0);syncReserve(p,0,true);assert(Math.abs(p.ink-4000)<1e-7);assert(Math.abs(p.r-base)<1e-7);
}
// All four ecological layers are real at time zero. A grown slot always returns to its own tier.
{
 const r=make({aiCount:30}),a=r.arena,units=a.entities.slice(1);assert.deepEqual([...new Set(units.map(n=>n.ecologyTier))],[1,2,3,4]);assert(units.some(n=>n.ecologyTier===4&&coreRadius(n)>reserveRadius(C.thresholds[2],{minimumRadius:C.initialRadius,sizeLinear:C.sizeLinear,maxRadius:C.maxRadius})*r.config.playerLethalRatio),'initial giant threatens stage four entry');assert(r.config.npcMaxRadius>C.maxRadius*r.config.playerLethalRatio,'a grown eye can threaten a maximum-size player');assert.equal(units.filter(n=>n.competitor).length,1);
 for(const n of units){n.r=270;n.mass=270*270;n.ink=99999;n.dead=0;a.respawn(n);const band=E.tiers[n.ecologyTier-1];assert(n.r>=band[0]&&n.r<=band[2]);assert.equal(n.mass,n.r*n.r);assert.equal(n.ink,0);assert(Math.hypot(n.x-a.player.x,n.y-a.player.y)>a.player.r+n.r+100);}
 const c=units.find(n=>n.competitor),peer=units.find(n=>n!==c&&!n.dead);c.invincible=0;c.mass=0;const before=peer.mass;a.kill(c,null);assert.equal(units.filter(n=>n.competitor&&!n.dead).length,1);assert.equal(peer.mass,before);assert(!c.competitor);const next=units.find(n=>n.competitor);assert.equal(a.speed(next,false)/a.speed({...next,controller:{type:'human'}},false),.93);
 // Birth tier one can grow across tier four's minimum from food, with no birth-tier cap.
 const small=units.find(n=>n.ecologyTier===1);a.entities=[a.player,small];small.dead=0;small.invincible=5;small.mass=239*239;small.r=239;small.x=a.world.width*.75;small.y=a.world.height*.5;small.controller={type:'human'};a.foods=[{x:small.x,y:small.y,r:4,mass:1000}];a.update(0,none);assert(small.r>240);
}
// Source centers remain logical, not player-radius or camera dependent.
{
 const seen=[],r=new RevealRun((t,d)=>{if(t==='bloom')seen.push(d);},{aiCount:0,foodTarget:0,foodSpawnRate:0,initialItems:0,completionThreshold:2});r.releaseBloom(900);assert.equal(seen[0].x,r.player.x);assert.equal(seen[0].y,r.player.y);r.event('consume',{entity:r.player,kind:'enemy',x:123,y:234,r:30,coreRadius:20});assert.equal(seen[1].x,123);assert.equal(seen[1].y,234);assert.equal(r.mask.blooms.at(-1).x,123);
}
// Goal locks instantly, no late ecology writes or artificial giant blooms are generated.
{
 const r=make(),p=r.player,ink=p.ink,elapsed=r.elapsed;r.complete();assert.equal(r.state,'finishing');r.update(.1,{x:1,y:1});assert.equal(r.elapsed,elapsed);assert.equal(p.ink,ink);assert.equal(r.mask.blooms.length,0);assert(r.finish('complete').completed);
}
console.log('PASS V4 system mechanics: staged camera, fixed rewards, single turtle budget, four birth tiers, low respawn, transferable rival, growth, centers and goal freeze');
