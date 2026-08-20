const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const BUILD_VERSION='0.3.1';
const canvas=$('#stageCanvas'),ctx=canvas.getContext('2d'),signalCanvas=$('#signalCanvas'),sg=signalCanvas.getContext('2d');
const TOTAL_BARS=32,BAR_SECONDS=2,DURATION=64;
const sections=[
  {name:'INTRO',start:1,bars:4,color:'#343943'},
  {name:'VERSE',start:5,bars:6,color:'#2c3139'},
  {name:'BUILD',start:11,bars:4,color:'#493b27'},
  {name:'BREAKDOWN',start:15,bars:6,color:'#4b2922'},
  {name:'INTERLUDE',start:21,bars:4,color:'#28333e'},
  {name:'BOSS',start:25,bars:6,color:'#4c2021'},
  {name:'OUTRO',start:31,bars:2,color:'#292d34'}
];
const lightCues=[
  {name:'Intro_Warm_Static',start:1,bars:4},{name:'Verse_AltFloor',start:5,bars:3},{name:'Verse_AccentHit',start:8,bars:1},
  {name:'Build_Chase',start:11,bars:4},{name:'Breakdown_Strobe',start:15,bars:6},{name:'Interlude_Breath',start:21,bars:4},
  {name:'Boss_BlinderHit',start:25,bars:1},{name:'Boss_RedPulse',start:26,bars:5},{name:'Outro_Kill',start:31,bars:2}
];
let nextId=20;
let clips=[
  {id:1,track:'base',name:'Club Master Wide',start:1,bars:10,kind:'BASE FRAMING',icon:'▣',amp:18,freq:4,blend:40,binding:'无绑定'},
  {id:2,track:'base',name:'Hall Pullback',start:11,bars:14,kind:'BASE FRAMING',icon:'▣',amp:35,freq:4,blend:55,binding:'P2 · Build_Chase'},
  {id:3,track:'base',name:'Arena Master',start:25,bars:8,kind:'BASE FRAMING',icon:'▣',amp:58,freq:4,blend:70,binding:'P2 · Boss_BlinderHit'},
  {id:4,track:'behavior',name:'Gentle Drift',start:1,bars:10,kind:'CAMERA BEHAVIOR',icon:'≋',amp:12,freq:3,blend:50,binding:'Music · Energy'},
  {id:5,track:'behavior',name:'Build Push In',start:11,bars:4,kind:'CAMERA BEHAVIOR',icon:'⇥',amp:28,freq:5,blend:75,binding:'P2 · Build_Chase'},
  {id:6,track:'behavior',name:'Breakdown Pressure Shake',start:15,bars:6,kind:'CAMERA BEHAVIOR',icon:'≋',amp:42,freq:18,blend:25,binding:'P2 · Breakdown_Strobe'},
  {id:7,track:'behavior',name:'Boss Pressure',start:25,bars:6,kind:'CAMERA BEHAVIOR',icon:'≋',amp:62,freq:14,blend:18,binding:'Music · Bass Band'},
  {id:8,track:'impact',name:'Breakdown Drop Impact',start:15,bars:1,kind:'CAMERA IMPACT',icon:'✦',amp:70,freq:12,blend:8,binding:'P2 · Breakdown_Strobe'},
  {id:9,track:'impact',name:'Boss Entrance Hit',start:25,bars:1,kind:'CAMERA IMPACT',icon:'✦',amp:88,freq:10,blend:5,binding:'P2 · Boss_BlinderHit'},
  {id:10,track:'wall',name:'Stage Wide',start:1,bars:7,kind:'SCREEN PROGRAM',icon:'▤',amp:20,freq:1,blend:20,binding:'无绑定'},
  {id:11,track:'wall',name:'Vocal Close-up',start:8,bars:3,kind:'SCREEN PROGRAM',icon:'▤',amp:20,freq:1,blend:20,binding:'P2 · Verse_AccentHit'},
  {id:12,track:'wall',name:'Guitar Performance',start:11,bars:4,kind:'SCREEN PROGRAM',icon:'▤',amp:20,freq:1,blend:20,binding:'P2 · Build_Chase'},
  {id:13,track:'wall',name:'Drum POV',start:15,bars:6,kind:'SCREEN PROGRAM',icon:'▤',amp:20,freq:1,blend:20,binding:'P2 · Breakdown_Strobe'},
  {id:14,track:'wall',name:'Live Visual',start:21,bars:4,kind:'SCREEN PROGRAM',icon:'▤',amp:20,freq:1,blend:20,binding:'Music · Energy'},
  {id:15,track:'wall',name:'Boss Cam',start:25,bars:6,kind:'SCREEN PROGRAM',icon:'▤',amp:20,freq:1,blend:20,binding:'P2 · Boss_BlinderHit'},
  {id:16,track:'wall',name:'Stage Wide',start:31,bars:2,kind:'SCREEN PROGRAM',icon:'▤',amp:20,freq:1,blend:20,binding:'无绑定'},
  {id:17,track:'aux',name:'L:Guitar · R:Drum',start:1,bars:14,kind:'AUX SCREEN ROUTING',icon:'▤',amp:10,freq:1,blend:20,binding:'无绑定'},
  {id:18,track:'aux',name:'L:Vocal · R:Drum POV',start:15,bars:10,kind:'AUX SCREEN ROUTING',icon:'▤',amp:10,freq:1,blend:20,binding:'P2 · Breakdown_Strobe'},
  {id:19,track:'aux',name:'L:Boss · R:Visual',start:25,bars:8,kind:'AUX SCREEN ROUTING',icon:'▤',amp:10,freq:1,blend:20,binding:'P2 · Boss_BlinderHit'}
];
const state={time:1.2,playing:false,last:performance.now(),selected:6,view:'full',dirty:false,drag:null};
const pct=v=>(v/TOTAL_BARS*100);
const barAtTime=()=>Math.min(TOTAL_BARS,Math.floor(state.time/BAR_SECONDS)+1);
const active=(track)=>clips.filter(c=>c.track===track&&barAtTime()>=c.start&&barAtTime()<c.start+c.bars).at(-1);
const sectionAt=()=>sections.find(s=>barAtTime()>=s.start&&barAtTime()<s.start+s.bars)||sections.at(-1);
function setDirty(v=true){state.dirty=v;$('#saveState').textContent=v?'● 有未保存修改':'● 已保存 · P3_TheCorrection_Arrangement';$('#saveState').style.color=v?'#ffbd58':'#75dda0'}

