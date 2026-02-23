# Настройка Netlify API

API отвечает за безопасное создание заказов, админ-действия и Telegram.

## 1) Подготовка Telegram
1. Создайте бота у **@BotFather** и получите **Bot API Token**.
2. Напишите сообщение боту.
3. Узнайте **Chat ID** через **@userinfobot**.

## 2) Подготовка backend-репозитория
1. Используйте проект `freestylelibre-api`.
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Убедитесь, что в `netlify.toml` указан только каталог функций:
   - `[functions].directory = "netlify/functions"`
   - без `build` и без `publish`.

## 3) Переменные окружения в Netlify
Добавьте в Netlify:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT` (JSON сервисного аккаунта одной строкой)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `ALLOWED_ORIGINS` (через запятую, например `https://site1.com,https://site2.com`)

## 4) Деплой
1. Подключите репозиторий `freestylelibre-api` к Netlify.
2. Включите автодеплой от ветки `main`.
3. После деплоя получите URL:
   ```text
   https://<site>.netlify.app
   ```

## 5) Интеграция с фронтендом
В frontend задайте:
```env
NEXT_PUBLIC_API_BASE_URL=https://<site>.netlify.app
```

## 6) Healthcheck
Проверьте:
```text
GET /api/health
```
Ответ:
```json
{ "status": "ok" }
```
