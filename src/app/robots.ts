import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freestylelibre.pro";
  let host = "freestylelibre.pro";
  try {
    host = new URL(siteUrl).host;
  } catch {
    host = "freestylelibre.pro";
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/account", "/account/*", "/login", "/register"],
      },
    ],
    host,
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
