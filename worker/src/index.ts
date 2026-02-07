import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

type Bindings = {
  FIREBASE_PROJECT_ID: string;
  FIREBASE_WEB_API_KEY: string;
  FIREBASE_SERVICE_ACCOUNT: string;
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.onError((error, c) => {
  return handleError(c, error, "Ошибка сервера");
});

const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";

const orderCreateSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      quantity: z.coerce.number().int().min(1),
    })
  ).min(1),
  customerInfo: z.object({
    name: z.string().min(2),
    phone: z.string().min(5),
    telegram: z.string().optional(),
    deliveryMethod: z.enum(["pickup", "delivery"]),
    deliveryService: z.string().optional(),
    city: z.string().optional(),
    customFields: z.record(z.string(), z.string()).optional(),
  }),
  nonce: z.string().min(6),
});

const reviewCreateSchema = z.object({
  orderId: z.string().min(1),
  text: z.string().min(10),
  rating: z.coerce.number().int().min(1).max(5),
});

const claimOrderSchema = z.object({
  orderId: z.string().min(1),
  phone: z.string().optional(),
});

const orderUpdateSchema = z.object({
  orderId: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().min(1),
      quantity: z.coerce.number().int().min(1),
    })
  ).optional(),
  customerInfo: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(5).optional(),
    telegram: z.string().optional(),
    deliveryMethod: z.enum(["pickup", "delivery"]).optional(),
    deliveryService: z.string().optional(),
    city: z.string().optional(),
    comment: z.string().optional(),
  }).optional(),
});

const adminOrderUpdateSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      quantity: z.coerce.number().int().min(1),
    })
  ).optional(),
  deliveryMethod: z.enum(["pickup", "delivery"]).optional(),
  deliveryService: z.string().optional(),
  city: z.string().optional(),
  telegram: z.string().optional(),
});

const orderCancelSchema = z.object({
  orderId: z.string().min(1),
});

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(1),
  price: z.coerce.number().min(0),
  imageUrl: z.string().min(1),
  inStock: z.boolean(),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  features: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  costPrice: z.coerce.number().min(0).optional(),
});

const settingsSchema = z.object({
  vipRules: z.object({
    vip1: z.object({
      orders: z.coerce.number().min(0),
      spent: z.coerce.number().min(0),
      discount: z.coerce.number().min(0).max(100),
      label: z.string().min(1),
    }),
    vip2: z.object({
      orders: z.coerce.number().min(0),
      spent: z.coerce.number().min(0),
      discount: z.coerce.number().min(0).max(100),
      label: z.string().min(1),
    }),
    vip3: z.object({
      orders: z.coerce.number().min(0),
      spent: z.coerce.number().min(0),
      discount: z.coerce.number().min(0).max(100),
      label: z.string().min(1),
    }),
  }),
  deliveryServices: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      active: z.boolean().default(true),
      sortOrder: z.coerce.number().min(0),
    })
  ).default([]),
  orderForm: z.object({
    fields: z.array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        type: z.enum(["text", "textarea", "number", "date", "time", "datetime-local"]).default("text"),
        required: z.boolean().default(false),
        placeholder: z.string().optional(),
      })
    ).default([]),
  }),
  media: z.object({
    heroImageUrl: z.string().optional().default(""),
    guideImageUrl: z.string().optional().default(""),
  }).default({ heroImageUrl: "", guideImageUrl: "" }),
});

const reviewModerationSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  text: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  userName: z.string().optional(),
});

const purchaseSchema = z.object({
  productId: z.string().min(1),
  qty: z.coerce.number().int().min(1),
  totalAmount: z.coerce.number().min(0),
  comment: z.string().optional(),
  date: z.string().optional(),
});

const saleSchema = z.object({
  productId: z.string().min(1),
  qty: z.coerce.number().int().min(1),
  totalAmount: z.coerce.number().min(0),
  comment: z.string().optional(),
  date: z.string().optional(),
});

const userAdminSchema = z.object({
  isBanned: z.boolean().optional(),
  banReason: z.string().optional(),
  loyaltyLevel: z.coerce.number().int().min(0).max(3).optional(),
  loyaltyDiscount: z.coerce.number().min(0).max(100).optional(),
});

const defaultVipRules = {
  vip1: { orders: 3, spent: 0, discount: 5, label: "Постоянный клиент" },
  vip2: { orders: 10, spent: 150000, discount: 7, label: "VIP партнер" },
  vip3: { orders: 25, spent: 350000, discount: 10, label: "Элита" },
};

const defaultSettings = {
  vipRules: defaultVipRules,
  deliveryServices: [
    { id: "cdek", label: "СДЭК", active: true, sortOrder: 1 },
    { id: "ozon", label: "Ozon", active: true, sortOrder: 2 },
    { id: "post", label: "Почта России", active: true, sortOrder: 3 },
  ],
  orderForm: {
    fields: [{ id: "comment", label: "Комментарий", type: "text", required: false, placeholder: "Особые пожелания" }],
  },
  media: {
    heroImageUrl: "https://images.unsplash.com/photo-1631549916768-4119b295f78b?auto=format&fit=crop&q=80&w=1200",
    guideImageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=1200",
  },
};

let cachedAccessToken: { token: string; exp: number } | null = null;
const verifiedTokenCache = new Map<string, { uid: string; email: string; exp: number; cachedAt: number }>();
const VERIFIED_TOKEN_MAX_AGE_SEC = 300;

class MissingEnvError extends Error {
  envName: string;
  constructor(envName: string) {
    super(`Missing ${envName}`);
    this.envName = envName;
  }
}

class InvalidEnvError extends Error {
  envName: string;
  constructor(envName: string) {
    super(`Invalid ${envName}`);
    this.envName = envName;
  }
}

class InvalidJsonError extends Error {
  constructor(message = "INVALID_JSON") {
    super(message);
  }
}

function jsonError(message: string, status = 400) {
  return { ok: false, error: message, status };
}

function requireEnv(env: Bindings, name: keyof Bindings) {
  const value = env[name];
  if (!value || value === "undefined") {
    console.error(`Missing ${name}`);
    throw new MissingEnvError(name);
  }
  return value;
}

