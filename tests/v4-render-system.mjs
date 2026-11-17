import assert from 'node:assert/strict';
import {RevealMask} from '../src/reveal/mask.js';
import {TemporaryReveal} from '../src/reveal/temporary.js';
import {npcDangerState,NpcPainter} from '../src/ink/npc-painter.js';
import {GameRenderer} from '../src/ink/game-renderer.js';
import {coreRadius} from '../src/game/alien-geometry.js';
import {HERO_PRESETS,heroSizeProfile} from '../src/ink/hero-presets.js';
import {relativeInkProfile} from '../src/ink/hero-relative-motion.js';
// A faint visible trail must publish its first dirty version without an unrelated erasure/drop.
const m=new RevealMask({width:100,height:100,columns:20}),contact=new TemporaryReveal(m,{}),data=new Uint8ClampedArray(20*20*4);
data[(10*20+10)*4+3]=32;const image={width:20,height:20,data},camera={x:0,y:0,scale:2},v=m.version;
assert(contact.applyContact(image,camera,200,200,0));assert(m.at(52.5,52.5)>0);assert.equal(m.version,v+1);
assert.equal(m.at(25,25),0,'no invented circle outside actual alpha');m.erode(52.5,52.5,12,.1);const erased=m.at(52.5,52.5);contact.applyContact(image,camera,200,200,.1);assert.equal(m.at(52.5,52.5),erased,'lingering thin ink cannot undo erosion');
contact.applyContact({...image,data:new Uint8ClampedArray(data.length)},camera,200,200,.2);contact.applyContact(image,camera,200,200,.3);assert(m.at(52.5,52.5)>erased);
// Warnings use effective collision core, target intent, lethal ratio and actual proximity.
const p={id:'human',x:100,y:100,r:20,effects:{}},e={id:'npc',x:124,y:100,r:60,appearance:'thorn',v4Visual:true,effects:{},controller:{intent:'hunt',goal:{id:'human'}}};
let warning=npcDangerState(e,p,3.75);assert(warning);assert.equal(warning.radius,coreRadius(e));e.controller.intent='forage';assert.equal(npcDangerState(e,p),null);e.controller.intent='hunt';e.x=800;assert.equal(npcDangerState(e,p),null);e.x=124;e.r=24;assert.equal(npcDangerState(e,p),null);
// Sort-order changes must never change an eye's mottled body frame / white flecks.
const draws=[];const gradient={addColorStop(){}};const c=new Proxy({drawImage:(sprite)=>draws.push(sprite),createRadialGradient:()=>gradient,globalAlpha:1},{get:(t,k)=>k in t?t[k]:(()=>{})});
const spriteBank=Array.from({length:8},(_,i)=>({i})),painter={eyeSprites:spriteBank,tailStates:new WeakMap()},eye={id:'eye',skinIndex:3,appearance:'eye',r:40,x:0,y:0,vx:0,vy:0,effects:{},v4Visual:true};
NpcPainter.prototype.draw.call(painter,c,eye,0,[]);NpcPainter.prototype.draw.call(painter,c,eye,7,[]);assert.equal(draws[0],draws[1]);assert.equal(draws[0],spriteBank[3]);
// Large-body tuning is physical-size driven; H/I/K remain immutable references.
const base=relativeInkProfile(HERO_PRESETS.airflow,.65),small=heroSizeProfile(base,18),mid=heroSizeProfile(base,90),large=heroSizeProfile(base,210);
assert.equal(small.bigBody,0);assert.equal(mid.bodyFeed,1);assert(large.bodyFeed<.6);assert(large.tailFade>small.tailFade);assert(large.wakeFloor<small.wakeFloor);assert.equal(heroSizeProfile(HERO_PRESETS.wash,260),HERO_PRESETS.wash);assert.equal(heroSizeProfile(HERO_PRESETS.living,260),HERO_PRESETS.living);assert.equal(heroSizeProfile(HERO_PRESETS.longcloud,260),HERO_PRESETS.longcloud);
console.log('PASS immediate faint-alpha dirty publication, scaled contact/erosion/reentry, true lethal hunting warning core, stable eye identity, physical large-body-only flow tuning');

// A screen-space world clip must remain exact at every camera scale, including overscan.
for(const scale of [.47,.79,3.75]){const calls=[],ctx={save(){calls.push('save')},restore(){calls.push('restore')},beginPath(){},rect(...args){calls.push(args)},clip(){calls.push('clip')}};const g={ctx,camera:{x:-15,y:42,scale},world:{width:3910,height:1800}};GameRenderer.prototype.beginWorldClip.call(g);GameRenderer.prototype.endWorldClip.call(g);assert.deepEqual(calls,['save',[15*scale,-42*scale,3910*scale,1800*scale],'clip','restore']);}
console.log('PASS exact frame crop at near/intermediate/final camera scales');
