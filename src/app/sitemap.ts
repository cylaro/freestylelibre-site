import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freestylelibre.pro";
  const now = new Date().toISOString();
  return [
    { url: `${siteUrl}/`, lastModified: now },
  ];
}