function parseJsonEnv<T>(env: Bindings, name: keyof Bindings): T {
  const raw = requireEnv(env, name);
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Invalid JSON in ${name}`, error);
    throw new InvalidEnvError(name);
  }
}

function parseServiceAccountEnv(env: Bindings) {
  const primary = env.FIREBASE_SERVICE_ACCOUNT;
  const fallback = env.FIREBASE_SERVICE_ACCOUNT_JSON;

  const tryParse = (raw: string, label: string) => {
    const trimmed = raw.trim().replace(/^\uFEFF/, "");
    const attemptJsonParse = (value: string) => JSON.parse(value) as { client_email: string; private_key: string };

    try {
      return attemptJsonParse(trimmed);
    } catch {
      // Continue with fallbacks below.
    }

    // Handle double-encoded JSON (stringified JSON in a string)
    try {
      const firstPass = JSON.parse(trimmed);
      if (typeof firstPass === "string") {
        return attemptJsonParse(firstPass);
      }
    } catch {
      // continue
    }

    // Try to extract JSON object if extra prefix/suffix was added.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const slice = trimmed.slice(start, end + 1);
      try {
        return attemptJsonParse(slice);
      } catch {
        // continue
      }
    }

    // Try base64 decode if it looks like base64
    const looksLikeBase64 = /^[A-Za-z0-9+/=_-]+$/.test(trimmed) && trimmed.length > 20;
    if (looksLikeBase64) {
      try {
        const b64 = trimmed.replace(/-/g, "+").replace(/_/g, "/");
        const padded = b64 + "===".slice((b64.length + 3) % 4);
        const decoded = atob(padded);
        return attemptJsonParse(decoded);
      } catch {
        // continue
      }
    }

    console.error(`Invalid JSON in ${label} (length=${raw.length})`);
    throw new InvalidEnvError("FIREBASE_SERVICE_ACCOUNT");
  };

  if (primary && primary !== "undefined") {
    try {
      return tryParse(primary, "FIREBASE_SERVICE_ACCOUNT");
    } catch (error) {
      if (!fallback || fallback === "undefined") {
        throw error;
      }
    }
  }

  if (fallback && fallback !== "undefined") {
    return tryParse(fallback, "FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  console.error("Missing FIREBASE_SERVICE_ACCOUNT");
  throw new MissingEnvError("FIREBASE_SERVICE_ACCOUNT");
}

async function parseJsonBody<T>(c: any, schema?: z.ZodSchema<T>) {
  const text = await c.req.text();
  if (!text) {
    if (schema) throw new InvalidJsonError("EMPTY_JSON");
    return {} as T;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    console.error("Invalid JSON body", error);
    throw new InvalidJsonError();
  }
  if (schema) return schema.parse(parsed);
  return parsed as T;
}

function mapError(error: unknown, fallback = "Ошибка") {
  if (error instanceof MissingEnvError) {
    return { status: 500, message: `Missing ${error.envName}` };
  }
  if (error instanceof InvalidEnvError) {
    return { status: 500, message: `Invalid ${error.envName}` };
  }
  if (error instanceof InvalidJsonError) {
    return { status: 400, message: "Неверный JSON" };
  }
  if (error instanceof z.ZodError) {
    return { status: 400, message: "Неверные данные запроса" };
  }
  if (typeof (error as any)?.message === "string") {
    const msg = (error as any).message;
    if (msg === "UNAUTHORIZED") return { status: 401, message: "Unauthorized" };
    if (msg === "INVALID_TOKEN") return { status: 401, message: "Invalid token" };
    if (msg === "FORBIDDEN") return { status: 403, message: "Forbidden" };
    if (msg === "NOT_FOUND") return { status: 404, message: "Not Found" };
  }
  return { status: 500, message: fallback };
}

function handleError(c: any, error: unknown, fallbackMessage: string) {
  const mapped = mapError(error, fallbackMessage);
  if (mapped.status >= 500) {
    console.error(error);
    return c.json(jsonError("Internal error", mapped.status), mapped.status);
  }
  return c.json(jsonError(mapped.message, mapped.status), mapped.status);
}

function base64UrlEncode(input: ArrayBuffer | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecodeToString(input: string) {
  let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) b64 += "=";
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function pemToArrayBuffer(pem: string) {
  const cleaned = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getAccessToken(env: Bindings) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.exp > now + 60) {
    return cachedAccessToken.token;
  }

  const serviceAccount = parseServiceAccountEnv(env);
  const projectId = requireEnv(env, "FIREBASE_PROJECT_ID");

  if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
    console.error("Invalid FIREBASE_SERVICE_ACCOUNT: missing client_email or private_key");
    throw new InvalidEnvError("FIREBASE_SERVICE_ACCOUNT");
  }

  if (!projectId) {
    console.error("Missing FIREBASE_PROJECT_ID");
    throw new MissingEnvError("FIREBASE_PROJECT_ID");
  }

  const serviceAccountNormalized = serviceAccount as {
    client_email: string;
    private_key: string;
  };

  const privateKey = serviceAccountNormalized.private_key.includes("\\n")
    ? serviceAccountNormalized.private_key.replace(/\\n/g, "\n")
    : serviceAccountNormalized.private_key;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccountNormalized.client_email,
    sub: serviceAccountNormalized.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: FIRESTORE_SCOPE,
  };

  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(payload)
  )}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsignedJwt));
  const jwt = `${unsignedJwt}.${base64UrlEncode(signature)}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`OAuth error: ${errorText}`);
  }

  const tokenJson = (await tokenResponse.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = { token: tokenJson.access_token, exp: now + tokenJson.expires_in };
  return tokenJson.access_token;
}

async function verifyIdToken(idToken: string) {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const json = base64UrlDecodeToString(parts[1]);
    const payload = JSON.parse(json) as { email?: string; user_id?: string; sub?: string; exp?: number };
    if (!payload?.email) return null;
    if (!payload.user_id && !payload.sub) return null;
    if (typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp <= now) return null;
    }
    return payload;
  } catch (error) {
    console.error("verifyIdToken failed:", error);
    return null;
  }
}

async function verifyIdTokenWithApiKey(env: Bindings, idToken: string) {
  const apiKey = requireEnv(env, "FIREBASE_WEB_API_KEY");
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Identity Toolkit error", text);
    throw new Error("UNAUTHORIZED");
  }
  const data = (await res.json()) as { users?: Array<{ localId: string; email?: string }> };
  const user = data.users?.[0];
  if (!user?.localId) {
    throw new Error("UNAUTHORIZED");
  }
  return { uid: user.localId, email: user.email || "" };
}

function normalizePhone(raw: string) {
  let cleaned = raw.replace(/\D/g, "");
  if (cleaned.startsWith("8")) cleaned = `7${cleaned.slice(1)}`;
  if (!cleaned.startsWith("7")) cleaned = `7${cleaned}`;
  return `+${cleaned}`;
}

function formatTelegramUsername(value?: string) {
  if (!value) return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function normalizeTelegramUsername(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function parseDateInput(value?: string, fallback = new Date()) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatOrderItemsInline(items: any[]) {
  if (!Array.isArray(items) || items.length === 0) return "—";
  return items
    .map((item) => `${item?.name || "Товар"} ×${Number(item?.quantity || 0)}`)
    .join(", ");
}

function buildDeliveryServiceMap(settings: any) {
  const list = Array.isArray(settings?.deliveryServices) && settings.deliveryServices.length > 0
    ? settings.deliveryServices
    : defaultSettings.deliveryServices;
  const map = new Map<string, string>();
  for (const service of list) {
    if (!service?.id) continue;
    const id = String(service.id).toLowerCase();
    const label = String(service.label || service.id);
    map.set(id, label);
  }
  return map;
}

function resolveDeliveryServiceLabel(map: Map<string, string>, value?: string) {
  if (!value) return "";
  const key = value.trim().toLowerCase();
  return map.get(key) || value;
}

function applyDeliveryServiceLabel(order: any, map: Map<string, string>) {
  if (!order) return order;
  const deliveryService = resolveDeliveryServiceLabel(map, order.deliveryService);
  return { ...order, deliveryService };
}

function buildOrderTelegramMessage(order: any, title: string, vipLine: string) {
  const deliveryMethod = order.deliveryMethod === "delivery" ? "Доставка" : "Самовывоз";
  const deliveryLines =
    order.deliveryMethod === "delivery"
      ? [
          "🚚 <b>Получение:</b> Доставка",
          `🏢 <b>Служба:</b> ${escapeHtml(order.deliveryService || "—")}`,
          `🏙️ <b>Город:</b> ${escapeHtml(order.city || "—")}`,
        ]
      : ["🚚 <b>Получение:</b> Самовывоз"];
  const customFields = order.customFields || {};
  const customLines = Object.entries(customFields)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => `- ${escapeHtml(key)}: ${escapeHtml(String(value))}`);
  const phoneValue = order.phoneE164 || (order.phone ? normalizePhone(order.phone) : "—");

  return [
    title,
    `👤 <b>Клиент:</b> ${escapeHtml(order.name || "—")}${order.userEmail ? ` (${escapeHtml(order.userEmail)})` : ""}`,
    `📞 <b>Тел:</b> ${escapeHtml(phoneValue)}`,
    `💬 <b>TG:</b> ${escapeHtml(formatTelegramUsername(order.telegram))}`,
    vipLine,
    ...deliveryLines,
    ...(customLines.length > 0 ? ["", "📝 <b>Доп. поля:</b>", ...customLines] : []),
    "",
    "🛒 <b>Товары:</b>",
    ...(Array.isArray(order.items)
      ? order.items.map((it: any) => `- ${escapeHtml(it.name || "Товар")} ×${Number(it.quantity || 0)} — ${Number(it.subtotal || 0)} ₽`)
      : []),
    "",
    `💰 <b>Итого:</b> ${Number(order.totalPrice || 0)} ₽`,
  ].join("\n");
}

function buildOrderChangeLines(before: any, after: any) {
  const changes: string[] = [];
  const beforeItems = Array.isArray(before.items) ? before.items : [];
  const afterItems = Array.isArray(after.items) ? after.items : [];
  if (before.name !== after.name) changes.push(`Имя: ${before.name || "—"}`);
  if (before.phone !== after.phone) changes.push(`Телефон: ${before.phoneE164 || before.phone || "—"}`);
  if ((before.telegram || "") !== (after.telegram || "")) changes.push(`TG: ${formatTelegramUsername(before.telegram)}`);
  if (before.deliveryMethod !== after.deliveryMethod) {
    changes.push(`Способ получения: ${before.deliveryMethod === "delivery" ? "Доставка" : "Самовывоз"}`);
  }
  if ((before.deliveryService || "") !== (after.deliveryService || "")) changes.push(`Служба: ${before.deliveryService || "—"}`);
  if ((before.city || "") !== (after.city || "")) changes.push(`Город: ${before.city || "—"}`);
  const beforeComment = before.customFields?.comment || "";
  const afterComment = after.customFields?.comment || "";
  if (beforeComment !== afterComment) changes.push(`Комментарий: ${beforeComment || "—"}`);
  if (formatOrderItemsInline(beforeItems) !== formatOrderItemsInline(afterItems)) {
    changes.push(`Товары: ${formatOrderItemsInline(beforeItems)}`);
  }
  if (changes.length === 0) return [];
  return ["", "<b>Было:</b>", ...changes.map((line) => `- ${escapeHtml(line)}`)];
}

function toFirestoreValue(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: value.toString() }
      : { doubleValue: value };
  }
  if (typeof value === "boolean") return { booleanValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === "object") {
    const fields: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      fields[key] = toFirestoreValue(val);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function toFirestoreFields(data: Record<string, any>) {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

function fromFirestoreValue(value: any): any {
  if (value == null) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values || []).map(fromFirestoreValue);
  }
  if (value.mapValue !== undefined) {
    const result: Record<string, any> = {};
    const fields = value.mapValue.fields || {};
    for (const [key, val] of Object.entries(fields)) {
      result[key] = fromFirestoreValue(val);
    }
    return result;
  }
  return null;
}

