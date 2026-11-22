import {InkCreature,damp,sampleCurve,makeCurve,INK_CREATURE_REV} from '../runtime/ink-creature.mjs?rev=rig-r6-zoom-and-joints-20261122';
const $=id=>document.getElementById(id),canvas=$('stage'),ctx=canvas.getContext('2d'),keys=new Set();
$('build-label').textContent=INK_CREATURE_REV.startsWith('rig-r6-')?'11月22日修订 R6 · 放大检查 / 关节修补':'素材动画 · 版本待核对';
const state={rig:null,selected:'fish_04',mode:'manual',width:1000,height:600,camera:{x:0,y:0},pan:{x:0,y:0},joystick:{x:0,y:0},loading:0,pendingId:null,pendingTextureMode:null,textureMode:'working',rigURL:null,zoom:1,clipped:false,frames:0,fps:0,lastTelemetry:0};
const profiles={
 fish_04:{label:'鱼 04 · 实体衔接版',length:320,note:'柔和转向 · 身体摆动 · 尾鳍推进'},
 fish_01:{label:'鱼 01',length:320,note:'水墨锦鲤 · 尾鳍推进'},
 fish_02:{label:'鱼 02',length:320,note:'舒展锦鲤 · 身体摆动'},
 fish_04_special:{label:'鱼 04 · 原始留白特别版',length:320,note:'保留原画透明墨白洞 · 鳍根衔接保留'},
 dragon_04:{label:'中国龙 04',length:430,note:'持续 S 形蛇行波 · 头尾延迟跟随'},
 shrimp_07:{label:'虾 07',length:230,note:'纸片转身 · 三根长须独立轻摆'},
 shrimp_04:{label:'虾 04',length:230,note:'减笔水墨 · 平滑纸片转身'},
 shrimp_05:{label:'虾 05',length:230,note:'轻淡水墨 · 须臂轻摆'},
 turtle_02:{label:'乌龟 02',length:245,note:'缓慢游动 · 间歇划肢 · 龟壳稳定'},
 turtle_08:{label:'乌龟 08 · 新候选',length:245,note:'新画水墨龟 · 稳定壳面 · 缓慢划肢'}
};
const resolutions=new Map();
const assetURL=relative=>{const u=new URL('../'+relative,location.href);u.searchParams.set('inkRigRev',INK_CREATURE_REV);return u.href;};
const rigRelativeURL=relative=>{const u=new URL(relative,state.rigURL);u.searchParams.set('inkRigRev',INK_CREATURE_REV);return u.href;};
function renderCatalog(){const select=$('creature');select.replaceChildren();for(const species of ['fish','dragon','shrimp','turtle']){const group=document.createElement('optgroup');group.label={fish:'鱼',dragon:'中国龙',shrimp:'虾',turtle:'乌龟'}[species];for(const [id,profile]of Object.entries(profiles))if(id.split('_')[0]===species){const option=document.createElement('option');option.value=id;option.textContent=profile.label||id;group.append(option);}select.append(group);}select.value=state.selected;}
async function loadCatalog(){
 await Promise.allSettled([
  fetch(assetURL('manifest.json')).then(r=>r.ok?r.json():null).then(m=>{for(const item of m?.creatures||[]){const species=item.id.split('_')[0],fallback=profiles[Object.keys(profiles).find(id=>id.split('_')[0]===species)];if(!fallback)continue;profiles[item.id]={...(profiles[item.id]||fallback),label:item.label||profiles[item.id]?.label||item.id,rig:item.rig||`${item.id}/rig.json`};}}),
  fetch(assetURL('RESOLUTIONS.json')).then(r=>r.ok?r.json():null).then(m=>{for(const item of m?.assets||[])resolutions.set(item.id,item);})
 ]);renderCatalog();
}
function renderLayerGallery(){const rig=state.rig;if(!rig)return;$('layer-gallery').replaceChildren();if(!$('layer-panel').open)return;for(const layer of rig.rig.layers){const a=document.createElement('a');a.href=rigRelativeURL(layer.croppedFile||layer.file);a.target='_blank';a.rel='noopener';a.title='查看当前贴图的透明裁片';const img=document.createElement('img');img.src=a.href;img.alt=layer.name;img.loading='lazy';const text=document.createElement('span');text.textContent=layer.name;a.append(img,text);$('layer-gallery').append(a);}}
function showAssetDetails(){
 const rig=state.rig;if(!rig)return;const id=state.selected,res=resolutions.get(id),native=res?.nativeSize||rig.rig.sourceNativeSize||rig.rig.sourceSize,working=res?.workingSize||rig.rig.sourceSize,master=res?.masterSize||rig.rig.masterSize;
 const dimensions=v=>v?.length===2?`${v[0]} × ${v[1]}`:'整理中';
 const clear=res?.recommendedCssLongEdgeAtDpr2||Math.floor(Math.max(...native)/2);
 $('asset-spec').textContent=`原生 ${dimensions(native)} · 工作图 ${dimensions(working)} · 母版 ${dimensions(master)} · 2倍屏幕推荐清晰长边约 ≤ ${clear}px`;
 $('source-link').href=rigRelativeURL(rig.rig.sourceFile||rig.rig.source||'source.png');$('working-link').href=rigRelativeURL('assembled-restored.png');$('working-link').textContent=state.textureMode==='master'?'当前4K合成图':'工作合成图';$('rig-link').href=state.rigURL;
 $('master-preview-link').hidden=!res?.masterPreview;$('master-rig-link').hidden=!res?.masterRig;
 if(res?.masterPreview)$('master-preview-link').href=assetURL(res.masterPreview);if(res?.masterRig)$('master-rig-link').href=assetURL(res.masterRig);
 $('texture-mode').querySelector('[value="master"]').disabled=!res?.masterRig;$('texture-mode').value=state.textureMode;
 $('layer-summary').textContent=`查看独立分层（${rig.rig.layers.length}）`;$('layer-panel').open=false;renderLayerGallery();
}
function displayLength(id){const shrimp=id.split('_')[0]==='shrimp';return Math.min(profiles[id].length,state.height*(shrimp?.48:.72),state.width*(shrimp?.48:.7));}
function viewCenter(r=state.rig){
 if(!r)return{x:state.width/2,y:state.height/2};
 if(r.mode!=='rest')return r.mapPoint(.45,0);
 if(r.species==='shrimp')return{x:r.x,y:r.y};
 const head=sampleCurve(r.sourceCurve,0),mid=sampleCurve(r.sourceCurve,.45),angle=r.heading+Math.PI-Math.atan2(head.ty,head.tx),scale=r.length/r.sourceCurve.length,dx=(mid.x-head.x)*scale,dy=(mid.y-head.y)*scale;
 return{x:r.x+Math.cos(angle)*dx-Math.sin(angle)*dy,y:r.y+Math.sin(angle)*dx+Math.cos(angle)*dy};
}
function screenPoint(p){return{x:state.width/2+state.pan.x+(p.x-state.camera.x)*state.zoom,y:state.height/2+state.pan.y+(p.y-state.camera.y)*state.zoom};}
function size(){const r=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);state.width=r.width;state.height=r.height;canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);if(state.rig){state.rig.length=displayLength(state.selected);state.rig.pose=state.rig.buildPose();state.rig.targetCurve=makeCurve(state.rig.pose,false);state.camera=viewCenter();}}
function center(){const r=state.rig;if(!r)return;const heading=r.species==='shrimp'?0:-Math.PI/2,offset=r.species==='shrimp'?0:r.length*.35;r.reset(state.width/2+Math.cos(heading)*offset,state.height/2+Math.sin(heading)*offset,heading);state.camera=viewCenter();state.pan={x:0,y:0};}
function setZoom(value){const next=Math.max(.25,Math.min(6,Number.isFinite(Number(value))?Number(value):1)),previous=state.zoom,pivot=viewCenter();state.camera.x=pivot.x-(pivot.x-state.camera.x)*previous/next;state.camera.y=pivot.y-(pivot.y-state.camera.y)*previous/next;state.zoom=next;$('zoom').value=String(next);$('zoom-value').textContent=next.toFixed(2)+'×';return next;}
function setPan(x,y){state.pan={x:Number.isFinite(Number(x))?Number(x):0,y:Number.isFinite(Number(y))?Number(y):0};return{...state.pan};}
function centerView(){return setPan(0,0);}
function resetZoom(){setZoom(1);centerView();}
function transferMotion(from,to){
 for(const key of ['x','y','heading','targetHeading','angularVelocity','angularAcceleration','facing','desiredFacing','shrimpTurnProgress','shrimpTurnVelocity','inclination','inclinationVelocity','vx','vy','time','drive','locomotion','wavePhase','finPhase','gaitPhase','mode','length','maxSpeed'])to[key]=from[key];
 to.input={...from.input};to.history=from.history.map(item=>({...item}));to.offsets=new Map(from.offsets);to.pose=to.buildPose();to.targetCurve=makeCurve(to.pose,false);
}
async function loadCreature(id,textureMode,preserveMotion=false){
 if(!profiles[id])throw Error('Unknown creature');if(!['working','master'].includes(textureMode))throw Error('Unknown texture mode');
 const res=resolutions.get(id),mode=textureMode==='master'&&res?.masterRig?'master':'working',path=mode==='master'?res.masterRig:profiles[id].rig||`${id}/rig.json`,url=assetURL(path),ticket=++state.loading;
 state.pendingId=id;state.pendingTextureMode=mode;$('texture-mode').value=mode;$('status').hidden=false;$('status').textContent=mode==='master'?'正在按需载入4K母版，当前角色继续活动…':'正在载入工作贴图…';
 try{
  const rig=await InkCreature.load(url,{length:displayLength(id),speed:Number($('speed').value)});
  if(ticket!==state.loading){rig.dispose();return state.rig;}
  const previous=state.rig,keep=preserveMotion&&previous&&state.selected===id;
  if(keep)transferMotion(previous,rig);else rig.setMode(state.mode);
  state.rig=rig;state.selected=id;state.textureMode=mode;state.rigURL=url;state.pendingId=null;state.pendingTextureMode=null;
  $('creature').value=id;$('texture-mode').value=mode;if(!keep)center();previous?.dispose();
  $('species-note').textContent=profiles[id].note;$('layer-count').textContent=`${rig.rig.layers.length} 层 · PNG + 连续骨架`;showAssetDetails();$('status').hidden=true;return rig;
 }catch(error){if(ticket===state.loading){state.pendingId=null;state.pendingTextureMode=null;$('creature').value=state.selected;$('texture-mode').value=state.textureMode;$('status').textContent='贴图载入失败，当前角色仍可操作：'+error.message;}throw error;}
}
function selectCreature(id){return loadCreature(id,state.pendingTextureMode||state.textureMode,false);}
function setTextureMode(mode){
 if(!['working','master'].includes(mode))return Promise.reject(Error('Unknown texture mode'));
 if(state.rig&&state.pendingId===null&&mode===state.textureMode)return Promise.resolve(state.rig);
 if(state.rig&&state.selected===(state.pendingId||state.selected)&&mode===state.textureMode){state.loading++;state.pendingId=null;state.pendingTextureMode=null;$('texture-mode').value=mode;$('status').hidden=true;return Promise.resolve(state.rig);}
 return loadCreature(state.pendingId||state.selected,mode,true);
}
function setMode(mode){state.mode=mode;$('mode').value=mode;state.rig?.setMode(mode);keys.clear();state.joystick={x:0,y:0};if(mode==='straight'||mode==='rest')center();}
function background(){const {width:w,height:h,camera,zoom,pan}=state;ctx.fillStyle='#e3e9dd';ctx.fillRect(0,0,w,h);ctx.save();ctx.strokeStyle='#82967413';ctx.lineWidth=1;const gap=90*zoom,ox=((w/2+pan.x-camera.x*zoom)%gap+gap)%gap,oy=((h/2+pan.y-camera.y*zoom)%gap+gap)%gap;for(let x=ox;x<w;x+=gap){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=oy;y<h;y+=gap){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.restore();}
let previous=performance.now();
function frame(now){const dt=Math.min((now-previous)/1000,.05);previous=now;const rig=state.rig;
 if(rig){let ix=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0),iy=(keys.has('ArrowDown')||keys.has('s')?1:0)-(keys.has('ArrowUp')||keys.has('w')?1:0);if(Math.hypot(state.joystick.x,state.joystick.y)>.01){ix=state.joystick.x;iy=state.joystick.y;}if(state.mode==='auto'){ix=Math.cos(rig.time*.38);iy=Math.sin(rig.time*.38)*.8;}rig.setInput(ix,iy);rig.maxSpeed=Number($('speed').value);rig.update(dt);
 const focus=viewCenter(rig),tracking=14*Math.max(1,state.zoom);state.camera.x=damp(state.camera.x,focus.x,tracking,dt);state.camera.y=damp(state.camera.y,focus.y,tracking,dt);
 const bounds=rig.visualBounds(),a=screenPoint({x:bounds.minX,y:bounds.minY}),b=screenPoint({x:bounds.maxX,y:bounds.maxY});state.clipped=a.x<0||a.y<0||b.x>state.width||b.y>state.height;
 $('zoom-crop-note').hidden=!state.clipped;$('view-metrics').textContent=`${state.zoom.toFixed(2)}× · 角色屏幕长 ${Math.round(rig.length*state.zoom)}px · ${state.textureMode==='master'?'4K母版':'工作贴图'} ${rig.bodyImage.width} × ${rig.bodyImage.height}`;}
 background();if(rig){ctx.save();ctx.translate(state.width/2+state.pan.x,state.height/2+state.pan.y);ctx.scale(state.zoom,state.zoom);ctx.translate(-state.camera.x,-state.camera.y);rig.draw(ctx,{debug:$('debug').checked});ctx.restore();}
 state.frames++;if(now-state.lastTelemetry>650){state.fps=Math.round(state.frames*1000/(now-state.lastTelemetry));state.frames=0;state.lastTelemetry=now;$('telemetry').textContent=rig?`${Math.round(Math.hypot(rig.vx,rig.vy))} px/s · ${state.fps} fps`:'';}
 requestAnimationFrame(frame);}
