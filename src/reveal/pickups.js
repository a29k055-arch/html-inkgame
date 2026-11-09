// Shared V4 pond objects: original transparent artwork on the map, the same source in HUD.
// Loading is explicit so the home scroll can track real asset readiness.
const descriptor=(filename,worldSize)=>Object.freeze({src:new URL('../../assets/pond/'+filename,import.meta.url).href,worldSize});
export const POND_PICKUPS=Object.freeze({
 shield:descriptor('turtle.png',60),
 magnet:descriptor('shrimp.png',72),
 speed:descriptor('koi.png',64),
 leaf:descriptor('lotus-leaf.png',70),
 flower:descriptor('lotus-flower.png',64)
});
export const POND_PICKUP_URLS=Object.freeze(Object.fromEntries(Object.entries(POND_PICKUPS).map(([kind,entry])=>[kind,entry.src])));
const images=new Map();
export function pondPickupImage(kind){const entry=POND_PICKUPS[kind];if(!entry)return null;if(!images.has(kind)){const image=new Image();image.decoding='async';image.src=entry.src;images.set(kind,image);}return images.get(kind);}
export async function preloadPondPickups(){await Promise.all(Object.keys(POND_PICKUPS).map(async kind=>{const image=pondPickupImage(kind);await image.decode();if(!image.naturalWidth)throw Error('Pond pickup failed: '+kind);}));}
export function drawPondPickup(c,item){const entry=POND_PICKUPS[item.kind],image=pondPickupImage(item.kind);if(!entry||!image?.complete||!image.naturalWidth)return;const aspect=image.naturalWidth/image.naturalHeight,side=entry.worldSize,w=aspect>=1?side:side*aspect,h=aspect>=1?side/aspect:side;c.save();c.translate(item.x,item.y);c.rotate(Math.sin(item.x*.019+item.y*.013)*.07);c.drawImage(image,-w/2,-h/2,w,h);c.restore();}