function buildTimeline(){
  $('#rulerLane').innerHTML='';for(let b=1;b<=TOTAL_BARS;b++){const e=document.createElement('span');e.className='bar-mark';e.style.left=`${pct(b-1)}%`;e.textContent=b%2?String(b).padStart(2,'0'):'';$('#rulerLane').append(e)}
  $('#sectionLane').innerHTML='';sections.forEach(s=>{const e=document.createElement('div');e.className='section-block';e.style.left=`${pct(s.start-1)}%`;e.style.width=`${pct(s.bars)}%`;e.style.background=s.color;e.innerHTML=`<b>${s.name}</b><small>BAR ${String(s.start).padStart(2,'0')}–${String(s.start+s.bars-1).padStart(2,'0')}</small>`;e.onclick=()=>seekBar(s.start);$('#sectionLane').append(e)});
  $('#lightLane').innerHTML='';lightCues.forEach(c=>{const e=document.createElement('div');e.className='cue';e.style.left=`${pct(c.start-1)}%`;e.style.width=`${Math.max(pct(c.bars),3)}%`;e.textContent=c.name;e.onclick=()=>seekBar(c.start);$('#lightLane').append(e)});
  $$('.p3-lane').forEach(l=>l.innerHTML='');clips.forEach(c=>{const lane=$(`[data-track="${c.track}"]`);if(!lane)return;const e=document.createElement('div');e.className=`clip ${c.track}${c.id===state.selected?' selected':''}${c.generated?' generated':''}`;e.dataset.id=c.id;e.style.left=`${pct(c.start-1)}%`;e.style.width=`${Math.max(pct(c.bars),2.5)}%`;e.innerHTML=`<b>${c.name}</b>${c.track==='impact'?'':`<small>BAR ${c.start} · ${c.bars} BARS</small>`}<i class="handle"></i>`;e.addEventListener('pointerdown',startDrag);e.addEventListener('click',ev=>{ev.stopPropagation();selectClip(c.id)});lane.append(e)});
}
function selectedClip(){return clips.find(c=>c.id===state.selected)}
function selectClip(id){state.selected=id;buildTimeline();syncInspector()}
function syncInspector(){const c=selectedClip();if(!c)return;$('#selectedIcon').textContent=c.icon;$('#selectedType').textContent=c.kind;$('#clipName').value=c.name;$('#startBar').value=c.start;$('#durationBars').value=c.bars;$('#ampRange').value=c.amp;$('#freqRange').value=c.freq;$('#blendRange').value=c.blend;$('#ampOut').textContent=(c.amp/100).toFixed(2);$('#freqOut').textContent=`${c.freq} Hz`;$('#blendOut').textContent=`${(c.blend/100).toFixed(2)} s`;const opt=[...$('#binding').options].find(o=>o.textContent===c.binding);if(opt)$('#binding').value=c.binding}
function seekBar(bar){state.time=(Math.max(1,Math.min(TOTAL_BARS,bar))-1)*BAR_SECONDS+.02;updateReadout()}
function startDrag(ev){const el=ev.currentTarget,c=clips.find(x=>x.id===+el.dataset.id);state.drag={c,el,startX:ev.clientX,startBar:c.start,startBars:c.bars,resize:ev.target.classList.contains('handle')};el.setPointerCapture(ev.pointerId);el.onpointermove=dragMove;el.onpointerup=endDrag}
function dragMove(ev){if(!state.drag)return;const lane=state.drag.el.parentElement,deltaBars=(ev.clientX-state.drag.startX)/lane.clientWidth*TOTAL_BARS;const d=$('#snapToggle').checked?Math.round(deltaBars):deltaBars;if(state.drag.resize)state.drag.c.bars=Math.max(1,Math.min(TOTAL_BARS-state.drag.c.start+1,Math.round(state.drag.startBars+d)));else state.drag.c.start=Math.max(1,Math.min(TOTAL_BARS-state.drag.c.bars+1,Math.round(state.drag.startBar+d)));state.drag.el.style.left=`${pct(state.drag.c.start-1)}%`;state.drag.el.style.width=`${pct(state.drag.c.bars)}%`;syncInspector();setDirty()}
function endDrag(){state.drag=null;buildTimeline()}
function mutateSelected(){const c=selectedClip();if(!c)return;c.name=$('#clipName').value;c.start=Math.max(1,+$('#startBar').value||1);c.bars=Math.max(1,+$('#durationBars').value||1);c.amp=+$('#ampRange').value;c.freq=+$('#freqRange').value;c.blend=+$('#blendRange').value;c.binding=$('#binding').value;syncInspector();buildTimeline();setDirty()}
function addClip(type){const map={framing:['base','New Framing','BASE FRAMING','▣'],shake:['behavior','New Pressure Shake','CAMERA BEHAVIOR','≋'],impact:['impact','New Beat Impact','CAMERA IMPACT','✦'],screen:['wall','New Screen Program','SCREEN PROGRAM','▤'],focus:['behavior','New Focus Guide','CAMERA BEHAVIOR','◎'],transition:['base','New Stage Transition','BASE FRAMING','⇥']};const [track,name,kind,icon]=map[type];const c={id:nextId++,track,name,start:barAtTime(),bars:track==='impact'?1:4,kind,icon,amp:35,freq:12,blend:25,binding:'无绑定'};clips.push(c);selectClip(c.id);setDirty();toast('已添加 P3 事件',`${name} · BAR ${c.start}`)}