$('creature').addEventListener('change',()=>selectCreature($('creature').value).then(()=>canvas.focus({preventScroll:true})).catch(()=>{}));$('mode').addEventListener('change',()=>{setMode($('mode').value);canvas.focus({preventScroll:true});});$('reset').addEventListener('click',center);
$('zoom').addEventListener('input',()=>setZoom(Number($('zoom').value)));$('zoom-in').addEventListener('click',()=>setZoom(state.zoom*1.25));$('zoom-out').addEventListener('click',()=>setZoom(state.zoom/1.25));$('zoom-reset').addEventListener('click',resetZoom);$('view-center').addEventListener('click',centerView);$('texture-mode').addEventListener('change',()=>setTextureMode($('texture-mode').value).then(()=>canvas.focus({preventScroll:true})).catch(()=>{}));
$('layer-panel').addEventListener('toggle',renderLayerGallery);
window.addEventListener('keydown',event=>{if(['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;const key=event.key.length===1?event.key.toLowerCase():event.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(key)){event.preventDefault();keys.add(key);if(state.mode!=='manual')setMode('manual');keys.add(key);}});window.addEventListener('keyup',event=>keys.delete(event.key.length===1?event.key.toLowerCase():event.key));window.addEventListener('blur',()=>{keys.clear();releaseJoystick();releasePan();});
let pointer=null;const stick=$('joystick'),knob=$('knob');
function joystick(event){const b=stick.getBoundingClientRect(),dx=event.clientX-b.left-b.width/2,dy=event.clientY-b.top-b.height/2,m=Math.hypot(dx,dy),radius=b.width*.33;state.joystick={x:dx/Math.max(radius,m),y:dy/Math.max(radius,m)};knob.style.transform=`translate(${state.joystick.x*radius}px,${state.joystick.y*radius}px)`;}
function releaseJoystick(){pointer=null;state.joystick={x:0,y:0};knob.style.transform='';}
stick.addEventListener('pointerdown',event=>{pointer=event.pointerId;stick.setPointerCapture(pointer);setMode('manual');joystick(event);});stick.addEventListener('pointermove',event=>{if(pointer===event.pointerId)joystick(event);});for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,releaseJoystick);
let panPointer=null,panStart=null;
function releasePan(){panPointer=null;panStart=null;canvas.classList.remove('panning');}
canvas.addEventListener('pointerdown',event=>{if(panPointer!==null||event.pointerType==='mouse'&&event.button!==0)return;panPointer=event.pointerId;panStart={x:event.clientX,y:event.clientY,offset:{...state.pan}};canvas.setPointerCapture(panPointer);canvas.classList.add('panning');canvas.focus({preventScroll:true});event.preventDefault();});
canvas.addEventListener('pointermove',event=>{if(panPointer===event.pointerId&&panStart){setPan(panStart.offset.x+event.clientX-panStart.x,panStart.offset.y+event.clientY-panStart.y);event.preventDefault();}});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>{if(panPointer===event.pointerId)releasePan();});
new ResizeObserver(size).observe(canvas);size();
const api={get rig(){return state.rig;},get selected(){return state.selected;},selectCreature,setCreature:selectCreature,setMode,setZoom,setTextureMode,setPan,centerView,resetZoom,screenPoint,reset:center,snapshot(){return state.rig?{...state.rig.snapshot(),selected:state.selected,camera:{...state.camera},cameraConvention:'world-center',viewport:{width:state.width,height:state.height},zoom:state.zoom,pan:{...state.pan},panCoordinateSpace:'css-pixels',panning:panPointer!==null,textureMode:state.textureMode,pendingTextureMode:state.pendingTextureMode,loading:state.pendingId!==null,textureSize:[state.rig.bodyImage.width,state.rig.bodyImage.height],displayLengthPx:state.rig.length*state.zoom,length:state.rig.length,simulationTime:state.rig.time,input:{...state.rig.input},viewCenter:viewCenter(),viewCenterScreen:screenPoint(viewCenter()),clipped:state.clipped,rigURL:state.rigURL}:{loaded:false,id:state.selected,mode:state.mode,loading:state.pendingId!==null,zoom:state.zoom,pan:{...state.pan}};}};
window.inkDemo=api;window.inkRigDemo=api;renderCatalog();requestAnimationFrame(frame);loadCatalog().then(()=>selectCreature('fish_04')).catch(()=>{});
