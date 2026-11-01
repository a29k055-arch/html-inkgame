// The same solver/material as the frozen player study, without modifying its archive.
import {InkFluid as StudyFluid} from '../../visual-effects/reference-2d00e16/src/fluid.js';
export {MaterialInk as HeroInkBody} from '../../visual-effects/reference-2d00e16/src/material.js';
export class HeroInkFluid extends StudyFluid {
 inject(ink){
  const core=this.core,size=Math.max(0,Math.min(1,((core?.radius||0)-.10)/.30)),moving=Math.min(1,(core?.speed||0)/.16);
  // The study's broad continuous source becomes a solid disk when scaled up.
  // Narrow only that zero-force feed; preserve the solver, seed filaments and collision.
  if(size&&ink.vx===0&&ink.vy===0)ink={...ink,radius:ink.radius*(1-.30*size*moving),intensity:ink.intensity*(1-.20*size)};
  return super.inject(ink);
 }
 pass(name,target,uniforms={}){
  // A short-lived wake. Continual body feeding keeps the live core stable at rest.
  if(name==='correct')uniforms={...uniforms,decay:1.7};
  return super.pass(name,target,uniforms);
 }
}
