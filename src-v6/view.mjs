const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

export function createCamera(canvas,meter=null) {
  const camera={x:0,y:0,scale:1};
  let magnification=1, offsetX=0, offsetY=0;
  let inspected=null, intro=null;
  let cachedWidth=0,cachedHeight=0,top=0;
  function ranges(w) {
    const width=canvas.clientWidth||innerWidth,height=canvas.clientHeight||innerHeight;
    if(width!==cachedWidth||height!==cachedHeight){
      const meterBottom=meter?.getBoundingClientRect().bottom||0;
      top=Math.min(height*.24,meterBottom+12);
      cachedWidth=width;cachedHeight=height;
    }
    const overview=Math.min((width-12)/w.width,(height-top-9)/w.height);
    const initial=Math.max(overview,Math.min(width,height)/510);
    return {width,height,overview,initial};
  }
  function update(w,dt=0) {
    const {width,height,initial,overview}=ranges(w);
    if(intro) {
      intro.elapsed=Math.min(intro.duration,intro.elapsed+dt);
      // Give the player time to recognise their ink drop before the pond opens up.
      const t=clamp((intro.elapsed/intro.duration-.14)/.86,0,1);
      const ease=t*t*(3-2*t);
      magnification=Math.exp(Math.log(intro.start)*(1-ease));
      if(t>=1)intro=null;
    }
    camera.scale=clamp(initial*magnification,overview,initial*9);
    const halfW=width/camera.scale/2,halfH=height/camera.scale/2;
    const p=w.player;
    const position=(target,half,size)=>size<=2*half?size/2:clamp(target,half,size-half);
    camera.x=position((inspected?.x??p.x)+offsetX,halfW,w.width);
    // Reserve space above the paper progressively as the whole pond comes into view.
    const blend=clamp(1-(camera.scale/overview-1)/.45,0,1);
    const inset=top*blend/camera.scale,bottom=9*blend/camera.scale;
    const usableHalf=halfH-(inset+bottom)/2;
    camera.y=position((inspected?.y??p.y)+offsetY,usableHalf,w.height)-(inset-bottom)/2;
    const decay=inspected?1:Math.exp(-dt*Math.min(1.6,Math.hypot(p.vx||0,p.vy||0)*.014));
    offsetX*=decay;offsetY*=decay;
    return camera;
  }
  function zoom(w,factor,x,y) {
    const {width,height,initial,overview}=ranges(w);
    intro=null;
    const box=canvas.getBoundingClientRect();
    const u=x-box.left-width/2,v=y-box.top-height/2,previous=camera.scale;
    const scale=clamp(previous*factor,overview,initial*Math.max(3.5,magnification));
    magnification=scale/initial;
    offsetX=camera.x-(inspected?.x??w.player.x)+u*(1/previous-1/scale);
    offsetY=camera.y-(inspected?.y??w.player.y)+v*(1/previous-1/scale);
    update(w);
  }
  function inspect(w,x,y){
    inspected={x:clamp(x,0,w.width),y:clamp(y,0,w.height)};
    intro=null;offsetX=offsetY=0;return update(w);
  }
  function follow(){if(inspected){inspected=null;offsetX=offsetY=0;}}
  function introduce(w,duration=3){
    const {initial,width,height}=ranges(w);
    const start=clamp(Math.min(width,height)*.145/(Math.max(1,w.player.r)*initial),3.3,9);
    intro={start,duration:Math.max(.01,duration),elapsed:0};
    return update(w);
  }
  return {update,zoom,inspect,follow,introduce,reset(w){cachedWidth=cachedHeight=0;inspected=intro=null;magnification=1;offsetX=offsetY=0;return update(w);}};
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
  return (world,camera,view,paintLayer)=>{
    const w=canvas.clientWidth||120,h=canvas.clientHeight||80,dpr=Math.min(window.devicePixelRatio||1,2);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,h);
    const scale=Math.min((w-9)/world.width,(h-9)/world.height);
    if(scale<=0)return;
    const mapW=world.width*scale,mapH=world.height*scale, ox=(w-mapW)/2,oy=(h-mapH)/2;
    layout={ox,oy,mapW,mapH,scale};
    c.fillStyle='#f1e7d3'; c.fillRect(ox,oy,mapW,mapH);
    if(paintLayer)c.drawImage(paintLayer,ox,oy,mapW,mapH);
    c.lineWidth=.7;c.strokeStyle='#a2926a77';c.strokeRect(ox,oy,mapW,mapH);
    c.save();c.beginPath();c.rect(ox,oy,mapW,mapH);c.clip();
    function dot(x,y,r,color){c.beginPath();c.arc(ox+x*scale,oy+y*scale,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
    for(const leaf of world.leaves){
      dot(leaf.x,leaf.y,Math.max(1.45,leaf.r*scale),'#799477');
      for(const flower of leaf.flowers)dot(flower.x,flower.y,.8,'#fff0c5');
    }
    for(const e of world.enemies){
      const r=Math.max(1.05,Math.min(3.2,e.r*scale));
      dot(e.x,e.y,r,e.mass<world.player.mass?'#427e8a':'#996759');
      if(e.mass===world.largest){
        c.beginPath();c.arc(ox+e.x*scale,oy+e.y*scale,r+1.25,0,Math.PI*2);
        c.lineWidth=.7;c.strokeStyle='#7a4b3f';c.stroke();
      }
    }
    const hw=view.clientWidth/(2*camera.scale),hh=view.clientHeight/(2*camera.scale);
    const x=clamp(camera.x-hw,0,world.width),y=clamp(camera.y-hh,0,world.height);
    const x2=clamp(camera.x+hw,0,world.width),y2=clamp(camera.y+hh,0,world.height);
    c.lineWidth=1.2;c.strokeStyle='#44574f';c.strokeRect(ox+x*scale+.5,oy+y*scale+.5,Math.max(0,(x2-x)*scale-1),Math.max(0,(y2-y)*scale-1));
    dot(world.player.x,world.player.y,3.1,'#fff8e4');dot(world.player.x,world.player.y,1.9,'#172c29');
    c.restore();
  };
}
