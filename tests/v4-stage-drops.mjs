import assert from 'node:assert/strict';
import {REVEAL_CONFIG as C} from '../src/reveal/config.js';
import {RevealMask,consumeBloomRadius,DROP_ALPHA_EXTENT} from '../src/reveal/mask.js';
import {DROP_ALPHA} from '../src/reveal/drop-shape.js';

const alphaMean=DROP_ALPHA.reduce((a,b)=>a+b,0)/(255*DROP_ALPHA.length),rows=[];
for(const target of [8,16,32,64,120]){
 const nominal=consumeBloomRadius(target),effective=nominal*DROP_ALPHA_EXTENT;
 assert(effective<=target*C.consumeRadiusTargetCap+1e-6);
 assert(nominal<=C.consumeRadiusMax);
 if(target<=18)assert.equal(nominal,3.75*target,'tiny enemies must retain the old world footprint');
 const m=new RevealMask({width:1600,height:1600,columns:800});m.consume({kind:'enemy',coreRadius:target,x:800,y:800,r:target*4,playerSize:999});m.update(C.bloomDuration);
 const expected=alphaMean*(nominal*2)**2,actual=m.sum*4;
 assert(Math.abs(actual-expected)<expected*.04,'persistent area follows the original non-circular Drops alpha');
 const before=m.sum;m.update(20);assert.equal(m.sum,before,'completed permanent Drop cannot time out');
 rows.push({target,nominal,effective,alphaArea:actual,areaGain:(nominal/(3.75*target))**2-1});
}
let previous=0;for(let r=.1;r<250;r+=.1){const value=consumeBloomRadius(r);assert(value>=previous-1e-8);assert(value-previous<.5);previous=value;}
for(const joint of [18,98]){const left=consumeBloomRadius(joint-1e-4),right=consumeBloomRadius(joint+1e-4);assert(right-left<.001);}
const small=new RevealMask();assert.equal(small.consume({kind:'food',x:100,y:100,r:8}),false);assert.equal(small.blooms.length,0);
assert.equal(C.bloomDuration,1.7);
console.log('PASS continuous size growth, tiny-enemy restraint, same-source permanent alpha area, no timed loss, configured effective radius cap; screen magnification is camera-only');
console.table(rows);
