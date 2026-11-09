// Shared V4 pond objects: original transparent artwork on the map, the same source in HUD.
// Loading is explicit so the home scroll can track real asset readiness.
import {POND_RULES,pondObjectRadius,pondDisplaySize,pondRenderOrder,canEatPondObject} from './pond-rules.js';
const descriptor=(kind,filename)=>Object.freeze({src:new URL('../../assets/pond/'+filename,import.meta.url).href,worldSize:POND_RULES[kind].renderSize});
export const POND_PICKUPS=Object.freeze({
 shield:descriptor('shield','turtle.png'),
 magnet:descriptor('magnet','shrimp.png'),
 speed:descriptor('speed','koi.png'),
 leaf:descriptor('leaf','lotus-leaf-v2.png'),
 flower:descriptor('flower','lotus-flower-v2.png')
});
export const POND_PICKUP_URLS=Object.freeze(Object.fromEntries(Object.entries(POND_PICKUPS).map(([kind,entry])=>[kind,entry.src])));
const images=new Map();
export function pondPickupImage(kind){const entry=POND_PICKUPS[kind];if(!entry)return null;if(!images.has(kind)){const image=new Image();image.decoding='async';image.src=entry.src;images.set(kind,image);}return images.get(kind);}
export async function preloadPondPickups(){await Promise.all(Object.keys(POND_PICKUPS).map(async kind=>{const image=pondPickupImage(kind);await image.decode();if(!image.naturalWidth)throw Error('Pond pickup failed: '+kind);}));}
export function drawPondPickup(c,item){const entry=POND_PICKUPS[item.kind],image=pondPickupImage(item.kind);if(!entry||!image?.complete||!image.naturalWidth)return;const aspect=image.naturalWidth/image.naturalHeight,side=pondDisplaySize(item),w=aspect>=1?side:side*aspect,h=aspect>=1?side/aspect:side;c.save();c.translate(item.x,item.y);c.rotate(Math.sin(item.x*.019+item.y*.013)*.07);c.drawImage(image,-w/2,-h/2,w,h);c.restore();}

// Render eligibility uses the exact gameplay core/radius rule, never screen pixels.
export function pondPickupLayer(item,game){const player=game.player,core=game.radius?game.radius(player):player.r;if(item.kind==='leaf')return core>=pondObjectRadius(item)?'lower':'upper';if(item.kind==='flower'&&item.parentLeafId){const parent=game.items.find(i=>i.kind==='leaf'&&i.id===item.parentLeafId);if(parent&&core<pondObjectRadius(parent))return 'upper';}return canEatPondObject(core,item)?'lower':'upper';}
export const pondPickupExtent=item=>pondDisplaySize(item)*.55+4;
export {pondRenderOrder};
