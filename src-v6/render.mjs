import {HeadFirstPainter} from './creature-painter.mjs';
import {LIVING_RIGS,preloadLivingCreatures} from '../src-v5/ink/living-painter.js';
import {PondEffects} from '../src-v5/reveal/pond-effects.js';
import {preloadPondPickups} from '../src-v5/reveal/pickups.js';
import {canEat} from './sim.mjs';
import {createEnemyArt} from './enemy-art.mjs';
import {createGround,createPondInk} from './pond-ink.mjs';
import {visibleFood} from './food-field.mjs';

const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// The highest-opacity part of each wash sits on the logical contact radius.
// Feather inward and outward separately. There is no second debug outline.
function pigmentRim(c,x,y,r,scale,rgb,opacity,width){
  if(!(r>0))return;
  const half=Math.min(r*.42,Math.max(1.55/scale,r*width));
  const inner=r-half,outer=r+half;
  const wash=c.createRadialGradient(x,y,inner,x,y,outer);
  for(const [stop,a] of [[0,0],[.23,.12],[.41,.52],[.5,1],[.60,.63],[.77,.21],[1,0]]){
    wash.addColorStop(stop,'rgba('+rgb+','+opacity*a+')');
  }
  c.fillStyle=wash;c.fillRect(x-outer,y-outer,outer*2,outer*2);
}
function drawRim(c,e,p,scale) {
  const edible=canEat(p,e);
  pigmentRim(c,e.x,e.y,e.r,scale,edible?'76,170,190':'196,91,86',.78,.112);
}

// Let the native V5 renderer sort animal rigs, the ink body and painted rivals
// together. Only V6's two new species use an alternate material.
class PondPainter extends HeadFirstPainter {
  constructor(assets,enemyArt) {
    super({assets});this.enemyArt=enemyArt;this.pond=null;this.miniature={id:'player-miniature'};
  }
  atlasFrame(q,e){
    // V5 bakes the same rig into a multi-frame atlas for distant swimmers.
    // At full-map scale the player's entire animated body fits in that atlas,
    // so avoid copying a high-definition live mesh across GPU contexts.
    if(e.id==='human'&&q.coreRadius*this.camera.scale<8){
      this.miniature.species=q.species;
      return super.atlasFrame(q,this.miniature);
    }
    return super.atlasFrame(q,e);
  }
  raster(q,e,camera,viewport){
    // V5 translates the previous pose with the actor on every display frame.
    // Keep that smooth translation while sampling the expensive living mesh at
    // 30 Hz on balanced settings. Zoom and growth immediately invalidate it.
    const sameSize=Math.abs(camera.scale/(q.lastScale||camera.scale)-1)<.015&&
      Math.abs(q.coreRadius/(q.lastRadius||q.coreRadius)-1)<.02;
    if(e.id==='human'&&this.quality!=='high'&&q.tile&&q.world&&q.renderAge<1/30&&sameSize&&
      q.world.w*camera.scale<viewport.width*.65&&q.world.h*camera.scale<viewport.height*.65)return true;
    return super.raster(q,e,camera,viewport);
  }
  visualPadding(e){return e.type==='spike'||e.type==='hole'?e.r*1.18+6:super.visualPadding(e);}
  draw(c,e,...args){
    if(e.type!=='spike'&&e.type!=='hole')return super.draw(c,e,...args);
    this.enemyArt.draw(c,e,this.pond.time,this.camera.scale*Math.min(window.devicePixelRatio||1,2));
    drawRim(c,e,this.pond.player,this.camera.scale);
  }
}

