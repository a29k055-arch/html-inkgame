import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {livingCameraFollow} from '../src-v5/reveal/living-camera.js';
import {GrowthJourney} from '../src-v5/reveal/growth-stages.js';
const v4=JSON.stringify({saveVersion:2,settings:{language:'zh'},progress:{rounds:9},marker:'keep'}),storage=new Map([['boku.save.v4',v4]]);
globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const save=await import('../src-v5/data/save.js');assert.equal(save.SAVE_KEY,'boku.save.v5');assert.equal(save.getSave().progress.rounds,0);assert.equal(save.getSave().settings.language,'zh');save.updateSettings({language:'en'});save.flushSave();assert.equal(storage.get('boku.save.v4'),v4);assert(storage.has('boku.save.v5'));
assert.equal(execFileSync('git',['diff','--name-only','v4-ink-reveal','--','src','index.html'],{encoding:'utf8'}).trim(),'','frozen V4 source and entry remain unchanged');
for(const mobile of [false,true])for(const world of [{width:3910,height:1797},{width:2607,height:3910}])for(const stage of [1,2,3,4]){
 const w=mobile?390:1200,h=mobile?844:900,p={x:world.width/2,y:world.height/2,r:60,form:{species:'dragon'},revealJourney:new GrowthJourney()};p.revealJourney.stage=stage;
 let span=700;const painter={ensure(){},pose(){},playerFrame(){return{minX:p.x-span*.8,minY:p.y-100,maxX:p.x+span*.2,maxY:p.y+100};}},follow=livingCameraFollow(painter);let cam=follow({x:0,y:0,scale:1},p,w,h,mobile,0,true,null,world),scale=cam.scale;
 // A shortening S-bend must not pump zoom in/out while the form remains active.
 span=400;for(let i=0;i<60;i++)cam=follow(cam,p,w,h,mobile,1/60,false,null,world);assert(Math.abs(cam.scale-scale)<1e-10);assert([cam.x,cam.y,cam.scale].every(Number.isFinite));assert(cam.scale>0);assert.equal(p.revealJourney.stage,stage);
 if(stage<4){assert(cam.x>=0&&cam.y>=0);assert(cam.x+w/cam.scale<=world.width+1e-7);assert(cam.y+h/cam.scale<=world.height+1e-7);}
 assert((p.x-cam.x)*cam.scale>=0&&(p.x-cam.x)*cam.scale<=w);assert((p.y-cam.y)*cam.scale>=0&&(p.y-cam.y)*cam.scale<=h);
}
console.log('PASS V4 file/save isolation, independent V5 writes, stable form framing, stage preservation and map containment');
