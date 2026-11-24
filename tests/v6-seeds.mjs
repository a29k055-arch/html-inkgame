import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {POND_ARTWORKS} from '../src-v6/artworks.mjs';
import {START_MASS} from '../src-v6/levels-scale.mjs';
import {LEVELS, TUTORIALS, TRIAL, makeLevel} from '../src-v6/levels.mjs';

const radius = mass => 2*Math.sqrt(mass);
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const count = Number(process.argv[2] || 300);
const countRanges=[[16,20],[20,26],[24,30],[24,32],[28,36],[30,40]];
const artworkRatios=POND_ARTWORKS.map(art=>{
  const png=readFileSync(new URL('../assets/artworks/v4-cropped/'+art.id+'.png',import.meta.url));
  return png.readUInt32BE(16)/png.readUInt32BE(20);
});
function matchesArtwork(pond,index){
  assert.ok(Math.abs(pond.width/pond.height-artworkRatios[index])<1e-10);
  assert.equal(pond.player.mass,START_MASS);
}
function fourCorners(pond){
  const bosses=pond.enemies.filter(e=>e.cornerBoss);
  assert.deepEqual(bosses.map(e=>e.cornerSlot).sort(),['ne','nw','se','sw']);
  for(const e of bosses){
    const u=e.x/pond.width,v=e.y/pond.height;
    assert.ok((e.cornerSlot.endsWith('w')?u<.2:u>.8)&&(e.cornerSlot.startsWith('n')?v<.2:v>.8));
    assert.ok(e.mass>=pond.player.mass*18);
  }
}
assert.equal(new Set([...LEVELS,...TUTORIALS].map(m=>m.id)).size,10);
for(const t of TUTORIALS) {
  const initial=makeLevel(t.id,1);
  matchesArtwork(initial,0);
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
    if(seed===0)matchesArtwork(world,level.index);
    fourCorners(world);
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
  fourCorners(pond);
  if(seed===0)matchesArtwork(pond,TRIAL.artworkIndex);
  assert.ok(es.length>=165 && es.length<=210);
  assert.ok(es.some(e=>e.major && !e.cornerBoss && e.x>pond.width*.4 && e.x<pond.width*.65));
  assert.ok(es.filter(e=>Math.hypot(e.vx,e.vy)>.2).length>=es.length*.85);
  // Normal zoom shows at least 510 world units across the shorter dimension on
  // both portrait and landscape. Count only centres inside their shared square.
  const firstScreen=es.filter(e=>Math.abs(e.x-p.x)<=255&&Math.abs(e.y-p.y)<=255);
  assert.ok(firstScreen.length>=7 && firstScreen.length<=21,'the inlet must keep distinct swimming lanes');
  assert.ok(firstScreen.filter(e=>e.mass<p.mass).length>=4);
  assert.ok(firstScreen.some(e=>radius(e.mass)>=2.6*radius(p.mass)));
  assert.ok(es.filter(e=>e.mass>=900).length>=34);
  const first=es.find(e=>e.id==='trial-first-blue');
  assert.ok(first.mass<p.mass&&dist(first,p)<100);
  const ahead=first.x-p.x,across=first.y-p.y;
  for(const danger of es.filter(e=>e.mass>=p.mass)){
    const t=Math.max(0,Math.min(1,((danger.x-p.x)*ahead+(danger.y-p.y)*across)/(ahead**2+across**2)));
    const onRoute={x:p.x+t*ahead,y:p.y+t*across};
    assert.ok(dist(onRoute,danger)>radius(p.mass)+radius(danger.mass)+15,'blocked opening catch');
  }
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
