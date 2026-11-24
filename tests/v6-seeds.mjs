import assert from 'node:assert/strict';
import {LEVELS, TUTORIALS, TRIAL, makeLevel} from '../src-v6/levels.mjs';

const radius = mass => 2*Math.sqrt(mass);
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const count = Number(process.argv[2] || 300);
const countRanges=[[12,16],[16,22],[20,26],[20,28],[24,32],[26,36]];
assert.equal(new Set([...LEVELS,...TUTORIALS].map(m=>m.id)).size,10);
for(const t of TUTORIALS) {
  const initial=makeLevel(t.id,1);
  assert.equal(initial.tutorial,true);
  assert.equal(initial.spawnItems,false);
  assert.ok(initial.player.mass>0);
}
for(const level of LEVELS){
  let leastSurplus=Infinity;
  for(let seed=0;seed<count;seed++){
    const world=makeLevel(level.id,seed);
    assert.deepEqual(world,makeLevel(level.id,seed));
    const enemies=world.enemies;
    const [lo,hi]=countRanges[level.index];
    assert.ok(enemies.length>=lo && enemies.length<=hi);
    assert.equal(new Set(enemies.map(e=>e.id)).size,enemies.length);
    const p=world.player;
    assert.ok(enemies.filter(e=>e.mass<p.mass && dist(p,e)<350).length>=2);
    const largest=Math.max(...enemies.map(e=>e.mass));
    const surplus=p.mass+enemies.reduce((n,e)=>n+e.mass,0)-2*largest;
    assert.ok(surplus>0);
    leastSurplus=Math.min(leastSurplus,surplus);
    for (let i=0;i<enemies.length;i++) {
      const a=enemies[i],r=radius(a.mass);
      assert.ok(a.x>=r && a.y>=r && a.x<=world.width-r && a.y<=world.height-r);
      assert.ok(dist(a,p)>r+radius(p.mass));
      for(const leaf of world.leaves) assert.ok(dist(a,leaf)>=r+leaf.r);
      for(let j=0;j<i;j++) assert.ok(dist(a,enemies[j])>=r+radius(enemies[j].mass));
    }
  }
  console.log(level.id, count+' reproducible and clear starts', 'minimum starting surplus '+leastSurplus);
}

let trialSurplus=Infinity;
for(let seed=0;seed<count;seed++){
  const pond=makeLevel(TRIAL,seed),p=pond.player,es=pond.enemies;
  assert.deepEqual(pond,makeLevel('trial',seed));
  assert.equal(pond.kind,'trial');
  assert.ok(es.length>=100);
  assert.ok(Math.floor(pond.width/pond.foodSpacing)*Math.floor(pond.height/pond.foodSpacing)>=5500);
  assert.ok(es.filter(e=>e.mass<p.mass&&dist(e,p)<220).length>=3);
  for(const type of ['fish','shrimp','turtle'])assert.ok(pond.items.some(i=>i.type===type&&dist(i,p)<600));
  for(const [i,e] of es.entries()){
    const r=radius(e.mass);
    assert.ok(e.x>=r&&e.x<=pond.width-r&&e.y>=r&&e.y<=pond.height-r);
    assert.ok(dist(e,p)>r+radius(p.mass));
    for(const leaf of pond.leaves)assert.ok(dist(leaf,e)>leaf.r+r);
    for(let j=0;j<i;j++)assert.ok(dist(es[j],e)>radius(es[j].mass)+r,'overlapping '+e.id+' / '+es[j].id);
  }
  const masses=es.map(e=>e.mass).sort((a,b)=>b-a);
  assert.ok(masses[1]>=masses[0]/2);
  trialSurplus=Math.min(trialSurplus,p.mass+es.reduce((n,e)=>n+e.mass,0)-2*masses[0]);
}
assert.ok(trialSurplus>0);
console.log('Open pond:',count,'clear starts, opening catches and three accessible forms, minimum surplus',trialSurplus);
