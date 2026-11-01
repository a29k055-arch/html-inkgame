import {HeroWorldTrail,heroPaperTexture} from '../ink/hero-trail.js';
import {REVEAL_CONFIG as C} from './config.js';
// Independent 36-second history. Cache only the visible world region; never rotate old ink.
export class CometTrail extends HeroWorldTrail {
 constructor(){super({trailLifetime:C.trailLifetime,trailMaxWorldLength:C.trailMaxLength,trailMinVisibleLength:1500,trailWidthScale:.95,trailTaper:1.15,trailFade:1.15,trailDiffusion:.8,maxWidth:40,maxPoints:C.maxTrailPoints,minSpacing:12,opacity:.55});this.cacheTime=-Infinity;}
 clear(){super.clear();this.cacheTime=-Infinity;}
 geometry(){return super.geometry().map(p=>{const age=this.time-p.t,t=Math.max(0,(age-this.config.trailLifetime*.65)/(this.config.trailLifetime*.35));return {...p,alpha:Math.max(0,1-t)**1.15};});}
 draw(c,tint='ink',camera){if(!camera)return super.draw(c,tint);const pad=110/camera.scale,view={x:camera.x-pad,y:camera.y-pad,w:camera.width/camera.scale+pad*2,h:camera.height/camera.scale+pad*2};const rebuild=!this.cached||this.time-this.cacheTime>.05||Math.abs(view.x-(this.box?.x||0))>pad*.65||Math.abs(view.y-(this.box?.y||0))>pad*.65;
  if(rebuild){this.cached??=document.createElement('canvas');this.box=view;const scale=Math.min(1,1024/view.w,1024/view.h),w=Math.ceil(view.w*scale),h=Math.ceil(view.h*scale);if(this.cached.width!==w||this.cached.height!==h){this.cached.width=w;this.cached.height=h;}const d=this.cached.getContext('2d');d.setTransform(1,0,0,1,0,0);d.clearRect(0,0,w,h);d.setTransform(scale,0,0,scale,-view.x*scale,-view.y*scale);d.lineCap='round';const rows=this.geometry();for(let i=1;i<rows.length;i++){const a=rows[i-1],b=rows[i];if(Math.max(a.x,b.x)<view.x-80||Math.min(a.x,b.x)>view.x+view.w+80||Math.max(a.y,b.y)<view.y-80||Math.min(a.y,b.y)>view.y+view.h+80)continue;const width=(a.width+b.width)/2,alpha=Math.min(a.alpha,b.alpha),dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;
    for(const [z,opacity] of [[2.2,.10],[1.5,.20],[.8,.65]]){d.globalAlpha=alpha*opacity;d.strokeStyle='#20251f';d.lineWidth=Math.max(.2,width*z*(a.diffusion||1));d.beginPath();d.moveTo(a.x,a.y);d.lineTo(b.x,b.y);d.stroke();}
    for(const sign of [-1,1]){const off=sign*Math.min(55,7*(a.r/18)**.5)*( .55+.45*Math.sin(a.s*.008)**2);d.globalAlpha=alpha*.12;d.lineWidth=Math.max(.5,width*.12);d.beginPath();d.moveTo(a.x-dy/n*off,a.y+dx/n*off);d.lineTo(b.x-dy/n*off,b.y+dx/n*off);d.stroke();}}
   d.globalAlpha=1;d.globalCompositeOperation='destination-in';d.fillStyle=d.createPattern(heroPaperTexture(),'repeat');d.fillRect(view.x,view.y,view.w,view.h);d.globalCompositeOperation='source-over';this.cacheTime=this.time;}
  c.save();c.globalAlpha=.72;c.filter='blur(1.1px)';c.drawImage(this.cached,this.box.x,this.box.y,this.box.w,this.box.h);c.restore();
 }
}
