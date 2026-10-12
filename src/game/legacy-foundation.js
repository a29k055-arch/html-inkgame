import {GAME_CONFIG as C,clamp,dist} from './config.js';
export const random=(a,b)=>a+Math.random()*(b-a);
// Adapted from GitHub legacy randomPoint/randomNpcPoint/createFood/moveSpeed.
// No revealAt, obscureNpcTrail, painting state, recoil or fluid fields are imported.
export function randomPoint(){return {x:random(80,C.world.width-80),y:random(80,C.world.height-80)};}
export function randomNpcPoint(player){
 for(let attempt=0;attempt<30;attempt++){
  let point=randomPoint();
  if(Math.random()<.42){const side=Math.floor(random(0,4)),margin=random(90,520);point={x:side===0?margin:side===1?C.world.width-margin:random(90,C.world.width-90),y:side===2?margin:side===3?C.world.height-margin:random(90,C.world.height-90)};}
  if(!player||dist(point,player)>300)return point;
 }
 return randomPoint();
}
export function createFood(point=randomPoint()){
 const r=random(3,7);return {...point,r,mass:r*r,shape:['circle','square','triangle','pentagon'][Math.floor(random(0,4))],rot:random(0,Math.PI*2),alpha:random(.42,.78)};
}
export function moveSpeed(radius){return 235*(1-clamp((radius-C.initialRadius)/(170-C.initialRadius),0,1)*.38);}
export function cameraTarget(player,width,height,mobile){
 const scale=clamp((1.12-(player.r-C.initialRadius)/220)*(mobile?.8:1),mobile?(height>width?.4:.44):.52,1.12);
 return {scale,x:clamp(player.x-width/scale/2,0,Math.max(0,C.world.width-width/scale)),y:clamp(player.y-height/scale/2,0,Math.max(0,C.world.height-height/scale))};
}
