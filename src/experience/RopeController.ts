import { CONFIG } from '../config/experienceConfig';
export class RopeController {
  private startY=0; private pull=0; private dragging=false; private fired=false;
  constructor(private el:HTMLElement, private onFlush:()=>void){
    el.addEventListener('dragstart',e=>e.preventDefault());
    el.addEventListener('pointerdown',e=>{this.dragging=true;this.fired=false;this.startY=e.clientY;el.setPointerCapture(e.pointerId);el.classList.add('dragging');});
    el.addEventListener('pointermove',e=>{if(!this.dragging)return;this.pull=Math.max(0,Math.min(165,e.clientY-this.startY));this.el.style.setProperty('--pull',`${this.pull}px`);if(this.pull>=CONFIG.flush.pullThreshold&&!this.fired){this.fired=true;navigator.vibrate?.(35);this.onFlush();}});
    const up=()=>{this.dragging=false;this.pull=0;this.el.style.setProperty('--pull','0px');this.el.classList.remove('dragging');}; el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.onFlush();}});
  }
}
