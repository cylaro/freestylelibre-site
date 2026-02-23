# Настройка Netlify API (пошагово через интерфейс)

Ниже инструкция с реальными названиями пунктов в Netlify UI.

## 1) Подключить репозиторий API к Netlify
1. Откройте `https://app.netlify.com`.
2. Нажмите `Add new project` -> `Import an existing project`.
3. В блоке `Deploy with GitHub` нажмите `GitHub` и выберите репозиторий `cylaro/freestylelibre-api`.
4. На экране `Review configuration for freestylelibre-api` заполните поля так:

| Поле в интерфейсе | Что делать |
|---|---|
| `Owner` | Оставить как есть (ваша команда/аккаунт Netlify). |
| `Branch to deploy` | Заполнить: `main`. |
| `Base directory` | Оставить пустым. |
| `Package directory` | Оставить пустым. |
| `Build command` | Оставить пустым. |
| `Publish directory` | Оставить пустым. |
| `Functions directory` (если поле видно) | Заполнить: `netlify/functions`. |
| `Environment variables` (на этом шаге) | Можно оставить пустым, добавим после первого деплоя. |

5. Нажмите `Deploy freestylelibre-api`.

Важно:
- Для этого API не нужен `publish directory`.
- Для этого API не нужен `build command`.
- Конфигурация берется из `netlify.toml`.

## 2) Добавить переменные окружения в Netlify
1. Откройте сайт `freestylelibre-api` в Netlify.
2. Перейдите: `Site configuration` -> `Environment variables`.
3. Нажмите `Add a variable`.
4. Для каждой переменной заполните:
   - `Key`: заполнить точным именем из таблицы.
   - `Value`: заполнить значением.
   - `Scopes`: оставить `All scopes` (по умолчанию).
5. Нажмите `Create variable`.

| Key | Value (что вставить) | Оставить/заполнить |
|---|---|---|
| `FIREBASE_PROJECT_ID` | ID Firebase проекта (например `fslibre-834ff`). | Заполнить |
| `FIREBASE_SERVICE_ACCOUNT` | Полный JSON сервисного аккаунта Firebase (целиком). | Заполнить |
| `TELEGRAM_BOT_TOKEN` | Токен от `@BotFather`. | Заполнить |
| `TELEGRAM_CHAT_ID` | Chat ID для уведомлений. | Заполнить |
| `ALLOWED_ORIGINS` | Origins через запятую, пример: `https://cylaro.github.io,https://example.com` | Заполнить |

Правило для `ALLOWED_ORIGINS`:
- Указывать только origin (схема + домен), без пути.
- Пример правильно: `https://cylaro.github.io`
- Пример неправильно: `https://cylaro.github.io/orchids-freestyle-libre-shop/`

## 3) Где взять `FIREBASE_SERVICE_ACCOUNT`
1. Откройте Firebase Console -> ваш проект.
2. Нажмите шестеренку `Project settings`.
3. Вкладка `Service accounts`.
4. Блок `Firebase Admin SDK`.
5. Нажмите `Generate new private key` -> `Generate key`.
6. Скачанный JSON откройте и скопируйте полностью в Netlify переменную `FIREBASE_SERVICE_ACCOUNT`.

## 4) Перезапустить деплой после переменных
1. Перейдите во вкладку `Deploys`.
2. Нажмите `Trigger deploy`.
3. Выберите `Deploy site`.

## 5) Проверка API
1. Откройте: `https://<ваш-site>.netlify.app/api/health`
2. Должен вернуться JSON:
```json
{ "status": "ok" }
```

## 6) Что поставить на фронтенде
В репозитории `freestylelibre-site` в GitHub Secrets добавьте:

`NEXT_PUBLIC_API_BASE_URL=https://<ваш-site>.netlify.app`

Подробно по GitHub интерфейсу: `docs/04-GITHUB-PAGES-DEPLOY.md`.
