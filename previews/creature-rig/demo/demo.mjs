import {InkCreature,damp} from '../runtime/ink-creature.mjs';
const $=id=>document.getElementById(id),canvas=$('stage'),ctx=canvas.getContext('2d'),keys=new Set();
const state={rig:null,selected:'fish_04',mode:'manual',width:1000,height:600,camera:{x:0,y:0},joystick:{x:0,y:0},loading:0,frames:0,fps:0,lastTelemetry:0};
const profiles={fish_04:{length:320,note:'身体摆动 · 尾鳍推进'},dragon_04:{length:430,note:'多段扭动 · 转向延迟 · 龙身可拉直'},shrimp_07:{length:230,note:'腹节轻动 · 触须缓摆'},turtle_02:{length:245,note:'龟壳稳定 · 头尾与四肢活动'}};
function displayLength(id){return Math.min(profiles[id].length,state.height*(id==='shrimp_07'?.48:.72),state.width*(id==='shrimp_07'?.48:.7));}
function size(){const r=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);state.width=r.width;state.height=r.height;canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);if(state.rig){state.rig.length=displayLength(state.selected);center();}}
function center(){const r=state.rig;if(!r)return;state.camera.x=state.camera.y=0;r.reset(state.width/2,state.height/2-r.length*.4,-Math.PI/2);}
async function selectCreature(id){if(!profiles[id])throw Error('Unknown creature');const ticket=++state.loading;$('status').hidden=false;$('status').textContent='正在载入分层素材…';const old=state.rig;state.rig=null;
 try {const rig=await InkCreature.load(`../${id}/rig.json`,{length:displayLength(id),speed:Number($('speed').value)});if(ticket!==state.loading){rig.dispose();return;}old?.dispose();state.rig=rig;state.selected=id;$('creature').value=id;rig.setMode(state.mode);center();$('species-note').textContent=profiles[id].note;$('layer-count').textContent=`${rig.rig.layers.length} 层 · PNG + 连续骨架`;$('status').hidden=true;
 } catch(error){old?.dispose();$('status').textContent='素材载入失败：'+error.message;console.error(error);throw error;}}
function setMode(mode){state.mode=mode;$('mode').value=mode;state.rig?.setMode(mode);keys.clear();state.joystick={x:0,y:0};if(mode==='straight'||mode==='rest')center();}
function background(){const {width:w,height:h,camera}=state;ctx.fillStyle='#e3e9dd';ctx.fillRect(0,0,w,h);ctx.save();ctx.strokeStyle='#82967413';ctx.lineWidth=1;const gap=90,ox=(-camera.x%gap+gap)%gap,oy=(-camera.y%gap+gap)%gap;for(let x=ox;x<w;x+=gap){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=oy;y<h;y+=gap){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.restore();}
let previous=performance.now();
function frame(now){const dt=Math.min((now-previous)/1000,.05);previous=now;const rig=state.rig;
 if(rig){let ix=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0),iy=(keys.has('ArrowDown')||keys.has('s')?1:0)-(keys.has('ArrowUp')||keys.has('w')?1:0);if(Math.hypot(state.joystick.x,state.joystick.y)>.01){ix=state.joystick.x;iy=state.joystick.y;}if(state.mode==='auto'){ix=Math.cos(rig.time*.38);iy=Math.sin(rig.time*.38)*.8;}rig.setInput(ix,iy);rig.maxSpeed=Number($('speed').value);rig.update(dt);
 const {minX,minY,maxX,maxY}=rig.visualBounds();
 const desiredX=(minX+maxX)/2-state.width/2,desiredY=(minY+maxY)/2-state.height/2;
 state.camera.x=damp(state.camera.x,desiredX,2.8,dt);state.camera.y=damp(state.camera.y,desiredY,2.8,dt);
 const pad=18;
 state.camera.x=Math.max(maxX-state.width+pad,Math.min(minX-pad,state.camera.x));
 state.camera.y=Math.max(maxY-state.height+pad,Math.min(minY-pad,state.camera.y));}
 background();if(rig){ctx.save();ctx.translate(-state.camera.x,-state.camera.y);rig.draw(ctx,{debug:$('debug').checked});ctx.restore();}
 state.frames++;if(now-state.lastTelemetry>650){state.fps=Math.round(state.frames*1000/(now-state.lastTelemetry));state.frames=0;state.lastTelemetry=now;$('telemetry').textContent=rig?`${Math.round(Math.hypot(rig.vx,rig.vy))} px/s · ${state.fps} fps`:'';}
 requestAnimationFrame(frame);}
$('creature').addEventListener('change',()=>selectCreature($('creature').value).then(()=>canvas.focus({preventScroll:true})));$('mode').addEventListener('change',()=>{setMode($('mode').value);canvas.focus({preventScroll:true});});$('reset').addEventListener('click',center);
window.addEventListener('keydown',event=>{if(['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;const key=event.key.length===1?event.key.toLowerCase():event.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(key)){event.preventDefault();keys.add(key);if(state.mode!=='manual')setMode('manual');keys.add(key);}});window.addEventListener('keyup',event=>keys.delete(event.key.length===1?event.key.toLowerCase():event.key));window.addEventListener('blur',()=>{keys.clear();releaseJoystick();});
let pointer=null;const stick=$('joystick'),knob=$('knob');
function joystick(event){const b=stick.getBoundingClientRect(),dx=event.clientX-b.left-b.width/2,dy=event.clientY-b.top-b.height/2,m=Math.hypot(dx,dy),radius=b.width*.33;state.joystick={x:dx/Math.max(radius,m),y:dy/Math.max(radius,m)};knob.style.transform=`translate(${state.joystick.x*radius}px,${state.joystick.y*radius}px)`;}
function releaseJoystick(){pointer=null;state.joystick={x:0,y:0};knob.style.transform='';}
stick.addEventListener('pointerdown',event=>{pointer=event.pointerId;stick.setPointerCapture(pointer);setMode('manual');joystick(event);});stick.addEventListener('pointermove',event=>{if(pointer===event.pointerId)joystick(event);});for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,releaseJoystick);
new ResizeObserver(size).observe(canvas);size();
const api={get rig(){return state.rig;},get selected(){return state.selected;},selectCreature,setCreature:selectCreature,setMode,reset:center,snapshot(){return state.rig?{...state.rig.snapshot(),selected:state.selected,camera:{...state.camera},viewport:{width:state.width,height:state.height}}:{loaded:false,id:state.selected,mode:state.mode};}};
window.inkDemo=api;window.inkRigDemo=api;requestAnimationFrame(frame);selectCreature('fish_04').catch(()=>{});
