"use client";

import React, { useEffect, useRef, useState } from "react";
import { normalizeProduct, Product } from "@/lib/schemas";
import { callWorker } from "@/lib/workerClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { ResilientImage } from "@/components/ui/resilient-image";

export function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const { addItem } = useCart();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;

    const loadViaWorker = async () => {
      try {
        const result = await callWorker<{ products?: unknown[] }>("/api/public/products", undefined, "GET");
        if (!mounted || !Array.isArray(result.products)) return;
        setProducts(result.products.map((item, index) => normalizeProduct(String((item as { id?: string })?.id || `p-${index}`), item)));
        setLoading(false);
        setError(null);
      } catch (error) {
        if (!mounted) return;
        setLoading(false);
        setError(error instanceof Error ? error.message : "Не удалось загрузить каталог");
      }
    };

    loadViaWorker();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleAdd = (product: Product) => {
    addItem(product, 1);
    setAddedId(product.id);
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setAddedId(current => current === product.id ? null : current);
    }, 900);
  };

  return (
    <motion.section
      id="catalog"
      className="py-24"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Наш Каталог</h2>
          <p className="text-muted-foreground">Выберите подходящую модель для вашего комфорта</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[420px] rounded-2xl border border-white/10 bg-background/50 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500/90 py-12">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            Каталог пуст. Выполните инициализацию товаров в админ-панели.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <motion.div
                key={product.id}
                whileHover={reduceMotion ? undefined : { y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full overflow-hidden border border-white/10 shadow-lg bg-background/60 backdrop-blur-xl">
                  <div className="aspect-square relative overflow-hidden group bg-muted/20">
                    {product.imageUrl ? (
                      <ResilientImage
                        src={product.imageUrl}
                        fallbackSrc="/images/fallback-product.svg"
                        alt={product.name}
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        timeoutMs={1600}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        Изображение недоступно
                      </div>
                    )}
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
                    {product.features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {product.features.map((f, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
                        ))}
                      </div>
                    )}
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
                    <motion.div
                      className="w-full"
                      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                      whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                    >
                      <Button 
                        className="w-full"
                        disabled={!product.inStock}
                        onClick={() => handleAdd(product)}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {addedId === product.id ? (
                            <motion.span
                              key="added"
                              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                              className="inline-flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Добавлено
                            </motion.span>
                          ) : (
                            <motion.span
                              key="add"
                              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                            >
                              В корзину
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
