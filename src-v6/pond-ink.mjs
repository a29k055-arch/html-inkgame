import {createRevealRenderer} from '../src-v5/reveal/renderer.js';
import {CometTrail} from '../src-v5/reveal/trail.js';
import {RevealPainter} from '../src-v5/reveal/painter.js';
import {livingShapeEmitters} from '../src-v5/ink/living-fluid.js';
import {createInkDrift} from './ink-drift.mjs';
import {createFoodPainter} from './food-painter.mjs';

const images=new Map();

function painting(url) {
  if(!images.has(url)) {
    const image=new Image();
    image.decoding='async';
    image.src=url;
    images.set(url,image);
  }
  return images.get(url);
}

// Keep the actual V5 fluid alpha on the GPU. Each small contact patch cuts
// through the source painting and is deposited on a persistent painted layer.
// No readPixels/getImageData or repeated full-picture compositing is needed.
function createWetContact(world,drift){
  const layer=document.createElement('canvas');
  const scale=Math.min(1,1536/Math.max(world.width,world.height));
  layer.width=Math.ceil(world.width*scale);layer.height=Math.ceil(world.height*scale);
  const pigment=layer.getContext('2d');
  const patch=document.createElement('canvas'),c=patch.getContext('2d'),history=[];
  let previous=null,settled=0;
  function stamp(w,renderer,p,image,painter){
    if(!image.complete||!image.naturalWidth)return;
    const last=previous;
    const moved=last?Math.hypot(p.x-last.x,p.y-last.y):Infinity;
    const changed=moved>.15||!last||Math.abs(p.r-last.r)>.06||p.form?.species!==last.form||w.player.emitting;
    if(changed)settled=0;else settled+=Math.max(0,w.time-last.time);
    previous={x:p.x,y:p.y,r:p.r,form:p.form?.species,time:w.time,
      frame:p.form?(renderer.inkFrame??renderer.npcs.playerFrame(p)):null};
    if(settled>2.5)return;
    if(last&&moved>Math.max(140,p.r*4,w.speed*(w.time-last.time)*2))history.length=0;
    while(history.length&&w.time-history[0].time>2.2)history.shift();
    history.push(previous);
    let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
    for(const sample of history){
      // A dragon's painted tail can extend many head diameters. Remember
      // the actual articulated bounds of every recent pose along its wake.
      const reach=sample.r*3+22,frame=sample.frame;
      left=Math.min(left,(frame?.minX??sample.x)-reach);right=Math.max(right,(frame?.maxX??sample.x)+reach);
      top=Math.min(top,(frame?.minY??sample.y)-reach);bottom=Math.max(bottom,(frame?.maxY??sample.y)+reach);
    }
    const i0=Math.max(0,Math.floor(left*scale)),i1=Math.min(layer.width,Math.ceil(right*scale));
    const j0=Math.max(0,Math.floor(top*scale)),j1=Math.min(layer.height,Math.ceil(bottom*scale));
    const cw=i1-i0,ch=j1-j0;
    if(cw<=0||ch<=0)return;
    if(patch.width<cw||patch.height<ch){
      patch.width=Math.max(patch.width,Math.ceil(cw/32)*32);
      patch.height=Math.max(patch.height,Math.ceil(ch/32)*32);
    }
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cw,ch);
    c.save();c.beginPath();c.rect(0,0,cw,ch);c.clip();
    c.setTransform(scale,0,0,scale,-i0,-j0);
    const cam=renderer.inkCamera,sw=renderer.viewW,sh=renderer.viewH;
    renderer.trail.draw(c,'ink',{...cam,width:sw,height:sh},true);
    const x=Math.max(i0/scale,cam.x),y=Math.max(j0/scale,cam.y);
    const xEnd=Math.min(i1/scale,cam.x+sw/cam.scale),yEnd=Math.min(j1/scale,cam.y+sh/cam.scale);
    if(xEnd>x&&yEnd>y){
      const source=renderer.canvas;
      const sx=source.width*cam.scale/sw,sy=source.height*cam.scale/sh;
      c.drawImage(source,(x-cam.x)*sx,(y-cam.y)*sy,(xEnd-x)*sx,(yEnd-y)*sy,x,y,xEnd-x,yEnd-y);
    }
    if(p.form)renderer.npcs.drawPlayerContact?.(c,p);
    // The fluid viewport and the local capture patch are finite, while the
    // wet field may still be nonzero at either edge. Fade both sources before
    // deposition; a camera pan must never print the outline of its viewport.
    c.save();c.globalCompositeOperation='destination-in';
    const feather=(a,b,horizontal,width)=>{
      if(b<=a)return;
      const depth=Math.min(.26,width/(b-a));
      const g=horizontal?c.createLinearGradient(a,0,b,0):c.createLinearGradient(0,a,0,b);
      g.addColorStop(0,'transparent');g.addColorStop(depth*.45,'rgba(0,0,0,.27)');
      g.addColorStop(depth,'black');g.addColorStop(1-depth,'black');
      g.addColorStop(1-depth*.45,'rgba(0,0,0,.27)');g.addColorStop(1,'transparent');
      c.fillStyle=g;c.fillRect(i0/scale,j0/scale,cw/scale,ch/scale);
    };
    const soft=Math.max(15/cam.scale,p.r*1.45);
    feather(x,xEnd,true,soft);feather(y,yEnd,false,soft);c.restore();
    drift.draw(c,w.time);
    c.globalCompositeOperation='source-in';
    c.drawImage(image,0,0,w.width,w.height);
    c.restore();
    pigment.globalAlpha=.54;
    pigment.drawImage(patch,0,0,cw,ch,i0,j0,cw,ch);
    if(painter){
      const d=painter.layer.getContext('2d');
      const fx=painter.layer.width/(w.width*scale),fy=painter.layer.height/(w.height*scale);
      d.save();d.globalAlpha=.54;d.drawImage(patch,0,0,cw,ch,i0*fx,j0*fy,cw*fx,ch*fy);d.restore();
    }
  }
  return {layer,stamp};
}

