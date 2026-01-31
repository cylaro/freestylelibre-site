"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart,
  ChevronRight,
  ArrowLeft,
  X,
  CreditCard,
  Truck,
  User
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

export function CartSheet() {
  const { items, removeItem, updateQuantity, totalPrice, discountedTotal, clearCart, itemCount } = useCart();
  const { user, profile } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Cart, 2: Checkout Form
  const [loading, setLoading] = useState(false);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    deliveryMethod: "pickup"
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "config"));
        if (settingsDoc.exists()) {
          const fields = settingsDoc.data().orderFormFields || [];
          setFormFields(fields);
        } else {
          setFormFields([
            { id: "telegram", label: "Ваш Telegram", type: "text", required: false, placeholder: "@username" },
            { id: "comment", label: "Комментарий", type: "text", required: false, placeholder: "Особые пожелания" },
          ]);
        }
      } catch (e) {
        console.error("Error loading settings", e);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || "",
        phone: profile.phone || "",
        telegram: profile.telegram || "",
      }));
    }
  }, [profile]);

  const normalizePhone = (phone: string) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("8")) cleaned = "7" + cleaned.substring(1);
    if (!cleaned.startsWith("7")) cleaned = "7" + cleaned;
    return "+" + cleaned;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Пожалуйста, войдите, чтобы оформить заказ");
      return;
    }

    const phone = normalizePhone(formData.phone || "");
    if (phone.length < 11) {
      toast.error("Введите корректный номер телефона");
      return;
    }

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "https://freestyle-store-worker.scheglovvrn.workers.dev";
      
      const response = await fetch(`${workerUrl}/api/order/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity
          })),
          customerInfo: {
            ...formData,
            phone,
            totalPrice: discountedTotal
          },
          nonce: Date.now().toString()
        })
      });

      if (!response.ok) throw new Error("Worker request failed");

      toast.success("Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.");
      clearCart();
      setIsOpen(false);
      setStep(1);
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при оформлении заказа. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 z-40"
      >
        <Button 
          size="icon" 
          className="h-16 w-16 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.2)] bg-primary hover:bg-primary/90 transition-all"
          onClick={() => setIsOpen(true)}
        >
          <ShoppingCart className="h-7 w-7" />
          {itemCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-bold h-6 w-6 rounded-full flex items-center justify-center border-2 border-background"
            >
              {itemCount}
            </motion.span>
          )}
        </Button>
      </motion.div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)} 
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-background h-full shadow-2xl flex flex-col border-l border-white/10"
          >
            <div className="p-6 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                {step === 2 && (
                  <Button variant="ghost" size="icon" onClick={() => setStep(1)} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <h2 className="text-2xl font-bold tracking-tight">
                  {step === 1 ? "Корзина" : "Оформление"}
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full"><X className="h-5 w-5" /></Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div 
                      key="cart"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                            <ShoppingCart className="h-10 w-10 opacity-20" />
                          </div>
                          <p className="text-lg font-medium">Ваша корзина пуста</p>
                          <Button variant="link" onClick={() => setIsOpen(false)} className="mt-2 text-primary">Перейти к покупкам</Button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {items.map((item) => (
                            <motion.div 
                              layout
                              key={item.id} 
                              className="flex gap-5 p-4 rounded-[1.5rem] bg-muted/30 border border-white/5 group relative overflow-hidden"
                            >
                              <div className="h-24 w-24 rounded-2xl overflow-hidden border bg-background shrink-0 shadow-sm">
                                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-base leading-tight mb-1">{item.name}</h4>
                                  <p className="text-primary font-bold text-lg">
                                    {item.discountPercent > 0 ? Math.round(item.price * (1 - item.discountPercent / 100)) : item.price} ₽
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center bg-background rounded-xl border p-1 shadow-sm">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors ml-auto" onClick={() => removeItem(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="checkout"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label className="text-base font-bold flex items-center gap-2">
                            <Truck className="w-5 h-5 text-primary" />
                            Способ получения
                          </Label>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => setFormData({...formData, deliveryMethod: "pickup"})}
                              className={`p-4 rounded-2xl border-2 transition-all text-left ${formData.deliveryMethod === "pickup" ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:border-muted-foreground/30"}`}
                            >
                              <p className="font-bold text-sm">Самовывоз</p>
                              <p className="text-[10px] text-muted-foreground mt-1">г. Воронеж</p>
                            </button>
                            <button
                              onClick={() => setFormData({...formData, deliveryMethod: "cdek"})}
                              className={`p-4 rounded-2xl border-2 transition-all text-left ${formData.deliveryMethod === "cdek" ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:border-muted-foreground/30"}`}
                            >
                              <p className="font-bold text-sm">СДЭК</p>
                              <p className="text-[10px] text-muted-foreground mt-1">По всей России</p>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-base font-bold flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Контактные данные
                          </Label>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Имя</Label>
                              <Input 
                                id="name" 
                                placeholder="Александр" 
                                className="h-12 rounded-xl bg-muted/30 border-white/10"
                                value={formData.name || ""} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Телефон</Label>
                              <Input 
                                id="phone" 
                                type="tel" 
                                placeholder="+7 (999) 000-00-00" 
                                className="h-12 rounded-xl bg-muted/30 border-white/10"
                                value={formData.phone || ""} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                required
                              />
                            </div>
                            {formData.deliveryMethod === "cdek" && (
                              <div className="space-y-2">
                                <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Адрес / ПВЗ СДЭК</Label>
                                <Input 
                                  id="address" 
                                  placeholder="Город, улица, дом или ПВЗ" 
                                  className="h-12 rounded-xl bg-muted/30 border-white/10"
                                  value={formData.address || ""} 
                                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                                  required
                                />
                              </div>
                            )}
                            {formFields.map(field => (
                              <div key={field.id} className="space-y-2">
                                <Label htmlFor={field.id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">{field.label}</Label>
                                <Input 
                                  id={field.id} 
                                  placeholder={field.placeholder}
                                  className="h-12 rounded-xl bg-muted/30 border-white/10"
                                  value={formData[field.id] || ""} 
                                  onChange={(e) => setFormData({...formData, [field.id]: e.target.value})} 
                                  required={field.required}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            <div className="p-8 border-t bg-muted/30 backdrop-blur-md rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Промежуточный итог</span>
                  <span>{totalPrice} ₽</span>
                </div>
                {profile?.loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-sm font-bold text-green-500 bg-green-500/10 p-2 rounded-xl">
                    <span>Ваша VIP скидка ({profile.loyaltyDiscount}%)</span>
                    <span>-{totalPrice - discountedTotal} ₽</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-black pt-3 border-t border-white/10">
                  <span>К оплате</span>
                  <span className="text-primary">{discountedTotal} ₽</span>
                </div>
              </div>

              {step === 1 ? (
                <Button 
                  className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 group" 
                  disabled={items.length === 0}
                  onClick={() => setStep(2)}
                >
                  Продолжить
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button 
                  onClick={handleCheckout}
                  className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 disabled:opacity-50" 
                  disabled={loading || !user}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Обработка...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Подтвердить заказ
                    </div>
                  )}
                </Button>
              )}
              {!user && step === 2 && (
                <p className="text-center text-xs text-destructive font-bold mt-4">
                  Необходимо войти в аккаунт
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
