import { RunnerModel, type GameEvent } from './core';
import { SETTINGS as S, POWERUPS, type PowerUp } from './settings';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
};
type Floater = {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
};
const LIME = '#c4f659',
  PURPLE = '#b49aff',
  GOLD = '#ffdc7e';
const fract = (n: number) => n - Math.floor(n);
const noise = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

export class Renderer {
  canvas: HTMLCanvasElement;
  c: CanvasRenderingContext2D;
  model: RunnerModel;
  width = 1280;
  height = 680;
  ground = 535;
  px = 280;
  clock = 0;
  shake = 0;
  particles: Particle[] = [];
  floaters: Floater[] = [];
  banner = '';
  bannerLife = 0;
  reducedMotion = false;
  resizeObserver: ResizeObserver;
  constructor(canvas: HTMLCanvasElement, model: RunnerModel) {
    this.canvas = canvas;
    this.model = model;
    const c = canvas.getContext('2d');
    if (!c)
      throw new Error(
        'Je browser ondersteunt dit spel niet. Probeer Chrome of Edge.',
      );
    this.c = c;
    this.reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // Keep at least 1.6 seconds of look-ahead in portrait; letterbox vertically.
    this.width = Math.max(960, (r.width / r.height) * 680);
    this.height = (this.width * r.height) / r.width;
    this.px = this.width * 0.235;
    this.ground = Math.max(555, this.height * 0.72);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
  }
  reset() {
    this.particles = [];
    this.floaters = [];
    this.banner = '';
    this.bannerLife = 0;
    this.shake = 0;
  }
  event(e: GameEvent) {
    const m = this.model;
    const color = m.state.bro === 'epke' ? LIME : PURPLE;
    if (e.type === 'hit') {
      this.shake = 0.35;
      this.burst(this.px, this.ground - 50, '#ff7896', 23);
      this.float(e.text || '', this.px + 65, this.ground - 205, '#ff9bad');
    }
    if (e.type === 'star' || e.type === 'ring')
      this.burst(
        this.px + (e.x || 0),
        this.ground - (e.height || 60),
        GOLD,
        e.type === 'ring' ? 18 : 8,
      );
    if (e.type === 'ring')
      this.float(e.text || '', this.px, this.ground - 245, GOLD);
    if (e.type === 'clear' || e.type === 'perfect') {
      this.burst(this.px + 25, this.ground - 55, color, 16);
      this.float(e.text || '', this.px + 35, this.ground - 135, color);
    }
    if (e.type === 'jump') this.burst(this.px, this.ground - 4, LIME, 9);
    if (e.type === 'spin') this.burst(this.px, this.ground - 20, PURPLE, 14);
    if (e.type === 'doublejump') {
      this.burst(this.px, this.ground - m.height, LIME, 18);
      this.float('↑↑', this.px, this.ground - m.height - 120, LIME);
    }
    if (e.type === 'rope') {
      this.burst(this.px, this.ground - m.height, GOLD, 20);
      this.float(e.text || '', this.px, this.ground - m.height - 120, GOLD);
    }
    if (e.type === 'powerup') {
      this.float(
        e.text || '',
        this.px + 30,
        this.ground - 170,
        e.color || LIME,
      );
      this.burst(this.px, this.ground - 50, e.color || LIME, 15);
    }
    if (e.type === 'power') {
      this.banner = 'BRO POWER!';
      this.bannerLife = 2;
      this.burst(this.px, this.ground - 60, GOLD, 25);
    }
    if (e.type === 'discohit') {
      this.burst(this.px + (e.x || 0), this.ground - 70, PURPLE, 20);
      this.float(e.text || '', this.px + 60, this.ground - 175, PURPLE);
    }
    if (e.type === 'disco') {
      this.banner = e.text || '';
      this.bannerLife = 1.8;
      this.burst(this.px, this.ground - 80, PURPLE, 25);
    }
    if (e.type === 'shield') {
      this.banner = e.text || '';
      this.bannerLife = 2.3;
      this.burst(this.px, this.ground - 60, LIME, 30);
    }
    if (e.type === 'stage') {
      this.banner = e.text || '';
      this.bannerLife = 2.7;
    }
    if (e.type === 'win') {
      this.banner = 'HAPPY BIRTHDAY, BRO’S!';
      this.bannerLife = 10;
      for (let i = 0; i < 110; i++)
        this.particles.push({
          x: noise(i) * this.width,
          y: noise(i + 250) * -600,
          vx: (noise(i + 750) - 0.5) * 140,
          vy: 70 + noise(i + 125) * 130,
          life: 10,
          max: 10,
          color: [LIME, PURPLE, GOLD, '#ff8da3'][i % 4],
          size: 4 + noise(i + 342) * 4,
        });
    }
  }
  burst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2,
        v = 70 + Math.random() * 190;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 50,
        life: 0.4 + Math.random() * 0.4,
        max: 0.8,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }
  float(text: string, x: number, y: number, color: string) {
    this.floaters.push({ text, x, y, life: 1.1, color });
  }
  rect(x: number, y: number, w: number, h: number, color: string, r = 0) {
    const c = this.c;
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
  }
  line(points: number[][], color: string, width = 2) {
    const c = this.c;
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.stroke();
  }
  ellipse(x: number, y: number, rx: number, ry: number, color: string) {
    const c = this.c;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  }
  poly(points: number[][], color: string) {
    const c = this.c;
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = color;
    c.fill();
  }
  text(
    text: string,
    x: number,
    y: number,
    size: number,
    color: string,
    align: CanvasTextAlign = 'center',
  ) {
    const c = this.c;
    c.font = `800 ${size}px Arial`;
    c.textAlign = align;
    c.fillStyle = color;
    c.fillText(text, x, y);
  }
  star(x: number, y: number, r: number, color: string, angle = 0) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = angle + (i * Math.PI) / 5 - Math.PI / 2,
        rr = i % 2 ? r * 0.46 : r;
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    this.poly(pts, color);
  }
  render(dt: number) {
    const c = this.c,
      m = this.model,
      s = m.state;
    const animate =
      s.status === 'running' || s.status === 'countdown' || s.status === 'won';
    if (animate) this.clock += dt;
    c.setTransform(
      this.canvas.width / this.width,
      0,
      0,
      this.canvas.height / this.height,
      0,
      0,
    );
    c.save();
    if (this.shake > 0 && !this.reducedMotion)
      c.translate(
        Math.sin(this.clock * 100) * this.shake * 12,
        Math.cos(this.clock * 87) * this.shake * 6,
      );
    this.background();
    this.floor();
    this.discoLights();
    for (const item of m.items) {
      if (item.resolved) continue;
      const x = this.px + m.offset(item);
      if (x < -130 || x > this.width + 130) continue;
      if (item.kind === 'star') this.drawStar(x, item.height, item.id);
      else if (item.kind === 'ring') this.ring(x, item.height);
      else if (item.kind === 'rope') this.gripRope(x, item.height);
      else if (item.kind === 'pickup' && item.power)
        this.pickup(x, item.height, item.power);
      else if (item.kind === 'log') this.log(x);
      else if (item.kind === 'highlog') this.crateStack(x);
      else if (item.kind === 'low') this.lowBar(x);
      else if (item.kind === 'duo') this.woofer(x);
      else if (item.kind === 'disco') {
        this.discoBox(x, item.part || 0);
      } else if (item.kind === 'combo') {
        this.comboGate(x);
      } else this.beatBox(x);
    }
    if (s.time > m.level.duration - 4)
      this.finishGate(this.px + (m.level.duration - s.time) * 390);
    const active = s.bro,
      follower = active === 'epke' ? 'tieme' : 'epke';
    const swing = m.rope
      ? Math.sin((1 - s.ropeRemaining / S.ropeDuration) * Math.PI) * 32
      : 0;
    if (m.rope) {
      const anchorX = this.px + m.offset(m.rope);
      this.gripRope(anchorX, m.rope.height, false);
      this.line(
        [
          [anchorX, this.ground - m.rope.height - 65],
          [this.px + swing + 37, this.ground - m.height - 108],
        ],
        '#e6d393',
        5,
      );
    }
    c.save();
    c.globalAlpha = 0.85;
    this.bro(
      this.px - 77,
      this.ground - 5,
      follower,
      0.86,
      Math.max(0, m.height * (m.rope ? 0.2 : 0.8)),
      follower === 'tieme' ? (s.effects.bro > 0 ? 0.6 : m.spin) : 0,
      true,
    );
    c.restore();
    if (m.immunity <= 0 || Math.floor(this.clock * 15) % 2 === 0)
      this.bro(
        this.px + swing,
        this.ground,
        active,
        1.06,
        m.height,
        active === 'tieme' ? m.spin : 0,
        false,
      );
    if (m.shield > 0 || s.effects.bro > 0) {
      const aura = s.effects.bro > 0 ? GOLD : '#74def2';
      c.save();
      const cy = this.ground - m.height - 56;
      c.strokeStyle = aura;
      c.lineWidth = 2.5;
      c.shadowColor = aura;
      c.shadowBlur = 12;
      c.beginPath();
      c.ellipse(
        this.px - 24,
        cy,
        s.effects.bro > 0 ? 110 : 63,
        80,
        0,
        0,
        Math.PI * 2,
      );
      c.stroke();
      c.shadowBlur = 0;
      this.text(
        s.effects.bro > 0 ? 'BRO POWER' : 'SCHILD',
        this.px,
        cy - 92,
        11,
        aura,
      );
      c.restore();
    }
    if (m.spin > 0) {
      const p = m.spin / S.spinDuration;
      const g = this.ground - m.height;
      c.save();
      c.strokeStyle = PURPLE;
      c.lineWidth = 4;
      c.shadowColor = PURPLE;
      c.shadowBlur = 12;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.ellipse(
          this.px,
          g - 25 - i * 12,
          70 + i * 4,
          16,
          0,
          this.clock * 20 + i * 2,
          this.clock * 20 + i * 2 + 3.5,
        );
        c.stroke();
      }
      c.restore();
      this.rect(this.px - 26, g + 10, 52 * p, 3, PURPLE, 2);
    }
    if (animate) {
      this.shake = Math.max(0, this.shake - dt);
      this.bannerLife = Math.max(0, this.bannerLife - dt);
      for (const p of this.particles) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += s.status === 'won' ? 15 * dt : 280 * dt;
      }
      this.particles = this.particles.filter((p) => p.life > 0);
      for (const f of this.floaters) {
        f.life -= dt;
        f.y -= 28 * dt;
      }
      this.floaters = this.floaters.filter((f) => f.life > 0);
    }
    for (const p of this.particles) {
      c.globalAlpha = Math.max(0, Math.min(1, p.life / 0.2));
      this.rect(p.x, p.y, p.size, p.size, p.color, 1);
    }
    c.globalAlpha = 1;
    for (const f of this.floaters) {
      c.globalAlpha = Math.min(1, f.life * 3);
      c.shadowColor = '#000';
      c.shadowBlur = 6;
      this.text(f.text, f.x, f.y, 14, f.color);
      c.shadowBlur = 0;
    }
    c.globalAlpha = 1;
    if (this.bannerLife > 0 && s.status === 'running') {
      c.globalAlpha = Math.min(1, this.bannerLife * 2);
      const w = Math.min(this.width - 70, 390);
      this.rect((this.width - w) / 2, this.ground - 340, w, 50, '#0b1435cc', 8);
      this.text(
        this.banner,
        this.width / 2,
        this.ground - 309,
        17,
        m.level.color,
      );
      c.globalAlpha = 1;
    }
    // A fixed helpful prompt only for the first two obstacles.
    if (s.status === 'running' && s.level === 0 && s.time < 10.4) {
      const first = m.items.find(
        (i) => !i.resolved && (i.kind === 'log' || i.kind === 'beat'),
      );
      if (first && first.when - s.time < 2 && first.when - s.time > 0) {
        const txt =
          first.kind === 'log'
            ? 'BOOMSTAM?  TIK OP GROEN'
            : 'BEATBLOK?  TIK OP PAARS';
        this.rect(this.width / 2 - 175, 215, 350, 35, '#0b1435da', 6);
        this.text(
          txt,
          this.width / 2,
          237,
          12,
          first.kind === 'log' ? LIME : PURPLE,
        );
      }
    }
    this.foreground();
    c.restore();
  }
  background() {
    const c = this.c,
      w = this.width,
      h = this.height,
      d = this.model.distance,
      t = this.clock,
      stage = this.model.state.stage;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(
      0,
      ['#101d29', '#0c2430', '#1a1133', '#28202f', '#23132f', '#211a30'][stage],
    );
    sky.addColorStop(
      0.55,
      ['#25375b', '#245054', '#3b2959', '#494152', '#45325a', '#44405c'][stage],
    );
    sky.addColorStop(1, '#172a3a');
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);
    const moonx = w * 0.79,
      moony = 155;
    const glow = c.createRadialGradient(moonx, moony, 20, moonx, moony, 230);
    glow.addColorStop(0, '#8cabd338');
    glow.addColorStop(1, '#81a9ce00');
    c.fillStyle = glow;
    c.fillRect(moonx - 230, 0, 460, 410);
    this.ellipse(moonx, moony, 49, 49, '#aec7df');
    this.ellipse(moonx + 9, moony - 8, 40, 40, '#bfd4e5');
    this.ellipse(moonx - 16, moony + 12, 11, 9, '#9db8d04c');
    this.ellipse(moonx + 15, moony - 20, 8, 6, '#8ba9c333');
    for (let i = 0; i < 62; i++) {
      const x = noise(i + 4) * w,
        y = 20 + noise(i + 223) * 280;
      c.globalAlpha = 0.25 + noise(i + 45) * 0.6;
      this.ellipse(
        x,
        y,
        noise(i + 2) * 1.1 + 0.5,
        noise(i + 2) * 1.1 + 0.5,
        '#cad9f0',
      );
    }
    c.globalAlpha = 1;
    // Cloud banks and distant land slide at independent speeds.
    for (let i = 0; i < 8; i++) {
      const x =
        ((((i * 240 - d * 0.045) % (w + 300)) + w + 300) % (w + 300)) - 150;
      const y = 150 + noise(i + 98) * 100;
      this.ellipse(x, y, 140, 19, '#a4b1db09');
    }
    for (let layer = 0; layer < 3; layer++) {
      const color = ['#192a49', '#18283f', '#13253b'][layer],
        base = 390 + layer * 40,
        seg = 170;
      const shift = (d * (0.045 + layer * 0.04)) % seg;
      const pts = [[0, h]];
      for (let x = -seg; x < w + seg; x += seg) {
        const index = Math.floor((x + d * (0.045 + layer * 0.04)) / seg);
        pts.push(
          [x - shift, base - noise(index + layer * 100) * 80],
          [x - shift + seg * 0.5, base - noise(index + 76) * 120],
        );
      }
      pts.push([w + seg, h]);
      this.poly(pts, color);
    }
    if (stage >= 2) this.city(d, stage);
    if (stage === 1) {
      for (let i = 0; i < 5; i++) {
        const x =
          ((((i * 300 - d * 0.18) % (w + 300)) + w + 300) % (w + 300)) - 100;
        this.rect(x, 190, 12, 390, '#163e43');
        this.line(
          [
            [x - 90, 210],
            [x + 110, 210],
          ],
          '#456e65',
          12,
        );
        this.line(
          [
            [x - 80, 210],
            [x - 40, 270],
            [x, 210],
            [x + 40, 270],
            [x + 90, 210],
          ],
          '#668c7955',
          3,
        );
      }
    }
    if (stage === 3) {
      for (let i = 0; i < 3; i++) {
        const x = (((i * 480 - d * 0.1) % (w + 480)) + w + 480) % (w + 480);
        this.rect(x, 160, 9, 355, '#bf9b4f33');
        this.line(
          [
            [x - 90, 171],
            [x + 200, 171],
            [x, 125],
            [x, 170],
          ],
          '#e2b95655',
          5,
        );
        this.line(
          [
            [x + 150, 171],
            [x + 150, 320],
          ],
          '#e2b95655',
          2,
        );
      }
    }
    if (stage === 5) {
      for (let i = 0; i < 14; i++) {
        const x = (i * w) / 13;
        this.poly(
          [
            [x, 195],
            [x + 14, 227],
            [x + 28, 200],
          ],
          [LIME, PURPLE, GOLD][i % 3],
        );
      }
    }
    // Rope park silhouettes remain in every district, tying the world together.
    const step = 205;
    const scroll = d * 0.2;
    const start = Math.floor(scroll / step);
    for (let i = start; i < start + Math.ceil(w / step) + 2; i++) {
      const x = i * step - scroll - 60,
        y = 260 + noise(i + 145) * 105,
        tall = 160 + noise(i + 79) * 150;
      this.rect(x - 10, y - 85, 17, 310, '#0c1d31');
      this.rect(x - 3, y - 85, 3, 300, '#526b7230');
      this.poly(
        [
          [x, y - tall],
          [x - 70, y - 33],
          [x + 58, y - 33],
        ],
        '#0c1e34',
      );
      this.poly(
        [
          [x, y - tall + 45],
          [x - 89, y + 20],
          [x + 77, y + 20],
        ],
        '#102339',
      );
      this.rect(x - 36, y, 83, 10, '#4a4b594a', 2);
      this.rect(x - 27, y + 10, 4, 42, '#53606428');
      this.line(
        [
          [x - 34, y - 50],
          [x + step * 0.5, y - 12],
          [x + step - 34, y - 53],
        ],
        '#7286943d',
        2,
      );
      this.line(
        [
          [x - 34, y - 48],
          [x - 34, y],
          [x + 48, y - 32],
          [x + 48, y],
        ],
        '#77869830',
        2,
      );
      if (i % 2 === 0) {
        this.ellipse(x + 20, y - 13, 4, 5, LIME);
        this.ellipse(x + 20, y - 13, 14, 16, '#c4f6590c');
      }
    }
    // Midground foliage and strings of small festival lights.
    const near = d * 0.35;
    for (let i = 0; i < 12; i++) {
      const x = ((((i * 145 - near) % (w + 180)) + w + 180) % (w + 180)) - 80;
      this.ellipse(x, 490, 90, 45, '#102838');
      this.ellipse(x + 25, 470, 50, 42, '#142d3e');
    }
    c.beginPath();
    c.moveTo(0, 215);
    c.quadraticCurveTo(w * 0.5, 345, w, 220);
    c.strokeStyle = '#8694b83d';
    c.lineWidth = 1.5;
    c.stroke();
    for (let i = 0; i < 16; i++) {
      const q = i / 15,
        x = w * q,
        y = 215 + 240 * q * (1 - q);
      c.save();
      c.shadowColor = i % 2 ? PURPLE : LIME;
      c.shadowBlur = 10;
      this.ellipse(x, y + 4, 2.5, 4, i % 2 ? PURPLE : LIME);
      c.restore();
    }
    const fog = c.createLinearGradient(0, 410, 0, 560);
    fog.addColorStop(0, '#54829b00');
    fog.addColorStop(1, '#5da6a321');
    c.fillStyle = fog;
    c.fillRect(0, 410, w, 150);
    for (let i = 0; i < 17; i++) {
      const x =
        (((noise(i + 5) * w - d * 0.13) % (w + 30)) + w + 30) % (w + 30);
      const y = 360 + noise(i + 90) * 145 + Math.sin(t + i) * 8;
      c.globalAlpha = 0.15 + 0.25 * Math.abs(Math.sin(t * 0.8 + i));
      this.ellipse(x, y, 2, 2, i % 2 ? LIME : PURPLE);
    }
    c.globalAlpha = 1;
  }
  city(d: number, stage: number) {
    const w = this.width;
    const shift = d * 0.12;
    for (let i = 0; i < Math.ceil(w / 100) + 3; i++) {
      const idx = i + Math.floor(shift / 100),
        x = i * 100 - (shift % 100) - 100,
        y = 260 - noise(idx + 201) * 105;
      this.rect(x, y, 88, 250, stage === 1 ? '#242340' : '#232b46', 2);
      this.rect(x + 8, y - 5, 72, 5, '#454363');
      for (let row = 0; row < 6; row++)
        for (let col = 0; col < 4; col++)
          if (noise(idx + row * 20 + col) > 0.38)
            this.rect(
              x + 12 + col * 18,
              y + 17 + row * 28,
              6,
              10,
              idx % 2 ? '#66548266' : '#bda26640',
              1,
            );
      if (idx % 4 === 0) {
        this.rect(x + 9, y + 29, 64, 29, '#5b388d');
        this.text('BEATS', x + 41, y + 48, 12, '#cfb4ff');
      }
    }
  }
  floor() {
    const c = this.c,
      w = this.width,
      g = this.ground,
      d = this.model.distance,
      stage = this.model.state.stage;
    this.rect(0, g + 8, w, this.height - g, '#0a1526');
    const water = c.createLinearGradient(0, g + 75, 0, 680);
    water.addColorStop(0, '#142a3b');
    water.addColorStop(1, '#091520');
    c.fillStyle = water;
    c.fillRect(0, g + 75, w, 150);
    for (let i = 0; i < 18; i++) {
      const x = (((i * 100 - d * 0.4) % w) + w) % w;
      this.rect(
        x,
        g + 83 + noise(i + 19) * 52,
        25 + noise(i) * 60,
        1,
        i % 2 ? '#b49aff0c' : '#8af6c510',
      );
    }
    const top = c.createLinearGradient(0, g - 3, 0, g + 28);
    top.addColorStop(0, stage === 1 ? '#464459' : '#536053');
    top.addColorStop(1, '#2b343d');
    c.fillStyle = top;
    c.fillRect(0, g, w, 29);
    this.rect(0, g, w, 3, stage === 1 ? '#a695cd' : '#95b489');
    this.rect(0, g + 28, w, 6, '#121927');
    this.rect(0, g + 34, w, 28, '#202935');
    for (let i = -1; i < w / 64 + 2; i++) {
      const x = i * 64 - (d % 64);
      this.line(
        [
          [x, g + 3],
          [x - 20, g + 27],
        ],
        '#141e2c',
        2,
      );
      this.line(
        [
          [x + 6, g + 10],
          [x + 39, g + 10],
        ],
        '#d0ddaf12',
        1,
      );
      this.rect(x + 10, g + 5, 3, 2, '#c9d0b85a');
    }
    for (let i = -1; i < w / 235 + 1; i++) {
      const x = i * 235 - (d % 235);
      this.rect(x, g + 34, 19, 120, '#101b2a');
      this.rect(x + 2, g + 37, 3, 99, '#41526150');
      this.line(
        [
          [x, g + 60],
          [x + 100, g + 112],
        ],
        '#1c2c3c',
        10,
      );
    }
    this.rect(0, g + 35, w, 2, '#62809b28');
    for (let i = 0; i < 7; i++) {
      const x = (((i * 190 - d) % (w + 190)) + w + 190) % (w + 190);
      this.rect(x, g + 39, 24, 3, stage === 1 ? PURPLE : LIME, 2);
    }
  }
  log(x: number) {
    const g = this.ground,
      c = this.c;
    this.ellipse(x, g + 8, 59, 10, '#020a1850');
    this.poly(
      [
        [x - 39, g - 49],
        [x - 21, g - 66],
        [x + 43, g - 66],
        [x + 28, g - 49],
      ],
      '#8b9567',
    );
    this.rect(x - 39, g - 49, 70, 48, '#65704f', 7);
    this.poly(
      [
        [x + 31, g - 49],
        [x + 43, g - 66],
        [x + 43, g - 16],
        [x + 31, g - 1],
      ],
      '#455542',
    );
    this.line(
      [
        [x - 31, g - 33],
        [x + 23, g - 33],
      ],
      '#899368',
      2,
    );
    this.line(
      [
        [x - 26, g - 15],
        [x + 15, g - 15],
      ],
      '#45523e',
      3,
    );
    this.line(
      [
        [x - 3, g - 43],
        [x + 23, g - 43],
      ],
      '#a9b581',
      2,
    );
    this.ellipse(x - 29, g - 25, 13, 21, '#b4a277');
    c.strokeStyle = '#796c4f';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(x - 29, g - 25, 7, 14, 0, 0, Math.PI * 2);
    c.stroke();
    this.rect(x + 4, g - 64, 9, 63, '#c4f659');
    this.rect(x + 6, g - 64, 3, 63, '#ddff9a');
    this.arrowChip(x, g - 94, '↑', LIME);
  }
  beatBox(x: number) {
    const g = this.ground,
      c = this.c,
      bounce = Math.sin(this.clock * 12) * 2;
    this.ellipse(x, g + 6, 58, 12, '#b49aff18');
    this.poly(
      [
        [x - 38, g - 105],
        [x - 24, g - 117],
        [x + 43, g - 117],
        [x + 29, g - 105],
      ],
      '#8270b2',
    );
    this.poly(
      [
        [x + 30, g - 105],
        [x + 43, g - 117],
        [x + 43, g - 14],
        [x + 30, g],
      ],
      '#3b3263',
    );
    this.rect(x - 38, g - 105, 69, 105, '#564882', 7);
    this.rect(x - 32, g - 98, 57, 90, '#191c38', 5);
    for (const h of [g - 73, g - 31]) {
      this.ellipse(x - 3, h, 20 + bounce * 0.25, 20 + bounce * 0.25, '#8873bf');
      this.ellipse(x - 3, h, 15, 15, '#2a2949');
      this.ellipse(x - 3, h, 8, 8, '#65548f');
      this.ellipse(x - 6, h - 4, 3, 3, '#ab8adb');
    }
    c.save();
    c.shadowColor = PURPLE;
    c.shadowBlur = 15;
    this.rect(x - 38, g - 105, 3, 105, PURPLE, 1);
    this.rect(x + 29, g - 105, 3, 105, PURPLE, 1);
    c.restore();
    for (let i = 0; i < 3; i++) {
      const r = 50 + i * 17 + ((this.clock * 25) % 17);
      c.globalAlpha = (1 - i / 3) * 0.3;
      c.strokeStyle = PURPLE;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, g - 55, r, -0.5, 0.5);
      c.stroke();
      c.beginPath();
      c.arc(x, g - 55, r, Math.PI - 0.5, Math.PI + 0.5);
      c.stroke();
    }
    c.globalAlpha = 1;
    this.arrowChip(x, g - 146, '↓', PURPLE);
  }
  arrowChip(x: number, y: number, arrow: string, color: string) {
    this.rect(x - 16, y - 19, 32, 28, '#101930e8', 6);
    this.text(arrow, x, y + 2, 20, color);
  }
  lowBar(x: number) {
    const g = this.ground;
    this.rect(x - 48, g - 132, 12, 132, '#766d54', 3);
    this.rect(x + 39, g - 132, 12, 132, '#766d54', 3);
    this.rect(x - 54, g - 132, 111, 40, '#e5b757', 5);
    for (let i = 0; i < 5; i++)
      this.poly(
        [
          [x - 50 + i * 23, g - 132],
          [x - 38 + i * 23, g - 132],
          [x - 52 + i * 23, g - 92],
          [x - 64 + i * 23, g - 92],
        ],
        '#554738',
      );
    this.rect(x - 33, g - 48, 66, 42, '#b49aff14', 7);
    this.arrowChip(x, g - 155, '↓', PURPLE);
  }
  crateStack(x: number) {
    const g = this.ground;
    this.ellipse(x, g + 7, 54, 10, '#01081770');
    for (const [y, w] of [
      [g - 53, 86],
      [g - 108, 64],
    ]) {
      this.rect(x - w / 2, y, w, 52, '#65827a', 5);
      this.rect(x - w / 2 + 6, y + 6, w - 12, 40, '#324f4e', 3);
      this.line(
        [
          [x - w / 2 + 8, y + 7],
          [x + w / 2 - 8, y + 43],
        ],
        '#9cac80',
        6,
      );
      this.line(
        [
          [x + w / 2 - 8, y + 7],
          [x - w / 2 + 8, y + 43],
        ],
        '#718e74',
        6,
      );
    }
    this.rect(x - 5, g - 109, 10, 108, LIME);
    this.arrowChip(x, g - 142, '↑', LIME);
  }
  woofer(x: number) {
    const g = this.ground,
      c = this.c;
    this.rect(x - 48, g - 100, 96, 100, '#593275', 9);
    this.rect(x - 40, g - 91, 80, 81, '#17152c', 6);
    for (const xx of [x - 21, x + 21]) {
      this.ellipse(xx, g - 48, 25, 31, '#bd76e5');
      this.ellipse(xx, g - 48, 18, 24, '#29253f');
      this.ellipse(xx, g - 48, 8, 11, '#e6baff');
    }
    this.rect(x - 45, g - 100, 90, 4, '#ef8dff', 2);
    c.strokeStyle = '#b49aff';
    c.lineWidth = 2;
    c.strokeRect(x - 47, g - 99, 94, 99);
    this.arrowChip(x, g - 133, '↓', PURPLE);
  }
  comboGate(x: number) {
    const g = this.ground;
    this.poly(
      [
        [x - 53, g],
        [x - 43, g - 59],
        [x + 35, g - 66],
        [x + 56, g],
      ],
      '#6e9051',
    );
    this.line(
      [
        [x - 47, g - 5],
        [x - 38, g - 50],
        [x + 31, g - 57],
        [x + 48, g - 5],
      ],
      LIME,
      5,
    );
    this.rect(x - 41, g - 174, 83, 97, '#614991', 8);
    this.rect(x - 34, g - 166, 69, 79, '#171e39', 6);
    this.ellipse(x, g - 126, 26, 27, PURPLE);
    this.ellipse(x, g - 126, 18, 19, '#2b2447');
    this.ellipse(x, g - 126, 8, 9, '#f5c1ff');
    this.line(
      [
        [x - 41, g - 76],
        [x - 51, g - 20],
      ],
      '#e3d57d',
      4,
    );
    this.line(
      [
        [x + 41, g - 76],
        [x + 51, g - 20],
      ],
      '#e3d57d',
      4,
    );
    this.arrowChip(x, this.ground - 199, '↑↓', GOLD);
  }
  discoBox(x: number, part: number) {
    const g = this.ground,
      color = ['#fa7bcb', '#80eafa', '#c4f659'][part];
    this.rect(x - 30, g - 96, 60, 96, '#252145', 6);
    this.rect(x - 24, g - 89, 48, 81, '#342554', 4);
    this.ellipse(x, g - 43, 20, 25, color);
    this.ellipse(x, g - 43, 13, 17, '#201b38');
    this.text(String(part + 1), x, g - 71, 16, color);
    this.line(
      [
        [x - 30, g - 95],
        [x + 30, g - 95],
        [x + 30, g],
      ],
      color,
      3,
    );
    if (part === 0) {
      this.rect(x - 66, g - 158, 132, 28, '#251c46e8', 6);
      this.text('♫ DISCO BONUS', x, g - 139, 12, PURPLE);
      this.arrowChip(x, g - 119, '↓', PURPLE);
    }
  }
  discoLights() {
    const m = this.model,
      s = m.state,
      near = m.items.find(
        (i) =>
          i.kind === 'disco' &&
          i.part === 0 &&
          i.when - s.time < 2.4 &&
          i.when - s.time > -0.8,
      );
    if (!near && s.discoRemaining <= 0) return;
    const c = this.c,
      active = s.discoRemaining > 0,
      anchor = near ? this.px + m.offset(near) : this.px;
    const y = Math.max(100, this.ground - 370);
    c.save();
    c.globalAlpha = active ? 0.21 : 0.09;
    for (let i = 0; i < 4; i++) {
      const x = anchor - 150 + i * 100,
        shift = this.reducedMotion ? 0 : Math.sin(this.clock * 3 + i) * 95;
      this.poly(
        [
          [x, y],
          [x - 90 + shift, this.ground],
          [x + 90 + shift, this.ground],
        ],
        ['#ff74cd', '#70e8ff', '#c4f659', '#b49aff'][i],
      );
    }
    c.globalAlpha = 1;
    this.line(
      [
        [anchor - 185, y],
        [anchor + 180, y],
      ],
      '#73659a',
      7,
    );
    for (let i = 0; i < 4; i++) {
      const x = anchor - 150 + i * 100;
      this.rect(x - 13, y, 26, 16, '#252038', 4);
      this.ellipse(
        x,
        y + 16,
        10,
        5,
        ['#ff74cd', '#70e8ff', '#c4f659', '#b49aff'][i],
      );
    }
    this.ellipse(anchor, y + 42, 19, 19, '#b8b4ce');
    for (let i = -2; i <= 2; i++)
      this.line(
        [
          [anchor - 14, y + 42 + i * 5],
          [anchor + 14, y + 42 + i * 5],
        ],
        '#696581',
        1,
      );
    if (active)
      this.text(
        'TIEME’S DISCO · ' + s.discoHits + '/3',
        anchor,
        y + 81,
        15,
        PURPLE,
      );
    c.restore();
  }
  pickup(x: number, height: number, power: PowerUp) {
    const p = POWERUPS[power],
      y = this.ground - height + Math.sin(this.clock * 3) * 3,
      c = this.c;
    c.save();
    c.translate(x, y);
    c.rotate(Math.PI / 4);
    this.rect(-24, -24, 48, 48, '#101d32', 9);
    c.strokeStyle = p.color;
    c.lineWidth = 3;
    c.strokeRect(-20, -20, 40, 40);
    c.restore();
    this.text(p.symbol, x, y + 8, 23, p.color);
    this.rect(x - 53, y - 66, 106, 21, '#0c1426e8', 5);
    this.text(p.name.toUpperCase(), x, y - 51, 10, p.color);
  }
  gripRope(x: number, height: number, handle = true) {
    const y = this.ground - height;
    this.rect(x - 80, y - 80, 163, 15, '#6e8960', 4);
    this.rect(x - 75, y - 80, 6, 50, '#a3bd7466');
    if (handle) {
      this.line(
        [
          [x, y - 65],
          [x, y - 5],
        ],
        '#e6d393',
        5,
      );
      this.rect(x - 23, y - 5, 46, 12, LIME, 6);
      this.arrowChip(x, y + 47, '↑↑', LIME);
      this.text('BONUS', x, y - 27, 10, LIME);
    }
  }
  ring(x: number, height: number) {
    const c = this.c,
      y = this.ground - height;
    this.line(
      [
        [x - 13, -10],
        [x - 13, y - 19],
      ],
      '#918d7370',
      3,
    );
    this.line(
      [
        [x + 13, -10],
        [x + 13, y - 19],
      ],
      '#918d7370',
      3,
    );
    c.save();
    c.strokeStyle = GOLD;
    c.lineWidth = 6;
    c.shadowColor = GOLD;
    c.shadowBlur = 13;
    c.beginPath();
    c.ellipse(x, y, 22, 28, 0, 0, Math.PI * 2);
    c.stroke();
    c.shadowBlur = 0;
    c.strokeStyle = '#fff6be';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(x - 1, y - 1, 20, 26, 0, Math.PI, Math.PI * 1.8);
    c.stroke();
    c.restore();
  }
  drawStar(x: number, h: number, id: number) {
    const c = this.c,
      y = this.ground - h + Math.sin(this.clock * 3 + id) * 3;
    c.save();
    c.shadowColor = GOLD;
    c.shadowBlur = 13;
    this.star(x, y, 13, GOLD, this.clock * 0.5);
    c.shadowBlur = 0;
    this.star(x - 1, y - 2, 7, '#fff4ca', this.clock * 0.5);
    c.restore();
  }
  bro(
    x: number,
    ground: number,
    who: 'epke' | 'tieme',
    scale: number,
    height: number,
    spin: number,
    follower: boolean,
  ) {
    const c = this.c,
      color = who === 'epke' ? LIME : PURPLE;
    this.ellipse(
      x,
      ground + 4,
      Math.max(8, 33 - height * 0.055) * scale,
      7 * scale,
      '#01081560',
    );
    c.save();
    c.translate(x, ground - height);
    c.scale(scale, scale);
    if (spin > 0) {
      const phase = this.clock * 17;
      this.ellipse(0, -7, 55, 9, '#b49aff25');
      // One planted hand, bent arm and rotating open legs make a windmill / freeze.
      this.line(
        [
          [0, -4],
          [3, -27],
          [-7, -37],
        ],
        '#1a142a',
        15,
      );
      this.line(
        [
          [0, -4],
          [3, -27],
          [-7, -37],
        ],
        '#eab48d',
        9,
      );
      this.ellipse(1, -3, 10, 4, '#ffd2a7');
      c.translate(-4, -39);
      c.rotate(Math.sin(phase) * 0.23);
      c.scale(Math.cos(phase) * 0.3 + 0.85, 1);
      this.line(
        [
          [-5, -4],
          [17, -20],
          [35, -8],
        ],
        color,
        21,
      );
      this.line(
        [
          [15, -19],
          [11, -55],
          [33, -71],
        ],
        '#232638',
        15,
      );
      this.line(
        [
          [14, -18],
          [44, -38],
          [67, -28],
        ],
        '#292b40',
        16,
      );
      this.line(
        [
          [29, -70],
          [43, -70],
        ],
        '#ede4fa',
        9,
      );
      this.line(
        [
          [63, -28],
          [76, -22],
        ],
        '#d5c7ff',
        9,
      );
      this.ellipse(-13, -12, 16, 17, '#efb48a');
      this.rect(-28, -26, 30, 12, '#7e5bbc', 6);
      this.rect(-34, -21, 17, 5, PURPLE, 3);
      this.ellipse(-17, -9, 2.1, 2.5, '#191525');
      this.line(
        [
          [-14, -1],
          [-8, -2],
        ],
        '#8c513d',
        1.5,
      );
      c.restore();
      return;
    }
    const run = this.clock * 15 + (follower ? 1.8 : 0),
      stride = height > 0 ? 0 : Math.sin(run),
      bob = height > 0 ? 0 : Math.abs(Math.cos(run)) * 3;
    c.translate(0, -bob);
    c.rotate(height > 0 ? -0.12 : 0.04);
    // Back arm and legs with dark outlines and lit clothing.
    const hipY = -38;
    const backKneeX = height > 0 ? -18 : -stride * 20,
      frontKneeX = height > 0 ? 24 : stride * 21;
    const backFootX = height > 0 ? -30 : -stride * 28,
      frontFootX = height > 0 ? 12 : stride * 29;
    const backFootY = height > 0 ? -22 : -3 - Math.max(0, stride) * 10,
      frontFootY = height > 0 ? -21 : -3 - Math.max(0, -stride) * 10;
    this.line(
      [
        [-6, -70],
        [-22 - stride * 8, -54],
        [-24 - stride * 13, -38],
      ],
      '#152336',
      13,
    );
    this.line(
      [
        [-6, -70],
        [-22 - stride * 8, -54],
        [-24 - stride * 13, -38],
      ],
      who === 'epke' ? '#8aad3f' : '#7c61bd',
      9,
    );
    this.line(
      [
        [-6, hipY],
        [backKneeX, -21],
        [backFootX, backFootY],
      ],
      '#162333',
      18,
    );
    this.line(
      [
        [-6, hipY],
        [backKneeX, -21],
        [backFootX, backFootY],
      ],
      who === 'epke' ? '#354341' : '#37344d',
      12,
    );
    this.line(
      [
        [8, hipY],
        [frontKneeX, -21],
        [frontFootX, frontFootY],
      ],
      '#111e30',
      18,
    );
    this.line(
      [
        [8, hipY],
        [frontKneeX, -21],
        [frontFootX, frontFootY],
      ],
      who === 'epke' ? '#53644e' : '#46405e',
      12,
    );
    if (who === 'epke') {
      this.line(
        [
          [frontKneeX, -20],
          [frontFootX, frontFootY - 3],
        ],
        '#e2ae85',
        9,
      );
      this.line(
        [
          [backKneeX, -20],
          [backFootX, backFootY - 3],
        ],
        '#c28f70',
        8,
      );
    }
    this.rect(backFootX - 8, backFootY - 5, 24, 11, '#151d2a', 5);
    this.rect(backFootX - 7, backFootY + 3, 25, 3, color, 1);
    this.rect(frontFootX - 7, frontFootY - 5, 27, 11, '#e8e6d6', 5);
    this.rect(
      frontFootX - 6,
      frontFootY - 5,
      22,
      7,
      who === 'epke' ? '#364537' : '#514071',
      3,
    );
    this.rect(frontFootX - 5, frontFootY + 3, 27, 3, color, 1);
    // Torso, hoodie folds, drawstrings and a small KB team monogram.
    this.rect(-19, -80, 39, 43, '#152231', 11);
    this.rect(-17, -79, 35, 40, color, 10);
    this.rect(-17, -50, 35, 12, who === 'epke' ? '#88ac3e' : '#8d70ca', 4);
    this.poly(
      [
        [-16, -75],
        [-4, -71],
        [-10, -50],
        [-18, -52],
      ],
      who === 'epke' ? '#a0cb48' : '#9b7bde',
    );
    this.line(
      [
        [-5, -75],
        [-4, -61],
      ],
      '#e4ffc3',
      1.5,
    );
    this.line(
      [
        [3, -75],
        [4, -64],
      ],
      '#e4ffc3',
      1.5,
    );
    this.text('KB', 4, -53, 9, who === 'epke' ? '#314823' : '#4d3675');
    const armX = height > 0 ? 22 : 15 - stride * 17,
      handY = height > 0 ? -96 : -43 - stride * 12;
    this.line(
      [
        [13, -69],
        [armX + 6, -59],
        [armX + 13, handY],
      ],
      '#1b2433',
      14,
    );
    this.line(
      [
        [13, -69],
        [armX + 6, -59],
      ],
      color,
      11,
    );
    this.line(
      [
        [armX + 6, -59],
        [armX + 13, handY],
      ],
      '#efba90',
      8,
    );
    this.ellipse(armX + 13, handY, 5, 6, '#ffd0a0');
    // Neck and expressive face with distinct hair/cap silhouettes.
    this.rect(-5, -89, 13, 16, '#d69976', 4);
    this.ellipse(0, -99, 21, 24, '#172037');
    this.ellipse(2, -99, 19, 22, '#f4bf90');
    this.ellipse(-15, -99, 6, 8, '#e1a67d');
    this.ellipse(9, -100, 5, 6, '#fff6e5');
    this.ellipse(11, -99, 2.5, 4, '#263045');
    this.line(
      [
        [5, -109],
        [14, -108],
      ],
      '#5a382b',
      3,
    );
    this.line(
      [
        [9, -88],
        [15, -90],
      ],
      '#9a5943',
      2,
    );
    this.ellipse(16, -96, 5, 3, '#efaf84');
    if (who === 'epke') {
      this.poly(
        [
          [-18, -96],
          [-23, -114],
          [-14, -113],
          [-18, -125],
          [-4, -119],
          [0, -133],
          [10, -124],
          [21, -128],
          [20, -115],
          [11, -109],
          [-4, -112],
          [-9, -97],
        ],
        '#483229',
      );
      this.poly(
        [
          [-17, -115],
          [-4, -113],
          [5, -123],
          [14, -119],
          [6, -112],
          [-7, -106],
        ],
        '#75513a',
      );
      this.line(
        [
          [-7, -121],
          [-2, -116],
        ],
        '#a5774d',
        2,
      );
    } else {
      this.rect(-20, -120, 39, 15, '#7652ad', 10);
      this.rect(-23, -110, 42, 6, PURPLE, 3);
      this.rect(-32, -109, 18, 5, '#9571d4', 3);
      this.ellipse(7, -116, 3, 3, '#cab1fc');
      this.rect(-16, -103, 7, 8, '#4a302c', 2);
    }
    c.restore();
  }
  finishGate(x: number) {
    if (x > this.width + 200) return;
    const g = this.ground;
    this.rect(x - 80, g - 290, 9, 290, '#d7cb9f', 3);
    this.rect(x + 80, g - 290, 9, 290, '#d7cb9f', 3);
    this.rect(x - 80, g - 285, 169, 62, '#b49aff', 7);
    this.text('HAPPY BIRTHDAY', x + 4, g - 260, 13, '#322151');
    this.text('EPKE & TIEME', x + 4, g - 238, 17, '#261737');
    for (let i = 0; i < 7; i++)
      this.poly(
        [
          [x - 76 + i * 24, g - 210],
          [x - 54 + i * 24, g - 210],
          [x - 65 + i * 24, g - 182],
        ],
        i % 2 ? LIME : PURPLE,
      );
    for (const side of [-1, 1]) {
      this.ellipse(x + side * 112, g - 197, 17, 23, side === 1 ? LIME : PURPLE);
      this.line(
        [
          [x + side * 112, g - 175],
          [x + side * 107, g - 116],
        ],
        '#e2e4d488',
        1,
      );
    }
  }
  foreground() {
    const c = this.c,
      w = this.width,
      h = this.height;
    const vig = c.createLinearGradient(0, h - 70, 0, h);
    vig.addColorStop(0, '#080e1c00');
    vig.addColorStop(1, '#060c1c99');
    c.fillStyle = vig;
    c.fillRect(0, h - 70, w, 70);
    // Fine edge framing is kept below the active track.
    for (const side of [-1, 1]) {
      const x = side === -1 ? 0 : w;
      for (let i = 0; i < 5; i++) {
        const ex = x - side * (20 + i * 18),
          ey = h - 12 - noise(i + 56) * 36;
        this.line(
          [
            [x, h + 10],
            [ex, ey],
          ],
          '#0b1d2c',
          4,
        );
        this.ellipse(ex, ey, 18, 7, '#102d3b');
      }
    }
  }
  destroy() {
    this.resizeObserver.disconnect();
  }
}
