import {HeadFirstPainter,captureForm,prepareDragonGlide} from './creature-painter.mjs';
import {LIVING_RIGS,preloadLivingCreatures} from '../src-v5/ink/living-painter.js';
import {PondEffects} from '../src-v5/reveal/pond-effects.js';
import {preloadPondPickups,drawPondPickup,pondPickupExtent} from '../src-v5/reveal/pickups.js';
import {canEat,magnetReach} from './sim.mjs';
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
function drawPlayerRim(c,p,scale){
  c.save();if(p.form!=='ink')c.globalAlpha*=.52;
  // Layer wet graphite and a narrower, feathered rim on the exact same centre.
  pigmentRim(c,p.x,p.y,p.r,scale,'53,62,56',.24,.20);
  pigmentRim(c,p.x,p.y,p.r,scale,'112,120,110',.48,.084);c.restore();
}

function drawPaperEdge(c,cam,w,h,world){
  const left=-cam.x*cam.scale,top=-cam.y*cam.scale;
  const right=left+world.width*cam.scale,bottom=top+world.height*cam.scale;
  const depth=7;
  c.save();
  // Only shade the slim band where the cut paper meets the underlying table.
  for(const [x1,y1,x2,y2,x,y,rw,rh] of [
    [left,0,left-depth,0,left-depth,Math.max(0,top),depth,Math.min(h,bottom)-Math.max(0,top)],
    [right,0,right+depth,0,right,Math.max(0,top),depth,Math.min(h,bottom)-Math.max(0,top)],
    [0,top,0,top-depth,Math.max(0,left),top-depth,Math.min(w,right)-Math.max(0,left),depth],
    [0,bottom,0,bottom+depth,Math.max(0,left),bottom,Math.min(w,right)-Math.max(0,left),depth]
  ]){
    if(rw<=0||rh<=0||x+rw<0||y+rh<0||x>w||y>h)continue;
    const wash=c.createLinearGradient(x1,y1,x2,y2);
    wash.addColorStop(0,'rgba(48,47,37,.23)');wash.addColorStop(.35,'rgba(55,51,41,.10)');
    wash.addColorStop(1,'rgba(65,61,53,0)');c.fillStyle=wash;c.fillRect(x,y,rw,rh);
  }
  c.lineWidth=1;c.strokeStyle='rgba(86,79,62,.47)';c.strokeRect(left,top,right-left,bottom-top);c.restore();
}

