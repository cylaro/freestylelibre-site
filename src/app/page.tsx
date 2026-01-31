"use client";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Advantages } from "@/components/Advantages";
import { Catalog } from "@/components/Catalog";
import { Guide } from "@/components/Guide";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { CartSheet } from "@/components/CartSheet";
import { motion, useScroll, useSpring } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <main className="min-h-screen bg-background selection:bg-primary/30">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left"
        style={{ scaleX }}
      />
      
      <Navbar />
      
      <Hero />

      <section id="advantages" className="relative">
        <Advantages />
      </section>

      <section id="catalog" className="relative">
        <Catalog />
      </section>

      <section id="guide" className="relative">
        <Guide />
      </section>

      <section id="faq" className="relative">
        <FAQ />
      </section>

      {/* Support Section */}
      <section className="py-20 flex flex-col items-center justify-center bg-muted/30 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center px-4"
        >
          <h2 className="text-3xl font-bold mb-6">Остались вопросы?</h2>
          <p className="text-muted-foreground mb-10 max-w-md mx-auto">
            Наша команда поддержки всегда на связи в Telegram, чтобы помочь вам с выбором или настройкой.
          </p>
          
          <Button
            size="lg"
            className="rounded-full px-10 h-16 text-lg font-semibold gap-3 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 group"
            asChild
          >
            <motion.a 
              href="https://t.me/scheglovvrn" 
              target="_blank" 
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Написать в поддержку в Telegram
            </motion.a>
          </Button>
        </motion.div>
      </section>

      <Footer />
      <CartSheet />
    </main>
  );
}
