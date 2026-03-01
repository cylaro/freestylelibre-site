import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freestylelibre.pro";
  const now = new Date().toISOString();

  const pages: Array<{ path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }> = [
    { path: "/", priority: 1, changeFrequency: "daily" },
    { path: "/freestyle-libre-2-ru-eu", priority: 0.9, changeFrequency: "weekly" },
    { path: "/freestyle-libre-3-plus", priority: 0.9, changeFrequency: "weekly" },
    { path: "/dostavka-i-oplata", priority: 0.85, changeFrequency: "weekly" },
    { path: "/ustanovka-freestyle-libre", priority: 0.8, changeFrequency: "monthly" },
  ];

  return pages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
