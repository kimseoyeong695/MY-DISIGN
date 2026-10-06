'use strict';
const $=id=>document.getElementById(id), canvas=$('scene'),ctx=canvas.getContext('2d');
const defaults={template:'logic',substrate:'si',insulator:'oxide',metal:'cu',package:'standard',thickness:50,density:60};
let config={...defaults},tab='design',view='solid',stage=0,playing=false,elapsed=0,last=0,rx=.58,ry=-.64,zoom=1,drag=null,finished=false;
const names={logic:'LOGIC CHIP',sensor:'SENSOR CHIP',power:'POWER CHIP',si:'실리콘',sic:'탄화규소',gan:'질화갈륨 기반',oxide:'산화물',nitride:'질화물',cu:'구리',al:'알루미늄',standard:'기본 패키지',thermal:'방열 강화'};
// Keep the workspace compact; reveal only the setting the user is editing.
const settingSummaries={};
document.querySelectorAll('.panel .divider,.panel .section-label').forEach(el=>el.remove());
for(const key of Object.keys(defaults)){
 const control=$(key),label=control.tagName==='SELECT'?control.parentElement:document.querySelector(`label.range-label:has(#${key}Value)`);
 const title=label.firstChild.textContent.trim(),details=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');
 details.className='setting';details.name='chip-settings';body.className='setting-body';summary.innerHTML=`<span>${title}</span><small></small><b>＋</b>`;
 label.before(details);details.append(summary,body);body.append(label);if(control.tagName!=='SELECT')body.append(control);
 settingSummaries[key]=summary.querySelector('small');
 details.addEventListener('toggle',()=>{summary.querySelector('b').textContent=details.open?'−':'＋';if(details.open)document.querySelectorAll('.setting').forEach(other=>{if(other!==details)other.open=false})});
}
const insights=document.querySelector('.insights'),infoDetails=document.createElement('details'),infoSummary=document.createElement('summary');
infoDetails.className='insight-details';infoSummary.textContent='특성 리포트 보기';infoDetails.append(infoSummary);insights.append(infoDetails);
['description','metrics'].forEach(id=>infoDetails.append($(id)));infoDetails.append(insights.querySelector('.info'),insights.querySelector('.recipe'));
function refreshSummaries(){for(const key in settingSummaries){settingSummaries[key].textContent=typeof config[key]==='number'?config[key]:$(key).selectedOptions[0].textContent.split(' · ')[0];}}
const stages=[['웨이퍼 준비','설계에 선택한 기판으로 웨이퍼를 준비합니다.'],['층 형성','기판 위에 절연층을 형성합니다.'],['패턴 형성','회로를 만들기 위한 패턴을 표시합니다.'],['식각','선택된 영역을 제거해 회로 구조를 만듭니다.'],['배선 형성','금속 배선으로 회로를 연결합니다.'],['보호층 형성','회로를 보호하는 상부층을 추가합니다.'],['검사','설계에 따른 연결 상태를 가상 검사합니다.'],['절단','웨이퍼에서 개별 칩을 분리합니다.'],['패키징','개별 칩을 패키지에 조립해 완성합니다.']];
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2400)}
function validate(data){const clean={...defaults};for(const key in clean){if(typeof clean[key]==='number'){const n=Number(data[key]);if(Number.isFinite(n))clean[key]=Math.min(key==='density'?100:90,Math.max(20,n));}else if([...$(key).options].some(o=>o.value===data[key]))clean[key]=data[key];}if(clean.template!=='power')clean.substrate='si';return clean}
try{const shared=new URLSearchParams(location.hash.slice(1)).get('design');config=validate(JSON.parse(shared||localStorage.getItem('chip-studio-v1')||'{}'))}catch{}
function scores(){const high=config.substrate!=='si',density=Number(config.density),thickness=Number(config.thickness);return [Math.round(85-density*.25+(config.template==='sensor'?12:0)+(config.insulator==='nitride'?4:0)),Math.round(42+(high?20:0)+(config.package==='thermal'?20:0)+thickness*.13),Math.round(35+density*.42+(config.metal==='cu'?9:0)),Math.round(30+(high?20:0)+density*.22+(config.insulator==='nitride'?8:0)),Math.round(25+(high?26:0)+(config.package==='thermal'?15:0)+density*.17)].map(x=>Math.min(99,Math.max(1,x)))}
function sync(){for(const key in config)$(key).value=config[key];[...$('substrate').options].forEach(o=>o.disabled=config.template!=='power'&&o.value!=='si');$('thicknessValue').value=config.thickness;$('densityValue').value=config.density;$('chipName').textContent=names[config.template];$('materialCaption').textContent=`${config.substrate.toUpperCase()} / ${config.metal.toUpperCase()} / ${names[config.insulator]}`;$('description').textContent=config.template==='power'?'探索 재료와 방열 패키지를 조합해 열 관리 특성을 살펴보세요.'.replace('探索','전력 칩의'):config.template==='sensor'?'작은 신호를 감지하는 센서 칩입니다. 배선 밀도와 전력 효율의 균형을 살펴보세요.':'균형 잡힌 로직 칩입니다. 배선 밀도를 바꾸며 처리 성능과 상대 비용을 비교해보세요.';const s=scores();$('metrics').innerHTML=['전력 효율','열 관리','처리 성능','제조 난이도','상대 비용'].map((label,i)=>`<div class="metric"><div class="metric-head"><span>${label}</span><strong>${s[i]} <small>/ 100</small></strong></div><div class="bar"><i style="width:${s[i]}%"></i></div></div>`).join('');$('recipe').textContent=[config.substrate,config.insulator,config.metal,config.package].map(k=>names[k]).join(' / ');$('resultSummary').textContent=`${names[config.template]} · ${names[config.substrate]} 기판 · ${names[config.metal]} 배선 · ${names[config.package]}`;try{localStorage.setItem('chip-studio-v1',JSON.stringify(config))}catch{} }
for(const key in defaults)$(key).addEventListener('input',()=>{config[key]=typeof defaults[key]==='number'?Number($(key).value):$(key).value;if(config.template!=='power')config.substrate='si';finished=false;playing=false;stage=0;elapsed=0;if(tab!=='design')setTab('design');sync();$('status').textContent='설계 변경 저장됨';});
function setTab(next){if(next==='result'&&!finished){toast('제조를 완료하면 완성된 칩을 확인할 수 있습니다.');return}tab=next;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$('process').hidden=tab!=='manufacture';$('result').hidden=tab!=='result';$('viewerTitle').textContent=tab==='design'?'설계 미리보기':tab==='result'?'완성된 칩':stages[stage][0];$('next').textContent=tab==='design'?'제조 시작하기 →':tab==='manufacture'?'완성까지 빠르게 보기 →':'설계 다시 수정하기 →';if(tab!=='manufacture')playing=false;updateProcess()}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b))});
$('camera').onclick=()=>{rx=.58;ry=-.64;zoom=1};$('reset').onclick=()=>{config={...defaults};finished=false;setTab('design');sync();toast('기본 설계로 복원했습니다.')};
$('next').onclick=()=>{if(tab==='design'){stage=0;elapsed=0;setTab('manufacture');playing=true;updateProcess()}else if(tab==='manufacture'){stage=8;complete()}else setTab('design')};
$('play').onclick=()=>{if(finished){finished=false;stage=0;elapsed=0}playing=!playing;updateProcess()};
function updateProcess(){$('processTitle').textContent=stages[stage][0];$('processDescription').textContent=stages[stage][1]+' 교육용으로 단순화한 공정입니다.';$('play').textContent=playing?'Ⅱ 일시정지':finished?'↺ 다시 제조하기':'▶ 제조 재생';$('timeline').innerHTML=stages.map((s,i)=>`<button data-stage="${i}" class="${i===stage?'active':i<stage?'done':''}">${String(i+1).padStart(2,'0')}<br><br>${s[0]}</button>`).join('');$('timeline').querySelectorAll('button').forEach(b=>b.onclick=()=>{stage=Number(b.dataset.stage);elapsed=0;finished=false;playing=true;updateProcess()});if(tab==='manufacture'){$('viewerTitle').textContent=stages[stage][0];$('status').textContent=`제조 단계 ${stage+1} / 9`}}
function complete(){finished=true;playing=false;stage=8;setTab('result');$('status').textContent='제조 완료 · 나만의 칩이 준비됐습니다';toast('당신의 칩이 완성됐습니다!')}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
$('save').onclick=()=>{download(new Blob([JSON.stringify({version:1,...config},null,2)],{type:'application/json'}),'chip-design.json');toast('설계 파일을 저장했습니다.')};$('download').onclick=()=>canvas.toBlob(b=>{if(b)download(b,'my-chip.png')});$('share').onclick=async()=>{const url=location.href.split('#')[0]+'#design='+encodeURIComponent(JSON.stringify(config));try{await navigator.clipboard.writeText(url);toast('설계 링크를 복사했습니다. 로컬 서버가 실행 중인 이 기기에서 열 수 있습니다.')}catch{location.hash='design='+encodeURIComponent(JSON.stringify(config));toast('주소창에 설계 링크를 생성했습니다.')}};
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drag)return;ry+=(e.clientX-drag.x)*.008;rx=Math.max(.1,Math.min(1.35,rx+(e.clientY-drag.y)*.006));drag={x:e.clientX,y:e.clientY}});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(4,zoom-e.deltaY*.001))},{passive:false});
let W=0,H=0;function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;canvas.width=W*d;canvas.height=H*d;ctx.setTransform(d,0,0,d,0,0)}new ResizeObserver(resize).observe(canvas);
function project([x,y,z]){let a=x*Math.cos(ry)+z*Math.sin(ry),b=-x*Math.sin(ry)+z*Math.cos(ry),c=y*Math.cos(rx)-b*Math.sin(rx),depth=y*Math.sin(rx)+b*Math.cos(rx);const scale=Math.min(W/430,H/470)*zoom*1.12*(pcbEnabled&&tab!=='manufacture'?.76:1);return [W/2+a*scale,H*.47+c*scale,depth]}
let faces=[],chipOffset=[0,0,0],movingChip=false,miniChip=false;function polygon(points,color,stroke='#bcead51b'){faces.push({points:points.map(p=>{let q=movingChip?p.map((v,i)=>v+chipOffset[i]):p;return project(miniChip?[q[0]*.48,92+(q[1]-92)*.48,q[2]*.48]:q)}),color,stroke})}function box(x,y,z,w,h,d,color){const p=[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]];[[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]].forEach((f,i)=>polygon(f.map(n=>p[n]),color[i%color.length]))}
function draw(time){const dt=Math.min(time-last,100);last=time;if(playing){elapsed+=dt*Number($('speed').value);if(elapsed>6200){elapsed=0;if(stage<8){stage++;updateProcess()}else complete()}}ctx.clearRect(0,0,W,H);ctx.fillStyle='#0d151a';ctx.fillRect(0,0,W,H);const glow=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*.6);glow.addColorStop(0,'#22474177');glow.addColorStop(1,'#0d151a00');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);ctx.strokeStyle='#71bda010';ctx.lineWidth=1;for(let k=-6;k<=6;k++){for(const points of [[[-320,110,k*50],[320,110,k*50]],[[k*50,110,-320],[k*50,110,320]]]){const a=project(points[0]),b=project(points[1]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()}}
miniChip=pcbEnabled&&tab!=='manufacture'&&view==='solid';faces=[];const fabrication=tab==='manufacture',n=fabrication?stage:8,split=!fabrication&&view==='explode'?1:0,cut=!fabrication&&view==='section',depth=cut?110:220,baseY=25;const substrateColors=config.substrate==='si'?['#49616b','#344b56','#76909b']:config.substrate==='sic'?['#38635a','#24443d','#60968a']:['#544b73','#37324d','#8075a3'];
const progress=Math.min(1,elapsed/6200),work=Math.max(0,Math.min(1,(progress-.2)/.6));
chipOffset=fabrication?(n===0?[(-220)*(1-ease(progress)), -35*Math.sin(progress*Math.PI),0]:n===7?[0,-35*work,0]:n===8?[150*(1-ease(progress)),-90*(1-ease(progress)),0]:[0,0,0]):[0,0,0];movingChip=true;
if(fabrication&&n<7){const circle=[];for(let i=0;i<64;i++){const a=i/64*Math.PI*2;circle.push([Math.cos(a)*163,baseY+18,Math.sin(a)*163])}polygon(circle,'#283f4b','#739cab');}
box(-110,baseY,-110,220,20+Number(config.thickness)*.2,depth,substrateColors);
if(n>=1){box(-110,baseY-12-split*45,-110,220,12*(fabrication&&n===1?work:1),depth,['#559caa','#326673','#85d4d6']);}
if(n>=2){const count=Math.round(Number(config.density)/10);const metal=config.metal==='cu'?['#9c663f','#613d28','#e1ab73']:['#95acb5','#526c76','#d4e8ed'];let y=baseY-19-split*90;for(let i=0;i<count;i++){if(fabrication&&(n===2||n===4)&&i>=Math.ceil(count*work))continue;const z=-95+i*(185/count);if(cut&&z>0)continue;box(-94,y,z,188,5,4,metal);if(n>=4){for(let j=0;j<5;j++)box(-88+j*40,y-4,z-8,13,4,17,['#204541','#17332f','#6bb59a'])}}if(n===3){box(-55,y-12,-50,45*(1-work),8*(1-work),35,['#336975','#23414b','#76a8ab'])}}
if(n>=5){box(-106,baseY-29-split*135,-106,212,7*(fabrication&&n===5?work:1),cut?106:212,['#336356','#244039','#7ec5a0']);box(-55,baseY-32-split*135,-42,110,3,cut?42:84,['#173f38','#123028','#a4e2bb']);}
movingChip=false;
if(n>=8){const py=65+split*35;box(-136,py,-136,272,20,cut?136:272,['#222e36','#141d23','#4b626b']);for(let i=0;i<12;i++){let p=-117+i*21;box(p,py+7,-160,8,4,24,['#7e8c90','#47595f','#becbd0']);if(!cut)box(p,py+7,136,8,4,24,['#7e8c90','#47595f','#becbd0']);box(-160,py+7,p,24,4,8,['#7e8c90','#47595f','#becbd0']);box(136,py+7,p,24,4,8,['#7e8c90','#47595f','#becbd0'])}if(config.package==='thermal')for(let i=0;i<6;i++)box(-85+i*30,baseY-44-split*145,-90,8,12,cut?90:180,['#586c74','#33464d','#a4bbc3']);}
miniChip=false;if(pcbEnabled&&!fabrication&&!cut&&!split)buildPCB(time);
if(fabrication)buildMachine(n,progress,work);
faces.sort((a,b)=>b.points.reduce((s,p)=>s+p[2],0)/b.points.length-a.points.reduce((s,p)=>s+p[2],0)/a.points.length);for(const f of faces){ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();ctx.strokeStyle=f.stroke;ctx.stroke()}
if(fabrication)drawMachineEffects(n,progress,work);else if(pcbEnabled&&!cut&&!split)drawPCBLight(time);requestAnimationFrame(draw)}
const equipment=[['웨이퍼 이송 로봇','로봇이 웨이퍼를 작업대에 올립니다.'],['증착 장비','노즐에서 재료를 공급해 절연층을 쌓습니다.'],['노광 장비','광학 헤드가 이동하며 패턴을 만듭니다.'],['플라즈마 식각 장비','플라즈마로 선택 영역을 깎아냅니다.'],['금속 배선 장비','금속층과 연결 구조를 순서대로 형성합니다.'],['보호막 증착 장비','표면 위에 보호층을 쌓습니다.'],['광학 검사 장비','검사 헤드가 칩 표면을 스캔합니다.'],['다이싱 장비','절단 휠이 이동하며 칩을 분리합니다.'],['다이 본더','흡착 헤드가 칩을 옮겨 패키지에 붙입니다.']];
const machineBadge=document.createElement('div');machineBadge.className='machine-badge';machineBadge.innerHTML='<span id="machineName"></span><small id="machineAction"></small><div><i id="machineProgress"></i></div>';document.querySelector('.viewer').append(machineBadge);
const steel=['#39505c','#20313c','#6d8997'],darkSteel=['#1b2d37','#13212b','#364b59'],accent=['#497c73','#2b534a','#a5f5d0'];
function ease(p){p=Math.max(0,Math.min(1,p));return p*p*(3-2*p)}
function beam(a,b,width,colors){const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,ox=-dy/length*width/2,oy=dx/length*width/2;const pts=[[a[0]+ox,a[1]+oy,a[2]-width/2],[a[0]-ox,a[1]-oy,a[2]-width/2],[b[0]-ox,b[1]-oy,b[2]-width/2],[b[0]+ox,b[1]+oy,b[2]-width/2]];polygon(pts,colors[0]);polygon(pts.map(p=>[p[0],p[1],p[2]+width]),colors[2]);polygon([pts[0],pts[3],[pts[3][0],pts[3][1],pts[3][2]+width],[pts[0][0],pts[0][1],pts[0][2]+width]],colors[1])}
function buildMachine(n,p,w){
 // A shared workstation and replaceable process head surround the same chip.
 box(-185,92,-180,370,18,360,darkSteel);box(-150,110,-130,28,38,28,steel);box(122,110,102,28,38,28,steel);
 if(n===0||n===8){const target=n===0?[-220*(1-ease(p)),-18-35*Math.sin(p*Math.PI),0]:[150*(1-ease(p)),-125*(1-ease(p))-12,0];const base=n===0?-215:210;box(base-22,40,42,44,55,50,darkSteel);box(base-14,-74,50,28,114,30,steel);const elbow=[base*.55,-150,65],tip=[target[0],target[1]-30,0];beam([base,-60,65],elbow,22,steel);beam(elbow,tip,18,accent);beam(tip,[target[0],target[1],0],12,steel);box(target[0]-23,target[1],-23,46,12,46,darkSteel);box(target[0]-8,target[1]+12,-8,16,8,16,accent);
 }else{
 box(-164,-205,125,25,298,25,steel);box(139,-205,125,25,298,25,steel);box(-164,-205,115,328,28,44,darkSteel);
 const scan=-95+190*w,approach=35*Math.sin(Math.PI*Math.min(1,p/.25)/2),x=[2,6,7].includes(n)?scan:0,headY=-158+approach;
 box(x-35,headY,-35,70,42,70,steel);box(x-25,headY+42,-25,50,12,50,accent);
 if(n===7){const c=[];for(let i=0;i<36;i++){const angle=i/36*Math.PI*2;c.push([x,headY+85+Math.sin(angle)*30,Math.cos(angle)*30])}polygon(c,'#bbc8d0','#e7f2f7');beam([x,headY+42,0],[x,headY+85,0],10,darkSteel)}
 else box(x-10,headY+54,-10,20,20,20,darkSteel);
 }
}
function line3(a,b,color,width=1){const u=project(a),v=project(b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(u[0],u[1]);ctx.lineTo(v[0],v[1]);ctx.stroke()}
function particle(p,r,color){const q=project(p);ctx.fillStyle=color;ctx.beginPath();ctx.arc(q[0],q[1],r,0,Math.PI*2);ctx.fill()}
function drawMachineEffects(n,p,w){
 machineBadge.hidden=false;$('machineName').textContent=equipment[n][0];$('machineAction').textContent=p<.2?'장비 접근 · 작업 준비':p>.8?'작업 완료 · 다음 공정 준비':equipment[n][1];$('machineProgress').style.width=`${p*100}%`;
 const active=p>.2&&p<.8,x=-95+190*w;
 if(active&&[1,4,5].includes(n)){for(let i=0;i<45;i++){const f=((elapsed*.0006+i*.137)%1),a=i*2.399;particle([Math.cos(a)*f*95,-60+f*75,Math.sin(a)*f*95],1.8,n===4?'#efb675':'#98eee2')}}
 if(active&&[2,6].includes(n)){for(let z=-100;z<=100;z+=20)line3([x,-52,z*.22],[x,10,z],n===2?'#8eceff88':'#a5f5d088');line3([x,8,-100],[x,8,100],n===2?'#b5dfff':'#a5f5d0',3)}
 if(active&&n===3){for(let i=0;i<26;i++){const a=i*2.4+elapsed*.002;particle([Math.cos(a)*80,4-Math.abs(Math.sin(a*3))*55,Math.sin(a)*80],2,'#c4a3ff');}for(let i=0;i<12;i++)line3([-80+i*14,-58,-65],[-80+i*14,10,65],'#aa80ff44')}
 if(active&&n===7){line3([x,5,-120],[x,5,120],'#e1eaf2',2);for(let i=0;i<18;i++){const f=(elapsed*.001+i*.11)%1;particle([x+Math.sin(i*3)*f*30,8-f*40,f*75],1.8,'#ffd18b')}}
 if(n===8&&p>.75){const pos=project([0,-38,0]);ctx.fillStyle='#a5f5d0';ctx.font='11px Arial';ctx.textAlign='center';ctx.fillText('✓ BOND COMPLETE',pos[0],pos[1]-12);ctx.textAlign='start'}
}
let pcbEnabled=true,pcbPower=true;
const pcbSettings=document.createElement('details');pcbSettings.className='pcb-settings';pcbSettings.innerHTML='<summary>PCB 보드 & LED</summary><div><label><input id="pcbEnabled" type="checkbox" checked> 개발보드에 칩 장착</label><label><input id="pcbPower" type="checkbox" checked> 전원 켜기 · LED 동작</label><p>초록: 전원 / 주황: 상태 점멸<br>저항 · 커패시터 · USB · 핀 헤더</p><a href="https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html" target="_blank" rel="noopener">Pico 공식 보드 자료 ↗</a><small>실제 개발보드 구성을 참고한 교육용 모델입니다. Pico 회로의 복제나 검증된 회로 설계는 아닙니다.</small></div>';document.querySelector('.panel').append(pcbSettings);
$('pcbEnabled').onchange=e=>pcbEnabled=e.target.checked;$('pcbPower').onchange=e=>pcbPower=e.target.checked;

function disc(x,y,z,r,color){const p=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2;p.push([x+r*Math.cos(a),y,z+r*Math.sin(a)])}polygon(p,color,'#00000000')}
function route(points,width=1,color='#528d78'){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,ox=-dz/l*width/2,oz=dx/l*width/2;polygon([[a[0]+ox,91,a[1]+oz],[b[0]+ox,91,b[1]+oz],[b[0]-ox,91,b[1]-oz],[a[0]-ox,91,a[1]-oz]],color,'#00000000')}}
function passive(x,z,w=10,d=5,body='#bfa67f'){box(x-w/2,85,z-d/2,w,5,d,[body,'#665f4d',body]);box(x-w/2,85,z-d/2,2,5,d,steel);box(x+w/2-2,85,z-d/2,2,5,d,steel)}
function buildPCB(time){
 const outline=[];for(const [cx,cz,start] of [[126,-197,-90],[126,197,0],[-126,197,90],[-126,-197,180]])for(let i=0;i<=8;i++){const a=(start+i*90/8)*Math.PI/180;outline.push([cx+14*Math.cos(a),92,cz+14*Math.sin(a)])}
 polygon(outline,'#205d4b','#649883');polygon(outline.map(p=>[p[0],p[1]+5,p[2]]),'#143c32');for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];polygon([a,b,[b[0],97,b[2]],[a[0],97,a[2]]],'#174537','#427263')}
 // Closely spaced through-hole headers with plated annuli and exposed metal pins.
 for(let i=0;i<16;i++){const z=-156+i*20.5;for(const x of [-119,119]){disc(x,90,z,5.5,'#cfb575');disc(x,89,z,2.7,'#142b28');box(x-6,80,z-6,12,11,12,['#1a2227','#0e171b','#303e43']);box(x-1.5,66,z-1.5,3,14,3,['#c1b68e','#716b51','#eee2b6']);disc(x+(x<0?13:-13),90,z,2.2,'#8dbea4');disc(x+(x<0?13:-13),89,z,1,'#183e33');}}
 for(const x of [-120,120])for(const z of [-190,190]){disc(x,90,z,9,'#cfb575');disc(x,89,z,4.8,'#0d201c')}
 // Fine routed signal tracks leave the package pads, turn at 45 degrees and reach headers.
 for(let i=0;i<12;i++){const z=-57+i*10;route([[-78,z],[-90,z],[-106,z+16],[-106,-156+i*20.5]],1.1);route([[78,z],[91,z],[106,z-15],[106,-156+i*20.5]],1.1)}
 for(let i=0;i<6;i++){const x=-47+i*18;route([[x,77],[x,100],[x+14,114],[x+14,145]],1.2);route([[x,-78],[x,-102],[x-14,-116],[x-14,-146]],1.2)}
 // USB connector: thin metal shell, dark cavity and internal contacts.
 box(-23,70,-211,46,20,34,['#8c9aa0','#526168','#d8e0e2']);box(-19,73,-213,38,13,2,['#253139']);box(-15,80,-215,30,3,3,['#263a41']);for(let i=0;i<5;i++)box(-10+i*5,79,-216,2,2,4,['#d2b66f']);box(-26,86,-198,5,5,18,steel);box(21,86,-198,5,5,18,steel);
 // Small voltage regulator, decoupling capacitors and reset switch.
 box(65,82,-165,22,8,19,['#18232b','#101820','#303d44']);for(let i=0;i<3;i++){box(61,87,-162+i*6,5,3,2,steel);box(87,87,-162+i*6,5,3,2,steel)}
 for(const [x,z] of [[-87,-30],[-87,0],[-87,30],[87,-30],[87,0],[87,30],[-38,-118],[-20,-118],[27,112],[44,112],[62,112]])passive(x,z);
 for(const [x,z] of [[-70,118],[-70,137],[60,-130]])passive(x,z,12,6,'#24343a');
 box(-18,82,145,36,8,20,['#18242b','#10181d','#344149']);for(let i=0;i<4;i++){box(-17+i*10,88,141,3,3,4,steel);box(-17+i*10,88,165,3,3,4,steel)}
 box(66,83,153,21,7,20,steel);disc(76,78,163,6,'#26343c');
 const active=pcbPower&&Math.sin(time*.006)>0;for(const [x,on,col] of [[-64,pcbPower,'#68e8a4'],[-36,active,'#e9bc68']]){box(x-6,86,-158,12,4,7,steel);box(x-3,83,-157,6,4,5,on?[col,'#426557',col]:['#4d5d50','#34463d','#607764']);passive(x,-142,10,4,'#29393d');route([[x,-139],[x,-126],[x+16,-110]],1)}
}
function drawPCBLight(time){
 for(const [x,color,on] of [[-64,'#68ffa4',pcbPower],[-36,'#ffbd62',pcbPower&&Math.sin(time*.006)>0]]){const p=project([x,82,-154]);if(on){const g=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],9);g.addColorStop(0,color+'90');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(p[0]-9,p[1]-9,18,18)}}
 const labels=[[-74,89,-173,'PWR'],[-44,89,-173,'ACT'],[-17,89,-172,'USB'],[65,89,184,'RESET'],[-45,90,187,'CHIP STUDIO / REV 1.2']];ctx.fillStyle='#d2e2d4';ctx.font='7px Arial';for(const [x,y,z,text] of labels){const p=project([x,y,z]);ctx.fillText(text,p[0],p[1])}
}
const originalSetTab=setTab;setTab=function(next){originalSetTab(next);machineBadge.hidden=tab!=='manufacture';if(tab==='manufacture'){rx=.42;ry=-.48;zoom=.77}};
machineBadge.hidden=true;
function updateSpeed(){const value=Number($('speed').value);$('speedValue').value=`${value}×`;$('speed').setAttribute('aria-valuetext',`${value}배 속도`);document.querySelectorAll('[data-speed]').forEach(button=>{const active=Number(button.dataset.speed)===value;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});}
$('speed').addEventListener('input',updateSpeed);document.querySelectorAll('[data-speed]').forEach(button=>button.onclick=()=>{$('speed').value=button.dataset.speed;updateSpeed()});updateSpeed();
sync();refreshSummaries();document.querySelector('.panel').addEventListener('input',refreshSummaries);$('reset').addEventListener('click',refreshSummaries);updateProcess();requestAnimationFrame(draw);


