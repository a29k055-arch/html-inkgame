import assert from 'node:assert/strict';
import {bambooCoastStep} from '../../assets/ui/bamboo-scroll/bamboo-scroll.js';

const close=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const speed of [-2.2,-.5,.5,2.2]){
  const total=800,decay=155;
  const direct=bambooCoastStep(500,speed,total,decay);
  for(const dt of [8,10,16,20,25,32,40]){
    let current={position:500,velocity:speed};
    let elapsed=0;
    while(elapsed<total){
      const ms=Math.min(dt,total-elapsed);
      const next=bambooCoastStep(current.position,current.velocity,ms,decay);
      assert(Math.abs(next.velocity)<Math.abs(current.velocity));
      assert(Math.sign(next.position-current.position)===Math.sign(speed));
      current=next;elapsed+=ms;
    }
    close(current.position,direct.position);
    close(current.velocity,direct.velocity);
  }
  assert(Math.abs(direct.velocity)<.025);
  assert(Math.abs(direct.position-500)<Math.abs(speed)*decay);
}
console.log('PASS: horizontal coast is symmetric, decelerating and frame-rate independent.');
