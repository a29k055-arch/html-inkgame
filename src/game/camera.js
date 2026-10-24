import {GAME_CONFIG as C,CAMERA_CONFIG as B,clamp} from './config.js';
import {cameraTarget} from './legacy-foundation.js';
export function followCamera(old,player,width,height,mobile,dt=0,fresh=false,focus=null,world=C.world){let goal=cameraTarget(player,width,height,mobile).scale;const paired=focus&&Math.hypot(player.x-focus.x,player.y-focus.y)<1400;
 if(paired)goal=Math.min(goal,Math.max(B.bossMin,Math.min(width/(Math.abs(player.x-focus.x)*2+2*(focus.r+50)),height/(Math.abs(player.y-focus.y)*2+2*(focus.r+80)))));
 const floor=Math.max(width/world.width,height/world.height,mobile?B.mobileMin:B.desktopMin);goal=Math.max(goal,floor);const scale=Math.max(floor,old.scale+(goal-old.scale)*(fresh?1:1-Math.exp(-dt*2.76))),anchor=paired&&mobile?.68:.5,blend=fresh?1:1-Math.exp(-dt*5),cx=old.x+width/old.scale/2,cy=old.y+height/old.scale*anchor;
 return {scale,x:clamp(cx+(player.x-cx)*blend-width/scale/2,0,Math.max(0,world.width-width/scale)),y:clamp(cy+(player.y-cy)*blend-height/scale*anchor,0,Math.max(0,world.height-height/scale))};}
