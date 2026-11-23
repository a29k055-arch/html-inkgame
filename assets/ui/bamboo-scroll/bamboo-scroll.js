const imageURL = (name) => new URL(name, import.meta.url).href;
const clamp = (v, lo=0, hi=1) => Math.max(lo, Math.min(hi,v));

/** Exponential coast: frame-rate independent position and velocity. */
export function bambooCoastStep(position, velocity, ms, decayMs = 155) {
  const factor = Math.exp(-Math.max(0,ms)/decayMs);
  return {position:position+velocity*decayMs*(1-factor),velocity:velocity*factor};
}

/** One slat = one level. Pass actual names/locked state from your game.
 * Options are optional; this remains compatible with the original interface.
 */
export function createLevelScroll(viewport, levels, onSelect = () => {}, options = {}) {
  const controller = new AbortController();
  const signal = controller.signal;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const decay = Number.isFinite(options.decayMs) ? clamp(options.decayMs,60,500) : 155;
  const maxSpeed = Number.isFinite(options.maxSpeed) ? clamp(options.maxSpeed,.2,4) : 2.2;
  const listens = (target,name,fn,opts = {}) => target.addEventListener(name,fn,{...opts,signal});
  viewport.classList.add('bamboo-levels','bamboo-levels-r3');
  viewport.tabIndex = 0;
  viewport.setAttribute('aria-label', '竹简选关，可左右滚动');
  const track = document.createElement('div');
  track.className = 'bamboo-level-track bamboo-level-track-r3';
  const buttons = levels.map((level, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bamboo-level';
    button.setAttribute('aria-pressed','false');
    button.disabled = Boolean(level.locked);
    const label = document.createElement('span');
    label.className = 'bamboo-level-name';
    label.textContent = level.name ?? `第${i + 1}关`;
    const no = document.createElement('span');
    no.className = 'bamboo-level-no';
    no.textContent = String(i + 1).padStart(2,'0');
    button.append(label,no);
    listens(button,'click', () => {
      select(i);
      onSelect(level,i);
    });
    track.append(button);
    return button;
  });
  // Two continuous cords pass through every slat, including the raised one.
  // Keep the original button markup so existing game consumers remain valid.
  const ns = 'http://www.w3.org/2000/svg';
  const cords = document.createElementNS(ns,'svg');
  cords.setAttribute('class','bamboo-level-cords');
  cords.setAttribute('aria-hidden','true');
  cords.setAttribute('focusable','false');
  cords.setAttribute('width','0');
  cords.setAttribute('height','0');
  const strands = [0,1].map(() => {
    const base=document.createElementNS(ns,'path'), braid=document.createElementNS(ns,'path');
    for (const path of [base,braid]) {
      path.setAttribute('fill','none');
      path.setAttribute('stroke-linecap','round');
      path.setAttribute('vector-effect','non-scaling-stroke');
      cords.append(path);
    }
    base.setAttribute('stroke','#735536');
    base.setAttribute('stroke-width','3.2');
    braid.setAttribute('stroke','#c1a16d');
    braid.setAttribute('stroke-width','1.65');
    braid.setAttribute('stroke-dasharray','2.3 1.8');
    return [base,braid];
  });
  track.append(cords);
  viewport.replaceChildren(track);
  let measurements=[], lifts=buttons.map(()=>0), liftFrame=0;
  let liftAmount=10;
  function renderCords() {
    if (!measurements.length) return;
    const first=measurements[0],last=measurements.at(-1);
    [0.085,0.912].forEach((fraction,i) => {
      const points = [
        {x:first.x-first.w/2,y:first.y+first.h*fraction},
        ...measurements.map((p,j)=>({x:p.x,y:p.y+p.h*fraction-lifts[j]})),
        {x:last.x+last.w/2,y:last.y+last.h*fraction}
      ];
      let d=`M ${points[0].x} ${points[0].y}`;
      for(let j=1;j<points.length;j++){
        const a=points[j-1],b=points[j],dx=(b.x-a.x)*.40;
        d+=` C ${a.x+dx} ${a.y} ${b.x-dx} ${b.y} ${b.x} ${b.y}`;
      }
      for(const path of strands[i]) path.setAttribute('d',d);
    });
  }
  function measureCords() {
    const rect=track.getBoundingClientRect();
    if(rect.width<1 || rect.height<1) return;
    cords.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    const css=parseFloat(getComputedStyle(viewport).getPropertyValue('--bamboo-selection-lift'));
    liftAmount=clamp(Number.isFinite(options.liftPx)?options.liftPx:Number.isFinite(css)?css:10,0,12);
    measurements=buttons.map((button,i)=>{
      const b=button.getBoundingClientRect();
      return {x:b.left-rect.left+b.width/2,y:b.top-rect.top+lifts[i],w:b.width,h:b.height};
    });
    renderCords();
  }
  function paintLifts(values) {
    for(let i=0;i<buttons.length;i++) {
      if(values[i]!==lifts[i]) {
        lifts[i]=values[i];
        buttons[i].style.transform=values[i]>.001?`translateY(${-values[i]}px)`:'';
      }
    }
    renderCords();
  }
  function syncSelection() {
    cancelAnimationFrame(liftFrame);liftFrame=0;
    const from=[...lifts],to=buttons.map(b=>b.getAttribute('aria-pressed')==='true'?liftAmount:0);
    if(from.every((v,i)=>Math.abs(v-to[i])<.01) || reduced.matches){paintLifts(to);return;}
    const start=performance.now();
    function frame(time) {
      const t=clamp((time-start)/215),eased=1-(1-t)**3;
      paintLifts(from.map((v,i)=>v+(to[i]-v)*eased));
      if(t<1) liftFrame=requestAnimationFrame(frame);
      else {liftFrame=0;paintLifts(to);}
    }
    liftFrame=requestAnimationFrame(frame);
  }
  // Other consumers (including catalogues with external state) may update
  // aria-pressed themselves. The visual and cords follow those changes too.
  const selectionObserver=new MutationObserver(records=>{
    if(!records.some(r=>r.oldValue!==r.target.getAttribute('aria-pressed')))return;
    if(scrollMode==='coast')stopMotion();
    syncSelection();
  });
  selectionObserver.observe(track,{attributes:true,subtree:true,attributeOldValue:true,attributeFilter:['aria-pressed']});
  const sizeObserver=new ResizeObserver(()=>{measureCords();syncSelection();});
  sizeObserver.observe(track);
  measureCords();

  let pointer=null, moved=false, suppressUntil=0, samples=[];
  let startX=0,startY=0,startScroll=0,lastMove=0;
  let scrollFrame=0, scrollMode='', target=0;
  const maxScroll=()=>Math.max(0,viewport.scrollWidth-viewport.clientWidth);
  function stopMotion(){
    cancelAnimationFrame(scrollFrame);scrollFrame=0;scrollMode='';
  }
  function setScroll(x){viewport.scrollLeft=clamp(x,0,maxScroll());}
  function coast(velocity){
    stopMotion();
    if(reduced.matches || options.inertia===false || Math.abs(velocity)<.045) return;
    let position=viewport.scrollLeft, v=clamp(velocity,-maxSpeed,maxSpeed),last=performance.now();
    scrollMode='coast';
    function frame(time) {
      const next=bambooCoastStep(position,v,Math.min(40,Math.max(0,time-last)),decay);
      last=time;position=next.position;v=next.velocity;
      setScroll(position);
      if(Math.abs(v)>.025 && position>0 && position<maxScroll())scrollFrame=requestAnimationFrame(frame);
      else stopMotion();
    }
    scrollFrame=requestAnimationFrame(frame);
  }
  function easeTo(value){
    target=clamp(value,0,maxScroll());
    if(reduced.matches){stopMotion();setScroll(target);return;}
    if(scrollMode==='ease')return;
    stopMotion();scrollMode='ease';
    let position=viewport.scrollLeft,last=performance.now();
    function frame(time){
      target=clamp(target,0,maxScroll());
      const dt=Math.min(50,Math.max(0,time-last));last=time;
      position+=(target-position)*(1-Math.exp(-dt/82));
      setScroll(position);
      if(Math.abs(position-target)>.5)scrollFrame=requestAnimationFrame(frame);
      else {setScroll(target);stopMotion();}
    }
    scrollFrame=requestAnimationFrame(frame);
  }
  function sample(time){samples.push({time,x:viewport.scrollLeft});while(samples.length>2 && time-samples[0].time>105)samples.shift();}
  listens(viewport,'pointerdown',e=>{
    if(pointer!==null || e.button!==0 || e.isPrimary===false)return;
    stopMotion();suppressUntil=0;
    pointer=e.pointerId;moved=false;
    startX=e.clientX;startY=e.clientY;startScroll=viewport.scrollLeft;
    lastMove=performance.now();samples=[{time:lastMove,x:startScroll}];
  });
  listens(viewport,'pointermove',e=>{
    if(pointer!==e.pointerId)return;
    const dx=e.clientX-startX,dy=e.clientY-startY;
    if(!moved){
      if(e.pointerType!=='mouse'&&Math.abs(dy)>7&&Math.abs(dy)>Math.abs(dx)*1.15){pointer=null;return;}
      if(Math.abs(dx)<(e.pointerType==='mouse'?5:8) || Math.abs(dx)<Math.abs(dy)*.9)return;
      moved=true;viewport.setPointerCapture(pointer);
      viewport.classList.add('is-dragging');
    }
    setScroll(startScroll-dx);lastMove=performance.now();sample(lastMove);
  });
  function finishPointer(e,release=false){
    if(e.pointerId!==pointer)return;
    const wasMoved=moved,now=performance.now();
    if(wasMoved)suppressUntil=now+400;
    pointer=null;moved=false;
    viewport.classList.remove('is-dragging');
    if(release&&wasMoved&&now-lastMove<95&&samples.length>1){
      // Inertia depends on recent movement, not total gesture distance.
      const recent=samples.at(-1),old=samples.find(s=>recent.time-s.time<=115&&s!==recent)??samples[0];
      const elapsed=recent.time-old.time;
      if(elapsed>0)coast((recent.x-old.x)/Math.max(16,elapsed));
    }
  }
  listens(viewport,'pointerup',e=>finishPointer(e,true));
  listens(viewport,'pointercancel',e=>finishPointer(e));
  // On touch, capture transfers from the tapped slat to the viewport when a
  // drag begins. Its bubbling lostpointercapture is not the end of the drag.
  listens(viewport,'lostpointercapture',e=>{if(e.target===viewport)finishPointer(e);});
  listens(viewport,'pointerleave',e=>{if(!moved)finishPointer(e);});
  listens(viewport,'click',e=>{
    if(e.detail!==0&&performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}
  },{capture:true});
  listens(viewport,'wheel', e => {
    if (e.ctrlKey || viewport.scrollWidth <= viewport.clientWidth) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewport.clientWidth : 1;
    const max = viewport.scrollWidth - viewport.clientWidth;
    if ((delta > 0 && viewport.scrollLeft < max-1) || (delta < 0 && viewport.scrollLeft > 0)) {
      e.preventDefault();
      // A horizontal trackpad already sends real momentum. Don't add a second coast.
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){stopMotion();setScroll(viewport.scrollLeft+delta*scale);}
      else easeTo((scrollMode==='ease'?target:viewport.scrollLeft)+delta*scale);
    }
  },{passive:false});
  function scrollBy(direction) {
    easeTo((scrollMode==='ease'?target:viewport.scrollLeft)+direction*viewport.clientWidth*.72);
  }
  listens(viewport,'keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      scrollBy(e.key === 'ArrowRight' ? 1 : -1);
    }
  });
  function select(i, reveal = false) {
    if (!buttons[i] || buttons[i].disabled) return false;
    buttons.forEach((b,j) => b.setAttribute('aria-pressed',String(i === j)));
    if (reveal) {
      const at=buttons[i].offsetLeft+buttons[i].offsetWidth/2-viewport.clientWidth/2;
      easeTo(at);
    }
    return true;
  }
  function destroy(){
    stopMotion();cancelAnimationFrame(liftFrame);
    selectionObserver.disconnect();sizeObserver.disconnect();
    controller.abort();
    if(pointer!==null&&viewport.hasPointerCapture(pointer))viewport.releasePointerCapture(pointer);
    pointer=null;viewport.classList.remove('is-dragging','bamboo-levels-r3');
    if(track.parentElement===viewport)track.remove();
  }
  return {select,scrollBy,buttons,stopMotion,destroy};
}

