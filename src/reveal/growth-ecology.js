import {pondCollisionRadius} from './pond-rules.js';
// Four birth layers coexist from the first frame. Slots retain birth tier across deaths;
// feeding can grow every layer to the shared radius ceiling without resetting the world.
const frozenBands=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));
export const GROWTH_ECOLOGY_CONFIG=Object.freeze({
 // Close nursery: prey plus food is deliberately dense around the body.
 nearSmallCount:18,nearSmallMin:62,nearSmallMax:520,closeSmallCount:10,closeSmallMax:210,
 tiers:Object.freeze([[3.5,10,5.5],[18,38,23],[55,100,65],[240,360,260]].map(row=>Object.freeze(row))),
 bandRatios:frozenBands([[.50,.22,.62],[.80,.82,1.15],[.95,1.30,1.70],[1,1.9,2.8]]),
 lethalRatio:1.28,
 // A slice of the prey band becomes passive plankton: tiny, slow, no hunt and no flee.
 drifterChance:.28,drifterLo:.08,drifterHi:.20,
 nurseryFoodCount:40,nurseryFoodMin:22,nurseryFoodRadius:380,
 mediumSpawnMin:440,largeSpawnMin:900,spawnAttempts:120,unitGap:20,leafGap:2,
 giantRadiusCap:420,minRadius:3
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
export class GrowthEcology {
 constructor(stage=()=>1,config={},rng=Math.random){this.stage=stage;this.config={...GROWTH_ECOLOGY_CONFIG,...config};this.rng=rng;this.seeded=new WeakSet();}
 band(rows,roll){return rows.find(row=>roll<row[0])||rows.at(-1);}
 spawn(arena,index=0,{respawn=false,entity=null}={}){
  const c=this.config,p=arena.player,w=arena.world;
  // Birth tier belongs to a slot across deaths; it never limits later feeding or growth.
  const fraction=index/Math.max(1,arena.aiCount||30),ecologyTier=entity?.ecologyTier||(fraction<.60?1:fraction<.80?2:fraction<.90?3:4),band=c.tiers[ecologyTier-1];
  const small=ecologyTier===1,peer=ecologyTier===2,huge=ecologyTier===4;
  const drifter=small&&(respawn?entity?.passive===true:this.rng()<c.drifterChance);
  const radius=clamp(mix(band[0],respawn?band[2]:band[1],this.rng()),c.minRadius,c.giantRadiusCap);
  const near=!respawn&&small&&index<c.nearSmallCount;
  const min=near?c.nearSmallMin:respawn?Math.max(230,p.r+radius+180):small?260:peer?c.mediumSpawnMin:c.largeSpawnMin;
  const max=near?(index<c.closeSmallCount?c.closeSmallMax:c.nearSmallMax):Math.hypot(w.width,w.height)*.75;
  const margin=radius+3,playerClearance=Math.max(min,p.r+radius+(small?30:huge?220:120));
  let best=null,bestScore=-Infinity;
  for(let attempt=0;attempt<c.spawnAttempts;attempt++){
   const angle=(index*2.399963+this.rng()*Math.PI*2),distance=mix(playerClearance,Math.max(playerClearance,max),this.rng());
   const point={x:clamp(p.x+Math.cos(angle)*distance,margin,w.width-margin),y:clamp(p.y+Math.sin(angle)*distance,margin,w.height-margin)};
   let clearance=Math.hypot(point.x-p.x,point.y-p.y)-playerClearance;
   for(const other of arena.entities||[]){if(other===p||other===entity||other.dead)continue;clearance=Math.min(clearance,Math.hypot(point.x-other.x,point.y-other.y)-radius-other.r-c.unitGap);}
   for(const leaf of arena.items||[]){if(leaf.kind==='leaf')clearance=Math.min(clearance,Math.hypot(point.x-leaf.x,point.y-leaf.y)-radius-pondCollisionRadius(leaf)-c.leafGap);}
   if(clearance>bestScore){best=point;bestScore=clearance;}
   if(clearance>=0)return {radius,point,ecologyTier,personality:drifter?'drift':undefined};
  }
  // A crowded corner may have no exact ring solution. Returning the safest valid
  // world point leaves final circular/leaf projection to the existing arena hook.
  return {radius,ecologyTier,point:best||{x:clamp(p.x,margin,w.width-margin),y:clamp(p.y,margin,w.height-margin)},personality:drifter?'drift':undefined};
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
