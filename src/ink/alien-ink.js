// Appearance only: reads world entities, never changes movement, mass, collision or fluids.
export function alienDetails(c,e,time,index=0,boss=false,target=null){
 const r=e.r*(e.effects?.dense?1.32:1),kind=boss?'boss':e.appearance||((index%2)?'eye':'thorn'),phase=time+index*.73;
 c.save();c.globalAlpha*=e.effects?.water?.26:e.diluted?.5:1;c.translate(e.x+(e.hit?Math.sin(time*170)*5:0),e.y);
 if(kind!=='eye'){
  c.save();c.rotate(phase*(boss?.16:.22));const count=boss?34:23;
  c.fillStyle=e.hit?'#8a7b60':'#25231ee0';c.strokeStyle='#645e4f55';c.lineWidth=r*.03;c.beginPath();
  for(let i=0;i<count;i++){const a=i/count*Math.PI*2,spike=r*(1.12+.17*Math.sin(i*13.4)+.11*Math.sin(phase*2.1+i*.8));for(const [offset,length] of [[-.055,r*.77],[0,spike],[.055,r*.77]])c.lineTo(Math.cos(a+offset)*length,Math.sin(a+offset)*length);}c.closePath();c.fill();c.stroke();c.restore();
 }
 if(kind!=='thorn'){
  const blink=Math.min(1,Math.abs(Math.sin(phase*.85))*7),eyeW=r*.59,eyeH=r*.42*Math.max(.035,blink),angle=target?Math.atan2(target.y-e.y,target.x-e.x):Math.sin(phase*.45)*.6;
  c.save();c.beginPath();c.ellipse(0,0,eyeW,eyeH,Math.sin(phase*.32)*.06,0,Math.PI*2);c.fillStyle='#eee9d9';c.fill();c.clip();
  c.fillStyle='#777365';c.beginPath();c.arc(Math.cos(angle)*r*.09,Math.sin(angle)*r*.09,r*.28,0,Math.PI*2);c.fill();
  c.fillStyle='#1d1c18';c.beginPath();c.ellipse(Math.cos(angle)*r*.12,Math.sin(angle)*r*.12,r*.12,r*.23,0,0,Math.PI*2);c.fill();c.fillStyle='#faf7e9';c.beginPath();c.arc(-r*.10,-r*.13,r*.055,0,Math.PI*2);c.fill();c.restore();
  c.strokeStyle='#24221ce8';c.lineWidth=r*.04;c.beginPath();c.ellipse(0,0,eyeW,eyeH,0,0,Math.PI*2);c.stroke();
 }
 c.restore();
}
