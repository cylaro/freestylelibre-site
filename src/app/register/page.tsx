import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация | FreeStyle Store",
  description: "Создайте аккаунт FreeStyle Store, чтобы начать копить скидки и отслеживать заказы.",
};

export default function RegisterPage() {
  return (
    <AuthLayout 
      title="Создать аккаунт" 
      subtitle="Присоединяйтесь к нашей системе лояльности"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
