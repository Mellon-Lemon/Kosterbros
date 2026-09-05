import { RunnerModel, type Action, type GameState } from './core';
import { Renderer } from './renderer';
import { GameAudio } from './audio';
export { INITIAL_STATE, type GameState } from './core';

const RECORD_KEY = 'kosterbros.record.v1';
const AUDIO_KEY = 'kosterbros.muted.v1';
type PageTool = {name:string; title:string; description:string; inputSchema:object; annotations:{readOnlyHint:boolean;untrustedContentHint:boolean}; execute:(input:unknown)=>unknown};
type ToolDocument = Document & {modelContext?: {registerTool:(tool:PageTool, options:{signal:AbortSignal})=>void|Promise<void>}};

export class Game {
  model = new RunnerModel(); audio = new GameAudio(); renderer:Renderer;
  onState:(state:GameState)=>void;
  private raf = 0; private last = 0; private publishTimer = 0; private locked = false;
  private lifecycle = new AbortController();
  private testTick: (()=>void) | null = null;
  private orientation = window.matchMedia('(orientation: portrait)');
  get best() {return this.model.state.best;}
  get muted() {return this.model.state.muted;}
  constructor(canvas:HTMLCanvasElement,onState:(state:GameState)=>void) {
    this.onState=onState;
    try {const value=Number(localStorage.getItem(RECORD_KEY));this.model.state.best=Number.isFinite(value)?Math.max(0,Math.floor(value)):0;this.model.state.muted=localStorage.getItem(AUDIO_KEY)==='true';} catch { /* Private mode can deny browser storage. */ }
    this.audio.setMuted(this.muted);this.renderer=new Renderer(canvas,this.model);
    window.addEventListener('keydown',this.keyDown);window.addEventListener('blur',this.blur);
    document.addEventListener('visibilitychange',this.visibility);
    this.orientation.addEventListener('change',this.blur);
    if (import.meta.env.DEV && new URLSearchParams(location.search).get('test') === 'perfect') {
      void import('../tests/browser-fixture').then(({installBrowserFixture}) => {this.testTick=installBrowserFixture(this);});
    }
    this.registerTools();this.publish();this.raf=requestAnimationFrame(this.frame);
  }
  private publish() {this.onState({...this.model.state});}
  private frame = (now:number) => {
    const dt=this.last?Math.min((now-this.last)/1000,.1):0;this.last=now;
    this.testTick?.();this.model.step(dt);
    this.audio.update(dt,this.model.state.status==='running',this.model.state.stage);
    this.flushEvents();this.renderer.render(dt);
    this.publishTimer+=dt;if(this.publishTimer>.075){this.publishTimer=0;this.publish();}
    this.raf=requestAnimationFrame(this.frame);
  };
  private flushEvents() {
    for(const e of this.model.events){this.audio.effect(e.type);this.renderer.event(e);
      if(e.type==='win'||e.type==='lose'){if(!this.testTick){try{localStorage.setItem(RECORD_KEY,String(this.best));}catch{}}this.publish();}
    }
    this.model.events=[];
  }
  start() {if(this.locked)return;this.audio.unlock();this.model.start();this.renderer.reset();this.audio.beat=0;this.last=0;this.publish();}
  pause() {this.model.pause();this.publish();}
  resume() {if(this.locked)return;this.audio.unlock();this.model.resume();this.last=0;this.publish();}
  menu() {this.model.menu();this.renderer.reset();this.publish();}
  action(action:Action) {if(this.locked)return false;this.audio.unlock();const result=this.model.action(action);this.flushEvents();this.publish();return result;}
  setMuted(value:boolean) {this.model.state.muted=value;this.audio.unlock();this.audio.setMuted(value);try{localStorage.setItem(AUDIO_KEY,String(value));}catch{}this.publish();}
  setInputLocked(value:boolean) {this.locked=value;}
  private keyDown = (e:KeyboardEvent) => {
    if(this.locked||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
    const s=this.model.state.status;
    if(e.code==='KeyM'){e.preventDefault();this.setMuted(!this.muted);return;}
    if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();if(s==='paused')this.resume();else this.pause();return;}
    if(e.code==='Enter'&&(s==='menu'||s==='won'||s==='lost')&&!(e.target instanceof HTMLElement && e.target.closest('button'))){e.preventDefault();this.start();return;}
    if(s!=='running')return;
    if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();this.action('jump');}
    if(['KeyX','ArrowDown','KeyS'].includes(e.code)){e.preventDefault();this.action('spin');}
  };
  private blur = () => this.pause();
  private visibility = () => {if(document.hidden)this.pause();};
  private snapshot() {
    const m=this.model;
    return {...m.state, height:Math.round(m.height), spinRemaining:m.spin, shieldRemaining:m.shield,
      nextObstacles:m.items.filter(i=>!i.resolved&&(i.kind==='log'||i.kind==='beat')).slice(0,3).map(i=>({kind:i.kind,secondsUntil:i.when-m.state.time,distance:Math.round(m.offset(i))}))};
  }
  private registerTools() {
    const ctx=(document as ToolDocument).modelContext;if(!ctx?.registerTool)return;
    const register=(tool:PageTool)=>{try{void Promise.resolve(ctx.registerTool(tool,{signal:this.lifecycle.signal})).catch(()=>{});}catch{}};
    const empty={type:'object',properties:{},additionalProperties:false};
    register({name:'read_run_state',title:'Bekijk de run',description:'Read the current KosterBros run, score and approaching obstacles.',inputSchema:empty,annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>this.snapshot()});
    register({name:'start_run',title:'Start een run',description:'Start a new 90-second KosterBros game, with a countdown. Only allowed from the start screen or a completed run.',inputSchema:empty,annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{if(this.locked||!['menu','won','lost'].includes(this.model.state.status))throw new Error('Finish the current run or return to the start screen first.');this.start();return this.snapshot();}});
    register({name:'perform_move',title:'Spring of spin',description:'Perform the same Epke jump or Tieme spin as the two visible game controls. Only works during a running game.',inputSchema:{type:'object',properties:{move:{type:'string',enum:['jump','spin']}},required:['move'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input)=>{const move=(input as {move?:unknown})?.move;if(move!=='jump'&&move!=='spin')throw new Error('Move must be jump or spin.');if(this.locked||this.model.state.status!=='running')throw new Error('The game is not running.');return {accepted:this.action(move),...this.snapshot()};}});
  }
  destroy() {cancelAnimationFrame(this.raf);this.lifecycle.abort();this.orientation.removeEventListener('change',this.blur);window.removeEventListener('keydown',this.keyDown);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);this.audio.destroy();this.renderer.destroy();}
}
