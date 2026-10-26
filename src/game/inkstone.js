import {RangedCombat} from './ranged-combat.js';
import {tickActives,stopActives} from './active-items.js';
import {talentValue,blockHit,grantChoice} from './talents.js';
import {coreRadius,spikeContact} from './alien-geometry.js';
import {initReserve,gainReserve,syncReserve,resetReserveOnDeath,advanceRewards} from './ink-reserve.js';
import {GAME_CONFIG as C,CONTACT_CONFIG as K,INK_RESERVE_CONFIG as R,TALENT_CONFIG as T,ACTIVE_CONFIG as A,SKILLS,clamp,dist,settlement} from './config.js';
import {random,randomPoint,randomNpcPoint,createFood,moveSpeed} from './legacy-foundation.js';
import {aiController,aiDirection,shouldUseSkill} from './ai.js';
const names=['澄','雨音','竹影','白露','山月','凪','青嵐','葉舟','霧','雲間','春水','松風','雪','一滴','遠山','野菊','夕凪','石庭','朧','青竹','時雨','水面','木漏れ日','冬泉','夜舟','霞','新月','梢','秋声','墨雨','雲雀','朝露'];
// Entity motion is gameplay-only. No renderer, velocity field or GPU data can apply forces here.
export function entity(id,x,y,r,controller){
 return {id,x,y,vx:0,vy:0,r,mass:r*r,collisionScale:1,controller,ink:0,invincible:0,dead:0,effects:{},skills:[],swallowed:0,deaths:0,aim:{x:1,y:0}};
}
export class Inkstone {
 constructor(onEvent=()=>{},options={}){
  this.duration=options.duration||C.inkstoneDuration;this.autoFinish=options.autoFinish!==false;this.rewardMultiplier=options.rewardMultiplier||1;
  this.foodTarget=options.foodTarget??C.foodTarget;this.foodSpawnRate=options.foodSpawnRate??C.foodSpawnRate;this.reserveGrowth=!!options.reserveGrowth;this.onEvent=onEvent;this.elapsed=0;this.finished=false;this.itemClock=C.itemSpawnInterval;this.foodClock=0;this.waves=[];this.ecology={npcSwallows:0,npcRespawns:0,npcFood:0,maxRadius:0};
  this.center={x:C.world.width/2,y:C.world.height/2};
  this.player=entity('human',this.center.x,this.center.y,C.initialRadius,{type:'human'});this.player.invincible=C.respawnProtection;if(this.reserveGrowth)initReserve(this.player);
  this.entities=[this.player];
  for(let i=0;i<(options.aiCount??C.aiCount);i++){
   const point=randomNpcPoint(this.player),roll=Math.random();
   const radius=roll>.93?random(78,118):roll>.78?random(42,72):random(14,38);
   const npc=entity(names[i%names.length]+(i>=names.length?i+1:''),point.x,point.y,radius,aiController(i));npc.skinIndex=i;npc.nameIndex=i%names.length;npc.nameNumber=i>=names.length?i+1:'';npc.appearance=i%2?'eye':'thorn';this.entities.push(npc);
  }
  this.foods=Array.from({length:this.foodTarget},()=>this.food());this.items=[];this.ranged=this.reserveGrowth?new RangedCombat(this):null;
 }
 get safeRadius(){const initial=Math.hypot(C.world.width,C.world.height)/2+30,t=clamp((this.elapsed/this.duration-C.waterRingStart)/(1-C.waterRingStart),0,1);return initial+(C.waterRingEndRadius-initial)*(1-(1-t)**C.waterRingExponent);}
 get rank(){return 1+this.entities.filter(e=>e!==this.player&&!e.dead&&e.mass>this.player.mass).length;}
 spawnPoint(clearance=0){
  let point=randomPoint(),best={...this.center},bestClearance=-Infinity;
  for(let i=0;i<60;i++){
   point=randomPoint();if(dist(point,this.center)>this.safeRadius-45)continue;
   let nearest=Infinity;for(const e of this.entities){if(!e.dead)nearest=Math.min(nearest,dist(e,point)-e.r);}
   if(nearest>bestClearance){best=point;bestClearance=nearest;}if(nearest>=clearance)return point;
  }
  return best;
 }
 food(){return createFood(this.spawnPoint());}
 speed(e,includeActive=true){return moveSpeed(e.r)*(1+talentValue(e,'haste'))*(e.controller.type==='ai'?(.70+e.controller.profile.skill*.18):1)*(e.effects.dense?.65:1)*(includeActive&&e.effects.rush?1+A.dash.speed:1);}
 radius(e){return coreRadius(e);}
 drainInk(e,dt,multiplier=1){if(e.dead||e.effects.water)return 0;if(e.growth){const before=e.ink;e.ink=Math.max(Math.min(before,K.spikeInkFloor),before-before*C.waterDecay*multiplier*dt);syncReserve(e);return before-e.ink;}const lost=Math.max(0,Math.min(e.mass-C.respawnRadius**2,e.mass*C.waterDecay*multiplier*dt));e.mass-=lost;e.r=Math.sqrt(e.mass);e.ink=Math.max(0,e.ink-lost);return lost;}

