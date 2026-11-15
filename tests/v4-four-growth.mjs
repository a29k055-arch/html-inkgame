import assert from 'node:assert/strict';
import {RevealRun} from '../src/reveal/run.js';
import {REVEAL_CONFIG as C} from '../src/reveal/config.js';
import {GrowthJourney,followGrowthCamera} from '../src/reveal/growth-stages.js';
import {reserveRadius,syncReserve} from '../src/game/ink-reserve.js';
import {ITEM_TIERS,assignItemTier,collectTieredItem,expireItemTiers} from '../src/reveal/item-tiers.js';
import {temporaryHoldForRadius} from '../src/reveal/temporary.js';
const g=new RevealRun(()=>{},{aiCount:0,foodTarget:0,initialItems:0,columns:64}),p=g.player;
assert.equal(p.ink,17);assert.equal(p.r,9);assert.equal(reserveRadius(17),Math.sqrt(132),'classic mapping unchanged');
g.update(.1);g.elapsed=10000;g.update(.1);assert.equal(g.journey.stage,1,'no timer promotion');
const oldNpc={r:24,mass:576};assert(oldNpc.r>p.r*1.06);
for(const [i,ink] of C.growthStages.thresholds.entries()){p.ink=ink;syncReserve(p,0,true);const before={r:p.r,mass:p.mass,ink:p.ink,world:{...g.world}};g.journey.update(p,0,60+i*75);assert.equal(g.journey.stage,i+2);assert.deepEqual({r:p.r,mass:p.mass,ink:p.ink,world:{...g.world}},before);}
assert.equal(g.journey.history.length,3);p.ink=17;syncReserve(p,0,true);g.journey.update(p,.1,500);assert.equal(g.journey.stage,4);assert.deepEqual(oldNpc,{r:24,mass:576});
for(const [width,height,mobile] of [[1440,900,false],[390,844,true],[844,390,true],[3840,1080,false],[3440,1440,false]])for(const world of [{width:3910,height:1797},{width:2606,height:3910},{width:3910,height:3910}]){
 p.x=world.width*.1;p.y=world.height*.8;p.ink=17;syncReserve(p,0,true);p.revealJourney=new GrowthJourney();let cam=followGrowthCamera({x:0,y:0,scale:1},p,width,height,mobile,0,true,null,world);let maxStep=0;
 for(let stage=2;stage<=4;stage++){p.ink=C.growthStages.thresholds[stage-2];syncReserve(p,0,true);p.revealJourney.update(p,0,stage*75);for(let i=0;i<600;i++){const next=followGrowthCamera(cam,p,width,height,mobile,1/60,false,null,world);maxStep=Math.max(maxStep,Math.abs(next.scale/cam.scale-1));cam=next;p.revealJourney.transitionAge+=1/60;}}
 assert(maxStep<.02);assert(cam.x<0&&cam.y<0);assert((0-cam.x)*cam.scale>=0);assert((world.width-cam.x)*cam.scale<=width);assert((world.height-cam.y)*cam.scale<=height);
}
for(const [effect,kind] of [['giant','shield'],['rush','speed'],['magnet','magnet']]){
 const q={effects:{},r:20};for(let tier=1;tier<=3;tier++){collectTieredItem(q,{kind,tier});assert.equal(q.pondBuffs[effect].strength,ITEM_TIERS[effect][tier-1]);assert.equal(q.effects[effect],tier*3);}
 collectTieredItem(q,{kind,tier:1});assert.equal(q.pondBuffs[effect].tier,3);assert.equal(q.effects[effect],12);for(let i=0;i<50;i++)collectTieredItem(q,{kind,tier:3});assert.equal(q.effects[effect],30);delete q.effects[effect];expireItemTiers(q);assert(!q.pondBuffs[effect]);collectTieredItem(q,{kind,tier:1});assert.equal(q.pondBuffs[effect].tier,1);
}
const sizes=[1,2,3,4].map(stage=>assignItemTier({kind:'shield',r:34,renderSize:90},stage));assert.deepEqual(sizes.map(a=>a.tier),[1,2,3,3]);assert(sizes[0].r<sizes[1].r&&sizes[1].r<sizes[2].r);
p.revealJourney=g.journey;p.ink=500;syncReserve(p,0,true);const base=p.ink;collectTieredItem(p,{kind:'shield',tier:3});g.update(.1);p.ink+=100;for(let i=0;i<65;i++)g.update(.1);assert.equal(p.ink,base+100);assert(!p.effects.giant);assert(Math.abs(p.r-reserveRadius(p.ink,p.reserveRules))<.01);
const temp=g.temporary;temp.stamp(500,500,60,0,9,250,0);const old=Float32Array.from(temp.holdUntil);g.event('consume',{entity:p,kind:'enemy',x:100,y:100,coreRadius:15,r:15});assert.equal(g.temporaryNpcBonus,5);assert.deepEqual(temp.holdUntil,old);temp.stamp(700,700,60,1,9,250,g.temporaryNpcBonus);assert.equal(temporaryHoldForRadius(9,C,250,g.temporaryNpcBonus),34);assert.equal(temporaryHoldForRadius(170,C,1e6,1e6),180);assert.equal(C.completionThreshold,.65);assert.equal(C.inkCompletionThreshold,.9);
// Physical speed and attraction use the active tier, not only HUD labels.
const b=new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,initialItems:0,columns:32}),bp=b.player,normal=b.arena.speed(bp);
for(let tier=1;tier<=3;tier++){bp.effects={};bp.pondBuffs={};collectTieredItem(bp,{kind:'speed',tier});assert(Math.abs(b.arena.speed(bp)/normal-(1+ITEM_TIERS.rush[tier-1]))<1e-10);b.boost();assert(b.arena.speed(bp)/normal<=1.7+1e-10);b.cooldown=0;}
for(let tier=1;tier<=3;tier++){bp.effects={};bp.pondBuffs={};collectTieredItem(bp,{kind:'magnet',tier});const food={x:bp.x+175,y:bp.y,r:2,mass:10};b.arena.foods=[food];b.arena.updateMagnet(.1);assert.equal(food.x<bp.x+175,tier===3);}
console.log('PASS four ink-only stages, continuous physical state, full-frame PC/mobile/aspect/corners, three item tiers/additive bounded timers, size expiry keeps earned ink, future-only NPC deadline reward');
