"use client";

import React from "react";
import Link from "next/link";
import { Send, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="section-shell pt-10 pb-8">
      <div className="container">
        <div className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-4">
              <h3 className="text-xl font-black headline-gradient inline-block">
                FreeStyle Store
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Онлайн-магазин сенсоров FreeStyle Libre для ежедневного контроля глюкозы.
                Понятный выбор модели, быстрая доставка и поддержка после покупки.
              </p>
            </div>

            <div>
              <h4 className="font-black mb-4 text-sm uppercase tracking-[0.16em] text-muted-foreground">Навигация</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/#catalog" className="hover:text-primary transition-colors font-semibold">Каталог</Link></li>
                <li><Link href="/#advantages" className="hover:text-primary transition-colors font-semibold">Преимущества</Link></li>
                <li><Link href="/#guide" className="hover:text-primary transition-colors font-semibold">Инструкция</Link></li>
                <li><Link href="/#faq" className="hover:text-primary transition-colors font-semibold">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-4 text-sm uppercase tracking-[0.16em] text-muted-foreground">Контакты</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <Send className="h-4 w-4 text-blue-400" /> 
                  <a href="https://t.me/scheglovvrn" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors font-semibold">
                    @scheglovvrn
                  </a>
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <MapPin className="h-4 w-4" /> г. Воронеж
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-center sm:text-left">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} FreeStyle Store. Все права защищены.</p>
            <p className="text-xs text-muted-foreground">Сенсоры FreeStyle Libre 2 RU/EU и 3 Plus</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
