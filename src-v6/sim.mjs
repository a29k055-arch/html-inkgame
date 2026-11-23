// Deterministic pond physics. All positions and radii use painting coordinates.
import {resolveLivingRig} from '../src-v5/game/living-rigs.js';
import {createFoodField,visibleFood,removeFood,regrowFood} from './food-field.mjs';

const TICK = 1 / 60;
const EPSILON = 1e-8;
const TAU = Math.PI * 2;
export const radius = mass => 2 * Math.sqrt(Math.max(0, mass));
const forms = { fish: 12, shrimp: 12, turtle: 12, dragon: 20 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const touching = (a, b, tolerance = 0) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= (a.r + b.r + tolerance) ** 2;
const shielded = p => p.form === 'turtle' || p.form === 'dragon';
const bubbles = p => p.form === 'fish' || p.form === 'dragon';
const flakeShapes=['circle','triangle','square','pentagon'];
export const canEat = (player, enemy) => player.mass > enemy.mass && enemy.mass > EPSILON;

function random(w) {
  w.rng = (Math.imul(1664525, w.rng) + 1013904223) >>> 0;
  return w.rng / 4294967296;
}
function emissionRoll(w){
  w.emissionRng=(Math.imul(1664525,w.emissionRng)+1013904223)>>>0;
  return w.emissionRng/4294967296;
}
function event(w, type, details = {}) {
  w.events.push({ seq: ++w.sequence, time: w.time, type, ...details });
}
function cue(w, type, details, key, interval = .42) {
  if ((w.cueTimes.get(key) ?? -Infinity) + interval <= w.time) {
    w.cueTimes.set(key, w.time);
    event(w, type, details);
  }
}
function body(w, def, prefix) {
  return { x: 0, y: 0, vx: 0, vy: 0, angle: 0, ...def, id: def.id ?? prefix + (++w.idCounter) };
}
function bounded(w, entity, bounce = false) {
  const {r} = entity;
  const x = clamp(entity.x, r, w.width-r), y = clamp(entity.y, r, w.height-r);
  if (bounce) {
    if (x !== entity.x && (entity.x-x)*entity.vx > 0) entity.vx *= -.72;
    if (y !== entity.y && (entity.y-y)*entity.vy > 0) entity.vy *= -.72;
  }
  entity.x = x; entity.y = y;
}
function syncPlayer(p) {
  p.r = radius(p.mass) * (p.form === 'fish' ? .85 : 1);
}
export function spawnEnemy(w, def) {
  const e = body(w, def, 'enemy');
  e.mass = Math.max(EPSILON, def.mass ?? 50);
  e.r = radius(e.mass);
  e.type = def.type ?? 'spike';
  if(e.homeRadius){e.homeX=e.x;e.homeY=e.y;}
  e.kickX = 0; e.kickY = 0;
  w.enemies.push(e);
  return e;
}
export function spawnItem(w, def) {
  const item = body(w, def, 'item');
  item.r = def.r ?? 13;
  item.angle = def.angle ?? Math.atan2(item.vy,item.vx);
  const ordinal=w.rigCounts.get(item.type) ?? 0;
  item.rigId=def.rigId ?? resolveLivingRig(item.type,undefined,w.tutorial?0:w.rigSeed+ordinal);
  w.rigCounts.set(item.type,ordinal+1);
  w.items.push(item);
  return item;
}
export function spawnDrop(w, def) {
  const d = body(w, def, 'drop');
  d.mass = def.mass ?? 2;
  d.r = def.r ?? clamp(radius(d.mass)*1.22,1.9,9);
  d.shape=def.shape ?? flakeShapes[Math.floor(emissionRoll(w)*flakeShapes.length)];
  d.angle=def.angle ?? emissionRoll(w)*TAU;
  d.readyAt = w.time + (def.delay ?? (def.ready === false ? .45 : 0));
  d.ready = w.time >= d.readyAt;
  w.drops.push(d);
  return d;
}
function placeFlower(leaf) {
  // Vacant slots remain stable as the player harvests individual flowers.
  const slot = [0,1,2].find(n => !leaf.flowers.some(f => f.slot === n));
  if (slot === undefined) return;
  const angle = [0.15,2.35,4.37][slot] + leaf.angle;
  leaf.flowers.push({id:leaf.id + '-f' + slot, slot, mass:leaf.capacity,
    r:Math.min(15, leaf.r*.18), x:leaf.x+Math.cos(angle)*leaf.r*.47,
    y:leaf.y+Math.sin(angle)*leaf.r*.47});
}
export function spawnLeaf(w, def) {
  const leaf = body(w, def, 'leaf');
  leaf.r = def.r ?? 66; leaf.capacity = def.capacity ?? w.flowerMass;
  leaf.stored = def.stored ?? 0; leaf.flowers = [];
  const count = Array.isArray(def.flowers) ? def.flowers.length : def.flowers ?? 0;
  for(let i=0;i<Math.min(3,count);i++) placeFlower(leaf);
  w.leaves.push(leaf);
  return leaf;
}
export function createWorld(config = {}) {
  const seed=config.seed ?? 1;
  // Appearance has its own per-species sequence. Selecting a fish painting
  // must never draw from the generator that controls currents and arrivals.
  let rigSeed=typeof seed==='number'?seed>>>0:2166136261;
  if(typeof seed!=='number')for(const c of String(seed))rigSeed=Math.imul(rigSeed^c.charCodeAt(0),16777619)>>>0;
  const w = {width:config.width ?? 1800,height:config.height ?? 1100,
    speed:config.speed ?? 150, seed, rng:seed>>>0, rigSeed, rigCounts:new Map(),
    time:0, remainder:0, status:'playing', tutorial:!!config.tutorial,
    spawnItems:config.spawnItems ?? !config.tutorial, nextItem:config.nextItem ?? 9,
    itemInterval:config.itemInterval ?? 13, flowerMass:config.flowerMass ?? 30,
    idCounter:0,sequence:0,events:[],cueTimes:new Map(),contacts:new Map(),
    enemies:[], drops:[], leaves:[], items:[], departingItems:[], shots:[], safePath:[],
    largest:0, held:false, waitRelease:false, packet:0, packetTime:0, packetInterval:.12, bubbleDelay:0,
    emissionRng:(rigSeed^0x2ef54bc1)>>>0,
    travel:0, recordedMove:false};
  const p = w.player = body(w,{x:w.width/2,y:w.height/2,mass:100,...config.player},'player');
  p.form='ink'; p.formTime=0; p.activeItem=null; p.emitting=false; p.inventory=[];
  syncPlayer(p);
  w.foodField=createFoodField(w.width,w.height,config.foodSpacing,rigSeed);
  for (const def of config.enemies ?? []) spawnEnemy(w,def);
  for (const def of config.drops ?? []) spawnDrop(w,def);
  for (const def of config.leaves ?? []) spawnLeaf(w,def);
  for (const def of config.items ?? []) spawnItem(w,def);
  w.largest = Math.max(0,...w.enemies.map(e=>e.mass));
  w.safePath.push({x:p.x,y:p.y});
  return w;
}

function bank(w,leaf,ink) {
  const amount = Math.max(0,Math.min(ink, (3-leaf.flowers.length)*leaf.capacity-leaf.stored));
  leaf.stored += amount;
  while(leaf.flowers.length < 3 && leaf.stored + EPSILON >= leaf.capacity) {
    leaf.stored=Math.max(0,leaf.stored-leaf.capacity);
    placeFlower(leaf);
    event(w,'bloom',{id:leaf.id});
  }
  return amount;
}
function paidInk(w,shot,mass,vx=0,vy=0) {
  if(mass>EPSILON)spawnDrop(w,{x:clamp(shot.x,3,w.width-3),y:clamp(shot.y,3,w.height-3),
    vx,vy,mass,shape:shot.shape,angle:shot.angle,r:shot.r,delay:.48});
}
function deposit(w,leaf,shot) {
  const stored=bank(w,leaf,shot.mass);
  if(stored>EPSILON) cue(w,'store',{id:leaf.id,mass:stored},'store:'+leaf.id,.18);
  paidInk(w,shot,shot.mass-stored);
}
function shoot(w,type,mass=0) {
  const p=w.player;
  const bubble=type==='bubble';
  const mid=p.angle+(bubble?0:Math.PI);
  const spread=(bubble?9:24)*Math.PI/180;
  const bearing=mid+(2*emissionRoll(w)-1)*spread;
  const dx=Math.cos(bearing),dy=Math.sin(bearing);
  const v=bubble?215+emissionRoll(w)*78:172+emissionRoll(w)*122;
  const r=bubble?3.9+emissionRoll(w)*2.6:clamp(radius(mass)*1.25,1.9,9);
  const shot=body(w,{type,x:p.x+dx*(p.r+2),y:p.y+dy*(p.r+2),
    vx:dx*v,vy:dy*v,dx,dy,mass,r,angle:emissionRoll(w)*TAU,
    shape:bubble?'circle':flakeShapes[Math.floor(emissionRoll(w)*flakeShapes.length)],
    lifetime:bubble?.79+.16*emissionRoll(w):.29+.22*emissionRoll(w),age:0},'shot');
  if(type==='spray'){
    const leaf=w.leaves.find(l=>distance(l,p)<=l.r || distance(l,shot)<=l.r);
    if(leaf){ deposit(w,leaf,shot); return; }
  }
  w.shots.push(shot);
}
function flush(w) {
  if(w.packet>EPSILON) {
    shoot(w,'spray',w.packet);
    w.packetInterval=.076+emissionRoll(w)*.13;
  }
  w.packet=0;w.packetTime=0;
}
function restoreClearance(w) {
  const p=w.player;
  const clear=pos=>pos.x>=p.r && pos.x<=w.width-p.r && pos.y>=p.r && pos.y<=w.height-p.r &&
    w.enemies.every(e=>canEat(p,e)||distance(e,pos)>=e.r+p.r-.2);
  if(clear(p)) return;
  for(let i=w.safePath.length-1;i>=0;i--) {
    if(clear(w.safePath[i])) {
      p.x=w.safePath[i].x;p.y=w.safePath[i].y;return;
    }
  }
}
function changeForm(w,item) {
  const p=w.player,prev=p.form;
  flush(w);
  p.activeItem=item;
  p.form=item?.type ?? 'ink'; p.formTime=forms[p.form] ?? 0;
  syncPlayer(p);
  if(prev==='fish' && p.form!=='fish') restoreClearance(w);
  p.emitting=false;
  w.waitRelease=w.held;
  event(w,'form',{form:p.form,id:item?.id ?? null});
}
export function useItem(w,index) {
  if(w.status!=='playing' || !Number.isInteger(index) || !w.player.inventory[index]) return false;
  const item=w.player.inventory[index];
  if(!Object.hasOwn(forms,item.type)) return false;
  w.player.inventory.splice(index,1);
  changeForm(w,item);
  return true;
}
function playerStep(w,input,dt) {
  const p=w.player;
  w.held=!!input.action;
  if(!w.held) w.waitRelease=false;
  if(p.formTime>0) {
    p.formTime=Math.max(0,p.formTime-dt);
    if(p.formTime<1e-7) changeForm(w,null);
  }
  const ix=Number(input.x)||0,iy=Number(input.y)||0;
  const len=Math.hypot(ix,iy),strength=Math.min(1,len);
  const heading=len>.015?Math.atan2(iy,ix):p.angle;
  if(!input.keyboard||Math.hypot(p.vx,p.vy)<1)p.angle=heading;
  p.emitting=w.held&&!w.waitRelease;
  let speed=w.speed*(p.form==='turtle'?.85:1)*strength;
  if(p.emitting && !bubbles(p)) {
    const lost=p.mass*(1-Math.pow(.92,dt));
    p.mass-=lost; w.packet+=lost; w.packetTime+=dt;
    cue(w,'spray',{},'spray',.3);
    if(w.packetTime>=w.packetInterval) flush(w);
    speed+=w.speed*.12;
    syncPlayer(p);
  } else {
    flush(w);
    if(p.emitting) {
      w.bubbleDelay-=dt;
      if(w.bubbleDelay<=0) {
        shoot(w,'bubble'); event(w,'bubble',{form:p.form}); w.bubbleDelay=.22+emissionRoll(w)*.14;
      }
    } else w.bubbleDelay=0;
  }
  const vx=Math.cos(heading)*speed,vy=Math.sin(heading)*speed;
  // A digital key jumps straight to each new heading. Damping the actual
  // velocity rounds a sequence of four turns; the analogue stick stays precise.
  const response=input.keyboard?(strength>0?6.2:6.8):19;
  const ease=1-Math.exp(-dt*response);
  p.vx+=(vx-p.vx)*ease; p.vy+=(vy-p.vy)*ease;
  if(input.keyboard && Math.hypot(p.vx,p.vy)>1)p.angle=Math.atan2(p.vy,p.vx);
  if(speed===0 && Math.hypot(p.vx,p.vy)<.1) p.vx=p.vy=0;
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  bounded(w,p);
  if(strength>.04){ w.travel+=Math.hypot(p.vx,p.vy)*dt;
    if(!w.recordedMove && w.travel>=2){ event(w,'move');w.recordedMove=true; }
  }
}
function obstacle(w,e) {
  for(const l of w.leaves){
    const dx=e.x-l.x,dy=e.y-l.y,d=Math.hypot(dx,dy);
    const gap=l.r+e.r-d;
    if(gap<=0)continue;
    const nx=d?dx/d:1,ny=d?dy/d:0;
    e.x+=nx*gap;e.y+=ny*gap;
    const inward=e.vx*nx+e.vy*ny;
    if(inward<0){e.vx-=1.2*inward*nx;e.vy-=1.2*inward*ny;}
  }
  bounded(w,e,true);
}
function projectileStep(w,dt) {
  for(const s of w.shots){
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.age+=dt;
    if(s.type==='spray') {
      const leaf=w.leaves.find(l=>distance(s,l)<=l.r);
      if(leaf){deposit(w,leaf,s);s.done=true;continue;}
    }
    const e=w.enemies.find(e=>e.mass>EPSILON&&touching(e,s));
    if(e) {
      const strength=s.type==='bubble'?1200:s.mass*950;
      const impulse=Math.min(100,strength/Math.max(10,e.mass));
      e.kickX+=s.dx*impulse;e.kickY+=s.dy*impulse;
      event(w,'push',{id:e.id,target:e.type,source:s.type,form:w.player.form});
    }
    if(e || s.age>=s.lifetime || s.x<2 || s.x>w.width-2 || s.y<2 || s.y>w.height-2) {
      if(s.type==='spray') paidInk(w,s,s.mass,s.vx*.18,s.vy*.18);
      s.done=true;
    }
  }
  w.shots=w.shots.filter(s=>!s.done);
}
function magnet(w,obj,dt,kind) {
  const p=w.player;
  if((p.form!=='shrimp' && p.form!=='dragon') || obj.mass>=p.mass) return;
  const d=distance(obj,p),reach=135+p.r;
  if(!d || d>=reach) return;
  const speed=(kind==='drop'?105:30) * (.4+.6*(1-d/reach));
  const travel=Math.min(speed*dt,d);
  obj.x+=(p.x-obj.x)*travel/d; obj.y+=(p.y-obj.y)*travel/d;
  cue(w,'magnet',{target:kind,id:obj.id,form:p.form},'magnet:'+kind,.5);
}
function drift(w,dt) {
  for(const e of w.enemies) {
    e.x+=(e.vx+e.kickX)*dt; e.y+=(e.vy+e.kickY)*dt;
    if(e.homeRadius){
      // The large foragers patrol their own banks. Reflect their natural drift
      // at its rim; bubbles and paid jets can still push them out of the bank.
      const dx=e.x-e.homeX,dy=e.y-e.homeY,d=Math.hypot(dx,dy);
      const outward=dx*e.vx+dy*e.vy;
      if(d>=e.homeRadius && outward>0){e.vx-=2*outward*dx/(d*d);e.vy-=2*outward*dy/(d*d);}
    }
    const drag=Math.exp(-dt*1.45);
    e.kickX*=drag;e.kickY*=drag;
    magnet(w,e,dt,e.type);
    obstacle(w,e);
  }
  for(const d of w.drops) {
    d.x+=d.vx*dt;d.y+=d.vy*dt;
    const drag=Math.exp(-dt*1.7);
    d.vx*=drag;d.vy*=drag;
    d.ready=w.time>=d.readyAt;
    if(d.ready) magnet(w,d,dt,'drop');
    bounded(w,d);
  }
}
function foods(w) {
  const p=w.player;
  // The current carries a dense, edible field. Query only neighbouring squares
  // for each body. A magnet promotes individual flecks to drifting particles
  // without leaving a second copy in the field.
  const field=w.foodField;
  if(field){
    field.time=w.time;
    const nibble=(b,player)=>{
      const attracts=player&&(p.form==='shrimp'||p.form==='dragon');
      const reach=b.r+(attracts?135:5);
      for(const d of visibleFood(field,b.x-reach,b.y-reach,b.x+reach,b.y+reach)){
        const dist2=(d.x-b.x)**2+(d.y-b.y)**2;
        if((!player||d.mass<b.mass) && dist2<=(b.r+d.r)**2){
          removeFood(field,d);b.mass+=d.mass;
          if(player){syncPlayer(p);event(w,'eat',{target:'drop',id:d.id,mass:d.mass});}
          else b.r=radius(b.mass);
        }else if(attracts && d.mass<p.mass && dist2<reach*reach){
          removeFood(field,d);spawnDrop(w,{x:d.x,y:d.y,mass:d.mass,shape:d.shape,r:d.r,angle:d.rot});
        }
      }
    };
    nibble(p,true);
    for(const e of w.enemies)if(e.mass>EPSILON)nibble(e,false);
    regrowFood(field,w);
  }
  for(const d of w.drops) {
    if(!d.ready) continue;
    if(d.mass<p.mass && touching(p,d)) {
      p.mass+=d.mass;syncPlayer(p);d.done=true;
      event(w,'eat',{target:'drop',id:d.id,mass:d.mass});
      continue;
    }
    for(const e of w.enemies){
      if(e.mass>EPSILON&&touching(e,d)){e.mass+=d.mass;e.r=radius(e.mass);d.done=true;break;}
    }
  }
  w.drops=w.drops.filter(d=>!d.done);
  for(const leaf of w.leaves){
    leaf.flowers=leaf.flowers.filter(f=>{
      if(!touching(p,f)) return true;
      p.mass+=f.mass; syncPlayer(p); event(w,'flower',{id:leaf.id,mass:f.mass});return false;
    });
  }
}
function contact(w,a,b,next) {
  const key=String(a.id)+'/'+String(b.id);
  let info=w.contacts.get(key);
  if(!info) info={base:Math.min(a.mass,b.mass)};
  next.set(key,info);
  return info;
}
function enemyContacts(w,dt,next) {
  const es=w.enemies;
  for(let i=0;i<es.length;i++) {
    const a=es[i];
    for(let j=i+1;j<es.length;j++){
      const b=es[j]; if(a.mass<=EPSILON || b.mass<=EPSILON || !touching(a,b,.35)) continue;
      const c=contact(w,a,b,next);
      if(!c.noted){c.noted=true;event(w,'enemyContact',{a:a.type,b:b.type,aId:a.id,bId:b.id});}
      const loss=Math.min(a.mass,b.mass,c.base*.10*dt);
      if(a.type===b.type){a.mass-=loss;b.mass-=loss;}
      else if(a.mass!==b.mass){
        const transfer=Math.min(a.mass,b.mass,c.base*.19*dt);
        const sign=a.mass>b.mass?1:-1;
        a.mass+=sign*transfer;b.mass-=sign*transfer;
      }
      a.r=radius(a.mass);b.r=radius(b.mass);
      // Bodies compress while exchanging ink, allowing a visible sustained contact.
      const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
      const overlap=(a.r+b.r)*.77-d;
      if(overlap>0) {
        const nx=d>EPSILON?dx/d:1,ny=d>EPSILON?dy/d:0;
        const share=b.mass/Math.max(EPSILON,a.mass+b.mass);
        a.x-=nx*overlap*share;a.y-=ny*overlap*share;
        b.x+=nx*overlap*(1-share);b.y+=ny*overlap*(1-share);
      }
    }
  }
  for(const e of es) if(e.mass>EPSILON) obstacle(w,e);
}
function playerContacts(w,dt,next) {
  const p=w.player;
  const onLeaf=w.leaves.some(leaf=>distance(leaf,p)<=leaf.r);
  for(const e of w.enemies){
    const redHole=e.type==='hole' && e.mass>p.mass;
    if(e.mass<=EPSILON || p.mass<=EPSILON || !touching(e,p,redHole?EPSILON:.35)) continue;
    if(canEat(p,e)){
      const mass=e.mass;
      p.mass+=mass;e.mass=0;e.r=0;syncPlayer(p);
      event(w,'eat',{target:e.type,id:e.id,mass});continue;
    }
    const c=contact(w,p,e,next);
    const oldReach=p.r+e.r;
    let absorbing=false;
    if(shielded(p)) {
      cue(w,'shield',{id:e.id,target:e.type,form:p.form},'shield:'+e.id,.6);
    } else if(!onLeaf && (e.type==='spike' || e.mass>p.mass)) {
      const amount=Math.min(p.mass,e.mass,c.base*(e.type==='spike'?.10:.19)*dt);
      p.mass-=amount;e.mass+=amount*(e.type==='spike'?-1:1);
      syncPlayer(p);e.r=radius(e.mass);
      if(e.type==='hole'){
        absorbing=true;
        if(!c.absorption || w.time-c.absorption.lastAt>dt*1.5){
          c.absorption={amount:0,startedAt:w.time,lastAt:w.time};
        }
        c.absorption.amount+=amount;c.absorption.lastAt=w.time;
        e.absorption=c.absorption;
      }
      cue(w,'damage',{id:e.id,target:e.type,mass:amount},'damage:'+e.id,.5);
    }
    const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);
    const overlap=p.r+e.r-d-.3;
    if(overlap>0){
      p.x+=(d?dx/d:1)*overlap;p.y+=(d?dy/d:0)*overlap;
    }else if(absorbing && d>0 && (p.vx-e.vx-e.kickX)*dx+(p.vy-e.vy-e.kickY)*dy<=0){
      // A shrinking donor would slip off a stationary rim through its own
      // change of radius. Follow only this tick's retreating contact surface.
      // Swimming away, enemy motion and open-water gaps remain unrestricted.
      const follow=Math.max(0,Math.min(oldReach-p.r-e.r,d+.3-p.r-e.r));
      p.x-=dx/d*follow;p.y-=dy/d*follow;
    }
  }
  bounded(w,p);
  w.enemies=w.enemies.filter(e=>e.mass>EPSILON);
}
function enterItem(w){
  const side=Math.floor(random(w)*4);
  const vertical=side%2===0;
  const target=w.player;
  const x=vertical?clamp(target.x+(random(w)-.5)*520,25,w.width-25):(side===1?-14:w.width+14);
  const y=vertical?(side===0?-14:w.height+14):clamp(target.y+(random(w)-.5)*520,25,w.height-25);
  const tx=clamp(target.x+(random(w)-.5)*180,30,w.width-30);
  const ty=clamp(target.y+(random(w)-.5)*180,30,w.height-30);
  const angle=Math.atan2(ty-y,tx-x);
  const typeRoll=random(w),type=typeRoll<.30?'fish':typeRoll<.60?'shrimp':typeRoll<.90?'turtle':'dragon';
  const speed=Math.max(34,Math.min(85,distance({x,y},target)/17));
  spawnItem(w,{x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,angle,type,arriving:true});
}
function itemStep(w,dt) {
  if(w.spawnItems && w.time>=w.nextItem) {
    if(w.items.length<7) enterItem(w);
    w.nextItem=w.time+w.itemInterval*(.8+.4*random(w));
  }
  // A collected swimmer is immediately removed from gameplay while the
  // original rig finishes its last stroke at the point of collection.
  for(const item of w.departingItems){
    const t=clamp((w.time-item.pickedAt)/.56,0,1);
    item.opacity=1-t*t*(3-2*t);
    item.x+=item.vx*dt*(1-t);item.y+=item.vy*dt*(1-t);
  }
  w.departingItems=w.departingItems.filter(item=>item.opacity>0);
  for(const item of w.items) {
    item.x+=item.vx*dt;item.y+=item.vy*dt;
    if(Math.abs(item.vx)+Math.abs(item.vy)>.01) item.angle=Math.atan2(item.vy,item.vx);
    if(distance(w.player,item)<=w.player.r && w.player.inventory.length<3){
      w.player.inventory.push(item);item.picked=true;item.pickedAt=w.time;
      w.departingItems.push(item);
      event(w,'pickup',{id:item.id,form:item.type});
    }
  }
  w.items=w.items.filter(i=>!i.picked && i.x>=-32 && i.y>=-32 && i.x<=w.width+32 && i.y<=w.height+32);
}
function tick(w,input,dt) {
  w.time+=dt;
  playerStep(w,input,dt);
  for(const l of w.leaves) bank(w,l,l.capacity*dt/30);
  projectileStep(w,dt);drift(w,dt);foods(w);itemStep(w,dt);
  const contacts=new Map();
  enemyContacts(w,dt,contacts);playerContacts(w,dt,contacts);w.contacts=contacts;
  w.largest=0;
  for(const e of w.enemies) if(e.mass>w.largest) w.largest=e.mass;
  const p=w.player;
  if(distance(p,w.safePath[w.safePath.length-1])>5) {
    w.safePath.push({x:p.x,y:p.y});
    if(w.safePath.length>120) w.safePath.shift();
  }
  if(p.mass<=EPSILON) {w.status='lost';event(w,'lose');}
  else if(!w.tutorial && (p.mass>w.largest || !w.enemies.length)) {
    w.status='won';event(w,'win');
  }
}
export function stepWorld(w,input={},dt=TICK) {
  if(w.status!=='playing' || !Number.isFinite(dt) || dt<=0) return w;
  w.remainder+=Math.min(dt,1);
  while(w.remainder+1e-10>=TICK && w.status==='playing'){
    tick(w,input,TICK);w.remainder=Math.max(0,w.remainder-TICK);
  }
  return w;
}
