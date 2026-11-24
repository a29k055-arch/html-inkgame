const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
// Cubic Bézier with control points (⅓,0) and (⅔,1). Its x-coordinate is time.
const ease=t=>t*t*(3-2*t);
const lerp=(a,b,t)=>a+(b-a)*t;

export function createCamera(canvas,meter=null) {
  const camera={x:0,y:0,scale:1};
  let zoomRatio=1,offsetX=0,offsetY=0,inspected=null,dragon=false;
  let motion=null,cachedWidth=0,cachedHeight=0,top=0;
  function ranges(w) {
    const width=canvas.clientWidth||innerWidth,height=canvas.clientHeight||innerHeight;
    if(width!==cachedWidth||height!==cachedHeight){
      top=Math.min(height*.24,(meter?.getBoundingClientRect().bottom||0)+12);
      cachedWidth=width;cachedHeight=height;
    }
    const overview=Math.min((width-12)/w.width,(height-top-9)/w.height);
    return {width,height,overview,initial:Math.max(overview,Math.min(width,height)/510)};
  }
  function travel(duration,hold=0){
    motion={from:{...camera},elapsed:0,duration,hold};
  }
  function update(w,dt=0) {
    const {width,height,initial,overview}=ranges(w),p=w.player;
    const transformed=p.form==='dragon';
    if(transformed!==dragon){
      dragon=transformed;travel(dragon ? .85 : .7);
    }
    const targetScale=clamp(initial*zoomRatio*(dragon ? .74 : 1),overview,initial*9);
    let t=1;
    if(motion){
      motion.elapsed+=Math.max(0,dt);
      t=ease(clamp((motion.elapsed-motion.hold)/motion.duration,0,1));
      camera.scale=Math.exp(lerp(Math.log(motion.from.scale),Math.log(targetScale),t));
    }else camera.scale=targetScale;
    const halfW=width/camera.scale/2,halfH=height/camera.scale/2;
    const position=(target,half,size)=>size<=2*half?size/2:clamp(target,half,size-half);
    const blend=clamp(1-(camera.scale/overview-1)/.45,0,1);
    const inset=top*blend/camera.scale,bottom=9*blend/camera.scale;
    const aim=inspected||p;
    const tx=position(aim.x+offsetX,halfW,w.width);
    const ty=position(aim.y+offsetY,halfH-(inset+bottom)/2,w.height)-(inset-bottom)/2;
    camera.x=motion?lerp(motion.from.x,tx,t):tx;
    camera.y=motion?lerp(motion.from.y,ty,t):ty;
    if(t>=1)motion=null;
    if(!inspected&&!motion){
      const decay=Math.exp(-dt*Math.min(1.6,Math.hypot(p.vx||0,p.vy||0)*.014));
      offsetX*=decay;offsetY*=decay;
    }
    return camera;
  }
  function zoom(w,factor,x,y) {
    const {width,height,initial,overview}=ranges(w),box=canvas.getBoundingClientRect();
    const formScale=dragon ? .74 : 1;
    // Accumulate wheel/pinch events even if they arrive before the next paint.
    const old=motion?.interactive?initial*zoomRatio*formScale:camera.scale;
    const scale=clamp(old*factor,overview,initial*3.5);
    const aim=inspected||w.player,u=x-box.left-width/2,v=y-box.top-height/2;
    offsetX=camera.x-aim.x+u*(1/camera.scale-1/scale);
    offsetY=camera.y-aim.y+v*(1/camera.scale-1/scale);
    zoomRatio=scale/(initial*formScale);
    if(!motion?.interactive){travel(.22);motion.interactive=true;}
  }
  function inspect(w,x,y){
    inspected={x:clamp(x,0,w.width),y:clamp(y,0,w.height)};
    offsetX=offsetY=0;
    if(!motion?.map){travel(.36);motion.map=true;}
    return camera;
  }
  function follow(){
    if(inspected){inspected=null;offsetX=offsetY=0;travel(.40);}
  }
  function introduce(w,duration=3){
    const {initial,width,height}=ranges(w);
    const start=clamp(Math.min(width,height)*.145/(Math.max(1,w.player.r)*initial),3.3,9);
    zoomRatio=start;update(w);zoomRatio=1;
    travel(Math.max(.01,duration*.86),duration*.14);return camera;
  }
  function reset(w){
    cachedWidth=cachedHeight=0;inspected=motion=null;dragon=w.player.form==='dragon';
    zoomRatio=1;offsetX=offsetY=0;return update(w);
  }
  return {update,zoom,inspect,follow,introduce,reset};
}

