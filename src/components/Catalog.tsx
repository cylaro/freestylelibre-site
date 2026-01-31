"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { motion } from "framer-motion";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  discountPercent: number;
  features: string[];
}

export function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    });

    return () => unsubscribe();
  }, []);

  // Default products if none in Firestore yet
  const displayProducts = products.length > 0 ? products : [
    {
      id: "libre-2-ru",
      name: "FreeStyle Libre 2 (RU)",
      description: "Официальная российская версия. 14 дней работы, сигналы тревоги.",
      price: 4990,
      imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400",
      inStock: true,
      discountPercent: 0,
      features: ["14 дней", "Сигналы тревоги", "LibreLink RU"]
    },
    {
      id: "libre-2-eu",
      name: "FreeStyle Libre 2 (EU)",
      description: "Европейская версия. Требует настройки (xDrip+ / патч).",
      price: 4490,
      imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400",
      inStock: true,
      discountPercent: 5,
      features: ["14 дней", "EU версия", "Выгодная цена"]
    },
    {
      id: "libre-3-plus",
      name: "FreeStyle Libre 3 Plus",
      description: "Новинка 2026. Самый маленький, 15 дней работы, Bluetooth-трансляция.",
      price: 6490,
      imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400",
      inStock: true,
      discountPercent: 0,
      features: ["15 дней", "Bluetooth 24/7", "Ультра-компактный"]
    }
  ];

  return (
    <section id="catalog" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Наш Каталог</h2>
          <p className="text-muted-foreground">Выберите подходящую модель для вашего комфорта</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProducts.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full overflow-hidden border-none shadow-lg glass">
                <div className="aspect-square relative overflow-hidden group">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {product.discountPercent > 0 && (
                    <Badge className="absolute top-4 right-4 bg-orange-500">
                      -{product.discountPercent}%
                    </Badge>
                  )}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-[2px]">
                      <Badge variant="secondary" className="text-lg px-4 py-1">Нет в наличии</Badge>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {product.features.map((f, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">
                      {product.discountPercent > 0 
                        ? Math.round(product.price * (1 - product.discountPercent / 100)) 
                        : product.price} ₽
                    </span>
                    {product.discountPercent > 0 && (
                      <span className="text-muted-foreground line-through text-sm">
                        {product.price} ₽
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    disabled={!product.inStock}
                    onClick={() => addItem({ ...product, quantity: 1 })}
                  >
                    В корзину
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
