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
 reveal(x,y,r){this.blooms.push({x,y,r,age:0});if(this.blooms.length>96)this.blooms.shift();}
 consume(event){if(event.kind!=='enemy')return false;this.reveal(event.x,event.y,Math.min(this.config.consumeRadiusMax,this.config.consumeRadius+Math.max(0,event.r)*this.config.consumeRadiusGrowth));return true;}
 erode(x,y,r,dt){this.brush(x,y,Math.max(1,r*this.config.erosionRadiusScale),this.config.erosionPerSecond*Math.max(0,dt),true);}
 update(dt){for(const b of this.blooms){b.age+=Math.max(0,dt);const t=Math.min(1,b.age/this.config.bloomDuration),spread=1-(1-t)**2.2;this.brush(b.x,b.y,b.r*(.10+.90*spread),Math.min(1,t*3));if(t>.15)for(let i=0;i<3;i++){const angle=i*2.399+b.x*.003,offset=b.r*.25;this.brush(b.x+Math.cos(angle)*offset,b.y+Math.sin(angle)*offset,b.r*spread*.70,Math.min(1,(t-.1)*2));}}this.blooms=this.blooms.filter(b=>b.age<this.config.bloomDuration);}
}
