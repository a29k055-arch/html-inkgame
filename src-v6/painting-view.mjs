import {PaintingView} from '../src-v5/reveal/painting-view.js';

// Keep V5's pinch anchor, pan limits and framing. Interpolate the displayed
// pose independently so a wheel tick and the Fit button also ease into place.
export class PondPaintingView extends PaintingView {
  paint(){
    if(this.phase!=='interactive'||!this.options.frameDuration||!this.geometry){
      this.stopGlide();
      super.paint();
      return;
    }
    const target=this.geometry;
    if(!this.displayed){
      this.displayed={x:target.x,y:target.y,scale:target.scale};
      super.paint();
      return;
    }
    if(this.animation)return;
    if(this.displayed.x===target.x && this.displayed.y===target.y && this.displayed.scale===target.scale){
      super.paint();
      return;
    }
    const from={...this.displayed},start=performance.now();
    const step=now=>{
      this.animation=0;
      if(this.phase!=='interactive')return;
      const t=Math.min(1,Math.max(0,(now-start)/160)),u=t*t*(3-2*t);
      // Input always updates the target geometry, even during a running glide.
      const goal=this.geometry;
      this.displayed={
        x:from.x+(goal.x-from.x)*u, y:from.y+(goal.y-from.y)*u,
        scale:Math.exp(Math.log(from.scale)+(Math.log(goal.scale)-Math.log(from.scale))*u)
      };
      if(t===1)this.displayed={x:goal.x,y:goal.y,scale:goal.scale};
      this.geometry=this.displayed;
      try{super.paint();}finally{this.geometry=goal;}
      if(t<1)this.animation=requestAnimationFrame(step);
    };
    this.animation=requestAnimationFrame(step);
  }
  stopGlide(){
    if(this.animation)cancelAnimationFrame(this.animation);
    this.animation=0;
    this.displayed=null;
  }
  hide(){this.stopGlide();super.hide();}
}
