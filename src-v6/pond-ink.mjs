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

// Route pigment is on the original V5 persistent painting mask. The black wake
// lives only in the GPU fluid. A contact sample in world space keeps those two
// effects independent and avoids synchronously reading back a full GPU frame.
export function createGround(world,url) {
  const config={...REVEAL_CONFIG,width:world.width,height:world.height};
  const mask=new RevealMask(config),run={world,config,mask};
  const image=painting(url);
  const drift=createInkDrift();
  const drawFood=createFoodPainter(world.foodField);
  let painter,clock=0,seen=world.events.length,lastX=NaN,lastY=NaN;
  function markRoute(){
    const p=world.player;
    const d=Math.hypot(p.x-lastX,p.y-lastY),spacing=Math.max(2,p.r*.46);
    if(Number.isFinite(d)&&d<spacing*.35)return;
    const steps=Number.isFinite(d)&&d<Math.max(75,p.r*6)?Math.max(1,Math.ceil(d/spacing)):1;
    for(let i=1;i<=steps;i++){
      const t=i/steps;
      mask.brush(steps===1?p.x:lastX+(p.x-lastX)*t,steps===1?p.y:lastY+(p.y-lastY)*t,p.r,.85);
    }
    lastX=p.x;lastY=p.y;
  }
  return {image,get layer(){return painter?.layer;},draw(ctx) {
    if(image.complete && image.naturalWidth) {
      painter??=new RevealPainter(image,run);
      painter.draw(ctx);
    }else{
      ctx.fillStyle='#eee5d1';ctx.fillRect(0,0,world.width,world.height);
    }
    drift.draw(ctx,world.time);
    drawFood(ctx,this.bounds);
  },update(dt) {
    drift.update(world,dt);
    for(;seen<world.events.length;seen++){
      const e=world.events[seen];
      if(e.type==='eat'&&(e.target==='spike'||e.target==='hole')){
        const r=2*Math.sqrt(e.mass);
        mask.reveal(e.x??world.player.x,e.y??world.player.y,consumeBloomRadius(r,config),{kind:'enemy'});
      }
    }
    clock+=dt;
    if(clock>=1/config.renderHz){markRoute();mask.update(clock);clock=0;}
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
    const inherited=fluid.motionProfile.bind(fluid);
    fluid.motionProfile=()=>{
      if(frameProfile)return frameProfile;
      const profile=inherited();
      // Preserve V5's native advection, curls and body injection. Damp detached
      // density faster on an ordinary stroke. Ease the rate back after a jet.
      const moving=Math.min(1,Math.hypot(world.player.vx,world.player.vy)/32);
      frameProfile={...profile,tailFade:.78+moving*(2.5-1.15*jetMix),
        decay:.48+moving*(.47-.23*jetMix),wakeRetention:1.12+.34*moving*(1-jetMix)};
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
      renderer.updateCamera(world.player);
    }
  },step(dt,p) {
    const released=world.player.emitting && p.form?.species!=='fish' && p.form?.species!=='dragon';
    jetMix+=(Number(released)-jetMix)*(1-Math.exp(-dt*(released?10:2)));
    frameProfile=null;
    if(renderer.fallback){
      renderer.trail.preset={...nativeTrail,life:.43+.52*jetMix,maxLife:.78+.65*jetMix,
        length:65+55*jetMix,opacity:.19+.065*jetMix};
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
