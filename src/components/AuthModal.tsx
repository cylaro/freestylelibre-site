"use client";

import React, { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, UserPlus, LogIn, ChevronRight, X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mapAuthErrorToRussian = (code: string) => {
  switch (code) {
    case "auth/invalid-email":
      return "Некорректный адрес электронной почты.";
    case "auth/user-disabled":
      return "Пользователь заблокирован.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Неверный email или пароль.";
    case "auth/email-already-in-use":
      return "Этот адрес уже используется.";
    case "auth/weak-password":
      return "Пароль слишком простой (минимум 6 символов).";
    case "auth/network-request-failed":
      return "Ошибка сети. Проверьте подключение.";
    default:
      return "Произошла непредвиденная ошибка. Попробуйте позже.";
  }
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast.success("С возвращением!");
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        toast.success("Добро пожаловать в FreeStyle Store!");
      }
      onClose();
      // Reset form
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("Auth error:", error.code, error.message);
      toast.error(mapAuthErrorToRussian(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background/80 backdrop-blur-2xl border-white/20 shadow-2xl rounded-[2rem]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-600/5 -z-10" />
        
        <div className="p-8">
          <DialogHeader className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"
              >
                {isLogin ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </motion.div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/50">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <DialogTitle className="text-3xl font-bold tracking-tight">
              {isLogin ? "С возвращением" : "Создать аккаунт"}
            </DialogTitle>
            <p className="text-muted-foreground mt-2">
              {isLogin 
                ? "Войдите в свой аккаунт, чтобы продолжить покупки." 
                : "Зарегистрируйтесь, чтобы отслеживать заказы и копить скидки."}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login" : "register"}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold px-1">Email адрес</Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="alex@example.com" 
                      className="pl-12 h-14 bg-muted/30 border-white/20 focus:border-primary/50 rounded-2xl transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold px-1">Пароль</Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="pl-12 pr-12 h-14 bg-muted/30 border-white/20 focus:border-primary/50 rounded-2xl transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 group" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Подождите...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {isLogin ? "Войти" : "Зарегистрироваться"}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground font-medium">или</span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Впервые у нас?" : "Уже зарегистрированы?"}{" "}
              <button 
                type="button" 
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-bold transition-all underline-offset-4"
              >
                {isLogin ? "Создать аккаунт" : "Войти в систему"}
              </button>
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
