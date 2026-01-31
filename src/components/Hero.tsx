"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronRight, Zap, ShieldCheck, HeartPulse } from "lucide-react";

export function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-background">
      {/* Dynamic Background */}
      <motion.div 
        style={{ y: y1, opacity }}
        className="absolute top-0 right-0 -z-10 w-[60%] h-full bg-gradient-to-l from-primary/20 via-blue-500/5 to-transparent blur-3xl" 
      />
      <div className="absolute top-20 left-10 -z-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
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
          
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
            Свобода <br />
            <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              без проколов
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
            Инновационные сенсоры FreeStyle Libre. 
            Точные измерения в реальном времени прямо на вашем смартфоне. 
            Жизнь без ограничений начинается здесь.
          </p>
          
          <div className="flex flex-wrap gap-5">
            <Button size="lg" className="h-14 px-10 text-lg rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 group" asChild>
              <a href="#catalog">
                К каталогу
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-2xl border-2 hover:bg-muted transition-all duration-300" asChild>
              <a href="#guide">Инструкция</a>
            </Button>
          </div>

          <div className="mt-12 flex gap-8">
            <div className="flex flex-col">
              <span className="text-2xl font-bold">100%</span>
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Оригинал</span>
            </div>
            <div className="w-px h-10 bg-border self-center" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold">24/7</span>
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Поддержка</span>
            </div>
            <div className="w-px h-10 bg-border self-center" />
            <div className="flex flex-col">
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
            <img 
              src="https://images.unsplash.com/photo-1631549916768-4119b295f78b?auto=format&fit=crop&q=80&w=1000" 
              alt="FreeStyle Libre Monitoring"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Floating Cards */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-8 -right-8 bg-background/80 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/20 z-20 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-lg">Гарантия</p>
              <p className="text-sm text-muted-foreground">На каждый сенсор</p>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-10 -left-10 bg-background/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/20 z-20 hidden md:flex items-center gap-5"
          >
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 animate-pulse">
              <HeartPulse className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-xl">15 дней</p>
              <p className="text-sm text-muted-foreground">Непрерывной работы</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
