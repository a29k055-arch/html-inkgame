import {followGrowthCamera,growthCameraTarget} from './growth-stages.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// A temporary form changes framing, never permanent growth stage or physical size.
export function livingCameraFollow(painter){const framing={species:null,scale:Infinity};return(old,p,w,h,mobile,dt,fresh,focus,world)=>{
 if(!p.form){framing.species=null;framing.scale=Infinity;return followGrowthCamera(old,p,w,h,mobile,dt,fresh,focus,world);}
 painter.ensure(p);painter.pose(p);const b=painter.playerFrame(p);
 if(!b||![b.minX,b.minY,b.maxX,b.maxY].every(Number.isFinite))return followGrowthCamera(old,p,w,h,mobile,dt,fresh,focus,world);
 const normal=growthCameraTarget(p,w,h,world),spanW=Math.max(p.r*2,b.maxX-b.minX),spanH=Math.max(p.r*2,b.maxY-b.minY);
 const floor=p.revealJourney?.stage<4?Math.max(w/world.width,h/world.height)*1.02:0;
 const candidate=Math.max(floor,Math.max(normal*(p.form.species==='dragon'?.42:.65),Math.min(normal,w*.82/spanW,h*.78/spanH)));
 if(framing.species!==p.form.species){framing.species=p.form.species;framing.scale=candidate;}else framing.scale=Math.min(framing.scale,candidate);const desired=Math.max(floor,framing.scale);
 const blend=fresh?1:1-Math.exp(-Math.max(0,dt)*6),scale=(old.scale||desired)+(desired-(old.scale||desired))*blend;
 const keep=p.r*(p.form.species==='dragon'?2.2:1.5),mx=Math.max(0,w/scale/2-keep),my=Math.max(0,h/scale/2-keep);const fx=clamp(p.x+((b.minX+b.maxX)/2-p.x)*.65,p.x-mx,p.x+mx),fy=clamp(p.y+((b.minY+b.maxY)/2-p.y)*.65,p.y-my,p.y+my);
 let x=(old.x??(fx-w/scale/2))+(fx-w/scale/2-(old.x??(fx-w/scale/2)))*blend,y=(old.y??(fy-h/scale/2))+(fy-h/scale/2-(old.y??(fy-h/scale/2)))*blend;
 if(p.revealJourney?.stage<4){x=clamp(x,0,Math.max(0,world.width-w/scale));y=clamp(y,0,Math.max(0,world.height-h/scale));}
 return{x,y,scale};
};}
