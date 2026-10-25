import {initTalents,creditChoiceInk} from './talents.js';
import {INK_RESERVE_CONFIG as C,GAME_CONFIG,SKILLS,clamp} from './config.js';
// Canonical reserve = entity.ink. All levels and target sizes are pure derived values.
export const levelThreshold=n=>C.levelThresholds[Math.min(C.levelThresholds.length-1,Math.max(0,n))];
export function reserveState(ink){const amount=clamp(Number(ink)||0,0,C.maxInk),thresholds=C.levelThresholds;let n=0;while(n+1<thresholds.length&&amount>=thresholds[n+1])n++;const max=n===thresholds.length-1,lower=thresholds[n],upper=max?lower:thresholds[n+1],capacity=max?lower-thresholds[n-1]:upper-lower;return {ink:amount,level:n+1,lower,upper,capacity,max,progress:max?1:clamp((amount-lower)/capacity,0,1)};}
export function reserveRadius(ink){return Math.min(GAME_CONFIG.maxRadius,Math.sqrt(GAME_CONFIG.respawnRadius**2+reserveState(ink).ink*C.sizeMassPerInk));}
export function reserveShotPower(ink){const s=reserveState(ink),u=clamp((s.level-1+s.progress)/(C.powerSaturationLevel-1),0,1);return {level:s.level,damage:C.minimumDamage+C.damageRange*u**.65,radius:C.minimumShotRadius+C.shotRadiusRange*u**.7,cost:Math.min(C.maximumShotCost,Math.max(C.minimumShotCost,s.capacity*C.shotCostRatio))};}
export function initReserve(e,ink=C.startInk){e.ink=reserveState(ink).ink;e.growth={peakLevel:1,pendingLevels:[],rewardClock:0,rewardedLevels:[],spent:0,collected:0,choiceInk:0};e.r=reserveRadius(e.ink);e.mass=e.r**2;initTalents(e);return e;}
export function syncReserve(e,dt=0,immediate=false){if(!e.growth)return;const s=reserveState(e.ink);e.ink=s.ink;e.growth.peakLevel=Math.max(e.growth.peakLevel,s.level);e.growth.targetRadius=reserveRadius(e.ink);const blend=immediate?1:1-Math.exp(-C.sizeSmoothing*Math.max(0,dt));e.r+=(e.growth.targetRadius-e.r)*blend;e.mass=e.r**2;return s;}
export function gainReserve(e,amount,rewardable=true,choiceEligible=rewardable){const before=e.ink;e.ink=reserveState(e.ink+Math.max(0,amount)).ink;if(rewardable)e.growth.collected+=e.ink-before;if(choiceEligible)creditChoiceInk(e,e.ink-before);return syncReserve(e);}
export function spendReserve(e,amount){if(!Number.isFinite(amount)||amount<0||e.ink+1e-8<amount)return false;e.ink=Math.max(0,e.ink-amount);e.growth.spent+=amount;syncReserve(e);return true;}
export function resetReserveOnDeath(e){const old=e.growth;const before=reserveRadius(e.ink);e.deathLogicalRadius=before;e.ink=Math.max(C.minimumRespawnInk,(Math.max(GAME_CONFIG.initialRadius,before*C.respawnSizeRetention)**2-GAME_CONFIG.respawnRadius**2)/C.sizeMassPerInk);if(!C.preservePeakOnDeath)initReserve(e,e.ink);else e.growth=old;syncReserve(e,0,true);}
// PeakLevel is diagnostic only; choice opportunities derive exclusively from lifetime collected ink.
export function advanceRewards(){}
