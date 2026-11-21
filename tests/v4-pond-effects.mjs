import assert from 'node:assert/strict';
import {PondEffects} from '../src/reveal/pond-effects.js';
const context=()=>{const calls=[];return {calls,save(){calls.push(['save']);},restore(){calls.push(['restore']);},beginPath(){},arc(...v){calls.push(['arc',...v]);},stroke(){calls.push(['stroke']);},moveTo(...v){calls.push(['move',...v]);},lineTo(...v){calls.push(['line',...v]);},quadraticCurveTo(...v){calls.push(['curve',...v]);},createLinearGradient(){return {addColorStop(){}};}};};
const player={id:'human',x:500,y:400,r:40,collisionScale:.96,effects:{magnet:3,rush:3,giant:3},pondBuffs:{magnet:{strength:1.5},giant:{tier:1}},vx:190,vy:0},npc={id:'prey',x:650,y:400,r:12,effects:{},magnetPull:{strength:.8,dx:-1,dy:0}},arena={player,entities:[player,npc],magnetRules:{magnetReach:85},magnetField:{active:true,reach:190,coreRadius:38.4,x:500,y:400},speed:()=>100};
const fx=new PondEffects(),camera={x:0,y:0,scale:1},viewport={width:1000,height:800};
for(let i=0;i<60;i++)fx.update(1/60,arena,{...viewport,camera});const c=context();fx.drawWorld(c,arena,1);fx.drawScreen(c,player,viewport,camera);
assert.equal(fx.metrics.magnet.waves,3);assert(fx.metrics.magnet.waveRadii.every(r=>r>=fx.metrics.magnet.ringRadius&&r<=arena.magnetField.reach));assert(fx.metrics.magnet.ringRadius>38.4,'halo is separate from physical core');assert.equal(fx.metrics.magnet.targets,1);assert.equal(fx.metrics.rush.cap,22);assert(fx.metrics.rush.drawn>0&&fx.metrics.rush.drawn<=22);assert.equal(fx.metrics.giant.active,true);assert.equal(player.r,40,'effects cannot resize the entity');
// Existing speed strokes retain their direction across a turn until they expire.
const line=fx.lines.find(q=>q.age<q.life-.05);assert(line);line.x=250;line.y=250;const dx=line.dx,dy=line.dy;player.vx=0;player.vy=190;fx.update(.01,arena,{...viewport,camera});assert.equal(line.dx,dx);assert.equal(line.dy,dy);
// The moving direction is perpendicular now, while older stored lines still exist.
assert.deepEqual(fx.metrics.rush.heading,[0,1]);
for(let i=0;i<10;i++)fx.update(1/60,arena,{...viewport,mobile:true,camera});assert(fx.lines.length<=12);assert(fx.metrics.rush.lineCount<=12);
fx.trigger('shield',player);fx.trigger('shield',player);fx.trigger('shield',player);assert.equal(fx.pulses.length,2,'overlapping pickup pulses stay bounded');
player.vx=player.vy=0;for(let i=0;i<90;i++)fx.update(1/60,arena,{...viewport,mobile:true,camera});assert(fx.rushMix<.001,'stopped fish does not keep speed lines');assert.equal(fx.pulses.length,0);
player.effects={};arena.magnetField.active=false;delete npc.magnetPull;for(let i=0;i<90;i++)fx.update(1/60,arena,{...viewport,camera});fx.drawWorld(c,arena,2.7);assert.equal(fx.metrics.magnet.waves,0);assert.equal(fx.metrics.giant.active,false);
assert.equal(c.calls.filter(x=>x[0]==='save').length,c.calls.filter(x=>x[0]==='restore').length,'presentation restores caller transforms/styles');assert(!('canvas' in fx),'no separate FBO, mask or density canvas');
fx.clear();assert.equal(fx.lines.length,0);assert.equal(fx.pulses.length,0);
console.log('PASS bounded inward magnet waves, real pull cues, no body mutation, inertial screen lines/caps, stop fade, giant pulse expiry and context isolation');
