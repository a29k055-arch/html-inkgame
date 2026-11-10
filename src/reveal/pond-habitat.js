import {POND_RULES,POND_CONFIG,POND_ANIMALS,pondObjectRadius,pondDisplaySize,assignPondAppearance} from './pond-rules.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),random=(a,b)=>a+Math.random()*(b-a);
// The habitat owns only lifecycle and NPC solid-circle hooks; it never reads a renderer.
export class PondHabitat {
 constructor(arena,options={}){this.arena=arena;this.config={...POND_CONFIG,...options};this.serial=0;this.animalClock=this.config.animalInterval;this.growthClock=random(this.config.leafGrowthIntervalMin,this.config.leafGrowthIntervalMax);this.stats={flowersExpired:0,leavesGrown:0,npcProjections:0};arena.staticConstraint=(e,r)=>this.constrainNpc(e,r);arena.staticDirection=(e,v)=>this.steerNpc(e,v);arena.isPointBlockedForNpc=(point,e)=>this.leaves.some(l=>Math.hypot(point.x-l.x,point.y-l.y)<pondObjectRadius(l)+arena.radius(e));for(let i=0;i<this.config.initialLeaves;i++){const leaf=this.spawnLeaf();if(leaf)for(let j=0;j<this.config.initialFlowersPerLeaf;j++)this.spawnFlower(leaf);}for(let i=0;i<this.config.initialAnimals;i++)this.spawnAnimal(POND_ANIMALS[i%POND_ANIMALS.length]);for(const e of arena.entities)if(e!==arena.player)arena.constrain(e);}
 get leaves(){const items=this.arena.items;if(this._items!==items||this._itemCount!==items.length){this._items=items;this._itemCount=items.length;this._leaves=items.filter(i=>i.kind==='leaf');}return this._leaves;}
 count(kind){return this.arena.items.filter(i=>i.kind===kind).length;}
 object(kind,x,y,r=POND_RULES[kind].r){const item=assignPondAppearance({id:'pond-'+(++this.serial),kind,x,y,r,age:0});item.renderSize=pondDisplaySize(item);return item;}
 spawnAnimal(kind=POND_ANIMALS[Math.floor(Math.random()*POND_ANIMALS.length)]){if(!POND_ANIMALS.includes(kind)||this.arena.items.filter(i=>POND_ANIMALS.includes(i.kind)).length>=this.config.animalMax)return null;const p=this.arena.spawnPoint(45),r=POND_RULES[kind].r,item=this.object(kind,clamp(p.x,r,this.arena.world.width-r),clamp(p.y,r,this.arena.world.height-r));this.arena.items.push(item);return item;}
 spawnLeaf(origin=null){const c=this.config,g=this.arena;if(this.count('leaf')>=c.leafMax)return null;const r=random(c.leafRadiusMin,c.leafRadiusMax),margin=r+c.leafBoundaryClearance;if(g.world.width<margin*2||g.world.height<margin*2)return null;for(let i=0;i<c.placementAttempts;i++){let x,y;if(origin){const a=random(0,Math.PI*2),d=random(c.newLeafDistanceMin,c.newLeafDistanceMax);x=origin.x+Math.cos(a)*d;y=origin.y+Math.sin(a)*d;}else{x=random(margin,g.world.width-margin);y=random(margin,g.world.height-margin);}if(x<margin||x>g.world.width-margin||y<margin||y>g.world.height-margin)continue;if(this.leaves.some(l=>Math.hypot(x-l.x,y-l.y)<r+pondObjectRadius(l)+(origin?c.growthLeafGap:c.leafGap)))continue;const leaf=this.object('leaf',x,y,r);leaf.flowerClock=random(c.flowerIntervalMin,c.flowerIntervalMax);g.items.push(leaf);this._itemCount=-1;if(origin)this.stats.leavesGrown++;for(const e of g.entities)if(e!==g.player&&!e.dead)g.constrain(e);return leaf;}return null;}
 spawnFlower(parent=this.leaves[Math.floor(Math.random()*this.leaves.length)]){const c=this.config,g=this.arena;if(!parent||this.count('flower')>=c.flowerMax||g.items.filter(i=>i.kind==='flower'&&i.parentLeafId===parent.id).length>=c.flowersPerLeaf)return null;const r=POND_RULES.flower.r;for(let i=0;i<c.placementAttempts;i++){const a=random(0,Math.PI*2),d=pondObjectRadius(parent)+r*.65,x=parent.x+Math.cos(a)*d,y=parent.y+Math.sin(a)*d;if(x<r||x>g.world.width-r||y<r||y>g.world.height-r)continue;if(g.items.some(o=>o.kind==='flower'&&Math.hypot(x-o.x,y-o.y)<r+pondObjectRadius(o)+c.flowerGap))continue;const flower=this.object('flower',x,y);flower.parentLeafId=parent.id;parent.flowersProduced=(parent.flowersProduced||0)+1;g.items.push(flower);return flower;}return null;}
 spawn(kind){if(kind==='leaf')return this.spawnLeaf();if(kind==='flower')return this.spawnFlower();return this.spawnAnimal(kind);}
 update(dt){
  if(!(dt>0))return;const c=this.config,g=this.arena;
  // Flowers are persistent scene objects. Population limits stop new births, never delete old blooms.
  for(const item of g.items)item.age=(item.age||0)+dt;
  for(const leaf of this.leaves){
   leaf.flowerClock=(leaf.flowerClock??random(c.flowerIntervalMin,c.flowerIntervalMax))-dt;
   if(leaf.flowerClock<=0){leaf.flowerClock=random(c.flowerIntervalMin,c.flowerIntervalMax);this.spawnFlower(leaf);}
  }
  this.growthClock-=dt;
  if(this.growthClock<=0){
   this.growthClock=random(c.leafGrowthIntervalMin,c.leafGrowthIntervalMax);
   const eligible=this.leaves.filter(l=>(l.flowersProduced||0)>=c.flowerGrowthQuota);
   if(eligible.length){const parent=eligible[Math.floor(Math.random()*eligible.length)];if(this.spawnLeaf(parent))parent.flowersProduced=0;}
  }
  this.animalClock-=dt;if(this.animalClock<=0){this.animalClock=c.animalInterval;this.spawnAnimal();}
 }

