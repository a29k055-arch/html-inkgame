/** Canvas renderer for the V6 pond. Coordinates and drawing radii come directly from the simulation. */
const TAU = Math.PI * 2;
const FORMS = ['fish', 'shrimp', 'turtle', 'dragon'];
const asset = name => new URL('./art/' + name + '.webp', import.meta.url).href;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function makeCanvas(width, height = width) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  return c;
}
function randomStream(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function idPhase(value) {
  const s = String(value ?? '0');
  let h = 17;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
  return h * 0.61803398875 % TAU;
}
function ellipse(c, x, y, rx, ry, rotation = 0) {
  c.beginPath();
  c.ellipse(x, y, Math.max(.001, rx), Math.max(.001, ry), rotation, 0, TAU);
}
function blob(c, x, y, rx, ry, phase, unevenness = .05) {
  c.beginPath();
  const count = 88;
  for (let i = 0; i <= count; i++) {
    const t = i / count * TAU;
    const n = 1 + unevenness * (.58*Math.sin(3*t+phase) + .36*Math.sin(7*t-phase) + .26*Math.sin(15*t+phase*2.1));
    const px = x + Math.cos(t)*rx*n, py = y + Math.sin(t)*ry*n;
    if (i) c.lineTo(px,py); else c.moveTo(px,py);
  }
  c.closePath();
}
function paperTile() {
  const tile = makeCanvas(220), c = tile.getContext('2d'), rand = randomStream(89);
  const pixels = c.createImageData(tile.width,tile.height);
  for (let i=0; i<pixels.data.length; i+=4) {
    const n = rand();
    pixels.data[i]=n>.45?255:65; pixels.data[i+1]=n>.45?251:63; pixels.data[i+2]=n>.45?236:49;
    pixels.data[i+3]=Math.floor(3+rand()*11);
  }
  c.putImageData(pixels,0,0);
  c.lineWidth=.5;
  for (let i=0; i<100; i++) {
    const x=rand()*220,y=rand()*220;
    c.strokeStyle=i%2?'rgba(92,77,51,.10)':'rgba(255,255,245,.46)';
    c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+3,y-1,x+3+rand()*13,y+rand()*2-1); c.stroke();
  }
  return tile;
}
// Complex brush grain is baked once; the halo, thorns and accretion brush rotate at runtime.
function inkStamp(kind) {
  const side=384, mid=side/2, c=makeCanvas(side).getContext('2d');
  const rad=kind==='spike'?124:kind==='hole'?119:141;
  const rand=randomStream(kind==='spike'?404:kind==='hole'?203:611);
  c.translate(mid,mid);
  for(let n=0;n<9;n++) {
    const r=rad*(1-n*.021);
    blob(c,(rand()-.5)*5,(rand()-.5)*5,r,r*(.98+rand()*.025),rand()*TAU,.052);
    c.fillStyle=n<3?'rgba(51,59,54,.24)':'rgba(19,27,26,.55)'; c.fill();
  }
  c.save();
  blob(c,0,0,rad*.99,rad*.99,2,.047); c.clip();
  const g=c.createRadialGradient(-rad*.4,-rad*.46,0,0,0,rad);
  if(kind==='ink'){
    g.addColorStop(0,'#798781');g.addColorStop(.32,'#3d4e49');g.addColorStop(.72,'#142b2b');g.addColorStop(1,'#091d1e');
  }else if(kind==='hole'){
    g.addColorStop(0,'#030908');g.addColorStop(.64,'#0a1413');g.addColorStop(1,'#374643');
  }else{
    g.addColorStop(0,'#636b62');g.addColorStop(.38,'#39443e');g.addColorStop(1,'#17201c');
  }
  c.fillStyle=g; c.fillRect(-rad,-rad,rad*2,rad*2);
  for(let i=0;i<3600;i++){
    const x=(rand()*2-1)*rad,y=(rand()*2-1)*rad;
    const light=rand()>.48;
    c.fillStyle=light?'rgba(229,226,199,'+(.04+rand()*.12)+')':'rgba(0,18,13,'+(.05+rand()*.10)+')';
    c.fillRect(x,y,.5+rand()*2,.45+rand()*1.2);
  }
  for(let i=0;i<66;i++){
    const a=rand()*TAU, r=rad*(.1+.83*rand());
    c.strokeStyle='rgba(212,215,190,'+(.025+rand()*.12)+')';c.lineWidth=.5+rand()*2.4;
    c.beginPath();c.arc(-rad*.018,rad*.04,r,a,a+.04+rand()*.6);c.stroke();
  }
  if(kind==='ink'){
    for(let i=0;i<4;i++){
      c.strokeStyle='rgba(228,238,219,'+(.38-i*.06)+')';c.lineWidth=rad*(.027-i*.003);
      c.beginPath();c.ellipse(-rad*.03,0,rad*(.79-i*.02),rad*(.80-i*.018),-.16,3.73+i*.06,4.52-i*.06);c.stroke();
    }
  }
  c.restore();
  if(kind==='spike'){
    for(let i=0;i<68;i++){
      const t=i/68*TAU+(rand()-.5)*.05,r=rad*(.85+rand()*.1),len=rad*(.065+rand()*.075);
      c.strokeStyle=i%4?'rgba(34,41,34,.80)':'rgba(94,99,81,.74)';c.lineWidth=1.2+rand()*3;
      c.beginPath();c.moveTo(Math.cos(t)*r,Math.sin(t)*r);c.lineTo(Math.cos(t+.025)*(r+len),Math.sin(t+.025)*(r+len));c.stroke();
    }
  }
  return {canvas:c.canvas, units:rad};
}
function accretionStamp(){
  const side=384,c=makeCanvas(side).getContext('2d'),rand=randomStream(933),r=136;
  c.translate(side/2,side/2);
  for(let i=0;i<85;i++){
    const rr=r*(.65+rand()*.37),a=rand()*TAU;
    c.strokeStyle=i%4===0?'rgba(246,240,211,.83)':i%3===0?'rgba(161,184,171,.7)':'rgba(55,68,58,.6)';
    c.lineWidth=.8+rand()*2.5;c.beginPath();c.ellipse(0,0,rr,rr*(.89+rand()*.07),-.28,a,a+.12+rand()*1.2);c.stroke();
  }
  return {canvas:c.canvas,units:r};
}
function drawStamp(c,stamp,x,y,r) {
  const w=stamp.canvas.width*r/stamp.units;
  c.drawImage(stamp.canvas,x-w/2,y-w/2,w,w);
}
function makeWater(world) {
  const side=1280,s=Math.min(side/world.width,side/world.height), w=Math.max(2,Math.round(world.width*s)),h=Math.max(2,Math.round(world.height*s));
  const canvas=makeCanvas(w,h),c=canvas.getContext('2d'), rand=randomStream(Math.round(world.width*13+world.height*53));
  const wash=c.createRadialGradient(w*.58,h*.45,w*.02,w*.53,h*.51,Math.max(w,h)*.67);
  wash.addColorStop(0,'#f2efdf');wash.addColorStop(.58,'#e7e8d9');wash.addColorStop(1,'#cfd8cb');
  c.fillStyle=wash;c.fillRect(0,0,w,h);
  for(let i=0;i<55;i++){
    const x=rand()*w,y=rand()*h,r=(.025+rand()*.105)*Math.max(w,h);
    c.save();c.translate(x,y);c.rotate((rand()-.5)*.8);c.scale(1,.34+rand()*.4);
    const g=c.createRadialGradient(0,0,0,0,0,r);
    g.addColorStop(0,i%4?'rgba(83,122,114,.085)':'rgba(255,251,213,.25)');g.addColorStop(1,'rgba(82,122,112,0)');
    c.fillStyle=g;c.fillRect(-r,-r,r*2,r*2);c.restore();
  }
  // Water bands belong to the landscape. Fine paper fibres are applied at screen density.
  for(let i=0;i<28;i++){
    const x=rand()*w,y=rand()*h,span=w*(.035+rand()*.075),bend=h*(.009+rand()*.018);
    c.save();c.translate(x,y);c.rotate((rand()-.5)*.24);
    for(let j=0;j<3;j++){
      const d=j*(2+rand()*2);
      c.strokeStyle=j%2?'rgba(252,251,231,.23)':'rgba(88,132,121,.11)';
      c.lineWidth=.65+rand()*.8;c.beginPath();c.moveTo(-span,d);
      c.bezierCurveTo(-span*.42,d+bend,span*.3,d-bend*.5,span*(1-j*.14),d+bend*.15);c.stroke();
    }
    c.restore();
  }
  // A brush mark continuous at its inner edge, with sparse dry bristles outside the water.
  return {canvas,w,h,scale:s};
}
function drawShore(c,w,h,z) {
  const weight=Math.max(1/z,2);
  c.save();c.strokeStyle='rgba(57,70,54,.56)';c.lineWidth=weight;
  c.strokeRect(0,0,w,h);
  const edges=[[0,0,w,0],[w,0,0,h],[w,h,-w,0],[0,h,0,-h]];
  for(const [x,y,dx,dy] of edges) {
    c.save();c.translate(x,y);c.rotate(Math.atan2(dy,dx));
    const length=Math.hypot(dx,dy),rand=randomStream(166+Math.round(x+y));
    for(let i=0;i<130;i++){
      const start=rand()*length,span=Math.min(length-start,length*(.003+rand()*.06));
      const offset=-(1+rand()*rand()*14);
      c.strokeStyle='rgba(55,61,46,'+(.12+rand()*.33)+')';c.lineWidth=.55+rand()*1.85;
      c.beginPath();c.moveTo(start,offset);
      c.quadraticCurveTo(start+span*.56,offset-1.3*rand(),start+span,offset+rand()*1.1);c.stroke();
    }
    c.restore();
  }
  c.restore();
}
function createAtlas(name,onReady) {
  const image=new Image();
  const obj={image,loaded:false,points:[],frameWidth:0,frameHeight:0};
  image.onload=()=>{
    const w=image.naturalWidth/4,h=image.naturalHeight/3;
    obj.frameWidth=w; obj.frameHeight=h;
    const small=makeCanvas(80,Math.max(12,Math.round(80*h/w))),ctx=small.getContext('2d',{willReadFrequently:true});
    for(let f=0;f<12;f++){
      ctx.clearRect(0,0,small.width,small.height);
      ctx.drawImage(image,f%4*w,Math.floor(f/4)*h,w,h,0,0,small.width,small.height);
      const pixels=ctx.getImageData(0,0,small.width,small.height).data,pts=[];
      for(let y=0;y<small.height;y+=2)for(let x=0;x<small.width;x+=2){
        if(pixels[(y*small.width+x)*4+3]>30)pts.push([x/small.width-.5,y/small.height-.5]);
      }
      obj.points.push(pts);
    }
    obj.loaded=true;onReady?.();
  };
  image.src=asset(name);
  return obj;
}
function loadImage(src,ready) {
  const image=new Image(); if(ready)image.onload=()=>ready(image);image.src=src;return image;
}
function aliveImage(i){return i?.complete && i.naturalWidth>0}
function drawCover(c,im,x,y,w,h){
  const factor=Math.max(w/im.naturalWidth,h/im.naturalHeight);
  const sw=w/factor,sh=h/factor;
  c.drawImage(im,(im.naturalWidth-sw)*.5,(im.naturalHeight-sh)*.5,sw,sh,x,y,w,h);
}
function drawFit(c,im,x,y,w,h){
  const f=Math.min(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*f,ih=im.naturalHeight*f;
  c.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);
}
function animateCreature(c,obj,type,atlas,time,r,phase) {
  const duration=type==='turtle'?2.65:type==='dragon'?1.7:1.38;
  const f=(Math.floor((time/duration+phase)*12)%12+12)%12;
  const angle=obj.angle??0, length=r*(type==='turtle'?2.24:type==='dragon'?3.05:2.75);
  if(!atlas.loaded)return null;
  const w=atlas.frameWidth,h=atlas.frameHeight,width=length,height=length*h/w;
  // Shrimp is painted in lateral view. Mirror in that half-plane to keep its feet below the body.
  const flip=type==='shrimp' && Math.cos(angle)<0?-1:1;
  c.save();c.translate(obj.x,obj.y);c.rotate(angle);c.scale(1,flip);
  c.drawImage(atlas.image,(f%4)*w,Math.floor(f/4)*h,w,h,-width/2,-height/2,width,height);
  c.restore();
  return {f,width,height,angle,flip,points:atlas.points[f]};
}
function safeRing(c,e,isEdible,z) {
  const r=e.r+Math.max(2.2,2.4/z);
  c.save();
  c.lineWidth=Math.max(1.5/z,e.r*.037);
  c.strokeStyle=isEdible?'rgba(38,128,156,.88)':'rgba(173,65,53,.78)';
  if(!isEdible)c.setLineDash([r*.39,r*.112]);c.beginPath();c.arc(e.x,e.y,r,0,TAU);c.stroke();c.restore();
}
function drawSpike(c,e,phase,time,stamp,z) {
  const count=29, r=e.r;
  c.save();c.translate(e.x,e.y);
  for(let i=0;i<count;i++){
    const a=i/count*TAU+phase+.025*Math.sin(i*6.3+phase);
    const len=r*(.86+.12*(.5+.5*Math.sin(time*.74+.36*Math.sin(time*.74+i)+phase+i*1.97)));
    const root=r*(.71+.028*Math.cos(i*1.52+phase));
    const bend=.027*Math.sin(time*.74+i*5.2+phase),n=.033+(i%3)*.006;
    c.fillStyle=i%4===0?'#455147':'#25332c';
    c.beginPath();c.moveTo(Math.cos(a-n)*root,Math.sin(a-n)*root);
    c.quadraticCurveTo(Math.cos(a-n*.6)*(len*.96),Math.sin(a-n*.6)*(len*.96),Math.cos(a+bend)*len,Math.sin(a+bend)*len);
    c.lineTo(Math.cos(a+n)*root,Math.sin(a+n)*root);c.closePath();c.fill();
  }
  drawStamp(c,stamp,0,0,r*.765);
  c.restore();
}
function drawHole(c,e,phase,time,core,ring){
  c.save();c.translate(e.x,e.y);c.rotate(phase);
  const r=e.r;
  drawStamp(c,core,0,0,r*.91);
  c.rotate(time*.17);drawStamp(c,ring,0,0,r*.98);
  c.rotate(-time*.29);c.lineWidth=Math.max(.7,r*.045);
  c.strokeStyle='rgba(234,233,202,.83)';c.beginPath();c.ellipse(0,0,r*.59,r*.54,-.2,1.1,4.65);c.stroke();
  c.restore();
}
function ripple(c,x,y,r,t,opacity) {
  const f=(t%1+1)%1;
  c.strokeStyle='rgba(67,107,103,'+(opacity*(1-f))+')';
  c.lineWidth=Math.max(.65,r*.018);
  ellipse(c,x,y,r*(1.05+f*.37),r*(.66+f*.25),-.12);c.stroke();
}
function petal(c,flower,index,time,img) {
  const r=flower.r;
  c.save();c.translate(flower.x,flower.y);c.rotate(.15*Math.sin(index+time*.22)+index*1.5);
  if(aliveImage(img)){c.drawImage(img,-r*1.2,-r*1.15,r*2.4,r*2.3);}
  else{
    for(let i=0;i<8;i++){c.rotate(TAU/8);c.fillStyle=i%2?'#c88b8a':'#e8c5b8';ellipse(c,0,-r*.35,r*.25,r*.67);c.fill()}
    c.fillStyle='#b49a58';ellipse(c,0,0,r*.2,r*.2);c.fill();
  }
  c.restore();
}
function leaf(c,l,time,im,flowerIm){
  const phase=idPhase(l.id),r=l.r;
  ripple(c,l.x,l.y+r*.12,r,time*.13+phase,.45);
  c.save();c.translate(l.x,l.y);c.rotate(phase+.012*Math.sin(time*.53+phase));
  if(aliveImage(im)){
    c.globalAlpha=.91;c.drawImage(im,-r,-r,r*2,r*2);
  }else{
    c.fillStyle='#9caa98';blob(c,0,0,r,r*.95,phase,.07);c.fill();
    c.lineWidth=1;c.strokeStyle='#6d806f';
    for(let i=0;i<14;i++){const a=TAU*i/14;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*r*.85,Math.sin(a)*r*.85);c.stroke()}
  }
  c.restore();
  if(l.stored>0 && l.capacity>0 && l.flowers?.length<3){
    const amount=clamp(l.stored/l.capacity,0,1);
    c.save();c.translate(l.x-r*.14,l.y-r*.07);c.rotate(-.45);
    c.fillStyle='#83977b';ellipse(c,0,0,r*(.035+.05*amount),r*(.07+.095*amount));c.fill();
    c.fillStyle='rgba(204,151,146,'+(.25+.7*amount)+')';ellipse(c,0,-r*.04,r*.025+r*.032*amount,r*.038+r*.073*amount);c.fill();c.restore();
  }
  for(const [i,f] of (l.flowers||[]).entries())petal(c,f,i,time,flowerIm);
}

