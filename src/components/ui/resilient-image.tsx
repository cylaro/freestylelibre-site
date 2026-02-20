"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useMemo, useState } from "react";

type ResilientImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackSrc: string;
  timeoutMs?: number;
};

function normalizeSrc(value: string | null | undefined) {
  if (!value) return "";
  return value.trim();
}

export function ResilientImage({
  src,
  fallbackSrc,
  timeoutMs = 1600,
  alt,
  ...rest
}: ResilientImageProps) {
  const primarySrc = useMemo(() => normalizeSrc(src), [src]);
  const fallback = useMemo(() => normalizeSrc(fallbackSrc), [fallbackSrc]);
  const [resolvedSrc, setResolvedSrc] = useState(primarySrc || fallback);

  useEffect(() => {
    const candidate = primarySrc || fallback;
    setResolvedSrc(candidate);

    if (!primarySrc || primarySrc === fallback) return;
    if (typeof window === "undefined") return;

    let active = true;
    const probe = new window.Image();
    const timer = window.setTimeout(() => {
      if (active) setResolvedSrc(fallback);
    }, Math.max(300, timeoutMs));

    probe.onload = () => {
      if (!active) return;
      window.clearTimeout(timer);
      setResolvedSrc(primarySrc);
    };
    probe.onerror = () => {
      if (!active) return;
      window.clearTimeout(timer);
      setResolvedSrc(fallback);
    };
    probe.src = primarySrc;

    return () => {
      active = false;
      window.clearTimeout(timer);
      probe.onload = null;
      probe.onerror = null;
    };
  }, [primarySrc, fallback, timeoutMs]);

  return (
    <Image
      {...rest}
      src={resolvedSrc || fallback}
      alt={alt}
      onError={() => {
        if (resolvedSrc !== fallback) {
          setResolvedSrc(fallback);
        }
      }}
    />
  );
}
