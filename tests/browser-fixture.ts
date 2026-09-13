import type { Game } from '../game/engine';
import { drive } from './driver';
/** Development-only QA: normal actions, physics and unlocks. Never writes a save. */
export function installBrowserFixture(game: Game) {
  let enabled = true,
    sequence = false,
    nextAt = 0,
    touchTest = false;
  const finished: {
    level: number;
    score: number;
    damage: number;
    discos: number;
    ropes: number;
    medals: boolean[];
  }[] = [];
  const panel = document.createElement('aside');
  panel.className = 'qa-panel';
  const toggle = document.createElement('button');
  toggle.textContent = 'QA automatisch: aan';
  toggle.onclick = () => {
    enabled = !enabled;
    toggle.textContent = 'QA automatisch: ' + (enabled ? 'aan' : 'uit');
  };
  const suite = document.createElement('button');
  suite.textContent = 'QA: zes levels';
  suite.onclick = () => {
    enabled = true;
    sequence = true;
    nextAt = 0;
    finished.length = 0;
    game.menu();
    game.start(0, 'solo');
  };
  const touch = document.createElement('button');
  touch.textContent = 'QA: twee vingers';
  touch.onclick = () => {
    sequence = false;
    enabled = false;
    game.menu();
    game.start(0, 'coop');
    touchTest = true;
  };
  const status = document.createElement('output');
  status.setAttribute('data-testid', 'qa-state');
  const results = document.createElement('output');
  results.setAttribute('data-testid', 'qa-results');
  const touches = document.createElement('output');
  touches.setAttribute('data-testid', 'qa-touch');
  panel.appendChild(toggle);
  panel.appendChild(suite);
  panel.appendChild(touch);
  panel.appendChild(status);
  panel.appendChild(results);
  panel.appendChild(touches);
  document.body.appendChild(panel);
  return {
    tick: () => {
      const m = game.model;
      if (touchTest && m.state.status === 'running') {
        touchTest = false;
        const green = document.querySelector<HTMLButtonElement>(
            '[aria-label="Epke springt"]',
          ),
          purple = document.querySelector<HTMLButtonElement>(
            '[aria-label="Tieme spint"]',
          );
        if (green && purple) {
          const send = (
            button: HTMLButtonElement,
            type: string,
            pointerId: number,
          ) =>
            button.dispatchEvent(
              new PointerEvent(type, {
                bubbles: true,
                cancelable: true,
                pointerId,
                pointerType: 'touch',
                isPrimary: pointerId === 101,
              }),
            );
          send(green, 'pointerdown', 101);
          send(purple, 'pointerdown', 102);
          const jumpOnly = m.velocity > 0 && m.spin === 0;
          send(green, 'pointerup', 101);
          send(purple, 'pointercancel', 102);
          touches.textContent = jumpOnly
            ? 'TWEE VINGERS OK · buiten combo werkt alleen de eerste move'
            : 'TOUCH TEST MISLUKT';
        } else touches.textContent = 'KNOPPEN NIET GEVONDEN';
        game.pause();
      }
      if (enabled) drive(m, (a) => game.action(a));
      if (sequence && m.state.status === 'won') {
        if (!nextAt) {
          finished.push({
            level: m.state.level + 1,
            score: m.state.score,
            damage: m.state.damage,
            discos: m.state.discos,
            ropes: m.state.counts.ropes,
            medals: [...m.state.medals],
          });
          results.textContent = JSON.stringify(finished);
          nextAt = performance.now() + 1500;
        }
        if (performance.now() >= nextAt) {
          if (m.state.level < 5) {
            game.start(m.state.level + 1);
            nextAt = 0;
          } else sequence = false;
        }
      }
      status.textContent = JSON.stringify({
        status: m.state.status,
        level: m.state.level + 1,
        time: Math.floor(m.state.time),
        height: Math.round(m.height),
        spin: m.spin,
        bro: m.state.bro,
        charge: m.state.charge,
        ropes: m.state.counts.ropes,
        discos: m.state.discos,
        disco: m.state.discoRemaining,
        damage: m.state.damage,
        seed: m.state.seed,
      });
    },
    cleanup: () => panel.remove(),
  };
}
