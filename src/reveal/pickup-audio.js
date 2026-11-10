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
export function waterDrop(context,destination,{kind='food',time=context.currentTime,pitch=1,onended=()=>{}}={}){
 const tone=kind==='enemy'?680:kind==='food'?820:760,duration=kind==='food'?.22:kind==='enemy'?.33:.28,level=kind==='food'?.13:kind==='enemy'?.19:.17,nodes=[];
 const envelope=(peak,end)=>{const g=context.createGain();g.gain.setValueAtTime(.00001,time);g.gain.exponentialRampToValueAtTime(peak,time+.004);g.gain.exponentialRampToValueAtTime(.00001,time+end);g.connect(destination);nodes.push(g);return g;};
 const body=context.createOscillator();body.type='sine';body.frequency.setValueAtTime(tone*.60*pitch,time);body.frequency.exponentialRampToValueAtTime(tone*1.66*pitch,time+.027);body.frequency.exponentialRampToValueAtTime(tone*.91*pitch,time+duration);body.connect(envelope(level,duration));nodes.push(body);
 const ring=context.createOscillator();ring.type='sine';ring.frequency.setValueAtTime(tone*.88*pitch,time);ring.frequency.exponentialRampToValueAtTime(tone*2.30*pitch,time+.019);ring.frequency.exponentialRampToValueAtTime(tone*1.55*pitch,time+.13);ring.connect(envelope(level*.15,.14));nodes.push(ring);
 const splash=context.createBufferSource(),high=context.createBiquadFilter(),low=context.createBiquadFilter();splash.buffer=splashNoise(context);high.type='highpass';high.frequency.value=1200;low.type='lowpass';low.frequency.value=3300;low.Q.value=.4;splash.connect(high);high.connect(low);low.connect(envelope(level*.08,.045));nodes.push(splash,high,low);
 body.onended=()=>{for(const node of nodes)node.disconnect();onended();};
 body.start(time);body.stop(time+duration+.01);ring.start(time);ring.stop(time+duration+.01);splash.start(time);splash.stop(time+.065);
 return {duration};
}
export class WaterPickupAudio {
 constructor(){this.context=null;this.voices=0;this.last=-100;this.lastFood=-100;this.serial=0;}
 unlock(volume){if(!volume)return;try{if(!this.context){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;this.context=new Audio();this.output=waterOutput(this.context,this.context.destination,volume);}if(this.context.state==='suspended')this.context.resume().catch(()=>{});}catch{}}
 setVolume(volume){if(this.output)this.output.master.gain.setTargetAtTime(Math.max(0,Math.min(1,volume)),this.context.currentTime,.012);}
 play(kind,volume){this.setVolume(volume);if(!volume)return false;this.unlock(volume);const c=this.context;if(!c||c.state!=='running')return false;const now=c.currentTime;if(this.voices>=3||now-this.last<.045||(kind==='food'&&now-this.lastFood<.11))return false;this.last=now;if(kind==='food')this.lastFood=now;this.voices++;const pitch=1+((this.serial++%7)-3)*.018;waterDrop(c,this.output.input,{kind,time:now+.001,pitch,onended:()=>this.voices--});return true;}
 dispose(){this.context?.close().catch(()=>{});}
}
