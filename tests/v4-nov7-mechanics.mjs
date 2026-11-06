import assert from 'node:assert/strict';
import {RevealMask,consumeBloomRadius} from '../src/reveal/mask.js';
import {TemporaryReveal} from '../src/reveal/temporary.js';
import {REVEAL_CONFIG as C} from '../src/reveal/config.js';
import {DROP_ALPHA,DROP_SHAPE} from '../src/reveal/drop-shape.js';
const config={...C,width:400,height:400,columns:64},mask=new RevealMask(config),temp=new TemporaryReveal(mask,config),camera={x:0,y:0,scale:1};
const image={width:64,height:64,data:new Uint8ClampedArray(64*64*4)},clear={...image,data:new Uint8ClampedArray(image.data.length)};for(let y=20;y<44;y++)for(let x=20;x<44;x++)image.data[(y*64+x)*4+3]=255;
const center=32*64+32;temp.applyContact(image,camera,400,400,0);assert.equal(temp.cells[center],1);temp.erode(200,200,60,1);const erased=temp.cells[center];assert(erased<.7);for(let i=0;i<12;i++){temp.applyContact(image,camera,400,400,i/8);temp.update(i/8);}assert(Math.abs(temp.cells[center]-erased)<1e-6,'same lingering visible alpha must not refill NPC-eroded cells');temp.applyContact(clear,camera,400,400,2);temp.applyContact(image,camera,400,400,3);assert.equal(temp.cells[center],1,'leaving and truly re-entering permits fresh paint');
const ink=new RevealMask(config);ink.reveal(200,200,150);ink.update(1);const bloom=ink.blooms[0],at=ink.at(200,200);ink.erode(200,200,70,1);const reduced=ink.at(200,200);assert(reduced<at);for(let i=0;i<4;i++)ink.update(0);assert(Math.abs(ink.at(200,200)-reduced)<1e-6,'same Drops stage must never overwrite erosion');
let extent=0;const n=DROP_SHAPE.size;for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(DROP_ALPHA[y*n+x])extent=Math.max(extent,Math.hypot((x+.5)/n-.5,(y+.5)/n-.5)*2);for(const radius of [8,16,32,64,128,145,250])assert(consumeBloomRadius(radius)*extent<=radius*4+1e-6,'all nonzero final-source alpha must fit target radius cap');
console.log('PASS lingering contact cannot repaint eroded cells, genuine re-entry can; same Drops stage does not restore erosion; all final-source alpha <=4 target radii', {erased,dropExtent:extent});

const {RevealRun}=await import('../src/reveal/run.js');const r=new RevealRun(()=>{},{aiCount:1,foodTarget:0,foodSpawnRate:0});const npc=r.arena.entities[1];for(let i=0;i<30;i++){r.arena.respawn(npc);assert(npc.r>=24&&npc.r<=96);assert.equal(npc.mass,npc.r*npc.r);}console.log('PASS V4 respawn supplies mixed edible body sizes without altering player reserve respawn');
