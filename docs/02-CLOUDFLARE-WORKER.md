# Настройка Cloudflare Worker

Worker отвечает за безопасное создание заказов, админ-действия и Telegram.

## 1) Подготовка Telegram
1. Создайте бота у **@BotFather** → получите **Bot API Token**.
2. Напишите что-нибудь боту.
3. Узнайте свой **Chat ID** через **@userinfobot**.

## 2) Подготовка Worker (wrangler)
1. Перейдите в папку `worker/`.
2. Установите Wrangler:
   ```bash
   npm install -g wrangler
   ```
3. Авторизуйтесь:
   ```bash
   wrangler login
   ```
4. Проверьте `wrangler.json` и замените `FIREBASE_PROJECT_ID` на ваш ID проекта.
5. Добавьте `FIREBASE_WEB_API_KEY` (Web API Key из Firebase Console → Project settings → General).

Переменные окружения (vars):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_WEB_API_KEY`

## 3) Secrets (обязательно)
Worker использует сервисный аккаунт Firebase и секреты Telegram.
```bash
wrangler secret put FIREBASE_SERVICE_ACCOUNT
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

Где взять `FIREBASE_SERVICE_ACCOUNT`:
- Firebase Console → **Project settings → Service accounts → Generate new private key**.
- Скопируйте весь JSON в одну строку и вставьте в `wrangler secret put FIREBASE_SERVICE_ACCOUNT`.

## 4) Деплой
```bash
wrangler deploy
```
После деплоя получите URL воркера вида:
```
https://freestyle-store-worker.<your>.workers.dev
```

## 5) Интеграция с фронтом
Добавьте URL воркера в `.env.local`:
```env
NEXT_PUBLIC_WORKER_URL=https://freestyle-store-worker.<your>.workers.dev
```

## 6) Healthcheck
Проверьте:
```
GET /api/health
```
Ответ должен быть `{ "status": "ok" }`.
