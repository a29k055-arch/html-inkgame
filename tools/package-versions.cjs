// Assemble fixed, self-contained releases; no symlinks or shared mutable asset paths.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const out=path.resolve(process.argv[2]||'dist-pages'),workspace=process.cwd();
if(!out.startsWith(workspace+path.sep)||fs.existsSync(out))throw Error('Use a new output directory within this repository');
const releases={v2:['v2-original','1bb0250'],v3:['v3-roguelike','d882581'],v4:['v4-ink-reveal','10ef89b'],v5:['HEAD',null]};
function unpack(ref,dir,paths=[]){fs.mkdirSync(dir,{recursive:true});const data=execFileSync('git',['-c','core.autocrlf=false','archive',ref,...paths],{maxBuffer:512*1024*1024});execFileSync('tar',['-xf','-','-C',dir],{input:data,maxBuffer:1024*1024});}
const rootRef=process.env.GITHUB_REF_NAME==='main'?'HEAD':'origin/main';
// Preview-only commits must not silently replace the live game's rig/runtime.
const v5Ref=execFileSync('git',['rev-list','-1',rootRef,'--','src-v5','v5.html'],{encoding:'utf8'}).trim();if(!v5Ref)throw Error('No owned V5 release found');releases.v5=[v5Ref,null];unpack(rootRef,out);
// Current/new version lives at both root and /v5/. V4 is unpacked from its frozen tag.
const entry='<!doctype html><meta charset="utf-8"><title>墨 · V5</title><style>body{background:#eee7d7;color:#5c5949;font-family:serif;padding:12vh 8vw}</style><script>location.replace(new URL("./v5/"+location.search+location.hash,location.href).href)</script><a href="./v5/">正在进入《墨》V5……</a>';fs.writeFileSync(path.join(out,'index.html'),entry);fs.writeFileSync(path.join(out,'v5.html'),entry);
// V5 needs only its active working rigs. Keep the complete art/demo archive at root;
// do not duplicate every 4K master, evidence image and future creature under /v5/.
const v5Paths=execFileSync('git',['ls-tree','-z','--name-only',v5Ref],{encoding:'utf8'}).split('\0').filter(p=>p&&p!=='previews').concat(['previews/creature-rig/runtime',...["fish_04","fish_01","fish_02","fish_04_special","shrimp_07","shrimp_04","shrimp_05","turtle_02","turtle_08","dragon_04"].map(id=>'previews/creature-rig/'+id)]);
const manifest={root:v5Ref,deployment:execFileSync('git',['rev-parse',rootRef],{encoding:'utf8'}).trim(),versions:{}};
for(const [name,[ref,expected]] of Object.entries(releases)){const sha=execFileSync('git',['rev-parse',ref],{encoding:'utf8'}).trim();if(expected&&!sha.startsWith(expected))throw Error('Frozen release ref changed: '+ref);unpack(ref,path.join(out,name),name==='v5'?v5Paths:[]);if(name==='v5')fs.copyFileSync(path.join(out,name,'v5.html'),path.join(out,name,'index.html'));manifest.versions[name]={ref,sha};}
unpack('v3-reveal',path.join(out,'previews','reveal-scroll'));
unpack('v3-reveal',path.join(out,'archive','reveal-v3'));
unpack('v2-scroll',path.join(out,'archive','scroll-v2'));

// V6 has its own entry and save data. Its source, artwork and rigs already
// exist in the root archive, so both URLs can load the same release files.
const pondSource = fs.readFileSync(path.join(out, 'v6.html'), 'utf8');
// A returning V6 player can still have the former title screen, JS and CSS
// cached. Version every V6 module together, including its relative imports.
const revision = manifest.deployment.slice(0, 12);
const v6Modules = fs.readdirSync(path.join(out, 'src-v6')).filter(name => name.endsWith('.mjs'));
const v6Imports = Object.fromEntries(v6Modules.map(name => {
  const url = './src-v6/' + name;
  return [url, url + '?v=' + revision];
}));
const pondHtml = pondSource.replace('</head>', '<script type="importmap">' + JSON.stringify({imports:v6Imports}) + '</script></head>')
  .replace(/((?:src|href)="src-v6\/(?:app\.mjs|[\w-]+\.css|opening\.html))"/g, '$1?v=' + revision + '"');
if (!/<head>/i.test(pondHtml) || /<base\b/i.test(pondHtml)) {
  throw new Error('v6.html must have a head and use project-relative URLs');
}
const pondDir = path.join(out, 'v6');
fs.mkdirSync(pondDir, { recursive: true });
fs.writeFileSync(path.join(out, 'v6.html'), pondHtml);
const coverFile = path.join(out, 'src-v6', 'opening.html');
const versionedCover = fs.readFileSync(coverFile, 'utf8')
  .replace(/((?:\.\/)?opening(?:-scene\.mjs|-save\.mjs|\.css))"/g,'$1?v='+revision+'"');
fs.writeFileSync(coverFile, versionedCover);
fs.writeFileSync(
  path.join(pondDir, 'index.html'),
  pondHtml.replace(/<head>/i, '<head><base href="../">')
);
const pondAssets = [
  'src-v6/app.mjs',
  'src-v6/opening.html','src-v6/opening-scene.mjs','src-v6/pond-ink.mjs','src-v6/enemy-art.mjs',
  ...['urchin-ink','vortex-ink','urchin-breath'].map(n => `src-v6/art/${n}.webp`),
  ...['bamboo-slip.png','bamboo-roll-cross-section.png','bamboo-scroll-open-24.png','bamboo-scroll.js','bamboo-scroll.css'].map(n => `assets/ui/bamboo-scroll/${n}`),
  'assets/home/menu-reference.png','src-v5/reveal/renderer.js','src-v5/ink/living-painter.js',
  'src-v5/ink/start-transitions.js',
  ...[1, 2].map(n => `assets/effects/start/start-0${n}.webp`),
  ...[1, 2, 3, 4, 6, 7].map(n => `assets/artworks/v4-cropped/${n}.png`)
];
for (const file of pondAssets) {
  if (!fs.statSync(path.join(out, file)).isFile()) throw new Error('Missing V6 asset: ' + file);
}
manifest.versions.v6 = { ref: rootRef, sha: manifest.deployment, entry: 'v6/' };

fs.writeFileSync(path.join(out,'versions.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest,null,2));
