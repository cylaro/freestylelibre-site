"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronRight, Zap } from "lucide-react";
import { normalizeSettings, settingsDefaults } from "@/lib/schemas";
import { ResilientImage } from "@/components/ui/resilient-image";
import { callWorker } from "@/lib/workerClient";

export function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const [heroImageUrl, setHeroImageUrl] = useState(settingsDefaults.media.heroImageUrl);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const response = await callWorker<{ settings?: unknown }>("/api/public/settings", undefined, "GET");
        if (!active) return;
        if (response.settings) {
          const settings = normalizeSettings(response.settings);
          setHeroImageUrl(settings.media.heroImageUrl || settingsDefaults.media.heroImageUrl);
        }
      } catch (error) {
        if (active) {
          console.error("Failed to load settings", error);
          setHeroImageUrl(settingsDefaults.media.heroImageUrl);
        }
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      {/* Dynamic Background */}
      <motion.div 
        style={{ y: y1, opacity }}
        className="absolute top-0 right-0 -z-10 w-[60%] h-full bg-gradient-to-l from-primary/20 via-blue-500/5 to-transparent blur-3xl" 
      />
      <div className="absolute top-20 left-10 -z-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="container grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
          >
            <Zap className="w-4 h-4 fill-primary" />
            <span>Новое поступление Libre 3 Plus</span>
          </motion.div>

          <p className="text-sm font-semibold text-muted-foreground mb-3">
            Сенсоры мониторинга глюкозы FreeStyle Libre 2 RU/EU и 3 Plus
          </p>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
            Свобода <br />
            <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              без проколов
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
            Инновационные сенсоры FreeStyle Libre. 
            Точные измерения в реальном времени прямо на вашем смартфоне. 
            Жизнь без ограничений начинается здесь.
          </p>
          
          <div className="flex flex-wrap gap-4 sm:gap-5">
            <Button size="lg" className="h-12 sm:h-14 w-full sm:w-auto px-8 sm:px-10 text-base sm:text-lg rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 group" asChild>
              <a href="#catalog">
                К каталогу
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-12 sm:h-14 w-full sm:w-auto px-8 sm:px-10 text-base sm:text-lg rounded-2xl border-2 hover:bg-muted transition-all duration-300" asChild>
              <a href="#guide">Инструкция</a>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 sm:flex sm:gap-8">
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-2xl font-bold">100%</span>
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Оригинал</span>
            </div>
            <div className="hidden sm:block w-px h-10 bg-border self-center" />
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-2xl font-bold">24/7</span>
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Поддержка</span>
            </div>
            <div className="hidden sm:block w-px h-10 bg-border self-center" />
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-2xl font-bold">1500+</span>
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Клиентов</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative group"
        >
          <div className="relative z-10 aspect-[4/5] md:aspect-square rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-white/20">
            <ResilientImage
              src={heroImageUrl || settingsDefaults.media.heroImageUrl}
              fallbackSrc="/images/fallback-hero.svg"
              alt="FreeStyle Libre Monitoring"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              timeoutMs={1800}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Floating Cards removed per requirements */}
        </motion.div>
      </div>
    </section>
  );
}
