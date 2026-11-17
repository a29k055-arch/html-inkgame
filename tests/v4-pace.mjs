import assert from 'node:assert/strict';
import {REVEAL_CONFIG as C} from '../src/reveal/config.js';
import {RevealMask} from '../src/reveal/mask.js';
import {TemporaryReveal} from '../src/reveal/temporary.js';
assert.equal(C.completionThreshold,.75);assert.equal(C.inkCompletionThreshold,.90);assert.equal(C.duration,null);
function crossing(hz,speed){const m=new RevealMask({width:400,height:200,columns:100});m.fill(.8);for(let i=0;i<hz;i++)m.erode(100+speed*(i+.5)/hz,100,60,1/hz);return .8-m.at(140,100);}
for(const speed of [0,120]){const rates=[30,60,120].map(hz=>crossing(hz,speed));assert(rates.every(v=>v>0&&v<.8));assert(Math.max(...rates)-Math.min(...rates)<.0005,'erosion stays frame-rate stable');}
const m=new RevealMask({width:100,height:100,columns:100}),t=new TemporaryReveal(m,C),data=new Uint8ClampedArray(40000);for(let i=0;i<10000;i++)data[i*4+3]=255;const image={data,width:100,height:100},cam={x:0,y:0,scale:1};t.applyContact(image,cam,100,100,0);m.erode(50,50,30,2);t.noteErosion(50,50,30);const loss=m.at(50,50);for(let i=0;i<120;i++)t.applyContact(image,cam,100,100,i/60);assert.equal(m.at(50,50),loss);m.update(1000);assert.equal(m.at(50,50),loss);
console.log('PASS 75/90 permanent untimed goals, meaningful 30/60/120 Hz swept erosion and no lingering-source refill');
