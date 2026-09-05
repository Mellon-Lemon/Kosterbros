'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUp, ArrowDown, ArrowRight, Play, Pause, RotateCcw, Trophy, Volume2, VolumeX, Maximize, Minimize, HelpCircle, Heart, Zap, Flag, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Game, INITIAL_STATE, type GameState } from '@/game/engine';
import { SETTINGS } from '@/game/settings';

const number = (n: number) => Math.floor(n).toLocaleString('nl-NL');

export default function Home() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const shell = useRef<HTMLElement>(null);
  const game = useRef<Game | null>(null);
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const best = state.best;
  const muted = state.muted;
  const [help, setHelp] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [ready, setReady] = useState(false);
  const [pressed, setPressed] = useState<'jump' | 'spin' | null>(null);

  useEffect(() => {
    if (!canvas.current) return;
    const instance = new Game(canvas.current, setState);
    game.current = instance;
    setReady(true);
    const onFull = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFull);
    return () => { instance.destroy(); game.current = null; document.removeEventListener('fullscreenchange', onFull); };
  }, []);

  function start() { game.current?.start(); }
  function openHelp() { game.current?.pause(); game.current?.setInputLocked(true); setHelp(true); }
  function toggleAudio() { game.current?.setMuted(!muted); }
  async function toggleFullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await shell.current?.requestFullscreen(); }
    catch { /* Fullscreen is optional in embedded browsers. */ }
  }
  const playing = state.status !== 'menu';
  const ended = state.status === 'won' || state.status === 'lost';
  const progress = Math.min(100, (state.time / SETTINGS.duration) * 100);

  return (
    <main className="app-shell" data-playing={playing} ref={shell}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">KB<span>★</span></span><span>KOSTER<span className="lime">BRO&apos;S</span></span></div>
        <div className="edition"><span className="live-dot" /> VERJAARDAGSEDITIE <span className="edition-year">01</span></div>
        <div className="top-actions">
          <div className="record"><Trophy size={17} /><span>RECORD<strong data-testid="best-score">{number(best)}</strong></span></div>
          <span className="separator" />
          <button className="icon-button" onClick={toggleAudio} aria-label={muted ? 'Geluid aan' : 'Geluid uit'} title={muted ? 'Geluid aan (M)' : 'Geluid uit (M)'}>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button>
          <button className="icon-button" onClick={openHelp} aria-label="Hoe speel je?" title="Hoe speel je?"><HelpCircle size={19} /></button>
        </div>
      </header>
      <div className="game-heading"><div><span className="tiny-square" /> HET PARK IS VAN JULLIE.</div><span>1 TEAM <i /> 2 BROERS <i /> {SETTINGS.duration} SECONDEN</span></div>
      <section className={`game-stage ${playing ? 'is-playing' : ''}`} aria-label="KosterBro's spel">
        <canvas ref={canvas} className="game-canvas" aria-label="Ren met de broers. Tik op de groene knop om te springen en op de paarse knop om te spinnen." />
        {!playing && <div className="start-screen">
          <Image className="key-art" src="/keyart.png" width={1672} height={941} priority unoptimized alt="Epke slingert aan een touw terwijl Tieme een breakdance-freeze doet in een neon survivalpark." />
          <div className="art-shade" />
          <div className="start-copy">
            <div className="game-tag"><Zap size={14} fill="currentColor" /> SURVIVAL × BREAKDANCE</div>
            <h1>KOSTER<br /><span>BRO&apos;S<span className="title-star">✦</span></span></h1>
            <p className="hero-line">Twee broers. Eén epische run.</p>
            <p className="hero-description">Spring met Epke. Spin met Tieme.<br />Pak de sterren. Bereik het feest.</p>
            <button className="play-button" onClick={start} disabled={!ready}><Play size={21} fill="currentColor" /> LET&apos;S GO! <ArrowRight size={23} /></button>
            <div className="start-hint">Twee duimen. Twee moves. Samen naar de finish.</div>
          </div>
          <div className="character-label epke-label"><span>EPKE <b>12</b></span><small>SURVIVAL HERO</small></div>
          <div className="character-label tieme-label"><span>TIEME <b>10</b></span><small>BREAKDANCE BOSS</small></div>
          <div className="scene-footer"><span><span className="live-dot" /> NIGHT RUN / THE BIRTHDAY QUEST</span><span>GEMAAKT VOOR EPKE & TIEME <Heart size={12} fill="currentColor" /></span></div>
        </div>}
        {playing && <>
          <div className="hud">
            <div className="hud-score"><small>SCORE</small><strong data-testid="score">{number(state.score)}</strong><span className={state.combo >= 3 ? 'combo hot' : 'combo'}><Zap size={13} fill="currentColor" /> {state.combo >= 3 ? `${state.combo} COMBO · ×${state.multiplier}` : 'PAK JE COMBO'}</span></div>
            <div className="hud-progress"><div><span>{SETTINGS.stages[state.stage].name}</span><span>{Math.max(0, Math.ceil(SETTINGS.duration - state.time))}s <Flag size={13} /></span></div><div className="track"><div style={{width: `${progress}%`}} /><i style={{left: '33.33%'}} /><i style={{left: '66.66%'}} /></div></div>
            <div className="hud-right"><div className="hearts" aria-label={`${state.lives} levens`}>{Array.from({length: SETTINGS.lives}, (_, i) => <Heart key={i} size={22} className={i < state.lives ? 'filled' : ''} fill={i < state.lives ? 'currentColor' : 'none'} />)}</div><button className="icon-button" onClick={() => state.status === 'paused' ? game.current?.resume() : game.current?.pause()} disabled={ended} aria-label={state.status === 'paused' ? 'Verder spelen' : 'Pauzeren'}>{state.status === 'paused' ? <Play size={19} /> : <Pause size={19} />}</button></div>
          </div>
          {state.status === 'running' && <div className={`current-bro ${state.bro}`}><span className="live-dot" /> {state.bro === 'epke' ? 'EPKE' : 'TIEME'}<small>{state.bro === 'epke' ? 'SURVIVAL HERO' : 'BREAKDANCE BOSS'}</small></div>}
          {state.status === 'countdown' && <div className="countdown"><strong>{Math.ceil(state.countdown) || 'GO!'}</strong><span><b className="lime">LINKS: SPRING</b> &nbsp; <b className="purple">RECHTS: SPIN</b></span></div>}
          {state.status === 'paused' && <div className="game-overlay"><div className="result-panel pause-panel"><span className="eyebrow">EVEN OP ADEM KOMEN</span><h2>PAUZE.</h2><p>Het park wacht op jullie.</p><button className="play-button" onClick={() => game.current?.resume()}><Play size={19} fill="currentColor" /> VERDER SPELEN</button><button className="text-button" onClick={() => game.current?.menu()}>Terug naar start</button></div></div>}
          {ended && <div className="game-overlay"><div className="result-panel">
            <span className="eyebrow">{state.status === 'won' ? 'HET FEEST KAN BEGINNEN!' : 'ELKE RUN MAAKT JE BETER'}</span>
            <div className="result-icon">{state.status === 'won' ? <Trophy size={34} /> : <Zap size={34} />}</div>
            <h2>{state.status === 'won' ? 'BRO-TASTISCH!' : 'NOG EEN RUN?'}</h2>
            <p>{state.status === 'won' ? 'Gefeliciteerd, Epke & Tieme! Dit park is van jullie.' : state.tip}</p>
            <div className="result-score"><small>{state.newBest ? '✦ NIEUW RECORD' : 'JULLIE SCORE'}</small><strong>{number(state.score)}</strong></div>
            <div className="result-stats"><span><b>{state.stars}</b> sterren</span><span><b>{state.maxCombo}×</b> beste combo</span><span><b>{Math.floor(progress)}%</b> afgelegd</span></div>
            <button className="play-button" onClick={start}><RotateCcw size={19} /> NOG EEN KEER <ArrowRight size={22} /></button>
            <button className="text-button" onClick={() => game.current?.menu()}>Terug naar start</button>
          </div></div>}
        </>}
        <button className="fullscreen-button icon-button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Volledig scherm sluiten' : 'Volledig scherm'} title="Volledig scherm">{fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</button>
      </section>
      <section className="control-deck" aria-label="Besturing">
        <button className={`move-control epke-control ${state.bro === 'epke' && playing ? 'active' : ''} ${pressed === 'jump' ? 'is-pressed' : ''}`} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setPressed('jump'); game.current?.action('jump'); }} onPointerUp={() => setPressed(null)} onPointerCancel={() => setPressed(null)} onClick={e => { if(e.detail === 0) game.current?.action('jump'); }} aria-label="Epke springt">
          <span className="move-icon"><ArrowUp size={26} /></span><span className="move-copy"><strong>SPRING <span>MET EPKE</span></strong><small>Tik voor boomstammen & touwringen</small></span><span className="key-group"><kbd>SPATIE</kbd><kbd>↑</kbd></span>
        </button>
        <button className={`move-control tieme-control ${state.bro === 'tieme' && playing ? 'active' : ''} ${pressed === 'spin' ? 'is-pressed' : ''}`} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setPressed('spin'); game.current?.action('spin'); }} onPointerUp={() => setPressed(null)} onPointerCancel={() => setPressed(null)} onClick={e => { if(e.detail === 0) game.current?.action('spin'); }} aria-label="Tieme spint">
          <span className="move-icon"><ArrowDown size={26} /></span><span className="move-copy"><strong>SPIN <span>MET TIEME</span></strong><small>Tik om door beatblokken te breken</small></span><span className="key-group"><kbd>X</kbd><kbd>↓</kbd></span>
        </button>
        <div className="combo-tip"><Zap size={22} /><span><strong>SAMEN ONSTOPBAAR</strong><small>Raak niets. Stapel combo’s. Pak je record.</small></span></div>
      </section>
      <footer className="page-footer"><span>GEEN LOSSE LEVENS. ÉÉN TEAM.</span><span><kbd>ESC</kbd> pauze <i /> <kbd>M</kbd> geluid <span className="footer-star">✦</span> HAPPY BIRTHDAY, BRO&apos;S.</span></footer>
      <Dialog open={help} onOpenChange={(v) => { setHelp(v); game.current?.setInputLocked(v); }}>
        <DialogContent className="help-dialog" showCloseButton={false}>
          <DialogClose className="help-close icon-button" aria-label="Sluiten"><X size={20} /></DialogClose>
          <span className="eyebrow lime">TWEE KNOPPEN. ALLES WAT JE NODIG HEBT.</span><DialogTitle>ZO SPEEL JE.</DialogTitle>
          <DialogDescription>De broers rennen vanzelf. Haal samen het verjaardagsfeest in {SETTINGS.duration} seconden!</DialogDescription>
          <div className="help-step epke"><ArrowUp /><p><strong>Groene knop links — Epke springt</strong><span>Spring over boomstammen. Pak de zwevende touwringen voor extra punten.</span></p></div>
          <div className="help-step tieme"><ArrowDown /><p><strong>Paarse knop rechts — Tieme spint</strong><span>Spin dwars door paarse beatblokken. Je wisselt vanzelf naar de juiste broer.</span></p></div>
          <div className="help-step"><Zap /><p><strong>Pak sterren & maak combo’s</strong><span>Elke hindernis telt. Vanaf 3 achter elkaar verdien je meer punten. Bij 6 krijg je een tijdelijk schild!</span></p></div>
          <p className="help-note">Jullie delen {SETTINGS.lives} levens. Tik per hindernis opnieuw. Speel met twee duimen; liggend heb je meer zicht vooruit. Draaien pauzeert de run. Met toetsenbord: spatie / ↑ om te springen, X / ↓ om te spinnen.</p>
          <DialogClose className="play-button">BEGREPEN <ArrowRight size={20} /></DialogClose>
        </DialogContent>
      </Dialog>
    </main>
  );
}
