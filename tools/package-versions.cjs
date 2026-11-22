// Assemble fixed, self-contained releases; no symlinks or shared mutable asset paths.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const out=path.resolve(process.argv[2]||'dist-pages'),workspace=process.cwd();
if(!out.startsWith(workspace+path.sep)||fs.existsSync(out))throw Error('Use a new output directory within this repository');
const releases={v2:['v2-original','1bb0250'],v3:['v3-roguelike','d882581'],v4:['v4-ink-reveal','10ef89b'],v5:['HEAD',null]};
function unpack(ref,dir,paths=[]){fs.mkdirSync(dir,{recursive:true});const data=execFileSync('git',['-c','core.autocrlf=false','archive',ref,...paths],{maxBuffer:512*1024*1024});execFileSync('tar',['-xf','-','-C',dir],{input:data,maxBuffer:1024*1024});}
const rootRef=process.env.GITHUB_REF_NAME==='main'?'HEAD':'origin/main';unpack(rootRef,out);
// Current/new version lives at both root and /v5/. V4 is unpacked from its frozen tag.
fs.copyFileSync(path.join(out,'v5.html'),path.join(out,'index.html'));
// V5 needs only its active working rigs. Keep the complete art/demo archive at root;
// do not duplicate every 4K master, evidence image and future creature under /v5/.
const v5Paths=execFileSync('git',['ls-tree','-z','--name-only','HEAD'],{encoding:'utf8'}).split('\0').filter(p=>p&&p!=='previews').concat(['previews/creature-rig/runtime',...["fish_04","fish_01","fish_02","fish_04_special","shrimp_07","shrimp_04","shrimp_05","turtle_02","turtle_08","dragon_04"].map(id=>'previews/creature-rig/'+id)]);
const manifest={root:execFileSync('git',['rev-parse',rootRef],{encoding:'utf8'}).trim(),versions:{}};
for(const [name,[ref,expected]] of Object.entries(releases)){const sha=execFileSync('git',['rev-parse',ref],{encoding:'utf8'}).trim();if(expected&&!sha.startsWith(expected))throw Error('Frozen release ref changed: '+ref);unpack(ref,path.join(out,name),name==='v5'?v5Paths:[]);if(name==='v5')fs.copyFileSync(path.join(out,name,'v5.html'),path.join(out,name,'index.html'));manifest.versions[name]={ref,sha};}
unpack('v3-reveal',path.join(out,'previews','reveal-scroll'));
unpack('v3-reveal',path.join(out,'archive','reveal-v3'));
unpack('v2-scroll',path.join(out,'archive','scroll-v2'));
fs.writeFileSync(path.join(out,'versions.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest,null,2));
