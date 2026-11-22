import {coreRadius} from './alien-geometry.js';

export const LIVING_SWALLOW_COVERAGE=.80;
const disk=Array.from({length:64},(_,i)=>{const angle=i*2.399963229728653,r=Math.sqrt((i+.5)/64);return{x:Math.cos(angle)*r,y:Math.sin(angle)*r,w:1/64};});
const speciesOf=e=>e.form?.remaining>0?e.form.species:e.species;
function shape(e){const q=e.livingBody;return q&&q.species===speciesOf(e)&&q.samples?.length&&q.coreRadius>0?q:null;}
export function livingBodyBound(e){const q=shape(e),r=coreRadius(e);return q?Math.max(r,(Number(q.bound)||q.coreRadius)*r/q.coreRadius):r;}
function segmentContains(x,y,a,b,pad){const dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/n)):0,r=(a.r||0)+((b.r||0)-(a.r||0))*t+pad;return(x-a.x-dx*t)**2+(y-a.y-dy*t)**2<=r*r;}
export function livingBodyContains(e,x,y,padding=0){
 const r=coreRadius(e),q=shape(e),dx=x-e.x,dy=y-e.y;if(!q||e.form?.species==='shrimp')return dx*dx+dy*dy<=(r+padding)**2;
 const scale=r/q.coreRadius,px=dx/scale,py=dy/scale,pad=padding/scale;
 if(Math.hypot(dx,dy)>livingBodyBound(e)+padding)return false;
 if(q.sections?.length){for(let i=1;i<q.sections.length;i++)if(segmentContains(px,py,q.sections[i-1],q.sections[i],pad))return true;return false;}
 // Cell radii are prepared with the weighted alpha samples at boot, never read
 // from a GPU texture during collision checks. They do not fill S-curve holes.
 return q.samples.some(p=>(px-p.x)**2+(py-p.y)**2<=((p.r||q.coreRadius*.35)+pad)**2);
}
export function livingCoverage(predator,prey){
 if(Math.hypot(predator.x-prey.x,predator.y-prey.y)>livingBodyBound(predator)+livingBodyBound(prey))return 0;
 const q=shape(prey),r=coreRadius(prey),scale=q?r/q.coreRadius:r,points=q?q.samples:disk;let covered=0,total=0;
 for(const p of points){const weight=p.w??1;total+=weight;if(livingBodyContains(predator,prey.x+p.x*scale,prey.y+p.y*scale))covered+=weight;}
 return total?covered/total:0;
}
export const coversLivingBody=(predator,prey)=>livingCoverage(predator,prey)+1e-8>=LIVING_SWALLOW_COVERAGE;
