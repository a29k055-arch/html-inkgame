import assert from 'node:assert/strict';
import {createWorld,stepWorld,useItem,spawnItem,spawnEnemy,spawnDrop,radius,canEat} from '../src-v6/sim.mjs';
const tick=(w,input={},seconds=1)=>{for(let i=0;i<Math.round(seconds*60);i++)stepWorld(w,input,1/60);};
const base=(extra={})=>createWorld({width:1600,height:900,player:{x:500,y:400,mass:100},tutorial:true,spawnItems:false,...extra});
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`${a} differs from ${b}`);
const activate=(w,type)=>{const item=spawnItem(w,{type,x:w.player.x,y:w.player.y});tick(w,{},1/60);assert.ok(useItem(w,0));assert.equal(w.player.activeItem,item);return item;};
const counts={};
function test(name,f){f();counts[name]='pass';}
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
console.log(JSON.stringify(counts,null,2));
