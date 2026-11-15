import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {Inkstone,entity} from '../src/game/inkstone.js';
import {PondHabitat} from '../src/reveal/pond-habitat.js';
import {POND_CONFIG as C,POND_ART_FILES,pondCollisionRadius,pondObjectRadius,assignPondAppearance,canEatPondObject} from '../src/reveal/pond-rules.js';
import {REVEAL_ARTWORKS,artworkWorld} from '../src/reveal/artwork-levels.js';
const arena=(world={width:2606.6667,height:3910})=>new Inkstone(()=>{},{world,aiCount:0,foodTarget:0,foodSpawnRate:0,boundarySliding:true,autoFinish:false});
let seed=7;const originalRandom=Math.random;const rng=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
for(const [kind,files] of Object.entries(POND_ART_FILES)){
 const variants=new Set(),flips=new Set();for(const filename of files)assert(existsSync(new URL('../assets/pond/'+filename,import.meta.url)));
 for(let i=0;i<200;i++){const v=assignPondAppearance({kind},rng);assert(v.variant>=0&&v.variant<files.length);variants.add(v.variant);flips.add(v.flipX);assert.equal(typeof v.flipX,'boolean');assert.equal(v.flipY,undefined);if(kind==='leaf'||kind==='flower')assert.equal(v.angle,0);if(kind==='magnet')assert(Math.abs(v.angle)<=Math.PI*.15);else assert(v.angle>=0&&v.angle<=Math.PI*2);}
 assert.equal(variants.size,files.length);assert.equal(flips.size,2);
}
assert(!Object.values(POND_ART_FILES).flat().some(n=>['turtle-v3.png','lotus-leaf-v4.png','lotus-flower-v4.png'].includes(n)));
assert.equal(pondCollisionRadius({kind:'leaf',r:80}),16);assert.equal(pondCollisionRadius({kind:'leaf',r:225}),40.5);assert.equal(pondCollisionRadius({kind:'leaf',r:1000}),42);assert.equal(pondCollisionRadius({kind:'flower',r:200}),0);assert(!canEatPondObject(10000,{kind:'leaf'}));

// The same four initial leaves occupy all four broad regions, with natural size variation.
Math.random=rng;try{
 let minCount=4,minQuadrants=4,minSpread=Infinity,minSize=Infinity,maxSize=0;
 for(let trial=0;trial<60;trial++){
  const g=arena(),h=new PondHabitat(g,{initialAnimals:0,nurseryLeaf:true,playerSpawnClearance:70});
  minCount=Math.min(minCount,h.leaves.length);const q=new Set(h.leaves.map(l=>(l.x>=g.world.width/2?1:0)+(l.y>=g.world.height/2?2:0)));minQuadrants=Math.min(minQuadrants,q.size);
  const xs=h.leaves.map(l=>l.x),ys=h.leaves.map(l=>l.y);minSpread=Math.min(minSpread,Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)));
  for(const l of h.leaves){assert(l.r>=C.leafRadiusMin&&l.r<=C.leafRadiusMax);assert(pondCollisionRadius(l)<l.r*.25);minSize=Math.min(minSize,l.r);maxSize=Math.max(maxSize,l.r);}
 }
 assert.equal(minCount,4);assert.equal(minQuadrants,4);assert(minSpread>900);assert(minSize<120&&maxSize>210);
 console.log(JSON.stringify({initialLeaves:minCount,quadrants:minQuadrants,minSpread,minSize,maxSize}));
}finally{Math.random=originalRandom;}
Math.random=rng;try{for(const art of REVEAL_ARTWORKS)for(let i=0;i<6;i++){const g=arena(artworkWorld(art)),h=new PondHabitat(g,{initialAnimals:0,nurseryLeaf:true,playerSpawnClearance:70});assert.equal(h.leaves.length,4,art.id+' keeps its four scattered leaves');assert.equal(new Set(h.leaves.map(l=>(l.x>=g.world.width/2?1:0)+(l.y>=g.world.height/2?2:0))).size,4);}}finally{Math.random=originalRandom;}

