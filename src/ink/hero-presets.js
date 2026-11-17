// Immutable presets; A uses the archived solver unchanged. All share scene inputs.
export const HERO_PRESETS=Object.freeze({
 swing:Object.freeze({label:'M · 惯性游墨（正式）',life:2.2,maxLife:4.2,length:640,lengthPower:.85,width:.9,widthPower:.8,widthMax:112,opacity:.26,filaments:.012,decay:.16,feed:.33,cloud:true,jet:true,adaptive:true,vorticity:1.9,wakeFloor:.30,wakeBlend:.57,fluidity:.35,sizeAdaptive:true,sizeSwing:true,solidBody:true,slowWake:Object.freeze({start:.08,end:.26,decay:.34,floor:.30,retention:1,feedReduction:.60,vorticityGain:.06})}),

 airflow:Object.freeze({label:'L · 轻游墨云（上轮对照）',life:2.2,maxLife:3.2,length:640,lengthPower:.85,width:.9,widthPower:.8,widthMax:112,opacity:.26,filaments:.012,decay:.16,feed:.33,cloud:true,jet:true,adaptive:true,vorticity:1.9,wakeFloor:.30,wakeBlend:.57,fluidity:.35,sizeAdaptive:true,slowWake:Object.freeze({start:.08,end:.26,decay:.34,floor:.30,retention:1,feedReduction:.60,vorticityGain:.06})}),
 // K: I/H flow base with a longer tail but no slow-speed ink build-up. The slow branch now
 // FADES the wake (decay .34) and stops feeding it (feedReduction .60) instead of thickening it,
 // which is what made J read as sticky. Low fluidity removes the glue-like merging.
 longcloud:Object.freeze({label:'K · 游墨长云（上轮对照）',life:2.2,maxLife:3.2,length:640,lengthPower:.85,width:.9,widthPower:.8,widthMax:112,opacity:.26,filaments:.012,decay:.16,feed:.33,cloud:true,jet:true,adaptive:true,vorticity:1.9,wakeFloor:.30,wakeBlend:.57,fluidity:.35,slowWake:Object.freeze({start:.08,end:.26,decay:.34,floor:.30,retention:1.0,feedReduction:.60,vorticityGain:.06})}),
 drift:Object.freeze({label:'J · 缓游墨云（正式）',life:2,maxLife:3,length:600,lengthPower:.85,width:.9,widthPower:.8,widthMax:110,opacity:0,filaments:0,decay:.16,feed:.36,cloud:true,jet:true,adaptive:true,vorticity:2.0,wakeFloor:.28,wakeBlend:.55,fluidity:.55,slowWake:Object.freeze({start:.10,end:.30,decay:.12,floor:.55,retention:.82,feedReduction:.28,vorticityGain:.10})}),
 wash:Object.freeze({label:'I · 高速参考',life:2,maxLife:3,length:600,lengthPower:.85,width:.9,widthPower:.8,widthMax:110,opacity:0,filaments:0,decay:.16,feed:.36,cloud:true,jet:true,adaptive:true,vorticity:2.0,wakeFloor:.28,wakeBlend:.55,fluidity:.55}),
 living:Object.freeze({label:'H · 11月9日对照',life:2,maxLife:3,length:600,lengthPower:.85,width:.9,widthPower:.8,widthMax:110,opacity:0,filaments:0,decay:.14,feed:.30,cloud:true,jet:true,adaptive:true,vorticity:1.8,wakeFloor:.32,wakeBlend:.60}),
 plume:Object.freeze({label:'G · 平流实验',life:2,maxLife:3,length:600,lengthPower:.85,width:.9,widthPower:.8,widthMax:110,opacity:0,filaments:0,decay:.35,feed:.25,cloud:true,jet:true}),
 cloud:Object.freeze({label:'E · 11月7日对照',life:2,maxLife:3,length:600,lengthPower:.85,width:.9,widthPower:.8,widthMax:110,opacity:0,filaments:0,decay:.18,feed:.30,cloud:true,jet:true,adaptive:true,vorticity:1.8}),
 reference:Object.freeze({label:'A · 原版参考',life:1.5,maxLife:1.8,length:340,lengthPower:.65,width:.75,widthPower:.55,widthMax:58,opacity:.5,filaments:0,decay:null,feed:0}),
 single:Object.freeze({label:'B · 单尾水墨',life:2.0,maxLife:2.8,length:560,lengthPower:.85,width:.80,widthPower:.75,widthMax:90,opacity:.70,filaments:.015,decay:1.8,feed:.25}),
 comet:Object.freeze({label:'C · 彗星水墨',life:1.8,maxLife:2.8,length:460,lengthPower:.85,width:1.0,widthPower:.80,widthMax:112,opacity:.76,filaments:.035,decay:1.65,feed:.30}),
 fluid:Object.freeze({label:'D · 柔墨流体',life:1.7,maxLife:2.6,length:430,lengthPower:.80,width:.92,widthPower:.75,widthMax:104,opacity:.68,filaments:.025,decay:1.9,feed:.38})
});
export const DEFAULT_HERO_PRESET='swing';

// Preserve the fast profile exactly; only slow on-screen movement receives a longer-lived wake.
export function heroMotionProfile(profile,speed=0){const low=profile.slowWake;if(!low)return profile;const t=Math.max(0,Math.min(1,(speed-low.start)/(low.end-low.start))),slow=1-t*t*(3-2*t);return {...profile,slowMix:slow,cloudFloor:.58*slow,decay:profile.decay+(low.decay-profile.decay)*slow,wakeFloor:profile.wakeFloor+(low.floor-profile.wakeFloor)*slow,wakeRetention:1+(low.retention-1)*slow,vorticity:profile.vorticity*(1+low.vorticityGain*slow),feedReduction:low.feedReduction*slow};}

// Physical body size, independent of camera. Small/mid bodies keep the flow profile.
export function heroLargeMix(profile,radius){const start=110,span=profile.sizeSwing?60:100,u=Math.max(0,Math.min(1,(radius-start)/span));return u*u*(3-2*u);}
export function heroSizeProfile(profile,worldRadius=0){
 if(!profile.sizeAdaptive)return profile;
 const large=heroLargeMix(profile,worldRadius);
 if(profile.sizeSwing)return {...profile,bigBody:large,swingBody:large,
  bodyFeed:1-.38*large,bodyFeedRadius:1,
  tailFade:(profile.tailFade||0)+.12*large,
  // Preserve faint moving pigment longer, but still clear it promptly after a stop.
  decay:profile.decay*(1-.18*large*(profile.moving||0)),
  fluidity:(profile.fluidity||0)+.22*large,
  wakeFloor:(profile.wakeFloor||0)*(1-.12*large),vorticity:(profile.vorticity||1)*(1-.18*large)};
 return {...profile,bigBody:large,bodyFeed:1-.46*large,bodyFeedRadius:1-.14*large,
  tailFade:(profile.tailFade||0)+.8*large,fluidity:(profile.fluidity||0)+.18*large,
  wakeFloor:(profile.wakeFloor||0)*(1-.25*large),vorticity:(profile.vorticity||1)*(1-.25*large)};
}
