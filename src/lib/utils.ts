import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(
  value: unknown,
  locale: string = "ru-RU",
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
) {
  if (!value) return "";
  if (value instanceof Date) return value.toLocaleDateString(locale, options);
  if (typeof value === "number") return new Date(value).toLocaleDateString(locale, options);
  if (typeof value === "string") return new Date(value).toLocaleDateString(locale, options);
  if (typeof value === "object") {
    const anyValue = value as { toDate?: () => Date; seconds?: number };
    if (typeof anyValue.toDate === "function") {
      return anyValue.toDate().toLocaleDateString(locale, options);
    }
    if (typeof anyValue.seconds === "number") {
      return new Date(anyValue.seconds * 1000).toLocaleDateString(locale, options);
    }
  }
  return "";
}
