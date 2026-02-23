import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Личный кабинет | FreeStyle Store",
  description: "История заказов, VIP-статус и управление профилем FreeStyle Store.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
