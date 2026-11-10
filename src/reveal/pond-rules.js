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
export const POND_CONFIG=Object.freeze({initialLeaves:4,initialAnimals:8,initialFlowersPerLeaf:1,animalInterval:6,animalMax:14,leafRadiusMin:95,leafRadiusMax:120,leafMax:10,leafGap:340,growthLeafGap:130,leafBoundaryClearance:310,flowerIntervalMin:28,flowerIntervalMax:42,flowersPerLeaf:2,flowerMax:16,flowerGrowthQuota:2,leafGrowthIntervalMin:90,leafGrowthIntervalMax:140,flowerGap:24,newLeafDistanceMin:240,newLeafDistanceMax:480,placementAttempts:90,npcClearance:1,npcLookahead:135,npcRouteHold:1,npcStuckDistance:3,npcStuckWindow:1.5});
export const pondObjectRadius=item=>Math.max(0,Number.isFinite(item?.r)?item.r:POND_RULES[item?.kind]?.r||0);
export const pondDisplaySize=item=>item?.renderSize||((POND_RULES[item?.kind]?.renderSize||32)*pondObjectRadius(item)/Math.max(1,POND_RULES[item?.kind]?.r||1));
export const pondRenderOrder=item=>POND_RULES[item?.kind]?.layer??1;
export function canEatPondObject(playerCoreRadius,item){const rule=POND_RULES[item?.kind];return !!rule?.edible&&playerCoreRadius>=pondObjectRadius(item)*GAME_CONFIG.consumeRatio;}
export function touchingEdiblePondObject(player,item,playerCoreRadius){return canEatPondObject(playerCoreRadius,item)&&Math.hypot(player.x-item.x,player.y-item.y)<=playerCoreRadius-pondObjectRadius(item)*GAME_CONFIG.consumeOverlap;}

// Stable spawn-time appearance; never reroll on a render frame. Shrimp keep a narrow natural heading.
export function assignPondAppearance(item,rng=Math.random){item.variant=Math.min(2,Math.floor(rng()*3));item.angle=item.kind==='magnet'?(rng()-.5)*.56:rng()*Math.PI*2;return item;}
