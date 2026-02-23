"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Menu, 
  X, 
  Sun, 
  Moon,
  LogOut,
  LayoutDashboard,
  ShieldCheck
} from "lucide-react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, profile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();

  const handleScrollTo = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setIsMobileMenuOpen(false);
    if (pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 pt-2 sm:pt-3">
      <div className="container">
        <div className="glass-panel-strong surface-noise h-16 rounded-2xl px-4 sm:px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <span className="h-9 w-9 rounded-xl bg-primary/12 text-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black tracking-wide">FreeStyle Store</span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">CGM Сенсоры Libre</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1 rounded-xl px-1.5 py-1 bg-background/50 border border-white/20">
            <a href="#catalog" onClick={handleScrollTo("catalog")} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10 transition-colors">Каталог</a>
            <a href="#advantages" onClick={handleScrollTo("advantages")} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10 transition-colors">Преимущества</a>
            <a href="#guide" onClick={handleScrollTo("guide")} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10 transition-colors">Как установить</a>
            <a href="#faq" onClick={handleScrollTo("faq")} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Включить светлую тему" : "Включить темную тему"}
              className="rounded-xl"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {user ? (
              <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen} modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                    aria-label="Открыть меню профиля"
                  >
                    <User className="h-5 w-5" />
                    {profile?.isAdmin && <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-background" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" forceMount sideOffset={10} asChild>
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
                    animate={
                      reduceMotion
                        ? undefined
                        : isProfileOpen
                          ? { opacity: 1, y: 0, scale: 1 }
                          : { opacity: 0, y: -10, scale: 0.98 }
                    }
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="w-60 rounded-[1.25rem] p-2 bg-background/80 backdrop-blur-xl border border-white/20 shadow-[0_20px_45px_rgba(0,0,0,0.25)]"
                  >
                    <DropdownMenuItem asChild className="rounded-xl px-4 py-3 cursor-pointer bg-transparent hover:bg-white/10 focus:bg-white/10">
                      <Link href="/account" className="flex items-center gap-2 font-medium">
                        <User className="w-4 h-4" />
                        Личный кабинет
                      </Link>
                    </DropdownMenuItem>
                    {profile?.isAdmin && (
                      <DropdownMenuItem asChild className="rounded-xl px-4 py-3 cursor-pointer bg-transparent hover:bg-white/10 focus:bg-white/10">
                        <Link href="/admin" className="flex items-center gap-2 font-medium">
                          <LayoutDashboard className="w-4 h-4" />
                          Админ-панель
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <div className="h-px bg-white/10 my-1" />
                    <DropdownMenuItem onClick={logout} className="rounded-xl px-4 py-3 text-destructive cursor-pointer bg-transparent hover:bg-destructive/10 focus:bg-destructive/10 font-medium">
                      <LogOut className="mr-2 h-4 w-4" />
                      Выйти
                    </DropdownMenuItem>
                  </motion.div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="rounded-xl px-5 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                <Link href="/login">Войти</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            id="mobile-nav-menu"
            className="md:hidden container pt-2"
          >
            <div className="glass-panel rounded-2xl px-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-semibold">
                <a href="#catalog" onClick={handleScrollTo("catalog")} className="rounded-xl px-3 py-2 bg-background/40">Каталог</a>
                <a href="#advantages" onClick={handleScrollTo("advantages")} className="rounded-xl px-3 py-2 bg-background/40">Преимущества</a>
                <a href="#guide" onClick={handleScrollTo("guide")} className="rounded-xl px-3 py-2 bg-background/40">Как установить</a>
                <a href="#faq" onClick={handleScrollTo("faq")} className="rounded-xl px-3 py-2 bg-background/40">FAQ</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
