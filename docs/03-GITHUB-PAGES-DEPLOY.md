# Деплой на GitHub Pages

Инструкция по публикации фронтенда.

### 1. Подготовка репозитория
1.  Создайте новый публичный репозиторий на GitHub.
2.  Загрузите ваш код:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/ваш-логин/ваш-репо.git
    git push -u origin main
    ```

### 2. Настройка GitHub Actions
Проект уже настроен для статического экспорта (`output: export`).
1.  Перейдите в **Settings > Pages**.
2.  В разделе **Build and deployment > Source** выберите **GitHub Actions**.
3.  GitHub автоматически предложит шаблон для Next.js. Подтвердите создание файла `.github/workflows/nextjs.yml`.

### 3. Переменные окружения в CI/CD
Для того чтобы сборка прошла успешно, добавьте ключи Firebase в **Settings > Secrets and variables > Actions**:
Создайте секреты для каждого поля из `.env.local` (например, `NEXT_PUBLIC_FIREBASE_API_KEY` и т.д.).

### 4. Проверка
После успешного выполнения Action, ваш сайт будет доступен по адресу `https://ваш-логин.github.io/ваш-репо/`.
