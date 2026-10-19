import {alienDetails} from './alien-ink.js';
import {npcAtlas,atlasMetrics} from './npc-material/atlas.js';
// Runtime draws only cached animation. The bake's fluid never reaches a player renderer.
export class NpcPainter {
 constructor(){this.sprites=Array.from({length:8},(_,index)=>this.makeSprite(index));this.animated=false;this.metrics=atlasMetrics;this.ready=npcAtlas().then(sprites=>{this.sprites=sprites;this.animated=true;}).catch(e=>console.warn('NPC atlas:',e.message));}
 makeSprite(seed){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=160;const c=canvas.getContext('2d'),r=67;
  const ink=c.createRadialGradient(80-r*.26,80-r*.28,0,80,80,r*1.03);
  ink.addColorStop(0,'rgba(26,24,21,.88)');ink.addColorStop(.55,'rgba(39,36,30,.77)');ink.addColorStop(.83,'rgba(44,40,31,.58)');ink.addColorStop(1,'rgba(45,40,31,0)');
  c.fillStyle=ink;c.beginPath();for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,edge=r*(1+.017*Math.sin(a*7+seed)+.012*Math.sin(a*13+seed*2));c.lineTo(80+Math.cos(a)*edge,80+Math.sin(a)*edge);}c.closePath();c.fill();
  c.save();c.globalCompositeOperation='source-atop';
  for(let i=0;i<210;i++){const x=80+Math.sin(i*12.98+seed)*r,y=80+Math.cos(i*7.17+seed)*r;c.fillStyle=i%3?'#ebe0c20d':'#0d0b0812';c.fillRect(x,y,1+(i%3),1+(i%2));}c.restore();for(let i=0;i<18;i++){const a=i*2.399+seed,dist=r*Math.sqrt((i+1)/20),x=80+Math.cos(a)*dist,y=80+Math.sin(a)*dist,g=c.createRadialGradient(x,y,0,x,y,9+i%6);g.addColorStop(0,"#ece0c31b");g.addColorStop(1,"#ece0c300");c.fillStyle=g;c.fillRect(x-16,y-16,32,32);}return canvas;
 }
 draw(context,e,index){const r=e.r*(e.effects.dense?1.32:1),moving=Math.hypot(e.vx||0,e.vy||0)>5;
  const frame=this.animated?(Math.floor(performance.now()/(moving?160:280)+index*1.7)%this.sprites.length):index%this.sprites.length;
  context.save();const speed=Math.hypot(e.vx||0,e.vy||0);if(speed>15){context.save();context.globalAlpha=.10;context.translate(e.x-(e.vx||0)*.10,e.y-(e.vy||0)*.10);context.drawImage(this.sprites[frame],-r*1.25,-r*1.25,r*2.5,r*2.5);context.restore();}context.translate(e.x,e.y);if(this.animated&&moving)context.rotate(Math.atan2(e.vy,e.vx));context.globalAlpha=e.effects.water?.26:e.diluted?.5:.94;
  const scale=this.animated?1.65:1.19;context.drawImage(this.sprites[frame],-r*scale,-r*scale,r*scale*2,r*scale*2);context.restore();if(e.appearance!=='boss')alienDetails(context,e,performance.now()/1000,index);
 }
}
