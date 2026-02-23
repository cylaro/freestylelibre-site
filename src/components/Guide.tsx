"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Подготовка",
    text: "Выберите место на задней стороне плеча и протрите его спиртовой салфеткой."
  },
  {
    number: "02",
    title: "Сборка аппликатора",
    text: "Совместите метки на футляре и аппликаторе, сильно надавите до щелчка."
  },
  {
    number: "03",
    title: "Установка",
    text: "Приложите аппликатор к коже и плавно нажмите. Сенсор установлен!"
  },
  {
    number: "04",
    title: "Активация",
    text: "Сканируйте сенсор телефоном через приложение. Через 60 минут он готов к работе."
  }
];

export function Guide() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      id="guide"
      className="section-shell"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container">
        <div className="section-head">
          <span className="section-kicker">Пошагово</span>
          <h2 className="section-title">Установка за 4 простых шага</h2>
          <p className="section-lead">Без сложных действий. Сделайте один раз и дальше пользуйтесь спокойно.</p>
        </div>
        <div className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="hidden lg:block absolute left-[12%] right-[12%] top-16 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="glass-panel relative p-6 sm:p-7 rounded-3xl group"
            >
              <span className="text-5xl font-black text-primary/12 absolute top-4 right-4 group-hover:text-primary/25 transition-colors">
                {step.number}
              </span>
              <h3 className="text-xl font-black mb-3 leading-tight">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
