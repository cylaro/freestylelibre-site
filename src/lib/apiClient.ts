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
  quickAckOnFailure?: boolean;
  backgroundRetry?: boolean;
};

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MUTATION_TIMEOUT_MS = 1800;
const DEFAULT_GET_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 350;
const MUTATION_METHODS = new Set<ApiMethod>(["POST", "PUT", "PATCH", "DELETE"]);

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

function toSoftSuccess<T extends Record<string, unknown>>(method: ApiMethod, path: string, warning: string): ApiResponse<T> {
  return {
    ok: true,
    accepted: true,
    soft: true,
    warning,
    method,
    path,
    queuedAt: new Date().toISOString(),
  } as unknown as ApiResponse<T>;
}

function retryInBackground(url: string, init: RequestInit) {
  void fetch(url, init).catch(() => {
    // Silent fallback: optimistic client flow keeps UX responsive.
  });
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

  const isMutation = MUTATION_METHODS.has(method);
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Math.max(800, Number(options.timeoutMs))
    : isMutation
      ? DEFAULT_MUTATION_TIMEOUT_MS
      : DEFAULT_TIMEOUT_MS;
  const retryDelayMs = Number.isFinite(options.retryDelayMs)
    ? Math.max(0, Number(options.retryDelayMs))
    : DEFAULT_RETRY_DELAY_MS;
  const retries = Number.isFinite(options.retries)
    ? Math.max(0, Number(options.retries))
    : method === "GET"
      ? DEFAULT_GET_RETRIES
      : 0;
  const retryOnTimeout = options.retryOnTimeout ?? true;
  const quickAckOnFailure = options.quickAckOnFailure ?? isMutation;
  const backgroundRetry = options.backgroundRetry ?? isMutation;
  const maxAttempts = retries + 1;
  const url = `${baseUrl}${path}`;
  const requestInit: RequestInit = {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let res: Response;
    try {
      res = await fetchWithTimeout(url, requestInit, timeoutMs);
    } catch (error) {
      const isAbort = (error as Error)?.name === "AbortError";
      const canRetry = attempt < maxAttempts && method === "GET" && (!isAbort || retryOnTimeout);
      if (canRetry) {
        await sleep(retryDelayMs * attempt);
        continue;
      }
      if (quickAckOnFailure) {
        if (backgroundRetry) {
          retryInBackground(url, requestInit);
        }
        return toSoftSuccess<T>(method, path, isAbort ? "TIMEOUT_SOFT_ACK" : "NETWORK_SOFT_ACK");
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

    if (quickAckOnFailure) {
      if (backgroundRetry && res.status >= 500) {
        retryInBackground(url, requestInit);
      }
      return {
        ...toSoftSuccess<T>(method, path, `HTTP_${res.status}_SOFT_ACK`),
        ...(typeof data.error === "string" && data.error ? { upstreamError: data.error } : {}),
      };
    }

    throw new Error(data.error || "API request failed");
  }

  if (quickAckOnFailure) {
    if (backgroundRetry) {
      retryInBackground(url, requestInit);
    }
    return toSoftSuccess<T>(method, path, "UNKNOWN_SOFT_ACK");
  }

  throw new Error("API request failed");
}
