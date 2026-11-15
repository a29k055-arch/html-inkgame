// Native input pilot; no resource, entity-size, mask or completion mutation.
// Set PLAYWRIGHT_MODULE to your installed Playwright. Serve the repository first.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.argv[2]||'http://127.0.0.1:4203/';
fs.mkdirSync('work',{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-renderer-backgrounding','--disable-background-timer-throttling']});
try{for(const mobile of [false,true]){
 const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile});
 await ctx.addInitScript(()=>{let n=1;Math.random=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>cb(t*3));});
 const page=await ctx.newPage(),errors=[],samples=[],device=mobile?'mobile':'pc';page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
 await page.goto(new URL('?inspect=1',base).href);await page.waitForSelector('#loading[hidden]',{state:'attached'});
 await page.click('#settingsBtn');await page.selectOption('#language','zh');await page.selectOption('#quality','performance');await page.click('#closeSettings');await page.click('#grindBtn');
 await page.waitForFunction(()=>window.bokuMetrics?.scene==='playing'&&bokuMetrics.startTransition.phase==='idle');
 const initial=await page.evaluate(()=>({m:bokuMetrics,g:revealInspection})),oldThreats=new Map(initial.g.units.filter(e=>!e.player&&e.r>initial.m.radius*1.06).map(e=>[e.id,e.deaths]));
 await page.screenshot({path:`work/four-play-${device}-micro.png`});
 const cdp=mobile?await ctx.newCDPSession(page):null;let held=[],lastSample=-1,expanded=null,settled=false,maxFormerPrey=0,wholeShot=false;const stages=[];
 if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:80,y:640,id:1}]});
 const start=performance.now();
 while(performance.now()-start<600000){
  const {m,g}=await page.evaluate(()=>({m:bokuMetrics,g:revealInspection}));const own=g.units.find(e=>e.player);
  assert(Math.abs(own.mass-own.bodyRadius**2)<1e-6);assert.equal(m.world.width,initial.m.world.width);assert.equal(m.world.height,initial.m.world.height);
  maxFormerPrey=Math.max(maxFormerPrey,g.units.filter(e=>oldThreats.has(e.id)&&e.deaths===oldThreats.get(e.id)&&!e.dead&&own.r>e.r*1.06).length);
  if(m.growthStage>1&&!stages.some(s=>s.stage===m.growthStage)){stages.push({stage:m.growthStage,elapsed:m.elapsed,history:m.growthHistory});await page.screenshot({path:`work/four-play-${device}-stage${m.growthStage}.png`});}
  if(m.growthStage===4&&!wholeShot&&m.elapsed-m.growthHistory.at(-1).elapsed>7){wholeShot=true;await page.screenshot({path:`work/four-play-${device}-whole-frame.png`});assert(m.visibleWorld.width>m.world.width&&m.visibleWorld.height>m.world.height);}
  if(m.growthStage===2&&!expanded){expanded={...m};await page.screenshot({path:`work/four-play-${device}-expanding.png`});}
  if(expanded&&m.elapsed-expanded.growthExpandedAt>5&&!settled){settled=true;await page.screenshot({path:`work/four-play-${device}-flowing.png`});}
  if(Math.floor(m.elapsed/5)>lastSample){lastSample=Math.floor(m.elapsed/5);samples.push({elapsed:m.elapsed,ink:m.ink,radius:m.radius,stage:m.growthStage,camera:m.cameraScale,view:m.visibleWorld,progress:m.completion,kills:m.metrics.enemyBlooms,food:m.metrics.foodPickups,deaths:m.deaths,formerPrey:maxFormerPrey});fs.writeFileSync(`work/four-play-${device}-live.json`,JSON.stringify({initial:initial.m,expanded,samples,errors},null,2));}
  if(m.elapsed>600||m.scene!=='playing')break;
  let goal=null,score=-Infinity;
  for(const f of g.foods){const s=f.mass/(Math.hypot(f.x-own.x,f.y-own.y)+35);if(s>score){score=s;goal=f;}}
  for(const e of g.units){if(e.player||e.dead||e.invincible||own.r<=e.r*1.06)continue;const d=Math.hypot(e.x-own.x,e.y-own.y);if(d>320&&own.speed<e.speed)continue;const s=e.mass*.8/(d+50)*(m.growthStage>=3?(.3+e.uncovered)**2:1);if(s>score){score=s;goal=e;}}
  goal??={x:m.world.width/2,y:m.world.height/2};let dx=goal.x-own.x,dy=goal.y-own.y;
  for(const e of g.units){if(e.player||e.dead||e.r<=own.r*1.06)continue;const x=own.x-e.x,y=own.y-e.y,d=Math.hypot(x,y)||1,range=own.r+e.r+75;if(d<range){dx+=x/d*(range-d)*3;dy+=y/d*(range-d)*3;}}
  const len=Math.hypot(dx,dy)||1;
  if(mobile){if(!(await page.$eval('#joystick',el=>!!el.style.top))){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:80,y:640,id:1}]});}await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:80+dx/len*44,y:640+dy/len*44,id:1}]});}
  else{const keys=[];if(Math.abs(dx/len)>.3)keys.push(dx>0?'d':'a');if(Math.abs(dy/len)>.3)keys.push(dy>0?'s':'w');for(const k of held)if(!keys.includes(k))await page.keyboard.up(k);for(const k of keys)if(!held.includes(k))await page.keyboard.down(k);held=keys;}
  if(m.boostCooldown===0&&len>40){if(mobile){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:80+dx/len*44,y:640+dy/len*44,id:1},{x:330,y:775,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:80+dx/len*44,y:640+dy/len*44,id:1}]});}else await page.keyboard.press('Shift');}
  await page.waitForTimeout(45);
 }
 if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else for(const k of held)await page.keyboard.up(k);
 if(await page.evaluate(()=>bokuMetrics.scene==='finishing'))await page.waitForFunction(()=>bokuMetrics.scene==='finished',{timeout:15000});
 const final=await page.evaluate(()=>bokuMetrics);await page.screenshot({path:`work/four-play-${device}-final.png`});if(final.scene==='playing'){await page.click('#pauseBtn');const paused=await page.evaluate(()=>bokuMetrics.elapsed);await page.waitForTimeout(250);assert(Math.abs(await page.evaluate(()=>bokuMetrics.elapsed)-paused)<.06);await page.click('#resumeBtn');}
 assert(expanded,'actual ink must cause an expansion');assert(final.growthTransitions>=1);assert(final.cameraScale<initial.m.cameraScale);assert(maxFormerPrey>0);assert.deepEqual(errors,[]);
 fs.writeFileSync(`work/four-play-${device}.json`,JSON.stringify({initial:initial.m,expanded,final,stages,samples,maxFormerPrey,errors,clockScale:3,nativeInput:true},null,2));
 console.log(JSON.stringify({device,stages,scene:final.scene,progress:final.completion,expandedAt:expanded.growthExpandedAt,initialRadius:initial.m.radius,finalRadius:final.radius,initialScale:initial.m.cameraScale,finalScale:final.cameraScale,maxFormerPrey,kills:final.metrics.enemyBlooms,deaths:final.deaths,errors}));
 if(final.scene==='finished'){await page.reload();await page.waitForSelector('#loading[hidden]',{state:'attached',timeout:60000});await page.click('#albumBtn');assert((await page.locator('.gallery-grid').innerText()).includes('已解锁'));}
 await ctx.close();
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