const zoomControls=document.createElement('div');zoomControls.className='zoom-controls';zoomControls.innerHTML='<button id="zoomOut" aria-label="축소">−</button><output id="zoomValue">100%</output><button id="zoomIn" aria-label="확대">＋</button><button id="zoomFit" aria-label="전체 보기">맞춤</button>';
document.querySelector('.viewer').append(zoomControls);
function updateZoomLabel(){document.getElementById('zoomValue').value=Math.round(zoom*100)+'%'}
document.getElementById('zoomIn').onclick=()=>{zoom=Math.min(4,zoom*1.25);updateZoomLabel()};document.getElementById('zoomOut').onclick=()=>{zoom=Math.max(.55,zoom/1.25);updateZoomLabel()};document.getElementById('zoomFit').onclick=()=>{zoom=1;updateZoomLabel()};canvas.addEventListener('wheel',updateZoomLabel);document.getElementById('camera').addEventListener('click',updateZoomLabel);
const touchPoints=new Map();let pinchDistance=0;
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touchPoints.set(e.pointerId,[e.clientX,e.clientY]);if(touchPoints.size===2){const [a,b]=[...touchPoints.values()];pinchDistance=Math.hypot(a[0]-b[0],a[1]-b[1]);drag=null}});
canvas.addEventListener('pointermove',e=>{if(!touchPoints.has(e.pointerId))return;touchPoints.set(e.pointerId,[e.clientX,e.clientY]);if(touchPoints.size===2){const [a,b]=[...touchPoints.values()],distance=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinchDistance>0)zoom=Math.max(.55,Math.min(4,zoom*distance/pinchDistance));pinchDistance=distance;drag=null;updateZoomLabel()}});
for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,e=>{touchPoints.delete(e.pointerId);pinchDistance=0});
