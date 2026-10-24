import {GAME_CONFIG as C,clamp,dist} from './config.js';
import {random} from './legacy-foundation.js';
// Personality stays internal. Each controller has its own reaction, awareness and aim skill.
export const AI_PROFILES={
 aggressive:{waterTolerance:220,waterSeconds:2.5,risk:.9,hunt:1.7,food:.7,items:.8,reaction:.32,skill:.65},
 conservative:{waterTolerance:0,waterSeconds:0,risk:.25,hunt:.25,food:1.4,items:.8,reaction:.48,skill:.62},
 flee:{waterTolerance:0,waterSeconds:0,risk:.12,hunt:.08,food:1.1,items:.5,reaction:.30,skill:.58},
 opportunist:{waterTolerance:180,waterSeconds:2,risk:.55,hunt:1.1,food:.9,items:1.8,reaction:.37,skill:.76},
 expert:{waterTolerance:150,waterSeconds:1.8,risk:.7,hunt:1.45,food:1.2,items:1.4,reaction:.20,skill:.96},
 balanced:{waterTolerance:90,waterSeconds:1.2,risk:.5,hunt:.85,food:1.1,items:1,reaction:.52,skill:.55},
 novice:{waterTolerance:70,waterSeconds:1,risk:.65,hunt:.55,food:.85,items:.65,reaction:.95,skill:.23},
};
export function aiController(index){const personality=Object.keys(AI_PROFILES)[index%7],profile=AI_PROFILES[personality];return {type:'ai',personality,profile:{...profile,reaction:profile.reaction*random(.8,1.25),skill:clamp(profile.skill+random(-.08,.08),.1,1)},think:random(0,.7),goal:null,intent:'wander',chaseTime:0,previousDistance:Infinity,routeSeed:random(0,6.28)};}
function threatCost(point,threats,e,game){let cost=0;for(const t of threats){const d=dist(point,t),reach=game.radius(t)+game.radius(e)+190;if(d<reach)cost+=(reach-d)/reach*(1+game.radius(t)/game.radius(e));}return cost;}
export function chooseGoal(game,e){
 const ctrl=e.controller,p=ctrl.profile,own=game.radius(e),perception=C.aiPerceptionRange*(.65+p.skill*.7);
 const nearby=game.entities.filter(o=>o!==e&&!o.dead&&!o.effects.water&&dist(o,e)<perception);
 const threats=nearby.filter(o=>game.radius(o)>own*1.06);
 const immediate=threats.filter(o=>dist(o,e)<own+game.radius(o)+100+(1-p.risk)*200).sort((a,b)=>dist(a,e)-dist(b,e))[0];
 const center=game.center,edge=dist(e,center)>game.safeRadius-e.r-70;
 ctrl.threats=threats;ctrl.danger=immediate||null;ctrl.prey=null;
 const waterDepth=Math.max(0,dist(e,center)+e.r+70-game.safeRadius),waterLimit=p.waterTolerance||0;const forcedWater=edge&&(waterDepth>waterLimit||(ctrl.waterExposure||0)>(p.waterSeconds||0));if(forcedWater){ctrl.intent='water';return {x:center.x,y:center.y};}
 if(immediate){
  // Fan candidate routes: escape away from threats while avoiding walls/water and dead ends.
  const away=Math.atan2(e.y-immediate.y,e.x-immediate.x);let best=null,bestScore=-Infinity;
  for(const offset of [-1,-.5,0,.5,1]){const a=away+offset,point={x:clamp(e.x+Math.cos(a)*420,e.r+30,C.world.width-e.r-30),y:clamp(e.y+Math.sin(a)*420,e.r+30,C.world.height-e.r-30)};const score=dist(point,immediate)-threatCost(point,threats,e,game)*220-Math.max(0,dist(point,center)-game.safeRadius+60)*2;if(score>bestScore){bestScore=score;best=point;}}
  ctrl.intent='flee';return best;
 }
 let goal=null,best=-Infinity,intent='forage';
 for(const prey of nearby){
  const sizeRatio=own/game.radius(prey),distance=dist(e,prey);if(sizeRatio<1.12||prey.invincible||p.hunt<.15||dist(prey,center)>game.safeRadius-e.r+waterLimit)continue;
  const speedRatio=game.speed(e)/game.speed(prey),closing=distance/Math.max(25,game.speed(e));
  if(speedRatio<.86&&distance>own+140)continue;
  const previous=ctrl.goal?.id===prey.id;if(previous&&ctrl.chaseTime>4.5&&distance>own+100&&distance>=ctrl.previousDistance-8)continue;
  const reward=prey.mass*C.npcGain/(e.mass+200),risk=threatCost(prey,threats,e,game);
  const score=p.hunt*(reward+1.1)/(1+closing*.65)-risk*(2-p.risk)-Math.max(0,dist(prey,center)+e.r-game.safeRadius)/Math.max(1,waterLimit)*.8;
  if(score>best){best=score;goal={id:prey.id,x:prey.x+prey.vx*.3*p.skill,y:prey.y+prey.vy*.3*p.skill};intent='hunt';ctrl.prey=prey;}
 }
 // Linear scan avoids sorting the whole food list for every NPC.
 for(const food of game.foods){const distance=dist(e,food);if(distance>perception||dist(food,center)>game.safeRadius-45+waterLimit*.65)continue;const score=p.food*(.65+food.mass/60)/(1+distance/110)-threatCost(food,threats,e,game)*(2-p.risk)-Math.max(0,dist(food,center)+45-game.safeRadius)/Math.max(1,waterLimit)*1.2;if(score>best){best=score;goal={x:food.x,y:food.y};intent='forage';}}
 if(e.skills.length<2)for(const item of game.items){const distance=dist(e,item);if(distance>perception||dist(item,center)>game.safeRadius-45)continue;const score=p.items*1.7/(1+distance/150)-threatCost(item,threats,e,game)*2;if(score>best){best=score;goal={x:item.x,y:item.y};intent='item';}}
 if(!goal){ctrl.intent=edge?'water':'wander';return edge?{...center}:game.spawnPoint();}
 if(intent==='hunt'&&ctrl.goal?.id===goal.id)ctrl.chaseTime+=p.reaction;else ctrl.chaseTime=0;
 ctrl.previousDistance=dist(e,goal);ctrl.intent=intent;return goal;
}
export function aiDirection(game,e,dt){
 const ctrl=e.controller;ctrl.waterExposure=dist(e,game.center)+e.r>game.safeRadius?(ctrl.waterExposure||0)+dt:0;ctrl.think-=dt;if(ctrl.think<=0||!ctrl.goal){ctrl.goal=chooseGoal(game,e);ctrl.think=ctrl.profile.reaction*random(.8,1.3);}
 let dx=ctrl.goal.x-e.x,dy=ctrl.goal.y-e.y,n=Math.hypot(dx,dy)||1;dx/=n;dy/=n;
 // Legacy NPC-to-NPC avoidance, updated to include the human using the same strength rules.
 for(const other of game.entities){if(other===e||other.dead)continue;const d=dist(e,other),reach=e.r+other.r+150;if(d<1||d>reach)continue;const danger=game.radius(other)>game.radius(e)*1.06;const sameTarget=ctrl.goal.id===other.id;if(sameTarget&&!danger)continue;const weight=(reach-d)/reach*(danger?2.8: .35);dx+=(e.x-other.x)/d*weight;dy+=(e.y-other.y)/d*weight;}
 const margin=e.r+75;dx+=(e.x<margin?.6:e.x>C.world.width-margin?-.6:0);dy+=(e.y<margin?.6:e.y>C.world.height-margin?-.6:0);
 if(ctrl.personality==='novice'){ctrl.routeSeed+=dt;dx+=Math.sin(ctrl.routeSeed)*.14;dy+=Math.cos(ctrl.routeSeed*1.3)*.14;}
 n=Math.hypot(dx,dy)||1;return {x:dx/n,y:dy/n};
}
export function shouldUseSkill(game,e){const id=e.skills[0]?.id,c=e.controller;if(!id)return false;if(id==='water'||id==='shield')return !!c.danger;if(id==='dense')return c.intent==='hunt'&&!!c.prey&&dist(e,c.prey)<220;if(id==='absorb')return c.intent==='forage'&&game.foods.filter(f=>dist(e,f)<100).length>=3;if(id==='splash')return !!c.prey&&dist(e,c.prey)<C.splashRange;return false;}
