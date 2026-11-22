import {HeroInkFluid,HeroInkBody} from './hero-ink.js';
import {InkFluid as NativeInkFluid} from '../../visual-effects/reference-2d00e16/src/fluid.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const point=p=>Array.isArray(p)?{x:p[0],y:p[1]}:p;
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export const LIVING_INK_PROFILES=Object.freeze({
 fish:Object.freeze({samples:[.70,.86,.98],widths:[.45,.40,.28],rates:[13,9,5],decay:.22,maxEmitters:10}),
 dragon:Object.freeze({samples:[.48,.66,.82,.96],widths:[.40,.46,.42,.30],rates:[14,20,25,17],decay:.24,maxEmitters:16}),
 turtle:Object.freeze({samples:[.83,.98],widths:[.20,.14],rates:[5.2,2.6],decay:.38,maxEmitters:2})
});
export function sampleLivingSpine(spine,s){
 const rows=(spine||[]).map(point).filter(valid);if(rows.length<2)return null;
 // Animation supplies an arc-length sampled spine. Interpolation keeps emitter
 // paths continuous instead of jumping between bones on a turning dragon.
 const at=clamp(s)*(rows.length-1),i=Math.min(rows.length-2,Math.floor(at)),u=at-i,a=rows[i],b=rows[i+1];
 return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};
}
export function livingWorldToUV(p,camera){
 return {x:(p.x-camera.x)*camera.scale/camera.width,y:(p.y-camera.y)*camera.scale/camera.height};
}
export function livingEmitters(spine,radius,form){
 const p=LIVING_INK_PROFILES[form];if(!p)return [];
 let distance=0,last=sampleLivingSpine(spine,p.samples[0]);
 for(let i=1;i<=16;i++){const at=sampleLivingSpine(spine,p.samples[0]+(p.samples.at(-1)-p.samples[0])*i/16);distance+=Math.hypot(at.x-last.x,at.y-last.y);last=at;}
 const count=Math.max(p.samples.length,Math.min(p.maxEmitters,Math.ceil(distance/Math.max(.1,radius*.55))+1)),rows=[];
 for(let i=0;i<count;i++){
  const s=p.samples[0]+(p.samples.at(-1)-p.samples[0])*i/(count-1);let j=0;while(j<p.samples.length-2&&s>p.samples[j+1])j++;
  const t=clamp((s-p.samples[j])/(p.samples[j+1]-p.samples[j]));rows.push({...sampleLivingSpine(spine,s),s,radius:radius*(p.widths[j]+(p.widths[j+1]-p.widths[j])*t),rate:p.rates[j]+(p.rates[j+1]-p.rates[j])*t});
 }
 const sum=rows.reduce((n,a)=>n+a.rate,0),budget=p.rates.reduce((a,b)=>a+b,0);for(const row of rows)row.rate*=budget/sum;
 return rows;
}

// One existing velocity/density solver, with no new framebuffer or display disk.
// Forms change the actual ink emitters; the creature artwork is drawn separately.
export class LivingInkFluid extends HeroInkFluid {
 motionProfile(){
  const base=super.motionProfile(),form=this.livingForm;if(!form)return base;
  const ratio=Number.isFinite(this.sourceMotionRatio)?this.sourceMotionRatio:this.relativeMotion||0,rest=1-clamp((ratio-.025)/.15),profile=LIVING_INK_PROFILES[form];
  // Keep forcing local to the tail root. Old world pigment must not be pulled
  // around the entire screen when the creature turns its head.
  return {...base,solidBody:false,adaptive:false,bigBody:1,swingBody:0,restoredFlow:true,wakeFloor:0,fluidity:.80,vorticity:1.8,
   decay:(profile?.decay||.4)*(1-rest)+1.65*rest,tailFade:.30+1.7*rest};
 }
 inject(ink){
  if(!this.livingForm)return super.inject(ink);
  if(this.livingForm==='shrimp'||!ink.living)return;
  // Bypass the ink-ball feed's physical-circle kernel: form anchors already
  // provide their real, much narrower local tail widths in viewport units.
  return NativeInkFluid.prototype.inject.call(this,ink);
 }
 pass(name,target,uniforms={}){
  if(name==='display'&&this.livingForm)return NativeInkFluid.prototype.pass.call(this,name,target,{...uniforms,sizeBoundary:0});
  return super.pass(name,target,uniforms);
 }
}

