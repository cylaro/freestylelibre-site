"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const registerSchema = z.object({
  name: z.string().min(2, "Имя слишком короткое"),
  email: z.string().email("Некорректный email"),
  phone: z.string().min(10, "Некорректный номер телефона"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: data.email,
        name: data.name,
        phone: data.phone,
        telegram: "",
        isAdmin: false,
        isBanned: false,
        totalOrders: 0,
        totalSpent: 0,
        loyaltyLevel: 0,
        loyaltyDiscount: 0,
        createdAt: Timestamp.now()
      });

      toast.success("Регистрация успешна!");
      router.push("/account");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("Этот email уже используется");
      } else {
        toast.error("Ошибка при регистрации");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Имя</Label>
        <Input
          id="name"
          placeholder="Иван Иванов"
          {...register("name")}
          className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {errors.name && (
          <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="example@mail.com"
          {...register("email")}
          className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {errors.email && (
          <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Телефон</Label>
        <Input
          id="phone"
          placeholder="+7 (999) 000-00-00"
          {...register("phone")}
          className={errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {errors.phone && (
          <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••"
            {...register("password")}
            className={errors.password ? "pr-10 border-destructive focus-visible:ring-destructive" : "pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••"
          {...register("confirmPassword")}
          className={errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Зарегистрироваться
      </Button>

      <div className="text-center text-sm text-muted-foreground mt-4">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Войти
        </Link>
      </div>
    </form>
  );
}
