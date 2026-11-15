import {pondCollisionRadius} from './pond-rules.js';
// V4 nursery and spawn choices only. Existing entities, AI personalities and collisions
// are never rewritten when the player's view stage changes.
const frozenBands=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));
export const GROWTH_ECOLOGY_CONFIG=Object.freeze({
 nearSmallCount:9,nearSmallMin:100,nearSmallMax:420,closeSmallCount:3,closeSmallMax:190,
 initialBands:frozenBands([[.60,5.5,12],[.90,17,28],[1,45,80]]),
 microBands:frozenBands([[.62,5.5,12],[.90,17,28],[1,45,80]]),
 flowingBands:frozenBands([[.35,13,25],[.80,28,50],[1,55,90]]),
 gatheringBands:frozenBands([[.30,26,48],[.75,50,78],[1,90,135]]),
 paintingBands:frozenBands([[.25,35,65],[.75,70,100],[1,110,145]]),
 nurseryFoodCount:48,nurseryFoodMin:30,nurseryFoodRadius:300,
 mediumSpawnMin:420,largeSpawnMin:680,spawnAttempts:90,unitGap:22,leafGap:2,
 recoveryPreyMin:5.5,recoveryPreyLowScale:.50,recoveryPreyHighScale:.82
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
export class GrowthEcology {
 constructor(stage=()=>1,config={},rng=Math.random){this.stage=stage;this.config={...GROWTH_ECOLOGY_CONFIG,...config};this.rng=rng;this.seeded=new WeakSet();}
 band(rows,roll){return rows.find(row=>roll<row[0])||rows.at(-1);}
 spawn(arena,index=0,{respawn=false,entity=null}={}){
  const c=this.config,phase=this.stage(),count=Math.max(1,arena.entities?.length-1||arena.aiCount||22);
  // Initial quantiles prevent a bad roll from replacing the whole nursery with threats.
  const rows=respawn?(phase>=4?c.paintingBands:phase>=3?c.gatheringBands:phase>=2?c.flowingBands:c.microBands):c.initialBands;
  const roll=respawn?this.rng():clamp((index+.5)/Math.max(count,22),0,.999999);
  const [limit,bandLo,bandHi]=this.band(rows,roll),p=arena.player,w=arena.world;
  const small=limit<=rows[0][0],medium=!small&&limit<=rows[1][0],near=!respawn&&small&&index<c.nearSmallCount;
  // Stage discovery remains latched after death. Only newly born small prey adapt
  // if the recovering player's base body cannot eat the normal lower prey band.
  // Existing units and larger threats stay unchanged; a temporary turtle cannot
  // inflate the recovery nursery or upgrade its rewards.
  const baseRadius=p.growth?.baseRadius||p.r,recover=respawn&&small&&phase>1&&baseRadius<bandLo*1.06;
  const lo=recover?Math.max(c.recoveryPreyMin,baseRadius*c.recoveryPreyLowScale):bandLo;
  const hi=recover?Math.max(lo,baseRadius*c.recoveryPreyHighScale):bandHi,radius=mix(lo,hi,this.rng());
  const min=near?c.nearSmallMin:small?(respawn?180:300):medium?c.mediumSpawnMin:c.largeSpawnMin;
  const max=near?(index<c.closeSmallCount?c.closeSmallMax:c.nearSmallMax):small?900:medium?1250:Math.hypot(w.width,w.height)*.55;
  const margin=radius+3,playerClearance=Math.max(min,p.r+radius+(small?35:140));
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
