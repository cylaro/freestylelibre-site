import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Advantages } from "@/components/Advantages";
import { Catalog } from "@/components/Catalog";
import { Guide } from "@/components/Guide";
import { FAQ } from "@/components/FAQ";
import { Reviews } from "@/components/Reviews";
import { Footer } from "@/components/Footer";
import { CartSheet } from "@/components/CartSheet";
import { HomeClientFx } from "@/components/HomeClientFx";

export default function Home() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freestylelibre.pro";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "FreeStyle Store",
        url: siteUrl,
        sameAs: ["https://t.me/scheglovvrn"],
      },
      {
        "@type": "WebSite",
        name: "FreeStyle Store",
        url: siteUrl,
      },
    ],
  };

  return (
    <main id="main-content" className="min-h-screen selection:bg-primary/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClientFx />
      
      <Navbar />
      
      <Hero />
      <Advantages />
      <Catalog />
      <Guide />
      <Reviews />
      <FAQ />

      <Footer />
      <CartSheet />
    </main>
  );
}