function softInk(){
  const canvas=makeCanvas(64),c=canvas.getContext('2d');
  const g=c.createRadialGradient(32,32,0,32,32,31);
  g.addColorStop(0,'rgba(28,39,36,.76)');g.addColorStop(.27,'rgba(38,47,41,.53)');
  g.addColorStop(.60,'rgba(59,75,65,.21)');g.addColorStop(1,'rgba(66,80,68,0)');
  c.fillStyle=g;c.fillRect(0,0,64,64);return canvas;
}
function drop(c,d,time,z){
  const r=Math.max(.94/z,d.r),phase=idPhase(d.id),t=1+.07*Math.sin(time*1.9+phase);
  if(!d.ready){c.globalAlpha=.45}
  c.fillStyle=d.ready?'#263f3b':'#546b60';
  ellipse(c,d.x,d.y,r*t,r*(2-t),phase);c.fill();
  if(r*z>3){c.fillStyle='#adc4b5';ellipse(c,d.x-r*.22,d.y-r*.31,r*.21,r*.14,-.2);c.fill()}
  c.globalAlpha=1;
}
function shot(c,o,z){
  const r=Math.max(1.3/z,o.r);
  if(o.type==='bubble'){
    c.strokeStyle='rgba(41,117,132,.8)';c.lineWidth=Math.max(1/z,r*.11);
    ellipse(c,o.x,o.y,r,r);c.stroke();c.fillStyle='rgba(232,248,244,.38)';c.fill();
    c.strokeStyle='rgba(255,255,242,.97)';c.lineWidth=Math.max(1.0/z,r*.18);
    c.beginPath();c.arc(o.x,o.y,r*.69,3.62,4.7);c.stroke();
  }else{
    c.save();c.translate(o.x,o.y);c.rotate(Math.atan2(o.vy,o.vx));c.fillStyle='rgba(36,51,44,.69)';
    ellipse(c,0,0,r*1.27,r*.70);c.fill();c.restore();
  }
}
function brushAccent(c,x,y,r,a,length,color,line){
  c.strokeStyle=color;c.lineWidth=line;c.lineCap='round';
  c.beginPath();c.arc(x,y,r,a,a+length);c.stroke();
}
function focusMark(c,focus,time,z) {
  if(!focus||!Number.isFinite(focus.x)||!Number.isFinite(focus.y))return;
  const r=Math.max(10/z,(focus.r||8)+8/z);
  c.save();
  const a=time*.3;
  for(let i=0;i<4;i++)brushAccent(c,focus.x,focus.y,r,a+i*TAU/4,.48,'rgba(130,98,41,.85)',1.4/z);
  c.restore();
}
function drawCursorTo(c,worldPos,camera,w,h) {
  if(!worldPos||!Number.isFinite(worldPos.x))return;
  const dx=(worldPos.x-camera.x)*camera.scale,dy=(worldPos.y-camera.y)*camera.scale;
  if(Math.abs(dx)<w*.47 && Math.abs(dy)<h*.44)return;
  const k=Math.min((w*.46)/Math.max(.01,Math.abs(dx)),(h*.40)/Math.max(.01,Math.abs(dy)));
  c.save();c.translate(w/2+dx*k,h/2+dy*k);c.rotate(Math.atan2(dy,dx));
  c.fillStyle='rgba(247,240,215,.87)';ellipse(c,0,0,10,10);c.fill();
  c.fillStyle='#87652f';c.beginPath();c.moveTo(7,0);c.lineTo(-5,-5);c.lineTo(-2,0);c.lineTo(-5,5);c.closePath();c.fill();c.restore();
}

