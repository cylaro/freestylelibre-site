# Локальный запуск на Windows 11

Подробная инструкция для локальной разработки и проверки статической сборки.

## 1) Требования
- Node.js 18+ (рекомендуется 20 LTS)
- npm (идет вместе с Node.js)
- Git

## 2) Установка
Откройте терминал в папке проекта:
```bash
npm install
```

## 3) Переменные окружения
Создайте файл `.env.local` в корне проекта:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=ваш_ключ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ваш_домен
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ваш_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ваш_бакет
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=ваш_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=ваш_app_id

# URL развернутого Cloudflare Worker
NEXT_PUBLIC_WORKER_URL=https://ваш-воркер.workers.dev

# Базовый URL сайта (для sitemap/SEO)
NEXT_PUBLIC_SITE_URL=https://ваш-домен
```

Важно: в `.env.local` НЕ размещаются секреты Worker (токен Telegram и service account).

## 4) Запуск в dev
```bash
npm run dev
```
Откройте `http://localhost:3000`.

## 5) Проверка качества
```bash
npm run lint
npm run build
```
Сборка должна быть без ошибок. При `output: "export"` будет создана папка `out/`.

## 6) Частые проблемы
- **Пустой каталог / ошибки авторизации**: проверьте `NEXT_PUBLIC_FIREBASE_*`.
- **Оформление заказа не работает**: проверьте `NEXT_PUBLIC_WORKER_URL` и что Worker развернут.
- **CORS/Network ошибки**: убедитесь, что Worker отвечает на `/api/health`.
