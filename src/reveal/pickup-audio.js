// Sound design for the ink pond. Three voices share one small hall:
//   water   - rising bubble + splash, the ordinary feedback for floaters and food
//   guzheng - warm plucked silk string with a long tail
//   pipa    - hard plectrum transient, bright harmonics, quick decay
// The style setting only chooses the voice for EVENTS (enemy, item, bloom drop).
// Ordinary floaters always answer with the water drop, whatever the style is.
export const SFX_STYLES=Object.freeze([
 {id:'water',label:'sfxStyleWater'},
 {id:'guzheng',label:'sfxStyleGuzheng'},
 {id:'pipa',label:'sfxStylePipa'}
]);
// 五声音阶 (宫商角徵羽) in semitones: every event pitch is taken from this set.
export const PENTATONIC=Object.freeze([0,2,4,7,9]);
const noiseCache=new WeakMap();
function noiseBuffer(context,seconds=.06){
 const key=Math.round(seconds*1000);let byKey=noiseCache.get(context);
 if(!byKey){byKey=new Map();noiseCache.set(context,byKey);}
 if(byKey.has(key))return byKey.get(key);
 const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*seconds),context.sampleRate),data=buffer.getChannelData(0);let seed=64127;
 for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*(1-i/data.length)**2;}
 byKey.set(key,buffer);return buffer;
}
export function waterOutput(context,destination=context.destination,volume=1){
 const input=context.createDynamicsCompressor(),master=context.createGain();
 input.threshold.value=-18;input.knee.value=14;input.ratio.value=3;input.attack.value=.003;input.release.value=.08;
 master.gain.value=volume;input.connect(master);master.connect(destination);return {input,master};
}
// A short feedback delay stands in for a stone hall: airy tail, no convolution cost.
export function hallSend(context,destination,{time=.09,feedback=.26,tone=2400,mix=.2}={}){
 const send=context.createGain();send.gain.value=mix;
 const delay=context.createDelay(.5);delay.delayTime.value=time;
 const loop=context.createGain();loop.gain.value=feedback;
 const damp=context.createBiquadFilter();damp.type='lowpass';damp.frequency.value=tone;
 send.connect(delay);delay.connect(damp);damp.connect(loop);loop.connect(delay);damp.connect(destination);
 return {send,delay,loop,damp};
}
const freqOf=(root,semitone)=>root*Math.pow(2,semitone/12);

// --- voice 1: water drop ---
export function waterDrop(context,destination,{time=context.currentTime,pitch=1,level=.16,dur=.26}={}){
 const nodes=[],tone=820;
 const env=(peak,end)=>{const g=context.createGain();g.gain.setValueAtTime(.00001,time);g.gain.exponentialRampToValueAtTime(peak,time+.004);g.gain.exponentialRampToValueAtTime(.00001,time+end);g.connect(destination);nodes.push(g);return g;};
 const body=context.createOscillator();body.type='sine';
 body.frequency.setValueAtTime(tone*.60*pitch,time);body.frequency.exponentialRampToValueAtTime(tone*1.66*pitch,time+.027);body.frequency.exponentialRampToValueAtTime(tone*.91*pitch,time+dur);
 body.connect(env(level,dur));nodes.push(body);
 const ring=context.createOscillator();ring.type='sine';
 ring.frequency.setValueAtTime(tone*.88*pitch,time);ring.frequency.exponentialRampToValueAtTime(tone*2.30*pitch,time+.019);ring.frequency.exponentialRampToValueAtTime(tone*1.55*pitch,time+.13);
 ring.connect(env(level*.15,.14));nodes.push(ring);
 const splash=context.createBufferSource(),high=context.createBiquadFilter(),low=context.createBiquadFilter();
 splash.buffer=noiseBuffer(context,.065);high.type='highpass';high.frequency.value=1200;low.type='lowpass';low.frequency.value=3300;low.Q.value=.4;
 splash.connect(high);high.connect(low);low.connect(env(level*.08,.045));nodes.push(splash,high,low);
 body.onended=()=>{for(const n of nodes)n.disconnect();};
 body.start(time);body.stop(time+dur+.01);ring.start(time);ring.stop(time+dur+.01);splash.start(time);splash.stop(time+.065);
 return {duration:dur};
}

// --- voice 2: guzheng (rounded onset, blooming body, long silk tail) ---
export function guzhengNote(context,destination,{root=261.63,semitone=0,time=context.currentTime,level=.18,dur=1.9}={}){
 const freq=freqOf(root,semitone),nodes=[];
 const filter=context.createBiquadFilter();filter.type='lowpass';filter.Q.value=.8;
 filter.frequency.setValueAtTime(Math.min(8000,freq*5.5),time);
 filter.frequency.exponentialRampToValueAtTime(Math.max(240,freq*1.25),time+dur*.8);
 const gain=context.createGain();
 gain.gain.setValueAtTime(.00001,time);
 gain.gain.exponentialRampToValueAtTime(level,time+.012);
 gain.gain.exponentialRampToValueAtTime(level*.34,time+.26);
 gain.gain.exponentialRampToValueAtTime(.00001,time+dur);
 const body=context.createOscillator();body.type='triangle';body.frequency.setValueAtTime(freq,time);
 const fifth=context.createOscillator();fifth.type='sine';fifth.frequency.setValueAtTime(freq*1.5,time);
 const fifthGain=context.createGain();fifthGain.gain.value=.12;
 const octave=context.createOscillator();octave.type='sine';octave.frequency.setValueAtTime(freq*2.004,time);
 const octaveGain=context.createGain();octaveGain.gain.value=.09;
 body.connect(filter);fifth.connect(fifthGain);fifthGain.connect(filter);octave.connect(octaveGain);octaveGain.connect(filter);
 filter.connect(gain);gain.connect(destination);
 body.start(time);body.stop(time+dur+.02);fifth.start(time);fifth.stop(time+dur+.02);octave.start(time);octave.stop(time+dur+.02);
 nodes.push(body,fifth,octave,fifthGain,octaveGain,filter,gain);
 body.onended=()=>{for(const n of nodes)n.disconnect();};
 return {duration:dur};
}

