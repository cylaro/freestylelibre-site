# Деплой GitHub Pages + Netlify Functions

Схема:
- Frontend (Next.js static export) -> GitHub Pages.
- API (`/api/*`) -> Netlify Functions (`docs/02-NETLIFY-FUNCTIONS.md`).
- Firebase Auth/Firestore -> Firebase.

## 1) Включить GitHub Pages через Actions
1. `Settings -> Pages`.
2. В `Build and deployment -> Source` выбрать `GitHub Actions`.

## 2) Проверить workflow
Файл уже есть: `.github/workflows/pages.yml`.

Он использует переменные:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_FALLBACK_URL` (опционально)
- `NEXT_PUBLIC_SITE_URL`

## 3) Добавить secrets в GitHub
`Settings -> Secrets and variables -> Actions -> New repository secret`

Заполните все `NEXT_PUBLIC_*` переменные из списка выше.

Пример:
- `NEXT_PUBLIC_API_BASE_URL=https://api.freestylelibre.pro`
- `NEXT_PUBLIC_API_FALLBACK_URL=` (пусто, если не нужен)
- `NEXT_PUBLIC_SITE_URL=https://freestylelibre.pro`

## 4) Пуш и деплой
```bash
git add .
git commit -m "deploy"
git push origin main
```

GitHub Action соберет проект и опубликует `out/` в Pages.

## 5) Чеклист после деплоя
1. Открывается главная страница без ошибок в консоли.
2. `GET https://api.freestylelibre.pro/api/health` возвращает `{"status":"ok"}`.
3. Каталог загружается.
4. Вход/регистрация работают.
5. Создание заказа работает.
6. Админка открывается и обновляет статусы/товары.

## 6) Rollback фронтенда
Варианты:
1. Вкладка `Actions` -> выберите последний успешный run и перезапустите его.
2. Или откатите проблемный коммит:
```bash
git revert <commit_sha>
git push origin main
```

## 7) Важно по секретам
- Не коммитить `.env.local`.
- Не коммитить JSON service account.
- Приватные ключи только в Netlify/GitHub secrets.
