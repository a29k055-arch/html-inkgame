import {followGrowthCamera} from './growth-stages.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Possession never changes zoom. A bounded torso-centroid focus gives a long
// creature room on both sides, rather than centring its head and cutting its tail.
export function livingCameraFollow(){return(old,p,w,h,mobile,dt,fresh,_focus,world)=>{
 let focus=null;const body=p.livingBody;
 if(p.form&&body?.species===p.form.species&&body.samples?.length){let x=0,y=0,sum=0;for(const q of body.samples){const weight=q.w??1;x+=q.x*weight;y+=q.y*weight;sum+=weight;}const scale=Math.max(.01,old.scale||1);if(sum)focus={x:p.x+clamp(x/sum,-w/scale*.18,w/scale*.18),y:p.y+clamp(y/sum,-h/scale*.18,h/scale*.18)};}
 return followGrowthCamera(old,p,w,h,mobile,dt,fresh,focus,world);
};}
