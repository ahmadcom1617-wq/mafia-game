const express=require('express');const http=require('http');const {Server}=require('socket.io');
const app=express(),server=http.createServer(app),io=new Server(server,{cors:{origin:true}});
app.use(express.static('public'));app.get('/health',(req,res)=>res.json({ok:true,rooms:Object.keys(rooms).length}));
const rooms={};const names=['شهروند','مافیا','پدرخوانده','دکتر','کارآگاه','تک‌تیرانداز','شهردار','روان‌شناس'];
const pick=a=>a[Math.floor(Math.random()*a.length)],code=()=>Math.random().toString(36).slice(2,7).toUpperCase();
function pub(r){return {code:r.code,phase:r.phase,deadline:r.deadline,round:r.round,players:r.players.map(p=>({id:p.id,name:p.name,alive:p.alive,host:p.id===r.host})),log:r.log.slice(-30)}}
function send(r){io.to(r.code).emit('state',pub(r));}
function finish(r){let alive=r.players.filter(p=>p.alive),mafia=alive.filter(p=>p.team==='مافیا').length,cit=alive.length-mafia;if(mafia===0||mafia>=cit){r.phase='ended';r.log.push(mafia===0?'شهروندان برنده شدند!':'مافیا برنده شد!');io.to(r.code).emit('gameOver',{winner:mafia===0?'شهروندان':'مافیا'});send(r);return true}return false}
function assign(r){let ps=[...r.players];let n=ps.length;let mafiaCount=Math.max(1,Math.floor(n/4));let mafia=ps.sort(()=>Math.random()-.5).slice(0,mafiaCount);mafia.forEach((p,i)=>{p.role=i===0?'پدرخوانده':'مافیا';p.team='مافیا'});let special=['دکتر','کارآگاه','تک‌تیرانداز','شهردار','روان‌شناس'];ps.filter(p=>!mafia.includes(p)).slice(0,Math.min(special.length,n-mafiaCount)).forEach((p,i)=>{p.role=special[i];p.team='شهروند'});ps.forEach(p=>{if(!p.role){p.role='شهروند';p.team='شهروند'}io.to(p.id).emit('role',{role:p.role,team:p.team})})}
function phase(r,p){r.phase=p;r.deadline=Date.now()+(p==='night'?45000:p==='vote'?30000:90000);r.actions={};send(r)}
io.on('connection',s=>{
 s.on('createRoom',d=>{let name=String(d?.name||'بازیکن').slice(0,24),c=code();rooms[c]={code:c,host:s.id,players:[{id:s.id,name,alive:true,role:null,team:null}],phase:'lobby',round:0,log:['اتاق ساخته شد.'],actions:{},deadline:null};s.join(c);s.data.room=c;s.emit('joined',{code:c});send(rooms[c])});
 s.on('joinRoom',d=>{let c=String(d?.room||'').toUpperCase(),r=rooms[c];if(!r||r.phase!=='lobby'||r.players.length>=20)return s.emit('errorMsg','اتاق پیدا نشد یا ظرفیت تکمیل است.');if(r.players.some(p=>p.id===s.id))return;s.join(c);s.data.room=c;r.players.push({id:s.id,name:String(d?.name||'بازیکن').slice(0,24),alive:true,role:null,team:null});r.log.push((d?.name||'بازیکن')+' وارد اتاق شد.');s.emit('joined',{code:c});send(r)});
 s.on('startGame',()=>{let r=rooms[s.data.room];if(!r||r.host!==s.id||r.phase!=='lobby')return;if(r.players.length<4)return s.emit('errorMsg','برای شروع حداقل ۴ بازیکن لازم است.');assign(r);r.log.push('بازی شروع شد. شب اول است.');phase(r,'night')});
 s.on('action',d=>{let r=rooms[s.data.room],p=r?.players.find(x=>x.id===s.id),t=r?.players.find(x=>x.id===d?.target);if(!r||!p?.alive||r.phase!=='night'||!t?.alive)return;if(!['مافیا','پدرخوانده','دکتر','کارآگاه','تک‌تیرانداز'].includes(p.role))return s.emit('errorMsg','نقش شما در شب کنشی ندارد.');r.actions[p.id]={target:t.id,role:p.role};s.emit('private','انتخاب شما ثبت شد.')});
 s.on('vote',d=>{let r=rooms[s.data.room],p=r?.players.find(x=>x.id===s.id),t=r?.players.find(x=>x.id===d?.target);if(!r||r.phase!=='vote'||!p?.alive||!t?.alive)return;r.actions[p.id]=t.id;s.emit('private','رأی شما ثبت شد.')});
 s.on('chat',d=>{let r=rooms[s.data.room],p=r?.players.find(x=>x.id===s.id);if(!r||!p?.alive||!['day','lobby'].includes(r.phase))return;let text=String(d?.text||'').slice(0,300);if(text)io.to(r.code).emit('chat',{name:p.name,text})});
 // WebRTC signaling: clients exchange offers/answers/ICE only with players in same room.
 for(const ev of ['voice-offer','voice-answer','voice-ice'])s.on(ev,d=>{let r=rooms[s.data.room],target=r?.players.find(p=>p.id===d?.to);if(!r||!target)return;io.to(target.id).emit(ev,{from:s.id,data:d.data})});
 s.on('disconnect',()=>{let r=rooms[s.data.room];if(!r)return;let p=r.players.find(x=>x.id===s.id);if(p){p.connected=false;r.log.push(p.name+' قطع شد.');send(r)}})
});
setInterval(()=>{
 for(const r of Object.values(rooms)){
  if(!r.deadline||Date.now()<r.deadline) continue;
  if(r.phase==='night'){
   const acts=Object.values(r.actions);
   const kill=acts.find(a=>a.role==='مافیا'||a.role==='پدرخوانده')?.target;
   const save=acts.find(a=>a.role==='دکتر')?.target;
   if(kill&&kill!==save){const p=r.players.find(x=>x.id===kill);if(p){p.alive=false;r.log.push(p.name+' در شب حذف شد.')}}else r.log.push('شب بدون حذف تمام شد.');
   if(!finish(r)){r.round++;phase(r,'day')}
  } else if(r.phase==='day'){
   phase(r,'vote');
  } else if(r.phase==='vote'){
   const counts={};Object.values(r.actions).forEach(id=>counts[id]=(counts[id]||0)+1);
   const target=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0];
   if(target){const p=r.players.find(x=>x.id===target);if(p){p.alive=false;r.log.push(p.name+' با رأی‌گیری حذف شد.')}}
   if(!finish(r)){r.log.push('شب بعدی شروع شد.');phase(r,'night')}
  }
 }
},1000);
const PORT=process.env.PORT||10000;server.listen(PORT,'0.0.0.0',()=>console.log('Mafia server listening on '+PORT));
