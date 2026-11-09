import assert from 'node:assert/strict';
import {HERO_PRESETS,heroMotionProfile} from '../src/ink/hero-presets.js';
const original=HERO_PRESETS.wash,candidate=HERO_PRESETS.drift;
for(const speed of [.3,.4,1]){const state=heroMotionProfile(candidate,speed);for(const key of ['decay','feed','wakeFloor','wakeBlend','fluidity','vorticity'])assert.equal(state[key],original[key],`${key} must preserve fast reference`);assert.equal(state.slowMix,0);assert.equal(state.wakeRetention,1);assert.equal(state.feedReduction,0);}
const slow=heroMotionProfile(candidate,.06);assert(slow.decay<original.decay);assert(slow.wakeFloor>original.wakeFloor);assert(slow.wakeRetention<1);assert(slow.feedReduction>0);
for(const speed of [.10,.30]){const a=heroMotionProfile(candidate,speed-1e-6),b=heroMotionProfile(candidate,speed+1e-6);assert(Math.abs(a.slowMix-b.slowMix)<1e-8);}
assert(Object.isFrozen(original)&&Object.isFrozen(candidate.slowWake));assert.equal(heroMotionProfile(original,.06),original);
console.log('PASS fast reference parameters unchanged, bounded slow wake and smooth speed transitions, immutable comparisons');
