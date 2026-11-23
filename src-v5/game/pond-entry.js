const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const extentScale={shrimp:12,fish:11,turtle:3.5,dragon:25};
// Every new body starts wholly outside the artwork and swims across its edge.
// No visible-world birth point is ever returned, even when the paper is crowded.
export function pondEntry(arena,species,r,index=0,rng=Math.random,openingShrimp=false){
 const w=arena.world,extent=r*(extentScale[species]||8)+18,core=r+12;
 if(openingShrimp&&arena.openingShore){
  const top=arena.openingShore==='top',offset=(rng()<.5?-1:1)*(45+rng()*20);
  const across=top?clamp(arena.player.x+offset,core,w.width-core):clamp(arena.player.y+offset,core,w.height-core);
  const point=top?{x:across,y:-extent}:{x:-extent,y:across};
  const target=top?{x:across,y:w.height*.45}:{x:w.width*.45,y:across};
  return {point,entry:{edge:top?2:0,target,age:0},entering:true};
 }
 let best=null,score=-Infinity;
 for(let i=0;i<32;i++){
  const edge=(index+i)%4,t=.08+rng()*.84,point=edge===0?{x:-extent,y:t*w.height}:edge===1?{x:w.width+extent,y:t*w.height}:edge===2?{x:t*w.width,y:-extent}:{x:t*w.width,y:w.height+extent};
  const target={x:edge===0?w.width*.45:edge===1?w.width*.55:clamp(point.x,core+150,w.width-core-150),y:edge===2?w.height*.45:edge===3?w.height*.55:clamp(point.y,core+150,w.height-core-150)},inside={x:clamp(point.x,core,w.width-core),y:clamp(point.y,core,w.height-core)};
  let clear=Math.hypot(inside.x-arena.player.x,inside.y-arena.player.y)-arena.player.r-r-140;
  for(const e of arena.entities||[])if(!e.dead)clear=Math.min(clear,Math.hypot(point.x-e.x,point.y-e.y)-r-e.r-18);
  for(const leaf of arena.items||[])if(leaf.kind==='leaf')clear=Math.min(clear,Math.hypot(inside.x-leaf.x,inside.y-leaf.y)-r-Math.min(42,leaf.r*.18)-16);
  if(clear>score){score=clear;best={point,entry:{edge,target,age:0},entering:true};}
  if(clear>=0)break;
 }
 return best;
}
export function advancePondEntry(e,arena,dt){
 if(!e.entering||!e.entry)return false;
 const t=e.entry.target,dx=t.x-e.x,dy=t.y-e.y,d=Math.hypot(dx,dy)||1,speed=Math.max(12,arena.speed(e,false)),step=Math.min(d,speed*Math.max(0,dt));
 e.vx=dx/d*speed;e.vy=dy/d*speed;e.x+=dx/d*step;e.y+=dy/d*step;e.aim={x:dx/d,y:dy/d};e.entry.age+=dt;
 const r=arena.radius(e)+6,w=arena.world;
 if(e.x>=r&&e.y>=r&&e.x<=w.width-r&&e.y<=w.height-r){
  e.entering=false;e.invincible=Math.max(e.invincible||0,.8);e.controller.goal={...t};e.controller.arrivalGoal={...t};e.controller.think=.8;e.controller.intent='wander';delete e.erasePrevious;arena.constrain(e);
 }
 return true;
}
const rates={fish:2,turtle:.8,dragon:1.5};
export function steerLivingVelocity(e,desired,speed,dt){
 const species=e.form?.remaining>0?e.form.species:e.species,rate=rates[species],input=Math.hypot(desired.x,desired.y);
 if(!rate||input<.01)return null;
 const target=Math.atan2(desired.y,desired.x),moving=Math.hypot(e.vx||0,e.vy||0)>4,from=e.motionHeading??(moving?Math.atan2(e.vy,e.vx):Math.atan2(e.aim?.y||0,e.aim?.x||1)),delta=Math.atan2(Math.sin(target-from),Math.cos(target-from));
 const angle=from+clamp(delta,-rate*dt,rate*dt);e.motionHeading=angle;
 // Curving retains forward motion: a U turn traces an arc rather than parking
 // the torso and spinning the image around its logical centre.
 const blend=1-Math.exp(-dt*(species==='turtle'?1.8:4)),magnitude=(moving?Math.hypot(e.vx,e.vy):0)+(speed*input-(moving?Math.hypot(e.vx,e.vy):0))*blend;
 return {x:Math.cos(angle)*magnitude,y:Math.sin(angle)*magnitude};
}