type FirestoreDoc = Record<string, any> & { id: string };

function fromFirestoreDoc(doc: any): FirestoreDoc {
  const fields = doc.fields || {};
  const data: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    data[key] = fromFirestoreValue(value);
  }
  const id = doc.name?.split("/").pop() || "";
  return { id, ...data };
}

function firestoreApiBase() {
  return "https://firestore.googleapis.com/v1";
}

function normalizeDocPath(docPath: string) {
  if (!docPath) return docPath;
  let normalized = docPath.trim();
  normalized = normalized.replace(/^https?:\/\/firestore\.googleapis\.com\/v1\//, "");
  if (normalized.includes("/documents/")) {
    normalized = normalized.split("/documents/")[1];
  }
  normalized = normalized.replace(/^\/+/, "");
  return normalized;
}

function firestoreResourceName(projectId: string, docPath: string) {
  const normalized = normalizeDocPath(docPath);
  return `projects/${projectId}/databases/(default)/documents/${normalized}`;
}

function firestoreDocumentUrl(projectId: string, docPath: string) {
  return `${firestoreApiBase()}/${firestoreResourceName(projectId, docPath)}`;
}

function firestoreCommitUrl(projectId: string) {
  return `${firestoreApiBase()}/projects/${projectId}/databases/(default)/documents:commit`;
}

function firestoreBatchGetUrl(projectId: string) {
  return `${firestoreApiBase()}/projects/${projectId}/databases/(default)/documents:batchGet`;
}

function firestoreRunQueryUrl(projectId: string) {
  return `${firestoreApiBase()}/projects/${projectId}/databases/(default)/documents:runQuery`;
}

async function firestoreGet(env: Bindings, docPath: string): Promise<FirestoreDoc | null> {
  const token = await getAccessToken(env);
  const res = await fetch(firestoreDocumentUrl(env.FIREBASE_PROJECT_ID, docPath), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Firestore GET error:", errorText);
    throw new Error(errorText);
  }
  const doc = await res.json();
  return fromFirestoreDoc(doc);
}

async function firestoreDeleteIfExists(env: Bindings, docPath: string) {
  const token = await getAccessToken(env);
  const res = await fetch(firestoreDocumentUrl(env.FIREBASE_PROJECT_ID, docPath), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return;
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Firestore DELETE error:", errorText);
    throw new Error(errorText);
  }
}

async function firestorePatch(env: Bindings, docPath: string, data: Record<string, any>): Promise<FirestoreDoc> {
  const token = await getAccessToken(env);
  const fields = toFirestoreFields(data);
  const updateMask = Object.keys(fields)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join("&");
  const res = await fetch(`${firestoreDocumentUrl(env.FIREBASE_PROJECT_ID, docPath)}?${updateMask}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Firestore PATCH error:", errorText);
    throw new Error(errorText);
  }
  return fromFirestoreDoc(await res.json());
}

async function firestoreDelete(env: Bindings, docPath: string) {
  const token = await getAccessToken(env);
  const res = await fetch(firestoreDocumentUrl(env.FIREBASE_PROJECT_ID, docPath), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Firestore DELETE error:", errorText);
    throw new Error(errorText);
  }
}

async function firestoreCommit(env: Bindings, writes: any[]) {
  const token = await getAccessToken(env);
  const res = await fetch(firestoreCommitUrl(env.FIREBASE_PROJECT_ID), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ writes }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Firestore COMMIT error:", data);
    const error = (data && data.error) || {};
    const message = error.message || "Commit failed";
    const status = error.status || "UNKNOWN";
    const err = new Error(message) as Error & { status?: string };
    err.status = status;
    throw err;
  }
  return data;
}

async function firestoreBatchGet(env: Bindings, docPaths: string[]): Promise<FirestoreDoc[]> {
  if (docPaths.length === 0) return [];
  const token = await getAccessToken(env);
  const res = await fetch(firestoreBatchGetUrl(env.FIREBASE_PROJECT_ID), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documents: docPaths.map((path) => firestoreResourceName(env.FIREBASE_PROJECT_ID, path)),
    }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Firestore batchGet error:", errorText);
    throw new Error(errorText);
  }
  const text = await res.text();
  const docs: any[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line);
    if (parsed.found) {
      docs.push(fromFirestoreDoc(parsed.found));
    }
  }
  return docs;
}

async function firestoreRunQuery(env: Bindings, structuredQuery: Record<string, any>): Promise<FirestoreDoc[]> {
  const token = await getAccessToken(env);
  const res = await fetch(firestoreRunQueryUrl(env.FIREBASE_PROJECT_ID), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ structuredQuery }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Firestore runQuery error:", errorText);
    throw new Error(errorText);
  }
  const data = await res.json();
  return (data || [])
    .map((row: any) => row.document)
    .filter(Boolean)
    .map(fromFirestoreDoc);
}

async function resolveProduct(env: Bindings, productId: string) {
  const product = await firestoreGet(env, `products/${productId}`);
  if (!product) return null;
  return { id: product.id, name: product.name || "Товар" };
}

function buildOrderSales(order: any, now: Date) {
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce((sum: number, item: any) => sum + Number(item?.subtotal || 0), 0);
  const total = Number(order.totalPrice || 0);
  const ratio = subtotal > 0 ? total / subtotal : 1;
  let remaining = total;
  return items.map((item: any, index: number) => {
    const base = Number(item?.subtotal || 0) * ratio;
    const amount = index === items.length - 1 ? remaining : Math.round(base);
    remaining -= amount;
    return {
      id: `order-${order.id}-${index}`,
      data: {
        productId: item?.productId || "",
        productName: item?.name || "Товар",
        qty: Number(item?.quantity || 0),
        totalAmount: amount,
        comment: "",
        date: now,
        sourceType: "order",
        sourceId: order.id,
        createdAt: now,
        updatedAt: now,
      },
    };
  });
}

async function getProductInventory(env: Bindings, productId: string) {
  if (!productId) return { purchased: 0, sold: 0, stock: 0 };
  const makeQuery = (collectionId: string) => ({
    from: [{ collectionId }],
    where: {
      fieldFilter: {
        field: { fieldPath: "productId" },
        op: "EQUAL",
        value: { stringValue: productId },
      },
    },
    select: { fields: [{ fieldPath: "qty" }] },
  });
  const [purchases, sales] = await Promise.all([
    firestoreRunQuery(env, makeQuery("purchases")),
    firestoreRunQuery(env, makeQuery("sales")),
  ]);
  const purchased = purchases.reduce((sum, doc) => sum + Number(doc.qty || 0), 0);
  const sold = sales.reduce((sum, doc) => sum + Number(doc.qty || 0), 0);
  return { purchased, sold, stock: purchased - sold };
}

function getCachedVerifiedToken(token: string, now: number) {
  const cached = verifiedTokenCache.get(token);
  if (!cached) return null;
  if (cached.exp <= now + 30) {
    verifiedTokenCache.delete(token);
    return null;
  }
  if (cached.cachedAt + VERIFIED_TOKEN_MAX_AGE_SEC <= now) {
    verifiedTokenCache.delete(token);
    return null;
  }
  return cached;
}

function setCachedVerifiedToken(token: string, entry: { uid: string; email: string; exp: number; cachedAt: number }) {
  verifiedTokenCache.set(token, entry);
  if (verifiedTokenCache.size <= 500) return;
  const now = Math.floor(Date.now() / 1000);
  for (const [key, value] of verifiedTokenCache) {
    if (value.exp <= now + 30 || value.cachedAt + VERIFIED_TOKEN_MAX_AGE_SEC <= now) {
      verifiedTokenCache.delete(key);
    }
  }
}

async function getOptionalUser(c: any) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) return null;
  if (!authHeader.startsWith("Bearer ")) {
    console.error("Missing or invalid Authorization header");
    throw new Error("UNAUTHORIZED");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    console.error("Empty Bearer token");
    throw new Error("UNAUTHORIZED");
  }
  const payload = await verifyIdToken(token);
  if (!payload) {
    console.error("Invalid token payload");
    throw new Error("INVALID_TOKEN");
  }
  const now = Math.floor(Date.now() / 1000);
  const cached = getCachedVerifiedToken(token, now);
  if (cached) {
    return { uid: cached.uid, email: cached.email || payload.email || "" };
  }
  const verified = await verifyIdTokenWithApiKey(c.env, token);
  const exp = typeof payload.exp === "number"
    ? Math.min(payload.exp, now + VERIFIED_TOKEN_MAX_AGE_SEC)
    : now + VERIFIED_TOKEN_MAX_AGE_SEC;
  setCachedVerifiedToken(token, {
    uid: verified.uid,
    email: verified.email || payload.email || "",
    exp,
    cachedAt: now,
  });
  return { uid: verified.uid, email: verified.email || payload.email || "" };
}

async function requireAuth(c: any) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.error("Missing or invalid Authorization header");
    throw new Error("UNAUTHORIZED");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    console.error("Empty Bearer token");
    throw new Error("UNAUTHORIZED");
  }
  const payload = await verifyIdToken(token);
  if (!payload) {
    console.error("Invalid token payload");
    throw new Error("INVALID_TOKEN");
  }
  const now = Math.floor(Date.now() / 1000);
  const cached = getCachedVerifiedToken(token, now);
  if (cached) {
    return { uid: cached.uid, email: cached.email || payload.email || "" };
  }
  const verified = await verifyIdTokenWithApiKey(c.env, token);
  const exp = typeof payload.exp === "number"
    ? Math.min(payload.exp, now + VERIFIED_TOKEN_MAX_AGE_SEC)
    : now + VERIFIED_TOKEN_MAX_AGE_SEC;
  setCachedVerifiedToken(token, {
    uid: verified.uid,
    email: verified.email || payload.email || "",
    exp,
    cachedAt: now,
  });
  return { uid: verified.uid, email: verified.email || payload.email || "" };
}

async function requireAdmin(c: any) {
  const user = await requireAuth(c);
  const [adminDoc, profile] = await Promise.all([
    firestoreGet(c.env, `admins/${user.uid}`),
    firestoreGet(c.env, `users/${user.uid}`),
  ]);
  if (!adminDoc && !profile?.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

function calculateVip(purchasesCount: number, totalSpent: number, rules: typeof defaultVipRules) {
  if (purchasesCount >= rules.vip3.orders || totalSpent >= rules.vip3.spent) {
    return { level: 3, discount: rules.vip3.discount };
  }
  if (purchasesCount >= rules.vip2.orders || totalSpent >= rules.vip2.spent) {
    return { level: 2, discount: rules.vip2.discount };
  }
  if (purchasesCount >= rules.vip1.orders) {
    return { level: 1, discount: rules.vip1.discount };
  }
  return { level: 0, discount: 0 };
}

async function ensureUserProfile(env: Bindings, uid: string, email: string) {
  const existing = await firestoreGet(env, `users/${uid}`);
  if (existing) return existing;
  const now = new Date();
  const data = {
    uid,
    email,
    name: "",
    phone: "",
    phoneE164: "",
    telegram: "",
    isAdmin: false,
    isBanned: false,
    purchasesCount: 0,
    totalSpent: 0,
    loyaltyLevel: 0,
    loyaltyDiscount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await firestorePatch(env, `users/${uid}`, data);
  return data;
}

async function sendTelegramNotification(env: Bindings, message: string) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return { ok: false, error: "Telegram not configured" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Telegram error:", text);
      return { ok: false, error: text || "Telegram error" };
    }
    return { ok: true };
  } catch (error: any) {
    console.error("Telegram error:", error);
    return { ok: false, error: error?.message || "Telegram error" };
  }
}

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.get("/api/admin/status", async (c) => {
  try {
    await requireAdmin(c);
    const result: {
      worker: { ok: boolean };
      firestore: { ok: boolean; error?: string };
      telegram: { configured: boolean };
    } = {
      worker: { ok: true },
      firestore: { ok: true },
      telegram: { configured: Boolean(c.env.TELEGRAM_BOT_TOKEN && c.env.TELEGRAM_CHAT_ID) },
    };

    try {
      await firestoreGet(c.env, "settings/config");
    } catch (error: any) {
      result.firestore.ok = false;
      result.firestore.error = error?.message || "Firestore error";
    }

    return c.json({ ok: true, ...result });
  } catch (error: any) {
    return handleError(c, error, "Ошибка статуса");
  }
});

app.post("/api/admin/telegram/test", async (c) => {
  try {
    await requireAdmin(c);
    if (!c.env.TELEGRAM_BOT_TOKEN || !c.env.TELEGRAM_CHAT_ID) {
      return c.json(jsonError("Telegram не настроен", 400), 400);
    }
    const message = `✅ Тестовое сообщение от FreeStyle Store (${new Date().toLocaleString("ru-RU")})`;
    const res = await sendTelegramNotification(c.env, message);
    if (!res.ok) {
      return c.json(jsonError("Ошибка отправки Telegram", 500), 500);
    }
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка Telegram");
  }
});

app.post("/api/order/create", async (c) => {
  try {
    const user = await getOptionalUser(c);
    let body: unknown;
    try {
      body = await c.req.json();
    } catch (error) {
      console.error("Invalid JSON body in /api/order/create", error);
      return c.json({ ok: false, error: "Invalid JSON body" }, 400);
    }
    const payload = orderCreateSchema.parse(body);
    const isDelivery = payload.customerInfo.deliveryMethod === "delivery";
    if (isDelivery) {
      if (!payload.customerInfo.city || !payload.customerInfo.deliveryService) {
        return c.json(jsonError("Требуются город и служба доставки"), 400);
      }
    }

    const userProfile = user
      ? await ensureUserProfile(c.env, user.uid, user.email)
      : null;
    if (userProfile?.isBanned) {
      return c.json(jsonError("Пользователь заблокирован"), 403);
    }

    const productIds = payload.items.map((item) => item.id);
    const productDocs = await Promise.all(
      productIds.map((id) => firestoreGet(c.env, `products/${id}`))
    );

    const productsMap = new Map(productDocs.filter(Boolean).map((doc: any) => [doc.id, doc]));
    const orderItems = [];
    let subtotal = 0;

    for (const item of payload.items) {
      const product = productsMap.get(item.id);
      if (!product || product.active === false) {
        return c.json(jsonError("Товар недоступен"), 400);
      }
      const unitPrice = Math.round(
        Number(product.price || 0) * (1 - Number(product.discountPercent || 0) / 100)
      );
      const lineSubtotal = unitPrice * item.quantity;
      subtotal += lineSubtotal;
      orderItems.push({
        productId: product.id,
        name: product.name || "Товар",
        price: Number(product.price || 0),
        discountPercent: Number(product.discountPercent || 0),
        quantity: item.quantity,
        subtotal: lineSubtotal,
      });
    }

    const vipDiscount = userProfile ? Number(userProfile.loyaltyDiscount || 0) : 0;
    const totalPrice = Math.round(subtotal * (1 - vipDiscount / 100));
    const now = new Date();
    const orderId = crypto.randomUUID();
    const phoneE164 = normalizePhone(payload.customerInfo.phone);
    const telegram = normalizeTelegramUsername(payload.customerInfo.telegram);
    const deliveryService = isDelivery ? (payload.customerInfo.deliveryService || "") : "";
    const city = isDelivery ? (payload.customerInfo.city || "") : "";

    const orderData = {
      userId: user?.uid || "guest",
      userEmail: user?.email || "",
      status: "new",
      requestNonce: payload.nonce,
      items: orderItems,
      subtotal,
      vipDiscount,
      totalPrice,
      deliveryMethod: payload.customerInfo.deliveryMethod,
      deliveryService,
      name: payload.customerInfo.name,
      phone: payload.customerInfo.phone,
      phoneE164,
      telegram,
      city,
      customFields: payload.customerInfo.customFields || {},
      vipApplied: false,
      createdAt: now,
      updatedAt: now,
    };

    const idempotencyPath = `orderRequests/${payload.nonce}`;
    const orderPath = `orders/${orderId}`;
    const idempotencyName = firestoreResourceName(c.env.FIREBASE_PROJECT_ID, idempotencyPath);
    const orderName = firestoreResourceName(c.env.FIREBASE_PROJECT_ID, orderPath);
    try {
      await firestoreCommit(c.env, [
        {
          update: {
            name: idempotencyName,
            fields: toFirestoreFields({
              orderId,
              userId: user?.uid || "guest",
              createdAt: now,
            }),
          },
          currentDocument: { exists: false },
        },
        {
          update: {
            name: orderName,
            fields: toFirestoreFields(orderData),
          },
          currentDocument: { exists: false },
        },
      ]);
    } catch (error: any) {
      if (error?.status === "ALREADY_EXISTS") {
        const existing = await firestoreGet(c.env, idempotencyPath);
        return c.json({ ok: true, orderId: existing?.orderId || null, idempotent: true });
      }
      throw error;
    }

    if (user) {
      await firestorePatch(c.env, `users/${user.uid}`, {
        name: payload.customerInfo.name,
        phone: payload.customerInfo.phone,
        phoneE164,
        telegram,
        updatedAt: now,
      });
    }

    const settings = (await firestoreGet(c.env, "settings/config")) || defaultSettings;
    const serviceMap = buildDeliveryServiceMap(settings);
    const deliveryServiceLabel = isDelivery ? resolveDeliveryServiceLabel(serviceMap, deliveryService) : "";
    const shortOrderId = orderId.slice(-6).toUpperCase();
    const deliveryLines = isDelivery
      ? [
        "🚚 <b>Получение:</b> Доставка",
        `🏢 <b>Служба:</b> ${escapeHtml(deliveryServiceLabel || "—")}`,
        `🏙️ <b>Город:</b> ${escapeHtml(city || "—")}`,
      ]
      : ["🚚 <b>Получение:</b> Самовывоз"];
    const customFields = payload.customerInfo.customFields || {};
    const customLines = Object.entries(customFields)
      .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
      .map(([key, value]) => `- ${escapeHtml(key)}: ${escapeHtml(value)}`);
    const vipLine = userProfile
      ? `⭐ <b>VIP:</b> ${userProfile.loyaltyLevel || 0} (-${vipDiscount}%)`
      : "⭐ <b>VIP:</b> Гость";
    const message = [
      `📦 <b>Новый заказ #${shortOrderId}</b>`,
      `👤 <b>Клиент:</b> ${escapeHtml(payload.customerInfo.name)}${user ? ` (${escapeHtml(user.email || "—")})` : ""}`,
      `📞 <b>Тел:</b> ${escapeHtml(phoneE164)}`,
      `💬 <b>TG:</b> ${escapeHtml(formatTelegramUsername(telegram))}`,
      vipLine,
      ...deliveryLines,
      ...(customLines.length > 0 ? ["", "📝 <b>Доп. поля:</b>", ...customLines] : []),
      "",
      "🛒 <b>Товары:</b>",
      ...orderItems.map((it) => `- ${escapeHtml(it.name)} ×${it.quantity} — ${it.subtotal} ₽`),
      "",
      `💰 <b>Итого:</b> ${totalPrice} ₽`,
    ].join("\n");

    try {
      await sendTelegramNotification(c.env, message);
    } catch (error) {
      console.error("Telegram notification failed (create):", error);
    }

    return c.json({ ok: true, orderId });
  } catch (error: any) {
    const message = typeof error?.message === "string" && error.message.trim()
      ? `Ошибка создания заказа: ${error.message}`
      : "Ошибка создания заказа";
    return handleError(c, error, message);
  }
});

