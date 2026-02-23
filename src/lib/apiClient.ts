export type ApiResponse<T extends Record<string, unknown> = Record<string, unknown>> = {
  ok: boolean;
  error?: string;
} & T;

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

export async function callApi<T extends Record<string, unknown> = Record<string, unknown>>(
  path: string,
  token?: string | null,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
  body?: Record<string, unknown>,
  timeoutMs = 7000
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithTimeout(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }, timeoutMs);

  const data = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok) {
    throw new Error(data.error || "API request failed");
  }
  return data;
}