class PondPainter extends HeadFirstPainter {
  constructor(assets,enemyArt) {
    super({assets});this.enemyArt=enemyArt;this.pond=null;this.miniature={id:'player-miniature'};
  }
  atlasFrame(q,e){
    // V5 bakes the same rig into a multi-frame atlas for distant swimmers.
    // At full-map scale the player's entire animated body fits in that atlas,
    // so avoid copying a high-definition live mesh across GPU contexts.
    if(e.id==='human'&&(q.coreRadius*this.camera.scale<8||q.species==='dragon')){
      this.miniature.species=q.species;
      return super.atlasFrame(q,this.miniature);
    }
    return super.atlasFrame(q,e);
  }
  visualPadding(e){return e.type==='spike'||e.type==='hole'?e.r*1.36+6:super.visualPadding(e);}
  draw(c,e,...args){
    if(e.type!=='spike'&&e.type!=='hole')return super.draw(c,e,...args);
    this.enemyArt.draw(c,e,this.pond.time,this.camera.scale*Math.min(window.devicePixelRatio||1,2),canEat(this.pond.player,e));
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

function flowFromPrey(c,w,e,z){
  const age=w.time-e.sipLastAt;
  if(!Number.isFinite(age)||age>.19)return;
  const p=w.player,dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);
  if(d<.5||d*z<4)return;
  const nx=dx/d,ny=dy/d,bx=p.x-nx*p.r*.72,by=p.y-ny*p.r*.72;
  const width=Math.min(e.r,p.r)*.19;
  c.save();c.lineCap='round';c.globalAlpha=Math.max(0,1-age/.19);
  for(let i=0;i<3;i++){
    const side=(i-1)*width*.7,bend=Math.sin(w.time*6+i*2)*width;
    const x=e.x-ny*side,y=e.y+nx*side;
    const g=c.createLinearGradient(x,y,bx,by);
    g.addColorStop(0,'rgba(42,97,111,0)');g.addColorStop(.28,'rgba(49,94,98,.35)');
    g.addColorStop(.84,'rgba(39,56,56,.45)');g.addColorStop(1,'rgba(32,43,40,0)');
    c.strokeStyle=g;c.lineWidth=Math.max(.62/z,width*(i===1?.48:.25));
    c.beginPath();c.moveTo(x,y);
    c.quadraticCurveTo((x+bx)*.5-ny*bend,(y+by)*.5+nx*bend,bx,by);c.stroke();
  }
  c.restore();
}

function drawProjectiles(c,w,z,art) {
  for(const s of w.shots){
    if(s.type==='bubble'){
      art.drawBubble(c,s,w.time,z);
    }else{
      c.save();c.translate(s.x,s.y);
      c.rotate(s.angle||0);c.fillStyle='rgba(38,42,36,.73)';c.beginPath();
      if(!s.shape||s.shape==='circle')c.arc(0,0,s.r,0,TAU);
      else {
        const sides=s.shape==='triangle'?3:s.shape==='square'?4:5;
        for(let i=0;i<sides;i++){const a=i*TAU/sides-Math.PI/2;c.lineTo(Math.cos(a)*s.r,Math.sin(a)*s.r);}
        c.closePath();
      }
      c.fill();c.restore();
    }
  }
}

function drawMote(c,d){
  c.save();c.translate(d.x,d.y);c.rotate(d.rot);c.fillStyle='rgba(39,35,27,'+d.alpha+')';c.beginPath();
  if(d.shape==='circle')c.arc(0,0,d.r,0,TAU);
  else{
    const sides=d.shape==='triangle'?3:d.shape==='square'?4:5;
    for(let i=0;i<sides;i++)c.lineTo(Math.sin(i*TAU/sides)*d.r,-Math.cos(i*TAU/sides)*d.r);
    c.closePath();
  }
  c.fill();c.restore();
}

// The native fluid is a transparent image and must be composited in the
// same stack as a painted animal. A global fluid overlay would leak through
// the leaves, while a background-only fluid would disappear below blue prey.
function drawPond(renderer,arena,w,npcs,effects,art){
  const c=renderer.ctx,cam=renderer.camera,z=cam.scale,hero=arena.player;
  const food=[],threats=[],dragons=[];
  for(const e of arena.entities){
    if(e===hero||e.morphGhost||e.dead||!renderer.visible(e,npcs.visualPadding(e)))continue;
    if(e.species==='dragon')dragons.push(e);
    else if(e.pickupArt||canEat(w.player,e))food.push(e);
    else threats.push(e);
  }
  const byRadius=(a,b)=>a.r-b.r;
  const paintCreature=e=>npcs.draw(c,e);
  const showPlants=kind=>{
    for(const item of arena.items){
      if(item.kind===kind&&renderer.visible(item,pondPickupExtent(item)))drawPondPickup(c,item);
    }
  };
  const drawHero=()=>{
    if(hero.dead)return;
    renderer.trail.draw(c,'ink',{...cam,width:renderer.viewW,height:renderer.viewH});
    renderer.drawWorldInk(c);
    if(hero.outgoingPaint)paintCreature(hero.outgoingPaint);
    if(hero.form)npcs.drawPlayer(c,hero);
    drawPlayerRim(c,w.player,z);
  };
  c.clearRect(0,0,renderer.viewW,renderer.viewH);c.fillStyle='#e7dfcc';
  c.fillRect(0,0,renderer.viewW,renderer.viewH);
  renderer.beginWorldClip();c.save();c.translate(-cam.x*z,-cam.y*z);c.scale(z,z);
  if(renderer.ground.bounds?.pixelScale<.46)c.imageSmoothingQuality='medium';
  renderer.ground.draw(c,arena);
  for(const d of arena.foods)if(renderer.visible(d,d.r))drawMote(c,d);
  showPlants('flower');
  for(const e of food.sort(byRadius)){
    paintCreature(e);
    if(e.sipLastAt!==undefined)flowFromPrey(c,w,e,z);
  }
  effects.drawWorld(c,arena,z);drawProjectiles(c,w,z,art);
  const dragon=hero.form?.species==='dragon';
  if(!dragon)drawHero();
  for(const e of threats.sort(byRadius))paintCreature(e);
  for(const e of threats)if(e.type==='hole')flowToVortex(c,w,e,z);
  showPlants('leaf');
  dragons.forEach(paintCreature);
  if(dragon)drawHero();
  c.restore();renderer.endWorldClip();
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
      .then(async ([loaded])=>{await prepareDragonGlide(loaded);assets=loaded;if(npcs)npcs.assets=loaded;})
      .catch(e=>{preparation=null;throw e;});
    return preparation;
  };
  function enter(w,url) {
    world=w;previousTime=-1;proxies=new WeakMap();effects.clear();
    hero={id:'human',controller:{type:'human'},effects:{},aim:{x:1,y:0},
      x:w.player.x,y:w.player.y,r:w.player.r,form:null,painted:false};
    ground=createGround(w,url);
    if(!npcs){npcs=new PondPainter(assets,enemyArt);npcs.ready.then(a=>{if(npcs)npcs.assets=a;}).catch(console.error);}
    npcs.pond=w;npcs.quality=quality;
    if(ink)ink.reset(w,ground);
    else ink=createPondInk(canvas,w,ground,npcs,fieldQuality,forceFallback);
  }
  function syncHero(p) {
    const species=p.form==='ink'?null:p.form;
    const rig=species?(p.activeItem?.rigId||LIVING_RIGS[species]):null;
    if((hero.form?.rigId??null)!==rig){
      const painted=hero.painted?captureForm(npcs,hero,ink.renderer):null;
      hero.outgoingPaint=painted?{id:'morph',morphGhost:painted,x:hero.x,y:hero.y,r:hero.r,opacity:1}:null;
      hero.morphStarted=painted?world.time:undefined;
    }
    const t=clamp((world.time-(hero.morphStarted??-1))/.52,0,1);
    hero.formOpacity=t*t*(3-2*t);
    if(t>=1)hero.outgoingPaint=null;
    if(hero.outgoingPaint)Object.assign(hero.outgoingPaint,{x:p.x,y:p.y,opacity:1-hero.formOpacity});
    hero.aim.x=Math.cos(p.angle);hero.aim.y=Math.sin(p.angle);
    if(species){
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
      Object.assign(animal,{x:item.x,y:item.y,vx:item.vx,vy:item.vy,r:item.r,dragonHeadRadius:item.type==='dragon'?item.r*1.10:undefined,opacity:item.opacity??1});
      return animal;
    });
    if(hero.outgoingPaint)animals.unshift(hero.outgoingPaint);
    const plants=[];
    for(const l of w.leaves) {
      plants.push({x:l.x,y:l.y,r:l.r,renderSize:l.r*2.1,kind:'leaf',variant:0});
      for(const f of l.flowers)plants.push({x:f.x,y:f.y,r:f.r,renderSize:f.r*2.45,kind:'flower',variant:f.slot%3});
    }
    const hw=canvas.clientWidth/(2*view.scale)+12,hh=canvas.clientHeight/(2*view.scale)+12;
    const bounds={left:view.x-hw,top:view.y-hh,right:view.x+hw,bottom:view.y+hh,
      pixelScale:view.scale*Math.min(devicePixelRatio||1,2)};
    ground.bounds=view.scale<.48?bounds:null;
    const foods=ground.bounds?[]:[...visibleFood(w.foodField,bounds.left,bounds.top,bounds.right,bounds.bottom)];
    for(const d of w.drops)foods.push({x:d.x,y:d.y,r:d.r,rot:d.angle||0,alpha:d.ready?.74:.28,shape:d.shape||'circle'});
    return {player:hero,entities:[hero,...animals,...w.enemies],items:plants,foods,
      waves:[],speed:()=>w.speed,magnetField:{active:hero.effects.magnet,reach:w.player.r+magnetReach(w.player)}};
  }
  function render(w,view,options={}) {
    if(world!==w)enter(w,options.artwork);
    const renderer=ink.renderer;
    if(renderer.viewW!==innerWidth||renderer.viewH!==innerHeight)renderer.resize();
    // The dye lives in the pond. Zooming changes how it is sampled on screen;
    // rebuilding its simulation grid here would erase a still-wet trail.
    if(!renderer.fallback&&fieldQuality!==quality){
      renderer.setQuality(quality);fieldQuality=quality;
    }
    renderer.mobile=document.body.dataset.controls?document.body.classList.contains('mobile'):matchMedia('(pointer:coarse)').matches;
    const dt=previousTime<0?1/60:clamp(w.time-previousTime,0,.1);
    previousTime=w.time;
    const arena=scene(w,view);
    const cameraMoved=ink.updateView(view);
    const cam=renderer.camera,width=renderer.viewW,height=renderer.viewH,viewport={width,height,mobile:renderer.mobile,camera:cam};
    npcs.update(dt,arena,cam,viewport);
    if(dt>0||cameraMoved)ink.step(dt,hero);
    if(dt>0){
      ground.update(dt,renderer,hero);
      effects.update(dt,arena,viewport);
    }
    drawPond(renderer,arena,w,npcs,effects,enemyArt);
    hero.painted=true;
    const c=renderer.ctx;
    drawPaperEdge(c,cam,width,height,w);
    effects.drawScreen(c,hero,viewport,cam);
    drawFocus(c,options.focus,cam,width,height,w.time);
    const reveal=clamp(options.reveal||0,0,1),im=ground.image;
    if(reveal>0&&im.complete&&im.naturalWidth){
      const alpha=reveal*reveal*(3-2*reveal);
      c.save();c.globalAlpha=alpha;c.fillStyle='#e7dfcc';c.fillRect(0,0,width,height);
      c.drawImage(im,-cam.x*cam.scale,-cam.y*cam.scale,w.width*cam.scale,w.height*cam.scale);c.restore();
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
