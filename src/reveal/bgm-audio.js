// Procedural guzheng-style background music. No audio files: the score is synthesised from a
// pentatonic (宫商角徵羽) pitch set with a plucked-string voice, so the loop never repeats
// audibly and the build stays small. Three "pieces" vary root, tempo, register and density.
const TRACKS=[
 {id:'mountain',label:'山',root:146.83,scale:[0,2,4,7,9],drone:73.42,bpm:52,density:.55,octave:2,level:.16},
 {id:'water',label:'水',root:196.00,scale:[0,3,5,7,10],drone:98.00,bpm:44,density:.40,octave:2,level:.14},
 {id:'pine',label:'松',root:110.00,scale:[0,2,5,7,9],drone:55.00,bpm:60,density:.62,octave:1,level:.15}
];
const semi=(root,n)=>root*Math.pow(2,n/12);
// One plucked string: bright attack, fast lowpass collapse, long body decay.
function pluck(context,dest,freq,time,{level=.2,dur=2.6,bright=6}={}){
 const body=context.createOscillator();body.type='triangle';body.frequency.setValueAtTime(freq,time);
 const shimmer=context.createOscillator();shimmer.type='sine';shimmer.frequency.setValueAtTime(freq*2.004,time);
 const filter=context.createBiquadFilter();filter.type='lowpass';filter.Q.value=.6;
 filter.frequency.setValueAtTime(Math.min(9000,freq*bright),time);
 filter.frequency.exponentialRampToValueAtTime(Math.max(220,freq*1.4),time+dur*.75);
 const gain=context.createGain();
 gain.gain.setValueAtTime(.00001,time);
 gain.gain.exponentialRampToValueAtTime(level,time+.006);
 gain.gain.exponentialRampToValueAtTime(level*.28,time+.18);
 gain.gain.exponentialRampToValueAtTime(.00001,time+dur);
 const shimmerGain=context.createGain();shimmerGain.gain.value=.22;
 body.connect(filter);shimmer.connect(shimmerGain);shimmerGain.connect(filter);filter.connect(gain);gain.connect(dest);
 body.start(time);body.stop(time+dur+.02);shimmer.start(time);shimmer.stop(time+dur+.02);
}
export class BgmAudio{
 constructor(){this.context=null;this.master=null;this.timer=null;this.index=0;this.step=0;this.volume=.28;this.muted=false;this.track=0;this.playing=false;}
 get current(){return TRACKS[this.track%TRACKS.length];}
 unlock(volume){
  if(typeof volume==='number')this.volume=volume;
  if(this.muted||this.volume<=0)return;
  try{
   if(!this.context){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination);}
   if(this.context.state==='suspended')this.context.resume().catch(()=>{});
   this.master.gain.setTargetAtTime(this.volume*.9,this.context.currentTime,.6);
   if(!this.timer)this.start();
  }catch{}
 }
 start(){if(this.timer)return;this.next=this.context.currentTime+.25;this.playing=true;this.timer=setInterval(()=>this.pump(),140);this.pump();}
 pump(){
  const c=this.context;if(!c||c.state!=='running'||!this.playing)return;
  const t=this.current,beat=60/t.bpm;
  while(this.next<c.currentTime+.9){
   // Sparse, breathing phrases: a note most beats, rests that let the hall ring out.
   if(Math.random()<t.density){
    const octave=(Math.random()<.32?t.octave+1:t.octave);
    const degree=t.scale[Math.floor(Math.random()*t.scale.length)];
    const freq=semi(t.root,degree+12*octave);
    pluck(c,this.master,freq,this.next,{level:t.level*(.6+Math.random()*.6),dur:beat*(2.2+Math.random()*1.6),bright:5+Math.random()*3});
    if(Math.random()<.18)pluck(c,this.master,freq*1.5,this.next+beat*.5,{level:t.level*.35,dur:beat*1.4,bright:7});
   }
   // A low drone every other bar anchors the phrase, like an open string.
   if(this.step%8===0)pluck(c,this.master,semi(t.drone,0),this.next,{level:t.level*.55,dur:beat*6,bright:2.2});
   this.next+=beat*(Math.random()<.22?1.5:1);this.step++;
  }
 }
 setVolume(v){this.volume=Math.max(0,Math.min(1,v));if(this.master&&this.context)this.master.gain.setTargetAtTime(this.muted?0:this.volume*.9,this.context.currentTime,.05);}
 setMuted(m){this.muted=!!m;if(!this.master||!this.context)return;this.master.gain.setTargetAtTime(this.muted?0:this.volume*.9,this.context.currentTime,.05);}
 next(){this.track=(this.track+1)%TRACKS.length;this.step=0;return this.current;}
 dispose(){if(this.timer)clearInterval(this.timer);this.timer=null;this.context?.close().catch(()=>{});this.context=null;}
}
export const BGM_TRACKS=TRACKS;
