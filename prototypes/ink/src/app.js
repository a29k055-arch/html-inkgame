import {InkFluid} from './fluid.js';
import {MaterialInk} from './material.js';
import {PaperReveal} from './paper.js';
import {INK,QUALITY} from './config.js';
const $=id=>document.getElementById(id), stage=$('stage'), fluidCanvas=$('fluid');
let fluid,body,paper,mode='player',paperStarted=false,automatic=true,paused=false,alive=true,time=0,last=0,scan=0,fluidClock=0,frames=0,measure=0,frameTimes=[];
const entity={x:.5,y:.5,vx:0,vy:0,radius:.050,boost:0};
const keys=new Set(),pointers=new Map(),cursorSamples=new Map();let target=null;
const titles={
player:['试作一 / 試作 01','墨体形态 / 墨のかたち','鼠标或 WASD 移动 ／ Shift 疾墨 ／ 按钮泼墨\nマウス・WASDで移動 ／ Shiftで疾墨 ／ ボタンで墨を散らす'],
painting:['试作二 / 試作 02','互动水墨 / 墨にふれる','轻轻推动或拖动墨流，感受缓慢变化\n墨にそっと触れ、ゆっくり流れを変える'],
paper:['试作三 / 試作 03','宣纸显影 / 紙に描く','拖动墨体游过宣纸，停留加深晕染\n墨を動かして原画を復元 ／ 留まると深く滲む']};
function fail(e){$('loading').hidden=true;$('error').hidden=false;$('error').textContent=e.message;console.error(e);}
function setAutomatic(value){automatic=value;$('auto').setAttribute('aria-pressed',String(value));$('auto').textContent=value?'自动演示：开 / 自動：オン':'自动演示：关 / 自動：オフ';target=null;}
function seed(){
 if(mode!=='painting')return;
 // Two broad continuous washes with different dilution, rather than a ring of equal drops.
 for(let branch=0;branch<2;branch++)for(let i=0;i<100;i++){
  const u=i/99,a=u*Math.PI*1.8+branch*1.3;
  const x=.48+Math.sin(a)*(.16+branch*.06),y=.19+u*.62;
  const radius=.013+Math.pow(Math.sin(u*Math.PI),2)*(.016+branch*.004);
  fluid.inject({x,y,vx:Math.cos(a)*12,vy:8,radius,intensity:(branch===0?.28:.14)*( .7+.3*Math.sin(u*Math.PI))});
 }
}
function reset(){entity.radius=Number($('size').value)*(mode==='paper'?.72:1);fluid.clear();body.reset();paper.reset();paperStarted=false;if(mode==='paper')$('body').hidden=true;$('guide').setAttribute('aria-pressed','false');entity.x=.5;entity.y=.5;entity.vx=entity.vy=0;entity.boost=0;pointers.clear();cursorSamples.clear();keys.clear();target=null;scan=0;fluidClock=0;seed();}
function switchMode(next){mode=next;fluid.materialMode=next!=='painting';const t=titles[next];$('number').textContent=t[0];$('title').textContent=t[1];$('hint').textContent=t[2];$('completion').hidden=next!=='paper';$('guide').hidden=next!=='paper';$('auto').hidden=next==='paper';$('burst').hidden=next==='paper';$('body').hidden=next==='painting';$('sizeControl').hidden=next==='painting';$('paper').hidden=next!=='paper';fluidCanvas.style.opacity=next==='paper'?'.58':'1';for(const btn of document.querySelectorAll('[data-mode]'))btn.setAttribute('aria-pressed',String(btn.dataset.mode===next));reset();if(next==='paper')paper.resize();}
function burst(){
 if(mode==='paper')return;
 const x=mode==='player'?entity.x:target?.x||.5,y=mode==='player'?entity.y:target?.y||.5;
 const r=mode==='player'?body.radius(entity):.030;
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2;fluid.inject({x:x+Math.cos(a)*r*.4/fluid.aspect,y:y+Math.sin(a)*r*.4,vx:Math.cos(a)*r*(mode==='player'?2200:1100),vy:Math.sin(a)*r*(mode==='player'?2200:1100),radius:r*.14,intensity:.35});}
 entity.boost=1;if(mode==='player')body.splash(entity);
}
function coords(e){const r=stage.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)),time:performance.now()};}
function pointerMove(e){const p=coords(e),prev=cursorSamples.get(e.pointerId)||p,elapsed=Math.max(8,p.time-prev.time),vx=Math.max(-85,Math.min(85,(p.x-prev.x)*1000/elapsed*INK.force*.25)),vy=Math.max(-85,Math.min(85,(p.y-prev.y)*1000/elapsed*INK.force*.25));cursorSamples.set(e.pointerId,p);target=p;if(mode==='player'){setAutomatic(false);target=p;}else if(mode==='painting'){fluid.stir({...p,vx,vy,radius:.035});if(pointers.has(e.pointerId)){const n=Math.min(16,Math.max(1,Math.ceil(Math.hypot(p.x-prev.x,p.y-prev.y)/.007)));for(let i=1;i<=n;i++){const f=i/n;fluid.inject({x:prev.x+(p.x-prev.x)*f,y:prev.y+(p.y-prev.y)*f,vx,vy,radius:Math.max(.008,.023-Math.hypot(vx,vy)*.000021),intensity:.24/n});}}}if(pointers.has(e.pointerId))pointers.set(e.pointerId,p);}
stage.addEventListener('pointerdown',e=>{if(!fluid)return;stage.setPointerCapture(e.pointerId);const p=coords(e);pointers.set(e.pointerId,p);cursorSamples.set(e.pointerId,p);target=p;if(mode==='player'){setAutomatic(false);target=p;}else if(mode==='paper'){paperStarted=true;$('body').hidden=false;entity.x=p.x;entity.y=p.y;entity.vx=entity.vy=0;body.reset();}else fluid.inject({...p,radius:.022,intensity:.5});});
stage.addEventListener('pointermove',e=>{if(fluid)pointerMove(e);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(name,e=>pointers.delete(e.pointerId));
addEventListener('keydown',e=>{if(e.target.closest('button,select,a'))return;if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','escape'].includes(e.key.toLowerCase()))e.preventDefault();keys.add(e.key.toLowerCase());if(e.key==='Shift'&&mode==='player'){entity.boost=1;body.splash(entity,.45);}if(e.key==='Escape')paused=!paused;});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();pointers.clear();});
$('burst').onclick=burst;$('reset').onclick=reset;$('auto').onclick=()=>setAutomatic(!automatic);$('guide').onclick=()=>{paper.preview=!paper.preview;$('guide').setAttribute('aria-pressed',String(paper.preview));};
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>switchMode(b.dataset.mode);
$('size').oninput=()=>{if(mode!=='painting'){entity.radius=Number($('size').value)*(mode==='paper'?.72:1);fluid.clear();body.reset();}};
$('quality').onchange=()=>{fluid.quality=$('quality').value;fluid.resize();reset();};
const observer=new ResizeObserver(()=>{if(!fluid)return;fluid.resize();body.resize();if(mode==='paper')paper.resize();body.reset();if(mode==='painting')seed();});observer.observe(stage);
function loop(now){if(!alive)return;const elapsed=last?(now-last)/1000:1/60,dt=Math.min(elapsed,.033);last=now;if(!paused&&!document.hidden){time+=dt;if(mode==='player'||(mode==='paper'&&paperStarted)){const oldX=entity.x,oldY=entity.y;let dx=0,dy=0;if(keys.has('w')||keys.has('arrowup'))dy--;if(keys.has('s')||keys.has('arrowdown'))dy++;if(keys.has('a')||keys.has('arrowleft'))dx--;if(keys.has('d')||keys.has('arrowright'))dx++;if(dx||dy){setAutomatic(false);const n=Math.hypot(dx,dy);dx=dx/n*.28;dy=dy/n*.28;}else if(mode==='player'&&automatic){const tx=.5+.24*Math.sin(time*.72)+.035*Math.sin(time*2.1),ty=.5+.23*Math.sin(time*.99)+.035*Math.cos(time*1.7);dx=(tx-entity.x)*1.8;dy=(ty-entity.y)*1.8;}else if(target&&(mode==='player'||pointers.size>0)){dx=(target.x-entity.x)*2.4;dy=(target.y-entity.y)*2.4;const len=Math.hypot(dx,dy),cap=mode==='paper'?.8:.6;if(len>cap){dx*=cap/len;dy*=cap/len;}}const lerp=1-Math.exp(-dt*7);entity.vx+=(dx*(1+entity.boost*1.8)-entity.vx)*lerp;entity.vy+=(dy*(1+entity.boost*1.8)-entity.vy)*lerp;entity.x=Math.max(.07,Math.min(.93,entity.x+entity.vx*dt));entity.y=Math.max(.09,Math.min(.91,entity.y+entity.vy*dt));entity.boost=Math.max(0,entity.boost-dt);const speed=Math.hypot(entity.vx,entity.vy);entity.radius=Number($('size').value)*(mode==='paper'?.72:1);body.update(entity,dt);window.materialInkActive=true;}
 if(mode==='painting'&&automatic&&pointers.size===0){const a=time*.28;fluid.stir({x:.5+Math.cos(a)*.2,y:.5+Math.sin(a)*.18,vx:-Math.sin(a)*8,vy:Math.cos(a)*8,radius:.045});if(Math.sin(time*.7)>.99)fluid.inject({x:.5+Math.cos(a)*.2,y:.5+Math.sin(a)*.18,vx:0,vy:0,radius:.015,intensity:dt*2});}
 if(mode==='painting')for(const p of pointers.values())fluid.inject({...p,vx:0,vy:0,radius:.017,intensity:dt*.8});fluidClock+=dt;const interval=1/QUALITY[fluid.quality].simulationHz;if(fluidClock>=interval){fluid.step(Math.min(fluidClock,1/30));fluidClock=0;}fluid.draw(fluidClock);if(mode==='player'||(mode==='paper'&&paperStarted))body.draw(entity);if(mode==='paper'){scan+=dt;if(scan>.1){paper.absorb(fluidCanvas);scan=0;$('completion').querySelector('strong').textContent=(paper.completion*100).toFixed(1)+'%';}paper.draw();}}
 frames++;measure+=elapsed;frameTimes.push(elapsed*1000);if(frameTimes.length>180)frameTimes.shift();if(measure>1){$('stats').textContent=`${Math.round(frames/measure)} 帧/秒 · ${fluid.w} × ${fluid.h}\n${paused?'已暂停 / 一時停止 · Esc':'第五版 / 第五版'}`;window.inkStudyMetrics={fps:frames/measure,grid:[fluid.w,fluid.h],mode,completion:paper.completion,frameMs:frameTimes.slice(),targets:fluid.targets.length};frames=0;measure=0;}requestAnimationFrame(loop);}
addEventListener('pagehide',()=>{alive=false;observer.disconnect();fluid?.dispose();});
fluidCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();alive=false;fail(new Error('绘图已中断，请刷新页面恢复。 / 描画が中断されました。再読み込みしてください。'));});
try{if(matchMedia('(pointer: coarse)').matches)$('quality').value='balanced';fluid=new InkFluid(fluidCanvas,$('quality').value);body=new MaterialInk(fluid,$('body'));paper=new PaperReveal($('paper'));await paper.load();$('loading').hidden=true;switchMode('player');requestAnimationFrame(loop);}catch(e){fluid?.dispose();fail(e);}


