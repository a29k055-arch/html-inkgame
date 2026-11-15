import {DROP_ALPHA,DROP_SHAPE,dropStage,sampleDrop} from './drop-shape.js';
import {REVEAL_CONFIG as C} from './config.js';
// Persistent reveal state, never derived from transient Flow Trail pixels.
// Real source-alpha extent, shared with the on-screen Drops texture (not a circular mask).
export const DROP_ALPHA_EXTENT=(()=>{let max=0;const n=DROP_SHAPE.size;for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(DROP_ALPHA[y*n+x])max=Math.max(max,Math.hypot((x+.5)/n-.5,(y+.5)/n-.5)*2);return max;})();
export function consumeBloomRadius(radius,config=C){const r=Math.max(0,Number(radius)||0),u=Math.max(0,Math.min(1,(r-(config.consumeRadiusGrowthStart??18))/Math.max(1,config.consumeRadiusGrowthRange??80))),smooth=u*u*(3-2*u),factor=config.consumeRadiusGrowth+(config.consumeRadiusGrowthBonus||0)*smooth;return Math.min(config.consumeRadiusMax,config.consumeRadiusTargetCap*r/DROP_ALPHA_EXTENT,(config.consumeRadius||0)+r*factor);}
export class RevealMask {
 constructor(config={}){this.config={...C,...config};const c=this.config;this.width=c.width;this.height=c.height;this.cols=c.columns;this.rows=Math.ceil(this.cols*this.height/this.width);this.cells=new Float32Array(this.cols*this.rows);this.sum=0;this.version=0;this.blooms=[];this.weights=null;this.weightTotal=0;this.weightedSum=0;}
 // Area completion and ink-area completion are O(1): both sums are maintained on every write.
 get completion(){return this.sum/this.cells.length;}
 get weightedCompletion(){return this.weightTotal>1e-6?this.weightedSum/this.weightTotal:0;}
 setWeights(weights){this.weights=weights||null;let total=0,weighted=0;if(this.weights){for(let i=0;i<this.cells.length;i++){const w=this.weights[i];total+=w;weighted+=this.cells[i]*w;}}this.weightTotal=total;this.weightedSum=weighted;return total;}
 // Only for tests/tools that write cells directly; production never needs a full pass.
 recount(){let sum=0,weighted=0,total=0;for(let i=0;i<this.cells.length;i++){const v=this.cells[i];sum+=v;if(this.weights){const w=this.weights[i];total+=w;weighted+=v*w;}}this.sum=sum;this.weightedSum=weighted;this.weightTotal=total;this.version++;return sum;}
 at(x,y){const i=Math.max(0,Math.min(this.cols-1,Math.floor(x/this.width*this.cols))),j=Math.max(0,Math.min(this.rows-1,Math.floor(y/this.height*this.rows)));return this.cells[j*this.cols+i];}
 // Single write funnel for every permanent cell change (brush, drop, contact, finale).
 commit(k,v){const old=this.cells[k];if(v===old)return false;this.cells[k]=v;this.sum+=v-old;if(this.weights)this.weightedSum+=(v-old)*this.weights[k];return true;}
 raiseCell(k,alpha){const v=Math.fround(Math.min(1,Math.max(0,alpha)));return v<=this.cells[k]?false:this.commit(k,v);}
 fill(value){this.cells.fill(value);this.sum=value*this.cells.length;this.weightedSum=this.weights?this.weightTotal*value:0;this.version++;}
 brush(x,y,r,amount,erase=false){const sx=this.width/this.cols,sy=this.height/this.rows;let changed=false;
  for(let j=Math.max(0,Math.floor((y-r*1.12)/sy));j<=Math.min(this.rows-1,Math.ceil((y+r*1.12)/sy));j++)for(let i=Math.max(0,Math.floor((x-r*1.12)/sx));i<=Math.min(this.cols-1,Math.ceil((x+r*1.12)/sx));i++){
   const dx=(i+.5)*sx-x,dy=(j+.5)*sy-y,a=Math.atan2(dy,dx),edge=erase?1:1+.055*Math.sin(a*5+x*.017)+.035*Math.sin(a*9+y*.011),d=Math.hypot(dx,dy)/(r*edge),t=Math.max(0,Math.min(1,(1-d)/.28)),soft=t*t*(3-2*t),k=j*this.cols+i;
   // Linear pigment loss is dt-based, bounded, and soft at the actual body edge.
   if(this.commit(k,Math.fround(erase?Math.max(0,this.cells[k]-Math.max(0,amount)*soft):Math.max(this.cells[k],Math.min(1,amount)*soft))))changed=true;
  }if(changed)this.version++;
 }
 reveal(x,y,r){this.blooms.push({x,y,r,angle:Math.sin(x*.13+y*.07)*2.8,age:0});if(this.blooms.length>96)this.blooms.shift();}
 consume(event){if(event.kind!=='enemy')return false;this.reveal(event.x,event.y,consumeBloomRadius(event.coreRadius??event.r,this.config));return true;}
 erode(x,y,r,dt){const cap=this.config.erosionMaxRadius||Infinity;this.brush(x,y,Math.min(cap,Math.max(1,r*this.config.erosionRadiusScale)),this.config.erosionPerSecond*Math.max(0,dt),true);}
 stampDrop(b){const t=Math.min(1,b.age/this.config.bloomDuration),r=b.r,stage=dropStage(t),previousStage=b.previousAge===undefined?null:dropStage(b.previousAge/this.config.bloomDuration),sx=this.width/this.cols,sy=this.height/this.rows,co=Math.cos(b.angle),si=Math.sin(b.angle),n=DROP_SHAPE.size;let changed=false;for(let y=Math.max(0,Math.floor((b.y-r*1.42)/sy));y<=Math.min(this.rows-1,Math.ceil((b.y+r*1.42)/sy));y++)for(let x=Math.max(0,Math.floor((b.x-r*1.42)/sx));x<=Math.min(this.cols-1,Math.ceil((b.x+r*1.42)/sx));x++){const dx=(x+.5)*sx-b.x,dy=(y+.5)*sy-b.y,u=(dx*co+dy*si)/(r*2)+.5,v=(-dx*si+dy*co)/(r*2)+.5;if(u<0||v<0||u>=1||v>=1)continue;const alpha=sampleDrop(stage,u,v)/255,previous=previousStage?sampleDrop(previousStage,u,v)/255:0,k=y*this.cols+x;if(this.commit(k,Math.fround(Math.min(1,this.cells[k]+Math.max(0,alpha-previous)))))changed=true;}if(changed)this.version++;b.previousAge=b.age;}
 update(dt){for(const b of this.blooms){b.age+=Math.max(0,dt);this.stampDrop(b);}this.blooms=this.blooms.filter(b=>b.age<this.config.bloomDuration);}
}
