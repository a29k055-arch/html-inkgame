// Packaged-site smoke against a real Chrome. Run with Node 22+ and CHROME_BIN if needed.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
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
  png:'image/png',jpg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml',woff2:'font/woff2'};
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
    await stat(file);
    res.writeHead(200,{'content-type':types[path.extname(file).slice(1)]||'application/octet-stream'});
    createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+srv.address().port+prefix;
const profile=await mkdtemp(path.join(tmpdir(),'boku-v6-qa-'));
const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking',
  '--disable-sync','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],
  {stdio:'ignore',windowsHide:true});
let chromeError=null;
proc.on('error',error=>{chromeError=error;});
async function until(fn,description,timeout=12000) {
  const end=Date.now()+timeout;
  let last;
  while(Date.now()<end){
    try { const value=await fn(); if(value) return value; } catch(err) {last=err;}
    await delay(90);
  }
  throw new Error('Timed out: '+description+(last?' ('+last.message+')':''));
}
async function session(endpoint) {
  const target=await (await fetch(endpoint+'/json/new?about:blank',{method:'PUT'})).json();
  const socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  const pending=new Map(), problems=[];
  let seq=0;
  socket.addEventListener('message',msg=>{
    const r=JSON.parse(msg.data);
    if(r.id){
      const cb=pending.get(r.id);
      if(cb){ pending.delete(r.id); if(r.error) cb.reject(new Error(r.error.message)); else cb.resolve(r.result); }
    }else if(r.method==='Runtime.exceptionThrown'){
      problems.push(r.params.exceptionDetails.exception?.description||r.params.exceptionDetails.text);
    }else if(r.method==='Network.responseReceived'){
      const {url,status}=r.params.response;
      if(status>=400 && !url.endsWith('/favicon.ico')) problems.push(status+' '+url);
    }
  });
  function rpc(method,params={}){
    const id=++seq;
    return new Promise((resolve,reject)=>{
      pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));
    });
  }
  async function js(expression){
    const r=await rpc('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
    return r.result.value;
  }
  const q=selector=>'document.querySelector('+JSON.stringify(selector)+')';
  const click=async selector=>{
    await until(()=>js(q(selector)+' && !'+q(selector)+'.disabled && '+q(selector)+'.getClientRects().length'),selector);
    await js(q(selector)+'.click()');
  };
  await Promise.all(['Runtime.enable','Network.enable','Page.enable'].map(method=>rpc(method)));
  return {rpc,js,q,click,problems,close:()=>socket.close()};
}
async function exercise(endpoint,mobile) {
  const {rpc,js,q,click,problems,close}=await session(endpoint);
  const width=mobile?390:1440,height=mobile?844:900;
  const visible=selector=>js('Boolean('+q(selector)+'?.getClientRects().length)');
  const waitVisible=s=>until(()=>visible(s),s);
  const text=s=>js(q(s)+'?.textContent?.trim()');
  const waitText=s=>until(()=>text(s),s+' text');
  const key=(type,code,key)=>rpc('Input.dispatchKeyEvent',{type,code,key});
  const touch=(type,touchPoints)=>rpc('Input.dispatchTouchEvent',{type,touchPoints});
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
    await rpc('Page.navigate',{url:base+(mobile?'v6/':'v6.html')});
    await waitText('#hero-title');
    assert.equal(await js('document.querySelectorAll("#slips [data-kind]").length'),10);
    assert.equal(await js('document.documentElement.scrollWidth<=innerWidth+2'),true);
    await until(()=>js('document.querySelector("#preview-art").naturalWidth>1'),'painting decoded');
    await capture('catalogue');
    await click('#settings-open');await waitVisible('#options');
    await click('#options [data-lang=en]');await until(()=>js('document.documentElement.lang==="en"'),'English');
    await click('#options [data-lang=ja]');await until(()=>js('document.documentElement.lang==="ja"'),'Japanese');
    await click('#options [data-lang=zh]');await until(()=>js('document.documentElement.lang==="zh"'),'Chinese');
    await click('#close-options');
    await click('#slips [data-kind=tutorial][data-index="0"]');await click('#start');
    await waitText('#lesson-line');
    await until(()=>js('!document.querySelector("#ink-wipe").getClientRects().length'),'input enabled');
    const lessonOne=await text('#pond-name');
    const amountBefore=Number(await text('#mass-value'));
    assert.ok(amountBefore>0);
    // Reach the first edible creature through the actual input path.
    if(mobile){
      await touch('touchStart',[{x:85,y:350,id:1}]);
      await touch('touchMove',[{x:155,y:350,id:1}]);
    }else await key('keyDown','KeyD','d');
    await until(async()=>Number(await text('#mass-value'))>amountBefore || await text('#pond-name')!==lessonOne,'first uptake',7000);
    if(mobile) await touch('touchEnd',[]); else await key('keyUp','KeyD','d');
    await until(async()=>await text('#pond-name')!==lessonOne,'automatic tutorial transition');
    await until(()=>js('!document.querySelector("#ink-wipe").getClientRects().length'),'transition cleared');
    await click('#pause');await waitVisible('#options');await click('#exit-run');await waitVisible('#library');
    await until(()=>js('!document.querySelector("#ink-wipe").getClientRects().length'),'catalogue ready');
    // Explicitly select the first main painting. This also works after completing a lesson.
    await click('#level-tab');await click('#slips [data-kind=level][data-index="0"]');await click('#start');
    await waitVisible('#field');await until(()=>js('!document.querySelector("#ink-wipe").getClientRects().length'),'pond ready');
    assert.equal(await visible('#lesson'),false);
    await until(async()=>Number(await text('#rival-value'))>Number(await text('#mass-value')),'competing masses');
    await capture('pond');
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
    if(mobile){
      await touch('touchStart',[{x:100,y:480,id:1},{x:210,y:480,id:2}]);
      await touch('touchMove',[{x:75,y:480,id:1},{x:235,y:480,id:2}]);
      await touch('touchEnd',[]);
    }else await rpc('Input.dispatchMouseEvent',{type:'mouseWheel',x:580,y:480,deltaX:0,deltaY:-300});
    const view=await js('({w:document.querySelector("#world").width,h:document.querySelector("#world").height,map:document.querySelector("#minimap").width,slots:document.querySelectorAll("#inventory .slot").length})');
    assert.ok(view.w>100 && view.h>100 && view.map>25);
    assert.equal(view.slots,3);
    await click('#pause');await waitVisible('#options');await click('#exit-run');await waitVisible('#library');
    assert.deepEqual(problems,[]);
    return {device:mobile?'390×844, emulated touch':'1440×900, desktop',lessonOne,firstCatch:true,
      autoAdvance:true,threeLanguages:true,mainMenuRoundtrip:true,canvas:view,frameIntervals:frames,errors:problems};
  }catch(error){if(problems.length)error.message+='; browser: '+problems.join(' | ');throw error;}
  finally{close();}
}
async function endToNextPainting(endpoint) {
  const {rpc,js,q,click,problems,close}=await session(endpoint);
  const showing=s=>js('Boolean('+q(s)+'?.getClientRects().length)');
  const waitClear=()=>until(()=>js('!document.querySelector("#ink-wipe").getClientRects().length'),'ink veil cleared');
  const card=i=>'#slips [data-kind=level][data-index="'+i+'"]';
  try {
    await rpc('Page.navigate',{url:base+'__qa__/finish.html'});
    await until(()=>js(q(card(1))+'?.dataset.locked==="true"'),'second painting initially locked');
    await click('#level-tab');await click(card(0));await click('#start');
    await until(()=>showing('#ending'),'finished pond and revealed painting');
    assert.ok(await js(q('#end-note')+'.textContent.includes("0:0")'));
    await until(()=>js(q('#ending-art')+'.naturalWidth>1'),'revealed artwork decoded');
    const name=await js(q('#end-title')+'.textContent');
    await click('#end-main');
    await until(()=>js(q('#pond-name')+'.textContent!=='+JSON.stringify(name)),'next painting entered');
    await waitClear();await click('#pause');await click('#exit-run');
    await until(()=>showing('#library'),'catalogue after victory');await waitClear();
    await rpc('Page.reload',{ignoreCache:true});
    await until(()=>js(q(card(1))+'?.dataset.locked==="false"'),'next painting unlocked after reload');
    assert.equal(await js(q(card(2))+'.dataset.locked'),'true');
    await click('#level-tab');await click(card(1));await click('#start');await until(()=>showing('#field'),'re-enter unlocked painting');
    const next=await js(q('#pond-name')+'.textContent');
    assert.notEqual(name,next);
    assert.deepEqual(problems,[]);
    return {fixture:'one edible enemy in first pond',revealed:name,advanced:next,persisted:true,subsequentPaintingLocked:true};
  }finally {close();}
}
try{
  const port=await until(async()=>{
    if(chromeError || proc.exitCode!==null) throw new Error('Chrome exited: '+(chromeError?.message??proc.exitCode));
    const active=await readFile(path.join(profile,'DevToolsActivePort'),'utf8');
    return Number(active.split('\n')[0]);
  },'Chrome startup',13000);
  const endpoint='http://127.0.0.1:'+port;
  const cases=[await exercise(endpoint,false),await exercise(endpoint,true)];
  const finish=await endToNextPainting(endpoint);
  if(!sourceMode){
    const old=await fetch(base+'v5/');
    assert.equal(old.status,200);
    assert.match(await old.text(),/src-v5\//);
  }
  console.log(JSON.stringify({chrome:(await (await fetch(endpoint+'/json/version')).json()).Browser,cases,finish,
    v5:sourceMode?'skipped (source checkout)':'entry served'},null,2));
}finally{
  proc.kill();
  srv.closeAllConnections();srv.close();
  // Wait for Chrome to release its private profile before discarding this test run.
  await until(()=>proc.exitCode!==null || proc.signalCode!==null || chromeError,'Chrome exit',3500).catch(()=>{});
  await rm(profile,{recursive:true,force:true,maxRetries:3}).catch(()=>{});
}
