import type { Metadata } from "next";
import Link from "next/link";
import { buildSeoMetadata, SEO_SITE_NAME, SEO_SITE_URL } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "FreeStyle Libre 2 RU/EU: купить оригинальный сенсор",
  description:
    "FreeStyle Libre 2 RU/EU: оригинальные сенсоры для непрерывного мониторинга глюкозы. Подбор версии, консультация и быстрая доставка по России.",
  path: "/freestyle-libre-2-ru-eu",
  keywords: [
    "freestyle libre 2 ru купить",
    "freestyle libre 2 eu купить",
    "сенсор libre 2",
    "датчик глюкозы libre 2",
    "мониторинг глюкозы libre 2",
  ],
});

export default function Libre2Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "FreeStyle Libre 2 RU/EU",
    brand: {
      "@type": "Brand",
      name: "Abbott",
    },
    category: "Continuous Glucose Monitoring Sensor",
    description:
      "Сенсор FreeStyle Libre 2 RU/EU для непрерывного мониторинга глюкозы без постоянных проколов пальца.",
    url: `${SEO_SITE_URL}/freestyle-libre-2-ru-eu`,
    seller: {
      "@type": "Organization",
      name: SEO_SITE_NAME,
      url: SEO_SITE_URL,
    },
  };

  return (
    <main className="min-h-screen pt-28 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="container max-w-4xl">
        <div className="glass-panel-strong rounded-[2rem] p-6 sm:p-9 space-y-8">
          <header className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Модель</p>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">FreeStyle Libre 2 RU/EU</h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              На этой странице собрана ключевая информация по сенсору FreeStyle Libre 2 RU/EU:
              кому подходит модель, чем она отличается, как выбрать нужную версию и где безопасно купить
              оригинальный датчик.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Кому подходит Libre 2</h2>
            <p className="text-muted-foreground leading-relaxed">
              Libre 2 подходит людям с диабетом 1 и 2 типа, которые хотят видеть тренд сахара в течение дня
              и принимать решения быстрее. Сенсор помогает снизить число рутинных проколов и держать контроль
              в повседневной жизни, на работе и в поездках.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">RU и EU версия: что важно перед покупкой</h2>
            <p className="text-muted-foreground leading-relaxed">
              Важно выбрать совместимую версию сенсора под ваш сценарий использования. Перед заказом лучше
              проверить, каким приложением вы пользуетесь и какой формат вам нужен именно сейчас. Если есть
              сомнения, сначала уточните совместимость, чтобы не потерять время.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Что получает покупатель</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2 leading-relaxed">
              <li>Оригинальный сенсор FreeStyle Libre 2 RU/EU.</li>
              <li>Понятная консультация перед оформлением заказа.</li>
              <li>Поддержка по установке и запуску после покупки.</li>
              <li>Доставка по России и самовывоз по доступности.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Где купить FreeStyle Libre 2 RU/EU</h2>
            <p className="text-muted-foreground leading-relaxed">
              Актуальные модели и наличие доступны в каталоге магазина. Для быстрого выбора переходите в каталог
              и выберите подходящий вариант Libre 2.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/#catalog" className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold">
                Перейти в каталог
              </Link>
              <Link href="/dostavka-i-oplata" className="rounded-xl border px-5 py-2.5 font-semibold">
                Доставка и оплата
              </Link>
              <Link href="/freestyle-libre-voronezh" className="rounded-xl border px-5 py-2.5 font-semibold">
                Libre в Воронеже
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
