"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  setDoc,
  increment,
  limit
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  Settings, 
  BarChart3, 
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ShieldAlert,
  Download,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Filter,
  Eye
} from "lucide-react";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [finance, setFinance] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const totalSales = orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const pendingOrders = orders.filter(o => o.status === "new" || o.status === "processing").length;
    const activeUsers = users.length;
    const avgOrderValue = totalSales > 0 ? Math.round(totalSales / orders.filter(o => o.status === "delivered").length) : 0;
    
    return { totalSales, pendingOrders, activeUsers, avgOrderValue };
  }, [orders, users]);

  useEffect(() => {
    if (!profile?.isAdmin) return;

    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubReviews = onSnapshot(query(collection(db, "reviews"), orderBy("createdAt", "desc")), (snap) => {
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubFinance = onSnapshot(query(collection(db, "financeTransactions"), orderBy("date", "desc")), (snap) => {
      setFinance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "config"), (snap) => {
      setSettings(snap.data());
    });

    return () => {
      unsubOrders();
      unsubProducts();
      unsubUsers();
      unsubReviews();
      unsubFinance();
      unsubSettings();
    };
  }, [profile]);

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">Подождите...</div>;
  if (!profile?.isAdmin) return <div className="flex flex-col items-center justify-center min-h-screen text-destructive gap-4">
    <ShieldAlert className="w-16 h-16" />
    <h1 className="text-2xl font-bold">Доступ запрещен</h1>
    <p>Только администраторы могут просматривать эту страницу.</p>
    <Button asChild><a href="/">На главную</a></Button>
  </div>;

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      toast.success(`Статус обновлен: ${newStatus}`);
      
      if (newStatus === "delivered") {
        const order = orders.find(o => o.id === orderId);
        if (order && order.userId) {
          // Trigger loyalty recalculation (in a real app this would be in the Worker)
          const userDoc = users.find(u => u.uid === order.userId);
          if (userDoc) {
            const newTotalSpent = (userDoc.totalSpent || 0) + order.totalPrice;
            const newTotalOrders = (userDoc.totalOrders || 0) + 1;
            
            let level = 0;
            let discount = 0;
            if (newTotalSpent >= 50000 || newTotalOrders >= 25) { level = 3; discount = 10; }
            else if (newTotalSpent >= 30000 || newTotalOrders >= 10) { level = 2; discount = 7; }
            else if (newTotalSpent >= 15000 || newTotalOrders >= 3) { level = 1; discount = 5; }

            await updateDoc(doc(db, "users", userDoc.id), {
              totalSpent: newTotalSpent,
              totalOrders: newTotalOrders,
              loyaltyLevel: level,
              loyaltyDiscount: discount
            });
          }
        }
      }
    } catch (e) {
      toast.error("Ошибка обновления");
    }
  };

  const handleReviewAction = async (reviewId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await updateDoc(doc(db, "reviews", reviewId), { status: 'approved' });
      } else {
        await deleteDoc(doc(db, "reviews", reviewId));
      }
      toast.success(`Отзыв ${action === 'approve' ? 'одобрен' : 'удален'}`);
    } catch (e) {
      toast.error("Ошибка");
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(orders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "orders_export.xlsx");
  };

  const seedDatabase = async () => {
    setIsSeeding(true);
    try {
      const productsToSeed = [
        {
          name: "FreeStyle Libre 2 (RU)",
          description: "Официальная российская версия. 14 дней работы, сигналы тревоги. Прямое подключение к смартфону через NFC.",
          price: 4990,
          imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400",
          inStock: true,
          discountPercent: 0,
          features: ["14 дней", "RU Версия", "NFC"],
          costPrice: 3500
        },
        {
          name: "FreeStyle Libre 3 Plus",
          description: "Самый современный и компактный сенсор в мире. 15 дней работы. Передача данных по Bluetooth в реальном времени.",
          price: 6490,
          imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400",
          inStock: true,
          discountPercent: 5,
          features: ["15 дней", "Bluetooth", "Ультра-мини"],
          costPrice: 4800
        }
      ];

      for (const p of productsToSeed) {
        await addDoc(collection(db, "products"), p);
      }

      await setDoc(doc(db, "settings", "config"), {
        vipRules: {
          vip1: { orders: 3, spent: 15000, discount: 5, label: "Постоянный клиент" },
          vip2: { orders: 10, spent: 150000, discount: 7, label: "VIP Партнер" },
          vip3: { orders: 25, spent: 350000, discount: 10, label: "Элита" }
        },
        checkoutFields: [
          { id: "telegram", label: "Telegram Username", type: "text", required: false },
          { id: "comment", label: "Комментарий", type: "text", required: false }
        ]
      });

      toast.success("Данные успешно инициализированы!");
    } catch (e) {
      toast.error("Ошибка сидирования");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-background/60 backdrop-blur-xl border-white/20 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Выручка</p>
                <h3 className="text-3xl font-black">{stats.totalSales.toLocaleString()} ₽</h3>
                <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> +12% к прошлому месяцу
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Wallet className="w-7 h-7" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/60 backdrop-blur-xl border-white/20 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Заказы (New)</p>
                <h3 className="text-3xl font-black">{stats.pendingOrders}</h3>
                <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                  Требуют внимания
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <ShoppingCart className="w-7 h-7" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/60 backdrop-blur-xl border-white/20 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Клиенты</p>
                <h3 className="text-3xl font-black">{stats.activeUsers}</h3>
                <p className="text-xs text-orange-500 mt-1">Всего зарегистрировано</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Users className="w-7 h-7" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/60 backdrop-blur-xl border-white/20 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Средний чек</p>
                <h3 className="text-3xl font-black">{stats.avgOrderValue.toLocaleString()} ₽</h3>
                <p className="text-xs text-muted-foreground mt-1">На один заказ</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <BarChart3 className="w-7 h-7" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <TabsList className="bg-background/60 backdrop-blur-xl border-white/20 p-1.5 h-auto rounded-2xl gap-1">
              <TabsTrigger value="dashboard" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><BarChart3 className="w-4 h-4" /> Дашборд</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><ShoppingCart className="w-4 h-4" /> Заказы</TabsTrigger>
              <TabsTrigger value="products" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><Package className="w-4 h-4" /> Товары</TabsTrigger>
              <TabsTrigger value="finance" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><Wallet className="w-4 h-4" /> Финансы</TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><Users className="w-4 h-4" /> Клиенты</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all relative">
                <MessageSquare className="w-4 h-4" /> Отзывы
                {reviews.filter(r => r.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                    {reviews.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><Settings className="w-4 h-4" /> Настройки</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Поиск..." 
                  className="pl-9 h-11 bg-background/60 border-white/20 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-background/60 border-white/20"><Filter className="w-4 h-4" /></Button>
              <Button onClick={exportToExcel} variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-background/60 border-white/20"><Download className="w-4 h-4" /></Button>
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Активность продаж</CardTitle>
                  <CardDescription>Статистика за последние 6 месяцев</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <Line 
                    data={{
                      labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
                      datasets: [{
                        label: 'Продажи',
                        data: [45000, 52000, 48000, 61000, 55000, 67000],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                      }]
                    }} 
                    options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
                  />
                </CardContent>
              </Card>
              <Card className="rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Популярность моделей</CardTitle>
                  <CardDescription>Распределение заказов по товарам</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <Bar 
                    data={{
                      labels: products.map(p => p.name.split(' ')[2]),
                      datasets: [{
                        label: 'Заказано',
                        data: [120, 85, 150],
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                        borderRadius: 12
                      }]
                    }}
                    options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-xl">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="py-6 pl-8">Заказ / Дата</TableHead>
                    <TableHead>Покупатель</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="pr-8 text-right">Управление</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-6 pl-8">
                        <div className="font-black text-sm uppercase tracking-tighter">#{order.id.slice(-6)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(order.createdAt?.seconds * 1000).toLocaleString('ru-RU')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">{order.name || 'Аноним'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{order.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-black text-primary">{order.totalPrice.toLocaleString()} ₽</div>
                        <div className="text-[10px] text-muted-foreground">{order.items.length} поз.</div>
                      </TableCell>
                      <TableCell>
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-full border-none outline-none appearance-none cursor-pointer ${
                            order.status === 'new' ? 'bg-blue-500/10 text-blue-500' :
                            order.status === 'processing' ? 'bg-orange-500/10 text-orange-500' :
                            order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-muted text-muted-foreground'
                          }`}
                        >
                          <option value="new">Новый</option>
                          <option value="processing">В работе</option>
                          <option value="shipped">Отправлен</option>
                          <option value="delivered">Доставлен</option>
                          <option value="cancelled">Отменен</option>
                        </select>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl"><Eye className="w-4 h-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl rounded-[2rem]">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-black">Детали заказа #{order.id.slice(-6)}</DialogTitle>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-8 py-6">
                              <div className="space-y-6">
                                <div>
                                  <h4 className="text-xs font-black uppercase text-muted-foreground mb-3">Товары</h4>
                                  <div className="space-y-3">
                                    {order.items.map((it: any, i: number) => (
                                      <div key={i} className="flex justify-between items-center bg-muted/30 p-3 rounded-2xl border">
                                        <span className="text-sm font-bold">{it.name}</span>
                                        <span className="text-xs font-black bg-primary/10 text-primary px-2 py-1 rounded-lg">x{it.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-6">
                                <div>
                                  <h4 className="text-xs font-black uppercase text-muted-foreground mb-3">Информация о доставке</h4>
                                  <div className="bg-muted/30 p-4 rounded-2xl border space-y-2 text-sm">
                                    <p><span className="text-muted-foreground">Метод:</span> <b>{order.deliveryMethod === 'cdek' ? 'СДЭК' : 'Самовывоз'}</b></p>
                                    <p><span className="text-muted-foreground">Адрес:</span> <b>{order.address || 'г. Воронеж'}</b></p>
                                    <p><span className="text-muted-foreground">TG:</span> <b>{order.telegram || '—'}</b></p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Операции</CardTitle>
                    <CardDescription>Движение денежных средств</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="rounded-2xl h-11 px-6 gap-2"><Plus className="w-4 h-4" /> Добавить операцию</Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem]">
                      <DialogHeader><DialogTitle>Новая транзакция</DialogTitle></DialogHeader>
                      <form className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Тип</Label>
                          <select className="w-full h-12 bg-muted rounded-xl px-4 border">
                            <option value="sale">Доход (Продажа)</option>
                            <option value="purchase">Расход (Закупка)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Сумма (₽)</Label>
                          <Input placeholder="0" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Описание</Label>
                          <Input placeholder="Напр. Партия сенсоров 50шт" className="h-12 rounded-xl" />
                        </div>
                        <Button className="w-full h-12 rounded-xl mt-4">Сохранить</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-8">Дата</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead className="pr-8 text-right">Сумма</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finance.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-64 text-center text-muted-foreground">Транзакций пока нет</TableCell></TableRow>
                    ) : (
                      finance.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="pl-8">{new Date(t.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{t.description}</TableCell>
                          <TableCell>
                            {t.type === 'sale' ? <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Доход</Badge> : <Badge className="bg-red-500/10 text-red-500 border-none">Расход</Badge>}
                          </TableCell>
                          <TableCell className={`pr-8 text-right font-black ${t.type === 'sale' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {t.type === 'sale' ? '+' : '-'}{t.amount.toLocaleString()} ₽
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
              <Card className="rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-xl p-8 space-y-8">
                <div>
                  <h4 className="text-xl font-black mb-6">Баланс</h4>
                  <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary to-blue-700 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Общий баланс</p>
                    <h2 className="text-4xl font-black mb-6">128,450 ₽</h2>
                    <div className="flex justify-between items-end">
                      <div className="text-[10px] font-mono opacity-50 tracking-tighter">FSL-STORE-ADMIN-WALLET</div>
                      <div className="h-8 w-12 bg-white/20 rounded-md backdrop-blur-md" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Быстрые отчеты</h4>
                  <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 bg-white/5 justify-between px-6 group">
                    Отчет за неделю <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                  <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 bg-white/5 justify-between px-6 group">
                    Отчет за месяц <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-8 py-6">Дата / Пользователь</TableHead>
                    <TableHead>Отзыв</TableHead>
                    <TableHead>Рейтинг</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="pr-8 text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-64 text-center text-muted-foreground">Отзывов пока нет</TableCell></TableRow>
                  ) : (
                    reviews.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="pl-8 py-6">
                          <div className="font-bold">{r.userEmail}</div>
                          <div className="text-[10px] text-muted-foreground">{new Date(r.createdAt?.seconds * 1000).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm italic line-clamp-2">"{r.text}"</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex text-orange-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < r.rating ? "fill-current" : "opacity-20 text-muted-foreground"}>★</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.status === 'pending' ? <Badge className="bg-orange-500/10 text-orange-500 border-none">Ожидает</Badge> : <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Опубликован</Badge>}
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <div className="flex justify-end gap-2">
                            {r.status === 'pending' && (
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleReviewAction(r.id, 'approve')}><Check className="w-4 h-4" /></Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleReviewAction(r.id, 'reject')}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-lg">Программа лояльности</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border">
                    <Label className="text-[10px] font-black uppercase">VIP 1: Постоянный клиент</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Сумма от</span>
                        <Input defaultValue="15000" className="h-10 rounded-lg" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Скидка %</span>
                        <Input defaultValue="5" className="h-10 rounded-lg" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border">
                    <Label className="text-[10px] font-black uppercase">VIP 2: Партнер</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Сумма от</span>
                        <Input defaultValue="150000" className="h-10 rounded-lg" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Скидка %</span>
                        <Input defaultValue="7" className="h-10 rounded-lg" />
                      </div>
                    </div>
                  </div>
                  <Button className="w-full h-12 rounded-xl">Сохранить VIP-сетку</Button>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-lg">Уведомления (TG)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bot API Token</Label>
                    <Input type="password" placeholder="XXXX:YYYY" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Chat ID</Label>
                    <Input placeholder="12345678" className="h-12 rounded-xl" />
                  </div>
                  <Button className="w-full h-12 rounded-xl mt-4">Обновить ключи</Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-4">Используется Worker'ом для отправки уведомлений</p>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-primary/20 shadow-xl bg-primary/5 border-2">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Управление Системой</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-2xl bg-background/50 border space-y-3">
                    <p className="text-xs font-bold leading-relaxed italic">"Инициализация базы данных создаст начальный набор товаров, настроек и схем."</p>
                    <Button 
                      variant="outline" 
                      className="w-full h-12 rounded-xl border-primary text-primary hover:bg-primary hover:text-white transition-all gap-2"
                      onClick={seedDatabase}
                      disabled={isSeeding}
                    >
                      {isSeeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Инициализировать БД (Seed)
                    </Button>
                  </div>
                  <div className="p-4 rounded-2xl bg-background/50 border space-y-3">
                    <p className="text-xs font-bold text-destructive">ВНИМАНИЕ: Очистка кэша сбросит локальные настройки админки.</p>
                    <Button variant="outline" className="w-full h-12 rounded-xl text-destructive hover:bg-destructive hover:text-white" onClick={() => toast.info("Кэш очищен")}>Очистить Кэш</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
