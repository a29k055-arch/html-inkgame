import {LivingWorld,REWARD_SPECIES} from './living-world.js';
import {assignItemTier,collectTieredItem,expireItemTiers,ITEM_TIERS,MANUAL_RUSH_TIERS} from './item-tiers.js';
import {GrowthJourney} from './growth-stages.js';
import {GrowthEcology} from './growth-ecology.js';
import {Inkstone} from '../game/inkstone.js';
import {REVEAL_CONFIG as C} from './config.js';
import {RevealMask,consumeBloomRadius} from './mask.js';
import {TemporaryReveal} from './temporary.js';
import {PondHabitat} from './pond-habitat.js';
import {POND_RULES,POND_ANIMALS,touchingEdiblePondObject} from './pond-rules.js';
import {dist,clamp} from '../game/config.js';
import {gainReserve,spendReserve,syncReserve} from '../game/ink-reserve.js';
export const REVEAL_PICKUPS=Object.freeze(['flower']);
export class RevealRun {
 constructor(onEvent=()=>{},config={},id=globalThis.crypto?.randomUUID?.()||String(Date.now())){this.config={...C,...config,growthStages:{...C.growthStages,...config.growthStages}};this.id=id;this.onEvent=onEvent;this.mask=new RevealMask(this.config);this.temporary=new TemporaryReveal(this.mask,this.config);const c=this.config;this.world={width:c.width,height:c.height};this.state='playing';this.elapsed=0;this.finalTime=0;this.sheltered=false;this.boostHeld=false;this.shelterFrames=0;this.boostPhase='ready';this.boostActive=0;this.boostTimer=0;this.chargeInk=0;this.erosionClock=0;this.maskClock=0;this.paintClock=0;this.itemClock=this.config.itemInterval;this.goalReached=false;this.inkWeights=config.inkWeights?Float32Array.from(config.inkWeights,v=>Math.max(0,Math.min(1,Number(v)||0))):null;if(this.inkWeights&&this.inkWeights.length!==this.mask.cells.length)throw new RangeError('Painting ink weights must match reveal grid');this.inkWeightTotal=this.mask.setWeights(this.inkWeights);this.metrics={enemyBlooms:0,foodPickups:0,pickups:0,eroded:0};this.journey=new GrowthJourney(c.growthStages);this.ecology=new GrowthEcology(()=>this.journey.stage,c.ecology);this.arena=new Inkstone((type,data)=>this.event(type,data),{world:this.world,aiCount:c.aiCount,foodTarget:c.foodTarget,foodSpawnRate:c.foodSpawnRate,duration:c.duration||Infinity,startInk:c.growthStages.startInk,reserveRules:{minimumRespawnInk:c.growthStages.startInk,minimumRadius:c.growthStages.initialRadius,sizeMassPerInk:c.growthStages.sizeMassPerInk,maxRadius:c.growthStages.maxRadius,sizeLinear:c.growthStages.sizeLinear,temporaryInkSize:true},foodRewards:c.foodRewards,competitor:c.competitor,npcSpawner:(...args)=>this.ecology.spawn(...args),autoFinish:false,reserveGrowth:true,rewardChoices:false,simplePickups:true,shrink:false,rushSpeed:c.boostSpeed,playerSheltered:()=>this.sheltered,npcPredation:c.npcPredation,playerLethalRatio:c.playerLethalRatio,softDown:c.softDown,npcMaxRadius:c.npcMaxRadius,npcRespawnSizes:c.npcRespawnSizes,npcFoodGainScale:c.npcFoodGainScale,playerSpeedPenalty:c.playerSpeedPenalty,boundarySliding:true,movement:c.movement,growthBalance:c.growth,magnetRules:c.items,combatRules:c.combat,behavior:c.behavior});this.arena.ranged=null;this.player.revealJourney=this.journey;this.ecology.seedFood(this.arena);this.player.temporarySizeScale=c.items.giantScale;for(const e of this.arena.entities){this.arena.constrain(e);if(e!==this.player)e.v4Visual=true;}this.arena.player.choices.pending=0;this.lastPaint={x:this.player.x,y:this.player.y};this.habitat=new PondHabitat(this.arena,{...c.pond,nurseryLeaf:true,playerSpawnClearance:70,initialAnimals:c.initialItems,prepareAnimal:item=>assignItemTier(item,this.journey.stage),...(config.pond||{})});this.metrics.habitat=this.habitat.stats;this.living=new LivingWorld(this,config.living);this.metrics.living={rewardPickups:0,dragonArrivals:0};}
 get player(){return this.arena.player;}
 // Both values are maintained incrementally by RevealMask; no per-frame grid scan remains.
 get completion(){return this.mask.completion;}
 get inkCompletion(){return this.mask.weightedCompletion;}
 get hasInkTarget(){return this.mask.weightTotal>1e-6;}
 checkGoal(){if(this.completion>=this.config.completionThreshold)return this.complete('area');if(this.hasInkTarget&&this.inkCompletion>=this.config.inkCompletionThreshold)return this.complete('ink');return false;}
 spawnPickup(kind='flower'){return !!this.habitat.spawn(kind);}
 applyInkContact(image,camera,w,h){if(this.state==='playing'){this.temporary.applyContact(image,camera,w,h,this.elapsed);this.checkGoal();}return this.completion;}
 get finished(){return this.state==='finished';}
 event(type,data){if(type==='consume'&&data.entity===this.player){if(data.kind==='enemy'){const radius=consumeBloomRadius(data.coreRadius??data.r,this.config);// The consumed body owns the drop center, shared by the mask and visual source.
const dx=clamp(data.x,0,this.world.width-1),dy=clamp(data.y,0,this.world.height-1);this.mask.reveal(dx,dy,radius,{kind:'enemy'});this.metrics.enemyBlooms++;if(data.rewardGlow&&data.rewardKind)this.applyLivingReward(data.rewardKind,data.rewardTier||1,data);this.onEvent('bloom',{...data,x:dx,y:dy,revealRadius:radius});}else {this.metrics.foodPickups++;this.onEvent('food-ink',data);}}if(type==='death'&&data===this.player)this.living?.clearForm();if(type==='respawn'){delete data.erasePrevious;if(data!==this.player)data.v4Visual=true;}if(type==='respawn'&&data===this.player){this.lastPaint={x:data.x,y:data.y};this.sheltered=false;this.boostPhase='ready';this.boostHeld=false;this.boostTimer=0;const moved=this.journey.recalculate(data);if(moved)this.onEvent('growth-stage',moved);}this.onEvent(type,data);}
 // Manual bloom keeps its original stage strength, independently of stronger fish.
 stageBoost(){const tiers=MANUAL_RUSH_TIERS,stage=this.journey?.stage||1;return stage<=1?tiers[0]:stage===2?tiers[1]:tiers[2];}
 setBoostHeld(held){return this.boost(held);}
 // Ready -> using -> short release cooldown. A sub-second tap has no drop or cooldown.
 boostReady(){return this.boostPhase==='ready';}
 // Hold to bloom: press = speed and ink cost; release after 1 s = one drop plus a short cooldown.
 boost(held=true){
  if(this.state!=='playing'||this.player.dead){this.boostHeld=false;this.finishBoost(true);return false;}
  held=!!held;
  if(held&&this.boostPhase==='ready'){this.boostPhase='using';this.boostActive=0;this.chargeInk=0;this.onEvent('boost',this.player);}
  if(!held&&this.boostPhase==='using')this.finishBoost();
  this.boostHeld=held;this.arena.rushSpeed=this.stageBoost();return this.boostPhase==='using';
 }
 finishBoost(silent=false){
  if(this.boostPhase!=='using')return;
  const c=this.config.inkSkill||{},held=this.boostActive||0,spent=this.chargeInk||0,minHold=c.minHold??1;
  this.boostActive=0;this.chargeInk=0;if(this.player?.effects)delete this.player.effects.manualRush;
  if(held>=minHold&&spent>=(c.chargeFloor??0)){this.releaseBloom(spent);this.boostPhase='cooldown';this.boostTimer=Math.min(c.cdMax??3,(c.cdBase??1)+Math.max(0,held-minHold)*.6);}
  else{this.boostPhase='ready';this.boostTimer=0;}
  if(!silent)this.onEvent('boost-end',this.player);
 }
 releaseBloom(charge){const c=this.config.inkSkill||{},radius=Math.min(c.dropCap||420,Math.max(c.minBloom||48,Math.sqrt(charge)*(c.bloomPerInk||9))),x=this.player.x,y=this.player.y;this.mask.reveal(x,y,radius,{kind:'skill'});this.onEvent('bloom',{entity:this.player,x,y,r:radius,revealRadius:radius,kind:'skill',gain:0});}
 tickBoost(dt){
  if(this.boostPhase==='using'){
   this.boostActive=(this.boostActive||0)+dt;this.player.effects.manualRush=Math.max(this.player.effects.manualRush||0,.12);
   // A small body pays little, a large body pays a lot, so the early game is never drained dry.
   const c=this.config.inkSkill||{},ref=c.drainRadiusRef||140,scale=Math.min(1.8,Math.max(.3,this.player.r/ref)),rampCurve=c.rampSeconds||3;
   // Cheap for the first second, then the cost climbs: holding long is a real decision.
   const rampFactor=Math.min(1,.28+.72*Math.min(1,(this.boostActive||0)/rampCurve)),loss=Math.max(0,Math.min(this.player.ink*.4,this.player.ink*(c.drainPerSecond||.1)*scale*rampFactor*dt));
   if(loss>0&&spendReserve(this.player,loss))this.chargeInk=(this.chargeInk||0)+loss;
   if((this.boostActive||0)>=(c.maxHold||5))this.finishBoost();return;
  }
  if(this.boostPhase==='cooldown'){this.boostTimer-=dt;if(this.boostTimer<=0){this.boostPhase='ready';this.boostTimer=0;}}
 }
 updateShelter(){const p=this.player;if(p.dead){this.sheltered=false;this.shelterFrames=0;return;}const pad=this.sheltered?.06:-.04;let inside=false;for(const leaf of this.arena.items){if(leaf.kind!=='leaf')continue;const r=leaf.r*(1+pad);if((p.x-leaf.x)**2+(p.y-leaf.y)**2<=r*r){inside=true;break;}}this.sheltered=inside;this.shelterFrames=inside?(this.shelterFrames||0)+1:0;}
 update(dt,input={x:0,y:0}){if(this.finished)return;dt=Math.max(0,Math.min(.1,dt));if(this.state==='finishing')return;
  this.elapsed+=dt;this.living.tick(dt);this.updateShelter();this.arena.rushSpeed=this.stageBoost();this.tickBoost(dt);this.arena.update(dt,input);this.living.afterArena();const p=this.player,c=this.config;expireItemTiers(p);if(!p.effects.giant&&p.turtleInk)this.arena.clearTemporaryInk(p);
  this.tickMask(dt);this.collectDropSurplus();this.erosionClock+=dt;if(this.erosionClock>=1/c.erosionHz){const step=this.erosionClock;this.erosionClock=0;const before=this.completion;for(const e of this.arena.entities.slice(1))if(!e.dead){const radius=this.arena.radius(e),a=e.erasePrevious||{x:e.x,y:e.y},distance=Math.hypot(e.x-a.x,e.y-a.y),n=Math.max(1,Math.ceil(distance/Math.max(3,radius*.4))),rate=(e.appearance==='eye'?c.erosionEyeFactor:1)*(c.erosionMovingFactor+(1-c.erosionMovingFactor)*Math.exp(-Math.hypot(e.vx||0,e.vy||0)/c.erosionSpeedScale)**2);for(let j=1;j<=n;j++){const x=a.x+(e.x-a.x)*j/n,y=a.y+(e.y-a.y)*j/n;this.mask.erode(x,y,radius,step*rate/n);this.temporary.noteErosion(x,y,radius);}e.erasePrevious={x:e.x,y:e.y};}this.metrics.eroded+=Math.max(0,before-this.completion);}
  this.habitat.update(dt);
  for(let i=this.arena.items.length-1;i>=0;i--){const item=this.arena.items[i];if(item.kind==='flower'&&!p.dead&&touchingEdiblePondObject(p,item,this.arena.radius(p))){this.arena.items.splice(i,1);p.effects.flower=Math.min(30,Math.max(0,p.effects.flower||0)+c.items.flowerDuration);this.metrics.pickups++;this.onEvent('pickup',{kind:'flower',tier:1,entity:p});}}
  const expanded=this.journey.update(p,dt,this.elapsed);if(expanded)this.onEvent('growth-stage',expanded);if(!this.checkGoal()&&Number.isFinite(c.duration)&&c.duration>0&&this.elapsed>=c.duration)this.finish('timeout');
 }
 applyLivingReward(kind,tier=1,source=null){
  const p=this.player,c=this.config;if(this.state!=='playing'||p.dead||!REWARD_SPECIES[kind])return false;
  if(kind==='dragon')p.effects.dragon=Math.min(ITEM_TIERS.maxDuration,Math.max(0,p.effects.dragon||0)+ITEM_TIERS.duration);
  else {collectTieredItem(p,{kind,tier:Math.max(1,Math.min(3,tier))});
   if(kind==='shield'&&c.growthStages?.sizeLinear){const lin=c.growthStages.sizeLinear,sc=p.pondBuffs?.giant?.strength||1,base=Math.max(0,p.ink-(p.turtleInk||0)),baseRadius=c.growthStages.initialRadius+base*lin,desired=baseRadius*(sc-1)/lin,bonus=Math.max(0,desired-(p.turtleInk||0));if(bonus>0){p.turtleInk=(p.turtleInk||0)+bonus;gainReserve(p,bonus,false,false);}}
  }
  const effect=({magnet:'magnet',speed:'rush',shield:'giant',dragon:'dragon'})[kind];this.living.recordForm(REWARD_SPECIES[kind],effect);this.metrics.pickups++;this.metrics.living.rewardPickups++;this.onEvent('pickup',{kind,tier:p.pondBuffs?.[effect]?.tier||tier,entity:p,source,livingReward:true});return true;
 }
 // A drop that lands mostly on finished painting still pays out, so late kills keep growing you.
 collectDropSurplus(){const area=this.mask.takeSurplus();if(area<=0||this.state!=='playing')return 0;const cap=this.config.dropSurplusInkMax??900,ink=Math.min(cap,area*(this.config.dropSurplusInk??.0016));if(ink>0)gainReserve(this.player,ink,true,false);return ink;}
 tickMask(dt){this.maskClock+=dt;if(this.maskClock>=1/this.config.renderHz){this.mask.update(this.maskClock);this.maskClock=0;}}
 complete(kind='area'){if(this.state!=='playing')return false;this.goalReached=true;this.goalKind=kind;this.state='finishing';this.finalTime=0;this.boostHeld=false;for(const u of this.arena.entities){u.vx=0;u.vy=0;}this.onEvent('goal',{progress:this.completion});return true;}
 finish(reason='exit'){if(this.result)return this.result;const completed=this.goalReached;this.state='finished';this.result={id:this.id,artworkId:this.config.artworkId,completed,reason,goalKind:this.goalKind||null,inkCompletion:completed?1:this.inkCompletion,completion:completed?1:this.completion,elapsed:this.elapsed,growthStage:this.journey.stage,expandedAt:this.journey.expandedAt,growthHistory:[...this.journey.history],swallowed:this.player.swallowed,ink:this.player.ink,deaths:this.player.deaths};this.onEvent('finish',this.result);return this.result;}
}