/**
 * The laid and wound sections are a single, inextensible centerline.
 * Every vertex is attached to the same material-coordinate index throughout
 * unrolling. A slat that crosses the tangent is still one slat.
 */
export function buildBambooGeometry(width, height, value) {
  const progress = clamp(value);
  const w = Math.max(1,width), h = Math.max(1,height);
  // One radial turn is one bamboo thickness. Keep the entire roll in view.
  const thickness = Math.min(clamp(w/85,5.2,11.4), Math.max(1,Math.PI*(h*.39)**2/Math.max(1,w-20)/1.14));
  const k = thickness*1.075/(2*Math.PI);
  const core = thickness*1.32;
  const radiusLimit = Math.sqrt(core*core + 2*k*Math.max(0,w-16)) + thickness;
  const left = Math.min(radiusLimit+8,w*.42);
  const right = Math.max(left,w-10);
  const length = right-left;
  const baseline = h-19-thickness/2;
  const count = Math.max(2,Math.round(length/(thickness*1.75)));
  const slatLength = length/count;
  const laid = progress*length;
  const remaining = length-laid;
  const joinX = left+laid;

  // Exact arc length for r = core + k*theta, inverted with Newton iteration.
  const primitive = r => (r*Math.hypot(r,k)+k*k*Math.asinh(r/k))/(2*k);
  const offset = primitive(core);
  function radiusAt(s) {
    let r = Math.sqrt(core*core+2*k*Math.max(0,s));
    for (let i=0;i<4;i++) r = Math.max(core,r-(primitive(r)-offset-s)*k/Math.hypot(r,k));
    return r;
  }
  function polarAt(s) {
    const r=radiusAt(s), theta=(r-core)/k;
    const c=Math.cos(theta), sn=Math.sin(theta);
    return {x:r*c,y:r*sn,dx:k*c-r*sn,dy:k*sn+r*c};
  }
  const outer=polarAt(remaining);
  // Orient the inward tangent to +x; positive canvas y points down.
  // The tail is tangent to the flat sheet, so no detached sprite or cap.
  const magnitude=Math.hypot(outer.dx,outer.dy);
  const cos=-outer.dx/magnitude, sin=outer.dy/magnitude;
  function pointAt(s) {
    if (s<=laid || remaining<=1e-8) return {x:left+s,y:baseline,tx:1,ty:0};
    const p=polarAt(length-s);
    const dx=p.x-outer.x,dy=p.y-outer.y;
    const v=Math.hypot(p.dx,p.dy);
    const tx=-p.dx/v,ty=-p.dy/v;
    return {
      x:joinX+cos*dx-sin*dy, y:baseline+sin*dx+cos*dy,
      tx:cos*tx-sin*ty,ty:sin*tx+cos*ty
    };
  }
  // Neighbors share exactly the same joint corners (not two overlapping or
  // disjoint rectangles). This keeps the tied slats connected at the bend.
  const joints=Array.from({length:count+1},(_,i)=>{
    const p=pointAt(i===count?length:i*slatLength);
    const nx=-p.ty*thickness/2,ny=p.tx*thickness/2;
    return {...p,top:{x:p.x-nx,y:p.y-ny},bottom:{x:p.x+nx,y:p.y+ny}};
  });
  return {joints,thickness,count,length,slatLength,laid,joinX,left,right,baseline};
}

