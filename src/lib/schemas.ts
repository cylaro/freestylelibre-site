import { z } from "zod";

const nonEmptyString = z.string().min(1);
const safeString = z.string().default("");
const safeNumber = z.coerce.number().finite().default(0);
const safeBoolean = z.boolean().default(false);

export type OrderStatus = "new" | "processing" | "delivered" | "cancelled";
export type DeliveryMethod = "pickup" | "delivery";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  discountPercent: number;
  features: string[];
  active: boolean;
  costPrice?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  phoneE164?: string;
  telegram: string;
  isAdmin: boolean;
  isBanned: boolean;
  banReason?: string;
  purchasesCount: number;
  totalSpent: number;
  loyaltyLevel: number;
  loyaltyDiscount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  discountPercent: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  vipDiscount: number;
  totalPrice: number;
  deliveryMethod: DeliveryMethod;
  deliveryService?: string;
  name: string;
  phone: string;
  phoneE164?: string;
  telegram?: string;
  city?: string;
  customFields?: Record<string, string>;
  reviewId?: string;
  vipApplied?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  deliveredAt?: unknown;
}

export interface Review {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  orderId: string;
  text: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Purchase {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  totalAmount: number;
  comment?: string;
  date?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  totalAmount: number;
  comment?: string;
  date?: unknown;
  sourceType?: "manual" | "order";
  sourceId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface VipTier {
  orders: number;
  spent: number;
  discount: number;
  label: string;
}

export interface SettingsConfig {
  vipRules: {
    vip1: VipTier;
    vip2: VipTier;
    vip3: VipTier;
  };
  deliveryServices: DeliveryService[];
  orderForm: {
    fields: OrderFormField[];
  };
  media: {
    heroImageUrl: string;
    guideImageUrl: string;
  };
}

export interface DeliveryService {
  id: string;
  label: string;
  active: boolean;
  sortOrder: number;
}

export interface OrderFormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "time" | "datetime-local";
  required: boolean;
  placeholder?: string;
}

const productSchema = z.object({
  name: safeString.default("Без названия"),
  description: safeString,
  price: safeNumber,
  imageUrl: safeString,
  inStock: safeBoolean,
  discountPercent: safeNumber,
  features: z.array(safeString).default([]),
  active: safeBoolean.default(true),
  costPrice: safeNumber.optional(),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
}).passthrough();

const userSchema = z.object({
  uid: safeString,
  email: safeString,
  name: safeString,
  phone: safeString,
  phoneE164: safeString.optional(),
  telegram: safeString,
  isAdmin: safeBoolean,
  isBanned: safeBoolean,
  banReason: safeString.optional(),
  purchasesCount: safeNumber,
  totalSpent: safeNumber,
  loyaltyLevel: safeNumber,
  loyaltyDiscount: safeNumber,
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
}).passthrough();

const orderItemSchema = z.object({
  productId: safeString,
  name: safeString,
  price: safeNumber,
  discountPercent: safeNumber,
  quantity: safeNumber,
  subtotal: safeNumber,
}).passthrough();

const orderSchema = z.object({
  userId: safeString,
  userEmail: safeString,
  status: z.enum(["new", "processing", "delivered", "cancelled"]).default("new"),
  items: z.array(orderItemSchema).default([]),
  subtotal: safeNumber,
  vipDiscount: safeNumber,
  totalPrice: safeNumber,
  deliveryMethod: z.enum(["pickup", "delivery"]).default("pickup"),
  deliveryService: safeString.optional(),
  name: safeString,
  phone: safeString,
  phoneE164: safeString.optional(),
  telegram: safeString.optional(),
  city: safeString.optional(),
  customFields: z.record(z.string(), safeString).optional(),
  reviewId: safeString.optional(),
  vipApplied: safeBoolean.optional(),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
  deliveredAt: z.unknown().optional(),
}).passthrough();

const reviewSchema = z.object({
  userId: safeString,
  userEmail: safeString,
  userName: safeString.optional(),
  orderId: safeString,
  text: safeString,
  rating: safeNumber,
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
}).passthrough();

const purchaseSchema = z.object({
  productId: safeString,
  productName: safeString,
  qty: safeNumber,
  totalAmount: safeNumber,
  comment: safeString.optional(),
  date: z.unknown().optional(),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
}).passthrough();

const saleSchema = z.object({
  productId: safeString,
  productName: safeString,
  qty: safeNumber,
  totalAmount: safeNumber,
  comment: safeString.optional(),
  date: z.unknown().optional(),
  sourceType: z.enum(["manual", "order"]).optional(),
  sourceId: safeString.optional(),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
}).passthrough();

const vipTierSchema = z.object({
  orders: safeNumber,
  spent: safeNumber,
  discount: safeNumber,
  label: safeString,
});

const orderFormFieldSchema = z.object({
  id: nonEmptyString,
  label: nonEmptyString,
  type: z.enum(["text", "textarea", "number", "date", "time", "datetime-local"]).default("text"),
  required: safeBoolean,
  placeholder: safeString.optional(),
});

const deliveryServiceSchema = z.object({
  id: nonEmptyString,
  label: nonEmptyString,
  active: safeBoolean,
  sortOrder: safeNumber,
});

const defaultSettings: SettingsConfig = {
  vipRules: {
    vip1: { orders: 3, spent: 0, discount: 5, label: "Постоянный клиент" },
    vip2: { orders: 10, spent: 150000, discount: 7, label: "VIP партнер" },
    vip3: { orders: 25, spent: 350000, discount: 10, label: "Элита" },
  },
  deliveryServices: [
    { id: "cdek", label: "СДЭК", active: true, sortOrder: 1 },
    { id: "ozon", label: "Ozon", active: true, sortOrder: 2 },
    { id: "post", label: "Почта России", active: true, sortOrder: 3 },
  ],
  orderForm: {
    fields: [
      { id: "comment", label: "Комментарий", type: "text", required: false, placeholder: "Особые пожелания" },
    ],
  },
  media: {
    heroImageUrl: "/images/fallback-hero.svg",
    guideImageUrl: "/images/fallback-product.svg",
  },
};

const settingsSchema = z.object({
  vipRules: z.object({
    vip1: vipTierSchema,
    vip2: vipTierSchema,
    vip3: vipTierSchema,
  }).default(defaultSettings.vipRules),
  deliveryServices: z.array(deliveryServiceSchema).default(defaultSettings.deliveryServices),
  orderForm: z.object({
    fields: z.array(orderFormFieldSchema).default(defaultSettings.orderForm.fields),
  }).default(defaultSettings.orderForm),
  media: z.object({
    heroImageUrl: safeString,
    guideImageUrl: safeString,
  }).default(defaultSettings.media),
}).strip();

const BLOCKED_MEDIA_HOSTS = new Set([
  "images.unsplash.com",
]);

const DEFAULT_PRODUCT_IMAGE = "/images/fallback-product.svg";

function sanitizeMediaUrl(value: string, fallback: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    if (BLOCKED_MEDIA_HOSTS.has(host)) return fallback;
    return trimmed;
  } catch {
    return fallback;
  }
}

