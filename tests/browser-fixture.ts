import type { Game } from '../game/engine';

/** Development-only browser QA: timed normal inputs, no modified physics or score.
 * Open /?test=perfect, then start normally. This module is stripped from release builds.
 * Tool round trips cannot reliably press a key within a subsecond gameplay window.
 */
export function installBrowserFixture(game:Game) {
  return () => {
    const m=game.model;
    if(m.state.status!=='running')return;
    const next=m.items.find(i=>!i.resolved&&(i.kind==='log'||i.kind==='beat'));
    if(next&&next.when-m.state.time<=.32&&next.when-m.state.time> .1) {
      if(next.kind==='log'&&m.height===0)game.action('jump');
      if(next.kind==='beat'&&m.spin===0)game.action('spin');
    }
  };
}
