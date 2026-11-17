import assert from 'node:assert/strict';
import {DROP_VARIANTS,dropSilhouette,dropStage,sampleDrop} from '../src/reveal/drop-shape.js';
import {RevealMask,DROP_ALPHA_EXTENT} from '../src/reveal/mask.js';

const fingerprints=new Set();
for(let variant=0;variant<DROP_VARIANTS;variant++){
 const final=dropSilhouette(variant);fingerprints.add(Buffer.from(final).toString('base64'));
 assert.deepEqual(dropStage(1,variant),final);
 for(let frame=1;frame<=32;frame++){const prev=dropStage((frame-1)/32,variant),now=dropStage(frame/32,variant);assert(now.every((v,i)=>v>=prev[i]&&v<=final[i]));}
}
assert.equal(fingerprints.size,DROP_VARIANTS,'variants change silhouettes, not only rotation');
const mask=new RevealMask({width:192,height:192,columns:96,bloomDuration:1});
const ids=[];for(let i=0;i<20;i++){const b=mask.reveal(96,96,60,{kind:i%2?'skill':'enemy'});ids.push(b.variant);if(i>0)assert.notEqual(ids[i],ids[i-1]);if(i>1)assert.notEqual(ids[i],ids[i-2]);}
// Gameplay samples exactly the same frame, deformation, rotation and origin as painter.
const b=mask.blooms[0];b.age=.5;mask.stampDrop(b);
const x=48,y=48,sx=mask.width/mask.cols,dx=(x+.5)*sx-b.x,dy=(y+.5)*sx-b.y,co=Math.cos(b.angle),si=Math.sin(b.angle);
const expected=sampleDrop(dropStage(.5,b.variant),(dx*co+dy*si)/(2*b.r)+.5,(-dx*si+dy*co)/(2*b.r)+.5)/255;
assert(Math.abs(mask.cells[y*mask.cols+x]-expected)<1e-7);
const before=mask.sum;mask.stampDrop(b);assert.equal(mask.sum,before,'same expansion frame never pays/repaints twice');
assert(DROP_ALPHA_EXTENT<1.42,'all variants remain within the bounded stamp region');
console.log('PASS six distinct bounded Drop silhouettes, no three consecutive repeats, monotonic expansion and exact visual/mask source');