export function createMinimap(canvas,onInspect) {
  const surface=canvas.parentElement;
  let layout=null,drag=null;
  function look(e){
    if(!layout)return;
    const box=canvas.getBoundingClientRect();
    const {ox,oy,mapW,mapH,scale}=layout;
    const x=clamp(e.clientX-box.left-ox,0,mapW)/scale;
    const y=clamp(e.clientY-box.top-oy,0,mapH)/scale;
    onInspect(x,y);
  }
  surface.addEventListener('pointerdown',e=>{
    if(drag!==null||e.button!==0)return;
    e.preventDefault();e.stopPropagation();drag=e.pointerId;surface.setPointerCapture(drag);look(e);
  });
  surface.addEventListener('pointermove',e=>{if(e.pointerId===drag)look(e);});
  function end(e){if(e.pointerId===drag)drag=null;}
  for(const type of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(type,end);

  const c=canvas.getContext('2d');
  const terrain=document.createElement('canvas'),map=terrain.getContext('2d');
  let lastWorld=null,nextMapTime=0;
  return (world,camera,view,paintLayer)=>{
    const w=canvas.clientWidth||120,h=canvas.clientHeight||80,dpr=Math.min(window.devicePixelRatio||1,2);
    const resized=canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr);
    if(resized){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    const scale=Math.min((w-9)/world.width,(h-9)/world.height);
    if(scale<=0)return;
    const mapW=world.width*scale,mapH=world.height*scale,ox=(w-mapW)/2,oy=(h-mapH)/2;
    layout={ox,oy,mapW,mapH,scale};
    function dot(ctx,x,y,r,color){ctx.beginPath();ctx.arc(ox+x*scale,oy+y*scale,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
    // Opponents move fractions of a minimap pixel between updates. Keep the
    // camera rectangle and player at the display frame rate while reusing the map.
    if(resized||world!==lastWorld||world.time>=nextMapTime||world.status==='won'){
      if(terrain.width!==canvas.width||terrain.height!==canvas.height){terrain.width=canvas.width;terrain.height=canvas.height;}
      lastWorld=world;nextMapTime=world.time+.1;
      map.setTransform(dpr,0,0,dpr,0,0);map.clearRect(0,0,w,h);
      map.fillStyle='#f1e7d3';map.fillRect(ox,oy,mapW,mapH);
      if(paintLayer)map.drawImage(paintLayer,ox,oy,mapW,mapH);
      map.lineWidth=.7;map.strokeStyle='#a2926a77';map.strokeRect(ox,oy,mapW,mapH);
      map.save();map.beginPath();map.rect(ox,oy,mapW,mapH);map.clip();
      for(const leaf of world.leaves){
        dot(map,leaf.x,leaf.y,Math.max(1.45,leaf.r*scale),'#799477');
        for(const flower of leaf.flowers)dot(map,flower.x,flower.y,.8,'#fff0c5');
      }
      for(const e of world.enemies){
        const r=Math.max(1.05,Math.min(3.2,e.r*scale));
        dot(map,e.x,e.y,r,e.mass<world.player.mass?'#427e8a':'#996759');
        if(e.major||e.cornerBoss||e.mass===world.largest){
          map.beginPath();map.arc(ox+e.x*scale,oy+e.y*scale,r+1.25,0,Math.PI*2);
          map.lineWidth=(e.major||e.cornerBoss)?1.15:.7;map.strokeStyle='#7a4b3f';map.stroke();
        }
      }
      map.restore();
    }
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);c.drawImage(terrain,0,0,w,h);
    c.save();c.beginPath();c.rect(ox,oy,mapW,mapH);c.clip();
    const hw=view.clientWidth/(2*camera.scale),hh=view.clientHeight/(2*camera.scale);
    const x=clamp(camera.x-hw,0,world.width),y=clamp(camera.y-hh,0,world.height);
    const x2=clamp(camera.x+hw,0,world.width),y2=clamp(camera.y+hh,0,world.height);
    c.lineWidth=1.2;c.strokeStyle='#44574f';c.strokeRect(ox+x*scale+.5,oy+y*scale+.5,Math.max(0,(x2-x)*scale-1),Math.max(0,(y2-y)*scale-1));
    dot(c,world.player.x,world.player.y,3.1,'#fff8e4');dot(c,world.player.x,world.player.y,1.9,'#172c29');
    c.restore();
  };
}
