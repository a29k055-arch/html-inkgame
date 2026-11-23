import {LivingPainter} from '../src-v5/ink/living-painter.js';
import {makeCurve,sampleCurve} from '../previews/creature-rig/runtime/ink-creature.mjs';

const TAU=2*Math.PI;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
const turnDelta=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));

// The V5 mesh and all joint weights are retained. The leading end steers
// first, while the rest of that same spine samples the recent heading path.
const followTime={fish:.34,shrimp:.27,turtle:.23,dragon:.55};
function bendDelay(species,s) {
  return followTime[species]*smooth((s-(species==='dragon'?.13:.09))/.85);
}

// The V5 turtle has a rigid shell texture with a separate neck and four
// painted leg joints. Turn the head around its anatomical neck joint and
// attach all four feet to the shell even during a hard reversal.
function articulateTurtle(c) {
  const sourceOrigin=sampleCurve(c.sourceCurve,0);
  const sourceAngle=Math.atan2(sourceOrigin.ty,sourceOrigin.tx);
  const neck=c.layers.find(layer=>layer.kind==='head');
  c.buildPose=function(){
    const lagged=this.angleAt(this.time-.15);
    const neckTurn=clamp(turnDelta(lagged,this.heading),-.90,.90);
    this.shellHeading=this.heading-neckTurn;
    this.neckTurn=neckTurn;
    const theta=this.shellHeading+Math.PI-sourceAngle;
    const k=this.length/this.sourceCurve.length;
    this.shellFrame={cs:Math.cos(theta)*k,sn:Math.sin(theta)*k,k};
    return this.rig.spine.map(([x,y])=>{
      const p=shellPoint(this,x,y);
      return [p.x,p.y];
    });
  };
  function shellPoint(q,x,y){
    const {cs,sn}=q.shellFrame,dx=x-sourceOrigin.x,dy=y-sourceOrigin.y;
    return {x:q.x+cs*dx-sn*dy,y:q.y+sn*dx+cs*dy};
  }
  c.layerTransform=function(layer){
    const anchor=shellPoint(this,...layer.pivot);
    const rotation=this.layerMotion(layer)+(layer===neck?this.neckTurn:0);
    return {...this.rigidTransform(anchor,this.shellHeading+Math.PI,sourceAngle,rotation),
      opacity:this.offsets.get(layer.name)?.opacity??1,rotation};
  };
  c.mapPoint=function(s,t,out={}){
    const at=sampleCurve(this.sourceCurve,s);
    const x=at.x-at.ty*t*this.sourceCurve.length,y=at.y+at.tx*t*this.sourceCurve.length;
    if(s<neck.anchor.s){
      const m=this.layerTransform(neck),dx=x-neck.pivot[0],dy=y-neck.pivot[1];
      out.x=m.x+m.a*dx+m.c*dy;out.y=m.y+m.b*dx+m.d*dy;
    }else Object.assign(out,shellPoint(this,x,y));
    return out;
  };
}

