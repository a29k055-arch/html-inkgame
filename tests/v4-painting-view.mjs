import assert from 'node:assert/strict';
import {PaintingGeometry,PaintingView} from '../src/reveal/painting-view.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const [iw,ih] of [[1861,1130],[600,900],[735,1530],[2999,1529]])for(const [w,h] of [[1440,900],[390,844],[844,390]]){
 const g=new PaintingGeometry(iw,ih).resize(w,h,90),b=g.bounds;
 assert(g.scale>0);assert(iw*g.scale<=b.width+1e-7);assert(ih*g.scale<=b.height+1e-7);
 close(g.x+(iw*g.scale)/2,b.x+b.width/2);close(g.y+(ih*g.scale)/2,b.y+b.height/2);
 g.transform(4,{x:w/2,y:h/2});g.pan(1e7,-1e7);
 assert(g.x<=b.x+b.width&&g.x+iw*g.scale>=b.x);assert(g.y<=b.y+b.height&&g.y+ih*g.scale>=b.y);
 g.resize(h,w,90,true);assert(g.scale>=g.min&&g.scale<=g.max);g.reset();close(g.scale,g.fitScale);
}
{
 const g=new PaintingGeometry(600,900).resize(1440,900,80);
 g.fromCamera({x:400,y:700,scale:1.2},{width:2606.6666666667,height:3910},{width:1440,height:900});
 close(g.x,-480);close(g.y,-840);close(g.scale,1.2*2606.6666666667/600);
 g.reset();g.transform(3,{x:720,y:400});const p={x:700,y:390},image={x:(p.x-g.x)/g.scale,y:(p.y-g.y)/g.scale};
 g.transform(1.1,p);close((p.x-g.x)/g.scale,image.x);close((p.y-g.y)/g.scale,image.y);
}
// Real viewer listeners, fake DOM surface: sequence, pointer identity, pinch anchor, pan, reset and explicit exit.
function element(){return {listeners:new Map(),disabled:false,textContent:'',addEventListener(name,fn){this.listeners.set(name,fn);},getBoundingClientRect(){return {left:30,top:50,width:1000,height:800};}};}
const canvas=element(),bar=element(),done=element(),reset=element(),hint=element(),root=element();
const ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});canvas.getContext=()=>ctx;bar.getBoundingClientRect=()=>({height:76});
root.hidden=true;root.dataset={};root.attributes={};root.setAttribute=(k,v)=>root.attributes[k]=v;root.classList={add(){},remove(){}};root.setPointerCapture=()=>{};root.focus=()=>{};
root.querySelector=selector=>({canvas,'#paintingBar':bar,'#paintingContinue':done,'#paintingReset':reset,'#paintingHint':hint})[selector];
globalThis.document={hidden:false};let callbacks=[],now=0;globalThis.requestAnimationFrame=fn=>callbacks.push(fn);
let exits=0;const viewer=new PaintingView(root,{onDone:()=>exits++,frameDuration:100,flashDuration:100,translate:k=>k});
viewer.prepare({naturalWidth:1000,naturalHeight:700},{camera:{x:300,y:200,scale:1.5},world:{width:3910,height:2737},viewport:{width:1000,height:800}});
assert.equal(viewer.state.phase,'prepared');close(viewer.state.geometry.scale,5.865);assert.equal(done.disabled,true);
const phases=[viewer.phase],finish=viewer.reveal();
for(let i=0;i<20;i++){const next=callbacks;callbacks=[];now+=50;for(const fn of next)fn(now);await Promise.resolve();if(phases.at(-1)!==viewer.phase)phases.push(viewer.phase);}
assert.equal(await finish,true);assert.deepEqual(phases,['prepared','framing','flash','interactive']);close(viewer.geometry.scale,viewer.geometry.fitScale);assert.equal(exits,0);assert.equal(done.disabled,false);
const send=(name,id,x,y,extra={})=>root.listeners.get(name)({pointerId:id,clientX:x+30,clientY:y+50,pointerType:'touch',button:0,target:{closest:()=>null},preventDefault(){},stopPropagation(){},...extra});
viewer.geometry.transform(3,{x:500,y:350});
send('pointerdown',1,400,350);send('pointerdown',2,600,350);
let before=viewer.geometry.snapshot();const anchor={x:(500-before.x)/before.scale,y:(350-before.y)/before.scale};
send('pointermove',2,700,350);close(viewer.geometry.scale/before.scale,1.5);close((550-viewer.geometry.x)/viewer.geometry.scale,anchor.x);close((350-viewer.geometry.y)/viewer.geometry.scale,anchor.y);
send('pointerup',2,700,350);before=viewer.geometry.snapshot();send('pointermove',1,410,360);close(viewer.geometry.x,before.x+10);close(viewer.geometry.y,before.y+10);
send('pointerup',1,410,360);assert.equal(viewer.pointers.size,0);
const oldScale=viewer.geometry.scale;send('wheel',0,500,350,{deltaY:100,deltaMode:0});assert(viewer.geometry.scale<oldScale);
reset.listeners.get('click')();close(viewer.geometry.scale,viewer.geometry.fitScale);assert.equal(exits,0);
done.listeners.get('click')();assert.equal(exits,1);assert.equal(root.hidden,true);assert.equal(viewer.phase,'hidden');
viewer.prepare({naturalWidth:600,naturalHeight:900});const cancelled=viewer.reveal();viewer.hide();for(const fn of callbacks)fn(now+50);assert.equal(await cancelled,false);
console.log('PASS portrait/landscape fit, camera framing, bounds, resize, pointer-anchored zoom, true two-pointer pinch, remaining-finger pan, wheel, reset, ordered reveal and explicit exit');
