"use client";

import React from "react";
import { CheckCircle, Activity, Smartphone, Bell, Droplets, Heart } from "lucide-react";
import { motion } from "framer-motion";

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
  return (
    <section id="advantages" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Почему это необходимо?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Непрерывный мониторинг глюкозы — это не просто удобство, это новый уровень 
            контроля вашего здоровья и качества жизни.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((adv, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-background p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{adv.icon}</div>
              <h3 className="text-xl font-bold mb-2">{adv.title}</h3>
              <p className="text-muted-foreground">{adv.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
