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
  LayoutDashboard
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
    <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md border-b border-white/10">
      <div className="container h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          FreeStyle Store
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#catalog" onClick={handleScrollTo("catalog")} className="text-sm font-medium hover:text-primary">Каталог</a>
          <a href="#advantages" onClick={handleScrollTo("advantages")} className="text-sm font-medium hover:text-primary">Преимущества</a>
          <a href="#guide" onClick={handleScrollTo("guide")} className="text-sm font-medium hover:text-primary">Инструкция</a>
          <a href="#faq" onClick={handleScrollTo("faq")} className="text-sm font-medium hover:text-primary">FAQ</a>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

            {user ? (
              <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen} modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full bg-muted/50 hover:bg-muted transition-colors">
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
                    className="w-60 rounded-[1.25rem] p-2 bg-background/70 backdrop-blur-xl border border-white/15 shadow-[0_20px_45px_rgba(0,0,0,0.2)]"
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
              <Button asChild className="rounded-full px-6 h-10 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                <Link href="/login">Войти</Link>
              </Button>
            )}


          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background/80 border-b border-white/10 px-4"
          >
            <div className="py-4 space-y-4 flex flex-col">
              <a href="#catalog" onClick={handleScrollTo("catalog")}>Каталог</a>
              <a href="#advantages" onClick={handleScrollTo("advantages")}>Преимущества</a>
              <a href="#guide" onClick={handleScrollTo("guide")}>Инструкция</a>
              <a href="#faq" onClick={handleScrollTo("faq")}>FAQ</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
