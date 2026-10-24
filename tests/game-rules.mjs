import assert from 'node:assert/strict';
import {GAME_CONFIG as C,settlement,SKILLS} from '../src/game/config.js';
import {Inkstone} from '../src/game/inkstone.js';
assert.equal(settlement(1000,30,1).ink,100);
assert.equal(settlement(1000,150,1).ink,500);
assert.equal(settlement(1000,300,1).ink,1800);
assert.equal(settlement(1000,300,7).ink,1000);
let finishes=0;const g=new Inkstone(type=>{if(type==='finish')finishes++;});
const p=g.player,n=g.entities[1];p.invincible=0;p.mass=2500;p.r=50;p.ink=1000;p.skills=[SKILLS[0],SKILLS[1]];
g.kill(p,n);assert.equal(p.ink,650);assert.equal(p.dead,C.respawnDelay);
g.respawn(p);assert.equal(p.mass,C.respawnRadius**2);assert.equal(p.r,C.respawnRadius);assert.equal(p.ink,650);assert.equal(p.skills.length,0);
p.dead=0;p.skills=[SKILLS[0],SKILLS[1]];g.useSkill();assert.equal(p.skills[0].id,'dense');assert.equal(p.effects.splash,C.skillDurations.splash);
p.invincible=0;p.effects={water:1};assert.equal(g.kill(p,n),false);p.effects={shield:1};assert.equal(g.kill(p,n),false);assert.equal(p.effects.shield,undefined);
p.effects={};g.elapsed=299.99;g.update(.02,{x:0,y:0});assert.equal(g.finished,true);assert.equal(g.result.full,true);g.finish();g.finish();assert.equal(finishes,1);
const h=new Inkstone();h.entities=h.entities.slice(0,1);h.player.invincible=0;h.player.x=C.world.width/2;h.player.y=C.world.height/2;h.foods=[{x:C.world.width/2,y:C.world.height/2,mass:10,r:3}];h.update(.016,{x:0,y:0});assert.ok(h.player.ink>0);assert.ok(h.player.mass>C.initialRadius**2);
const start=h.player.mass;h.elapsed=290;h.player.x=C.world.width-30;h.player.y=C.world.height/2;h.update(.1,{x:0,y:0});assert.ok(h.player.mass<start);assert.equal(h.player.diluted,true);
console.log('PASS settlement, full-round rewards, separate ink/mass, tiny respawn, protection, queue, shield, water, food, shrink, finish idempotency');
const full=new Inkstone();for(let i=0;i<3001;i++)full.update(.1,{x:Math.sin(i*.03),y:Math.cos(i*.03)});
assert.equal(full.finished,true);assert.equal(full.elapsed,300);assert.ok(full.safeRadius<=C.waterRingEndRadius+.001);
for(const e of full.entities){for(const k of ['x','y','r','mass','ink'])assert.ok(Number.isFinite(e[k]),`${e.id}.${k}`);assert.ok(e.mass>=C.respawnRadius**2-.001);assert.ok(e.skills.length<=2);}
assert.ok(full.foods.length<=C.foodTarget);assert.ok(full.items.length<=C.maxItems);
console.log('PASS complete 300-second model simulation, bounded resources, finite entities and two-slot queues');

assert.equal(C.world.width,3400);assert.equal(C.world.height,3400);assert.equal(C.foodTarget,760);assert.equal(typeof g.boost,'undefined');assert.equal('boost' in p,false);console.log('PASS legacy square map, food target and removed acceleration API');
