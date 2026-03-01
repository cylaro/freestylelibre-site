"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const compareCards = [
  {
    title: "Libre 2 RU/EU",
    subtitle: "Надежная классика",
    badge: "14 дней",
    points: [
      "Стабильный ежедневный контроль",
      "Хорошо подходит для начала",
      "Проверенная совместимость",
    ],
  },
  {
    title: "Libre 3 Plus",
    subtitle: "Новая версия с максимумом удобства",
    badge: "15 дней",
    points: [
      "Компактнее и легче",
      "Более быстрый отклик по трендам",
      "Оптимален для активного ритма",
    ],
  },
];

export function ModelComparison() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id="comparison"
      className="section-shell pt-6 md:pt-10"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container">
        <div className="section-head mb-8 md:mb-10">
          <span className="section-kicker">Сравнение моделей</span>
          <h2 className="section-title">Понятный выбор без лишних шагов</h2>
          <p className="section-lead">
            Обе модели оригинальные. Разница только в сценарии использования и сроке ношения.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {compareCards.map((card, index) => (
            <motion.article
              key={card.title}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="glass-panel rounded-[1.75rem] p-6 flex flex-col min-h-[260px]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    {card.subtitle}
                  </p>
                  <h3 className="mt-2 text-2xl font-black leading-tight">{card.title}</h3>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">
                  {card.badge}
                </span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {card.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-foreground/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}

          <motion.article
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16, duration: 0.45 }}
            className="glass-panel-strong rounded-[1.75rem] p-6 flex flex-col min-h-[260px]"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-2xl font-black leading-tight">Нужна помощь с выбором?</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Подскажем модель под ваш сценарий: возраст, ритм жизни, привычный смартфон и бюджет.
            </p>
            <div className="mt-5 rounded-2xl border border-white/15 bg-background/45 px-4 py-3 text-xs text-muted-foreground">
              Мы продаем только оригинальные сенсоры и сопровождаем после покупки.
            </div>
            <div className="mt-auto pt-5">
              <Button asChild className="w-full rounded-xl h-11 font-semibold">
                <a href="https://t.me/scheglovvrn" target="_blank" rel="noopener noreferrer">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Подобрать модель
                </a>
              </Button>
            </div>
          </motion.article>
        </div>
      </div>
    </motion.section>
  );
}

