# Решение проблем

Список типовых ошибок и способов их решения.

### 1. Ошибки доступа в Firestore (Permission Denied)
*   **Причина**: Правила безопасности запрещают операцию.
*   **Решение**: Проверьте, что вы загрузили `firestore.rules` в консоль Firebase. Убедитесь, что ваш пользователь имеет поле `isAdmin: true` для доступа к админке.

### 2. Заказы не приходят в Telegram
*   **Причина**: Неверный `TELEGRAM_BOT_TOKEN` или `TELEGRAM_CHAT_ID` в Netlify Environment Variables.
*   **Решение**: Проверьте переменные в Netlify, затем нажмите тест Telegram в админке.

### 3. Ошибка "API_URL_NOT_SET" или данные не загружаются
*   **Причина**: Не задан `NEXT_PUBLIC_API_BASE_URL`.
*   **Решение**: Добавьте `NEXT_PUBLIC_API_BASE_URL=https://api.freestylelibre.pro` в `.env.local` и GitHub Actions secrets.

### 4. CORS/Network error при запросах к `/api/*`
*   **Причина**: API-домен неверный или функция не задеплоена.
*   **Решение**: Проверьте `https://api.freestylelibre.pro/api/health` и deploy в Netlify.

### 5. Ошибки сборки (Lint/Type errors)
*   **Причина**: Строгие настройки качества кода.
*   **Решение**: Исправьте все ошибки, на которые указывает терминал. Не используйте `any` там, где это не оправдано.

### 6. Белый экран после деплоя на GitHub Pages
*   **Причина**: Неверный `basePath` в `next.config.ts` (если репозиторий не в корне домена).
*   **Решение**: Если ваш сайт доступен по адресу `username.github.io/repo-name/`, добавьте `basePath: '/repo-name'` в `next.config.ts`.
