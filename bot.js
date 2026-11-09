require('dotenv').config();
const TOKEN=process.env.BOT_TOKEN;
const WEBAPP_URL=process.env.WEBAPP_URL;
if(!TOKEN) { console.error('BOT_TOKEN تنظیم نشده است.'); process.exit(1); }
if(!WEBAPP_URL || !/^https:\/\//i.test(WEBAPP_URL)) { console.error('WEBAPP_URL باید آدرس HTTPS سایت بازی باشد.'); process.exit(1); }
const API=`https://api.telegram.org/bot${TOKEN}`;
async function call(method, body={}) {
  const r=await fetch(`${API}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json(); if(!j.ok) throw new Error(j.description||method); return j.result;
}
async function send(chat_id,text,reply_markup) { return call('sendMessage',{chat_id,text,reply_markup}); }
async function main(){
  await call('deleteWebhook',{drop_pending_updates:false});
  await call('setMyCommands',{commands:[{command:'start',description:'شروع و ورود به بازی مافیا'},{command:'help',description:'راهنمای بازی'}]});
  let offset=0; console.log('Mafia Telegram bot polling started');
  while(true){
    try {
      const updates=await call('getUpdates',{offset,timeout:25,allowed_updates:['message']});
      for(const u of updates){ offset=u.update_id+1; const m=u.message; if(!m?.chat?.id) continue;
        const text=(m.text||'').trim();
        if(text.startsWith('/start')){
          await send(m.chat.id,'🎭 به بازی مافیای آنلاین خوش آمدی!\n\nبرای ساخت اتاق یا پیوستن به بازی، دکمه زیر را بزن. بازی در صفحه گرافیکی باز می‌شود.',{inline_keyboard:[[{text:'🎮 ورود به بازی مافیا',web_app:{url:WEBAPP_URL}}]]});
        } else if(text.startsWith('/help')){
          await send(m.chat.id,'راهنما:\n۱) دکمه ورود به بازی را بزن.\n۲) نامت را وارد کن و اتاق بساز یا کد اتاق دوستت را وارد کن.\n۳) برای شروع بازی حداقل ۶ نفر لازم است.\n\nنکته: لینک بازی باید HTTPS و از داخل تلگرام باز شود.');
        } else {
          await send(m.chat.id,'برای بازی از دکمه زیر استفاده کن:',{inline_keyboard:[[{text:'🎮 باز کردن بازی',web_app:{url:WEBAPP_URL}}]]});
        }
      }
    } catch(e) { console.error('Bot error:',e.message); await new Promise(r=>setTimeout(r,3000)); }
  }
}
main();
