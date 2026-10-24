import {coreRadius} from './alien-geometry.js';
import {reserveShotPower,gainReserve,spendReserve} from './ink-reserve.js';
import {createFood} from './legacy-foundation.js';
import {Inkstone} from './inkstone.js';
import {CAMPAIGN_CONFIG as C,GAME_CONFIG,clamp,dist,settlement,PROJECTILE_BALANCE,INK_RESERVE_CONFIG as R} from './config.js';

// Orchestrates existing arenas; AI/motion/food/collision stay inside Inkstone.
export class Campaign {
 constructor(onEvent=()=>{},id=globalThis.crypto?.randomUUID?.()||String(Date.now()),options={}){
  this.onEvent=onEvent;this.id=id;this.limit=Math.min(C.maxBosses,Math.max(0,options.remaining??3));this.scene='normal';this.energy=0;this.attempts=0;this.wins=0;this.finished=false;
  this.normal=new Inkstone((type,data)=>this.event(type,data),{duration:C.duration,autoFinish:false,reserveGrowth:true,foodTarget:R.normalFoodTarget,foodSpawnRate:R.normalFoodSpawnRate});this.arena=this.normal;
  this.shots=[];this.enemyShots=[];this.shotPool=[];this.enemyPool=[];this.shotClock=0;this.boss=null;
 }
 get player(){return this.arena.player;}
 get shotPower(){return reserveShotPower(this.player.ink);}
 get stageStatus(){const i=this.attempts,available=i<this.limit,energyGoal=available?C.thresholds[i]:null,timeGoal=available?C.earliest[i]:null;return {scene:this.scene,index:i,attempts:this.attempts,limit:this.limit,energy:this.energy,energyGoal,energyRemaining:available?Math.max(0,energyGoal-this.energy):0,elapsed:this.elapsed,timeGoal,timeRemaining:available?Math.max(0,timeGoal-this.elapsed):0,eligible:available&&this.energy+1e-8>=energyGoal&&this.elapsed+1e-8>=timeGoal,fallback:this.elapsed>=C.duration&&i===0&&available,reason:!available?'complete':this.energy+1e-8<energyGoal?'energy':this.elapsed+1e-8<timeGoal?'time':'ready'};}
 get elapsed(){return this.normal.elapsed;}
 event(type,data){if(type==='consume'&&data.entity===this.player){this.energy+=data.gain*C.energyScale;}if(type==='respawn'&&data===this.player)this.health=C.playerHealth;this.onEvent(type,data);}
 update(dt,move,aim={x:1,y:0},assist=true){
  if(this.finished||!['normal','boss'].includes(this.scene))return;
  this.arena.update(dt,move);
  if(this.scene==='normal'){
   const eligible=this.stageStatus.eligible;
   if(eligible||(this.elapsed>=C.duration&&this.attempts===0&&this.limit>0)){this.scene='travel';this.onEvent('travel',{target:'boss'});}
   else if(this.elapsed>=C.duration)this.finish();
  }else this.updateBoss(dt,aim,assist);
 }
 enterBoss(){
  if(this.scene!=='travel'||this.attempts>=this.limit)return false;
  this.attempts++;this.scene='boss';this.bossElapsed=0;this.health=C.playerHealth;
  const saved={...this.normal.player,skills:[...this.normal.player.skills],effects:{...this.normal.player.effects}};
  // A death immediately before the gate must not revive the pre-death body size.
  if(saved.dead){saved.collisionScale=1;}
  this.arena=new Inkstone((type,data)=>this.event(type,data),{duration:3600,autoFinish:false,aiCount:C.specialAI,rewardMultiplier:C.specialReward,reserveGrowth:true,foodTarget:R.bossFoodTarget,foodSpawnRate:R.bossFoodSpawnRate});
  Object.assign(this.arena.player,saved,{x:this.arena.center.x-C.spawnSeparation/2,y:this.arena.center.y,vx:0,vy:0,dead:0,invincible:3});
  this.entryMass=saved.mass;this.entryRadius=saved.r;this.entryInk=saved.ink;this.recoveryClock=0;this.arena.theme='boss';const i=this.attempts-1;this.boss={x:this.arena.center.x+C.spawnSeparation/2,y:this.arena.center.y,vx:0,vy:0,r:C.bossRadius,hp:C.bossHealth[i],maxHp:C.bossHealth[i],appearance:'boss',skinIndex:999,visualTime:0,phase:0,attack:1,hit:0,dead:false};
  this.shots.length=0;this.enemyShots.length=0;this.shotClock=0;return true;
 }
 returnNormal(){if(this.scene!=='reward')return false;const p=this.player;Object.assign(this.normal.player,{growth:p.growth,mass:p.mass,r:p.r,ink:p.ink,skills:[...p.skills],effects:{...p.effects},deaths:p.deaths,swallowed:p.swallowed,aim:{...p.aim},dead:0,invincible:3,vx:0,vy:0});this.arena=this.normal;this.scene='normal';this.shots.length=0;this.enemyShots.length=0;this.boss=null;return true;}
 spawnShot(list,pool,values,limit){if(list.length>=limit)return false;list.push(Object.assign(pool.pop()||{},values));return true;}
 updateBoss(dt,aim,assist){
  const b=this.boss,p=this.player,tier=this.attempts-1;this.bossElapsed+=dt;b.visualTime=this.arena.elapsed;p.hitFlash=Math.max(0,(p.hitFlash||0)-dt);this.recoverInk(dt);b.phase+=dt;b.hit=Math.max(0,b.hit-dt);
  const dx=p.x-b.x,dy=p.y-b.y,n=Math.hypot(dx,dy)||1,speed=C.bossSpeed[tier]*(b.attack<PROJECTILE_BALANCE.attackTelegraph?C.bossWarningSlow:1);
  const radial=clamp((n-(p.r+b.r+C.bossStandoff))/C.bossSteerRange,-C.bossRetreat,1),orbit=Math.sin(b.phase*.75)*C.bossOrbit;b.vx=dx/n*speed*radial-dy/n*orbit;b.vy=dy/n*speed*radial+dx/n*orbit;b.x=clamp(b.x+b.vx*dt,140,GAME_CONFIG.world.width-140);b.y=clamp(b.y+b.vy*dt,140,GAME_CONFIG.world.height-140);
  b.attack-=dt;const warning=b.attack>0&&b.attack<=PROJECTILE_BALANCE.attackTelegraph;if(warning&&!b.warning){b.aimAngle=Math.atan2(dy,dx);b.pattern=b.phase%4<2?'fan':'ring';b.warningSpread=(C.bossBurstCount[tier]-1)/2*C.bossFanSpacing+.08;}b.warning=warning;if(b.attack<=0){b.attack=C.attackIntervals[tier];b.warning=false;const base=b.aimAngle??Math.atan2(dy,dx),count=C.bossBurstCount[tier];for(let i=0;i<count;i++){const a=b.pattern==='fan'?base+(i-(count-1)/2)*C.bossFanSpacing:base+i/count*Math.PI*2;this.spawnShot(this.enemyShots,this.enemyPool,{x:b.x+Math.cos(a)*b.r*.8,y:b.y+Math.sin(a)*b.r*.8,vx:Math.cos(a)*C.enemyBulletSpeed*(1+tier*.08),vy:Math.sin(a)*C.enemyBulletSpeed*(1+tier*.08),age:0,r:9},C.maxEnemyShots);}}
  this.contact=Math.max(0,(this.contact||0)-dt);if(!p.dead&&dist(p,b)<this.arena.radius(p)+coreRadius(b)&&this.contact===0){this.hurt(C.contactDamage);this.contact=C.bossContactInterval;}
  for(const unit of this.arena.entities)this.arena.applySpikes(b,unit,dt);
  this.shotClock-=dt;if(this.shotClock<=0&&!p.dead){this.shotClock=R.shotInterval;const power=this.shotPower;if(p.ink>=power.cost&&this.shots.length<C.maxShots){let direction=assist?{x:b.x-p.x,y:b.y-p.y}:aim;const length=Math.hypot(direction.x,direction.y);direction=length>.01?{x:direction.x/length,y:direction.y/length}:p.aim;this.spawnShot(this.shots,this.shotPool,{x:p.x+direction.x*(p.r+10),y:p.y+direction.y*(p.r+10),vx:direction.x*C.bulletSpeed,vy:direction.y*C.bulletSpeed,age:0,r:power.radius,damage:power.damage,level:power.level,cost:power.cost},C.maxShots);spendReserve(p,power.cost);}}
  for(let i=this.shots.length-1;i>=0;i--){const s=this.shots[i];s.age+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;let hit=dist(s,b)<coreRadius(b)+s.r;if(hit){b.hp=Math.max(0,b.hp-s.damage);b.hit=.14;this.onEvent('impact',{x:s.x,y:s.y,r:20});}else{for(const e of this.arena.entities.slice(1)){if(!e.dead&&dist(s,e)<this.arena.radius(e)+s.r){hit=true;this.onEvent('impact',{x:s.x,y:s.y,r:Math.min(35,e.r*.3+10)});e.mass=Math.max(GAME_CONFIG.respawnRadius**2,e.mass-(s.damage||C.bulletDamage)*C.npcBulletDamage/C.bulletDamage);e.r=Math.sqrt(e.mass);if(e.mass<=GAME_CONFIG.respawnRadius**2)this.arena.kill(e,p);break;}}}if(hit||s.age>C.bulletLife){this.shotPool.push(s);this.shots.splice(i,1);}}
  for(let i=this.enemyShots.length-1;i>=0;i--){const s=this.enemyShots[i];s.age+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;const hit=!p.dead&&dist(s,p)<p.r+s.r;if(hit)this.hurt(C.hitDamage);if(hit||s.age>C.enemyBulletLife){this.enemyPool.push(s);this.enemyShots.splice(i,1);}}
  if(b.hp<=0&&!b.dead){b.dead=true;const bonus=C.bossInkReward*C.specialReward;gainReserve(this.player,bonus);this.wins++;this.scene='reward';this.onEvent('boss-win',{attempt:this.attempts,receipt:`${this.id}:boss:${this.attempts}`,x:b.x,y:b.y});}
  else if(this.bossElapsed>=C.bossTimeLimit){this.scene='reward';this.onEvent('boss-lost',{attempt:this.attempts});}
 }
 recoverInk(dt){this.recoveryClock-=dt;const p=this.player;if(this.recoveryClock>0||p.dead||p.ink>=R.recoveryBelow)return;this.recoveryClock=R.recoveryInterval;let nearby=0;for(const f of this.arena.foods)if(dist(f,p)<R.recoveryRadius)nearby++;if(nearby>=R.recoveryMinimumDots)return;for(let i=0;i<R.recoveryBatch;i++){const a=Math.random()*Math.PI*2,d=R.recoverySpawnNear+Math.random()*(R.recoverySpawnFar-R.recoverySpawnNear),food=createFood({x:clamp(p.x+Math.cos(a)*d,15,GAME_CONFIG.world.width-15),y:clamp(p.y+Math.sin(a)*d,15,GAME_CONFIG.world.height-15)});if(this.arena.foods.length>=this.arena.foodTarget){const far=this.arena.foods.findIndex(f=>dist(f,p)>R.recoveryRadius*2);if(far<0)break;this.arena.foods.splice(far,1);}this.arena.foods.push(food);}}
 hurt(amount){const p=this.player;if(p.invincible||p.effects.water||p.dead)return;this.health=Math.max(0,this.health-amount);p.hitFlash=.24;this.onEvent('player-hurt',{entity:p,health:this.health,damage:amount});p.invincible=C.bossHitProtection;this.onEvent('impact',{x:p.x,y:p.y,r:p.r});if(this.health<=0){p.invincible=0;const killed=this.arena.kill(p,null);if(!killed&&!p.dead)this.health=Math.max(1,C.playerHealth*C.shieldHealthFraction);}}
 finish(){if(this.finished)return this.result;this.finished=true;this.result={...settlement(this.player.ink,this.elapsed,1+this.normal.entities.filter(e=>e!==this.normal.player&&!e.dead&&e.mass>this.player.mass).length,{...GAME_CONFIG,inkstoneDuration:C.duration}),attempts:this.attempts,wins:this.wins};this.onEvent('finish',this.result);return this.result;}
}
