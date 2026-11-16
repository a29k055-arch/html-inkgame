// Original Web Audio water drops: short rising bubble, soft resonance, filtered splash.
// Local noise seed deliberately does not consume gameplay's Math.random sequence.
const noiseCache=new WeakMap();
function splashNoise(context){
 if(noiseCache.has(context))return noiseCache.get(context);
 const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.065),context.sampleRate),data=buffer.getChannelData(0);let seed=64127;
 for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*(1-i/data.length)**2;}
 noiseCache.set(context,buffer);return buffer;
}
export function waterOutput(context,destination=context.destination,volume=1){
 const input=context.createDynamicsCompressor(),master=context.createGain();
 input.threshold.value=-18;input.knee.value=14;input.ratio.value=3;input.attack.value=.003;input.release.value=.08;
 master.gain.value=volume;input.connect(master);master.connect(destination);return {input,master};
}
// 五声音阶 (宫商角徵羽) in semitones from the root; the run walks this set so pickups stay musical.
export const PENTATONIC=Object.freeze([0,2,4,7,9]);
export function pluckNote(context,destination,{semitone=0,root=261.63,time=context.currentTime,level=.16,dur=.85}={}){
 const freq=root*Math.pow(2,semitone/12),nodes=[];
 const filter=context.createBiquadFilter();filter.type='lowpass';filter.Q.value=.7;
 filter.frequency.setValueAtTime(Math.min(9000,freq*7),time);filter.frequency.exponentialRampToValueAtTime(Math.max(260,freq*1.5),time+dur*.7);
 const gain=context.createGain();gain.gain.setValueAtTime(.00001,time);gain.gain.exponentialRampToValueAtTime(level,time+.005);gain.gain.exponentialRampToValueAtTime(level*.3,time+.14);gain.gain.exponentialRampToValueAtTime(.00001,time+dur);
 const body=context.createOscillator();body.type='triangle';body.frequency.setValueAtTime(freq,time);
 const string=context.createOscillator();string.type='sine';string.frequency.setValueAtTime(freq*2.002,time);
 const stringGain=context.createGain();stringGain.gain.value=.2;
 body.connect(filter);string.connect(stringGain);stringGain.connect(filter);filter.connect(gain);gain.connect(destination);
 body.start(time);body.stop(time+dur+.02);string.start(time);string.stop(time+dur+.02);
 nodes.push(body,string,filter,gain,stringGain);
 body.onended=()=>{for(const n of nodes)n.disconnect();};return {duration:dur};
}
export class WaterPickupAudio {
 constructor(){this.context=null;this.voices=0;this.last=-100;this.lastFood=-100;this.serial=0;this.level=0;this.muted=false;}
 unlock(volume){if(!volume)return;try{if(!this.context){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;this.context=new Audio();this.output=waterOutput(this.context,this.context.destination,volume);}if(this.context.state==='suspended')this.context.resume().catch(()=>{});}catch{}}
 setVolume(volume){this.level=Math.max(0,Math.min(1,volume));if(this.output&&this.context)this.output.master.gain.setTargetAtTime(this.muted?0:this.level,this.context.currentTime,.012);}
 setMuted(m){this.muted=!!m;this.setVolume(this.level??0);}
 play(kind,volume){this.level=Math.max(0,this.level||0,volume||0);this.setVolume(volume);if(!volume||this.muted)return false;this.unlock(volume);const c=this.context;if(!c||c.state!=='running')return false;const now=c.currentTime;if(this.voices>=3||now-this.last<.045||(kind==='food'&&now-this.lastFood<.11))return false;this.last=now;if(kind==='food')this.lastFood=now;this.voices++;this.serial++;
  // food -> 宫/商, enemy -> 角/徵, item -> 羽; successive notes walk the scale upward.
  const base=kind==='enemy'?3:kind==='food'?0:4,step=PENTATONIC[(base+this.serial)%PENTATONIC.length]+(this.serial%6>=3?12:0);
  const note=pluckNote(c,this.output.input,{semitone:step,root:261.63,time:now+.001,level:kind==='enemy'?.20:kind==='food'?.15:.18,dur:kind==='enemy'?1.1:.85});
  setTimeout(()=>{this.voices--;},note.duration*1000);return true;}
 dispose(){this.context?.close().catch(()=>{});}
}
