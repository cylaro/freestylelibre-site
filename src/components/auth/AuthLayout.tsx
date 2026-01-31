"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <div className="absolute inset-0 w-full h-full bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] relative"
      >
        <Link 
          href="/" 
          className="absolute -top-12 left-0 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Вернуться на главную
        </Link>

        <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-muted-foreground">
                {subtitle}
              </p>
            </div>
            
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
