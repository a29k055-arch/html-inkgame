import {MaterialInk} from './material.js';

// One travelling spine drives both the painted silhouette and the advected ink reservoir.
export class FishInk extends MaterialInk {
 constructor(fluid,canvas){super(fluid,canvas);this.heading=0;this.phase=0;this.activity=0;this.turn=0;}
 reset(){super.reset();this.heading=0;this.phase=0;this.activity=0;this.turn=0;}
 update(entity,dt){
  const f=this.fluid,r=this.radius(entity),speed=Math.hypot(entity.vx*f.aspect,entity.vy);
  let angularRate=0;
  if(speed>.012){const target=Math.atan2(entity.vy,entity.vx*f.aspect),delta=Math.atan2(Math.sin(target-this.heading),Math.cos(target-this.heading));const change=delta*(1-Math.exp(-dt*6));this.heading+=change;angularRate=change/Math.max(dt,.001);}
  this.activity+=(Math.min(speed/.65,1)-this.activity)*(1-Math.exp(-dt*3.8));
  this.turn+=(Math.max(-.75,Math.min(.75,angularRate*.16))-this.turn)*(1-Math.exp(-dt*5));
  this.phase+=dt*(1.7+this.activity*6.5);
  // Keep the original liquid sail, pressure, curl and core supply.
  super.update(entity,dt);
  f.fish={heading:this.heading,phase:this.phase,speed,activity:this.activity,turn:this.turn,flow:[entity.vx,-entity.vy]};
  f.pass('fishGuide',f.v.write,{field:f.d.read,velocity:f.v.read,...f.fishUniforms(),dt});f.v.swap();
  f.pass('fishFeed',f.d.write,{field:f.d.read,...f.fishUniforms(),dt});f.d.swap();
  this.seeded=true;
 }
}
