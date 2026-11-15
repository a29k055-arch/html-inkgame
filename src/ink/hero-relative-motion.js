// Dimensionless gameplay speed, independent of camera scale and actor radius.
export const RELATIVE_INK_MOTION=Object.freeze({smoothing:7,restStart:.025,restEnd:.09,restDecay:1.25,slowDecay:.20,fastDecay:.16,tailFade:1.7,studyMaxSpeed:110});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const u=clamp((v-a)/(b-a),0,1);return u*u*(3-2*u);};
export function smoothRelativeSpeed(previous,actual,maximum,dt){const goal=clamp(Math.max(0,actual)/Math.max(1,maximum),0,1.5);return previous+(goal-previous)*(1-Math.exp(-Math.max(0,dt)*RELATIVE_INK_MOTION.smoothing));}
export function relativeInkProfile(source,ratio){
 if(!source.slowWake)return source;
 const c=RELATIVE_INK_MOTION,active=smooth(c.restStart,c.restEnd,ratio),fast=smooth(.25,.85,ratio),slow=active*(1-fast),rest=1-active;
 return {...source,relative:true,relativeSpeed:ratio,moving:active,slowMix:slow,restMix:rest,
  decay:c.restDecay*rest+(c.slowDecay+(c.fastDecay-c.slowDecay)*fast)*active,
  wakeFloor:(.40+.23*fast)*active,wakeRetention:1+rest*.65,
  cloudFloor:Math.max(.76*active,.85*slow),feedReduction:.14+rest*.38,vorticity:source.vorticity*(.75+.25*active),tailFade:c.tailFade*rest};
}
