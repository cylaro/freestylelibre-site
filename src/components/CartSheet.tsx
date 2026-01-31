"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from "@/components/ui/dialog"; // Using dialog since shadcn sheet is usually in sheet.tsx but I'll use common patterns
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CartSheet() {
  const { items, removeItem, updateQuantity, totalPrice, discountedTotal, clearCart, itemCount } = useCart();
  const { user, profile } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Cart, 2: Checkout Form
  const [loading, setLoading] = useState(false);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    // Load dynamic form fields from settings
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "config"));
        if (settingsDoc.exists()) {
          const fields = settingsDoc.data().orderFormFields || [];
          setFormFields(fields);
        } else {
          // Default fields if settings not initialized
          setFormFields([
            { id: "name", label: "Ваше имя", type: "text", required: true },
            { id: "phone", label: "Номер телефона", type: "tel", required: true },
            { id: "delivery", label: "Способ получения", type: "select", options: ["Самовывоз (Воронеж)", "СДЭК по РФ"], required: true },
            { id: "telegram", label: "Ваш Telegram", type: "text", required: false },
            { id: "comment", label: "Комментарий к заказу", type: "text", required: false },
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
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        telegram: profile.telegram || "",
      });
    }
  }, [profile]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Пожалуйста, войдите, чтобы оформить заказ");
      return;
    }

    setLoading(true);
    try {
      const order = {
        userId: user.uid,
        userEmail: user.email,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.discountPercent > 0 ? Math.round(item.price * (1 - item.discountPercent / 100)) : item.price,
          quantity: item.quantity
        })),
        totalPrice: discountedTotal,
        status: "new",
        createdAt: Timestamp.now(),
        ...formData
      };

      await addDoc(collection(db, "orders"), order);
      toast.success("Заказ успешно оформлен!");
      clearCart();
      setIsOpen(false);
      setStep(1);
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при оформлении заказа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        size="icon" 
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-2xl z-40"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Button>

      {/* Simplified Sheet using a fixed overlay if shadcn sheet is not standard here */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-md bg-background h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {step === 2 && <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => setStep(1)} />}
                {step === 1 ? "Корзина" : "Оформление заказа"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X /></Button>
            </div>

            <ScrollArea className="flex-1 p-6">
              {step === 1 ? (
                items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                    <p>Ваша корзина пуста</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="h-20 w-20 rounded-lg overflow-hidden border bg-muted">
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">{item.name}</h4>
                          <p className="text-primary font-bold text-sm">
                            {item.discountPercent > 0 ? Math.round(item.price * (1 - item.discountPercent / 100)) : item.price} ₽
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm w-6 text-center">{item.quantity}</span>
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive ml-auto" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                  {!user && (
                    <div className="bg-primary/10 p-4 rounded-lg text-sm mb-4">
                      Войдите в аккаунт, чтобы продолжить оформление.
                    </div>
                  )}
                  {formFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>{field.label} {field.required && "*"}</Label>
                      {field.type === "select" ? (
                        <select
                          id={field.id}
                          className="w-full h-10 px-3 py-2 bg-background border rounded-md focus:ring-1 ring-primary outline-none"
                          required={field.required}
                          value={formData[field.id] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        >
                          <option value="">Выберите вариант</option>
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id={field.id}
                          type={field.type}
                          required={field.required}
                          value={formData[field.id] || ""}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                </form>
              )}
            </ScrollArea>

            <div className="p-6 border-t bg-muted/20">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span>Сумма товаров</span>
                  <span>{totalPrice} ₽</span>
                </div>
                {profile?.loyaltyDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Скидка клиента ({profile.loyaltyDiscount}%)</span>
                    <span>-{totalPrice - discountedTotal} ₽</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Итого</span>
                  <span>{discountedTotal} ₽</span>
                </div>
              </div>

              {step === 1 ? (
                <Button 
                  className="w-full" 
                  disabled={items.length === 0}
                  onClick={() => setStep(2)}
                >
                  Оформить заказ <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  form="checkout-form"
                  className="w-full" 
                  disabled={loading || !user}
                >
                  {loading ? "Обработка..." : "Подтвердить заказ"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
