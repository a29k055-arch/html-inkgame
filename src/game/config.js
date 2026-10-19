export const GAME_CONFIG={
 // Legacy WORLD_W/WORLD_H, FOOD_TARGET, START_RADIUS and movement curve.
 world:{width:3400,height:3400},inkstoneDuration:300,paperDuration:180,
 aiCount:32,foodTarget:760,foodSpawnRate:25,initialRadius:18,respawnRadius:8,
 respawnDelay:1.2,respawnProtection:2.5,deathInkRetention:.65,
 consumeRatio:1.06,consumeOverlap:.32,npcGain:.62,foodGain:.84,
 maxRadius:170,waterRingStart:.30,waterRingEndRadius:650,waterDecay:.10,
 itemSpawnInterval:10,maxItems:6,
 rankingRewards:[1.8,1.5,1.25,1.12],paperBaseInk:110,paperMoveSpeed:240,paperInkPerUnit:.018,paperRevealRadius:120,paperSpitCost:4,paperSpitSpeed:620,paperSpitRadius:130,paperSpitCooldown:.35,paperSpitLife:1.8,
 paperCompletionThreshold:.75,historyLimit:5,
 skillDurations:{splash:.65,dense:5,water:4,shield:18,absorb:6},
 splashRange:220,splashDilution:.09,aiPerceptionRange:600,
 // Tunable formula. Early departure never grants ranking bonus.
 earlyExitRatio(elapsed,duration){return Math.min(1,Math.max(0,elapsed/duration));},
};
// Speed-changing dash is retired. Shift exclusively consumes an equipped ink technique.
export const SKILLS=[{id:'splash',label:'溌墨'},{id:'dense',label:'濃墨'},{id:'water',label:'水遁'},{id:'shield',label:'墨障'},{id:'absorb',label:'吸墨'}];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function settlement(ink,elapsed,rank,config=GAME_CONFIG){const full=elapsed>=config.inkstoneDuration;const ratio=config.earlyExitRatio(elapsed,config.inkstoneDuration);const bonus=full?(config.rankingRewards[rank-1]||1):1;return {ink:Math.floor(Math.max(0,ink)*ratio*bonus),ratio,bonus,full,rank,elapsed};}

// Campaign timing uses NORMAL-map active time only; Boss time is separate.
export const CAMPAIGN_CONFIG={duration:360,thresholds:[100,250,450],earliest:[60,180,300],maxBosses:3,energyScale:.12,specialReward:2,specialAI:12,bossTimeLimit:140,bossInkReward:180,bossRadius:115,spawnSeparation:500,bossBurstCount:[6,8,10],bossContactInterval:.8,bossHitProtection:.45,shieldHealthFraction:.35,enemyBulletLife:7,npcBulletDamage:40,bulletInterval:.23,bulletSpeed:850,bulletLife:2.6,bulletDamage:16,maxShots:96,maxEnemyShots:100,bossHealth:[2000,3000,4200],bossSpeed:[82,98,116],bossStandoff:100,bossSteerRange:100,bossRetreat:.8,bossOrbit:28,bossFanSpacing:.19,bossWarningSlow:.58,attackIntervals:[1.5,1.2,1.0],enemyBulletSpeed:235,playerHealth:100,hitDamage:22,contactDamage:32,repairThreshold:.72,artworkId:'ink-04'};

// Entry size is sampled once per encounter. Later growth is a bounded relative modifier.
export const PROJECTILE_BALANCE={minRadius:GAME_CONFIG.respawnRadius,maxRadius:GAME_CONFIG.maxRadius,sizeExponent:.7,minDamageFactor:.72,damageRange:2.05,minShotRadius:4.2,shotRadiusRange:8.8,combatExponent:.18,minCombatFactor:.65,maxCombatFactor:1.18,attackTelegraph:.65};
export function projectilePower(entryMass,currentMass=entryMass){const B=PROJECTILE_BALANCE,entryRadius=Math.sqrt(Math.max(1,entryMass)),size=clamp((entryRadius-B.minRadius)/(B.maxRadius-B.minRadius),0,1)**B.sizeExponent,combat=clamp((Math.max(1,currentMass)/Math.max(1,entryMass))**B.combatExponent,B.minCombatFactor,B.maxCombatFactor);return {entryRadius,combatFactor:combat,damage:CAMPAIGN_CONFIG.bulletDamage*(B.minDamageFactor+B.damageRange*size)*combat,radius:(B.minShotRadius+B.shotRadiusRange*size)*Math.sqrt(combat)};}