// Only rebuild the changed portion of the shared world mask. Wet pigment
// finer than a coverage cell remains visible at the original painting resolution.
class WetPaintingRenderer extends RevealPainter {
  constructor(image,run,detail){
    super(image,run);this.detail=detail;
  }
  update(){
    const mask=this.run.mask;
    if(this.last===mask.version)return;
    const full={left:0,top:0,right:mask.cols,bottom:mask.rows};
    const {left,top,right,bottom}=this.last<0?full:mask.dirty??full;
    mask.dirty=null;this.last=mask.version;
    const data=this.pixels.data,fog=this.run.config.fogImageOpacity;
    for(let row=top;row<bottom;row++){
      for(let col=left;col<right;col++){
        const k=row*mask.cols+col;
        data[k*4]=data[k*4+1]=data[k*4+2]=255;
        data[k*4+3]=Math.round((fog+(1-fog)*mask.cells[k])*255);
      }
    }
    this.maskCanvas.getContext('2d').putImageData(this.pixels,0,0,left,top,right-left,bottom-top);
    const w=this.layer.width,h=this.layer.height,c=this.layer.getContext('2d');
    const x=Math.floor(left*w/mask.cols),y=Math.floor(top*h/mask.rows);
    c.save();c.beginPath();c.rect(x,y,Math.ceil(right*w/mask.cols)-x,Math.ceil(bottom*h/mask.rows)-y);c.clip();
    c.clearRect(0,0,w,h);c.drawImage(this.image,0,0,w,h);
    c.globalCompositeOperation='destination-in';c.drawImage(this.maskCanvas,0,0,w,h);
    c.globalCompositeOperation='source-over';c.drawImage(this.detail,0,0,w,h);c.restore();
  }
}

export function createGround(world,url) {
  const mask=world.painting,config=mask.config,run={world,config,mask};
  const image=painting(url);
  const drift=createInkDrift();
  const drawFood=createFoodPainter(world.foodField);
  const contact=createWetContact(world,drift);
  let painter,clock=0;
  return {image,get layer(){return painter?.layer;},draw(ctx) {
    if(image.complete && image.naturalWidth) {
      painter??=new WetPaintingRenderer(image,run,contact.layer);
      painter.draw(ctx);
    }else{
      ctx.fillStyle='#eee5d1';ctx.fillRect(0,0,world.width,world.height);
    }
    drift.draw(ctx,world.time,true);
    drawFood(ctx,this.bounds);
  },update(dt,renderer,player) {
    drift.update(world,dt);
    clock+=dt;
    if(clock>=1/config.renderHz){
      contact.stamp(world,renderer,player,image,painter);
      clock=0;
    }
  }};
}

