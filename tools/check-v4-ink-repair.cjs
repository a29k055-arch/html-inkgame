// Focused shared-renderer art regression. External Playwright/sharp are test-only dependencies.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const deps='C:/Users/Nine/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||deps+'/playwright'),sharp=require(deps+'/sharp');
const base=process.argv[2]||'http://127.0.0.1:4191/',out=path.resolve('work/v4-ink-repair'+(process.env.INK_SPEED?'-'+process.env.INK_SPEED:''));fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),report={cases:[],errors:[]};
try{const page=await browser.newPage({viewport:{width:1000,height:650}});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))report.errors.push(r.status()+' '+r.url());});
await page.goto(new URL('visual-effects/v4.html',base).href);await page.waitForFunction(()=>window.v4Study);
for(const route of ['straight','corner','stop']){
 const tiles=[];let row=0;
 for(const size of ['18','90','170']){let col=0;for(const preset of ['living','wash','longcloud','airflow']){
  await page.selectOption('#preset',preset);await page.selectOption('#size',size);await page.selectOption('#speed',process.env.INK_SPEED||'220');await page.selectOption('#path',route);
  await page.evaluate(t=>v4Study.seek(t),route==='stop'?5.6:route==='corner'&&process.env.INK_SPEED==='100'?5.2:2.8);
  const state=await page.evaluate(()=>({s:v4StudyState,camera:v4Study.renderer.camera,viewW:v4Study.renderer.viewW,viewH:v4Study.renderer.viewH,profile:v4Study.renderer.fluid.motionProfile(),image:v4Study.renderer.canvas.toDataURL()}));
  assert.equal(state.s.targets,12);const buf=Buffer.from(state.image.split(',')[1],'base64'),{data,info}=await sharp(buf).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const cx=(state.s.entity.x-state.camera.x)*state.camera.scale*info.width/state.viewW,cy=(state.s.entity.y-state.camera.y)*state.camera.scale*info.height/state.viewH,rx=state.s.r*state.camera.scale*info.width/state.viewW,ry=state.s.r*state.camera.scale*info.height/state.viewH;let tailAlpha=0,tailDark=0,totalAlpha=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=data[(y*info.width+x)*4+3]/255;totalAlpha+=a;if(((x-cx)/rx)**2+((y-cy)/ry)**2>1.96){tailAlpha+=a;if(a>.8)tailDark++;}}
  const name=preset+'-'+size+'-'+route;await page.screenshot({path:path.join(out,name+'.png')});fs.writeFileSync(path.join(out,name+'-alpha.png'),buf);
  const label=Buffer.from('<svg width="500" height="32"><rect width="500" height="32" fill="#f5eedc"/><text x="12" y="22" font-size="17">'+preset+' | r='+size+' | '+route+'</text></svg>');
  const tile=await sharp(path.join(out,name+'.png')).resize(500,325).extend({top:32,bottom:0,left:0,right:0,background:'#f5eedc'}).composite([{input:label,left:0,top:0}]).png().toBuffer();tiles.push({input:tile,left:col*500,top:row*357});col++;
  report.cases.push({preset,size:Number(size),route,tailAlpha:Number(tailAlpha.toFixed(1)),tailDark,totalAlpha:Number(totalAlpha.toFixed(1)),targets:state.s.targets,profile:{bigBody:state.profile.bigBody||0,feed:state.profile.bodyFeed||1}});
 }
 row++;}
 await sharp({create:{width:2000,height:1071,channels:3,background:'#e7dfcc'}}).composite(tiles).png().toFile(path.join(out,'comparison-'+route+'.png'));
 console.log('Completed '+route);
}
assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({cases:report.cases.length,errors:report.errors,large:report.cases.filter(c=>c.size===170),out}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
