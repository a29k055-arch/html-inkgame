const load=src=>{const image=new Image();image.src=new URL(src,import.meta.url).href;return image.decode().then(()=>image);};
let cached;
export function preloadMattes(){return cached??=Promise.all([load('../../assets/effects/drops.webp'),load('../../assets/effects/transition.webp')]);}
export class DropPool {
 constructor(){this.active=[];this.free=Array.from({length:80},()=>({}));this.image=null;preloadMattes().then(([drop])=>this.image=drop);}
 add({x,y,r=12,kind}){const e=this.free.pop()||this.active.shift();Object.assign(e,{x,y,r:Math.min(65,kind==='food'?r+12:r),age:0,life:kind==='enemy'?1.2:.7,angle:Math.random()*6.28});this.active.push(e);}
 draw(c,dt){if(!this.image)return;for(let i=this.active.length-1;i>=0;i--){const e=this.active[i];e.age+=dt;if(e.age>=e.life){this.free.push(e);this.active.splice(i,1);continue;}const t=e.age/e.life,frame=Math.min(31,Math.floor(t*32)),size=e.r*(3.4+t*1.2);c.save();c.translate(e.x,e.y);c.rotate(e.angle);c.globalAlpha=(1-t)*.42;c.drawImage(this.image,(frame%8)*160,Math.floor(frame/8)*160,160,160,-size/2,-size/2,size,size);c.restore();}}
 clear(){this.free.push(...this.active);this.active=[];}
}
export class MatteTransition {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.busy=false;this.switches=0;}
 async run(change){if(this.busy)return false;this.busy=true;const [,image]=await preloadMattes(),canvas=this.canvas,c=this.ctx;canvas.hidden=false;canvas.width=innerWidth;canvas.height=innerHeight;
  const draw=p=>{c.clearRect(0,0,canvas.width,canvas.height);const frame=Math.min(35,Math.floor(p*36));c.drawImage(image,frame%6*320,Math.floor(frame/6)*169,320,169,0,0,canvas.width,canvas.height);if(p>.88){c.fillStyle=`rgba(31,29,25,${Math.min(1,(p-.88)/.12)})`;c.fillRect(0,0,canvas.width,canvas.height);}};
  const animate=reverse=>new Promise(resolve=>{let age=0,last;const tick=now=>{if(last&&!document.hidden)age+=Math.min(.05,(now-last)/1000);last=now;const p=Math.min(1,age/.85);draw(reverse?1-p:p);p===1?resolve():requestAnimationFrame(tick);};requestAnimationFrame(tick);});
  try{await animate(false);c.fillStyle='#1f1d19';c.fillRect(0,0,canvas.width,canvas.height);await new Promise(requestAnimationFrame);change();this.switches++;await new Promise(requestAnimationFrame);await animate(true);return true;}finally{canvas.hidden=true;this.busy=false;}
 }
}
