import {t} from '../ui/i18n.js';
import {DropPool} from './matte-effects.js';
import {InkFluid} from '../../prototypes/ink/src/fluid.js';
import {MaterialInk} from '../../prototypes/ink/src/material.js';
import {QUALITY} from '../../prototypes/ink/src/config.js';
import {PaperMap} from './paper-map.js';
import {GAME_CONFIG as C,clamp} from '../game/config.js';
import {cameraTarget} from '../game/legacy-foundation.js';
import {NpcPainter} from './npc-painter.js';
export class GameRenderer {
 constructor(output,quality,mode){
  this.drops=new DropPool();this.output=output;this.ctx=output.getContext('2d');this.mode=mode;this.clock=0;this.scan=0;this.camera={x:0,y:0,scale:1};this.cameraReady=false;this.mobile=false;
  this.canvas=document.createElement('canvas');this.canvas.style.cssText='position:fixed;left:-10000px;top:0;pointer-events:none;';document.body.append(this.canvas);
  this.onContextLost=e=>{e.preventDefault();document.dispatchEvent(new Event('boku:render-error'));};this.canvas.addEventListener('webglcontextlost',this.onContextLost);
  this.setBounds();this.fluid=new InkFluid(this.canvas,quality);this.fluid.materialMode=true;this.fluid.sizeBoundary=mode==='inkstone';
  // The published player study uses the default single-body solver, not localEntities.
  this.body=new MaterialInk(this.fluid,document.createElement('canvas'));this.npcs=mode==='inkstone'?new NpcPainter():null;this.resize();
 }
 setBounds(){this.viewW=innerWidth;this.viewH=innerHeight;this.canvas.style.width=this.viewW+'px';this.canvas.style.height=this.viewH+'px';}
 resize(){this.setBounds();this.fluid.resize();this.body.reset();this.cameraReady=false;const d=Math.min(devicePixelRatio||1,2);this.output.width=Math.round(this.viewW*d);this.output.height=Math.round(this.viewH*d);this.ctx.setTransform(d,0,0,d,0,0);this.paper?.resize();}
 setQuality(q){this.fluid.quality=q;this.resize();}
 updateCamera(player,dt=1/60,immediate=false,focus=null){
  const old={...this.camera},target=cameraTarget(player,this.viewW,this.viewH,this.mobile);
  const paired=focus&&Math.hypot(player.x-focus.x,player.y-focus.y)<1400,cx=paired?(player.x+focus.x)/2:player.x,cy=paired?(player.y+focus.y)/2:player.y;
  if(paired)target.scale=Math.min(target.scale,Math.max(.28,Math.min(this.viewW/(Math.abs(player.x-focus.x)+2*(focus.r+80)),this.viewH/(Math.abs(player.y-focus.y)+2*(focus.r+120)))));
  const fresh=immediate||!this.cameraReady,zoom=fresh?1:1-Math.exp(-dt*2.76),follow=fresh?1:1-Math.exp(-dt*5);
  this.camera.scale+=(target.scale-this.camera.scale)*zoom;target.x=clamp(cx-this.viewW/this.camera.scale/2,0,Math.max(0,(this.paper?.world||C.world).width-this.viewW/this.camera.scale));target.y=clamp(cy-this.viewH/this.camera.scale*(paired&&this.mobile?.62:.5),0,Math.max(0,(this.paper?.world||C.world).height-this.viewH/this.camera.scale));this.camera.x+=(target.x-this.camera.x)*follow;this.camera.y+=(target.y-this.camera.y)*follow;
  if(!fresh){const ratio=old.scale/this.camera.scale,offset=[(this.camera.x-old.x)*old.scale/this.viewW,1-ratio-(this.camera.y-old.y)*old.scale/this.viewH];this.fluid.reproject(ratio,offset);}
  this.cameraReady=true;
 }
 normalized(player){
  const camera=this.camera;
  return {x:(player.x-camera.x)*camera.scale/this.viewW,y:(player.y-camera.y)*camera.scale/this.viewH,vx:player.vx*camera.scale/this.viewW,vy:player.vy*camera.scale/this.viewH,radius:player.r*(player.effects?.dense?1.32:1)*camera.scale/(.48*Math.min(this.viewW,this.viewH))};
 }
 splash(player){this.body.splash(this.normalized(player),.6);}
 async loadPaper(src){this.paper=new PaperMap(this.output);await this.paper.load(src);}
 // Deliberately accepts ONLY the player. NPC positions/count/skills cannot enter this simulation.
 step(dt,player,started=true){
  const f=this.fluid;if(started&&!player.dead)this.body.update(this.normalized(player),dt);
  this.clock+=dt;if(this.clock>=1/QUALITY[f.quality].simulationHz){f.step(Math.min(this.clock,1/30));this.clock=0;}f.draw(this.clock);
 }
 drawStone(game){
  const c=this.ctx,w=this.viewW,h=this.viewH,p=game.player,cam=this.camera,scale=cam.scale;
  c.clearRect(0,0,w,h);c.fillStyle='#e7dfcc';c.fillRect(0,0,w,h);c.save();c.translate(-cam.x*scale,-cam.y*scale);c.scale(scale,scale);
  // Pure paper/water ground. No paintings, reveal masks, erasure or completion in battle.
  const center=game.center,wash=c.createRadialGradient(center.x,center.y,Math.max(1,game.safeRadius-60),center.x,center.y,game.safeRadius+130);
  wash.addColorStop(0,game.theme==='boss'?'#d9d8cc':'#e8e0cc');wash.addColorStop(.45,game.theme==='boss'?'#bfc4b8':'#d9ddcf');wash.addColorStop(1,game.theme==='boss'?'#aeb7aa':'#edf0e6');c.fillStyle=wash;c.fillRect(0,0,C.world.width,C.world.height);
  if(game.theme==='boss'){const inkWash=c.createRadialGradient(center.x,center.y,80,center.x,center.y,1500);inkWash.addColorStop(0,'#faf8e218');inkWash.addColorStop(.65,'#727b6509');inkWash.addColorStop(1,'#4a53402b');c.fillStyle=inkWash;c.fillRect(0,0,C.world.width,C.world.height);}
  c.strokeStyle='#887d6455';c.lineWidth=3;c.strokeRect(1,1,C.world.width-2,C.world.height-2);
  for(const food of game.foods){if(!this.visible(food,12))continue;c.save();c.translate(food.x,food.y);c.rotate(food.rot);c.fillStyle=`rgba(39,35,27,${food.alpha})`;c.beginPath();if(food.shape==='circle'){c.arc(0,0,food.r,0,Math.PI*2);}else{const sides=food.shape==='square'?4:food.shape==='triangle'?3:5;for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2-Math.PI/2;c.lineTo(Math.cos(a)*food.r,Math.sin(a)*food.r);}c.closePath();}c.fill();c.restore();}
  for(const item of game.items){if(!this.visible(item,20))continue;c.save();c.translate(item.x,item.y);c.rotate(Math.PI/4);c.shadowBlur=10;c.shadowColor='#f7e4a1';c.fillStyle='#b6a16a';c.fillRect(-8,-8,16,16);c.strokeStyle='#faf0cd';c.strokeRect(-6,-6,12,12);c.restore();}
  game.entities.slice(1).forEach((npc,i)=>{if(!npc.dead&&this.visible(npc,npc.r*1.8+25))this.npcs.draw(c,npc,i,game.entities);});
  for(const wave of game.waves){c.save();c.translate(wave.x,wave.y);c.rotate(Math.atan2(wave.aim.y,wave.aim.x));c.strokeStyle=`rgba(66,60,45,${.28*(1-wave.age/C.skillDurations.splash)})`;c.lineWidth=16*(1-wave.age/C.skillDurations.splash);c.beginPath();c.arc(0,0,wave.range*wave.age/C.skillDurations.splash,-1,1);c.stroke();c.restore();}
  c.restore();
  c.save();c.globalAlpha=p.effects.water?.28:p.diluted?.58:1;c.drawImage(this.canvas,0,0,w,h);c.restore();
  c.save();c.textAlign='center';c.font='12px serif';for(const e of game.entities){if(e.dead||!this.visible(e,e.r+40))continue;const x=(e.x-cam.x)*scale,y=(e.y-cam.y)*scale,r=e.r*(e.effects.dense?1.32:1)*scale;c.fillStyle=e===p?'#353127':'#585246';c.fillText(e===p?t('player'):e.id,x,y-r-10);if(e.effects.shield){c.strokeStyle='#a1853c99';c.beginPath();c.arc(x,y,r+4,0,Math.PI*2);c.stroke();}}
  c.restore();
 }
 visible(e,margin){const cam=this.camera,x=(e.x-cam.x)*cam.scale,y=(e.y-cam.y)*cam.scale,r=margin*cam.scale;return x>-r&&x<this.viewW+r&&y>-r&&y<this.viewH+r;}
 drawPaper(dt,run){this.scan+=dt;if(run.painting&&this.scan>=.1){this.paper.absorbWorld(this.canvas,this.camera);this.scan=0;}this.paper.draw(this.camera,dt);const c=this.ctx,cam=this.camera;c.save();c.translate(-cam.x*cam.scale,-cam.y*cam.scale);c.scale(cam.scale,cam.scale);for(const ball of run.projectiles){const r=ball.r*.15,g=c.createRadialGradient(ball.x,ball.y,0,ball.x,ball.y,r);g.addColorStop(0,"#26231de0");g.addColorStop(1,"#26231d00");c.fillStyle=g;c.fillRect(ball.x-r,ball.y-r,r*2,r*2);}c.restore();c.save();c.globalAlpha=.65;c.drawImage(this.canvas,0,0,this.viewW,this.viewH);c.restore();}
 snapshot(){this.paper.updateLayer();const image=document.createElement('canvas');image.width=this.paper.source.width;image.height=this.paper.source.height;const c=image.getContext('2d');c.fillStyle='#ede1c9';c.fillRect(0,0,image.width,image.height);c.globalCompositeOperation='multiply';c.drawImage(this.paper.layer,0,0);return image;}
 dispose(){this.canvas.removeEventListener('webglcontextlost',this.onContextLost);this.fluid.dispose();this.fluid.gl.getExtension('WEBGL_lose_context')?.loseContext();this.canvas.remove();}
}
