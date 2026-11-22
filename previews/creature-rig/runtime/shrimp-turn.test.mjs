import assert from 'node:assert/strict';
import {InkCreature,stepShrimpTurn,sampleCurve} from './ink-creature.mjs';
const make=()=>new InkCreature({id:'shrimp_07',sourceSize:[100,400],spine:[[50,0],[50,400]],layers:[]},{length:400,speed:0});
const shrimp=make();shrimp.reset(0,0,0);shrimp.setInput(-1,0);
const samples=[];let narrowest=1,settledAt=null,previous=shrimp.presentationWidth,maxWidthStep=0,maxCenterDrift=0,maximumEdgeOpacity=0;
const widthSteps=[];
for(let i=1;i<=120;i++) {
  shrimp.update(1/120);const snapshot=shrimp.snapshot();
  const widthStep=Math.abs(snapshot.presentationWidth-previous);widthSteps.push(widthStep);
  narrowest=Math.min(narrowest,snapshot.presentationWidth);maxWidthStep=Math.max(maxWidthStep,widthStep);previous=snapshot.presentationWidth;
  maximumEdgeOpacity=Math.max(maximumEdgeOpacity,snapshot.paperEdgeOpacity);
  const rawCenter=sampleCurve(shrimp.targetCurve,.45),shownCenter=shrimp.presentationPoint(rawCenter);
  maxCenterDrift=Math.max(maxCenterDrift,Math.hypot(shownCenter.x-shrimp.x,shownCenter.y-shrimp.y));
  if(settledAt===null&&snapshot.facing===-1&&snapshot.presentationWidth>.99)settledAt=i/120;
  if([1,12,24,33,42,54,66,90,120].includes(i))samples.push({time:i/120,progress:snapshot.turnProgress,width:snapshot.presentationWidth,edgeOpacity:snapshot.paperEdgeOpacity,facing:snapshot.facing});
  assert.ok(snapshot.turnProgress>=0&&snapshot.turnProgress<=1);
  assert.ok(snapshot.presentationWidth>=0&&snapshot.presentationWidth<=1);
  assert.ok(shrimp.mapPoint(.2,-.1).y>shrimp.mapPoint(.2,0).y,'Paper fold moved the ventral side above the body');
}
assert.ok(samples[0].width>.999,'Shrimp still instantly mirrors on first frame');
assert.ok(narrowest<.07,'Shrimp never passes through an edge-on paper pose');
assert.ok(settledAt>=.45&&settledAt<=.64,`Turn should visibly finish in about .55s, got ${settledAt}`);
assert.ok(maxWidthStep<Math.PI*1.5*2.2/120+1e-6,'Horizontal width has a discontinuity');
assert.ok(maxCenterDrift<1e-9,'Shrimp turns around the head instead of its body center');
assert.ok(maximumEdgeOpacity>.4,'Shrimp vanished at the side-on frame instead of showing a thin paper edge');
assert.ok(Math.max(...widthSteps.slice(59,66))<maxWidthStep*.12,'Turn did not ease down at the endpoint');
assert.equal(shrimp.facing,-1);assert.equal(shrimp.desiredFacing,-1);
// The whole material map and every rigid layer must share the same continuous fold.
const alpha=.31,near=make();near.inclination=alpha;near.shrimpTurnProgress=.5-1e-7;near.facing=1;near.heading=alpha;near.update(0);
const before=near.mapPoint(.6,-.15),beforeMatrix=near.rigidTransform({x:0,y:0},near.heading+Math.PI,Math.PI);
near.shrimpTurnProgress=.5+1e-7;near.facing=-1;near.heading=Math.PI-alpha;
// update(0) maintains the paper progress while rebuilding the target spine.
near.update(0);const after=near.mapPoint(.6,-.15),afterMatrix=near.rigidTransform({x:0,y:0},near.heading+Math.PI,Math.PI);
assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<.001,'Mirror switch pops at the turn midpoint');
assert.ok(Math.abs(afterMatrix.b-beforeMatrix.b)<1e-8&&Math.abs(afterMatrix.d-beforeMatrix.d)<1e-8,'Turn inverted vertical anatomy');
const edge=make();edge.shrimpTurnProgress=.5;edge.facing=1;edge.update(0);
assert.ok(edge.presentationWidth<1e-10&&edge.paperEdgeOpacity>.69);
edge.shrimpEdgePass=true;assert.equal(edge.presentationWidth,.012);
const visibleEdge=edge.rigidTransform({x:0,y:0},Math.PI,Math.PI);
assert.ok(Math.abs(visibleEdge.a*visibleEdge.d-visibleEdge.b*visibleEdge.c)>0,'Thin paper edge has no drawable area');
edge.shrimpEdgePass=false;
// Input noise near vertical must retain the requested side, rather than oscillating targets.
const vertical=make();vertical.reset(0,0,Math.PI);for(let i=0;i<120;i++){vertical.setInput((i%2?.08:-.08),-1);vertical.update(1/120);assert.equal(vertical.desiredFacing,-1);}
// Reversal can happen before or after the midpoint; progress/velocity are preserved and bounded.
const rapid=make();rapid.reset(0,0,0);let last=0,lastVelocity=0,maxProgressStep=0,maxVelocityChange=0;
for(let i=0;i<1800;i++){
  const interval=i<900?11:37;
  rapid.setInput(Math.floor(i/interval)%2?-1:1,Math.sin(i*.03)*.45);rapid.update(1/120);
  const p=rapid.shrimpTurnProgress,v=rapid.shrimpTurnVelocity;maxProgressStep=Math.max(maxProgressStep,Math.abs(p-last));
  // The physical endpoint is a stop; cos(progress*pi) has zero visual slope there.
  if(p>0&&p<1&&last>0&&last<1)maxVelocityChange=Math.max(maxVelocityChange,Math.abs(v-lastVelocity));
  assert.ok(p>=0&&p<=1&&Number.isFinite(v));assert.ok(Math.abs(rapid.inclination)<=Math.PI/2+1e-12);
  const center=rapid.presentationPoint(sampleCurve(rapid.targetCurve,.45));assert.ok(Math.hypot(center.x-rapid.x,center.y-rapid.y)<1e-9);
  const matrix=rapid.rigidTransform({x:0,y:0},rapid.heading+Math.PI,Math.PI);
  assert.ok(Number.isFinite(matrix.a)&&Number.isFinite(matrix.d));
  last=p;lastVelocity=v;
}
assert.ok(maxProgressStep<=2.2/120+1e-8,'Rapid retarget teleports progress');
assert.ok(maxVelocityChange<=22/120+1e-8,'Rapid retarget resets turn velocity');
// Same input at 60Hz or 120Hz produces the same fold and picture handedness.
const a=make(),b=make();a.setInput(-1,0);b.setInput(-1,0);
for(let i=0;i<20;i++)a.update(1/60);for(let i=0;i<40;i++)b.update(1/120);
assert.ok(Math.abs(a.shrimpTurnProgress-b.shrimpTurnProgress)<1e-12);assert.equal(a.facing,b.facing);
assert.deepEqual(stepShrimpTurn(0,0,0,1/120),{progress:0,velocity:0});
console.log(JSON.stringify({passed:true,settledAt,narrowest,maxWidthStep,maxProgressStep,maxVelocityChange,maxCenterDrift,maximumEdgeOpacity,samples},null,2));
