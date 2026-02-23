import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация | FreeStyle Store",
  description: "Создание аккаунта в FreeStyle Store.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
