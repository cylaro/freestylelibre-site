# Добавление сайта в Google и Яндекс

Этот чек-лист нужен, чтобы сайт начал индексироваться поисковиками.

## 1) Проверь базу (уже сделано в проекте)

- `robots.txt` генерируется из `src/app/robots.ts`
- `sitemap.xml` генерируется из `src/app/sitemap.ts`
- Главная страница индексируется, приватные страницы (`/admin`, `/account`, `/login`, `/register`) закрыты от индексации

Проверка после деплоя:
- `https://freestylelibre.pro/robots.txt`
- `https://freestylelibre.pro/sitemap.xml`

## 2) Google Search Console

1. Открой: `https://search.google.com/search-console`
2. Добавь ресурс типа `Префикс URL`: `https://freestylelibre.pro/`
3. Выбери способ подтверждения `HTML-тег`
4. Скопируй значение `content` из тега verification
5. Добавь переменную окружения на сборке:
   - `GOOGLE_SITE_VERIFICATION=...`
   - или `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...`
6. Пересобери и задеплой сайт
7. Нажми `Подтвердить` в Search Console
8. В разделе `Файлы Sitemap` отправь: `https://freestylelibre.pro/sitemap.xml`

## 3) Яндекс Вебмастер

1. Открой: `https://webmaster.yandex.ru/`
2. Добавь сайт: `https://freestylelibre.pro/`
3. Выбери подтверждение через `meta-тег`
4. Скопируй verification-код
5. Добавь переменную окружения на сборке:
   - `YANDEX_VERIFICATION=...`
   - или `NEXT_PUBLIC_YANDEX_VERIFICATION=...`
6. Пересобери и задеплой сайт
7. Нажми `Проверить` в Вебмастере
8. Добавь sitemap: `https://freestylelibre.pro/sitemap.xml`

## 4) Важные условия

- Сайт должен открываться без ошибок по HTTPS
- Домен должен отдавать один канонический адрес (без дублей)
- После первого добавления индексация может занять от нескольких дней до нескольких недель

## 5) Быстрая проверка после релиза

1. Открой исходник страницы и проверь наличие `google-site-verification` / `yandex-verification`
2. Проверь, что `robots.txt` и `sitemap.xml` доступны
3. В Search Console и Яндекс Вебмастере отправь главную страницу на переобход
