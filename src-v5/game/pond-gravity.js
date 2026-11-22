import {coreRadius} from './alien-geometry.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// V4 opt-in. It changes world motion only; size, AI goals and swallowing are unchanged.
export function pondMagnetField(arena){
 const p=arena.player,c=arena.magnetRules||{},core=coreRadius(p),active=!!c.npcAttraction&&!!p.effects.magnet&&!p.dead;
 return {active,x:p.x,y:p.y,coreRadius:core,reach:(core+(c.magnetReach||0))*(active?(p.pondBuffs?.magnet?.strength??c.magnetMultiplier??1):1)};
}
export function beginPondGravity(arena){
 if(!arena.magnetRules?.npcAttraction)return;
 arena.magnetField=pondMagnetField(arena);
 for(const e of arena.entities)delete e.magnetPull;
}
export function applyPondGravity(arena,e,dt){
 const c=arena.magnetRules;if(!c?.npcAttraction||e===arena.player||e.controller?.type!=='ai')return;
 const field=arena.magnetField=pondMagnetField(arena),p=arena.player;
 delete e.magnetPull;
 if(!field.active||e.dead||e.invincible>0||e.effects?.water||!(dt>0))return;
 const r=coreRadius(e),ratio=r/Math.max(.001,field.coreRadius),dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);
 if(ratio>=1||d<=.001||d>=field.reach)return;
 const gap=1-ratio,near=clamp((field.reach-d)/Math.max(1,field.reach-field.coreRadius),0,1),tier=clamp(((p.pondBuffs?.magnet?.strength??c.magnetMultiplier??1.5)-1.5)/.5,0,1);
 const cap=c.magnetNpcSpeedCap??1.45,base=arena.speed(p,false);
 const sizeForce=((c.magnetNpcMinPull??.08)+(c.magnetNpcSizePull??1.32)*gap**.7)*(.85+.30*tier);
 const speed=base*Math.min(cap,sizeForce)*((c.magnetNpcOuterPull??.28)+(1-(c.magnetNpcOuterPull??.28))*near);
 const nx=dx/d,ny=dy/d,travel=Math.min(d,speed*dt),steps=Math.max(1,Math.ceil(travel/6)),step=travel/steps;
 const fromX=e.x,fromY=e.y;
 // Check each short corridor point before moving, so even a long frame cannot
 // pull a tiny NPC through a lotus stem and project it out on the opposite side.
 for(let i=0;i<steps;i++){
  const point={x:clamp(e.x+nx*step,r,arena.world.width-r),y:clamp(e.y+ny*step,r,arena.world.height-r)};
  if(arena.isPointBlockedForNpc?.(point,e))break;
  e.x=point.x;e.y=point.y;
  if(arena.boundarySliding)arena.constrain(e);
 }
 const applied=Math.hypot(e.x-fromX,e.y-fromY);
 if(applied>.00001)e.magnetPull={strength:clamp(applied/dt/Math.max(1,base*cap),0,1),dx:nx,dy:ny,speed:applied/dt,ratio,distance:d};
}