/** Draw one continuous bamboo manuscript unrolling from left to right.
 * External loader calls setProgress(0..1). No simulated completion is inherent.
 */
export async function createBambooLoader(canvas) {
  const load = src => new Promise((resolve,reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageURL(src);
  });
  // The isolated roll PNG remains available as a static art asset, but the
  // animation uses the same bamboo texture on every slat of the physical chain.
  const slip = await load('bamboo-slip.png');
  const ctx = canvas.getContext('2d');
  canvas.classList.add('bamboo-loading-canvas');
  canvas.setAttribute('role','img');
  let progress = 0;
  function draw() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const w = rect.width, h = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = Math.round(w*dpr), H = Math.round(h*dpr);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W; canvas.height = H;
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const {joints,thickness:thick,count,left,right,baseline} = buildBambooGeometry(w,h,progress);
    const ground=baseline+thick/2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#b8a88c80';
    ctx.setLineDash([2,5]);
    ctx.beginPath(); ctx.moveTo(left,ground+.5); ctx.lineTo(right,ground+.5); ctx.stroke();
    ctx.setLineDash([]);
    // A solid connected backing follows both sides of the complete chain.
    // It prevents transparent subpixel cracks where rasterized slats meet.
    ctx.beginPath();
    ctx.moveTo(joints[0].top.x,joints[0].top.y);
    for(const p of joints.slice(1)) ctx.lineTo(p.top.x,p.top.y);
    for(let i=count;i>=0;i--) ctx.lineTo(joints[i].bottom.x,joints[i].bottom.y);
    ctx.closePath();
    ctx.fillStyle='#94613a';
    ctx.fill();
    // Paint inner slats first, then the outer winding and the flat tail.
    for(let i=count-1;i>=0;i--) {
      const a=joints[i],b=joints[i+1];
      const chord=Math.hypot(b.x-a.x,b.y-a.y);
      const angle=Math.atan2(b.y-a.y,b.x-a.x);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(a.top.x,a.top.y);
      ctx.lineTo(b.top.x,b.top.y);
      ctx.lineTo(b.bottom.x,b.bottom.y);
      ctx.lineTo(a.bottom.x,a.bottom.y);
      ctx.closePath();
      ctx.fillStyle='#c39156';ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.translate((a.x+b.x)/2,(a.y+b.y)/2);
      ctx.rotate(angle);
      // Keep a consistent texture patch assigned to the slat for every frame.
      const span=chord+thick*2;
      ctx.drawImage(slip,8,410+(i*71)%530,167,85,-span/2,-thick*1.1,span,thick*2.2);
      const light=ctx.createLinearGradient(0,-thick*.65,0,thick*.65);
      light.addColorStop(0,'#fff0c36e');light.addColorStop(.28,'#fff0c30b');
      light.addColorStop(.68,'#4d2e1605');light.addColorStop(1,'#5939158f');
      ctx.fillStyle=light;ctx.fillRect(-span/2,-thick*1.1,span,thick*2.2);
      ctx.restore();
      // The dark seam is the binding between neighboring slats, never a
      // transparent slot. Its location moves with that exact same joint.
      ctx.strokeStyle='#694423d6';ctx.lineWidth=clamp(thick*.075,.45,.9);
      ctx.stroke();
      ctx.restore();
    }
    canvas.setAttribute('aria-label',`竹简加载进度 ${Math.round(progress*100)}%`);
  }
  function setProgress(value) {
    if (Number.isFinite(value)) progress = clamp(value);
    draw();
  }
  const observer = new ResizeObserver(draw);
  observer.observe(canvas);
  draw();
  return {setProgress, draw, destroy:()=>observer.disconnect(),get progress(){return progress;}};
}
