import {entity} from '../game/inkstone.js';
import {aiController} from '../game/ai.js';

// Birth slots preserve a readable ecological size distribution, not a growth cap.
const slot=(species,tier,min,max,low,rewardKind=null)=>Object.freeze({species,tier,min,max,low,rewardKind});
export const LIVING_SLOTS=Object.freeze([
 slot('shrimp',1,3,5.5,4,'magnet'),slot('fish',1,4.5,8,6,'speed'),
 ...Array.from({length:6},()=>slot('shrimp',1,3,7,4.5)),
 ...Array.from({length:3},()=>slot('fish',1,6,13,8)),
 slot('shrimp',2,14,28,18),slot('fish',2,22,42,25),slot('turtle',2,18,30,20,'shield'),
 slot('fish',2,28,55,32),slot('shrimp',2,22,38,25,'magnet'),
 slot('fish',3,55,95,65,'speed'),slot('turtle',3,58,95,65),slot('fish',3,70,125,78),
 slot('turtle',3,105,170,115),slot('fish',4,160,210,165),
 slot('turtle',4,240,320,250),slot('turtle',4,260,360,270),slot('turtle',3,140,220,150)
]);
export const livingSlot=index=>LIVING_SLOTS[((index%LIVING_SLOTS.length)+LIVING_SLOTS.length)%LIVING_SLOTS.length];
export const REWARD_SPECIES=Object.freeze({magnet:'shrimp',speed:'fish',shield:'turtle',dragon:'dragon'});
export const LIVING_WORLD_CONFIG=Object.freeze({formDuration:5,dragonFirst:70,dragonIntervalMin:110,dragonIntervalMax:150,dragonLifetime:28,dragonEnabled:true});

export class LivingWorld {
 constructor(run,config={},rng=Math.random){this.run=run;this.config={...LIVING_WORLD_CONFIG,...config};this.rng=rng;this.nextDragon=this.config.dragonFirst;this.serial=0;this.dragon=null;}
 recordForm(species,effect){const p=this.run.player;p.formOrder=(p.formOrder||[]).filter(q=>q.effect!==effect);p.formOrder.push({species,effect});this.refreshForm('reward');}
 clearForm(){const p=this.run.player,previous=p.form?.species;delete p.form;p.formOrder=[];if(previous)this.run.onEvent('creature-form-end',{entity:p,species:previous});}
 refreshForm(reason='elapsed'){
  const g=this.run,p=g.player;if(p.dead){this.clearForm();return;}
  p.formOrder=(p.formOrder||[]).filter(q=>(p.effects[q.effect]||0)>0);const next=p.formOrder.at(-1),previous=p.form?.species;
  if(!next){if(previous)this.clearForm();return;}
  p.form={species:next.species,effect:next.effect,remaining:p.effects[next.effect]};
  if(reason==='reward'||previous!==next.species)g.onEvent('creature-form',{entity:p,species:next.species,remaining:p.form.remaining,reason});
 }
 tick(dt){
  const g=this.run,p=g.player;
  if(this.dragon&&(this.dragon.dead||this.dragon.expiresAt<=g.elapsed))this.removeDragon(this.dragon.dead?'swallowed':'departed');
  if(this.config.dragonEnabled&&!this.dragon&&g.elapsed>=this.nextDragon)this.spawnDragon();
 }
 afterArena(){if(this.dragon?.dead)this.removeDragon('swallowed');this.refreshForm();}
 removeDragon(reason='departed'){
  const g=this.run,d=this.dragon;if(!d)return;g.arena.entities=g.arena.entities.filter(e=>e!==d);this.dragon=null;
  g.onEvent('dragon-departure',{entity:d,reason});
 }
 spawnDragon(){
  const g=this.run,a=g.arena,p=g.player,w=a.world,r=Math.min(220,100+p.r*.35,Math.min(w.width,w.height)*.22),margin=r+12;
  let point=null,best=-Infinity;
  // Spawn at a distant boundary, never beside the player or overlapping another core.
  for(let i=0;i<32;i++){
   const edge=i%4,t=this.rng(),q=edge===0?{x:margin,y:margin+t*(w.height-2*margin)}:edge===1?{x:w.width-margin,y:margin+t*(w.height-2*margin)}:edge===2?{x:margin+t*(w.width-2*margin),y:margin}:{x:margin+t*(w.width-2*margin),y:w.height-margin};
   let clearance=Math.hypot(q.x-p.x,q.y-p.y)-r-a.radius(p)-320;
   for(const e of a.entities)if(e!==p&&!e.dead)clearance=Math.min(clearance,Math.hypot(q.x-e.x,q.y-e.y)-r-a.radius(e)-40);
   if(clearance>best){best=clearance;point=q;}
  }
  if(!point||best<0){this.nextDragon=g.elapsed+5;return null;}
  const d=entity('dragon-event-'+(++this.serial),point.x,point.y,r,aiController(50+this.serial,'wander'));
  Object.assign(d,{species:'dragon',appearance:'living',rewardKind:'dragon',rewardGlow:true,rewardTier:3,eventDragon:true,v4Visual:true,ecologyTier:4,skinIndex:50+this.serial,invincible:.8,expiresAt:g.elapsed+this.config.dragonLifetime});
  d.controller.goal={x:w.width-point.x,y:w.height-point.y};a.entities.push(d);a.constrain(d);this.dragon=d;
  g.metrics.living.dragonArrivals++;
  this.nextDragon=g.elapsed+this.config.dragonIntervalMin+this.rng()*(this.config.dragonIntervalMax-this.config.dragonIntervalMin);
  g.onEvent('dragon-arrival',{entity:d,duration:this.config.dragonLifetime});return d;
 }
}
