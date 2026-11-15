import assert from 'node:assert/strict';
import {GrowthEcology,GROWTH_ECOLOGY_CONFIG as C} from '../src/reveal/growth-ecology.js';
import {pondCollisionRadius} from '../src/reveal/pond-rules.js';

const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const make=(width=2606.6667,height=3910,x=width/2,y=height/2)=>{const player={x,y,r:9,id:'player'};return {player,world:{width,height},entities:[player],items:[],foods:Array.from({length:800},(_,i)=>({x:900,y:900,r:3+i%5,mass:(3+i%5)**2,shape:['circle','square','triangle'][i%3]}))};};

// Guaranteed initial proportions and a discoverable small-prey ring, without
// surrounding a micro player with the medium/large threats.
for(const [width,height] of [[2606.6667,3910],[3910,1797],[1100,2400]]){
 const g=make(width,height),e=new GrowthEcology(()=>1,{},rng(7));let small=0,medium=0,large=0;
 for(let i=0;i<22;i++){
  const {radius:r,point:p}=e.spawn(g,i);
  assert(r>=5.5&&r<=80);assert(p.x>=r&&p.x<=width-r&&p.y>=r&&p.y<=height-r);
  if(r<=12)small++;else if(r<=28)medium++;else large++;
  if(i<9)assert(Math.hypot(p.x-g.player.x,p.y-g.player.y)<=C.nearSmallMax+.001);
  if(r>28)assert(Math.hypot(p.x-g.player.x,p.y-g.player.y)>=C.largeSpawnMin-.001);
  g.entities.push({id:i,...p,r,mass:r*r,controller:{type:'ai',profile:{personality:i%7}}});
 }
 assert.deepEqual([small,medium,large],[13,7,2]);
 const mass=g.entities.map(n=>n.mass),positions=g.entities.map(n=>[n.x,n.y]);
 let phase=1;const changed=new GrowthEcology(()=>phase,{},rng(18)),before=JSON.stringify(g.entities);
 for(phase=2;phase<=4;phase++)for(let i=0;i<100;i++)changed.spawn(g,i,{respawn:true,entity:g.entities[1]});
 assert.equal(JSON.stringify(g.entities),before,'a stage change or spawn query cannot mutate the existing ecosystem');
 assert.deepEqual(g.entities.map(n=>n.mass),mass);assert.deepEqual(g.entities.map(n=>[n.x,n.y]),positions);
}

// Every later stage retains reachable prey and introduces larger threats, only
// for newly spawned units. Distribution error is bounded for a seeded sample.
for(const [phase,bands] of [[1,C.microBands],[2,C.flowingBands],[3,C.gatheringBands],[4,C.paintingBands]]){
 const g=make(),e=new GrowthEcology(()=>phase,{},rng(49)),counts=[0,0,0];g.player.r=150;
 for(let i=0;i<1200;i++){const {radius:r}=e.spawn(g,i,{respawn:true});const j=bands.findIndex(b=>r>=b[1]&&r<=b[2]);assert(j>=0);counts[j]++;}
 for(let j=0;j<3;j++){const expected=1200*(bands[j][0]-(bands[j-1]?.[0]||0));assert(Math.abs(counts[j]-expected)<75);}
}

// A discovered later stage must not remove all edible newborn prey after death.
// Recovery keys off permanent base radius, not temporary turtle size.
for(const phase of [2,3,4]){
 const g=make(),e=new GrowthEcology(()=>phase,{},()=>.01);g.player.r=60;g.player.growth={baseRadius:9};
 const before=JSON.stringify(g.entities),spawn=e.spawn(g,1,{respawn:true});
 assert(spawn.radius<9/1.06&&spawn.radius>=C.recoveryPreyMin);
 assert.equal(JSON.stringify(g.entities),before);
 for(const roll of [.65,.98]){
  const recover=new GrowthEcology(()=>phase,{},()=>roll),healthy=new GrowthEcology(()=>phase,{},()=>roll),h=make();h.player.r=150;
  assert.equal(recover.spawn(g,1,{respawn:true}).radius,healthy.spawn(h,1,{respawn:true}).radius,'recovery must not shrink medium/large threats');
 }
}

// Nursery redistribution retains every food object, total count and actual mass.
// No periodic refill is installed and a second call cannot seed a new batch.
{
 const g=make(),e=new GrowthEcology(()=>1,{},rng(35)),refs=[...g.foods],mass=g.foods.reduce((n,f)=>n+f.mass,0),rest=g.foods.slice(48).map(f=>({...f}));
 assert.equal(e.seedFood(g),48);assert.equal(g.foods.length,800);assert.equal(g.foods.reduce((n,f)=>n+f.mass,0),mass);
 assert(g.foods.every((f,i)=>f===refs[i]));assert.deepEqual(g.foods.slice(48),rest);
 for(const f of g.foods.slice(0,48)){const d=Math.hypot(f.x-g.player.x,f.y-g.player.y);assert(d>=30-.001&&d<=300+.001);}
 const after=g.foods.map(f=>[f.x,f.y]);assert.equal(e.seedFood(g),0);assert.deepEqual(g.foods.map(f=>[f.x,f.y]),after);
}

// Respawns stay within actual world geometry and avoid available leaves.
for(const [x,y] of [[12,12],[2490,12],[12,3780],[2490,3780]]){
 const g=make(2606.6667,3910,x,y);g.items=[{kind:'leaf',x:1303,y:1955,r:110}];const e=new GrowthEcology(()=>2,{},rng(212));
 for(let i=0;i<40;i++){const {radius:r,point:p}=e.spawn(g,i,{respawn:true});assert(p.x>=r&&p.y>=r&&p.x<=g.world.width-r&&p.y<=g.world.height-r);assert(Math.hypot(p.x-1303,p.y-1955)>=r+pondCollisionRadius(g.items[0]));}
}
console.log('PASS four-stage ecology: micro13/7/2 ladder and nine nearby prey, four new-spawn weight sets only, unchanged entities/food mass, one-shot nursery and leaf-core-safe corner respawns');
