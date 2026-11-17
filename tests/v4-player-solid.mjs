import assert from 'node:assert/strict';
import {GameRenderer} from '../src/ink/game-renderer.js';
import {coreRadius} from '../src/game/alien-geometry.js';
import {HERO_BODY_CONFIG} from '../src/ink/hero-visual-config.js';
import {HERO_PRESETS} from '../src/ink/hero-presets.js';
import {reserveRadius} from '../src/game/ink-reserve.js';
import {RevealRun} from '../src/reveal/run.js';
import {entity} from '../src/game/inkstone.js';
import {syncReserve} from '../src/game/ink-reserve.js';

for(const [width,height] of [[1440,900],[390,844]])for(const scale of [.4,.79,3.75])for(const ink of [17,4200,9000,20000]){
 const r=reserveRadius(ink,{minimumRadius:12,sizeLinear:.0175,maxRadius:280}),player={x:530,y:420,r,vx:70,vy:20,collisionScale:.94,effects:{},dead:0},received=[];
 const fluid={preset:HERO_PRESETS.swing,quality:'balanced',step(){},draw(){}};
 const renderer={viewW:width,viewH:height,camera:{x:100,y:70,scale},fluid,clock:0,bodyVisual:HERO_BODY_CONFIG,body:{update(e){received.push(e);}},trail:{advance(){},sample(...args){this.args=args;}},normalized:GameRenderer.prototype.normalized,motionSpeedLimit:()=>85};
 GameRenderer.prototype.step.call(renderer,1/60,player);
 assert.equal(fluid.solidCore.radius,coreRadius(player)*scale/height);
 assert.equal(fluid.solidCore.point[0],(player.x-100)*scale/width);
 assert.equal(fluid.solidCore.point[1],1-(player.y-70)*scale/height);
 assert.equal(player.r,r,'visual tuning never shrinks the logical body');
 assert.equal(renderer.trail.args[5],renderer.relativeSpeed);
 GameRenderer.prototype.step.call(renderer,1/60,{...player,dead:1});assert.equal(fluid.solidCore.radius,0);
}
assert.equal(reserveRadius(20000,{minimumRadius:12,sizeLinear:.0175,maxRadius:280}),280);
for(const appearance of ['eye','thorn']){
 const run=new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,initialItems:0,completionThreshold:2}),p=run.player,a=run.arena;
 p.ink=(100-12)/.0175;syncReserve(p,0,true);p.invincible=0;
 const npc=entity('contact-test',p.x,p.y,45,{type:'human'});npc.appearance=appearance;npc.v4Visual=true;a.entities.push(npc);
 const big=coreRadius(p),small=coreRadius(npc);npc.x=p.x+big+small+1;a.update(0,{x:0,y:0});assert.equal(npc.dead,0,'separated physical bodies cannot swallow');
 npc.x=p.x+big-small*.32-.1;a.update(0,{x:0,y:0});assert(npc.dead>0,'actual core coverage triggers swallowing');
}
console.log('PASS one physical solid radius at all growth/zoom/aspect values, projected center, unchanged size, relative trail input and dead-body removal');
