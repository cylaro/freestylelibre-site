import { callApi } from "@/lib/apiClient";
import { normalizeProduct, normalizeSettings, Product, SettingsConfig, settingsDefaults } from "@/lib/schemas";

const SETTINGS_CACHE_KEY = "public_settings_cache_v1";
const PRODUCTS_CACHE_KEY = "public_products_cache_v1";
const SETTINGS_TTL_MS = 5 * 60 * 1000;
const PRODUCTS_TTL_MS = 2 * 60 * 1000;

type CacheEnvelope<T> = {
  value: T;
  expiresAt: number;
};

let settingsMemoryCache: CacheEnvelope<SettingsConfig> | null = null;
let settingsInFlight: Promise<SettingsConfig> | null = null;

let productsMemoryCache: CacheEnvelope<Product[]> | null = null;
let productsInFlight: Promise<Product[]> | null = null;

function getNow() {
  return Date.now();
}

function isFresh<T>(entry: CacheEnvelope<T> | null) {
  return Boolean(entry && entry.expiresAt > getNow());
}

function readStorageCache<T>(key: string): CacheEnvelope<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.expiresAt !== "number") return null;
    if (parsed.expiresAt <= getNow()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorageCache<T>(key: string, entry: CacheEnvelope<T>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Ignore storage quota/permissions issues.
  }
}

export async function getPublicSettingsCached(forceRefresh = false): Promise<SettingsConfig> {
  if (!forceRefresh && isFresh(settingsMemoryCache)) {
    return settingsMemoryCache!.value;
  }

  if (!forceRefresh) {
    const storageEntry = readStorageCache<SettingsConfig>(SETTINGS_CACHE_KEY);
    if (storageEntry) {
      settingsMemoryCache = storageEntry;
      return storageEntry.value;
    }
  }

  if (!forceRefresh && settingsInFlight) {
    return settingsInFlight;
  }

  settingsInFlight = (async () => {
    const response = await callApi<{ settings?: unknown }>(
      "/api/public/settings",
      undefined,
      "GET",
      undefined,
      { timeoutMs: 7000, retries: 1, quickAckOnFailure: false }
    );
    const normalized = response.settings
      ? normalizeSettings(response.settings)
      : settingsDefaults;
    const entry: CacheEnvelope<SettingsConfig> = {
      value: normalized,
      expiresAt: getNow() + SETTINGS_TTL_MS,
    };
    settingsMemoryCache = entry;
    writeStorageCache(SETTINGS_CACHE_KEY, entry);
    return normalized;
  })();

  try {
    return await settingsInFlight;
  } finally {
    settingsInFlight = null;
  }
}

export function getPublicSettingsSnapshot(): SettingsConfig | null {
  if (isFresh(settingsMemoryCache)) {
    return settingsMemoryCache!.value;
  }
  const storageEntry = readStorageCache<SettingsConfig>(SETTINGS_CACHE_KEY);
  if (storageEntry) {
    settingsMemoryCache = storageEntry;
    return storageEntry.value;
  }
  return null;
}

export async function getPublicProductsCached(forceRefresh = false): Promise<Product[]> {
  if (!forceRefresh && isFresh(productsMemoryCache)) {
    return productsMemoryCache!.value;
  }

  if (!forceRefresh) {
    const storageEntry = readStorageCache<Product[]>(PRODUCTS_CACHE_KEY);
    if (storageEntry) {
      productsMemoryCache = storageEntry;
      return storageEntry.value;
    }
  }

  if (!forceRefresh && productsInFlight) {
    return productsInFlight;
  }

  productsInFlight = (async () => {
    const response = await callApi<{ products?: unknown[] }>(
      "/api/public/products",
      undefined,
      "GET",
      undefined,
      { timeoutMs: 7000, retries: 1, quickAckOnFailure: false }
    );

    const normalized = Array.isArray(response.products)
      ? response.products.map((item, index) => normalizeProduct(String((item as { id?: string })?.id || `p-${index}`), item))
      : [];

    const entry: CacheEnvelope<Product[]> = {
      value: normalized,
      expiresAt: getNow() + PRODUCTS_TTL_MS,
    };
    productsMemoryCache = entry;
    writeStorageCache(PRODUCTS_CACHE_KEY, entry);
    return normalized;
  })();

  try {
    return await productsInFlight;
  } finally {
    productsInFlight = null;
  }
}

export function getPublicProductsSnapshot(): Product[] | null {
  if (isFresh(productsMemoryCache)) {
    return productsMemoryCache!.value;
  }
  const storageEntry = readStorageCache<Product[]>(PRODUCTS_CACHE_KEY);
  if (storageEntry) {
    productsMemoryCache = storageEntry;
    return storageEntry.value;
  }
  return null;
}
