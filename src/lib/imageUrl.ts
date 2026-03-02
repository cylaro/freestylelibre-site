type ImageOptimizeOptions = {
  width?: number;
  quality?: number;
};

function toSafeNumber(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(64, Math.round(value));
}

export function optimizeImageUrl(src: string | null | undefined, options: ImageOptimizeOptions = {}) {
  if (!src) return "";
  const normalized = src.trim();
  if (!normalized) return "";
  if (!/^https?:\/\//i.test(normalized)) return normalized;

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return normalized;
  }

  const width = toSafeNumber(options.width, 1200);
  const quality = toSafeNumber(options.quality, 76);
  const host = url.hostname.toLowerCase();

  if (host.includes("images.unsplash.com")) {
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(Math.min(quality, 82)));
    return url.toString();
  }

  return normalized;
}
