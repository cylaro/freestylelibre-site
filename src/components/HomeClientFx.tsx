"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useEffect } from "react";

export function HomeClientFx() {
  const { scrollYProgress } = useScroll();
  const reduceMotion = useReducedMotion();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.replace("#", "");
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [reduceMotion]);

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left"
      style={{ scaleX }}
    />
  );
}
