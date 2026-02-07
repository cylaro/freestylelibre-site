# Настройка Firebase

Пошаговая инструкция для Firebase Auth + Firestore (Spark/free).

## 1) Создание проекта
1. Откройте Firebase Console и нажмите **Add project**.
2. Назовите проект, Analytics можно отключить.

## 2) Аутентификация (Email/Password)
1. **Build → Authentication → Get started**.
2. Вкладка **Sign-in method** → включите **Email/Password**.

## 3) Firestore Database
1. **Build → Firestore Database → Create database**.
2. Режим: **Production**.
3. Регион: ближайший к РФ, например **europe-west**.

## 4) Правила и индексы
1. Откройте **Firestore → Rules** и вставьте содержимое файла `firestore.rules`.
2. В **Firestore → Indexes** добавьте индексы из файла `firestore.indexes.json`.
   - Можно через Firebase CLI: `firebase deploy --only firestore:indexes`

## 5) Регистрация Web App
1. **Project Overview → </> (Web)**.
2. Скопируйте `firebaseConfig`.
3. Заполните `.env.local` (см. `docs/00-LOCAL-WINDOWS.md`).

## 6) Назначение администратора
1. Зарегистрируйтесь в приложении.
2. В Firestore создайте документ `admins/{uid}` **или** выставьте `users/{uid}.isAdmin = true`.
3. После перезахода появится доступ к `/admin`.

## 7) Инициализация данных (Seed)
1. Зайдите в админку.
2. Нажмите **Инициализировать БД (Seed)**.
3. В Firestore появятся 3 товара, `settings/config` и 2–3 отзыва со статусом `approved`.

## 8) Service Account для Worker
1. **Project settings → Service accounts**.
2. Создайте новый ключ (JSON).
3. Значения из JSON используются в `wrangler secret put` (см. `docs/02-CLOUDFLARE-WORKER.md`).
