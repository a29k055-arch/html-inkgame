import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {POND_PICKUP_VARIANTS,pondPickupLayer,pondRenderOrder} from '../src/reveal/pickups.js';
import {POND_RULES,assignPondAppearance} from '../src/reveal/pond-rules.js';
import {RevealRun} from '../src/reveal/run.js';
for(const [kind,variants] of Object.entries(POND_PICKUP_VARIANTS)){
 assert.equal(variants.length,3);
 const hashes=variants.map(v=>{const b=fs.readFileSync(new URL(v.src));assert(b.readUInt32BE(16)<=512&&b.readUInt32BE(20)<=512);assert.equal(b[25],6,'RGBA source');return crypto.createHash('sha256').update(b).digest('hex');});
 assert.equal(new Set(hashes).size,3,kind+' must have three distinct image assets');
 const values=new Set(),angles=[];for(let i=0;i<90;i++){const item=assignPondAppearance({kind},()=>((i*37+angles.length*17)%90)/90);values.add(item.variant);angles.push(item.angle);}
 assert.equal(values.size,3);if(kind==='magnet')assert(angles.every(v=>Math.abs(v)<=.28));else assert(Math.max(...angles)-Math.min(...angles)>4);
}
const items=Object.entries(POND_RULES).map(([kind,rule])=>({id:kind,kind,r:rule.r,x:200,y:200})).sort((a,b)=>pondRenderOrder(a)-pondRenderOrder(b));
assert.deepEqual(items.map(i=>i.kind),['magnet','speed','leaf','shield','flower']);
for(const radius of [18,50,200]){
 const game={player:{r:radius},items};const pass=Object.fromEntries(items.map(i=>[i.kind,pondPickupLayer(i,game)]));
 assert.equal(pass.flower,'top');
 if(radius<100){assert.equal(pass.leaf,'upper');assert.equal(pass.shield,'upper');}
 else{assert.equal(pass.leaf,'lower');assert.equal(pass.shield,'lower');}
 assert(items.findIndex(i=>i.kind==='magnet')<items.findIndex(i=>i.kind==='leaf'));
}
const run=new RevealRun(()=>{},{initialItems:0,aiCount:0,foodTarget:0,foodSpawnRate:0});
for(const kind of Object.keys(POND_RULES)){const variants=new Set();for(let i=0;i<60;i++){const item=run.habitat.object(kind,100,100);assert(Number.isFinite(item.angle));variants.add(item.variant);}assert.equal(variants.size,3,'actual '+kind+' spawn factory uses every variant');}
console.log('PASS fifteen distinct RGBA assets, stable randomized spawn variants/headings, narrow shrimp headings and strict fish/leaf/turtle/flower passes');