 applySpikes(source,target,dt){if(target.dead||source.dead||source.effects?.water||target.invincible||target.effects.water||this.radius(source)<=this.radius(target)*C.consumeRatio||!spikeContact(source,target,this.radius(target)))return;const resource=target.growth?target.ink:Math.max(0,(target.mass-C.respawnRadius**2)/4),size=clamp(this.radius(source)/K.spikeReferenceRadius,K.spikeSizeMin,K.spikeSizeMax),rate=Math.min(K.spikeMaxLossPerSecond,resource*K.spikeBaseRate*size);if(target.spikeFrame!==this.elapsed){target.spikeFrame=this.elapsed;target.spikeRate=0;}const add=Math.max(0,rate-(target.spikeRate||0));target.spikeRate=Math.max(rate,target.spikeRate||0);const loss=add*Math.min(K.contactInterval,Math.max(0,dt));if(target.growth){target.ink=Math.max(Math.min(target.ink,K.spikeInkFloor),target.ink-loss);syncReserve(target);}else{const massLoss=Math.min(Math.max(0,target.mass-C.respawnRadius**2),loss*4);target.mass-=massLoss;target.r=Math.sqrt(target.mass);target.ink=Math.max(0,target.ink-loss);}target.spikeContact=loss>0;target.spikeFeedback=Math.max(0,(target.spikeFeedback||0)-dt);if(loss>0&&target.spikeFeedback<=0){target.spikeFeedback=K.feedbackInterval;this.onEvent('spike-loss',{entity:target,x:target.x,y:target.y,r:Math.min(10,target.r*.12)});}}

