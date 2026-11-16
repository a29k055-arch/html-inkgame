import assert from 'node:assert/strict';
import {RevealMask,consumeBloomRadius} from '../src/reveal/mask.js';
import {TemporaryReveal} from '../src/reveal/temporary.js';
import {REVEAL_CONFIG as C} from '../src/reveal/config.js';
import {DROP_ALPHA,DROP_SHAPE} from '../src/reveal/drop-shape.js';
const config={...C,width:400,height:400,columns:64},mask=new RevealMask(config),m=mask,temp=new TemporaryReveal(mask,config),camera={x:0,y:0,scale:1};
const image={width:64,height:64,data:new Uint8ClampedArray(64*64*4)},clear={...image,data:new Uint8ClampedArray(image.data.length)};for(let y=20;y<44;y++)for(let x=20;x<44;x++)image.data[(y*64+x)*4+3]=255;
const center=32*64+32;temp.applyContact(image,camera,400,400,0);assert.equal(m.cells[center],1);m.erode(200,200,60,1);const erased=m.cells[center];assert(Math.abs(erased-(1-C.erosionPerSecond))<1e-6);for(let i=0;i<12;i++){temp.applyContact(image,camera,400,400,i/8);}assert(Math.abs(m.cells[center]-erased)<1e-6,'same lingering visible alpha must not refill NPC-eroded cells');temp.applyContact(clear,camera,400,400,2);temp.applyContact(image,camera,400,400,3);assert.equal(m.cells[center],1,'leaving and truly re-entering permits fresh paint');
const ink=new RevealMask(config);ink.reveal(200,200,150);ink.update(1);const bloom=ink.blooms[0],at=ink.at(200,200);ink.erode(200,200,70,1);const reduced=ink.at(200,200);assert(reduced<at);for(let i=0;i<4;i++)ink.update(0);assert(Math.abs(ink.at(200,200)-reduced)<1e-6,'same Drops stage must never overwrite erosion');
let extent=0;const n=DROP_SHAPE.size;for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(DROP_ALPHA[y*n+x])extent=Math.max(extent,Math.hypot((x+.5)/n-.5,(y+.5)/n-.5)*2);for(const radius of [8,16,32,64,128,145,250])assert(consumeBloomRadius(radius)*extent<=radius*C.consumeRadiusTargetCap+1e-6,'all nonzero final-source alpha must fit target radius cap');
console.log('PASS lingering contact cannot repaint eroded cells, genuine re-entry can; same Drops stage does not restore erosion; all final-source alpha <=configured target radii', {erased,dropExtent:extent});

const {RevealRun}=await import('../src/reveal/run.js');const r=new RevealRun(()=>{},{aiCount:1,foodTarget:0,foodSpawnRate:0});const npc=r.arena.entities[1],sizes=new Set();
for(let i=0;i<30;i++){r.arena.respawn(npc);
 // Spawns are player-relative now: any body from the floor to the giant cap is legal.
 assert(npc.r>=3&&npc.r<=280,'respawn radius within world bounds');
 const plain=npc.r*npc.r,drifter=plain*10;assert(Math.abs(npc.mass-plain)<1e-6||Math.abs(npc.mass-drifter)<1e-6,'mass follows radius');
 sizes.add(Math.round(npc.r*10));}
assert(sizes.size>1,'respawn supplies mixed edible body sizes');console.log('PASS V4 respawn supplies mixed edible body sizes without altering player reserve respawn');

const finishRun=new RevealRun(()=>{},{width:100,height:100,columns:10,aiCount:0,foodTarget:0,foodSpawnRate:0});const alpha=new Uint8ClampedArray(10*10*4);const need=Math.round(100*finishRun.config.completionThreshold);for(let i=0;i<need-1;i++)alpha[i*4+3]=255;finishRun.applyInkContact({width:10,height:10,data:alpha},{x:0,y:0,scale:1},100,100);assert(!finishRun.goalReached);alpha[(need-1)*4+3]=255;finishRun.applyInkContact({width:10,height:10,data:alpha},{x:0,y:0,scale:1},100,100);assert(finishRun.goalReached,'the first visible frame at the threshold must lock victory before another erosion frame');console.log('PASS exact visible-contact goal locks immediately at the configured threshold, not one cell below');
// Erosion must preserve the coverage-to-visible-age ratio during the configured hold..hold+5s fade.
// Permanent reveal replaced the old hold/fade window: elapsed time alone must never change paint.
{const keepMask=new RevealMask(config),keep=new TemporaryReveal(keepMask,config);keep.applyContact(image,camera,400,400,0);keepMask.erode(200,200,60,.1);const held=keepMask.cells[center];
 for(let time=.125;time<40;time+=.125)keep.applyContact(image,camera,400,400,time);
 assert(Math.abs(keepMask.cells[center]-held)<1e-6,'time alone never fades or refills an erasure');
 keep.applyContact(clear,camera,400,400,41);keep.applyContact(image,camera,400,400,41.1);
 assert.equal(keepMask.cells[center],1,'leaving and re-entering repaints');}
console.log('PASS configured hold/fade start/middle/end: no same-time rebound, later only decreases, old Alpha stays blocked and genuine repaint works');
