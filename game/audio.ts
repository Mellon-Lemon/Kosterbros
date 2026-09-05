/** Original synthesised beat and sound effects; no downloads or licensed tracks. */
export class GameAudio {
  context: AudioContext | null = null; master: GainNode | null = null;
  muted = false; active = false; nextBeat = 0; beat = 0;
  unlock() {
    try {
      this.context ??= new AudioContext();
      if (!this.master) { this.master = this.context.createGain(); this.master.gain.value = this.muted ? 0 : .23; this.master.connect(this.context.destination); }
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch { /* Gameplay remains available when browser audio is unavailable. */ }
  }
  setMuted(muted: boolean) { this.muted = muted; if (this.context && this.master) this.master.gain.setTargetAtTime(muted ? 0 : .23, this.context.currentTime, .03); }
  tone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = .3, delay = 0, end?: number) {
    const c = this.context; if (!c || !this.master || this.muted) return;
    const oscillator = c.createOscillator(); const gain = c.createGain(); const time = c.currentTime + delay;
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, time);
    if (end) oscillator.frequency.exponentialRampToValueAtTime(end, time + duration);
    gain.gain.setValueAtTime(.001, time); gain.gain.linearRampToValueAtTime(volume, time + .007); gain.gain.exponentialRampToValueAtTime(.001, time + duration);
    oscillator.connect(gain); gain.connect(this.master); oscillator.start(time); oscillator.stop(time + duration + .01);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  effect(name: string) {
    if (name === 'jump') this.tone(230,.22,'sine',.38,0,570);
    else if(name === 'spin') { this.tone(350,.2,'triangle',.27,0,95); this.tone(500,.14,'sine',.15,.08,750); }
    else if(name === 'star') this.tone(1100,.075,'sine',.16);
    else if(name === 'ring') { this.tone(740,.15,'triangle',.25);this.tone(990,.15,'triangle',.25,.07); }
    else if(name === 'hit') this.tone(140,.3,'sawtooth',.22,0,45);
    else if(name === 'clear') this.tone(660,.09,'triangle',.14);
    else if(name === 'shield') [440,554,660,880].forEach((n,i) => this.tone(n,.22,'sine',.3,i*.07));
    else if(name === 'tick') this.tone(540,.1,'sine',.22);
    else if(name === 'win') [523,659,784,1047,784,1047].forEach((n,i) => this.tone(n,.35,'triangle',.35,i*.16));
    else if(name === 'lose') [392,330,262].forEach((n,i) => this.tone(n,.25,'triangle',.25,i*.17));
  }
  update(dt: number, active: boolean, stage: number) {
    if (!active) { this.nextBeat = 0; return; }
    this.nextBeat -= dt;
    if (this.nextBeat > 0) return;
    this.nextBeat += 60 / (stage === 2 ? 126 : 116) / 2;
    const step = this.beat++ % 16;
    if (step % 4 === 0) this.tone(140,.16,'sine',.6,0,42);
    if (step % 4 === 2) { this.tone(180,.08,'triangle',.24,0,110);this.tone(2200,.035,'square',.045); }
    this.tone(6500,.025,'square',step % 2 ? .025 : .045,0,4100);
    const bass = [65.4,65.4,77.8,87.3][Math.floor(step/4)];
    if (step % 2 === 0) this.tone(bass,.19,'triangle',.32);
    if (stage > 0 && step % 2 === 1) this.tone([523,659,784,659,523,622,784,932][Math.floor(step/2)],.17,'sine',.11);
  }
  destroy() { void this.context?.close().catch(() => {}); this.context = null; }
}