function flowToVortex(c,w,e,z) {
  const transfer=e.absorption;
  if(!transfer||w.time-transfer.lastAt>.20||transfer.amount<=0)return;
  const p=w.player,theta=Math.atan2(e.y-p.y,e.x-p.x),dx=Math.cos(theta),dy=Math.sin(theta);
  const ax=p.x+dx*p.r*.57,ay=p.y+dy*p.r*.57,bx=e.x-dx*e.r*.12,by=e.y-dy*e.r*.12;
  const width=Math.min(e.r,p.r)*.37,age=w.time-transfer.startedAt;
  const fade=clamp(age*8+.16,0,1)*clamp(1-(w.time-transfer.lastAt)/.20,0,1);
  c.save();c.globalAlpha=fade;c.lineCap='round';
  // Individual wet threads converge at the lip and are drawn into its centre.
  for(let i=-2;i<=2;i++){
    const wave=Math.sin(w.time*5+i*1.83),s=i/2;
    const bend=width*(s*.78+wave*.20);
    c.strokeStyle=i===0?'rgba(23,28,26,.62)':'rgba(49,58,51,.31)';
    c.lineWidth=Math.max(.8/z,width*(i===0?.32:.14));
    c.beginPath();c.moveTo(ax-dy*s*width,ay+dx*s*width);
    c.bezierCurveTo(ax+(bx-ax)*.38-dy*bend,ay+(by-ay)*.38+dx*bend,
      ax+(bx-ax)*.76+dy*bend,ay+(by-ay)*.76-dx*bend,bx,by);c.stroke();
    const u=(w.time*1.62+i*.21+1)%1,slip=(1-u)*(s*width+wave*.13*width);
    const x=ax+(bx-ax)*u-dy*slip,y=ay+(by-ay)*u+dx*slip;
    c.fillStyle='rgba(29,36,31,.79)';c.beginPath();c.ellipse(x,y,Math.max(1.4/z,width*.34)*(1-u*.48),
      Math.max(.8/z,width*.13),theta,0,TAU);c.fill();
  }
  // The same integer comes from the simulation's transferred mass at both ends.
  const amount=Math.floor(transfer.amount);
  if(amount>=1 && z*(e.r+p.r)>26){
    c.font='600 '+(clamp((e.r+p.r)*z*.21,12,18)/z)+'px serif';c.textAlign='center';
    c.lineWidth=2.8/z;c.strokeStyle='rgba(245,236,214,.92)';
    for(const [body,sign,color] of [[p,'−','#934b40'],[e,'+','#3c4941']]){
      const y=body.y-body.r-7/z;c.strokeText(sign+amount,body.x,y);c.fillStyle=color;c.fillText(sign+amount,body.x,y);
    }
  }
  c.restore();
}

function drawProjectiles(c,w,z) {
  for(const s of w.shots){
    c.save();c.translate(s.x,s.y);
    if(s.type==='bubble'){
      pigmentRim(c,0,0,s.r,z,'55,61,60',.58,.18);
    }else{
      c.rotate(s.angle||0);c.fillStyle='rgba(38,42,36,.73)';c.beginPath();
      if(!s.shape||s.shape==='circle')c.arc(0,0,s.r,0,TAU);
      else {
        const sides=s.shape==='triangle'?3:s.shape==='square'?4:5;
        for(let i=0;i<sides;i++){const a=i*TAU/sides-Math.PI/2;c.lineTo(Math.cos(a)*s.r,Math.sin(a)*s.r);}
        c.closePath();
      }
      c.fill();
    }
    c.restore();
  }
}

function drawFocus(c,focus,cam,w,h,t) {
  if(!focus||!Number.isFinite(focus.x))return;
  const x=(focus.x-cam.x)*cam.scale,y=(focus.y-cam.y)*cam.scale;
  c.save();c.lineWidth=1.5;c.strokeStyle='#987342';
  if(x<=10||x>=w-10||y<=10||y>=h-10){
    const dx=x-w/2,dy=y-h/2,k=Math.min((w*.45)/Math.max(.01,Math.abs(dx)),(h*.38)/Math.max(.01,Math.abs(dy)));
    c.translate(w/2+dx*k,h/2+dy*k);c.rotate(Math.atan2(dy,dx));
    c.fillStyle='rgba(244,232,206,.86)';c.beginPath();c.arc(0,0,11,0,TAU);c.fill();
    c.fillStyle='#83633c';c.beginPath();c.moveTo(6,0);c.lineTo(-4,-4);c.lineTo(-2,0);c.lineTo(-4,4);c.closePath();c.fill();
  }
  c.restore();
}

