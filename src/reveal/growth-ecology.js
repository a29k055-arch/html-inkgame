import {pondCollisionRadius} from './pond-rules.js';
import {stageEntryRadius} from './growth-stages.js';
// Spawn weights only. Existing entities, AI personalities and collisions are never rewritten
// when the player's view stage changes, so the world is one continuous ecology.
// Bands are expressed as multiples of the stage's ENTRY radius, which is what makes an old
// giant become a normal target (and an old small become a snack) without touching it.
const frozenBands=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));
export const GROWTH_ECOLOGY_CONFIG=Object.freeze({
 nearSmallCount:12,nearSmallMin:110,nearSmallMax:460,closeSmallCount:5,closeSmallMax:200,
 // [cumulative roll, lo, hi] x stage entry radius: prey, peer, threat.
 bandRatios:frozenBands([[.58,.24,.48],[.86,.74,1.10],[1,1.9,3.1]]),
 legacySmallChance:.22,
 nurseryFoodCount:56,nurseryFoodMin:26,nurseryFoodRadius:320,
 mediumSpawnMin:420,largeSpawnMin:680,spawnAttempts:90,unitGap:20,leafGap:2,
 giantRadiusCap:280,recoveryPreyMin:3,recoveryPreyLowScale:.45,recoveryPreyHighScale:.72
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
export class GrowthEcology {
 constructor(stage=()=>1,config={},rng=Math.random){this.stage=stage;this.config={...GROWTH_ECOLOGY_CONFIG,...config};this.rng=rng;this.seeded=new WeakSet();}
 band(rows,roll){return rows.find(row=>roll<row[0])||rows.at(-1);}
 radiusFor(stage,row,entry){const r=mix(row[1]*entry,row[2]*entry,this.rng());return clamp(r,2,this.config.giantRadiusCap);}
 spawn(arena,index=0,{respawn=false,entity=null}={}){
  const c=this.config,phase=this.stage(),count=Math.max(1,arena.entities?.length-1||arena.aiCount||22);
  const rows=c.bandRatios,entry=stageEntryRadius(Math.min(phase,3));
  // Initial quantiles prevent a bad roll from replacing the whole nursery with threats.
  const roll=respawn?this.rng():clamp((index+.5)/Math.max(count,26),0,.999999);
  const row=this.band(rows,roll),p=arena.player,w=arena.world;
  const prey=row===rows[0],peer=row===rows[1];
  // A slice of respawns keep the previous stage's prey band alive, so the old nursery is
  // still visibly swimming around instead of being replaced wholesale.
  const legacy=respawn&&phase>1&&prey&&this.rng()<c.legacySmallChance;
  const radius=legacy?this.radiusFor(phase-1,rows[0],stageEntryRadius(Math.min(phase-1,3))):this.radiusFor(Math.min(phase,3),row,entry);
  const near=!respawn&&prey&&index<c.nearSmallCount;
  // Stage discovery remains latched after death. Only newly born prey adapt if the recovering
  // player's base body cannot eat the normal lower prey band.
  const baseRadius=p.growth?.baseRadius||p.r,recover=respawn&&prey&&!legacy&&baseRadius<radius*1.06;
  const finalRadius=recover?Math.min(radius,Math.max(c.recoveryPreyMin,baseRadius*c.recoveryPreyHighScale)):radius;
  const min=near?c.nearSmallMin:prey?(respawn?180:300):peer?c.mediumSpawnMin:c.largeSpawnMin;
  const max=near?(index<c.closeSmallCount?c.closeSmallMax:c.nearSmallMax):prey?900:peer?1250:Math.hypot(w.width,w.height)*.55;
  const margin=finalRadius+3,playerClearance=Math.max(min,p.r+finalRadius+(prey?35:140));
  let best=null,bestScore=-Infinity;
  for(let attempt=0;attempt<c.spawnAttempts;attempt++){
   const angle=(index*2.399963+this.rng()*Math.PI*2),distance=mix(playerClearance,Math.max(playerClearance,max),this.rng());
   const point={x:clamp(p.x+Math.cos(angle)*distance,margin,w.width-margin),y:clamp(p.y+Math.sin(angle)*distance,margin,w.height-margin)};
   let clearance=Math.hypot(point.x-p.x,point.y-p.y)-playerClearance;
   for(const other of arena.entities||[]){if(other===p||other===entity||other.dead)continue;clearance=Math.min(clearance,Math.hypot(point.x-other.x,point.y-other.y)-finalRadius-other.r-c.unitGap);}
   for(const leaf of arena.items||[]){if(leaf.kind==='leaf')clearance=Math.min(clearance,Math.hypot(point.x-leaf.x,point.y-leaf.y)-finalRadius-pondCollisionRadius(leaf)-c.leafGap);}
   if(clearance>bestScore){best=point;bestScore=clearance;}
   if(clearance>=0)return {radius:finalRadius,point};
  }
  // A crowded corner may have no exact ring solution. Returning the safest valid
  // world point leaves final circular/leaf projection to the existing arena hook.
  return {radius:finalRadius,point:best||{x:clamp(p.x,margin,w.width-margin),y:clamp(p.y,margin,w.height-margin)}};
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
