// Event feedback only: no mass, score, ability or timing rules are modified here.
export const FEEDBACK_PENTATONIC=Object.freeze([0,2,4,7,9]);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const finite=(value,fallback)=>Number.isFinite(value)?value:fallback;
const PHRASE=Object.freeze([0,2,4,1,3]);
export function enemySizeRatio(detail={}){
 const explicit=detail?.sizeRatio,ratio=Number.isFinite(explicit)?explicit:
  Number.isFinite(detail?.targetRadius)&&detail.targetRadius>=0&&detail.playerRadius>0?detail.targetRadius/detail.playerRadius:.45;
 return clamp(ratio,0,1.5);
}
export class EnemySoundSequence {
 constructor(){this.serial=0;this.lastTime=-Infinity;this.combo=0;this.recent=[];}
 next(detail={},time=0){
  const ratio=enemySizeRatio(detail),tier=ratio<.30?'small':ratio<.62?'peer':'large';
  const register=tier==='small'?12:tier==='peer'?0:-12;
  this.combo=time>=this.lastTime&&time-this.lastTime<=1.6?Math.min(5,this.combo+1):0;
  this.lastTime=time;
  let index=PHRASE[this.serial%PHRASE.length],semitone=register+FEEDBACK_PENTATONIC[index];
  // Keep the last three actual pitches distinct even if enemy sizes change.
  for(let i=0;i<5&&this.recent.includes(semitone);i++){index=(index+1)%5;semitone=register+FEEDBACK_PENTATONIC[index];}
  this.recent.push(semitone);if(this.recent.length>3)this.recent.shift();
  const variation=this.serial++%3,accent=[1,.94,1.04][variation],durationScale=[1,.94,1.05][variation];
  return {tier,ratio,semitone,variation,combo:this.combo,level:({small:.145,peer:.18,large:.215}[tier])*accent,
   waterDuration:({small:.25,peer:.31,large:.39}[tier])*durationScale,
   stringDuration:({small:.48,peer:.66,large:.88}[tier])*durationScale,
   pluckDuration:({small:.28,peer:.37,large:.49}[tier])*durationScale};
 }
}

// Mirrors the existing release gates for presentation; never releases the skill.
export function boostFeedback(run){
 const player=run?.player||{},c=run?.config?.inkSkill||{},using=run?.boostPhase==='using';
 const held=Math.max(0,finite(run?.boostActive,0)),spent=Math.max(0,finite(run?.chargeInk,0));
 const minHold=Math.max(0,finite(c.minHold,1)),chargeFloor=Math.max(0,finite(c.chargeFloor,12));
 const holdProgress=minHold>0?clamp(held/minHold,0,1):1,inkProgress=chargeFloor>0?clamp(spent/chargeFloor,0,1):1;
 const disabled=!!player.dead||run?.state!=='playing',charged=!disabled&&using&&held>=minHold&&spent>=chargeFloor;
 const phase=disabled?'disabled':using?charged?'charged':held<minHold?'accelerating':'charging':run?.boostPhase==='cooldown'?'cooldown':'ready';
 return {phase,charged,progress:using?Math.min(holdProgress,inkProgress):0,held,spent,minHold,chargeFloor,
  remaining:Math.max(0,finite(run?.boostTimer,0)),fishActive:!disabled&&(player.effects?.rush||0)>0,
  fishStrength:player.pondBuffs?.rush?.strength||0};
}
