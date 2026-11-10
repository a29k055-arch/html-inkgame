// Shared V4 pond objects: original transparent artwork on the map, the same source in HUD.
// Loading is explicit so the home scroll can track real asset readiness.
import {POND_RULES,pondObjectRadius,pondDisplaySize,pondRenderOrder,canEatPondObject} from './pond-rules.js';
const descriptor=(kind,filename)=>Object.freeze({src:new URL('../../assets/pond/'+filename,import.meta.url).href,worldSize:POND_RULES[kind].renderSize});
export const POND_PICKUP_VARIANTS=Object.freeze(Object.fromEntries(Object.entries({shield:['turtle.png','turtle-v2.png','turtle-v3.png'],magnet:['shrimp.png','shrimp-v2.png','shrimp-v3.png'],speed:['koi.png','koi-v2.png','koi-v3.png'],leaf:['lotus-leaf-v2.png','lotus-leaf-v3.png','lotus-leaf-v4.png'],flower:['lotus-flower-v2.png','lotus-flower-v3.png','lotus-flower-v4.png']}).map(([kind,files])=>[kind,Object.freeze(files.map(file=>descriptor(kind,file)))])));
export const POND_PICKUPS=Object.freeze(Object.fromEntries(Object.entries(POND_PICKUP_VARIANTS).map(([kind,entries])=>[kind,entries[0]])));
export const POND_PICKUP_URLS=Object.freeze(Object.fromEntries(Object.entries(POND_PICKUPS).map(([kind,entry])=>[kind,entry.src])));
const images=new Map();
export function pondPickupImage(kind,variant=0){const entries=POND_PICKUP_VARIANTS[kind],index=((variant|0)%3+3)%3,entry=entries?.[index];if(!entry)return null;const key=kind+':'+index;if(!images.has(key)){const image=new Image();image.decoding='async';image.src=entry.src;images.set(key,image);}return images.get(key);}
export async function preloadPondPickups(){await Promise.all(Object.keys(POND_PICKUPS).flatMap(kind=>[0,1,2].map(async variant=>{const image=pondPickupImage(kind,variant);await image.decode();if(!image.naturalWidth)throw Error('Pond pickup failed: '+kind+variant);})));
}
export function drawPondPickup(c,item){const image=pondPickupImage(item.kind,item.variant);if(!image?.complete||!image.naturalWidth)return;const aspect=image.naturalWidth/image.naturalHeight,side=pondDisplaySize(item),w=aspect>=1?side:side*aspect,h=aspect>=1?side/aspect:side;c.save();c.translate(item.x,item.y);c.rotate((item.angle||0)+Math.sin((item.age||0)*.6+item.x*.019+item.y*.013)*(item.kind==='magnet'?.018:.025));c.drawImage(image,-w/2,-h/2,w,h);c.restore();}

// Render eligibility uses the exact gameplay core/radius rule, never screen pixels.
export function pondPickupLayer(item,game){const player=game.player,core=game.radius?game.radius(player):player.r;if(item.kind==='flower')return 'top';if(item.kind==='leaf')return core>=pondObjectRadius(item)?'lower':'upper';if(item.kind==='shield'&&game.items.some(leaf=>leaf.kind==='leaf'&&core<pondObjectRadius(leaf)&&Math.hypot(item.x-leaf.x,item.y-leaf.y)<(pondDisplaySize(item)+pondDisplaySize(leaf))*.5))return 'upper';return canEatPondObject(core,item)?'lower':'upper';}
export const pondPickupExtent=item=>pondDisplaySize(item)*.55+4;
export {pondRenderOrder};
