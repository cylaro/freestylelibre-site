export type ApiResponse<T extends Record<string, unknown> = Record<string, unknown>> = {
  ok: boolean;
  error?: string;
} & T;

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

export function getApiBaseUrls() {
  const base = normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  const fallback = normalizeUrl(process.env.NEXT_PUBLIC_API_FALLBACK_URL);
  return uniq([base, fallback]);
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

export async function callApi<T extends Record<string, unknown> = Record<string, unknown>>(
  path: string,
  token?: string | null,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
  body?: Record<string, unknown>,
  timeoutMs = 5000
): Promise<ApiResponse<T>> {
  const apiUrls = getApiBaseUrls();
  if (apiUrls.length === 0) {
    throw new Error("API_URL_NOT_SET");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let lastError: unknown = null;

  for (const apiUrl of apiUrls) {
    try {
      const headers: Record<string, string> = {};
      if (body) headers["Content-Type"] = "application/json";
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetchWithTimeout(
        `${apiUrl}${normalizedPath}`,
        {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        },
        timeoutMs
      );

      const data = (await res.json().catch(() => ({}))) as ApiResponse<T>;
      if (!res.ok) {
        throw new Error(data.error || "API request failed");
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
  throw new Error("API_UNAVAILABLE");
}
