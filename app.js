
'use strict';
const $=id=>document.getElementById(id);
const STORAGE_KEY='code-a-difference-time-playground-v1';
const colors=['#e65b4b','#e5b83d','#40a89a','#497eb5','#a08bda','#db82a5'];
const state={status:'idle',elapsed:0,anchor:0,interval:60000,nextCheck:60000,checkin:false,numbers:false,motion:!matchMedia('(prefers-reduced-motion: reduce)').matches};
let frame=0,lastSceneKey='',lastCollection=-1,lastSecond=-1,hasSaved=false;
$('motion').checked=state.motion;
function announce(text){$('announcement').textContent=text;}
function elapsedNow(){return state.elapsed+(state.status==='running'?Math.max(0,performance.now()-state.anchor):0);}
function formatTime(ms){const seconds=Math.floor(ms/1000),minutes=Math.floor(seconds/60);return minutes+':'+String(seconds%60).padStart(2,'0');}
function flowerMarkup(petals,seed=0,rotation=0){
 let html='<g class="petals" transform="translate(180 160) rotate('+rotation.toFixed(3)+')">';
 for(let i=0;i<6;i++){
  const amount=Math.max(0,Math.min(1,petals-i));
  // Scale around the core: each oval's inner tip stays at (0, 0).
  if(amount>0)html+='<g transform="rotate('+i*60+')"><g transform="scale('+amount.toFixed(4)+')"><ellipse cy="-64" rx="43" ry="64" fill="'+colors[(i+seed)%6]+'"/></g></g>';
 }
 return html+'</g><circle cx="180" cy="160" r="29" fill="#f6c95a"/><circle cx="180" cy="160" r="8" fill="#231a33"/>';
}
function renderScene(force=false){
 const real=elapsedNow();
 const elapsed=real;
 const sample=state.status==='idle';
 const full=Math.floor(elapsed/60000);
 const progress=elapsed%60000;
 const exactlyFull=elapsed>0&&progress<1;
 let petals=sample?6:exactlyFull?6:progress/10000;
 if(!state.motion&&!sample)petals=Math.floor(petals);
 const seed=Math.max(0,exactlyFull?full-1:full)%6;
 const rotation=state.motion&&!sample?(real/1000*3)%360:0;
 const sceneKey=[Math.round(petals*300),seed,sample,rotation.toFixed(2)].join(':');
 if(force||sceneKey!==lastSceneKey){$('bloom').innerHTML=flowerMarkup(petals,seed,rotation);lastSceneKey=sceneKey;}
 const wholePetals=Math.floor(petals);
 $('bloom').setAttribute('aria-label',sample?'Example bloom. A real bloom takes one minute.':wholePetals+' complete petals in the current bloom. '+full+' completed minute '+(full===1?'bloom.':'blooms.'));
 if(force||full!==lastCollection){
  // The most recent eight remain visible; elapsed time retains the complete picture.
  const realFull=Math.floor(real/60000),show=Math.min(realFull,8);let html='';
  for(let i=realFull-show;i<realFull;i++)html+='<svg class="mini-bloom" viewBox="0 0 360 320" aria-hidden="true">'+flowerMarkup(6,i%6)+'</svg>';
  if(realFull>8)html+='<span class="more-blooms">+ '+(realFull-8)+' earlier</span>';
  if(!realFull)html='<div class="seed-line" aria-hidden="true"><span></span><span></span><span></span></div>';
  $('blooms').innerHTML=html;$('blooms').setAttribute('aria-label',realFull+' completed minute '+(realFull===1?'bloom':'blooms'));
  $('collection-label').innerHTML=realFull?'The time you’ve spent,<br>in color.':'Your colors stay<br>when you pause.';
  lastCollection=full;
 }
 const sec=Math.floor(real/1000);
 if(force||sec!==lastSecond){$('elapsed').textContent='Time spent: '+formatTime(real);lastSecond=sec;}
}
function paint(){
 const running=state.status==='running',finished=state.status==='finished';
 $('start').textContent=running?'Pause growing':finished?'Start a new picture':state.status==='paused'?'Resume growing':'Start growing';
 $('finish').disabled=state.status==='idle'||finished;
 $('elapsed').hidden=!state.numbers;
 $('checkin').hidden=!state.checkin||!running;
 if(running){$('scene-title').textContent='One petal at a time.';$('scene-description').textContent='Spend this time however you like. Your picture will keep growing with you.';}
 else if(finished){$('scene-title').textContent='This time was yours.';$('scene-description').textContent='Your picture can stay right here. Or begin a fresh one whenever you like.';}
 else if(state.status==='paused'){$('scene-title').textContent='Your place is right here.';$('scene-description').textContent='Everything can wait. Your colors will keep growing when you’re ready.';}
 else{$('scene-title').textContent='A minute can look like this.';$('scene-description').textContent='Six petals, one colorful bloom. Start whenever you like, and watch your own picture grow.';}
 $('forget').hidden=!hasSaved;
 renderScene(true);
}
function tick(){
 cancelAnimationFrame(frame);
 if(state.status==='running'){
  if(state.interval&&elapsedNow()>=state.nextCheck&&!state.checkin){state.checkin=true;$('checkin').hidden=false;announce('A little check-in. You can keep going, take a break, or finish.');}
 }else return;
 renderScene();frame=requestAnimationFrame(tick);
}
function start(){
 if(state.status==='running'){pause();return;}
 if(state.status==='finished'){state.elapsed=0;state.checkin=false;state.nextCheck=state.interval;lastCollection=-1;}
 if(state.checkin||state.nextCheck<=state.elapsed){state.checkin=false;state.nextCheck=state.elapsed+state.interval;}
 state.anchor=performance.now();state.status='running';paint();tick();announce('Your picture is growing.');
}
function pause(message='Paused. Your picture is waiting for you.'){
 if(state.status==='running'){state.elapsed=elapsedNow();state.status='paused';}
 cancelAnimationFrame(frame);paint();announce(message);
}
function finish(){if(state.status==='idle')return;if(state.status==='running')state.elapsed=elapsedNow();state.status='finished';state.checkin=false;cancelAnimationFrame(frame);paint();$('start').focus();announce('Finished. Your picture stays here.');}
function save(){
 pause('Paused.');
 if(state.status==='idle')state.status='paused';
 const data={version:1,elapsed:Math.round(state.elapsed),activity:$('activity').value,note:$('note').value,interval:state.interval,numbers:state.numbers,motion:state.motion};
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));hasSaved=true;$('save-status').textContent='Place saved in this browser. You can come back later.';}
 catch{$('save-status').textContent='This browser couldn’t save your place. Keep this page open, or copy your note.';}
 paint();
}
function restore(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;
  const data=JSON.parse(raw);if(data.version!==1||!Number.isFinite(data.elapsed)||data.elapsed<0||data.elapsed>86400000)return;
  state.elapsed=data.elapsed;state.status='paused';state.interval=[0,60000,180000,300000].includes(data.interval)?data.interval:60000;state.nextCheck=state.elapsed+state.interval;
  state.numbers=data.numbers===true;state.motion=data.motion!==false&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('activity').value=typeof data.activity==='string'?data.activity.slice(0,80):'';$('note').value=typeof data.note==='string'?data.note.slice(0,300):'';
  $('numbers').checked=state.numbers;$('motion').checked=state.motion;$('interval').value=String(state.interval);hasSaved=true;$('save-status').textContent='Your saved place is back. Resume whenever you like.';
 }catch{$('save-status').textContent='A saved place couldn’t be opened. You can still start a new picture.';}
}
$('start').addEventListener('click',start);$('finish').addEventListener('click',finish);$('checkin-finish').addEventListener('click',finish);
$('continue').addEventListener('click',()=>{state.checkin=false;state.nextCheck=elapsedNow()+state.interval;paint();$('start').focus();announce('Keep going at your own pace.');});
$('break').addEventListener('click',()=>{pause();$('note').focus();});
$('interval').addEventListener('change',event=>{state.interval=Number(event.target.value);state.nextCheck=elapsedNow()+state.interval;state.checkin=false;paint();});
$('numbers').addEventListener('change',event=>{state.numbers=event.target.checked;paint();});
$('motion').addEventListener('change',event=>{state.motion=event.target.checked;paint();});
$('save').addEventListener('click',save);
$('forget').addEventListener('click',()=>{try{localStorage.removeItem(STORAGE_KEY);hasSaved=false;$('save-status').textContent='Saved place removed. Your current picture and note are still here.';}catch{$('save-status').textContent='This browser couldn’t remove the saved place.';}paint();});
for(const id of ['activity','note'])$(id).addEventListener('input',()=>{$('save-status').textContent='Note changed. Choose Save my place to keep it.';});
restore();paint();

