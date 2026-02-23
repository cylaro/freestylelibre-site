"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { normalizeOrder, normalizeProduct, normalizePurchase, normalizeReview, normalizeSale, normalizeSettings, normalizeUser, settingsDefaults, Order, Product, Purchase, Review, Sale, SettingsConfig, UserProfile } from "@/lib/schemas";
import { callApi, getApiBaseUrl, type ApiCallOptions } from "@/lib/apiClient";
import { formatTimestamp } from "@/lib/utils";
import { getAuthToken } from "@/lib/authToken";
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  onSnapshot,
  where
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DialogDescription,
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
  Activity,
  ClipboardList,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Check,
  ShieldAlert,
  Wallet,
  RefreshCw,
  Search,
  Filter,
  Eye
} from "lucide-react";
import Link from "next/link";
import { ResilientImage } from "@/components/ui/resilient-image";
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
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

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

const RESERVED_ORDER_FIELD_IDS = new Set([
  "telegram",
  "phone",
  "name",
  "deliveryMethod",
  "deliveryService",
  "city",
]);

type AdminLogLevel = "info" | "success" | "error";
type AdminLogEntry = {
  id: string;
  level: AdminLogLevel;
  message: string;
  time: string;
  details?: string;
};

function toDateValue(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  if (typeof value === "object") {
    const anyValue = value as { toDate?: () => Date; seconds?: number };
    if (typeof anyValue.toDate === "function") return anyValue.toDate();
    if (typeof anyValue.seconds === "number") return new Date(anyValue.seconds * 1000);
  }
  return null;
}

const MSK_TIMEZONE = "Europe/Moscow";
const MSK_MONTH_FORMATTER = new Intl.DateTimeFormat("ru-RU", { timeZone: MSK_TIMEZONE, month: "short" });
const MSK_MONTH_LONG_FORMATTER = new Intl.DateTimeFormat("ru-RU", { timeZone: MSK_TIMEZONE, month: "long", year: "numeric" });
const MSK_YEAR_MONTH_FORMATTER = new Intl.DateTimeFormat("ru-RU", { timeZone: MSK_TIMEZONE, year: "numeric", month: "2-digit" });
const MSK_DATE_INPUT_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: MSK_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });

