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

/** Draw a cross-sectional bamboo manuscript unrolling from left to right.
 * External loader calls setProgress(0..1). No simulated completion is inherent.
 */
export async function createBambooLoader(canvas) {
  const load = src => new Promise((resolve,reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageURL(src);
  });
  const [roll,slip] = await Promise.all([
    load('bamboo-roll-cross-section.png'),load('bamboo-slip.png')
  ]);
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
    const thick = clamp(w / 58,7,14);
    const radius = Math.min(Math.sqrt((w-30)*thick/Math.PI),h*.39,w*.23);
    const left = radius + 6, right = w - 8;
    const length = Math.max(0,right-left), baseline = h-22;
    const end = left + progress*length;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#b8a88c80';
    ctx.setLineDash([2,5]);
    ctx.beginPath(); ctx.moveTo(left,baseline+.5); ctx.lineTo(right,baseline+.5); ctx.stroke();
    ctx.setLineDash([]);
    // The laid slats keep a constant physical size as the remaining bundle shrinks.
    const tile = thick * 2.1;
    ctx.save();
    ctx.beginPath(); ctx.rect(left,baseline-thick-2,Math.max(0,end-left),thick+3); ctx.clip();
    for (let x = left; x < end; x+=tile) {
      ctx.drawImage(slip,8,610,167,85,x,baseline-thick,tile-1,thick);
      ctx.strokeStyle = '#694723b0'; ctx.lineWidth = .7;
      ctx.strokeRect(x+.4,baseline-thick+.4,tile-1.8,thick-.8);
      ctx.fillStyle = '#f3ce8a6b';
      ctx.fillRect(x+1,baseline-thick+1,tile-3,1.2);
    }
    ctx.restore();
    // Radius follows remaining wound area rather than resizing the whole texture.
    // The inner annuli keep their size. Outer layers disappear as the roll moves.
    if (progress < 1) {
      const remainingRoot = Math.sqrt(1-progress);
      const r = radius * remainingRoot;
      if (r > .75) {
        ctx.save();
        ctx.translate(end,baseline-thick-r);
        ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.clip();
        ctx.rotate((2*length/Math.max(radius,1))*(1-remainingRoot));
        ctx.drawImage(roll,-radius,-radius,radius*2,radius*2);
        ctx.restore();
        ctx.strokeStyle = '#795331a8'; ctx.lineWidth = Math.min(1.4,r*.25);
        ctx.beginPath(); ctx.arc(end,baseline-thick-r,r-.4,0,Math.PI*2); ctx.stroke();
      }
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
