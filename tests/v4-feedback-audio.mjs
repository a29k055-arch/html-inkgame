import assert from 'node:assert/strict';
import {EnemySoundSequence,enemySizeRatio,boostFeedback,FEEDBACK_PENTATONIC} from '../src/reveal/feedback-state.js';
import {WaterPickupAudio} from '../src/reveal/pickup-audio.js';

assert.equal(enemySizeRatio({targetRadius:12,playerRadius:40}),.3);
assert.equal(enemySizeRatio({sizeRatio:.8,targetRadius:1,playerRadius:100}),.8);
assert.equal(enemySizeRatio({targetRadius:100,playerRadius:0}),.45);
for(const ratio of [.12,.45,.78]){
 const notes=new EnemySoundSequence(),played=Array.from({length:15},(_,i)=>notes.next({sizeRatio:ratio},i*.3));
 for(let i=0;i<played.length;i++){
  assert(FEEDBACK_PENTATONIC.includes((played[i].semitone%12+12)%12));
  assert(played[i].level>0&&played[i].level<=.225);
  assert(played[i].stringDuration<1);
  for(let j=Math.max(0,i-3);j<i;j++)assert.notEqual(played[i].semitone,played[j].semitone,'similar enemies never repeat any of the last three pitches');
 }
 assert(played[4].combo>0);assert.equal(notes.next({sizeRatio:ratio},20).combo,0,'a long gap ends the phrase accent window');
}
const seq=new EnemySoundSequence(),small=seq.next({sizeRatio:.2},0),peer=seq.next({sizeRatio:.5},2),large=seq.next({sizeRatio:.8},4);
assert(small.semitone>peer.semitone&&peer.semitone>large.semitone,'larger relative prey receives a lower voice');
assert(small.waterDuration<peer.waterDuration&&peer.waterDuration<large.waterDuration);
assert(small.level<peer.level&&peer.level<large.level);

// Existing WebAudio voices receive the musical plan, not just a debug label.
const param=()=>({value:0,setValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(){}});
const node=()=>({gain:param(),frequency:param(),Q:param(),connect(){},disconnect(){},start(){},stop(){}});
const context={currentTime:0,sampleRate:48000,createGain:node,createOscillator:node,createBiquadFilter:node,createBufferSource:node,createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}};
const sound=new WaterPickupAudio();sound.context=context;sound.output={input:node()};
for(const style of ['water','guzheng','pipa']){sound.setStyle(style);for(const cue of [small,peer,large]){const note=sound.voice('enemy',0,cue.level,cue);assert.equal(note.duration,style==='water'?cue.waterDuration:style==='pipa'?cue.pluckDuration:cue.stringDuration);}}

// Global, food and voice budgets stay intact. Rejected sounds do not advance a phrase.
const timeouts=[],original=globalThis.setTimeout;
try{
 globalThis.setTimeout=callback=>{timeouts.push(callback);return timeouts.length;};
 const audio=new WaterPickupAudio();audio.context={state:'running',currentTime:0};audio.unlock=()=>{};audio.voice=()=>({duration:.3});
 assert(audio.play('enemy',.5,{sizeRatio:.5}));const serial=audio.enemyNotes.serial;
 audio.context.currentTime=.02;assert.equal(audio.play('enemy',.5,{sizeRatio:.5}),false);assert.equal(audio.enemyNotes.serial,serial);
 for(const time of [.1,.2,.3]){audio.context.currentTime=time;assert(audio.play('enemy',.5,{sizeRatio:.5}));}
 audio.context.currentTime=.4;assert.equal(audio.play('enemy',.5,{sizeRatio:.5}),false);assert.equal(audio.voices,4);
 timeouts.splice(0).forEach(fn=>fn());assert.equal(audio.voices,0);
 audio.context.currentTime=1;assert(audio.play('food',.5));audio.context.currentTime=1.05;assert.equal(audio.play('food',.5),false);audio.context.currentTime=1.10;assert(audio.play('food',.5));
 audio.setMuted(true);audio.context.currentTime=2;assert.equal(audio.play('enemy',.5),false);audio.setMuted(false);assert.equal(audio.play('enemy',0),false);
}finally{globalThis.setTimeout=original;}

const run={state:'playing',boostPhase:'using',boostActive:.7,chargeInk:20,config:{inkSkill:{minHold:1,chargeFloor:12}},player:{effects:{rush:2},pondBuffs:{rush:{strength:1}}}};
assert.equal(boostFeedback(run).phase,'accelerating');assert.equal(boostFeedback(run).charged,false,'ink alone does not pass the hold gate');
run.boostActive=2;run.chargeInk=1.89;assert.equal(boostFeedback(run).phase,'charging');assert.equal(boostFeedback(run).charged,false,'initial ink cannot claim a ready bloom after five seconds');
run.chargeInk=12;assert.equal(boostFeedback(run).phase,'charged');assert.equal(boostFeedback(run).progress,1);assert(boostFeedback(run).fishActive);
run.boostPhase='cooldown';run.boostTimer=1.3;assert.equal(boostFeedback(run).remaining,1.3);assert.equal(boostFeedback(run).progress,0);
run.player.dead=1;assert.equal(boostFeedback(run).phase,'disabled');assert.equal(boostFeedback(run).fishActive,false);
assert.deepEqual([run.config.inkSkill.minHold,run.config.inkSkill.chargeFloor],[1,12]);
console.log('PASS contextual enemy registers, non-repeating pentatonic phrases, all original voices, 4-voice/40ms/90ms budgets and honest bloom gates');
