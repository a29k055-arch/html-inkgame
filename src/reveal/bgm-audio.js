// Procedural Chinese classical BGM for the ink pond. No audio files: every note is synthesised
// from a pentatonic (宫商角徵羽) set with a plucked-silk voice, so the loop never repeats
// literally and the build stays small.
//
// Musical shape, modelled on 古琴/古筝 solo pieces such as 高山流水:
//   - a low open string (散音) marks the start of each phrase;
//   - the melody is written as short phrases (scale degrees, -1 = rest) that rise toward
//     徵/羽 and settle back on 宫, instead of picking random notes;
//   - occasional grace notes imitate 滑音/按音;
//   - tempo is slow and the register low, so it reads as mountain-and-water, not as a loop.
const DEG=[0,2,4,7,9]; // 宫 商 角 徵 羽
const TRACKS=[
 {id:'mountain',label:'bgmMountain',root:146.83,root2:220.00,scale:DEG,drone:73.42,bpm:50,density:.62,octave:2,level:.15,
  phrases:[[0,2,4,2,-1],[4,2,0,-1,-1],[0,4,3,2,-1],[2,-1,0,-1,-1]]},
 {id:'water',label:'bgmWater',root:196.00,root2:293.66,scale:[0,3,5,7,10],drone:98.00,bpm:46,density:.55,octave:2,level:.13,
  phrases:[[0,1,2,1,0],[2,3,4,-1,2],[4,2,1,0,-1],[1,-1,0,-1,-1]]},
 {id:'pine',label:'bgmPine',root:110.00,root2:164.81,scale:[0,2,5,7,9],drone:55.00,bpm:58,density:.70,octave:1,level:.15,
  phrases:[[0,2,3,4,3],[2,0,-1,2,-1],[4,3,2,1,0],[0,-1,-1,-1,-1]]},
 {id:'cloud',label:'bgmCloud',root:261.63,root2:392.00,scale:DEG,drone:130.81,bpm:54,density:.45,octave:2,level:.12,
  phrases:[[4,3,2,-1,-1],[2,4,3,-1,-1],[0,2,-1,4,-1],[3,-1,2,-1,-1]]},
 {id:'stream',label:'bgmStream',root:164.81,root2:246.94,scale:DEG,drone:82.41,bpm:66,density:.78,octave:2,level:.12,
  phrases:[[0,1,2,3,4],[4,3,2,1,0],[0,2,4,2,0],[4,-1,2,-1,0]]},
 {id:'moon',label:'bgmMoon',root:130.81,root2:196.00,scale:[0,3,5,7,10],drone:65.41,bpm:42,density:.38,octave:2,level:.12,
  phrases:[[0,-1,2,-1,-1],[4,-1,3,-1,-1],[2,-1,0,-1,-1],[0,-1,-1,-1,-1]]}
];
const semi=(root,n)=>root*Math.pow(2,n/12);
function pluck(context,dest,freq,time,{level=.2,dur=2.6,bright=6}={}){
 const body=context.createOscillator();body.type='triangle';body.frequency.setValueAtTime(freq,time);
 const shimmer=context.createOscillator();shimmer.type='sine';shimmer.frequency.setValueAtTime(freq*2.004,time);
 const filter=context.createBiquadFilter();filter.type='lowpass';filter.Q.value=.7;
 filter.frequency.setValueAtTime(Math.min(9000,freq*bright),time);
 filter.frequency.exponentialRampToValueAtTime(Math.max(220,freq*1.5),time+dur*.8);
 const gain=context.createGain();
 gain.gain.setValueAtTime(.00001,time);
 gain.gain.exponentialRampToValueAtTime(level,time+.01);
 gain.gain.exponentialRampToValueAtTime(level*.32,time+.22);
 gain.gain.exponentialRampToValueAtTime(.00001,time+dur);
 const shimmerGain=context.createGain();shimmerGain.gain.value=.2;
 body.connect(filter);shimmer.connect(shimmerGain);shimmerGain.connect(filter);filter.connect(gain);gain.connect(dest);
 body.start(time);body.stop(time+dur+.02);shimmer.start(time);shimmer.stop(time+dur+.02);
}
export class BgmAudio{
 constructor(){this.context=null;this.master=null;this.timer=null;this.step=0;this.phrase=0;this.rounds=0;this.volume=.28;this.muted=false;this.track=0;this.selection='shuffle';this.playing=false;}
 get current(){return TRACKS[this.track%TRACKS.length];}
 unlock(volume){
  if(typeof volume==='number')this.volume=volume;
  if(this.muted||this.volume<=0)return;
  try{
   if(!this.context){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination);}
   if(this.context.state==='suspended')this.context.resume().catch(()=>{});
   this.master.gain.setTargetAtTime(this.volume*.9,this.context.currentTime,.8);
   if(!this.timer)this.start();
  }catch{}
 }
 start(){if(this.timer)return;this.next=this.context.currentTime+.3;this.playing=true;this.timer=setInterval(()=>this.pump(),140);this.pump();}
 pickTrack(){
  if(this.selection==='shuffle'){const pool=TRACKS.map((_,i)=>i).filter(i=>i!==this.track);this.track=pool[Math.floor(Math.random()*pool.length)]??0;this.phrase=0;this.step=0;}
  else{const found=TRACKS.findIndex(t=>t.id===this.selection);if(found>=0)this.track=found;}
 }
 pump(){
  const c=this.context;if(!c||c.state!=='running'||!this.playing)return;
  const t=this.current,beat=60/t.bpm;
  while(this.next<c.currentTime+.9){
   const phrase=t.phrases[this.phrase%t.phrases.length],degree=phrase[this.step%phrase.length];
   if(degree>=0&&Math.random()<t.density){
    const octave=(Math.random()<.28?t.octave+1:t.octave);
    const root=Math.random()<.5?t.root:t.root2;
    const freq=semi(root,t.scale[degree]+12*octave);
    pluck(c,this.master,freq,this.next,{level:t.level*(.7+Math.random()*.4),dur:beat*(2.4+Math.random()*1.4),bright:5+Math.random()*2.5});
    // 滑音: a quick grace note a step below, the way a guzheng player slides into a note.
    if(Math.random()<.16&&degree>0)pluck(c,this.master,semi(root,t.scale[degree-1]+12*octave),this.next-beat*.06,{level:t.level*.3,dur:beat*.5,bright:7});
   }
   // 散音: the open low string anchors the phrase.
   if(this.step%phrase.length===0)pluck(c,this.master,semi(t.drone,0),this.next,{level:t.level*.5,dur:beat*7,bright:2.2});
   this.step++;
   if(this.step%phrase.length===0){
    this.phrase++;
    // Every four phrases either continue the group or, when shuffling, move to another piece.
    if(this.phrase%4===0&&this.selection==='shuffle'){this.pickTrack();}
   }
   this.next+=beat;
  }
 }
 setVolume(v){this.volume=Math.max(0,Math.min(1,v));if(this.master&&this.context)this.master.gain.setTargetAtTime(this.muted?0:this.volume*.9,this.context.currentTime,.05);}
 setMuted(m){this.muted=!!m;if(!this.master||!this.context)return;this.master.gain.setTargetAtTime(this.muted?0:this.volume*.9,this.context.currentTime,.05);}
 setSelection(id){this.selection=(id==='shuffle'||TRACKS.some(t=>t.id===id))?id:'shuffle';if(this.selection!=='shuffle'){this.track=Math.max(0,TRACKS.findIndex(t=>t.id===this.selection));this.phrase=0;this.step=0;}}
 dispose(){if(this.timer)clearInterval(this.timer);this.timer=null;this.context?.close().catch(()=>{});this.context=null;}
}
export const BGM_TRACKS=TRACKS;
