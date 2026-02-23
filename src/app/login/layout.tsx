import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вход | FreeStyle Store",
  description: "Авторизация в личном кабинете FreeStyle Store.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