app.post("/api/order/update", async (c) => {
  try {
    const user = await requireAuth(c);
    const payload = await parseJsonBody(c, orderUpdateSchema);
    const order = await firestoreGet(c.env, `orders/${payload.orderId}`);
    if (!order) return c.json(jsonError("Заказ не найден", 404), 404);
    if (order.userId !== user.uid) return c.json(jsonError("Доступ запрещен", 403), 403);
    if (order.status === "delivered") return c.json(jsonError("Нельзя менять выданный заказ"), 400);

    const now = new Date();
    const updates: Record<string, any> = { updatedAt: now };
    const nextOrder: any = { ...order };
    const customerInfo = payload.customerInfo || {};

    if (payload.items) {
      const productIds = payload.items.map((item) => item.id);
      const productDocs = await Promise.all(
        productIds.map((id) => firestoreGet(c.env, `products/${id}`))
      );
      const productsMap = new Map(productDocs.filter(Boolean).map((doc: any) => [doc.id, doc]));
      const orderItems: any[] = [];
      let subtotal = 0;

      for (const item of payload.items) {
        const product = productsMap.get(item.id);
        if (!product || product.active === false) {
          return c.json(jsonError("Товар недоступен"), 400);
        }
        const unitPrice = Math.round(
          Number(product.price || 0) * (1 - Number(product.discountPercent || 0) / 100)
        );
        const lineSubtotal = unitPrice * item.quantity;
        subtotal += lineSubtotal;
        orderItems.push({
          productId: product.id,
          name: product.name || "Товар",
          price: Number(product.price || 0),
          discountPercent: Number(product.discountPercent || 0),
          quantity: item.quantity,
          subtotal: lineSubtotal,
        });
      }

      const vipDiscount = Number(order.vipDiscount || 0);
      const totalPrice = Math.round(subtotal * (1 - vipDiscount / 100));
      updates.items = orderItems;
      updates.subtotal = subtotal;
      updates.totalPrice = totalPrice;
      nextOrder.items = orderItems;
      nextOrder.subtotal = subtotal;
      nextOrder.totalPrice = totalPrice;
    }

    if (customerInfo.name !== undefined) {
      updates.name = customerInfo.name;
      nextOrder.name = customerInfo.name;
    }
    if (customerInfo.phone !== undefined) {
      const phoneE164 = normalizePhone(customerInfo.phone);
      updates.phone = customerInfo.phone;
      updates.phoneE164 = phoneE164;
      nextOrder.phone = customerInfo.phone;
      nextOrder.phoneE164 = phoneE164;
    }
    if (customerInfo.telegram !== undefined) {
      const telegram = normalizeTelegramUsername(customerInfo.telegram);
      updates.telegram = telegram;
      nextOrder.telegram = telegram;
    }

    let deliveryMethod = order.deliveryMethod;
    let deliveryService = order.deliveryService || "";
    let city = order.city || "";

    if (customerInfo.deliveryMethod) {
      deliveryMethod = customerInfo.deliveryMethod;
      updates.deliveryMethod = deliveryMethod;
      nextOrder.deliveryMethod = deliveryMethod;
    }
    if (customerInfo.deliveryService !== undefined) {
      deliveryService = customerInfo.deliveryService || "";
      updates.deliveryService = deliveryService;
      nextOrder.deliveryService = deliveryService;
    }
    if (customerInfo.city !== undefined) {
      city = customerInfo.city || "";
      updates.city = city;
      nextOrder.city = city;
    }

    if (deliveryMethod === "pickup") {
      deliveryService = "";
      city = "";
      updates.deliveryService = "";
      updates.city = "";
      nextOrder.deliveryService = "";
      nextOrder.city = "";
    }

    if (deliveryMethod === "delivery") {
      if (!deliveryService || !city) {
        return c.json(jsonError("Требуются город и служба доставки"), 400);
      }
    }

    if (customerInfo.comment !== undefined) {
      const customFields = {
        ...(order.customFields && typeof order.customFields === "object" ? order.customFields : {}),
        comment: customerInfo.comment || "",
      };
      updates.customFields = customFields;
      nextOrder.customFields = customFields;
    }

    await firestorePatch(c.env, `orders/${payload.orderId}`, updates);

    if (customerInfo.name !== undefined || customerInfo.phone !== undefined || customerInfo.telegram !== undefined) {
      await firestorePatch(c.env, `users/${user.uid}`, {
        ...(customerInfo.name !== undefined ? { name: customerInfo.name } : {}),
        ...(customerInfo.phone !== undefined ? { phone: customerInfo.phone, phoneE164: nextOrder.phoneE164 } : {}),
        ...(customerInfo.telegram !== undefined ? { telegram: nextOrder.telegram || "" } : {}),
        updatedAt: now,
      });
    }

    const profile = await ensureUserProfile(c.env, user.uid, user.email || "");
    const vipDiscount = Number(nextOrder.vipDiscount || 0);
    const vipLine = profile
      ? `⭐ <b>VIP:</b> ${profile.loyaltyLevel || 0} (-${vipDiscount}%)`
      : "⭐ <b>VIP:</b> Гость";
    const settings = (await firestoreGet(c.env, "settings/config")) || defaultSettings;
    const serviceMap = buildDeliveryServiceMap(settings);
    const beforeForMessage = applyDeliveryServiceLabel(order, serviceMap);
    const afterForMessage = applyDeliveryServiceLabel(nextOrder, serviceMap);
    const shortOrderId = payload.orderId.slice(-6).toUpperCase();
    const message = [
      buildOrderTelegramMessage(afterForMessage, `✏️ <b>Заказ #${shortOrderId} изменен!</b>`, vipLine),
      ...buildOrderChangeLines(beforeForMessage, afterForMessage),
    ].join("\n");
    try {
      await sendTelegramNotification(c.env, message);
    } catch (error) {
      console.error("Telegram notification failed (update):", error);
    }

    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка обновления заказа");
  }
});

