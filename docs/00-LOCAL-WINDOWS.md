# Локальный запуск на Windows 11

## 1) Требования
- Node.js 20 LTS
- npm
- Git

## 2) Установка
```bash
npm install
```

## 3) `.env.local`
Создайте файл `.env.local` в корне:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Основной URL API (Netlify Functions)
NEXT_PUBLIC_API_BASE_URL=https://api.freestylelibre.pro

# Опциональный fallback URL API
NEXT_PUBLIC_API_FALLBACK_URL=

# Публичный URL сайта
NEXT_PUBLIC_SITE_URL=https://freestylelibre.pro
```

Важно:
- В `.env.local` не хранить приватные ключи Firebase service account и Telegram токен.
- Эти секреты хранятся только в Netlify Environment Variables.

## 4) Запуск
```bash
npm run dev
```
Откройте `http://localhost:3000`.

## 5) Проверка перед пушем
```bash
npm run lint
npm run typecheck
npm run build
```

## 6) Быстрая диагностика
- Каталог/настройки не грузятся: проверьте `NEXT_PUBLIC_API_BASE_URL` и `GET /api/health`.
- Ошибки входа: проверьте `NEXT_PUBLIC_FIREBASE_*`.
- Ошибки CORS: в Netlify функция должна отвечать с CORS заголовками на `OPTIONS` и `POST/GET`.
