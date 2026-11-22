import {pondEntry} from '../game/pond-entry.js';
import {syncLivingInk} from '../game/living-resource.js';
import {entity} from '../game/inkstone.js';
import {aiController} from '../game/ai.js';

// World lengths use the existing R4 torso calibration (shrimp~11.47r,
// fish~10.19r, turtle~3.18r), with a flower~95 and leaf artwork~178–500.
// The last two slots are introduced once stage two is reached, never at startup.
const slot=(species,tier,min,max,low,big=false)=>Object.freeze({species,tier,min,max,low,big,rewardKind:({shrimp:'magnet',fish:'speed',turtle:'shield'})[species]});
export const LIVING_SLOTS=Object.freeze([
 slot('shrimp',1,3,4.5,3.5),slot('shrimp',1,3.5,5.5,4),
 slot('shrimp',1,4,6.5,4.5),slot('shrimp',1,5,7.5,5.5),
 slot('fish',1,6.5,9,7),slot('fish',1,7.5,11,8),
 slot('fish',1,9,13,9.5),slot('fish',1,11,15,11.5),
 slot('turtle',2,28,36,29),slot('turtle',2,34,45,35),
 slot('fish',2,22,28,23,true),slot('turtle',2,66,82,68,true)
]);
export const LIVING_INITIAL_COUNT=10;
export const livingSlot=index=>LIVING_SLOTS[((index%LIVING_SLOTS.length)+LIVING_SLOTS.length)%LIVING_SLOTS.length];
export const REWARD_SPECIES=Object.freeze({magnet:'shrimp',speed:'fish',shield:'turtle',dragon:'dragon'});
export const SPECIES_REWARDS=Object.freeze({shrimp:'magnet',fish:'speed',turtle:'shield',dragon:'dragon'});
export function livingRadiusLimit(e,stage=4){
 if(e?.eventDragon||e?.species==='dragon')return 26;
 const big=Number.isInteger(e?.birthSlot)&&livingSlot(e.birthSlot).big;
 const at=Math.max(0,Math.min(3,stage-1));return e?.species==='shrimp'?[4.5,6.5,7.5,8][at]:e?.species==='fish'?(big?30:[9,14,18,18][at]):e?.species==='turtle'?(big?88:[34,42,48,50][at]):88;
}
export const LIVING_WORLD_CONFIG=Object.freeze({formDuration:5,dragonFirst:60,dragonRespawn:30,dragonEnabled:true});

export class LivingWorld {
 constructor(run,config={},rng=Math.random){this.run=run;this.config={...LIVING_WORLD_CONFIG,...config};this.rng=rng;this.nextDragon=this.config.dragonFirst;this.serial=0;this.dragon=null;this.largeUnlocked=false;}
 recordForm(species,effect,rigId=null){const p=this.run.player;p.formOrder=(p.formOrder||[]).filter(q=>q.effect!==effect);p.formOrder.push({species,effect,rigId});this.refreshForm('reward');}
 clearForm(){const p=this.run.player,previous=p.form?.species;delete p.form;p.formOrder=[];if(previous)this.run.onEvent('creature-form-end',{entity:p,species:previous});}
 refreshForm(reason='elapsed'){
  const g=this.run,p=g.player;if(p.dead){this.clearForm();return;}
  p.formOrder=(p.formOrder||[]).filter(q=>(p.effects[q.effect]||0)>0);const next=p.formOrder.at(-1),previous=p.form?.species;
  if(!next){if(previous)this.clearForm();return;}
  p.form={species:next.species,effect:next.effect,remaining:p.effects[next.effect],rigId:next.rigId};
  if(reason==='reward'||previous!==next.species)g.onEvent('creature-form',{entity:p,species:next.species,remaining:p.form.remaining,reason});
 }
 tick(dt){
  const g=this.run,p=g.player;
  if(!this.largeUnlocked&&g.journey.stage>=2)this.unlockLarge();
  if(this.dragon?.dead)this.removeDragon('swallowed');
  if(this.config.dragonEnabled&&!this.dragon&&g.elapsed>=this.nextDragon)this.spawnDragon();
 }
 afterArena(){if(this.dragon?.dead)this.removeDragon('swallowed');this.refreshForm();}
 removeDragon(reason='departed'){
  const g=this.run,d=this.dragon;if(!d)return;g.arena.entities=g.arena.entities.filter(e=>e!==d);this.dragon=null;
  this.nextDragon=g.elapsed+this.config.dragonRespawn;
  g.onEvent('dragon-departure',{entity:d,reason});
 }
 unlockLarge(){
  const g=this.run,a=g.arena;this.largeUnlocked=true;
  for(let index=LIVING_INITIAL_COUNT;index<LIVING_SLOTS.length;index++){
   if(a.entities.some(e=>e.birthSlot===index&&!e.eventDragon))continue;
   const spawn=g.ecology.spawn(a,index),p=spawn.point,n=entity('living-large-'+index,p.x,p.y,spawn.radius,aiController(index,spawn.personality));
   Object.assign(n,{...spawn,r:spawn.radius,mass:spawn.radius**2,birthSlot:index,skinIndex:index,v4Visual:true,invincible:.8});delete n.point;delete n.radius;syncLivingInk(n);a.entities.push(n);a.constrain(n);
  }
  g.onEvent('large-living-arrival',{count:2});
 }
 spawnDragon(){
  if(this.dragon&&!this.dragon.dead)return this.dragon;
  const g=this.run,a=g.arena,p=g.player,r=Math.min(26,18+p.r*.04),spawn=pondEntry(a,'dragon',r,50+this.serial,this.rng),point=spawn.point;
  const d=entity('dragon-event-'+(++this.serial),point.x,point.y,r,aiController(50+this.serial,'wander'));
  Object.assign(d,{species:'dragon',appearance:'living',rewardKind:'dragon',rewardGlow:false,rewardTier:3,eventDragon:true,v4Visual:true,ecologyTier:4,skinIndex:50+this.serial,invincible:.8,entering:true,entry:spawn.entry});
  d.controller.goal={...spawn.entry.target};syncLivingInk(d);a.entities.push(d);a.constrain(d);this.dragon=d;
  g.metrics.living.dragonArrivals++;
  this.nextDragon=Infinity;
  g.onEvent('dragon-arrival',{entity:d,persistent:true});return d;
 }
}
