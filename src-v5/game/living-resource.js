// NPC ink is a real, reproducible resource value. Decorative length or camera
// scale can never make a thin fish secretly inedible.
export const LIVING_INK_DENSITY=Object.freeze({shrimp:1.2,fish:2,turtle:.7,dragon:7});
export function livingInk(e){
 if(e?.growth||e?.controller?.type==='human')return Math.max(0,e.ink||0);
 return Math.max(0,(e?.mass??(e?.r||0)**2)*(LIVING_INK_DENSITY[e?.species]||1));
}
export function syncLivingInk(e){if(e?.species&&!e.growth)e.ink=livingInk(e);return e?.ink||0;}
export const hasInkAdvantage=(predator,prey,ratio=1)=>livingInk(predator)>livingInk(prey)*ratio+1e-7;