export function createPondInk(canvas,world,ground,npcs,quality,forceFallback=false) {
  const renderer=createRevealRenderer(canvas,quality,{world,ground,npcPainter:npcs,TrailClass:CometTrail,
    body:{smallHalo:2.15,largeHalo:1.35},collisionOutline:{enabled:false}},forceFallback);
  renderer.collisionOutline.enabled=false;
  // The pool camera only projects the finished wet field. Its independent
  // solver window follows the swimmer in world units, even while looking
  // elsewhere on the minimap or zooming all the way into a single drop.
  let solver=null;
  const prepareSolver=p=>{
    const width=renderer.viewW,height=renderer.viewH,shortSide=Math.min(width,height);
    const frame=renderer.inkFrame=p.form?.species==='dragon'?npcs.playerFrame(p):null;
    // Keep all articulated dragon emitters, including a tail longer than a
    // viewport, inside the simulation regardless of its swimming direction.
    const cx=frame?(frame.minX+frame.maxX)/2:p.x,cy=frame?(frame.minY+frame.maxY)/2:p.y;
    const fullBody=frame?shortSide*Math.max((frame.maxX-frame.minX)/width,(frame.maxY-frame.minY)/height):0;
    const span=Math.max(670,p.r*14,fullBody*1.42+p.r*4);
    if(solver&&Math.abs(span-solver.span)<solver.span*.06
        &&solver.w===width&&solver.h===height
        &&Math.abs(cx-solver.cx)<span*.1&&Math.abs(cy-solver.cy)<span*.1)return;
    const scale=shortSide/span;
    const next={x:cx-width/(2*scale),y:cy-height/(2*scale),scale,cx,cy,span,w:width,h:height};
    if(solver&&solver.w===next.w&&solver.h===next.h){
      const ratio=solver.scale/next.scale;
      renderer.fluid.reproject(ratio,[(next.x-solver.x)*solver.scale/next.w,
        1-ratio-(next.y-solver.y)*solver.scale/next.h]);
    }
    renderer.inkCamera=solver=next;
  };
  // Keep a raw water surface for permanent contact printing, and dilute only
  // its visible wake. The small feathered patch restores density near the body.
  const nearInk=document.createElement('canvas');
  nearInk.width=nearInk.height=320;
  const patch=nearInk.getContext('2d'),mid=nearInk.width/2;
  const wetEdge=patch.createRadialGradient(mid,mid,0,mid,mid,mid);
  wetEdge.addColorStop(0,'black');wetEdge.addColorStop(.38,'black');
  wetEdge.addColorStop(.69,'rgba(0,0,0,.32)');wetEdge.addColorStop(1,'transparent');
  renderer.drawWorldInk=c=>{
    if(!solver)return;
    const p=world.player,source=renderer.canvas;
    const width=renderer.viewW/solver.scale,height=renderer.viewH/solver.scale;
    c.save();
    if(!renderer.fallback)c.globalAlpha*=.55;
    c.drawImage(source,solver.x,solver.y,width,height);
    c.restore();
    if(renderer.fallback)return;
    const reach=Math.max(12,p.r*2.5);
    const sx=source.width/width,sy=source.height/height;
    patch.clearRect(0,0,nearInk.width,nearInk.height);
    patch.drawImage(source,(p.x-reach-solver.x)*sx,(p.y-reach-solver.y)*sy,
      reach*2*sx,reach*2*sy,0,0,nearInk.width,nearInk.height);
    patch.globalCompositeOperation='destination-in';
    patch.fillStyle=wetEdge;patch.fillRect(0,0,nearInk.width,nearInk.height);
    patch.globalCompositeOperation='source-over';
    c.drawImage(nearInk,p.x-reach,p.y-reach,reach*2,reach*2);
  };
  renderer.motionSpeedLimit=()=>world.speed;
  // The original V5 shader controls opacity, vorticity, relative motion and
  // size adaptation. Paid ink uses the same solver with longer dye retention.
  const fluid=renderer.fluid;
  let lastJet=-Infinity,previousShrimp=[],jetMix=0,frameProfile;
  if(!renderer.fallback){
    // Keep the published V5 advection, vorticity and natural mottling. Its
    // material also ships a physical-core display pass, originally optional.
    // Always anchor that pass to the current simulation centre during zoom.
    fluid.preset={...fluid.preset,solidBody:true};
    const inherited=fluid.motionProfile.bind(fluid);
    fluid.motionProfile=()=>{
      if(frameProfile)return frameProfile;
      const profile=inherited();
      // A released stick stops the source, not the evaporation clock of dye
      // already on the water. V5 raised both decay and containment at rest.
      frameProfile={...profile,decay:Math.min(profile.decay??.16,.42)*(1-.15*jetMix),
        tailFade:Math.min(profile.tailFade??0,.31),wakeRetention:1};
      return frameProfile;
    };
  }
  const nativeTrail=renderer.trail.preset;
  if(renderer.fallback){
    const draw=renderer.trail.draw.bind(renderer.trail);
    renderer.trail.draw=(c,mode,view,contact=false)=>{
      if(contact)return draw(c,mode,view,true);
      const material=renderer.trail.preset;
      renderer.trail.preset={...material,opacity:material.opacity*.65};
      try{return draw(c,mode,view);}finally{renderer.trail.preset=material;}
    };
  }
  function advanceInk(dt,p){
    const released=world.player.emitting && p.form?.species!=='fish' && p.form?.species!=='dragon';
    jetMix+=(Number(released)-jetMix)*(1-Math.exp(-dt*(released?10:2)));
    frameProfile=null;
    if(renderer.fallback){
      renderer.trail.preset={...nativeTrail,life:.68+.38*jetMix,maxLife:1.1+.68*jetMix,
        length:90+55*jetMix,opacity:.22+.04*jetMix};
    }
    renderer.step(dt,p);
    if(renderer.fallback)return;
    // V5's shrimp lives in a glass bubble. V6 also wets the painted animal
    // inside that bubble. Use the measured, deformed rig sections, not the disk.
    if(p.form?.species==='shrimp' && dt>0) {
      const record=npcs.records.get(p),pose=npcs.playerPose(p),cam=fluid.livingCamera;
      if(record && pose && cam) {
        const {creature,calibration,anchor,scale}=record;
        const sections=calibration.bodySections.map(s=>{
          const q=creature.mapPoint(s.s,s.t);
          return {x:(q.x-anchor.x)*scale,y:(q.y-anchor.y)*scale,r:s.r*creature.length/creature.sourceCurve.length*scale,s:s.s};
        });
        const anchors=livingShapeEmitters({species:'fish',sections},p,pose,'fish',p.r);
        const activity=Math.min(1,Math.hypot(p.vx,p.vy)/30);
        fluid.feedLivingShape(anchors,{camera:cam,velocity:{x:p.vx,y:p.vy},dt,activity,previous:previousShrimp});
        previousShrimp=anchors;
        fluid.livingInkMetrics={form:'shrimp',emitters:activity?anchors.length:0,wholeBody:true};
      }
    }else previousShrimp=[];
    if(released&&dt>0&&world.time-lastJet>.043){
      // This is visual pigment only. The simulation has already paid its mass.
      lastJet=world.time;
      const a=world.player.angle,cam=renderer.camera,s=cam.scale,dx=Math.cos(a),dy=Math.sin(a);
      fluid.inject({living:!!p.form,x:(p.x-dx*p.r*.83-cam.x)*s/renderer.viewW,
        y:(p.y-dy*p.r*.83-cam.y)*s/renderer.viewH,vx:-dx*33,vy:-dy*33,
        radius:Math.max(.001,p.r*s/renderer.viewH*.50),intensity:.86});
    }
  }
  return {renderer,reset(next,nextGround) {
    world=next;renderer.world=next;renderer.ground=nextGround;
    renderer.cameraReady=false;renderer.clock=0;renderer.relativeSpeed=0;
    renderer.clearTrails();fluid.clear();renderer.body.reset();lastJet=-Infinity;previousShrimp=[];jetMix=0;frameProfile=null;solver=null;
  },updateView(view) {
    const x=view.x-renderer.viewW/(2*view.scale),y=view.y-renderer.viewH/(2*view.scale);
    const cam=renderer.camera;
    if(renderer.cameraReady&&cam.x===x&&cam.y===y&&cam.scale===view.scale)return false;
    Object.assign(cam,{x,y,scale:view.scale});renderer.cameraReady=true;return true;
  },step(dt,p){
    prepareSolver(p);
    if(dt<=0)return;
    const view=renderer.camera;renderer.camera=solver;
    try{advanceInk(dt,p);}finally{renderer.camera=view;}
  }};
}
