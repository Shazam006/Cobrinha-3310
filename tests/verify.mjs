import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
scripts.forEach(s=>new vm.Script(s));
new vm.Script(fs.readFileSync(path.join(root,'dist/service-worker.js'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'dist/manifest.webmanifest'),'utf8'));
assert.equal(manifest.lang,'pt-BR');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
for(const icon of [...manifest.icons,{src:'./icons/apple-touch-icon.png',sizes:'180x180'}]){
  const b=fs.readFileSync(path.join(root,'dist',icon.src));const [w,h]=icon.sizes.split('x').map(Number);
  assert.equal(b.readUInt32BE(16),w);assert.equal(b.readUInt32BE(20),h);
}
assert(!/<(?:script|link)[^>]+(?:src|href)=["']https?:/.test(html));
function harness(seed={},blocked=false){
  const listeners={},elements=new Map(),storage=new Map(Object.entries(seed)),timers=new Map(),draws=[];let next=0,now=0;const media={matches:false};
  const element=id=>{if(!elements.has(id))elements.set(id,{id,textContent:'',hidden:false,disabled:false,dataset:{},attrs:{},listeners:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){(this.listeners[k]??=[]).push(f)},getContext(){return {fillRect(){},drawImage(image,x,y){if(id==='game')draws.push({x,y})}}},closest(){return null}});return elements.get(id)};
  const directional=['up','down','left','right'].map(k=>{const e=element(k);e.dataset.dir=k;return e});
  const speeds=['easy','normal','hard'].map(k=>{const e=element(k);e.dataset.speed=k;return e});
  const context={document:{createElement:()=>element('sprite-'+(++next)),getElementById:element,querySelectorAll:s=>s==='[data-dir]'?directional:speeds,addEventListener(k,f){(listeners[k]??=[]).push(f)},hidden:false},navigator:{userAgent:'Test',platform:'Test',maxTouchPoints:0},localStorage:{getItem(k){if(blocked)throw Error('denied');return storage.get(k)??null},setItem(k,v){if(blocked)throw Error('denied');storage.set(k,v)}},performance:{now:()=>now},PointerEvent:function(){},requestAnimationFrame(f){const id=++next;timers.set(id,{f});return id},cancelAnimationFrame(id){timers.delete(id)},matchMedia:()=>media,addEventListener(){},AbortController,console};
  context.window=context;context.globalThis=context;
  const instrumented=scripts[0].replace('    })();',`      globalThis.test={start,tick,pause,turn,randomFood,schedule,snapshot,clock:()=>({stepMs,lastStepAt,nextStepAt}),set(v){if(v.snake)snake=v.snake;if('food'in v)food=v.food;if(v.dir)dir=v.dir;if(v.pending)pending=v.pending;if(v.state)state=v.state;if('points'in v)points=v.points},direction:()=>({...dir}),queue:()=>pending.map(p=>({...p}))};\n    })();`);
  vm.runInNewContext(instrumented,context);
  return {game:context.test,context,element,storage,timers,listeners,draws,media,advance(ms){now+=ms;const callbacks=[...timers.values()];timers.clear();for(const {f} of callbacks)f(now)}};
}
let passed=0;const checks=[];
function check(name,fn){fn();passed++;checks.push(name);console.log('PASS '+name)}
check('Syntax, manifest, PNG dimensions, self-contained resources',()=>{});
check('Ready, start, movement and one timer',()=>{const h=harness();assert.equal(h.game.snapshot().state,'ready');h.game.start();assert.equal(h.timers.size,1);h.game.tick();assert.equal(h.game.snapshot().snake[0].x,7);assert.equal(h.timers.size,1)});
check('Wall and body collisions freeze game',()=>{for(const v of [{snake:[{x:19,y:1},{x:18,y:1},{x:17,y:1}],dir:{x:1,y:0}},{snake:[{x:1,y:1},{x:2,y:1},{x:2,y:2},{x:1,y:2}],dir:{x:1,y:0}}]){const h=harness();h.game.start();h.game.set({...v,food:{x:10,y:10}});h.game.tick();assert.equal(h.game.snapshot().state,'lost');assert.equal(h.timers.size,0);const before=JSON.stringify(h.game.snapshot());h.game.tick();h.game.turn('up');assert.equal(JSON.stringify(h.game.snapshot()),before)}});
check('Vacating tail is allowed, occupied tail when eating is not',()=>{for(const eating of [false,true]){const h=harness();h.game.start();h.game.set({snake:[{x:1,y:1},{x:2,y:1},{x:2,y:2},{x:1,y:2}],dir:{x:0,y:1},food:eating?{x:1,y:2}:{x:10,y:10}});h.game.tick();assert.equal(h.game.snapshot().state,eating?'lost':'running')}});
check('Eating grows, adds ten, persists best and leaves food free',()=>{const h=harness();h.game.start();h.game.set({food:{x:7,y:10}});h.game.tick();const s=h.game.snapshot();assert.equal(s.points,10);assert.equal(s.snake.length,4);assert.equal(h.storage.get('snake3310_best'),'10');for(let i=0;i<100;i++)assert(!s.snake.some(p=>JSON.stringify(p)===JSON.stringify(h.game.randomFood())))});
check('Full board is victory with score 3970',()=>{const h=harness();h.game.start();const snake=[{x:1,y:0}];for(let y=0;y<20;y++)for(let x=0;x<20;x++)if(!(y===0&&(x===0||x===1)))snake.push({x,y});h.game.set({snake,dir:{x:-1,y:0},food:{x:0,y:0},points:3960});h.game.tick();const s=h.game.snapshot();assert.equal(s.state,'won');assert.equal(s.snake.length,400);assert.equal(s.points,3970);assert.equal(s.food,null);assert.equal(h.timers.size,0)});
check('Bounded rapid input queue never reverses direction (4096 sequences)',()=>{const names=['up','down','left','right'];for(let n=0;n<4096;n++){const h=harness();h.game.start();let v=n;for(let i=0;i<6;i++){h.game.turn(names[v%4]);v=Math.floor(v/4)}assert(h.game.queue().length<=2);for(let i=0;i<3;i++){const before=h.game.direction();h.game.tick();const after=h.game.direction();assert(!(after.x===-before.x&&after.y===-before.y))}}});
check('Pause, resume, repeated restart and auto-pause have one frame callback',()=>{const h=harness();h.game.start();h.game.pause();const before=JSON.stringify(h.game.snapshot());h.game.tick();assert.equal(JSON.stringify(h.game.snapshot()),before);assert.equal(h.timers.size,0);h.game.pause();assert.equal(h.timers.size,1);for(let i=0;i<20;i++)h.game.start();assert.equal(h.timers.size,1);h.game.turn('up');h.game.start();assert.equal(h.game.queue().length,0);h.context.document.hidden=true;for(const f of h.listeners.visibilitychange)f();assert.equal(h.game.snapshot().state,'paused');assert.equal(h.timers.size,0)});
check('Difficulty, sound and record restore; denied storage and APIs degrade',()=>{const h=harness({snake3310_best:'90',snake3310_sound:'false',snake3310_difficulty:'hard'});assert.equal(h.game.snapshot().best,90);assert.equal(h.game.snapshot().soundOn,false);h.game.start();h.game.set({food:{x:0,y:0}});h.advance(84);assert.equal(h.game.snapshot().snake[0].x,6);h.advance(1);assert.equal(h.game.snapshot().snake[0].x,7);h.game.set({points:500});h.game.schedule();const x=h.game.snapshot().snake[0].x;h.advance(51);assert.equal(h.game.snapshot().snake[0].x,x);h.advance(1);assert.equal(h.game.snapshot().snake[0].x,x+1);h.game.start();assert.equal(h.game.snapshot().best,90);const denied=harness({},true);denied.game.start();denied.game.set({food:{x:7,y:10}});denied.game.tick();assert.equal(denied.game.snapshot().points,10);assert.equal(harness({snake3310_best:'Infinity',snake3310_difficulty:'bad'}).game.snapshot().best,0)});
check('Same movement rate at 60 and 120 Hz; visible positions interpolate',()=>{
  for(const hz of [60,120]){const h=harness();h.game.start();h.game.set({food:{x:0,y:0}});for(let i=0;i<hz;i++)h.advance(1000/hz);assert.equal(h.game.snapshot().snake[0].x,11);assert.equal(h.timers.size,1)}
  const h=harness();h.game.start();h.game.set({food:{x:0,y:0}});h.advance(170);const initial=h.draws.at(-1).x;h.advance(85);const middle=h.draws.at(-1).x;assert.equal(initial,120);assert.equal(middle,130);assert(middle>initial&&middle<140);
});
check('Long main-thread stall never causes a burst of invisible moves',()=>{const h=harness();h.game.start();h.game.set({food:{x:0,y:0}});h.advance(2000);assert.equal(h.game.snapshot().snake[0].x,7);assert.equal(h.game.snapshot().state,'running');h.advance(170);assert.equal(h.game.snapshot().snake[0].x,8)});
check('Touch acts on press and during swipe, before finger release',()=>{
  const h=harness();h.game.start();let prevented=false;h.element('up').listeners.pointerdown[0]({isPrimary:true,button:0,isTrusted:false,preventDefault(){prevented=true}});assert(prevented);assert.equal(h.game.queue()[0].y,-1);
  h.game.start();const f=h.element('field'),base={isPrimary:true,button:0,pointerId:1,isTrusted:false,target:f};f.listeners.pointerdown[0]({...base,clientX:100,clientY:100});f.listeners.pointermove[0]({...base,clientX:100,clientY:70});assert.equal(h.game.queue()[0].y,-1);f.listeners.pointermove[0]({...base,clientX:140,clientY:70});assert.equal(h.game.queue().length,1);f.listeners.pointerup[0]({...base,clientX:140,clientY:70});assert.equal(h.game.queue().length,1);
});
check('Reduced motion renders once per step; pause cancels all animation',()=>{const h=harness();h.media.matches=true;h.game.start();const count=h.draws.length;h.advance(85);assert.equal(h.draws.length,count);h.advance(85);assert.equal(h.draws.at(-1).x,140);h.game.pause();assert.equal(h.timers.size,0);const after=h.draws.length;h.advance(2000);assert.equal(h.draws.length,after)});
check('6000 consecutive moves on a full-length path keep one clock and valid food',()=>{
  const h=harness();const cycle=[];for(let y=0;y<20;y++)for(let j=0;j<(y===0?20:19);j++)cycle.push({x:y===0?j:y%2?19-j:j+1,y});for(let y=19;y>0;y--)cycle.push({x:0,y});
  h.game.start();let index=cycle.findIndex(p=>p.x===6&&p.y===10);
  for(let i=0;i<6000;i++){const a=cycle[index],b=cycle[(index+1)%cycle.length];h.game.turn(b.x>a.x?'right':b.x<a.x?'left':b.y>a.y?'down':'up');h.advance(h.game.clock().stepMs);index=(index+1)%cycle.length;const board=h.game.snapshot();assert(['running','won'].includes(board.state));assert.equal(new Set(board.snake.map(p=>p.y*20+p.x)).size,board.snake.length);if(board.food)assert(!board.snake.some(p=>p.x===board.food.x&&p.y===board.food.y));assert.equal(h.timers.size,board.state==='won'?0:1);if(board.state==='won')break;}
});
fs.writeFileSync(path.join(root,'unit-results.json'),JSON.stringify({passed,checks},null,2));
console.log(`${passed} unit groups passed.`);