for(const radius of [8,35,90,145]){
 const g=arena(),h=new PondHabitat(g,{initialLeaves:0,initialAnimals:0}),leaf=h.object('leaf',1300,1955,200);g.items.push(leaf);const core=pondCollisionRadius(leaf);
 const e=entity('core-'+radius,leaf.x+core+radius+5,leaf.y,radius,{type:'human'});g.entities.push(e);
 assert(Math.hypot(e.x-leaf.x,e.y-leaf.y)<leaf.r+radius,'actor may overlap the visible blade');const before={x:e.x,y:e.y};g.constrain(e);assert.deepEqual({x:e.x,y:e.y},before,'blade alone cannot project NPC');
 assert(!g.isPointBlockedForNpc(e,e));e.x=leaf.x;e.y=leaf.y;assert(g.isPointBlockedForNpc(e,e));g.constrain(e);assert(Math.hypot(e.x-leaf.x,e.y-leaf.y)>=radius+core+.99);
 const p=g.player;p.x=leaf.x;p.y=leaf.y;g.constrain(p);assert.equal(p.x,leaf.x);assert.equal(p.y,leaf.y);
 e.x=leaf.x-core-radius-10;e.y=leaf.y;e.vx=e.vy=0;let travel=0,prev={x:e.x,y:e.y},lastY=null,flips=0;
 for(let i=0;i<900;i++){g.elapsed+=1/60;const desired={x:1,y:0},v=h.steerNpc(e,desired);e.vx=v.x*90;e.vy=v.y*90;e.x+=e.vx/60;e.y+=e.vy/60;g.constrain(e);travel+=Math.hypot(e.x-prev.x,e.y-prev.y);prev={x:e.x,y:e.y};if(Math.abs(v.y)>.05){if(lastY!==null&&Math.sign(v.y)!==lastY)flips++;lastY=Math.sign(v.y);}assert(Math.hypot(e.x-leaf.x,e.y-leaf.y)>=radius+core+.98);}
 assert(e.x>leaf.x+radius+core,'NPC really moves past the stem');assert(flips<7,'no high-frequency left/right thrashing');assert(travel<1450);
}

// A genuine core-sized cage still permits calm waiting rather than random squeezing.
{
 const g=arena(),h=new PondHabitat(g,{initialLeaves:0,initialAnimals:0});
 for(const [dx,dy] of [[111,0],[-111,0],[0,111],[0,-111]])g.items.push(h.object('leaf',1300+dx,1955+dy,108));
 const e=entity('core-cage',1300,1955,90,{type:'human'});g.entities.push(e);let travel=0,previous={x:e.x,y:e.y};
 for(let i=0;i<1200;i++){g.elapsed+=1/60;const v=h.steerNpc(e,{x:1,y:0});e.vx=v.x*90;e.vy=v.y*90;e.x+=e.vx/60;e.y+=e.vy/60;g.constrain(e);travel+=Math.hypot(e.x-previous.x,e.y-previous.y);previous={x:e.x,y:e.y};}
 assert(travel<1);assert(Math.hypot(e.vx,e.vy)<.01);
}

// Spawn-only tier hook: existing animals are not revisited by habitat updates.
{
 const g=arena();let calls=0;const h=new PondHabitat(g,{initialLeaves:0,initialAnimals:0,prepareAnimal:item=>{item.tier=++calls;}}),a=h.spawnAnimal('magnet');assert.equal(a.tier,1);h.update(.1);assert.equal(a.tier,1);const b=h.spawnAnimal('speed');assert.equal(b.tier,2);
}
globalThis.Image=class{complete=true;naturalWidth=512;naturalHeight=512;async decode(){}};
const {drawPondPickup,preloadPondPickups}=await import('../src/reveal/pickups.js');await preloadPondPickups();
for(const kind of Object.keys(POND_ART_FILES)){let rotation,scale;const c={save(){},restore(){},translate(){},rotate(a){rotation=a;},scale(x,y){scale=[x,y];},drawImage(){}};drawPondPickup(c,{kind,angle:kind==='magnet'?.4:2,flipX:true,age:3,x:20,y:25});assert.deepEqual(scale,[-1,1]);if(kind==='leaf'||kind==='flower')assert.equal(rotation,0);}
console.log('PASS dispersed variable-size leaves, small stem-only collisions at four NPC sizes, stable detours/cage, player freedom, real catalog assets, fixed plant orientation and horizontal-only mirrors');