// Modes stay separate: only the chooser can enter a new mode.
let mode='home';
const minute=60000;
const experiment={round:'watch',status:'ready',elapsed:0,anchor:0,answers:{watch:null,play:null},motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,generation:0};
const rounds={watch:{status:'ready',elapsed:0},play:{status:'ready',elapsed:0}};
const snake=new SnakeGame();
let roundFrame=0,roundDeadline=0,lastWatchShape='',lastSnakeStep=0;
function focusHeading(id){$(id).focus();window.scrollTo(0,0);}
function showMode(next){
 mode=next;$('home-view').hidden=next!=='home';$('focus-view').hidden=next!=='focus';$('explore-view').hidden=next!=='explore';
 $('intro-copy').innerHTML=next==='focus'?'A quiet picture of time, while you do your own thing.':next==='explore'?'Two ways to spend a minute.<br>Notice how each one feels to you.':'Let a little time turn into color.<br>Choose how you’d like to spend it.';
 $('skip').href=next==='focus'?'#start':next==='explore'?'#round-title':'#choose-focus';$('saved-home').hidden=!hasSaved;
}
function enterFocus(){showMode('focus');paint();focusHeading('page-title');announce('Focus mode. Your picture is ready.');}
function leaveFocus(){pause('');showMode('home');$('choose-focus').focus();window.scrollTo(0,0);announce('Focus paused. Choose what you’d like to do next.');}
function clearRoundWork(){clearTimeout(roundDeadline);cancelAnimationFrame(roundFrame);}
function navigateStep(step){
 if(mode!=='explore'||!['watch','play','compare'].includes(step))return;
 if(experiment.status!=='compared'){
  rounds[experiment.round]={status:experiment.status==='running'?'paused':experiment.status,elapsed:roundElapsed()};
 }
 clearRoundWork();
 if(step==='compare')experiment.status='compared';
 else Object.assign(experiment,{round:step,status:rounds[step].status,elapsed:rounds[step].elapsed,anchor:0});
 renderExplore();focusHeading(step==='compare'?'comparison-title':experiment.status==='reflect'?'reflection-title':'round-title');
 announce(step==='compare'?'Compare your experiences.':step==='play'?'Snake activity. Start or resume whenever you like.':'Watching activity. Start or resume whenever you like.');
}
function resetExplore(){
 clearRoundWork();Object.assign(experiment,{round:'watch',status:'ready',elapsed:0,anchor:0,answers:{watch:null,play:null}});
 rounds.watch={status:'ready',elapsed:0};rounds.play={status:'ready',elapsed:0};
 snake.score=0;snake.reset();lastSnakeStep=0;lastWatchShape='';renderExplore();
}
function enterExplore(){showMode('explore');resetExplore();focusHeading('round-title');announce('Explore time. First, watch a minute.');}
function leaveExplore(){clearRoundWork();experiment.status='ready';showMode('home');$('choose-explore').focus();window.scrollTo(0,0);announce('Activity closed.');}
function roundElapsed(){return Math.min(minute,experiment.elapsed+(experiment.status==='running'?Math.max(0,performance.now()-experiment.anchor):0));}
function renderWatch(){
 const time=roundElapsed();let petals=time/10000;if(!experiment.motion)petals=Math.floor(petals);
 const rotation=experiment.motion?(time/1000*3)%360:0;
 const key=[Math.round(petals*300),rotation.toFixed(2)].join(':');if(key!==lastWatchShape){$('watch-bloom').innerHTML=flowerMarkup(petals,0,rotation);lastWatchShape=key;}
 $('watch-bloom').setAttribute('aria-label',Math.floor(petals)+' of six petals have grown.');
}
function renderSnake(){
 let markup='<rect width="320" height="320" rx="12" fill="#f5effc"/>';
 for(let y=0;y<16;y++)for(let x=0;x<16;x++)markup+='<circle cx="'+(x*20+10)+'" cy="'+(y*20+10)+'" r="1" fill="#d9c9e6"/>';
 if(snake.food)markup+='<circle cx="'+(snake.food.x*20+10)+'" cy="'+(snake.food.y*20+10)+'" r="7" fill="#f5b800" stroke="#805d00" stroke-width="1.5"/>';
 snake.body.forEach((part,i)=>{markup+='<rect x="'+(part.x*20+1)+'" y="'+(part.y*20+1)+'" width="18" height="18" rx="'+(i?5:7)+'" fill="'+(i?'#9b51d0':'#3f2858')+'"/>';});
 const head=snake.body[0],offsets=[[[5,-4],[5,4]],[[-4,5],[4,5]],[[-5,-4],[-5,4]],[[-4,-5],[4,-5]]][snake.direction];
 offsets.forEach(([x,y])=>markup+='<circle cx="'+(head.x*20+10+x)+'" cy="'+(head.y*20+10+y)+'" r="2" fill="white"/>');
 $('snake-board').innerHTML=markup;$('snake-score').textContent=snake.score;
 $('snake-board').setAttribute('aria-label','Snake board. Head at column '+(head.x+1)+', row '+(head.y+1)+'. '+snake.score+' dots collected.');
 const running=experiment.status==='running';document.querySelectorAll('[data-direction]').forEach(button=>button.disabled=!running);$('snake-turn').disabled=!running;
}
function renderExplore(){
 const reflecting=experiment.status==='reflect',compared=experiment.status==='compared',play=experiment.round==='play';
 $('round-view').hidden=reflecting||compared;$('reflection-view').hidden=!reflecting;$('comparison-view').hidden=!compared;
 for(const step of ['watch','play','compare']){if(step===(compared?'compare':experiment.round))$('step-'+step).setAttribute('aria-current','step');else $('step-'+step).removeAttribute('aria-current');}
 $('watch-stage').hidden=play;$('snake-stage').hidden=!play;$('explore-motion-label').hidden=play;
 $('round-title').textContent=play?'Play a minute of Snake.':'Watch a minute.';
 $('round-description').textContent=play?'Steer your snake and collect dots. Play at your own pace; the round ends gently after one minute.':'Watch the petals grow for one minute. Afterward, choose how that minute felt to you.';
 $('round-control').textContent=experiment.status==='running'?'Pause the minute':experiment.status==='paused'?'Resume the minute':play?'Start playing':'Start watching';
 $('round-status').textContent=experiment.status==='paused'?'Paused. Your place is kept.':experiment.status==='running'?'Your minute is underway.':play?'Your snake starts when you choose Start playing.':'One minute. No countdown.';
 $('watch-status').textContent=experiment.status==='running'?'A minute, growing in color.':experiment.status==='paused'?'Your petals are waiting.':'Ready when you are.';
 $('snake-status').textContent=experiment.status==='running'?'Collect a dot whenever you can.':experiment.status==='paused'?'Snake paused. Resume whenever you like.':'Start the minute when you’re ready.';
 $('reflection-context').textContent=play?'You spent a minute playing Snake.':'You spent a minute watching petals.';
 document.querySelectorAll('.feeling').forEach(button=>button.setAttribute('aria-pressed',String(experiment.answers[experiment.round]===button.dataset.feeling)));
 $('reflection-next').disabled=!experiment.answers[experiment.round];$('reflection-next').textContent=play?'Compare my two minutes':'Next: play Snake';
 $('watch-answer').textContent=experiment.answers.watch||'No reflection yet';$('play-answer').textContent=experiment.answers.play||'No reflection yet';
 $('comparison-summary').textContent=experiment.answers.watch&&experiment.answers.play?'You completed both one-minute activities. Here’s how each felt to you.':'Your reflections will appear here after each activity. You can jump to Watch or Play at any time.';
 renderWatch();renderSnake();
}
function roundTick(){
 if(mode!=='explore'||experiment.status!=='running')return;
 const elapsed=roundElapsed();if(elapsed>=minute){completeRound();return;}
 if(experiment.round==='watch')renderWatch();
 else if(elapsed-lastSnakeStep>=180){lastSnakeStep=elapsed;const result=snake.step();renderSnake();if(result==='collision')$('snake-status').textContent='A fresh snake! Your points are kept. Keep going.';else if(result==='food'||result==='filled')$('snake-status').textContent=snake.score+' dots collected. Nice exploring!';}
 roundFrame=requestAnimationFrame(roundTick);
}
function controlRound(){
 if(mode!=='explore'||!['ready','running','paused'].includes(experiment.status))return;
 if(experiment.status==='running'){pauseRound();return;}
 experiment.anchor=performance.now();experiment.status='running';lastSnakeStep=experiment.elapsed;renderExplore();
 roundDeadline=setTimeout(completeRound,minute-experiment.elapsed);roundTick();
 if(experiment.round==='play')$('snake-turn').focus();announce(experiment.round==='play'?'Your Snake minute has started. Arrow keys steer; Space turns clockwise.':'Your watching minute has started.');
}
function pauseRound(message='Paused. Resume whenever you like.'){
 if(mode!=='explore'||experiment.status!=='running')return;
 if(roundElapsed()>=minute){completeRound();return;}
 experiment.elapsed=roundElapsed();clearRoundWork();experiment.status='paused';renderExplore();$('round-control').focus();announce(message);
}
function completeRound(){
 if(mode!=='explore'||experiment.status!=='running')return;
 experiment.elapsed=minute;clearRoundWork();experiment.status='reflect';renderExplore();focusHeading('reflection-title');announce('That minute is complete. How did it feel?');
}
function steer(direction){if(mode==='explore'&&experiment.round==='play'&&experiment.status==='running')snake.turn(direction);}
$('choose-focus').addEventListener('click',enterFocus);$('leave-focus').addEventListener('click',leaveFocus);
$('choose-explore').addEventListener('click',enterExplore);$('leave-explore').addEventListener('click',leaveExplore);$('round-control').addEventListener('click',controlRound);
$('explore-motion').checked=experiment.motion;$('explore-motion').addEventListener('change',event=>{experiment.motion=event.target.checked;lastWatchShape='';renderWatch();});
for(const button of document.querySelectorAll('.feeling'))button.addEventListener('click',()=>{if(mode!=='explore'||experiment.status!=='reflect')return;experiment.answers[experiment.round]=button.dataset.feeling;renderExplore();});
$('reflection-next').addEventListener('click',()=>{
 if(!experiment.answers[experiment.round])return;
 navigateStep(experiment.round==='watch'?'play':'compare');
});
$('step-watch').addEventListener('click',()=>navigateStep('watch'));
$('step-play').addEventListener('click',()=>navigateStep('play'));
$('step-compare').addEventListener('click',()=>navigateStep('compare'));
$('try-again').addEventListener('click',()=>{resetExplore();focusHeading('round-title');});
document.querySelectorAll('[data-direction]').forEach(button=>button.addEventListener('click',()=>steer(Number(button.dataset.direction))));
$('snake-turn').addEventListener('click',()=>{if(experiment.status==='running')snake.clockwise();});
document.addEventListener('keydown',event=>{
 if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)||event.target.isContentEditable)return;
 if(event.key==='Escape'){if(mode==='focus'){event.preventDefault();pause();}else if(mode==='explore'){event.preventDefault();pauseRound();}return;}
 if(mode!=='explore'||experiment.round!=='play'||experiment.status!=='running')return;
 const direction={ArrowRight:0,d:0,D:0,ArrowDown:1,s:1,S:1,ArrowLeft:2,a:2,A:2,ArrowUp:3,w:3,W:3}[event.key];
 if(direction!==undefined){event.preventDefault();steer(direction);}
 else if(event.code==='Space'&&(event.target===document.body||event.target===document.documentElement||event.target.closest('.snake-stage'))){event.preventDefault();snake.clockwise();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(mode==='focus'&&state.status==='running')pause('Paused while you were away. Resume whenever you like.');else if(mode==='explore')pauseRound('Paused while you were away. Resume whenever you like.');}});
window.addEventListener('pagehide',()=>{if(mode==='focus')pause('');else if(mode==='explore')pauseRound();clearRoundWork();});
$('home-bloom').innerHTML=flowerMarkup(6);document.querySelectorAll('.result-bloom').forEach((svg,i)=>{svg.innerHTML=i?'<path d="M50 80h180v70H100v90h160" fill="none" stroke="#9b51d0" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/><circle cx="280" cy="80" r="18" fill="#f5b800"/>':flowerMarkup(6);});
showMode('home');renderExplore();
