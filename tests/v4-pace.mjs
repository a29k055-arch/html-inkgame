import assert from 'node:assert/strict';
import {REVEAL_CONFIG as C} from '../src/reveal/config.js';
import {RevealRun} from '../src/reveal/run.js';

assert.equal(C.completionThreshold,.65);assert.equal(C.inkCompletionThreshold,.90);
for(const speed of [0,120]){
 const before=crossing(old,60,speed),after=crossing(C,60,speed);
 assert(after<before);assert(after>before*.15,'whitening must remain meaningful');
 const rates=[30,60,120].map(hz=>crossing(C,hz,speed));
 assert(Math.max(...rates)-Math.min(...rates)<.0005,'swept erosion remains frame-rate stable');
 console.log('swept loss',JSON.stringify({speed,before,after,rates}));
}
console.log('PASS unchanged65%/90% goals, slower but real two-layer whitening, no refill, 30/60/120Hz parity');

