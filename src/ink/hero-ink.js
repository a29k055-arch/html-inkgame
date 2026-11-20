import {cloudPrograms} from './hero-cloud-shaders.js';
import {solidDisplayProgram} from './hero-solid-shader.js';
import {HERO_PRESETS,DEFAULT_HERO_PRESET,heroMotionProfile,heroSizeProfile} from './hero-presets.js';
import {relativeInkProfile} from './hero-relative-motion.js';
// The same solver/material as the frozen player study, without modifying its archive.
import {InkFluid as StudyFluid} from '../../visual-effects/reference-2d00e16/src/fluid.js';
import {MaterialInk} from '../../visual-effects/reference-2d00e16/src/material.js';
export class HeroInkBody extends MaterialInk {
 update(entity,dt){if(this.fluid.preset?.restoredFlow)this.nextFeed=Infinity;return super.update(entity,dt);}
}

export class HeroInkFluid extends StudyFluid {
 step(dt){this.bodyTime=(this.bodyTime||0)+Math.min(dt,1/30);return super.step(dt);}
 motionProfile(){const source=this.preset||HERO_PRESETS[DEFAULT_HERO_PRESET],speed=Number.isFinite(this.relativeMotion)?this.relativeMotion:this.core?.speed||0,relative=Number.isFinite(this.relativeMotion);if(this.motionSource!==source||this.motionSpeed!==speed||this.motionRelative!==relative||this.motionRadius!==this.worldRadius){this.motionRadius=this.worldRadius;this.motionSource=source;this.motionSpeed=speed;this.motionRelative=relative;this.motionValue=heroSizeProfile(relative?relativeInkProfile(source,speed):heroMotionProfile(source,speed),this.worldRadius);}return this.motionValue;}
 prepareCloud(){return cloudPrograms(this);}
 dispose(){if(this.cloudPrograms)for(const p of Object.values(this.cloudPrograms))this.gl.deleteProgram(p);if(this.solidDisplay)this.gl.deleteProgram(this.solidDisplay);super.dispose();}
 inject(ink){
  const core=this.core,size=Math.max(0,Math.min(1,((core?.radius||0)-.10)/.30));let moving=Math.min(1,(core?.speed||0)/.16);
  // The study's broad continuous source becomes a solid disk when scaled up.
  // Narrow only that zero-force feed; preserve the solver, seed filaments and collision.
  const profile=this.motionProfile();if(profile.relative)moving=profile.moving;else if(profile.slowMix&&(core?.speed||0)>.002)moving=Math.max(moving,profile.slowMix*.8);if(size&&profile.feed&&ink.vx===0&&ink.vy===0)ink={...ink,radius:ink.radius*(1-profile.feed*size*moving),intensity:ink.intensity*(1-.20*size)};
  // The live density source, not a display disk, determines the visible body.
  // Keep its physical footprint at every size; only dilute large-body pigment.
  if(profile.restoredFlow&&ink.vx===0&&ink.vy===0)return super.inject({...ink,radius:this.solidCore?.radius?this.solidCore.radius*.88:ink.radius,intensity:ink.intensity*(1-.25*(profile.bigBody||0))});
  if(profile.wakeFloor&&ink.vx===0&&ink.vy===0)ink={...ink,intensity:ink.intensity*(1-.25*moving*Math.max(0,1-(core?.speed||0)/.36))};
  if(profile.fluidity&&ink.vx===0&&ink.vy===0)ink={...ink,intensity:ink.intensity*(1-.24*profile.fluidity*moving)};
  if(profile.feedReduction&&ink.vx===0&&ink.vy===0)ink={...ink,intensity:ink.intensity*(1-profile.feedReduction*moving)};
  if(profile.bigBody&&ink.vx===0&&ink.vy===0)ink={...ink,radius:ink.radius*profile.bodyFeedRadius,intensity:ink.intensity*profile.bodyFeed};
  return super.inject(ink);
 }
 pass(name,target,uniforms={}){
  if(name==='display'&&this.preset?.solidBody){const previous=this.programs.display,cache=this.uniforms.display;this.programs.display=solidDisplayProgram(this);this.uniforms.display=this.solidUniforms??={};try{return super.pass(name,target,{...uniforms,solidPoint:this.solidCore?.point||[.5,.5],solidRadius:this.solidCore?.radius||0,solidLarge:this.motionProfile().bigBody||0,bodyTime:this.bodyTime||0});}finally{this.programs.display=previous;this.uniforms.display=cache;}}
  // A short-lived wake. Continual body feeding keeps the live core stable at rest.
  const decay=(this.motionProfile()).decay;if(name==='correct'&&decay!==null)uniforms={...uniforms,decay};
  const profile=this.motionProfile();if(name==='confine'&&profile.vorticity){const k=Math.min(1,Math.max(0,((this.core?.radius||0)-.065)/.28));uniforms={...uniforms,amount:uniforms.amount*(1+(profile.vorticity-1)*k)};}if(profile.jet&&(name==='material'||name==='contain')){uniforms={...uniforms,restoredFlow:profile.restoredFlow?1:0,bigBody:profile.bigBody||0,swingBody:profile.swingBody||0,wakeFloor:profile.wakeFloor||0,fluidity:profile.fluidity||0,wakeRetention:profile.wakeRetention??1,relativeActivity:profile.relative?profile.moving:0,tailFade:profile.tailFade||0,slowMotion:(profile.slowMix||0)*(profile.relative?profile.moving:Math.min(1,(this.core?.speed||0)/.01)),cloudBlend:Math.max(profile.swingBody||0,(profile.adaptive?(1-(1-Math.min(.85,Math.max(profile.cloudFloor||0,(profile.wakeBlend||0)*Math.max(0,1-(profile.relative?profile.relativeSpeed/1.2:(this.core?.speed||0)/.36)),((this.core?.radius||0)-.065)/.28)))*(1-(profile.bigBody||0))):1))};const programs=cloudPrograms(this),old=this.programs[name],cache=this.uniforms[name];this.programs[name]=programs[name];this.cloudUniforms??={};this.uniforms[name]=this.cloudUniforms[name]??={};try{return super.pass(name,target,uniforms);}finally{this.programs[name]=old;this.uniforms[name]=cache;}}return super.pass(name,target,uniforms);
 }
}
