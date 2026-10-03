import { CONFIG } from '../config/experienceConfig';
import { clamp, lerp } from '../utils/math';

export class AudioSystem {
  private ctx?: AudioContext; private master?: GainNode; private filter?: BiquadFilterNode; private highpass?: BiquadFilterNode;
  private ambience?: GainNode; private gurgleGain?: GainNode; private wetGain?: GainNode; private delay?: DelayNode; private feedback?: GainNode; private gurgle?: HTMLAudioElement; private media?: HTMLAudioElement;
  private utterance?: SpeechSynthesisUtterance; private started = false;

  async start(text: string, audioPath?: string, onEnded?:()=>void): Promise<void> {
    this.ctx = new AudioContext(); await this.ctx.resume();
    this.master = this.ctx.createGain(); this.filter = this.ctx.createBiquadFilter(); this.highpass = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass'; this.filter.frequency.value = CONFIG.audio.normalCutoff;
    this.highpass.type = 'highpass'; this.highpass.frequency.value = 25;
    this.highpass.connect(this.filter).connect(this.master).connect(this.ctx.destination);
    this.createEchoPath();
    this.createUnderwaterAmbience();
    this.createGurgleTrack();
    if (audioPath && await this.exists(audioPath)) {
      this.media = new Audio(`${import.meta.env.BASE_URL}${audioPath.replace(/^\//, '')}`);
      this.media.onended=()=>onEnded?.();
      this.media.crossOrigin = 'anonymous';
      const source = this.ctx.createMediaElementSource(this.media); source.connect(this.highpass);
      await this.media.play();
    } else {
      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.onend=()=>onEnded?.();
      this.utterance.lang = 'zh-TW'; this.utterance.rate = 0.92; this.utterance.pitch = 0.86;
      const voices = speechSynthesis.getVoices();
      this.utterance.voice = voices.find(v => /zh[-_]TW/i.test(v.lang)) ?? voices.find(v => v.lang.startsWith('zh')) ?? null;
      speechSynthesis.cancel(); speechSynthesis.speak(this.utterance);
    }
    this.started = true;
  }

  async continueLecture(text:string,audioPath?:string,onEnded?:()=>void):Promise<void>{
    speechSynthesis.cancel();
    if(audioPath&&this.media&&await this.exists(audioPath)){
      this.media.pause();
      this.media.src=`${import.meta.env.BASE_URL}${audioPath.replace(/^\//,'')}`;
      this.media.onended=()=>onEnded?.();
      this.media.load();
      await this.media.play();
    }else{
      this.utterance=new SpeechSynthesisUtterance(text);
      this.utterance.lang='zh-TW';this.utterance.rate=.92;this.utterance.pitch=.86;this.utterance.onend=()=>onEnded?.();
      const voices=speechSynthesis.getVoices();this.utterance.voice=voices.find(v=>/zh[-_]TW/i.test(v.lang))??voices.find(v=>v.lang.startsWith('zh'))??null;
      speechSynthesis.speak(this.utterance);
    }
  }

