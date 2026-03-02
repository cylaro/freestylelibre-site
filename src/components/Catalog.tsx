"use client";

import React, { useEffect, useRef, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeProduct, Product } from "@/lib/schemas";
import { getPublicProductsCached, getPublicProductsSnapshot } from "@/lib/publicData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, PackageCheck } from "lucide-react";
import { ResilientImage } from "@/components/ui/resilient-image";

export function Catalog() {
  const [products, setProducts] = useState<Product[]>(() => getPublicProductsSnapshot() || []);
  const [loading, setLoading] = useState(() => products.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const { addItem } = useCart();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      try {
        const cachedProducts = await getPublicProductsCached();
        if (!active) return;
        setProducts(cachedProducts);
        setLoading(false);
        setError(null);
        return;
      } catch {
        // Firestore fallback below remains as resilience path.
      }

      try {
        const q = query(collection(db, "products"), where("active", "==", true), orderBy("sortOrder", "asc"));
        const snapshot = await getDocs(q);
        if (!active) return;
        setProducts(snapshot.docs.map((docSnap) => normalizeProduct(docSnap.id, docSnap.data())));
        setLoading(false);
        setError(null);
      } catch (err: unknown) {
        if (!active) return;
        const firebaseErr = err as { code?: string };
        const message = firebaseErr?.code === "failed-precondition"
          ? "Для запроса нужен индекс Firestore. Создайте индекс и обновите страницу."
          : "Не удалось загрузить каталог. Проверьте правила Firestore и подключение.";
        setError(message);
        setLoading(false);
      }
    };

    loadProducts();

    return () => {
      active = false;
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
      className="section-shell"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container">
        <div className="section-head">
          <span className="section-kicker">Каталог</span>
          <h2 className="section-title">Выберите ваш сенсор</h2>
          <p className="section-lead">Все модели здесь подходят для контроля глюкозы в течение дня без проколов пальца.</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[420px] rounded-3xl glass-panel animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500/90 py-12">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            Каталог пуст. Выполните инициализацию товаров в админ-панели.
          </div>
        ) : (
          <div className="balanced-grid md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <motion.div
                key={product.id}
                whileHover={reduceMotion ? undefined : { y: -8 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <Card className="h-full overflow-hidden rounded-3xl glass-panel flex flex-col">
                  <div className="aspect-square relative overflow-hidden group bg-muted/20">
                    {product.imageUrl ? (
                      <ResilientImage
                        src={product.imageUrl}
                        fallbackSrc="/images/fallback-product.svg"
                        alt={product.name}
                        fill
                        optimizeWidth={960}
                        optimizeQuality={74}
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        timeoutMs={1600}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        Изображение недоступно
                      </div>
                    )}
                    {product.inStock && (
                      <div className="absolute top-4 left-4 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] inline-flex items-center gap-1.5">
                        <PackageCheck className="w-3.5 h-3.5" />
                        В наличии
                      </div>
                    )}
                    {product.discountPercent > 0 && (
                      <Badge className="absolute top-4 right-4 bg-orange-500 rounded-xl px-2.5">
                        -{product.discountPercent}%
                      </Badge>
                    )}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-[2px]">
                        <Badge variant="secondary" className="text-lg px-4 py-1">Нет в наличии</Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    {product.features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2 min-h-7">
                        {product.features.slice(0, 3).map((f, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] rounded-lg">{f}</Badge>
                        ))}
                      </div>
                    )}
                    <CardTitle className="text-xl font-black leading-tight">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.8rem] mb-4 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="flex items-end gap-3 mt-auto">
                      <span className="text-2xl font-black text-primary">
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
