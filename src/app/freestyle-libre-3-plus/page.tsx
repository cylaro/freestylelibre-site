import type { Metadata } from "next";
import Link from "next/link";
import { buildSeoMetadata, SEO_SITE_NAME, SEO_SITE_URL } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "FreeStyle Libre 3 Plus: купить сенсор с доставкой",
  description:
    "FreeStyle Libre 3 Plus: оригинальный сенсор непрерывного мониторинга глюкозы. Подробно о модели, выборе и покупке с доставкой по России.",
  path: "/freestyle-libre-3-plus",
  keywords: [
    "freestyle libre 3 plus купить",
    "сенсор libre 3 plus",
    "датчик libre 3 plus",
    "купить libre 3 plus",
    "cgm freestyle libre 3",
  ],
});

export default function Libre3PlusPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "FreeStyle Libre 3 Plus",
    brand: {
      "@type": "Brand",
      name: "Abbott",
    },
    category: "Continuous Glucose Monitoring Sensor",
    description:
      "FreeStyle Libre 3 Plus для непрерывного мониторинга глюкозы с удобным ежедневным контролем.",
    url: `${SEO_SITE_URL}/freestyle-libre-3-plus`,
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
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">FreeStyle Libre 3 Plus</h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Эта страница создана для тех, кто ищет FreeStyle Libre 3 Plus и хочет быстро понять, подходит ли
              модель под его задачу. Здесь собраны ключевые преимущества и путь к покупке без лишних шагов.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Почему выбирают Libre 3 Plus</h2>
            <p className="text-muted-foreground leading-relaxed">
              Libre 3 Plus выбирают за комфортный повседневный контроль и понятный формат работы с показателями
              глюкозы. Это удобный вариант для тех, кто хочет меньше ручных действий и больше предсказуемости
              в ежедневном режиме.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Перед заказом проверьте</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2 leading-relaxed">
              <li>Совместимость вашего текущего сценария с моделью Libre 3 Plus.</li>
              <li>Нужное количество сенсоров на месяц.</li>
              <li>Способ получения: самовывоз или доставка.</li>
              <li>Контактные данные для быстрой связи по заказу.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Как оформить покупку</h2>
            <p className="text-muted-foreground leading-relaxed">
              Откройте каталог, выберите FreeStyle Libre 3 Plus, добавьте сенсор в корзину и заполните форму
              заказа. После оформления можно получить поддержку по установке и началу использования.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/#catalog" className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold">
                Выбрать в каталоге
              </Link>
              <Link href="/ustanovka-freestyle-libre" className="rounded-xl border px-5 py-2.5 font-semibold">
                Инструкция по установке
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
