import assert from 'node:assert/strict';
import {Inkstone} from '../src/game/inkstone.js';
import {GAME_CONFIG} from '../src/game/config.js';
const game=new Inkstone();game.player.invincible=1000;
const samples={};for(let i=0;i<3001;i++){game.update(.1,{x:0,y:0});for(const e of game.entities.slice(1)){const profile=e.controller.personality;samples[profile]??={hunt:0,flee:0,forage:0,item:0,water:0,wander:0};samples[profile][e.controller.intent]++;}}
const swallowed=game.entities.slice(1).reduce((sum,e)=>sum+e.swallowed,0),deaths=game.entities.slice(1).reduce((sum,e)=>sum+e.deaths,0);
assert.ok(swallowed>0,'The ecosystem must have NPC-to-NPC swallowing without player involvement');assert.ok(deaths>0);assert.equal(game.elapsed,GAME_CONFIG.inkstoneDuration);
assert.ok(Object.values(samples).some(s=>s.hunt>0));assert.ok(Object.values(samples).some(s=>s.flee>0));assert.ok(Object.values(samples).some(s=>s.item>0));
console.log(JSON.stringify({npcSwallows:swallowed,npcDeaths:deaths,behaviorSamples:samples},null,2));
