import {InkFluid} from './fluid.js';
import {MaterialInk} from './material.js';

export const NPC_VISUAL_SOURCE='3e63bd4870aea94fac0ff4a556334c36e0476ebc';
const frames=12;
let cached;
export const atlasMetrics={source:NPC_VISUAL_SOURCE,builds:0,frames:0,liveSimulations:0,grid:96};
export function npcAtlas(){return cached??=bake();}

async function bake(){
 // One temporary, private simulator generates all animation frames, shared by every NPC.
 await new Promise(resolve=>requestAnimationFrame(resolve));
 const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;left:-10000px;top:0;width:256px;height:256px;pointer-events:none';document.body.append(canvas);
 let fluid;
 try{
  fluid=new InkFluid(canvas,'npc');fluid.materialMode=true;atlasMetrics.builds++;atlasMetrics.liveSimulations++;
  const body=new MaterialInk(fluid,document.createElement('canvas'));
  const actor={x:.5,y:.5,vx:.10,vy:0,radius:.30},sprites=[];
  const advance=()=>{body.update(actor,1/30);fluid.step(1/30);};
  for(let i=0;i<24;i++)advance();
  for(let frame=0;frame<frames;frame++){
   actor.vx=.10+.04*Math.sin(frame/frames*Math.PI*2);
   for(let i=0;i<6;i++)advance();fluid.draw(0);
   const sprite=document.createElement('canvas');sprite.width=sprite.height=128;const c=sprite.getContext('2d');
   c.drawImage(canvas,64,64,128,128,0,0,128,128);
   // Crop the compact body from the preserved dense visual. No long wake survives the atlas.
   const clip=c.createRadialGradient(64,64,35,64,64,53);clip.addColorStop(0,'#000');clip.addColorStop(.65,'#000b');clip.addColorStop(1,'#0000');
   c.globalCompositeOperation='destination-in';c.fillStyle=clip;c.fillRect(0,0,128,128);sprites.push(sprite);
  }
  atlasMetrics.frames=sprites.length;return sprites;
 }finally{
  if(fluid){fluid.dispose();fluid.gl.getExtension('WEBGL_lose_context')?.loseContext();atlasMetrics.liveSimulations--;}
  canvas.remove();
 }
}
