import {GAME_CONFIG} from '../game/config.js';
// World radii are gameplay geometry. renderSize is the complete transparent image size.
export const POND_RULES=Object.freeze({
 magnet:Object.freeze({r:8,renderSize:36,edible:true,layer:0,effect:'magnet'}),
 speed:Object.freeze({r:24,renderSize:78,edible:true,layer:0,effect:'rush'}),
 shield:Object.freeze({r:34,renderSize:90,edible:true,layer:2,effect:'giant'}),
 flower:Object.freeze({r:30,renderSize:95,edible:true,layer:3,effect:'flower'}),
 leaf:Object.freeze({r:108,renderSize:240,edible:false,layer:1,effect:null})
});
export const POND_ANIMALS=Object.freeze(['magnet','speed','shield']);
// Only approved, currently present variants are active. Removed/problem drafts remain
// outside this catalog; one list drives stable appearance, loading and rendering.
export const POND_ART_FILES=Object.freeze(Object.fromEntries(Object.entries({shield:['turtle.png','turtle-v2.png','turtle-v4.png'],magnet:['shrimp.png','shrimp-v2.png','shrimp-v3.png'],speed:['koi.png','koi-v2.png','koi-v3.png'],leaf:['lotus-leaf-v2.png','lotus-leaf-v3.png','lotus-leaf-v5.png'],flower:['lotus-flower-v2.png','lotus-flower-v3.png','lotus-flower-v5.png']}).map(([kind,files])=>[kind,Object.freeze(files)])));
export const POND_CONFIG=Object.freeze({initialLeaves:4,initialAnimals:8,initialFlowersPerLeaf:1,animalInterval:6,animalMax:14,leafRadiusMin:80,leafRadiusMax:225,leafMax:10,leafGap:240,growthLeafGap:120,leafBoundaryClearance:140,leafCoreScale:.18,leafCoreMin:16,leafCoreMax:42,flowerIntervalMin:28,flowerIntervalMax:42,flowersPerLeaf:2,flowerMax:16,flowerGrowthQuota:2,leafGrowthIntervalMin:90,leafGrowthIntervalMax:140,flowerGap:24,newLeafDistanceMin:360,newLeafDistanceMax:700,placementAttempts:90,npcClearance:1,npcLookahead:135,npcRouteHold:1,npcStuckDistance:3,npcStuckWindow:1.5});
export const pondObjectRadius=item=>Math.max(0,Number.isFinite(item?.r)?item.r:POND_RULES[item?.kind]?.r||0);
// Physical stem only: artwork/size gating/layering continue using the full leaf.
export const pondCollisionRadius=(item,config=POND_CONFIG)=>item?.kind==='leaf'?Math.min(config.leafCoreMax,Math.max(config.leafCoreMin,pondObjectRadius(item)*config.leafCoreScale)):0;
export const pondDisplaySize=item=>item?.renderSize||((POND_RULES[item?.kind]?.renderSize||32)*pondObjectRadius(item)/Math.max(1,POND_RULES[item?.kind]?.r||1));
export const pondRenderOrder=item=>POND_RULES[item?.kind]?.layer??1;
export function canEatPondObject(playerCoreRadius,item){const rule=POND_RULES[item?.kind];return !!rule?.edible&&playerCoreRadius>=pondObjectRadius(item)*GAME_CONFIG.consumeRatio;}
export function touchingEdiblePondObject(player,item,playerCoreRadius){return canEatPondObject(playerCoreRadius,item)&&Math.hypot(player.x-item.x,player.y-item.y)<=playerCoreRadius-pondObjectRadius(item)*GAME_CONFIG.consumeOverlap;}

// Stable spawn-time appearance; never reroll on a render frame. Shrimp keep a narrow natural heading.
export function assignPondAppearance(item,rng=Math.random){const count=POND_ART_FILES[item.kind]?.length||1;item.variant=Math.min(count-1,Math.floor(rng()*count));item.angle=item.kind==='leaf'||item.kind==='flower'?0:item.kind==='magnet'?(rng()-.5)*Math.PI*.30:rng()*Math.PI*2;item.flipX=rng()<.5;return item;}
