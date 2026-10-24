import {DROP_CONFIG as D} from '../game/config.js';
const load=src=>{const image=new Image();image.src=new URL(src,import.meta.url).href;return image.decode().then(()=>image);};
let cached;
export function preloadMattes(){return cached??=Promise.all([load('../../assets/effects/drops.webp').catch(()=>null),load('../../assets/effects/transition.webp').catch(()=>null)]);}
export function dropStyle(r=12,kind,playerSize=18,zoom=1){const size=Math.max(0,Math.min(170,Number(r)||0)),large=kind==='enemy';const world=(large?35+size*D.targetWeight:14+size*2.2)+Math.sqrt(Math.max(0,playerSize)/18)*18*D.playerWeight;return {r:Math.max(large?55:D.minScreenRadius,Math.min(D.maxScreenRadius,world*Math.max(.01,zoom)))/Math.max(.01,zoom),life:large?1.05+Math.sqrt(size/170)*.65:.62+size*.008,opacity:large?.40+Math.sqrt(size/170)*.20:.29};}
export class DropPool {
 constructor(){this.active=[];this.free=Array.from({length:80},()=>({}));this.image=null;preloadMattes().then(([drop])=>this.image=drop).catch(()=>{});}
 add({x,y,r=12,kind,playerSize=18,zoom=1}){const e=this.free.pop()||this.active.shift();Object.assign(e,{x,y,...dropStyle(r,kind,playerSize,zoom),age:0,angle:Math.random()*6.28});this.active.push(e);}
 draw(c,dt,zoom=1){if(!this.image)return;for(let i=this.active.length-1;i>=0;i--){const e=this.active[i];e.age+=dt;if(e.age>=e.life){this.free.push(e);this.active.splice(i,1);continue;}const t=e.age/e.life,frame=Math.min(31,Math.floor(t*32)),size=Math.min(e.r,D.maxScreenRadius/Math.max(.01,zoom))*(3.4+t*1.2);c.save();c.translate(e.x,e.y);c.rotate(e.angle);c.globalAlpha=(1-t)*e.opacity;c.drawImage(this.image,(frame%8)*160,Math.floor(frame/8)*160,160,160,-size/2,-size/2,size,size);c.restore();}}
 clear(){this.free.push(...this.active);this.active=[];}
}
export class MatteTransition {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.busy=false;this.switches=0;}
 async run(change){if(this.busy)return false;this.busy=true;let image;try{[,image]=await preloadMattes();}catch{image=null;}const canvas=this.canvas,c=this.ctx;canvas.hidden=false;canvas.width=innerWidth;canvas.height=innerHeight;
  const draw=p=>{c.clearRect(0,0,canvas.width,canvas.height);const frame=Math.min(35,Math.floor(p*36));if(image)c.drawImage(image,frame%6*320,Math.floor(frame/6)*169,320,169,0,0,canvas.width,canvas.height);else{c.fillStyle=`rgba(31,29,25,${p})`;c.fillRect(0,0,canvas.width,canvas.height);}if(p>.88){c.fillStyle=`rgba(31,29,25,${Math.min(1,(p-.88)/.12)})`;c.fillRect(0,0,canvas.width,canvas.height);}};
  const animate=reverse=>new Promise(resolve=>{let age=0,last;const tick=now=>{if(last&&!document.hidden)age+=Math.min(.05,(now-last)/1000);last=now;const p=Math.min(1,age/.85);draw(reverse?1-p:p);p===1?resolve():requestAnimationFrame(tick);};requestAnimationFrame(tick);});
  try{await animate(false);c.fillStyle='#1f1d19';c.fillRect(0,0,canvas.width,canvas.height);await new Promise(requestAnimationFrame);change();this.switches++;await new Promise(requestAnimationFrame);await animate(true);return true;}finally{canvas.hidden=true;this.busy=false;}
 }
}
