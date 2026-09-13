/** Original synthesised beat and sound effects; no downloads or licensed tracks. */
export class GameAudio {
  context: AudioContext | null = null;
  master: GainNode | null = null;
  muted = false;
  active = false;
  nextBeat = 0;
  beat = 0;
  unlock() {
    try {
      this.context ??= new AudioContext();
      if (!this.master) {
        this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : 0.23;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended')
        void this.context.resume().catch(() => {});
    } catch {
      /* Gameplay remains available when browser audio is unavailable. */
    }
  }
  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        muted ? 0 : 0.23,
        this.context.currentTime,
        0.03,
      );
  }
  tone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3,
    delay = 0,
    end?: number,
  ) {
    const c = this.context;
    if (!c || !this.master || this.muted) return;
    const oscillator = c.createOscillator();
    const gain = c.createGain();
    const time = c.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    if (end)
      oscillator.frequency.exponentialRampToValueAtTime(end, time + duration);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.007);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.01);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  effect(name: string) {
    if (name === 'jump') this.tone(230, 0.22, 'sine', 0.38, 0, 570);
    else if (name === 'doublejump') {
      this.tone(450, 0.25, 'sine', 0.32, 0, 950);
      this.tone(680, 0.15, 'triangle', 0.18, 0.1, 1200);
    } else if (name === 'rope')
      [660, 880, 1100].forEach((n, i) =>
        this.tone(n, 0.19, 'triangle', 0.22, i * 0.07),
      );
    else if (name === 'perfect') {
      this.tone(880, 0.13, 'triangle', 0.24);
      this.tone(1320, 0.16, 'sine', 0.18, 0.06);
    } else if (name === 'powerup')
      [523, 784].forEach((n, i) => this.tone(n, 0.17, 'sine', 0.25, i * 0.07));
    else if (name === 'power')
      [262, 330, 392, 523, 784].forEach((n, i) =>
        this.tone(n, 0.3, 'triangle', 0.28, i * 0.07),
      );
    else if (name === 'discohit') {
      this.tone(155, 0.12, 'sine', 0.4, 0, 45);
      this.tone(880, 0.14, 'square', 0.06);
      this.tone(1320, 0.18, 'triangle', 0.18);
    } else if (name === 'disco')
      [523, 659, 784, 1047].forEach((n, i) =>
        this.tone(n, 0.24, 'triangle', 0.22, i * 0.065),
      );
    else if (name === 'spin') {
      this.tone(350, 0.2, 'triangle', 0.27, 0, 95);
      this.tone(500, 0.14, 'sine', 0.15, 0.08, 750);
    } else if (name === 'star') this.tone(1100, 0.075, 'sine', 0.16);
    else if (name === 'ring') {
      this.tone(740, 0.15, 'triangle', 0.25);
      this.tone(990, 0.15, 'triangle', 0.25, 0.07);
    } else if (name === 'hit') this.tone(140, 0.3, 'sawtooth', 0.22, 0, 45);
    else if (name === 'clear') this.tone(660, 0.09, 'triangle', 0.14);
    else if (name === 'shield')
      [440, 554, 660, 880].forEach((n, i) =>
        this.tone(n, 0.22, 'sine', 0.3, i * 0.07),
      );
    else if (name === 'tick') this.tone(540, 0.1, 'sine', 0.22);
    else if (name === 'win')
      [523, 659, 784, 1047, 784, 1047].forEach((n, i) =>
        this.tone(n, 0.35, 'triangle', 0.35, i * 0.16),
      );
    else if (name === 'lose')
      [392, 330, 262].forEach((n, i) =>
        this.tone(n, 0.25, 'triangle', 0.25, i * 0.17),
      );
  }
  update(dt: number, active: boolean, stage: number, disco = false) {
    if (!active) {
      this.nextBeat = 0;
      return;
    }
    this.nextBeat -= dt;
    if (this.nextBeat > 0) return;
    this.nextBeat += 60 / (disco ? 132 : stage === 2 ? 126 : 116) / 2;
    const step = this.beat++ % 16;
    if (disco) {
      [523, 659, 784].forEach((n) =>
        this.tone(n * (step % 2 ? 1 : 2), 0.11, 'triangle', 0.055),
      );
      this.tone(step % 2 ? 130.8 : 65.4, 0.18, 'sawtooth', 0.1);
      this.tone(8000, 0.04, 'square', 0.045);
    }
    if (step % 4 === 0) this.tone(140, 0.16, 'sine', 0.6, 0, 42);
    if (step % 4 === 2) {
      this.tone(180, 0.08, 'triangle', 0.24, 0, 110);
      this.tone(2200, 0.035, 'square', 0.045);
    }
    this.tone(6500, 0.025, 'square', step % 2 ? 0.025 : 0.045, 0, 4100);
    const bass = [65.4, 65.4, 77.8, 87.3][Math.floor(step / 4)];
    if (step % 2 === 0) this.tone(bass, 0.19, 'triangle', 0.32);
    if (stage > 0 && step % 2 === 1)
      this.tone(
        [523, 659, 784, 659, 523, 622, 784, 932][Math.floor(step / 2)],
        0.17,
        'sine',
        0.11,
      );
  }
  destroy() {
    void this.context?.close().catch(() => {});
    this.context = null;
  }
}
