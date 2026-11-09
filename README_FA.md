# راه‌اندازی بازی مافیا در Render

## فایل‌های لازم در ریشه مخزن GitHub
`package.json`, `start.js`, `server.js`, `bot.js`, `.env.example` و پوشه `public/` باید همگی در ریشه مخزن باشند. ZIP را به‌تنهایی Render اجرا نمی‌کند.

## تنظیمات Render Web Service
- Build Command: `npm install`
- Start Command: `npm start`
- Instance: Free (برای تست)

## متغیرهای محیطی در Render → Environment
- `BOT_TOKEN`: توکن تازه ربات تلگرام
- `WEBAPP_URL`: آدرس HTTPS سرویس، مثل `https://YOUR-SERVICE.onrender.com`
- `REQUIRE_TELEGRAM_AUTH`: `false` برای تست اولیه؛ پس از تنظیمات Mini App می‌توان آن را `true` کرد.

بعد از افزودن متغیرها، Save Changes و سپس Manual Deploy انجام دهید. در BotFather نیز آدرس HTTPS را برای Mini App تنظیم کنید.

## نکته مهم
این پروژه نمونه اولیه است: اتاق‌ها در حافظه نگهداری می‌شوند و با راه‌اندازی مجدد سرویس از بین می‌روند. پلن رایگان Render ممکن است پس از بی‌فعالیتی سرویس را بخواباند؛ در آن حالت ربات polling و بازی تا بیدار شدن سرویس در دسترس نخواهند بود.
