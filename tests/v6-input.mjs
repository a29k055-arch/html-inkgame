import {createCamera} from '../src-v6/view.mjs';
// Deterministic pointer ownership regression. The browser/device UI pass is reported separately.
import assert from 'node:assert/strict';
import {createInput} from '../src-v6/input.mjs';
import {makeLevel} from '../src-v6/levels.mjs';
import {createWorld,stepWorld} from '../src-v6/sim.mjs';

class Surface extends EventTarget {
  style = {};
  classList = {add(){}, remove(){}};
  setPointerCapture(){}
  getBoundingClientRect(){ return {width:90}; }
}
globalThis.window = new EventTarget();
globalThis.document = new EventTarget();
globalThis.HTMLButtonElement = Surface;
const canvas = new Surface(), actionButton = new Surface(), joystick = new Surface(), stick = new Surface();
const zooms = [];
let playing = true;
const input = createInput({canvas,actionButton,joystick,stick,active:()=>playing,
  zoom:(factor,x,y)=>zooms.push({factor,x,y})});
const send = (surface,type,fields={}) => {
  const evt = Object.assign(new Event(type,{cancelable:true}),fields);
  surface.dispatchEvent(evt);
};
const finger = (id,x,y) => ({pointerType:'touch',pointerId:id,button:0,clientX:x,clientY:y});
const rest = {x:0,y:0,action:false};

send(canvas,'pointerdown',finger(1,100,200));
send(canvas,'pointermove',finger(1,175,200));
assert.equal(input.read().x,1);
send(actionButton,'pointerdown',finger(2,350,500));
assert.deepEqual(input.read(),{x:1,y:0,action:true});
assert.equal(zooms.length,0);
input.blockAction();
assert.equal(input.read().action,false);
send(actionButton,'lostpointercapture',finger(2,350,500));
send(actionButton,'pointerdown',finger(3,350,500));
assert.equal(input.read().action,true);
send(actionButton,'pointerup',finger(3,350,500));
send(canvas,'pointerdown',finger(4,200,200));
assert.deepEqual(input.read(),rest);
send(canvas,'pointermove',finger(4,260,200));
assert.ok(zooms.at(-1).factor>1);
send(canvas,'pointerup',finger(4,260,200));
send(canvas,'pointermove',finger(1,180,200));
assert.deepEqual(input.read(),rest);
send(canvas,'pointerup',finger(1,180,200));
send(canvas,'pointerdown',finger(5,220,260));
send(canvas,'pointermove',finger(5,224,260));
assert.ok(input.read().x>0 && input.read().x<.25);
send(canvas,'pointercancel',finger(5,224,260));
assert.deepEqual(input.read(),rest);
send(canvas,'wheel',{deltaY:-120,deltaMode:0,clientX:130,clientY:140});
assert.ok(zooms.at(-1).factor>1);
assert.equal(zooms.at(-1).x,130);
send(window,'keydown',{code:'KeyW'});
send(window,'keydown',{code:'ShiftLeft'});
assert.deepEqual(input.read(),{x:0,y:-1,action:true,keyboard:true});
send(window,'blur');
assert.deepEqual(input.read(),rest);
// A composited canvas can lose pointer capture on the first mouse movement
// while buttons still indicates a held drag. Continue until the real release.
const mouse={pointerType:'mouse',pointerId:20,button:0,buttons:1,clientX:100,clientY:120};
send(canvas,'pointerdown',mouse);
send(canvas,'lostpointercapture',mouse);
send(window,'pointermove',{...mouse,clientX:170});
assert.equal(input.read().x,1);
send(window,'pointerup',{...mouse,buttons:0});
assert.deepEqual(input.read(),rest);
// The keyboard and arrow bindings must describe a full turn at normal speed,
// including the changing body radius and actual prey in the open pond.
for(const keys of [['KeyD','KeyS','KeyA','KeyW'],['ArrowRight','ArrowUp','ArrowLeft','ArrowDown']]){
  const world=createWorld(makeLevel('trial',343)),p=world.player,points=[];
  send(window,'keydown',{code:keys[0]});
  for(let f=0;f<60;f++)stepWorld(world,input.read(),1/60);
  const start={x:p.x,y:p.y};
  for(let quarter=0;quarter<4;quarter++){
    send(window,'keyup',{code:keys[quarter]});
    send(window,'keydown',{code:keys[(quarter+1)%4]});
    for(let f=0;f<20;f++){
      stepWorld(world,input.read(),1/60);
      points.push({x:p.x,y:p.y});
    }
  }
  const cx=points.reduce((sum,b)=>sum+b.x,0)/points.length,cy=points.reduce((sum,b)=>sum+b.y,0)/points.length;
  const radii=points.map(b=>Math.hypot(b.x-cx,b.y-cy));
  assert.ok(Math.max(...radii)/Math.min(...radii)<1.05);
  assert.ok(Math.hypot(p.x-start.x,p.y-start.y)<1);
  send(window,'blur');
}
playing=false;
send(canvas,'pointerdown',finger(5,0,0));
send(canvas,'pointermove',finger(5,100,0));
send(actionButton,'pointerdown',finger(6,20,20));
assert.deepEqual(input.read(),rest);
console.log('V6 input event regression passed (desktop axes, buttons, touch ownership, pinch, wheel, cancellation and blur).');

// The camera centre is also used by the fluid, the player ring and the minimap.
for(const [width,height,barBottom] of [[1440,900,53],[390,844,43],[844,390,53]]){
  const view={clientWidth:width,clientHeight:height,getBoundingClientRect:()=>({left:0,top:0})};
  const world={width:2500,height:1450,player:{x:520,y:710,r:20,vx:0,vy:0}};
  const camera=createCamera(view,{getBoundingClientRect:()=>({bottom:barBottom})});
  const base=camera.reset(world).scale;
  let screen=camera.introduce(world,3);
  assert.ok(screen.scale>base*3 && screen.x===world.player.x && screen.y===world.player.y);
  let prior=screen.scale;
  for(let i=0;i<181;i++){
    screen=camera.update(world,1/60);
    assert.ok(screen.scale<=prior+1e-8);prior=screen.scale;
  }
  assert.ok(Math.abs(screen.scale-base)<1e-7);
  camera.zoom(world,.001,width/2,height/2);
  screen=camera.inspect(world,0,0);
  const y0=height/2-screen.y*screen.scale;
  assert.ok(y0>=barBottom+10,'Map frame crosses the mass bar');
  assert.ok(y0+world.height*screen.scale<=height-8,'Bottom of the pond clipped');
}
