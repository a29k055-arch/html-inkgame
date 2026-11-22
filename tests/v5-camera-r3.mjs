import assert from 'node:assert/strict';
import {followGrowthCamera,GrowthJourney} from '../src-v5/reveal/growth-stages.js';
import {livingCameraFollow} from '../src-v5/reveal/living-camera.js';
for(const [w,h]of [[1440,900],[390,844],[900,390],[2986,1833]])for(const world of [{width:3910,height:1867},{width:2607,height:3910}]){
 const p={r:180,ink:9600,controller:{type:'human'},revealJourney:new GrowthJourney()};p.revealJourney.stage=4;
 for(const [x,y]of [[180,180],[world.width-180,180],[180,world.height-180],[world.width-180,world.height-180]]){p.x=x;p.y=y;const c=followGrowthCamera({x:0,y:0,scale:1},p,w,h,false,.016,true,null,world);const outside=[-c.x*c.scale/w,(c.x+w/c.scale-world.width)*c.scale/w,-c.y*c.scale/h,(c.y+h/c.scale-world.height)*c.scale/h];assert(outside.every(n=>n<=.05+1e-9));const plain=livingCameraFollow()({x:0,y:0,scale:1},p,w,h,false,.016,true,null,world);p.form={species:'dragon',remaining:5};const form=livingCameraFollow()({x:0,y:0,scale:1},p,w,h,false,.016,true,null,world);assert.deepEqual(form,plain);delete p.form;}
}
console.log('PASS four corners across PC/touch/wide and portrait worlds: <=5% outside, identical possession and ink-ball camera');
