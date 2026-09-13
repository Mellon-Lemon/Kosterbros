'use client';
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type CSSProperties,
} from 'react';
import Image from 'next/image';
import {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Maximize,
  HelpCircle,
  Heart,
  Zap,
  Flag,
  X,
  Lock,
  Users,
  User,
  ChevronLeft,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Game, INITIAL_VIEW } from '@/game/engine';
import { LEVELS, type Level } from '@/game/levels';
import { POWERUPS, type PowerUp } from '@/game/settings';
import type { Action } from '@/game/core';
import { TouchInput } from '@/game/input';
import type { Mode } from '@/game/progress';
const number = (n: number) => Math.floor(n).toLocaleString('nl-NL');
function LevelArt({ level }: { level: Level }) {
  const city = level.id >= 2;
  return (
    <svg viewBox="0 0 300 110" className="level-art" aria-hidden="true">
      <circle cx="237" cy="26" r="19" fill={level.color} opacity=".18" />
      <path
        d="M0 95L45 35 95 88 147 22 223 91 265 50 300 85V110H0Z"
        fill={level.color}
        opacity=".08"
      />
      {city ? (
        <g fill={level.color} opacity=".18">
          <path d="M20 90V40h33v50M65 90V18h43v72M119 90V50h33v40M169 90V28h32v62M255 90V48h33v42" />
          {[30, 80, 130, 180, 267].map((x) => (
            <path
              key={x}
              d={`M${x} 58h8m-8 12h8`}
              stroke={level.color}
              strokeWidth="3"
            />
          ))}
        </g>
      ) : (
        <g stroke={level.color} opacity=".2" strokeWidth="5">
          {[30, 90, 190, 270].map((x) => (
            <path
              key={x}
              d={`M${x} 99V25m-20 32 20-35 20 35m-44 20 24-38 24 38`}
            />
          ))}
        </g>
      )}
      <path d="M0 99H300" stroke={level.color} strokeWidth="3" />
      <path
        d="M30 14Q160 70 278 10"
        fill="none"
        stroke={level.color}
        opacity=".35"
      />
      {level.id === 1 ? (
        <g stroke={level.color} fill="none">
          <path d="M153 12V60" strokeWidth="3" />
          <circle cx="153" cy="65" r="8" strokeWidth="3" />
        </g>
      ) : (
        <g>
          <rect
            x="209"
            y="69"
            width="27"
            height="28"
            rx="4"
            fill={level.color}
            opacity=".75"
          />
          <path d="M218 83h10m-5-5v10" stroke="#101525" strokeWidth="2" />
        </g>
      )}
      <text
        x="35"
        y="89"
        fill={level.color}
        fontSize="40"
        fontWeight="900"
        fontFamily="Arial"
      >
        0{level.id + 1}
      </text>
      <path d="m131 76 3 8 9 1-7 5 2 8-7-5-7 5 2-8-7-5 9-1z" fill="#ffdc7e" />
    </svg>
  );
}
export default function Home() {
  const canvas = useRef<HTMLCanvasElement>(null),
    shell = useRef<HTMLElement>(null),
    game = useRef<Game | null>(null);
  const [state, setState] = useState(INITIAL_VIEW),
    [screen, setScreen] = useState<'home' | 'levels'>('home'),
    [help, setHelp] = useState(false),
    [ready, setReady] = useState(false);
  const pointers = useRef(new TouchInput()),
    [pressed, setPressed] = useState<Action[]>([]);
  useEffect(() => {
    if (!canvas.current) return;
    const instance = new Game(canvas.current, (view) => {
      setState(view);
      if (view.status !== 'running' && pointers.current.size) {
        pointers.current.clear();
        setPressed([]);
      }
    });
    game.current = instance;
    setReady(true);
    return () => {
      instance.destroy();
      game.current = null;
    };
  }, []);

  const playing = state.status !== 'menu',
    ended = state.status === 'won' || state.status === 'lost',
    level = LEVELS[state.level];
  const progress = Math.min(100, (state.time / level.duration) * 100);
  function choose(mode: Mode) {
    game.current?.select(
      Math.min(state.level, state.progress.modes[mode].unlocked),
      mode,
    );
    setScreen('levels');
  }
  function start(id = state.level) {
    pointers.current.clear();
    setPressed([]);
    game.current?.start(id);
  }
  function menu() {
    game.current?.menu();
    setScreen('levels');
  }
  function down(e: PointerEvent<HTMLButtonElement>, action: Action) {
    e.preventDefault();
    if (e.isTrusted) e.currentTarget.setPointerCapture(e.pointerId);
    const accepted = pointers.current.press(e.pointerId, action);
    setPressed(pointers.current.held);
    if (accepted) game.current?.action(action);
  }
  function up(e: PointerEvent<HTMLButtonElement>) {
    pointers.current.release(e.pointerId);
    setPressed(pointers.current.held);
  }
  function openHelp() {
    game.current?.pause();
    game.current?.setInputLocked(true);
    setHelp(true);
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shell.current?.requestFullscreen();
    } catch {
      /* Fullscreen is optional. */
    }
  }
  return (
    <main
      ref={shell}
      className="app-shell"
      data-playing={playing}
      data-screen={playing ? 'run' : screen}
    >
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            KB<span>★</span>
          </span>
          <span>
            KOSTER<span className="lime">BRO’S</span>
          </span>
        </div>
        <span className="edition">
          SURVIVAL × BREAKDANCE <b>02</b>
        </span>
        <div className="top-actions">
          {playing && (
            <span className="record">
              <Trophy size={16} />
              {number(state.best)}
            </span>
          )}
          <button
            className="icon-button"
            onClick={() => game.current?.setMuted(!state.muted)}
            aria-label={state.muted ? 'Geluid aan' : 'Geluid uit'}
          >
            {state.muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            className="icon-button"
            onClick={openHelp}
            aria-label="Hoe speel je?"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </header>
      <div className="game-heading">
        <span>
          <i />{' '}
          {playing
            ? `0${level.id + 1} / ${level.name.toUpperCase()}`
            : 'HET PARK IS VAN JULLIE.'}
        </span>
        <span>
          {playing
            ? state.mode === 'coop'
              ? 'SAMEN · EPKE LINKS / TIEME RECHTS'
              : 'SOLO · TWEE DUIMEN, ÉÉN TEAM'
            : '6 LEVELS · 2 BROERS · 1 AVONTUUR'}
        </span>
      </div>
      <section
        className="game-stage"
        aria-label="KosterBro’s spel"
        style={{ '--level-color': level.color } as CSSProperties}
      >
        <canvas
          ref={canvas}
          className="game-canvas"
          aria-label="Automatisch rennen. Groen springt, paars spint. BRO POWER beschermt het team."
        />
        {!playing && screen === 'home' && (
          <div className="start-screen">
            <Image
              className="key-art"
              src="/keyart.png"
              width={1672}
              height={941}
              priority
              unoptimized
              alt="Epke aan het touw en Tieme in een breakdance-freeze in het nachtelijke survivalpark."
            />
            <div className="art-shade" />
            <div className="start-copy">
              <span className="eyebrow lime">
                <Zap size={15} /> HET VOLGENDE AVONTUUR
              </span>
              <h1>
                KOSTER
                <br />
                <span>
                  BRO’S<span className="title-star">✦</span>
                </span>
              </h1>
              <p className="hero-line">Twee broers. Eén epische run.</p>
              <p className="hero-description">
                Spring hoger. Spin harder. Speel samen.
                <br />
                Zes levels tot aan het feest.
              </p>
              <div className="mode-actions">
                <button
                  className="play-button"
                  disabled={!ready}
                  onClick={() => choose('solo')}
                >
                  <User size={20} /> ALLEEN SPELEN <ArrowRight size={20} />
                </button>
                <button
                  className="secondary-button"
                  disabled={!ready}
                  onClick={() => choose('coop')}
                >
                  <Users size={20} /> SAMEN SPELEN
                </button>
              </div>
              <small className="start-hint">
                Eén tablet. Grote knoppen. Meteen plezier.
              </small>
            </div>
            <div className="character-label epke-label">
              EPKE <b>12</b>
              <small>SURVIVAL HERO</small>
            </div>
            <div className="character-label tieme-label">
              TIEME <b>10</b>
              <small>BREAKDANCE BOSS</small>
            </div>
          </div>
        )}
        {!playing && screen === 'levels' && (
          <div className="level-screen">
            <div className="map-heading">
              <div>
                <span className="eyebrow lime">
                  VAN HET PARK NAAR HET FEEST
                </span>
                <h2>KIES JE AVONTUUR.</h2>
              </div>
              <div className="mode-switch" aria-label="Speelmodus">
                <button
                  aria-pressed={state.mode === 'solo'}
                  onClick={() => choose('solo')}
                >
                  <User size={17} /> Alleen
                </button>
                <button
                  aria-pressed={state.mode === 'coop'}
                  onClick={() => choose('coop')}
                >
                  <Users size={17} /> Samen
                </button>
              </div>
            </div>
            <div className="level-grid">
              {LEVELS.map((l) => {
                const locked = l.id > state.progress.modes[state.mode].unlocked,
                  medals = state.progress.modes[state.mode].medals[l.id];
                return (
                  <button
                    key={l.id}
                    className="level-card"
                    disabled={locked || !ready}
                    onClick={() => start(l.id)}
                    style={{ '--card-color': l.color } as CSSProperties}
                    aria-label={`Level ${l.id + 1}: ${l.name}${locked ? ', vergrendeld' : ''}`}
                  >
                    <LevelArt level={l} />
                    <div className="level-card-copy">
                      <div className="level-title">
                        <h3>{l.name}</h3>
                        {locked ? <Lock size={18} /> : <ArrowRight size={20} />}
                      </div>
                      <p>{l.subtitle}</p>
                      <div className="level-meta">
                        <span>{l.duration} SEC</span>
                        <span
                          className="medal-dots"
                          aria-label={`${medals.filter(Boolean).length} van 3 medailles`}
                        >
                          {medals.map((v, i) => (
                            <span key={i} className={v ? 'earned' : ''}>
                              ★
                            </span>
                          ))}
                        </span>
                      </div>
                      <small>
                        {locked
                          ? `Speel level ${l.id} uit`
                          : state.progress.modes[state.mode].records[l.id]
                            ? `Record ${number(state.progress.modes[state.mode].records[l.id])}`
                            : 'Klaar voor jullie eerste run'}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="map-footer">
              <button className="text-button" onClick={() => setScreen('home')}>
                <ChevronLeft size={17} /> Startscherm
              </button>
              <span>
                {state.progress.classicBest > 0
                  ? `Klassiek record: ${number(state.progress.classicBest)}`
                  : 'Finish → volgend level. Pak alle 18 medailles!'}
              </span>
            </div>
          </div>
        )}
        {playing && (
          <>
            <div className="hud">
              <div className="hud-score">
                <small>SCORE</small>
                <strong data-testid="score">{number(state.score)}</strong>
                <span className="combo">
                  <Zap size={12} />
                  {state.combo >= 3
                    ? `${state.combo} COMBO · ×${state.multiplier}`
                    : 'PAK JE COMBO'}
                </span>
              </div>
              <div className="hud-progress">
                <div>
                  <span>{level.name}</span>
                  <span>{Math.ceil(level.duration - state.time)}s</span>
                </div>
                <div className="track">
                  <div style={{ width: `${progress}%` }} />
                </div>
                {!state.progress.modes[state.mode].medals[state.level][1] && (
                  <span className="challenge-progress">
                    <Flag size={12} />
                    {level.challengeLabel}{' '}
                    <b>
                      {Math.min(level.target, state.counts[level.challenge])}/
                      {level.target}
                    </b>
                  </span>
                )}
              </div>
              <div className="hud-right">
                <div className="hearts" aria-label={`${state.lives} levens`}>
                  {[0, 1, 2].map((i) => (
                    <Heart
                      key={i}
                      size={23}
                      className={i < state.lives ? 'filled' : ''}
                      fill={i < state.lives ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <button
                  className="icon-button"
                  disabled={ended}
                  onClick={() =>
                    state.status === 'paused'
                      ? game.current?.resume()
                      : game.current?.pause()
                  }
                  aria-label={
                    state.status === 'paused' ? 'Verder spelen' : 'Pauzeren'
                  }
                >
                  {state.status === 'paused' ? (
                    <Play size={19} />
                  ) : (
                    <Pause size={19} />
                  )}
                </button>
              </div>
            </div>
            <div className="effect-strip" aria-label="Actieve power-ups">
              {state.charge && (
                <span
                  className="effect-chip"
                  style={{ color: POWERUPS.charge.color }}
                >
                  ↑↑ KLAAR
                </span>
              )}
              {(['shield', 'magnet', 'double', 'boost'] as const)
                .filter((k) => state.effects[k] > 0)
                .map((k) => (
                  <span
                    key={k}
                    className="effect-chip"
                    style={{ color: POWERUPS[k].color }}
                  >
                    {POWERUPS[k].symbol} {POWERUPS[k].name}{' '}
                    <b>{Math.ceil(state.effects[k])}s</b>
                  </span>
                ))}
            </div>
            {state.status === 'running' && state.time < 10 && (
              <div className="lesson">{level.lesson}</div>
            )}
            {state.status === 'countdown' && (
              <div className="countdown">
                <strong>{Math.ceil(state.countdown) || 'GO!'}</strong>
                <span>
                  {state.time === 0
                    ? level.lesson
                    : 'Even klaarzitten… en door!'}
                </span>
              </div>
            )}
            {state.status === 'paused' && (
              <div className="game-overlay">
                <div className="result-panel">
                  <span className="eyebrow lime">EVEN OP ADEM KOMEN</span>
                  <h2>PAUZE.</h2>
                  <p>Het park wacht op jullie.</p>
                  <div className="pause-goals">
                    <h3>DRIE STERREN VOOR DIT LEVEL</h3>
                    {[
                      'Bereik de finish',
                      level.challengeLabel,
                      'Finish zonder levensverlies',
                    ].map((goal, i) => {
                      const saved =
                          state.progress.modes[state.mode].medals[state.level][
                            i
                          ],
                        done =
                          i === 1 &&
                          state.counts[level.challenge] >= level.target;
                      return (
                        <div
                          key={goal}
                          className={saved || done ? 'earned' : 'pending'}
                        >
                          <span>★</span>
                          <p>
                            <strong>{goal}</strong>
                            <small>
                              {saved
                                ? 'Al behaald in deze speelmodus'
                                : done
                                  ? 'Doel gehaald in deze run'
                                  : i === 0
                                    ? `${Math.floor(progress)}% afgelegd`
                                    : i === 1
                                      ? `${state.counts[level.challenge]} van ${level.target}`
                                      : state.damage === 0
                                        ? 'Nog mogelijk: je hebt nog geen leven verloren'
                                        : 'Deze run niet meer mogelijk · probeer opnieuw'}
                            </small>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    className="play-button"
                    onClick={() => game.current?.resume()}
                  >
                    <Play size={19} /> VERDER SPELEN
                  </button>
                  <button className="text-button" onClick={menu}>
                    Naar de levels
                  </button>
                </div>
              </div>
            )}
            {ended && (
              <div className="game-overlay">
                <div className="result-panel">
                  <span className="eyebrow lime">
                    {state.status === 'won'
                      ? level.id === 5
                        ? 'HET FEEST KAN BEGINNEN!'
                        : 'LEVEL GEHAALD!'
                      : 'ELKE RUN MAAKT JE BETER'}
                  </span>
                  <h2>
                    {state.status === 'won' ? 'BRO-TASTISCH!' : 'NOG EEN RUN?'}
                  </h2>
                  <p>
                    {state.status === 'won'
                      ? level.id === 5
                        ? 'Gefeliciteerd, Epke & Tieme! Alle zes levels gehaald.'
                        : `${level.name} is van jullie. Op naar het volgende avontuur!`
                      : state.tip}
                  </p>
                  <div className="result-score">
                    <small>
                      {state.newBest
                        ? '✦ NIEUW RECORD'
                        : state.mode === 'coop'
                          ? 'JULLIE SCORE'
                          : 'JOUW SCORE'}
                    </small>
                    <strong>{number(state.score)}</strong>
                  </div>
                  <div className="result-medals">
                    {[
                      'Finish bereikt',
                      level.challengeLabel,
                      'Zonder levensverlies',
                    ].map((label, i) => (
                      <div
                        key={label}
                        className={state.medals[i] ? 'earned' : ''}
                      >
                        <span>
                          {state.medals[i] ? (
                            <Check size={17} />
                          ) : (
                            <Trophy size={17} />
                          )}
                        </span>
                        <small>{label}</small>
                      </div>
                    ))}
                  </div>
                  <div className="result-stats">
                    <span>
                      <b>{state.stars}</b> sterren
                    </span>
                    <span>
                      <b>{state.maxCombo}×</b> beste combo
                    </span>
                    <span>
                      <b>{Math.floor(progress)}%</b> afgelegd
                    </span>
                  </div>
                  <div className="result-actions">
                    {state.status === 'won' && level.id < 5 && (
                      <button
                        className="play-button"
                        onClick={() => start(level.id + 1)}
                      >
                        VOLGEND LEVEL <ArrowRight size={20} />
                      </button>
                    )}
                    <button
                      className={
                        state.status === 'lost' || level.id === 5
                          ? 'play-button'
                          : 'secondary-button'
                      }
                      onClick={() => start()}
                    >
                      <RotateCcw size={18} /> OPNIEUW
                    </button>
                  </div>
                  <button className="text-button" onClick={menu}>
                    Naar de levels
                  </button>
                </div>
              </div>
            )}
            <button
              className="fullscreen-button icon-button"
              aria-label="Volledig scherm"
              onClick={fullscreen}
            >
              <Maximize size={17} />
            </button>
          </>
        )}
      </section>
      {playing && (
        <section className="control-deck" aria-label="Besturing">
          <button
            className={`move-control epke-control ${pressed.includes('jump') ? 'is-pressed' : ''} ${state.charge ? 'charged' : ''}`}
            disabled={state.status !== 'running'}
            onPointerDown={(e) => down(e, 'jump')}
            onPointerUp={up}
            onPointerCancel={up}
            onLostPointerCapture={up}
            onClick={(e) => {
              if (e.detail === 0) game.current?.action('jump');
            }}
            aria-label="Epke springt"
          >
            <span className="move-icon">
              {state.charge ? <b>↑↑</b> : <ArrowUp size={30} />}
            </span>
            <span className="move-copy">
              <strong>
                SPRING{' '}
                <small>
                  {state.mode === 'coop' ? 'EPKE · LINKS' : 'MET EPKE'}
                </small>
              </strong>
              <span>
                {state.charge
                  ? 'Dubbeljump klaar: tik nog eens in de lucht'
                  : 'Over stammen · pak de touwringen'}
              </span>
            </span>
          </button>
          <button
            className={`power-control ${state.energy >= 100 ? 'power-ready' : ''} ${state.effects.bro > 0 ? 'power-active' : ''}`}
            disabled={
              state.status !== 'running' ||
              state.energy < 100 ||
              state.effects.bro > 0
            }
            onPointerDown={(e) => down(e, 'power')}
            onPointerUp={up}
            onPointerCancel={up}
            onLostPointerCapture={up}
            onClick={(e) => {
              if (e.detail === 0) game.current?.action('power');
            }}
            aria-label="Activeer BRO POWER"
          >
            <Zap size={25} fill="currentColor" />
            <strong>BRO POWER</strong>
            <span>
              {state.effects.bro > 0
                ? `${Math.ceil(state.effects.bro)}s POWER!`
                : state.level < 2
                  ? 'VANAF LEVEL 3'
                  : state.energy >= 100
                    ? 'TIK!'
                    : `${state.energy}%`}
            </span>
            <div className="energy-track">
              <i
                style={{
                  width: `${state.effects.bro > 0 ? (state.effects.bro / 5) * 100 : state.energy}%`,
                }}
              />
            </div>
          </button>
          <button
            className={`move-control tieme-control ${pressed.includes('spin') ? 'is-pressed' : ''}`}
            disabled={state.status !== 'running'}
            onPointerDown={(e) => down(e, 'spin')}
            onPointerUp={up}
            onPointerCancel={up}
            onLostPointerCapture={up}
            onClick={(e) => {
              if (e.detail === 0) game.current?.action('spin');
            }}
            aria-label="Tieme spint"
          >
            <span className="move-icon">
              <ArrowDown size={30} />
            </span>
            <span className="move-copy">
              <strong>
                SPIN{' '}
                <small>
                  {state.mode === 'coop' ? 'TIEME · RECHTS' : 'MET TIEME'}
                </small>
              </strong>
              <span>
                {state.spinCooldown > 0
                  ? 'Even opladen…'
                  : 'Door beats · 3 discoboxen = bonus'}
              </span>
            </span>
            <div
              className="spin-meter"
              style={{
                transform: `scaleX(${Math.max(0, 1 - state.spinCooldown / 0.95)})`,
              }}
            />
          </button>
        </section>
      )}
      {!playing && (
        <footer className="page-footer">
          <span>GEEN LOSSE LEVENS. ÉÉN TEAM.</span>
          <span>
            GEMAAKT VOOR EPKE & TIEME <span className="lime">✦</span>
          </span>
        </footer>
      )}
      {!state.storageAvailable && (
        <output className="save-note">
          Je kunt spelen. Deze browser bewaart de voortgang alleen zolang dit
          scherm open blijft.
        </output>
      )}
      <Dialog
        open={help}
        onOpenChange={(v) => {
          setHelp(v);
          game.current?.setInputLocked(v);
        }}
      >
        <DialogContent className="help-dialog" showCloseButton={false}>
          <DialogClose className="help-close icon-button" aria-label="Sluiten">
            <X size={20} />
          </DialogClose>
          <span className="eyebrow lime">TWEE KNOPPEN. ÉÉN TEAM.</span>
          <DialogTitle>ZO SPEEL JE.</DialogTitle>
          <DialogDescription>
            De broers rennen vanzelf. Haal de finish met minstens één van jullie
            drie levens en speel het volgende level vrij.
          </DialogDescription>
          <div className="help-step lime">
            <ArrowUp />
            <p>
              <strong>Epke springt · groen links</strong>
              <span>
                Spring over stammen. Met een ↑↑-lading kun je nog één keer in de
                lucht tikken. Hoge touwen grijp je vanzelf; ze zijn een bonus.
              </span>
            </p>
          </div>
          <div className="help-step purple">
            <ArrowDown />
            <p>
              <strong>Tieme spint · paars rechts</strong>
              <span>
                Breek beatblokken en spin onder lage balken. Een late, goed
                getimede spin geeft PERFECT. Alleen bij stam + beat werken
                springen en spinnen tegelijk. Met Beat Boost kun je drie
                discoboxen achter elkaar breken voor een bonus.
              </span>
            </p>
          </div>
          <div className="help-step">
            <Zap />
            <p>
              <strong>BRO POWER · vanaf level 3</strong>
              <span>
                Goede moves vullen de meter. Tik in het midden wanneer hij vol
                is: vijf seconden bescherming en dubbele punten!
              </span>
            </p>
          </div>
          <div className="power-guide">
            {(Object.keys(POWERUPS) as PowerUp[]).map((k) => (
              <div key={k}>
                <b style={{ color: POWERUPS[k].color }}>{POWERUPS[k].symbol}</b>
                <p>
                  <strong>{POWERUPS[k].name}</strong>
                  <span>{POWERUPS[k].description}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="help-note">
            Samen: Epke links, Tieme rechts; iedereen mag BRO POWER activeren.
            Alleen: bedien beide kanten zelf. Tik per move opnieuw. Draaien
            pauzeert de run. Toetsenbord: spatie / ↑ springt, X / ↓ spint, B
            geeft BRO POWER, Esc pauzeert, M schakelt geluid.
          </p>
          <DialogClose className="play-button">
            BEGREPEN <ArrowRight size={20} />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </main>
  );
}