 updateMagnet(dt){const p=this.player,level=p.talents?.magnet||0;if((!level&&!p.effects.absorb)||p.dead)return;const reach=this.radius(p)+T.magnetBaseReach*(1+talentValue(p,'magnet'))+(p.effects.absorb?A.absorb.reach:0),blend=1-Math.exp(-T.magnetAcceleration*dt),decay=Math.exp(-dt*5);for(const food of this.foods){const dx=p.x-food.x,dy=p.y-food.y;if(Math.abs(dx)<reach&&Math.abs(dy)<reach){const distance=Math.hypot(dx,dy)||1;if(distance<reach){const force=T.magnetSpeed*(.3+.7*(1-distance/reach)),swirl=Math.sin(this.elapsed*2+(food.rot||0))*Math.min(22,distance*.15),vx=dx/distance*force-dy/distance*swirl,vy=dy/distance*force+dx/distance*swirl;food.vx=(food.vx||0)+(vx-(food.vx||0))*blend;food.vy=(food.vy||0)+(vy-(food.vy||0))*blend;}}food.vx=(food.vx||0)*decay;food.vy=(food.vy||0)*decay;food.x=clamp(food.x+food.vx*dt,food.r,C.world.width-food.r);food.y=clamp(food.y+food.vy*dt,food.r,C.world.height-food.r);}}
 useSkill(e=this.player){
  if(e.dead||e.effects.water||!e.skills.length||this.finished)return false;
  const skill=e.skills.shift();e.effects[skill.id]=C.skillDurations[skill.id];
  if(skill.id==='splash'){
   this.waves.push({x:e.x,y:e.y,aim:{...e.aim},owner:e.id,age:0,range:C.splashRange});
   // Pigment washes away mass; never applies velocity, recoil or any fluid force to another entity.
   for(const other of this.entities){if(other===e||other.dead||other.invincible||other.effects.water)continue;const d=dist(e,other),dot=((other.x-e.x)*e.aim.x+(other.y-e.y)*e.aim.y)/Math.max(1,d);if(d<C.splashRange&&dot>.4){const lost=Math.min(other.mass-C.respawnRadius**2,other.mass*C.splashDilution);other.mass-=Math.max(0,lost);other.r=other.growth?other.r:Math.sqrt(other.mass);other.ink=other.growth?Math.max(Math.min(other.ink,K.spikeInkFloor),other.ink-Math.max(0,lost)/R.sizeMassPerInk):Math.max(0,other.ink-Math.max(0,lost));if(other.growth)syncReserve(other);}}
  }
  this.onEvent('skill-used',{entity:e,skill});return true;
 }
 kill(e,killer){
  if(e.dead||e.invincible>0||e.effects.water)return false;
  if(blockHit(e)){e.invincible=1.2;this.onEvent('shield',e);return false;}
  if(killer){const rawGain=e.mass*C.npcGain*this.rewardMultiplier;let gain=killer.growth?Math.min(R.playerNpcGainCap,rawGain*R.playerNpcGainScale):rawGain;if(killer.growth){const before=killer.ink;gainReserve(killer,gain,true,this.theme!=='boss');gain=killer.ink-before;}else{killer.mass=Math.min(C.maxRadius**2,killer.mass+gain);killer.r=Math.sqrt(killer.mass);killer.ink+=gain;}if(killer.controller.type==='ai'&&e.controller.type==='ai'){this.ecology.npcSwallows++;this.ecology.maxRadius=Math.max(this.ecology.maxRadius,killer.r);}killer.swallowed++;this.onEvent('consume',{entity:killer,x:e.x,y:e.y,r:e.r,playerSize:killer.r,gain,kind:'enemy'});}
  stopActives(e);e.deaths++;if(!e.growth)e.ink*=C.deathInkRetention;e.dead=C.respawnDelay;e.skills=[];e.effects={};if(e.growth)resetReserveOnDeath(e);this.onEvent('death',e);return true;
 }
 respawn(e){
  const retained=e.growth?e.r:C.respawnRadius,p=this.spawnPoint(retained+180);Object.assign(e,{x:p.x,y:p.y,vx:0,vy:0,r:retained,mass:retained**2,collisionScale:1,invincible:C.respawnProtection});
  if(e.growth)syncReserve(e,0,true);e.controller.goal=null;e.controller.think=0;if(e.controller.type==='ai')this.ecology.npcRespawns++;this.onEvent('respawn',e);
 }
 update(dt,input){
  if(this.finished)return;this.elapsed=Math.min(this.duration,this.elapsed+dt);this.updateMagnet(dt);
  for(const e of this.entities){
   tickActives(e,dt);e.hitFlash=Math.max(0,(e.hitFlash||0)-dt);e.visualTime=this.elapsed;e.spikeContact=false;
   if(e.dead>0){e.dead=Math.max(0,e.dead-dt);if(!e.dead)this.respawn(e);continue;}
   e.invincible=Math.max(0,e.invincible-dt);for(const key of Object.keys(e.effects)){e.effects[key]-=dt;if(e.effects[key]<=0)delete e.effects[key];}
   const v=e.controller.type==='human'?input:aiDirection(this,e,dt);
   if(e.controller.type==='ai'&&shouldUseSkill(this,e)&&Math.random()<dt*(1+e.controller.profile.skill*4))this.useSkill(e);
   const speed=this.speed(e),blend=1-Math.exp(-dt*(e.controller.type==='human'?4:2.2));
   e.vx+=(v.x*speed-e.vx)*blend;e.vy+=(v.y*speed-e.vy)*blend;
   e.x=clamp(e.x+e.vx*dt,e.r,C.world.width-e.r);e.y=clamp(e.y+e.vy*dt,e.r,C.world.height-e.r);
   const velocity=Math.hypot(e.vx,e.vy);if(velocity>3)e.aim={x:e.vx/velocity,y:e.vy/velocity};
   // Collision stays stable in world units, entirely independent of camera and visual deformation.
   const t=clamp((velocity/1200-.08)/.72,0,1),target=1-.12*t*t*(3-2*t);
   e.collisionScale+=(target-e.collisionScale)*(1-Math.exp(-dt*5));
   e.diluted=dist(e,this.center)>this.safeRadius;
   if(e.diluted)this.drainInk(e,dt);
   if(!e.growth)e.r=Math.sqrt(e.mass);
   for(let i=this.foods.length-1;i>=0;i--){const food=this.foods[i],reach=this.radius(e)+(e.effects.absorb?55:0);const dx=e.x-food.x,dy=e.y-food.y,reachWithFood=reach+food.r;if(Math.abs(dx)<reachWithFood&&Math.abs(dy)<reachWithFood&&dx*dx+dy*dy<reachWithFood*reachWithFood){let gain=food.mass*C.foodGain*this.rewardMultiplier*(e.growth?R.humanFoodGainScale:1)*(this.theme==='boss'?1+talentValue(e,'surge'):1);if(e.growth){const before=e.ink;gainReserve(e,gain,true,this.theme!=='boss');gain=e.ink-before;}else{e.mass=Math.min(C.maxRadius**2,e.mass+gain);e.r=Math.sqrt(e.mass);e.ink+=gain;}if(e.controller.type==='ai'){this.ecology.npcFood++;this.ecology.maxRadius=Math.max(this.ecology.maxRadius,e.r);}this.foods.splice(i,1);this.onEvent('consume',{entity:e,x:food.x,y:food.y,r:food.r,playerSize:e.r,gain,kind:'food'});}}
   if(e.growth){syncReserve(e,dt);advanceRewards(e,dt,this.onEvent);}
   for(let i=this.items.length-1;i>=0;i--){if(e.skills.length<2&&dist(e,this.items[i])<this.radius(e)+10){if(e.growth){if(this.theme==='boss')continue;grantChoice(e);this.items.splice(i,1);this.onEvent('choice-earned',{entity:e,source:'yellow'});}else{const skill=SKILLS[Math.floor(Math.random()*SKILLS.length)];e.skills.push(skill);this.items.splice(i,1);this.onEvent('skill',{entity:e,skill});}}}
  }
  // Legacy NPC mutual consumption: size advantage plus substantial coverage, never touch-to-kill.
  for(let i=0;i<this.entities.length;i++){const a=this.entities[i];if(a.dead||a.effects.water)continue;for(let j=i+1;j<this.entities.length;j++){const b=this.entities[j];if(b.dead||b.effects.water)continue;const [big,small]=this.radius(a)>this.radius(b)?[a,b]:[b,a];if(this.radius(big)>this.radius(small)*C.consumeRatio&&dist(big,small)<this.radius(big)-this.radius(small)*C.consumeOverlap){this.kill(small,big);if(a.dead)break;}}}
  // Swallowing wins priority; only surviving contacts receive dt-based spike loss.
  for(const source of this.entities){if(source.dead||source.appearance!=='thorn')continue;for(const target of this.entities){if(source!==target)this.applySpikes(source,target,dt);}}
  this.foodClock+=dt*this.foodSpawnRate;while(this.foodClock>=1){this.foodClock--;if(this.foods.length<this.foodTarget)this.foods.push(this.food());}
  this.itemClock-=dt;if(this.itemClock<=0){this.itemClock=C.itemSpawnInterval;if(this.theme!=='boss'&&this.items.length<C.maxItems)this.items.push({...this.spawnPoint(),r:10});}
  this.ranged?.update(dt);
  for(const wave of this.waves)wave.age+=dt;this.waves=this.waves.filter(w=>w.age<C.skillDurations.splash);
  if(this.autoFinish&&this.elapsed>=this.duration)this.finish();
 }
 finish(){if(this.finished)return this.result;this.finished=true;this.result=settlement(this.player.ink,this.elapsed,this.rank,{...C,inkstoneDuration:this.duration});this.onEvent('finish',this.result);return this.result;}
}
