"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "Подойдет ли сенсор Libre 2 для ребенка?",
    answer: "Да, сенсоры FreeStyle Libre 2 разрешены к использованию детям с 4 лет под контролем взрослых."
  },
  {
    question: "Чем отличается российская версия от европейской?",
    answer: "Технически датчики идентичны. Разница только в программной совместимости: российская версия работает с официальным приложением LibreLink RU, а европейская требует использования xDrip+ или патченного приложения."
  },
  {
    question: "Нужно ли калибровать сенсор?",
    answer: "Нет, сенсоры FreeStyle Libre откалиброваны на заводе и не требуют проколов пальца для калибровки в течение всего срока работы."
  },
  {
    question: "Можно ли принимать душ или плавать с сенсором?",
    answer: "Да, сенсоры водостойкие. Вы можете принимать душ, ванну и плавать (погружение до 1 метра на время до 30 минут)."
  },
  {
    question: "Как долго работает один сенсор?",
    answer: "Libre 2 работает 14 дней, а новейший Libre 3 Plus рассчитан на 15 дней непрерывного мониторинга."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <motion.section
      id="faq"
      className="section-shell"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container max-w-4xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <div className="section-head">
          <span className="section-kicker">FAQ</span>
          <h2 className="section-title">Ответы на важные вопросы</h2>
          <p className="section-lead">Собрали все, что обычно спрашивают перед покупкой сенсора.</p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="glass-panel rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-trigger-${i}`}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-bold hover:bg-muted/30 transition-colors"
                >
                  <span>{faq.question}</span>
                  <motion.span
                    animate={reduceMotion ? undefined : { rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-muted-foreground"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
                      exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${i}`}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <div className="mt-10 flex justify-center">
          <Button asChild className="rounded-2xl h-12 px-8">
            <a href="https://t.me/scheglovvrn" target="_blank" rel="noopener noreferrer">
              Написать в поддержку в Telegram
            </a>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