function resize(c){const d=Math.min(devicePixelRatio||1,2),r=c.getBoundingClientRect(),w=Math.round(r.width*d),h=Math.round(r.height*d);if(c.width!==w||c.height!==h){c.width=w;c.height=h}}
function light(g,x,y,tx,ty,color,a){const gr=g.createLinearGradient(x,y,tx,ty);gr.addColorStop(0,color+'c0');gr.addColorStop(.55,color+'27');gr.addColorStop(1,color+'00');g.save();g.globalAlpha=a;g.fillStyle=gr;g.beginPath();g.moveTo(x-5,y);g.lineTo(tx-52,ty);g.lineTo(tx+52,ty);g.lineTo(x+5,y);g.fill();g.restore()}
function robot(g,x,y,s,role,color){g.save();g.translate(x,y);g.scale(s,s);g.fillStyle='#111317';g.strokeStyle='#4c5056';g.lineWidth=3;g.fillRect(-12,-52,24,17);g.strokeRect(-12,-52,24,17);g.fillRect(-17,-32,34,40);g.strokeRect(-17,-32,34,40);g.strokeStyle='#585d63';g.lineWidth=5;g.beginPath();g.moveTo(-14,-25);g.lineTo(-26,10);g.moveTo(14,-25);g.lineTo(26,10);g.moveTo(-7,8);g.lineTo(-10,39);g.moveTo(7,8);g.lineTo(10,39);g.stroke();g.fillStyle=color;g.shadowBlur=14;g.shadowColor=color;g.fillRect(-7,-45,5,3);g.fillRect(2,-45,5,3);g.fillRect(-5,-22,10,13);if(role==='guitar'){g.strokeStyle='#b78b43';g.lineWidth=4;g.beginPath();g.moveTo(-27,-13);g.lineTo(30,12);g.stroke()}if(role==='drum'){g.strokeStyle='#b78b43';g.lineWidth=3;g.beginPath();g.arc(0,8,21,0,7);g.stroke()}g.restore()}
function screen(g,x,y,w,h,name,t){g.save();g.fillStyle='#050607';g.strokeStyle='#755b31';g.lineWidth=2;g.fillRect(x,y,w,h);g.strokeRect(x,y,w,h);g.beginPath();g.rect(x+3,y+3,w-6,h-6);g.clip();const col=name?.includes('Boss')?'#ff4e3c':name?.includes('POV')?'#70b7f1':'#ffb331';g.fillStyle='#17130e';g.fillRect(x,y,w,h);if(name?.includes('POV')){g.strokeStyle='#d6c28a';for(let i=-2;i<4;i++){g.beginPath();g.moveTo(x+w*.5+i*w*.08,y+h);g.lineTo(x+w*.4+i*w*.02,y);g.stroke()}g.fillStyle='#9a743b';g.beginPath();g.ellipse(x+w*.2,y+h*.75,w*.18,h*.2,0,0,7);g.ellipse(x+w*.8,y+h*.75,w*.18,h*.2,0,0,7);g.fill()}else if(name?.includes('Boss')){g.fillStyle='#150807';g.fillRect(x,y,w,h);g.strokeStyle=col;for(let i=0;i<3;i++){g.beginPath();g.arc(x+w/2,y+h/2,15+i*15+Math.sin(t*3)*4,0,7);g.stroke()}}else if(name?.includes('Visual')){g.translate(x+w/2,y+h/2);for(let i=0;i<6;i++){g.strokeStyle=`hsla(${35+i*18},90%,60%,.7)`;g.beginPath();g.arc(0,0,10+i*10,t+i,t+i+3.5);g.stroke()}}else{robot(g,x+w/2,y+h*.82,Math.min(w,h)/115,name?.includes('Guitar')?'guitar':'vocal',col)}g.restore()}
function drawStage(t){resize(canvas);const w=canvas.width,h=canvas.height,sec=sectionAt(),e={INTRO:.25,VERSE:.45,BUILD:.7,BREAKDOWN:1,INTERLUDE:.42,BOSS:.95,OUTRO:.3}[sec.name];ctx.clearRect(0,0,w,h);const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#17120b');bg.addColorStop(.62,'#080808');bg.addColorStop(1,'#020203');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);for(let i=0;i<7;i++){const x=w*(.08+i*.14);light(ctx,x,0,w*(.35+i*.05),h*.78,i%3===0?'#ff6a33':'#ffc85f',.35+e*.7)}const wall=state.view==='full'?active('wall')?.name:'P2 LIGHT VISUAL';const aux=state.view==='full'?active('aux')?.name:'';screen(ctx,w*.33,h*.12,w*.34,h*.25,wall,t);screen(ctx,w*.07,h*.29,w*.17,h*.22,aux?.includes('Vocal')?'Vocal':'Guitar',t);screen(ctx,w*.76,h*.29,w*.17,h*.22,aux?.includes('POV')?'Drum POV':aux?.includes('Visual')?'Live Visual':'Drum',t);ctx.fillStyle='#17130f';ctx.strokeStyle='#584426';ctx.beginPath();ctx.moveTo(w*.17,h*.78);ctx.lineTo(w*.83,h*.78);ctx.lineTo(w*.72,h*.51);ctx.lineTo(w*.28,h*.51);ctx.closePath();ctx.fill();ctx.stroke();const base=active('base'),scale=state.view==='full'&&base?.name.includes('Arena')?.78:state.view==='full'&&base?.name.includes('Hall')?.9:1;const s=Math.min(w,h)/590*scale;robot(ctx,w*.34,h*.77,s,'guitar','#ffc64e');robot(ctx,w*.45,h*.77,s,'vocal','#ff8d2e');robot(ctx,w*.57,h*.77,s,'guitar','#ff9638');robot(ctx,w*.68,h*.77,s,'drum','#ffd78e');ctx.fillStyle='#050506';ctx.fillRect(0,h*.78,w,h*.22);for(let i=0;i<20;i++){ctx.fillStyle=`rgba(255,145,40,${.05+e*.08})`;ctx.beginPath();ctx.arc(w*(i/19),h*(.88+Math.sin(i*3+t)*.04),4+e*4,0,7);ctx.fill()}}
function drawSignal(t){resize(signalCanvas);const w=signalCanvas.width,h=signalCanvas.height;sg.clearRect(0,0,w,h);sg.strokeStyle='#f4ad38';sg.lineWidth=1.5;sg.beginPath();for(let x=0;x<w;x++){const y=h*.5+Math.sin(x*.12+t*7)*h*.18+Math.sin(x*.39+t*13)*h*.08;if(x===0)sg.moveTo(x,y);else sg.lineTo(x,y)}sg.stroke()}
function previewTransform(){if(state.view!=='full')return 'translate3d(0,0,0) scale(1.002)';const c=active('behavior');if(!c)return 'translate3d(0,0,0) scale(1.002)';const amp=c.amp/100*(c.name.includes('Pressure')?2.1:.25);return `translate3d(${Math.sin(state.time*c.freq*5)*amp}px,${Math.cos(state.time*c.freq*4.3)*amp*.6}px,0) scale(1.003)`}
function updateReadout(){
  const bar=barAtTime(),beat=Math.floor((state.time%2)/.5)+1,sec=sectionAt(),base=active('base'),behavior=active('behavior'),wall=active('wall'),aux=active('aux')?.name;
  $('#timecode').textContent=`00:${String(Math.floor(state.time)).padStart(2,'0')}.${Math.floor(state.time%1*10)}`;
  $('#barBeat').textContent=`BAR ${String(bar).padStart(2,'0')} · BEAT ${beat}`;
  $('#sectionInfo').textContent=`${sec.name} / BAR ${String(bar).padStart(2,'0')}`;
  const timelineWidth=$('.timeline-scroll').clientWidth;
  $('#playhead').style.left=`${130+(timelineWidth-130)*(state.time/DURATION)}px`;
  $('#activeBase').textContent=state.view==='full'?(base?.name||'Default Wide'):'P3 OFF';
  $('#activeBehavior').textContent=state.view==='full'?(behavior?.name||'No Behavior'):'P3 OFF';
  $('#activeScreen').textContent=state.view==='full'?(wall?.name||'Stage Wide'):'P2 Visual Only';
  $('#cameraInfo').textContent=base?.name.includes('Arena')?'MASTER WIDE · DIST 27.0 · TILT −15°':base?.name.includes('Hall')?'MASTER WIDE · DIST 22.0 · TILT −13°':'MASTER WIDE · DIST 18.0 · TILT −12°';
  $('#tagWall').textContent=`LED WALL · ${state.view==='full'?(wall?.name||'STAGE').toUpperCase():'P2 VISUAL'}`;
  $('#tagLeft').textContent=`AUX L · ${aux?.includes('Vocal')?'VOCAL':aux?.includes('Boss')?'BOSS':'GUITAR'}`;
  $('#tagRight').textContent=`AUX R · ${aux?.includes('POV')?'DRUM POV':aux?.includes('Visual')?'VISUAL':'DRUM'}`;
  $('#signalValue').textContent=`${Math.round(30+energy()*70)}%`;
}
function energy(){const s=sectionAt().name;return({INTRO:.2,VERSE:.43,BUILD:.75,BREAKDOWN:.96,INTERLUDE:.38,BOSS:.9,OUTRO:.25})[s]}
function frame(now){const dt=Math.min(.05,(now-state.last)/1000);state.last=now;if(state.playing){state.time+=dt;if(state.time>=DURATION)state.time=0}drawStage(state.time);drawSignal(state.time);canvas.style.transform=previewTransform();updateReadout();requestAnimationFrame(frame)}
function toast(title,text){$('#toast b').textContent=title;$('#toast span').textContent=text;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),2300)}

