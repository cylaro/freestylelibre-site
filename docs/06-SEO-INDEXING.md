# Добавление сайта в поиск (просто и без лишнего)

Ниже самый простой способ: подтверждение через файл.  
Никаких переменных окружения и meta-тегов вручную.

## Что уже сделано в проекте

- `robots.txt` есть: `https://freestylelibre.pro/robots.txt`
- `sitemap.xml` есть: `https://freestylelibre.pro/sitemap.xml`
- приватные разделы (`/admin`, `/account`, `/login`, `/register`) закрыты от индексации

## Google Search Console (через HTML-файл)

1. Открой `https://search.google.com/search-console`.
2. Добавь ресурс `https://freestylelibre.pro/` (тип: префикс URL).
3. Выбери способ подтверждения `HTML-файл`.
4. Скачай файл вида `googlexxxxxxxxxxxx.html`.
5. Положи этот файл в папку `public/` проекта без изменений.
6. Задеплой сайт.
7. Проверь, что файл открывается по адресу  
   `https://freestylelibre.pro/googlexxxxxxxxxxxx.html`
8. Нажми `Подтвердить` в Search Console.
9. В разделе Sitemap отправь `https://freestylelibre.pro/sitemap.xml`.

## Яндекс Вебмастер (через файл)

1. Открой `https://webmaster.yandex.ru/`.
2. Добавь сайт `https://freestylelibre.pro/`.
3. Выбери подтверждение через `HTML-файл`.
4. Скачай/получи файл, который дал Яндекс.
5. Положи этот файл в `public/` без изменений.
6. Задеплой сайт.
7. Проверь, что файл открывается по его URL.
8. Нажми `Проверить` в Яндекс Вебмастере.
9. Добавь sitemap: `https://freestylelibre.pro/sitemap.xml`.

## Короткая самопроверка

1. Открывается `robots.txt`.
2. Открывается `sitemap.xml`.
3. Открываются verification-файлы Google/Яндекс по прямой ссылке.
4. В обеих консолях статус: сайт подтвержден.

## Почему это лучший вариант сейчас

- Минимум действий.
- Ничего не ломается при сборке.
- Не нужно держать verification-коды в env.
