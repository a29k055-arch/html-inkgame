import assert from 'node:assert/strict';
import {RevealRun} from '../src-v5/reveal/run.js';
import {RevealRun as V4Run} from '../src/reveal/run.js';
import {LIVING_SLOTS,LivingWorld} from '../src-v5/reveal/living-world.js';
import {entity} from '../src-v5/game/inkstone.js';
import {aiController} from '../src-v5/game/ai.js';
import {syncReserve} from '../src-v5/game/ink-reserve.js';
const fixture=(event=()=>{},more={})=>new RevealRun(event,{foodTarget:0,foodSpawnRate:0,initialItems:0,pond:{initialLeaves:0},columns:32,completionThreshold:2,inkCompletionThreshold:2,living:{dragonEnabled:false},...more});
{
 const g=fixture(),npc=g.arena.entities.slice(1);assert.equal(g.config.version,'V5');assert.equal(npc.length,24);
 assert(npc.every(e=>['shrimp','fish','turtle'].includes(e.species)&&e.appearance==='living'));
 assert.deepEqual([...new Set(npc.filter(e=>e.rewardGlow).map(e=>e.species))].sort(),['fish','shrimp','turtle']);assert.equal(npc.filter(e=>e.rewardGlow).length,5);
 const average=species=>npc.filter(e=>e.species===species).reduce((s,e)=>s+e.r,0)/npc.filter(e=>e.species===species).length;
 assert(average('shrimp')<average('fish'));assert(average('fish')<average('turtle'));assert.equal(npc.filter(e=>e.species==='fish'&&e.ecologyTier===4).length,1);
 assert.equal(npc.filter(e=>e.competitor).length,1);for(const kind of ['magnet','speed','shield'])assert.equal(g.spawnPickup(kind),false);
 g.habitat.update(200);assert(g.arena.items.every(e=>e.kind==='leaf'||e.kind==='flower'));
 const n=npc[0],slot=LIVING_SLOTS[n.birthSlot],tier=n.ecologyTier;n.r=320;n.mass=320**2;g.arena.respawn(n);assert.equal(n.species,slot.species);assert.equal(n.ecologyTier,tier);assert(n.r>=slot.min&&n.r<=slot.low);assert.equal(n.rewardGlow,true);
}
{
 const g=fixture(()=>{},{aiCount:0}),p=g.player;p.invincible=0;
 g.applyLivingReward('magnet',1);assert.equal(p.effects.magnet,5);assert.equal(p.form.species,'shrimp');
 g.applyLivingReward('magnet',1);assert.equal(p.effects.magnet,10);assert.equal(p.form.remaining,10);
 g.applyLivingReward('speed',2);assert.equal(p.effects.rush,5);assert.equal(p.form.species,'fish');assert.equal(p.effects.magnet,10);
 for(let i=0;i<51;i++)g.update(.1);assert.equal(p.form.species,'shrimp');assert(Math.abs(p.form.remaining-p.effects.magnet)<1e-10);
 for(let i=0;i<50;i++)g.update(.1);assert(!p.form);assert.deepEqual(p.formOrder,[]);
 for(let i=0;i<20;i++)g.applyLivingReward('magnet',1);assert.equal(p.effects.magnet,30);assert.equal(p.form.remaining,30);
 g.arena.softDown=null;p.invincible=0;assert(g.arena.kill(p,null));assert(!p.form);assert.deepEqual(p.formOrder,[]);
}
{
 const g=fixture(()=>{},{aiCount:0}),p=g.player;p.ink=5000;syncReserve(p,0,true);g.journey.recalculate(p);assert.equal(g.journey.stage,3);
 g.applyLivingReward('shield',1);const budget=p.turtleInk;assert(budget>0);assert.equal(p.form.species,'turtle');assert.equal(p.ink-p.turtleInk,5000);
 g.applyLivingReward('shield',1);assert.equal(p.turtleInk,budget);assert.equal(p.effects.giant,10);
 g.applyLivingReward('shield',3);assert(p.turtleInk>budget);assert.equal(p.ink-p.turtleInk,5000);g.update(.1);assert.equal(g.journey.stage,3,'temporary turtle ink cannot advance permanent stage');
 p.effects.giant=.01;g.update(.1);assert.equal(p.ink,5000);assert.equal(p.turtleInk,0);assert(!p.form);
}
function victim(p,{reward=false,id='food-fish'}={}){return Object.assign(entity(id,p.x+25,p.y,5,aiController(1)),{species:'fish',appearance:'living',rewardKind:reward?'speed':null,rewardGlow:reward,rewardTier:2,v4Visual:true});}
{
 const events=[],g=fixture((t,d)=>events.push([t,d]),{aiCount:0}),a=g.arena,p=g.player;p.ink=(45-12)/.0175;syncReserve(p,0,true);p.invincible=0;
 const n=victim(p,{reward:true});a.entities=[p,n];a.update(0,{x:0,y:0});assert(n.dead>0);assert.equal(p.form.species,'fish');assert.equal(p.effects.rush,5);assert.equal(events.filter(([t])=>t==='creature-form').length,1);
 assert.equal(a.kill(n,p),false);assert.equal(events.filter(([t])=>t==='creature-form').length,1);
 const ordinary=victim(p,{id:'ordinary'});a.entities=[p,ordinary];delete p.form;p.formOrder=[];p.effects={};a.update(0,{x:0,y:0});assert(ordinary.dead>0);assert(!p.form,'ordinary NPC gives ink, not a power or form');
 const other=Object.assign(entity('other',p.x+300,p.y,80,aiController(2)),{species:'turtle',appearance:'living'}),bonus=victim(p,{reward:true,id:'npc-eats-bonus'});a.entities=[p,other,bonus];assert(a.kill(bonus,other));assert(!p.form);assert(!other.effects.rush,'NPCs cannot gain player pickup powers');
}
{
 const events=[],g=fixture((t,d)=>events.push([t,d]),{aiCount:0,living:{dragonEnabled:true}});g.living=new LivingWorld(g,{dragonEnabled:true},()=>.5);
 g.elapsed=69;g.living.tick(0);assert(!g.living.dragon);g.elapsed=70;g.living.tick(0);const d=g.living.dragon;assert(d&&d.species==='dragon'&&d.rewardGlow);assert.equal(d.expiresAt,98);assert.equal(g.arena.entities.filter(e=>e.eventDragon).length,1);assert(Math.hypot(d.x-g.player.x,d.y-g.player.y)>d.r+g.player.r+320);assert(g.living.nextDragon>=180&&g.living.nextDragon<=220);assert.equal(g.metrics.living.dragonArrivals,1);
 g.elapsed=99;g.living.tick(0);assert(!g.living.dragon);assert(!g.arena.entities.includes(d));assert(!g.player.form);assert.equal(g.metrics.living.rewardPickups,0,'expiry is not a kill or reward');
 const d2=g.living.spawnDragon(),p=g.player;p.ink=20000;syncReserve(p,0,true);d2.invincible=0;p.invincible=0;d2.x=p.x;d2.y=p.y;g.arena.update(0,{x:0,y:0});g.living.afterArena();assert.equal(p.form.species,'dragon');assert.equal(p.effects.dragon,5);assert(!g.living.dragon);assert(!g.arena.entities.includes(d2));
}
{
 const old=new V4Run(()=>{},{aiCount:0,foodTarget:0,initialItems:0});assert.equal(old.config.version,'V4');assert.equal(old.config.items.magnetDuration,3);
}
{
 const g=new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,columns:32,living:{dragonEnabled:false}});
 assert(g.arena.items.some(e=>e.kind==='leaf'));assert(g.arena.items.some(e=>e.kind==='flower'));assert(g.arena.items.every(e=>e.kind==='leaf'||e.kind==='flower'));
 g.complete();assert.equal(g.applyLivingReward('magnet'),false,'completion freezes new pickup interactions');
}
console.log('PASS V5 three-species birth ecology, low respawn, living reward-only powers, 5s stacking/fallback/death, turtle accounting, temporary fair dragon and isolated V4');
