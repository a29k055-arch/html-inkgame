import {DROP_ALPHA,DROP_SHAPE,dropStage,sampleDrop} from './drop-shape.js';
import {REVEAL_CONFIG as C} from './config.js';
// Persistent reveal state, never derived from transient Flow Trail pixels.
export class RevealMask {
 constructor(config={}){this.config={...C,...config};const c=this.config;this.width=c.width;this.height=c.height;this.cols=c.columns;this.rows=Math.ceil(this.cols*this.height/this.width);this.cells=new Float32Array(this.cols*this.rows);this.sum=0;this.version=0;this.blooms=[];}
 get completion(){return this.sum/this.cells.length;}
 at(x,y){const i=Math.max(0,Math.min(this.cols-1,Math.floor(x/this.width*this.cols))),j=Math.max(0,Math.min(this.rows-1,Math.floor(y/this.height*this.rows)));return this.cells[j*this.cols+i];}
 brush(x,y,r,amount,erase=false){const sx=this.width/this.cols,sy=this.height/this.rows;let changed=false;
  for(let j=Math.max(0,Math.floor((y-r*1.12)/sy));j<=Math.min(this.rows-1,Math.ceil((y+r*1.12)/sy));j++)for(let i=Math.max(0,Math.floor((x-r*1.12)/sx));i<=Math.min(this.cols-1,Math.ceil((x+r*1.12)/sx));i++){
   const dx=(i+.5)*sx-x,dy=(j+.5)*sy-y,a=Math.atan2(dy,dx),edge=erase?1:1+.055*Math.sin(a*5+x*.017)+.035*Math.sin(a*9+y*.011),d=Math.hypot(dx,dy)/(r*edge),t=Math.max(0,Math.min(1,(1-d)/.28)),soft=t*t*(3-2*t),k=j*this.cols+i,old=this.cells[k];
   // Exponential erosion is frame-rate independent, bounded, and leaves no hard rectangles.
   const next=Math.fround(erase?old*Math.exp(-Math.max(0,amount)*soft):Math.max(old,Math.min(1,amount)*soft));if(next!==old){this.cells[k]=next;this.sum+=next-old;changed=true;}
  }if(changed)this.version++;
 }
 reveal(x,y,r){this.blooms.push({x,y,r,angle:Math.sin(x*.13+y*.07)*2.8,age:0});if(this.blooms.length>96)this.blooms.shift();}
 consume(event){if(event.kind!=='enemy')return false;this.reveal(event.x,event.y,Math.min(this.config.consumeRadiusMax,this.config.consumeRadius+Math.max(0,event.r)*this.config.consumeRadiusGrowth));return true;}
 erode(x,y,r,dt){this.brush(x,y,Math.max(1,r*this.config.erosionRadiusScale),this.config.erosionPerSecond*Math.max(0,dt),true);}
 stampDrop(b){const t=Math.min(1,b.age/this.config.bloomDuration),r=b.r,stage=dropStage(t),sx=this.width/this.cols,sy=this.height/this.rows,co=Math.cos(b.angle),si=Math.sin(b.angle),n=DROP_SHAPE.size;let changed=false;for(let y=Math.max(0,Math.floor((b.y-r*1.42)/sy));y<=Math.min(this.rows-1,Math.ceil((b.y+r*1.42)/sy));y++)for(let x=Math.max(0,Math.floor((b.x-r*1.42)/sx));x<=Math.min(this.cols-1,Math.ceil((b.x+r*1.42)/sx));x++){const dx=(x+.5)*sx-b.x,dy=(y+.5)*sy-b.y,u=(dx*co+dy*si)/(r*2)+.5,v=(-dx*si+dy*co)/(r*2)+.5;if(u<0||v<0||u>=1||v>=1)continue;const alpha=sampleDrop(stage,u,v)/255,k=y*this.cols+x,old=this.cells[k],value=Math.fround(Math.max(old,alpha));if(value!==old){this.cells[k]=value;this.sum+=value-old;changed=true;}}if(changed)this.version++;}
 update(dt){for(const b of this.blooms){b.age+=Math.max(0,dt);this.stampDrop(b);}this.blooms=this.blooms.filter(b=>b.age<this.config.bloomDuration);}
}
