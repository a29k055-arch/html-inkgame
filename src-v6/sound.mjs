export function createInkSound(){
  let audio,last=-1;
  const tones={
    eat:[293.66,440],flower:[392,587.33],bloom:[329.63,493.88],
    form:[349.23,523.25],win:[392,493.88,587.33,783.99],damage:[147]
  };
  function unlock(){
    if(!audio){const Engine=window.AudioContext||window.webkitAudioContext;if(Engine){try{audio=new Engine();}catch{return;}}}
    if(audio?.state==='suspended')audio.resume().catch(()=>{});
  }
  function events(items){
    if(!audio||audio.state!=='running')return;
    const priority=['win','form','flower','bloom','eat','damage'];
    const type=priority.find(key=>items.some(item=>item.type===key));
    if(!type)return;
    const now=audio.currentTime;
    if(now-last<(type==='damage'?.75:.14)&&type!=='win')return;
    last=now;
    for(const [i,hz] of tones[type].entries()){
      const at=now+i*.085, note=audio.createOscillator(), gain=audio.createGain();
      note.type='sine';note.frequency.setValueAtTime(hz,at);
      gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.04,at+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,at+.38);
      note.connect(gain);gain.connect(audio.destination);note.start(at);note.stop(at+.40);
      note.onended=()=>{gain.disconnect();note.disconnect();};
    }
  }
  return {unlock,events};
}