 valid(x,y,r,leaves){const w=this.arena.world;return x>=r&&x<=w.width-r&&y>=r&&y<=w.height-r&&leaves.every(l=>Math.hypot(x-l.x,y-l.y)>=r+pondObjectRadius(l)+this.config.npcClearance-.001);}
 constrainNpc(e,r){const leaves=this.leaves,overlap=leaves.find(l=>Math.hypot(e.x-l.x,e.y-l.y)<r+pondObjectRadius(l)+this.config.npcClearance);if(!overlap)return;const original={x:e.x,y:e.y},minimum=r+pondObjectRadius(overlap)+this.config.npcClearance,base=Math.atan2(e.y-overlap.y,e.x-overlap.x);let best=e.pondSafe&&this.valid(e.pondSafe.x,e.pondSafe.y,r,leaves)?{...e.pondSafe}:null,cost=best?Math.hypot(best.x-original.x,best.y-original.y):Infinity;for(let i=0;i<48;i++){const offset=i===0?0:Math.ceil(i/2)*(i%2?1:-1)*Math.PI/24,a=base+offset,x=overlap.x+Math.cos(a)*minimum,y=overlap.y+Math.sin(a)*minimum;if(!this.valid(x,y,r,leaves))continue;const distance=Math.hypot(x-original.x,y-original.y);if(distance<cost){cost=distance;best={x,y};}}if(!best){const w=this.arena.world;for(let y=r;y<=w.height-r;y+=Math.max(30,(w.height-2*r)/16))for(let x=r;x<=w.width-r;x+=Math.max(30,(w.width-2*r)/24)){if(!this.valid(x,y,r,leaves))continue;const distance=Math.hypot(x-original.x,y-original.y);if(distance<cost){cost=distance;best={x,y};}}}if(!best)return;e.x=best.x;e.y=best.y;for(const leaf of leaves){const dx=e.x-leaf.x,dy=e.y-leaf.y,d=Math.hypot(dx,dy)||1;if(d>r+pondObjectRadius(leaf)+3)continue;const nx=dx/d,ny=dy/d,inward=e.vx*nx+e.vy*ny;if(inward<0){e.vx-=nx*inward;e.vy-=ny*inward;}}e.controller.blockedTime=0;this.stats.npcProjections++;}
 // Check the whole short corridor, not just the endpoint or one leaf at a time.
 routeClear(e,x,y,distance){
  const r=this.arena.radius(e),w=this.arena.world,ex=e.x+x*distance,ey=e.y+y*distance;
  if(ex<r||ey<r||ex>w.width-r||ey>w.height-r)return false;
  for(const leaf of this.leaves){
   const dx=leaf.x-e.x,dy=leaf.y-e.y,t=clamp((dx*x+dy*y)/distance,0,1),cx=e.x+x*distance*t,cy=e.y+y*distance*t;
   if(Math.hypot(cx-leaf.x,cy-leaf.y)<r+pondObjectRadius(leaf)+this.config.npcClearance-.02)return false;
  }
  return true;
 }
 steerNpc(e,v){
  const g=this.arena,c=this.config,r=g.radius(e),now=g.elapsed||0,length=Math.hypot(v.x,v.y);
  if(length<.001)return v;
  const desired={x:v.x/length,y:v.y/length},look=c.npcLookahead;if(!this.leaves.some(l=>Math.hypot(e.x-l.x,e.y-l.y)<r+pondObjectRadius(l)+look+1)){delete e.pondRoute;return v;}
  if(e.pondRoute&&Math.hypot(e.x-e.pondRoute.anchorX,e.y-e.pondRoute.anchorY)>look+r*2)delete e.pondRoute;
  if(this.valid(e.x,e.y,r,this.leaves))e.pondSafe={x:e.x,y:e.y};
  if(this.routeClear(e,desired.x,desired.y,look)){delete e.pondRoute;return v;}
  let route=e.pondRoute;
  if(!route){const seed=[...String(e.id)].reduce((s,ch)=>s+ch.charCodeAt(0),0);route=e.pondRoute={side:seed%2?1:-1,anchorX:e.x,anchorY:e.y,checkX:e.x,checkY:e.y,checkAt:now,x:desired.x,y:desired.y,holdUntil:0};}
  if(now<route.holdUntil){e.vx=0;e.vy=0;return {x:0,y:0};}
  if(now-route.checkAt>=c.npcStuckWindow){
   const moved=Math.hypot(e.x-route.checkX,e.y-route.checkY);route.checkX=e.x;route.checkY=e.y;route.checkAt=now;
   if(moved<c.npcStuckDistance){route.holdUntil=now+c.npcRouteHold;e.vx=0;e.vy=0;return {x:0,y:0};}
  }
  const heading=Math.atan2(desired.y,desired.x);let best=null,bestScore=-Infinity;
  for(const offset of [0,.24,-.24,.5,-.5,.8,-.8,1.1,-1.1,1.4,-1.4,1.8,-1.8,2.3,-2.3,Math.PI]){
   const a=heading+offset,x=Math.cos(a),y=Math.sin(a);
   if(!this.routeClear(e,x,y,look))continue;
   let clearance=look;
   for(const leaf of this.leaves)clearance=Math.min(clearance,Math.hypot(e.x+x*look-leaf.x,e.y+y*look-leaf.y)-r-pondObjectRadius(leaf));
   const continuity=x*route.x+y*route.y,side=offset===0?0:Math.sign(offset)===route.side?.24:-.24;
   const score=(x*desired.x+y*desired.y)*1.8+continuity*.9+clamp(clearance/look,0,1)*.35+side;
   if(score>bestScore){bestScore=score;best={x,y};}
  }
  if(!best){route.holdUntil=now+c.npcRouteHold;e.vx=0;e.vy=0;return {x:0,y:0};}
  route.x=best.x;route.y=best.y;return best;
 }
}
