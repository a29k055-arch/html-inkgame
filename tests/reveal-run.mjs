import assert from 'node:assert/strict';
import {RevealRun} from '../src/reveal/run.js';
import {REVEAL_CONFIG as C,REVEAL_FEATURES} from '../src/reveal/config.js';
import {GAME_CONFIG} from '../src/game/config.js';
import {entity} from '../src/game/inkstone.js';
import {aiController} from '../src/game/ai.js';
import {initReserve} from '../src/game/ink-reserve.js';
import {CometTrail} from '../src/reveal/trail.js';
const globalWorld={...GAME_CONFIG.world},events=[];const r=new RevealRun((k,v)=>events.push([k,v]),{aiCount:0,foodTarget:0,foodSpawnRate:0});assert.deepEqual(GAME_CONFIG.world,globalWorld);assert.equal(r.arena.world.height,C.height);assert.equal(r.arena.ranged,null);assert.equal(REVEAL_FEATURES.cards,false);const p=r.player,initial=r.completion;r.arena.foods.push({x:p.x,y:p.y,r:4,mass:25});r.update(.05,{x:0,y:0});assert(r.player.ink>65);assert.equal(r.metrics.enemyBlooms,0);assert.equal(r.completion,initial);assert.equal(p.choices.pending,0);
initReserve(p,1800);const prey=entity('prey',p.x,p.y,10,aiController(0));r.arena.entities.push(prey);r.update(.05,{x:0,y:0});assert.equal(r.metrics.enemyBlooms,1);for(let i=0;i<50;i++)r.update(.05,{x:0,y:0});assert(r.completion>initial+.025);assert.equal(p.choices.pending,0);assert(r.boost());assert(!r.boost());r.arena.items.push({x:p.x,y:p.y,kind:'shield'});r.update(.05,{x:0,y:0});assert.equal(p.wardCharges,2);const before=p.ink;r.arena.kill(p,null);assert.equal(p.dead,0);assert.equal(p.wardCharges,1);assert.equal(p.ink,before);
const progress=r.completion,tail=new CometTrail();for(let i=0;i<80;i++)tail.sample(i*10,200,30,.05,200);tail.advance(30);assert(tail.geometry().length>0);tail.advance(10);assert.equal(tail.geometry().length,0);assert.equal(r.completion,progress);
const erosion=new RevealRun(()=>{},{foodTarget:0,foodSpawnRate:0,completionThreshold:1.1});erosion.mask.cells.fill(.7);erosion.mask.sum=.7*erosion.mask.cells.length;for(let i=0;i<100;i++)erosion.update(.05,{x:0,y:0});assert(erosion.metrics.eroded>0);assert(erosion.arena.entities.every(e=>e.x>=0&&e.x<=C.width&&e.y>=0&&e.y<=C.height));
const goal=new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0});goal.mask.cells.fill(.9);goal.mask.sum=.9*goal.mask.cells.length;goal.update(.05);assert(goal.goalReached);for(let i=0;i<80;i++)goal.update(.05);assert(goal.finished&&goal.result.completed);assert.equal(goal.result.completion,1);assert.equal(goal.finish(),goal.result);console.log('PASS rectangular isolated world, food exclusion, actual swallow bloom, erosion, immediate pickup/boost/shield, 36s independent trail, goal/finale/idempotent result');

