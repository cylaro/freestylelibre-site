"use client";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Advantages } from "@/components/Advantages";
import { Catalog } from "@/components/Catalog";
import { Comparison } from "@/components/Comparison";
import { Guide } from "@/components/Guide";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { CartSheet } from "@/components/CartSheet";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Home() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: "ease-out-cubic",
    });
  }, []);

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Advantages />
      <Catalog />
      <Comparison />
      <Guide />
      <FAQ />
      <Footer />
      <CartSheet />
    </main>
  );
}
