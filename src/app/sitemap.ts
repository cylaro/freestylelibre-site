import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freestyle-libre-shop.github.io";
  const now = new Date().toISOString();
  return [
    { url: `${siteUrl}/`, lastModified: now },
    { url: `${siteUrl}/login`, lastModified: now },
    { url: `${siteUrl}/register`, lastModified: now },
    { url: `${siteUrl}/account`, lastModified: now },
    { url: `${siteUrl}/admin`, lastModified: now },
  ];
}
