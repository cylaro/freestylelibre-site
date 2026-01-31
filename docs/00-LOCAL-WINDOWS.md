# Локальный запуск на Windows 11

Инструкция по развертыванию проекта в локальной среде.

### 1. Предварительные требования
*   **Node.js**: Версия 18 или выше.
*   **npm**: Поставляется вместе с Node.js.
*   **Git**: Для клонирования репозитория.

### 2. Установка зависимостей
Откройте терминал в папке проекта и выполните:
```bash
npm install
```

### 3. Настройка переменных окружения
Создайте файл `.env.local` в корне проекта и добавьте туда ключи от Firebase и URL вашего Worker'а:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=ваш_ключ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ваш_домен
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ваш_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ваш_бакет
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=ваш_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=ваш_app_id

# URL развернутого Cloudflare Worker
NEXT_PUBLIC_WORKER_URL=https://имя-вашего-воркера.workers.dev
```

### 4. Запуск проекта
Для запуска в режиме разработки:
```bash
npm run dev
```
Сайт будет доступен по адресу: `http://localhost:3000`

### 5. Сборка для GitHub Pages
Для проверки статической сборки (output: export):
```bash
npm run build
```
Результат будет находиться в папке `out/`.
