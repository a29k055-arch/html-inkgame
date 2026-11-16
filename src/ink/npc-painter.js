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
 const radius=Math.max(1,enemyCore-lineWidth*.5/scale);return {enemyCore,playerCore,threshold,distance,range:enemyCore+playerCore,ratio,threat,lethal,lineWidth,radius,alpha:NPC_DANGER_STYLE.minAlpha+(NPC_DANGER_STYLE.maxAlpha-NPC_DANGER_STYLE.minAlpha)*threat};
}
export function paintNpcDanger(c,enemy,player,scale=1){const state=npcDangerState(enemy,player,scale);if(!state)return false;c.save();c.strokeStyle='rgba(151,64,43,'+state.alpha+')';c.lineWidth=state.lineWidth/scale;c.beginPath();c.arc(enemy.x,enemy.y,state.radius,0,Math.PI*2);c.stroke();c.restore();return true;}

// Runtime draws only cached animation. The bake's fluid never reaches a player renderer.
export class NpcPainter {
 constructor(){this.tailStates=new WeakMap();this.sprites=Array.from({length:8},(_,index)=>this.makeSprite(index));this.eyeSprites=[...this.sprites];this.animated=false;this.metrics={liveSimulations:0,frames:8};this.ready=Promise.resolve();}
 makeSprite(seed){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=160;const c=canvas.getContext('2d'),r=67;
  const ink=c.createRadialGradient(80-r*.26,80-r*.28,0,80,80,r*1.03);
  ink.addColorStop(0,'rgba(19,22,19,.97)');ink.addColorStop(.55,'rgba(28,31,26,.92)');ink.addColorStop(.83,'rgba(36,39,30,.72)');ink.addColorStop(1,'rgba(45,40,31,0)');
  c.fillStyle=ink;c.beginPath();for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,edge=r*(1+.017*Math.sin(a*7+seed)+.012*Math.sin(a*13+seed*2));c.lineTo(80+Math.cos(a)*edge,80+Math.sin(a)*edge);}c.closePath();c.fill();
  c.save();c.globalCompositeOperation='source-atop';
  for(let i=0;i<210;i++){const x=80+Math.sin(i*12.98+seed)*r,y=80+Math.cos(i*7.17+seed)*r;c.fillStyle=i%3?'#ebe0c20d':'#0d0b0812';c.fillRect(x,y,1+(i%3),1+(i%2));}c.restore();for(let i=0;i<18;i++){const a=i*2.399+seed,dist=r*Math.sqrt((i+1)/20),x=80+Math.cos(a)*dist,y=80+Math.sin(a)*dist,g=c.createRadialGradient(x,y,0,x,y,9+i%6);g.addColorStop(0,"#ece0c31b");g.addColorStop(1,"#ece0c300");c.fillStyle=g;c.fillRect(x-16,y-16,32,32);}return canvas;
 }
 draw(context,e,index,units=[],forced=null){const time=performance.now()/1000,boss=e.appearance==='boss';if(!boss&&e.appearance==='eye'){const r=e.r*(e.effects?.dense?1.32:1),size=r*1.19,frame=index%this.eyeSprites.length;if(VISUAL.eyeTail){let q=this.tailStates.get(e);if(!q){q={x:1,y:0,speed:0,last:time};this.tailStates.set(e,q);}const dt=Math.min(.1,time-q.last),blend=1-Math.exp(-dt*6),v=Math.hypot(e.vx,e.vy);q.last=time;if(v>3){q.x+=(e.vx/v-q.x)*blend;q.y+=(e.vy/v-q.y)*blend;}q.speed+=(Math.min(1,v/180)-q.speed)*blend;if(q.speed>.01){context.save();context.translate(e.x,e.y);context.rotate(Math.atan2(q.y,q.x));context.globalAlpha=.35*q.speed;context.drawImage(this.eyeSprites[frame],-r*(1+q.speed),-r*.34,r*1.5*q.speed,r*.68);context.restore();}}context.save();context.globalAlpha=e.effects?.water?.20:e.diluted?.48:.92;context.drawImage(this.eyeSprites[frame],e.x-size,e.y-size+r*.13,size*2,size*2);context.restore();}alienBody(context,e,time,index,boss);alienDetails(context,e,time,index,boss,forced,units);}
}
