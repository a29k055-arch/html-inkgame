import {Inkstone} from './inkstone.js';
import {CAMPAIGN_CONFIG as C,GAME_CONFIG,clamp,dist,settlement} from './config.js';

// Orchestrates existing arenas; AI/motion/food/collision stay inside Inkstone.
export class Campaign {
 constructor(onEvent=()=>{},id=globalThis.crypto?.randomUUID?.()||String(Date.now()),options={}){
  this.onEvent=onEvent;this.id=id;this.limit=Math.min(C.maxBosses,Math.max(0,options.remaining??3));this.scene='normal';this.energy=0;this.earned=0;this.attempts=0;this.wins=0;this.finished=false;
  this.normal=new Inkstone((type,data)=>this.event(type,data),{duration:C.duration,autoFinish:false});this.arena=this.normal;
  this.shots=[];this.enemyShots=[];this.shotPool=[];this.enemyPool=[];this.shotClock=0;this.boss=null;
 }
 get player(){return this.arena.player;}
 get elapsed(){return this.normal.elapsed;}
 event(type,data){if(type==='consume'&&data.entity===this.player){this.energy+=data.gain*C.energyScale;this.earned+=data.gain;}if(type==='death'&&data===this.player)this.earned*=GAME_CONFIG.deathInkRetention;if(type==='respawn'&&data===this.player)this.health=C.playerHealth;this.onEvent(type,data);}
 update(dt,move,aim={x:1,y:0},assist=true){
  if(this.finished||!['normal','boss'].includes(this.scene))return;
  this.arena.update(dt,move);
  if(this.scene==='normal'){
   const stage=this.attempts,eligible=stage<this.limit&&this.energy>=C.thresholds[stage]&&this.elapsed>=C.earliest[stage];
   if(eligible||(this.elapsed>=C.duration&&this.attempts===0&&this.limit>0)){this.scene='travel';this.onEvent('travel',{target:'boss'});}
   else if(this.elapsed>=C.duration)this.finish();
  }else this.updateBoss(dt,aim,assist);
 }
 enterBoss(){
  if(this.scene!=='travel'||this.attempts>=this.limit)return false;
  this.attempts++;this.scene='boss';this.bossElapsed=0;this.health=C.playerHealth;
  const saved={...this.normal.player,skills:[...this.normal.player.skills],effects:{...this.normal.player.effects}};
  this.arena=new Inkstone((type,data)=>this.event(type,data),{duration:3600,autoFinish:false,aiCount:C.specialAI,rewardMultiplier:C.specialReward});
  Object.assign(this.arena.player,saved,{x:this.arena.center.x-C.spawnSeparation/2,y:this.arena.center.y,vx:0,vy:0,dead:0,invincible:3});
  this.arena.theme='boss';const i=this.attempts-1;this.boss={x:this.arena.center.x+C.spawnSeparation/2,y:this.arena.center.y,vx:0,vy:0,r:C.bossRadius,hp:C.bossHealth[i],maxHp:C.bossHealth[i],phase:0,attack:1,hit:0,dead:false};
  this.shots.length=0;this.enemyShots.length=0;this.shotClock=0;return true;
 }
 returnNormal(){if(this.scene!=='reward')return false;const p=this.player;Object.assign(this.normal.player,{mass:p.dead?GAME_CONFIG.respawnRadius**2:p.mass,r:p.dead?GAME_CONFIG.respawnRadius:p.r,ink:p.ink,skills:[...p.skills],effects:{...p.effects},deaths:p.deaths,swallowed:p.swallowed,aim:{...p.aim},dead:0,invincible:3,vx:0,vy:0});this.arena=this.normal;this.scene='normal';this.shots.length=0;this.enemyShots.length=0;this.boss=null;return true;}
 spawnShot(list,pool,values,limit){if(list.length>=limit)return;list.push(Object.assign(pool.pop()||{},values));}
 updateBoss(dt,aim,assist){
  const b=this.boss,p=this.player,tier=this.attempts-1;this.bossElapsed+=dt;b.phase+=dt;b.hit=Math.max(0,b.hit-dt);
  const dx=p.x-b.x,dy=p.y-b.y,n=Math.hypot(dx,dy)||1,speed=C.bossSpeed[tier];
  b.vx=dx/n*speed+Math.cos(b.phase*1.3)*22;b.vy=dy/n*speed+Math.sin(b.phase*1.1)*22;b.x=clamp(b.x+b.vx*dt,140,GAME_CONFIG.world.width-140);b.y=clamp(b.y+b.vy*dt,140,GAME_CONFIG.world.height-140);
  b.attack-=dt;if(b.attack<=0){b.attack=C.attackIntervals[tier];const base=Math.atan2(dy,dx),count=C.bossBurstCount[tier];for(let i=0;i<count;i++){const a=b.phase%4<2?base+(i-(count-1)/2)*.19:base+i/count*Math.PI*2;this.spawnShot(this.enemyShots,this.enemyPool,{x:b.x,y:b.y,vx:Math.cos(a)*C.enemyBulletSpeed,vy:Math.sin(a)*C.enemyBulletSpeed,age:0,r:9},C.maxEnemyShots);}}
  this.contact=Math.max(0,(this.contact||0)-dt);if(!p.dead&&dist(p,b)<p.r+b.r&&this.contact===0){this.hurt(C.contactDamage);this.contact=C.bossContactInterval;}
  this.shotClock-=dt;if(this.shotClock<=0&&!p.dead){this.shotClock=C.bulletInterval;let direction=assist?{x:b.x-p.x,y:b.y-p.y}:aim;const length=Math.hypot(direction.x,direction.y);direction=length>.01?{x:direction.x/length,y:direction.y/length}:p.aim;this.spawnShot(this.shots,this.shotPool,{x:p.x+direction.x*(p.r+10),y:p.y+direction.y*(p.r+10),vx:direction.x*C.bulletSpeed,vy:direction.y*C.bulletSpeed,age:0,r:6},C.maxShots);}
  for(let i=this.shots.length-1;i>=0;i--){const s=this.shots[i];s.age+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;let hit=dist(s,b)<b.r+s.r;if(hit){b.hp=Math.max(0,b.hp-C.bulletDamage);b.hit=.14;this.onEvent('impact',{x:s.x,y:s.y,r:20});}else{for(const e of this.arena.entities.slice(1)){if(!e.dead&&dist(s,e)<e.r+s.r){hit=true;this.onEvent('impact',{x:s.x,y:s.y,r:Math.min(35,e.r*.3+10)});e.mass=Math.max(GAME_CONFIG.respawnRadius**2,e.mass-C.npcBulletDamage);e.r=Math.sqrt(e.mass);if(e.mass<=GAME_CONFIG.respawnRadius**2)this.arena.kill(e,p);break;}}}if(hit||s.age>C.bulletLife){this.shotPool.push(s);this.shots.splice(i,1);}}
  for(let i=this.enemyShots.length-1;i>=0;i--){const s=this.enemyShots[i];s.age+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;const hit=!p.dead&&dist(s,p)<p.r+s.r;if(hit)this.hurt(C.hitDamage);if(hit||s.age>C.enemyBulletLife){this.enemyPool.push(s);this.enemyShots.splice(i,1);}}
  if(b.hp<=0&&!b.dead){b.dead=true;const bonus=C.bossInkReward*C.specialReward;this.earned+=bonus;this.player.ink+=bonus;this.wins++;this.scene='reward';this.onEvent('boss-win',{attempt:this.attempts,receipt:`${this.id}:boss:${this.attempts}`,x:b.x,y:b.y});}
  else if(this.bossElapsed>=C.bossTimeLimit){this.scene='reward';this.onEvent('boss-lost',{attempt:this.attempts});}
 }
 hurt(amount){const p=this.player;if(p.invincible||p.effects.water||p.dead)return;this.health=Math.max(0,this.health-amount);p.invincible=C.bossHitProtection;this.onEvent('impact',{x:p.x,y:p.y,r:p.r});if(this.health<=0){p.invincible=0;const killed=this.arena.kill(p,null);if(!killed&&!p.dead)this.health=Math.max(1,C.playerHealth*C.shieldHealthFraction);}}
 finish(){if(this.finished)return this.result;this.finished=true;this.result={...settlement(this.earned,this.elapsed,1+this.normal.entities.filter(e=>e!==this.normal.player&&!e.dead&&e.mass>this.player.mass).length,{...GAME_CONFIG,inkstoneDuration:C.duration}),attempts:this.attempts,wins:this.wins};this.onEvent('finish',this.result);return this.result;}
}
