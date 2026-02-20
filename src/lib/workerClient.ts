export type WorkerResponse<T extends Record<string, unknown> = Record<string, unknown>> = {
  ok: boolean;
  error?: string;
} & T;

const LAST_WORKER_URL_STORAGE_KEY = "fsl_last_worker_url";
const DEFAULT_WORKER_URLS = [
  "https://freestyle-store-worker.fslibre.workers.dev",
  "https://freestyle-store-worker.scheglovvrn.workers.dev",
];

const DEPRECATED_WORKER_URLS = new Set([
  "https://freestyle-store-worker.scheglovvrn.workers.dev",
]);

function normalizeUrl(value?: string) {
  if (!value) return "";
  return value.trim().replace(/\/+$/, "");
}

function uniq(values: string[]) {
  const set = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!value || set.has(value)) continue;
    set.add(value);
    result.push(value);
  }
  return result;
}

function readLastWorkerUrl() {
  if (typeof window === "undefined") return "";
  try {
    return normalizeUrl(window.sessionStorage.getItem(LAST_WORKER_URL_STORAGE_KEY) || "");
  } catch {
    return "";
  }
}

function saveLastWorkerUrl(url: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LAST_WORKER_URL_STORAGE_KEY, url);
  } catch {
    // ignore
  }
}

export function getWorkerBaseUrls() {
  const configured = normalizeUrl(process.env.NEXT_PUBLIC_WORKER_URL);
  const fallback = normalizeUrl(process.env.NEXT_PUBLIC_WORKER_FALLBACK_URL);
  const defaults = DEFAULT_WORKER_URLS.map(normalizeUrl);
  const preferred = [configured, fallback].filter((url) => url && !DEPRECATED_WORKER_URLS.has(url));
  const deprecated = [configured, fallback].filter((url) => url && DEPRECATED_WORKER_URLS.has(url));
  const ordered = uniq([...preferred, ...defaults, ...deprecated]);
  const lastSuccessful = readLastWorkerUrl();
  if (!lastSuccessful) return ordered;
  if (!ordered.includes(lastSuccessful)) return ordered;
  return [lastSuccessful, ...ordered.filter((url) => url !== lastSuccessful)];
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function callWorker<T extends Record<string, unknown> = Record<string, unknown>>(
  path: string,
  token?: string | null,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
  body?: Record<string, unknown>,
  timeoutMs?: number
): Promise<WorkerResponse<T>> {
  const workerUrls = getWorkerBaseUrls();
  if (workerUrls.length === 0) {
    throw new Error("WORKER_URL_NOT_SET");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const effectiveTimeout = timeoutMs ?? (method === "GET" ? 7000 : 15000);
  let lastError: Error | null = null;

  for (const workerUrl of workerUrls) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetchWithTimeout(`${workerUrl}${normalizedPath}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      }, effectiveTimeout);

      const data = (await res.json().catch(() => ({}))) as WorkerResponse<T>;
      if (!res.ok) {
        throw new Error(data.error || "Worker request failed");
      }
      saveLastWorkerUrl(workerUrl);
      return data;
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      const isNetwork = error instanceof TypeError;
      if (isAbort) {
        lastError = new Error("Сервер отвечает слишком долго. Повторите еще раз.");
        continue;
      }
      if (isNetwork) {
        lastError = new Error("Сеть недоступна. Проверьте подключение или попробуйте позже.");
        continue;
      }
      if (error instanceof Error) throw error;
      throw new Error("Неизвестная ошибка запроса");
    }
  }

  throw lastError || new Error("WORKER_UNAVAILABLE");
}
