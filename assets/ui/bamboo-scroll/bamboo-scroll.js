const imageURL = (name) => new URL(name, import.meta.url).href;
const clamp = (v, lo=0, hi=1) => Math.max(lo, Math.min(hi,v));

/** One slat = one level. Pass actual names/locked state from your game. */
export function createLevelScroll(viewport, levels, onSelect = () => {}) {
  viewport.classList.add('bamboo-levels');
  viewport.tabIndex = 0;
  viewport.setAttribute('aria-label', '竹简选关，可左右滚动');
  const track = document.createElement('div');
  track.className = 'bamboo-level-track';
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
    button.addEventListener('click', () => {
      if (suppressClick) return;
      select(i);
      onSelect(level,i);
    });
    track.append(button);
    return button;
  });
  viewport.replaceChildren(track);
  let pointer = null, moved = false, suppressClick = false;
  let startX = 0, startScroll = 0;
  viewport.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    pointer = e.pointerId; moved = false; suppressClick = false;
    startX = e.clientX; startScroll = viewport.scrollLeft;
  });
  viewport.addEventListener('pointermove', e => {
    if (pointer !== e.pointerId) return;
    if (!moved && Math.abs(e.clientX - startX) > 5) {
      moved = true;
      viewport.setPointerCapture(pointer);
      viewport.classList.add('is-dragging');
    }
    if (moved) viewport.scrollLeft = startScroll - (e.clientX - startX);
  });
  function finishPointer(e) {
    if (e.pointerId !== pointer) return;
    suppressClick = moved;
    pointer = null;
    viewport.classList.remove('is-dragging');
    if (suppressClick) setTimeout(() => { suppressClick = false; },0);
  }
  viewport.addEventListener('pointerup',finishPointer);
  viewport.addEventListener('pointercancel',finishPointer);
  viewport.addEventListener('lostpointercapture',finishPointer);
  viewport.addEventListener('pointerleave', e => { if (!moved) finishPointer(e); });
  viewport.addEventListener('wheel', e => {
    if (e.ctrlKey || viewport.scrollWidth <= viewport.clientWidth) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewport.clientWidth : 1;
    const max = viewport.scrollWidth - viewport.clientWidth;
    if ((delta > 0 && viewport.scrollLeft < max-1) || (delta < 0 && viewport.scrollLeft > 0)) {
      e.preventDefault();
      viewport.scrollLeft += delta * scale;
    }
  },{passive:false});
  function scrollBy(direction) {
    viewport.scrollBy({left:direction * viewport.clientWidth * .72,behavior:'smooth'});
  }
  viewport.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      scrollBy(e.key === 'ArrowRight' ? 1 : -1);
    }
  });
  function select(i, reveal = false) {
    if (!buttons[i] || buttons[i].disabled) return false;
    buttons.forEach((b,j) => b.setAttribute('aria-pressed',String(i === j)));
    if (reveal) buttons[i].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    return true;
  }
  return {select,scrollBy,buttons};
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
