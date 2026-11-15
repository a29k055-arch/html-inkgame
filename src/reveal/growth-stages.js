import {reserveRadius} from '../game/ink-reserve.js';
// Growth is driven by real ink only, never elapsed time or temporary item size.
// Camera model: inside one stage the zoom is CONSTANT, so the body visibly grows on screen
// (stage entry ≈9% of the viewport short side, stage exit ≈20-27%). Crossing a threshold
// re-derives the zoom from the new entry radius, which pulls the camera out in one clear move.
// The fraction is device-independent, so PC and phone see the same relative size.
const thresholds=Object.freeze([1400,6500,18000]);
export const GROWTH_STAGES_CONFIG=Object.freeze({startInk:17,initialRadius:9,sizeMassPerInk:1,expansionInk:thresholds[0],thresholds,stageScreenRadius:Object.freeze([.048,.048,.048]),framePadding:.08,transitionEase:.82,normalEase:1.8,deathStageFloor:1});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const growthStageKey=stage=>['growthMicro','growthFlow','growthGather','growthPainting'][clamp(stage,1,4)-1];
export function growthFrame(width,height,world,config=GROWTH_STAGES_CONFIG){const top=Math.min(124,height*.26),bottom=Math.min(78,height*.16);return {scale:Math.min(width*(1-2*config.framePadding)/world.width,(height-top-bottom)*.94/world.height),offset:(top-bottom)/2};}
// Radius the player owns when a stage begins. Stage 4 starts where stage 3 ends.
export function stageEntryRadius(stage,config=GROWTH_STAGES_CONFIG){return stage<=1?config.initialRadius:reserveRadius(config.thresholds[stage-2],{sizeMassPerInk:config.sizeMassPerInk});}
export class GrowthJourney{
 constructor(config={}){this.config={...GROWTH_STAGES_CONFIG,...config};this.stage=1;this.expandedAt=null;this.transitionAge=Infinity;this.transitions=0;this.history=[];}
 stageForInk(ink){let stage=1;while(stage<4&&ink>=this.config.thresholds[stage-1])stage++;return stage;}
 update(player,dt,elapsed){this.transitionAge+=Math.max(0,dt);if(player.dead)return null;const next=this.stageForInk(player.ink);if(next<=this.stage)return null;this.stage=next;this.expandedAt??=elapsed;this.transitionAge=0;this.transitions++;const event={stage:next,ink:player.ink,elapsed};this.history.push(event);return event;}
 // Called on respawn only: the stage is re-derived from the ink actually retained, so a death
 // can hand back a smaller stage (and a closer camera) without ever touching the world.
 recalculate(player){const next=this.stageForInk(player.ink);if(next===this.stage)return null;this.stage=next;this.transitionAge=0;this.transitions++;const event={stage:next,ink:player.ink,elapsed:null,recalculated:true};this.history.push(event);return event;}
}
export function growthCameraTarget(player,width=1440,height=900,world={width:3910,height:3910}){
 const journey=player.revealJourney,c=journey?.config||GROWTH_STAGES_CONFIG,stage=journey?.stage||1;
 if(stage>=4)return growthFrame(width,height,world,c).scale;
 return c.stageScreenRadius[stage-1]*Math.min(width,height)/Math.max(1,stageEntryRadius(stage,c));
}
export function followGrowthCamera(old,player,width,height,mobile,dt=0,fresh=false,focus=null,world){
 const stage=player.revealJourney?.stage||1,c=player.revealJourney?.config||GROWTH_STAGES_CONFIG,frame=growthFrame(width,height,world,c),contain=frame.scale;
 // A contain floor prevents stage 3 from pulling back on wide screens / tall art.
 // Earlier stages may show one paper edge; only stage 4 guarantees all edges.
 const goal=stage===4?contain:Math.max(contain,growthCameraTarget(player,width,height,world));
 const ease=player.revealJourney?.transitionAge<5?c.transitionEase:c.normalEase;
 const scale=Math.max(contain,old.scale+(goal-old.scale)*(fresh?1:1-Math.exp(-Math.max(0,dt)*ease)));
 const blend=fresh?1:1-Math.exp(-Math.max(0,dt)*5),cx=old.x+width/old.scale/2,cy=old.y+height/old.scale/2;
 if(stage===4){const targetY=world.height/2-frame.offset/scale;return {scale,x:cx+(world.width/2-cx)*blend-width/scale/2,y:cy+(targetY-cy)*blend-height/scale/2};}
 // Contain allows paper/frame outside the world; gameplay stays radius-bounded.
 const tx=player.x,ty=player.y;
 const position=(center,target,extent,view)=>{const pos=center+(target-center)*blend-view/scale/2;return view/scale>=extent?(extent-view/scale)/2:clamp(pos,0,extent-view/scale);};
 return {scale,x:position(cx,tx,world.width,width),y:position(cy,ty,world.height,height)};
}
