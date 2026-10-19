import {t,getLanguage} from './i18n.js';
import {GAME_CONFIG as C,SKILLS} from '../game/config.js';
const $=id=>document.getElementById(id);
export function updateBattleHud(game,renderer){
 const player=game.player,ink=$('inkMetric');
 if(!ink.querySelector('strong'))ink.innerHTML='<small></small><strong></strong><span class="body-size"></span>';
 ink.querySelector('small').textContent=t('heldInk');
 ink.querySelector('strong').textContent=Math.floor(player.ink).toLocaleString(getLanguage());ink.querySelector('.body-size').textContent=t('size',{n:Math.round(player.r)});
 const ranking=$('rankMetric');if(!ranking.querySelector('strong'))ranking.innerHTML='<small></small><strong></strong><span></span>';ranking.querySelector('small').textContent=t('rank');
 ranking.querySelector('strong').textContent=game.rank;ranking.querySelector('span').textContent=`/ ${game.entities.length}`;
 const current=player.skills[0],next=player.skills[1],button=$('skillBtn');button.querySelector('.skill-name').textContent=current?t(current.id):t('technique');button.disabled=!current||!!player.dead;button.setAttribute('aria-label',current?t('useTechnique',{name:t(current.id)}):t('findTechnique'));button.classList.toggle('equipped',!!current);
 $('reserveSlot').querySelector('span').textContent=next?t(next.id):'—';$('reserveSlot').classList.toggle('filled',!!next);
 $('effectStatus').textContent=Object.entries(player.effects).map(([id,seconds])=>`${t(id)} ${t('seconds',{n:Math.ceil(seconds)})}`).join(' · ');
 const status=player.dead?t('reborn'):player.diluted?t('diluted'):player.invincible>0?t('protected'):player.swallowed?t('absorbed',{n:player.swallowed}):t('survive');
 $('battleStatus').textContent=status;$('battleStatus').classList.toggle('water-warning',player.diluted);
 const c=$('minimap').getContext('2d'),size=128,pad=7,scale=(size-pad*2)/C.world.width;c.clearRect(0,0,size,size);c.save();c.translate(pad,pad);c.strokeStyle='#83755a66';c.lineWidth=.7;c.strokeRect(0,0,size-pad*2,size-pad*2);c.beginPath();c.arc(game.center.x*scale,game.center.y*scale,game.safeRadius*scale,0,Math.PI*2);c.stroke();
 const cam=renderer.camera;c.fillStyle='#8474520d';c.fillRect(cam.x*scale,cam.y*scale,innerWidth/cam.scale*scale,innerHeight/cam.scale*scale);
 for(const e of game.entities){if(e.dead)continue;c.fillStyle=e===player?'#805b2b':e.r>player.r?'#332e24a6':'#635b484d';c.beginPath();c.arc(e.x*scale,e.y*scale,e===player?3:Math.min(2.5,1.3+e.r/100),0,Math.PI*2);c.fill();}
 for(const item of game.items){c.fillStyle='#b29a53';c.shadowColor='#fff5cf';c.shadowBlur=4;c.beginPath();c.arc(item.x*scale,item.y*scale,2.8,0,Math.PI*2);c.fill();}c.restore();
}