export function steerCreature(c,actor) {
  const nativeStep=c.step.bind(c),segments=c.v5PlayerDetail?96:48;
  const direction=()=>actor.aim&&Math.hypot(actor.aim.x,actor.aim.y)>.01?
    Math.atan2(actor.aim.y,actor.aim.x):Math.atan2(actor.vy||0,actor.vx||0);
  c.buildPose=function(){
    const p=this.profile,points=[[this.x,this.y]],step=this.length/segments;
    const amplitude=p.idle+(p.amplitude-p.idle)*this.drive;
    for(let i=0;i<segments;i++){
      const s=(i+.5)/segments,delay=bendDelay(this.species,s);
      const flex=this.species==='dragon'?smooth((s-.12)/.18):smooth((s-.14)/.86);
      const oscillation=this.species==='dragon'?Math.cos(s*TAU*p.waves-this.wavePhase):
        Math.sin(this.wavePhase-s*TAU*p.waves);
      const angle=this.angleAt(this.time-delay)+Math.PI+amplitude*flex*oscillation;
      const last=points[i];
      points.push([last[0]+Math.cos(angle)*step,last[1]+Math.sin(angle)*step]);
    }
    return points;
  };
  if(c.species==='turtle')articulateTurtle(c);
  c.reset(0,0,direction());
  if(c.species==='shrimp'){
    c.facing=c.desiredFacing=1;
    c.shrimpTurnProgress=c.shrimpTurnVelocity=0;
    c.inclination=c.targetInclination=c.heading;
  }
  c.update=function(dt){
    const count=Math.max(1,Math.ceil(dt*120)),step=dt/count;
    for(let i=0;step>0&&i<count;i++){
      const previous=this.heading,target=direction();
      nativeStep(step); // Preserve V5 fins, legs, wing phase and feeler forces.
      const angle=turnDelta(previous,target);
      const turn=clamp(angle*(1-Math.exp(-24*step)),-16*step,16*step);
      this.heading=previous+turn;
      this.angularVelocity=step>0?turn/step:0;
      this.targetHeading=target;
      const entry=this.history.at(-1);
      entry.a=this.heading;entry.v=this.angularVelocity;
      // The pond is top-down. Side-facing shrimp turn through an arc, including
      // straight up and down, without swapping a flat sprite across its centre.
      if(this.species==='shrimp'){
        this.facing=this.desiredFacing=1;
        this.shrimpTurnProgress=this.shrimpTurnVelocity=0;
        this.inclination=this.targetInclination=this.heading;
      }
      if(Math.abs(angle)>.045)this.bentUntil=this.time+followTime[this.species]+.08;
    }
    this.pose=this.buildPose();
    this.targetCurve=makeCurve(this.pose,false);
  };
  c.update(0);
}

export class HeadFirstPainter extends LivingPainter {
  ensure(e){
    const q=super.ensure(e);
    if(q && !q.headStation){
      // Use an actual alpha-bearing centreline sample in the head. This also
      // provides the identical point on both frames of V5's distant atlas.
      const sections=q.calibration.bodySections;
      const target=q.creature.rig.headFrame?.s??.08;
      let idx=0;
      for(let i=1;i<sections.length;i++){
        if(Math.abs(sections[i].s-target)<Math.abs(sections[idx].s-target))idx=i;
      }
      q.headStation={idx,section:q.species==='turtle'?{s:.08,t:0}:sections[idx]};
      steerCreature(q.creature,e);
    }
    return q;
  }
  atlasFrame(q,e){
    if(q.creature.time<q.creature.bentUntil)return null;
    return super.atlasFrame(q,e);
  }
  headOffset(q,e){
    const sprite=this.atlasFrame(q,e),{idx,section}=q.headStation;
    if(sprite&&q.species!=='turtle'){
      const a=sprite.frame.sections[idx],b=sprite.next.sections[idx],f=sprite.fraction;
      const x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;
      const theta=q.creature.heading,cs=Math.cos(theta),sn=Math.sin(theta);
      return {x:q.scale*(x*cs-y*sn),y:q.scale*(x*sn+y*cs)};
    }
    const point=q.creature.mapPoint(section.s,section.t);
    return {x:(point.x-q.anchor.x)*q.scale,y:(point.y-q.anchor.y)*q.scale};
  }
  drawPlayer(ctx,player){
    // Keep the shrimp painting itself visible, without V5's glass hit-radius overlay.
    if(player.form?.species==='shrimp')return this.draw(ctx,player);
    return super.drawPlayer(ctx,player);
  }
  draw(ctx,e,...args){
    if(!e.pickupArt)return super.draw(ctx,e,...args);
    const q=this.ensure(e);
    if(!q||!q.visible)return;
    this.configure(q,e);
    const head=this.headOffset(q,e);
    // The simulation tracks the painted head as the swimming collectible's
    // world position. Neither a long dragon tail nor feelers can collect it.
    ctx.save();
    ctx.translate(-head.x,-head.y);
    ctx.globalAlpha*=e.opacity;
    const camera=this.camera;
    this.camera={...camera,x:camera.x+head.x,y:camera.y+head.y};
    try{super.draw(ctx,e,...args);}
    finally{this.camera=camera;ctx.restore();}
  }
}
