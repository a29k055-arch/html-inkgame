import {CONTACT_CONFIG as VISUAL,GAME_CONFIG} from '../game/config.js';
import {coreRadius,visualRadius} from '../game/alien-geometry.js';
import {alienBody,alienDetails} from './alien-ink.js';

// Presentation-only warning: compares the same current core radii as swallowing.
export const NPC_DANGER_STYLE=Object.freeze({nearMinimum:8,nearMaximum:20,nearPlayerScale:.15,thornOutlineScale:1.50,eyeOutlineScale:1.20,gapPixels:5,linePixels:1.15,minAlpha:.16,maxAlpha:.32,
 // Anything at least this close to the player's size is framed, and the ring thickens with threat.
 compareRatio:.85,lethalRatio:1.28,minLinePixels:1.1,maxLinePixels:4.4,lethalLinePixels:5.6,contactSlack:6});
export function npcDangerState(enemy,player,scale=1){
 if(!player||!enemy?.v4Visual||enemy===player||enemy.dead||player?.dead||enemy.effects?.water||player?.effects?.water)return null;
 const enemyCore=coreRadius(enemy),playerCore=coreRadius(player),threshold=playerCore*GAME_CONFIG.consumeRatio;
 const ratio=enemyCore/Math.max(1,playerCore);
 // Shown for every comparable-or-bigger body, not only the one currently chasing.
 if(ratio<NPC_DANGER_STYLE.compareRatio)return null;
 const threat=Math.min(1,(ratio-NPC_DANGER_STYLE.compareRatio)/Math.max(.01,NPC_DANGER_STYLE.lethalRatio-NPC_DANGER_STYLE.compareRatio));
 const lethal=ratio>=NPC_DANGER_STYLE.lethalRatio;
 const lineWidth=lethal?NPC_DANGER_STYLE.lethalLinePixels:NPC_DANGER_STYLE.minLinePixels+(NPC_DANGER_STYLE.maxLinePixels-NPC_DANGER_STYLE.minLinePixels)*threat;
 const distance=Math.hypot(enemy.x-player.x,enemy.y-player.y);
 // Touching only: a body across the pond is not an immediate threat.
 if(distance>enemyCore+playerCore+(NPC_DANGER_STYLE.contactSlack||0))return null;
 // Thickness grows INWARD so the outer edge stays exactly on the collision circle.
 // Encircles what is actually drawn: eyes render 1.19x their body, thorns sit on their radius.
 const bodyR=visualRadius(enemy)*(enemy.appearance==='eye'?1.24:1.03);
 const radius=Math.max(1,bodyR-lineWidth*.5/scale);return {enemyCore,playerCore,threshold,distance,range:enemyCore+playerCore,ratio,threat,lethal,lineWidth,radius,bodyRadius:bodyR,alpha:NPC_DANGER_STYLE.minAlpha+(NPC_DANGER_STYLE.maxAlpha-NPC_DANGER_STYLE.minAlpha)*threat};
}
export function paintNpcDanger(c,enemy,player,scale=1){const state=npcDangerState(enemy,player,scale);if(!state)return false;c.save();c.strokeStyle='rgba(151,64,43,'+state.alpha+')';c.lineWidth=state.lineWidth/scale;c.beginPath();c.arc(enemy.x,enemy.y,state.radius,0,Math.PI*2);c.stroke();c.restore();return true;}

