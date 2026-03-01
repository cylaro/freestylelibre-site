import type { Metadata } from "next";
import Link from "next/link";
import { buildSeoMetadata, SEO_SITE_NAME, SEO_SITE_URL } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Доставка и оплата сенсоров FreeStyle Libre",
  description:
    "Условия доставки и оплаты сенсоров FreeStyle Libre 2 RU/EU и 3 Plus. Самовывоз, доставка по России и поддержка после заказа.",
  path: "/dostavka-i-oplata",
  keywords: [
    "доставка freestyle libre",
    "оплата libre 2",
    "оплата libre 3 plus",
    "заказать сенсоры freestyle libre",
    "самовывоз сенсоров",
  ],
});

export default function DeliveryAndPaymentPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Доставка и оплата сенсоров FreeStyle Libre",
    provider: {
      "@type": "Organization",
      name: SEO_SITE_NAME,
      url: SEO_SITE_URL,
    },
    areaServed: "RU",
    serviceType: "Продажа и доставка сенсоров мониторинга глюкозы",
    url: `${SEO_SITE_URL}/dostavka-i-oplata`,
  };

  return (
    <main className="min-h-screen pt-28 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="container max-w-4xl">
        <div className="glass-panel-strong rounded-[2rem] p-6 sm:p-9 space-y-8">
          <header className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Информация</p>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">Доставка и оплата</h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Здесь собраны понятные условия покупки сенсоров FreeStyle Libre: как оформить заказ, какие есть
              варианты получения и что нужно для быстрой обработки заявки.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Варианты получения заказа</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2 leading-relaxed">
              <li>Самовывоз: доступен по согласованию.</li>
              <li>Доставка: отправка по России через доступные службы доставки.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Как проходит оформление</h2>
            <ol className="list-decimal pl-5 text-muted-foreground space-y-2 leading-relaxed">
              <li>Выберите модель сенсора в каталоге.</li>
              <li>Добавьте товар в корзину и заполните контактные данные.</li>
              <li>Укажите способ получения: самовывоз или доставка.</li>
              <li>После подтверждения заказа вы получите обратную связь.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Что ускоряет обработку заказа</h2>
            <p className="text-muted-foreground leading-relaxed">
              Указывайте корректный телефон, Telegram и город для доставки. Это сокращает время согласования
              и помогает быстрее передать заказ в работу.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black">Быстрые переходы</h2>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/#catalog" className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold">
                Открыть каталог
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
