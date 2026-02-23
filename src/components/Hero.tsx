"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronRight, ShieldCheck, Truck, Smartphone, Zap } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { normalizeSettings, settingsDefaults } from "@/lib/schemas";
import { ResilientImage } from "@/components/ui/resilient-image";
import { callApi } from "@/lib/apiClient";

export function Hero() {
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 420], [1, 0.35]);
  const [heroImageUrl, setHeroImageUrl] = useState(settingsDefaults.media.heroImageUrl);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const response = await callApi<{ settings?: unknown }>("/api/public/settings", undefined, "GET");
        if (!active) return;
        if (response.settings) {
          const settings = normalizeSettings(response.settings);
          setHeroImageUrl(settings.media.heroImageUrl || settingsDefaults.media.heroImageUrl);
          return;
        }
      } catch {
        // fallback to Firestore below
      }

      try {
        const settingsDoc = await getDoc(doc(db, "settings", "config"));
        if (!active) return;
        if (settingsDoc.exists()) {
          const settings = normalizeSettings(settingsDoc.data());
          setHeroImageUrl(settings.media.heroImageUrl || settingsDefaults.media.heroImageUrl);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="relative min-h-[95vh] flex items-center pt-28 pb-14 overflow-hidden">
      <motion.div 
        style={reduceMotion ? undefined : { y: y1, opacity }}
        className="absolute top-[-12%] right-[-8%] -z-10 w-[70%] h-[70%] rounded-full bg-gradient-to-l from-blue-500/25 via-cyan-400/10 to-transparent blur-3xl" 
      />
      <div className="absolute top-[12%] left-[-8%] -z-10 h-[320px] w-[320px] rounded-full bg-primary/15 blur-3xl" />

      <div className="container grid lg:grid-cols-[1.1fr_0.9fr] gap-12 xl:gap-16 items-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -30 }}
          animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <motion.div 
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-chip mb-6 text-primary"
          >
            <Zap className="w-4 h-4 fill-primary" />
            <span>FreeStyle Libre 2 RU/EU и Libre 3 Plus</span>
          </motion.div>

          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4">
            Сенсоры непрерывного мониторинга глюкозы
          </p>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black leading-[1.03] mb-6">
            Понимать сахар
            <br />
            <span className="headline-gradient">
              без проколов
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            Здесь продаются оригинальные сенсоры FreeStyle Libre для ежедневного контроля глюкозы. 
            Вы получаете понятный выбор моделей, быструю доставку и поддержку после покупки.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <span className="glass-chip text-foreground/85"><ShieldCheck className="h-3.5 w-3.5" /> Оригинальные датчики</span>
            <span className="glass-chip text-foreground/85"><Truck className="h-3.5 w-3.5" /> Доставка по РФ</span>
            <span className="glass-chip text-foreground/85"><Smartphone className="h-3.5 w-3.5" /> Настройка в смартфоне</span>
          </div>

          <div className="flex flex-wrap gap-4 sm:gap-5">
            <Button size="lg" className="h-12 sm:h-14 w-full sm:w-auto px-8 sm:px-10 text-base sm:text-lg rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 group" asChild>
              <a href="#catalog">
                Выбрать сенсор
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-12 sm:h-14 w-full sm:w-auto px-8 sm:px-10 text-base sm:text-lg rounded-2xl border-2 hover:bg-muted transition-all duration-300" asChild>
              <a href="#guide">Как это работает</a>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 sm:flex sm:gap-8">
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-2xl font-black">100%</span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-[0.16em]">Оригинал</span>
            </div>
            <div className="hidden sm:block w-px h-10 bg-border self-center" />
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-2xl font-black">24/7</span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-[0.16em]">Поддержка</span>
            </div>
            <div className="hidden sm:block w-px h-10 bg-border self-center" />
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-2xl font-black">1500+</span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-[0.16em]">Клиентов</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9, rotate: 2 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative group w-full max-w-[540px] mx-auto"
        >
          <div className="relative z-10 aspect-[4/5] rounded-[2.2rem] overflow-hidden glass-panel-strong">
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
            <div className="absolute left-4 top-4 rounded-xl bg-black/45 backdrop-blur-md px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              Libre 3 Plus
            </div>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel absolute -left-4 -bottom-5 sm:-left-8 sm:-bottom-8 rounded-2xl p-4 max-w-[220px]"
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-bold">Что внутри</p>
            <p className="mt-1 text-sm font-semibold">1 сенсор + понятная инструкция по запуску.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
