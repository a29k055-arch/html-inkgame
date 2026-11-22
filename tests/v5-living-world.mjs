import assert from 'node:assert/strict';
import {RevealRun} from '../src-v5/reveal/run.js';
import {RevealRun as V4Run} from '../src/reveal/run.js';
import {LIVING_SLOTS,LivingWorld,livingRadiusLimit} from '../src-v5/reveal/living-world.js';
import {entity} from '../src-v5/game/inkstone.js';
import {aiController} from '../src-v5/game/ai.js';
import {syncReserve} from '../src-v5/game/ink-reserve.js';
const fixture=(event=()=>{},more={})=>new RevealRun(event,{foodTarget:0,foodSpawnRate:0,initialItems:0,pond:{initialLeaves:0},columns:32,completionThreshold:2,inkCompletionThreshold:2,living:{dragonEnabled:false},...more});
{
 const g=fixture(),npc=g.arena.entities.slice(1);assert.equal(g.config.version,'V5');assert.equal(npc.length,10);
 assert(npc.every(e=>['shrimp','fish','turtle'].includes(e.species)&&e.appearance==='living'));
 assert(npc.every(e=>!e.rewardGlow&&e.rewardKind));assert(npc.every(e=>!LIVING_SLOTS[e.birthSlot].big));
 for(const e of npc){const slot=LIVING_SLOTS[e.birthSlot];assert(e.r>=3&&e.r<=livingRadiusLimit(e,g.journey.stage));assert(e.r<=livingRadiusLimit(e));}
 assert.equal(npc.filter(e=>e.competitor).length,1);for(const kind of ['magnet','speed','shield'])assert.equal(g.spawnPickup(kind),false);
 g.habitat.update(200);assert(g.arena.items.every(e=>e.kind==='leaf'||e.kind==='flower'));
 const n=npc[0],slot=LIVING_SLOTS[n.birthSlot],tier=n.ecologyTier;n.r=320;n.mass=320**2;g.arena.respawn(n);assert.equal(n.species,slot.species);assert.equal(n.ecologyTier,tier);assert(n.r>=3&&n.r<=4.5);assert.equal(n.rewardGlow,false);
 g.living.tick(0);assert.equal(g.arena.entities.length,11);g.journey.stage=2;g.living.tick(0);assert.equal(g.arena.entities.length,13);
 const large=g.arena.entities.filter(e=>LIVING_SLOTS[e.birthSlot]?.big);assert.equal(large.filter(e=>e.species==='fish').length,1);assert.equal(large.filter(e=>e.species==='turtle').length,1);
 for(let i=0;i<3;i++){g.living.tick(0);g.arena.respawn(large[0]);}assert.equal(g.arena.entities.length,13,'unlock/respawn never duplicates large species');
 assert.equal(livingRadiusLimit(large.find(e=>e.species==='fish')),30);assert.equal(livingRadiusLimit(large.find(e=>e.species==='turtle')),88);
 assert.equal(livingRadiusLimit({species:'shrimp'}),8);assert.equal(livingRadiusLimit({species:'fish'}),18);assert.equal(livingRadiusLimit({species:'turtle'}),50);
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
 const ordinary=victim(p,{id:'ordinary'});a.entities=[p,ordinary];delete p.form;p.formOrder=[];p.effects={};a.update(0,{x:0,y:0});assert(ordinary.dead>0);assert.equal(p.form.species,'fish','every consumed fish gives its power and form');assert.equal(p.effects.rush,5);delete p.form;p.formOrder=[];p.effects={};
 const other=Object.assign(entity('other',p.x+300,p.y,80,aiController(2)),{species:'turtle',appearance:'living'}),bonus=victim(p,{reward:true,id:'npc-eats-bonus'});a.entities=[p,other,bonus];assert(a.kill(bonus,other));assert(!p.form);assert(!other.effects.rush,'NPCs cannot gain player pickup powers');
}
{
 const events=[],g=fixture((t,d)=>events.push([t,d]),{aiCount:0,living:{dragonEnabled:true}});g.living=new LivingWorld(g,{dragonEnabled:true},()=>.5);
 g.elapsed=59;g.living.tick(0);assert(!g.living.dragon);g.elapsed=60;g.living.tick(0);const d=g.living.dragon;
 assert(d&&d.species==='dragon'&&!d.rewardGlow);assert.equal(d.expiresAt,undefined);assert.equal(g.arena.entities.filter(e=>e.eventDragon).length,1);assert(Math.hypot(d.x-g.player.x,d.y-g.player.y)>d.r+g.player.r+320);assert.equal(g.living.nextDragon,Infinity);assert.equal(g.metrics.living.dragonArrivals,1);assert.equal(g.living.spawnDragon(),d,'direct repeated spawn is idempotent');assert.equal(g.arena.entities.filter(e=>e.eventDragon).length,1);
 g.elapsed=180;g.living.tick(0);assert.equal(g.living.dragon,d,'living dragon never times out');assert.equal(g.arena.entities.filter(e=>e.eventDragon).length,1);assert(!g.player.form);
 const p=g.player;p.ink=20000;syncReserve(p,0,true);d.invincible=0;d.entering=false;p.invincible=0;d.x=p.x;d.y=p.y;g.arena.update(0,{x:0,y:0});g.living.afterArena();assert.equal(p.form.species,'dragon');assert.equal(p.effects.dragon,5);assert(!g.living.dragon);assert(!g.arena.entities.includes(d));assert.equal(g.living.nextDragon,210);
 g.elapsed=209;g.living.tick(0);assert(!g.living.dragon);g.elapsed=210;g.living.tick(0);assert(g.living.dragon);assert.equal(g.arena.entities.filter(e=>e.eventDragon).length,1);assert.equal(g.metrics.living.dragonArrivals,2);
}

{
 const g=fixture(()=>{},{aiCount:0}),a=g.arena,p=g.player;
 for(const [i,species]of ['shrimp','fish','turtle'].entries()){
  const n=Object.assign(entity('cap-'+species,p.x+600,p.y,4,aiController(i)),{species,appearance:'living',birthSlot:species==='shrimp'?0:species==='fish'?4:8}),limit=livingRadiusLimit(n,g.journey.stage);
  n.r=limit-.01;n.mass=n.r*n.r;a.entities=[p,n];a.foods=[{x:n.x,y:n.y,r:2,mass:1e8}];a.update(0,{x:0,y:0});assert.equal(n.r,limit,'food growth respects species cap');
  n.r=limit-.01;n.mass=n.r*n.r;const huge=entity('donor',n.x,n.y,1000,aiController(5));assert(a.kill(huge,n));assert.equal(n.r,limit,'NPC prey growth respects species cap');
 }
}

{
 const old=new V4Run(()=>{},{aiCount:0,foodTarget:0,initialItems:0});assert.equal(old.config.version,'V4');assert.equal(old.config.items.magnetDuration,3);
}
{
 const g=new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,columns:32,living:{dragonEnabled:false}});
 assert(g.arena.items.some(e=>e.kind==='leaf'));assert(g.arena.items.some(e=>e.kind==='flower'));assert(g.arena.items.every(e=>e.kind==='leaf'||e.kind==='flower'));
 g.complete();assert.equal(g.applyLivingReward('magnet'),false,'completion freezes new pickup interactions');
}
console.log('PASS V5 bounded pond species, 10 opening NPCs, unique stage-two giants, all-creature powers, 5s forms, turtle accounting, persistent dragon and 30s respawn, isolated V4');
