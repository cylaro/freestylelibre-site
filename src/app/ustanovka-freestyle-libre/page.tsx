import type { Metadata } from "next";
import Link from "next/link";
import { buildSeoMetadata, SEO_SITE_URL } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Как установить сенсор FreeStyle Libre: пошаговая инструкция",
  description:
    "Пошаговая инструкция по установке сенсора FreeStyle Libre. Подготовка, установка, активация и старт работы без лишних ошибок.",
  path: "/ustanovka-freestyle-libre",
  keywords: [
    "как установить freestyle libre",
    "инструкция libre 2",
    "инструкция libre 3 plus",
    "установка сенсора глюкозы",
    "активация сенсора libre",
  ],
});

export default function LibreInstallGuidePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Как установить сенсор FreeStyle Libre",
    totalTime: "PT15M",
    step: [
      {
        "@type": "HowToStep",
        name: "Подготовка кожи",
        text: "Выберите зону установки и обработайте кожу перед установкой.",
      },
      {
        "@type": "HowToStep",
        name: "Подготовка аппликатора",
        text: "Соберите аппликатор в соответствии с инструкцией к сенсору.",
      },
      {
        "@type": "HowToStep",
        name: "Установка сенсора",
        text: "Установите сенсор аккуратным нажатием и проверьте фиксацию.",
      },
      {
        "@type": "HowToStep",
        name: "Активация",
        text: "Активируйте сенсор через приложение и дождитесь готовности.",
      },
    ],
    url: `${SEO_SITE_URL}/ustanovka-freestyle-libre`,
  };

  return (
    <main className="min-h-screen pt-28 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="container max-w-4xl">
        <div className="glass-panel-strong rounded-[2rem] p-6 sm:p-9 space-y-8">
          <header className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Гайд</p>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">Как установить сенсор FreeStyle Libre</h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Ниже простая и понятная инструкция по установке сенсора FreeStyle Libre. Выполняйте шаги по порядку,
              чтобы запуск прошел спокойно и без лишней спешки.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Шаг 1. Подготовка</h2>
            <p className="text-muted-foreground leading-relaxed">
              Выберите рекомендованную зону установки и заранее подготовьте все, что нужно для старта.
              Аккуратная подготовка снижает риск ошибок на следующих шагах.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Шаг 2. Сборка аппликатора</h2>
            <p className="text-muted-foreground leading-relaxed">
              Соберите аппликатор по инструкции к конкретной модели. Убедитесь, что все элементы
              установлены правильно, без лишнего давления и резких движений.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Шаг 3. Установка сенсора</h2>
            <p className="text-muted-foreground leading-relaxed">
              Установите сенсор точным движением и проверьте, что он надежно зафиксирован.
              После установки старайтесь избегать механической нагрузки на место крепления.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Шаг 4. Активация и запуск</h2>
            <p className="text-muted-foreground leading-relaxed">
              Активируйте сенсор через приложение и дождитесь готовности к работе. После запуска
              проверьте, что показания поступают корректно и без задержек.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Связанные страницы</h2>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/#catalog" className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold">
                Выбрать сенсор
              </Link>
              <Link href="/freestyle-libre-2-ru-eu" className="rounded-xl border px-5 py-2.5 font-semibold">
                Про Libre 2 RU/EU
              </Link>
              <Link href="/freestyle-libre-3-plus" className="rounded-xl border px-5 py-2.5 font-semibold">
                Про Libre 3 Plus
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