app.post("/api/order/cancel", async (c) => {
  try {
    const user = await requireAuth(c);
    const payload = await parseJsonBody(c, orderCancelSchema);
    const order = await firestoreGet(c.env, `orders/${payload.orderId}`);
    if (!order) return c.json(jsonError("Заказ не найден", 404), 404);
    if (order.userId !== user.uid) return c.json(jsonError("Доступ запрещен", 403), 403);
    if (order.status !== "new") {
      return c.json(jsonError("Отмена доступна только для новых заказов"), 400);
    }

    const profile = await ensureUserProfile(c.env, user.uid, user.email || "");
    const vipDiscount = Number(order.vipDiscount || 0);
    const vipLine = profile
      ? `⭐ <b>VIP:</b> ${profile.loyaltyLevel || 0} (-${vipDiscount}%)`
      : "⭐ <b>VIP:</b> Гость";
    const settings = (await firestoreGet(c.env, "settings/config")) || defaultSettings;
    const serviceMap = buildDeliveryServiceMap(settings);
    const orderForMessage = applyDeliveryServiceLabel(order, serviceMap);
    const shortOrderId = payload.orderId.slice(-6).toUpperCase();
    const message = buildOrderTelegramMessage(orderForMessage, `❌ <b>Заказ #${shortOrderId} отменен!</b>`, vipLine);
    try {
      await sendTelegramNotification(c.env, message);
    } catch (error) {
      console.error("Telegram notification failed (cancel):", error);
    }

    if (order.requestNonce) {
      await firestoreDeleteIfExists(c.env, `orderRequests/${order.requestNonce}`);
    }
    await firestoreDelete(c.env, `orders/${payload.orderId}`);
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка отмены заказа");
  }
});

