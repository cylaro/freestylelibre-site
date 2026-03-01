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
  void timeoutMs;
  const primarySrc = useMemo(() => normalizeSrc(src), [src]);
  const fallback = useMemo(() => normalizeSrc(fallbackSrc), [fallbackSrc]);
  const [resolvedSrc, setResolvedSrc] = useState(primarySrc || fallback);

  useEffect(() => {
    setResolvedSrc(primarySrc || fallback);
  }, [primarySrc, fallback]);

  const shouldLazyLoad = rest.priority ? false : rest.loading === undefined;
  const loading = shouldLazyLoad ? "lazy" : rest.loading;

  return (
    <Image
      {...rest}
      src={resolvedSrc || fallback}
      alt={alt}
      loading={loading}
      decoding={rest.decoding || "async"}
      onError={(event) => {
        rest.onError?.(event);
        if (resolvedSrc !== fallback) {
          setResolvedSrc(fallback);
        }
      }}
    />
  );
}
