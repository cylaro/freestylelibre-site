"use client";

import React from "react";
import { motion } from "framer-motion";

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
  return (
    <section id="guide" className="py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">Как установить сенсор?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-8 rounded-2xl bg-primary/5 border hover:bg-primary/10 transition-colors group"
            >
              <span className="text-5xl font-black text-primary/10 absolute top-4 right-4 group-hover:text-primary/20 transition-colors">
                {step.number}
              </span>
              <h3 className="text-xl font-bold mb-4">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