app.post("/api/order/claim", async (c) => {
  try {
    const user = await requireAuth(c);
    const payload = await parseJsonBody(c, claimOrderSchema);
    const order = await firestoreGet(c.env, `orders/${payload.orderId}`);
    if (!order) return c.json(jsonError("Заказ не найден", 404), 404);
    if (order.userId && order.userId !== "guest" && order.userId !== user.uid) {
      return c.json(jsonError("Заказ уже привязан", 400), 400);
    }
    if (order.userId === user.uid) {
      return c.json({ ok: true });
    }

    const now = new Date();
    const updates: Record<string, any> = {
      userId: user.uid,
      userEmail: user.email || "",
      updatedAt: now,
    };

    if (order.status === "delivered" && !order.vipApplied) {
      const settings = (await firestoreGet(c.env, "settings/config")) || defaultSettings;
      const vipRules = settings.vipRules || defaultVipRules;
      const profile = await ensureUserProfile(c.env, user.uid, user.email || "");
      const nextCount = Number(profile.purchasesCount || 0) + 1;
      const nextSpent = Number(profile.totalSpent || 0) + Number(order.totalPrice || 0);
      const vip = calculateVip(nextCount, nextSpent, vipRules);

      await firestorePatch(c.env, `users/${user.uid}`, {
        purchasesCount: nextCount,
        totalSpent: nextSpent,
        loyaltyLevel: vip.level,
        loyaltyDiscount: vip.discount,
        updatedAt: now,
      });

      updates.vipApplied = true;
    }

    await firestorePatch(c.env, `orders/${payload.orderId}`, updates);
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка привязки заказа");
  }
});

