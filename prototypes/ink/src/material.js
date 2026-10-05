// The primary ink reservoir and its wake share one size, one velocity field and one density field.
export class MaterialInk {
 constructor(fluid,canvas){this.fluid=fluid;this.canvas=canvas;this.time=0;this.seeded=false;this.nextFeed=0;canvas.hidden=true;}
 resize(){this.reset();}
 reset(){this.seeded=false;this.nextFeed=0;this.canvas.getContext('2d').clearRect(0,0,this.canvas.width,this.canvas.height);}
 radius(entity){return entity.radius*Math.min(1,this.fluid.aspect);}
 seed(entity){const f=this.fluid,r=this.radius(entity);for(let i=0;i<21;i++){const a=i*2.399963,dist=r*(.12+Math.sqrt(i/21)*.32);f.inject({x:entity.x+Math.cos(a)*dist/f.aspect,y:entity.y+Math.sin(a)*dist,vx:Math.sin(a)*r*330,vy:Math.cos(a)*r*330,radius:r*(.12+(i%4)*.025),intensity:.8+(i%5)*.16});}this.seeded=true;}
 update(entity,dt){this.canvas.hidden=true;this.time+=dt;const f=this.fluid,r=this.radius(entity);if(!this.seeded)this.seed(entity);
  f.pass('material',f.v.write,{field:f.d.read,velocity:f.v.read,point:[entity.x,1-entity.y],force:[entity.vx*f.w,-entity.vy*f.h],radius:r*1.4,dt,time:this.time});f.v.swap();
  // Dense, continually advected core makes the controlled position readable without a fixed painted circle.
  f.inject({x:entity.x,y:entity.y,vx:0,vy:0,radius:r*.32,intensity:dt*18});
  this.nextFeed-=dt;if(this.nextFeed<=0){this.nextFeed=.13;const a=this.time*2.3;f.inject({x:entity.x+Math.cos(a)*r*.16/f.aspect,y:entity.y+Math.sin(a)*r*.16,vx:0,vy:0,radius:r*.32,intensity:.35});}
  f.pass('contain',f.d.write,{field:f.d.read,point:[entity.x,1-entity.y],force:[entity.vx,-entity.vy],radius:r,dt});f.d.swap();
 }
 draw(){this.canvas.hidden=true;}
 splash(entity,strength=1){if(!this.seeded)this.seed(entity);const r=this.radius(entity);for(let i=0;i<13;i++){const a=i*2.399963;this.fluid.stir({x:entity.x+Math.cos(a)*r*.34/this.fluid.aspect,y:entity.y+Math.sin(a)*r*.34,vx:Math.cos(a)*r*1450*strength,vy:Math.sin(a)*r*1450*strength,radius:r*.20});}}
}
