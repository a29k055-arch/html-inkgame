import {pondEntry} from '../game/pond-entry.js';
import {livingSlot} from './living-world.js';
// Small pond species coexist; species bands and unique large slots stay stable across deaths.
const frozenBands=rows=>Object.freeze(rows.map(row=>Object.freeze(row)));
export const GROWTH_ECOLOGY_CONFIG=Object.freeze({
 // Close nursery: prey plus food is deliberately dense around the body.
 nearSmallCount:8,nearSmallMin:110,nearSmallMax:620,closeSmallCount:4,closeSmallMax:300,
 tiers:Object.freeze([[3.5,10,5.5],[18,38,23],[55,100,65],[240,360,260]].map(row=>Object.freeze(row))),
 bandRatios:frozenBands([[.50,.22,.62],[.80,.82,1.15],[.95,1.30,1.70],[1,1.9,2.8]]),
 lethalRatio:1.28,
 // A slice of the prey band becomes passive plankton: tiny, slow, no hunt and no flee.
 drifterChance:.18,drifterLo:.08,drifterHi:.20,
 nurseryFoodCount:40,nurseryFoodMin:22,nurseryFoodRadius:380,
 mediumSpawnMin:440,largeSpawnMin:900,spawnAttempts:120,unitGap:20,leafGap:2,
 giantRadiusCap:88,minRadius:3
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
export class GrowthEcology {
 constructor(stage=()=>1,config={},rng=Math.random){this.stage=stage;this.config={...GROWTH_ECOLOGY_CONFIG,...config};this.rng=rng;this.seeded=new WeakSet();}
 band(rows,roll){return rows.find(row=>roll<row[0])||rows.at(-1);}
 spawn(arena,index=0,{respawn=false,entity=null}={}){
  const c=this.config;
  // A birth slot owns its species band; respawns restart near the lower end.
  const slot=livingSlot(entity?.birthSlot??index),ecologyTier=entity?.ecologyTier||slot.tier,metadata={species:slot.species,rewardKind:slot.rewardKind,rewardGlow:false,rewardTier:Math.min(3,ecologyTier),birthSlot:entity?.birthSlot??index,appearance:'living'};
  const stage=Math.max(1,Math.min(4,this.stage())),bands={shrimp:[[3,4.5],[3.5,6.5],[4,7.5],[5,8]],fish:[[6.5,9],[8,14],[10,18],[12,18]],turtle:[[28,34],[30,42],[34,48],[38,50]]};
  const selected=slot.big?[slot.min,slot.max]:bands[slot.species][stage-1],upper=respawn?Math.min(selected[1],slot.big?slot.low:selected[0]+(selected[1]-selected[0])*.65):selected[1];
  const roll=this.rng()**(stage>=3?.6:1),radius=clamp(mix(selected[0],upper,roll),c.minRadius,c.giantRadiusCap),drifter=slot.species==='shrimp'&&this.rng()<c.drifterChance;
  const entry=pondEntry(arena,slot.species,radius,index,this.rng);
  return {...metadata,...entry,radius,ecologyTier,ecologyStage:stage,personality:drifter?'drift':undefined};
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
