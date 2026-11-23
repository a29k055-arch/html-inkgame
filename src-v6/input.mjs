const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createInput({canvas, actionButton, joystick, stick, active, zoom}) {
  const pointers = new Map();
  const keys = new Set();
  const directions = {ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],
    KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0]};
  let origin = null, axisX = 0, axisY = 0, actionPointer = null;
  let pinchDistance = 0, pinching = false, actionBlocked = false;
  const held = () => actionPointer !== null || keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('Space');
  function hideStick() {
    origin = null;
    axisX = axisY = 0;
    joystick.hidden = true;
    joystick.classList.remove('active');
    stick.style.transform = '';
  }
  function reset() {
    pointers.clear();
    keys.clear();
    actionPointer = null;
    pinchDistance = 0;
    pinching = actionBlocked = false;
    hideStick();
  }
  function centerAndDistance() {
    const [a,b] = [...pointers.values()];
    return {x:(a.x+b.x)/2, y:(a.y+b.y)/2, d:Math.hypot(a.x-b.x,a.y-b.y)};
  }
  canvas.addEventListener('pointerdown', e => {
    if (!active() || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if (pointers.size === 1) {
      origin = {id:e.pointerId, x:e.clientX, y:e.clientY};
      joystick.style.left = e.clientX+'px'; joystick.style.top = e.clientY+'px';
      joystick.hidden = false;
      joystick.classList.add('active');
    } else {
      hideStick(); pinching = true;
      pinchDistance = centerAndDistance().d;
    }
  });
  function moveWorld(e) {
    if (!pointers.has(e.pointerId) || !active()) return;
    // A mouse released outside the window may re-enter without a pointerup.
    if(e.pointerType==='mouse' && e.buttons===0){releaseWorld(e);return;}
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if (pinching) {
      if (pointers.size === 2) {
        const {x,y,d} = centerAndDistance();
        if (pinchDistance > 4 && d > 4) zoom(clamp(d/pinchDistance, .75, 1.35),x,y);
        pinchDistance = d;
      }
      return;
    }
    if (origin?.id !== e.pointerId) return;
    const dx=e.clientX-origin.x, dy=e.clientY-origin.y, distance=Math.hypot(dx,dy);
    const limit=Math.max(26, joystick.getBoundingClientRect().width*.42 || 38);
    const scale=Math.max(limit,distance);
    axisX=dx/scale; axisY=dy/scale;
    stick.style.transform='translate(-50%,-50%) translate('+axisX*limit+'px,'+axisY*limit+'px)';
  }
  canvas.addEventListener('pointermove',moveWorld);
  function releaseWorld(e) {
    if (!pointers.delete(e.pointerId)) return;
    if (origin?.id===e.pointerId) hideStick();
    if (pointers.size===0) {pinching=false; pinchDistance=0;}
    else if (pinching && pointers.size===2) pinchDistance=centerAndDistance().d;
  }
  for (const event of ['pointerup','pointercancel']) canvas.addEventListener(event,releaseWorld);
  canvas.addEventListener('lostpointercapture',e=>{
    // Chromium can revoke native capture while the primary mouse button is
    // still pressed. The drag continues to belong to its original water point.
    if(e.pointerType==='mouse' && (e.buttons&1))return;
    releaseWorld(e);
  });
  window.addEventListener('pointermove',e=>{
    if(e.pointerType==='mouse' && e.target!==canvas)moveWorld(e);
  });
  window.addEventListener('pointerup',releaseWorld);
  window.addEventListener('pointercancel',releaseWorld);
  canvas.addEventListener('wheel',e=>{
    if (!active()) return;
    e.preventDefault();
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);
    zoom(Math.exp(-clamp(delta,-360,360)*.0016),e.clientX,e.clientY);
  },{passive:false});
  actionButton.addEventListener('pointerdown',e=>{
    if (!active() || actionPointer!==null || e.button!==0) return;
    e.preventDefault(); actionButton.setPointerCapture(e.pointerId); actionPointer=e.pointerId;
  });
  function releaseAction(e) {
    if (actionPointer===e.pointerId) actionPointer=null;
    if (!held()) actionBlocked=false;
  }
  for (const event of ['pointerup','pointercancel','lostpointercapture']) actionButton.addEventListener(event,releaseAction);
  window.addEventListener('keydown',e=>{
    if (!active() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code==='Space' && e.target instanceof HTMLButtonElement && e.target!==actionButton) return;
    if (directions[e.code] || ['ShiftLeft','ShiftRight','Space'].includes(e.code)) {
      e.preventDefault(); keys.add(e.code);
    }
  });
  window.addEventListener('keyup',e=>{keys.delete(e.code);if(!held())actionBlocked=false;});
  window.addEventListener('blur',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  hideStick();
  return {reset,blockAction(){actionBlocked=held();},read(){
    let x=axisX,y=axisY;
    for(const key of keys) if(directions[key]){x+=directions[key][0];y+=directions[key][1];}
    const scale=Math.max(1,Math.hypot(x,y));
    return {x:x/scale,y:y/scale,action:held()&&!actionBlocked};
  }};
}
