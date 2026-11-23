// Packaged-site smoke against a real Chrome. Run with Node 22+ and CHROME_BIN if needed.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createReadStream, existsSync} from 'node:fs';
import {mkdtemp,mkdir,readFile,stat,rm,writeFile} from 'node:fs/promises';
import http from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const rootFlag=process.argv.indexOf('--site-root');
const root=path.resolve(rootFlag<0?'dist-pages':process.argv[rootFlag+1]);
const sourceMode=process.argv.includes('--source');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(f=>f && existsSync(f));
if(!chrome) throw new Error('Install a Chromium browser or set CHROME_BIN.');
const types={html:'text/html',js:'text/javascript',mjs:'text/javascript',css:'text/css',json:'application/json',
  png:'image/png',jpg:'image/jpeg',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',woff2:'font/woff2',
  wav:'audio/wav',ogg:'audio/ogg',mp3:'audio/mpeg',webm:'video/webm',mp4:'video/mp4'};
const prefix='/html-inkgame/';
const srv=http.createServer(async (req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(!url.pathname.startsWith(prefix)) throw new Error('wrong deployment root');
    // Keep the victory fixture entirely on this ephemeral test server. The
    // production entry, physics tick, reveal, UI, storage and next level run normally.
    if(url.pathname===prefix+'__qa__/finish.html') {
      const html=await readFile(path.join(root,'v6.html'),'utf8');
      const map=JSON.stringify({imports:{'./src-v6/levels.mjs':'./__qa__/levels.mjs'}});
      res.writeHead(200,{'content-type':'text/html'});
      res.end(html.replace('<head>','<head><base href="../"><script type="importmap">'+map+'</script>'));return;
    }
    if(url.pathname===prefix+'__qa__/levels.mjs') {
      res.writeHead(200,{'content-type':'text/javascript'});
      res.end(`export * from '../src-v6/levels.mjs?original';
        import {makeLevel as make} from '../src-v6/levels.mjs?original';
        export function makeLevel(id,seed) {
          const cfg=make(id,seed);
          if(id==='level-1') {
            cfg.enemies=[{type:'hole',mass:cfg.player.mass-1,x:cfg.player.x+12,y:cfg.player.y}];
          }
          return cfg;
        }`);return;
    }
    if(sourceMode && url.pathname===prefix+'v6/'){
      const html=await readFile(path.join(root,'v6.html'),'utf8');
      res.writeHead(200,{'content-type':'text/html'});
      res.end(html.replace('<head>','<head><base href="../">'));return;
    }
    let file=path.resolve(root,decodeURIComponent(url.pathname.slice(prefix.length)));
    if(file!==root && !file.startsWith(root+path.sep)) throw new Error('outside site');
    if((await stat(file)).isDirectory()) file=path.join(file,'index.html');
    const info=await stat(file);
    res.writeHead(200,{'content-type':types[path.extname(file).slice(1)]||'application/octet-stream',
      'content-length':info.size});
    createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+srv.address().port+prefix;
async function until(fn,description,timeout=12000) {
  const end=Date.now()+timeout;
  let last;
  while(Date.now()<end){
    try { const value=await fn(); if(value) return value; } catch(err) {
      if(err.fatal)throw err;
      last=err;
    }
    await delay(90);
  }
  throw new Error('Timed out: '+description+(last?' ('+last.message+')':''));
}
let chromeVersion;
async function withBrowser(task) {
  const profile=await mkdtemp(path.join(tmpdir(),'boku-v6-qa-'));
  const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking',
    '--disable-sync','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],
    {stdio:['ignore','ignore','pipe'],windowsHide:true});
  let startupLog='';
  proc.stderr.setEncoding('utf8').on('data',chunk=>{startupLog=(startupLog+chunk).slice(-2400);});
  let chromeError=null;
  proc.on('error',error=>{chromeError=error;});
  try {
    const port=await until(async()=>{
      if(chromeError || proc.exitCode!==null || proc.signalCode) throw Object.assign(new Error('Chrome exited: '+(chromeError?.message??proc.exitCode??proc.signalCode)+' '+startupLog),{fatal:true});
      const active=await readFile(path.join(profile,'DevToolsActivePort'),'utf8');
      return Number(active.split('\n')[0]);
    },'Chrome startup',60000).catch(error=>{throw new Error(error.message+' '+startupLog);});
    const endpoint='http://127.0.0.1:'+port;
    if(!chromeVersion) {
      const result=await fetch(endpoint+'/json/version',{signal:AbortSignal.timeout(15000)});
      chromeVersion=(await result.json()).Browser;
    }
    return await task(endpoint);
  } finally {
    proc.kill();
    await until(()=>proc.exitCode!==null || proc.signalCode!==null || chromeError,'Chrome exit',3500).catch(()=>{});
    await rm(profile,{recursive:true,force:true,maxRetries:3}).catch(()=>{});
  }
}
async function session(endpoint) {
  const target=await (await fetch(endpoint+'/json/new?about:blank',{method:'PUT',signal:AbortSignal.timeout(15000)})).json();
  const socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Timed out opening Chrome debugger socket')),15000);
    socket.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
    socket.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('Chrome debugger socket failed to open'));},{once:true});
    socket.addEventListener('close',()=>{clearTimeout(timer);reject(new Error('Chrome debugger socket closed'));},{once:true});
  });
  const pending=new Map(), problems=[], loaded=new Set();
  let seq=0;
  function disconnected(){
    for(const {timer,reject,method} of pending.values()){
      clearTimeout(timer);
      reject(Object.assign(new Error('Chrome disconnected during '+method),{fatal:true}));
    }
    pending.clear();
  }
  socket.addEventListener('close',disconnected);
  socket.addEventListener('error',disconnected);
  socket.addEventListener('message',msg=>{
    const r=JSON.parse(msg.data);
    if(r.id){
      const cb=pending.get(r.id);
      if(cb){ clearTimeout(cb.timer); pending.delete(r.id); if(r.error) cb.reject(new Error(r.error.message)); else cb.resolve(r.result); }
    }else if(r.method==='Runtime.exceptionThrown'){
      problems.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);
    }else if(r.method==='Network.responseReceived'){
      const {url,status}=r.params.response;
      if(status>=200 && status<400)loaded.add(new URL(url).pathname);
      if(status>=400 && !url.endsWith('/favicon.ico')) problems.push(status+' '+url);
    }
  });
  function rpc(method,params={}){
    const id=++seq;
    return new Promise((resolve,reject)=>{
      if(socket.readyState!==WebSocket.OPEN){
        reject(Object.assign(new Error('Chrome disconnected before '+method),{fatal:true}));return;
      }
      const timer=setTimeout(()=>{
        pending.delete(id);
        reject(Object.assign(new Error('Chrome did not answer '+method+' within 30 seconds'),{fatal:true}));
      },30000);
      pending.set(id,{resolve,reject,timer,method});
      try{socket.send(JSON.stringify({id,method,params}));}
      catch(error){clearTimeout(timer);pending.delete(id);reject(Object.assign(error,{fatal:true}));}
    });
  }
  async function js(expression){
    const r=await rpc('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
    return r.result.value;
  }
  const q=selector=>'document.querySelector('+JSON.stringify(selector)+')';
  let touchScreen=false;
  async function click(selector,insideOpening=false){
    const point=await until(()=>js(`(()=>{
      const frame=${insideOpening} && document.querySelector('#v6-opening');
      const doc=frame?frame.contentDocument:document;
      const el=doc?.querySelector(${JSON.stringify(selector)});
      if(!el || el.disabled || el.closest('[inert]') || !el.getClientRects().length)return null;
      el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
      const r=el.getBoundingClientRect(), x=r.x+r.width/2,y=r.y+r.height/2;
      if(!el.contains(doc.elementFromPoint(x,y)))return null;
      const offset=frame && frame.getBoundingClientRect();
      const position={x:x+(offset?.x||0),y:y+(offset?.y||0)};
      if(frame && document.elementFromPoint(position.x,position.y)!==frame)return null;
      return position;
    })()`),'interactive '+selector,45000);
    if(touchScreen){
      await rpc('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});
      await rpc('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }else{
      await rpc('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
      await rpc('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
    }
  }
  await Promise.all(['Runtime.enable','Network.enable','Page.enable'].map(method=>rpc(method)));
  await rpc('Page.bringToFront');
  await rpc('Storage.clearDataForOrigin',{origin:new URL(base).origin,storageTypes:'all'});
  return {rpc,js,q,click,problems,loaded,setTouch(value){touchScreen=value;},async close(){
    socket.close();
  }};
}
// Record the visible loading interface while the real V5 artwork and pond resources stream.
// A fast cached load must not make the test sample only the final, hidden panel.
async function watchLoading(rpc) {
  await rpc('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
    // Network prefetch alone is insufficient. Observe the paintings being
    // sent to Canvas while the pond is visible; remove the hook immediately.
    window.__pondPainted={};
    const proto=CanvasRenderingContext2D.prototype, original=proto.drawImage;
    proto.drawImage=function(source,...args){
      const result=original.call(this,source,...args);
      const url=source?.currentSrc;
      if(!url || !document.querySelector('#field')?.getClientRects().length)return result;
      if(url.endsWith('/urchin-breath.webp')||url.endsWith('/urchin-ink.webp'))window.__pondPainted.spike=true;
      if(url.endsWith('/vortex-ink.webp'))window.__pondPainted.hole=true;
      if(window.__pondPainted.spike && window.__pondPainted.hole)proto.drawImage=original;
      return result;
    };
  })()`});
}
async function enterCatalogue(s,{capture,checkLoad=false}={}) {
  const {js,click}=s;
  const frame='document.querySelector("#v6-opening")';
  const doc=frame+'?.contentDocument';
  const fromCover=selector=>doc+'?.querySelector('+JSON.stringify(selector)+')';
  await until(()=>js('Boolean('+fromCover('#grindBtn')+')'),'original cover DOM',55000);
  const blocked=await js('Boolean(document.querySelector("#pond-app")?.inert || document.querySelector("#library")?.hidden)');
  assert.equal(blocked,true,'Gallery must be unavailable before PLAY.');
  if(checkLoad){
    await js(`(()=>{
      const d=${doc},arr=window.__acceptanceLoad=[];
      const sample=()=>{
        if(d.querySelector('#loading')?.hidden)return;
        const amount=d.querySelector('#loadingResources')?.textContent||'';
        const name=d.querySelector('#loadingCurrent')?.textContent?.trim()||'';
        const progress=d.querySelector('#loadProgress')?.value;
        const last=arr.at(-1);
        if(!last||last.amount!==amount||last.name!==name||last.progress!==progress)arr.push({amount,name,progress});
      };
      new MutationObserver(sample).observe(d,{subtree:true,childList:true,characterData:true,attributes:true});sample();
    })()`);
  }
  if(checkLoad && capture){
    await until(()=>js(`Number(${fromCover('#bamboo-load')}?.getAttribute('aria-valuenow'))>4 && ${fromCover('#loadingResources')}?.textContent.includes('MB')`),'painted bamboo loader and MB counts',55000);
    if(await js('Boolean('+fromCover('#loading')+' && !'+fromCover('#loading')+'.hidden)'))await capture('loading');
  }
  await until(async()=>{
    const failure=await js(`${fromCover('#loading')}?.classList.contains('load-failed') && ${fromCover('#loadingCurrent')}?.textContent`);
    if(failure || s.problems.length)throw Object.assign(new Error('Opening could not run: '+(failure||s.problems.join(' | '))),{fatal:true});
    return js(`${frame}?.contentWindow?.loadingMetrics?.resourcesReady && ${fromCover('#loading')}?.hidden && ${fromCover('#grindBtn')}?.getClientRects().length`);
  },'PLAY available after the real load',120000);
  const cover=await js(`(()=>{
    const f=${frame},w=f.contentWindow,d=f.contentDocument,mark=d.querySelector('.title-mark img');
    return {title:mark?.getAttribute('src'),titleDecoded:mark?.naturalWidth||0,
      primary:d.querySelector('#grindBtn').textContent.trim(),resources:window.__acceptanceLoad||[]};
  })()`);
  assert.match(cover.title,/assets\/home\/menu-reference\.png/);
  assert.ok(cover.titleDecoded>0 && cover.primary.length,'Original title and PLAY must be painted.');
  let receivedMb=null,resourceExample=null;
  if(checkLoad){
    const transfers=cover.resources.map(r=>{
      const m=r.amount.match(/([\d.]+)\s*\/\s*([\d.]+)\s*MB/i);
      return m?{loaded:Number(m[1]),total:Number(m[2]),name:r.name}:null;
    }).filter(Boolean);
    assert.ok(transfers.some(t=>t.total>0 && t.loaded<t.total),'Missing an intermediate byte count. '+
      JSON.stringify({count:cover.resources.length,start:cover.resources.slice(0,3),end:cover.resources.slice(-2)}));
    receivedMb=Math.max(...transfers.map(t=>t.loaded));assert.ok(receivedMb>0,'Never saw downloaded data.');
    resourceExample=transfers.find(t=>/\.(png|webp|svg|json|jpe?g)/i.test(t.name))?.name;
    assert.ok(resourceExample,'No resource name displayed during startup.');
  }
  if(capture)await capture('cover');
  await click('#grindBtn',true);
  await until(()=>js(`!document.querySelector('#pond-app')?.inert && Boolean(document.querySelector('#library')?.getClientRects().length) && (document.querySelector('#v6-opening')?.hidden || !document.querySelector('#v6-opening')?.getClientRects().length)`),'PLAY entered the bamboo catalogue',45000);
  return {title:cover.title,menu:cover.primary,receivedMb,resourceExample};
}
async function exercise(endpoint,mobile) {
  const s=await session(endpoint);
  const {rpc,js,q,click,problems,close,loaded}=s;
  s.setTouch(mobile);
  const width=mobile?390:1440,height=mobile?844:900;
  const visible=selector=>js('Boolean('+q(selector)+'?.getClientRects().length)');
  const waitVisible=s=>until(()=>visible(s),s);
  const text=s=>js(q(s)+'?.textContent?.trim()');
  const waitText=s=>until(()=>text(s),s+' text');
  const touch=(type,touchPoints)=>rpc('Input.dispatchTouchEvent',{type,touchPoints});
  async function steerRight(){
    const x=Math.round(width*.22),y=Math.round(height*.42);
    await until(()=>js('!document.querySelector("#field").inert && document.querySelector("#ink-wipe").hidden'),'pond accepts input after the ink transition');
    await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    assert.equal(await js('document.elementFromPoint('+x+','+y+')?.id'),'world','Water input intercepted.');
    const engaged=await until(async()=>{
      if(!mobile)await rpc('Input.dispatchMouseEvent',{type:'mouseMoved',x,y,buttons:0});
      if(mobile){
        await touch('touchStart',[{x,y,id:1}]);await touch('touchMove',[{x:x+70,y,id:1}]);
      }else{
        await rpc('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
        await rpc('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+70,y,buttons:1});
      }
      if(await js('!document.querySelector("#joystick").hidden'))return true;
      await stopSteering();
      return false;
    },'visible joystick responding to a real drag',18000);
    assert.ok(engaged);
  }
  async function stopSteering(){
    if(mobile)await touch('touchEnd',[]);
    else await rpc('Input.dispatchMouseEvent',{type:'mouseReleased',x:Math.round(width*.22)+70,
      y:Math.round(height*.42),button:'left',buttons:0,clickCount:1});
  }
  async function capture(view){
    if(!process.env.V6_QA_SCREENSHOTS)return;
    const dir=path.resolve(process.env.V6_QA_SCREENSHOTS);
    await mkdir(dir,{recursive:true});
    const {data}=await rpc('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
    await writeFile(path.join(dir,(mobile?'mobile':'desktop')+'-'+view+'.png'),Buffer.from(data,'base64'));
  }
  try{
    await rpc('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:mobile?2:1,mobile});
    if(mobile) await rpc('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
    await watchLoading(rpc);
    await rpc('Page.navigate',{url:base+(mobile?'v6/':'v6.html')});
    const opening=await enterCatalogue(s,{capture,checkLoad:true});
    assert.equal(await js('document.querySelectorAll("#slips [data-kind]").length'),10);
    assert.equal(await js('document.documentElement.scrollWidth<=innerWidth+2'),true);
    assert.equal(await js('getComputedStyle(document.querySelector("#slips .bamboo-level-name")).writingMode'),'vertical-rl');
    const slipImage=await js('document.querySelector("#slips .bamboo-level")?.getBoundingClientRect().height');
    assert.ok(slipImage>40,'Actual playable slip must have a touch-sized target.');
    await capture('catalogue');
    await click('#settings-open');await waitVisible('#options');
    await click('#options [data-lang=en]');await until(()=>js('document.documentElement.lang==="en"'),'English');
    await click('#options [data-lang=ja]');await until(()=>js('document.documentElement.lang==="ja"'),'Japanese');
    await click('#options [data-lang=zh]');await until(()=>js('document.documentElement.lang==="zh"'),'Chinese');
    await click('#close-options');
    await click('#slips [data-kind=tutorial][data-index="0"]');
    await waitText('#lesson-line');
    await until(()=>js('!document.querySelector("#ink-wipe").getClientRects().length'),'input enabled');
    const lessonOne=await text('#pond-name');
    const amountBefore=Number(await text('#mass-value'));
    assert.ok(amountBefore>0);
    // Reach the first edible creature through the actual input path.
    await steerRight();
    await until(async()=>Number(await text('#mass-value'))>amountBefore || await text('#pond-name')!==lessonOne,'first uptake',22000);
    await stopSteering();
    await until(async()=>await text('#pond-name')==='辨敌' && (await text('#lesson-line')).includes('刺球'),'automatic tutorial transition to the first spine');
    await until(()=>js('!document.querySelector("#ink-wipe").getClientRects().length'),'transition cleared');
    // The second lesson uses 100 against 175 for the spine, then resets to
    // 100 against 177 for the ink well. The displayed loss must reach the well.
    await steerRight();
    const blackHole=await until(()=>js(`(()=>{
      const player=Number(document.querySelector('#mass-value').textContent);
      const rival=Number(document.querySelector('#rival-value').textContent);
      return player<=96 && player>=78 && rival>=181 && Math.abs(player+rival-277)<=1 ? {player,rival}:null;
    })()`),'red well gains the ink the real player loses',45000);
    await capture('black-hole-contact');
    await stopSteering();
    await click('#pause');await waitVisible('#options');await click('#exit-run');await waitVisible('#library');
    await until(()=>js('!document.querySelector("#ink-wipe").getClientRects().length'),'catalogue ready');
    // Explicitly select the first main painting. This also works after completing a lesson.
    await click('#level-tab');await click('#slips [data-kind=level][data-index="0"]');
    await waitVisible('#field');await until(()=>js('!document.querySelector("#ink-wipe").getClientRects().length'),'pond ready');
    assert.equal(await visible('#lesson'),false);
    await until(async()=>Number(await text('#rival-value'))>Number(await text('#mass-value')),'competing masses');
    await until(()=>js('window.__pondPainted?.spike && window.__pondPainted?.hole'),'both enemy illustrations really drawn');
    await capture('pond');
    const inkRenderer=await until(()=>js(`(()=>{
      const m=window.bokuMetrics;
      return m?.heroTrailMode && {trail:m.heroTrailMode,preset:m.heroPreset,backend:m.backend,livingInk:m.livingInk};
    })()`),'running V5 trail renderer');
    const frames=await js(`new Promise(resolve=>{
      const times=[];let previous;
      function sample(now){
        if(previous!==undefined) times.push(now-previous);
        previous=now;
        if(times.length===60){
          const sorted=times.sort((a,b)=>a-b);
          resolve({frames:times.length,medianMs:+sorted[29].toFixed(1),p95Ms:+sorted[56].toFixed(1)});
        }else requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    })`);
    // This rectangle is the visible camera bounds, drawn by the production minimap.
    // Watch one draw call so a delivered but ignored gesture cannot satisfy the test.
    await js(`(()=>{
      const c=document.querySelector('#minimap').getContext('2d'),fn=c.strokeRect;
      c.strokeRect=function(x,y,w,h){window.__cameraBox={w,h};return fn.call(this,x,y,w,h);};
    })()`);
    const beforeZoom=await until(()=>js('window.__cameraBox?.w'),'minimap viewport before zoom');
    if(mobile){
      await touch('touchStart',[{x:100,y:480,id:1},{x:210,y:480,id:2}]);
      await touch('touchMove',[{x:75,y:480,id:1},{x:235,y:480,id:2}]);
      await touch('touchEnd',[]);
    }else await rpc('Input.dispatchMouseEvent',{type:'mouseWheel',x:580,y:480,deltaX:0,deltaY:-300});
    const afterZoom=await until(()=>js('window.__cameraBox?.w<'+(beforeZoom*.98)+' && window.__cameraBox.w'),'zoom changes the actual minimap bounds');
    const view=await js('({w:document.querySelector("#world").width,h:document.querySelector("#world").height,map:document.querySelector("#minimap").width,slots:document.querySelectorAll("#inventory .slot").length})');
    assert.ok(view.w>100 && view.h>100 && view.map>25);
    assert.equal(view.slots,3);
    await click('#pause');await waitVisible('#options');await click('#exit-run');await waitVisible('#library');
    await click('#back-cover');
    await enterCatalogue(s);
    const textures=['urchin-ink.webp','vortex-ink.webp'];
    for(const name of textures)assert.ok([...loaded].some(url=>url.endsWith('/'+name)),'Browser never loaded '+name);
    assert.deepEqual(problems,[]);
    return {device:mobile?'390×844, emulated touch':'1440×900, desktop',opening,inkRenderer,illustratedEnemies:textures,blackHole,lessonOne,firstCatch:true,
      autoAdvance:true,threeLanguages:true,mainMenuRoundtrip:true,canvas:view,minimapWidths:[beforeZoom,afterZoom],frameIntervals:frames,errors:problems};
  }catch(error){
    await capture('failure');
    const state=await js(`({width:innerWidth,height:innerHeight,at:document.elementFromPoint(85,350)?.outerHTML?.slice(0,140),
      lesson:document.querySelector('#lesson-line')?.textContent,mass:document.querySelector('#mass-value')?.textContent,
      rival:document.querySelector('#rival-value')?.textContent,stickHidden:document.querySelector('#joystick')?.hidden,
      renderer:window.bokuMetrics?.backend,frames:window.bokuMetrics?.renderedFrames,hidden:document.hidden})`).catch(()=>null);
    console.error('Pond browser diagnostics:',JSON.stringify(state),problems);
    error.message+='; '+JSON.stringify(state);
    if(problems.length)error.message+='; browser: '+problems.join(' | ');
    throw error;
  }
  finally{await close();}
}
async function endToNextPainting(endpoint) {
  const s=await session(endpoint);
  const {rpc,js,q,click,problems,close}=s;
  const showing=s=>js('Boolean('+q(s)+'?.getClientRects().length)');
  const waitClear=()=>until(()=>js('!document.querySelector("#ink-wipe").getClientRects().length'),'ink veil cleared');
  const card=i=>'#slips [data-kind=level][data-index="'+i+'"]';
  try {
    await rpc('Page.navigate',{url:base+'__qa__/finish.html'});
    await enterCatalogue(s);
    await until(()=>js(q(card(1))+'?.dataset.locked==="true"'),'second painting initially locked');
    await click('#level-tab');await click(card(0));
    await until(()=>js(q('#paintingView')+'?.dataset.phase==="interactive"'),'full painting inspection',25000);
    assert.ok(await js(q('#paintingCanvas')+'.width>100 && '+q('#paintingCanvas')+'.height>100'));
    await click('#paintingContinue');
    await until(()=>showing('#ending'),'finished pond and revealed painting');
    assert.ok(await js(q('#end-note')+'.textContent.includes("0:0")'));
    const name=await js(q('#end-title')+'.textContent');
    await click('#end-main');
    await until(()=>js(q('#pond-name')+'.textContent!=='+JSON.stringify(name)),'next painting entered');
    await waitClear();await click('#pause');await click('#exit-run');
    await until(()=>showing('#library'),'catalogue after victory');await waitClear();
    await rpc('Page.reload',{ignoreCache:true});
    await enterCatalogue(s);
    await until(()=>js(q(card(1))+'?.dataset.locked==="false"'),'next painting unlocked after reload');
    assert.equal(await js(q(card(2))+'.dataset.locked'),'true');
    await click('#level-tab');await click(card(1));await until(()=>showing('#field'),'re-enter unlocked painting');
    const next=await js(q('#pond-name')+'.textContent');
    assert.notEqual(name,next);
    assert.deepEqual(problems,[]);
    return {fixture:'one edible enemy in first pond',revealed:name,advanced:next,persisted:true,subsequentPaintingLocked:true};
  }finally {await close();}
}
try{
  const cases=[];
  for(const mobile of [false,true]){
    console.log('Exercising '+(mobile?'touch':'mouse')+' from the shipped cover.');
    const report=await withBrowser(endpoint=>exercise(endpoint,mobile));
    cases.push(report);console.log(JSON.stringify(report));
  }
  console.log('Exercising victory, full painting and saved unlock.');
  const finish=await withBrowser(endToNextPainting);
  let oldCover=null;
  if(!sourceMode){
    const old=await fetch(base+'v5/');
    assert.equal(old.status,200);
    assert.equal(createHash('sha256').update(Buffer.from(await old.arrayBuffer())).digest('hex'),
      '8804e0812c403d6503b4548668246d79f7c7e7c4521ebd0df5e982712af718f4','V5 entry differs from its frozen release.');
    await withBrowser(async endpoint=>{
      const v5=await session(endpoint);
      try{
        await v5.rpc('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
        await v5.rpc('Page.navigate',{url:base+'v5/'});
        await until(()=>v5.js('window.loadingMetrics?.resourcesReady && document.querySelector("#loading")?.hidden'),'frozen V5 cover ready',120000);
        oldCover=await v5.js(`({title:document.querySelector('.title-mark img')?.getAttribute('src'),play:document.querySelector('#grindBtn')?.textContent?.trim(),version:document.body.dataset.version})`);
        assert.ok(cases[0].opening.title.endsWith(oldCover.title));
        assert.ok(oldCover.play && oldCover.version==='v5');
        if(process.env.V6_QA_SCREENSHOTS){
          const {data}=await v5.rpc('Page.captureScreenshot',{format:'png',fromSurface:true});
          await writeFile(path.join(process.env.V6_QA_SCREENSHOTS,'original-v5-cover.png'),Buffer.from(data,'base64'));
        }
      }finally{await v5.close();}
    });
  }
  console.log(JSON.stringify({chrome:chromeVersion,cases,finish,
    v5:oldCover||'skipped (source checkout)'},null,2));
}finally{
  srv.closeAllConnections();srv.close();
}
