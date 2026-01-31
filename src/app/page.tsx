"use client";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Advantages } from "@/components/Advantages";
import { Catalog } from "@/components/Catalog";
import { Guide } from "@/components/Guide";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { CartSheet } from "@/components/CartSheet";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Hero />
      </motion.div>

      <section id="advantages">
        <Advantages />
      </section>

      <section id="catalog">
        <Catalog />
      </section>

      <section id="guide">
        <Guide />
      </section>

      <section id="faq">
        <FAQ />
      </section>

      <section className="py-12 flex justify-center bg-muted/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Button
            size="lg"
            className="rounded-full px-8 h-14 text-lg font-medium gap-3 shadow-lg hover:shadow-primary/20 transition-all duration-300"
            asChild
          >
            <a 
              href="https://t.me/scheglovvrn" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Send className="w-5 h-5" />
              Написать в поддержку в Telegram
            </a>
          </Button>
        </motion.div>
      </section>

      <Footer />
      <CartSheet />
    </main>
  );
}
