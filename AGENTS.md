## Project Summary
Сайт по продаже сенсоров мониторинга глюкозы FreeStyle Libre (2 RU/EU, 3 Plus). Современный лендинг с личным кабинетом, системой лояльности (VIP статусы) и полноценной админ-панелью. Реализован на Next.js и Firebase для безопасности и масштабируемости.

## Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Lucide React, Framer Motion, AOS (анимации), Chart.js.
- **Backend/DB**: Firebase Auth (авторизация), Firestore (БД), Firebase Storage (изображения), Firebase Functions (уведомления).
- **Integrations**: Telegram Bot API (уведомления о заказах), Google Analytics.

## Architecture
- `src/app`: Маршрутизация (Landing, /account, /admin).
- `src/components`: Модульные UI-компоненты (Hero, Catalog, Navbar, etc.).
- `src/contexts`: Состояние авторизации и корзины.
- `src/lib`: Инициализация Firebase и утилиты.
- `functions`: Облачные функции для бэкенд-логики.

## User Preferences
- Современный дизайн с элементами glassmorphism.
- Темная и светлая темы.
- Адаптивность под мобильные устройства.
- Динамические формы заказа (настраиваются из админки).

## Project Guidelines
- Использовать функциональные компоненты React и хуки.
- Безопасность: все данные пользователей хранятся в Firestore и защищены правилами доступа.
- Код должен быть чистым и типизированным (TypeScript).

## Common Patterns
- Использование Context API для глобального состояния.
- Реактивное обновление данных через onSnapshot (Firestore).
- Валидация форм на клиенте и сервере.
