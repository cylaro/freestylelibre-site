import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freestyle-libre-shop.github.io";
const ogImage = process.env.NEXT_PUBLIC_OG_IMAGE || "https://images.unsplash.com/photo-1631549916768-4119b295f78b?auto=format&fit=crop&q=80&w=1200";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FreeStyle Libre — сенсоры мониторинга глюкозы",
    template: "%s | FreeStyle Store",
  },
  description: "Купить сенсоры FreeStyle Libre 2 RU/EU и 3 Plus. Мониторинг глюкозы 24/7 без проколов.",
  keywords: [
    "FreeStyle Libre",
    "сенсоры глюкозы",
    "мониторинг глюкозы",
    "FreeStyle Libre 2",
    "FreeStyle Libre 3 Plus",
    "купить сенсор",
    "CGM",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FreeStyle Libre — сенсоры мониторинга глюкозы",
    description: "Сенсоры FreeStyle Libre 2 RU/EU и 3 Plus. Контроль сахара 24/7 без проколов.",
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "FreeStyle Libre — сенсоры мониторинга глюкозы",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FreeStyle Libre — сенсоры мониторинга глюкозы",
    description: "Сенсоры FreeStyle Libre 2 RU/EU и 3 Plus. Контроль сахара 24/7 без проколов.",
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