// --- voice 3: pipa (plectrum transient, bright harmonics, quick decay) ---
export function pipaNote(context,destination,{root=261.63,semitone=0,time=context.currentTime,level=.2,dur=.85}={}){
 const freq=freqOf(root,semitone),nodes=[];
 const pick=context.createBufferSource(),pickFilter=context.createBiquadFilter(),pickGain=context.createGain();
 pick.buffer=noiseBuffer(context,.03);pickFilter.type='bandpass';pickFilter.frequency.value=Math.min(6000,freq*4);pickFilter.Q.value=.9;
 pickGain.gain.setValueAtTime(level*.45,time);pickGain.gain.exponentialRampToValueAtTime(.00001,time+.045);
 pick.connect(pickFilter);pickFilter.connect(pickGain);pickGain.connect(destination);nodes.push(pick,pickFilter,pickGain);
 const filter=context.createBiquadFilter();filter.type='lowpass';filter.Q.value=1.2;
 filter.frequency.setValueAtTime(Math.min(11000,freq*9),time);
 filter.frequency.exponentialRampToValueAtTime(Math.max(320,freq*1.8),time+dur*.6);
 const gain=context.createGain();
 gain.gain.setValueAtTime(.00001,time);
 gain.gain.exponentialRampToValueAtTime(level,time+.004);
 gain.gain.exponentialRampToValueAtTime(level*.18,time+.12);
 gain.gain.exponentialRampToValueAtTime(.00001,time+dur);
 const body=context.createOscillator();body.type='sawtooth';body.frequency.setValueAtTime(freq,time);
 const bright=context.createOscillator();bright.type='sine';bright.frequency.setValueAtTime(freq*2.006,time);
 const brightGain=context.createGain();brightGain.gain.value=.26;
 body.connect(filter);bright.connect(brightGain);brightGain.connect(filter);filter.connect(gain);gain.connect(destination);
 body.start(time);body.stop(time+dur+.02);bright.start(time);bright.stop(time+dur+.02);pick.start(time);pick.stop(time+.05);
 nodes.push(body,bright,brightGain,filter,gain);
 body.onended=()=>{for(const n of nodes)n.disconnect();};
 return {duration:dur};
}

// Event -> musical position (degree in 五声). Food never reaches this table.
const EVENTS={enemy:{degree:3,dur:1.5,level:.2},item:{degree:4,dur:1.1,level:.18},drop:{degree:0,dur:2.2,level:.2}};
export class WaterPickupAudio {
 constructor(){this.context=null;this.voices=0;this.last=-100;this.lastFood=-100;this.serial=0;this.level=0;this.muted=false;this.style='water';}
 unlock(volume=this.level){
  if(!volume)return;
  try{
   if(!this.context){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;this.context=new Audio();this.output=waterOutput(this.context,this.context.destination,volume);this.hall=hallSend(this.context,this.output.master,{mix:.2});}
   if(this.context.state==='suspended')this.context.resume().catch(()=>{});
  }catch{}
 }
 setVolume(volume){this.level=Math.max(0,Math.min(1,volume||0));if(this.output&&this.context)this.output.master.gain.setTargetAtTime(this.muted?0:this.level,this.context.currentTime,.012);}
 setMuted(m){this.muted=!!m;this.setVolume(this.level);}
 setStyle(style){if(SFX_STYLES.some(s=>s.id===style))this.style=style;}
 // Ordinary food always keeps the water voice; every other event follows the chosen style.
 voice(event,time,level){
  const root=261.63,table=EVENTS[event],degree=table?table.degree:0,walk=this.serial%5,step=PENTATONIC[degree]+(walk>=3?12:0);
  if(event==='food'||this.style==='water')return waterDrop(this.context,this.output.input,{time,pitch:1+((this.serial%7)-3)*.02,level,dur:event==='food'?.24:.32});
  if(this.style==='pipa')return pipaNote(this.context,this.output.input,{root,semitone:step,time,level,dur:table?Math.min(.95,table.dur):.8});
  return guzhengNote(this.context,this.output.input,{root,semitone:step,time,level,dur:table?table.dur:1.6});
 }
 play(event='food',volume){
  if(typeof volume==='number')this.level=volume;
  this.setVolume(this.level);
  if(!this.level||this.muted)return false;
  this.unlock(this.level);
  const c=this.context;if(!c||c.state!=='running')return false;
  const now=c.currentTime;
  if(this.voices>=4||now-this.last<.04)return false;
  if(event==='food'&&now-this.lastFood<.09)return false;
  this.last=now;if(event==='food')this.lastFood=now;
  this.voices++;this.serial++;
  const level=event==='food'?.15:(EVENTS[event]?.level??.18);
  const note=this.voice(event,now+.001,level);
  setTimeout(()=>{this.voices=Math.max(0,this.voices-1);},(note?.duration??.3)*1000);
  return true;
 }
 dispose(){this.context?.close().catch(()=>{});}
}
