# Настройка Firebase (пошагово через интерфейс)

Пошаговая инструкция для Firebase Auth + Firestore.

## 1) Создание проекта
1. Откройте `https://console.firebase.google.com`.
2. Нажмите `Add project`.
3. Поля на экране:

| Поле | Что делать |
|---|---|
| `Project name` | Заполнить, например `fslibre-834ff`. |
| `Enable Google Analytics for this project` | Можно выключить (`Off`). |
| `Google Analytics account` | Если Analytics выключен, оставить как есть. |

4. Нажмите `Create project`.

## 2) Authentication (Email/Password)
1. В левом меню: `Build` -> `Authentication`.
2. Нажмите `Get started`.
3. Вкладка `Sign-in method`.
4. Выберите `Email/Password`.
5. Переключатель `Enable` -> `On`.
6. Поле `Email link (passwordless sign-in)` -> оставить `Off`.
7. Нажмите `Save`.

## 3) Firestore Database
1. В левом меню: `Build` -> `Firestore Database`.
2. Нажмите `Create database`.
3. Поля на экране:

| Поле | Что делать |
|---|---|
| `Choose Cloud Firestore security rules` | Выбрать `Start in production mode`. |
| `Cloud Firestore location` | Выбрать ближайший регион, например `europe-west1`. |

4. Нажмите `Enable`.

## 4) Firestore Rules и Indexes
1. Откройте `Firestore Database` -> вкладка `Rules`.
2. Вставьте содержимое файла `firestore.rules`.
3. Нажмите `Publish`.
4. Откройте вкладку `Indexes`.
5. Добавьте индексы из `firestore.indexes.json` (через UI или CLI).

## 5) Регистрация Web App и получение `firebaseConfig`
1. В `Project Overview` нажмите иконку `</>` (Add app -> Web).
2. Поля на экране:

| Поле | Что делать |
|---|---|
| `App nickname` | Заполнить, например `freestylelibre-site`. |
| `Also set up Firebase Hosting for this app` | Оставить `Off` (не требуется). |

3. Нажмите `Register app`.
4. Скопируйте объект `firebaseConfig`.
5. Поля из `firebaseConfig`, которые нужно перенести в GitHub Secrets:

| Поле в `firebaseConfig` | В какой secret записать |
|---|---|
| `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` |

## 6) Назначение администратора
1. Зарегистрируйтесь в приложении обычным пользователем.
2. В Firestore создайте документ `admins/{uid}`.
3. Либо установите `users/{uid}.isAdmin = true`.
4. Перелогиньтесь, после этого должен открыться `/admin`.

## 7) Инициализация данных (Seed)
1. Войдите в админку.
2. Нажмите кнопку `Инициализировать БД (Seed)`.
3. Проверьте в Firestore, что появились товары, `settings/config`, отзывы.

## 8) Service Account для Netlify API
1. В Firebase нажмите шестеренку `Project settings`.
2. Откройте вкладку `Service accounts`.
3. Блок `Firebase Admin SDK`.
4. Нажмите `Generate new private key` -> `Generate key`.
5. Скачанный JSON используйте в Netlify переменной:
   - `Key`: `FIREBASE_SERVICE_ACCOUNT`
   - `Value`: полный JSON целиком.

Детальный Netlify шаг с полями: `docs/02-NETLIFY-API.md`.
