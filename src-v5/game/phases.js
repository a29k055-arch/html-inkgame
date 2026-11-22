export const phaseOf=world=>world.theme==='boss'?'clash':'grind';
export const factionOf=e=>e.controller?.type==='human'||e.id==='human'?'player':'enemy';
export const canSwallow=(world,a,b)=>a!==b&&(phaseOf(world)==='grind'||factionOf(a)!==factionOf(b));
export const canShoot=world=>phaseOf(world)==='clash';
export const canDamage=(world,team,target)=>canShoot(world)&&team!==factionOf(target);
