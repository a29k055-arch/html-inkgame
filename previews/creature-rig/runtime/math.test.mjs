import assert from 'node:assert/strict';
import {makeCurve,sampleCurve,projectPoint,InkCreature,wrapAngle} from './ink-creature.mjs';
const line=makeCurve([[10,20],[10,120]],false);
assert.deepEqual(projectPoint(line,30,70),{s:.5,t:-.2});
assert.equal(sampleCurve(line,1).y,120);
assert.equal(sampleCurve(line,-.2).y,0);
assert.equal(sampleCurve(line,1.2).y,140);
for(const [x,y] of [[30,-980],[-15,1820],[10,-20]]) {const v=projectPoint(line,x,y),p=sampleCurve(line,v.s);assert.ok(Math.abs((p.x-p.ty*v.t*line.length)-x)<1e-8);assert.ok(Math.abs((p.y+p.tx*v.t*line.length)-y)<1e-8);}
const tiny=makeCurve([[252,163],[290,260],[332,370]]);const nose={x:225,y:103},projectedNose=projectPoint(tiny,nose.x,nose.y),sampledNose=sampleCurve(tiny,projectedNose.s);
assert.ok(projectedNose.s<-.1,'Fish nose must extrapolate before first tiny smoothed segment');
assert.ok(Math.abs(sampledNose.x-sampledNose.ty*projectedNose.t*tiny.length-nose.x)<1e-8);
assert.ok(Math.abs(sampledNose.y+sampledNose.tx*projectedNose.t*tiny.length-nose.y)<1e-8);
assert.ok(Math.abs(wrapAngle(Math.PI*2+.3)-.3)<1e-10);
const curved=makeCurve([[0,0],[0,100],[40,200],[-20,300],[0,400]]);
for(let s=0;s<=1;s+=.025){const p=sampleCurve(curved,s),proj=projectPoint(curved,p.x,p.y);assert.ok(Math.abs(proj.s-s)<1e-8);assert.ok(Math.abs(proj.t)<1e-8);}
const make=id=>new InkCreature({id,sourceSize:[100,400],spine:[[50,0],[50,400]],layers:[]},{length:400,speed:100});
const a=make('dragon_04');a.setInput(1,0);for(let i=0;i<120;i++)a.update(1/120);
const b=make('dragon_04');b.setInput(1,0);for(let i=0;i<60;i++)b.update(1/60);
assert.ok(Math.abs(a.heading-b.heading)<1e-10,'Heading response should be time-step independent');
assert.ok(Math.abs(a.drive-b.drive)<1e-10);
assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<2,'Position integration should converge across refresh rates');
a.setMode('straight');a.update(1/60);
const first=a.pose[0],last=a.pose.at(-1);assert.ok(Math.abs(Math.hypot(last[0]-first[0],last[1]-first[1])-400)<1e-8);
for(const id of ['fish_04','dragon_04','shrimp_07','turtle_02']) {const rig=make(id);for(let i=0;i<120;i++){rig.setInput(Math.cos(i*.1),Math.sin(i*.1));rig.update(1/60);}for(const p of rig.snapshot().spine)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}
console.log('PASS: projection, extrapolation, wrap, 60/120 Hz response, finite species poses, exact dragon straightening');
