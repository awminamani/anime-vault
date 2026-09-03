"use client";

import { useEffect, useRef } from "react";

// Fires onHit when the sentinel scrolls near the viewport.
// rootMargin prefetches ~900px early so infinite lists never gap.
export function useSentinel(onHit: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onHit);
  cb.current = onHit;

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) cb.current();
      },
      { rootMargin: "900px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);

  return ref;
}
