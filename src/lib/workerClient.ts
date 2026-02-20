export type WorkerResponse<T extends Record<string, unknown> = Record<string, unknown>> = {
  ok: boolean;
  error?: string;
} & T;

const DEFAULT_WORKER_URLS = [
  "https://freestyle-store-worker.fslibre.workers.dev",
  "https://freestyle-store-worker.scheglovvrn.workers.dev",
];

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

export function getWorkerBaseUrls() {
  const configured = normalizeUrl(process.env.NEXT_PUBLIC_WORKER_URL);
  const fallback = normalizeUrl(process.env.NEXT_PUBLIC_WORKER_FALLBACK_URL);
  return uniq([configured, fallback, ...DEFAULT_WORKER_URLS.map(normalizeUrl)]);
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
  timeoutMs = 12000
): Promise<WorkerResponse<T>> {
  const workerUrls = getWorkerBaseUrls();
  if (workerUrls.length === 0) {
    throw new Error("WORKER_URL_NOT_SET");
  }

  let lastError: unknown = null;

  for (const workerUrl of workerUrls) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetchWithTimeout(`${workerUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      }, timeoutMs);

      const data = (await res.json().catch(() => ({}))) as WorkerResponse<T>;
      if (!res.ok) {
        throw new Error(data.error || "Worker request failed");
      }
      return data;
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      const isNetwork = error instanceof TypeError;
      if (!isAbort && !isNetwork) throw error;
      lastError = error;
    }
  }

  if (lastError instanceof Error && lastError.message) {
    throw lastError;
  }
  throw new Error("WORKER_UNAVAILABLE");
}
