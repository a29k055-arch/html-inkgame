import {BOSS_ATTACK_CONFIG as A,clamp} from './config.js';
// Time to clear the full locked fan, less the approaching ink's flight time.
export function bossTelegraph(player,boss,tier,speed,pattern='fan'){if(pattern==='ring')return A.warningSeconds;const distance=Math.hypot(player.x-boss.x,player.y-boss.y),half=(A.fanCount[tier]-1)*A.laneSpread/2,clearance=player.r+distance*Math.tan(half)+16,flight=Math.max(0,distance-player.r-boss.r*.8)/A.fanSpeed;return clamp(clearance/Math.max(60,speed)-flight+A.reactionMargin,A.warningSeconds,A.maxWarningSeconds);}
