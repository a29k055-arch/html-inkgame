const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.argv[2]||'http://127.0.0.1:4191/',out='work/solid-live';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),cases=[];
try{for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 assert.equal((await page.goto(base+'?inspect')).status(),200);await page.waitForSelector('#loading[hidden]',{state:'attached',timeout:60000});await page.click('#grindBtn');await page.waitForFunction(()=>bokuMetrics.scene==='playing'&&bokuMetrics.startTransition.phase==='idle');
 await page.evaluate(()=>{const a=revealDebug.game.arena;a.entities=[a.player];a.items=[];a.foods=[];a.foodTarget=0;});
 const radii=[];for(const radius of [18,90,170,280]){
  await page.evaluate(async radius=>{const {syncReserve}=await import('./src/game/ink-reserve.js'),g=revealDebug.game,r=revealDebug.renderer,p=g.player;p.ink=(radius-12)/g.config.growthStages.sizeLinear;p.turtleInk=0;p.effects={};p.vx=p.vy=0;p.collisionScale=1;syncReserve(p,0,true);g.journey.recalculate(p);r.updateCamera(p,0,true);r.fluid.clear();r.body.reset();},radius);
  await page.waitForTimeout(350);const state=await page.evaluate(async()=>{const {coreRadius}=await import('./src/game/alien-geometry.js'),g=revealDebug.game,r=revealDebug.renderer;return {radius:g.player.r,core:coreRadius(g.player),projectedCore:r.fluid.solidCore.radius*r.viewH/r.camera.scale,stage:g.journey.stage,camera:r.camera.scale,center:r.fluid.solidCore.point,preset:r.trail.presetKey,targets:r.fluid.targets.length,contact:g.temporary.writes,mask:g.mask.version,paint:revealDebug.painter.last};});
  assert.equal(state.preset,'restored');assert.equal(state.targets,12);assert(Math.abs(state.core-state.projectedCore)<1e-8);assert(Math.abs(state.radius-radius)<1e-7);assert.equal(state.mask,state.paint);radii.push(state);await page.screenshot({path:`${out}/${base.startsWith('https:')?'online':'local'}-${mobile?'mobile':'pc'}-${radius}.png`});
 }
 assert.deepEqual(errors,[]);cases.push({mobile,radii,errors});await context.close();
}}finally{await browser.close();fs.writeFileSync(`${out}/${base.startsWith('https:')?'online':'local'}-report.json`,JSON.stringify({base,cases},null,2));}
console.log(JSON.stringify({base,cases}));})().catch(e=>{console.error(e);process.exitCode=1;});
