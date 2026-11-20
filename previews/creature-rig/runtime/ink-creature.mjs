/** Canvas 2D ink puppet runtime. Coordinates/input are CSS pixels, seconds and radians. */
import {WebGLMeshSurface} from './mesh-webgl.mjs';
const TAU = Math.PI * 2;
const RESOURCE_CACHE=new Map();
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
export const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));

function smoothPolyline(points) {
  const out=[];
  for(let i=0;i<points.length-1;i++) {
    const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
    for(let j=0;j<12;j++) { const t=j/12,t2=t*t,t3=t2*t;
      out.push([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));
    }
  }
  out.push([...points.at(-1)]);return out;
}
export function makeCurve(points, smooth=true) {
  const p=smooth?smoothPolyline(points):points.map(p=>[...p]);
  const lengths=[0];
  for(let i=1;i<p.length;i++) lengths.push(lengths.at(-1)+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));
  if(lengths.at(-1)<1e-5) throw Error('Spine needs distinct points');
  return {points:p,lengths,length:lengths.at(-1)};
}
export function sampleCurve(curve,s) {
  const {points:p,lengths:l,length:L}=curve; const distance=s*L;
  let i=0;
  if(distance>=L) i=p.length-2;
  else if(distance>0) {let lo=0,hi=l.length-1;while(hi-lo>1){let m=(lo+hi)>>1;if(l[m]<=distance)lo=m;else hi=m;}i=lo;}
  const dx=p[i+1][0]-p[i][0],dy=p[i+1][1]-p[i][1],len=Math.hypot(dx,dy)||1;
  const t=(distance-l[i])/len;
  return {x:p[i][0]+dx*t,y:p[i][1]+dy*t,tx:dx/len,ty:dy/len};
}
export function projectPoint(curve,x,y) {
  let best=Infinity,result;const p=curve.points,l=curve.lengths;
  for(let i=0;i<p.length-1;i++) {
    const dx=p[i+1][0]-p[i][0],dy=p[i+1][1]-p[i][1],len2=dx*dx+dy*dy;if(len2<1e-8)continue;
    let t=((x-p[i][0])*dx+(y-p[i][1])*dy)/len2;
    // Endpoints are rays: a nose/tail tip can extend far beyond a tiny smoothed end segment.
    t=clamp(t,i===0?-Infinity:0,i===p.length-2?Infinity:1);
    const px=p[i][0]+t*dx,py=p[i][1]+t*dy,dist=(x-px)**2+(y-py)**2;
    if(dist<best){best=dist;const len=Math.sqrt(len2);result={s:(l[i]+t*len)/curve.length,t:((x-px)*(-dy/len)+(y-py)*(dx/len))/curve.length};}
  }
  return result;
}

const PROFILES={
  fish:{amplitude:.42,idle:.07,hz:2.0,waves:1.1,delay:.28,turn:6,appendage:.26},
  dragon:{amplitude:.63,idle:.11,hz:1.15,waves:1.35,delay:.85,turn:4,appendage:.13},
  shrimp:{amplitude:.035,idle:.012,hz:.9,waves:.7,delay:.16,turn:5,appendage:.09},
  turtle:{amplitude:0,idle:0,hz:.6,waves:0,delay:0,turn:3,appendage:.39}
};
const getCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
async function imageAt(url) {
  const img=new Image();img.src=url;await img.decode();return img;
}
function readBounds(data,w,h) {
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>2){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  return x1<0?null:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
}
function textureTriangle(ctx,image,a,b,c,A,B,C) {
  const det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);if(Math.abs(det)<1e-8)return;
  const m11=((B.x-A.x)*(c.y-a.y)-(C.x-A.x)*(b.y-a.y))/det;
  const m21=((C.x-A.x)*(b.x-a.x)-(B.x-A.x)*(c.x-a.x))/det;
  const m12=((B.y-A.y)*(c.y-a.y)-(C.y-A.y)*(b.y-a.y))/det;
  const m22=((C.y-A.y)*(b.x-a.x)-(B.y-A.y)*(c.x-a.x))/det;
  const cx=(A.x+B.x+C.x)/3,cy=(A.y+B.y+C.y)/3;
  const expand=p=>{const dx=p.x-cx,dy=p.y-cy,l=Math.hypot(dx,dy)||1;return{x:p.x+dx/l*.65,y:p.y+dy/l*.65};};
  const P=expand(A),Q=expand(B),R=expand(C);
  ctx.save();ctx.beginPath();ctx.moveTo(P.x,P.y);ctx.lineTo(Q.x,Q.y);ctx.lineTo(R.x,R.y);ctx.closePath();ctx.clip();
  ctx.transform(m11,m12,m21,m22,A.x-m11*a.x-m21*a.y,A.y-m12*a.x-m22*a.y);ctx.drawImage(image,0,0);ctx.restore();
}

