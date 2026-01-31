## Project Summary
Сайт по продаже сенсоров мониторинга глюкозы FreeStyle Libre (2 RU/EU, 3 Plus). Современный лендинг с личным кабинетом, системой лояльности (VIP статусы) и полноценной админ-панелью. Реализован на Next.js и Firebase для безопасности и масштабируемости. Статически экспортируемый для GitHub Pages.

## Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Lucide React, Framer Motion, Chart.js.
- **Backend/DB**: Firebase Auth (авторизация), Firestore (БД), Firebase Storage (изображения).
- **Serverless**: Cloudflare Worker (обработка заказов, Telegram API).
- **Integrations**: Telegram Bot API (уведомления о заказах).

## Architecture
- `src/app`: Маршрутизация (Landing, /account, /admin).
- `src/components`: Модульные UI-компоненты (Hero, Catalog, Navbar, etc.).
- `src/contexts`: Состояние авторизации и корзины.
- `src/lib`: Инициализация Firebase и утилиты.
- `worker`: Исходный код Cloudflare Worker.
- `docs`: Подробная документация по развертыванию.

## User Preferences
- Современный дизайн "liquid glass" с элементами glassmorphism.
- Темная и светлая темы (без мерцаний).
- Адаптивность под мобильные устройства (320px - 1440px).
- Динамические формы заказа (настраиваются из админки).

## Project Guidelines
- Использовать функциональные компоненты React и хуки.
- Безопасность: прямая запись в заказы запрещена (через Worker), строгие правила Firestore.
- Анимации только через Framer Motion.
- Статический экспорт (`output: export`).

## Common Patterns
- Использование Context API для глобального состояния.
- Реактивное обновление данных через onSnapshot (Firestore).
- Валидация форм через react-hook-form + zod (на фронте) и в Worker.
- Нормализация данных (телефоны, цены) перед сохранением.
