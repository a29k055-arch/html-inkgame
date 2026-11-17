import {HeroWorldTrail} from '../ink/hero-trail.js';
import {HERO_PRESETS,DEFAULT_HERO_PRESET,heroLargeMix} from '../ink/hero-presets.js';
let grain;
function texture(){if(grain)return grain;grain=document.createElement('canvas');grain.width=grain.height=128;const c=grain.getContext('2d'),im=c.createImageData(128,128);for(let i=0;i<128*128;i++){const noise=Math.sin(i*127.1+311.7)*43758.5453;im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=255;im.data[i*4+3]=238+Math.floor((noise-Math.floor(noise))*17);}c.putImageData(im,0,0);return grain;}
export class CometTrail extends HeroWorldTrail {
 constructor({preset=DEFAULT_HERO_PRESET}={}){super({trailLifetime:1.8,trailMaxWorldLength:1600,trailMinVisibleLength:300,trailWidthScale:1,trailTaper:1.7,trailFade:1.3,trailDiffusion:.55,maxWidth:112,maxPoints:180,minSpacing:3,opacity:.7});this.setPreset(preset);this.cacheTime=-Infinity;}
 setPreset(key){this.presetKey=HERO_PRESETS[key]?key:DEFAULT_HERO_PRESET;this.preset=HERO_PRESETS[this.presetKey];Object.assign(this.config,{widthExponent:this.preset.widthPower,maxWidth:this.preset.widthMax,trailWidthScale:this.preset.width});this.clear();}
 clear(){super.clear();this.cacheTime=-Infinity;}
 sample(x,y,r,dt=0,speed=0,speedRatio){
 this.largeMix=this.preset.sizeAdaptive?heroLargeMix(this.preset,r):0;
 const swing=this.preset.sizeSwing?this.largeMix:0;
 this.config.trailWidthScale=this.preset.width*(1-.20*this.largeMix);
 const q=Math.max(.5,r/18),absoluteMotion=Math.min(1,Math.max(.35,speed/220));
 // Blend only large M bodies to dimensionless locomotion. A 90u/s giant at full
 // locomotion must not be treated as a sluggish 40%-speed small body.
 const relative=Math.min(1.35,Math.max(0,Number.isFinite(speedRatio)?speedRatio:speed/Math.max(82,110*(1-.25*Math.max(0,Math.min(1,(r-9)/161))**.85))));
 const active=relative<=.025?0:Math.min(1,(relative-.025)/.15),relativeMotion=Math.min(1.18,Math.max(.62,relative));
 const motion=absoluteMotion+(relativeMotion-absoluteMotion)*swing;
 this.config.trailLifetime=Math.min(this.preset.maxLife,this.preset.life*q**.18*(.7+.3*motion));
 this.config.trailLifetime*=1-.22*this.largeMix;
 this.config.trailLifetime=Math.min(this.preset.maxLife,this.config.trailLifetime+swing*active*.95);this.config.life=this.config.trailLifetime;
 const sizeLength=this.preset.length*(q**Math.min(.34,this.preset.lengthPower))*Math.min(1,2.2/q**.3),originalLength=Math.min(900,sizeLength*(.6+.4*motion));
 // Cap the body-size budget before applying relative movement: otherwise the old
 // 900u saturation erases every distinction between low/normal/high giant speed.
 const relativeLength=Math.min(900,sizeLength)*(.6+.4*motion);
 this.config.trailMaxWorldLength=Math.min(1200,(originalLength+(relativeLength-originalLength)*swing)*(1+swing*active*.30));
 this.config.trailMinVisibleLength=Math.min(300,40+r*3.2);super.sample(x,y,r,dt,speed);
 }
 geometry(){const rows=super.geometry();if(!this.preset.sizeSwing||!(this.largeMix>0)||rows.length<3)return rows;
  // Interpolate the committed world-space polyline with bounded quadratic pieces.
  // It never rotates historical points with the current heading or invents a periodic wave.
  const result=[rows[0]],mix=(a,b,t)=>{const out={...a};for(const key of ['x','y','width','alpha','diffusion','s'])out[key]=a[key]+(b[key]-a[key])*t;return out;};
  for(let i=1;i<rows.length-1;i++){const a=rows[i-1],p=rows[i],b=rows[i+1],start=mix(a,p,.5),end=mix(p,b,.5);if(i===1)result.push(start);
   for(let step=1;step<=3;step++){const t=step/3,left=mix(start,p,t),right=mix(p,end,t);result.push(mix(left,right,t));}}
  result.push(rows.at(-1));return result;
 }
 draw(c,tint='ink',camera,contact=false){if(this.presetKey==='reference'||!camera||!(this.preset.opacity>0))return;const pad=120/camera.scale,view={x:camera.x-pad,y:camera.y-pad,w:camera.width/camera.scale+pad*2,h:camera.height/camera.scale+pad*2};if(!this.cached||this.time-this.cacheTime>.033||Math.abs(view.x-(this.box?.x||0))>pad*.65||Math.abs(view.y-(this.box?.y||0))>pad*.65){this.cached??=document.createElement('canvas');this.layer??=document.createElement('canvas');this.box=view;const scale=Math.min(camera.scale*Math.min(2,globalThis.devicePixelRatio||1),2048/view.w,2048/view.h),w=Math.ceil(view.w*scale),h=Math.ceil(view.h*scale);for(const canvas of [this.cached,this.layer])if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}const d=this.cached.getContext('2d');d.setTransform(1,0,0,1,0,0);d.clearRect(0,0,w,h);const rows=this.geometry(),latest=rows.at(-1)?.alpha||0;
 // Each softness band is composited ONCE. Wide round caps cannot accumulate into oil.
 for(const [spread,opacity] of [[2.1,.10],[1.35,.20],[.72,.46]]){const b=this.layer.getContext('2d');b.setTransform(1,0,0,1,0,0);b.clearRect(0,0,w,h);b.setTransform(scale,0,0,scale,-view.x*scale,-view.y*scale);for(let i=1;i<rows.length;i++){const a=rows[i-1],q=rows[i],dx=q.x-a.x,dy=q.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,wa=a.width*spread*.5*Math.sqrt(a.alpha),wb=q.width*spread*.5*Math.sqrt(q.alpha);if(Math.min(a.alpha,q.alpha)<.005)continue;const wobbleA=Math.sin(a.s*.025)*wa*.045,wobbleB=Math.sin(q.s*.025)*wb*.045,ax=a.x+nx*wobbleA,ay=a.y+ny*wobbleA,bx=q.x+nx*wobbleB,by=q.y+ny*wobbleB,g=b.createLinearGradient(ax,ay,bx,by);g.addColorStop(0,'rgba(36,44,35,'+a.alpha+')');g.addColorStop(1,'rgba(36,44,35,'+q.alpha+')');b.fillStyle=g;b.beginPath();b.moveTo(ax+nx*wa,ay+ny*wa);b.lineTo(bx+nx*wb,by+ny*wb);b.lineTo(bx-nx*wb,by-ny*wb);b.lineTo(ax-nx*wa,ay-ny*wa);b.closePath();b.fill();}d.globalAlpha=opacity;d.filter='blur('+Math.max(.6,spread*1.8)+'px)';d.drawImage(this.layer,0,0);d.filter='none';}
 d.setTransform(scale,0,0,scale,-view.x*scale,-view.y*scale);d.strokeStyle='#30392c';d.lineCap='round';for(let i=1;i<rows.length;i++){const a=rows[i-1],b=rows[i],dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;if(Math.sin(a.s*.023)<=0)continue;const off=Math.sin(a.s*.013)*Math.min(12,a.width*.22);d.globalAlpha=Math.min(a.alpha,b.alpha)*this.preset.filaments;d.lineWidth=Math.max(.4,a.width*.05);d.beginPath();d.moveTo(a.x-dy/n*off,a.y+dx/n*off);d.lineTo(b.x-dy/n*off,b.y+dx/n*off);d.stroke();}d.globalAlpha=1;d.globalCompositeOperation='destination-in';d.fillStyle=d.createPattern(texture(),'repeat');d.fillRect(view.x,view.y,view.w,view.h);d.globalCompositeOperation='source-over';this.cacheTime=this.time;}
 c.save();c.globalAlpha=this.preset.opacity*(1-.20*(this.largeMix||0));c.filter='none';c.drawImage(this.cached,this.box.x,this.box.y,this.box.w,this.box.h);c.restore();}
}
