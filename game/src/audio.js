// Procedural WebAudio sounds — no audio files, no network. Every effect is a small
// oscillator/noise burst shaped by an envelope, so the game stays fully offline.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.32;
    return this.muted;
  }

  tone(freq, dur, type = 'sine', vol = 0.5, slideTo = null, delay = 0) {
    if (this.muted || !this.ensure()) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol = 0.4, lowpass = 1200, delay = 0) {
    if (this.muted || !this.ensure()) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = lowpass;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.master);
    src.start(t0);
  }

  jump() { this.tone(320, 0.16, 'square', 0.22, 620); }
  doubleJump() { this.tone(420, 0.14, 'square', 0.2, 760); }
  slide() { this.noise(0.18, 0.25, 900); }
  corn() { this.tone(880, 0.09, 'sine', 0.4); this.tone(1318, 0.12, 'sine', 0.32, null, 0.07); }
  feather() { this.tone(660, 0.12, 'triangle', 0.4, 990); this.tone(990, 0.16, 'triangle', 0.35, 1320, 0.09); }
  pie() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.35, null, i * 0.07)); }
  stumble() { this.noise(0.28, 0.5, 500); this.tone(140, 0.3, 'sawtooth', 0.3, 60); }
  gobble() {
    // A turkey gobble: three fast descending "gob" pulses.
    for (let i = 0; i < 3; i += 1) {
      this.tone(190 - i * 25, 0.11, 'sawtooth', 0.32, 90, i * 0.13);
      this.noise(0.07, 0.2, 700, i * 0.13);
    }
  }
  heartbeat() { this.tone(70, 0.12, 'sine', 0.55); this.tone(60, 0.14, 'sine', 0.45, null, 0.16); }
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.4, null, i * 0.11)); }
  lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.28, null, i * 0.16)); }
}
