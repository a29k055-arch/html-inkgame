import {hasInkAdvantage} from '../game/living-resource.js';
import {livingBodyContains,traceLivingBody} from '../game/living-contact.js';
import {CONTACT_CONFIG as VISUAL,GAME_CONFIG} from '../game/config.js';
import {coreRadius,visualRadius} from '../game/alien-geometry.js';
import {alienBody,alienDetails} from './alien-ink.js';

// Presentation-only warning: compares the same current core radii as swallowing.
export const NPC_DANGER_STYLE=Object.freeze({nearMinimum:8,nearMaximum:20,nearPlayerScale:.15,linePixels:1.1,minAlpha:.16,maxAlpha:.28,lethalRatio:1.28});
export function npcDangerState(enemy,player,scale=1){
 if(!player||!enemy?.v4Visual||enemy===player||enemy.dead||enemy.entering||player.dead||enemy.effects?.water||player.effects?.water)return null;
 const enemyCore=coreRadius(enemy),playerCore=coreRadius(player),ratio=enemyCore/Math.max(.01,playerCore),ctrl=enemy.controller;
 if(!hasInkAdvantage(enemy,player)||ctrl?.intent!=='hunt'||(ctrl.goal?.id!==player.id&&ctrl.prey!==player))return null;
 const distance=Math.hypot(enemy.x-player.x,enemy.y-player.y),range=enemyCore+playerCore+Math.max(NPC_DANGER_STYLE.nearMinimum,Math.min(NPC_DANGER_STYLE.nearMaximum,playerCore*NPC_DANGER_STYLE.nearPlayerScale));
 if(enemy.livingBody?!livingBodyContains(enemy,player.x,player.y,playerCore+NPC_DANGER_STYLE.nearMaximum):distance>range)return null;
 return {enemyCore,playerCore,threshold:playerCore*NPC_DANGER_STYLE.lethalRatio,distance,range,ratio,lethal:true,lineWidth:NPC_DANGER_STYLE.linePixels,radius:enemyCore,bodyRadius:enemyCore,alpha:NPC_DANGER_STYLE.minAlpha+(NPC_DANGER_STYLE.maxAlpha-NPC_DANGER_STYLE.minAlpha)*Math.max(0,1-distance/range)};
}
export function paintNpcDanger(c,enemy,player,scale=1){const state=npcDangerState(enemy,player,scale);if(!state)return false;c.save();c.strokeStyle='rgba(151,64,43,'+state.alpha+')';c.lineWidth=state.lineWidth/scale;traceLivingBody(c,enemy);c.stroke();c.restore();return true;}

// Sprite coordinates expose their measured solid radius; blank image padding never sets gameplay size.
export const EYE_SPRITE_GEOMETRY=Object.freeze({center:80,coreRadius:67,logicalSize:160});
// Runtime draws only cached animation. The bake's fluid never reaches a player renderer.
export class NpcPainter {
 constructor(){this.tailStates=new WeakMap();this.sprites=Array.from({length:8},(_,index)=>this.makeSprite(index));this.eyeSprites=[...this.sprites];this.v4EyeSprites=Array.from({length:8},(_,index)=>this.makeSprite(index,true));this.animated=false;this.metrics={liveSimulations:0,frames:8};this.ready=Promise.resolve();}
 makeSprite(seed,solid=false){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d'),r=67;c.scale(3.2,3.2);
  const ink=c.createRadialGradient(solid?80:80-r*.26,solid?80:80-r*.28,0,80,80,r*(solid?1.06:1.03));
  if(solid){ink.addColorStop(0,'rgba(19,22,19,.98)');ink.addColorStop(.78,'rgba(28,31,26,.97)');ink.addColorStop(.90,'rgba(36,39,30,.94)');ink.addColorStop(1/1.06,'rgba(36,39,30,.82)');}else{ink.addColorStop(0,'rgba(19,22,19,.97)');ink.addColorStop(.55,'rgba(28,31,26,.92)');ink.addColorStop(.83,'rgba(36,39,30,.72)');}ink.addColorStop(1,'rgba(45,40,31,0)');
  c.fillStyle=ink;c.beginPath();for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,edge=r*((solid?1.06:1)+.017*Math.sin(a*7+seed)+.012*Math.sin(a*13+seed*2));c.lineTo(80+Math.cos(a)*edge,80+Math.sin(a)*edge);}c.closePath();c.fill();
  c.save();c.globalCompositeOperation='source-atop';
  for(let i=0;i<210;i++){const x=80+Math.sin(i*12.98+seed)*r,y=80+Math.cos(i*7.17+seed)*r;c.fillStyle=i%3?'#ebe0c20d':'#0d0b0812';c.fillRect(x,y,1+(i%3),1+(i%2));}c.restore();for(let i=0;i<18;i++){const a=i*2.399+seed,dist=r*Math.sqrt((i+1)/20),x=80+Math.cos(a)*dist,y=80+Math.sin(a)*dist,g=c.createRadialGradient(x,y,0,x,y,9+i%6);g.addColorStop(0,"#ece0c31b");g.addColorStop(1,"#ece0c300");c.fillStyle=g;c.fillRect(x-16,y-16,32,32);}return canvas;
 }
 draw(context,e,index,units=[],forced=null){const time=performance.now()/1000,boss=e.appearance==='boss';if(!boss&&e.appearance==='eye'){const solid=!!e.v4Visual,r=solid?coreRadius(e):visualRadius(e),sprites=solid?(this.v4EyeSprites||this.eyeSprites):this.eyeSprites,size=solid?r*EYE_SPRITE_GEOMETRY.center/EYE_SPRITE_GEOMETRY.coreRadius:r*1.19,frame=(e.skinIndex??0)%sprites.length;if(VISUAL.eyeTail){let q=this.tailStates.get(e);if(!q){q={x:1,y:0,speed:0,last:time};this.tailStates.set(e,q);}const dt=Math.min(.1,time-q.last),blend=1-Math.exp(-dt*6),v=Math.hypot(e.vx,e.vy);q.last=time;if(v>3){q.x+=(e.vx/v-q.x)*blend;q.y+=(e.vy/v-q.y)*blend;}q.speed+=(Math.min(1,v/180)-q.speed)*blend;if(q.speed>.01){context.save();context.translate(e.x,e.y);context.rotate(Math.atan2(q.y,q.x));context.globalAlpha=.35*q.speed;context.drawImage(sprites[frame],-r*(1+q.speed),-r*.34,r*1.5*q.speed,r*.68);context.restore();}}context.save();context.globalAlpha=e.effects?.water?.20:e.diluted?.48:.92;context.drawImage(sprites[frame],e.x-size,e.y-size+(solid?0:r*.13),size*2,size*2);context.restore();}alienBody(context,e,time,index,boss);alienDetails(context,e,time,index,boss,forced,units);}
}