// Runtime draws only cached animation. The bake's fluid never reaches a player renderer.
export class NpcPainter {
 constructor(){this.tailStates=new WeakMap();this.sprites=Array.from({length:8},(_,index)=>this.makeSprite(index));this.eyeSprites=[...this.sprites];this.animated=false;this.metrics={liveSimulations:0,frames:8};this.ready=Promise.resolve();}
 makeSprite(seed){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=192;const c=canvas.getContext('2d'),R=80;
  // 1) pigment bleed outside the outline: a few soft rings, like ink spreading on damp paper.
  for(let ring=3;ring>=1;ring--){c.save();c.globalAlpha=.05*ring;c.fillStyle='#2b2a22';c.beginPath();for(let i=0;i<=84;i++){const a=i/84*Math.PI*2,e=R*(1+ring*.035+.021*Math.sin(a*7+seed+ring)+.013*Math.sin(a*13+seed*2));c.lineTo(96+Math.cos(a)*e,96+Math.sin(a)*e);}c.closePath();c.fill();c.restore();}
  // 2) body: ink pools in the middle and thins toward the rim.
  const ink=c.createRadialGradient(96-R*.3,96-R*.34,0,96,96,R*1.06);
  ink.addColorStop(0,'#31322b');ink.addColorStop(.42,'#1b1e1a');ink.addColorStop(.78,'#262821');ink.addColorStop(.94,'#3b3931');ink.addColorStop(1,'#4a4637e8');
  c.fillStyle=ink;c.beginPath();for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,e=R*(1+.019*Math.sin(a*7+seed)+.014*Math.sin(a*13+seed*2)+.008*Math.sin(a*23+seed*3));c.lineTo(96+Math.cos(a)*e,96+Math.sin(a)*e);}c.closePath();c.fill();
  c.save();c.clip();
  // 3) three deep blooms so the surface is not a flat disc.
  for(let i=0;i<3;i++){const a=i*2.399+seed,d=R*.42,x=96+Math.cos(a)*d,y=96+Math.sin(a)*d,r=R*.62,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i?'#0d120e22':'#0000002e');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,192,192);}
  // 4) inner rim shadow gives the blob volume.
  const rim=c.createRadialGradient(96,96,R*.58,96,96,R*1.06);rim.addColorStop(0,'#0000');rim.addColorStop(.82,'#05070610');rim.addColorStop(1,'#04060446');c.fillStyle=rim;c.fillRect(0,0,192,192);
  // 5) one wet highlight, up-left only.
  const sheen=c.createRadialGradient(96-R*.38,96-R*.42,1,96-R*.38,96-R*.42,R*.86);sheen.addColorStop(0,'#f6eed626');sheen.addColorStop(.5,'#f6eed60a');sheen.addColorStop(1,'#f6eed600');c.fillStyle=sheen;c.fillRect(0,0,192,192);
  // 6) grain, kept light so it never reads as noise.
  for(let i=0;i<260;i++){const x=96+Math.sin(i*12.98+seed)*R,y=96+Math.cos(i*7.17+seed)*R;c.fillStyle=i%3?'#ebe0c20a':'#0d0b080e';c.fillRect(x,y,1+(i%3)*.7,1+(i%2)*.6);}
  c.restore();
  // 7) wet edge: one crisp ink line, slightly darker than the body.
  c.strokeStyle='#12150f66';c.lineWidth=1.6;c.beginPath();for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,e=R*(1+.019*Math.sin(a*7+seed)+.014*Math.sin(a*13+seed*2)+.008*Math.sin(a*23+seed*3));c.lineTo(96+Math.cos(a)*e,96+Math.sin(a)*e);}c.closePath();c.stroke();
  return canvas;
 }
 draw(context,e,index,units=[],forced=null){const time=performance.now()/1000,boss=e.appearance==='boss';if(!boss&&e.appearance==='eye'){const r=e.r*(e.effects?.dense?1.32:1),size=r*1.19,frame=index%this.eyeSprites.length;if(VISUAL.eyeTail){let q=this.tailStates.get(e);if(!q){q={x:1,y:0,speed:0,last:time};this.tailStates.set(e,q);}const dt=Math.min(.1,time-q.last),blend=1-Math.exp(-dt*6),v=Math.hypot(e.vx,e.vy);q.last=time;if(v>3){q.x+=(e.vx/v-q.x)*blend;q.y+=(e.vy/v-q.y)*blend;}q.speed+=(Math.min(1,v/180)-q.speed)*blend;if(q.speed>.01){context.save();context.translate(e.x,e.y);context.rotate(Math.atan2(q.y,q.x));context.globalAlpha=.35*q.speed;context.drawImage(this.eyeSprites[frame],-r*(1+q.speed),-r*.34,r*1.5*q.speed,r*.68);context.restore();}}context.save();context.globalAlpha=e.effects?.water?.20:e.diluted?.48:.92;context.drawImage(this.eyeSprites[frame],e.x-size,e.y-size+r*.13,size*2,size*2);context.restore();}alienBody(context,e,time,index,boss);alienDetails(context,e,time,index,boss,forced,units);}
}
