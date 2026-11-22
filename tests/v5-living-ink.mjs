import assert from 'node:assert/strict';
import {LivingInkFluid,LivingInkBody,LIVING_INK_PROFILES,livingWorldToUV,sampleLivingSpine} from '../src-v5/ink/living-fluid.js';
import {HERO_PRESETS} from '../src-v5/ink/hero-presets.js';

const pair=()=>({read:{name:'read'},write:{name:'write'},swap(){[this.read,this.write]=[this.write,this.read];}});
function setup(){
 const f=Object.create(LivingInkFluid.prototype),calls=[];
 Object.assign(f,{preset:HERO_PRESETS.restored,worldRadius:40,solidCore:{point:[.4,.5],radius:.1},relativeMotion:1,sourceMotionRatio:1,
  livingCamera:{x:100,y:200,scale:2,width:1000,height:800},livingPose:{heading:.2,spine:Array.from({length:49},(_,i)=>({x:300-i*4,y:400+Math.sin(i*.1)*10}))},aspect:1.25,w:500,h:400,v:pair(),d:pair(),clears:0,
  pass(name,target,u){calls.push({name,target,u});},stir(ink){calls.push({name:'stir',ink});},clear(){this.clears++;this.core=null;}});
 const canvas={hidden:false,width:1,height:1,getContext:()=>({clearRect(){}})},body=new LivingInkBody(f,canvas);body.reset();
 const entity={x:.4,y:.5,vx:.12,vy:.025,radius:.2};return {f,body,entity,calls};
}
assert.deepEqual(livingWorldToUV({x:300,y:400},{x:100,y:200,scale:2,width:1000,height:800}),{x:.4,y:.5});
assert.deepEqual(sampleLivingSpine([[0,0],[10,10],[20,0]],.25),{x:5,y:5});
{
 const f=Object.create(LivingInkFluid.prototype);f.livingForm='fish';f.preset=HERO_PRESETS.swing;f.programs={display:'native'};f.gl={useProgram(p){assert.equal(p,'native');throw Error('native form display');}};
 assert.throws(()=>f.pass('display',null),/native form display/);assert.equal(f.solidDisplay,undefined,'even an inherited comparison preset cannot draw a form disk');
}

// Native mode still delegates to the real N seed/feed/material path.
{
 const {f,body,entity,calls}=setup();body.update(entity,1/60);
 assert.equal(f.clears,0);assert.equal(f.livingInkMetrics.form,null);assert(calls.some(c=>c.name==='material'));assert(calls.filter(c=>c.name==='splat').length>20);
}
// Shrimp cancels old pigment once, never emits a seed, circle or wake.
{
 const {f,body,entity,calls}=setup();f.livingForm='shrimp';body.update(entity,1/60);body.update(entity,1/60);body.splash(entity);
 assert.equal(f.clears,1);assert.equal(calls.length,0);assert.equal(f.livingInkMetrics.emitters,0);assert.equal(f.core,null);
 f.inject({x:.4,y:.5,radius:1,intensity:100,living:true});assert.equal(calls.length,0);
 f.livingForm=null;body.update(entity,1/60);assert.equal(f.clears,2);assert(calls.some(c=>c.name==='splat'),'ink ball seeds again on exit');
}
for(const form of ['fish','dragon','turtle']){
 const {f,body,entity,calls}=setup();f.livingForm=form;const logical={...f.solidCore};body.update(entity,1/60);
 const m=f.livingInkMetrics,p=LIVING_INK_PROFILES[form];assert.equal(m.form,form);assert(m.emitters>=p.samples.length&&m.emitters<=p.maxEmitters);assert.equal(m.hasPose,true);assert.deepEqual(f.solidCore,logical,'tail never changes physical center/radius');
 for(const [i,a]of m.anchors.entries()){
  const expected=sampleLivingSpine(f.livingPose.spine,a.s);assert(Math.abs(a.x-expected.x)<1e-9&&Math.abs(a.y-expected.y)<1e-9);
  assert(a.radius>=40*Math.min(...p.widths)-1e-8&&a.radius<=40*Math.max(...p.widths)+1e-8);assert(Math.abs(a.uv[0]-(a.x-100)*2/1000)<1e-9);assert(Math.abs(a.uv[1]-(1-(a.y-200)*2/800))<1e-9);
 }
 const ink=calls.filter(c=>c.name==='splat'&&c.u.amount>0);assert.equal(ink.length,m.emitters);assert(ink.every(c=>c.u.radius<logical.radius**2*.23),'actual tail kernels, no central ball reservoir');
 assert(calls.filter(c=>c.name==='material').length===1,'one local material pass for all anchors');
 // Move the animated tail sideways relative to the body: actual pose change
 // must perturb the real field rather than only change a painted ribbon.
 f.livingPose={...f.livingPose,spine:f.livingPose.spine.map((p,i)=>({x:p.x+entity.vx*1000/2/60,y:p.y+entity.vy*800/2/60+i*.03}))};
 body.update(entity,1/60);assert(calls.some(c=>c.name==='stir'));
 const before=calls.length;f.sourceMotionRatio=0;body.update({...entity,vx:0,vy:0},1/60);assert.equal(f.livingInkMetrics.emitters,0);assert(!calls.slice(before).some(c=>c.name==='splat'||c.name==='stir'),'rest does not keep filling a black cloud');
 assert(f.motionProfile().decay>1);assert.equal(f.clears,1);
}
const sum=p=>p.rates.reduce((a,b)=>a+b,0),ratio=sum(LIVING_INK_PROFILES.turtle)/sum(LIVING_INK_PROFILES.fish);assert(ratio>=.25&&ratio<=.35);
console.log('PASS native ball continuity, single-clear forms, no shrimp ink, real animated world-space emitters, localized shared field, low turtle density and stopped fade');
