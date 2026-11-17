import assert from 'node:assert/strict';
import {NpcPainter,EYE_SPRITE_GEOMETRY,npcDangerState} from '../src/ink/npc-painter.js';
import {coreRadius,spikeRadius,spikeContact,skinPose,spikeShape} from '../src/game/alien-geometry.js';
const gradient={addColorStop(){}},bank=Array.from({length:8},(_,i)=>({i}));
for(const radius of [6,40,170,360])for(const collisionScale of [.88,1])for(const dense of [false,true]){
 const draws=[],ctx=new Proxy({globalAlpha:1,drawImage:(...args)=>draws.push(args),createRadialGradient:()=>gradient},{get:(t,k)=>k in t?t[k]:(()=>{})});
 const eye={id:'eye',skinIndex:2,appearance:'eye',v4Visual:true,r:radius,x:500,y:450,vx:0,vy:0,effects:dense?{dense:1}:{},collisionScale};
 NpcPainter.prototype.draw.call({eyeSprites:bank,v4EyeSprites:bank,tailStates:new WeakMap()},ctx,eye,0,[]);
 const [,x,y,w,h]=draws[0],core=coreRadius(eye);assert.equal(w,h);assert(Math.abs(x+w/2-eye.x)<1e-9);assert(Math.abs(y+h/2-eye.y)<1e-9);
 assert(Math.abs(w/EYE_SPRITE_GEOMETRY.logicalSize*EYE_SPRITE_GEOMETRY.coreRadius-core)<1e-9,'source solid radius maps exactly to logical core');
 const player={id:'human',x:eye.x,y:eye.y,r:core/2,effects:{}};eye.controller={intent:'hunt',goal:{id:player.id}};assert.equal(npcDangerState(eye,player,.47).radius,core);
 const thorn={...eye,appearance:'thorn',visualTime:1.8},pose=skinPose(thorn);assert(Math.abs(spikeRadius(thorn)*.73-coreRadius(thorn))<1e-9);
 const shape=spikeShape(0,pose.variant,pose.frame,false,true),a=shape.a+pose.rotation,r=spikeRadius(thorn),tip={x:thorn.x+Math.cos(a)*shape.length*r,y:thorn.y+Math.sin(a)*shape.length*r,r:.05,effects:{}};
 assert(spikeContact(thorn,tip,.05),'drawn spike tip and independent spike damage share scale');
}
// Classic spike reach stays unchanged; V4 alignment never shrinks the gameplay core.
const classic={r:100,appearance:'thorn',collisionScale:.88,effects:{}};assert.equal(spikeRadius(classic),100);assert.equal(coreRadius(classic),100*.73*.88);
console.log('PASS NPC eye centered source-radius projection, live growth/dense/collision scales, exact warning radius and independently aligned thorn tips');
