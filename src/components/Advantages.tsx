"use client";

import React from "react";
import { CheckCircle, Activity, Smartphone, Bell, Droplets, Heart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const advantages = [
  {
    icon: <Activity className="h-8 w-8 text-blue-500" />,
    title: "Мониторинг 24/7",
    description: "Система измеряет уровень глюкозы каждую минуту и хранит данные для анализа."
  },
  {
    icon: <Droplets className="h-8 w-8 text-sky-500" />,
    title: "Без проколов",
    description: "Забудьте о постоянных проколах пальцев. Сенсор устанавливается один раз на 14-15 дней."
  },
  {
    icon: <Bell className="h-8 w-8 text-orange-500" />,
    title: "Оповещения",
    description: "Получайте мгновенные сигналы при критически низком или высоком уровне сахара."
  },
  {
    icon: <Smartphone className="h-8 w-8 text-indigo-500" />,
    title: "Все в смартфоне",
    description: "Следите за графиками и трендами прямо в приложении на вашем телефоне."
  },
  {
    icon: <Heart className="h-8 w-8 text-rose-500" />,
    title: "Удаленный доступ",
    description: "Ваши близкие могут следить за вашими показателями в реальном времени через LibreLinkUp."
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-emerald-500" />,
    title: "Водостойкость",
    description: "Сенсор надежно держится и работает во время душа, плавания или занятий спортом."
  }
];

export function Advantages() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      id="advantages"
      className="section-shell"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container">
        <div className="section-head">
          <span className="section-kicker">Почему это удобно</span>
          <h2 className="section-title">Что вы получаете с Libre</h2>
          <p className="section-lead">
            Непрерывный мониторинг помогает принимать решения вовремя: 
            меньше тревоги, больше контроля и спокойнее день.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((adv, index) => (
            <motion.div
              key={index}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="glass-panel interactive-lift p-7 rounded-3xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-background/65 border border-white/20">
                  {adv.icon}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-xl font-black mb-2 leading-tight">{adv.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{adv.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
