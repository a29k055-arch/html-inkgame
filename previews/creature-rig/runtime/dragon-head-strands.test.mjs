import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InkCreature,makeCurve,projectPoint,strandPose,sampleSmoothFrame} from './ink-creature.mjs';
const rig=JSON.parse(fs.readFileSync(new URL('../dragon_04/rig.json',import.meta.url)));
rig.headFrame={s:.065,rigidUntil:.14,blendUntil:.20};
const trace=[[496,133],[464,117],[433,151],[405,177],[364,188],[306,181],[266,198],[244,238]];
const source=makeCurve(trace),dragon=new InkCreature(rig,{x:300,y:400,length:500,speed:110});
const horns=rig.layers.filter(l=>l.name.includes('_horn_')).map(l=>({...l,headAttachment:true,kind:'horn',anchor:projectPoint(dragon.sourceCurve,...l.pivot)}));
const strand={name:'test_whisker',kind:'antenna',headAttachment:true,phase:.2,pivot:trace[0],strandCurve:source};
dragon.layers=[...horns,strand];
let maxRootError=0,maxArcError=0,maxLagStep=0,maxRigidMismatch=0,previousLag=0;
for(let frame=0;frame<1200;frame++){
  const directions=[[1,0],[0,-1],[-1,0],[0,1]];dragon.setInput(...directions[Math.floor(frame/120)%4]);dragon.update(1/120);
  const transforms=horns.map(h=>dragon.layerTransform(h));
  for(const key of ['a','b','c','d'])assert.equal(transforms[0][key],transforms[1][key],'Both horns must share the exact skull basis');
  const target=dragon.strandTarget(strand),pose=dragon.strandSnapshot()[0],rootProjection=projectPoint(dragon.sourceCurve,...trace[0]),host=dragon.mapPoint(rootProjection.s,rootProjection.t);
  maxRootError=Math.max(maxRootError,Math.hypot(pose.root.x-host.x,pose.root.y-host.y));
  maxArcError=Math.max(maxArcError,Math.abs(target.length/source.length-1));
  maxLagStep=Math.max(maxLagStep,Math.abs(dragon.strandLag-previousLag));previousLag=dragon.strandLag;
  for(const horn of horns){const mapped=dragon.mapPoint(horn.anchor.s,horn.anchor.t),rigid=dragon.layerTransform(horn);maxRigidMismatch=Math.max(maxRigidMismatch,Math.hypot(mapped.x-rigid.x,mapped.y-rigid.y));}
  assert(pose.nodes.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
}
assert(maxRootError<1e-7,'Whisker root separates from rigid skull');
assert(maxRigidMismatch<1e-7,'Horn roots separate from the head material');
assert(maxArcError<1e-12,'Strands must not change their arc length');
assert(maxLagStep<.03,'Whisker inertia must stay smooth during reversals');
assert(Math.abs(dragon.strandLag)>.01,'Turning must produce visible lag');
const still=strandPose(source,{still:true,lag:.5,drive:1,time:5});
for(let i=0;i<source.points.length;i++)assert(Math.hypot(still.points[i][0]-source.points[i][0],still.points[i][1]-source.points[i][1])<1e-8);
// A 4K source has exactly the same normalized motion and width as its working art.
const scaled=makeCurve(trace.map(([x,y])=>[x*4,y*4]));
const opts={lag:.32,drive:.9,time:3.2,phase:.2},a=strandPose(source,opts),b=strandPose(scaled,opts);
for(let i=0;i<a.points.length;i++)assert(Math.hypot(a.points[i][0]-b.points[i][0]/4,a.points[i][1]-b.points[i][1]/4)<1e-8);
const runs=[60,120].map(hz=>{const d=new InkCreature(rig);d.setInput(1,0);for(let i=0;i<hz*3;i++)d.update(1/hz);return d;});
assert(Math.abs(runs[0].strandLag-runs[1].strandLag)<1e-9);
assert(Math.abs(runs[0].strandLagVelocity-runs[1].strandLagVelocity)<1e-9);
// Drag follows actual world velocity, including a turn's residual sideways drift.
dragon.reset(0,0,0);dragon.vx=0;dragon.vy=50;dragon.drive=1;dragon.update(0);
const backwards=dragon.strandTarget(strand).backward,head=dragon.headFrameTransform(),delta=head.targetAngle-head.sourceAngle;
const worldBack={x:Math.cos(delta)*backwards[0]-Math.sin(delta)*backwards[1],y:Math.sin(delta)*backwards[0]+Math.cos(delta)*backwards[1]};
assert(Math.abs(worldBack.x)<1e-10&&Math.abs(worldBack.y+1)<1e-10,'Drag must point opposite actual velocity rather than only opposite head heading');
// Offset material must not jump at the 48 centerline segment boundaries.
// A constant segment normal previously made three triangles cover one tail-edge pixel.
dragon.reset(0,0,0);dragon.maxSpeed=0;dragon.setInput(1,0);for(let i=0;i<444;i++)dragon.update(1/120);
let maxMaterialBoundaryStep=0,maxFrameBoundaryStep=0;
for(let i=1;i<dragon.targetCurve.points.length-1;i++){
  const s=dragon.targetCurve.lengths[i]/dragon.targetCurve.length;
  const a=sampleSmoothFrame(dragon.targetCurve,s-1e-7),b=sampleSmoothFrame(dragon.targetCurve,s+1e-7);
  maxFrameBoundaryStep=Math.max(maxFrameBoundaryStep,Math.hypot(a.tx-b.tx,a.ty-b.ty));
  if(s>.2)for(const t of [-.05,.05]){const p=dragon.mapPoint(s-1e-7,t),q=dragon.mapPoint(s+1e-7,t);maxMaterialBoundaryStep=Math.max(maxMaterialBoundaryStep,Math.hypot(p.x-q.x,p.y-q.y));}
}
assert(maxFrameBoundaryStep<1e-4,'Dragon material normal jumps across a centerline joint');
assert(maxMaterialBoundaryStep<.002,'Dragon body edge tears or folds across a centerline joint');
console.log(JSON.stringify({passed:true,maxRootError,maxRigidMismatch,maxArcError,maxLagStep,maxFrameBoundaryStep,maxMaterialBoundaryStep,workingTo4K:'equivalent',frameRateIndependent:true},null,2));
