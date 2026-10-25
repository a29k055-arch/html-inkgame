export const GAME_CONFIG={
 // Legacy WORLD_W/WORLD_H, FOOD_TARGET, START_RADIUS and movement curve.
 world:{width:3400,height:3400},inkstoneDuration:300,paperDuration:180,
 aiCount:32,foodTarget:760,foodSpawnRate:25,initialRadius:18,respawnRadius:8,
 respawnDelay:1.2,respawnProtection:2.5,deathInkRetention:.65,
 consumeRatio:1.06,consumeOverlap:.32,npcGain:.62,foodGain:.84,
 maxRadius:170,waterRingStart:.36,waterRingEndRadius:1050,waterRingExponent:1.45,waterDecay:.10,
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
export const CAMPAIGN_CONFIG={duration:360,thresholds:[100,250,450],earliest:[60,180,300],maxBosses:3,energyScale:.12,specialReward:2,specialAI:12,bossTimeLimit:140,bossInkReward:180,bossRadius:115,spawnSeparation:500,bossContactInterval:.8,bossHitProtection:.45,enemyBulletLife:7,npcBulletDamage:40,bulletSpeed:850,bulletLife:2.6,bulletDamage:16,maxShots:96,maxEnemyShots:100,bossHealth:[2400,3800,5400],bossSpeed:[82,98,116],bossStandoff:100,bossSteerRange:100,bossRetreat:.8,bossOrbit:28,bossWarningSlow:.58,repairThreshold:.72,artworkId:'ink-04'};

// Per-round reserve is the only player growth currency; NPC legacy mass remains unchanged.
export const INK_RESERVE_CONFIG={startInk:65,humanFoodGainScale:.65,playerNpcGainScale:.55,playerNpcGainCap:900,maxInk:1000000,respawnSizeRetention:.30,minimumRespawnInk:65,sizeMassPerInk:4,sizeSmoothing:3.4,preservePeakOnDeath:true,shotCostRatio:.025,maximumShotCost:55,shotReserveFloor:20,minimumShotCost:2,shotInterval:.38,powerSaturationLevel:8,levelThresholds:[0,180,600,1500,3200,6200,11000,18000],minimumDamage:13,damageRange:36,minimumShotRadius:4.5,shotRadiusRange:9,normalFoodTarget:950,normalFoodSpawnRate:32,bossFoodTarget:1660,bossFoodSpawnRate:64,recoveryBelow:120,recoveryRadius:220,recoveryMinimumDots:6,recoveryBatch:2,recoveryInterval:1,recoverySpawnNear:55,recoverySpawnFar:150};


export const CONTACT_CONFIG={coreRatio:.73,spikeBaseRate:.012,spikeReferenceRadius:80,spikeSizeMin:.65,spikeSizeMax:1.65,spikeMaxLossPerSecond:40,spikeInkFloor:10,contactInterval:.10,feedbackInterval:.20,eyeTail:false};
export const CAMERA_CONFIG={desktopMin:.78,mobileMin:.66,growthRange:900,bossMin:.66};
export const DROP_CONFIG={minScreenRadius:20,maxScreenRadius:270,playerWeight:.45,targetWeight:1.35};

export const TALENT_CONFIG={earnedPerChoice:1200,maxLevel:3,ward:[1,2,3],haste:[.05,.10,.15],tempo:[.05,.10,.15],power:[.05,.10,.15],magnet:[.10,.20,.30],magnetBaseReach:140,magnetSpeed:270,magnetAcceleration:5,surge:[.10,.20,.30],thrift:[.04,.08,.12],refill:300};
export const BOSS_ATTACK_CONFIG={warningSeconds:.95,maxWarningSeconds:3.6,reactionMargin:.30,hitFlat:10,hitFraction:.025,hitCap:180,contactFlat:16,contactFraction:.035,contactCap:240,fanSpeed:215,ringSpeed:150,fanCount:[3,4,5],ringCount:[12,16,20],ringGap:.85,intervals:[2.3,2.1,1.95],speedScale:[1,1.06,1.12],echoDelay:.48,echoSpeed:.86,laneSpread:.20};

export const ACTIVE_CONFIG={dash:{duration:[2.5,3,3.5],cooldown:[14,13,12],speed:[.25,.30,.35]},veil:{duration:[2,2.5,3],cooldown:[24,22,20]}};
