import assert from 'node:assert/strict';
import {smoothRelativeSpeed,relativeInkProfile,RELATIVE_INK_MOTION as C} from '../src/ink/hero-relative-motion.js';
import {HERO_PRESETS as P} from '../src/ink/hero-presets.js';
for(const ratio of [0,.04,.12,.5,1,1.3]){
 const a=smoothRelativeSpeed(0,110*ratio,110,.1),b=smoothRelativeSpeed(0,82*ratio,82,.1);
 assert(Math.abs(a-b)<1e-12,'slower large actors use the same dimensionless response');
 const x=relativeInkProfile(P.drift,ratio);assert(x.decay>0&&x.wakeFloor>=0);assert(x.moving>=0&&x.moving<=1);
}
let n=0;for(let i=0;i<60;i++)n=smoothRelativeSpeed(n,100,100,1/60);assert(n>.999);
let stopped=n;for(let i=0;i<60;i++)stopped=smoothRelativeSpeed(stopped,0,100,1/60);assert(stopped<.001);
const fast=relativeInkProfile(P.drift,1),slow=relativeInkProfile(P.drift,.12),rest=relativeInkProfile(P.drift,stopped);
assert(rest.wakeFloor===0&&rest.tailFade===C.tailFade);assert(rest.decay>slow.decay&&slow.decay>fast.decay);assert(slow.wakeFloor>0&&fast.wakeFloor>0);assert(rest.feedReduction>fast.feedReduction);
assert.equal(relativeInkProfile(P.wash,.5),P.wash,'old high-speed candidate is untouched');
for(const x of [.025,.09,.25,.85]){const a=relativeInkProfile(P.drift,x-1e-6),b=relativeInkProfile(P.drift,x+1e-6);for(const k of ['decay','wakeFloor','moving','slowMix'])assert(Math.abs(a[k]-b[k])<.0001,'no threshold jump');}
assert.equal(smoothRelativeSpeed(0,100,100,0),0);
console.log('PASS dimensionless size-independent motion, dt smoothing, smooth rest/slow/fast envelopes, stopped source/fade and archived candidate isolation');
