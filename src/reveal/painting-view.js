// Geometry stays independent of Canvas/DOM so aspect ratios and touch anchors are testable.
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export class PaintingGeometry{
 constructor(imageWidth,imageHeight){this.imageWidth=imageWidth;this.imageHeight=imageHeight;this.scale=1;this.x=0;this.y=0;}
 resize(width,height,barHeight=76,preserve=false){
  const previous=this.bounds,oldFit=this.fitScale,oldScale=this.scale;
  const focus=previous?{x:(previous.x+previous.width/2-this.x)/oldScale,y:(previous.y+previous.height/2-this.y)/oldScale}:null;
  this.width=Math.max(1,width);this.height=Math.max(1,height);const margin=Math.min(28,Math.max(12,Math.min(width,height)*.025));
  this.bounds={x:margin,y:margin,width:Math.max(1,width-margin*2),height:Math.max(1,height-barHeight-margin*2)};
  this.fitScale=Math.min(this.bounds.width/this.imageWidth,this.bounds.height/this.imageHeight);
  this.min=this.fitScale;this.max=this.fitScale*8;
  if(preserve&&focus){this.scale=clamp(oldScale/oldFit*this.fitScale,this.min,this.max);this.x=this.bounds.x+this.bounds.width/2-focus.x*this.scale;this.y=this.bounds.y+this.bounds.height/2-focus.y*this.scale;this.constrain();}
  else this.reset();return this;
 }
 fitted(){const b=this.bounds,s=this.fitScale;return {scale:s,x:b.x+(b.width-this.imageWidth*s)/2,y:b.y+(b.height-this.imageHeight*s)/2};}
 reset(){Object.assign(this,this.fitted());return this;}
 fromCamera(camera,world,viewport={width:this.width,height:this.height}){
  // The source is the gameplay viewport, not a previously measured hidden viewer.
  const sx=this.width/Math.max(1,viewport.width),sy=this.height/Math.max(1,viewport.height),screenScale=Math.min(sx,sy);
  this.scale=camera.scale*world.width/this.imageWidth*screenScale;
  this.x=-camera.x*camera.scale*screenScale+(this.width-viewport.width*screenScale)/2;
  this.y=-camera.y*camera.scale*screenScale+(this.height-viewport.height*screenScale)/2;return this;
 }
 constrain(){const b=this.bounds,iw=this.imageWidth*this.scale,ih=this.imageHeight*this.scale;
  this.x=iw<=b.width?b.x+(b.width-iw)/2:clamp(this.x,b.x+b.width-iw,b.x);
  this.y=ih<=b.height?b.y+(b.height-ih)/2:clamp(this.y,b.y+b.height-ih,b.y);return this;
 }
 transform(factor,oldCenter,newCenter=oldCenter){const next=clamp(this.scale*factor,this.min,this.max),ratio=next/this.scale;
  this.x=newCenter.x-(oldCenter.x-this.x)*ratio;this.y=newCenter.y-(oldCenter.y-this.y)*ratio;this.scale=next;return this.constrain();
 }
 pan(dx,dy){this.x+=dx;this.y+=dy;return this.constrain();}
 snapshot(){return {scale:this.scale,x:this.x,y:this.y,min:this.min,max:this.max,fitScale:this.fitScale,bounds:{...this.bounds},imageWidth:this.imageWidth,imageHeight:this.imageHeight};}
}
const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export class PaintingView{
 constructor(root,{onDone=()=>{},translate=key=>key,frameDuration=1300,flashDuration=650}={}){
  this.root=root;this.canvas=root.querySelector('canvas');this.ctx=this.canvas.getContext('2d');this.bar=root.querySelector('#paintingBar');
  this.done=root.querySelector('#paintingContinue');this.reset=root.querySelector('#paintingReset');this.hint=root.querySelector('#paintingHint');
  this.options={onDone,translate,frameDuration,flashDuration};this.phase='hidden';this.pointers=new Map();this.generation=0;this.flash=0;
  this.abort=new AbortController();const signal=this.abort.signal;
  root.addEventListener('wheel',e=>{if(this.phase!=='interactive')return;e.preventDefault();e.stopPropagation();const p=this.point(e),units=e.deltaMode===1?16:e.deltaMode===2?this.geometry.height:1;this.geometry.transform(Math.exp(clamp(-e.deltaY*units*.0015,-.65,.65)),p);this.paint();},{passive:false,signal});
  root.addEventListener('pointerdown',e=>{if(this.phase!=='interactive'||e.target.closest('button')||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();e.stopPropagation();this.pointers.set(e.pointerId,this.point(e));root.setPointerCapture?.(e.pointerId);root.classList.add('is-dragging');},{signal});
  root.addEventListener('pointermove',e=>{if(this.phase!=='interactive'||!this.pointers.has(e.pointerId))return;e.preventDefault();e.stopPropagation();
   const before=[...this.pointers.values()];this.pointers.set(e.pointerId,this.point(e));const after=[...this.pointers.values()];
   if(before.length>=2){const d=distance(before[0],before[1]);if(d>2)this.geometry.transform(distance(after[0],after[1])/d,midpoint(before[0],before[1]),midpoint(after[0],after[1]));}
   else this.geometry.pan(after[0].x-before[0].x,after[0].y-before[0].y);this.paint();},{signal});
  const release=e=>{this.pointers.delete(e.pointerId);if(!this.pointers.size)root.classList.remove('is-dragging');};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(name,release,{signal});
  this.reset.addEventListener('click',()=>{if(this.phase==='interactive'){this.geometry.reset();this.paint();}},{signal});
  this.done.addEventListener('click',()=>{if(this.phase!=='interactive')return;this.hide();this.options.onDone();},{signal});
  globalThis.addEventListener?.('resize',()=>{if(this.phase==='hidden')return;this.measure(true);this.paint();},{signal});
 }
 point(e){const r=this.root.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
 labels(){const t=this.options.translate;this.hint.textContent=t('paintingHint');this.done.textContent=t('paintingDone');this.reset.textContent=t('paintingReset');this.root.setAttribute('aria-label',t('paintingViewLabel'));}
 setPhase(phase){this.phase=phase;this.root.dataset.phase=phase;this.root.setAttribute('aria-busy',String(!['interactive','hidden'].includes(phase)));this.done.disabled=this.reset.disabled=phase!=='interactive';}
 measure(preserve=false){const r=this.root.getBoundingClientRect(),dpr=Math.min(2,globalThis.devicePixelRatio||1),w=Math.max(1,r.width),h=Math.max(1,r.height),barHeight=this.bar.getBoundingClientRect().height;
  this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.geometry.resize(w,h,barHeight,preserve);return this.geometry;
 }
 // Called only under the opaque start matte. No camera animation starts here.
 prepare(image,{camera=null,world={width:image.naturalWidth,height:image.naturalHeight},viewport=null}={}){
  this.generation++;this.pointers.clear();this.image=image;this.flash=0;this.labels();this.root.hidden=false;this.setPhase('prepared');
  this.geometry=new PaintingGeometry(image.naturalWidth,image.naturalHeight);this.measure();
  if(camera?.scale)this.geometry.fromCamera(camera,world,viewport||{width:this.geometry.width,height:this.geometry.height});this.paint();return this;
 }
 animate(duration,draw){const token=this.generation;return new Promise(resolve=>{let last=null,age=0;const tick=now=>{
   if(token!==this.generation){resolve(false);return;}if(last!==null&&!document.hidden)age+=Math.min(50,Math.max(0,now-last));last=now;
   const k=duration<=0?1:Math.min(1,age/duration);draw(k);this.paint();if(k>=1)resolve(true);else requestAnimationFrame(tick);
  };requestAnimationFrame(tick);});}
 // Called AFTER StartTransition.run resolves, ensuring matte -> framing -> flash -> input.
 async reveal(){if(this.phase!=='prepared')return false;this.setPhase('framing');const from=this.geometry.snapshot();
  const framed=await this.animate(this.options.frameDuration,k=>{const e=k*k*(3-2*k),target=this.geometry.fitted();for(const key of ['scale','x','y'])this.geometry[key]=from[key]+(target[key]-from[key])*e;});
  if(!framed)return false;this.geometry.reset();this.setPhase('flash');
  if(!await this.animate(this.options.flashDuration,k=>{this.flash=Math.sin(Math.PI*k)*.34;}))return false;
  this.flash=0;this.setPhase('interactive');this.paint();this.root.focus({preventScroll:true});return true;
 }
 paint(){if(!this.image||!this.geometry)return;const c=this.ctx,g=this.geometry;c.clearRect(0,0,g.width,g.height);c.fillStyle='#e7dfcc';c.fillRect(0,0,g.width,g.height);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(this.image,g.x,g.y,g.imageWidth*g.scale,g.imageHeight*g.scale);
  if(this.flash>0){c.fillStyle=`rgba(255,252,236,${this.flash})`;c.fillRect(g.x,g.y,g.imageWidth*g.scale,g.imageHeight*g.scale);}
 }
 hide(){this.generation++;this.pointers.clear();this.root.classList.remove('is-dragging');this.root.hidden=true;this.setPhase('hidden');}
 get state(){return {phase:this.phase,pointers:this.pointers.size,flash:this.flash,geometry:this.geometry?.snapshot()||null};}
 dispose(){this.hide();this.abort.abort();}
}
