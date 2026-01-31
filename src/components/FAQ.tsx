"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  return (
    <section id="faq" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">Часто задаваемые вопросы</h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