app.post("/api/review/create", async (c) => {
  try {
    const user = await requireAuth(c);
    const payload = await parseJsonBody(c, reviewCreateSchema);
    const order = await firestoreGet(c.env, `orders/${payload.orderId}`);
    if (!order || order.userId !== user.uid) {
      return c.json(jsonError("Заказ не найден"), 404);
    }
    if (order.status !== "delivered") {
      return c.json(jsonError("Отзыв доступен только после получения заказа"), 400);
    }
    if (order.reviewId) {
      return c.json(jsonError("Отзыв уже оставлен"), 400);
    }

    const profile = await firestoreGet(c.env, `users/${user.uid}`);
    const userName = (profile?.name || order.name || "").trim();

    const now = new Date();
    const reviewId = crypto.randomUUID();
    const reviewData = {
      userId: user.uid,
      userEmail: user.email,
      userName,
      orderId: payload.orderId,
      text: payload.text,
      rating: payload.rating,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await firestoreCommit(c.env, [
      {
        update: {
          name: firestoreResourceName(c.env.FIREBASE_PROJECT_ID, `reviews/${reviewId}`),
          fields: toFirestoreFields(reviewData),
        },
        currentDocument: { exists: false },
      },
      {
        update: {
          name: firestoreResourceName(c.env.FIREBASE_PROJECT_ID, `orders/${payload.orderId}`),
          fields: toFirestoreFields({ reviewId, updatedAt: now }),
        },
      },
    ]);

    return c.json({ ok: true, reviewId });
  } catch (error: any) {
    return handleError(c, error, "Ошибка создания отзыва");
  }
});

app.post("/api/admin/seed", async (c) => {
  try {
    await requireAdmin(c);
    const now = new Date();
    const products = [
      {
        id: "libre-2-ru",
        name: "FreeStyle Libre 2 (RU)",
        description: "Официальная российская версия. 14 дней работы, сигналы тревоги.",
        price: 4990,
        imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800",
        inStock: true,
        discountPercent: 0,
        features: ["14 дней", "RU версия", "Сигналы тревоги"],
        active: true,
        sortOrder: 1,
      },
      {
        id: "libre-2-eu",
        name: "FreeStyle Libre 2 (EU)",
        description: "Европейская версия. Требует настройки (xDrip+ / патч).",
        price: 4490,
        imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800",
        inStock: true,
        discountPercent: 5,
        features: ["14 дней", "EU версия", "Выгодная цена"],
        active: true,
        sortOrder: 2,
      },
      {
        id: "libre-3-plus",
        name: "FreeStyle Libre 3 Plus",
        description: "Новинка. Самый маленький сенсор, 15 дней работы, Bluetooth-трансляция.",
        price: 6490,
        imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800",
        inStock: true,
        discountPercent: 0,
        features: ["15 дней", "Bluetooth 24/7", "Ультра-компактный"],
        active: true,
        sortOrder: 3,
      },
    ];

    for (const product of products) {
      await firestorePatch(c.env, `products/${product.id}`, {
        ...product,
        updatedAt: now,
        createdAt: now,
      });
    }

    const existingSettings = await firestoreGet(c.env, "settings/config");
    const { googleSheets: _ignored, ...existingSafe } = (existingSettings as any) || {};
    const settingsBase = existingSettings
      ? {
          ...defaultSettings,
          ...existingSafe,
          vipRules: { ...defaultVipRules, ...(existingSafe as any).vipRules },
          deliveryServices: (existingSafe as any).deliveryServices || defaultSettings.deliveryServices,
          orderForm: { ...defaultSettings.orderForm, ...(existingSafe as any).orderForm },
          media: { ...defaultSettings.media, ...(existingSafe as any).media },
        }
      : defaultSettings;

    const settingsWrite: any = {
      update: {
        name: firestoreResourceName(c.env.FIREBASE_PROJECT_ID, "settings/config"),
        fields: toFirestoreFields({
          ...settingsBase,
          updatedAt: now,
          createdAt: existingSettings?.createdAt || now,
        }),
      },
    };
    if (!existingSettings) {
      settingsWrite.currentDocument = { exists: false };
    }
    await firestoreCommit(c.env, [settingsWrite]);

    const reviewSeeds = [
      {
        id: "seed-review-1",
        userId: "seed",
        userEmail: "",
        orderId: "seed-order-1",
        rating: 5,
        text: "Быстро доставили, сенсор оригинальный. Всё работает без проблем.",
        status: "approved",
      },
      {
        id: "seed-review-2",
        userId: "seed",
        userEmail: "",
        orderId: "seed-order-2",
        rating: 4,
        text: "Хорошая поддержка, помогли с настройкой приложения.",
        status: "approved",
      },
      {
        id: "seed-review-3",
        userId: "seed",
        userEmail: "",
        orderId: "seed-order-3",
        rating: 5,
        text: "Лучшие цены и быстрая консультация. Рекомендую!",
        status: "approved",
      },
    ];

    for (const review of reviewSeeds) {
      await firestorePatch(c.env, `reviews/${review.id}`, {
        ...review,
        createdAt: now,
        updatedAt: now,
      });
    }

    return c.json({
      ok: true,
      seeded: true,
      products: products.map((p) => p.id),
      reviews: reviewSeeds.map((r) => r.id),
    });
  } catch (error: any) {
    return handleError(c, error, "Ошибка инициализации");
  }
});

app.post("/api/admin/products", async (c) => {
  try {
    await requireAdmin(c);
    const payload = await parseJsonBody(c, productSchema);
    const now = new Date();
    const productId = crypto.randomUUID();
    await firestoreCommit(c.env, [
      {
        update: {
          name: firestoreResourceName(c.env.FIREBASE_PROJECT_ID, `products/${productId}`),
          fields: toFirestoreFields({
            ...payload,
            createdAt: now,
            updatedAt: now,
          }),
        },
        currentDocument: { exists: false },
      },
    ]);
    return c.json({ ok: true, productId });
  } catch (error: any) {
    return handleError(c, error, "Ошибка создания товара");
  }
});

app.put("/api/admin/products/:id", async (c) => {
  try {
    await requireAdmin(c);
    const productId = c.req.param("id");
    const payload = await parseJsonBody(c, productSchema.partial());
    await firestorePatch(c.env, `products/${productId}`, {
      ...payload,
      updatedAt: new Date(),
    });
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка обновления товара");
  }
});

app.delete("/api/admin/products/:id", async (c) => {
  try {
    await requireAdmin(c);
    const productId = c.req.param("id");
    await firestoreDelete(c.env, `products/${productId}`);
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка удаления товара");
  }
});

app.post("/api/admin/orders/:id/status", async (c) => {
  try {
    await requireAdmin(c);
    const orderId = c.req.param("id");
    const body = await parseJsonBody<Record<string, unknown>>(c);
    const status = z.enum(["new", "processing", "delivered", "cancelled"]).parse(body.status);

    const order = await firestoreGet(c.env, `orders/${orderId}`);
    if (!order) return c.json(jsonError("Заказ не найден", 404), 404);

    const now = new Date();
    if (status === "cancelled") {
      const canUpdateUser = Boolean(order.userId && order.userId !== "guest");
      if (order.status === "delivered") {
        if (canUpdateUser && order.vipApplied) {
          const settings = (await firestoreGet(c.env, "settings/config")) || defaultSettings;
          const vipRules = settings.vipRules || defaultVipRules;
          const userProfile = await ensureUserProfile(c.env, order.userId, order.userEmail || "");
          const nextCount = Math.max(0, Number(userProfile.purchasesCount || 0) - 1);
          const nextSpent = Math.max(0, Number(userProfile.totalSpent || 0) - Number(order.totalPrice || 0));
          const vip = calculateVip(nextCount, nextSpent, vipRules);

          await firestorePatch(c.env, `users/${order.userId}`, {
            purchasesCount: nextCount,
            totalSpent: nextSpent,
            loyaltyLevel: vip.level,
            loyaltyDiscount: vip.discount,
            updatedAt: now,
          });
        }
      }

      const entries = buildOrderSales({ ...order, id: orderId }, now);
      await Promise.all(entries.map((entry) => firestoreDeleteIfExists(c.env, `sales/${entry.id}`)));
      if (order.reviewId) {
        await firestoreDeleteIfExists(c.env, `reviews/${order.reviewId}`);
      }
      await firestoreDelete(c.env, `orders/${orderId}`);
      return c.json({ ok: true, deleted: true });
    }

    const wasDelivered = order.status === "delivered";
    const isDelivered = status === "delivered";
    let updates: Record<string, any> = { status, updatedAt: now };
    const canUpdateUser = Boolean(order.userId && order.userId !== "guest");

    if (!wasDelivered && isDelivered) {
      const requiredByProduct = new Map<string, { qty: number; name: string }>();
      for (const item of Array.isArray(order.items) ? order.items : []) {
        const productId = item?.productId;
        if (!productId) continue;
        const entry = requiredByProduct.get(productId) || { qty: 0, name: item?.name || "Товар" };
        entry.qty += Number(item?.quantity || 0);
        requiredByProduct.set(productId, entry);
      }
      if (requiredByProduct.size > 0) {
        const checks = await Promise.all(
          [...requiredByProduct.entries()].map(async ([productId, info]) => {
            const { stock } = await getProductInventory(c.env, productId);
            return { productId, info, stock };
          })
        );
        const shortage = checks.find((entry) => entry.info.qty > entry.stock);
        if (shortage) {
          return c.json(
            jsonError(
              `Недостаточно остатка для выдачи заказа: ${shortage.info.name}. Доступно ${Math.max(0, shortage.stock)} шт.`,
              400
            ),
            400
          );
        }
      }

      if (canUpdateUser && !order.vipApplied) {
        const settings = (await firestoreGet(c.env, "settings/config")) || defaultSettings;
        const vipRules = settings.vipRules || defaultVipRules;
        const userProfile = await ensureUserProfile(c.env, order.userId, order.userEmail || "");
        const nextCount = Number(userProfile.purchasesCount || 0) + 1;
        const nextSpent = Number(userProfile.totalSpent || 0) + Number(order.totalPrice || 0);
        const vip = calculateVip(nextCount, nextSpent, vipRules);

        await firestorePatch(c.env, `users/${order.userId}`, {
          purchasesCount: nextCount,
          totalSpent: nextSpent,
          loyaltyLevel: vip.level,
          loyaltyDiscount: vip.discount,
          updatedAt: now,
        });

        updates = { ...updates, vipApplied: true };
      }

      updates = { ...updates, deliveredAt: now };

      const salesWrites = buildOrderSales({ ...order, id: orderId }, now).map((entry) => ({
        update: {
          name: firestoreResourceName(c.env.FIREBASE_PROJECT_ID, `sales/${entry.id}`),
          fields: toFirestoreFields(entry.data),
        },
        currentDocument: { exists: false },
      }));
      if (salesWrites.length > 0) {
        await firestoreCommit(c.env, salesWrites);
      }
    }

    if (wasDelivered && !isDelivered) {
      if (canUpdateUser && order.vipApplied) {
        const settings = (await firestoreGet(c.env, "settings/config")) || defaultSettings;
        const vipRules = settings.vipRules || defaultVipRules;
        const userProfile = await ensureUserProfile(c.env, order.userId, order.userEmail || "");
        const nextCount = Math.max(0, Number(userProfile.purchasesCount || 0) - 1);
        const nextSpent = Math.max(0, Number(userProfile.totalSpent || 0) - Number(order.totalPrice || 0));
        const vip = calculateVip(nextCount, nextSpent, vipRules);

        await firestorePatch(c.env, `users/${order.userId}`, {
          purchasesCount: nextCount,
          totalSpent: nextSpent,
          loyaltyLevel: vip.level,
          loyaltyDiscount: vip.discount,
          updatedAt: now,
        });

        updates = { ...updates, vipApplied: false };
      }

      updates = { ...updates, deliveredAt: null };

      const entries = buildOrderSales({ ...order, id: orderId }, now);
      await Promise.all(entries.map((entry) => firestoreDeleteIfExists(c.env, `sales/${entry.id}`)));
    }

    await firestorePatch(c.env, `orders/${orderId}`, updates);
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка обновления статуса");
  }
});

app.post("/api/admin/orders/:id/update", async (c) => {
  try {
    await requireAdmin(c);
    const orderId = c.req.param("id");
    const payload = await parseJsonBody(c, adminOrderUpdateSchema);
    const order = await firestoreGet(c.env, `orders/${orderId}`);
    if (!order) return c.json(jsonError("Заказ не найден", 404), 404);
    if (order.status === "delivered") return c.json(jsonError("Нельзя менять выданный заказ"), 400);

    const now = new Date();
    const updates: Record<string, any> = { updatedAt: now };
    const nextOrder: any = { ...order };

    if (payload.items) {
      const productIds = payload.items.map((item) => item.id);
      const productDocs = await Promise.all(
        productIds.map((id) => firestoreGet(c.env, `products/${id}`))
      );
      const productsMap = new Map(productDocs.filter(Boolean).map((doc: any) => [doc.id, doc]));
      const orderItems: any[] = [];
      let subtotal = 0;

      for (const item of payload.items) {
        const product = productsMap.get(item.id);
        if (!product || product.active === false) {
          return c.json(jsonError("Товар недоступен"), 400);
        }
        const unitPrice = Math.round(
          Number(product.price || 0) * (1 - Number(product.discountPercent || 0) / 100)
        );
        const lineSubtotal = unitPrice * item.quantity;
        subtotal += lineSubtotal;
        orderItems.push({
          productId: product.id,
          name: product.name || "Товар",
          price: Number(product.price || 0),
          discountPercent: Number(product.discountPercent || 0),
          quantity: item.quantity,
          subtotal: lineSubtotal,
        });
      }

      const vipDiscount = Number(order.vipDiscount || 0);
      const totalPrice = Math.round(subtotal * (1 - vipDiscount / 100));
      updates.items = orderItems;
      updates.subtotal = subtotal;
      updates.totalPrice = totalPrice;
      nextOrder.items = orderItems;
      nextOrder.subtotal = subtotal;
      nextOrder.totalPrice = totalPrice;
    }

    if (payload.telegram !== undefined) {
      const telegram = normalizeTelegramUsername(payload.telegram);
      updates.telegram = telegram;
      nextOrder.telegram = telegram;
    }

    let deliveryMethod = order.deliveryMethod;
    let deliveryService = order.deliveryService || "";
    let city = order.city || "";

    if (payload.deliveryMethod) {
      deliveryMethod = payload.deliveryMethod;
      updates.deliveryMethod = deliveryMethod;
      nextOrder.deliveryMethod = deliveryMethod;
    }
    if (payload.deliveryService !== undefined) {
      deliveryService = payload.deliveryService || "";
      updates.deliveryService = deliveryService;
      nextOrder.deliveryService = deliveryService;
    }
    if (payload.city !== undefined) {
      city = payload.city || "";
      updates.city = city;
      nextOrder.city = city;
    }

    if (deliveryMethod === "pickup") {
      deliveryService = "";
      city = "";
      updates.deliveryService = "";
      updates.city = "";
      nextOrder.deliveryService = "";
      nextOrder.city = "";
    }

    if (deliveryMethod === "delivery") {
      if (!deliveryService || !city) {
        return c.json(jsonError("Требуются город и служба доставки"), 400);
      }
    }

    await firestorePatch(c.env, `orders/${orderId}`, updates);
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка обновления заказа");
  }
});

app.post("/api/admin/reviews/:id", async (c) => {
  try {
    await requireAdmin(c);
    const reviewId = c.req.param("id");
    const payload = await parseJsonBody(c, reviewModerationSchema);
    const updateData: Record<string, any> = {
      status: payload.status,
      updatedAt: new Date(),
    };
    if (payload.text !== undefined) updateData.text = payload.text;
    if (payload.rating !== undefined) updateData.rating = payload.rating;
    if (payload.userName !== undefined) updateData.userName = payload.userName;

    await firestorePatch(c.env, `reviews/${reviewId}`, updateData);
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка модерации");
  }
});

app.post("/api/admin/users/:id", async (c) => {
  try {
    await requireAdmin(c);
    const userId = c.req.param("id");
    const payload = await parseJsonBody(c, userAdminSchema);
    const updates: Record<string, any> = {
      ...payload,
      updatedAt: new Date(),
    };
    if (payload.loyaltyLevel !== undefined && payload.loyaltyDiscount === undefined) {
      const settings = (await firestoreGet(c.env, "settings/config")) || defaultSettings;
      const vipRules = settings.vipRules || defaultVipRules;
      if (payload.loyaltyLevel === 1) updates.loyaltyDiscount = vipRules.vip1.discount;
      if (payload.loyaltyLevel === 2) updates.loyaltyDiscount = vipRules.vip2.discount;
      if (payload.loyaltyLevel === 3) updates.loyaltyDiscount = vipRules.vip3.discount;
      if (payload.loyaltyLevel === 0) updates.loyaltyDiscount = 0;
    }
    if (payload.isBanned === false) {
      updates.banReason = "";
    }
    await firestorePatch(c.env, `users/${userId}`, updates);
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка обновления клиента");
  }
});

app.post("/api/admin/settings", async (c) => {
  try {
    await requireAdmin(c);
    const payload = await parseJsonBody(c, settingsSchema);
    const now = new Date();
    const existing = await firestoreGet(c.env, "settings/config");
    const createdAt = existing?.createdAt || now;
    const write: any = {
      update: {
        name: firestoreResourceName(c.env.FIREBASE_PROJECT_ID, "settings/config"),
        fields: toFirestoreFields({
          ...payload,
          createdAt,
          updatedAt: now,
        }),
      },
    };
    if (!existing) {
      write.currentDocument = { exists: false };
    }
    await firestoreCommit(c.env, [write]);
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка сохранения настроек");
  }
});

app.post("/api/admin/purchases", async (c) => {
  try {
    await requireAdmin(c);
    const payload = await parseJsonBody(c, purchaseSchema);
    const product = await resolveProduct(c.env, payload.productId);
    if (!product) return c.json(jsonError("Товар не найден", 404), 404);

    const now = new Date();
    const date = parseDateInput(payload.date, now);
    const purchaseId = crypto.randomUUID();
    const purchaseData = {
      productId: product.id,
      productName: product.name,
      qty: payload.qty,
      totalAmount: payload.totalAmount,
      comment: payload.comment || "",
      date,
      createdAt: now,
      updatedAt: now,
    };

    await firestoreCommit(c.env, [
      {
        update: {
          name: firestoreResourceName(c.env.FIREBASE_PROJECT_ID, `purchases/${purchaseId}`),
          fields: toFirestoreFields(purchaseData),
        },
        currentDocument: { exists: false },
      },
    ]);

    return c.json({ ok: true, purchaseId });
  } catch (error: any) {
    return handleError(c, error, "Ошибка создания закупки");
  }
});

app.put("/api/admin/purchases/:id", async (c) => {
  try {
    await requireAdmin(c);
    const purchaseId = c.req.param("id");
    const payload = await parseJsonBody(c, purchaseSchema.partial());
    const existing = await firestoreGet(c.env, `purchases/${purchaseId}`);
    if (!existing) return c.json(jsonError("Закупка не найдена", 404), 404);

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (payload.productId) {
      const product = await resolveProduct(c.env, payload.productId);
      if (!product) return c.json(jsonError("Товар не найден", 404), 404);
      updates.productId = product.id;
      updates.productName = product.name;
    }
    if (payload.qty !== undefined) updates.qty = payload.qty;
    if (payload.totalAmount !== undefined) updates.totalAmount = payload.totalAmount;
    if (payload.comment !== undefined) updates.comment = payload.comment;
    if (payload.date) updates.date = parseDateInput(payload.date);

    await firestorePatch(c.env, `purchases/${purchaseId}`, updates);
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка обновления закупки");
  }
});

app.delete("/api/admin/purchases/:id", async (c) => {
  try {
    await requireAdmin(c);
    const purchaseId = c.req.param("id");
    await firestoreDelete(c.env, `purchases/${purchaseId}`);
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка удаления закупки");
  }
});

app.post("/api/admin/sales", async (c) => {
  try {
    await requireAdmin(c);
    const payload = await parseJsonBody(c, saleSchema);
    const product = await resolveProduct(c.env, payload.productId);
    if (!product) return c.json(jsonError("Товар не найден", 404), 404);

    const inventory = await getProductInventory(c.env, product.id);
    if (payload.qty > inventory.stock) {
      return c.json(
        jsonError(
          `Недостаточно остатка по товару: ${product.name}. Доступно ${Math.max(0, inventory.stock)} шт.`,
          400
        ),
        400
      );
    }

    const now = new Date();
    const date = parseDateInput(payload.date, now);
    const saleId = crypto.randomUUID();
    const saleData = {
      productId: product.id,
      productName: product.name,
      qty: payload.qty,
      totalAmount: payload.totalAmount,
      comment: payload.comment || "",
      date,
      sourceType: "manual",
      createdAt: now,
      updatedAt: now,
    };

    await firestoreCommit(c.env, [
      {
        update: {
          name: firestoreResourceName(c.env.FIREBASE_PROJECT_ID, `sales/${saleId}`),
          fields: toFirestoreFields(saleData),
        },
        currentDocument: { exists: false },
      },
    ]);

    return c.json({ ok: true, saleId });
  } catch (error: any) {
    return handleError(c, error, "Ошибка создания продажи");
  }
});

app.put("/api/admin/sales/:id", async (c) => {
  try {
    await requireAdmin(c);
    const saleId = c.req.param("id");
    const payload = await parseJsonBody(c, saleSchema.partial());
    const existing = await firestoreGet(c.env, `sales/${saleId}`);
    if (!existing) return c.json(jsonError("Продажа не найдена", 404), 404);

    const existingQty = Number(existing.qty || 0);
    const existingProductId = existing.productId || "";
    const existingProductName = existing.productName || "Товар";
    let resolvedProduct = { id: existingProductId, name: existingProductName };
    if (payload.productId) {
      const product = await resolveProduct(c.env, payload.productId);
      if (!product) return c.json(jsonError("Товар не найден", 404), 404);
      resolvedProduct = product;
    }
    const nextQty = payload.qty !== undefined ? Number(payload.qty || 0) : existingQty;
    if (nextQty > 0) {
      const inventory = await getProductInventory(c.env, resolvedProduct.id);
      const available = resolvedProduct.id === existingProductId ? inventory.stock + existingQty : inventory.stock;
      if (nextQty > available) {
        return c.json(
          jsonError(
            `Недостаточно остатка по товару: ${resolvedProduct.name}. Доступно ${Math.max(0, available)} шт.`,
            400
          ),
          400
        );
      }
    }

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (payload.productId) {
      updates.productId = resolvedProduct.id;
      updates.productName = resolvedProduct.name;
    }
    if (payload.qty !== undefined) updates.qty = payload.qty;
    if (payload.totalAmount !== undefined) updates.totalAmount = payload.totalAmount;
    if (payload.comment !== undefined) updates.comment = payload.comment;
    if (payload.date) updates.date = parseDateInput(payload.date);

    await firestorePatch(c.env, `sales/${saleId}`, updates);
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка обновления продажи");
  }
});

app.delete("/api/admin/sales/:id", async (c) => {
  try {
    await requireAdmin(c);
    const saleId = c.req.param("id");
    const existing = await firestoreGet(c.env, `sales/${saleId}`);
    if (!existing) return c.json({ ok: true });
    if (existing.sourceType === "order") return c.json(jsonError("Удаление запрещено", 403), 403);

    await firestoreDelete(c.env, `sales/${saleId}`);
    return c.json({ ok: true });
  } catch (error: any) {
    return handleError(c, error, "Ошибка удаления продажи");
  }
});

export default app;
