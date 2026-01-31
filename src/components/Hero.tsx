"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 -z-10 w-1/3 h-1/2 bg-blue-500/10 blur-3xl opacity-30" />

      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Мониторинг глюкозы <br />
            <span className="text-primary">нового поколения</span> <br />
            без проколов пальца
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg">
            Инновационные сенсоры FreeStyle Libre 2 и 3 Plus. 
            Точные измерения каждую минуту, история в вашем смартфоне 
            и мгновенные оповещения.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="h-12 px-8 text-md" asChild>
              <a href="#catalog">Купить сейчас</a>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-md" asChild>
              <a href="#guide">Как это работает?</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          <div className="aspect-square rounded-3xl overflow-hidden glass shadow-2xl border border-white/20">
            <img 
              src="https://images.unsplash.com/photo-1631549916768-4119b295f78b?auto=format&fit=crop&q=80&w=800" 
              alt="FreeStyle Libre Monitoring"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Stats Overlay */}
          <div className="absolute -bottom-6 -left-6 bg-background/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border md:flex items-center space-x-4 hidden">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-xl">15</span>
            </div>
            <div>
              <p className="font-bold">дней работы</p>
              <p className="text-sm text-muted-foreground">один сенсор (3 Plus)</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