export class LivingInkBody extends HeroInkBody {
 reset(){super.reset();this.formBefore=undefined;this.previousAnchors=[];this.formSeeded=false;}
 splash(entity,strength=1){if(!this.fluid.livingForm)return super.splash(entity,strength);}
 update(entity,dt){
  const f=this.fluid,form=f.livingForm||null;
  if(this.formBefore!==form){
   // Never leave the old black ball inside a translucent fish/shrimp, and never
   // bring a previous dragon wake back when its five-second form has ended.
   if(this.formBefore!==undefined||form){f.clear();f.livingClearCount=(f.livingClearCount||0)+1;super.reset();}
   this.previousAnchors=[];this.formSeeded=false;this.formBefore=form;
  }
  if(!form){f.livingInkMetrics={form:null,emitters:0,clears:f.livingClearCount||0};return super.update(entity,dt);}
  this.canvas.hidden=true;this.time+=dt;
  if(form==='shrimp'){
   f.core=null;f.livingInkMetrics={form,emitters:0,anchors:[],activity:0,clears:f.livingClearCount||0};return;
  }
  const profile=LIVING_INK_PROFILES[form];if(!profile)return;
  const camera=f.livingCamera||{},viewW=camera.width||globalThis.innerWidth||1200,viewH=camera.height||globalThis.innerHeight||900,
   cam={x:camera.x||0,y:camera.y||0,scale:camera.scale||1,width:viewW,height:viewH},
   coreUV=f.solidCore?.radius||this.radius(entity)*.48,worldRadius=coreUV*viewH/cam.scale,
   worldVelocity={x:entity.vx*viewW/cam.scale,y:entity.vy*viewH/cam.scale},speed=Math.hypot(worldVelocity.x,worldVelocity.y),
   ratio=Number.isFinite(f.sourceMotionRatio)?f.sourceMotionRatio:speed/110,activity=clamp((ratio-.025)/.15),
   center={x:cam.x+entity.x*viewW/cam.scale,y:cam.y+entity.y*viewH/cam.scale},
   pose=f.livingPose||{},hasPose=(pose.spine||[]).length>=2,heading=Number.isFinite(pose.heading)?pose.heading:Math.atan2(worldVelocity.y,worldVelocity.x||.00001),
   fallback=[center,{x:center.x-Math.cos(heading)*worldRadius*(form==='dragon'?3.2:1.7),y:center.y-Math.sin(heading)*worldRadius*(form==='dragon'?3.2:1.7)}],spine=hasPose?pose.spine:fallback,
   anchors=livingEmitters(spine,worldRadius,form);
  const root=sampleLivingSpine(spine,form==='dragon'?.65:form==='fish'?.79:.9),uv=livingWorldToUV(root,cam),r=coreUV*1.35;
  f.core={point:[uv.x,1-uv.y],radius:r,collisionRadius:coreUV,collisionPoint:f.solidCore?.point||[entity.x,1-entity.y],interactionRadius:0,speed:Math.hypot(entity.vx*f.aspect,entity.vy)};
  // Carry only a fraction of the body's motion. Fresh ink remains connected by
  // emission, while deposited ink lags and diffuses in the world instead of
  // becoming a rigid appendage of the current creature heading.
  f.pass('material',f.v.write,{field:f.d.read,velocity:f.v.read,point:f.core.point,force:[entity.vx*f.w*.18,-entity.vy*f.h*.18],radius:r,dt,time:this.time});f.v.swap();
  // Seed a few counter-circulating water eddies, without adding a painted ink
  // reservoir. They make deposited pigment feather like the native brush field
  // instead of reading as a sequence of soft Gaussian shadows. This is once per
  // transformation, never a periodic jet animation.
  if(!this.formSeeded&&hasPose&&activity>0){
   for(let i=0;i<anchors.length;i+=Math.ceil(anchors.length/4)){
    const a=anchors[i],before=sampleLivingSpine(spine,Math.max(0,a.s-.01)),after=sampleLivingSpine(spine,Math.min(1,a.s+.01)),length=Math.hypot(after.x-before.x,after.y-before.y)||1,tx=(after.x-before.x)/length,ty=(after.y-before.y)/length;
    for(const sign of [-1,1]){const p=livingWorldToUV({x:a.x-ty*a.radius*.65*sign,y:a.y+tx*a.radius*.65*sign},cam);f.stir({x:p.x,y:p.y,vx:tx*a.radius*cam.scale/viewW*f.w*6*sign,vy:ty*a.radius*cam.scale/viewH*f.h*6*sign,radius:a.radius*cam.scale/viewH*.70});}
   }
   this.formSeeded=true;
  }
  const metrics=[];
  for(let i=0;i<anchors.length;i++){
   const a=anchors[i],p=livingWorldToUV(a,cam),previous=this.previousAnchors[i],maxKick=Math.max(worldRadius*2,speed*1.2+worldRadius),
    local=previous&&dt>0?{x:clamp((a.x-previous.x)/dt-worldVelocity.x,-maxKick,maxKick),y:clamp((a.y-previous.y)/dt-worldVelocity.y,-maxKick,maxKick)}:{x:0,y:0},
    intensity=a.rate*Math.max(0,Math.min(.1,dt))*activity;
   if(intensity>0){
    f.inject({living:true,x:p.x,y:p.y,vx:0,vy:0,radius:a.radius*cam.scale/viewH,intensity});
    // Real animated tail displacement perturbs the same velocity field. No
    // periodic side jet and no fresh trajectory stroke is painted on top.
    if(previous&&i%Math.ceil(anchors.length/4)===0&&Math.hypot(local.x,local.y)>.2)f.stir({x:p.x,y:p.y,vx:local.x*cam.scale/viewW*f.w*dt*2,vy:local.y*cam.scale/viewH*f.h*dt*2,radius:a.radius*cam.scale/viewH});
   }
   metrics.push({x:a.x,y:a.y,s:a.s,radius:a.radius,uv:[p.x,1-p.y],intensity});
  }
  this.previousAnchors=anchors.map(a=>({x:a.x,y:a.y}));
  f.pass('contain',f.d.write,{field:f.d.read,point:f.core.point,force:[entity.vx,-entity.vy],radius:r,dt});f.d.swap();
  f.livingInkMetrics={form,emitters:activity>0?anchors.length:0,anchors:metrics,activity,hasPose,clears:f.livingClearCount||0};
 }
}
