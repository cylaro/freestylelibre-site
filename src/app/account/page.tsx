"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { normalizeOrder, normalizeProduct, normalizeReview, normalizeSettings, settingsDefaults, Order, Product, Review, SettingsConfig } from "@/lib/schemas";
import { formatTimestamp } from "@/lib/utils";
import Link from "next/link";
import {
  collection,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumericInput } from "@/components/ui/numeric-input";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Package, 
  User as UserIcon, 
  Settings, 
  History,
  Star,
  MessageSquare,
  LogOut,
  ShieldCheck,
  CreditCard,
  Ban,
  Pencil,
  Trash2
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export default function AccountPage() {
  const { user, profile, loading, logout } = useAuth();
  const reduceMotion = useReducedMotion();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editProfile, setEditProfile] = useState({
    name: "",
    phone: "",
    telegram: "",
  });
  const [saving, setSaving] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SettingsConfig>(settingsDefaults);
  const [orderEditOpen, setOrderEditOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderDraft, setOrderDraft] = useState({
    name: "",
    phone: "",
    telegram: "",
    comment: "",
    deliveryMethod: "pickup" as "pickup" | "delivery",
    deliveryService: "",
    city: "",
    items: [{ productId: "", quantity: 1 }],
  });

  const tabMotion = {
    initial: reduceMotion ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" },
  };

  const toDate = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") return new Date(value);
    if (typeof value === "object") {
      const anyValue = value as { toDate?: () => Date; seconds?: number };
      if (typeof anyValue.toDate === "function") return anyValue.toDate();
      if (typeof anyValue.seconds === "number") return new Date(anyValue.seconds * 1000);
    }
    return null;
  };

  useEffect(() => {
    if (profile) {
      setEditProfile({
        name: profile.name || "",
        phone: profile.phone || "",
        telegram: profile.telegram || "",
      });

      const unsubOrders = onSnapshot(
        query(collection(db, "orders"), where("userId", "==", profile.uid)),
        (snap) => {
          const list = snap.docs.map(doc => normalizeOrder(doc.id, doc.data()));
          list.sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
          setOrders(list);
        },
        (error) => {
          toast.error(error?.message || "Ошибка загрузки заказов");
        }
      );

      const unsubReviews = onSnapshot(
        query(collection(db, "reviews"), where("userId", "==", profile.uid)),
        (snap) => {
          setReviews(snap.docs.map(doc => normalizeReview(doc.id, doc.data())));
        },
        (error) => {
          toast.error(error?.message || "Ошибка загрузки отзывов");
        }
      );

      const unsubProducts = onSnapshot(
        query(collection(db, "products"), where("active", "==", true), orderBy("sortOrder", "asc")),
        (snap) => {
          setProducts(snap.docs.map(doc => normalizeProduct(doc.id, doc.data())));
        },
        (error) => {
          toast.error(error?.message || "Ошибка загрузки товаров");
        }
      );

      const unsubSettings = onSnapshot(
        doc(db, "settings", "config"),
        (snap) => {
          const data = snap.exists() ? normalizeSettings(snap.data()) : settingsDefaults;
          setSettings(data);
        },
        (error) => {
          toast.error(error?.message || "Ошибка загрузки настроек");
        }
      );

      return () => {
        unsubOrders();
        unsubReviews();
        unsubProducts();
        unsubSettings();
      };
    }
  }, [profile]);

  useEffect(() => {
    if (!user || !profile) return;
    if (typeof window === "undefined") return;
    const guestOrderId = localStorage.getItem("guestOrderId");
    if (!guestOrderId) return;

    const claim = async () => {
      try {
        const idToken = await user.getIdToken();
        const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "https://freestyle-store-worker.scheglovvrn.workers.dev";
        const response = await fetch(`${workerUrl}/api/order/claim`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            orderId: guestOrderId,
          }),
        });
        const result = await response.json().catch(() => ({})) as { error?: string };
        if (!response.ok) {
          if (result.error?.toLowerCase?.().includes("уже привязан")) {
            localStorage.removeItem("guestOrderId");
            localStorage.removeItem("guestOrderProfile");
            return;
          }
          throw new Error(result.error || "Ошибка привязки заказа");
        }
        localStorage.removeItem("guestOrderId");
        localStorage.removeItem("guestOrderProfile");
        toast.success("Заказ привязан к аккаунту");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось привязать заказ";
        console.error(message);
      }
    };

    claim();
  }, [user, profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const normalizedTelegram = editProfile.telegram?.trim()
        ? (editProfile.telegram.trim().startsWith("@") ? editProfile.telegram.trim() : `@${editProfile.telegram.trim()}`)
        : "";
      await updateDoc(doc(db, "users", user.uid), {
        ...editProfile,
        telegram: normalizedTelegram,
      });
      toast.success("Профиль обновлен");
    } catch {
      toast.error("Ошибка при обновлении");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !selectedOrderId) return;
    try {
      const idToken = await user.getIdToken();
      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "https://freestyle-store-worker.scheglovvrn.workers.dev";
      const response = await fetch(`${workerUrl}/api/review/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          orderId: selectedOrderId,
          text: reviewText,
          rating: reviewRating,
        }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Ошибка отправки отзыва");
      toast.success("Отзыв отправлен на модерацию!");
      setIsReviewModalOpen(false);
      setReviewText("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка при отправке отзыва";
      toast.error(message);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "new": return { label: "На рассмотрении", color: "bg-blue-500/10 text-blue-500" };
      case "processing": return { label: "Выполняется", color: "bg-orange-500/10 text-orange-500" };
      case "delivered": return { label: "Выдан", color: "bg-emerald-500/10 text-emerald-500" };
      case "cancelled": return { label: "Отменен", color: "bg-destructive/10 text-destructive" };
      default: return { label: status, color: "bg-muted text-muted-foreground" };
    }
  };

  const resolveDeliveryServiceLabel = (value?: string) => {
    if (!value) return "";
    const normalized = value.trim().toLowerCase();
    const match = settings.deliveryServices.find(
      (service) => service.id.toLowerCase() === normalized || service.label.toLowerCase() === normalized
    );
    return match?.label || value;
  };

  const resolveDeliveryServiceId = (value?: string) => {
    if (!value) return "";
    const normalized = value.trim().toLowerCase();
    const match = settings.deliveryServices.find(
      (service) => service.id.toLowerCase() === normalized || service.label.toLowerCase() === normalized
    );
    return match?.id || value;
  };

  const openOrderEditDialog = (order: Order) => {
    const items = order.items?.length
      ? order.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      : [{ productId: products[0]?.id || "", quantity: 1 }];
    setEditingOrder(order);
    setOrderDraft({
      name: order.name || "",
      phone: order.phone || order.phoneE164 || "",
      telegram: order.telegram || "",
      comment: order.customFields?.comment || "",
      deliveryMethod: order.deliveryMethod || "pickup",
      deliveryService: resolveDeliveryServiceId(order.deliveryService || ""),
      city: order.city || "",
      items,
    });
    setOrderEditOpen(true);
  };

  const updateOrderItem = (index: number, patch: Partial<{ productId: string; quantity: number }>) => {
    setOrderDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const addOrderItem = () => {
    setOrderDraft((prev) => ({
      ...prev,
      items: [...prev.items, { productId: products[0]?.id || "", quantity: 1 }],
    }));
  };

  const removeOrderItem = (index: number) => {
    setOrderDraft((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const canSaveOrderEdit = Boolean(
    editingOrder &&
      orderDraft.items.length > 0 &&
      orderDraft.items.every((item) => item.productId && item.quantity > 0) &&
      orderDraft.name.trim().length > 0 &&
      orderDraft.phone.trim().length > 0 &&
      (orderDraft.deliveryMethod === "pickup" || (orderDraft.deliveryService && orderDraft.city))
  );

  const handleSaveOrderEdit = async () => {
    if (!user || !editingOrder) return;
    if (editingOrder.status === "delivered") {
      toast.error("Нельзя менять выданный заказ");
      return;
    }
    try {
      const idToken = await user.getIdToken();
      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "https://freestyle-store-worker.scheglovvrn.workers.dev";
      const response = await fetch(`${workerUrl}/api/order/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          orderId: editingOrder.id,
          items: orderDraft.items.map((item) => ({ id: item.productId, quantity: Number(item.quantity || 0) })),
          customerInfo: {
            name: orderDraft.name,
            phone: orderDraft.phone,
            telegram: orderDraft.telegram,
            deliveryMethod: orderDraft.deliveryMethod,
            deliveryService: orderDraft.deliveryMethod === "delivery" ? orderDraft.deliveryService : "",
            city: orderDraft.deliveryMethod === "delivery" ? orderDraft.city : "",
            comment: orderDraft.comment,
          },
        }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Ошибка обновления заказа");
      toast.success("Заказ обновлен");
      setOrderEditOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка обновления заказа";
      toast.error(message);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!user) return;
    if (order.status !== "new") {
      toast.error("Отмена доступна только для новых заказов");
      return;
    }
    const confirmed = window.confirm("Отменить заказ и удалить его из базы данных?");
    if (!confirmed) return;
    try {
      const idToken = await user.getIdToken();
      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "https://freestyle-store-worker.scheglovvrn.workers.dev";
      const response = await fetch(`${workerUrl}/api/order/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Ошибка отмены заказа");
      toast.success("Заказ отменен");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка отмены заказа";
      toast.error(message);
    }
  };

  const hasReview = (orderId: string) => reviews.some(r => r.orderId === orderId);
  const reviewableOrders = orders.filter(order => order.status === "delivered" && !hasReview(order.id));

  useEffect(() => {
    if (reviewableOrders.length === 0) {
      if (selectedOrderId) setSelectedOrderId(null);
      return;
    }
    if (!selectedOrderId || !reviewableOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(reviewableOrders[0].id);
    }
  }, [reviewableOrders, selectedOrderId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>;
  
  if (!user) return <div className="min-h-screen flex flex-col items-center justify-center gap-6">
    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
      <UserIcon className="w-10 h-10 opacity-20" />
    </div>
    <div className="text-center space-y-2">
      <h1 className="text-2xl font-bold">Вы не вошли в систему</h1>
      <p className="text-muted-foreground">Пожалуйста, войдите, чтобы получить доступ к своему профилю.</p>
    </div>
    <Button asChild className="rounded-2xl h-12 px-8"><Link href="/">Вернуться на главную</Link></Button>
  </div>;

  if (profile?.isBanned) return <div className="min-h-screen flex flex-col items-center justify-center gap-6">
    <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
      <Ban className="w-10 h-10" />
    </div>
    <div className="text-center space-y-2 max-w-md px-4">
      <h1 className="text-2xl font-bold">Ваш аккаунт заблокирован</h1>
      <p className="text-muted-foreground">Доступ к оформлению заказов и личному кабинету ограничен. Причина: {profile.banReason || "нарушение правил сервиса"}.</p>
    </div>
    <Button variant="outline" onClick={logout} className="rounded-2xl h-12 px-8">Выйти из аккаунта</Button>
  </div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container pt-24 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-12 gap-8 items-start"
        >
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-[2.5rem] overflow-hidden border-white/20 shadow-2xl bg-background/60 backdrop-blur-xl">
              <div className="h-32 bg-gradient-to-br from-primary via-blue-600 to-indigo-600" />
              <CardContent className="pt-0 -mt-16 text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-[2rem] bg-background p-2 shadow-2xl">
                    <div className="w-full h-full rounded-[1.5rem] bg-muted flex items-center justify-center text-primary">
                      <UserIcon className="w-12 h-12" />
                    </div>
                  </div>
                  {(profile?.loyaltyLevel ?? 0) > 0 && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-4 border-background">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  )}
                </div>
                
                <div className="mt-6 mb-8">
                  <h2 className="text-2xl font-black">{profile?.name || "Пользователь"}</h2>
                  <p className="text-muted-foreground font-medium">{user.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Уровень</p>
                    <p className="text-xl font-black text-primary">VIP {profile?.loyaltyLevel || 0}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Скидка</p>
                    <p className="text-xl font-black text-emerald-500">{profile?.loyaltyDiscount || 0}%</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 text-left space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-sm font-bold text-muted-foreground">Всего потрачено</span>
                    <span className="text-lg font-black">{profile?.totalSpent?.toLocaleString() || 0} ₽</span>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-sm font-bold text-muted-foreground">Заказов получено</span>
                    <span className="text-lg font-black">{profile?.purchasesCount || 0}</span>
                  </div>
                </div>

                <Button variant="ghost" className="w-full mt-8 h-12 rounded-2xl text-destructive hover:bg-destructive/10" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" /> Выйти из системы
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Area */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="orders" className="space-y-8">
              <TabsList className="bg-background/60 backdrop-blur-xl border-white/20 p-1.5 h-auto rounded-[2rem] gap-1">
                <TabsTrigger value="orders" className="rounded-2xl px-8 py-3.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                  <History className="w-5 h-5" /> История заказов
                </TabsTrigger>
                <TabsTrigger value="profile" className="rounded-2xl px-8 py-3.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                  <Settings className="w-5 h-5" /> Настройки профиля
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders">
                <motion.div {...tabMotion} className="space-y-6">
                {orders.length === 0 ? (
                  <Card className="rounded-[2.5rem] border-white/20 p-20 text-center bg-background/40 backdrop-blur-xl border-dashed border-2">
                    <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                      <Package className="w-10 h-10 opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Заказов пока нет</h3>
                    <p className="text-muted-foreground mb-8">Вы еще не совершали покупок в нашем магазине.</p>
                    <Button asChild className="rounded-2xl h-12 px-8"><Link href="/#catalog">Перейти к покупкам</Link></Button>
                  </Card>
                ) : (
                  <>
                    {reviewableOrders.length > 0 && (
                      <div className="flex justify-end">
                        <Dialog
                          open={isReviewModalOpen}
                          onOpenChange={(open) => {
                            setIsReviewModalOpen(open);
                            if (open && reviewableOrders.length > 0) {
                              setSelectedOrderId((prev) => prev || reviewableOrders[0].id);
                            }
                            if (!open) {
                              setReviewText("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button className="rounded-2xl h-11 px-6 gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
                              <Star className="w-4 h-4" /> Оставить отзыв
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-[2.5rem] bg-background/80 backdrop-blur-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-black">Ваш отзыв</DialogTitle>
                              <DialogDescription className="text-muted-foreground">
                                Поделитесь впечатлениями о заказе.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-6">
                              {reviewableOrders.length > 1 && (
                                <div className="space-y-2">
                                  <Label className="font-bold ml-1">Заказ</Label>
                                  <Select
                                    value={selectedOrderId || reviewableOrders[0]?.id}
                                    onValueChange={(value) => setSelectedOrderId(value)}
                                  >
                                    <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-white/10">
                                      <SelectValue placeholder="Выберите заказ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {reviewableOrders.map((order) => (
                                        <SelectItem key={order.id} value={order.id}>
                                          #{order.id.slice(-6)} • {formatTimestamp(order.createdAt) || "—"}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              <div className="flex justify-center gap-3">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => setReviewRating(s)}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${s <= reviewRating ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110" : "bg-muted text-muted-foreground"}`}
                                  >
                                    <Star className={`w-6 h-6 ${s <= reviewRating ? "fill-current" : ""}`} />
                                  </button>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <Label className="font-bold ml-1">Комментарий</Label>
                                <Textarea
                                  placeholder="Расскажите о качестве товара и доставке..."
                                  className="rounded-2xl h-32 bg-muted/30 border-white/10"
                                  value={reviewText}
                                  onChange={(e) => setReviewText(e.target.value)}
                                />
                              </div>
                              <Button className="w-full h-14 rounded-2xl text-lg font-bold" onClick={handleSubmitReview} disabled={!reviewText}>
                                Опубликовать отзыв
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                    <div className="grid gap-6">
                      {orders.map((order) => {
                        const status = getStatusInfo(order.status);
                        return (
                        <Card key={order.id} className="rounded-[2.5rem] border-white/20 shadow-xl overflow-hidden bg-background/40 backdrop-blur-xl group hover:shadow-2xl transition-all duration-500">
                          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20">
                            <div>
                              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                <span className="text-primary">#{order.id.slice(-6)}</span>
                                <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] ${status.color}`}>
                                  {status.label}
                                </Badge>
                              </CardTitle>
                              <CardDescription className="mt-1 font-medium">
                                {formatTimestamp(order.createdAt) || "—"}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-black">{order.totalPrice.toLocaleString()} ₽</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{order.items?.length} товаров</p>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Состав заказа</p>
                                  {order.items?.map((it, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm font-bold bg-muted/30 p-3 rounded-2xl border border-white/5">
                                      <span className="line-clamp-1">{it.name}</span>
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg">x{it.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex flex-col justify-between items-end">
                                  <div className="text-right space-y-2">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Информация</p>
                                    <p className="text-sm font-bold">
                                      {order.deliveryMethod === 'delivery'
                                        ? `Доставка${order.deliveryService ? ` (${resolveDeliveryServiceLabel(order.deliveryService)})` : ""}`
                                        : 'Самовывоз'}
                                    </p>
                                    {order.deliveryMethod === "delivery" && (
                                      <p className="text-xs text-muted-foreground">{order.city || '—'}</p>
                                    )}
                                  </div>

                                  {hasReview(order.id) && (
                                    <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
                                      <MessageSquare className="w-4 h-4" />
                                      <span className="text-xs font-black uppercase tracking-widest">Отзыв оставлен</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center justify-end gap-2 pt-4">
                                {order.status !== "delivered" && (
                                  <Button
                                    variant="outline"
                                    className="h-10 rounded-2xl px-4 gap-2"
                                    onClick={() => openOrderEditDialog(order)}
                                  >
                                    <Pencil className="w-4 h-4" /> Изменить заказ
                                  </Button>
                                )}
                                {order.status === "new" && (
                                  <Button
                                    variant="destructive"
                                    className="h-10 rounded-2xl px-4 gap-2"
                                    onClick={() => handleCancelOrder(order)}
                                  >
                                    <Trash2 className="w-4 h-4" /> Отменить
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        );
                      })}
                    </div>
                  </>
                )}
                <Dialog open={orderEditOpen} onOpenChange={(open) => {
                  setOrderEditOpen(open);
                  if (!open) setEditingOrder(null);
                }}>
                  <DialogContent className="rounded-[2.5rem] max-w-3xl bg-background/80 backdrop-blur-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black">
                        Изменить заказ {editingOrder ? `#${editingOrder.id.slice(-6)}` : ""}
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Обновите данные заказа и способ получения.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                      <div className="space-y-3">
                        <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Состав заказа</p>
                        <div className="space-y-3">
                          {orderDraft.items.map((item, index) => (
                            <div key={`${item.productId}-${index}`} className="grid gap-3 md:grid-cols-[1fr_140px_auto] items-center">
                              <Select
                                value={item.productId}
                                onValueChange={(value) => updateOrderItem(index, { productId: value })}
                              >
                                <SelectTrigger className="h-12 w-full rounded-xl bg-muted/30 border-white/10">
                                  <SelectValue placeholder="Выберите модель" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl">
                                  {products.length === 0 ? (
                                    <SelectItem value="no-products" disabled>Нет товаров</SelectItem>
                                  ) : (
                                    products.map((product) => (
                                      <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <NumericInput
                                value={Number(item.quantity || 0)}
                                onValueChange={(value) => updateOrderItem(index, { quantity: Math.max(1, Math.round(value || 0)) })}
                                className="h-12 rounded-xl"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10"
                                onClick={() => removeOrderItem(index)}
                                disabled={orderDraft.items.length <= 1}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button variant="outline" className="h-11 rounded-xl" onClick={addOrderItem}>
                          + Добавить позицию
                        </Button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-bold ml-1">Имя</Label>
                          <Input
                            value={orderDraft.name}
                            onChange={(e) => setOrderDraft((prev) => ({ ...prev, name: e.target.value }))}
                            className="h-12 rounded-2xl bg-muted/30 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold ml-1">Телефон</Label>
                          <Input
                            value={orderDraft.phone}
                            onChange={(e) => setOrderDraft((prev) => ({ ...prev, phone: e.target.value }))}
                            className="h-12 rounded-2xl bg-muted/30 border-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold ml-1">Telegram</Label>
                          <Input
                            value={orderDraft.telegram}
                            onChange={(e) => setOrderDraft((prev) => ({ ...prev, telegram: e.target.value }))}
                            className="h-12 rounded-2xl bg-muted/30 border-white/10"
                            placeholder="@username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold ml-1">Комментарий</Label>
                          <Input
                            value={orderDraft.comment}
                            onChange={(e) => setOrderDraft((prev) => ({ ...prev, comment: e.target.value }))}
                            className="h-12 rounded-2xl bg-muted/30 border-white/10"
                            placeholder="Особые пожелания"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-bold ml-1">Способ получения</Label>
                          <Select
                            value={orderDraft.deliveryMethod}
                            onValueChange={(value) => setOrderDraft((prev) => ({
                              ...prev,
                              deliveryMethod: value as "pickup" | "delivery",
                              deliveryService: value === "pickup" ? "" : prev.deliveryService,
                              city: value === "pickup" ? "" : prev.city,
                            }))}
                          >
                            <SelectTrigger className="h-12 w-full rounded-2xl bg-muted/30 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl">
                              <SelectItem value="pickup">Самовывоз</SelectItem>
                              <SelectItem value="delivery">Доставка</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {orderDraft.deliveryMethod === "delivery" && (
                          <div className="space-y-2">
                            <Label className="font-bold ml-1">Служба доставки</Label>
                            <Select
                              value={orderDraft.deliveryService}
                              onValueChange={(value) => setOrderDraft((prev) => ({ ...prev, deliveryService: value }))}
                            >
                              <SelectTrigger className="h-12 w-full rounded-2xl bg-muted/30 border-white/10">
                                <SelectValue placeholder="Выберите службу" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl">
                                {settings.deliveryServices.filter((service) => service.active).length === 0 ? (
                                  <SelectItem value="no-services" disabled>Нет служб доставки</SelectItem>
                                ) : (
                                  settings.deliveryServices
                                    .filter((service) => service.active)
                                    .map((service) => (
                                      <SelectItem key={service.id} value={service.id}>{service.label}</SelectItem>
                                    ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {orderDraft.deliveryMethod === "delivery" && (
                          <div className="space-y-2">
                            <Label className="font-bold ml-1">Город</Label>
                            <Input
                              value={orderDraft.city}
                              onChange={(e) => setOrderDraft((prev) => ({ ...prev, city: e.target.value }))}
                              className="h-12 rounded-2xl bg-muted/30 border-white/10"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOrderEditOpen(false)}>Отмена</Button>
                      <Button onClick={handleSaveOrderEdit} disabled={!canSaveOrderEdit}>Сохранить</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                </motion.div>
              </TabsContent>

              <TabsContent value="profile">
                <motion.div {...tabMotion}>
                <Card className="rounded-[2.5rem] border-white/20 shadow-xl overflow-hidden bg-background/40 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black">Настройки профиля</CardTitle>
                    <CardDescription>Управляйте своими личными данными для быстрого оформления заказов.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="font-bold ml-1">ФИО</Label>
                          <div className="relative group">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                              placeholder="Иван Иванов" 
                              className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/10 focus:border-primary/50"
                              value={editProfile.name}
                              onChange={(e) => setEditProfile({...editProfile, name: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="font-bold ml-1">Телефон</Label>
                          <div className="relative group">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                              placeholder="+7 (999) 000-00-00" 
                              className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/10 focus:border-primary/50"
                              value={editProfile.phone}
                              onChange={(e) => setEditProfile({...editProfile, phone: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="font-bold ml-1">Telegram Username</Label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground group-focus-within:text-primary transition-colors">@</span>
                          <Input 
                            placeholder="username" 
                            className="pl-10 h-14 rounded-2xl bg-muted/30 border-white/10 focus:border-primary/50"
                            value={editProfile.telegram}
                            onChange={(e) => setEditProfile({...editProfile, telegram: e.target.value})}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-1">Мы используем это для быстрой связи с вами по поводу заказа.</p>
                      </div>
                      <Button type="submit" className="h-14 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all" disabled={saving}>
                        {saving ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Сохранение...
                          </div>
                        ) : "Сохранить изменения"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
