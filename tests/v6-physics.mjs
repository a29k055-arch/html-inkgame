import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {InkCreature,projectPoint} from '../previews/creature-rig/runtime/ink-creature.mjs';
import {steerCreature} from '../src-v6/creature-painter.mjs';
import {LIVING_VARIANTS} from '../src-v5/game/living-rigs.js';
import {makeLevel} from '../src-v6/levels.mjs';
import {visibleFood} from '../src-v6/food-field.mjs';
import {createWorld,stepWorld,useItem,spawnItem,spawnEnemy,spawnDrop,radius,canEat} from '../src-v6/sim.mjs';
const tick=(w,input={},seconds=1)=>{for(let i=0;i<Math.round(seconds*60);i++)stepWorld(w,input,1/60);};
const base=(extra={})=>createWorld({width:1600,height:900,player:{x:500,y:400,mass:100},tutorial:true,spawnItems:false,...extra});
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`${a} differs from ${b}`);
const activate=(w,type)=>{const item=spawnItem(w,{type,x:w.player.x,y:w.player.y});tick(w,{},1/60);assert.ok(useItem(w,0));assert.equal(w.player.activeItem,item);return item;};
const counts={};
function test(name,f){f();counts[name]='pass';}
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
  assert.equal(spawnItem(w,{type,rigId:rigs.at(-1)}).rigId,rigs.at(-1));
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
test('a touching black hole gains each lost unit, remains on the receding rim and stops on separation',()=>{
 for(const hz of [30,60,120]){
  const w=base({enemies:[{id:'drain',type:'hole',x:550,y:400,mass:225}]});
  const p=w.player, hole=w.enemies[0];
  for(let i=0;i<2*hz;i++){
   const oldPlayer=p.mass,oldHole=hole.mass;
   stepWorld(w,{},1/hz);
   near(oldPlayer-p.mass,hole.mass-oldHole);
   near(p.mass+hole.mass,325);
   near(p.r,radius(p.mass));near(hole.r,radius(hole.mass));
  }
  near(p.mass,62);near(hole.mass,263);near(hole.absorption.amount,38);
  near(hole.absorption.lastAt,w.time);
  tick(w,{x:-1},.2);
  const afterRetreat=hole.mass,lastContact=hole.absorption.lastAt;
  tick(w,{},.75);near(hole.mass,afterRetreat);near(lastContact,hole.absorption.lastAt);
  assert.ok(w.time-lastContact>.7);
 }
 const outside=base({enemies:[{type:'hole',x:550.2,y:400,mass:225}]});
 tick(outside,{},2);near(outside.player.mass,100);assert.equal(outside.enemies[0].absorption,undefined);
});
test('blue species eaten safely; final enemy ranking live',()=>{
 const w=base({tutorial:false,enemies:[{id:'food',type:'spike',x:480,y:400,mass:40},
 {id:'lead',type:'hole',x:900,y:400,mass:135}]});
 tick(w);assert.equal(w.player.mass,140);assert.equal(w.largest,135);assert.equal(w.status,'won');
 assert.equal(w.events.filter(e=>e.type==='win').length,1);
 const t=base({tutorial:false,enemies:[{type:'spike',x:900,y:400,mass:125},{type:'hole',x:1200,y:400,mass:120}]});
 spawnDrop(t,{mass:20,x:1200,y:400});tick(t,{},1/60);near(t.largest,140);
});
test('same-type enemy loss, opposite-type transfer',()=>{
 for(const type of ['spike','hole']) {
 const w=base({enemies:[{type,x:900,y:400,mass:175},{type,x:920,y:400,mass:100}]});tick(w);
 near(w.enemies[0].mass,165);near(w.enemies[1].mass,90);
 }
 const w=base({enemies:[{type:'hole',x:900,y:400,mass:200},{type:'spike',x:920,y:400,mass:100}]});tick(w);
 near(w.enemies[0].mass,219);near(w.enemies[1].mass,81);
});
test('normal motion free; jet consumes 8%/sec, transfers impulse and conserves all ink',()=>{
 const w=base({enemies:[{type:'spike',x:436,y:400,mass:160}]});
 tick(w,{x:1},.3);near(w.player.mass,100);w.player.x=500;w.player.y=400;w.player.vx=0;
 tick(w,{action:true});near(w.player.mass,92);
 assert.ok(w.events.some(e=>e.type==='push'&&e.source==='spray'));
 tick(w,{},1);near(w.player.mass+w.enemies[0].mass+w.drops.reduce((n,d)=>n+d.mass,0),260);
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
 const w=base();activate(w,form);const b=spawnEnemy(w,{type:'hole',mass:20,x:500,y:310});
 const red=spawnEnemy(w,{type:'hole',mass:110,x:500,y:493});const d=spawnDrop(w,{mass:2,x:590,y:400});
 tick(w,{},.3);assert.ok(b.y>310);near(red.y,493);assert.ok(590-d.x>b.y-310);
 if(form==='dragon'){tick(w,{},19.5);assert.equal(w.player.form,'dragon');tick(w,{},.4);assert.equal(w.player.form,'ink');}
 }
});
test('turtle/dragon protect both sides, keep original passage radius; turtle voluntary ink spends',()=>{
 for(const form of ['turtle','dragon'])for(const type of ['spike','hole']) {
 const w=base();activate(w,form);near(w.player.r,radius(100));const e=spawnEnemy(w,{type,x:545,y:400,mass:225});
 tick(w,{x:1});near(w.player.mass,100);near(e.mass,225);
 if(form==='turtle'){tick(w,{action:true},.3);assert.ok(w.player.mass<100);}
 }
});
test('one ink ledger on leaf, delayed droplets on water, natural bloom limit and harvesting',()=>{
 const w=base({leaves:[{id:'l',x:500,y:400,r:125,stored:24}]});
 tick(w,{action:true},1);tick(w,{},.1);
 assert.ok(w.events.some(e=>e.type==='store'));assert.ok(w.events.some(e=>e.type==='bloom'));
 assert.equal(w.drops.length,0);assert.equal(w.leaves[0].flowers.length,1);
 const f=w.leaves[0].flowers[0],old=w.player.mass;w.player.x=f.x;w.player.y=f.y;
 tick(w,{},1/60);near(w.player.mass,old+30,.001);assert.equal(w.leaves[0].flowers.length,0);
 w.player.x=100; w.player.y=100;tick(w,{},100);assert.equal(w.leaves[0].flowers.length,3);near(w.leaves[0].stored,0);
 const t=base({leaves:[{x:500,y:400,r:125,flowers:3}]});tick(t,{action:true},.5);tick(t,{},.6);
 assert.equal(t.leaves[0].flowers.length,3);assert.ok(t.drops.length>0);
});
test('inventory bounded, edible ink cannot credit player and enemy twice',()=>{
 const w=base();for(const type of ['shrimp','fish','turtle','dragon'])spawnItem(w,{type,x:500,y:400});
 tick(w,{},1/60);assert.equal(w.player.inventory.length,3);assert.equal(w.items.length,1);
 const q=base();spawnEnemy(q,{type:'spike',mass:25,x:511,y:400});spawnDrop(q,{x:506,y:400,mass:3});
 tick(q,{},1/60);assert.equal(q.player.mass,128);assert.equal(q.drops.length,0);
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
 tick(w,{x:1},2/3);tick(w,{},.6);
 assert.ok(Math.abs(w.player.x-600)<1);near(w.player.r,17);
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
 assert.ok(angles.every(a=>Math.abs(a)<=24.01));
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
test('keyboard taps make rounded turns with coasting while an analogue release remains precise',()=>{
 const w=base();
 tick(w,{x:1,keyboard:true},1);tick(w,{y:1,keyboard:true},.1);
 assert.ok(w.player.vx>35 && w.player.vy>35);
 const bearing=Math.atan2(w.player.vy,w.player.vx);
 near(w.player.angle,bearing);
 const keyStop=base(),stickStop=base();
 for(const t of [keyStop,stickStop])tick(t,{x:1},1);
 const x=keyStop.player.x;tick(keyStop,{keyboard:true},.24);tick(stickStop,{},.24);
 assert.ok(keyStop.player.x-x>2*(stickStop.player.x-x));
});
console.log(JSON.stringify(counts,null,2));
