import assert from 'node:assert/strict';
import fs from 'node:fs';
import {V4_ARTWORKS,V4_BACKGROUNDS} from '../src/data/v4-artworks.js';
import {RevealPainter} from '../src/reveal/painter.js';
assert.equal(new Set(V4_ARTWORKS.map(a=>a.id)).size,11);
for(const art of V4_ARTWORKS){
 const png=fs.readFileSync(new URL(art.src));
 assert.equal(png.readUInt32BE(16),art.width);assert.equal(png.readUInt32BE(20),art.height);
 assert.match(art.title,/^[\u3400-\u9fff]{4}$/);
 assert(art.src.includes('/assets/artworks/v4-cropped/'));
}
assert(V4_BACKGROUNDS.every(b=>V4_ARTWORKS.some(a=>a.src===b.src)));
const context={putImageData(){},clearRect(){},drawImage(){}};
globalThis.ImageData=class {constructor(w,h){this.data=new Uint8ClampedArray(w*h*4)}};
globalThis.document={createElement:()=>({getContext:()=>context})};
const cells=new Float32Array([0,.5,1]),temp=new Float32Array(3);
const run={config:{fogImageOpacity:.06},world:{width:3,height:1},mask:{cols:3,rows:1,cells,version:0},temporary:{cells:temp,version:0}};
const painter=new RevealPainter({naturalWidth:3,naturalHeight:1},run);painter.update();
assert.deepEqual([3,7,11].map(i=>painter.pixels.data[i]),[15,135,255]);
assert.deepEqual([...cells],[0,.5,1]);assert.deepEqual([...temp],[0,0,0]);
console.log('PASS cropped PNG dimensions/titles/cover-only catalog, faint fog is visual-only with smooth alpha and unchanged gameplay masks');
