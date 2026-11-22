import {GAME_CONFIG as C,clamp} from './config.js';
import {inkBalance,spendInk} from '../data/save.js';
// Same world movement contract as inkstone. Projectiles reveal art, never enter fluid physics.
export class PaperWorld {
 constructor(art,world,player){this.art=art;this.world=world;this.player=player;this.elapsed=0;this.initialInk=inkBalance();this.started=false;this.finished=false;this.projectiles=[];this.cooldown=0;this.painting=false;}
 get ink(){return inkBalance();}
 spit(direction){if(this.finished||this.cooldown>0||!spendInk(C.paperSpitCost,true))return false;const p=this.player,n=Math.hypot(direction.x,direction.y)||1,aim=Math.hypot(direction.x,direction.y)>.01?{x:direction.x/n,y:direction.y/n}:p.aim;this.projectiles.push({x:p.x+aim.x*(p.r+10),y:p.y+aim.y*(p.r+10),vx:aim.x*C.paperSpitSpeed,vy:aim.y*C.paperSpitSpeed,age:0,r:C.paperSpitRadius});this.started=true;this.cooldown=C.paperSpitCooldown;return true;}
 update(dt,direction,reveal){const p=this.player;this.elapsed=Math.min(C.paperDuration,this.elapsed+dt);this.cooldown=Math.max(0,this.cooldown-dt);const n=Math.hypot(direction.x,direction.y);if(n>.01){p.aim={x:direction.x/n,y:direction.y/n};this.started=true;}const blend=1-Math.exp(-dt*7);p.vx+=(direction.x*C.paperMoveSpeed-p.vx)*blend;p.vy+=(direction.y*C.paperMoveSpeed-p.vy)*blend;const ox=p.x,oy=p.y;p.x=clamp(p.x+p.vx*dt,p.r,this.world.width-p.r);p.y=clamp(p.y+p.vy*dt,p.r,this.world.height-p.r);const distance=Math.hypot(p.x-ox,p.y-oy),cost=distance*C.paperInkPerUnit;
  const paid=Math.min(cost,inkBalance());this.painting=distance>.02&&paid>0&&spendInk(paid);if(this.painting)reveal(ox,oy,p.x,p.y,C.paperRevealRadius,Math.min(.85,distance/14)*(cost?paid/cost:0));
  for(const ball of this.projectiles){const x=ball.x,y=ball.y;ball.age+=dt;const damping=Math.exp(-dt*1.3);ball.vx*=damping;ball.vy*=damping;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;reveal(x,y,ball.x,ball.y,ball.r*(1+ball.age*.9),.7);}
  this.projectiles=this.projectiles.filter(b=>b.age<C.paperSpitLife&&b.x>0&&b.y>0&&b.x<this.world.width&&b.y<this.world.height);
 }
}
