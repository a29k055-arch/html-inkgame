import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {InkCreature} from '../previews/creature-rig/runtime/ink-creature.mjs';
import {LivingPainter,LIVING_RIGS,LIVING_ANCHORS,livingSpecies,playerDragonPose,denseDragonMesh} from '../src-v5/ink/living-painter.js';

const assets={};for(const [species,id]of Object.entries(LIVING_RIGS)){
 const rig=JSON.parse(readFileSync(new URL(`../previews/creature-rig/${id}/rig.json`,import.meta.url))),template=new InkCreature(rig,{length:100,speed:0});template.resourceEntry={refs:1};
 assets[species]={template,calibration:{anchorS:LIVING_ANCHORS[species],anchorT:0,lengthPerRadius:species==='turtle'?3:7,bubbleExtent:200}};
}
// Browser coverage checks the actual copied Canvas. Inject its equivalent into
// the DOM-free contract fixture so no renderer or Canvas shim is needed here.
assets.dragon.playerDragonDetail={bodyImage:{width:16,height:32},mesh:{vertices:[],triangles:[],activeIndices:[]},bytes:16*32*4};
const painter=new LivingPainter({assets}),p={id:'human',x:500,y:700,r:40,collisionScale:1,controller:{type:'human'},effects:{},form:{species:'fish',remaining:5},vx:90,vy:0};
const arena={player:p,entities:[p],speed:()=>100};await painter.prepare(arena.entities);painter.update(1/30,arena,{x:0,y:0,scale:1},{width:1200,height:900});
const a=painter.playerPose(p);assert.equal(a.species,'fish');assert.equal(a.coreRadius,40);assert.deepEqual(a.center,{x:500,y:700});
const sample=(points,s)=>{const z=s*(points.length-1),i=Math.floor(z),t=z-i,u=points[i],v=points[Math.min(i+1,points.length-1)];return{x:u.x+(v.x-u.x)*t,y:u.y+(v.y-u.y)*t};};
let anchor=sample(a.spine,LIVING_ANCHORS.fish);assert(Math.hypot(anchor.x-p.x,anchor.y-p.y)<1e-8,'head-end motion is translated to the logical torso center');
const before=structuredClone(p);p.r=100;painter.update(1/60,arena,{x:0,y:0,scale:1},{width:1200,height:900});const b=painter.playerPose(p);assert.equal(b.length/a.length,2.5);assert.equal(b.coreRadius,100);assert.equal(p.x,before.x);assert.equal(p.y,before.y);
const heading=b.heading;p.vx=0;p.vy=90;painter.update(1/30,arena,{x:0,y:0,scale:1},{width:1200,height:900});const first=painter.playerPose(p);assert(Math.abs(first.heading-heading)<.5,'new direction cannot rotate the entire rig instantly');
for(let i=0;i<50;i++)painter.update(1/30,arena,{x:0,y:0,scale:1},{width:1200,height:900});const turned=painter.playerPose(p);assert(Math.abs(turned.heading-Math.PI/2)<.2);assert.notDeepEqual(first.spine,turned.spine,'real runtime animation, not static sprites');
for(const species of ['dragon','turtle','shrimp']){p.form={species,remaining:5};painter.update(1/30,arena,{x:0,y:0,scale:1},{width:1200,height:900});const q=painter.playerPose(p);assert.equal(q.species,species);assert(q.spine.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)));assert.equal(p.r,100);assert.equal(painter.records.size,1);}
assert(painter.records.get(p).bubble,'shrimp player uses physical-radius bubble instead of widening collision to the antenna');
const n={id:'small',species:'shrimp',x:10000,y:10000,r:5,controller:{type:'ai'},vx:5,vy:0,effects:{}};arena.entities.push(n);painter.update(.1,arena,{x:0,y:0,scale:1},{width:1200,height:900});assert.equal(painter.metrics.culled,1);assert(!painter.records.get(n).tile);
arena.entities=[p];delete p.form;painter.update(.1,arena,{x:0,y:0,scale:1},{width:1200,height:900});assert.equal(painter.records.size,0);assert.equal(livingSpecies(p),undefined);
for(const asset of Object.values(assets))assert.equal(asset.template.resourceEntry.refs,1,'unused rig references return to their prewarmed template');painter.dispose();assert.equal(painter.metrics.loaded,0);
const dragon=assets.dragon.template;dragon.profile={...dragon.profile,idle:1.30,amplitude:1.55};dragon.drive=.8;
const low=playerDragonPose(dragon,48),high=playerDragonPose(dragon,96),arc=points=>points.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0),corner=points=>Math.max(...points.slice(2).map((p,i)=>{const a=points[i],b=points[i+1],u=Math.atan2(b[1]-a[1],b[0]-a[0]),v=Math.atan2(p[1]-b[1],p[0]-b[0]);return Math.abs(Math.atan2(Math.sin(v-u),Math.cos(v-u)));}));
assert.equal(high.length,97);assert(Math.abs(arc(low)-dragon.length)<1e-10);assert(Math.abs(arc(high)-dragon.length)<1e-10);assert(corner(high)<corner(low)*.6,'denser pose reduces abrupt tangent steps without shortening the dragon');
const pixels=new Uint8ClampedArray(32*64*4);for(let y=2;y<62;y++)for(let x=5;x<27;x++)pixels[(y*32+x)*4+3]=255;
const coarse=denseDragonMesh(pixels,32,64,dragon.sourceCurve,{x:200,y:300},21),dense=denseDragonMesh(pixels,32,64,dragon.sourceCurve,{x:200,y:300},42);
assert(dense.vertices.length>coarse.vertices.length*3);assert(dense.triangles.length>coarse.triangles.length*2);assert(dense.vertices.every(v=>v.x>=0&&v.x<=32&&v.y>=0&&v.y<=64&&Number.isFinite(v.s)&&Number.isFinite(v.t)));assert(dense.triangles.flat().every(i=>i<dense.vertices.length&&i<65535));
console.log('PASS actual R4 pose animation, torso-centered world spine, physical growth, smooth turn, shrimp bubble fit, culling and resource cleanup');
