import assert from 'node:assert/strict';
import {HeroInkFluid,HeroInkBody} from '../src/ink/hero-ink.js';
import {HERO_PRESETS,DEFAULT_HERO_PRESET} from '../src/ink/hero-presets.js';
assert.equal(DEFAULT_HERO_PRESET,'restored');assert(!HERO_PRESETS.restored.solidBody);assert.equal(HERO_PRESETS.restored.opacity,0);
for(const radius of [.02,.1,.3,.6])for(const large of [0,.4,1]){
 const f=Object.create(HeroInkFluid.prototype),passes=[];f.solidCore={radius};f.core={radius,speed:.15};f.motionProfile=()=>({...HERO_PRESETS.restored,relative:true,moving:1,bigBody:large});f.d={read:1,write:2,swap(){}};f.pass=(...args)=>passes.push(args);
 f.inject({x:.5,y:.5,vx:0,vy:0,radius:.01,intensity:.3});assert.equal(passes.length,1);const u=passes[0][2];assert(Math.abs(Math.sqrt(u.radius)-radius*.88)<1e-12,'actual source follows physical radius, independent of speed/size suppression');assert.equal(u.amount,.3*(1-.25*large));
}
// The formal path must never dispatch the old circular display program.
const f=Object.create(HeroInkFluid.prototype);f.preset=HERO_PRESETS.restored;let called=false;f.motionProfile=()=>HERO_PRESETS.restored;f.programs={display:'native'};f.uniforms={};f.gl={useProgram(p){assert.equal(p,'native');called=true;throw new Error('native display reached');}};
assert.throws(()=>f.pass('display',null,{}),/native display reached/);assert(called);
assert.equal(typeof HeroInkBody.prototype.update,'function');
console.log('PASS single native display, no disk/CPU extra wake, physical-sized fluid source at all radii');
