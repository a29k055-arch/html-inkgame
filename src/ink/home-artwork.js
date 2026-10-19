import {InkFluid} from '../../prototypes/ink/src/fluid.js';
// Dedicated actor-free study field; it samples original RGB, never gameplay or reveal layers.
export class HomeArtwork {
 constructor(canvas,quality='balanced'){this.canvas=canvas;this.fluid=new InkFluid(canvas,quality);this.fluid.backgroundMode=true;this.clock=0;this.activity=0;this.lastPointer=null;this.ready=false;this.dirty=true;}
 resize(){this.dirty=true;const previous=this.canvas.style.display;if(!this.canvas.getBoundingClientRect().width)this.canvas.style.display='block';this.fluid.resize();this.canvas.style.display=previous;if(this.ready)this.draw(0);}
 setQuality(q){this.fluid.quality=q;this.resize();}
 setBackground(image){this.fluid.setBackground(image);this.fluid.clear();this.ready=true;this.dirty=true;this.draw(0);}
 interact(x,y,click=false){const now=performance.now(),p={x:x/innerWidth,y:y/innerHeight,time:now};const previous=this.lastPointer||p,dt=Math.max(.016,(now-previous.time)/1000);let vx=(p.x-previous.x)/dt,vy=(p.y-previous.y)/dt,n=Math.hypot(vx,vy)||1;const force=35*Math.tanh(n*.9)/n;this.fluid.stir({...p,vx:vx*force,vy:vy*force,radius:.035});if(click)for(let i=0;i<5;i++){const a=i/5*Math.PI*2;this.fluid.stir({x:p.x+Math.cos(a)*.012,y:p.y+Math.sin(a)*.012,vx:Math.cos(a)*10,vy:Math.sin(a)*10,radius:.022});}this.lastPointer=p;this.activity=3;this.dirty=true;}
 draw(dt){if(!this.ready||(!this.dirty&&this.activity<=0))return;this.dirty=false;const f=this.fluid;if(this.activity>0){this.activity-=dt;this.clock+=dt;if(this.clock>=1/30){f.step(Math.min(this.clock,1/30));this.clock=0;}}const imageScale=f.aspect>f.imageAspect?[1,f.aspect/f.imageAspect]:[f.imageAspect/f.aspect,1];f.pass('homeArtwork',null,{imageTexture:f.imageTexture,deformation:f.warp.read,imageScale});}
 dispose(){this.fluid.dispose();}
}
