import type { User } from "firebase/auth";

const TOKEN_STORAGE_KEY = "fsl_cached_id_token";

type CachedToken = {
  token: string;
  exp: number;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  try {
    const payload = JSON.parse(atob(padded));
    return payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function readCachedToken(): CachedToken | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedToken>;
    if (!parsed?.token || typeof parsed.exp !== "number") return null;
    return { token: parsed.token, exp: parsed.exp };
  } catch {
    return null;
  }
}

function saveCachedToken(token: string) {
  if (typeof window === "undefined") return;
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp || 0);
  if (!exp) return;
  try {
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ token, exp }));
  } catch {
    // Ignore storage errors (private mode / quota).
  }
}

function isTokenActive(token: string, nowSec = Math.floor(Date.now() / 1000)) {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp || 0);
  return exp > nowSec + 30;
}

export async function getAuthToken(user: User) {
  try {
    const token = await user.getIdToken();
    if (isTokenActive(token)) {
      saveCachedToken(token);
      return token;
    }
  } catch {
    // Fallback handled below.
  }

  const memoryToken = (user as unknown as { stsTokenManager?: { accessToken?: string } })
    ?.stsTokenManager
    ?.accessToken;
  if (memoryToken && isTokenActive(memoryToken)) {
    saveCachedToken(memoryToken);
    return memoryToken;
  }

  const cached = readCachedToken();
  if (cached?.token && cached.exp > Math.floor(Date.now() / 1000) + 30) {
    return cached.token;
  }

  throw new Error("Не удалось получить токен авторизации");
}
