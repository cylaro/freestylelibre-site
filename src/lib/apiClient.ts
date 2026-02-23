export type ApiResponse<T extends Record<string, unknown> = Record<string, unknown>> = {
  ok: boolean;
  error?: string;
} & T;

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiCallOptions = {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  retryOnTimeout?: boolean;
};

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_GET_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 350;

function normalizeUrl(value?: string) {
  if (!value) return "";
  return value.trim().replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  const configured = normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (!configured) {
    throw new Error("API_BASE_URL_NOT_SET");
  }
  return configured;
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callApi<T extends Record<string, unknown> = Record<string, unknown>>(
  path: string,
  token?: string | null,
  method: ApiMethod = "POST",
  body?: Record<string, unknown>,
  options: ApiCallOptions = {}
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};
  const hasBody = body !== undefined;
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(1000, Number(options.timeoutMs)) : DEFAULT_TIMEOUT_MS;
  const retryDelayMs = Number.isFinite(options.retryDelayMs)
    ? Math.max(0, Number(options.retryDelayMs))
    : DEFAULT_RETRY_DELAY_MS;
  const retries = Number.isFinite(options.retries)
    ? Math.max(0, Number(options.retries))
    : method === "GET"
      ? DEFAULT_GET_RETRIES
      : 0;
  const retryOnTimeout = options.retryOnTimeout ?? true;
  const maxAttempts = retries + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let res: Response;
    try {
      res = await fetchWithTimeout(
        `${baseUrl}${path}`,
        {
          method,
          headers,
          body: hasBody ? JSON.stringify(body) : undefined,
        },
        timeoutMs
      );
    } catch (error) {
      const isAbort = (error as Error)?.name === "AbortError";
      const canRetry = attempt < maxAttempts && method === "GET" && (!isAbort || retryOnTimeout);
      if (canRetry) {
        await sleep(retryDelayMs * attempt);
        continue;
      }
      throw new Error(isAbort ? "API request timeout" : "API network error");
    }

    const data = (await res.json().catch(() => ({}))) as ApiResponse<T>;
    if (res.ok) {
      return data;
    }

    const canRetry = attempt < maxAttempts && method === "GET" && res.status >= 500;
    if (canRetry) {
      await sleep(retryDelayMs * attempt);
      continue;
    }

    throw new Error(data.error || "API request failed");
  }

  throw new Error("API request failed");
}
