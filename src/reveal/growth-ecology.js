import {pondCollisionRadius} from './pond-rules.js';
// Spawn weights only. Existing entities, AI personalities and collisions are never rewritten,
// so the world stays one continuous ecology across growth.
//
// Bands are measured against the PLAYER'S CURRENT RADIUS, not a stage constant:
//   50% clearly smaller  -> food that keeps growth moving
//   30% about the same   -> rivals that can be raced or eaten
//   15% noticeably bigger-> the reference target for the next stage
//    5% far bigger       -> landmarks you route around
// Anything at or above lethalRatio can swallow the player, so the 30% band stops just below it.
const frozenBands=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));
export const GROWTH_ECOLOGY_CONFIG=Object.freeze({
 // Close nursery: prey plus food is deliberately dense around the body.
 nearSmallCount:22,nearSmallMin:80,nearSmallMax:520,closeSmallCount:10,closeSmallMax:220,
 bandRatios:frozenBands([[.50,.22,.62],[.80,.82,1.15],[.95,1.30,1.70],[1,1.9,2.8]]),
 lethalRatio:1.28,
 nurseryFoodCount:40,nurseryFoodMin:22,nurseryFoodRadius:380,
 mediumSpawnMin:440,largeSpawnMin:900,spawnAttempts:90,unitGap:20,leafGap:2,
 giantRadiusCap:280,minRadius:3
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
export class GrowthEcology {
 constructor(stage=()=>1,config={},rng=Math.random){this.stage=stage;this.config={...GROWTH_ECOLOGY_CONFIG,...config};this.rng=rng;this.seeded=new WeakSet();}
 band(rows,roll){return rows.find(row=>roll<row[0])||rows.at(-1);}
 spawn(arena,index=0,{respawn=false,entity=null}={}){
  const c=this.config,p=arena.player,w=arena.world;
  // The reference is the body radius WITHOUT item inflation, so a temporary turtle cannot
  // change the ecology the player is actually matched against.
  const base=Math.max(c.minRadius,p.growth?.baseRadius||p.r);
  const rows=c.bandRatios,row=this.band(rows,this.rng());
  const small=row===rows[0],peer=row===rows[1],huge=row===rows[3];
  const radius=clamp(mix(row[1]*base,row[2]*base,this.rng()),c.minRadius,c.giantRadiusCap);
  const near=!respawn&&small&&index<c.nearSmallCount;
  const min=near?c.nearSmallMin:small?(respawn?140:260):peer?c.mediumSpawnMin:c.largeSpawnMin;
  const max=near?(index<c.closeSmallCount?c.closeSmallMax:c.nearSmallMax):small?900:peer?1250:Math.hypot(w.width,w.height)*.55;
  const margin=radius+3,playerClearance=Math.max(min,p.r+radius+(small?30:huge?220:120));
  let best=null,bestScore=-Infinity;
  for(let attempt=0;attempt<c.spawnAttempts;attempt++){
   const angle=(index*2.399963+this.rng()*Math.PI*2),distance=mix(playerClearance,Math.max(playerClearance,max),this.rng());
   const point={x:clamp(p.x+Math.cos(angle)*distance,margin,w.width-margin),y:clamp(p.y+Math.sin(angle)*distance,margin,w.height-margin)};
   let clearance=Math.hypot(point.x-p.x,point.y-p.y)-playerClearance;
   for(const other of arena.entities||[]){if(other===p||other===entity||other.dead)continue;clearance=Math.min(clearance,Math.hypot(point.x-other.x,point.y-other.y)-radius-other.r-c.unitGap);}
   for(const leaf of arena.items||[]){if(leaf.kind==='leaf')clearance=Math.min(clearance,Math.hypot(point.x-leaf.x,point.y-leaf.y)-radius-pondCollisionRadius(leaf)-c.leafGap);}
   if(clearance>bestScore){best=point;bestScore=clearance;}
   if(clearance>=0)return {radius,point};
  }
  // A crowded corner may have no exact ring solution. Returning the safest valid
  // world point leaves final circular/leaf projection to the existing arena hook.
  return {radius,point:best||{x:clamp(p.x,margin,w.width-margin),y:clamp(p.y,margin,w.height-margin)}};
 }
 seedFood(arena){
  if(this.seeded.has(arena))return 0;this.seeded.add(arena);
  const c=this.config,p=arena.player,w=arena.world,foods=arena.foods||[],count=Math.min(c.nurseryFoodCount,foods.length);
  for(let i=0;i<count;i++){
   const food=foods[i],angle=this.rng()*Math.PI*2,d=Math.sqrt(mix(c.nurseryFoodMin**2,c.nurseryFoodRadius**2,this.rng()));
   food.x=clamp(p.x+Math.cos(angle)*d,food.r,w.width-food.r);food.y=clamp(p.y+Math.sin(angle)*d,food.r,w.height-food.r);
  }
  return count;
 }
}
