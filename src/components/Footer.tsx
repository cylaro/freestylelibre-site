"use client";

import React from "react";
import Link from "next/link";
import { Send, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t py-12">
      <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
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
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> +7 (900) 000-00-00
            </li>
            <li className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-400" /> @scheglovvrn
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> support@libre-store.ru
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> г. Воронеж
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4">Подписка</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Будьте в курсе новинок и скидок.
          </p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Email" 
              className="bg-muted border rounded-md px-3 py-2 text-sm flex-1 outline-none focus:ring-1 ring-primary"
            />
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
              OK
            </button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
        © 2026 FreeStyle Libre Shop. Все права защищены.
      </div>
    </footer>
  );
}