export function createRenderer(canvas) {
  const enemyArt=createEnemyArt(),effects=new PondEffects();
  let quality='balanced',fieldQuality=quality,ink=null,npcs=null,assets=null,world=null,ground=null;
  let previousTime=-1,hero=null,proxies=new WeakMap(),preparation=null,forceFallback=false;
  const prepare=()=>{
    if(!preparation)preparation=Promise.all([preloadLivingCreatures(),preloadPondPickups(),enemyArt.ready])
      .then(([loaded])=>{assets=loaded;if(npcs)npcs.assets=loaded;})
      .catch(e=>{preparation=null;throw e;});
    return preparation;
  };
  function enter(w,url) {
    world=w;previousTime=-1;proxies=new WeakMap();effects.clear();
    hero={id:'human',controller:{type:'human'},effects:{},aim:{x:1,y:0},r:w.player.r,form:null};
    ground=createGround(w,url);
    if(!npcs){npcs=new PondPainter(assets,enemyArt);npcs.ready.then(a=>{if(npcs)npcs.assets=a;}).catch(console.error);}
    npcs.pond=w;npcs.quality=quality;
    if(ink)ink.reset(w,ground);
    else ink=createPondInk(canvas,w,ground,npcs,fieldQuality,forceFallback);
  }
  function syncHero(p) {
    const species=p.form==='ink'?null:p.form;
    hero.aim.x=Math.cos(p.angle);hero.aim.y=Math.sin(p.angle);
    if(species){
      const rig=p.activeItem?.rigId||LIVING_RIGS[species];
      if(hero.form?.rigId!==rig)hero.form={species,rigId:rig,remaining:p.formTime};
      hero.form.remaining=p.formTime;
    }else hero.form=null;
    Object.assign(hero,{x:p.x,y:p.y,r:p.r,vx:p.vx,vy:p.vy,dead:world.status==='lost',
      hitFlash:0,pondBuffs:null});
    hero.effects.magnet=species==='shrimp'||species==='dragon';
    hero.effects.manualRush=p.emitting&&species!=='fish'&&species!=='dragon';
    hero.effects.giant=false;hero.effects.water=false;
  }
  function scene(w,view) {
    syncHero(w.player);
    const animals=w.items.concat(w.departingItems).map(item=>{
      let animal=proxies.get(item);
      if(!animal){
        animal={id:item.id,pickupArt:true,species:item.type,rigId:item.rigId||LIVING_RIGS[item.type],aim:{x:Math.cos(item.angle),y:Math.sin(item.angle)}};
        proxies.set(item,animal);
      }
      animal.aim.x=Math.cos(item.angle);animal.aim.y=Math.sin(item.angle);
      Object.assign(animal,{x:item.x,y:item.y,vx:item.vx,vy:item.vy,r:item.r*.74,opacity:item.opacity??1});
      return animal;
    });
    const plants=[];
    for(const l of w.leaves) {
      plants.push({x:l.x,y:l.y,r:l.r,renderSize:l.r*2.1,kind:'leaf',variant:0});
      for(const f of l.flowers)plants.push({x:f.x,y:f.y,r:f.r,renderSize:f.r*2.45,kind:'flower',variant:f.slot%3});
    }
    const hw=canvas.clientWidth/(2*view.scale)+12,hh=canvas.clientHeight/(2*view.scale)+12;
    const bounds={left:view.x-hw,top:view.y-hh,right:view.x+hw,bottom:view.y+hh};
    ground.bounds=view.scale<.48?bounds:null;
    const foods=ground.bounds?[]:[...visibleFood(w.foodField,bounds.left,bounds.top,bounds.right,bounds.bottom)];
    for(const d of w.drops)foods.push({x:d.x,y:d.y,r:d.r,rot:d.angle||0,alpha:d.ready?.74:.28,shape:d.shape||'circle'});
    return {player:hero,entities:[hero,...animals,...w.enemies],items:plants,foods,
      waves:[],speed:()=>w.speed,magnetField:{active:hero.effects.magnet,reach:135+hero.r}};
  }
  function render(w,view,options={}) {
    if(world!==w)enter(w,options.artwork);
    const renderer=ink.renderer;
    if(renderer.viewW!==innerWidth||renderer.viewH!==innerHeight)renderer.resize();
    // On a view of the whole pond the dye field is subpixel. Use V5's smaller
    // native simulation grid; keep the canvas, ink paintings and UI at full
    // display resolution. Separate thresholds prevent churn during a pinch.
    if(!renderer.fallback){
      const pixelRadius=w.player.r*view.scale;
      const next=quality==='performance'||pixelRadius<(fieldQuality==='performance'?9:6)?'performance':quality;
      if(next!==fieldQuality){renderer.setQuality(next);fieldQuality=next;}
    }
    renderer.mobile=document.body.dataset.controls?document.body.classList.contains('mobile'):matchMedia('(pointer:coarse)').matches;
    const dt=previousTime<0?1/60:clamp(w.time-previousTime,0,.1);
    previousTime=w.time;
    const arena=scene(w,view);
    ink.updateView(view);
    const cam=renderer.camera,width=renderer.viewW,height=renderer.viewH,viewport={width,height,mobile:renderer.mobile,camera:cam};
    npcs.update(dt,arena,cam,viewport);
    if(dt>0){
      ink.step(dt,hero);
      ground.update(dt);
      effects.update(dt,arena,viewport);
    }
    renderer.drawStone(arena);
    const c=renderer.ctx;
    renderer.beginWorldClip();c.save();c.translate(-cam.x*cam.scale,-cam.y*cam.scale);c.scale(cam.scale,cam.scale);
    effects.drawWorld(c,arena,cam.scale);drawProjectiles(c,w,cam.scale);
    if(!hero.form&&!hero.dead) pigmentRim(c,hero.x,hero.y,w.player.r,cam.scale,'79,87,81',.46,.075);
    for(const e of w.enemies)if(e.type==='hole')flowToVortex(c,w,e,cam.scale);
    c.restore();renderer.endWorldClip();renderer.drawTopItems(arena);renderer.drawWorldFrame();
    effects.drawScreen(c,hero,viewport,cam);
    drawFocus(c,options.focus,cam,width,height,w.time);
    const reveal=clamp(options.reveal||0,0,1),im=ground.image;
    if(reveal>0&&im.complete&&im.naturalWidth){
      const fit=Math.min(width/im.naturalWidth,height/im.naturalHeight),iw=im.naturalWidth*fit,ih=im.naturalHeight*fit;
      c.save();c.globalAlpha=reveal*(2-reveal);c.fillStyle='#eee5d1';c.fillRect(0,0,width,height);
      c.drawImage(im,(width-iw)/2,(height-ih)/2,iw,ih);c.restore();
    }
    Object.assign(window.bokuMetrics??={},{
      backend:renderer.fallback?'V5 Canvas':'V5 LivingInkFluid',heroPreset:renderer.trail.presetKey,
      heroTrailMode:renderer.fallback?'canvas-fallback':'gpu-cloud',livingInk:renderer.fluid.livingInkMetrics,
      artwork:im.currentSrc||im.src,living:npcs.metrics,renderedFrames:(window.bokuMetrics?.renderedFrames||0)+1
    });
  }
  function setQuality(value){
    const next=value==='low'?'performance':value;
    if(!['high','balanced','performance'].includes(next)||quality===next)return;
    quality=next;if(npcs)npcs.quality=next;
  }
  function onRenderError() {
    if(!ink||ink.renderer.fallback)return;
    forceFallback=true;const old=ink.renderer;old.npcs=null;old.dispose();
    ink=createPondInk(canvas,world,ground,npcs,fieldQuality,true);
  }
  document.addEventListener('boku:render-error',onRenderError);
  return {render,setQuality,prepare,get mapLayer(){return ground?.layer;},dispose(){
    document.removeEventListener('boku:render-error',onRenderError);
    if(ink)ink.renderer.dispose();
    ink=null;npcs=null;world=null;
  }};
}