$$('[data-add]').forEach(b=>b.onclick=()=>addClip(b.dataset.add));$$('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;$$('[data-view]').forEach(x=>x.classList.toggle('active',x===b))});
$('#playBtn').onclick=()=>{state.playing=!state.playing;state.last=performance.now();$('#playBtn').classList.toggle('paused',!state.playing);$('#runtimeState').textContent=`${state.playing?'RUNNING':'PAUSED'} · v${BUILD_VERSION}`};$('#stopBtn').onclick=()=>{state.playing=false;state.time=0;$('#playBtn').classList.add('paused');$('#runtimeState').textContent=`STOPPED · v${BUILD_VERSION}`};$('#prevBar').onclick=()=>seekBar(barAtTime()-1);$('#nextBar').onclick=()=>seekBar(barAtTime()+1);
$('#collapseP2').onclick=()=>{$('#timelineWrap').classList.toggle('p2-hidden');$('#collapseP2').textContent=$('#timelineWrap').classList.contains('p2-hidden')?'显示 P2 参考轨':'隐藏 P2 参考轨'};
$('#generateBtn').onclick=()=>{clips.forEach(c=>{if([5,6,8,9,13,15].includes(c.id))c.generated=true});buildTimeline();setDirty();toast('已生成 P3 建议','根据 Build、Breakdown 与 Boss 灯光 Cue 生成了 6 个事件')};
['clipName','startBar','durationBars','binding','ampRange','freqRange','blendRange'].forEach(id=>$('#'+id).addEventListener(id.includes('Range')?'input':'change',mutateSelected));
$('#deleteBtn').onclick=()=>{if(clips.length<=1)return;clips=clips.filter(c=>c.id!==state.selected);state.selected=clips[0].id;buildTimeline();syncInspector();setDirty();toast('事件已删除','时间轴配置已更新')};
$('#saveBtn').onclick=()=>{setDirty(false);toast('配置资产已保存','P3_TheCorrection_Arrangement.asset')};
$('#levelBtn').onclick=()=>{state.time=0;state.playing=true;$('#playBtn').classList.remove('paused');toast('进入关卡模拟播放','P2 与 P3 将由 MusicTransport 自动驱动')};
const guide=$('#guideDialog');$('#guideBtn').onclick=()=>guide.showModal();$('#closeGuide').onclick=()=>guide.close();$('#closeAndPlay').onclick=()=>{guide.close();$('#levelBtn').click()};
const json=$('#jsonDialog');$('#jsonBtn').onclick=()=>{$('#jsonPreview').textContent=JSON.stringify({song:'TheCorrection_MusicData',lighting:'P2_TheCorrection_Lighting',stage:'Stage_Club_To_Arena',runtimeDriver:'MusicTransport',arrangement:clips.map(({id,track,name,start,bars,binding,amp,freq,blend})=>({track,name,startBar:start,durationBars:bars,binding,parameters:{amplitude:amp/100,frequencyHz:freq,blendSeconds:blend/100}}))},null,2);json.showModal()};$('#closeJson').onclick=()=>json.close();
$('#timelineWrap').addEventListener('click',e=>{if(e.target.closest('.clip,.section-block,.cue'))return;const lane=e.target.closest('.lane');if(!lane)return;const r=lane.getBoundingClientRect();seekBar(Math.floor((e.clientX-r.left)/r.width*TOTAL_BARS)+1)});
window.addEventListener('resize',()=>{resize(canvas);resize(signalCanvas)});$('#playBtn').classList.add('paused');$('#runtimeState').textContent=`PAUSED · v${BUILD_VERSION}`;buildTimeline();syncInspector();requestAnimationFrame(frame);
