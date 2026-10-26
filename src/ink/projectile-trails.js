import {WorldInkTrail} from '../../prototypes/ink/src/world-trail.js';
export class ProjectileTrails{
 constructor(){this.records=[];this.live=new WeakMap();}
 clear(){this.records.length=0;this.live=new WeakMap();}
 update(lists,dt){for(const record of this.records){record.seen=false;record.trail.advance(dt);}for(const [shots,tint] of lists)for(const shot of shots){if(shot.kind==='spike')continue;const color=shot.team==='player'||shot.friendly?'ink':shot.tint==='cinnabar'||tint==='cinnabar'?'cinnabar':'ink';let record=this.live.get(shot);if(!record||record.id!==shot.trailId||record.tint!==color){record={id:shot.trailId,tint:color,trail:new WorldInkTrail('shot'),seen:true};this.records.push(record);this.live.set(shot,record);}record.seen=true;record.trail.sample(shot.x,shot.y,shot.r,0,Math.hypot(shot.vx,shot.vy));}this.records=this.records.filter(r=>r.seen||r.trail.points.length);if(this.records.length>240)this.records.splice(0,this.records.length-240);}
 draw(c,camera){for(const record of this.records)record.trail.draw(c,record.tint,camera);}
}
