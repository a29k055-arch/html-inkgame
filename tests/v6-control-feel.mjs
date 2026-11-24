import assert from 'node:assert/strict';
import {createWorld,stepWorld} from '../src-v6/sim.mjs';

function stroke(mass,emitting){
  const w=createWorld({tutorial:true,spawnItems:false,speed:132,seed:73,width:8000,height:3000,
    player:{x:3000,y:1500,mass}});
  const shotMasses=new Set(),shotRadii=new Set();
  for(let frame=0;frame<240;frame++){
    stepWorld(w,{x:1,action:emitting},1/60);
    for(const shot of w.shots){
      shotMasses.add(shot.mass);shotRadii.add(shot.r);
    }
  }
  const paid=mass-w.player.mass;
  const inWater=[...w.shots,...w.drops].reduce((sum,flake)=>sum+flake.mass,0);
  assert.ok(Math.abs(paid-inWater)<1e-8);
  if(emitting){assert.deepEqual([...shotMasses],[.55]);assert.deepEqual([...shotRadii],[2.65]);}
  return {speed:w.player.vx,paid};
}

const small=stroke(100,false),large=stroke(25600,false);
const smallJet=stroke(100,true),largeJet=stroke(25600,true);
assert.equal(small.paid,0);assert.equal(large.paid,0);
assert.ok(small.speed>112&&small.speed<115);
assert.ok(smallJet.speed>130&&smallJet.speed<134);
assert.ok(large.speed>small.speed&&large.speed<small.speed*1.07);
assert.ok(smallJet.speed>large.speed);
assert.ok(smallJet.paid>=12&&smallJet.paid<=16);
assert.ok(largeJet.paid>=16&&largeJet.paid<=20);
assert.ok(largeJet.paid>smallJet.paid&&largeJet.paid<smallJet.paid*1.5);

const gap=[];
for(const seed of [1,19,263,401])for(const r of [45,80,125])for(const [x,y] of [
  [850,550],[r,r],[1700-r,r],[r,1100-r],[1700-r,1100-r]]){
  const w=createWorld({tutorial:true,seed,width:1700,height:1100,leaves:[{x,y,r,flowers:3}]});
  const flowers=w.leaves[0].flowers;
  assert.equal(flowers.length,3);
  for(const f of flowers){
    const petal=f.r*1.225,reach=Math.hypot(f.x-x,f.y-y);
    assert.ok(reach>r&&reach<=r+petal,'Stem stays immediately outside the leaf');
    assert.ok(f.x>=petal&&w.width-f.x>=petal&&f.y>=petal&&w.height-f.y>=petal);
    const nearest=Math.min(...flowers.filter(b=>b!==f).map(b=>Math.hypot(b.x-f.x,b.y-f.y)));
    assert.ok(nearest>=petal*1.82-1e-6,'Each blossom has its own centre');
    assert.ok(nearest<3.45*petal,'Buds on the same leaf grow near one another');
    gap.push(nearest/petal);
  }
}
console.log({small,smallJet,large,largeJet,flowerLayouts:gap.length/3});
