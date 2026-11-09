import {cloudPrograms} from './hero-cloud-shaders.js';
import {HERO_PRESETS,DEFAULT_HERO_PRESET,heroMotionProfile} from './hero-presets.js';
// The same solver/material as the frozen player study, without modifying its archive.
import {InkFluid as StudyFluid} from '../../visual-effects/reference-2d00e16/src/fluid.js';
export {MaterialInk as HeroInkBody} from '../../visual-effects/reference-2d00e16/src/material.js';

export class HeroInkFluid extends StudyFluid {
 motionProfile(){const source=this.preset||HERO_PRESETS[DEFAULT_HERO_PRESET],speed=this.core?.speed||0;if(this.motionSource!==source||this.motionSpeed!==speed){this.motionSource=source;this.motionSpeed=speed;this.motionValue=heroMotionProfile(source,speed);}return this.motionValue;}
 prepareCloud(){return cloudPrograms(this);}
 dispose(){if(this.cloudPrograms)for(const p of Object.values(this.cloudPrograms))this.gl.deleteProgram(p);super.dispose();}
 inject(ink){
  const core=this.core,size=Math.max(0,Math.min(1,((core?.radius||0)-.10)/.30));let moving=Math.min(1,(core?.speed||0)/.16);
  // The study's broad continuous source becomes a solid disk when scaled up.
  // Narrow only that zero-force feed; preserve the solver, seed filaments and collision.
  const profile=this.motionProfile();if(profile.slowMix&&(core?.speed||0)>.002)moving=Math.max(moving,profile.slowMix*.8);if(size&&profile.feed&&ink.vx===0&&ink.vy===0)ink={...ink,radius:ink.radius*(1-profile.feed*size*moving),intensity:ink.intensity*(1-.20*size)};
  if(profile.wakeFloor&&ink.vx===0&&ink.vy===0)ink={...ink,intensity:ink.intensity*(1-.25*moving*Math.max(0,1-(core?.speed||0)/.36))};
  if(profile.fluidity&&ink.vx===0&&ink.vy===0)ink={...ink,intensity:ink.intensity*(1-.24*profile.fluidity*moving)};
  if(profile.feedReduction&&ink.vx===0&&ink.vy===0)ink={...ink,intensity:ink.intensity*(1-profile.feedReduction*moving)};
  return super.inject(ink);
 }
 pass(name,target,uniforms={}){
  // A short-lived wake. Continual body feeding keeps the live core stable at rest.
  const decay=(this.motionProfile()).decay;if(name==='correct'&&decay!==null)uniforms={...uniforms,decay};
  const profile=this.motionProfile();if(name==='confine'&&profile.vorticity){const k=Math.min(1,Math.max(0,((this.core?.radius||0)-.065)/.28));uniforms={...uniforms,amount:uniforms.amount*(1+(profile.vorticity-1)*k)};}if(profile.jet&&(name==='material'||name==='contain')){uniforms={...uniforms,wakeFloor:profile.wakeFloor||0,fluidity:profile.fluidity||0,wakeRetention:profile.wakeRetention??1,slowMotion:(profile.slowMix||0)*Math.min(1,(this.core?.speed||0)/.01),cloudBlend:profile.adaptive?Math.min(.85,Math.max(profile.cloudFloor||0,(profile.wakeBlend||0)*Math.max(0,1-(this.core?.speed||0)/.36),((this.core?.radius||0)-.065)/.28)):1};const programs=cloudPrograms(this),old=this.programs[name],cache=this.uniforms[name];this.programs[name]=programs[name];this.cloudUniforms??={};this.uniforms[name]=this.cloudUniforms[name]??={};try{return super.pass(name,target,uniforms);}finally{this.programs[name]=old;this.uniforms[name]=cache;}}return super.pass(name,target,uniforms);
 }
}
