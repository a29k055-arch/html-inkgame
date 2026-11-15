import {reserveRadius} from '../game/ink-reserve.js';
// Two stages only. Ink is the trigger; elapsed time is diagnostic, never a gate.
export const GROWTH_STAGES_CONFIG=Object.freeze({startInk:80,initialRadius:12,sizeMassPerInk:1,expansionInk:1000,microZoom:2.3,microMobileZoom:2.2,microZoomExponent:.10,swimZoom:1.12,swimMobileZoom:1.08,swimZoomExponent:.42,desktopScreenRadius:110,mobileScreenRadius:72,desktopMinZoom:.58,mobileMinZoom:.38,transitionEase:1.05,normalEase:1.8});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class GrowthJourney{
 constructor(config={}){this.config={...GROWTH_STAGES_CONFIG,...config};this.stage=1;this.expandedAt=null;this.transitionAge=Infinity;this.transitions=0;}
 update(player,dt,elapsed){if(this.stage===2)this.transitionAge+=Math.max(0,dt);if(this.stage===1&&!player.dead&&player.ink>=this.config.expansionInk){this.stage=2;this.expandedAt=elapsed;this.transitionAge=0;this.transitions++;return {stage:2,ink:player.ink,elapsed};}return null;}
}
export function growthCameraTarget(player,mobile=false){
 const journey=player.revealJourney,c=journey?.config||GROWTH_STAGES_CONFIG,stage=journey?.stage||1;
 const r=Math.max(c.initialRadius,player.growth?.baseRadius||player.r),thresholdRadius=reserveRadius(c.expansionInk,{sizeMassPerInk:c.sizeMassPerInk});
 if(stage===1)return (mobile?c.microMobileZoom:c.microZoom)*(r/c.initialRadius)**-c.microZoomExponent;
 const zoom=(mobile?c.swimMobileZoom:c.swimZoom)*(Math.max(r,thresholdRadius)/thresholdRadius)**-c.swimZoomExponent;
 return Math.max(mobile?c.mobileMinZoom:c.desktopMinZoom,Math.min(zoom,(mobile?c.mobileScreenRadius:c.desktopScreenRadius)/r));
}
// World dimensions/radii never change. The legacy follow helper remains untouched.
export function followGrowthCamera(old,player,width,height,mobile,dt=0,fresh=false,focus=null,world){
 const floor=Math.max(width/world.width,height/world.height),goal=Math.max(floor,growthCameraTarget(player,mobile));
 const c=player.revealJourney?.config||GROWTH_STAGES_CONFIG,ease=player.revealJourney?.transitionAge<3?c.transitionEase:c.normalEase;
 const scale=Math.max(floor,old.scale+(goal-old.scale)*(fresh?1:1-Math.exp(-Math.max(0,dt)*ease)));
 const blend=fresh?1:1-Math.exp(-Math.max(0,dt)*5),cx=old.x+width/old.scale/2,cy=old.y+height/old.scale/2;
 return {scale,x:clamp(cx+(player.x-cx)*blend-width/scale/2,0,Math.max(0,world.width-width/scale)),y:clamp(cy+(player.y-cy)*blend-height/scale/2,0,Math.max(0,world.height-height/scale))};
}
