// Assemble fixed, self-contained releases; no symlinks or shared mutable asset paths.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const out=path.resolve(process.argv[2]||'dist-pages'),workspace=process.cwd();
if(!out.startsWith(workspace+path.sep)||fs.existsSync(out))throw Error('Use a new output directory within this repository');
const releases={v2:['v2-scroll','d882581'],v3:['v3-reveal','1faf41f'],v4:['HEAD',null]};
function unpack(ref,dir){fs.mkdirSync(dir,{recursive:true});const data=execFileSync('git',['-c','core.autocrlf=false','archive',ref],{maxBuffer:256*1024*1024});execFileSync('tar',['-xf','-','-C',dir],{input:data,maxBuffer:1024*1024});}
const rootRef=process.env.GITHUB_REF_NAME==='main'?'HEAD':'origin/main';unpack(rootRef,out);
const manifest={root:execFileSync('git',['rev-parse',rootRef],{encoding:'utf8'}).trim(),versions:{}};
for(const [name,[ref,expected]] of Object.entries(releases)){const sha=execFileSync('git',['rev-parse',ref],{encoding:'utf8'}).trim();if(expected&&!sha.startsWith(expected))throw Error('Frozen release ref changed: '+ref);unpack(ref,path.join(out,name));manifest.versions[name]={ref,sha};}
unpack('v3-reveal',path.join(out,'previews','reveal-scroll'));
fs.writeFileSync(path.join(out,'versions.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest,null,2));

