# Деплой Frontend на GitHub Pages (пошагово через интерфейс)

Инструкция для репозитория `cylaro/freestylelibre-site`.

## 1) Проверить workflow файл
В репозитории должен быть файл:

`/.github/workflows/pages.yml`

Он уже настроен. В нем используется секрет `NEXT_PUBLIC_API_BASE_URL` (не `NEXT_PUBLIC_WORKER_URL`).

## 2) Включить GitHub Pages
1. Откройте `https://github.com/cylaro/freestylelibre-site`.
2. Перейдите `Settings` -> `Pages`.
3. В блоке `Build and deployment` установите:

| Поле в интерфейсе | Что делать |
|---|---|
| `Source` | Выбрать `GitHub Actions`. |
| `Branch` | Оставить неактивным (для Actions не заполняется). |
| `Folder` | Оставить неактивным (для Actions не заполняется). |

## 3) Добавить Repository Secrets
1. Перейдите `Settings` -> `Secrets and variables` -> `Actions`.
2. Нажмите `New repository secret`.
3. Для каждого секрета заполните:
   - `Name`: заполнить точным именем из таблицы.
   - `Secret`: заполнить значением.
4. Нажмите `Add secret`.
5. Повторить для всех секретов.

| Name | Secret (что вставить) | Оставить/заполнить |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Значение из Firebase Web App `apiKey`. | Заполнить |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Значение `authDomain`. | Заполнить |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Значение `projectId`. | Заполнить |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Значение `storageBucket`. | Заполнить |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Значение `messagingSenderId`. | Заполнить |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Значение `appId`. | Заполнить |
| `NEXT_PUBLIC_API_BASE_URL` | URL Netlify API, пример `https://freestylelibre-api.netlify.app`. | Заполнить |
| `NEXT_PUBLIC_SITE_URL` | URL сайта на Pages, пример `https://cylaro.github.io/orchids-freestyle-libre-shop/`. | Заполнить |

## 4) Запустить деплой
1. Перейдите во вкладку `Actions`.
2. Откройте workflow `Deploy to GitHub Pages`.
3. Нажмите `Run workflow`.
4. Поле `Use workflow from`:
   - заполнить: `main`.
5. Нажмите `Run workflow`.

Альтернатива:
- просто сделать `git push` в `main`, workflow стартует автоматически.

## 5) Проверка результата
1. Откройте `Settings` -> `Pages`.
2. Вверху будет `Your site is live at ...` с итоговым URL.
3. Проверьте:
   - открывается главная страница;
   - работает каталог;
   - оформляется заказ (запрос идет в Netlify API);
   - `/account` и `/admin` работают после входа.

## 6) Частые ошибки по полям
| Симптом | Что проверить |
|---|---|
| В Actions ошибка про env | Опечатка в `Name` секрета. Имя должно совпадать 1:1. |
| Каталог пустой/ошибка API | Неверный `NEXT_PUBLIC_API_BASE_URL`. |
| 401/403 с API | В Netlify не добавлены Firebase/Telegram переменные или неверный `ALLOWED_ORIGINS`. |
| Белый экран после деплоя | Проверьте логи workflow `Deploy to GitHub Pages`. |
