import test from 'node:test';
import assert from 'node:assert/strict';
import { RunnerModel, createCourse } from '../game/core.ts';
import { SETTINGS } from '../game/settings.ts';

function running() { const m = new RunnerModel();m.start();for(let i=0;i<361;i++)m.step(1/120);assert.equal(m.state.status,'running');return m; }
function advance(m:RunnerModel,seconds:number,dt=1/120) {for(let i=0;i<Math.ceil(seconds/dt);i++)m.step(dt);}

await test('No-input run ends, shares three lives and gives a useful tip',()=>{
  const m=running();advance(m,20);assert.equal(m.state.status,'lost');assert.equal(m.state.lives,0);assert.match(m.state.tip,/springknop|spinknop/);assert.ok(m.state.score>0);
});
await test('Countdown and pause freeze all gameplay until resume',()=>{
  const m=new RunnerModel();m.start();m.step(.1);m.pause();const count=m.state.countdown;advance(m,5);assert.equal(m.state.countdown,count);m.resume();advance(m,3);m.action('jump');m.pause();const h=m.height,t=m.state.time;advance(m,5);assert.equal(m.height,h);assert.equal(m.state.time,t);m.resume();advance(m,1);assert.ok(m.state.time>t);
});
await test('Actions are gated, jumping cannot fly and spinning has a cooldown',()=>{
  const m=new RunnerModel();assert.equal(m.action('jump'),false);m.start();assert.equal(m.action('spin'),false);advance(m,3.1);assert.equal(m.action('jump'),true);m.step(.1);assert.equal(m.action('jump'),false);assert.equal(m.action('spin'),true);assert.equal(m.action('spin'),false);advance(m,1);assert.equal(m.height,0);assert.equal(m.action('spin'),true);
});
await test('Wrong skills cost a life: spin into log, jump into beat block',()=>{
  for(const [kind,action] of [['log','spin'],['beat','jump']] as const){const m=running();m.items=[{id:0,kind,when:1,height:0,resolved:false,hit:false}];advance(m,.72);m.action(action);advance(m,.6);assert.equal(m.state.lives,2);assert.equal(m.state.combo,0);}
});
for(const fps of [30,60,120])await test(`A correctly played complete run wins at ${fps} FPS`,()=>{
  const m=running();const done=new Set<number>();
  for(let i=0;i<(SETTINGS.duration+1)*fps&&m.state.status==='running';i++){
    const next=m.items.find(i=>!i.resolved&&(i.kind==='log'||i.kind==='beat'));
    if(next&&!done.has(next.id)&&next.when-m.state.time<=.32){m.action(next.kind==='log'?'jump':'spin');done.add(next.id);}
    m.step(1/fps);
  }
  assert.equal(m.state.status,'won');assert.equal(m.state.time,90);assert.equal(m.state.lives,3);assert.ok(m.state.maxCombo>30);assert.ok(m.state.stars>90);assert.equal(m.state.multiplier,4);assert.ok(m.state.score>15000);assert.ok(m.events.some(e=>e.type==='shield'));assert.ok(m.events.some(e=>e.type==='ring'));assert.equal(m.state.best,m.state.score);
});
await test('Replay resets the run and retains only record and audio preference',()=>{
  const m=running();m.state.muted=true;advance(m,20);const score=m.state.best;assert.ok(score>0);m.start();assert.equal(m.state.best,score);assert.equal(m.state.muted,true);assert.equal(m.state.score,0);assert.equal(m.state.time,0);assert.equal(m.state.lives,3);assert.equal(m.state.combo,0);assert.equal(m.state.status,'countdown');assert.ok(m.items.every(i=>!i.resolved));
});
await test('Course has clear reaction windows and a clear finish',()=>{
  const hazards=createCourse().filter(i=>i.kind==='log'||i.kind==='beat');assert.equal(hazards[0].kind,'log');assert.equal(hazards[1].kind,'beat');for(let i=1;i<hazards.length;i++)assert.ok(hazards[i].when-hazards[i-1].when>1.9);assert.ok(hazards.at(-1)!.when<87);
});

