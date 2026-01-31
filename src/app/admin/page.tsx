"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  updateDoc, 
  doc, 
  addDoc, 
  deleteDoc,
  onSnapshot,
  where,
  setDoc
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  Settings, 
  BarChart, 
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Check,
  X
} from "lucide-react";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalProfit: 0 });

  const seedDatabase = async () => {
    try {
      // 1. Seed Products
      const productsToSeed = [
        {
          name: "FreeStyle Libre 2 (RU)",
          description: "Официальная российская версия. 14 дней работы, сигналы тревоги. Совместим с LibreLink RU.",
          price: 4990,
          imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400",
          inStock: true,
          discountPercent: 0,
          features: ["14 дней", "Сигналы тревоги", "LibreLink RU"],
          costPrice: 3500
        },
        {
          name: "FreeStyle Libre 2 (EU)",
          description: "Европейская версия. Требует настройки (xDrip+ / патч). Идентичная точность.",
          price: 4490,
          imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400",
          inStock: true,
          discountPercent: 5,
          features: ["14 дней", "EU версия", "Выгодная цена"],
          costPrice: 3200
        },
        {
          name: "FreeStyle Libre 3 Plus",
          description: "Новинка 2026. Самый маленький в мире сенсор, 15 дней работы, трансляция данных по Bluetooth.",
          price: 6490,
          imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400",
          inStock: true,
          discountPercent: 0,
          features: ["15 дней", "Bluetooth 24/7", "Ультра-компактный"],
          costPrice: 4800
        }
      ];

      for (const p of productsToSeed) {
        await addDoc(collection(db, "products"), p);
      }

      // 2. Seed Settings
      await setDoc(doc(db, "settings", "config"), {
        vip1Threshold: 15000,
        vip1Discount: 5,
        vip2Threshold: 30000,
        vip2Discount: 10,
        vip3Threshold: 50000,
        vip3Discount: 15,
        deliveryOptions: ["Самовывоз (Воронеж)", "Доставка СДЭК по России"],
        orderFormFields: [
          { id: "name", label: "Ваше имя", type: "text", required: true },
          { id: "phone", label: "Номер телефона", type: "tel", required: true },
          { id: "telegram", label: "Telegram (по желанию)", type: "text", required: false },
          { id: "delivery", label: "Способ получения", type: "select", options: ["Самовывоз (Воронеж)", "Доставка СДЭК по России"], required: true },
          { id: "datetime", label: "Удобное время получения", type: "text", required: false }
        ]
      });

      toast.success("База данных успешно инициализирована!");
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при инициализации базы данных");
    }
  };

  useEffect(() => {
    if (!profile?.isAdmin) return;

    // Real-time listeners
    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      
      // Calculate Stats
      const delivered = data.filter(o => o.status === "delivered");
      const sales = delivered.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      setStats({
        totalSales: sales,
        totalOrders: data.length,
        totalProfit: Math.round(sales * 0.2) // Simplified 20% margin if costPrice not fully tracked
      });
    });

    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "config"), (snap) => {
      setSettings(snap.data());
    });

    return () => {
      unsubOrders();
      unsubProducts();
      unsubUsers();
      unsubSettings();
    };
  }, [profile]);

  if (authLoading) return <div className="p-12 text-center">Загрузка...</div>;
  if (!profile?.isAdmin) return <div className="p-12 text-center text-destructive">Доступ запрещен</div>;

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      toast.success(`Статус заказа обновлен на ${newStatus}`);
      
      // If delivered, update user loyalty
      if (newStatus === "delivered") {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const userRef = doc(db, "users", order.userId);
          const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", order.userId)));
          if (!userSnap.empty) {
            const userData = userSnap.docs[0].data();
            const totalSpent = (userData.totalSpent || 0) + order.totalPrice;
            const totalOrders = (userData.totalOrders || 0) + 1;
            
            // Basic loyalty logic (can be expanded with settings thresholds)
            let loyaltyLevel = userData.loyaltyLevel || 0;
            let loyaltyDiscount = userData.loyaltyDiscount || 0;
            
            if (totalSpent >= 50000) { loyaltyLevel = 3; loyaltyDiscount = 15; }
            else if (totalSpent >= 30000) { loyaltyLevel = 2; loyaltyDiscount = 10; }
            else if (totalSpent >= 15000) { loyaltyLevel = 1; loyaltyDiscount = 5; }

            await updateDoc(userSnap.docs[0].ref, {
              totalSpent,
              totalOrders,
              loyaltyLevel,
              loyaltyDiscount
            });
          }
        }
      }
    } catch (e) {
      toast.error("Ошибка при обновлении статуса");
    }
  };

  const chartData = {
    labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
    datasets: [
      {
        label: 'Продажи (₽)',
        data: [12000, 19000, 3000, 5000, 2000, 3000], // Mock historical data
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" /> Админ-панель
          </h1>
          <div className="flex gap-4">
            <Card className="px-4 py-2 flex items-center gap-4 bg-background">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Выручка</p>
                <p className="font-bold">{stats.totalSales} ₽</p>
              </div>
              <BarChart className="h-5 w-5 text-primary" />
            </Card>
            <Card className="px-4 py-2 flex items-center gap-4 bg-background">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Заказы</p>
                <p className="font-bold">{stats.totalOrders}</p>
              </div>
              <ShoppingCart className="h-5 w-5 text-orange-500" />
            </Card>
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-background border p-1 h-auto grid grid-cols-2 md:grid-cols-5 gap-1">
            <TabsTrigger value="orders" className="gap-2"><ShoppingCart className="h-4 w-4" /> Заказы</TabsTrigger>
            <TabsTrigger value="products" className="gap-2"><Package className="h-4 w-4" /> Товары</TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Клиенты</TabsTrigger>
            <TabsTrigger value="stats" className="gap-2"><BarChart className="h-4 w-4" /> Аналитика</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID / Дата</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-bold text-xs uppercase">#{order.id.slice(-6)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(order.createdAt?.seconds * 1000).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{order.name || order.userEmail}</div>
                        <div className="text-xs text-muted-foreground">{order.phone}</div>
                      </TableCell>
                      <TableCell className="font-bold">{order.totalPrice} ₽</TableCell>
                      <TableCell>
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="bg-muted text-xs p-1 rounded border"
                        >
                          <option value="new">Новый</option>
                          <option value="processing">В обработке</option>
                          <option value="shipped">Отправлен</option>
                          <option value="delivered">Доставлен</option>
                          <option value="cancelled">Отменен</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => toast.info("Детали заказа: " + JSON.stringify(order.items))}>
                          Детали
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Каталог товаров</h3>
              <Button className="gap-2" onClick={() => toast.info("Режим добавления: не реализован в демо UI")}><Plus className="h-4 w-4" /> Добавить</Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    <img src={product.imageUrl} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="pt-4">
                    <h4 className="font-bold">{product.name}</h4>
                    <p className="text-2xl font-black text-primary mt-2">{product.price} ₽</p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 gap-1"><Pencil className="h-3 w-3" /> Правка</Button>
                      <Button variant="destructive" size="sm" size="icon"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email / Имя</TableHead>
                    <TableHead>Заказы</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Loyalty</TableHead>
                    <TableHead className="text-right">Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-bold">{u.email}</div>
                        <div className="text-xs text-muted-foreground">{u.name || "Нет имени"}</div>
                      </TableCell>
                      <TableCell>{u.totalOrders || 0}</TableCell>
                      <TableCell>{u.totalSpent || 0} ₽</TableCell>
                      <TableCell>
                        <Badge variant="outline">VIP {u.loyaltyLevel || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {u.banned ? (
                          <Button size="sm" variant="outline" onClick={() => updateDoc(doc(db, "users", u.id), { banned: false })}>Разбанить</Button>
                        ) : (
                          <Button size="sm" variant="destructive" onClick={() => updateDoc(doc(db, "users", u.id), { banned: true })}>Бан</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6">
                <CardTitle className="mb-6 text-lg">Динамика выручки</CardTitle>
                <div className="h-[300px]">
                  <Line data={chartData} options={{ maintainAspectRatio: false }} />
                </div>
              </Card>
              <Card className="p-6">
                <CardTitle className="mb-6 text-lg">Популярные товары</CardTitle>
                <div className="space-y-4">
                  {products.map(p => (
                    <div key={p.id} className="flex justify-between items-center">
                      <span className="text-sm">{p.name}</span>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-2/3" />
                        </div>
                        <span className="text-xs font-bold">65%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader><CardTitle className="text-md">Настройки VIP</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Порог VIP 1 (₽)</Label>
                    <Input defaultValue="15000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Скидка VIP 1 (%)</Label>
                    <Input defaultValue="5" />
                  </div>
                  <Button className="w-full">Сохранить уровни</Button>
                </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle className="text-md">Интеграции</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Telegram Bot Token</Label>
                      <Input type="password" placeholder="XXXX:YYYY" />
                    </div>
                    <div className="space-y-2">
                      <Label>Admin Chat ID</Label>
                      <Input placeholder="12345678" />
                    </div>
                    <Button className="w-full">Обновить токены</Button>
                  </CardContent>
                </Card>
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-md text-primary">Инициализация</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Нажмите кнопку ниже, чтобы наполнить базу данных начальными товарами и настройками. 
                      Это полезно при первом запуске проекта.
                    </p>
                    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white" onClick={seedDatabase}>
                      Инициализировать БД (Seed)
                    </Button>
                  </CardContent>
                </Card>
              </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
