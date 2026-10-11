import {MaterialInk} from './material.js';

// Same controller, size envelope and advected wake; only the visible reservoir changes.
export class FishInk extends MaterialInk {
 constructor(fluid,canvas){super(fluid,canvas);this.heading=0;this.phase=0;}
 reset(){super.reset();this.heading=0;this.phase=0;}
 seed(entity){const f=this.fluid,r=this.radius(entity),c=Math.cos(this.heading),s=Math.sin(this.heading);for(let i=0;i<8;i++){const x=(.35-i*.18)*r;f.inject({x:entity.x+x*c/f.aspect,y:entity.y+x*s,radius:r*(i<4?.22:.14),intensity:.55});}this.seeded=true;}
 update(entity,dt){const speed=Math.hypot(entity.vx*this.fluid.aspect,entity.vy);if(speed>.015){const target=Math.atan2(entity.vy,entity.vx*this.fluid.aspect),delta=Math.atan2(Math.sin(target-this.heading),Math.cos(target-this.heading));this.heading+=delta*(1-Math.exp(-dt*9));}this.phase+=dt*(3.4+Math.min(speed,.9)*9);super.update(entity,dt);this.fluid.fish={heading:this.heading,phase:this.phase,speed};}
}
