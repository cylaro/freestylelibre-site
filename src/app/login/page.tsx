import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Вход | FreeStyle Store",
  description: "Войдите в свой аккаунт FreeStyle Store для управления заказами и лояльностью.",
};

export default function LoginPage() {
  return (
    <AuthLayout 
      title="С возвращением" 
      subtitle="Войдите в свой аккаунт, чтобы продолжить"
    >
      <Suspense fallback={<div className="text-center text-muted-foreground">Загрузка формы...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
