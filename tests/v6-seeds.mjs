import assert from 'node:assert/strict';
import {LEVELS, TUTORIALS, makeLevel} from '../src-v6/levels.mjs';

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