function sanitizeProductImageUrl(value: string) {
  return sanitizeMediaUrl(value, DEFAULT_PRODUCT_IMAGE);
}

export function normalizeProduct(id: string, data: unknown): Product {
  const parsed = productSchema.safeParse(data);
  const value = parsed.success ? parsed.data : productSchema.parse({});
  return {
    id,
    ...value,
    imageUrl: sanitizeProductImageUrl(value.imageUrl),
  };
}

export function normalizeUser(data: unknown, fallback: Partial<UserProfile> = {}): UserProfile {
  const raw = (data && typeof data === "object" ? (data as Record<string, unknown>) : {});
  const purchasesCount =
    typeof raw.purchasesCount === "number"
      ? raw.purchasesCount
      : typeof raw.totalOrders === "number"
      ? raw.totalOrders
      : 0;
  const parsed = userSchema.safeParse({
    purchasesCount,
    ...raw,
    ...fallback,
  });
  const value = parsed.success ? parsed.data : userSchema.parse(fallback);
  return {
    ...value,
    purchasesCount: value.purchasesCount ?? 0,
  };
}

function normalizeOrderStatus(value: string): OrderStatus {
  const normalized = value.trim().toLowerCase();
  if (["выдан", "получен", "доставлен"].includes(normalized)) return "delivered";
  if (["выполняется", "в работе"].includes(normalized)) return "processing";
  if (["отправлен"].includes(normalized)) return "processing";
  if (["на рассмотрении", "принят", "новый"].includes(normalized)) return "new";
  if (["отменен", "отменён"].includes(normalized)) return "cancelled";
  if (normalized === "shipped") return "processing";
  return value as OrderStatus;
}

export function normalizeOrder(id: string, data: unknown): Order {
  const raw = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const status = typeof raw.status === "string" ? normalizeOrderStatus(raw.status) : raw.status;
  const parsed = orderSchema.safeParse({ ...raw, status });
  const value = parsed.success ? parsed.data : orderSchema.parse({});
  return { id, ...value };
}

export function normalizeReview(id: string, data: unknown): Review {
  const parsed = reviewSchema.safeParse(data);
  const value = parsed.success ? parsed.data : reviewSchema.parse({});
  return { id, ...value };
}

export function normalizePurchase(id: string, data: unknown): Purchase {
  const parsed = purchaseSchema.safeParse(data);
  const value = parsed.success ? parsed.data : purchaseSchema.parse({});
  return { id, ...value };
}

export function normalizeSale(id: string, data: unknown): Sale {
  const parsed = saleSchema.safeParse(data);
  const value = parsed.success ? parsed.data : saleSchema.parse({});
  return { id, ...value };
}

export function normalizeSettings(data: unknown): SettingsConfig {
  const parsed = settingsSchema.safeParse(data ?? {});
  const value = parsed.success ? parsed.data : settingsSchema.parse(defaultSettings);
  const fieldIds = new Set<string>();
  const fields = value.orderForm.fields.filter((field) => {
    if (!field.id || fieldIds.has(field.id)) return false;
    fieldIds.add(field.id);
    return true;
  });

  return {
    ...defaultSettings,
    ...value,
    deliveryServices: (value.deliveryServices || defaultSettings.deliveryServices)
      .map((service) => ({
        ...service,
        active: Boolean(service.active),
        sortOrder: Number(service.sortOrder || 0),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    orderForm: {
      ...defaultSettings.orderForm,
      ...value.orderForm,
      fields,
    },
    media: {
      ...defaultSettings.media,
      ...(value.media || {}),
      heroImageUrl: sanitizeMediaUrl(
        value.media?.heroImageUrl || defaultSettings.media.heroImageUrl,
        defaultSettings.media.heroImageUrl
      ),
      guideImageUrl: sanitizeMediaUrl(
        value.media?.guideImageUrl || defaultSettings.media.guideImageUrl,
        defaultSettings.media.guideImageUrl
      ),
    },
  };
}

export const settingsDefaults = defaultSettings;
