import assert from 'node:assert/strict';
import {RevealRun} from '../src/reveal/run.js';
import {REVEAL_CONFIG as C} from '../src/reveal/config.js';
import {entity} from '../src/game/inkstone.js';
import {aiController} from '../src/game/ai.js';
import {initReserve,syncReserve} from '../src/game/ink-reserve.js';
import {CometTrail} from '../src/reveal/trail.js';
const make=()=>new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,initialItems:0,completionThreshold:2,columns:96});
const r=make(),p=r.player;assert.equal(r.completion,0);assert.equal(r.arena.ranged,null);r.arena.foods.push({x:p.x,y:p.y,r:4,mass:25});r.update(.05);assert.equal(r.metrics.enemyBlooms,0);assert.equal(r.completion,0);assert.equal(p.ink,C.growthStages.startInk+11);
initReserve(p,4000);syncReserve(p,0,true);const prey=entity('prey',p.x+8,p.y+5,20,aiController(0));prey.invincible=0;r.arena.entities.push(prey);r.update(.05);assert.equal(r.metrics.enemyBlooms,1);const drop=r.mask.blooms.at(-1);assert(drop.r>0&&drop.r<=C.consumeRadiusTargetCap*20);assert.equal(drop.x,prey.x);assert.equal(drop.y,prey.y);for(let i=0;i<35;i++)r.update(.05);assert(r.completion>0);assert.equal(p.choices.pending,0);
assert(r.boost(true));assert(r.boost(true),'holding is idempotent');r.update(.05);r.boost(false);assert.equal(r.boostPhase,'ready');
const before=p.ink;r.arena.items.push({x:p.x,y:p.y,r:17,kind:'shield',tier:1});r.update(.01);assert.equal(p.effects.giant,3);assert(p.turtleInk>0);const temporary=p.turtleInk;assert(Math.abs(p.ink-before-temporary)<1e-8);p.ink+=100;for(let i=0;i<65;i++)r.update(.05);assert(!p.effects.giant);assert.equal(p.turtleInk,0);assert(Math.abs(p.ink-before-100)<1e-8);
for(const radius of [18,90,170]){const t=new CometTrail();for(let i=0;i<=35;i++)t.sample(100+i*6,500,radius,.02,300);const old=t.points.map(p=>[p.x,p.y]);for(let i=1;i<=20;i++)t.sample(310,500-i*6,radius,.02,300);assert(old.every(p=>t.points.some(q=>q.x===p[0]&&q.y===p[1])));assert(t.geometry().every(p=>p.x>=100&&p.x<=310&&p.y>=380&&p.y<=500));t.advance(t.config.trailLifetime+.1);assert.equal(t.geometry().length,0);}
const goal=make();goal.config.completionThreshold=.75;goal.mask.fill(.9);goal.checkGoal();assert.equal(goal.state,'finishing');const elapsed=goal.elapsed;goal.update(.1,{x:1,y:0});assert.equal(goal.elapsed,elapsed);assert.equal(goal.result,undefined);assert(goal.finish('complete').completed);assert.equal(goal.finish(),goal.result);
console.log('PASS fixed-food exclusion, NPC-centered permanent Drop, held bloom, turtle credit/expiry, world-space trail and frozen explicit completion');
