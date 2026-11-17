import assert from 'node:assert/strict';
import {REVEAL_CONFIG as C} from '../src/reveal/config.js';
import {RevealRun} from '../src/reveal/run.js';
import {gainReserve,syncReserve,reserveRadius} from '../src/game/ink-reserve.js';
assert.equal(C.width,3910);assert.equal(C.duration,null);assert.equal(C.foodTarget,1400);assert.equal(C.foodSpawnRate,84);assert(Math.abs(C.width/C.height-2774/1275)<1e-12);
const run=new RevealRun(()=>{},{width:100,height:100,columns:100,aiCount:0,foodTarget:0,foodSpawnRate:0,initialItems:0,completionThreshold:2}),camera={x:0,y:0,scale:1};
for(const [i,radius] of [18,90,170].entries()){const data=new Uint8ClampedArray(40000),x=20+i*30,k=50*100+x;data[k*4+3]=255;run.player.r=radius;run.elapsed=i*5;run.applyInkContact({width:100,height:100,data},camera,100,100);run.mask.update(300);assert.equal(run.mask.cells[k],1,'all body sizes paint permanently at exact source pixels');assert.equal(run.mask.cells[k+4],0,'no inferred large circle');}
const itemRun=new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,initialItems:0,completionThreshold:2,columns:32}),p=itemRun.player;gainReserve(p,4000);syncReserve(p,0,true);const ink=p.ink;itemRun.arena.items.push({x:p.x,y:p.y,kind:'shield',tier:1});itemRun.update(.01);syncReserve(p,0,true);assert(p.turtleInk>0);assert(Math.abs(p.r-reserveRadius(p.ink,p.reserveRules))<1e-8);gainReserve(p,100);for(let i=0;i<80;i++)itemRun.update(.05);assert(!p.effects.giant);assert(Math.abs(p.ink-ink-100)<1e-8);
const visuals=new RevealRun(()=>{},{aiCount:4,foodTarget:0,foodSpawnRate:0,initialItems:0,columns:32});assert(!visuals.player.v4Visual);assert(visuals.arena.entities.slice(1).every(e=>e.v4Visual));for(const npc of visuals.arena.entities.slice(1)){delete npc.v4Visual;visuals.arena.respawn(npc);assert(npc.v4Visual);}
console.log('PASS current map aspect, exact permanent contact at three sizes, one turtle size source and safe expiry, V4 NPC mark through respawn');
