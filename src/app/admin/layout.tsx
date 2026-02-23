import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Админ-панель | FreeStyle Store",
  description: "Управление товарами, заказами, финансами и настройками FreeStyle Store.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
