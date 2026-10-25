import {heroShotAtlas,shotFrames} from './hero-shot-atlas.js';
// Rotation aligns the Hero wake opposite velocity. No projectile can generate world forces.
export function drawInkShot(c,s,_legacyFrames,hostile=false){const frames=shotFrames();if(!frames.length)return;const phase=s.age*20+(s.seed||0),i=Math.floor(phase)%frames.length,t=phase-Math.floor(phase),a=Math.atan2(s.vy,s.vx),r=s.r,speed=Math.hypot(s.vx,s.vy),stretch=1+Math.min(.22,speed/2800),w=r*12*stretch,h=r*6.67,pulse=1+.025*Math.sin(phase*.8);c.save();c.translate(s.x,s.y);c.rotate(a);c.scale(pulse,1/pulse);for(const [frame,alpha] of [[frames[i],1-t],[frames[(i+1)%frames.length],t]]){c.globalAlpha=alpha;c.drawImage(frame[hostile?1:0],-w*.62,-h*.5,w,h);}c.restore();}
export const preloadInkShots=heroShotAtlas;
