import assert from 'node:assert/strict';
import {InkCreature,wrapAngle,shrimpPresentation,turtleStroke} from './ink-creature.mjs';
const TAU=Math.PI*2;
const make=id=>new InkCreature({id,sourceSize:[100,400],spine:[[50,0],[50,400]],layers:[]},{length:400,speed:100});
// Fin skinning must leave the repaired root exactly on its torso material point.
const finRig=make('fish_04');finRig.drive=1;finRig.finPhase=Math.PI/2;
const fin={name:'fish_04_fin_r',kind:'fin',side:1,phase:0,anchor:{s:.3,t:.1}};
const pin={s:.32,t:.12,flap:0},pinned=finRig.mapFinVertex(fin,pin),body=finRig.mapPoint(pin.s,pin.t);
assert.ok(Math.hypot(pinned.x-body.x,pinned.y-body.y)<1e-10,'Fin root detached from body material');
const tip={s:.35,t:.35,flap:1},movingTip=finRig.mapFinVertex(fin,tip),unflapped=finRig.mapPoint(tip.s,tip.t);
assert.ok(Math.hypot(movingTip.x-unflapped.x,movingTip.y-unflapped.y)>1,'Distal fin did not articulate');
function bends(pose) {
  const angles=pose.slice(1).map((p,i)=>Math.atan2(p[1]-pose[i][1],p[0]-pose[i][0]));
  const curvature=angles.slice(1).map((a,i)=>wrapAngle(a-angles[i]));
  const signs=curvature.slice(10).filter(x=>Math.abs(x)>.004).map(Math.sign);
  const changes=signs.slice(1).filter((x,i)=>x!==signs[i]).length;
  const [a,b]=[pose[0],pose.at(-1)],dx=b[0]-a[0],dy=b[1]-a[1],chord=Math.hypot(dx,dy);
  const distances=pose.map(p=>((p[0]-a[0])*(-dy)+(p[1]-a[1])*dx)/chord);
  return {changes,span:Math.max(...distances)-Math.min(...distances),curvature};
}
// Repeated reversals must change steering velocity through acceleration, never flip the skull.
const fish=make('fish_04');fish.reset(0,0,0);let maxStep=0,maxAcceleration=0,maxCurvatureJump=0,previousCurvature=bends(fish.pose).curvature;
for(let i=0;i<1200;i++){
  const command=Math.floor(i/18)%4,inputs=[[1,0],[-1,0],[-1,-1],[0,-1]],previous=fish.heading,omega=fish.angularVelocity;
  fish.setInput(...inputs[command]);fish.update(1/120);
  const step=Math.abs(wrapAngle(fish.heading-previous)),acc=Math.abs(fish.angularVelocity-omega)*120,c=bends(fish.pose).curvature;
  maxStep=Math.max(maxStep,step);maxAcceleration=Math.max(maxAcceleration,acc);maxCurvatureJump=Math.max(maxCurvatureJump,...c.map((v,j)=>Math.abs(v-previousCurvature[j])));previousCurvature=c;
  assert.ok(step<=fish.profile.maxAngularVelocity/120+1e-10);
  assert.ok(acc<=fish.profile.maxAngularAcceleration+1e-8);
}
assert.ok(maxCurvatureJump<.03,`Fish spatial curvature jumped: ${maxCurvatureJump}`);
// Dragon retains alternating S lobes throughout the phase cycle, stationary AND moving.
let minDragonChanges=Infinity,minDragonSpan=Infinity;
for(const drive of [0,1])for(let i=0;i<48;i++){
  const dragon=make('dragon_04');dragon.drive=drive;dragon.wavePhase=TAU*i/48;dragon.pose=dragon.buildPose();
  const metric=bends(dragon.pose);minDragonChanges=Math.min(minDragonChanges,metric.changes);minDragonSpan=Math.min(minDragonSpan,metric.span/dragon.length);
  assert.ok(metric.changes>=2,`Dragon lost S curvature lobes at drive ${drive}, phase ${i}`);
  assert.ok(metric.span>.07*dragon.length,`Dragon almost straight at drive ${drive}, phase ${i}: ${metric.span}`);
  const arc=dragon.pose.slice(1).reduce((sum,p,j)=>sum+Math.hypot(p[0]-dragon.pose[j][0],p[1]-dragon.pose[j][1]),0);
  assert.ok(Math.abs(arc-dragon.length)<1e-8);
}
// Phase integrates frequency; changing drive never re-evaluates time * current-speed.
const phaseRig=make('dragon_04');for(let i=0;i<600;i++)phaseRig.update(1/120);phaseRig.setInput(1,0);
for(let i=0;i<240;i++){const before=phaseRig.wavePhase;phaseRig.update(1/120);assert.ok(phaseRig.wavePhase>=before);assert.ok(phaseRig.wavePhase-before<=TAU*phaseRig.profile.hz/120+1e-9);}
phaseRig.setMode('straight');phaseRig.update(1/60);assert.ok(bends(phaseRig.pose).span<1e-8);
// Shrimp left/right poses are exact horizontal mirrors, including the normal coordinate and appendage basis.
const shrimp=make('shrimp_07');shrimp.reset(0,0,0);shrimp.wavePhase=.7;shrimp.pose=shrimp.buildPose();shrimp.targetCurve=({points:shrimp.pose,lengths:shrimp.pose.map((_,i)=>i*400/48),length:400});
const right=shrimp.mapPoint(.4,-.12);shrimp.facing=-1;shrimp.heading=Math.PI;shrimp.pose=shrimp.buildPose();shrimp.targetCurve=({points:shrimp.pose,lengths:shrimp.pose.map((_,i)=>i*400/48),length:400});const left=shrimp.mapPoint(.4,-.12);
assert.ok(Math.abs(left.x+right.x)<1e-8&&Math.abs(left.y-right.y)<1e-8,'Shrimp normal did not mirror with body');
for(const [ix,iy,want] of [[1,0,1],[-1,0,-1],[.7,-.7,1],[-.7,-.7,-1],[.7,.7,1],[-.7,.7,-1]])assert.equal(shrimpPresentation(1,ix,iy).facing,want);
for(const previous of [-1,1])for(const x of [-.1,0,.1])assert.equal(shrimpPresentation(previous,x,-1).facing,previous,'Vertical mirror hysteresis failed');
const m=shrimp.rigidTransform({x:0,y:0},0,Math.PI);assert.ok(m.a*m.d-m.b*m.c<0,'Shrimp appendages must share the reflected determinant');
// Turtle stroke timing and amplitude are independent of speed slider and nonzero joystick strength.
const slow=make('turtle_02'),fast=make('turtle_02');slow.maxSpeed=35;fast.maxSpeed=220;slow.setInput(.3,0);fast.setInput(1,0);
const leg={name:'turtle_02_leg_fl',kind:'leg',side:-1,phase:0};
for(let i=0;i<1200;i++){slow.update(1/120);fast.update(1/120);assert.equal(slow.gaitPhase,fast.gaitPhase);assert.ok(Math.abs(slow.layerMotion(leg)-fast.layerMotion(leg))<1e-12);}
assert.ok(Math.abs(fast.snapshot().speed-220*.42)<.01,'Turtle speed scale absent');
assert.equal(turtleStroke(TAU*.8),0,'Turtle stroke needs a real recovery pause');
assert.ok(Math.abs(slow.layerMotion(leg))<=.19);
console.log(JSON.stringify({passed:true,maxFishAngularStep:maxStep,maxFishAngularAcceleration:maxAcceleration,maxFishCurvatureJump:maxCurvatureJump,minDragonCurvatureChanges:minDragonChanges,minDragonLateralSpanRatio:minDragonSpan,shrimpMirror:true,turtleIndependentGait:true},null,2));