  private async exists(path: string) { try { const response=await fetch(`${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`, { method: 'HEAD' }); return response.ok && (response.headers.get('content-type')??'').startsWith('audio/'); } catch { return false; } }
  private createUnderwaterAmbience() {
    if (!this.ctx || !this.master) return;
    this.ambience = this.ctx.createGain(); this.ambience.gain.value = 0;
    const osc = this.ctx.createOscillator(); const mod = this.ctx.createOscillator(); const modGain = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 72; mod.frequency.value = 0.7; modGain.gain.value = 13;
    mod.connect(modGain).connect(osc.frequency); osc.connect(this.ambience).connect(this.master); osc.start(); mod.start();
  }
  private createEchoPath() {
    if(!this.ctx||!this.filter||!this.master)return;
    this.delay=this.ctx.createDelay(.6);this.delay.delayTime.value=.16;
    this.feedback=this.ctx.createGain();this.feedback.gain.value=.22;
    this.wetGain=this.ctx.createGain();this.wetGain.gain.value=0;
    this.filter.connect(this.delay);this.delay.connect(this.feedback).connect(this.delay);this.delay.connect(this.wetGain).connect(this.master);
  }
  private createGurgleTrack() {
    if (!this.ctx) return;
    this.gurgle = new Audio(`${import.meta.env.BASE_URL}audio/gurgling.mp3`); this.gurgle.loop = true; this.gurgle.crossOrigin = 'anonymous';
    this.gurgleGain = this.ctx.createGain(); this.gurgleGain.gain.value = 0;
    const source=this.ctx.createMediaElementSource(this.gurgle);source.connect(this.gurgleGain).connect(this.ctx.destination);if(this.delay)source.connect(this.delay);
    void this.gurgle.play().catch(() => undefined);
  }
  update(immersion: number, waterlinePulse: number, waterAmount: number) {
    if (!this.ctx || !this.master || !this.filter || !this.highpass) return;
    const now = this.ctx.currentTime; const i = clamp(immersion + waterlinePulse * 0.18);
    const curve = Math.pow(i, 1.35);
    this.filter.frequency.setTargetAtTime(lerp(CONFIG.audio.normalCutoff, CONFIG.audio.underwaterCutoff, curve), now, 0.06);
    this.filter.Q.setTargetAtTime(lerp(.15, 2.6, curve), now, 0.08);
    this.highpass.frequency.setTargetAtTime(lerp(25, 440, curve), now, 0.06);
    this.master.gain.setTargetAtTime(lerp(1, CONFIG.audio.underwaterGain, curve), now, 0.1);
    this.ambience?.gain.setTargetAtTime(CONFIG.audio.bubbleMaxGain * .28 * curve, now, 0.08);
    const gurgleLevel=CONFIG.audio.bubbleMaxGain*(Math.pow(clamp(waterAmount),1.45)*.78+Math.pow(i,1.8)*.22);
    this.gurgleGain?.gain.setTargetAtTime(gurgleLevel, now, 0.16);
    this.wetGain?.gain.setTargetAtTime(CONFIG.audio.wetMix*curve,now,.09);
    this.delay?.delayTime.setTargetAtTime(lerp(.055,.19,curve),now,.1);
    this.feedback?.gain.setTargetAtTime(lerp(.08,.48,curve),now,.1);
    if (this.utterance) { this.utterance.rate = lerp(0.92, 0.72, i); this.utterance.pitch = lerp(0.86, 0.58, i); }
  }
  flush() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime; this.master.gain.cancelScheduledValues(now); this.master.gain.setValueAtTime(this.master.gain.value, now); this.master.gain.exponentialRampToValueAtTime(0.001, now + CONFIG.flush.duration);
    if(this.gurgleGain){this.gurgleGain.gain.cancelScheduledValues(now);this.gurgleGain.gain.setValueAtTime(this.gurgleGain.gain.value,now);this.gurgleGain.gain.exponentialRampToValueAtTime(.001,now+CONFIG.flush.duration);}
    const flush = new Audio(`${import.meta.env.BASE_URL}audio/tolet.mp3`); flush.volume = 0.9; void flush.play();
    setTimeout(() => { speechSynthesis.cancel(); this.media?.pause(); this.gurgle?.pause(); }, CONFIG.flush.duration*1000);
  }
  stop() { speechSynthesis.cancel(); this.media?.pause(); this.gurgle?.pause(); void this.ctx?.close(); this.started = false; }
  get currentTime() { return this.media?.currentTime ?? (this.ctx?.currentTime ?? 0); }
  get duration() { return this.media && Number.isFinite(this.media.duration) && this.media.duration>0 ? this.media.duration : CONFIG.lectureDuration; }
  get isStarted() { return this.started; }
}