function getMskMonthKey(date: Date) {
  const parts = MSK_YEAR_MONTH_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value || String(date.getFullYear());
  const month = parts.find((part) => part.type === "month")?.value || String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMskMonthShort(date: Date) {
  return MSK_MONTH_FORMATTER.format(date);
}

function formatMskMonthLong(date: Date) {
  return MSK_MONTH_LONG_FORMATTER.format(date);
}

function toMskInputDate(date: Date = new Date()) {
  return MSK_DATE_INPUT_FORMATTER.format(date);
}

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [orderListTab, setOrderListTab] = useState<"active" | "archive">("active");
  const reviewAutofillRef = useRef<Set<string>>(new Set());
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingPurchase, setIsSavingPurchase] = useState(false);
  const [isSavingSale, setIsSavingSale] = useState(false);

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productDraft, setProductDraft] = useState({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    inStock: true,
    discountPercent: 0,
    featuresText: "",
    active: true,
    costPrice: 0,
  });

  const [financeTab, setFinanceTab] = useState<"purchases" | "sales">("purchases");
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [purchaseDraft, setPurchaseDraft] = useState({
    productId: "",
    qty: 1,
    totalAmount: 0,
    comment: "",
    date: toMskInputDate(),
  });
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [saleDraft, setSaleDraft] = useState({
    productId: "",
    qty: 1,
    totalAmount: 0,
    comment: "",
    date: toMskInputDate(),
  });

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewDraft, setReviewDraft] = useState<Review | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userDraft, setUserDraft] = useState<UserProfile | null>(null);

  const [orderEditOpen, setOrderEditOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderDraft, setOrderDraft] = useState({
    deliveryMethod: "pickup" as "pickup" | "delivery",
    deliveryService: "",
    city: "",
    telegram: "",
    items: [{ productId: "", quantity: 1 }],
  });

  const [settingsDraft, setSettingsDraft] = useState<SettingsConfig>(settingsDefaults);


  const [statusSnapshot, setStatusSnapshot] = useState<{
    apiOk: boolean | null;
    firestoreOk: boolean | null;
    firestoreError: string;
    telegramConfigured: boolean | null;
    checkedAt: string;
  }>({
    apiOk: null,
    firestoreOk: null,
    firestoreError: "",
    telegramConfigured: null,
    checkedAt: "",
  });
  const [statusLoading, setStatusLoading] = useState(false);
  const [logEntries, setLogEntries] = useState<AdminLogEntry[]>([]);

  const tabMotion = {
    initial: reduceMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.35 },
  };

  const panelMotion = {
    initial: reduceMotion ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.25 },
  };

  const pushLog = useCallback((level: AdminLogLevel, message: string, details?: string) => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setLogEntries((prev) => [
      {
        id,
        level,
        message,
        details,
        time: new Date().toLocaleTimeString("ru-RU"),
      },
      ...prev,
    ].slice(0, 200));
  }, []);

  const callApiWithLog = useCallback(async <T extends Record<string, unknown> = Record<string, unknown>>(
    path: string,
    token: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
    body?: Record<string, unknown>,
    label?: string,
    options?: ApiCallOptions
  ) => {
    const title = label || `${method} ${path}`;
    pushLog("info", `Запрос: ${title}`);
    try {
      const res = await callApi<T & { soft?: boolean; warning?: string; upstreamError?: string }>(path, token, method, body, options);
      if (res.soft) {
        const details = [res.warning, res.upstreamError].filter(Boolean).join(" | ");
        pushLog("error", `Soft ACK: ${title}`, details || "Операция подтверждена оптимистично, проверьте серверные логи.");
      }
      pushLog("success", `Успешно: ${title}`);
      return res;
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : "Неизвестная ошибка";
      pushLog("error", `Ошибка: ${title}`, details);
      throw error;
    }
  }, [pushLog]);

  const refreshStatus = useCallback(async () => {
    if (!user) return;
    setStatusLoading(true);
    setStatusSnapshot((prev) => ({
      ...prev,
      apiOk: null,
      firestoreOk: null,
      firestoreError: "",
      telegramConfigured: null,
    }));
    try {
      const apiPromise = (async () => {
        try {
          const baseUrl = getApiBaseUrl();
          const res = await fetch(`${baseUrl}/api/health`);
          const data = await res.json().catch(() => null) as { status?: string } | null;
          return res.ok && data?.status === "ok";
        } catch (error: unknown) {
          const details = error instanceof Error ? error.message : "API недоступно";
          pushLog("error", "Ошибка проверки API", details);
          return false;
        }
      })();

      const statusPromise = (async () => {
        const token = await getAuthToken(user);
        return callApiWithLog<{ api: { ok: boolean }; firestore: { ok: boolean; error?: string }; telegram: { configured: boolean } }>(
          "/api/admin/status",
          token,
          "GET",
          undefined,
          "Статус системы",
          { timeoutMs: 12000, retries: 1 }
        );
      })();

      const [apiOk, status] = await Promise.all([apiPromise, statusPromise]);
      setStatusSnapshot({
        apiOk,
        firestoreOk: Boolean(status.firestore?.ok),
        firestoreError: status.firestore?.error || "",
        telegramConfigured: Boolean(status.telegram?.configured),
        checkedAt: new Date().toLocaleString("ru-RU"),
      });
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : "Неизвестная ошибка";
      pushLog("error", "Ошибка проверки статуса", details);
      const apiOk = await (async () => {
        try {
          const baseUrl = getApiBaseUrl();
          const res = await fetch(`${baseUrl}/api/health`);
          const data = await res.json().catch(() => null) as { status?: string } | null;
          return res.ok && data?.status === "ok";
        } catch {
          return false;
        }
      })();
      setStatusSnapshot((prev) => ({
        ...prev,
        apiOk,
        firestoreOk: false,
        firestoreError: details,
        telegramConfigured: prev.telegramConfigured ?? null,
        checkedAt: new Date().toLocaleString("ru-RU"),
      }));
    } finally {
      setStatusLoading(false);
    }
  }, [user, callApiWithLog, pushLog]);

  const loadServerLogs = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getAuthToken(user);
      const res = await callApiWithLog<{
        logs?: Array<{
          id?: string;
          level?: string;
          message?: string;
          requestPath?: string;
          requestMethod?: string;
          status?: number;
          details?: string;
          createdAt?: string;
        }>;
      }>(
        "/api/admin/system-logs",
        token,
        "GET",
        undefined,
        "Серверные логи",
        { timeoutMs: 12000, retries: 1, quickAckOnFailure: false }
      );

      const incoming: AdminLogEntry[] = (res.logs || []).map((item, index) => ({
        id: item.id || `server-log-${index}-${item.createdAt || Date.now()}`,
        level: item.level === "error" ? "error" : item.level === "warn" ? "error" : "info",
        message: `[server] ${item.message || "Событие API"} (${item.requestMethod || "GET"} ${item.requestPath || "unknown"})`,
        details: [item.details, typeof item.status === "number" ? `status=${item.status}` : ""].filter(Boolean).join(" | "),
        time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString("ru-RU") : new Date().toLocaleTimeString("ru-RU"),
      }));

      if (incoming.length === 0) return;
      setLogEntries((prev) => {
        const merged = new Map(prev.map((entry) => [entry.id, entry]));
        for (const entry of incoming) {
          if (!merged.has(entry.id)) {
            merged.set(entry.id, entry);
          }
        }
        return Array.from(merged.values()).slice(0, 400);
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : "Не удалось загрузить серверные логи";
      pushLog("error", "Ошибка загрузки серверных логов", details);
    }
  }, [user, callApiWithLog, pushLog]);

  const handleTelegramTest = async () => {
    if (!user) return;
    try {
      const token = await getAuthToken(user);
      await callApiWithLog("/api/admin/telegram/test", token, "POST", undefined, "Telegram тест");
      toast.success("Тестовое сообщение отправлено");
    } catch {
      toast.error("Ошибка отправки Telegram");
    }
  };

  const getOrderStatusInfo = (status: string) => {
    switch (status) {
      case "new":
        return { label: "На рассмотрении", badgeClass: "bg-blue-500/10 text-blue-500", textClass: "text-blue-500" };
      case "processing":
        return { label: "Выполняется", badgeClass: "bg-orange-500/10 text-orange-500", textClass: "text-orange-500" };
      case "delivered":
        return { label: "Выдан", badgeClass: "bg-emerald-500/10 text-emerald-500", textClass: "text-emerald-500" };
      case "cancelled":
        return { label: "Отменен", badgeClass: "bg-destructive/10 text-destructive", textClass: "text-destructive" };
      default:
        return { label: status, badgeClass: "bg-muted text-muted-foreground", textClass: "text-muted-foreground" };
    }
  };

  const formatTelegramValue = (value?: string) => {
    if (!value) return "—";
    const trimmed = value.trim();
    if (!trimmed) return "—";
    return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
  };

  const resolveDeliveryServiceLabel = useCallback((value?: string) => {
    if (!value) return "";
    const normalized = value.trim().toLowerCase();
    const match = settingsDraft.deliveryServices.find(
      (service) => service.id.toLowerCase() === normalized || service.label.toLowerCase() === normalized
    );
    return match?.label || value;
  }, [settingsDraft.deliveryServices]);

  const resolveDeliveryServiceId = useCallback((value?: string) => {
    if (!value) return "";
    const normalized = value.trim().toLowerCase();
    const match = settingsDraft.deliveryServices.find(
      (service) => service.id.toLowerCase() === normalized || service.label.toLowerCase() === normalized
    );
    return match?.id || value;
  }, [settingsDraft.deliveryServices]);

  const isArchivedStatus = useCallback((status: string) => status === "delivered" || status === "cancelled", []);

  const salesByMonth = useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];
    const getDateValue = (value?: unknown, fallback?: unknown) => toDateValue(value) || toDateValue(fallback);
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = getMskMonthKey(date);
      labels.push(formatMskMonthShort(date));
      const monthSalesQty = sales
        .filter((sale) => {
          const d = getDateValue(sale.date, sale.createdAt);
          return d && getMskMonthKey(d) === key;
        })
        .reduce((sum, sale) => sum + Number(sale.qty || 0), 0);
      data.push(monthSalesQty);
    }
    return { labels, data };
  }, [sales]);

  const productPopularity = useMemo(() => {
    const counts = new Map<string, number>();
    sales.forEach((sale) => {
      const key = sale.productId || sale.productName;
      counts.set(key, (counts.get(key) || 0) + Number(sale.qty || 0));
    });
    const labels = products.map((p) => p.name);
    const data = products.map((p) => counts.get(p.id) || counts.get(p.name) || 0);
    return { labels, data };
  }, [sales, products]);

  const monthlyFinance = useMemo(() => {
    const now = new Date();
    const getDateValue = (value?: unknown, fallback?: unknown) => toDateValue(value) || toDateValue(fallback);
    const map = new Map<string, { sales: number; purchases: number; soldQty: number; purchasedQty: number }>();

    for (const sale of sales) {
      const d = getDateValue(sale.date, sale.createdAt);
      if (!d) continue;
      const key = getMskMonthKey(d);
      const entry = map.get(key) || { sales: 0, purchases: 0, soldQty: 0, purchasedQty: 0 };
      entry.sales += Number(sale.totalAmount || 0);
      entry.soldQty += Number(sale.qty || 0);
      map.set(key, entry);
    }

    for (const purchase of purchases) {
      const d = getDateValue(purchase.date, purchase.createdAt);
      if (!d) continue;
      const key = getMskMonthKey(d);
      const entry = map.get(key) || { sales: 0, purchases: 0, soldQty: 0, purchasedQty: 0 };
      entry.purchases += Number(purchase.totalAmount || 0);
      entry.purchasedQty += Number(purchase.qty || 0);
      map.set(key, entry);
    }

    const currentKey = getMskMonthKey(now);
    const prevKey = getMskMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const current = map.get(currentKey) || { sales: 0, purchases: 0, soldQty: 0, purchasedQty: 0 };
    const previous = map.get(prevKey) || { sales: 0, purchases: 0, soldQty: 0, purchasedQty: 0 };

    const series = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = getMskMonthKey(date);
      const entry = map.get(key) || { sales: 0, purchases: 0, soldQty: 0, purchasedQty: 0 };
      series.push({
        key,
        label: formatMskMonthShort(date),
        sales: entry.sales,
        purchases: entry.purchases,
        profit: entry.sales - entry.purchases,
      });
    }

    return { current, previous, series, currentKey };
  }, [sales, purchases]);

  const inventory = useMemo(() => {
    const map = new Map<string, { productId: string; name: string; purchased: number; sold: number }>();
    products.forEach((product) => {
      map.set(product.id, { productId: product.id, name: product.name, purchased: 0, sold: 0 });
    });

    purchases.forEach((purchase) => {
      const existing = map.get(purchase.productId) || {
        productId: purchase.productId,
        name: purchase.productName || "Товар",
        purchased: 0,
        sold: 0,
      };
      existing.purchased += Number(purchase.qty || 0);
      map.set(purchase.productId, existing);
    });

    sales.forEach((sale) => {
      const existing = map.get(sale.productId) || {
        productId: sale.productId,
        name: sale.productName || "Товар",
        purchased: 0,
        sold: 0,
      };
      existing.sold += Number(sale.qty || 0);
      map.set(sale.productId, existing);
    });

    return Array.from(map.values()).map((item) => ({
      ...item,
      stock: item.purchased - item.sold,
    }));
  }, [products, purchases, sales]);

  const totals = useMemo(() => {
    const totalStock = inventory.reduce((sum, item) => sum + item.stock, 0);
    const totalSold = sales.reduce((sum, sale) => sum + Number(sale.qty || 0), 0);
    const totalPurchased = purchases.reduce((sum, purchase) => sum + Number(purchase.qty || 0), 0);
    return { totalStock, totalSold, totalPurchased };
  }, [inventory, sales, purchases]);

  const inventorySorted = useMemo(
    () => [...inventory].sort((a, b) => b.stock - a.stock),
    [inventory]
  );

  const inventoryByProductId = useMemo(() => {
    return new Map(inventory.map((item) => [item.productId, item]));
  }, [inventory]);

  const getOrderStockIssue = useCallback((order: Order) => {
    if (!order?.items?.length) return "";
    const required = new Map<string, { qty: number; name: string }>();
    for (const item of order.items) {
      if (!item?.productId) continue;
      const existing = required.get(item.productId) || { qty: 0, name: item.name || "Товар" };
      existing.qty += Number(item.quantity || 0);
      required.set(item.productId, existing);
    }
    for (const [productId, info] of required.entries()) {
      const stockItem = inventoryByProductId.get(productId);
      const available = stockItem?.stock ?? 0;
      if (info.qty > available) {
        return `Недостаточно остатка по товару: ${info.name}. Доступно ${Math.max(0, available)} шт.`;
      }
    }
    return "";
  }, [inventoryByProductId]);

  const stats = useMemo(() => {
    const pendingOrders = orders.filter(order => order.status === "new" || order.status === "processing").length;
    const activeUsers = users.length;
    const currentKey = getMskMonthKey(new Date());
    const getMonthKeyFrom = (value?: unknown, fallback?: unknown) => {
      const date = toDateValue(value) || toDateValue(fallback);
      return date ? getMskMonthKey(date) : "";
    };

    const deliveredOrdersCurrent = orders.filter(order =>
      order.status === "delivered" && getMonthKeyFrom(order.deliveredAt, order.createdAt) === currentKey
    );
    const manualSalesCurrent = sales.filter(sale =>
      sale.sourceType === "manual" && getMonthKeyFrom(sale.date, sale.createdAt) === currentKey
    );
    const avgCheckBase = deliveredOrdersCurrent.length + manualSalesCurrent.length;
    const avgOrderValue = avgCheckBase > 0 ? Math.round(monthlyFinance.current.sales / avgCheckBase) : 0;
    const totalSales = monthlyFinance.current.sales - monthlyFinance.current.purchases;

    return { totalSales, pendingOrders, activeUsers, avgOrderValue };
  }, [orders, users, sales, monthlyFinance]);


  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredOrders = useMemo(() => {
    const base = normalizedQuery ? orders.filter(order =>
      order.id.toLowerCase().includes(normalizedQuery) ||
      order.name.toLowerCase().includes(normalizedQuery) ||
      (order.userEmail || "").toLowerCase().includes(normalizedQuery) ||
      (order.phone || "").toLowerCase().includes(normalizedQuery)
    ) : orders;
    return orderListTab === "archive"
      ? base.filter(order => isArchivedStatus(order.status))
      : base.filter(order => !isArchivedStatus(order.status));
  }, [orders, normalizedQuery, orderListTab, isArchivedStatus]);

  const activeOrdersCount = useMemo(
    () => orders.filter(order => !isArchivedStatus(order.status)).length,
    [orders, isArchivedStatus]
  );

  const archiveOrdersCount = useMemo(
    () => orders.filter(order => isArchivedStatus(order.status)).length,
    [orders, isArchivedStatus]
  );

  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery)
    );
  }, [products, normalizedQuery]);

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) return users;
    return users.filter(userItem =>
      (userItem.email || "").toLowerCase().includes(normalizedQuery) ||
      (userItem.name || "").toLowerCase().includes(normalizedQuery) ||
      (userItem.phone || "").toLowerCase().includes(normalizedQuery)
    );
  }, [users, normalizedQuery]);

  const filteredReviews = useMemo(() => {
    if (!normalizedQuery) return reviews;
    return reviews.filter(review =>
      review.text.toLowerCase().includes(normalizedQuery) ||
      (review.userEmail || "").toLowerCase().includes(normalizedQuery) ||
      (review.userName || "").toLowerCase().includes(normalizedQuery)
    );
  }, [reviews, normalizedQuery]);

  const filteredPurchases = useMemo(() => {
    if (!normalizedQuery) return purchases;
    return purchases.filter((purchase) =>
      purchase.productName.toLowerCase().includes(normalizedQuery) ||
      (purchase.comment || "").toLowerCase().includes(normalizedQuery) ||
      purchase.id.toLowerCase().includes(normalizedQuery)
    );
  }, [purchases, normalizedQuery]);

  const filteredSales = useMemo(() => {
    if (!normalizedQuery) return sales;
    return sales.filter((sale) =>
      sale.productName.toLowerCase().includes(normalizedQuery) ||
      (sale.comment || "").toLowerCase().includes(normalizedQuery) ||
      sale.id.toLowerCase().includes(normalizedQuery)
    );
  }, [sales, normalizedQuery]);

  useEffect(() => {
    if (!profile?.isAdmin) return;

    const unsubOrders = onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      (snap) => {
        setOrders(snap.docs.map(doc => normalizeOrder(doc.id, doc.data())));
      },
      (error) => {
        pushLog("error", "Firestore: заказы", error?.message || "Ошибка загрузки заказов");
      }
    );

    const unsubProducts = onSnapshot(
      query(collection(db, "products"), where("active", "==", true), orderBy("sortOrder", "asc")),
      (snap) => {
        setProducts(snap.docs.map(doc => normalizeProduct(doc.id, doc.data())));
      },
      (error) => {
        pushLog("error", "Firestore: товары", error?.message || "Ошибка загрузки товаров");
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setUsers(
          snap.docs.map(docSnap => {
            const data = docSnap.data();
            return normalizeUser(data, { uid: docSnap.id, email: data.email || "" });
          })
        );
      },
      (error) => {
        pushLog("error", "Firestore: клиенты", error?.message || "Ошибка загрузки клиентов");
      }
    );

    const unsubReviews = onSnapshot(
      query(collection(db, "reviews"), orderBy("createdAt", "desc")),
      (snap) => {
        setReviews(snap.docs.map(doc => normalizeReview(doc.id, doc.data())));
      },
      (error) => {
        pushLog("error", "Firestore: отзывы", error?.message || "Ошибка загрузки отзывов");
      }
    );

    const unsubPurchases = onSnapshot(
      collection(db, "purchases"),
      (snap) => {
        const items = snap.docs.map(doc => normalizePurchase(doc.id, doc.data()));
        items.sort((a, b) => (toDateValue(b.date)?.getTime() || 0) - (toDateValue(a.date)?.getTime() || 0));
        setPurchases(items);
      },
      (error) => {
        pushLog("error", "Firestore: закупки", error?.message || "Ошибка загрузки закупок");
      }
    );

    const unsubSales = onSnapshot(
      collection(db, "sales"),
      (snap) => {
        const items = snap.docs.map(doc => normalizeSale(doc.id, doc.data()));
        items.sort(
          (a, b) =>
            (toDateValue(b.createdAt)?.getTime() || toDateValue(b.date)?.getTime() || 0) -
            (toDateValue(a.createdAt)?.getTime() || toDateValue(a.date)?.getTime() || 0)
        );
        setSales(items);
      },
      (error) => {
        pushLog("error", "Firestore: продажи", error?.message || "Ошибка загрузки продаж");
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, "settings", "config"),
      (snap) => {
        const data = snap.exists() ? normalizeSettings(snap.data()) : settingsDefaults;
        setSettingsDraft(data);
      },
      (error) => {
        pushLog("error", "Firestore: настройки", error?.message || "Ошибка загрузки настроек");
      }
    );

    return () => {
      unsubOrders();
      unsubProducts();
      unsubUsers();
      unsubReviews();
      unsubPurchases();
      unsubSales();
      unsubSettings();
    };
  }, [profile, pushLog]);

  useEffect(() => {
    if (!profile?.isAdmin || !user) return;
    if (reviews.length === 0 || users.length === 0) return;
    const usersMap = new Map(users.map((item) => [item.uid, item]));
    const targets = reviews.filter((review) =>
      !review.userName &&
      review.userId &&
      review.userId !== "seed" &&
      !reviewAutofillRef.current.has(review.id)
    );
    if (targets.length === 0) return;

    const syncNames = async () => {
      const token = await getAuthToken(user);
      for (const review of targets) {
        reviewAutofillRef.current.add(review.id);
        const userProfile = usersMap.get(review.userId);
        const name = (userProfile?.name || "").trim();
        if (!name) continue;
        try {
          await callApiWithLog(
            `/api/admin/reviews/${review.id}`,
            token,
            "POST",
            { status: review.status, userName: name },
            "Автозаполнение имени"
          );
        } catch (error) {
          console.error("Failed to update review name", error);
        }
      }
    };

    syncNames();
  }, [reviews, users, user, profile, callApiWithLog]);

  useEffect(() => {
    if (activeTab === "status") {
      refreshStatus();
    }
    if (activeTab === "logs") {
      loadServerLogs();
    }
  }, [activeTab, user, refreshStatus, loadServerLogs]);

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">Подождите...</div>;
  if (!profile?.isAdmin) return <div className="flex flex-col items-center justify-center min-h-screen text-destructive gap-4">
    <ShieldAlert className="w-16 h-16" />
    <h1 className="text-2xl font-bold">Доступ запрещен</h1>
    <p>Только администраторы могут просматривать эту страницу.</p>
    <Button asChild><Link href="/">На главную</Link></Button>
  </div>;

  const apiBadge = getStatusBadge(statusSnapshot.apiOk, "OK", "Недоступен");
  const firestoreBadge = getStatusBadge(statusSnapshot.firestoreOk, "OK", "Ошибка");
  const telegramBadge = statusSnapshot.telegramConfigured === null
    ? { label: "Проверка...", className: "bg-muted text-muted-foreground border-none" }
    : statusSnapshot.telegramConfigured
      ? { label: "Конфиг найден", className: "bg-emerald-500/10 text-emerald-500 border-none" }
      : { label: "Не настроен", className: "bg-muted text-muted-foreground border-none" };

  const now = new Date();
  const currentMonthLabel = formatMskMonthLong(now);
  const currentProfit = monthlyFinance.current.sales - monthlyFinance.current.purchases;
  const sixMonthProfit = monthlyFinance.series.reduce((sum, item) => sum + item.profit, 0);
  const canSavePurchase = Boolean(
    purchaseDraft.productId &&
      Number(purchaseDraft.qty || 0) > 0 &&
      Number(purchaseDraft.totalAmount || 0) > 0
  );
  const canSaveSale = Boolean(
    saleDraft.productId &&
      Number(saleDraft.qty || 0) > 0 &&
      Number(saleDraft.totalAmount || 0) > 0
  );

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, stockIssue?: string) => {
    if (!user) return;
    if (newStatus === "cancelled") {
      const confirmed = window.confirm("Отменить заказ и удалить его из базы данных?");
      if (!confirmed) return;
      try {
        const token = await getAuthToken(user);
        await callApiWithLog(
          `/api/admin/orders/${orderId}/status`,
          token,
          "POST",
          { status: newStatus },
          "Отмена заказа",
          { timeoutMs: 20000 }
        );
        toast.success("Заказ отменен и удален");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Ошибка удаления";
        toast.error(message);
      }
      return;
    }
    if (newStatus === "delivered" && stockIssue) {
      toast.error(stockIssue);
      return;
    }
    try {
      const token = await getAuthToken(user);
      await callApiWithLog(
        `/api/admin/orders/${orderId}/status`,
        token,
        "POST",
        { status: newStatus },
        "Статус заказа",
        { timeoutMs: 20000 }
      );
      toast.success(`Статус обновлен: ${getOrderStatusInfo(newStatus).label}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка обновления";
      toast.error(message);
    }
  };

  const openOrderEditDialog = (order: Order) => {
    const items = order.items?.length
      ? order.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      : [{ productId: products[0]?.id || "", quantity: 1 }];
    setEditingOrder(order);
    setOrderDraft({
      deliveryMethod: order.deliveryMethod || "pickup",
      deliveryService: resolveDeliveryServiceId(order.deliveryService || ""),
      city: order.city || "",
      telegram: order.telegram || "",
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
      (orderDraft.deliveryMethod === "pickup" || (orderDraft.deliveryService && orderDraft.city))
  );

  const handleSaveOrderEdit = async () => {
    if (!user || !editingOrder) return;
    if (editingOrder.status === "delivered") {
      toast.error("Нельзя менять выданный заказ");
      return;
    }
    try {
      const token = await getAuthToken(user);
      await callApiWithLog(
        `/api/admin/orders/${editingOrder.id}/update`,
        token,
        "POST",
        {
          items: orderDraft.items.map((item) => ({ id: item.productId, quantity: Number(item.quantity || 0) })),
          deliveryMethod: orderDraft.deliveryMethod,
          deliveryService: orderDraft.deliveryMethod === "delivery" ? orderDraft.deliveryService : "",
          city: orderDraft.deliveryMethod === "delivery" ? orderDraft.city : "",
          telegram: orderDraft.telegram,
        },
        "Обновление заказа"
      );
      toast.success("Заказ обновлен");
      setOrderEditOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка обновления заказа";
      toast.error(message);
    }
  };

  const handleReviewAction = async (reviewId: string, action: "approve" | "reject") => {
    if (!user) return;
    try {
      const token = await getAuthToken(user);
      await callApiWithLog(`/api/admin/reviews/${reviewId}`, token, "POST", {
        status: action === "approve" ? "approved" : "rejected",
      }, "Модерация отзыва");
      toast.success(`Отзыв ${action === "approve" ? "одобрен" : "отклонен"}`);
    } catch {
      toast.error("Ошибка");
    }
  };

  const openReviewDialog = (review: Review) => {
    setReviewDraft({ ...review });
    setReviewDialogOpen(true);
  };

  const handleSaveReview = async () => {
    if (!user || !reviewDraft) return;
    try {
      const token = await getAuthToken(user);
      await callApiWithLog(`/api/admin/reviews/${reviewDraft.id}`, token, "POST", {
        text: reviewDraft.text,
        rating: Math.min(5, Math.max(1, Number(reviewDraft.rating || 5))),
        status: reviewDraft.status,
        userName: reviewDraft.userName || "",
      }, "Редактирование отзыва");
      toast.success("Отзыв обновлен");
      setReviewDialogOpen(false);
    } catch {
      toast.error("Ошибка обновления отзыва");
    }
  };

  const openUserDialog = (userItem: UserProfile) => {
    setUserDraft({ ...userItem });
    setUserDialogOpen(true);
  };

  const getVipDiscountByLevel = (level: number) => {
    if (level === 1) return settingsDraft.vipRules.vip1.discount;
    if (level === 2) return settingsDraft.vipRules.vip2.discount;
    if (level === 3) return settingsDraft.vipRules.vip3.discount;
    return 0;
  };

  function getStatusBadge(value: boolean | null, okLabel: string, failLabel: string) {
    if (value === null) {
      return { label: "Проверка...", className: "bg-muted text-muted-foreground border-none" };
    }
    return value
      ? { label: okLabel, className: "bg-emerald-500/10 text-emerald-500 border-none" }
      : { label: failLabel, className: "bg-red-500/10 text-red-500 border-none" };
  }

  const handleSaveUser = async () => {
    if (!user || !userDraft) return;
    try {
      const token = await getAuthToken(user);
      await callApiWithLog(`/api/admin/users/${userDraft.uid}`, token, "POST", {
        isBanned: Boolean(userDraft.isBanned),
        banReason: userDraft.banReason || "",
        loyaltyLevel: Number(userDraft.loyaltyLevel || 0),
        loyaltyDiscount: Number(userDraft.loyaltyDiscount || 0),
      }, "Обновление клиента");
      toast.success("Профиль клиента обновлен");
      setUserDialogOpen(false);
    } catch {
      toast.error("Ошибка обновления клиента");
    }
  };

  const seedDatabase = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      const token = await getAuthToken(user);
      await callApiWithLog("/api/admin/seed", token, "POST", undefined, "Seed БД");
      toast.success("Данные успешно инициализированы!");
    } catch {
      toast.error("Ошибка сидирования");
    } finally {
      setIsSeeding(false);
    }
  };

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductDraft({
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        inStock: product.inStock,
        discountPercent: product.discountPercent,
        featuresText: product.features.join(", "),
        active: product.active,
        costPrice: product.costPrice || 0,
      });
    } else {
      setEditingProduct(null);
      setProductDraft({
        name: "",
        description: "",
        price: 0,
        imageUrl: "",
        inStock: true,
        discountPercent: 0,
        featuresText: "",
        active: true,
        costPrice: 0,
      });
    }
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!user || isSavingProduct) return;
    setIsSavingProduct(true);
    try {
      const token = await getAuthToken(user);
      const payload = {
        name: productDraft.name,
        description: productDraft.description,
        price: Number(productDraft.price || 0),
        imageUrl: productDraft.imageUrl,
        inStock: Boolean(productDraft.inStock),
        discountPercent: Number(productDraft.discountPercent || 0),
        features: productDraft.featuresText
          .split(",")
          .map(item => item.trim())
          .filter(Boolean),
        active: Boolean(productDraft.active),
        costPrice: Number(productDraft.costPrice || 0),
      };
      if (editingProduct) {
        await callApiWithLog(`/api/admin/products/${editingProduct.id}`, token, "PUT", payload, "Обновление товара");
      } else {
        await callApiWithLog("/api/admin/products", token, "POST", payload, "Создание товара");
      }
      toast.success("Товар сохранен");
      setProductDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка сохранения товара";
      toast.error(message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user) return;
    try {
      const token = await getAuthToken(user);
      await callApiWithLog(`/api/admin/products/${productId}`, token, "DELETE", undefined, "Удаление товара");
      toast.success("Товар удален");
    } catch {
      toast.error("Ошибка удаления товара");
    }
  };

  const openPurchaseDialog = (purchase?: Purchase) => {
    if (purchase) {
      setEditingPurchase(purchase);
      const dateValue = toDateValue(purchase.date) || new Date();
      setPurchaseDraft({
        productId: purchase.productId,
        qty: purchase.qty,
        totalAmount: purchase.totalAmount,
        comment: purchase.comment || "",
        date: toMskInputDate(dateValue),
      });
    } else {
      setEditingPurchase(null);
      setPurchaseDraft({
        productId: products[0]?.id || "",
        qty: 1,
        totalAmount: 0,
        comment: "",
        date: toMskInputDate(),
      });
    }
    setPurchaseDialogOpen(true);
  };

  const openSaleDialog = (sale?: Sale) => {
    if (sale) {
      setEditingSale(sale);
      const dateValue = toDateValue(sale.date) || new Date();
      setSaleDraft({
        productId: sale.productId,
        qty: sale.qty,
        totalAmount: sale.totalAmount,
        comment: sale.comment || "",
        date: toMskInputDate(dateValue),
      });
    } else {
      setEditingSale(null);
      setSaleDraft({
        productId: products[0]?.id || "",
        qty: 1,
        totalAmount: 0,
        comment: "",
        date: toMskInputDate(),
      });
    }
    setSaleDialogOpen(true);
  };

  const handleSavePurchase = async () => {
    if (!user || isSavingPurchase) return;
    setIsSavingPurchase(true);
    try {
      const token = await getAuthToken(user);
      const payload = {
        productId: purchaseDraft.productId,
        qty: Number(purchaseDraft.qty || 0),
        totalAmount: Number(purchaseDraft.totalAmount || 0),
        comment: purchaseDraft.comment || "",
        date: purchaseDraft.date,
      };
      if (editingPurchase) {
        await callApiWithLog(`/api/admin/purchases/${editingPurchase.id}`, token, "PUT", payload, "Обновление закупки");
      } else {
        await callApiWithLog("/api/admin/purchases", token, "POST", payload, "Создание закупки");
      }
      toast.success("Закупка сохранена");
      setPurchaseDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка сохранения закупки";
      toast.error(message);
    } finally {
      setIsSavingPurchase(false);
    }
  };

  const handleSaveSale = async () => {
    if (!user || isSavingSale) return;
    setIsSavingSale(true);
    try {
      const token = await getAuthToken(user);
      const payload = {
        productId: saleDraft.productId,
        qty: Number(saleDraft.qty || 0),
        totalAmount: Number(saleDraft.totalAmount || 0),
        comment: saleDraft.comment || "",
        date: saleDraft.date,
      };
      if (editingSale) {
        await callApiWithLog(`/api/admin/sales/${editingSale.id}`, token, "PUT", payload, "Обновление продажи");
      } else {
        await callApiWithLog("/api/admin/sales", token, "POST", payload, "Создание продажи");
      }
      toast.success("Продажа сохранена");
      setSaleDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка сохранения продажи";
      toast.error(message);
    } finally {
      setIsSavingSale(false);
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!user) return;
    try {
      const token = await getAuthToken(user);
      await callApiWithLog(`/api/admin/purchases/${purchaseId}`, token, "DELETE", undefined, "Удаление закупки");
      toast.success("Закупка удалена");
    } catch {
      toast.error("Ошибка удаления закупки");
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!user) return;
    try {
      const token = await getAuthToken(user);
      await callApiWithLog(`/api/admin/sales/${saleId}`, token, "DELETE", undefined, "Удаление продажи");
      toast.success("Продажа удалена");
    } catch {
      toast.error("Ошибка удаления продажи");
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    try {
      const token = await getAuthToken(user);
      const seen = new Set<string>();
      const fields = settingsDraft.orderForm.fields
        .map(field => ({
          ...field,
          id: field.id.trim(),
          label: field.label.trim(),
          placeholder: field.placeholder?.trim() || "",
        }))
        .filter(field => field.id && field.label)
        .filter(field => !RESERVED_ORDER_FIELD_IDS.has(field.id))
        .filter(field => {
          if (seen.has(field.id)) return false;
          seen.add(field.id);
          return true;
        });
      const serviceSeen = new Set<string>();
      const deliveryServices = settingsDraft.deliveryServices
        .map((service, index) => ({
          ...service,
          id: service.id.trim(),
          label: service.label.trim(),
          sortOrder: Number(service.sortOrder || index + 1),
        }))
        .filter(service => service.id && service.label)
        .filter(service => {
          if (serviceSeen.has(service.id)) return false;
          serviceSeen.add(service.id);
          return true;
        });
      const media = {
        heroImageUrl: settingsDraft.media.heroImageUrl.trim(),
        guideImageUrl: settingsDraft.media.guideImageUrl.trim(),
      };
      await callApiWithLog("/api/admin/settings", token, "POST", {
        ...settingsDraft,
        deliveryServices,
        orderForm: {
          ...settingsDraft.orderForm,
          fields,
        },
        media,
      }, "Настройки");
      toast.success("Настройки сохранены");
    } catch {
      toast.error("Ошибка сохранения настроек");
    }
  };

  const updateVipRule = (tier: "vip1" | "vip2" | "vip3", field: keyof SettingsConfig["vipRules"]["vip1"], value: string | number) => {
    setSettingsDraft(prev => ({
      ...prev,
      vipRules: {
        ...prev.vipRules,
        [tier]: {
          ...prev.vipRules[tier],
          [field]: value,
        },
      },
    }));
  };

  const addOrderField = () => {
    setSettingsDraft(prev => ({
      ...prev,
      orderForm: {
        ...prev.orderForm,
        fields: [
          ...prev.orderForm.fields,
          {
            id: `field_${Date.now()}`,
            label: "Новый вопрос",
            type: "text",
            required: false,
            placeholder: "",
          },
        ],
      },
    }));
  };

  const updateOrderField = (index: number, patch: Partial<SettingsConfig["orderForm"]["fields"][number]>) => {
    setSettingsDraft(prev => ({
      ...prev,
      orderForm: {
        ...prev.orderForm,
        fields: prev.orderForm.fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
      },
    }));
  };

  const removeOrderField = (index: number) => {
    setSettingsDraft(prev => ({
      ...prev,
      orderForm: {
        ...prev.orderForm,
        fields: prev.orderForm.fields.filter((_, i) => i !== index),
      },
    }));
  };

  const addDeliveryService = () => {
    setSettingsDraft(prev => ({
      ...prev,
      deliveryServices: [
        ...prev.deliveryServices,
        {
          id: `service_${Date.now()}`,
          label: "Новая служба",
          active: true,
          sortOrder: prev.deliveryServices.length + 1,
        },
      ],
    }));
  };

  const updateDeliveryService = (index: number, patch: Partial<SettingsConfig["deliveryServices"][number]>) => {
    setSettingsDraft(prev => ({
      ...prev,
      deliveryServices: prev.deliveryServices.map((service, i) => (i === index ? { ...service, ...patch } : service)),
    }));
  };

  const removeDeliveryService = (index: number) => {
    setSettingsDraft(prev => ({
      ...prev,
      deliveryServices: prev.deliveryServices.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container pt-24 pb-12">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-background/60 backdrop-blur-xl border-white/20 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Выручка</p>
                <h3 className={`text-2xl sm:text-3xl font-black ${stats.totalSales >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {stats.totalSales.toLocaleString()} ₽
                </h3>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  Текущий месяц: продажи − закупки
                </p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/60 backdrop-blur-xl border-white/20 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Заказы (New)</p>
                <h3 className="text-2xl sm:text-3xl font-black">{stats.pendingOrders}</h3>
                <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                  Требуют внимания
                </p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/60 backdrop-blur-xl border-white/20 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Клиенты</p>
                <h3 className="text-2xl sm:text-3xl font-black">{stats.activeUsers}</h3>
                <p className="text-xs text-orange-500 mt-1">Всего зарегистрировано</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Users className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/60 backdrop-blur-xl border-white/20 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Средний чек</p>
                <h3 className="text-2xl sm:text-3xl font-black">{stats.avgOrderValue.toLocaleString()} ₽</h3>
                <p className="text-xs text-muted-foreground mt-1">На один заказ</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <TabsList className="bg-background/60 backdrop-blur-xl border-white/20 p-1.5 h-auto rounded-2xl gap-2 flex w-full flex-nowrap overflow-x-auto md:flex-wrap md:overflow-x-visible">
              <TabsTrigger value="dashboard" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"><BarChart3 className="w-4 h-4" /> Дашборд</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"><ShoppingCart className="w-4 h-4" /> Заказы</TabsTrigger>
              <TabsTrigger value="finance" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"><Wallet className="w-4 h-4" /> Финансы</TabsTrigger>
              <TabsTrigger value="products" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"><Package className="w-4 h-4" /> Товары</TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"><Users className="w-4 h-4" /> Клиенты</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all relative whitespace-nowrap">
                <MessageSquare className="w-4 h-4" /> Отзывы
                {reviews.filter(r => r.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                    {reviews.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"><Settings className="w-4 h-4" /> Настройки</TabsTrigger>
              <TabsTrigger value="status" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"><Activity className="w-4 h-4" /> Статусы</TabsTrigger>
              <TabsTrigger value="logs" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"><ClipboardList className="w-4 h-4" /> Логи</TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
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
            </div>
          </div>

          <TabsContent value="dashboard">
            <motion.div {...tabMotion} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
              <Card className="rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Продажи (шт.)</CardTitle>
                  <CardDescription>Количество проданных сенсоров за 6 месяцев</CardDescription>
                </CardHeader>
                <CardContent className="h-[220px] sm:h-[260px] md:h-[350px]">
                  <Line 
                    data={{
                      labels: salesByMonth.labels,
                      datasets: [{
                        label: 'Продано (шт.)',
                        data: salesByMonth.data,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
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
                  <CardDescription>Распределение продаж по товарам</CardDescription>
                </CardHeader>
                <CardContent className="h-[220px] sm:h-[260px] md:h-[350px]">
                  <Bar 
                    data={{
                      labels: productPopularity.labels,
                      datasets: [{
                        label: 'Продано (шт.)',
                        data: productPopularity.data,
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                        borderRadius: 12
                      }]
                    }}
                    options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                  />
                </CardContent>
              </Card>
            </div>
          </motion.div>
          </TabsContent>

          <TabsContent value="orders">
            <motion.div {...tabMotion} className="space-y-8">
            <Card className="rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-xl">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Заказы</CardTitle>
                  <CardDescription>Управление заказами и статусами</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={orderListTab === "active" ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => setOrderListTab("active")}
                  >
                    Активные ({activeOrdersCount})
                  </Button>
                  <Button
                    variant={orderListTab === "archive" ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => setOrderListTab("archive")}
                  >
                    Архив ({archiveOrdersCount})
                  </Button>
                </div>
              </CardHeader>
              <AnimatePresence mode="wait">
                <motion.div key={orderListTab} {...panelMotion}>
                  <div className="hidden md:block">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="py-6 pl-8">Заказ / Дата</TableHead>
                        <TableHead>Покупатель</TableHead>
                        <TableHead>Состав</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Управление</TableHead>
                        <TableHead className="pr-8">Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                            Нет заказов по текущему фильтру
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => {
                          const stockIssue = getOrderStockIssue(order);
                          const statusInfo = getOrderStatusInfo(order.status);
                          const statusValue = order.status;
                          const itemsPreview = order.items.slice(0, 2);
                          const extraItems = Math.max(0, order.items.length - itemsPreview.length);
                          return (
                            <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="py-6 pl-8">
                                <div className="text-[13px] font-semibold uppercase tracking-widest text-foreground/80">#{order.id.slice(-6)}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {formatTimestamp(order.createdAt, "ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) || "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-bold">{order.name || 'Аноним'}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{order.phoneE164 || order.phone || "—"}</div>
                                <div className="text-xs text-muted-foreground">{formatTelegramValue(order.telegram)}</div>
                              </TableCell>
                              <TableCell>
                                {order.items.length === 0 ? (
                                  <span className="text-xs text-muted-foreground">—</span>
                                ) : (
                                  <div className="space-y-1">
                                    {itemsPreview.map((it, idx) => (
                                      <div key={`${it.productId}-${idx}`} className="flex items-center gap-2 text-xs">
                                        <span className="font-semibold text-foreground/80 line-clamp-1 max-w-[180px]">{it.name}</span>
                                        <span className="text-[11px] font-semibold text-muted-foreground">x{it.quantity}</span>
                                      </div>
                                    ))}
                                    {extraItems > 0 && (
                                      <div className="text-[10px] text-muted-foreground">+ еще {extraItems}</div>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-black text-primary">{order.totalPrice.toLocaleString()} ₽</div>
                                <div className="text-[10px] text-muted-foreground">{order.items.length} поз.</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" className="h-9 px-3 rounded-xl gap-2">
                                        <Eye className="w-4 h-4" /> Детали
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-[2rem] w-full sm:max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle className="text-2xl font-black">Детали заказа #{order.id.slice(-6)}</DialogTitle>
                                        <DialogDescription className="text-muted-foreground">
                                          Информация о составе заказа и параметрах доставки.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="grid gap-6 md:grid-cols-2 py-6">
                                        <div className="space-y-6">
                                          <div>
                                            <h4 className="text-xs font-black uppercase text-muted-foreground mb-3">Товары</h4>
                                            <div className="space-y-3">
                                              {order.items.map((it, i) => (
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
                                            <h4 className="text-xs font-black uppercase text-muted-foreground mb-3">Клиент</h4>
                                            <div className="bg-muted/30 p-4 rounded-2xl border space-y-2 text-sm">
                                              <p><span className="text-muted-foreground">Имя:</span> <b>{order.name || "—"}</b></p>
                                              <p><span className="text-muted-foreground">Телефон:</span> <b>{order.phoneE164 || order.phone || "—"}</b></p>
                                              <p><span className="text-muted-foreground">TG:</span> <b>{formatTelegramValue(order.telegram)}</b></p>
                                              {order.userEmail && (
                                                <p><span className="text-muted-foreground">Email:</span> <b>{order.userEmail}</b></p>
                                              )}
                                            </div>
                                          </div>
                                          <div>
                                            <h4 className="text-xs font-black uppercase text-muted-foreground mb-3">Получение</h4>
                                            <div className="bg-muted/30 p-4 rounded-2xl border space-y-2 text-sm">
                                              <p><span className="text-muted-foreground">Метод:</span> <b>{order.deliveryMethod === 'delivery' ? 'Доставка' : 'Самовывоз'}</b></p>
                                              {order.deliveryMethod === "delivery" && (
                                                <>
                                                <p><span className="text-muted-foreground">Служба:</span> <b>{resolveDeliveryServiceLabel(order.deliveryService) || "—"}</b></p>
                                                  <p><span className="text-muted-foreground">Город:</span> <b>{order.city || "—"}</b></p>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                          {order.customFields && Object.keys(order.customFields).length > 0 && (
                                            <div>
                                              <h4 className="text-xs font-black uppercase text-muted-foreground mb-3">Доп. поля</h4>
                                              <div className="bg-muted/30 p-4 rounded-2xl border space-y-2 text-sm">
                                                {Object.entries(order.customFields).map(([key, value]) => (
                                                  <p key={key}><span className="text-muted-foreground">{key}:</span> <b>{value || "—"}</b></p>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  {order.status !== "delivered" && (
                                    <Button variant="ghost" className="h-9 px-3 rounded-xl gap-2" onClick={() => openOrderEditDialog(order)}>
                                      <Pencil className="w-4 h-4" /> Изменить
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="pr-8">
                                <Select value={statusValue} onValueChange={(value) => handleUpdateOrderStatus(order.id, value, stockIssue)}>
                                  <SelectTrigger className={`h-9 min-w-[140px] rounded-full px-3 text-[11px] font-bold border border-white/10 ${statusInfo.badgeClass}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl border-white/10 bg-background/90 backdrop-blur-xl shadow-2xl">
                                    {["new", "processing", "delivered", "cancelled"].map((statusOption) => {
                                      const info = getOrderStatusInfo(statusOption);
                                      return (
                                        <SelectItem
                                          key={statusOption}
                                          value={statusOption}
                                          className="data-[highlighted]:bg-muted/40 data-[state=checked]:bg-transparent"
                                        >
                                          <span className={`text-[11px] font-semibold ${info.textClass}`}>{info.label}</span>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                  </div>
                  <div className="md:hidden px-4 pb-4 space-y-4">
                    {filteredOrders.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">Нет заказов по текущему фильтру</div>
                    ) : (
                      filteredOrders.map((order) => {
                        const stockIssue = getOrderStockIssue(order);
                        const statusInfo = getOrderStatusInfo(order.status);
                        const statusValue = order.status;
                        const itemsPreview = order.items.slice(0, 2);
                        const extraItems = Math.max(0, order.items.length - itemsPreview.length);
                        return (
                          <Card key={order.id} className="rounded-2xl border-white/15 bg-background/60 shadow-lg">
                            <CardContent className="p-4 space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Заказ</div>
                                  <div className="text-base font-black">#{order.id.slice(-6)}</div>
                                  <div className="text-[11px] text-muted-foreground mt-1">
                                    {formatTimestamp(order.createdAt, "ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) || "—"}
                                  </div>
                                </div>
                                <Badge className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusInfo.badgeClass}`}>
                                  {statusInfo.label}
                                </Badge>
                              </div>

                              <div className="space-y-1">
                                <div className="text-sm font-bold">{order.name || "Аноним"}</div>
                                <div className="text-xs text-muted-foreground">{order.phoneE164 || order.phone || "—"}</div>
                                <div className="text-xs text-muted-foreground">{formatTelegramValue(order.telegram)}</div>
                              </div>

                              <div className="space-y-1">
                                {order.items.length === 0 ? (
                                  <span className="text-xs text-muted-foreground">Состав не указан</span>
                                ) : (
                                  <div className="space-y-1">
                                    {itemsPreview.map((it, idx) => (
                                      <div key={`${it.productId}-${idx}`} className="flex items-center justify-between text-xs bg-muted/30 border border-white/5 rounded-xl px-3 py-2">
                                        <span className="font-semibold text-foreground/80 line-clamp-1">{it.name}</span>
                                        <span className="text-[11px] font-semibold text-muted-foreground">x{it.quantity}</span>
                                      </div>
                                    ))}
                                    {extraItems > 0 && (
                                      <div className="text-[10px] text-muted-foreground">+ еще {extraItems}</div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="text-lg font-black text-primary">{order.totalPrice.toLocaleString()} ₽</div>
                                <div className="text-xs text-muted-foreground">{order.items.length} поз.</div>
                              </div>

                              <div className="grid gap-2">
                                <Select value={statusValue} onValueChange={(value) => handleUpdateOrderStatus(order.id, value, stockIssue)}>
                                  <SelectTrigger className={`h-10 w-full rounded-xl px-3 text-[11px] font-bold border border-white/10 ${statusInfo.badgeClass}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl border-white/10 bg-background/90 backdrop-blur-xl shadow-2xl">
                                    {["new", "processing", "delivered", "cancelled"].map((statusOption) => {
                                      const info = getOrderStatusInfo(statusOption);
                                      return (
                                        <SelectItem
                                          key={statusOption}
                                          value={statusOption}
                                          className="data-[highlighted]:bg-muted/40 data-[state=checked]:bg-transparent"
                                        >
                                          <span className={`text-[11px] font-semibold ${info.textClass}`}>{info.label}</span>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>

                                <div className="grid gap-2 sm:grid-cols-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" className="h-10 w-full rounded-xl gap-2">
                                        <Eye className="w-4 h-4" /> Детали
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-[2rem] w-full sm:max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle className="text-2xl font-black">Детали заказа #{order.id.slice(-6)}</DialogTitle>
                                        <DialogDescription className="text-muted-foreground">
                                          Информация о составе заказа и параметрах доставки.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="grid gap-6 md:grid-cols-2 py-6">
                                        <div className="space-y-6">
                                          <div>
                                            <h4 className="text-xs font-black uppercase text-muted-foreground mb-3">Товары</h4>
                                            <div className="space-y-3">
                                              {order.items.map((it, i) => (
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
                                            <h4 className="text-xs font-black uppercase text-muted-foreground mb-3">Клиент</h4>
                                            <div className="bg-muted/30 p-4 rounded-2xl border space-y-2 text-sm">
                                              <p><span className="text-muted-foreground">Имя:</span> <b>{order.name || "—"}</b></p>
                                              <p><span className="text-muted-foreground">Телефон:</span> <b>{order.phoneE164 || order.phone || "—"}</b></p>
                                              <p><span className="text-muted-foreground">TG:</span> <b>{formatTelegramValue(order.telegram)}</b></p>
                                              {order.userEmail && (
                                                <p><span className="text-muted-foreground">Email:</span> <b>{order.userEmail}</b></p>
                                              )}
                                            </div>
                                          </div>
                                          <div>
                                            <h4 className="text-xs font-black uppercase text-muted-foreground mb-3">Получение</h4>
                                            <div className="bg-muted/30 p-4 rounded-2xl border space-y-2 text-sm">
                                              <p><span className="text-muted-foreground">Метод:</span> <b>{order.deliveryMethod === 'delivery' ? 'Доставка' : 'Самовывоз'}</b></p>
                                              {order.deliveryMethod === "delivery" && (
                                                <>
                                                <p><span className="text-muted-foreground">Служба:</span> <b>{resolveDeliveryServiceLabel(order.deliveryService) || "—"}</b></p>
                                                  <p><span className="text-muted-foreground">Город:</span> <b>{order.city || "—"}</b></p>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                          {order.customFields && Object.keys(order.customFields).length > 0 && (
                                            <div>
                                              <h4 className="text-xs font-black uppercase text-muted-foreground mb-3">Доп. поля</h4>
                                              <div className="bg-muted/30 p-4 rounded-2xl border space-y-2 text-sm">
                                                {Object.entries(order.customFields).map(([key, value]) => (
                                                  <p key={key}><span className="text-muted-foreground">{key}:</span> <b>{value || "—"}</b></p>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  {order.status !== "delivered" && (
                                    <Button variant="outline" className="h-10 w-full rounded-xl gap-2" onClick={() => openOrderEditDialog(order)}>
                                      <Pencil className="w-4 h-4" /> Изменить
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </Card>

            <Dialog open={orderEditOpen} onOpenChange={(open) => {
              setOrderEditOpen(open);
              if (!open) setEditingOrder(null);
            }}>
              <DialogContent className="rounded-[2.5rem] w-full sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">
                    Редактировать заказ {editingOrder ? `#${editingOrder.id.slice(-6)}` : ""}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Обновите состав заказа и параметры получения.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-3">
                    <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Состав заказа</p>
                    <div className="space-y-3">
                      {orderDraft.items.map((item, index) => (
                        <div key={`${item.productId}-${index}`} className="grid gap-3 md:grid-cols-[1fr_140px_auto] items-center">
                          <Select
                            value={item.productId}
                            onValueChange={(value) => updateOrderItem(index, { productId: value })}
                          >
                            <SelectTrigger className="h-12 w-full rounded-xl bg-muted/40 border">
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
                      <Label>Способ получения</Label>
                      <Select
                        value={orderDraft.deliveryMethod}
                        onValueChange={(value) => setOrderDraft((prev) => ({
                          ...prev,
                          deliveryMethod: value as "pickup" | "delivery",
                          deliveryService: value === "pickup" ? "" : prev.deliveryService,
                          city: value === "pickup" ? "" : prev.city,
                        }))}
                      >
                        <SelectTrigger className="h-12 w-full rounded-xl bg-muted/40 border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl">
                          <SelectItem value="pickup">Самовывоз</SelectItem>
                          <SelectItem value="delivery">Доставка</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Telegram</Label>
                      <Input
                        value={orderDraft.telegram}
                        onChange={(e) => setOrderDraft((prev) => ({ ...prev, telegram: e.target.value }))}
                        className="h-12 rounded-xl"
                        placeholder="@username"
                      />
                    </div>
                  </div>

                  {orderDraft.deliveryMethod === "delivery" && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Служба доставки</Label>
                        <Select
                          value={orderDraft.deliveryService}
                          onValueChange={(value) => setOrderDraft((prev) => ({ ...prev, deliveryService: value }))}
                        >
                          <SelectTrigger className="h-12 w-full rounded-xl bg-muted/40 border">
                            <SelectValue placeholder="Выберите службу" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl">
                            {settingsDraft.deliveryServices.filter((service) => service.active).length === 0 ? (
                              <SelectItem value="no-services" disabled>Нет служб доставки</SelectItem>
                            ) : (
                              settingsDraft.deliveryServices
                                .filter((service) => service.active)
                                .map((service) => (
                                  <SelectItem key={service.id} value={service.id}>{service.label}</SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Город</Label>
                        <Input
                          value={orderDraft.city}
                          onChange={(e) => setOrderDraft((prev) => ({ ...prev, city: e.target.value }))}
                          className="h-12 rounded-xl"
                          placeholder="Город доставки"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOrderEditOpen(false)}>Отмена</Button>
                  <Button onClick={handleSaveOrderEdit} disabled={!canSaveOrderEdit}>Сохранить</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </motion.div>
          </TabsContent>

          <TabsContent value="products">
            <motion.div {...tabMotion} className="space-y-8">
            <Card className="rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Товары</CardTitle>
                  <CardDescription>Управление ассортиментом витрины</CardDescription>
                </div>
                <Button className="rounded-2xl h-11 px-6 gap-2" onClick={() => openProductDialog()}>
                  <Plus className="w-4 h-4" /> Добавить товар
                </Button>
              </CardHeader>
              <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-8">Название</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Скидка</TableHead>
                    <TableHead className="pr-8 text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                        Товары не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map(product => (
                      <TableRow key={product.id}>
                        <TableCell className="pl-8">
                          <div className="font-bold">{product.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{product.description}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-black text-primary">{product.price.toLocaleString()} ₽</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={product.inStock ? "bg-emerald-500/10 text-emerald-500 border-none" : "bg-muted text-muted-foreground border-none"}>
                            {product.inStock ? "В наличии" : "Нет в наличии"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.discountPercent > 0 ? (
                            <Badge className="bg-orange-500/10 text-orange-500 border-none">-{product.discountPercent}%</Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border-none">—</Badge>
                          )}
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => openProductDialog(product)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
              <div className="md:hidden px-4 pb-4 space-y-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Товары не найдены</div>
                ) : (
                  filteredProducts.map(product => (
                    <Card key={product.id} className="rounded-2xl border-white/15 bg-background/60 shadow-lg">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="relative h-14 w-14 rounded-xl border border-white/10 bg-muted/20 overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-muted-foreground">
                            {product.imageUrl ? (
                              <ResilientImage
                                src={product.imageUrl}
                                fallbackSrc="/images/fallback-product.svg"
                                alt={product.name}
                                fill
                                sizes="56px"
                                timeoutMs={1400}
                                className="object-cover"
                              />
                            ) : (
                              "Нет фото"
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-black">{product.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">{product.description}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={product.inStock ? "bg-emerald-500/10 text-emerald-500 border-none" : "bg-muted text-muted-foreground border-none"}>
                            {product.inStock ? "В наличии" : "Нет в наличии"}
                          </Badge>
                          {product.discountPercent > 0 ? (
                            <Badge className="bg-orange-500/10 text-orange-500 border-none">-{product.discountPercent}%</Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border-none">Без скидки</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-black text-primary">{product.price.toLocaleString()} ₽</div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => openProductDialog(product)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </Card>

            <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
              <DialogContent className="rounded-[2rem] w-full sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Редактировать товар" : "Новый товар"}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Заполните характеристики и сохраните изменения.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 py-4">
                  <div className="space-y-2">
                    <Label>Название</Label>
                    <Input value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Цена (₽)</Label>
                    <NumericInput value={productDraft.price} onValueChange={(value) => setProductDraft({ ...productDraft, price: value })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Описание</Label>
                    <Input value={productDraft.description} onChange={(e) => setProductDraft({ ...productDraft, description: e.target.value })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>URL изображения</Label>
                    <Input value={productDraft.imageUrl} onChange={(e) => setProductDraft({ ...productDraft, imageUrl: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Скидка (%)</Label>
                    <NumericInput value={productDraft.discountPercent} onValueChange={(value) => setProductDraft({ ...productDraft, discountPercent: value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Себестоимость (₽)</Label>
                    <NumericInput value={productDraft.costPrice} onValueChange={(value) => setProductDraft({ ...productDraft, costPrice: value })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Фичи (через запятую)</Label>
                    <Input value={productDraft.featuresText} onChange={(e) => setProductDraft({ ...productDraft, featuresText: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={productDraft.inStock} onChange={(e) => setProductDraft({ ...productDraft, inStock: e.target.checked })} />
                    <span className="text-sm">В наличии</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={productDraft.active} onChange={(e) => setProductDraft({ ...productDraft, active: e.target.checked })} />
                    <span className="text-sm">Активный товар</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Отмена</Button>
                  <Button onClick={handleSaveProduct} disabled={isSavingProduct}>
                    {isSavingProduct ? "Сохраняем..." : "Сохранить"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </motion.div>
          </TabsContent>

          <TabsContent value="finance">
            <motion.div {...tabMotion} className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 rounded-[2.5rem] border-white/20 shadow-2xl bg-background/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Финансы за {currentMonthLabel}</CardTitle>
                  <CardDescription>Текущий месяц и ключевые метрики</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Выручка</p>
                      <p className="text-2xl font-black text-emerald-500">{monthlyFinance.current.sales.toLocaleString()} ₽</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Закупки</p>
                      <p className="text-2xl font-black text-red-500">{monthlyFinance.current.purchases.toLocaleString()} ₽</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Чистая прибыль</p>
                      <p className={`text-2xl font-black ${currentProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {currentProfit.toLocaleString()} ₽
                      </p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Продано (шт.)</p>
                      <p className="text-xl font-black">{monthlyFinance.current.soldQty}</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Закуплено (шт.)</p>
                      <p className="text-xl font-black">{monthlyFinance.current.purchasedQty}</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Остаток (шт.)</p>
                      <p className="text-xl font-black">{totals.totalStock}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-white/20 shadow-2xl bg-background/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Склад</CardTitle>
                  <CardDescription>Остатки по товарам</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[260px] overflow-y-auto">
                  {inventorySorted.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Данные появятся после первых операций.</div>
                  ) : (
                    inventorySorted.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between rounded-2xl border bg-muted/30 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">Закуплено: {item.purchased} • Продано: {item.sold}</p>
                        </div>
                        <Badge className={item.stock >= 0 ? "bg-emerald-500/10 text-emerald-500 border-none" : "bg-red-500/10 text-red-500 border-none"}>
                          {item.stock} шт.
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              </div>

            <Card className="rounded-[2.5rem] border-white/20 shadow-2xl bg-background/40 backdrop-blur-xl">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <div>
                    <CardTitle>Сводка по месяцам</CardTitle>
                    <CardDescription>Выручка, закупки и прибыль за последние 6 месяцев</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Выручка
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Закупки
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Прибыль
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-muted/30 px-5 py-4 text-right">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Чистая прибыль • 6 мес.</p>
                  <p className={`text-2xl font-black ${sixMonthProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {sixMonthProfit.toLocaleString()} ₽
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyFinance.series.map((item) => {
                    const isCurrent = item.key === monthlyFinance.currentKey;
                    return (
                      <div
                        key={item.key}
                        className={`rounded-3xl border px-5 py-4 bg-muted/20 ${isCurrent ? "border-primary/30 bg-primary/5 shadow-lg" : "border-white/10"}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                            {isCurrent && <Badge className="bg-primary/10 text-primary border-none text-[10px]">Текущий</Badge>}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Сводка месяца</div>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase text-muted-foreground">Выручка</p>
                            <p className="text-sm font-semibold text-emerald-500">{item.sales.toLocaleString()} ₽</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase text-muted-foreground">Закупки</p>
                            <p className="text-sm font-semibold text-red-500">-{item.purchases.toLocaleString()} ₽</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase text-muted-foreground">Прибыль</p>
                            <p className={`text-sm font-black ${item.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                              {item.profit.toLocaleString()} ₽
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">Операции</h3>
                <p className="text-sm text-muted-foreground">Ручные продажи и закупки</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={financeTab === "purchases" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setFinanceTab("purchases")}
                >
                  Закупки
                </Button>
                <Button
                  variant={financeTab === "sales" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setFinanceTab("sales")}
                >
                  Продажи
                </Button>
                {financeTab === "purchases" ? (
                  <Button className="rounded-xl" onClick={() => openPurchaseDialog()}>Добавить закупку</Button>
                ) : (
                  <Button className="rounded-xl" onClick={() => openSaleDialog()}>Добавить продажу</Button>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={financeTab} {...panelMotion} className="grid gap-4">
                {financeTab === "purchases" ? (
                  filteredPurchases.length === 0 ? (
                    <Card className="rounded-[2.5rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl p-12 text-center">
                      <p className="text-sm text-muted-foreground">Закупок пока нет.</p>
                    </Card>
                  ) : (
                    filteredPurchases.map((purchase) => (
                        <Card key={purchase.id} className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
                          <CardContent className="p-4 sm:p-5 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground">Закупка</p>
                              <h4 className="text-lg font-black">{purchase.productName}</h4>
                              <p className="text-xs text-muted-foreground">{formatTimestamp(purchase.date) || "—"}</p>
                            </div>
                            <div className="text-left md:text-right">
                              <p className="text-xl font-black text-red-500">-{purchase.totalAmount.toLocaleString()} ₽</p>
                              <p className="text-xs text-muted-foreground">{purchase.qty} шт.</p>
                            </div>
                          </div>
                          {purchase.comment && (
                            <div className="text-[11px] text-muted-foreground bg-muted/30 border rounded-xl px-3 py-2">
                              {purchase.comment}
                            </div>
                          )}
                          <div className="flex justify-start md:justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => openPurchaseDialog(purchase)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDeletePurchase(purchase.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )
                ) : (
                  filteredSales.length === 0 ? (
                    <Card className="rounded-[2.5rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl p-12 text-center">
                      <p className="text-sm text-muted-foreground">Продаж пока нет.</p>
                    </Card>
                  ) : (
                    filteredSales.map((sale) => {
                      const isOrderSale = sale.sourceType === "order";
                      const saleComment = (sale.comment || "").trim();
                      const showComment = saleComment && saleComment.toLowerCase() !== "продажа с сайта";
                      return (
                        <Card key={sale.id} className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
                          <CardContent className="p-4 sm:p-5 space-y-3">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                              <div>
                                <p className="text-[10px] uppercase text-muted-foreground">Продажа</p>
                                <h4 className="text-lg font-black">{sale.productName}</h4>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-muted-foreground">{formatTimestamp(sale.date) || "—"}</p>
                                  <Badge className={isOrderSale ? "bg-emerald-500/10 text-emerald-500 border-none" : "bg-blue-500/10 text-blue-500 border-none"}>
                                    {isOrderSale ? "Сайт" : "Ручная"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-left md:text-right">
                                <p className="text-xl font-black text-emerald-500">+{sale.totalAmount.toLocaleString()} ₽</p>
                                <p className="text-xs text-muted-foreground">{sale.qty} шт.</p>
                              </div>
                            </div>
                            {showComment && (
                              <div className="text-[11px] text-muted-foreground bg-muted/30 border rounded-xl px-3 py-2">
                                {saleComment}
                              </div>
                            )}
                            <div className="flex justify-start md:justify-end gap-2">
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => openSaleDialog(sale)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              {!isOrderSale && (
                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSale(sale.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )
                )}
              </motion.div>
            </AnimatePresence>

            <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
              <DialogContent className="rounded-[2.5rem] w-full sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editingPurchase ? "Редактировать закупку" : "Новая закупка"}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Укажите модель, количество и сумму закупки.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Модель</Label>
                    <Select
                      value={purchaseDraft.productId}
                      onValueChange={(value) => setPurchaseDraft({ ...purchaseDraft, productId: value })}
                    >
                      <SelectTrigger className="h-12 w-full rounded-xl bg-muted/40 border">
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
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Количество</Label>
                      <NumericInput value={purchaseDraft.qty} onValueChange={(value) => setPurchaseDraft({ ...purchaseDraft, qty: value })} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Сумма (₽)</Label>
                      <NumericInput value={purchaseDraft.totalAmount} onValueChange={(value) => setPurchaseDraft({ ...purchaseDraft, totalAmount: value })} className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Дата</Label>
                    <Input type="date" value={purchaseDraft.date} onChange={(e) => setPurchaseDraft({ ...purchaseDraft, date: e.target.value })} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Комментарий</Label>
                    <Textarea value={purchaseDraft.comment} onChange={(e) => setPurchaseDraft({ ...purchaseDraft, comment: e.target.value })} className="rounded-xl min-h-[100px]" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>Отмена</Button>
                  <Button onClick={handleSavePurchase} disabled={!canSavePurchase || isSavingPurchase}>
                    {isSavingPurchase ? "Сохраняем..." : "Сохранить"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
              <DialogContent className="rounded-[2.5rem] w-full sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editingSale ? "Редактировать продажу" : "Новая продажа"}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Укажите модель, количество и сумму продажи.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Модель</Label>
                    <Select
                      value={saleDraft.productId}
                      onValueChange={(value) => setSaleDraft({ ...saleDraft, productId: value })}
                    >
                      <SelectTrigger className="h-12 w-full rounded-xl bg-muted/40 border">
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
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Количество</Label>
                      <NumericInput value={saleDraft.qty} onValueChange={(value) => setSaleDraft({ ...saleDraft, qty: value })} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Сумма (₽)</Label>
                      <NumericInput value={saleDraft.totalAmount} onValueChange={(value) => setSaleDraft({ ...saleDraft, totalAmount: value })} className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Дата</Label>
                    <Input type="date" value={saleDraft.date} onChange={(e) => setSaleDraft({ ...saleDraft, date: e.target.value })} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Комментарий</Label>
                    <Textarea value={saleDraft.comment} onChange={(e) => setSaleDraft({ ...saleDraft, comment: e.target.value })} className="rounded-xl min-h-[100px]" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaleDialogOpen(false)}>Отмена</Button>
                  <Button onClick={handleSaveSale} disabled={!canSaveSale || isSavingSale}>
                    {isSavingSale ? "Сохраняем..." : "Сохранить"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </motion.div>
          </TabsContent>

          <TabsContent value="users">
            <motion.div {...tabMotion} className="space-y-8">
            <Card className="rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-xl">
              <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="pl-8 py-6">Пользователь</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>VIP</TableHead>
                    <TableHead>Заказы</TableHead>
                    <TableHead>Потрачено</TableHead>
                    <TableHead className="pr-8 text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">Клиенты не найдены</TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(userItem => (
                      <TableRow key={userItem.uid} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-8 py-6">
                          <div className="font-bold">{userItem.name || "Без имени"}</div>
                          <div className="text-xs text-muted-foreground">{userItem.email || "—"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{userItem.phone || "—"}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={userItem.loyaltyDiscount > 0 ? "bg-emerald-500/10 text-emerald-500 border-none" : "bg-muted text-muted-foreground border-none"}>
                            {userItem.loyaltyDiscount > 0 ? `VIP ${userItem.loyaltyDiscount}%` : "VIP0"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold">{userItem.purchasesCount || 0}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-black text-primary">{(userItem.totalSpent || 0).toLocaleString()} ₽</div>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => openUserDialog(userItem)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
              <div className="md:hidden px-4 pb-4 space-y-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Клиенты не найдены</div>
                ) : (
                  filteredUsers.map(userItem => (
                    <Card key={userItem.uid} className="rounded-2xl border-white/15 bg-background/60 shadow-lg">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <div className="text-sm font-black">{userItem.name || "Без имени"}</div>
                          <div className="text-xs text-muted-foreground">{userItem.email || "—"}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={userItem.loyaltyDiscount > 0 ? "bg-emerald-500/10 text-emerald-500 border-none" : "bg-muted text-muted-foreground border-none"}>
                            {userItem.loyaltyDiscount > 0 ? `VIP ${userItem.loyaltyDiscount}%` : "VIP0"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Заказов: <b>{userItem.purchasesCount || 0}</b></span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">{userItem.phone || "—"}</div>
                          <div className="text-base font-black text-primary">{(userItem.totalSpent || 0).toLocaleString()} ₽</div>
                        </div>
                        <div className="flex justify-end">
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => openUserDialog(userItem)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </Card>
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogContent className="rounded-[2rem] w-full sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Управление клиентом</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Блокировка и ручная настройка VIP-статуса.
                  </DialogDescription>
                </DialogHeader>
                {userDraft && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Пользователь</Label>
                      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                        <div className="font-bold">{userDraft.name || "Без имени"}</div>
                        <div className="text-xs text-muted-foreground">{userDraft.email || "—"}</div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>VIP уровень</Label>
                        <Select
                          value={String(userDraft.loyaltyLevel ?? 0)}
                          onValueChange={(value) => {
                            const level = Number(value);
                            setUserDraft({
                              ...userDraft,
                              loyaltyLevel: level,
                              loyaltyDiscount: getVipDiscountByLevel(level),
                            });
                          }}
                        >
                          <SelectTrigger className="h-11 w-full rounded-xl bg-muted/40 border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl">
                            <SelectItem value="0">VIP0 (0%)</SelectItem>
                            <SelectItem value="1">VIP1 ({settingsDraft.vipRules.vip1.discount}%)</SelectItem>
                            <SelectItem value="2">VIP2 ({settingsDraft.vipRules.vip2.discount}%)</SelectItem>
                            <SelectItem value="3">VIP3 ({settingsDraft.vipRules.vip3.discount}%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Скидка %</Label>
                        <NumericInput
                          value={userDraft.loyaltyDiscount || 0}
                          onValueChange={(value) => setUserDraft({ ...userDraft, loyaltyDiscount: value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Блокировка</Label>
                      <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
                        <span className="text-xs text-muted-foreground">Запретить оформление заказов</span>
                        <Switch checked={Boolean(userDraft.isBanned)} onCheckedChange={(value) => setUserDraft({ ...userDraft, isBanned: value })} />
                      </div>
                    </div>
                    {userDraft.isBanned && (
                      <div className="space-y-2">
                        <Label>Причина блокировки</Label>
                        <Input
                          value={userDraft.banReason || ""}
                          onChange={(e) => setUserDraft({ ...userDraft, banReason: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Отмена</Button>
                  <Button onClick={handleSaveUser}>Сохранить</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </motion.div>
          </TabsContent>

          <TabsContent value="reviews">
            <motion.div {...tabMotion} className="space-y-8">
            <Card className="rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden bg-background/40 backdrop-blur-xl">
              <div className="hidden md:block">
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
                  {filteredReviews.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-64 text-center text-muted-foreground">Отзывов пока нет</TableCell></TableRow>
                  ) : (
                    filteredReviews.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="pl-8 py-6">
                          <div className="font-bold">{r.userName || "Покупатель"}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatTimestamp(r.createdAt, "ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm italic line-clamp-2">«{r.text}»</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex text-orange-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < r.rating ? "fill-current" : "opacity-20 text-muted-foreground"}>★</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.status === "pending" && <Badge className="bg-orange-500/10 text-orange-500 border-none">Ожидает</Badge>}
                          {r.status === "approved" && <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Опубликован</Badge>}
                          {r.status === "rejected" && <Badge className="bg-red-500/10 text-red-500 border-none">Отклонен</Badge>}
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => openReviewDialog(r)}><Pencil className="w-4 h-4" /></Button>
                            {r.status === "pending" && (
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleReviewAction(r.id, "approve")}><Check className="w-4 h-4" /></Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleReviewAction(r.id, "reject")}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
              <div className="md:hidden px-4 pb-4 space-y-4">
                {filteredReviews.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Отзывов пока нет</div>
                ) : (
                  filteredReviews.map(r => (
                    <Card key={r.id} className="rounded-2xl border-white/15 bg-background/60 shadow-lg">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <div className="text-sm font-black">{r.userName || "Покупатель"}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatTimestamp(r.createdAt, "ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) || "—"}
                          </div>
                        </div>
                        <p className="text-sm italic leading-relaxed">«{r.text}»</p>
                        <div className="flex items-center justify-between">
                          <div className="flex text-orange-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < r.rating ? "fill-current" : "opacity-20 text-muted-foreground"}>★</span>
                            ))}
                          </div>
                          <div>
                            {r.status === "pending" && <Badge className="bg-orange-500/10 text-orange-500 border-none">Ожидает</Badge>}
                            {r.status === "approved" && <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Опубликован</Badge>}
                            {r.status === "rejected" && <Badge className="bg-red-500/10 text-red-500 border-none">Отклонен</Badge>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openReviewDialog(r)}>
                            <Pencil className="w-4 h-4 mr-2" /> Редактировать
                          </Button>
                          {r.status === "pending" && (
                            <Button size="sm" variant="outline" className="rounded-xl text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10" onClick={() => handleReviewAction(r.id, "approve")}>
                              <Check className="w-4 h-4 mr-2" /> Одобрить
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleReviewAction(r.id, "reject")}>
                            <Trash2 className="w-4 h-4 mr-2" /> Отклонить
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </Card>
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
              <DialogContent className="rounded-[2rem] w-full sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Редактировать отзыв</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Отредактируйте текст, рейтинг и статус публикации.
                  </DialogDescription>
                </DialogHeader>
                {reviewDraft && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Имя</Label>
                      <Input
                        value={reviewDraft.userName || ""}
                        onChange={(e) => setReviewDraft({ ...reviewDraft, userName: e.target.value })}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Текст</Label>
                      <Textarea
                        value={reviewDraft.text}
                        onChange={(e) => setReviewDraft({ ...reviewDraft, text: e.target.value })}
                        className="rounded-xl min-h-[140px]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Рейтинг</Label>
                        <NumericInput
                          value={reviewDraft.rating}
                          onValueChange={(value) => setReviewDraft({ ...reviewDraft, rating: Math.min(5, Math.max(1, value)) })}
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Статус</Label>
                        <Select
                          value={reviewDraft.status}
                          onValueChange={(value) => setReviewDraft({ ...reviewDraft, status: value as Review["status"] })}
                        >
                          <SelectTrigger className="h-12 w-full rounded-xl bg-muted/40 border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl">
                            <SelectItem value="pending">Ожидает</SelectItem>
                            <SelectItem value="approved">Опубликован</SelectItem>
                            <SelectItem value="rejected">Отклонен</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Отмена</Button>
                  <Button onClick={handleSaveReview}>Сохранить</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </motion.div>
          </TabsContent>

          <TabsContent value="settings">
            <motion.div {...tabMotion} className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-lg">Программа лояльности</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-xs text-muted-foreground">VIP0 = 0% автоматически. Изменения применяются для новых заказов.</p>
                  {(["vip1", "vip2", "vip3"] as const).map((tier, index) => (
                    <div key={tier} className="space-y-4 p-4 rounded-2xl bg-muted/30 border">
                      <Label className="text-[10px] font-black uppercase">VIP {index + 1}: {settingsDraft.vipRules[tier].label}</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase">Заказов от</span>
                          <NumericInput
                            value={settingsDraft.vipRules[tier].orders}
                            onValueChange={(value) => updateVipRule(tier, "orders", value)}
                            className="h-10 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase">Сумма от</span>
                          <NumericInput
                            value={settingsDraft.vipRules[tier].spent}
                            onValueChange={(value) => updateVipRule(tier, "spent", value)}
                            className="h-10 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase">Скидка %</span>
                          <NumericInput
                            value={settingsDraft.vipRules[tier].discount}
                            onValueChange={(value) => updateVipRule(tier, "discount", value)}
                            className="h-10 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase">Название</span>
                          <Input
                            value={settingsDraft.vipRules[tier].label}
                            onChange={(e) => updateVipRule(tier, "label", e.target.value)}
                            className="h-10 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button className="w-full h-12 rounded-xl" onClick={handleSaveSettings}>Сохранить настройки</Button>
                </CardContent>
              </Card>

              <div className="space-y-8">
                <Card className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
                  <CardHeader><CardTitle className="text-lg">Поля формы заказа</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {settingsDraft.orderForm.fields.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Дополнительные поля не добавлены.</div>
                    ) : (
                      settingsDraft.orderForm.fields.map((field, index) => (
                        <div key={field.id} className="p-4 rounded-2xl bg-muted/30 border space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-muted-foreground">Поле #{index + 1}</span>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => removeOrderField(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>ID</Label>
                              <Input value={field.id} onChange={(e) => updateOrderField(index, { id: e.target.value })} className="h-10 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                              <Label>Название</Label>
                              <Input value={field.label} onChange={(e) => updateOrderField(index, { label: e.target.value })} className="h-10 rounded-lg" />
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Тип</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value) => updateOrderField(index, { type: value as SettingsConfig["orderForm"]["fields"][number]["type"] })}
                              >
                                <SelectTrigger className="h-10 w-full rounded-lg bg-muted/40 border">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl">
                                  <SelectItem value="text">Текст</SelectItem>
                                  <SelectItem value="textarea">Многострочный текст</SelectItem>
                                  <SelectItem value="number">Число</SelectItem>
                                  <SelectItem value="date">Дата</SelectItem>
                                  <SelectItem value="time">Время</SelectItem>
                                  <SelectItem value="datetime-local">Дата и время</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Обязательное</Label>
                              <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-3 h-10">
                                <span className="text-xs text-muted-foreground">Требовать заполнение</span>
                                <Switch checked={field.required} onCheckedChange={(value) => updateOrderField(index, { required: value })} />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Placeholder</Label>
                            <Input value={field.placeholder || ""} onChange={(e) => updateOrderField(index, { placeholder: e.target.value })} className="h-10 rounded-lg" />
                          </div>
                          {RESERVED_ORDER_FIELD_IDS.has(field.id) && (
                            <p className="text-xs text-destructive">ID зарезервирован системой и будет проигнорирован.</p>
                          )}
                        </div>
                      ))
                    )}
                    <div className="flex items-center gap-3">
                      <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={addOrderField}>Добавить поле</Button>
                      <Button className="flex-1 h-12 rounded-xl" onClick={handleSaveSettings}>Сохранить настройки</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
                  <CardHeader><CardTitle className="text-lg">Службы доставки</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {settingsDraft.deliveryServices.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Службы доставки не настроены.</div>
                    ) : (
                      settingsDraft.deliveryServices.map((service, index) => (
                        <div key={service.id} className="p-4 rounded-2xl bg-muted/30 border space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-muted-foreground">Служба #{index + 1}</span>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => removeDeliveryService(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>ID</Label>
                              <Input value={service.id} onChange={(e) => updateDeliveryService(index, { id: e.target.value })} className="h-10 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                              <Label>Название</Label>
                              <Input value={service.label} onChange={(e) => updateDeliveryService(index, { label: e.target.value })} className="h-10 rounded-lg" />
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Порядок</Label>
                              <NumericInput
                                value={service.sortOrder}
                                onValueChange={(value) => updateDeliveryService(index, { sortOrder: value })}
                                className="h-10 rounded-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Активна</Label>
                              <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-3 h-10">
                                <span className="text-xs text-muted-foreground">Отображать в заказе</span>
                                <Switch checked={service.active} onCheckedChange={(value) => updateDeliveryService(index, { active: value })} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="flex items-center gap-3">
                      <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={addDeliveryService}>Добавить службу</Button>
                      <Button className="flex-1 h-12 rounded-xl" onClick={handleSaveSettings}>Сохранить настройки</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <Card className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
                  <CardHeader><CardTitle className="text-lg">Изображения</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Hero изображение (URL)</Label>
                      <Input
                        value={settingsDraft.media.heroImageUrl}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, media: { ...settingsDraft.media, heroImageUrl: e.target.value } })}
                        placeholder="https://..."
                        className="h-12 rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">Используется в первом экране главной страницы.</p>
                    </div>
                    <Button className="w-full h-12 rounded-xl" onClick={handleSaveSettings}>Сохранить настройки</Button>
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-primary/20 shadow-xl bg-primary/5 border-2">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">Интеграции и система</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-2xl bg-background/50 border space-y-2">
                      <p className="text-xs font-bold">Telegram токен и Chat ID хранятся в секретах API и не сохраняются в Firestore.</p>
                      <p className="text-xs text-muted-foreground">Проверьте секреты в Netlify Functions.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-background/50 border space-y-3">
                      <p className="text-xs font-bold leading-relaxed italic">Инициализация базы данных создаст начальный набор товаров и настроек.</p>
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
          </TabsContent>

          <TabsContent value="status">
            <motion.div {...tabMotion} className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">Статусы системы</h3>
                <p className="text-sm text-muted-foreground">Проверка API, Firestore и Telegram</p>
              </div>
              <Button
                variant="outline"
                className="h-11 rounded-xl gap-2"
                onClick={refreshStatus}
                disabled={statusLoading}
              >
                {statusLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Обновить статус
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg">API</CardTitle>
                  <CardDescription>Доступность API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge className={apiBadge.className}>{apiBadge.label}</Badge>
                  <p className="text-xs text-muted-foreground">Health: `/api/health`</p>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Firestore</CardTitle>
                  <CardDescription>Чтение настроек</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge className={firestoreBadge.className}>{firestoreBadge.label}</Badge>
                  {statusSnapshot.firestoreError && (
                    <p className="text-xs text-destructive">{statusSnapshot.firestoreError}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Telegram</CardTitle>
                  <CardDescription>Статус интеграции</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge className={telegramBadge.className}>{telegramBadge.label}</Badge>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl"
                    onClick={handleTelegramTest}
                    disabled={statusSnapshot.telegramConfigured !== true}
                  >
                    Тестовое сообщение
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Последняя проверка</p>
                  <p className="text-xs text-muted-foreground">{statusSnapshot.checkedAt || "—"}</p>
                </div>
                <p className="text-xs text-muted-foreground">Тестовая отправка доступна только админу.</p>
              </CardContent>
            </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="logs">
            <motion.div {...tabMotion} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">Логи</h3>
                <p className="text-sm text-muted-foreground">Последние действия и ответы API</p>
              </div>
              <Button variant="outline" className="h-11 rounded-xl" onClick={() => setLogEntries([])}>
                Очистить
              </Button>
            </div>

            <Card className="rounded-[2rem] border-white/20 shadow-xl bg-background/40 backdrop-blur-xl">
              <CardContent className="p-0">
                <div className="max-h-[420px] overflow-y-auto">
                  {logEntries.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">Логов пока нет.</div>
                  ) : (
                    logEntries.map((entry) => (
                      <div key={entry.id} className="px-6 py-4 border-b border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Badge className={
                              entry.level === "success"
                                ? "bg-emerald-500/10 text-emerald-500 border-none"
                                : entry.level === "error"
                                  ? "bg-red-500/10 text-red-500 border-none"
                                  : "bg-blue-500/10 text-blue-500 border-none"
                            }>
                              {entry.level === "success" ? "OK" : entry.level === "error" ? "Ошибка" : "Инфо"}
                            </Badge>
                            <span className="text-sm font-semibold">{entry.message}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{entry.time}</span>
                        </div>
                        {entry.details && (
                          <p className="text-xs text-muted-foreground mt-2">{entry.details}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
