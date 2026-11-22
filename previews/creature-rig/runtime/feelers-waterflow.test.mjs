import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InkCreature,makeCurve,sampleCurve,projectPoint,strandBehavior} from './ink-creature.mjs';
const ids=['fish_01','fish_02','shrimp_04','shrimp_05','shrimp_07','dragon_04'];
function prepared(rig){const r=new InkCreature(rig,{length:420,speed:110});
 let candidates=rig.layers.filter(l=>l.kind==='antenna');
 if(!candidates.length){const p=sampleCurve(r.sourceCurve,.015);candidates=[{name:rig.id+'_test_barbel',kind:'antenna',pivot:[p.x,p.y],phase:0}];}
 r.layers=candidates.map(l=>{const p=l.pivot,a=projectPoint(r.sourceCurve,...p),frame=sampleCurve(r.sourceCurve,a.s),trace=l.strand?.sourceTrace||[p,[p[0]-frame.tx*60-frame.ty*20,p[1]-frame.ty*60+frame.tx*20],[p[0]-frame.tx*140-frame.ty*35,p[1]-frame.ty*140+frame.tx*35]];return{...l,strand:{...l.strand,sourceTrace:trace},strandCurve:makeCurve(trace),anchor:a};});return r;}
const metrics=[];
for(const id of ids){
 const rig=JSON.parse(fs.readFileSync(new URL('../'+id+'/rig.json',import.meta.url))),r=prepared(rig);r.reset(0,0,0);const sourceJSON=JSON.stringify(r.layers.map(l=>l.strandCurve));let maxRootError=0,maxMaterialLengthError=0,maxNormalizedStep=0,previous=null;
 for(let i=0;i<1200;i++){
  r.setInput(...[[1,0],[-1,0],[0,-1],[-1,0],[1,1]][Math.floor(i/90)%5]);r.update(1/120);
  const states=r.strandSnapshot();
  for(let j=0;j<states.length;j++){const state=states[j],l=r.layers[j],frame=r.strandFrame(l),first=l.strandCurve.points[0],dx=first[0]-frame.sourceX,dy=first[1]-frame.sourceY,root={x:frame.x+frame.a*dx+frame.c*dy,y:frame.y+frame.b*dx+frame.d*dy};
   maxRootError=Math.max(maxRootError,Math.hypot(state.root.x-root.x,state.root.y-root.y));maxMaterialLengthError=Math.max(maxMaterialLengthError,Math.abs(state.materialLength/(state.sourceLength*r.length/r.sourceCurve.length)-1));
   if(i%120===0){const target=r.strandTarget(l);let measured=0;for(let n=1;n<target.points.length;n++)measured+=Math.hypot(target.points[n][0]-target.points[n-1][0],target.points[n][1]-target.points[n-1][1]);maxMaterialLengthError=Math.max(maxMaterialLengthError,Math.abs(measured/l.strandCurve.length-1));}
   assert(state.nodes.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
   if(previous)for(let n=0;n<state.nodes.length;n++)maxNormalizedStep=Math.max(maxNormalizedStep,Math.hypot(state.nodes[n].x-previous[j].nodes[n].x,state.nodes[n].y-previous[j].nodes[n].y)/r.length);
  }previous=states;
 }
 assert(maxRootError<1e-8);assert(maxMaterialLengthError<1e-10);assert(maxNormalizedStep<.13,id+' strands jump during rapid reversal');
 assert.equal(JSON.stringify(r.layers.map(l=>l.strandCurve)),sourceJSON,'Shared source curves must remain immutable');
 const saved=r.strandSnapshot(),savedJSON=JSON.stringify(saved);r.update(1/60);assert.equal(JSON.stringify(saved),savedJSON,'A previously returned snapshot was mutated by the pose cache');
 const second=new InkCreature(rig);second.layers=r.layers;const secondTarget=second.strandTarget(second.layers[0]),secondJSON=JSON.stringify(secondTarget);r.update(1/60);r.strandSnapshot();assert.equal(JSON.stringify(secondTarget),secondJSON,'One instance mutated another instance sharing the same source layer');
 const working={...rig,layers:r.layers.map(l=>({name:l.name,kind:'antenna',pivot:l.pivot,phase:l.phase,strand:l.strand}))},scaled={...working,sourceSize:rig.sourceSize.map(n=>n*3),spine:rig.spine.map(p=>p.map(n=>n*3)),layers:working.layers.map(l=>({...l,pivot:l.pivot.map(n=>n*3),strand:{...l.strand,sourceTrace:l.strand.sourceTrace.map(p=>p.map(n=>n*3))}}))};
 const densityPair=[working,scaled].map(spec=>{const q=prepared(spec);q.reset(0,0,.2);q.time=2.7;q.drive=.8;q.vx=60;q.vy=12;q.strandLag=.1;q.pose=q.buildPose();q.targetCurve=makeCurve(q.pose,false);return q.strandSnapshot();});
 for(let j=0;j<densityPair[0].length;j++)for(let n=0;n<densityPair[0][j].nodes.length;n++){const a=densityPair[0][j].nodes[n],b=densityPair[1][j].nodes[n];assert(Math.hypot(a.x-b.x,a.y-b.y)<1e-8,id+' working/master strand geometry differs');}
 if(r.species==='shrimp'){
  const pair=[1,-1].map(face=>{const q=prepared(rig);q.reset(0,0,face===1?0:Math.PI);q.time=2;q.drive=.8;q.vx=face*60;q.vy=0;q.strandLag=.12;q.pose=q.buildPose();q.targetCurve=makeCurve(q.pose,false);return q.strandSnapshot();});
  for(let j=0;j<pair[0].length;j++)for(let n=0;n<pair[0][j].nodes.length;n++){const a=pair[0][j].nodes[n],b=pair[1][j].nodes[n];assert(Math.abs(a.x+b.x)<1e-8&&Math.abs(a.y-b.y)<1e-8,'Mirrored shrimp must mirror the entire flexible strand without inversion');}
 }
 metrics.push({id,strands:r.layers.length,maxRootError,maxMaterialLengthError,maxNormalizedStep});
}
for(const species of ['fish','shrimp']){const front=strandBehavior(species,species+'_04','forward'),back=strandBehavior(species,species+'_04','backward');assert(front.bend>back.bend);assert(back.drag>front.drag);}
assert(strandBehavior('shrimp','shrimp_05','backward').drag<strandBehavior('shrimp','shrimp_04','backward').drag);
assert(strandBehavior('shrimp','shrimp_05','backward').bend>strandBehavior('shrimp','shrimp_04','backward').bend);
assert(strandBehavior('dragon','dragon_04').drag>.8);
console.log(JSON.stringify({passed:true,metrics,directionalSpeciesBehavior:true,shrimpMirroring:true},null,2));
