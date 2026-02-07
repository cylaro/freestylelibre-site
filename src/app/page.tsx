"use client";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Advantages } from "@/components/Advantages";
import { Catalog } from "@/components/Catalog";
import { Guide } from "@/components/Guide";
import { FAQ } from "@/components/FAQ";
import { Reviews } from "@/components/Reviews";
import { Footer } from "@/components/Footer";
import { CartSheet } from "@/components/CartSheet";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useEffect, useMemo } from "react";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const reduceMotion = useReducedMotion();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freestyle-libre-shop.github.io";
  const jsonLd = useMemo(() => ({
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
  }), [siteUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }, [reduceMotion]);

  return (
    <main className="min-h-screen selection:bg-primary/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left"
        style={{ scaleX }}
      />
      
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
