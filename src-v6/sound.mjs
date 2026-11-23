import { WaterPickupAudio } from '../src-v5/reveal/pickup-audio.js';
import { BgmAudio } from '../src-v5/reveal/bgm-audio.js';

export function createInkSound() {
  const water = new WaterPickupAudio(), music = new BgmAudio();
  let prefs = {volume:.3, bgmVolume:.28, bgmTrack:'shuffle', sfxStyle:'water', bgmMuted:false, sfxMuted:false};
  let enabled = true;
  function levels() {
    water.setVolume(prefs.volume);
    music.setVolume(prefs.bgmVolume);
    water.setMuted(!enabled || document.hidden || prefs.sfxMuted);
    music.setMuted(!enabled || document.hidden || prefs.bgmMuted);
  }
  function configure(next={}) {
    if (next.bgmTrack && next.bgmTrack !== prefs.bgmTrack) music.setSelection(next.bgmTrack);
    if (next.sfxStyle) water.setStyle(next.sfxStyle);
    for (const key of Object.keys(prefs)) if (next[key] != null) prefs[key] = next[key];
    levels();
  }
  function unlock() {
    if (!enabled || document.hidden) return;
    water.unlock(prefs.volume);
    music.unlock(prefs.bgmVolume);
  }
  function events(list,player) {
    if (!enabled || !list.length) return;
    for (const event of list) {
      if (event.type === 'eat') water.play(event.target === 'drop' ? 'food' : 'enemy',prefs.volume,{sizeRatio:Math.sqrt(event.mass/Math.max(1,player.mass-event.mass))});
      else if (event.type === 'pickup' || event.type === 'form') water.play('item',prefs.volume);
      else if (event.type === 'flower' || event.type === 'win') water.play('drop',prefs.volume);
    }
  }
  document.addEventListener('visibilitychange',levels);
  window.addEventListener('pagehide',e=>{if(!e.persisted){water.dispose();music.dispose();}});
  return {configure,unlock,events,setEnabled(value){enabled=value;levels();}};
}
