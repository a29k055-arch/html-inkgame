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
  if(c.species==='shrimp'){
    // Use V5's articulated, side-on paper turn. Its native puppet switches
    // handedness at the edge of the turn, so legs remain below the body.
    const pitch=()=>clamp(Math.atan2(Math.sin(direction()),Math.abs(Math.cos(direction()))),-.55,.55);
    const facing=Math.cos(direction())<0?-1:1;
    c.reset(0,0,facing>0?pitch():Math.PI-pitch());
    c.update=function(dt){
      const count=Math.max(1,Math.ceil(dt*120)),h=dt/count;
      for(let i=0;h>0&&i<count;i++){
        const mag=Math.hypot(this.input.x,this.input.y);
        const target=direction(),desired=Math.cos(target);
        const side=Math.abs(desired)>.17?Math.sign(desired):this.desiredFacing;
        const incline=pitch();
        this.desiredFacing=side;this.targetInclination=incline;
        // Keep a side profile even when the player steers straight upwards.
        this.setInput(side*Math.cos(incline)*mag,Math.sin(incline)*mag);
        nativeStep(h);
        this.setInput(Math.cos(target)*mag,Math.sin(target)*mag);
      }
      this.pose=this.buildPose();this.targetCurve=makeCurve(this.pose,false);
    };
    return;
  }
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
  configure(q,e){
    super.configure(q,e);
    const {creature:c,calibration:a}=q;
    if(q.species==='dragon'){
      // V5 measured the connected, opaque head cross-section of this rig.
      // Size that same head to the body's radius; its long tail follows freely.
      const headRadius=e.dragonHeadRadius??e.r*1.10;
      q.scale=headRadius*a.lengthPerRadius/c.length;
      q.renderRadius=headRadius;
      q.anchor=c.mapPoint(a.anchorS,a.anchorT);
    }else if(e.pickupArt){
      const extent=q.asset.npcAtlas?.bounds;
      if(extent){
        const length={shrimp:4.35,fish:6.35,turtle:7.75}[q.species]*e.r;
        q.scale=length/Math.max(extent.w,extent.h);
        q.renderRadius=q.scale*c.length/a.lengthPerRadius;
      }
    }
  }
  update(dt,arena,camera,viewport){
    super.update(dt,arena,camera,viewport);
    // The archive renderer schedules off-screen puppets at 6 Hz and NPCs at
    // 30 Hz. Update the visible joints on the frames between those archive samples.
    for(const [e,q] of this.records){
      if(e.dragonHeadRadius&&!q.visible){
        const margin=this.visualPadding(e)*camera.scale;
        const x=(e.x-camera.x)*camera.scale,y=(e.y-camera.y)*camera.scale;
        q.visible=x+margin>=0&&y+margin>=0&&x-margin<viewport.width&&y-margin<viewport.height;
      }
      if(!q.visible||q.age<1/120-.0001||e.dead)continue;
      const c=q.creature,speed=Math.hypot(e.vx||0,e.vy||0);
      const limit=Math.max(1,arena.speed?.(e,false)||100,speed);
      c.setInput((e.vx||0)/limit,(e.vy||0)/limit);
      c.vx=c.vy=0;c.update(Math.min(.1,q.age));q.age=0;
      if(e.id==='human'&&q.species==='dragon'){c.vx=e.vx/q.scale;c.vy=e.vy/q.scale;}
      this.configure(q,e);this.syncBody(q,e);
      this.metrics.animated++;
    }
  }
  visualPadding(e){
    if(e.morphGhost){
      const f=e.morphGhost;
      return e.r*Math.max(-f.left,-f.top,f.left+f.width,f.top+f.height);
    }
    if(e.dragonHeadRadius){
      const q=this.records.get(e);
      return e.dragonHeadRadius*(q?.calibration.lengthPerRadius??28)*1.3;
    }
    return super.visualPadding(e);
  }
  raster(q,e,camera,viewport){
    if(q.species!=='dragon')return super.raster(q,e,camera,viewport);
    // A long articulated tail changes its tight bounds on every stroke.
    // Reuse a slightly larger backing bitmap; resizing it also forces V5's
    // shared WebGL mesh surface to reallocate its render target.
    const c=q.creature,b=c.visualBounds(),k=q.scale;
    const left=e.x+(b.minX-q.anchor.x)*k,top=e.y+(b.minY-q.anchor.y)*k;
    const pad=12/camera.scale;
    const x=Math.max(left-pad,camera.x-pad),y=Math.max(top-pad,camera.y-pad);
    const right=Math.min(e.x+(b.maxX-q.anchor.x)*k+pad,camera.x+viewport.width/camera.scale+pad);
    const bottom=Math.min(e.y+(b.maxY-q.anchor.y)*k+pad,camera.y+viewport.height/camera.scale+pad);
    if(right<=x||bottom<=y)return false;
    const cap=viewport.mobile?1024:1536,w=right-x,h=bottom-y;
    const pixels=Math.min(camera.scale*Math.min(globalThis.devicePixelRatio||1,2),cap/Math.max(w,h));
    const bucket=n=>Math.ceil(n*pixels/96)*96;
    const bw=bucket(w),bh=bucket(h);
    q.tile??=document.createElement('canvas');
    if(bw>q.tile.width||bw*2<q.tile.width)q.tile.width=bw;
    if(bh>q.tile.height||bh*2<q.tile.height)q.tile.height=bh;
    const ctx=q.tile.getContext('2d');ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,q.tile.width,q.tile.height);
    ctx.setTransform(pixels*k,0,0,pixels*k,(e.x-q.anchor.x*k-x)*pixels,(e.y-q.anchor.y*k-y)*pixels);
    ctx.save();c.draw(ctx);ctx.restore();
    q.world={x,y,w:q.tile.width/pixels,h:q.tile.height/pixels};
    q.rasterX=e.x;q.rasterY=e.y;q.renderAge=0;this.metrics.liveRasters++;
    return true;
  }
  atlasFrame(q,e){
    const atlas=q.asset.npcAtlas;
    if(!atlas)return null;
    const viewScale=this.camera?.scale||1,pixelScale=viewScale*q.scale;
    const span=Math.max(atlas.bounds.w,atlas.bounds.h)*pixelScale;
    // In the overview a swimming animal may be shorter than a button.
    // Keep the original rig's interpolated painted frames while it turns;
    // reserving live skinning for a close-up avoids frequent GPU readbacks.
    const small=span<=80||(q.species==='dragon'&&viewScale<.65&&span<365);
    if(!small&&q.creature.time<q.creature.bentUntil)return null;
    const frame=super.atlasFrame(q,e);
    if(frame||!small||e.id==='human'||e.controller?.type==='human')return frame;
    // A high-DPI overview can slightly exceed the baked texture density.
    // Accept at most 1.6x enlargement of the original antialiased painting.
    const size=atlas.frames[0].canvas;
    const density=Math.min(globalThis.devicePixelRatio||1,2);
    if(atlas.bounds.w*pixelScale*density>size.width*1.6||
       atlas.bounds.h*pixelScale*density>size.height*1.6)return null;
    if(q.atlasPhase===undefined){
      let seed=17;for(const ch of String(e.id||'living'))seed=(seed*31+ch.charCodeAt(0))>>>0;
      q.atlasPhase=seed/4294967296;
    }
    const phase=(this.clock/atlas.seconds+q.atlasPhase)%1;
    const position=phase*atlas.frames.length,index=Math.floor(position);
    return {atlas,index,fraction:position-index,frame:atlas.frames[index],next:atlas.frames[(index+1)%atlas.frames.length]};
  }
  headOffset(q,e){
    const sprite=this.atlasFrame(q,e),{idx,section}=q.headStation;
    if(sprite&&q.species!=='turtle'){
      const a=sprite.frame.sections[idx],b=sprite.next.sections[idx],f=sprite.fraction;
      const x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;
      const c=q.creature,shrimp=q.species==='shrimp';
      const mirror=shrimp?c.facing*Math.max(.08,c.presentationWidth):1;
      const theta=shrimp?c.inclination*c.facing:c.heading,cs=Math.cos(theta),sn=Math.sin(theta);
      return {x:q.scale*(x*mirror*cs-y*sn),y:q.scale*(x*mirror*sn+y*cs)};
    }
    const point=q.creature.mapPoint(section.s,section.t);
    return {x:(point.x-q.anchor.x)*q.scale,y:(point.y-q.anchor.y)*q.scale};
  }
  drawPlayer(ctx,player){
    ctx.save();
    ctx.globalAlpha*=player.formOpacity??1;
    try{this.draw(ctx,player);}finally{ctx.restore();}
  }
  draw(ctx,e,...args){
    if(e.morphGhost){
      const f=e.morphGhost;
      ctx.save();ctx.globalAlpha*=e.opacity;
      ctx.drawImage(f.canvas,e.x+f.left*e.r,e.y+f.top*e.r,f.width*e.r,f.height*e.r);
      ctx.restore();return;
    }
    const record=this.records.get(e);
    if(record?.tile&&record.visible&&record.lastDraw!==this.clock&&record.renderAge>=1/60-.001){
      // A live close-up uses a new fully articulated pose each display frame.
      record.renderAge=Math.max(record.renderAge,1/30);
    }
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

// Capture only the outgoing material, including its actual pose, on a
// transparent tile. It moves/scales with the physical centre while the new
// animal becomes opaque. Nothing on the pond floor is captured.
export function captureForm(painter,hero,renderer){
  const {camera}=renderer,formed=!!hero.form;
  let left=-hero.r*2.15,top=left,width=-2*left,height=width;
  if(formed){
    const q=painter.ensure(hero);
    if(!q)return null;
    painter.configure(q,hero);
    const b=q.creature.visualBounds(),k=q.scale;
    left=(b.minX-q.anchor.x)*k-2;top=(b.minY-q.anchor.y)*k-2;
    width=(b.maxX-b.minX)*k+4;height=(b.maxY-b.minY)*k+4;
  }
  const clip=hero.outgoingPaint;
  if(clip){
    const f=clip.morphGhost,r=hero.r;
    const right=Math.max(left+width,(f.left+f.width)*r),bottom=Math.max(top+height,(f.top+f.height)*r);
    left=Math.min(left,f.left*r);top=Math.min(top,f.top*r);width=right-left;height=bottom-top;
  }
  const canvas=document.createElement('canvas');
  const scale=Math.min(camera.scale*Math.min(2,globalThis.devicePixelRatio||1),1024/Math.max(width,height));
  canvas.width=Math.max(1,Math.ceil(width*scale));canvas.height=Math.max(1,Math.ceil(height*scale));
  const c=canvas.getContext('2d');
  c.setTransform(scale,0,0,scale,-(hero.x+left)*scale,-(hero.y+top)*scale);
  if(clip)painter.draw(c,clip);
  if(formed)painter.drawPlayer(c,hero);
  else{
    // The native ink material is a transparent viewport layer (one backing
    // pixel per CSS pixel here, independent of the output canvas density).
    const cw=renderer.viewW/camera.scale,ch=renderer.viewH/camera.scale;
    c.drawImage(renderer.canvas,camera.x,camera.y,cw,ch);
    // Retain the V5 wet edge without cutting a square out of the soft wake.
    const wash=c.createRadialGradient(hero.x,hero.y,hero.r*1.04,hero.x,hero.y,hero.r*2.05);
    wash.addColorStop(0,'#000');wash.addColorStop(1,'transparent');
    c.globalCompositeOperation='destination-in';c.fillStyle=wash;
    c.fillRect(hero.x+left,hero.y+top,width,height);

  }
  return {canvas,left:left/hero.r,top:top/hero.r,width:width/hero.r,height:height/hero.r};
}
