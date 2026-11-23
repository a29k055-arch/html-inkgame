const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

export function createCamera(canvas) {
  const camera={x:0,y:0,scale:1};
  let magnification=1, offsetX=0, offsetY=0;
  function ranges(w) {
    const width=canvas.clientWidth||innerWidth,height=canvas.clientHeight||innerHeight;
    const overview=Math.min(width/w.width,height/w.height);
    const initial=Math.max(overview,Math.min(width,height)/510);
    return {width,height,overview,initial};
  }
  function update(w,dt=0) {
    const {width,height,initial,overview}=ranges(w);
    camera.scale=clamp(initial*magnification,overview,Math.max(overview,initial*3.5));
    const halfW=width/camera.scale/2,halfH=height/camera.scale/2;
    const p=w.player;
    const position=(player,offset,half,size)=>size<=2*half?size/2:clamp(player+clamp(offset,-half*.65,half*.65),half,size-half);
    camera.x=position(p.x,offsetX,halfW,w.width);
    camera.y=position(p.y,offsetY,halfH,w.height);
    const decay=Math.exp(-dt*Math.min(1.6,Math.hypot(p.vx||0,p.vy||0)*.014));
    offsetX*=decay;offsetY*=decay;
    return camera;
  }
  function zoom(w,factor,x,y) {
    const {width,height,initial,overview}=ranges(w);
    const box=canvas.getBoundingClientRect();
    const u=x-box.left-width/2,v=y-box.top-height/2,previous=camera.scale;
    const scale=clamp(previous*factor,overview,initial*3.5);
    magnification=scale/initial;
    offsetX=camera.x-w.player.x+u*(1/previous-1/scale);
    offsetY=camera.y-w.player.y+v*(1/previous-1/scale);
    update(w);
  }
  return {update,zoom,reset(w){magnification=1;offsetX=offsetY=0;return update(w);}};
}

export function createMinimap(canvas) {
  const c=canvas.getContext('2d');
  return (world,camera,view)=>{
    const w=canvas.clientWidth||120,h=canvas.clientHeight||80,dpr=Math.min(window.devicePixelRatio||1,2);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,h);
    const scale=Math.min((w-9)/world.width,(h-9)/world.height);
    if(scale<=0)return;
    const mapW=world.width*scale,mapH=world.height*scale, ox=(w-mapW)/2,oy=(h-mapH)/2;
    c.fillStyle='#eee6d5'; c.fillRect(ox,oy,mapW,mapH);
    c.save();c.beginPath();c.rect(ox,oy,mapW,mapH);c.clip();
    function dot(x,y,r,color){c.beginPath();c.arc(ox+x*scale,oy+y*scale,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
    for(const leaf of world.leaves){
      dot(leaf.x,leaf.y,Math.max(1.45,leaf.r*scale),'#799477');
      if(leaf.flowers.length)dot(leaf.x,leaf.y,.8,'#fff0c5');
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
