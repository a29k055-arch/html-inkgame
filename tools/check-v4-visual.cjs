// Requires an externally installed Playwright, not a game runtime dependency.
// PLAYWRIGHT_MODULE may be an absolute module directory. Serve the repository first.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.argv[2]||'http://127.0.0.1:4194/',out=path.resolve('work/v4-visual-check');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1300,height:800}}),errors=[],report=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('visual-effects/v4.html',base).href);
  await page.waitForFunction(()=>window.v4Study);
  for(const preset of ['living','wash'])for(const size of ['18','90','170'])for(const speed of ['100','220','320']){
   await page.selectOption('#preset',preset);await page.selectOption('#size',size);
   await page.selectOption('#speed',speed);await page.selectOption('#path','straight');
   await page.evaluate(()=>v4Study.seek(2.5));
   const state=await page.evaluate(()=>v4StudyState);
   assert.equal(state.targets,12);assert.equal(state.gpuCloud,true);
   await page.screenshot({path:path.join(out,`${preset}-${size}-${speed}.png`)});
   report.push({preset,size,speed,targets:state.targets});
  }
  for(const size of ['18','90','170'])for(const route of ['corner','return','stop']){
   await page.selectOption('#preset','wash');await page.selectOption('#size',size);
   await page.selectOption('#speed','220');await page.selectOption('#path',route);
   await page.evaluate(t=>v4Study.seek(t),route==='stop'?6:2.6);
   const state=await page.evaluate(()=>v4StudyState);
   assert.equal(state.targets,12);if(route==='stop')assert.equal(state.points.length,0);
   await page.screenshot({path:path.join(out,`wash-${size}-${route}.png`)});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({report,errors},null,2));
  console.log('PASS compiled H/I, identical size/speed inputs, corner/return/stop and bounded GPU targets. Inspect screenshots for art quality.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
