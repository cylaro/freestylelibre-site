import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { normalizeReview, Review } from "@/lib/schemas";
import { callWorker } from "@/lib/workerClient";

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await callWorker<{ reviews?: unknown[] }>("/api/public/reviews", undefined, "GET");
        if (!mounted) return;
        const list = Array.isArray(response.reviews)
          ? response.reviews.map((item, index) => normalizeReview(String((item as { id?: string })?.id || `r-${index}`), item))
          : [];
        setReviews(list);
      } catch {
        if (mounted) setReviews([]);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <motion.section
      id="reviews"
      className="py-24"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Отзывы покупателей</h2>
        </div>
        {reviews.length === 0 ? (
          <div className="text-center text-muted-foreground">Отзывов пока нет.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="rounded-2xl border border-white/10 bg-background/60 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{review.userName || "Покупатель"}</span>
                </div>
                <p className="mt-4 text-base leading-relaxed text-foreground/80">«{review.text}»</p>
                <div className="mt-5 flex text-orange-400 text-sm">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < review.rating ? "opacity-100" : "opacity-20"}>★</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
