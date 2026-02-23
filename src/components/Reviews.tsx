"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { collection, onSnapshot, orderBy, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeReview, Review } from "@/lib/schemas";
import { Star } from "lucide-react";

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const q = query(
      collection(db, "reviews"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(6)
    );
    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(doc => normalizeReview(doc.id, doc.data())));
    });
    return () => unsub();
  }, []);

  return (
    <motion.section
      id="reviews"
      className="section-shell"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container">
        <div className="section-head">
          <span className="section-kicker">Отзывы</span>
          <h2 className="section-title">Что говорят клиенты</h2>
          <p className="section-lead">Коротко и по делу: скорость доставки, качество и удобство использования.</p>
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
                className="glass-panel rounded-3xl p-6 interactive-lift"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground gap-3">
                  <span className="font-bold text-foreground/85">{review.userName || "Покупатель"}</span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-background/65 border border-white/20 px-2 py-1">
                    <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                    <span className="font-bold text-foreground/80">{review.rating}/5</span>
                  </span>
                </div>
                <p className="mt-4 text-base leading-relaxed text-foreground/85">«{review.text}»</p>
                <div className="mt-5 flex text-orange-400 text-sm">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? "fill-orange-400 text-orange-400" : "text-orange-400/25"}`}
                    />
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
