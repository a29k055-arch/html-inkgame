import assert from 'node:assert/strict';
import {RevealRun} from '../src/reveal/run.js';
import {POND_CONFIG as C} from '../src/reveal/pond-rules.js';
import {entity} from '../src/game/inkstone.js';

const make=()=>new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,initialItems:0});
assert(C.initialLeaves<=4&&C.leafMax<=10&&C.flowerMax<=16);
assert(C.flowerIntervalMin>=28&&C.leafGrowthIntervalMin>=90);
assert(C.flowerGrowthQuota<=C.flowersPerLeaf,'natural growth cannot require a player pickup');

// No player, no pickup: flowers must survive their old expiry and many growth cycles.
{const run=make(),h=run.habitat;
 const leaf=h.spawnLeaf(),flower=h.spawnFlower(leaf);assert(flower);
 const id=flower.id,seenFlowers=new Set([id]);let firstGrowthAt=null;
 for(let i=0;i<1800;i++){
  h.update(1);if(firstGrowthAt===null&&h.stats.leavesGrown)firstGrowthAt=i+1;
  const present=new Set(run.arena.items.filter(i=>i.kind==='flower').map(f=>f.id));
  assert([...seenFlowers].every(id=>present.has(id)),'natural expansion cannot remove an existing flower');
  for(const id of present)seenFlowers.add(id);
 }
 assert(run.arena.items.some(i=>i.id===id));assert.equal(h.stats.flowersExpired,0);
 assert(h.leaves.length>1&&h.stats.leavesGrown>0,'unpicked flowers still permit sparse new leaves');
 assert(firstGrowthAt>=C.leafGrowthIntervalMin,'first expansion respects its slow clock');
 assert(h.leaves.length<=C.leafMax);assert(h.count('flower')<=C.flowerMax);
 assert(run.arena.items.length<=C.leafMax+C.flowerMax+C.animalMax);
}

// Four separated leaves form a gap too narrow for this large circular core.
// Accept stable waiting rather than alternate-direction jitter or forced teleportation.
{const run=make(),g=run.arena;g.player.dead=1000;
 for(const [dx,dy] of [[201,0],[-201,0],[0,201],[0,-201]])g.items.push({id:`leaf-${dx}-${dy}`,kind:'leaf',x:1800+dx,y:900+dy,r:108});
 const npc=entity('trapped-core',1800,900,90,{type:'human'});npc.appearance='eye';g.entities.push(npc);
 let travel=0,last={x:npc.x,y:npc.y};
 for(let i=0;i<1200;i++){run.update(1/60,{x:1,y:0});travel+=Math.hypot(npc.x-last.x,npc.y-last.y);last={x:npc.x,y:npc.y};
  for(const l of run.habitat.leaves)assert(Math.hypot(npc.x-l.x,npc.y-l.y)>=g.radius(npc)+l.r+.98);
 }
 assert(travel<1,'enclosed core must wait without repeated squeezing');
 assert(Math.hypot(npc.vx,npc.vy)<.01);
}

// Flower alone is not an obstacle; the same circle can walk through its location.
{const run=make(),g=run.arena;g.player.dead=1000;
 const npc=entity('flower-pass',1500,900,30,{type:'human'});npc.appearance='eye';g.entities.push(npc);
 g.items.push({id:'not-solid',kind:'flower',x:1600,y:900,r:30});
 for(let i=0;i<180;i++)run.update(1/60,{x:1,y:0});
 assert(npc.x>1700);assert(Math.abs(npc.y-900)<.01);
}
console.log('PASS slower bounded habitat, persistent flowers through 30min/growth, stable trapped NPC20s, nonblocking flowers');
