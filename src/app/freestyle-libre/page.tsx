import type { Metadata } from "next";
import Link from "next/link";
import { buildSeoMetadata, SEO_SITE_NAME, SEO_SITE_URL } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "FreeStyle Libre: купить оригинальные сенсоры",
  description:
    "FreeStyle Libre 2 RU/EU и FreeStyle Libre 3 Plus: оригинальные сенсоры мониторинга глюкозы. Воронеж и доставка по России.",
  path: "/freestyle-libre",
  keywords: [
    "фристайл либре",
    "freestyle libre",
    "купить freestyle libre",
    "сенсоры freestyle libre",
    "freestyle libre 2 и 3 plus",
  ],
});

export default function FreestyleLibrePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "FreeStyle Libre — сенсоры мониторинга глюкозы",
    description:
      "Подбор оригинальных сенсоров FreeStyle Libre 2 RU/EU и FreeStyle Libre 3 Plus с доставкой по России.",
    url: `${SEO_SITE_URL}/freestyle-libre`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [
        { "@type": "ListItem", position: 1, url: `${SEO_SITE_URL}/freestyle-libre-2-ru-eu` },
        { "@type": "ListItem", position: 2, url: `${SEO_SITE_URL}/freestyle-libre-3-plus` },
      ],
    },
    about: {
      "@type": "MedicalDevice",
      name: "FreeStyle Libre",
      manufacturer: "Abbott",
    },
    provider: {
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
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">CGM</p>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">FreeStyle Libre</h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Если вы ищете фристайл либре или freestyle libre, здесь собрана основная информация по моделям,
              покупке и доставке. Это обзорная страница для быстрого выбора между Libre 2 RU/EU и Libre 3 Plus.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Какие модели доступны</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2 leading-relaxed">
              <li>FreeStyle Libre 2 RU/EU</li>
              <li>FreeStyle Libre 3 Plus</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Обе модели помогают контролировать глюкозу в течение дня и строить понятный тренд значений.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Где купить FreeStyle Libre</h2>
            <p className="text-muted-foreground leading-relaxed">
              Выберите сенсор в каталоге, добавьте в корзину и оформите заказ онлайн. Доступен самовывоз
              и доставка по России.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/#catalog" className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold">
                Открыть каталог
              </Link>
              <Link href="/freestyle-libre-voronezh" className="rounded-xl border px-5 py-2.5 font-semibold">
                FreeStyle Libre в Воронеже
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
