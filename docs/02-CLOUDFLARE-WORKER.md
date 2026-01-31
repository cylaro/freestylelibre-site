# Настройка Cloudflare Worker

Cloudflare Worker используется для безопасной обработки заказов и отправки уведомлений в Telegram.

### 1. Подготовка Telegram Бота
1.  Найдите [@BotFather](https://t.me/botfather) в Telegram.
2.  Создайте нового бота (`/newbot`) и получите **API Token**.
3.  Напишите что-нибудь своему боту.
4.  Узнайте свой **Chat ID** (через [@userinfobot](https://t.me/userinfobot) или вызвав `https://api.telegram.org/bot<TOKEN>/getUpdates`).

### 2. Деплой Воркера
1.  Перейдите в папку `worker/` вашего проекта.
2.  Установите Wrangler: `npm install -g wrangler`.
3.  Авторизуйтесь: `wrangler login`.
4.  Опубликуйте воркер: `wrangler deploy`.

### 3. Настройка Секретов (Secrets)
В консоли Cloudflare (или через терминал) добавьте необходимые секреты:
```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

### 4. Интеграция с Фронтендом
После деплоя вы получите URL вида `https://freestyle-store-worker.ваше-имя.workers.dev`. 
Вставьте этот URL в поле `NEXT_PUBLIC_WORKER_URL` вашего файла `.env.local`.
