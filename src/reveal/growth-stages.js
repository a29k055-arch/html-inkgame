import {reserveRadius} from '../game/ink-reserve.js';
// One continuous world, four permanent-ink stages. Large rewards queue camera legs;
// temporary turtle ink never advances the journey. Stage 1–3 stay inside the frame.
const thresholds=Object.freeze([846,4200,9000]);
export const GROWTH_STAGES_CONFIG=Object.freeze({
 startInk:17,initialRadius:12,sizeMassPerInk:1,expansionInk:thresholds[0],thresholds,
 // Body radius as a fraction of the viewport short side at stage entry.
 stageScreenRadius:Object.freeze([.050,.058,.075,.098]),
 // How far the camera may slide past the world edge, as a fraction of the viewport.
 // Only stage four may look past the map. Earlier stages clamp hard so the border never shows.
 borderOverscanByStage:Object.freeze([0,0,0,.17]),
 // V4 only: the radius ceiling that lets stage four keep growing instead of freezing.
 maxRadius:280,sizeLinear:.0175,stageTransitionSeconds:2.8,finalViewExpansion:1.1,
 framePadding:.08,transitionEase:1.65,normalEase:2.2
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const permanentGrowthInk=player=>Math.max(0,(player.ink||0)-(player.turtleInk||0));
export const growthStageKey=stage=>['growthMicro','growthFlow','growthGather','growthPainting'][clamp(stage,1,4)-1];
export function growthFrame(width,height,world,config=GROWTH_STAGES_CONFIG){const top=Math.min(124,height*.26),bottom=Math.min(78,height*.16);return {scale:Math.min(width*(1-2*config.framePadding)/world.width,(height-top-bottom)*.94/world.height),offset:(top-bottom)/2};}
// Radius the player owns when a stage begins. Stage 4 starts where stage 3 ends.
export function stageEntryRadius(stage,config=GROWTH_STAGES_CONFIG){return reserveRadius(stage<=1?config.startInk:config.thresholds[stage-2],{sizeMassPerInk:config.sizeMassPerInk,maxRadius:config.maxRadius,sizeLinear:config.sizeLinear,minimumRadius:config.initialRadius});}
export class GrowthJourney{
 constructor(config={}){this.config={...GROWTH_STAGES_CONFIG,...config};this.stage=1;this.targetStage=1;this.expandedAt=null;this.transitionAge=Infinity;this.transitions=0;this.history=[];}
 stageForInk(ink){let stage=1;while(stage<4&&ink>=this.config.thresholds[stage-1])stage++;return stage;}
 update(player,dt,elapsed){this.transitionAge+=Math.max(0,dt);if(player.dead)return null;this.targetStage=Math.max(this.stage,this.stageForInk(permanentGrowthInk(player)));if(this.targetStage<=this.stage||this.transitionAge<this.config.stageTransitionSeconds)return null;
  // Large rewards queue remaining stages; each camera leg has a visible transition.
  this.stage++;this.expandedAt??=elapsed;this.transitionAge=0;this.transitions++;const event={stage:this.stage,targetStage:this.targetStage,ink:permanentGrowthInk(player),elapsed};this.history.push(event);return event;}

 // Called on respawn only: the stage is re-derived from the ink actually retained, so a death
 // can hand back a smaller stage (and a closer camera) without ever touching the world.
 recalculate(player){const next=this.stageForInk(permanentGrowthInk(player));this.targetStage=next;this.transitionAge=Infinity;if(next===this.stage)return null;this.stage=next;this.transitions++;const event={stage:next,ink:player.ink,elapsed:null,recalculated:true};this.history.push(event);return event;}
}
export function growthCameraTarget(player,width=1440,height=900,world={width:3910,height:3910}){
 const journey=player.revealJourney,c=journey?.config||GROWTH_STAGES_CONFIG,stage=clamp(journey?.stage||1,1,4);
 const base=c.stageScreenRadius[stage-1]*Math.min(width,height)/Math.max(1,stageEntryRadius(stage,c)),inside=Math.max(width/world.width,height/world.height);
 // Rectangular portrait/landscape worlds need an aspect-aware floor before the final stage.
 return stage<4?Math.max(base,inside*1.06):Math.max(base/c.finalViewExpansion,inside/c.finalViewExpansion);
}
export function followGrowthCamera(old,player,width,height,mobile,dt=0,fresh=false,focus=null,world){
 const stage=clamp(player.revealJourney?.stage||1,1,4),c=player.revealJourney?.config||GROWTH_STAGES_CONFIG;
 const goal=growthCameraTarget(player,width,height,world);
 const ease=player.revealJourney?.transitionAge<c.stageTransitionSeconds?c.transitionEase:c.normalEase;
 const interpolated=old.scale+(goal-old.scale)*(fresh?1:1-Math.exp(-Math.max(0,dt)*ease)),scale=stage<4?Math.max(interpolated,Math.max(width/world.width,height/world.height)*1.06):interpolated;
 const blend=fresh?1:1-Math.exp(-Math.max(0,dt)*5),cx=old.x+width/old.scale/2,cy=old.y+height/old.scale/2;
 // No contain floor: the view can be wider than the world only when the zoom makes it so,
 // and clamping then centres the world instead of shrinking further to show empty paper.
 const tx=player.x,ty=player.y;
 // The camera may leave the map by `borderOverscan` of the screen, so walking up to an edge
 // keeps the body framed instead of pinning it against the border. Only if the world is much
 // smaller than the view does it fall back to centring.
 const position=(center,target,extent,view)=>{const pad=view/scale,inset=stage<4?Math.min(12/scale,Math.max(0,(extent-pad)/2)):0,over=stage===4?(c.borderOverscanByStage?.[3]||0)*pad:0,pos=center+(target-center)*blend-pad/2,lo=inset-over,hi=extent-pad-inset+over;return lo>hi?(extent-pad)/2:clamp(pos,lo,hi);};
 return {scale,x:position(cx,tx,world.width,width),y:position(cy,ty,world.height,height)};
}
