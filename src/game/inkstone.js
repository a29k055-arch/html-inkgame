import {GAME_CONFIG as C,SKILLS,clamp,dist,settlement} from './config.js';
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
  this.onEvent=onEvent;this.elapsed=0;this.finished=false;this.itemClock=C.itemSpawnInterval;this.foodClock=0;this.waves=[];
  this.center={x:C.world.width/2,y:C.world.height/2};
  this.player=entity('human',this.center.x,this.center.y,C.initialRadius,{type:'human'});this.player.invincible=C.respawnProtection;
  this.entities=[this.player];
  for(let i=0;i<(options.aiCount??C.aiCount);i++){
   const point=randomNpcPoint(this.player),roll=Math.random();
   const radius=roll>.93?random(78,118):roll>.78?random(42,72):random(14,38);
   const npc=entity(names[i%names.length]+(i>=names.length?i+1:''),point.x,point.y,radius,aiController(i));npc.appearance=i%2?'eye':'thorn';this.entities.push(npc);
  }
  this.foods=Array.from({length:C.foodTarget},()=>this.food());this.items=[];
 }
 get safeRadius(){const initial=Math.hypot(C.world.width,C.world.height)/2+30,t=clamp((this.elapsed/this.duration-C.waterRingStart)/(1-C.waterRingStart),0,1);return initial+(C.waterRingEndRadius-initial)*t;}
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
 speed(e){return moveSpeed(e.r)*(e.controller.type==='ai'?(.70+e.controller.profile.skill*.18):1)*(e.effects.dense?.65:1);}
 radius(e){return e.r*(e.effects.dense?1.32:1)*e.collisionScale;}
 useSkill(e=this.player){
  if(e.dead||!e.skills.length||this.finished)return false;
  const skill=e.skills.shift();e.effects[skill.id]=C.skillDurations[skill.id];
  if(skill.id==='splash'){
   this.waves.push({x:e.x,y:e.y,aim:{...e.aim},owner:e.id,age:0,range:C.splashRange});
   // Pigment washes away mass; never applies velocity, recoil or any fluid force to another entity.
   for(const other of this.entities){if(other===e||other.dead||other.invincible||other.effects.water)continue;const d=dist(e,other),dot=((other.x-e.x)*e.aim.x+(other.y-e.y)*e.aim.y)/Math.max(1,d);if(d<C.splashRange&&dot>.4){const lost=Math.min(other.mass-C.respawnRadius**2,other.mass*C.splashDilution);other.mass-=Math.max(0,lost);other.r=Math.sqrt(other.mass);other.ink=Math.max(0,other.ink-Math.max(0,lost));}}
  }
  this.onEvent('skill-used',{entity:e,skill});return true;
 }
 kill(e,killer){
  if(e.dead||e.invincible>0||e.effects.water)return false;
  if(e.effects.shield){delete e.effects.shield;e.invincible=1.2;this.onEvent('shield',e);return false;}
  if(killer){const gain=e.mass*C.npcGain*this.rewardMultiplier;killer.mass=Math.min(C.maxRadius**2,killer.mass+gain);killer.r=Math.sqrt(killer.mass);killer.ink+=gain;killer.swallowed++;this.onEvent('consume',{entity:killer,x:e.x,y:e.y,r:e.r,gain,kind:'enemy'});}
  e.deaths++;e.ink*=C.deathInkRetention;e.dead=C.respawnDelay;e.skills=[];e.effects={};this.onEvent('death',e);return true;
 }
 respawn(e){
  const p=this.spawnPoint(120);Object.assign(e,{x:p.x,y:p.y,vx:0,vy:0,r:C.respawnRadius,mass:C.respawnRadius**2,collisionScale:1,invincible:C.respawnProtection});
  e.controller.goal=null;e.controller.think=0;this.onEvent('respawn',e);
 }
 update(dt,input){
  if(this.finished)return;this.elapsed=Math.min(this.duration,this.elapsed+dt);
  for(const e of this.entities){
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
   if(e.diluted){const lost=Math.max(0,Math.min(e.mass-C.respawnRadius**2,e.mass*C.waterDecay*dt));e.mass-=lost;e.ink=Math.max(0,e.ink-lost);}
   e.r=Math.sqrt(e.mass);
   for(let i=this.foods.length-1;i>=0;i--){const food=this.foods[i],reach=this.radius(e)+(e.effects.absorb?55:0);const dx=e.x-food.x,dy=e.y-food.y,reachWithFood=reach+food.r;if(Math.abs(dx)<reachWithFood&&Math.abs(dy)<reachWithFood&&dx*dx+dy*dy<reachWithFood*reachWithFood){const gain=food.mass*C.foodGain*this.rewardMultiplier;e.mass=Math.min(C.maxRadius**2,e.mass+gain);e.r=Math.sqrt(e.mass);e.ink+=gain;this.foods.splice(i,1);this.onEvent('consume',{entity:e,x:food.x,y:food.y,r:food.r,gain,kind:'food'});}}
   for(let i=this.items.length-1;i>=0;i--){if(e.skills.length<2&&dist(e,this.items[i])<this.radius(e)+10){const skill=SKILLS[Math.floor(Math.random()*SKILLS.length)];e.skills.push(skill);this.items.splice(i,1);this.onEvent('skill',{entity:e,skill});}}
  }
  // Legacy NPC mutual consumption: size advantage plus substantial coverage, never touch-to-kill.
  for(let i=0;i<this.entities.length;i++){const a=this.entities[i];if(a.dead||a.effects.water)continue;for(let j=i+1;j<this.entities.length;j++){const b=this.entities[j];if(b.dead||b.effects.water)continue;const [big,small]=this.radius(a)>this.radius(b)?[a,b]:[b,a];if(this.radius(big)>this.radius(small)*C.consumeRatio&&dist(big,small)<this.radius(big)-this.radius(small)*C.consumeOverlap){this.kill(small,big);if(a.dead)break;}}}
  this.foodClock+=dt*C.foodSpawnRate;while(this.foodClock>=1){this.foodClock--;if(this.foods.length<C.foodTarget)this.foods.push(this.food());}
  this.itemClock-=dt;if(this.itemClock<=0){this.itemClock=C.itemSpawnInterval;if(this.items.length<C.maxItems)this.items.push({...this.spawnPoint(),r:10});}
  for(const wave of this.waves)wave.age+=dt;this.waves=this.waves.filter(w=>w.age<C.skillDurations.splash);
  if(this.autoFinish&&this.elapsed>=this.duration)this.finish();
 }
 finish(){if(this.finished)return this.result;this.finished=true;this.result=settlement(this.player.ink,this.elapsed,this.rank,{...C,inkstoneDuration:this.duration});this.onEvent('finish',this.result);return this.result;}
}
