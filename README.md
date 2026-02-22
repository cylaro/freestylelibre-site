# FreeStyle Store

Статический фронтенд на Next.js + Firebase (Auth/Firestore) + Netlify Functions API.

## Архитектура
- Frontend: GitHub Pages (static export из `out/`).
- API: Netlify Functions (`netlify/functions/api.ts`).
- База и авторизация: Firebase Firestore + Firebase Auth.
- Интеграция уведомлений: Telegram Bot API.

## Локальный запуск
1. `npm install`
2. Создайте `.env.local` (см. `docs/00-LOCAL-WINDOWS.md`).
3. `npm run dev`
4. Проверка качества: `npm run lint && npm run typecheck && npm run build`

## Документация
- `docs/00-LOCAL-WINDOWS.md` — локальная разработка.
- `docs/01-FIREBASE-SETUP.md` — Firebase setup.
- `docs/02-NETLIFY-FUNCTIONS.md` — деплой и конфиг API в Netlify.
- `docs/04-GITHUB-PAGES-DEPLOY.md` — деплой фронтенда в GitHub Pages.
- `docs/05-TROUBLESHOOTING.md` — диагностика типовых проблем.
