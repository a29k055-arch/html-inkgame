// Actual GPU pixels: body wash variation, time response, radius and unchanged tail.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const sharp=require(process.env.SHARP_MODULE||'C:/Users/Nine/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const base=process.argv[2]||'http://127.0.0.1:4191/',out='work/body-wash';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),report={base,cases:[],errors:[]};
try{const page=await browser.newPage({viewport:{width:1200,height:900}});page.on('pageerror',e=>report.errors.push(e.message));
await page.goto(new URL('visual-effects/v4.html',base).href);await page.waitForFunction(()=>window.v4Study);
for(const size of ['18','90','170','280'])for(const route of ['straight','curve','stop']){
await page.selectOption('#preset','swing');await page.selectOption('#size',size);await page.selectOption('#speed','100');await page.selectOption('#path',route);
const scale=size==='18'?3:size==='90'?1:size==='170'?.65:.5;await page.evaluate(({scale,time})=>v4Study.seek(time,{cameraScale:scale}),{scale,time:route==='stop'?7:route==='straight'?1.8:3});
const samples=await page.evaluate(()=>{const r=v4Study.renderer,f=r.fluid,e=v4StudyState.entity,phase=f.bodyTime;const a=r.canvas.toDataURL();f.bodyTime=phase+.8;f.draw(0);const b=r.canvas.toDataURL();f.bodyTime=phase;f.draw(0);return {a,b,cx:(e.x-r.camera.x)*r.camera.scale,cy:(e.y-r.camera.y)*r.camera.scale,radius:e.r*r.camera.scale,viewW:r.viewW,viewH:r.viewH,targets:f.targets.length};});
const raw=await sharp(Buffer.from(samples.a.split(',')[1],'base64')).ensureAlpha().raw().toBuffer({resolveWithObject:true}),other=await sharp(Buffer.from(samples.b.split(',')[1],'base64')).ensureAlpha().raw().toBuffer(),sx=raw.info.width/samples.viewW,sy=raw.info.height/samples.viewH;let vals=[],delta=0,tailDiff=0,tailCount=0;
for(let y=0;y<raw.info.height;y++)for(let x=0;x<raw.info.width;x++){const rho=Math.hypot((x-samples.cx*sx)/(samples.radius*sx),(y-samples.cy*sy)/(samples.radius*sy)),k=(y*raw.info.width+x)*4;if(rho<.85){vals.push(raw.data[k]);delta+=Math.abs(raw.data[k]-other[k]);}if(rho>1.08){tailCount++;for(let j=0;j<4;j++)tailDiff+=Math.abs(raw.data[k+j]-other[k+j]);}}
assert(vals.length>100,'body inside viewport');const mean=vals.reduce((a,b)=>a+b,0)/vals.length,std=Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0)/vals.length),change=delta/vals.length;
assert(std>3.5,`body must contain visible gray variation: ${size} ${route} ${std}`);assert(change>.6,`body must mix at rest/moving: ${size} ${route} ${change}`);assert.equal(tailDiff,0,'body animation cannot modify outside wake');assert.equal(samples.targets,12);
const result={size:Number(size),route,mean,std,temporalChange:change,tailDiff,tailCount,targets:samples.targets};report.cases.push(result);await page.screenshot({path:`${out}/${size}-${route}.png`});
}assert.deepEqual(report.errors,[]);
}finally{await browser.close();fs.writeFileSync(out+'/'+(base.startsWith('https:')?'online-report':'report')+'.json',JSON.stringify(report,null,2));}console.log(JSON.stringify(report));})().catch(e=>{console.error(e);process.exitCode=1;});
