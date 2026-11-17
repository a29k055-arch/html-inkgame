import assert from 'node:assert/strict';
import {RevealMask} from '../src/reveal/mask.js';
import {TemporaryReveal} from '../src/reveal/temporary.js';
import {REVEAL_CONFIG as C} from '../src/reveal/config.js';
// Historical two-layer entry now enforces one permanent mask, including NPC erosion.
const m=new RevealMask({width:200,height:100,columns:200}),t=new TemporaryReveal(m,C),cam={x:0,y:0,scale:2},im={width:400,height:200,data:new Uint8ClampedArray(400*200*4)};
for(let y=70;y<130;y++)for(let x=70;x<130;x++)im.data[(y*400+x)*4+3]=255;
assert.equal(m.completion,0);assert(t.applyContact(im,cam,400,200,0));assert(m.at(50,50)>.99);assert.equal(m.at(80,50),0);const progress=m.completion;m.update(600);assert.equal(m.completion,progress);
m.erode(50,50,14,1);t.noteErosion(50,50,14);const erased=m.at(50,50);t.applyContact(im,cam,400,200,601);assert.equal(m.at(50,50),erased);assert(m.completion<progress);
t.applyContact({...im,data:new Uint8ClampedArray(im.data.length)},cam,400,200,602);t.applyContact(im,cam,400,200,603);assert(m.at(50,50)>.99);assert.equal(m.at(80,50),0);m.recount();assert(Math.abs(m.cells.reduce((a,b)=>a+b,0)-m.sum)<1e-6);
console.log('PASS one permanent mask, scaled actual-alpha footprint, time persistence, NPC erosion blocking and genuine reentry');
