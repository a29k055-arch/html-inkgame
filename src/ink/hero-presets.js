// Immutable presets; A uses the archived solver unchanged. All share scene inputs.
export const HERO_PRESETS=Object.freeze({
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
export const DEFAULT_HERO_PRESET='drift';

// Preserve the fast profile exactly; only slow on-screen movement receives a longer-lived wake.
export function heroMotionProfile(profile,speed=0){const low=profile.slowWake;if(!low)return profile;const t=Math.max(0,Math.min(1,(speed-low.start)/(low.end-low.start))),slow=1-t*t*(3-2*t);return {...profile,slowMix:slow,cloudFloor:.58*slow,decay:profile.decay+(low.decay-profile.decay)*slow,wakeFloor:profile.wakeFloor+(low.floor-profile.wakeFloor)*slow,wakeRetention:1+(low.retention-1)*slow,vorticity:profile.vorticity*(1+low.vorticityGain*slow),feedReduction:low.feedReduction*slow};}
