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
      className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 z-[70] origin-left shadow-[0_6px_14px_rgba(37,99,235,0.45)]"
      style={{ scaleX }}
    />
  );
}
