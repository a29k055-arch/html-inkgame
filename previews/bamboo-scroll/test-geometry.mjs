import assert from 'node:assert/strict';
import {buildBambooGeometry} from '../../assets/ui/bamboo-scroll/bamboo-scroll.js';

const epsilon = 1e-5;
const close = (a,b) => assert(Math.abs(a-b)<epsilon, `${a} != ${b}`);
for (const [w,h] of [[170,125],[300,125],[950,150],[1280,150],[1600,150]]) {
  const first = buildBambooGeometry(w,h,0);
  let prev = first;
  for (let step=0;step<=1000;step++) {
    const p=step/1000;
    const g=buildBambooGeometry(w,h,p);
    assert.equal(g.count,first.count);
    assert.equal(g.joints.length,g.count+1);
    close(g.length,first.length);
    close(g.thickness,first.thickness);
    close(g.laid,g.length*p);
    g.joints.forEach((joint,i)=>{
      for (const point of [joint.top,joint.bottom,joint]) {
        assert(Number.isFinite(point.x)&&Number.isFinite(point.y));
        assert(point.x>=-1&&point.y>=-1&&point.x<=w+1&&point.y<=h+1);
      }
      close(Math.hypot(joint.top.x-joint.bottom.x,joint.top.y-joint.bottom.y),g.thickness);
      if (i*g.slatLength <= g.laid+epsilon) {
        close(joint.x,g.left+i*g.slatLength);
        close(joint.y,g.baseline);
      }
      // Adjacent animation samples must not teleport any material joint.
      const old=prev.joints[i];
      assert(Math.hypot(joint.x-old.x,joint.y-old.y)<g.length*.008+epsilon);
    });
    prev=g;
  }
  const end=prev;
  end.joints.forEach((joint,i)=>{
    close(joint.y,end.baseline);
    close(joint.top.y,end.baseline-end.thickness/2);
    close(joint.bottom.y,end.baseline+end.thickness/2);
    if(i>0) close(joint.x-end.joints[i-1].x,end.slatLength);
  });
  close(end.joints.at(-1).x,end.right);
  console.log(`PASS ${w}×${h}: ${end.count} continuous slats, 1001 progress states`);
}
