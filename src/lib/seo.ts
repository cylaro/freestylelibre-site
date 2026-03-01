import type { Metadata } from "next";

export const SEO_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://freestylelibre.pro";
export const SEO_SITE_NAME = "FreeStyle Store";

type SeoMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
};

export function buildSeoMetadata(options: SeoMetadataOptions): Metadata {
  const canonicalUrl = `${SEO_SITE_URL}${options.path}`;
  const ogImage = "/images/og-default.svg";

  return {
    title: options.title,
    description: options.description,
    keywords: options.keywords,
    alternates: {
      canonical: options.path,
    },
    openGraph: {
      type: "article",
      locale: "ru_RU",
      siteName: SEO_SITE_NAME,
      url: canonicalUrl,
      title: options.title,
      description: options.description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: options.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [ogImage],
    },
  };
}