export function createRenderer(canvas){
  const c=canvas.getContext('2d',{alpha:false}), stamp={ink:inkStamp('ink'),spike:inkStamp('spike'),hole:inkStamp('hole'),ring:accretionStamp()};
  const atlases=Object.fromEntries(FORMS.map(f=>[f,createAtlas(f)]));
  const leafImage=loadImage(asset('leaf')),flowerImage=loadImage(asset('flower')),puff=softInk();
  const screenGrain=c.createPattern(paperTile(),'repeat');
  const smallSpikes=Array.from({length:12},(_,i)=>{
    const tile=makeCanvas(176),ctx=tile.getContext('2d');
    drawSpike(ctx,{x:88,y:88,r:82},0,i*TAU/12/.74,stamp.spike,1);
    return {canvas:tile,units:82};
  });
  const pictures=new Map(), dynamics=new Map(), ripples=[], mist=[];
  let state=null, surface, artPlate, revealLayer, dab, artURL='', worldBase=null, lastArt=null, lastX=NaN,lastY=NaN, clock=0, accumulator=0;
  let seed=randomStream(89241);
  function reset(world) {
    state=world;worldBase=world.player;
    surface=makeWater(world);
    artPlate=makeCanvas(surface.w,surface.h);revealLayer=makeCanvas(surface.w,surface.h);dab=makeCanvas(96);
    lastArt=null;lastX=NaN;lastY=NaN;clock=world.time||0;accumulator=0;
    dynamics.clear();ripples.length=0;mist.length=0;seed=randomStream(89241);
  }
  function dabPaper(p){
    if(!lastArt)return;
    const stride=Math.max(7,p.r*.43),dx=p.x-lastX,dy=p.y-lastY;
    if(Number.isFinite(dx) && dx*dx+dy*dy<stride*stride)return;
    lastX=p.x;lastY=p.y;
    const cc=dab.getContext('2d'),paint=revealLayer.getContext('2d');
    const span=clamp(p.r*surface.scale*2.35,8,128),wx=p.x*surface.w/state.width-span/2,wy=p.y*surface.h/state.height-span/2;
    cc.clearRect(0,0,96,96);
    cc.globalCompositeOperation='source-over';
    const g=cc.createRadialGradient(48,48,3,48,48,48);
    g.addColorStop(0,'rgba(0,0,0,.62)');g.addColorStop(.46,'rgba(0,0,0,.34)');g.addColorStop(1,'transparent');
    cc.fillStyle=g;cc.fillRect(0,0,96,96);
    cc.globalCompositeOperation='source-in';
    cc.drawImage(artPlate,-wx*96/span,-wy*96/span,artPlate.width*96/span,artPlate.height*96/span);
    cc.globalCompositeOperation='source-over';
    paint.drawImage(dab,wx,wy,span,span);
  }
  function adjustPicture(url,world){
    if(!url){lastArt=null;return}
    if(!pictures.has(url)) pictures.set(url,loadImage(url));
    const im=pictures.get(url);
    if(!aliveImage(im)||lastArt===im)return;
    lastArt=im;
    const ac=artPlate.getContext('2d');
    ac.clearRect(0,0,artPlate.width,artPlate.height);
    drawCover(ac,im,0,0,artPlate.width,artPlate.height);
  }
  function trail(p,pose,dt,world,reduceMotion){
    if(dt<=0)return;
    const speed=Math.hypot(p.vx||0,p.vy||0);
    const active=world.player.emitting && !['fish','dragon'].includes(p.form);
    if(speed<3 && !active)return;
    const intensity=active?55:21;
    accumulator+=dt*(reduceMotion?intensity*.48:intensity);
    const count=Math.min(8,Math.floor(accumulator));accumulator-=count;
    const a=p.angle||0,r=p.r,cs=Math.cos(a),sn=Math.sin(a);
    for(let i=0;i<count;i++){
      let lx,ly;
      if(pose?.points?.length){
        const pair=pose.points[Math.floor(seed()*pose.points.length)];lx=pair[0]*pose.width;ly=pair[1]*pose.height*pose.flip;
      } else {
        const angle=seed()*TAU, dist=Math.sqrt(seed())*r*.86;
        lx=Math.cos(angle)*dist;ly=Math.sin(angle)*dist;
      }
      const flow=active?42+seed()*48:2+seed()*13,spread=(seed()-.5)*8;
      mist.push({x:p.x+lx*cs-ly*sn,y:p.y+lx*sn+ly*cs,
        vx:-cs*flow-sn*spread,vy:-sn*flow+cs*spread,r:r*(.08+seed()*(active?.30:.15)),
        life:active?.78+seed()*.53:.32+seed()*.28,age:0,alpha:active?.69:.42});
    }
    if(mist.length>170)mist.splice(0,mist.length-170);
  }
  function collectWaves(world,dt){
    if(dt<=0)return;
    const p=world.player;
    for(const obj of [p,...world.enemies]){
      const key=obj===p?'player':obj.id;
      const was=dynamics.get(key),to=obj.mass;
      if(was!==undefined && Math.abs(to-was)>1.5){
        if(obj===p||was-to>Math.max(2,was*.08)){
          ripples.push({x:obj.x,y:obj.y,r:obj.r,age:0,loss:to<was});
        }
      }
      dynamics.set(key,to);
    }
    if(ripples.length>35)ripples.splice(0,ripples.length-35);
  }
  function render(world,camera,options={}){
    if(!world?.player||!camera)return;
    const w=canvas.clientWidth||canvas.width||1,h=canvas.clientHeight||canvas.height||1;
    const dpr=Math.min(options.pixelRatio || globalThis.devicePixelRatio || 1,2);
    const W=Math.max(1,Math.round(w*dpr)),H=Math.max(1,Math.round(h*dpr));
    if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
    c.setTransform(W/w,0,0,H/h,0,0);
    c.globalAlpha=1.;c.globalCompositeOperation='source-over';c.imageSmoothingEnabled=true;
    const z=Math.max(.01,camera.scale||1),p=world.player,time=world.time||0;
    if(state!==world || worldBase!==world.player || clock>time+.01)reset(world);
    const url=options.artwork?.src || options.artwork;
    if(url!==artURL){lastArt=null;artURL=url}
    adjustPicture(url,world);
    const dt=clamp(time-clock,0,.09);
    clock=time;collectWaves(world,dt);dabPaper(p);
    const view={left:camera.x-w/(2*z)-6,right:camera.x+w/(2*z)+6,top:camera.y-h/(2*z)-6,bottom:camera.y+h/(2*z)+6};
    const near=(e,extra=0)=>e.x+(e.r||0)+extra>view.left&&e.x-(e.r||0)-extra<view.right&&e.y+(e.r||0)+extra>view.top&&e.y-(e.r||0)-extra<view.bottom;
    if(view.left<0||view.top<0||view.right>world.width||view.bottom>world.height){
      c.fillStyle='#d7cfb9';c.fillRect(0,0,w,h);
    }
    c.save();c.translate(w/2,h/2);c.scale(z,z);c.translate(-camera.x,-camera.y);
    c.drawImage(surface.canvas,0,0,world.width,world.height);
    if(lastArt){
      c.globalAlpha=.105;c.drawImage(artPlate,0,0,world.width,world.height);
      c.globalAlpha=.66;c.drawImage(revealLayer,0,0,world.width,world.height);c.globalAlpha=1;
    }
    c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=.68;c.fillStyle=screenGrain;c.fillRect(0,0,W,H);c.restore();
    if(view.left<20||view.right>world.width-20||view.top<20||view.bottom>world.height-20)drawShore(c,world.width,world.height,z);
    c.save();c.beginPath();c.rect(0,0,world.width,world.height);c.clip();
    for(const l of world.leaves||[])if(near(l,l.r*.4))leaf(c,l,time,leafImage,flowerImage);
    for(const d of world.drops||[])if(near(d))drop(c,d,time,z);
    for(let i=mist.length-1;i>=0;i--){
      const m=mist[i];m.age+=dt;
      if(m.age>=m.life){mist.splice(i,1);continue}
      m.x+=m.vx*dt;m.y+=m.vy*dt;
      const k=m.age/m.life,r=m.r*(1+k*1.6);
      c.globalAlpha=m.alpha*(1-k)*(1-k);c.drawImage(puff,m.x-r,m.y-r,r*2,r*2);
    }
    c.globalAlpha=1;
    for(const e of world.enemies||[]){
      if(!near(e,10/z)||e.r<=0||e.mass<=0)continue;
      const phase=idPhase(e.id);
      if(e.type==='hole')drawHole(c,e,phase,time,stamp.hole,stamp.ring);
      else if(e.r*z*dpr<72){
        const index=Math.floor((phase+time*.74)*12/TAU)%12;
        c.save();c.translate(e.x,e.y);c.rotate(phase);
        drawStamp(c,smallSpikes[index],0,0,e.r);c.restore();
      }else drawSpike(c,e,phase,time,stamp.spike,z);
      safeRing(c,e,p.mass>e.mass,z);
    }
    for(const item of world.items||[]){
      if(!near(item,item.r*1.1))continue;
      const phase=idPhase(item.id),a=atlases[item.type];
      if(!a)continue;
      ripple(c,item.x,item.y+item.r*.5,item.r*1.10,time*.51+phase,.60);
      const pose=animateCreature(c,item,item.type,a,time,item.r*1.14,phase);
      if(!pose){c.fillStyle='#a08651';ellipse(c,item.x,item.y,item.r*.6,item.r*.4,item.angle||0);c.fill();}
    }
    for(const o of world.shots||[])if(near(o,6))shot(c,o,z);
    let pose=null;
    if(p.mass>0){
      if(p.form==='turtle'||p.form==='dragon'){
        const a=time*.23;c.save();
        for(let i=0;i<3;i++)brushAccent(c,p.x,p.y,p.r*1.23,a+i*TAU/3,.91,'rgba(167,142,76,.70)',Math.max(1/z,p.r*.051));
        c.restore();
      }
      if(p.form==='shrimp'||p.form==='dragon'){
        const m=Array.from(world.drops||[]).filter(e=>e.ready && Math.hypot(e.x-p.x,e.y-p.y)<p.r*5.2 && near(e)).slice(0,6);
        c.save();
        for(const d of m){
          const dx=p.x-d.x,dy=p.y-d.y,frac=.24+.15*Math.sin(time*5+idPhase(d.id));
          c.strokeStyle='rgba(75,120,114,.30)';c.lineWidth=Math.max(.8/z,.45);
          c.beginPath();c.moveTo(d.x+dx*.03,d.y+dy*.03);c.quadraticCurveTo(d.x+dx*frac*.48-dy*.025,d.y+dy*frac*.48+dx*.025,d.x+dx*frac,d.y+dy*frac);c.stroke();
        }
        c.restore();
      }
      if(atlases[p.form])pose=animateCreature(c,p,p.form,atlases[p.form],time,p.r,0);
      if(!pose){
        c.save();c.translate(p.x,p.y);c.rotate(.035*Math.sin(time*.8));drawStamp(c,stamp.ink,0,0,p.r);c.restore();
        // One small dry-brush stroke is the heading cue, including when the joystick is released.
        c.save();c.translate(p.x,p.y);c.rotate(p.angle||0);
        c.fillStyle='#e7e6c8';c.beginPath();c.moveTo(p.r*.82,0);c.quadraticCurveTo(p.r*.64,p.r*.045,p.r*.48,p.r*.14);c.quadraticCurveTo(p.r*.60,0,p.r*.48,-p.r*.095);c.closePath();c.fill();
        c.restore();
      }
    }
    if(dt>0)trail(p,pose,dt,world,!!options.reduceMotion);
    for(let i=ripples.length-1;i>=0;i--){
      const q=ripples[i];q.age+=dt;
      if(q.age>.55){ripples.splice(i,1);continue}
      const f=q.age/.55;
      c.strokeStyle=q.loss?'rgba(132,69,49,'+(.55*(1-f))+')':'rgba(62,116,115,'+(.65*(1-f))+')';
      c.lineWidth=Math.max(1/z,q.r*.07)*(1-f*.65);c.beginPath();c.arc(q.x,q.y,q.r*(.88+f*.90),0,TAU);c.stroke();
    }
    focusMark(c,options.focus,time,z);
    c.restore();c.restore();
    drawCursorTo(c,options.focus,camera,w,h);
    const reveal=clamp(options.reveal||0,0,1);
    if(reveal>0 && aliveImage(lastArt)){
      c.save();c.globalAlpha=reveal*(2-reveal);
      c.fillStyle='#efebdc';c.fillRect(0,0,w,h);
      drawFit(c,lastArt,0,0,w,h);c.restore();
    }
  }
  function dispose(){
    state=null;lastArt=null;worldBase=null;pictures.clear();dynamics.clear();mist.length=0;ripples.length=0;
  }
  return {render,dispose};
}
