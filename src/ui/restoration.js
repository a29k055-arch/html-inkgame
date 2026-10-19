import {PaperReveal} from '../../prototypes/ink/src/paper.js';
import {CAMPAIGN_CONFIG as C} from '../game/config.js';
import {fragmentIds,getSave,restoreArtwork} from '../data/save.js';

const seam=(which,y)=>which===0?0:which===3?1:which/3+.027*Math.sin(y*18+which*.8)+.012*Math.sin(y*37);
export function fragmentPath(c,index,w,h){c.beginPath();for(let i=0;i<=40;i++){const y=i/40;c.lineTo(seam(index,y)*w,y*h);}for(let i=40;i>=0;i--){const y=i/40;c.lineTo(seam(index+1,y)*w,y*h);}c.closePath();}

class RepairPaper extends PaperReveal {
 constructor(canvas,complete){super(canvas);this.complete=complete;this.abort=new AbortController();this.pointer=null;this.previous=null;this.assembly=0;this.done=false;this.dirty=true;const opt={signal:this.abort.signal};
  canvas.addEventListener('pointerdown',e=>{if(!this.canScratch||this.pointer!==null)return;this.pointer=e.pointerId;canvas.setPointerCapture(e.pointerId);this.scratch(e);},opt);
  canvas.addEventListener('pointermove',e=>{if(e.pointerId===this.pointer)this.scratch(e);},opt);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(e.pointerId===this.pointer){this.pointer=null;this.previous=null;}},opt);
 }
 get canScratch(){return this.parts?.length===3&&!this.done&&this.assembly>=1.4;}
 scratch(e){if(!this.canScratch)return;const b=this.canvas.getBoundingClientRect(),r=this.rect,x=(e.clientX-b.left-r.x)/r.w,y=(e.clientY-b.top-r.y)/r.h;if(x<0||x>1||y<0||y>1)return;const mx=x*this.mask.width,my=y*this.mask.height,c=this.mc,previous=this.previous||{x:mx,y:my},steps=Math.max(1,Math.ceil(Math.hypot(mx-previous.x,my-previous.y)/9)),radius=this.mask.width*.055;
  for(let i=1;i<=steps;i++){const px=previous.x+(mx-previous.x)*i/steps,py=previous.y+(my-previous.y)*i/steps,g=c.createRadialGradient(px,py,radius*.22,px,py,radius);g.addColorStop(0,'#fff');g.addColorStop(.6,'#fffc');g.addColorStop(1,'#fff0');c.fillStyle=g;c.fillRect(px-radius,py-radius,radius*2,radius*2);}this.previous={x:mx,y:my};this.dirty=true;
 }
 drawFrame(dt){if(!this.ready)return;this.assembly+=dt;const c=this.ctx,r=this.rect;c.clearRect(0,0,this.w,this.h);c.fillStyle='#e9dfca';c.fillRect(0,0,this.w,this.h);
  const join=this.parts.length===3?1-Math.min(1,this.assembly/1.4):1;
  for(let i=0;i<3;i++){c.save();c.translate(r.x,r.y);c.translate((i-1)*25*join,(i%2?12:-9)*join);c.translate(r.w/2,r.h/2);c.rotate((i-1)*.035*join);c.translate(-r.w/2,-r.h/2);fragmentPath(c,i,r.w,r.h);c.clip();if(this.parts.includes(i)){c.drawImage(this.source,0,0,r.w,r.h);}else{c.fillStyle='#a69b8250';c.fillRect(0,0,r.w,r.h);}c.restore();}
  if(this.parts.length===3&&join===0&&!this.done){if(this.dirty){const data=this.mc.getImageData(0,0,this.mask.width,this.mask.height).data;let sum=0;for(let i=0;i<this.target.length;i++)sum+=this.target[i]*data[i*4+3]/255;this.completion=this.total?sum/this.total:0;this.dirty=false;if(this.completion>=C.repairThreshold){this.done=true;this.justRestored=true;this.completion=1;if(restoreArtwork(C.artworkId))this.complete(this.source);}}
   // The pale paper veil is removed by the inherited reveal mask; original colors stay intact.
   if(!this.done){this.lc.clearRect(0,0,this.layer.width,this.layer.height);this.lc.globalCompositeOperation='source-over';this.lc.fillStyle='#e9dfcae0';this.lc.fillRect(0,0,this.layer.width,this.layer.height);this.lc.globalCompositeOperation='destination-out';this.lc.drawImage(this.mask,0,0,this.layer.width,this.layer.height);this.lc.globalCompositeOperation='source-over';c.drawImage(this.layer,r.x,r.y,r.w,r.h);}
  }
 }
}

export class Restoration {
 constructor(dialog,canvas,art,complete){this.dialog=dialog;this.paper=new RepairPaper(canvas,complete);this.art=art;this.last=0;this.frame=null;dialog.addEventListener('close',()=>{cancelAnimationFrame(this.frame);this.last=0;});addEventListener('resize',()=>{if(dialog.open)this.paper.resize();});}
 async open(){if(this.dialog.open)return;this.dialog.showModal();if(!this.paper.ready)await this.paper.load(this.art.src);else this.paper.resize();this.paper.reset();this.paper.pointer=null;this.paper.previous=null;this.paper.parts=fragmentIds(C.artworkId);this.paper.assembly=0;this.paper.done=getSave().progress.restoredArtworks.includes(C.artworkId);this.paper.completion=this.paper.done?1:0;this.paper.dirty=true;this.paper.justRestored=false;this.dialog.classList.remove('restored');
  const tick=now=>{if(!this.dialog.open)return;const dt=this.last?Math.min(.05,(now-this.last)/1000):0;this.last=now;this.paper.drawFrame(dt);const ready=this.paper.parts.length===3;this.dialog.querySelector('[data-repair-status]').textContent=this.paper.done?'修復完了 · ギャラリーに収蔵しました':ready?(this.paper.canScratch?`指やマウスで紙をなぞる · 復元 ${(this.paper.completion*100).toFixed(0)}%`:'三つの断片が、ひとつの景色へ'):`画巻の断片 ${this.paper.parts.length} / 3 · 特殊な墨を倒して集めましょう`;this.dialog.classList.toggle('restored',this.paper.done&&this.paper.justRestored);this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);
 }
}
