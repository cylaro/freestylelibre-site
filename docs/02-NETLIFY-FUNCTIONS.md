# Настройка Netlify Functions API

Этот проект использует единый backend API:
- код: `netlify/functions/api.ts`
- endpoint в проде: `https://api.freestylelibre.pro/api/*`

## 1) Создать Netlify site для API
1. Откройте Netlify и нажмите **Add new site**.
2. Подключите репозиторий проекта.
3. Build command: можно оставить пустым.
4. Publish directory: можно оставить пустым.
5. Убедитесь, что в корне есть `netlify.toml`.

Netlify будет раздавать функцию по адресу `/.netlify/functions/api/*`, а `netlify.toml` сделает rewrite с `/api/*`.

## 2) Переменные окружения в Netlify
В `Site settings -> Environment variables` добавьте:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_WEB_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Примечания:
- `FIREBASE_SERVICE_ACCOUNT` вставляется как JSON целиком (одной строкой).
- Никакие секреты не должны попадать в `NEXT_PUBLIC_*`.

## 3) Деплой API
После коммита в ветку, подключенную к Netlify, Netlify сам задеплоит функцию.

Проверка:
```bash
curl https://api.freestylelibre.pro/api/health
```
Ожидаемый ответ:
```json
{"status":"ok"}
```

## 4) CORS
API уже отдает CORS заголовки для методов:
- `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`

Это нужно для фронтенда на GitHub Pages.

## 5) Telegram тест
1. В админке откройте вкладку статусов.
2. Нажмите **Тестовое сообщение**.
3. Если ошибка, проверьте `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, и что чат с ботом начат.

## 6) Rollback API
Варианты:
1. В Netlify откройте **Deploys** и выберите предыдущий успешный deploy -> **Publish deploy**.
2. Или откатите коммит в GitHub (`git revert`) и дождитесь нового deploy в Netlify.

После rollback снова проверьте `GET /api/health` и создание тестового заказа.
