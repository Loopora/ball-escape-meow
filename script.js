'use strict';
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const ui={count:document.getElementById('count'),escapes:document.getElementById('escapes'),toggle:document.getElementById('toggle'),reset:document.getElementById('reset'),speed:document.getElementById('speed'),gap:document.getElementById('gap'),rotation:document.getElementById('rotation'),limit:document.getElementById('limit'),sound:document.getElementById('sound')};
const TAU=Math.PI*2;
let width=360,height=480,cx=180,cy=240,radius=130;
let balls=[],particles=[],escapes=0,angle=0,playing=true,lastTime=0,accumulator=0;
let speed=1,gap=25*Math.PI/180,rotation=.75,limit=256,audioContext=null;
function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);cx=width/2;cy=height*.51;radius=Math.min(width*.39,height*.31);}
function makeBall(x,y,vx,vy,hue,r=7){return{x,y,vx,vy,hue,r};}
function reset(){balls=[makeBall(0,-45,115,35,185)];particles=[];escapes=0;angle=0;accumulator=0;updateStats();}
function updateStats(){ui.count.textContent=balls.length;ui.escapes.textContent=escapes;}
function angleDifference(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
const meowAudio=new Audio('meow.wav');
meowAudio.preload='auto';
let lastSound=0;
function meow(){
 if(!ui.sound.checked)return;
 const now=performance.now();
 if(now-lastSound<450)return; // avoid dozens of overlapping meows
 lastSound=now;
 try{const voice=meowAudio.cloneNode();voice.volume=.65;voice.play().catch(()=>{});}catch(e){console.warn('Sound unavailable',e);}
}
function step(dt){angle+=dt*rotation;const next=[];let spawned=0,escaped=false;
for(const b of balls){b.vy+=105*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;const dist=Math.hypot(b.x,b.y);if(dist+b.r>=radius){const a=Math.atan2(b.y,b.x);if(Math.abs(angleDifference(a,angle))<gap/2){escapes++;const available=Math.max(0,limit-(balls.length+spawned));const count=Math.min(2,available);for(let j=0;j<count;j++){const dir=Math.random()*TAU;next.push(makeBall((Math.random()-.5)*24,(Math.random()-.5)*24,Math.cos(dir)*125,Math.sin(dir)*125,(b.hue+j*42)%360,Math.max(3.5,7-Math.log2(Math.max(1,balls.length))*.32)));spawned++;}for(let j=0;j<10;j++)particles.push({x:b.x,y:b.y,vx:(Math.random()-.5)*180,vy:(Math.random()-.5)*180,life:.55,hue:b.hue});escaped=true;continue;}
const nx=b.x/(dist||1),ny=b.y/(dist||1),dot=b.vx*nx+b.vy*ny;if(dot>0){b.vx-=1.95*dot*nx;b.vy-=1.95*dot*ny;}b.x=nx*(radius-b.r-1);b.y=ny*(radius-b.r-1);}next.push(b);}
balls=next.slice(0,limit);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);if(escaped)meow();updateStats();}
function draw(){const bg=ctx.createRadialGradient(cx,cy,10,cx,cy,radius*2.5);bg.addColorStop(0,'#172342');bg.addColorStop(1,'#090e1b');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.save();ctx.translate(cx,cy);ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.fillStyle='rgba(30,60,100,.13)';ctx.fill();ctx.beginPath();ctx.arc(0,0,radius,angle+gap/2,angle+TAU-gap/2);ctx.strokeStyle='#47e5fa';ctx.lineWidth=6;ctx.lineCap='round';ctx.shadowColor='#00dfff';ctx.shadowBlur=17;ctx.stroke();ctx.shadowBlur=0;for(const b of balls){ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fillStyle=`hsl(${b.hue} 95% 65%)`;ctx.shadowColor=`hsl(${b.hue} 100% 55%)`;ctx.shadowBlur=12;ctx.fill();}ctx.shadowBlur=0;for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/.55);ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,TAU);ctx.fillStyle=`hsl(${p.hue} 100% 70%)`;ctx.fill();}ctx.globalAlpha=1;ctx.restore();}
function animate(timestamp){const delta=Math.min((timestamp-lastTime)/1000||0,.04);lastTime=timestamp;if(playing){accumulator+=delta*speed;let iterations=0;while(accumulator>=1/120&&iterations<12){step(1/120);accumulator-=1/120;iterations++;}if(iterations===12)accumulator=0;}draw();requestAnimationFrame(animate);}
ui.sound.addEventListener('change',()=>{if(ui.sound.checked){meowAudio.play().then(()=>{meowAudio.pause();meowAudio.currentTime=0;}).catch(()=>{});}});
ui.toggle.addEventListener('click',()=>{playing=!playing;ui.toggle.textContent=playing?'Pause':'Play';});ui.reset.addEventListener('click',reset);
for(const [name,formatter,callback] of [['speed',v=>v.toFixed(1)+'×',v=>speed=v],['gap',v=>v+'°',v=>gap=v*Math.PI/180],['rotation',v=>v.toFixed(2)+'×',v=>rotation=v],['limit',v=>String(v),v=>{limit=v;balls=balls.slice(0,limit);updateStats();}]]){ui[name].addEventListener('input',e=>{const v=Number(e.target.value);callback(v);document.getElementById(name+'Out').textContent=formatter(v);});}
window.addEventListener('resize',resize);resize();reset();requestAnimationFrame(animate);
