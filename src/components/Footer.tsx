"use client";

import React from "react";
import Link from "next/link";
import { Send, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-12">
      <div className="container grid md:grid-cols-3 gap-8 text-center md:text-left">
        <div className="space-y-4">
          <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent inline-block">
            FreeStyle Store
          </h3>
          <p className="text-sm text-muted-foreground">
            Ваш надежный партнер в мире мониторинга глюкозы. 
            Лучшие технологии для вашего здоровья.
          </p>
        </div>

        <div>
          <h4 className="font-bold mb-4">Навигация</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="#catalog" className="hover:text-primary transition-colors">Каталог</Link></li>
            <li><Link href="#advantages" className="hover:text-primary transition-colors">Преимущества</Link></li>
            <li><Link href="#guide" className="hover:text-primary transition-colors">Инструкция</Link></li>
            <li><Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4">Контакты</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center justify-center md:justify-start gap-2">
              <Send className="h-4 w-4 text-blue-400" /> 
              <a href="https://t.me/scheglovvrn" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                @scheglovvrn
              </a>
            </li>
            <li className="flex items-center justify-center md:justify-start gap-2">
              <MapPin className="h-4 w-4" /> г. Воронеж
            </li>
          </ul>
        </div>
      </div>
      <div className="container mt-12 pt-8 border-t border-white/10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FreeStyle Store. Все права защищены.
      </div>
    </footer>
  );
}
