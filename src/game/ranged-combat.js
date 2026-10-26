import {RANGED_CONFIG as C,GAME_CONFIG as G,clamp,dist} from './config.js';
import {blockHit} from './talents.js';
import {syncReserve} from './ink-reserve.js';
import {projectileContact} from './projectile-geometry.js';
import {canShoot,canDamage,factionOf,phaseOf} from './phases.js';
// CPU-only faction rules; none of these fields can write into Hero fluid physics.
export class RangedCombat{
 constructor(world){this.world=world;this.shots=[];this.pool=[];this.states=new WeakMap();this.phase=phaseOf(world);this.metrics={fired:0,hits:0,reflected:0,rejectedFriendly:0};this.serial=0;}
 clear(){this.pool.push(...this.shots);this.shots.length=0;this.states=new WeakMap();for(const e of this.world.entities)e.rangedCharge=0;}
 update(dt){
  const g=this.world,phase=phaseOf(g);if(phase!==this.phase){this.clear();this.phase=phase;}
  if(!canShoot(g)){if(this.shots.length)this.clear();return;}
  const target=g.player;
  for(const e of g.entities){
   if(factionOf(e)!=='enemy'||e.dead||e.effects.water)continue;
   let state=this.states.get(e);if(!state){state={clock:C.interval+Math.random()*C.jitter,target:null,charge:0,status:'cooldown'};this.states.set(e,state);}
   const range=this.range(e),distance=dist(e,target);state.clock-=dt;e.rangedCharge=0;state.distance=distance;state.range=range;state.target=distance<=this.sense(e)?target:null;
   if(distance>this.sense(e)){state.charge=0;state.status='search';continue;}
   if(target.dead||target.effects.water||distance>range*1.12){state.charge=0;state.status=target.dead?'target-dead':'approach';continue;}
   if(state.charge>0){state.charge-=dt;state.status='charging';e.rangedCharge=1-Math.max(0,state.charge)/C.windup;if(state.charge<=0){this.fire(e,target);state.clock=C.interval*(1.25-e.controller.profile.skill*.4)+(1-e.controller.profile.hunt/2)*.7+Math.random()*C.jitter;state.status='fired';}}
   else if(state.clock<=0&&distance<=range&&distance>C.minRange){state.charge=C.windup;state.status='charging';}
   else state.status=distance>range?'approach':'cooldown';
  }
  for(let i=this.shots.length-1;i>=0;i--){
   const s=this.shots[i];s.previousX=s.x;s.previousY=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;s.age+=dt;let remove=s.age>C.life;
   for(const unit of g.entities){
    if(remove||unit.dead||unit.effects.water||unit.id===s.owner||!canDamage(g,s.team||'enemy',unit))continue;
    const coverage=projectileContact(s,unit,g.radius(unit));if(!coverage)continue;
    if(unit.effects.reflect&&s.team!=='player'){
     const source=g.entities.find(e=>e.id===s.owner),dx=(source?.x??s.x-s.vx)-unit.x,dy=(source?.y??s.y-s.vy)-unit.y,n=Math.hypot(dx,dy)||1,speed=Math.hypot(s.vx,s.vy);
     s.owner=unit.id;s.team='player';s.target=source?.id;s.vx=dx/n*speed;s.vy=dy/n*speed;s.friendly=true;s.age=0;this.metrics.reflected++;break;
    }
    this.hurt(unit,coverage,s);remove=true;
   }
   if(remove){this.pool.push(s);this.shots.splice(i,1);}
  }
 }
 sense(e){return G.aiPerceptionRange*(.65+e.controller.profile.skill*.7);}
 range(e){return C.range+(e.controller.profile.skill-.5)*70;}
 reset(e){this.states.delete(e);e.rangedCharge=0;}
 fire(e,target){
  const g=this.world;if(!canShoot(g)||target!==g.player||target.dead||dist(e,target)>this.range(e)*1.12||this.shots.length>=C.maxShots)return false;
  const dx=target.x-e.x,dy=target.y-e.y,n=Math.hypot(dx,dy)||1,kind=e.appearance==='thorn'?'spike':'ink',speed=kind==='spike'?C.spikeSpeed:C.speed,sourceRadius=g.radius(e),scale=clamp(Math.sqrt(sourceRadius/C.sourceReference),.7,1.85),damage=clamp(C.baseDamage+sourceRadius*C.radiusDamage,C.minDamage,C.maxDamage);
  this.shots.push(Object.assign(this.pool.pop()||{},{x:e.x+dx/n*(sourceRadius+15),y:e.y+dy/n*(sourceRadius+15),vx:dx/n*speed,vy:dy/n*speed,r:Math.min(C.shotSizeCap,(kind==='spike'?C.spikeRadius:C.shotRadius)*scale),kind,owner:e.id,team:'enemy',target:target.id,sourceRadius,damage,age:0,seed:++this.metrics.fired,trailId:++this.serial,friendly:false}));return true;
 }
 hurt(e,coverage,s){
  if(!canDamage(this.world,s.team||'enemy',e)){this.metrics.rejectedFriendly++;return 0;}if(e.invincible||e.effects.water)return 0;
  if(blockHit(e)){e.invincible=C.hitProtection;this.world.onEvent('shield',e);return 0;}
  const amount=Math.min(C.maxDamage,s.damage||C.minDamage)*coverage,before=e.ink;
  if(e.growth){e.ink=Math.max(Math.min(before,C.inkFloor),before-amount);syncReserve(e);e.hitFlash=.25;e.growth.damageTaken=(e.growth.damageTaken||0)+before-e.ink;this.world.onEvent('player-hurt',{entity:e,damage:before-e.ink});}
  else{e.mass=Math.max(G.respawnRadius**2,e.mass-amount*4);e.r=Math.sqrt(e.mass);e.ink=Math.max(0,e.ink-amount);}
  e.invincible=C.hitProtection;this.metrics.hits++;this.world.onEvent('impact',{x:s.x,y:s.y,r:Math.min(18,e.r*.25)});return amount;
 }
 snapshot(){return {phase:this.phase,shots:this.shots.map(s=>({owner:s.owner,team:s.team,target:s.target,damage:s.damage,sourceRadius:s.sourceRadius})),units:this.world.entities.filter(e=>e.controller.type==='ai').map(e=>{const s=this.states.get(e);return {id:e.id,target:s?.target?.id||null,range:s?.range||this.range(e),distance:s?.distance,status:s?.status||'disabled',cooldown:s?.clock||0};})};}
}
