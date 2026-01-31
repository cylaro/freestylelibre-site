"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth, UserProfile } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Package, User as UserIcon, CreditCard, History } from "lucide-react";

export default function AccountPage() {
  const { user, profile, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [editProfile, setEditProfile] = useState({
    name: "",
    phone: "",
    telegram: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditProfile({
        name: profile.name || "",
        phone: profile.phone || "",
        telegram: profile.telegram || "",
      });

      const fetchOrders = async () => {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", profile.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchOrders();
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), editProfile);
      toast.success("Профиль обновлен");
    } catch (error) {
      toast.error("Ошибка при обновлении");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Пожалуйста, войдите в аккаунт</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new": return <Badge variant="outline">Новый</Badge>;
      case "processing": return <Badge className="bg-blue-500">В обработке</Badge>;
      case "shipped": return <Badge className="bg-orange-500">Отправлен</Badge>;
      case "delivered": return <Badge className="bg-green-500">Доставлен</Badge>;
      case "cancelled": return <Badge variant="destructive">Отменен</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-24">
      <Navbar />
      <div className="container mx-auto px-4 flex-1 pb-12">
        <h1 className="text-3xl font-bold mb-8">Личный кабинет</h1>

        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar / Info */}
          <div className="md:col-span-1 space-y-6">
            <Card className="glass overflow-hidden border-none shadow-lg">
              <CardHeader className="bg-primary/5 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <UserIcon className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-lg">{profile?.name || "Пользователь"}</CardTitle>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Статус лояльности:</span>
                    <Badge variant="secondary">
                      {profile?.loyaltyLevel ? `VIP ${profile.loyaltyLevel}` : "Обычный"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Персональная скидка:</span>
                    <span className="font-bold text-green-600">{profile?.loyaltyDiscount || 0}%</span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-xs text-muted-foreground mb-1">Всего покупок:</div>
                    <div className="text-xl font-bold">{profile?.totalSpent || 0} ₽</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <History className="h-4 w-4" /> История заказов
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Настройки профиля
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders">
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <Card className="p-12 text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>У вас пока нет заказов</p>
                    </Card>
                  ) : (
                    orders.map((order) => (
                      <Card key={order.id} className="glass">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-md">Заказ #{order.id.slice(-6).toUpperCase()}</CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}
                              </p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span>{item.name} x {item.quantity}</span>
                                <span>{item.price * item.quantity} ₽</span>
                              </div>
                            ))}
                            <div className="pt-2 border-t flex justify-between font-bold">
                              <span>Итого</span>
                              <span className="text-primary">{order.totalPrice} ₽</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="profile">
                <Card className="glass">
                  <CardContent className="pt-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">ФИО</Label>
                          <Input 
                            id="name" 
                            value={editProfile.name}
                            onChange={(e) => setEditProfile({...editProfile, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Телефон</Label>
                          <Input 
                            id="phone" 
                            value={editProfile.phone}
                            onChange={(e) => setEditProfile({...editProfile, phone: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telegram">Telegram Username</Label>
                        <Input 
                          id="telegram" 
                          placeholder="@username"
                          value={editProfile.telegram}
                          onChange={(e) => setEditProfile({...editProfile, telegram: e.target.value})}
                        />
                      </div>
                      <Button type="submit" disabled={saving}>
                        {saving ? "Сохранение..." : "Сохранить изменения"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
