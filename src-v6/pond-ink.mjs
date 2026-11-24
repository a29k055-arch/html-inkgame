import {createRevealRenderer} from '../src-v5/reveal/renderer.js';
import {CometTrail} from '../src-v5/reveal/trail.js';
import {RevealMask,consumeBloomRadius} from '../src-v5/reveal/mask.js';
import {RevealPainter} from '../src-v5/reveal/painter.js';
import {REVEAL_CONFIG} from '../src-v5/reveal/config.js';
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
      frame:p.form?renderer.npcs.playerFrame(p):null};
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
    const cam=renderer.camera,sw=renderer.viewW,sh=renderer.viewH;
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

export function createGround(world,url) {
  const config={...REVEAL_CONFIG,width:world.width,height:world.height};
  const mask=new RevealMask(config),run={world,config,mask};
  const image=painting(url);
  const drift=createInkDrift();
  const drawFood=createFoodPainter(world.foodField);
  const contact=createWetContact(world,drift);
  let painter,clock=0,seen=world.events.length;
  return {image,get layer(){return painter?.layer;},draw(ctx) {
    if(image.complete && image.naturalWidth) {
      painter??=new RevealPainter(image,run);
      // A bloom rebuilds the original V5 background. Restore all previously
      // uncovered routes exactly once on top of the rebuilt layer.
      if(painter.last!==mask.version){
        painter.update();
        painter.layer.getContext('2d').drawImage(contact.layer,0,0,painter.layer.width,painter.layer.height);
      }
      painter.draw(ctx);
    }else{
      ctx.fillStyle='#eee5d1';ctx.fillRect(0,0,world.width,world.height);
    }
    drift.draw(ctx,world.time);
    drawFood(ctx,this.bounds);
  },update(dt,renderer,player) {
    drift.update(world,dt);
    for(;seen<world.events.length;seen++){
      const e=world.events[seen];
      if(e.type==='eat'&&(e.target==='spike'||e.target==='hole')){
        mask.reveal(e.x,e.y,consumeBloomRadius(e.r,config),{kind:'enemy'});
      }
    }
    clock+=dt;
    if(clock>=1/config.renderHz){
      contact.stamp(world,renderer,player,image,painter);
      mask.update(clock);clock=0;
    }
  }};
}

export function createPondInk(canvas,world,ground,npcs,quality,forceFallback=false) {
  const renderer=createRevealRenderer(canvas,quality,{world,ground,npcPainter:npcs,TrailClass:CometTrail,
    body:{smallHalo:2.15,largeHalo:1.35},collisionOutline:{enabled:false}},forceFallback);
  renderer.collisionOutline.enabled=false;
  let camera=renderer.camera;
  renderer.followCamera=()=>camera;
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
      frameProfile=jetMix>.01&&!fluid.livingForm?{...profile,
        decay:(profile.decay??.16)*(1-.16*jetMix),
        tailFade:(profile.tailFade??0)*(1-.25*jetMix)}:profile;
      return frameProfile;
    };
  }
  const nativeTrail=renderer.trail.preset;
  return {renderer,reset(next,nextGround) {
    world=next;renderer.world=next;renderer.ground=nextGround;
    renderer.cameraReady=false;renderer.clock=0;renderer.relativeSpeed=0;
    renderer.clearTrails();fluid.clear();renderer.body.reset();lastJet=-Infinity;previousShrimp=[];jetMix=0;frameProfile=null;
  },updateView(view) {
    camera={x:view.x-renderer.viewW/(2*view.scale),y:view.y-renderer.viewH/(2*view.scale),scale:view.scale};
    if(!renderer.cameraReady||camera.x!==renderer.camera.x||camera.y!==renderer.camera.y||camera.scale!==renderer.camera.scale){
      renderer.updateCamera(world.player);return true;
    }
    return false;
  },step(dt,p) {
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
  }};
}
