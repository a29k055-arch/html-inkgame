import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {InkCreature,projectPoint} from '../previews/creature-rig/runtime/ink-creature.mjs';
import {HeadFirstPainter,steerCreature} from '../src-v6/creature-painter.mjs';
import {LIVING_VARIANTS} from '../src-v5/game/living-rigs.js';
import {makeLevel} from '../src-v6/levels.mjs';
import {visibleFood} from '../src-v6/food-field.mjs';
import {createWorld,stepWorld,useItem,spawnItem,spawnEnemy,spawnDrop,radius,playerRadius,DRAGON_RADIUS,canEat} from '../src-v6/sim.mjs';
const tick=(w,input={},seconds=1)=>{for(let i=0;i<Math.round(seconds*60);i++)stepWorld(w,input,1/60);};
const base=(extra={})=>createWorld({width:1600,height:900,player:{x:500,y:400,mass:100},tutorial:true,spawnItems:false,...extra});
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`${a} differs from ${b}`);
const activate=(w,type)=>{const item=spawnItem(w,{type,x:w.player.x,y:w.player.y});tick(w,{},1/60);assert.ok(useItem(w,0));assert.equal(w.player.activeItem,item);return item;};
const counts={};
function test(name,f){f();counts[name]='pass';}
test('one stalemate dragon swims in from a bank, stays in the pond and is held or used just once',()=>{
  const w=base({tutorial:false,spawnItems:true,nextItem:999,enemies:[{id:'leader',type:'hole',mass:600,x:1300,y:680}]});
  tick(w,{x:1,y:0},1);
  while(!w.events.some(e=>e.type==='dragonArrived')&&w.time<45)tick(w,{},1/60);
  const rescue=w.items.find(i=>i.rescue);assert.ok(rescue);
  assert.ok(rescue.x<0||rescue.y<0||rescue.x>w.width||rescue.y>w.height);
  assert.equal(w.player.form,'ink');assert.equal(w.player.inventory.length,0);
  // Keep it out of the pack while it completes a whole crossing, including
  // a later rescue check and several regular item rolls.
  w.player.inventory.push(...['fish','shrimp','turtle'].map(type=>({type})));
  w.nextItem=w.time+.2;w.itemInterval=1.5;
  let entered=false;
  for(let i=0;i<100*60;i++){
    const x=rescue.x,y=rescue.y;tick(w,{},1/60);
    assert.ok(Math.hypot(rescue.x-x,rescue.y-y)<1.5);
    entered ||= !rescue.route.entering;
    assert.equal(w.items.filter(i=>i.type==='dragon').length,1);
    assert.ok(w.items.includes(rescue));
  }
  assert.ok(entered);w.player.inventory.length=0;w.player.x=rescue.x;w.player.y=rescue.y;
  tick(w,{},1/60);assert.ok(w.player.inventory.includes(rescue));
  assert.equal(spawnItem(w,{type:'dragon',x:20,y:30}),null);
  assert.ok(useItem(w,w.player.inventory.indexOf(rescue)));
  assert.equal(spawnItem(w,{type:'dragon',x:20,y:30}),null);
  assert.equal(w.player.form,'dragon');near(w.player.r,DRAGON_RADIUS);near(rescue.r,DRAGON_RADIUS);
  near(playerRadius(25000,'dragon'),rescue.r);assert.equal(w.events.filter(e=>e.type==='dragonArrived').length,1);
});
test('all ten rigs turn the head before the body while the turtle shell holds its joints',()=>{
  for(const ids of Object.values(LIVING_VARIANTS)){
    for(const id of ids){
      const url=new URL('../previews/creature-rig/'+id+'/rig.json',import.meta.url);
      const rig=JSON.parse(readFileSync(url,'utf8'));
      const c=new InkCreature(rig,{length:100,speed:0});
      c.layers=rig.layers.map(layer=>({...layer,anchor:projectPoint(c.sourceCurve,...layer.pivot)}));
      const actor={aim:{x:1,y:0}};
      steerCreature(c,actor);
      const legs=c.layers.filter(l=>l.kind==='leg');
      const jointSpan=()=>{
        const a=c.layerTransform(legs[0]),b=c.layerTransform(legs[1]);
        return Math.hypot(a.x-b.x,a.y-b.y);
      };
      const turtle=c.species==='turtle',before=turtle?jointSpan():0;
      actor.aim.x=-1;
      for(let i=0;i<6;i++)c.update(1/60);
      if(c.species==='shrimp'){
        assert.ok(c.shrimpTurnProgress>0&&c.presentationWidth<1,id+' should begin its side-on flip');
        for(let i=0;i<45;i++)c.update(1/60);
        assert.equal(c.facing,-1,id+' must mirror when moving left');
        const underside=c.mapPoint(.35,-.08),back=c.mapPoint(.35,.08);
        assert.ok(underside.y>back.y,id+' underside must remain below its back');
        actor.aim.x=0;actor.aim.y=-1;
        for(let i=0;i<60;i++)c.update(1/60);
        assert.ok(Math.abs(c.inclination)<=.56,id+' should retain its upright side profile');
        continue;
      }
      assert.ok(Math.abs(c.heading)>1.1,id+' head should already be turning');
      assert.ok(Math.abs(c.angleAt(c.time-.20))<.1,id+' rear should still follow the earlier course');
      if(turtle){
        near(jointSpan(),before,.001);
        assert.ok(Math.abs(c.neckTurn)>.3);
      }
      actor.aim.x=0;actor.aim.y=-1;
      for(let i=0;i<60;i++)c.update(1/60);
      assert.ok(Math.sin(c.heading)<-.99,id+' must face vertically');
    }
  }
});
test('dragon straightens at speed and lets the tail follow a corner for both player detail and world rigs',()=>{
  const rig=JSON.parse(readFileSync(new URL('../previews/creature-rig/dragon_04/rig.json',import.meta.url),'utf8'));
  for(const detail of [false,true]){
    const c=new InkCreature(rig,{length:100,speed:0}),actor={aim:{x:1,y:0}};
    c.v5PlayerDetail=detail;steerCreature(c,actor);
    function bounds(){
      const xs=c.pose.map(v=>v[0]),ys=c.pose.map(v=>v[1]);
      return {width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
    }
    for(let i=0;i<145;i++){c.setInput(1,0);c.update(1/60);}
    const straight=bounds();
    assert.ok(straight.width>98&&straight.height<7,JSON.stringify(straight));
    actor.aim={x:0,y:1};
    for(let i=0;i<13;i++){c.setInput(0,1);c.update(1/60);}
    const bend=bounds(),nose=c.pose[1],tip=c.pose.at(-1),tail=c.pose.at(-2);
    assert.ok(Math.abs(nose[1]-c.y)>Math.abs(nose[0]-c.x));
    assert.ok(Math.abs(tip[0]-tail[0])>Math.abs(tip[1]-tail[1]));
    assert.ok(bend.width>40&&bend.height>18,JSON.stringify(bend));
    for(let i=0;i<140;i++){c.setInput(0,1);c.update(1/60);}
    const settled=bounds();assert.ok(settled.height>98&&settled.width<7,JSON.stringify(settled));
  }
});
test('distant turning creatures keep their original animated frames while close turns use joints',()=>{
  const painter=Object.create(HeadFirstPainter.prototype);
  painter.clock=.54;painter.camera={scale:.28};
  const canvas={width:180,height:70},frames=Array.from({length:48},()=>({canvas}));
  const q={species:'fish',scale:.64,visible:true,asset:{npcAtlas:{bounds:{w:320,h:90},seconds:2,frames}},
    creature:{time:.4,bentUntil:.9}};
  const e={id:'distant-fish'};
  const a=painter.atlasFrame(q,e);assert.ok(a&&a.fraction>0);
  painter.clock+=1/60;
  const b=painter.atlasFrame(q,e);assert.ok(b.index+b.fraction>a.index+a.fraction);
  painter.camera.scale=2;
  assert.equal(painter.atlasFrame(q,e),null);
});
test('covering a painted head collects once and the same rig fades in the water',()=>{
  const w=base(),p=w.player;
  const item=spawnItem(w,{type:'fish',x:p.x+p.r+1,y:p.y,r:13});
  tick(w,{},1/60);
  assert.equal(p.inventory.length,0,'contact with the trailing body must not collect the animal');
  item.x=p.x+p.r;
  tick(w,{},1/60);
  assert.equal(p.inventory[0],item);
  assert.equal(w.items.length,0);
  assert.equal(w.departingItems[0],item);
  tick(w,{},.26);
  assert.ok(item.opacity>.3 && item.opacity<.8);
  assert.equal(p.inventory.length,1);
  tick(w,{},.34);
  assert.equal(w.departingItems.length,0);
});
test('fish patrol their pool while shrimp pause and keep a shallow swimming angle',()=>{
  const w=base({tutorial:false,enemies:[{type:'hole',x:1240,y:760,mass:950}]});
  const fish=spawnItem(w,{type:'fish',x:260,y:620}),shrimp=spawnItem(w,{type:'shrimp',x:920,y:270});
  let swimming=0,resting=0,fishDistance=0,shrimpDistance=0;
  for(let i=0;i<1200;i++){
    tick(w,{},1/60);
    const speed=Math.hypot(fish.vx,fish.vy),slow=Math.hypot(shrimp.vx,shrimp.vy);
    if(speed>4)swimming++;if(slow<1)resting++;
    assert.ok(speed<30&&slow<27);
    assert.ok(Math.abs(shrimp.vy)<=Math.abs(shrimp.vx)*.20+.001);
    fishDistance+=speed/60;shrimpDistance+=slow/60;
  }
  assert.equal(swimming,1200);assert.ok(resting>600);
  assert.ok(fishDistance>shrimpDistance*2);
});
test('all ten V5 appearances persist from the swimming pickup into the active player',()=>{
 const w=base({seed:42,tutorial:false,spawnItems:false,enemies:[{type:'hole',x:1200,y:800,mass:900}]});
 const originalRng=w.rng,seen=new Set();
 for(const [type,rigs] of Object.entries(LIVING_VARIANTS)){
  for(let i=0;i<rigs.length;i++){
   const item=spawnItem(w,{type,x:w.player.x,y:w.player.y});
   assert.equal(item.rigId,rigs[(42+i)%rigs.length]);seen.add(item.rigId);
   const rigAtArrival=item.rigId;
   tick(w,{},1/60);assert.equal(w.player.inventory[0],item);
   assert.ok(useItem(w,0));assert.equal(w.player.activeItem.rigId,rigAtArrival);
  }
  const tutorial=base({seed:93});
  assert.equal(spawnItem(tutorial,{type}).rigId,rigs[0]);
  assert.equal(spawnItem(base(),{type,rigId:rigs.at(-1)}).rigId,rigs.at(-1));
 }
 assert.equal(seen.size,10);assert.equal(w.rng,originalRng);
});
test('red spike equal losses, black hole transfer, equality rules',()=>{
 for(const type of ['spike','hole']) {
  const w=base({enemies:[{type,x:550,y:400,mass:225}]});
  tick(w,{x:1},1);
  const spent=100-w.player.mass;assert.ok(spent>5);
  near(w.enemies[0].mass,225+(type==='hole'?spent:-spent));
 }
 const w=base({enemies:[{type:'hole',x:538,y:400,mass:100}]});
 assert.equal(canEat(w.player,w.enemies[0]),false);tick(w,{x:1});near(w.player.mass,100);
});
test('a shrinking player loses contact with a stationary black hole and can steer back into it',()=>{
 for(const hz of [30,60,120]){
  const w=base({enemies:[{id:'drain',type:'hole',x:550,y:400,mass:225}]});
  const p=w.player,hole=w.enemies[0],startX=p.x;
  for(let i=0;i<2*hz;i++){
   const oldPlayer=p.mass,oldHole=hole.mass;
   stepWorld(w,{},1/hz);
   near(oldPlayer-p.mass,hole.mass-oldHole);near(p.mass+hole.mass,325);
   near(p.r,radius(p.mass));near(hole.r,radius(hole.mass));
  }
  near(p.x,startX);assert.ok(p.mass<100 && p.mass>99);
  assert.ok(Math.hypot(p.x-hole.x,p.y-hole.y)>p.r+hole.r);
  const resting=hole.mass;tick(w,{},.8);near(hole.mass,resting);
  tick(w,{x:1},1);assert.ok(hole.mass>resting+5);
  near(100-p.mass,hole.mass-225);
  tick(w,{x:-1},.2);
  const afterRetreat=hole.mass,lastContact=hole.absorption.lastAt;
  tick(w,{},.75);near(hole.mass,afterRetreat);near(lastContact,hole.absorption.lastAt);
  assert.ok(w.time-lastContact>.7);
 }
 const outside=base({enemies:[{type:'hole',x:550.2,y:400,mass:225}]});
 tick(outside,{},2);near(outside.player.mass,100);assert.equal(outside.enemies[0].absorption,undefined);
});
test('unmagnetized rivals drift independently of player input and stay on their course during overlap',()=>{
 const go=input=>{
   const w=base({enemies:[{id:'prey',type:'spike',mass:40,x:507,y:400,vx:2,vy:1},{id:'threat',type:'hole',mass:240,x:690,y:400,vx:-1,vy:2}]});
   tick(w,input,.2);return w;
 };
 const still=go({}),swim=go({y:1});
 assert.ok(swim.player.y-still.player.y>5);
 for(let i=0;i<2;i++){near(still.enemies[i].x,swim.enemies[i].x);near(still.enemies[i].y,swim.enemies[i].y);}
 near(swim.enemies[0].x,507.4);near(swim.enemies[0].y,400.2);
});
test('a blue rival transfers gradually, keeps partial losses and blooms only upon completion',()=>{
 for(const type of ['spike','hole']){
   const w=base({enemies:[{id:'food',type,x:510,y:400,mass:40}]});
   const p=w.player,e=w.enemies[0];
   tick(w,{},.10);
   assert.ok(e.mass>0 && e.mass<40);near(p.mass+e.mass,140);
   assert.ok(!w.events.some(x=>x.type==='eat'));
   p.x=350;const partial=e.mass;
   tick(w,{},1);near(e.mass,partial);near(p.mass+e.mass,140);
   p.x=e.x;tick(w,{},2);
   near(p.mass,140);assert.equal(w.enemies.length,0);
   const meals=w.events.filter(x=>x.type==='eat');
   assert.equal(meals.length,1);near(meals[0].mass,40);near(meals[0].r,radius(40));
 }
});
test('winning requires live mass leadership, the major rivals and a broadly revealed painting',()=>{
 const cfg={tutorial:false,player:{x:500,y:400,mass:100},enemies:[{id:'lead',type:'hole',x:900,y:400,mass:135}]};
 const w=base(cfg);tick(w,{},.2);
 assert.equal(w.status,'playing');
 spawnDrop(w,{mass:50,x:500,y:400});tick(w,{},.2);
 near(w.player.mass,150);assert.equal(w.status,'playing');assert.ok(w.painting.fraction<.85);
 w.painting.fill(.78);tick(w,{},1/60);assert.equal(w.status,'playing');
 w.painting.fill(.82);tick(w,{},1/60);assert.equal(w.status,'won');
 assert.equal(w.events.filter(e=>e.type==='win').length,1);
 const second=base(cfg);second.painting.fill(.9);tick(second,{},.2);
 assert.equal(second.status,'playing');
 spawnDrop(second,{mass:50,x:500,y:400});tick(second,{},.2);
 assert.equal(second.status,'won');
 const gated=base({tutorial:false,enemies:[{id:'last',type:'spike',mass:40,x:650,y:400,cornerBoss:true,cornerSlot:'ne'},
   {id:'small',type:'hole',mass:9,x:1200,y:400}]});
 gated.painting.fill(.92);tick(gated,{},.2);
 assert.equal(gated.majorRemaining,1);assert.equal(gated.status,'playing');
 gated.player.x=650;tick(gated,{},.1);
 assert.equal(gated.status,'playing');assert.ok(gated.enemies[0].absorbedByPlayer>0);
 tick(gated,{},2);assert.equal(gated.majorRemaining,0);assert.equal(gated.status,'won');
 assert.equal(gated.enemies[0].id,'small');
 const finalMeal=gated.events.find(e=>e.type==='eat' && e.major);
 assert.equal(finalMeal.cornerSlot,'ne');near(finalMeal.mass,40);
 const t=base({tutorial:false,enemies:[{type:'spike',x:900,y:400,mass:125},{type:'hole',x:1200,y:400,mass:120}]});
 spawnDrop(t,{mass:20,x:1200,y:400});tick(t,{},1/60);near(t.largest,140);
});
test('an enemy consuming the last marked rival inherits it until the player finishes the successor',()=>{
 for(const type of ['spike','hole']){
   const w=base({tutorial:false,enemies:[
     {id:'corner',type:'spike',x:900,y:400,mass:10,cornerBoss:true,cornerSlot:'nw'},
     {id:'successor',type,x:899,y:400,mass:60}]});
   w.painting.fill(.92);
   const [initial,successor]=w.enemies;
   for(let i=0;i<900&&w.enemies.length>1;i++){
     successor.vx=8*Math.sign(initial.x-successor.x);tick(w,{},1/60);
   }
   assert.deepEqual(w.enemies.map(e=>e.id),['successor']);
   assert.equal(w.status,'playing');assert.equal(w.majorRemaining,1);
   assert.equal(successor.cornerSlot,'nw');assert.ok(successor.major);
   successor.vx=0;w.player.x=successor.x;w.player.y=successor.y;tick(w,{},2);
   assert.equal(w.status,'won');assert.equal(w.majorRemaining,0);
 }
});
test('same-type enemy loss, opposite-type transfer',()=>{
 for(const type of ['spike','hole']) {
 const w=base({enemies:[{type,x:900,y:400,mass:175},{type,x:920,y:400,mass:100}]});tick(w);
 near(w.enemies[0].mass,165);near(w.enemies[1].mass,90);
 }
 const w=base({enemies:[{type:'hole',x:900,y:400,mass:200},{type:'spike',x:920,y:400,mass:100}]});tick(w);
 near(w.enemies[0].mass,219);near(w.enemies[1].mass,81);
});
test('normal motion free; jet meters small droplets, transfers impulse and conserves all ink',()=>{
 const w=base({enemies:[{type:'spike',x:436,y:400,mass:160}]});
 tick(w,{x:1},.3);near(w.player.mass,100);w.player.x=500;w.player.y=400;w.player.vx=0;
 tick(w,{action:true});assert.ok(w.player.mass>=95 && w.player.mass<=97);
 assert.ok(w.events.some(e=>e.type==='push'&&e.source==='spray'));
 tick(w,{},1);near(w.player.mass+w.enemies[0].mass+w.drops.reduce((n,d)=>n+d.mass,0),260);
});
test('larger bodies launch the same edible flakes at a gently higher rate',()=>{
 function sample(mass){
   const w=base({seed:19,width:12000,height:4000,player:{x:2500,y:2000,mass}});
   const shots=new Map();
   for(let i=0;i<180;i++){
     tick(w,{x:1,action:true},1/60);
     for(const shot of w.shots)shots.set(shot.id,{mass:shot.mass,r:shot.r,speed:Math.hypot(shot.vx,shot.vy),range:Math.hypot(shot.vx,shot.vy)*shot.lifetime,thrust:shot.thrust});
   }
   const first=shots.values().next().value;
   assert.ok(first && first.mass>0 && first.r>0);
   for(const shot of shots.values()){near(shot.mass,first.mass);near(shot.r,first.r);}
   return {first,count:shots.size};
 }
 const small=sample(100),large=sample(9000);
 near(small.first.mass,large.first.mass);near(small.first.r,large.first.r);
 assert.ok(large.first.speed>small.first.speed*1.4 && large.first.range>small.first.range*1.4);
 assert.ok(large.first.thrust>small.first.thrust*2);
 assert.ok(large.count>small.count && large.count<1.55*small.count);
});
test('bubbles have zero mass and recoil; transformations release-gated',()=>{
 const w=base({enemies:[{type:'hole',x:590,y:400,mass:225}]});
 activate(w,'fish');near(w.player.r,17);const x=w.player.x;
 tick(w,{action:true},1);near(w.player.x,x);near(w.player.mass,100);assert.equal(w.drops.length,0);assert.ok(w.enemies[0].x>590);
 tick(w,{action:true},11.2);assert.equal(w.player.form,'ink');near(w.player.mass,100);
 tick(w,{},.1);tick(w,{action:true},.5);assert.ok(w.player.mass<100);
});
test('shrimp and dragon pull blue enemies slowly, edible motes faster, ignore reds',()=>{
 for(const form of ['shrimp','dragon']){
 const w=base();activate(w,form);const reach=w.player.r+80;
 const b=spawnEnemy(w,{type:'hole',mass:20,x:500,y:400-reach});
 const red=spawnEnemy(w,{type:'hole',mass:110,x:500,y:400+reach});
 const d=spawnDrop(w,{mass:2,x:500+reach,y:400});
 tick(w,{},.3);assert.ok(b.y>400-reach);near(red.y,400+reach);
 assert.ok(500+reach-d.x>b.y-(400-reach));
 if(form==='dragon'){tick(w,{},19.5);assert.equal(w.player.form,'dragon');tick(w,{},.4);assert.equal(w.player.form,'ink');}
 }
});
test('turtle and larger dragon protect both sides; turtle voluntary ink spends',()=>{
 for(const form of ['turtle','dragon'])for(const type of ['spike','hole']) {
 const w=base();activate(w,form);near(w.player.r,playerRadius(100,form));const e=spawnEnemy(w,{type,x:545,y:400,mass:225});
 tick(w,{x:1});near(w.player.mass,100);near(e.mass,225);
 if(form==='turtle'){tick(w,{action:true},.3);assert.ok(w.player.mass<100);}
 }
});
test('one ink ledger on leaf, delayed droplets on water, natural bloom limit and harvesting',()=>{
 const w=base({leaves:[{id:'l',x:500,y:400,r:125,stored:26}]});
 tick(w,{action:true},1);tick(w,{},.1);
 assert.ok(w.events.some(e=>e.type==='store'));assert.ok(w.events.some(e=>e.type==='bloom'));
 assert.equal(w.drops.length,0);assert.equal(w.leaves[0].flowers.length,1);
 const f=w.leaves[0].flowers[0],old=w.player.mass;w.player.x=f.x;w.player.y=f.y;
 tick(w,{},1/60);near(w.player.mass,old+30,.001);assert.equal(w.leaves[0].flowers.length,0);
 w.player.x=100; w.player.y=100;tick(w,{},100);assert.equal(w.leaves[0].flowers.length,3);near(w.leaves[0].stored,0);
 const t=base({leaves:[{x:500,y:400,r:125,flowers:3}]});tick(t,{action:true},.5);tick(t,{},.6);
 assert.equal(t.leaves[0].flowers.length,3);assert.ok(t.drops.length>0);
});
test('all three blossoms grow outside the painted pad and can be reached even by a bank',()=>{
 for(const [x,y] of [[500,400],[85,85],[1515,815]]){
   const w=base({leaves:[{x,y,r:80,flowers:3}]}),leaf=w.leaves[0];
   assert.equal(leaf.flowers.length,3);
   for(const [i,f] of leaf.flowers.entries()){
     const petalRadius=f.r*1.225,distance=Math.hypot(f.x-x,f.y-y);
     assert.ok(distance>=leaf.r && distance<leaf.r+petalRadius*1.9);
     assert.ok(f.x>=petalRadius && w.width-f.x>=petalRadius);
     assert.ok(f.y>=petalRadius && w.height-f.y>=petalRadius);
     for(const other of leaf.flowers.slice(i+1))assert.ok(Math.hypot(f.x-other.x,f.y-other.y)>=f.r);
   }
   while(leaf.flowers.length){
     const f=leaf.flowers[0],old=w.player.mass,count=leaf.flowers.length;
     w.player.x=f.x;w.player.y=f.y;
     tick(w,{},1/60);
     assert.ok(!leaf.flowers.includes(f));
     near(w.player.mass-old,(count-leaf.flowers.length)*f.mass);
   }
 }
});
test('inventory bounded, edible ink cannot credit player and enemy twice',()=>{
 const w=base();for(const type of ['shrimp','fish','turtle','dragon'])spawnItem(w,{type,x:500,y:400});
 tick(w,{},1/60);assert.equal(w.player.inventory.length,3);assert.equal(w.items.length,1);
 const q=base();spawnEnemy(q,{type:'spike',mass:25,x:511,y:400});spawnDrop(q,{x:506,y:400,mass:3});
 tick(q,{},1/60);assert.ok(q.player.mass>103 && q.player.mass<128);assert.equal(q.drops.length,0);
 near(q.player.mass+q.enemies[0].mass,128);tick(q,{},2);near(q.player.mass,128);
});
test('30, 60 and 120 Hz replays agree',()=>{
 function run(hz){const w=base();for(let i=0;i<3*hz;i++)stepWorld(w,{x:.1,y:.8,action:i<hz},1/hz);
  return [w.player.mass,w.player.x,w.player.y,w.drops.length,w.time];}
 const expected=run(60);for(const hz of [30,120])run(hz).forEach((v,i)=>near(v,expected[i]));
});
test('fish reverts in a narrow passage without clipping the blockers',()=>{
 const w=base();activate(w,'fish');
 spawnEnemy(w,{type:'spike',mass:225,x:600,y:352.5});
 spawnEnemy(w,{type:'hole',mass:225,x:600,y:447.5});
 // Feather the stick to brake inside the opening before the fish form expires.
 for(let i=0;i<180;i++)tick(w,{x:Math.max(-1,Math.min(1,(600-w.player.x)*.025-w.player.vx*.003))},1/60);
 tick(w,{},.6);
 assert.ok(Math.abs(w.player.x-600)<2.5);near(w.player.r,17);
 tick(w,{},11);
 assert.equal(w.player.form,'ink');near(w.player.r,20);
 assert.ok(w.player.x<596);
 for(const e of w.enemies)assert.ok(Math.hypot(e.x-w.player.x,e.y-w.player.y)>=e.r+w.player.r-.5);
});
test('leaf edge protects the player, outside jet deposits only once, full leaf spills',()=>{
 const w=base({leaves:[{x:427,y:400,r:75}],enemies:[{x:532,y:400,type:'hole',mass:225}]});
 tick(w,{},1);near(w.player.mass,100);near(w.enemies[0].mass,225);
 const q=base({player:{x:610,y:400,mass:100},leaves:[{x:500,y:400,r:80}]});
 tick(q,{action:true},.4);tick(q,{},.6);assert.ok(q.events.some(e=>e.type==='store'));
 near(q.player.mass+q.leaves[0].stored-q.time+q.drops.reduce((s,d)=>s+d.mass,0),100);
});
test('paid ink fans out as individual polygons and retains the same mass when it settles',()=>{
 const w=base({seed:73}),seen=new Map(),times=[];
 for(let i=0;i<240;i++){
  tick(w,{action:true},1/60);
  for(const s of w.shots)if(!seen.has(s.id)){seen.set(s.id,{...s});times.push(w.time);}
 }
 const shots=[...seen.values()],angles=shots.map(s=>Math.atan2(s.dy,-s.dx)*180/Math.PI);
 assert.ok(Math.min(...angles)<-10 && Math.max(...angles)>10);
 assert.ok(angles.every(a=>Math.abs(a)<=17.01));
 const flight=shots.map(s=>Math.hypot(s.vx,s.vy)*s.lifetime);
 assert.ok(Math.min(...flight)<60 && Math.max(...flight)>85 && Math.max(...flight)<114);
 assert.equal(new Set(shots.map(s=>s.shape)).size,4);
 assert.ok(Math.max(...shots.map(s=>Math.hypot(s.vx,s.vy)))-Math.min(...shots.map(s=>Math.hypot(s.vx,s.vy)))>70);
 assert.ok(new Set(times.slice(1).map((t,i)=>Math.round((t-times[i])*60))).size>=4);
 tick(w,{},1.5);
 near(w.player.mass+w.drops.reduce((n,d)=>n+d.mass,0),100);
 assert.equal(new Set(w.drops.map(d=>d.shape)).size,4);
 const f=base({seed:73});activate(f,'fish');const directions=[];
 for(let i=0;i<240;i++){
  tick(f,{action:true},1/60);
  for(const s of f.shots)directions.push(Math.atan2(s.dy,s.dx)*180/Math.PI);
 }
 assert.ok(Math.min(...directions)<-4 && Math.max(...directions)>4);
 assert.ok(directions.every(a=>Math.abs(a)<=9.01));
 near(f.player.mass,100);near(f.player.x,500);
});
test('dense pond ink is edible, local, shared by both sides and safe to harvest once',()=>{
 const w=createWorld(makeLevel('level-1',37)),field=w.foodField;
 assert.ok(field.count>2200);
 const nearby=[...visibleFood(field,w.player.x-245,w.player.y-245,w.player.x+245,w.player.y+245)];
 assert.ok(nearby.length>=26);
 assert.equal(new Set(nearby.map(d=>d.shape)).size,4);
 const far=field.slots[0],atRest={x:far.x,y:far.y,rot:far.rot};
 field.time=4;
 const [drifting]=visibleFood(field,0,0,field.cw,field.ch);
 assert.equal(drifting,far);
 assert.ok(Math.hypot(far.x-atRest.x,far.y-atRest.y)>.25);
 assert.notEqual(far.rot,atRest.rot);
 field.time=w.time;
 const d=nearby.find(d=>Math.hypot(d.x-w.player.x,d.y-w.player.y)>100),before=w.player.mass;
 w.player.x=d.x;w.player.y=d.y;tick(w,{},1/60);
 assert.equal(field.slots[d.slot],null);
 assert.ok(w.player.mass>=before+d.mass);
 assert.equal(w.events.filter(e=>e.id===d.id && e.type==='eat').length,1);
 assert.equal(base().foodField,null);
});
test('keyboard turns are rounded and both controls coast along their actual release tangent',()=>{
 const w=base();
 tick(w,{x:1,keyboard:true},1);tick(w,{y:1,keyboard:true},.1);
 assert.ok(w.player.vx>35 && w.player.vy>35);
 const bearing=Math.atan2(w.player.vy,w.player.vx);
 near(w.player.angle,bearing);
 for(const keyboard of [true,false]){
   const t=base();
   tick(t,{x:1,keyboard},1);tick(t,{y:1,keyboard},.05);
   const {x,y,vx,vy}=t.player,entry=Math.hypot(vx,vy);
   tick(t,{keyboard},1);
   const dx=t.player.x-x,dy=t.player.y-y;
   near(dx*vy-dy*vx,0,1e-6);
   assert.ok(Math.hypot(dx,dy)>entry*.43 && Math.hypot(dx,dy)<entry*.49);
   assert.ok(Math.hypot(t.player.vx,t.player.vy)<entry*.18);
 }
});
test('four successive cardinal key turns can draw a full circle at swimming speed',()=>{
 const w=base(),points=[];
 tick(w,{x:1,keyboard:true},1);
 const start={x:w.player.x,y:w.player.y},cruise=Math.hypot(w.player.vx,w.player.vy);
 for(const key of [{y:1},{x:-1},{y:-1},{x:1}]){
   for(let i=0;i<20;i++){
     tick(w,{...key,keyboard:true},1/60);
     points.push({x:w.player.x,y:w.player.y});
     assert.ok(Math.hypot(w.player.vx,w.player.vy)>.98*cruise);
   }
 }
 const cx=points.reduce((s,p)=>s+p.x,0)/points.length;
 const cy=points.reduce((s,p)=>s+p.y,0)/points.length;
 const radii=points.map(p=>Math.hypot(p.x-cx,p.y-cy));
 assert.ok(Math.max(...radii)/Math.min(...radii)<1.05);
 assert.ok(Math.hypot(w.player.x-start.x,w.player.y-start.y)<1);
});
console.log(JSON.stringify(counts,null,2));
