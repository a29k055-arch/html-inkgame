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
const before=structuredClone(p);p.r=100;painter.update(1/60,arena,{x:0,y:0,scale:1},{width:1200,height:900});const b=painter.playerPose(p);assert(b.length/a.length>1&&b.length/a.length<1.5,'growth is visually eased instead of jumping');for(let i=0;i<90;i++)painter.update(1/60,arena,{x:0,y:0,scale:1},{width:1200,height:900});assert(Math.abs(painter.playerPose(p).length/a.length-2.5)<.001);assert.equal(b.coreRadius,100);assert.equal(p.x,before.x);assert.equal(p.y,before.y);
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

// A visible NPC reuses pre-baked real-rig frames; it must never request a live
// mesh raster during ordinary rendering. Body geometry follows that same frame.
const asset=assets.fish,canvas={width:100,height:40};asset.calibration={...asset.calibration,bodySamples:[{s:.4,t:0,w:1,r:2}],bodySections:[{s:.4,t:0,r:2}],sourceArea:100};
asset.npcAtlas={bounds:{x:-60,y:-10,w:80,h:20},frames:[{canvas,body:[{x:-20,y:0,w:1,r:2}],sections:[{x:-20,y:0,r:3}]}],seconds:3,bytes:16000};
const npc={id:'cached-fish',species:'fish',appearance:'living',x:300,y:200,r:10,controller:{type:'ai'},vx:40,vy:0},cached=new LivingPainter({assets});await cached.prepare([npc]);cached.update(1/15,{entities:[npc],speed:()=>80},{x:0,y:0,scale:1},{width:1200,height:900});
assert(cached.records.get(npc).creature.profile.amplitude<asset.template.profile.amplitude*.7,'NPC body sway is reduced, independently of player animation');
assert(cached.records.get(npc).creature.profile.maxAngularVelocity<asset.template.profile.maxAngularVelocity,'NPC presentation turns are calmer');
cached.raster=()=>{throw Error('ordinary NPC must not rasterize a live GPU rig');};let drawn=0;const context={save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(image){assert.equal(image,canvas);drawn++;}};cached.draw(context,npc);cached.draw(context,npc);assert.equal(drawn,2);assert.equal(cached.metrics.liveRasters,0);assert.equal(cached.metrics.sharedFrames,2);
const body=npc.livingBody;assert.equal(body.species,'fish');assert.equal(body.coreRadius,10);assert.equal(body.samples.length,1);assert.equal(body.samples[0].w,1);assert(body.samples[0].r>0&&body.sections[0].r>0);assert(body.area>0&&body.bound>10);assert(Number.isFinite(body.samples[0].x)&&Number.isFinite(body.samples[0].y));
const revision=body.revision;cached.update(1/60,{entities:[npc],speed:()=>80},{x:0,y:0,scale:1},{width:1200,height:900});assert.equal(npc.livingBody.revision,revision,'unchanged frame/angle/size reuses collision geometry');npc.r=20;cached.update(1/60,{entities:[npc],speed:()=>80},{x:0,y:0,scale:1},{width:1200,height:900});assert.equal(npc.livingBody.coreRadius,20);assert(Math.abs(npc.livingBody.area/body.area-4)<1e-10);assert(Math.abs(npc.livingBody.samples[0].x/body.samples[0].x-2)<1e-10);assert(npc.livingBody.revision>revision);cached.dispose();
console.log('PASS shared NPC frames without live GPU raster, calmer NPC profiles, and cached weighted body/section geometry at current physical scale');

// Equivalent physical body area prevents the long fish/dragon from inflating
// to ten or twenty-four logical radii on each five-second possession.
const normAsset=assets.fish;normAsset.calibration={...normAsset.calibration,sourceArea:30000};const norm=new LivingPainter({assets}),np={id:'human',controller:{type:'human'},effects:{},x:0,y:0,r:60,vx:80,vy:0,form:{species:'fish',remaining:5}},na={player:np,entities:[np],speed:()=>120};norm.update(1/60,na);assert(Math.abs(np.livingBody.area/(Math.PI*np.r*np.r)-1)<1e-12);const nscale=norm.records.get(np).scale;np.r=120;norm.update(1/60,na);assert(norm.records.get(np).scale/nscale<1.2,'growth has a bounded first visual step');for(let i=0;i<90;i++)norm.update(1/60,na);assert(Math.abs(norm.records.get(np).scale/nscale-2)<1e-5);np.form={species:'shrimp',remaining:5};np.r=240;norm.update(1/60,na);const bubble=norm.records.get(np),bubbleBody=np.livingBody;assert(bubble.shownRadius>120&&bubble.shownRadius<150);assert.equal(bubbleBody.coreRadius,240,'bubble retains logical growth reference');assert.equal(bubbleBody.sections[0].r,bubble.shownRadius);assert.equal(bubbleBody.bound,bubble.shownRadius);assert(Math.abs(bubbleBody.area-Math.PI*bubble.shownRadius**2)<1e-8);assert(bubbleBody.samples.every(p=>Math.hypot(p.x,p.y)<bubble.shownRadius));assert.equal(norm.playerPose(np).worldRadius,bubble.shownRadius);assert.equal(norm.playerFrame(np).maxX,bubble.shownRadius);for(const [vx,vy]of [[0,120],[-120,0],[0,-120],[120,0]]){np.vx=vx;np.vy=vy;for(let i=0;i<120;i++)norm.update(1/60,na);assert(Math.abs(norm.snapshot(np).inclination)<=.5000001,'shrimp paper motion never rotates legs overhead');}norm.dispose();
console.log('PASS equal-area player forms, eased growth with matching bubble geometry, upright shrimp and continued radius scaling');

const external=new LivingPainter({assets}),dp={id:'human',controller:{type:'human'},form:{species:'dragon',remaining:5},effects:{},x:300,y:400,r:60,vx:95,vy:20},da={player:dp,entities:[dp],speed:()=>120};for(let i=0;i<120;i++)external.update(1/60,da);const dc=external.records.get(dp).creature;assert(Math.hypot(dc.vx,dc.vy)>1,'R8 strands receive actual external player motion');assert.equal(dc.x,0);assert.equal(dc.y,0);assert.equal(dp.x,300);assert.equal(dp.y,400);external.dispose();console.log('PASS R8 actual whisker velocity without duplicate entity/rig translation');
