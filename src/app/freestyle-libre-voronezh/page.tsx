import type { Metadata } from "next";
import Link from "next/link";
import { buildSeoMetadata, SEO_SITE_NAME, SEO_SITE_URL } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "FreeStyle Libre в Воронеже: купить сенсоры Libre",
  description:
    "Фристайл Либре в Воронеже: FreeStyle Libre 2 RU/EU и 3 Plus. Консультация перед покупкой, самовывоз и доставка.",
  path: "/freestyle-libre-voronezh",
  keywords: [
    "фристайл либре воронеж",
    "либре воронеж",
    "freestyle libre воронеж",
    "freestyle libre voronezh",
    "купить libre воронеж",
  ],
});

export default function FreestyleLibreVoronezhPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SEO_SITE_NAME,
    url: `${SEO_SITE_URL}/freestyle-libre-voronezh`,
    image: `${SEO_SITE_URL}/images/og-default.svg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Воронеж",
      addressCountry: "RU",
    },
    areaServed: ["Воронеж", "Россия"],
    sameAs: ["https://t.me/scheglovvrn"],
    description:
      "Продажа оригинальных сенсоров FreeStyle Libre 2 RU/EU и 3 Plus в Воронеже и с доставкой по России.",
  };

  return (
    <main className="min-h-screen pt-28 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="container max-w-4xl">
        <div className="glass-panel-strong rounded-[2rem] p-6 sm:p-9 space-y-8">
          <header className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Локация</p>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">FreeStyle Libre в Воронеже</h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Страница для запросов фристайл либре воронеж, libre воронеж и freestyle libre voronezh.
              Здесь можно быстро выбрать модель сенсора и оформить заказ с понятными условиями получения.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Что можно заказать</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2 leading-relaxed">
              <li>FreeStyle Libre 2 RU/EU</li>
              <li>FreeStyle Libre 3 Plus</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Как получить заказ в Воронеже</h2>
            <p className="text-muted-foreground leading-relaxed">
              Доступен самовывоз по согласованию. Также можно оформить доставку в Воронеж и в другие города России.
              Перед покупкой можно уточнить совместимость модели и детали по установке.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Быстрые ссылки</h2>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/#catalog" className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold">
                Выбрать сенсор
              </Link>
              <Link href="/dostavka-i-oplata" className="rounded-xl border px-5 py-2.5 font-semibold">
                Доставка и оплата
              </Link>
              <Link href="/freestyle-libre" className="rounded-xl border px-5 py-2.5 font-semibold">
                Все о FreeStyle Libre
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
