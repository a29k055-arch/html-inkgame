import assert from 'node:assert/strict';
import {HERO_PRESETS,DEFAULT_HERO_PRESET,heroSizeProfile} from '../src/ink/hero-presets.js';
import {relativeInkProfile,smoothRelativeSpeed} from '../src/ink/hero-relative-motion.js';
import {CometTrail} from '../src/reveal/trail.js';

assert.equal(DEFAULT_HERO_PRESET,'swing');
for(const radius of [18,90,110]){
 const old=new CometTrail({preset:'airflow'}),now=new CometTrail({preset:'swing'});
 old.sample(100,100,radius,.02,90,.9);now.sample(100,100,radius,.02,90,.9);
 for(const key of ['trailWidthScale','trailLifetime','trailMaxWorldLength','trailMinVisibleLength'])assert.equal(now.config[key],old.config[key],`small/mid ${radius} ${key}`);
 const a=heroSizeProfile(relativeInkProfile(HERO_PRESETS.airflow,.8),radius),b=heroSizeProfile(relativeInkProfile(HERO_PRESETS.swing,.8),radius);
 for(const key of ['decay','fluidity','tailFade','vorticity','bodyFeed'])assert.equal(a[key],b[key]);
}
// A slower absolute-speed giant still has a useful wake at its own normal speed.
const sample=(preset,speed,ratio)=>{const t=new CometTrail({preset});for(let i=0;i<180;i++)t.sample(100+i*speed/60,300,210,1/60,speed,ratio);return t;};
const old=sample('airflow',84,1),normal=sample('swing',84,1),slow=sample('swing',35,.42),fast=sample('swing',130,1.5);
assert(normal.config.trailLifetime>old.config.trailLifetime);
assert(normal.config.trailMaxWorldLength>old.config.trailMaxWorldLength);
assert(normal.config.trailMaxWorldLength>slow.config.trailMaxWorldLength);
assert(fast.config.trailMaxWorldLength>normal.config.trailMaxWorldLength);
assert(normal.config.trailLifetime<=HERO_PRESETS.swing.maxLife);
assert(normal.config.trailMaxWorldLength<1200);
const profile=heroSizeProfile(relativeInkProfile(HERO_PRESETS.swing,1),210);
assert.equal(profile.bodyFeedRadius,1,'tail optimization never shrinks the solid-source radius');
assert.equal(profile.swingBody,1);
const rest=heroSizeProfile(relativeInkProfile(HERO_PRESETS.swing,0),210);
assert(rest.decay>profile.decay*5,'stopped pigment still dissipates rapidly');
assert(rest.tailFade>profile.tailFade);
const before=normal.points.map(p=>[p.x,p.y]);
const head=normal.head;
for(let i=1;i<25;i++)normal.sample(head.x,head.y-i*1.4,210,1/60,84,1);
assert(before.some(([x,y])=>normal.points.some(p=>p.x===x&&p.y===y)),'turn never rotates old committed world ink');
const rows=normal.geometry();assert(rows.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.alpha>=0&&p.alpha<=1));
assert(rows.every(p=>p.x>=100&&p.x<=head.x+.01&&p.y<=300&&p.y>=head.y-35.01),'smoothed joints stay inside historical path bounds');
normal.advance(HERO_PRESETS.swing.maxLife+.1);assert.equal(normal.geometry().length,0);
assert(Math.abs(smoothRelativeSpeed(0,84,84,1)-smoothRelativeSpeed(0,110,110,1))<1e-10,'relative movement is independent of size-dependent speed');
console.log('PASS unchanged small/mid wake, bounded longer large relative-speed tail, high-speed response, unchanged source radius, world-space turn history and stop expiry');
