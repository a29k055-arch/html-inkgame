// Spawn-time tiers: existing map objects never upgrade on a camera transition.
export const MANUAL_RUSH_TIERS=Object.freeze([.30,.50,.70]);
export const ITEM_TIERS=Object.freeze({duration:5,maxDuration:30,sizes:Object.freeze([.50,.82,1.14]),magnet:Object.freeze([1.5,1.75,2]),rush:Object.freeze([.70,1.00,1.30]),giant:Object.freeze([1.30,1.40,1.50])});
const effects={shield:'giant',speed:'rush',magnet:'magnet'};
const tierIndex=value=>Math.max(0,Math.min(2,(Number(value)||1)-1));
export function assignItemTier(item,stage){if(!effects[item.kind])return item;item.tier=Math.min(3,Math.max(1,stage));const factor=ITEM_TIERS.sizes[item.tier-1];item.r*=factor;if(item.renderSize)item.renderSize*=factor;return item;}
export function collectTieredItem(player,item){const effect=effects[item.kind];if(!effect)return false;const active=!!player.effects[effect],index=tierIndex(item.tier);player.pondBuffs??={};const tier=Math.max(index+1,active?(player.pondBuffs[effect]?.tier||1):1);player.pondBuffs[effect]={tier,strength:ITEM_TIERS[effect][tier-1]};player.effects[effect]=Math.min(ITEM_TIERS.maxDuration,Math.max(0,player.effects[effect]||0)+ITEM_TIERS.duration);if(effect==='giant')player.temporarySizeScale=player.pondBuffs.giant.strength;return true;}
export function expireItemTiers(player){for(const effect of Object.keys(player.pondBuffs||{}))if(!player.effects[effect])delete player.pondBuffs[effect];}
