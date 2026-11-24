// Keep the result legible while the player swims. Change practice layouts
// at peak opacity, with a paper-colour dissolve in both directions.
export const LESSON_HOLD = 3;
export const LESSON_DISSOLVE = .62;
export const LESSON_INTRO = 3.8;

const copy=(zh,ja,en)=>({zh,ja,en});
export const introductions=[
  copy('这就是你。你是池中的一滴墨。','この墨のしずくが、あなたです。','This is you. You’re a drop of ink in the pond.'),
  copy('池里有两种对手。先看看带短刺的这一个。','池には2種類の敵がいます。まずはトゲ玉に近づいてみましょう。','There are two kinds of rivals. Start with the one with short spines.'),
  copy('游来的生物可以让你变身。先收下它，再决定什么时候用。','泳いでくる生き物に触れると、アイテムとして手に入ります。使うと、その生き物に変身できます。','Collect a swimming creature to borrow its form. You choose when to use it.'),
  copy('你身上的墨也能喷出去。看看身后的刺球。','後ろに墨を吐くと、勢いがつきます。後ろのトゲ玉を押してみましょう。','You can send some of your own ink backward. Look at the spiked ball behind you.')
];
export const results={
  grew:copy('吃进去了。上方的墨量增加了，你也大了一圈。','吸収できました。画面上のゲージが伸びて、体もひと回り大きくなりました。','You absorbed it. Your body grew, and the ink bar rose.'),
  spike:copy('刚才你和刺球失去了同样多的墨。','自分とトゲ玉の墨が、同じ量だけ減りました。','You and the spiked ball lost equal amounts of ink.'),
  hole:copy('你失去的墨流进了黑洞。你缩小了，它变大了。','黒い渦に墨を吸い取られました。こちらが小さくなった分、渦が大きくなりました。','Your ink flowed into the whirl. You shrank as it grew.'),
  spikePair:copy('两颗刺球相碰，一起变小了。','トゲ玉同士が触れて、どちらも小さくなりました。','The two spiked balls touched and both shrank.'),
  holePair:copy('两个黑洞相碰，也会一起变小。','渦同士が触れても、両方が小さくなります。','Two whirls also shrink when they touch.'),
  intercept:copy('刚才还是红圈的刺球，变小以后就能吃了。','さっきまで輪が赤かったトゲ玉も、自分より小さくなると吸収できます。','The spiked ball that used to glow red shrank enough to eat.'),
  fishTry:copy('泡泡推开了刺球。你从空隙游了过去。','泡でトゲ玉を押して、すき間を通れました。','Your bubbles pushed the spiked ball aside. You slipped through the gap.'),
  shrimpTry:copy('散墨先靠近，淡蓝圈的对手来得慢一些。','墨の粒が先に寄ってきました。水色の相手はゆっくり近づきます。','Loose ink came in first. A blue rival drifts toward you more slowly.'),
  turtleTry:copy('龟壳挡住了这次接触，你的墨量保住了。','甲羅が守ってくれました。触れても墨は減りません。','The shell protected you. Contact left your ink intact.'),
  dragonTry:copy('龙能护身、吸墨，也能向前吐泡。','龍は身を守りながら墨を引き寄せ、前に泡も吐けます。','The dragon can protect you, draw in ink and blow bubbles.'),
  jet:copy('刺球被推开了。向后喷墨，也能让你向前游快一点。','トゲ玉を押しのけました。後ろに墨を吐くと、その勢いで少し速く泳げます。','The jet pushed the ball away and gave you a little forward thrust.'),
  flower:copy('荷花把墨补回来了。到了更大的池塘，也可以用这个办法。','花を食べて墨が戻りました。広い池でもこの方法が使えます。','The blossom restored your ink. You can do the same in the larger ponds.')
};

export function fadeLessonScene(callback) {
  const veil=document.getElementById('lesson-veil');
  const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?1:LESSON_DISSOLVE*1000;
  const fade=(from,to)=>veil.animate([{opacity:from},{opacity:to}],{duration,easing:'ease-in-out',fill:'forwards'});
  return (async()=>{
    veil.hidden=false;veil.dataset.scene='true';
    const cover=fade(0,1);
    try{
      await cover.finished;
      await callback();
      const reveal=fade(1,0);
      try{await reveal.finished;}finally{reveal.cancel();}
    }finally{
      cover.cancel();veil.hidden=true;veil.style.opacity='0';delete veil.dataset.scene;
    }
  })();
}

export function showLessonBeat(t) {
  const box=document.getElementById('lesson'),veil=document.getElementById('lesson-veil');
  if(t){
    if(box.dataset.lesson!==String(t.index+1))box.dataset.lesson=String(t.index+1);
    if(box.dataset.phase!==t.phase)box.dataset.phase=t.phase;
    if(box.dataset.step!==t.key)box.dataset.step=t.key;
  }
  if(veil.dataset.scene)return;
  const fading=t?.phase==='fade-out'||t?.phase==='fade-in';
  if(veil.hidden!==!fading)veil.hidden=!fading;
  if(fading){
    const n=Math.min(1,t.elapsed/LESSON_DISSOLVE);
    const ease=n*n*(3-2*n);
    veil.style.opacity=String(t.phase==='fade-out'?ease:1-ease);
  }
}
