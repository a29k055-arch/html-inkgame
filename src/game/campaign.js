import {projectileContact,spikeDamage} from './projectile-geometry.js';
import {useActive} from './active-items.js';
import {bossTelegraph} from './boss-attacks.js';
import {talentValue,blockHit} from './talents.js';
import {coreRadius} from './alien-geometry.js';
import {reserveShotPower,gainReserve,spendReserve,syncReserve} from './ink-reserve.js';
import {createFood} from './legacy-foundation.js';
import {Inkstone} from './inkstone.js';
import {CAMPAIGN_CONFIG as C,GAME_CONFIG,clamp,dist,settlement,INK_RESERVE_CONFIG as R,BOSS_ATTACK_CONFIG as A,BOSS_MOTION_CONFIG as M,SPIKE_SHOT_CONFIG as S} from './config.js';

// Orchestrates existing arenas; AI/motion/food/collision stay inside Inkstone.
export class Campaign {
 constructor(onEvent=()=>{},id=globalThis.crypto?.randomUUID?.()||String(Date.now()),options={}){
  this.onEvent=onEvent;this.id=id;this.limit=Math.min(C.maxBosses,Math.max(0,options.remaining??3));this.scene='normal';this.activeTime=0;this.energy=0;this.attempts=0;this.wins=0;this.finished=false;
  this.normal=new Inkstone((type,data)=>this.event(type,data),{duration:C.duration,autoFinish:false,reserveGrowth:true,foodTarget:R.normalFoodTarget,foodSpawnRate:R.normalFoodSpawnRate});this.arena=this.normal;
  this.shots=[];this.enemyShots=[];this.shotPool=[];this.enemyPool=[];this.shotClock=0;this.boss=null;
 }
 get player(){return this.arena.player;}
 get shotPower(){const power=reserveShotPower(this.player.ink);return {...power,damage:power.damage*(1+talentValue(this.player,'power')),cost:power.cost*(1-talentValue(this.player,'thrift'))};}
 get stageStatus(){const i=this.attempts,available=i<this.limit,energyGoal=available?C.thresholds[i]:null,timeGoal=available?C.earliest[i]:null;return {scene:this.scene,index:i,attempts:this.attempts,limit:this.limit,energy:this.energy,energyGoal,energyRemaining:available?Math.max(0,energyGoal-this.energy):0,elapsed:this.elapsed,timeGoal,timeRemaining:available?Math.max(0,timeGoal-this.elapsed):0,eligible:available&&this.energy+1e-8>=energyGoal&&this.elapsed+1e-8>=timeGoal,fallback:this.elapsed>=C.duration&&i===0&&available,reason:!available?'complete':this.energy+1e-8<energyGoal?'energy':this.elapsed+1e-8<timeGoal?'time':'ready'};}
 get elapsed(){return this.normal.elapsed;}
 event(type,data){if(type==='consume'&&data.entity===this.player){this.energy+=data.gain*C.energyScale;}this.onEvent(type,data);}
 update(dt,move,aim={x:1,y:0},assist=true){
  if(this.finished||!['normal','boss'].includes(this.scene))return;this.activeTime+=dt;
  this.arena.update(dt,move);
  if(this.scene==='normal'){
   const eligible=this.stageStatus.eligible;
   if(eligible||(this.elapsed>=C.duration&&this.attempts===0&&this.limit>0)){this.scene='travel';this.onEvent('travel',{target:'boss'});}
   else if(this.elapsed>=C.duration)this.finish();
  }else this.updateBoss(dt,aim,assist);
 }
 enterBoss(){
  if(this.scene!=='travel'||this.attempts>=this.limit)return false;
  this.attempts++;this.scene='boss';this.bossElapsed=0;
  const saved={...this.normal.player,skills:[...this.normal.player.skills],effects:{...this.normal.player.effects}};
  // A death immediately before the gate must not revive the pre-death body size.
  if(saved.dead){saved.collisionScale=1;}
  this.arena=new Inkstone((type,data)=>this.event(type,data),{duration:3600,autoFinish:false,aiCount:C.specialAI,rewardMultiplier:C.specialReward,reserveGrowth:true,foodTarget:R.bossFoodTarget,foodSpawnRate:R.bossFoodSpawnRate});
  Object.assign(this.arena.player,saved,{x:this.arena.center.x-C.spawnSeparation/2,y:this.arena.center.y,vx:0,vy:0,dead:0,invincible:3});
  if(this.player.talents?.ward)this.player.wardCharges=Math.max(this.player.wardCharges,talentValue(this.player,'ward'));this.entryMass=saved.mass;this.entryRadius=saved.r;this.entryInk=saved.ink;this.recoveryClock=0;this.arena.theme='boss';const i=this.attempts-1;this.boss={x:this.arena.center.x+C.spawnSeparation/2,y:this.arena.center.y,vx:0,vy:0,r:C.bossRadius,hp:C.bossHealth[i],maxHp:C.bossHealth[i],appearance:'boss',skinIndex:999,visualTime:0,phase:0,attack:1.4,telegraph:A.warningSeconds,attackIndex:0,hit:0,dead:false,motion:'drift',motionClock:M.interval[i]};
  this.shots.length=0;this.enemyShots.length=0;this.shotClock=0;return true;
 }
 returnNormal(){if(this.scene!=='reward')return false;const p=this.player;Object.assign(this.normal.player,{talents:p.talents,choices:p.choices,wardCharges:p.wardCharges,itemsHeld:p.itemsHeld,itemUse:p.itemUse,growth:p.growth,mass:p.mass,r:p.r,ink:p.ink,skills:[...p.skills],effects:{...p.effects},deaths:p.deaths,swallowed:p.swallowed,aim:{...p.aim},dead:0,invincible:3,vx:0,vy:0});this.arena=this.normal;this.scene='normal';this.shots.length=0;this.enemyShots.length=0;this.boss=null;return true;}
 useActive(id=this.player.itemsHeld[0]){if(!['normal','boss'].includes(this.scene)||!useActive(this.player,id))return false;if(id==='veil'){this.shotPool.push(...this.shots);this.shots.length=0;}this.onEvent('active-used',{entity:this.player,id});return true;}
 spawnShot(list,pool,values,limit){if(list.length>=limit)return false;list.push(Object.assign(pool.pop()||{},values));return true;}
 updateBoss(dt,aim,assist){
  const b=this.boss,p=this.player,tier=this.attempts-1;this.bossElapsed+=dt;b.visualTime=this.arena.elapsed;p.hitFlash=Math.max(0,(p.hitFlash||0)-dt);this.recoverInk(dt);b.phase+=dt;b.hit=Math.max(0,b.hit-dt);
  const dx=p.x-b.x,dy=p.y-b.y,n=Math.hypot(dx,dy)||1,speed=C.bossSpeed[tier]*(b.warning?C.bossWarningSlow:1);
  const radial=clamp((n-(p.r+b.r+C.bossStandoff))/C.bossSteerRange,-C.bossRetreat,1),orbit=Math.sin(b.phase*.75)*C.bossOrbit;b.vx=dx/n*speed*radial-dy/n*orbit;b.vy=dy/n*speed*radial+dx/n*orbit;this.moveBoss(dt,tier);b.x=clamp(b.x+b.vx*dt,140,GAME_CONFIG.world.width-140);b.y=clamp(b.y+b.vy*dt,140,GAME_CONFIG.world.height-140);
  const canCast=b.motion==='drift'||b.motion==='recover';if(canCast)b.attack-=dt;const wanted=bossTelegraph(p,b,tier,this.arena.speed(p,false),['fan','ring','spike'][b.attackIndex%3]),warning=canCast&&b.attack>0&&b.attack<=(b.warning?b.telegraph:wanted);if(warning&&!b.warning){b.telegraph=wanted;b.attack=Math.max(b.attack,wanted);b.aimAngle=Math.atan2(dy,dx);b.pattern=b.attackIndex%2===0?'fan':'ring';b.warningSpread=(A.fanCount[tier]-1)*A.laneSpread/2+.06;b.gapHalf=Math.max(A.ringGap/2,Math.asin(Math.min(.9,(p.r+30)/Math.max(120,n))));}b.warning=warning;if(b.attack<=0){b.attack=A.intervals[tier];b.warning=false;const base=b.aimAngle??Math.atan2(dy,dx),pattern=b.pattern||'fan';this.fireBossPattern(pattern,base,tier,b.attackIndex*.31);if(pattern==='ring'&&tier>0)b.echo={clock:A.echoDelay,base,phase:b.attackIndex*.31+Math.PI/A.ringCount[tier]};b.attackIndex++;}
  if(b.echo){b.echo.clock-=dt;if(b.echo.clock<=0){this.fireBossPattern('ring',b.echo.base,tier,b.echo.phase,true);b.echo=null;}}
  this.contact=Math.max(0,(this.contact||0)-dt);if(!p.dead&&dist(p,b)<this.arena.radius(p)+coreRadius(b)&&this.contact===0){this.hurt('contact');this.contact=C.bossContactInterval;}
  for(const unit of this.arena.entities)this.arena.applySpikes(b,unit,dt);
  this.shotClock-=dt;if(this.shotClock<=0&&!p.dead&&!p.effects.water){this.shotClock=R.shotInterval/(1+talentValue(p,'tempo'));const power=this.shotPower;if(p.ink>=power.cost+R.shotReserveFloor&&this.shots.length<C.maxShots){let direction=assist?{x:b.x-p.x,y:b.y-p.y}:aim;const length=Math.hypot(direction.x,direction.y);direction=length>.01?{x:direction.x/length,y:direction.y/length}:p.aim;this.spawnShot(this.shots,this.shotPool,{x:p.x+direction.x*(p.r+10),y:p.y+direction.y*(p.r+10),vx:direction.x*C.bulletSpeed,vy:direction.y*C.bulletSpeed,age:0,r:power.radius,damage:power.damage,level:power.level,cost:power.cost,seed:this.shotSerial=(this.shotSerial||0)+1},C.maxShots);spendReserve(p,power.cost);}}
  for(let i=this.shots.length-1;i>=0;i--){const s=this.shots[i];s.age+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;let hit=dist(s,b)<coreRadius(b)+s.r;if(hit){b.hp=Math.max(0,b.hp-s.damage);b.hit=.14;this.onEvent('impact',{x:s.x,y:s.y,r:20});}else{for(const e of this.arena.entities.slice(1)){if(!e.dead&&dist(s,e)<this.arena.radius(e)+s.r){hit=true;this.onEvent('impact',{x:s.x,y:s.y,r:Math.min(35,e.r*.3+10)});e.mass=Math.max(GAME_CONFIG.respawnRadius**2,e.mass-(s.damage||C.bulletDamage)*C.npcBulletDamage/C.bulletDamage);e.r=Math.sqrt(e.mass);if(e.mass<=GAME_CONFIG.respawnRadius**2)this.arena.kill(e,p);break;}}}if(hit||s.age>C.bulletLife){this.shotPool.push(s);this.shots.splice(i,1);}}
  for(let i=this.enemyShots.length-1;i>=0;i--){const s=this.enemyShots[i];s.age+=dt;s.previousX=s.x;s.previousY=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;const coverage=p.dead?0:projectileContact(s,p,this.arena.radius(p)),hit=coverage>0;if(hit&&p.effects.reflect&&!p.effects.water){const dx=b.x-p.x,dy=b.y-p.y,n=Math.hypot(dx,dy)||1;this.spawnShot(this.shots,this.shotPool,{x:p.x,y:p.y,vx:dx/n*C.bulletSpeed,vy:dy/n*C.bulletSpeed,age:0,r:s.r,kind:s.kind,damage:this.shotPower.damage*.8,seed:s.seed},C.maxShots);}else if(hit)this.hurt(s.kind==='spike'?spikeDamage(p.ink,coverage):'shot');if(hit||s.age>C.enemyBulletLife){this.enemyPool.push(s);this.enemyShots.splice(i,1);}}
  if(b.hp<=0&&!b.dead){b.dead=true;const bonus=C.bossInkReward*C.specialReward;gainReserve(this.player,bonus,true,false);this.wins++;this.scene='reward';this.onEvent('boss-win',{attempt:this.attempts,receipt:`${this.id}:boss:${this.attempts}`,x:b.x,y:b.y});}
  else if(this.bossElapsed>=C.bossTimeLimit){this.scene='reward';this.onEvent('boss-lost',{attempt:this.attempts});}
 }
 fireBossPattern(pattern,base,tier,phase=0,echo=false){const b=this.boss,count=pattern==='spike'?S.count[tier]:pattern==='fan'?A.fanCount[tier]:A.ringCount[tier],speed=(pattern==='spike'?S.speed[tier]:pattern==='fan'?A.fanSpeed:A.ringSpeed)*A.speedScale[tier]*(echo?A.echoSpeed:1);for(let i=0;i<count;i++){const a=pattern==='ring'?i/count*Math.PI*2+phase:base+(i-(count-1)/2)*(pattern==='spike'?S.spread:A.laneSpread);if(pattern==='ring'&&Math.abs(Math.atan2(Math.sin(a-base),Math.cos(a-base)))<(b.gapHalf||A.ringGap/2))continue;this.spawnShot(this.enemyShots,this.enemyPool,{x:b.x+Math.cos(a)*b.r*.8,y:b.y+Math.sin(a)*b.r*.8,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,age:0,r:pattern==='spike'?S.radius[tier]:pattern==='fan'?10:8,kind:pattern==='spike'?'spike':'ink',pattern,echo,seed:i+b.attackIndex*13},C.maxEnemyShots);}}
 moveBoss(dt,tier){const b=this.boss,p=this.player;b.motionClock-=dt;if(b.motion==='drift'&&b.motionClock<=0&&!b.warning){b.motion='gather';b.motionClock=M.gather;const n=dist(b,p)||1;b.dashAim={x:(p.x-b.x)/n,y:(p.y-b.y)/n};}else if(b.motionClock<=0){if(b.motion==='gather'){b.motion='burst';b.motionClock=M.burst;}else if(b.motion==='burst'){b.motion='recover';b.motionClock=M.recover;}else if(b.motion==='recover'){b.motion='drift';b.motionClock=M.interval[tier];}}if(b.motion==='burst'){b.vx=b.dashAim.x*M.speed[tier];b.vy=b.dashAim.y*M.speed[tier];}else if(b.motion==='gather'||b.motion==='recover'){b.vx*=b.motion==='gather'?.15:.35;b.vy*=b.motion==='gather'?.15:.35;}}
 recoverInk(dt){this.recoveryClock-=dt;const p=this.player;if(this.recoveryClock>0||p.dead||p.ink>=R.recoveryBelow)return;this.recoveryClock=R.recoveryInterval;let nearby=0;for(const f of this.arena.foods)if(dist(f,p)<R.recoveryRadius)nearby++;if(nearby>=R.recoveryMinimumDots)return;for(let i=0;i<R.recoveryBatch;i++){const a=Math.random()*Math.PI*2,d=R.recoverySpawnNear+Math.random()*(R.recoverySpawnFar-R.recoverySpawnNear),food=createFood({x:clamp(p.x+Math.cos(a)*d,15,GAME_CONFIG.world.width-15),y:clamp(p.y+Math.sin(a)*d,15,GAME_CONFIG.world.height-15)});if(this.arena.foods.length>=this.arena.foodTarget){const far=this.arena.foods.findIndex(f=>dist(f,p)>R.recoveryRadius*2);if(far<0)break;this.arena.foods.splice(far,1);}this.arena.foods.push(food);}}
 hurt(kind='shot'){const p=this.player;if(p.invincible||p.effects.water||p.dead)return 0;if(blockHit(p)){p.invincible=C.bossHitProtection;this.onEvent('shield',p);return 0;}const before=p.ink,contact=kind==='contact',amount=typeof kind==='number'?Math.max(0,kind):Math.min(contact?A.contactCap:A.hitCap,(contact?A.contactFlat:A.hitFlat)+before*(contact?A.contactFraction:A.hitFraction));p.ink=Math.max(0,p.ink-amount);p.growth.damageTaken=(p.growth.damageTaken||0)+Math.min(before,amount);syncReserve(p);p.hitFlash=.30;p.invincible=C.bossHitProtection;this.onEvent('player-hurt',{entity:p,ink:p.ink,damage:Math.min(before,amount)});this.onEvent('impact',{x:p.x,y:p.y,r:p.r*.3});if(p.ink<=0){p.invincible=0;this.arena.kill(p,null);}return Math.min(before,amount);}

 finish(){if(this.finished)return this.result;this.finished=true;this.result={...settlement(this.player.ink,this.elapsed,1+this.normal.entities.filter(e=>e!==this.normal.player&&!e.dead&&e.mass>this.player.mass).length,{...GAME_CONFIG,inkstoneDuration:C.duration}),attempts:this.attempts,wins:this.wins};this.onEvent('finish',this.result);return this.result;}
}
