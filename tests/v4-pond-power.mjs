import assert from 'node:assert/strict';
import {applyPondGravity,beginPondGravity,pondMagnetField} from '../src/game/pond-gravity.js';
import {Inkstone,entity} from '../src/game/inkstone.js';
import {coreRadius} from '../src/game/alien-geometry.js';
import {aiController} from '../src/game/ai.js';
import {ITEM_TIERS,MANUAL_RUSH_TIERS,collectTieredItem} from '../src/reveal/item-tiers.js';
import {REVEAL_CONFIG} from '../src/reveal/config.js';
import {RevealRun} from '../src/reveal/run.js';

const rules=REVEAL_CONFIG.items;
function field(radius=20,distance=150){const p=entity('human',500,500,100,{type:'human'}),e=entity('npc',500+distance,500,radius,aiController(1));p.effects.magnet=3;p.pondBuffs={magnet:{tier:2,strength:1.75}};const a={player:p,entities:[p,e],world:{width:3000,height:3000},magnetRules:rules,speed:()=>100,radius:coreRadius,boundarySliding:false};return {a,p,e};}
// A small prey is overcome; a near-peer still escapes, but slower. The AI velocity/goal survive.
{
 const small=field(10,150),peer=field(95,150);small.e.vx=peer.e.vx=70;const goal=small.e.controller.goal;const dSmall=small.e.x,dPeer=peer.e.x;
 for(let i=0;i<30;i++)for(const f of [small,peer]){f.e.x+=f.e.vx/30;applyPondGravity(f.a,f.e,1/30);}
 assert(small.e.x<dSmall,'tiny escaping prey is drawn in');assert(peer.e.x>dPeer&&peer.e.x<dPeer+70,'near peer escapes more slowly');
 assert.equal(small.e.vx,70,'gravity does not replace autonomous movement');assert.equal(small.e.controller.goal,goal);assert(small.e.magnetPull.strength>peer.e.magnetPull.strength);
}
// The size test uses collision cores, including dense and thorn decoration rules.
for(const radius of [100,101,240]){const {a,e}=field(radius);beginPondGravity(a);const x=e.x;applyPondGravity(a,e,.1);assert.equal(e.x,x);assert(!e.magnetPull);}
{
 const {a,e}=field(135);e.appearance='thorn';e.v4Visual=true;assert(coreRadius(e)<coreRadius(a.player));applyPondGravity(a,e,.1);assert(e.magnetPull,'thorn decorative spikes do not block an otherwise smaller core');
}
for(const state of ['dead','water','protected']){const {a,e}=field();if(state==='dead')e.dead=2;if(state==='water')e.effects.water=2;if(state==='protected')e.invincible=1;const x=e.x;applyPondGravity(a,e,.2);assert.equal(e.x,x);}
// Pure motion remains stable over frame subdivisions, without retaining suction after expiry.
function integrate(hz){const f=field(35,220);for(let i=0;i<hz;i++)applyPondGravity(f.a,f.e,1/hz);return f.e.x;}
assert(Math.abs(integrate(30)-integrate(120))<1.5,'dt subdivision should not change pull materially');
{
 const {a,p,e}=field();beginPondGravity(a);applyPondGravity(a,e,.1);assert(e.magnetPull);delete p.effects.magnet;beginPondGravity(a);const x=e.x;applyPondGravity(a,e,.2);assert.equal(e.x,x);assert(!e.magnetPull);assert.equal(a.magnetField.active,false);
 p.effects.magnet=3;p.dead=1;beginPondGravity(a);assert.equal(a.magnetField.active,false);
}
// Opt-in isolation: legacy magnet food attraction must not pull NPCs.
{
 const {a,e}=field();a.magnetRules={magnetReach:85,magnetMultiplier:1.5};const x=e.x;beginPondGravity(a);applyPondGravity(a,e,1);assert.equal(e.x,x);assert.equal(a.magnetField,undefined);
}
// The whole pull corridor is tested, not only its far endpoint; no stem tunnelling at low FPS.
{
 const {a,p,e}=field(10,120);p.x=400;e.x=520;a.isPointBlockedForNpc=point=>point.x<490&&point.x>430;
 const controller=e.controller;e.competitor=true;applyPondGravity(a,e,2);assert(e.x>=490);assert.equal(e.controller,controller);assert.equal(e.competitor,true);assert(e.x>=coreRadius(e)&&e.x<=a.world.width-coreRadius(e));
}
// Actual arena integration still requires ordinary core coverage and grants the kill once.
{
 const events=[],a=new Inkstone((t,d)=>events.push([t,d]),{world:{width:2000,height:2000},aiCount:0,foodTarget:0,foodSpawnRate:0,shrink:false,autoFinish:false,boundarySliding:true,magnetRules:rules});
 const p=a.player;p.r=100;p.mass=10000;p.invincible=0;p.effects.magnet=5;p.pondBuffs={magnet:{tier:3,strength:2}};
 const n=entity('prey',p.x+160,p.y,10,aiController(1));n.controller.profile={...n.controller.profile,speedScale:0};a.entities.push(n);const original=p.r;
 a.update(0,{x:0,y:0});assert.equal(n.dead,0,'magnet reach is never swallow reach');assert.equal(p.r,original);
 for(let i=0;i<45;i++)a.update(1/60,{x:0,y:0});assert(n.dead>0);assert.equal(events.filter(([t,d])=>t==='consume'&&d.kind==='enemy').length,1);
 assert.equal(a.magnetField.x,p.x);assert.equal(a.magnetField.coreRadius,coreRadius(p));
}
// Fish is stronger without buff multiplication, changing manual ink-bloom strength or turtle budgets.
assert.deepEqual(ITEM_TIERS.rush,[.70,1,1.30]);assert.deepEqual(MANUAL_RUSH_TIERS,[.30,.50,.70]);
{
 const a=new Inkstone(()=>{},{aiCount:0,foodTarget:0,shrink:false}),p=a.player,base=a.speed(p,false);
 for(let tier=1;tier<=3;tier++){p.effects={};p.pondBuffs={};collectTieredItem(p,{kind:'speed',tier});assert(Math.abs(a.speed(p)/base-(1+ITEM_TIERS.rush[tier-1]))<1e-12);p.effects.manualRush=1;a.rushSpeed=.7;assert(Math.abs(a.speed(p)/base-(1+Math.max(.7,ITEM_TIERS.rush[tier-1])))<1e-12,'fish and manual boost use the strongest effect, not a product');}
 const r=new RevealRun(()=>{},{aiCount:0,foodTarget:0,foodSpawnRate:0,initialItems:0,completionThreshold:2});for(const stage of [1,2,3,4]){r.journey.stage=stage;assert.equal(r.stageBoost(),MANUAL_RUSH_TIERS[Math.min(stage-1,2)]);}
}
console.log('PASS size/distance-based NPC gravity, near-peer resistance, dt stability, expiry, world/stem safety, opt-in isolation, real swallow and independent fish/manual boost tiers');
