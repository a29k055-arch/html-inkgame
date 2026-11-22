// Read only player-fluid + world-trail alpha, never NPCs or the painting.
// At most 33ms latency; high travel forces a sample without inventing a brush circle.
export class InkContactSampler {
 constructor(){this.canvas=document.createElement('canvas');this.ctx=this.canvas.getContext('2d',{willReadFrequently:true});this.clock=0;this.samples=0;this.lastMs=0;this.previous=null;}
 sample(renderer,run,dt){this.clock+=dt;if(run.player.dead||run.state!=='playing')return false;const p=run.player,cam=renderer.camera,moved=this.previous?Math.hypot(p.x-this.previous.x,p.y-this.previous.y)*cam.scale:Infinity;
  if(this.clock<1/(run.config.contactHz||30)&&moved<3)return false;this.clock=0;this.previous={x:p.x,y:p.y};
  const begin=performance.now(),w=renderer.viewW,h=renderer.viewH,scale=Math.min(1,512/Math.max(w,h)),c=this.canvas,d=this.ctx,cw=Math.max(2,Math.round(w*scale)),ch=Math.max(2,Math.round(h*scale));if(c.width!==cw||c.height!==ch){c.width=cw;c.height=ch;}d.setTransform(c.width/w,0,0,c.height/h,0,0);d.clearRect(0,0,w,h);
  d.save();d.beginPath();d.rect(-cam.x*cam.scale,-cam.y*cam.scale,run.world.width*cam.scale,run.world.height*cam.scale);d.clip();d.translate(-cam.x*cam.scale,-cam.y*cam.scale);d.scale(cam.scale,cam.scale);renderer.trail.draw(d,'ink',{...cam,width:w,height:h},true);d.restore();
  d.save();d.beginPath();d.rect(-cam.x*cam.scale,-cam.y*cam.scale,run.world.width*cam.scale,run.world.height*cam.scale);d.clip();d.globalAlpha=p.effects.water?.28:p.diluted?.58:1;d.drawImage(renderer.canvas,0,0,w,h);d.restore();
  if(p.form&&renderer.npcs?.drawPlayerContact){d.save();d.beginPath();d.rect(-cam.x*cam.scale,-cam.y*cam.scale,run.world.width*cam.scale,run.world.height*cam.scale);d.clip();d.translate(-cam.x*cam.scale,-cam.y*cam.scale);d.scale(cam.scale,cam.scale);renderer.npcs.drawPlayerContact(d,p);d.restore();}const image=d.getImageData(0,0,c.width,c.height);run.applyInkContact(image,cam,w,h);this.samples++;this.lastMs=performance.now()-begin;return true;
 }
}
