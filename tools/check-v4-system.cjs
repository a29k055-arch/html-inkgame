// Focused real-browser regression. Controlled ink/goal fixtures are not natural playthroughs.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.argv[2]||'http://127.0.0.1:4191/',out='work/system-repair';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),report={base,cases:[]};
try{for(const mobile of [false,true])for(const art of ['ink-01','ink-13']){
 const label=`${mobile?'mobile':'pc'}-${art}`,context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(({art})=>localStorage.setItem('boku.save.v4',JSON.stringify({saveVersion:2,settings:{selectedRevealArtwork:art,language:'zh'},progress:{}})),{art});
 assert.equal((await page.goto(base+'?inspect')).status(),200);await page.waitForSelector('#loading[hidden]',{state:'attached',timeout:60000});
 await page.click('#grindBtn');await page.waitForFunction(()=>window.bokuMetrics?.scene==='playing'&&bokuMetrics.startTransition.phase==='idle');
 await page.screenshot({path:`${out}/${label}-micro.png`});
 const before=await page.evaluate(()=>({position:bokuMetrics.position,samples:bokuMetrics.contactSamples}));
 if(mobile){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:65,y:670,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:115,y:670,id:1}]});await page.waitForTimeout(1000);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 else{await page.keyboard.down('d');await page.waitForTimeout(1000);await page.keyboard.up('d');}
 const contact=await page.evaluate(()=>({position:bokuMetrics.position,samples:bokuMetrics.contactSamples,writes:revealDebug.game.temporary.writes,maskVersion:revealDebug.game.mask.version,paintVersion:revealDebug.painter.last}));
 assert(contact.samples>before.samples);assert(contact.writes>0);assert.equal(contact.paintVersion,contact.maskVersion,'current contact must be painted in same frame');
 // Remove unrelated ecological loss only in this fixture, keep the actual camera/stage clocks.
 await page.evaluate(()=>{const g=revealDebug.game;g.arena.entities=g.arena.entities.slice(0,1);g.arena.foods.length=0;g.arena.foodTarget=0;g.arena.items.length=0;});
 const stages=[];
 for(const stage of [2,3,4]){
  await page.evaluate(async stage=>{const {syncReserve}=await import('./src/game/ink-reserve.js'),g=revealDebug.game;g.player.ink=g.config.growthStages.thresholds[stage-2]+2;g.player.turtleInk=0;syncReserve(g.player,0,true);},stage);
  await page.waitForFunction(stage=>bokuMetrics.growthStage===stage,stage);await page.waitForTimeout(5200);
  const state=await page.evaluate(()=>{const g=revealDebug.game,r=revealDebug.renderer;return {stage:g.journey.stage,scale:r.camera.scale,camera:{...r.camera},view:{w:r.viewW/r.camera.scale,h:r.viewH/r.camera.scale},world:g.world,ink:g.player.ink,radius:g.player.r,targets:r.fluid.targets.length,fallback:r.fallback};});
  if(stage===3){assert(state.camera.x>=-1e-5&&state.camera.y>=-1e-5);assert(state.view.w<=state.world.width+.01&&state.view.h<=state.world.height+.01);}
  stages.push(state);await page.screenshot({path:`${out}/${label}-stage${stage}.png`});
 }
 assert(stages[2].scale<stages[1].scale,'fourth camera modestly pulls out');
 await page.evaluate(()=>{window.finalePhases=[];const frame=()=>{const phase=revealDebug.viewer.phase,matte=bokuMetrics.startTransition.phase;const last=finalePhases.at(-1);if(last?.phase!==phase||last?.matte!==matte)finalePhases.push({phase,matte});if(revealDebug.viewer.phase!=='interactive')requestAnimationFrame(frame);};frame();const g=revealDebug.game;g.mask.fill(g.config.completionThreshold);g.checkGoal();});
 await page.waitForFunction(()=>revealDebug.viewer.phase==='interactive',{},{timeout:20000});
 const finale=await page.evaluate(()=>({phases:finalePhases,state:revealDebug.viewer.state,gameState:revealDebug.game.state,elapsed:revealDebug.game.elapsed}));
 const geometry=finale.state.geometry;assert(Math.abs(geometry.scale-geometry.fitScale)<1e-8);assert(geometry.imageWidth*geometry.scale<=geometry.bounds.width+.01);assert(geometry.imageHeight*geometry.scale<=geometry.bounds.height+.01);
 assert(finale.phases.findIndex(p=>p.phase==='framing')<finale.phases.findIndex(p=>p.phase==='flash'));assert.equal(finale.gameState,'finished');
 const center=mobile?{x:195,y:350}:{x:720,y:400};
 if(!mobile){await page.mouse.move(center.x,center.y);await page.mouse.wheel(0,-600);await page.waitForTimeout(150);}
 else{const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:350,id:1},{x:240,y:350,id:2}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:150-i*8,y:350,id:1},{x:240+i*8,y:350,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 const zoomed=await page.evaluate(()=>revealDebug.viewer.state.geometry);assert(zoomed.scale>geometry.scale*1.2,`${label} wheel/pinch must zoom`);
 if(!mobile){await page.mouse.move(center.x,center.y);await page.mouse.down();await page.mouse.move(center.x+90,center.y+70,{steps:8});await page.mouse.up();}
 else{const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:350,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:230,y:430,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 const dragged=await page.evaluate(()=>revealDebug.viewer.state.geometry);assert(Math.abs(dragged.x-zoomed.x)+Math.abs(dragged.y-zoomed.y)>1,'drag must move enlarged painting');
 await page.click('#paintingReset');const reset=await page.evaluate(()=>revealDebug.viewer.state.geometry);assert.equal(reset.scale,reset.fitScale);
 await page.screenshot({path:`${out}/${label}-painting.png`});await page.click('#paintingContinue');await page.waitForSelector('#result[open]');await page.click('#resultHome');await page.click('#albumBtn');
 const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('boku.save.v4')));assert(save.progress.revealArtworks[art].completed);assert(save.unlockedArtworks.includes(art));
 assert.deepEqual(errors,[]);report.cases.push({label,contact,stages,finale,zoomed,dragged,errors});await context.close();
}
}finally{await browser.close();fs.writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2));}
console.log(JSON.stringify({cases:report.cases.map(c=>({label:c.label,errors:c.errors,stages:c.stages.map(s=>({stage:s.stage,scale:s.scale})),contactWrites:c.contact.writes})),report:`${out}/browser-report.json`}));
})().catch(e=>{console.error(e);process.exitCode=1;});
