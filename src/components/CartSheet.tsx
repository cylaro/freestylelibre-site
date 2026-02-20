"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { motion, AnimatePresence, useAnimation, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { normalizeSettings, settingsDefaults, OrderFormField } from "@/lib/schemas";
import { ResilientImage } from "@/components/ui/resilient-image";
import { getAuthToken } from "@/lib/authToken";
import { callWorker } from "@/lib/workerClient";

type CheckoutFormData = {
  deliveryMethod: "pickup" | "delivery";
  deliveryService?: string;
  name?: string;
  phone?: string;
  telegram?: string;
  city?: string;
  [key: string]: string | undefined;
};

export function CartSheet() {
  const { items, removeItem, updateQuantity, totalPrice, discountedTotal, clearCart, itemCount } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const cartControls = useAnimation();
  const hasMounted = useRef(false);
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Cart, 2: Checkout Form
  const [loading, setLoading] = useState(false);
  const [formFields, setFormFields] = useState<OrderFormField[]>([]);
  const [deliveryServices, setDeliveryServices] = useState(settingsDefaults.deliveryServices);
  const [guestPromptOpen, setGuestPromptOpen] = useState(false);
  const [guestOrderId, setGuestOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    deliveryMethod: "pickup"
  });

  useEffect(() => {
    const loadSettings = async () => {
      const reservedIds = new Set(["telegram", "phone", "name", "deliveryMethod", "deliveryService", "city"]);
      const applySettings = (rawSettings: unknown) => {
        const settings = normalizeSettings(rawSettings);
        const fields = (settings.orderForm.fields || []).filter(field => !reservedIds.has(field.id));
        setFormFields(fields);
        const services = (settings.deliveryServices || []).filter(service => service.active);
        setDeliveryServices(services);
        setFormData(prev => ({
          ...prev,
          deliveryService: prev.deliveryService || services[0]?.id || "",
        }));
      };

      try {
        const response = await callWorker<{ settings?: unknown }>("/api/public/settings", undefined, "GET");
        if (response.settings) {
          applySettings(response.settings);
          return;
        }
      } catch {
        // Firestore fallback below.
      }

      try {
        const settingsDoc = await getDoc(doc(db, "settings", "config"));
        if (settingsDoc.exists()) {
          applySettings(settingsDoc.data());
        } else {
          applySettings(settingsDefaults);
        }
      } catch (error) {
        console.error("Error loading settings", error);
        applySettings(settingsDefaults);
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

  useEffect(() => {
    if (profile) return;
    try {
      const stored = localStorage.getItem("guestOrderProfile");
      if (!stored) return;
      const parsed = JSON.parse(stored) as { name?: string; phone?: string; telegram?: string };
      setFormData(prev => ({
        ...prev,
        name: parsed?.name || prev.name || "",
        phone: parsed?.phone || prev.phone || "",
        telegram: parsed?.telegram || prev.telegram || "",
      }));
    } catch {
      // ignore invalid cache
    }
  }, [profile]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPadding;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (reduceMotion) return;
    if (itemCount > 0) {
      cartControls.start({
        scale: [1, 1.08, 1],
        transition: { duration: 0.35, ease: "easeOut" },
      });
    }
  }, [itemCount, cartControls, reduceMotion]);

  const normalizePhone = (phone: string) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("8")) cleaned = "7" + cleaned.substring(1);
    if (!cleaned.startsWith("7")) cleaned = "7" + cleaned;
    return "+" + cleaned;
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep(1);
  };

  const handleContinue = () => {
    setStep(2);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    const phone = normalizePhone(formData.phone || "");
    if (phone.length < 11) {
      toast.error("Введите корректный номер телефона");
      return;
    }

    if (formData.deliveryMethod === "delivery") {
      if (!formData.city || !formData.deliveryService) {
        toast.error("Укажите город и службу доставки");
        return;
      }
    }

    setLoading(true);
    try {
      const idToken = user ? await getAuthToken(user) : null;
      const customFields: Record<string, string> = {};
      for (const field of formFields) {
        customFields[field.id] = formData[field.id] || "";
      }
      
      const nonce = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Date.now().toString();
      const requestBody = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity
        })),
        customerInfo: {
          name: formData.name || "",
          phone,
          telegram: formData.telegram || "",
          deliveryMethod: formData.deliveryMethod || "pickup",
          deliveryService: formData.deliveryService || "",
          city: formData.city || "",
          customFields
        },
        nonce
      };

      const result = await callWorker<{ orderId?: string }>("/api/order/create", idToken, "POST", requestBody);

      toast.success("Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.");
      if (!user) {
        const guestProfile = {
          name: formData.name || "",
          phone,
          telegram: formData.telegram || "",
        };
        try {
          localStorage.setItem("guestOrderProfile", JSON.stringify(guestProfile));
          if (result.orderId) {
            localStorage.setItem("guestOrderId", result.orderId);
            setGuestOrderId(result.orderId);
          }
        } catch {
          // ignore storage errors
        }
        setGuestPromptOpen(true);
      }
      clearCart();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка при оформлении заказа. Попробуйте позже.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={reduceMotion ? undefined : { scale: 1.06 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className="fixed bottom-8 right-8 z-40"
      >
        <Button 
          size="icon" 
          className="h-16 w-16 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.2)] bg-primary hover:bg-primary/90 transition-all"
          onClick={() => setIsOpen(true)}
        >
          <motion.div animate={cartControls}>
            <ShoppingCart className="h-7 w-7" />
          </motion.div>
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
          >
            <motion.div 
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={handleClose} 
            />
            <motion.div 
              initial={reduceMotion ? false : { x: "100%" }}
              animate={reduceMotion ? undefined : { x: 0 }}
              exit={reduceMotion ? undefined : { x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="relative w-full max-w-lg bg-background/90 backdrop-blur-xl h-[100dvh] shadow-2xl flex flex-col border-l border-white/10"
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
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full"><X className="h-5 w-5" /></Button>
            </div>

            <ScrollArea className="flex-1 min-h-0">
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
                          <Button variant="link" onClick={handleClose} className="mt-2 text-primary">Перейти к покупкам</Button>
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
                                <ResilientImage
                                  src={item.imageUrl}
                                  fallbackSrc="/images/fallback-product.svg"
                                  alt={item.name}
                                  width={96}
                                  height={96}
                                  timeoutMs={1400}
                                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
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
                          <div className="pt-2">
                            <Button variant="ghost" className="w-full rounded-2xl text-destructive hover:bg-destructive/10" onClick={clearCart}>
                              Очистить корзину
                            </Button>
                          </div>
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
                        {!user && (
                          <div className="rounded-2xl border border-white/10 bg-primary/5 p-4 text-sm space-y-3">
                            <p className="font-bold">Можно оформить заказ без регистрации</p>
                            <p className="text-muted-foreground">
                              Аккаунт даст историю заказов, статус доставки и персональные скидки.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" className="rounded-xl" onClick={() => router.push("/login?redirect=/account")}>
                                Войти
                              </Button>
                              <Button className="rounded-xl" onClick={() => router.push("/register?redirect=/account")}>
                                Создать аккаунт
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="space-y-4">
                          <Label className="text-base font-bold flex items-center gap-2">
                            <Truck className="w-5 h-5 text-primary" />
                            Способ получения
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                              onClick={() => setFormData({...formData, deliveryMethod: "pickup"})}
                              className={`p-4 rounded-2xl border-2 transition-all text-left ${formData.deliveryMethod === "pickup" ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:border-muted-foreground/30"}`}
                            >
                              <p className="font-bold text-sm">Самовывоз</p>
                              <p className="text-[10px] text-muted-foreground mt-1">г. Воронеж</p>
                            </button>
                            <button
                              onClick={() => setFormData({...formData, deliveryMethod: "delivery"})}
                              className={`p-4 rounded-2xl border-2 transition-all text-left ${formData.deliveryMethod === "delivery" ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:border-muted-foreground/30"}`}
                            >
                              <p className="font-bold text-sm">Доставка</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {deliveryServices.length > 0
                                  ? deliveryServices.map(service => service.label).join(", ")
                                  : "По всей России"}
                              </p>
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
                            <div className="space-y-2">
                              <Label htmlFor="telegram" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Telegram username</Label>
                              <Input 
                                id="telegram" 
                                placeholder="@username" 
                                className="h-12 rounded-xl bg-muted/30 border-white/10"
                                value={formData.telegram || ""} 
                                onChange={(e) => setFormData({...formData, telegram: e.target.value})} 
                              />
                            </div>
                            {formData.deliveryMethod === "delivery" && (
                              <>
                                <div className="space-y-2">
                              <Label htmlFor="deliveryService" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Служба доставки</Label>
                                  <Select
                                    value={formData.deliveryService || undefined}
                                    onValueChange={(value) => setFormData({ ...formData, deliveryService: value })}
                                  >
                                    <SelectTrigger className="h-12 w-full rounded-xl bg-muted/30 border-white/10">
                                      <SelectValue placeholder="Выберите службу" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl">
                                      {deliveryServices.map(service => (
                                        <SelectItem key={service.id} value={service.id}>{service.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="city" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Город</Label>
                                  <Input 
                                    id="city" 
                                    placeholder="Например, Москва" 
                                    className="h-12 rounded-xl bg-muted/30 border-white/10"
                                    value={formData.city || ""} 
                                    onChange={(e) => setFormData({...formData, city: e.target.value})} 
                                    required
                                  />
                                </div>
                              </>
                            )}
                            {formFields.map(field => {
                              const fieldType =
                                field.type === "textarea"
                                  ? "textarea"
                                  : field.type === "datetime-local"
                                  ? "datetime-local"
                                  : field.type === "date"
                                  ? "date"
                                  : field.type === "time"
                                  ? "time"
                                  : field.type === "number"
                                  ? "text"
                                  : "text";
                              const isNumericField = field.type === "number";
                              return (
                                <div key={field.id} className="space-y-2">
                                  <Label htmlFor={field.id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">{field.label}</Label>
                                  {fieldType === "textarea" ? (
                                    <Textarea
                                      id={field.id}
                                      placeholder={field.placeholder}
                                      className="rounded-xl bg-muted/30 border-white/10 min-h-[110px]"
                                      value={formData[field.id] || ""}
                                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                      required={field.required}
                                    />
                                  ) : (
                                    <Input 
                                      id={field.id} 
                                      type={fieldType}
                                      inputMode={isNumericField ? "numeric" : undefined}
                                      placeholder={field.placeholder}
                                      className="h-12 rounded-xl bg-muted/30 border-white/10"
                                      value={formData[field.id] || ""} 
                                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })} 
                                      required={field.required}
                                    />
                                  )}
                                </div>
                              );
                            })}
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
                {(profile?.loyaltyDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm font-bold text-green-500 bg-green-500/10 p-2 rounded-xl">
                    <span>Ваша VIP скидка ({profile?.loyaltyDiscount ?? 0}%)</span>
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
                  onClick={handleContinue}
                >
                  Продолжить
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button
                  onClick={handleCheckout}
                  className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 disabled:opacity-50"
                  disabled={loading}
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
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={guestPromptOpen} onOpenChange={setGuestPromptOpen}>
        <DialogContent className="rounded-[2rem] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Заказ оформлен</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Зарегистрируйтесь, чтобы отслеживать статус и видеть историю покупок.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {guestOrderId && (
              <div className="rounded-2xl border bg-muted/30 px-4 py-3 font-semibold">
                Номер заказа: #{guestOrderId.slice(-6).toUpperCase()}
              </div>
            )}
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>История заказов и статусы доставки</li>
              <li>Автозаполнение контактных данных</li>
              <li>VIP скидки и персональные предложения</li>
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setGuestPromptOpen(false)}>Позже</Button>
            <Button onClick={() => router.push("/register?redirect=/account")}>Создать аккаунт</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
