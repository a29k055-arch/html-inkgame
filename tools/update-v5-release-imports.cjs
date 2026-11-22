// V5 is an independent module tree; V4's entry and module graph are never rewritten.
const fs=require('node:fs'),path=require('node:path'),release=process.argv[2];
if(!/^[a-zA-Z0-9_-]+$/.test(release||''))throw Error('Invalid V5 release key');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=[...walk('src-v5'),...walk('prototypes/ink/src')].filter(p=>p.endsWith('.js')).sort();
const imports=Object.fromEntries(files.map(p=>{const url='./'+p.replaceAll('\\','/');return[url,url+'?v='+release];}));
let html=fs.readFileSync('v5.html','utf8').replace(/<script type="importmap"[\s\S]*?<\/script>/,'<script type="importmap">'+JSON.stringify({imports})+'</script>');
html=html.replace(/src-v5\/ui\/game\.css(?:\?v=[^" ]+)?/,'src-v5/ui/game.css?v='+release);
fs.writeFileSync('v5.html',html);console.log('Versioned '+files.length+' V5 modules: '+release);