export class InkCreature {
  static async load(rigURL,options={}) {
    const url=new URL(rigURL,globalThis.location?.href||'http://localhost/');
    const response=await fetch(url);if(!response.ok)throw Error(`Cannot load ${url}: ${response.status}`);
    const rig=await response.json();const instance=new InkCreature(rig,options);
    let entry=RESOURCE_CACHE.get(url.href);
    if(!entry) {
      entry={refs:0,key:url.href};
      entry.promise=instance.loadImages(url).then(()=>Object.fromEntries(['bodyImage','bodyOrder','bodyBounds','layers','sourceImage','mesh'].map(k=>[k,instance[k]])));
      RESOURCE_CACHE.set(url.href,entry);
    }
    entry.refs++;
    try {Object.assign(instance,await entry.promise);instance.resourceEntry=entry;return instance;}
    catch(error){entry.refs--;RESOURCE_CACHE.delete(url.href);throw error;}
  }
  constructor(rig,{x=0,y=0,length=380,speed=110}={}) {
    if(!Array.isArray(rig.spine)||rig.spine.length<2)throw Error('Invalid rig spine');
    this.rig=rig;this.id=rig.id;this.species=rig.id.split('_')[0];this.profile=PROFILES[this.species];
    if(!this.profile)throw Error('Unknown creature profile');
    this.sourceCurve=makeCurve(rig.spine);this.length=length;this.maxSpeed=speed;this.x=x;this.y=y;
    this.heading=-Math.PI/2;this.vx=0;this.vy=0;this.input={x:0,y:0};this.time=0;this.drive=0;
    this.mode='manual';this.history=[{t:-10,a:this.heading},{t:0,a:this.heading}];this.layers=[];this.offsets=new Map();
    this.pose=this.buildPose();this.targetCurve=makeCurve(this.pose,false);this.disposed=false;
  }
  async loadImages(url) {
    const [w,h]=this.rig.sourceSize;const scratch=getCanvas(w,h),sc=scratch.getContext('2d',{willReadFrequently:true});
    const body=getCanvas(w,h),bc=body.getContext('2d');let bodyOrder=Infinity;
    for(const layer of [...this.rig.layers].sort((a,b)=>(a.order??0)-(b.order??0))) {
      const cropped=!!layer.croppedFile&&Array.isArray(layer.bbox);
      const img=await imageAt(new URL(cropped?layer.croppedFile:layer.file,url));
      if(!cropped&&(img.naturalWidth!==w||img.naturalHeight!==h))throw Error(`Layer canvas mismatch: ${layer.file}`);
      if(cropped&&(img.naturalWidth!==layer.bbox[2]||img.naturalHeight!==layer.bbox[3]))throw Error(`Cropped layer mismatch: ${layer.croppedFile}`);
      const ox=cropped?layer.bbox[0]:0,oy=cropped?layer.bbox[1]:0;
      sc.clearRect(0,0,w,h);sc.drawImage(img,ox,oy);
      const bounds=readBounds(sc.getImageData(0,0,w,h).data,w,h);if(!bounds)continue;
      const mesh=layer.kind==='body'||['head','tail'].includes(layer.kind)&&this.species!=='turtle';
      if(mesh) {bc.drawImage(img,ox,oy);bodyOrder=Math.min(bodyOrder,layer.order??0);}
      else {
        const crop=getCanvas(bounds.w,bounds.h);crop.getContext('2d').drawImage(img,bounds.x-ox,bounds.y-oy,bounds.w,bounds.h,0,0,bounds.w,bounds.h);
        const pivot=layer.pivot||[w/2,h/2];
        this.layers.push({...layer,image:crop,bounds,pivot,anchor:projectPoint(this.sourceCurve,...pivot)});
      }
    }
    this.bodyImage=body;this.bodyOrder=bodyOrder;this.layers.sort((a,b)=>(a.order??0)-(b.order??0));
    this.sourceImage=await imageAt(new URL(this.rig.sourceFile||this.rig.source||'source.png',url));
    const bodyPixels=bc.getImageData(0,0,w,h).data;this.bodyBounds=readBounds(bodyPixels,w,h);
    this.buildMesh(bodyPixels,w,h);scratch.width=1;scratch.height=1;
  }
  buildMesh(alpha,w,h) {
    const cell=Math.max(w,h)/42,nx=Math.ceil(w/cell),ny=Math.ceil(h/cell),vertices=[],triangles=[];
    for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++) {const px=x*w/nx,py=y*h/ny;vertices.push({x:px,y:py,...projectPoint(this.sourceCurve,px,py)});}
    const occupied=new Uint8Array(nx*ny);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(alpha[(y*w+x)*4+3]>2)occupied[Math.min(ny-1,Math.floor(y/h*ny))*nx+Math.min(nx-1,Math.floor(x/w*nx))]=1;
    for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)if(occupied[y*nx+x]) {const a=y*(nx+1)+x,b=a+1,c=a+nx+1,d=c+1;triangles.push([a,b,d],[a,d,c]);}
    this.mesh={vertices,triangles,activeIndices:[...new Set(triangles.flat())]};
  }
  setInput(x,y) {x=Number.isFinite(x)?x:0;y=Number.isFinite(y)?y:0;const mag=Math.hypot(x,y);this.input={x:x/Math.max(1,mag),y:y/Math.max(1,mag)};return this;}
  setLayerOffset(name,{rotation=0,opacity=1}={}) {this.offsets.set(name,{rotation,opacity:clamp(opacity,0,1)});return this;}
  setMode(mode) {if(!['manual','auto','idle','straight','rest'].includes(mode))throw Error('Unknown mode');this.mode=mode;return this;}
  reset(x=this.x,y=this.y,heading=-Math.PI/2) {this.x=x;this.y=y;this.heading=heading;this.vx=0;this.vy=0;this.drive=0;this.history=[{t:this.time-10,a:heading},{t:this.time,a:heading}];this.pose=this.buildPose();this.targetCurve=makeCurve(this.pose,false);return this;}
  angleAt(t) {const h=this.history;for(let i=h.length-1;i>0;i--)if(h[i-1].t<=t){const f=clamp((t-h[i-1].t)/(h[i].t-h[i-1].t||1),0,1);return h[i-1].a+wrapAngle(h[i].a-h[i-1].a)*f;}return h[0].a;}
  buildPose() {
    const p=this.profile,N=48,points=[[this.x,this.y]],straight=this.mode==='straight';
    const amp=straight?0:p.idle+(p.amplitude-p.idle)*this.drive;
    for(let i=1;i<=N;i++) {const s=(i-.5)/N;
      const flexible=clamp((s-.15)/.85,0,1);
      const wave=amp*flexible*Math.sin(this.time*TAU*p.hz*(.25+.75*this.drive)-s*TAU*p.waves);
      const angle=(straight?this.heading:this.angleAt(this.time-flexible*p.delay))+Math.PI+wave;
      points.push([points.at(-1)[0]+Math.cos(angle)*this.length/N,points.at(-1)[1]+Math.sin(angle)*this.length/N]);
    }
    return points;
  }
  update(dt) {
    if(this.disposed)return;dt=clamp(Number.isFinite(dt)?dt:0,0,.1);this.time+=dt;
    let ix=this.input.x,iy=this.input.y;
    if(['idle','straight','rest'].includes(this.mode))ix=iy=0;
    const mag=Math.min(1,Math.hypot(ix,iy));
    if(mag>.02) {const target=Math.atan2(iy,ix);this.heading+=wrapAngle(target-this.heading)*(1-Math.exp(-this.profile.turn*dt));this.heading=wrapAngle(this.heading);}
    const desiredSpeed=mag*this.maxSpeed;
    this.vx=damp(this.vx,Math.cos(this.heading)*desiredSpeed,5,dt);this.vy=damp(this.vy,Math.sin(this.heading)*desiredSpeed,5,dt);
    this.x+=this.vx*dt;this.y+=this.vy*dt;this.drive=damp(this.drive,mag,5,dt);
    this.history.push({t:this.time,a:this.heading});while(this.history.length>2&&this.history[1].t<this.time-3)this.history.shift();
    this.pose=this.buildPose();this.targetCurve=makeCurve(this.pose,false);
  }
  mapPoint(s,t) {const p=sampleCurve(this.targetCurve,s);return{x:p.x-p.ty*t*this.length,y:p.y+p.tx*t*this.length};}
  layerMotion(layer) {
    if(this.mode==='straight'||this.mode==='rest')return 0;
    const {kind,side=1,phase=0}=layer;const t=this.time;
    if(kind==='head')return this.species==='turtle'?.025*Math.sin(t*1.3):.012*Math.sin(t);
    if(kind==='antenna')return (.025+.04*this.drive)*Math.sin(t*1.5+phase)*side;
    if(kind==='leg')return this.profile.appendage*(.12+.88*this.drive)*Math.sin(t*(this.species==='turtle'?3:2.5)+phase)*side;
    if(kind==='fin')return (.045+this.profile.appendage*this.drive)*Math.sin(t*(2+this.drive*6)+phase)*side;
    if(kind==='tail')return .08*(.2+this.drive)*Math.sin(t*2+phase);
    return .025*Math.sin(t*1.7+phase)*side;
  }
  drawLayer(ctx,layer) {
    const anchor=this.mapPoint(layer.anchor.s,layer.anchor.t),src=sampleCurve(this.sourceCurve,layer.anchor.s),dst=sampleCurve(this.targetCurve,layer.anchor.s);
    const tweak=this.offsets.get(layer.name)||{};
    const rotation=Math.atan2(dst.ty,dst.tx)-Math.atan2(src.ty,src.tx)+this.layerMotion(layer)+(tweak.rotation||0);
    ctx.save();ctx.globalAlpha*=tweak.opacity??1;ctx.translate(anchor.x,anchor.y);ctx.rotate(rotation);ctx.scale(this.length/this.sourceCurve.length,this.length/this.sourceCurve.length);
    ctx.drawImage(layer.image,layer.bounds.x-layer.pivot[0],layer.bounds.y-layer.pivot[1]);ctx.restore();
  }
  draw(ctx,{debug=false}={}) {
    if(this.disposed||!this.bodyImage)return;
    if(this.mode==='rest'){this.drawSource(ctx);if(debug)this.drawDebug(ctx);return;}
    const before=this.layers.filter(l=>(l.order??0)<this.bodyOrder),after=this.layers.filter(l=>(l.order??0)>=this.bodyOrder);
    before.forEach(l=>this.drawLayer(ctx,l));
    if(this.species==='turtle') {
      const src=sampleCurve(this.sourceCurve,0),target=sampleCurve(this.targetCurve,0);
      ctx.save();ctx.translate(target.x,target.y);ctx.rotate(Math.atan2(target.ty,target.tx)-Math.atan2(src.ty,src.tx));ctx.scale(this.length/this.sourceCurve.length,this.length/this.sourceCurve.length);ctx.drawImage(this.bodyImage,-src.x,-src.y);ctx.restore();
    } else {
      const mapped=this.mesh.vertices.map(v=>this.mapPoint(v.s,v.t));
      if(this.gpuSurface===undefined){try{this.gpuSurface=new WebGLMeshSurface(this.bodyImage,this.mesh);}catch(error){this.gpuSurface=null;console.warn('WebGL unavailable, using Canvas mesh fallback:',error.message);}}
      let rendered=false;
      if(this.gpuSurface){try{this.gpuSurface.drawTo(ctx,mapped);rendered=true;}catch(error){this.gpuSurface.dispose();this.gpuSurface=null;console.warn('WebGL mesh unavailable, using Canvas fallback:',error.message);}}
      if(!rendered)this.drawCanvasMesh(ctx,mapped);
    }
    after.forEach(l=>this.drawLayer(ctx,l));if(debug)this.drawDebug(ctx);
  }
  drawCanvasMesh(ctx,mapped) {
      const width=ctx.canvas.width,height=ctx.canvas.height;
      if(!this.meshSurface)this.meshSurface=getCanvas(width,height);
      if(this.meshSurface.width!==width||this.meshSurface.height!==height){this.meshSurface.width=width;this.meshSurface.height=height;}
      const mc=this.meshSurface.getContext('2d');
      mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,width,height);mc.setTransform(ctx.getTransform());
      // Shared translucent ink edges must replace, never accumulate on triangle overlap.
      mc.globalCompositeOperation='copy';mc.imageSmoothingEnabled=true;
      for(const [a,b,c] of this.mesh.triangles)textureTriangle(mc,this.bodyImage,this.mesh.vertices[a],this.mesh.vertices[b],this.mesh.vertices[c],mapped[a],mapped[b],mapped[c]);
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(this.meshSurface,0,0);ctx.restore();
  }
  drawSource(ctx) {
    const src=sampleCurve(this.sourceCurve,0),fwd=Math.atan2(src.ty,src.tx)+Math.PI;
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.heading-fwd);ctx.scale(this.length/this.sourceCurve.length,this.length/this.sourceCurve.length);ctx.drawImage(this.sourceImage,-src.x,-src.y);ctx.restore();
  }
  visualBounds() {
    const points=[],scale=this.length/this.sourceCurve.length;
    const addRigid=(bounds,pivot,anchor,angle)=>{const c=Math.cos(angle),s=Math.sin(angle);for(const [x,y] of [[bounds.x,bounds.y],[bounds.x+bounds.w,bounds.y],[bounds.x+bounds.w,bounds.y+bounds.h],[bounds.x,bounds.y+bounds.h]]){const dx=(x-pivot[0])*scale,dy=(y-pivot[1])*scale;points.push({x:anchor.x+c*dx-s*dy,y:anchor.y+s*dx+c*dy});}};
    if(this.mode==='rest') {
      const src=sampleCurve(this.sourceCurve,0);addRigid({x:0,y:0,w:this.rig.sourceSize[0],h:this.rig.sourceSize[1]},[src.x,src.y],{x:this.x,y:this.y},this.heading-Math.atan2(src.ty,src.tx)-Math.PI);
    } else {
      if(this.species==='turtle') {const src=sampleCurve(this.sourceCurve,0),dst=sampleCurve(this.targetCurve,0);addRigid(this.bodyBounds,[src.x,src.y],dst,Math.atan2(dst.ty,dst.tx)-Math.atan2(src.ty,src.tx));}
      else for(const i of this.mesh.activeIndices){const v=this.mesh.vertices[i];points.push(this.mapPoint(v.s,v.t));}
      for(const layer of this.layers){const a=this.mapPoint(layer.anchor.s,layer.anchor.t),src=sampleCurve(this.sourceCurve,layer.anchor.s),dst=sampleCurve(this.targetCurve,layer.anchor.s);addRigid(layer.bounds,layer.pivot,a,Math.atan2(dst.ty,dst.tx)-Math.atan2(src.ty,src.tx)+this.layerMotion(layer)+(this.offsets.get(layer.name)?.rotation||0));}
    }
    return {minX:Math.min(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxX:Math.max(...points.map(p=>p.x)),maxY:Math.max(...points.map(p=>p.y))};
  }
  drawDebug(ctx) {
    ctx.save();ctx.lineWidth=1.5;ctx.strokeStyle='#a7482c';ctx.fillStyle='#a7482c';ctx.beginPath();this.pose.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    this.pose.forEach(([x,y],i)=>{if(i%4===0){ctx.beginPath();ctx.arc(x,y,3,0,TAU);ctx.fill();}});ctx.restore();
  }
  snapshot() {return{id:this.id,position:{x:this.x,y:this.y},heading:this.heading,speed:Math.hypot(this.vx,this.vy),drive:this.drive,mode:this.mode,spine:this.pose.map(([x,y])=>({x,y})),loaded:!!this.bodyImage,triangles:this.mesh?.triangles.length||0,renderer:this.species==='turtle'?'canvas-rigid':this.gpuSurface?'webgl-mesh':'canvas-fallback'};}
  dispose() {
    if(this.disposed)return;this.disposed=true;
    this.gpuSurface?.dispose();this.gpuSurface=null;
    const entry=this.resourceEntry;
    if(entry&&--entry.refs===0){RESOURCE_CACHE.delete(entry.key);for(const l of this.layers){l.image.width=1;l.image.height=1;}if(this.bodyImage){this.bodyImage.width=1;this.bodyImage.height=1;}}
    this.layers=[];this.sourceImage=null;this.bodyImage=null;this.mesh=null;this.history=[];
    if(this.meshSurface){this.meshSurface.width=1;this.meshSurface.height=1;this.meshSurface=null;}
  }
}
