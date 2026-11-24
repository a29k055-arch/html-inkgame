import assert from 'node:assert/strict';
import {START_MASS} from '../src-v6/levels-scale.mjs';
import {createWorld,stepWorld,useItem} from '../src-v6/sim.mjs';

function stroke(mass,emitting,form){
  const w=createWorld({tutorial:true,spawnItems:false,speed:132,seed:73,width:8000,height:3000,
    player:{x:3000,y:1500,mass}});
  if(form){w.player.inventory.push({type:form});useItem(w,0);}
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
  if(emitting && !form){assert.deepEqual([...shotMasses],[.76]);assert.deepEqual([...shotRadii],[5.3]);}
  return {speed:w.player.vx,paid};
}

const small=stroke(START_MASS,false),large=stroke(START_MASS*164,false);
const smallJet=stroke(START_MASS,true),largeJet=stroke(START_MASS*164,true);
const fish=stroke(START_MASS,false,'fish'),fishBubble=stroke(START_MASS,true,'fish');
assert.equal(small.paid,0);assert.equal(large.paid,0);
assert.ok(small.speed>99&&small.speed<101);
assert.ok(smallJet.speed/small.speed>1.13&&smallJet.speed/small.speed<1.15);
assert.ok(large.speed/small.speed>1.85&&large.speed/small.speed<1.9);
assert.ok(largeJet.speed/large.speed>1.54&&largeJet.speed/large.speed<1.57);
assert.ok(Math.abs(fish.speed/small.speed-1.6)<1e-6);
assert.equal(fishBubble.paid,0);assert.equal(fishBubble.speed,fish.speed);
assert.ok(smallJet.paid>=17&&smallJet.paid<=22);
assert.ok(largeJet.paid>=22&&largeJet.paid<=28);
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
console.log({small,smallJet,large,largeJet,fish,flowerLayouts:gap.length/3});
