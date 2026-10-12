// Original pixels only: no game, reveal mask, actor or fluid field is referenced here.
export class HomeArtwork {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.ripples=[];this.image=null;this.resize();}
 resize(){this.dirty=true;this.w=innerWidth;this.h=innerHeight;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=this.w*d;this.canvas.height=this.h*d;this.ctx.setTransform(d,0,0,d,0,0);}
 setBackground(image){this.image=image;this.dirty=true;this.ripples=[];this.draw(0);}
 interact(x,y,click=false){this.dirty=true;if(this.ripples.length>=8)this.ripples.shift();this.ripples.push({x,y,age:0,strength:click?1:.35});}
 draw(dt){if(!this.image||(!this.dirty&&!this.ripples.length))return;this.dirty=false;const c=this.ctx,img=this.image,s=Math.max(this.w/img.naturalWidth,this.h/img.naturalHeight),x=(this.w-img.naturalWidth*s)/2,y=(this.h-img.naturalHeight*s)/2;c.clearRect(0,0,this.w,this.h);c.drawImage(img,x,y,img.naturalWidth*s,img.naturalHeight*s);
  for(const ripple of this.ripples){ripple.age+=dt;const radius=26+ripple.age*48,fade=Math.max(0,1-ripple.age/1.5)*ripple.strength;
   // Small concentric strips resample the original image by at most 1.1 CSS pixels.
   for(let band=0;band<3;band++){const r=radius+band*6,shift=Math.sin(ripple.age*9-band)*1.1*fade;c.save();c.beginPath();c.arc(ripple.x,ripple.y,r,0,Math.PI*2);c.arc(ripple.x,ripple.y,Math.max(0,r-3),0,Math.PI*2,true);c.clip('evenodd');c.drawImage(img,x+shift,y-shift*.4,img.naturalWidth*s,img.naturalHeight*s);c.restore();}
  }this.ripples=this.ripples.filter(r=>r.age<1.5);
 }
 dispose(){this.ripples=[];}
}
