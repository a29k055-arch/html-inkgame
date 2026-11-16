import {reserveRadius} from '../game/ink-reserve.js';
// Growth is driven by real ink only, never elapsed time or temporary item size.
// Camera ladder: four stages over one continuous radius range. Inside a stage the zoom is
// CONSTANT, so the body visibly grows; at a threshold the zoom is re-derived from the next
// entry radius. Entry radii are geometric (x2.23 each), so every stage is the same step and
// the screen never shrinks below the previous stage's start - no mid-stage size loss.
// The final stage keeps the framing the old third stage had (z ~= .53 on a 900px viewport).
// There is NO whole-painting "contain" view: the camera follows the body and simply clamps at
// the world edge, so the border comes into frame only when the player walks up to it.
const thresholds=Object.freeze([846,4200,9000]);
export const GROWTH_STAGES_CONFIG=Object.freeze({
 startInk:17,initialRadius:12,sizeMassPerInk:1,expansionInk:thresholds[0],thresholds,
 // Body radius as a fraction of the viewport short side at stage entry (12% diameter).
 stageScreenRadius:Object.freeze([.050,.058,.075,.098]),
 // How far the camera may slide past the world edge, as a fraction of the viewport.
 // Only stage four may look past the map. Earlier stages clamp hard so the border never shows.
 borderOverscanByStage:Object.freeze([0,0,0,.17]),
 // V4 only: the radius ceiling that lets stage four keep growing instead of freezing.
 maxRadius:280,sizeLinear:.0175,
 framePadding:.08,transitionEase:.82,normalEase:1.8
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const growthStageKey=stage=>['growthMicro','growthFlow','growthGather','growthPainting'][clamp(stage,1,4)-1];
export function growthFrame(width,height,world,config=GROWTH_STAGES_CONFIG){const top=Math.min(124,height*.26),bottom=Math.min(78,height*.16);return {scale:Math.min(width*(1-2*config.framePadding)/world.width,(height-top-bottom)*.94/world.height),offset:(top-bottom)/2};}
// Radius the player owns when a stage begins. Stage 4 starts where stage 3 ends.
export function stageEntryRadius(stage,config=GROWTH_STAGES_CONFIG){return stage<=1?config.initialRadius:reserveRadius(config.thresholds[stage-2],{sizeMassPerInk:config.sizeMassPerInk,maxRadius:config.maxRadius,sizeLinear:config.sizeLinear,minimumRadius:config.initialRadius});}
export class GrowthJourney{
 constructor(config={}){this.config={...GROWTH_STAGES_CONFIG,...config};this.stage=1;this.expandedAt=null;this.transitionAge=Infinity;this.transitions=0;this.history=[];}
 stageForInk(ink){let stage=1;while(stage<4&&ink>=this.config.thresholds[stage-1])stage++;return stage;}
 update(player,dt,elapsed){this.transitionAge+=Math.max(0,dt);if(player.dead)return null;const next=this.stageForInk(player.ink);if(next<=this.stage)return null;this.stage=next;this.expandedAt??=elapsed;this.transitionAge=0;this.transitions++;const event={stage:next,ink:player.ink,elapsed};this.history.push(event);return event;}
 // Called on respawn only: the stage is re-derived from the ink actually retained, so a death
 // can hand back a smaller stage (and a closer camera) without ever touching the world.
 recalculate(player){const next=this.stageForInk(player.ink);if(next===this.stage)return null;this.stage=next;this.transitionAge=0;this.transitions++;const event={stage:next,ink:player.ink,elapsed:null,recalculated:true};this.history.push(event);return event;}
}
export function growthCameraTarget(player,width=1440,height=900,world={width:3910,height:3910}){
 const journey=player.revealJourney,c=journey?.config||GROWTH_STAGES_CONFIG,stage=clamp(journey?.stage||1,1,4);
 return c.stageScreenRadius[stage-1]*Math.min(width,height)/Math.max(1,stageEntryRadius(stage,c));
}
export function followGrowthCamera(old,player,width,height,mobile,dt=0,fresh=false,focus=null,world){
 const stage=clamp(player.revealJourney?.stage||1,1,4),c=player.revealJourney?.config||GROWTH_STAGES_CONFIG;
 const goal=growthCameraTarget(player,width,height,world);
 const ease=player.revealJourney?.transitionAge<5?c.transitionEase:c.normalEase;
 const scale=old.scale+(goal-old.scale)*(fresh?1:1-Math.exp(-Math.max(0,dt)*ease));
 const blend=fresh?1:1-Math.exp(-Math.max(0,dt)*5),cx=old.x+width/old.scale/2,cy=old.y+height/old.scale/2;
 // No contain floor: the view can be wider than the world only when the zoom makes it so,
 // and clamping then centres the world instead of shrinking further to show empty paper.
 const tx=player.x,ty=player.y;
 // The camera may leave the map by `borderOverscan` of the screen, so walking up to an edge
 // keeps the body framed instead of pinning it against the border. Only if the world is much
 // smaller than the view does it fall back to centring.
 const position=(center,target,extent,view)=>{const pad=view/scale,over=(c.borderOverscanByStage?.[stage-1]??.28)*pad,pos=center+(target-center)*blend-pad/2,lo=-over,hi=extent-pad+over;return lo>hi?(extent-pad)/2:clamp(pos,lo,hi);};
 return {scale,x:position(cx,tx,world.width,width),y:position(cy,ty,world.height,height)};
}
