# Деплой на GitHub Pages (Frontend)

Этот документ описывает публикацию **фронтенда** (Next.js static export).  
API и Firebase настраиваются отдельно.

## 0) Что куда деплоится
- Frontend (Next.js static export) → GitHub Pages.
- API (Netlify Functions) → Netlify (см. `docs/02-NETLIFY-API.md`).
- Firebase → остается в Firebase (см. `docs/01-FIREBASE-SETUP.md`).

Перед деплоем фронтенда нужен URL API, чтобы заполнить `NEXT_PUBLIC_API_BASE_URL`.

## 1) Создать репозиторий и запушить код
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

## 2) Включить GitHub Pages (Actions)
1. Откройте репозиторий → **Settings → Pages**.
2. В **Build and deployment → Source** выберите **GitHub Actions**.

## 3) Workflow для деплоя
Создайте файл `.github/workflows/pages.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## 4) Secrets для сборки
В **Settings → Secrets and variables → Actions** добавьте:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`

Пример:
- `NEXT_PUBLIC_API_BASE_URL=https://freestylelibre-api.netlify.app`
- `NEXT_PUBLIC_SITE_URL=https://<user>.github.io/<repo>/`

## 5) Base path (если репозиторий НЕ user.github.io)
Если URL будет `https://<user>.github.io/<repo>/`, нужно добавить basePath и assetPrefix:
```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/<repo>",
  assetPrefix: "/<repo>/",
  // остальные настройки
};
```

Если у вас `https://<user>.github.io/`, basePath не нужен.

## 6) Локальная проверка (необязательно, но полезно)
```bash
npm ci
npm run build
```
После сборки появится папка `out/`.

## 7) Деплой
Каждый `git push` в `main` запускает GitHub Actions и публикует сайт.  
Статус и URL страницы смотрите в **Settings → Pages**.

## 8) Секреты и файлы, которые нельзя коммитить
В проекте есть файлы, которые **нельзя** класть в публичный репозиторий:
- `.env.local` (локальные переменные)
- любые файлы с приватными ключами или токенами

Рекомендации:
- Добавьте в `.gitignore` (если еще нет):
  - `.env.local`
  - `.env.*`
- Секреты для API задавайте в Netlify Environment Variables.
- Публичные ключи Firebase (`NEXT_PUBLIC_*`) храните в GitHub Secrets.

## 8) Кастомный домен (опционально)
1. **Settings → Pages → Custom domain** → укажите домен.
2. В DNS домена:
   - CNAME → `<user>.github.io`
3. Обновите `NEXT_PUBLIC_SITE_URL` под новый домен.

Подсказка: чтобы домен не слетал после пушей, можно создать `public/CNAME`
и записать туда домен, например:
```
example.com
```

## 9) Типичные ошибки
- **Битые пути к статике** → не настроен `basePath/assetPrefix`.
- **Не грузятся данные** → неверный `NEXT_PUBLIC_API_BASE_URL` или не задеплоен API.
- **Белый экран** → смотри консоль и логи GitHub Actions.
