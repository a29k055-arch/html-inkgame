import {markSpike,resolveSpikes} from './reveal-combat.js';
import {beginPondGravity,applyPondGravity,pondMagnetField} from './pond-gravity.js';
import {canSwallow} from './phases.js';
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
  this.fixedFoodRewards=options.foodRewards;this.competitorEnabled=!!options.competitor;this.world={...(options.world||C.world)};this.movement=options.movement;this.behavior=options.behavior;this.growthBalance=options.growthBalance;this.magnetRules=options.magnetRules;this.combatRules=options.combatRules;this.boundarySliding=!!options.boundarySliding;this.npcRespawnSizes=options.npcRespawnSizes;this.npcSpawner=options.npcSpawner;this.aiCount=options.aiCount??C.aiCount;this.npcMaxRadius=options.npcMaxRadius??C.maxRadius;this.npcFoodGainScale=options.npcFoodGainScale??1;this.playerSpeedPenalty=options.playerSpeedPenalty;this.simplePickups=!!options.simplePickups;this.playerSheltered=options.playerSheltered;this.npcPredation=options.npcPredation;this.playerLethalRatio=options.playerLethalRatio;this.softDown=options.softDown;this.rewardChoices=options.rewardChoices!==false;this.shrink=options.shrink!==false;this.rushSpeed=options.rushSpeed??A.dash.speed;this.duration=options.duration||C.inkstoneDuration;this.autoFinish=options.autoFinish!==false;this.rewardMultiplier=options.rewardMultiplier||1;
  this.foodTarget=options.foodTarget??C.foodTarget;this.foodSpawnRate=options.foodSpawnRate??C.foodSpawnRate;this.reserveGrowth=!!options.reserveGrowth;this.onEvent=onEvent;this.elapsed=0;this.finished=false;this.itemClock=C.itemSpawnInterval;this.foodClock=0;this.waves=[];this.ecology={npcSwallows:0,npcRespawns:0,npcFood:0,maxRadius:0};
  this.center={x:this.world.width/2,y:this.world.height/2};
  this.player=entity('human',this.center.x,this.center.y,C.initialRadius,{type:'human'});this.player.invincible=C.respawnProtection;if(options.reserveRules)this.player.reserveRules={...options.reserveRules};if(this.reserveGrowth)initReserve(this.player,options.startInk??R.startInk);
  this.entities=[this.player];
  for(let i=0;i<(options.aiCount??C.aiCount);i++){
   const spawn=this.npcSpawner?.(this,i),point=spawn?.point||randomNpcPoint(this.player,this.world),roll=Math.random();
   const radius=spawn?.radius??(roll>.93?random(78,118):roll>.78?random(42,72):random(14,38));
   const npc=entity(names[i%names.length]+(i>=names.length?i+1:''),point.x,point.y,radius,aiController(i,spawn?.personality));if(spawn?.personality==='drift')npc.passive=true;npc.ecologyTier=spawn?.ecologyTier||1;npc.skinIndex=i;npc.nameIndex=i%names.length;npc.nameNumber=i>=names.length?i+1:'';npc.appearance='living';Object.assign(npc,{species:spawn?.species||'fish',rewardKind:spawn?.rewardKind||null,rewardGlow:!!spawn?.rewardGlow,rewardTier:spawn?.rewardTier||1,birthSlot:spawn?.birthSlot??i});this.entities.push(npc);
  }
  if(this.competitorEnabled)this.ensureCompetitor();
  this.foods=Array.from({length:this.foodTarget},()=>this.food());this.items=[];this.ranged=this.reserveGrowth?new RangedCombat(this):null;
 }
 // Transfer behavior only: a new carrier keeps its own resource, radius and birth tier.
 ensureCompetitor(){if(!this.competitorEnabled)return null;const living=this.entities.slice(1).filter(e=>!e.dead&&!e.eventDragon),current=living.filter(e=>e.competitor);if(current.length===1)return current[0];for(const e of current.slice(1)){e.competitor=false;e.controller=e.ordinaryController||aiController(e.skinIndex,e.passive?'drift':undefined);delete e.ordinaryController;}
  if(current.length)return current[0];let next=living.reduce((best,e)=>!best||e.r<best.r?e:best,null);if(!next){next=this.entities[1];if(!next)return null;next.dead=0;this.respawn(next);}next.ordinaryController=next.controller;next.controller=aiController(next.skinIndex,'competitor');next.competitor=true;next.passive=false;this.competitorId=next.id;return next;
 }
 clearTemporaryInk(e){if(!e.turtleInk)return;const minimum=e.reserveRules?.minimumRespawnInk||0;e.ink=Math.max(minimum,e.ink-e.turtleInk);e.turtleInk=0;if(e.growth)syncReserve(e,0,true);}
 constrain(e){const r=Math.min(this.radius(e),Math.min(this.world.width,this.world.height)/2-1);e.x=clamp(e.x,r,this.world.width-r);e.y=clamp(e.y,r,this.world.height-r);if((e.x<=r+.01&&e.vx<0)||(e.x>=this.world.width-r-.01&&e.vx>0))e.vx=0;if((e.y<=r+.01&&e.vy<0)||(e.y>=this.world.height-r-.01&&e.vy>0))e.vy=0;if(e!==this.player)this.staticConstraint?.(e,r);}
 get safeRadius(){if(!this.shrink)return Math.hypot(this.world.width,this.world.height);const initial=Math.hypot(this.world.width,this.world.height)/2+30,t=clamp((this.elapsed/this.duration-C.waterRingStart)/(1-C.waterRingStart),0,1);return initial+(C.waterRingEndRadius-initial)*(1-(1-t)**C.waterRingExponent);}
 get rank(){return 1+this.entities.filter(e=>e!==this.player&&!e.dead&&e.mass>this.player.mass).length;}
 spawnPoint(clearance=0){
  let point=randomPoint(this.world),best={...this.center},bestClearance=-Infinity;
  for(let i=0;i<60;i++){
   point=randomPoint(this.world);if(dist(point,this.center)>this.safeRadius-45)continue;
   let nearest=Infinity;for(const e of this.entities){if(!e.dead)nearest=Math.min(nearest,dist(e,point)-e.r);}
   if(nearest>bestClearance){best=point;bestClearance=nearest;}if(nearest>=clearance)return point;
  }
  return best;
 }
 food(){const food=createFood(this.spawnPoint());if(this.fixedFoodRewards)food.inkReward=this.fixedFoodRewards.find(t=>food.r<=t.maxRadius)?.ink??this.fixedFoodRewards.at(-1).ink;return food;}
 speed(e,includeActive=true){const m=this.movement;const base=m?Math.max(m.minimum,m.base*(1-m.penalty*clamp((e.r-m.reference)/(m.maximum-m.reference),0,1)**.85)):(e===this.player&&this.playerSpeedPenalty!==undefined?235*(1-clamp((e.r-18)/152,0,1)*this.playerSpeedPenalty):moveSpeed(e.r));const ai=e.controller.type==='ai'?(e.controller.profile.playerSpeedRatio??(m?m.aiBase+e.controller.profile.skill*m.aiSkill:.70+e.controller.profile.skill*.18))*(e.controller.profile.speedScale??1):1,boost=includeActive?Math.max(e.effects.rush?(e.pondBuffs?.rush?.strength??this.rushSpeed):0,e.effects.manualRush?this.rushSpeed:0,e.effects.escape?(this.combatRules?.escapeBoost||0):0):0;return base*(1+talentValue(e,'haste'))*ai*(e.effects.dense?.65:1)*(1+boost);}
 growthFactor(e){const c=this.growthBalance;return c?c.late+(c.early-c.late)/(1+e.ink/c.scale):1;}
 radius(e){return coreRadius(e);}
 drainInk(e,dt,multiplier=1){if(e.dead||e.effects.water)return 0;if(e.growth){const before=e.ink;e.ink=Math.max(Math.min(before,K.spikeInkFloor),before-before*C.waterDecay*multiplier*dt);syncReserve(e);return before-e.ink;}const lost=Math.max(0,Math.min(e.mass-C.respawnRadius**2,e.mass*C.waterDecay*multiplier*dt));e.mass-=lost;e.r=Math.sqrt(e.mass);e.ink=Math.max(0,e.ink-lost);return lost;}

 applySpikes(source,target,dt){if(!canSwallow(this,source,target))return;if(target.dead||source.dead||source.effects?.water||target.invincible||target.effects.water||this.radius(source)<=this.radius(target)*C.consumeRatio||!spikeContact(source,target,this.radius(target)))return;if(this.combatRules){markSpike(this,source,target);return;}if(this.simplePickups&&target.wardCharges>0){blockHit(target);target.invincible=.8;this.onEvent('shield',target);return;}const resource=target.growth?target.ink:Math.max(0,(target.mass-C.respawnRadius**2)/4),size=clamp(this.radius(source)/K.spikeReferenceRadius,K.spikeSizeMin,K.spikeSizeMax),rate=Math.min(K.spikeMaxLossPerSecond,resource*K.spikeBaseRate*size);if(target.spikeFrame!==this.elapsed){target.spikeFrame=this.elapsed;target.spikeRate=0;}const add=Math.max(0,rate-(target.spikeRate||0));target.spikeRate=Math.max(rate,target.spikeRate||0);const loss=add*Math.min(K.contactInterval,Math.max(0,dt));if(target.growth){target.ink=Math.max(Math.min(target.ink,K.spikeInkFloor),target.ink-loss);syncReserve(target);}else{const massLoss=Math.min(Math.max(0,target.mass-C.respawnRadius**2),loss*4);target.mass-=massLoss;target.r=Math.sqrt(target.mass);target.ink=Math.max(0,target.ink-loss);}target.spikeContact=loss>0;target.spikeFeedback=Math.max(0,(target.spikeFeedback||0)-dt);if(loss>0&&target.spikeFeedback<=0){target.spikeFeedback=K.feedbackInterval;this.onEvent('spike-loss',{entity:target,x:target.x,y:target.y,r:Math.min(10,target.r*.12)});}}

 updateMagnet(dt){const p=this.player,level=p.talents?.magnet||0;if(this.magnetRules){const c=this.magnetRules,active=!!p.effects.magnet&&!p.dead,reach=(this.radius(p)+c.magnetReach)*(active?(p.pondBuffs?.magnet?.strength??c.magnetMultiplier):1),blend=1-Math.exp(-c.magnetAcceleration*dt),release=Math.exp(-(c.magnetReleaseDamping||9)*dt);for(const f of this.foods){const dx=p.x-f.x,dy=p.y-f.y,d=Math.hypot(dx,dy)||1;if(active&&d<reach){const speed=c.magnetSpeed*(.35+.65*(1-d/reach));f.vx=(f.vx||0)+(dx/d*speed-(f.vx||0))*blend;f.vy=(f.vy||0)+(dy/d*speed-(f.vy||0))*blend;f.x=clamp(f.x+f.vx*dt,f.r,this.world.width-f.r);f.y=clamp(f.y+f.vy*dt,f.r,this.world.height-f.r);}else{f.vx=(f.vx||0)*release;f.vy=(f.vy||0)*release;f.x=clamp(f.x+f.vx*dt,f.r,this.world.width-f.r);f.y=clamp(f.y+f.vy*dt,f.r,this.world.height-f.r);if(Math.hypot(f.vx,f.vy)<.2){f.vx=0;f.vy=0;}}}return;}if((!level&&!p.effects.absorb)||p.dead)return;const reach=this.radius(p)+T.magnetBaseReach*(1+talentValue(p,'magnet'))+(p.effects.absorb?A.absorb.reach:0),blend=1-Math.exp(-T.magnetAcceleration*dt),decay=Math.exp(-dt*T.magnetDamping);for(const food of this.foods){const dx=p.x-food.x,dy=p.y-food.y;if(Math.abs(dx)<reach&&Math.abs(dy)<reach){const distance=Math.hypot(dx,dy)||1;if(distance<reach){const force=T.magnetSpeed*(.3+.7*(1-distance/reach)),swirl=Math.sin(this.elapsed*2+(food.rot||0))*Math.min(22,distance*.15),vx=dx/distance*force-dy/distance*swirl,vy=dy/distance*force+dx/distance*swirl;food.vx=(food.vx||0)+(vx-(food.vx||0))*blend;food.vy=(food.vy||0)+(vy-(food.vy||0))*blend;}}food.vx=(food.vx||0)*decay;food.vy=(food.vy||0)*decay;food.x=clamp(food.x+food.vx*dt,food.r,this.world.width-food.r);food.y=clamp(food.y+food.vy*dt,food.r,this.world.height-food.r);}}
 useSkill(e=this.player){
  if(e.dead||e.effects.water||!e.skills.length||this.finished)return false;
  const skill=e.skills.shift();if(this.reserveGrowth&&skill.id==='splash')return false;e.effects[skill.id]=C.skillDurations[skill.id];
  if(skill.id==='splash'){
   this.waves.push({x:e.x,y:e.y,aim:{...e.aim},owner:e.id,age:0,range:C.splashRange});
   // Pigment washes away mass; never applies velocity, recoil or any fluid force to another entity.
   for(const other of this.entities){if(other===e||other.dead||other.invincible||other.effects.water)continue;const d=dist(e,other),dot=((other.x-e.x)*e.aim.x+(other.y-e.y)*e.aim.y)/Math.max(1,d);if(d<C.splashRange&&dot>.4){const lost=Math.min(other.mass-C.respawnRadius**2,other.mass*C.splashDilution);other.mass-=Math.max(0,lost);other.r=other.growth?other.r:Math.sqrt(other.mass);other.ink=other.growth?Math.max(Math.min(other.ink,K.spikeInkFloor),other.ink-Math.max(0,lost)/R.sizeMassPerInk):Math.max(0,other.ink-Math.max(0,lost));if(other.growth)syncReserve(other);}}
  }
  this.onEvent('skill-used',{entity:e,skill});return true;
 }
 kill(e,killer){
  if(e.dead||e.invincible>0||e.effects.water)return false;
  // Lotus shelter: an NPC may overlap the player under a leaf but can never swallow it.
  // Only swallowing is blocked; spikes, spray, camera and every other rule stay untouched.
  if(e===this.player&&this.playerSheltered?.())return false;
  if(blockHit(e)){e.invincible=this.combatRules?.lethalGrace||1.2;if(this.combatRules){e.effects.escape=this.combatRules.escapeDuration;e.shieldReason='swallow';}this.onEvent('shield',e);return false;}
  // First swallow in a while only costs ink: the body survives, so one bad roll is not the run.
  if(e===this.player)this.clearTemporaryInk(e);
  if(e===this.player&&this.softDown){const win=this.softDown.window||20;
   if(this.elapsed-(e.lastDownAt??-1e9)>win){e.lastDownAt=this.elapsed;const before=e.ink;e.ink=Math.max(e.reserveRules?.minimumRespawnInk??0,before*(this.softDown.retain??.65));syncReserve(e,0,true);e.invincible=Math.max(e.invincible,this.softDown.grace??2.2);this.onEvent('soft-down',{entity:e,x:e.x,y:e.y,ink:before-e.ink});return true;}
  }
  if(killer){const killerCoreRadius=this.radius(killer),rawGain=e.mass*C.npcGain*this.rewardMultiplier;let gain=killer.growth?Math.min(this.growthBalance?.npcGainCap??R.playerNpcGainCap,rawGain*R.playerNpcGainScale):rawGain;if(killer.growth){const before=killer.ink;gain*=this.growthFactor(killer);gainReserve(killer,gain,true,this.rewardChoices&&this.theme!=='boss');gain=killer.ink-before;}else{const before=killer.mass;killer.mass=Math.min(this.npcMaxRadius**2,killer.mass+gain);gain=killer.mass-before;killer.r=Math.sqrt(killer.mass);killer.ink+=gain;}if(killer.controller.type==='ai'&&e.controller.type==='ai'){this.ecology.npcSwallows++;this.ecology.maxRadius=Math.max(this.ecology.maxRadius,killer.r);}killer.swallowed++;if(this.staticConstraint&&killer!==this.player)this.constrain(killer);this.onEvent('consume',{entity:killer,x:e.x,y:e.y,r:e.r,playerSize:killer.r,gain,killerCoreRadius,coreRadius:this.radius(e),kind:'enemy',species:e.species,rewardKind:e.rewardKind,rewardGlow:e.rewardGlow,rewardTier:e.rewardTier,eventDragon:!!e.eventDragon,consumedId:e.id});}
  stopActives(e);this.ranged?.reset(e);e.deaths++;if(!e.growth)e.ink*=C.deathInkRetention;e.dead=C.respawnDelay;e.skills=[];e.effects={};if(e.growth)resetReserveOnDeath(e);this.onEvent('death',e);if(e.competitor){e.competitor=false;e.controller=e.ordinaryController||aiController(e.skinIndex);delete e.ordinaryController;this.ensureCompetitor();}return true;
 }
 respawn(e){
  const spawn=!e.growth?this.npcSpawner?.(this,this.entities.indexOf(e)-1,{respawn:true,entity:e}):null,roll=!e.growth&&this.npcRespawnSizes?Math.random():0,band=!e.growth&&this.npcRespawnSizes?.find(b=>roll<b[0]),npcRadius=spawn?.radius??(band?random(band[1],band[2]):C.respawnRadius),retained=e.growth?e.r:npcRadius,p=spawn?.point||this.spawnPoint(retained+180);Object.assign(e,{x:p.x,y:p.y,vx:0,vy:0,r:retained,mass:retained**2,collisionScale:1,invincible:C.respawnProtection});
  if(!e.growth&&this.npcSpawner){Object.assign(e,{species:spawn?.species||e.species,appearance:'living',rewardKind:spawn?.rewardKind||null,rewardGlow:!!spawn?.rewardGlow,rewardTier:spawn?.rewardTier||1,birthSlot:spawn?.birthSlot??e.birthSlot});e.ink=0;e.ecologyTier=spawn?.ecologyTier||e.ecologyTier;e.digestUntil=0;e.passive=spawn?.personality==='drift';}if(e.growth)syncReserve(e,0,true);if(this.boundarySliding)this.constrain(e);if(spawn?.personality&&!e.growth)e.controller=aiController(Math.max(0,this.entities.indexOf(e)-1),spawn.personality);e.controller.goal=null;e.controller.think=0;if(e.controller.type==='ai')this.ecology.npcRespawns++;this.onEvent('respawn',e);
 }
 update(dt,input){
  if(this.finished)return;this.elapsed=Math.min(this.duration,this.elapsed+dt);this.updateMagnet(dt);beginPondGravity(this);
  for(const e of this.entities){
   tickActives(e,dt);e.hitFlash=Math.max(0,(e.hitFlash||0)-dt);e.visualTime=this.elapsed;e.spikeContact=false;
   if(e.dead>0){e.dead=Math.max(0,e.dead-dt);if(!e.dead)this.respawn(e);continue;}
   e.invincible=Math.max(0,e.invincible-dt);for(const key of Object.keys(e.effects)){e.effects[key]-=dt;if(e.effects[key]<=0)delete e.effects[key];}
   const desired=e.controller.type==='human'?input:aiDirection(this,e,dt),v=e!==this.player&&this.staticDirection?this.staticDirection(e,desired):desired;
   if(e.controller.type==='ai'&&shouldUseSkill(this,e)&&Math.random()<dt*(1+e.controller.profile.skill*4))this.useSkill(e);
   const speed=this.speed(e),blend=1-Math.exp(-dt*(e.controller.type==='human'?4:2.2));
   e.vx+=(v.x*speed-e.vx)*blend;e.vy+=(v.y*speed-e.vy)*blend;
   if(this.boundarySliding){const oldX=e.x,oldY=e.y;e.x+=e.vx*dt;e.y+=e.vy*dt;this.constrain(e);const blocked=Math.hypot(e.x-oldX,e.y-oldY)<speed*dt*.12&&Math.hypot(v.x,v.y)>.2;e.controller.blockedTime=blocked?(e.controller.blockedTime||0)+dt:0;if(e.controller.type==='ai'&&e.controller.blockedTime>.65){e.controller.goal=null;e.controller.think=0;e.controller.escapeUntil=this.elapsed+1.3;e.controller.blockedTime=0;}}else {e.x=clamp(e.x+e.vx*dt,e.r,this.world.width-e.r);e.y=clamp(e.y+e.vy*dt,e.r,this.world.height-e.r);}
   applyPondGravity(this,e,dt);
   const velocity=Math.hypot(e.vx,e.vy);if(velocity>3)e.aim={x:e.vx/velocity,y:e.vy/velocity};
   // Collision stays stable in world units, entirely independent of camera and visual deformation.
   const t=clamp((velocity/1200-.08)/.72,0,1),target=1-.12*t*t*(3-2*t);
   e.collisionScale+=(target-e.collisionScale)*(1-Math.exp(-dt*5));
   e.diluted=dist(e,this.center)>this.safeRadius;
   if(e.diluted)this.drainInk(e,dt);
   if(!e.growth)e.r=Math.sqrt(e.mass);
   for(let i=this.foods.length-1;i>=0;i--){const food=this.foods[i],reach=this.radius(e)+(e.effects.absorb?55:0);const dx=e.x-food.x,dy=e.y-food.y,reachWithFood=reach+food.r;if(Math.abs(dx)<reachWithFood&&Math.abs(dy)<reachWithFood&&dx*dx+dy*dy<reachWithFood*reachWithFood){let gain=food.mass*C.foodGain*this.rewardMultiplier*(e.growth?R.humanFoodGainScale:this.npcFoodGainScale)*(this.theme==='boss'?1+talentValue(e,'surge'):1)*(e===this.player&&e.effects.flower&&this.magnetRules?this.magnetRules.flowerGain:1);if(e.growth){const before=e.ink;if(this.fixedFoodRewards)gain=(food.inkReward??this.fixedFoodRewards.find(t=>food.r<=t.maxRadius)?.ink??this.fixedFoodRewards.at(-1).ink)*(e.effects.flower&&this.magnetRules?this.magnetRules.flowerGain:1);else gain*=this.growthFactor(e);gainReserve(e,gain,true,this.rewardChoices&&this.theme!=='boss');gain=e.ink-before;}else{const before=e.mass;e.mass=Math.min(this.npcMaxRadius**2,e.mass+gain);gain=e.mass-before;e.r=Math.sqrt(e.mass);e.ink+=gain;}if(e.controller.type==='ai'){this.ecology.npcFood++;this.ecology.maxRadius=Math.max(this.ecology.maxRadius,e.r);}this.foods.splice(i,1);this.onEvent('consume',{entity:e,x:food.x,y:food.y,r:food.r,playerSize:e.r,gain,kind:'food'});}}
   if(e.growth){syncReserve(e,dt);advanceRewards(e,dt,this.onEvent);}if(this.boundarySliding)this.constrain(e);
   for(let i=this.items.length-1;i>=0;i--){if(!this.simplePickups&&e.skills.length<2&&dist(e,this.items[i])<this.radius(e)+10){if(e.growth){if(this.theme==='boss')continue;grantChoice(e);this.items.splice(i,1);this.onEvent('choice-earned',{entity:e,source:'yellow'});}else{const pool=this.reserveGrowth?SKILLS.filter(s=>s.id!=='splash'):SKILLS;const skill=pool[Math.floor(Math.random()*pool.length)];e.skills.push(skill);this.items.splice(i,1);this.onEvent('skill',{entity:e,skill});}}}
  }
  // Legacy NPC mutual consumption: size advantage plus substantial coverage, never touch-to-kill.
  // NPC-vs-NPC uses a stricter size gap and a per-killer digest cooldown so one big body cannot
  // sweep the whole nursery; player swallows keep the original fast rule.
  const pred=this.npcPredation;
  for(let i=0;i<this.entities.length;i++){const a=this.entities[i];if(a.dead||a.effects.water)continue;for(let j=i+1;j<this.entities.length;j++){const b=this.entities[j];if(b.dead||b.effects.water||!canSwallow(this,a,b))continue;// In V4 compare drawn bodies, so nothing that looks bigger than you can be swallowed;
 // the classic campaign keeps its original core-radius rule untouched.
const sizeOf=e=>this.radius(e);
const [big,small]=sizeOf(a)>sizeOf(b)?[a,b]:[b,a];const npcPair=big.controller?.type==='ai'&&small.controller?.type==='ai';if(npcPair&&pred&&big.digestUntil>this.elapsed)continue;// An NPC must be clearly bigger to swallow the player; the player itself keeps the fast rule.
   const ratio=(small===this.player||small.controller?.type!=='ai')?(this.playerLethalRatio??C.consumeRatio):npcPair?(pred?.ratio??C.consumeRatio):C.consumeRatio;if(sizeOf(big)>sizeOf(small)*ratio&&dist(big,small)<this.radius(big)-this.radius(small)*C.consumeOverlap){this.kill(small,big);if(npcPair&&pred)big.digestUntil=this.elapsed+random(pred.cooldownMin,pred.cooldownMax);if(a.dead)break;}}}
  // Swallowing wins priority; only surviving contacts receive dt-based spike loss.
  for(const source of this.entities){if(source.dead||source.appearance!=='thorn')continue;for(const target of this.entities){if(source!==target&&canSwallow(this,source,target))this.applySpikes(source,target,dt);}}
  if(this.combatRules)resolveSpikes(this,dt);
  this.foodClock+=dt*this.foodSpawnRate;while(this.foodClock>=1){this.foodClock--;if(this.foods.length<this.foodTarget)this.foods.push(this.food());}
  this.itemClock-=dt;if(this.itemClock<=0){this.itemClock=C.itemSpawnInterval;if(!this.simplePickups&&this.theme!=='boss'&&this.items.length<C.maxItems)this.items.push({...this.spawnPoint(),r:10});}
  this.ranged?.update(dt);
  for(const wave of this.waves)wave.age+=dt;this.waves=this.waves.filter(w=>w.age<C.skillDurations.splash);
  if(this.magnetRules?.npcAttraction)this.magnetField=pondMagnetField(this);
  if(this.autoFinish&&this.elapsed>=this.duration)this.finish();
 }
 finish(){if(this.finished)return this.result;this.finished=true;this.result=settlement(this.player.ink,this.elapsed,this.rank,{...C,inkstoneDuration:this.duration});this.onEvent('finish',this.result);return this.result;}
}
