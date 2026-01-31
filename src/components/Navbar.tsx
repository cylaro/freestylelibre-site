"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "./AuthModal";
import { Button } from "@/components/ui/button";
import { 
  User, 
  ShoppingCart, 
  Menu, 
  X, 
  Sun, 
  Moon,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, profile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          FreeStyle Store
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/#catalog" className="text-sm font-medium hover:text-primary">Каталог</Link>
          <Link href="/#advantages" className="text-sm font-medium hover:text-primary">Преимущества</Link>
          <Link href="/#guide" className="text-sm font-medium hover:text-primary">Инструкция</Link>
          <Link href="/#faq" className="text-sm font-medium hover:text-primary">FAQ</Link>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                    <User className="h-5 w-5" />
                    {profile?.isAdmin && <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-background" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-background/80 backdrop-blur-xl border-white/20 shadow-2xl">
                  <DropdownMenuItem asChild className="rounded-xl px-4 py-3 cursor-pointer">
                    <Link href="/account" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Личный кабинет
                    </Link>
                  </DropdownMenuItem>
                  {profile?.isAdmin && (
                    <DropdownMenuItem asChild className="rounded-xl px-4 py-3 cursor-pointer">
                      <Link href="/admin" className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Админ-панель
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <div className="h-px bg-white/10 my-1" />
                  <DropdownMenuItem onClick={logout} className="rounded-xl px-4 py-3 text-destructive cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
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
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b px-4 py-4 space-y-4 flex flex-col">
          <Link href="/#catalog" onClick={() => setIsMobileMenuOpen(false)}>Каталог</Link>
          <Link href="/#advantages" onClick={() => setIsMobileMenuOpen(false)}>Преимущества</Link>
          <Link href="/#guide" onClick={() => setIsMobileMenuOpen(false)}>Инструкция</Link>
          <Link href="/#faq" onClick={() => setIsMobileMenuOpen(false)}>FAQ</Link>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
}
