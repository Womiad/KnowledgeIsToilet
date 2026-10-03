import { CONFIG } from '../config/experienceConfig';
import { clamp, lerp, smoothstep } from '../utils/math';

export class WaterSystem {
  level = 1.08; private width = 1; private height = 1; private dpr = 1;
  constructor(private canvas: HTMLCanvasElement) { this.resize(); addEventListener('resize', () => this.resize()); }
  private resize() { const r = this.canvas.getBoundingClientRect(); this.dpr = Math.min(devicePixelRatio, 2); this.canvas.width = r.width * this.dpr; this.canvas.height = r.height * this.dpr; this.width = r.width; this.height = r.height; }
  surface(x: number, time: number, violence = 1) { const n = x / this.width; return this.level * this.height + this.height * CONFIG.waveAmplitude * violence * (Math.sin(n * 15 + time * 1.4) * .55 + Math.sin(n * 29 - time * 2.1) * .25 + Math.sin(n * 7 + time * .65) * .35); }
  update(progress: number, time: number, flushing: number) {
    const ctx = this.canvas.getContext('2d')!; ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.clearRect(0, 0, this.width, this.height);
    const target = lerp(0.985, 0.03, smoothstep(CONFIG.waterStartProgress, CONFIG.waterFullProgress, progress));
    this.level = flushing > 0 ? lerp(target, 1.08, smoothstep(.12, .92, flushing)) : target;
    if (this.level > 1.04) return;
    const violence = 1 + Math.sin(Math.PI * flushing) * 3.4; const grad = ctx.createLinearGradient(0, this.level * this.height, 0, this.height);
    grad.addColorStop(0, 'rgba(119,205,222,.62)'); grad.addColorStop(.42, 'rgba(65,159,190,.57)'); grad.addColorStop(1, 'rgba(22,98,145,.74)');
    ctx.beginPath(); ctx.moveTo(0, this.surface(0, time, violence));
    for (let x = 8; x <= this.width + 8; x += 8) ctx.lineTo(x, this.surface(x, time, violence));
    ctx.lineTo(this.width, this.height); ctx.lineTo(0, this.height); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); for (let x = 0; x <= this.width; x += 9) { const y = this.surface(x, time, violence) - 2; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = 'rgba(226,250,250,.86)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.globalAlpha = .45; for (let i = 0; i < 20; i++) { const x = (i * 83 + time * (11 + i % 4)) % this.width; const y = ((i * 137 + time * 24) % Math.max(20, this.height - this.level * this.height)) + this.level * this.height; ctx.beginPath(); ctx.arc(x, y, 2 + i % 5, 0, Math.PI * 2); ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.stroke(); } ctx.globalAlpha = 1;
  }
  immersionAt(yNorm: number, time: number) {
    const surface = this.surface(this.width * .36, time) / this.height;
    const approachRange = .12;
    if (surface > yNorm) return clamp((yNorm + approachRange - surface) / approachRange) * .32;
    return clamp(.32 + ((yNorm - surface) / .085) * .68);
  }
}
